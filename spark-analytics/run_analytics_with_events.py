"""
Standalone Batch Analytics Processor with Event Emission
Processes existing health metrics data and emits real-time events to the backend.
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

# Import MongoDB utilities for analytics write operations and event emission
from mongodb_utils import (
    save_analytics_to_mongodb, 
    convert_analytics_df_to_records
)

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
print("🚀 BATCH ANALYTICS PROCESSING WITH EVENTS (Windows Compatible)")
print("="*70)
print(f"📅 Run Time: {datetime.now().isoformat()}")
print(f"📊 Database: {MONGO_DB_NAME}")
print()

# Create Spark session WITHOUT streaming
print("🔧 Initializing Spark...")
spark = SparkSession.builder \
    .appName("HealthMetricsBatchAnalyticsEvents") \
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
# ANALYTICS PROCESSING LOGIC
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
# SAVE AND EMIT EVENTS
# ============================================================================

print("\n💾 Saving analytics to MongoDB and emitting events...")

# Need to adapt the dataframe to match what convert_analytics_df_to_records expects
# The function expects columns: userId, metricType, timeRange, rollingAverage7Day, trend, anomalyDetected, streakDays, percentile, comparisonToPrevious, calculatedAt, expiresAt
# Our analytics_with_streak has slightly different names

adapted_df = analytics_with_streak.select(
    col('userId'),
    col('metricType'),
    lit('7-day').alias('timeRange'),
    col('rolling_avg_7day').alias('rollingAverage7Day'),
    col('trend'),
    col('is_anomaly').alias('anomalyDetected'),
    col('activity_streak').alias('streakDays'),
    col('percentile'),
    col('trend_pct_change').alias('comparisonToPrevious'),
    col('calculatedAt'),
    col('expiresAt')
)

try:
    # Convert to records
    analytics_list = convert_analytics_df_to_records(adapted_df)
    
    # Save and emit
    result = save_analytics_to_mongodb(
        spark_session=spark,
        analytics_list=analytics_list,
        batch_id=f"manual_run_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    )
    
    if result['success']:
        print(f"✅ Successfully processed and emitted events for {result['records_written']} records")
    else:
        print(f"⚠️  Completed with errors: {result.get('errors')}")

except Exception as e:
    print(f"❌ Error saving/emitting: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*70)
print("✅ BATCH PROCESSING COMPLETED")
print("="*70)

# Stop Spark
spark.stop()
print("\n✅ Spark session closed")
