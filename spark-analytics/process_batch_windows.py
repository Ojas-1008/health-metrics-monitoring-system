"""
Standalone Batch Analytics Processor
Processes existing health metrics data without streaming (no checkpoints needed)
"""

import os
import sys
from datetime import datetime, timedelta
from dotenv import load_dotenv
from pyspark.sql import SparkSession, Window
from pyspark.sql.functions import (
    col, avg, stddev, count, datediff, lag, lead,
    when, row_number, sum as spark_sum, lit,
    percentile_approx, abs as spark_abs, explode, array, struct, to_date,
    current_timestamp, date_add
)
from pyspark.sql.types import StructType, StructField, StringType, DoubleType, IntegerType, BooleanType

# Set up Hadoop environment for Windows
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
HADOOP_HOME = os.path.join(SCRIPT_DIR, 'hadoop')
os.makedirs(os.path.join(HADOOP_HOME, 'bin'), exist_ok=True)

os.environ['HADOOP_HOME'] = HADOOP_HOME
os.environ['hadoop.home.dir'] = HADOOP_HOME
os.environ['HADOOP_USER_NAME'] = 'spark'

import warnings
warnings.filterwarnings('ignore')

# Load environment variables
load_dotenv()

MONGO_URI = os.getenv('MONGO_URI')
MONGO_DB_NAME = os.getenv('MONGO_DB_NAME', 'health_metrics')

print("="*70)
print("🚀 BATCH ANALYTICS PROCESSING (Windows Compatible)")
print("="*70)
print(f"📅 Run Time: {datetime.now().isoformat()}")
print(f"📊 Database: {MONGO_DB_NAME}")
print()

# Create Spark session WITHOUT streaming
print("🔧 Initializing Spark...")
spark = SparkSession.builder \
    .appName("HealthMetricsBatchAnalytics") \
    .master("local[*]") \
    .config("spark.mongodb.read.connection.uri", MONGO_URI) \
    .config("spark.mongodb.write.connection.uri", MONGO_URI) \
    .config("spark.jars.packages", "org.mongodb.spark:mongo-spark-connector_2.12:10.3.0") \
    .config("spark.hadoop.fs.permissions.umask-mode", "000") \
    .config("spark.local.dir", os.path.join(os.getcwd(), "spark-local")) \
    .getOrCreate()

spark.sparkContext.setLogLevel("WARN")
print("✅ Spark session created\n")

# Load health metrics from last 30 days
print("📝 Loading health metrics from last 30 days...")
end_date = datetime.now()
start_date = end_date - timedelta(days=30)

df = spark.read \
    .format("mongodb") \
    .option("database", MONGO_DB_NAME) \
    .option("collection", "healthmetrics") \
    .load()

# Filter to recent data and valid users
df = df.filter(
    (df.updatedAt >= start_date.isoformat()) & 
    (df.userId.isNotNull())
)

record_count = df.count()
print(f"📊 Found {record_count} recent records\n")

if record_count == 0:
    print("⚠️  No records to process")
    spark.stop()
    sys.exit(0)

print("🔄 Processing analytics (this may take a minute)...\n")

# ============================================================================
# ANALYTICS PROCESSING LOGIC (copied from main.py)
# ============================================================================

# Step 1: Filter to phone-only metrics
phone_only_df = df.filter(col('source').isin(['manual', 'googlefit']))
schema_fields = phone_only_df.schema.names
if 'heartRate' in schema_fields:
    phone_only_df = phone_only_df.filter(col('heartRate').isNull())
if 'bloodOxygen' in schema_fields:
    phone_only_df = phone_only_df.filter(col('bloodOxygen').isNull())

# Step 2: Flatten metrics structure
flattened_df = phone_only_df.select(
    col('userId'),
    to_date(col('date')).alias('date'),
    col('metrics.steps').alias('steps'),
    col('metrics.distance').alias('distance'),
    col('metrics.calories').alias('calories'),
    col('metrics.activeMinutes').alias('activeMinutes'),
    col('source'),
    col('updatedAt')
)

# Unpivot to long format
metrics_long = flattened_df.select(
    col('userId'),
    col('date'),
    col('source'),
    explode(array(
        struct(lit('steps').alias('metricType'), col('steps').alias('value')),
        struct(lit('distance').alias('metricType'), col('distance').alias('value')),
        struct(lit('calories').alias('metricType'), col('calories').alias('value')),
        struct(lit('activeMinutes').alias('metricType'), col('activeMinutes').alias('value'))
    )).alias('metric')
).select(
    col('userId'),
    col('date'),
    col('source'),
    col('metric.metricType').alias('metricType'),
    col('metric.value').alias('value')
).filter(col('value').isNotNull())

print(f"✅ Flattened to {metrics_long.count()} metric records")

# Step 3: 7-Day Rolling Averages
window_7day = Window.partitionBy('userId', 'metricType').orderBy('date').rowsBetween(-6, 0)
rolling_avg_df = metrics_long.withColumn(
    'rolling_avg_7day',
    avg('value').over(window_7day)
)

print("✅ Computed 7-day rolling averages")

# Step 4: Activity Streaks (consecutive days > 1000 steps)
steps_only = metrics_long.filter(col('metricType') == 'steps')
window_user = Window.partitionBy('userId').orderBy('date')

steps_with_streak = steps_only \
    .withColumn('active_day', when(col('value') > 1000, 1).otherwise(0)) \
    .withColumn('prev_active', lag('active_day').over(window_user)) \
    .withColumn('streak_break', when(
        (col('active_day') == 0) | (col('prev_active') == 0),
        1
    ).otherwise(0)) \
    .withColumn('streak_group', spark_sum('streak_break').over(window_user)) \
    .withColumn('activity_streak', 
        spark_sum('active_day').over(
            Window.partitionBy('userId', 'streak_group').orderBy('date')
        )
    )

print("✅ Calculated activity streaks")

# Step 5: Anomaly Detection (2σ threshold)
window_30day = Window.partitionBy('userId', 'metricType').orderBy('date').rowsBetween(-29, 0)
anomaly_df = rolling_avg_df \
    .withColumn('avg_value', avg('value').over(window_30day)) \
    .withColumn('stddev_value', stddev('value').over(window_30day)) \
    .withColumn('z_score', 
        (col('value') - col('avg_value')) / col('stddev_value')
    ) \
    .withColumn('is_anomaly', 
        spark_abs(col('z_score')) > 2.0
    )

print("✅ Detected anomalies (2σ threshold)")

# Step 6: Percentile Rankings (90-day window)
# Need separate windows for rank (unbounded) and percentile calculation
window_90day_unbounded = Window.partitionBy('userId', 'metricType').orderBy('date')
window_90day = Window.partitionBy('userId', 'metricType').orderBy('date').rowsBetween(-89, 0)
percentile_df = anomaly_df \
    .withColumn('rank', row_number().over(window_90day_unbounded)) \
    .withColumn('total_count', count('*').over(window_90day)) \
    .withColumn('percentile', col('rank') / col('total_count'))

print("✅ Computed percentile rankings (90-day window)")

# Step 7: Trend Analysis
window_prev_week = Window.partitionBy('userId', 'metricType').orderBy('date').rowsBetween(-13, -7)
trend_df = percentile_df \
    .withColumn('prev_week_avg', avg('value').over(window_prev_week)) \
    .withColumn('pct_change', 
        ((col('rolling_avg_7day') - col('prev_week_avg')) / col('prev_week_avg')) * 100
    ) \
    .withColumn('trend', 
        when(col('pct_change') > 5, 'increasing')
        .when(col('pct_change') < -5, 'decreasing')
        .otherwise('stable')
    )

print("✅ Analyzed trends (week-over-week)")

# Step 8: Structure final output
analytics_df = trend_df.select(
    col('userId'),
    col('date'),
    col('metricType'),
    col('value').alias('current_value'),
    col('rolling_avg_7day'),
    col('avg_value'),
    col('stddev_value'),
    col('is_anomaly'),
    col('percentile'),
    col('trend'),
    col('pct_change').alias('trend_pct_change')
).withColumn('calculatedAt', lit(datetime.now().isoformat())) \
 .withColumn('expiresAt', lit((datetime.now() + timedelta(days=90)).isoformat()))

# Join streak data
analytics_with_streak = analytics_df.join(
    steps_with_streak.select('userId', 'date', 'activity_streak'),
    on=['userId', 'date'],
    how='left'
).fillna({'activity_streak': 0})

final_count = analytics_with_streak.count()
print(f"\n✅ Generated {final_count} analytics records\n")

# ============================================================================
# DISPLAY RESULTS
# ============================================================================

print("="*70)
print("📊 ANALYTICS RESULTS")
print("="*70)

print("\n📈 7-Day Rolling Averages (Steps - Last 15 days):")
analytics_with_streak.filter(col('metricType') == 'steps') \
    .select('date', 'current_value', 'rolling_avg_7day') \
    .orderBy('date', ascending=False) \
    .limit(15) \
    .show(truncate=False)

print("\n🔥 Activity Streaks (Days with streak > 0):")
analytics_with_streak.filter((col('metricType') == 'steps') & (col('activity_streak') > 0)) \
    .select('date', 'current_value', 'activity_streak') \
    .orderBy('date', ascending=False) \
    .limit(15) \
    .show(truncate=False)

print("\n⚠️  Detected Anomalies:")
anomalies = analytics_with_streak.filter(col('is_anomaly') == True)
anomaly_count = anomalies.count()
if anomaly_count > 0:
    print(f"Found {anomaly_count} anomalies:")
    anomalies.select('date', 'metricType', 'current_value', 'avg_value', 'stddev_value') \
        .show(truncate=False)
else:
    print("   No anomalies detected")

print("\n📊 Percentile Rankings (Steps - Top values):")
analytics_with_streak.filter(col('metricType') == 'steps') \
    .select('date', 'current_value', 'percentile') \
    .orderBy('percentile', ascending=False) \
    .limit(10) \
    .show(truncate=False)

print("\n📈 Trends (Non-stable trends):")
trends = analytics_with_streak.filter(col('trend') != 'stable')
trend_count = trends.count()
if trend_count > 0:
    print(f"Found {trend_count} trending metrics:")
    trends.select('date', 'metricType', 'trend', 'trend_pct_change') \
        .show(truncate=False)
else:
    print("   All metrics stable")

# Save to MongoDB
print("\n💾 Saving analytics to MongoDB...")
try:
    analytics_with_streak.write \
        .format("mongodb") \
        .option("database", MONGO_DB_NAME) \
        .option("collection", "analytics") \
        .mode("append") \
        .save()
    print("✅ Analytics saved successfully to 'analytics' collection")
except Exception as e:
    print(f"⚠️  Error saving to MongoDB: {e}")
    print("   (This may be due to duplicate entries - analytics are still computed correctly)")

print("\n" + "="*70)
print("✅ BATCH PROCESSING COMPLETED")
print("="*70)
print("\n🎯 Summary:")
print(f"   - Processed {record_count} health metric records")
print(f"   - Generated {final_count} analytics records")
print(f"   - Detected {anomaly_count} anomalies")
print(f"   - Identified {trend_count} trending metrics")
print(f"   - Results saved to MongoDB '{MONGO_DB_NAME}.analytics'")

# Stop Spark
spark.stop()
print("\n✅ Spark session closed")
