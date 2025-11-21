"""
Batch Analytics Runner - Processes health metrics without streaming
This script runs analytics processing on existing data without using Spark Streaming,
avoiding the Windows winutils.exe requirement.
"""

import os
import sys
from datetime import datetime, timedelta
from dotenv import load_dotenv
from pyspark.sql import SparkSession

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Set up Hadoop environment for Windows
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
HADOOP_HOME = os.path.join(SCRIPT_DIR, 'hadoop')
os.makedirs(os.path.join(HADOOP_HOME, 'bin'), exist_ok=True)

os.environ['HADOOP_HOME'] = HADOOP_HOME
os.environ['hadoop.home.dir'] = HADOOP_HOME
os.environ['HADOOP_USER_NAME'] = 'spark'

# Suppress warnings
import warnings
warnings.filterwarnings('ignore')

# Load environment variables
load_dotenv()

MONGO_URI = os.getenv('MONGO_URI')
MONGO_DB_NAME = os.getenv('MONGO_DB_NAME', 'health_metrics')
SPARK_APP_NAME = os.getenv('SPARK_APP_NAME', 'HealthMetricsAnalyticsBatch')

print("="*60)
print("🚀 BATCH ANALYTICS PROCESSING")
print("="*60)
print(f"📅 Run Time: {datetime.now().isoformat()}")
print(f"📊 Database: {MONGO_DB_NAME}")
print()

# Create Spark session
print("🔧 Initializing Spark...")
spark = SparkSession.builder \
    .appName(SPARK_APP_NAME) \
    .master("local[*]") \
    .config("spark.mongodb.read.connection.uri", MONGO_URI) \
    .config("spark.mongodb.write.connection.uri", MONGO_URI) \
    .config("spark.jars.packages", "org.mongodb.spark:mongo-spark-connector_2.12:10.3.0") \
    .config("spark.hadoop.fs.permissions.umask-mode", "000") \
    .config("spark.local.dir", os.path.join(os.getcwd(), "spark-local")) \
    .getOrCreate()

spark.sparkContext.setLogLevel("ERROR")
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

# Process analytics directly
print("🔄 Processing analytics...")

# Import processing functions (streaming code won't execute due to if __name__ guard)
sys.path.insert(0, SCRIPT_DIR)

# Import only the processing function, not the entire module that starts streaming
from pyspark.sql.functions import (
    col, max as spark_max, avg, stddev, count, datediff, lag, lead,
    when, row_number, sum as spark_sum, lit, unix_timestamp, from_unixtime,
    percentile_approx, abs as spark_abs, explode, array, struct, to_date
)
from pyspark.sql import Window

print("✅ Imported Spark functions, now processing health metrics...")

# Process the health metrics using the logic from main.py
# We'll implement the core analytics here to avoid importing the streaming module

if analytics_df and analytics_df.count() > 0:
    analytics_count = analytics_df.count()
    print(f"\n✅ Generated {analytics_count} analytics records")
    
    # Display sample results
    print("\n" + "="*60)
    print("📊 SAMPLE ANALYTICS RESULTS")
    print("="*60)
    
    # Show rolling averages
    print("\n📈 7-Day Rolling Averages (Steps):")
    analytics_df.select("userId", "date", "rolling_avg_steps") \
        .filter(analytics_df.rolling_avg_steps.isNotNull()) \
        .orderBy("date", ascending=False) \
        .limit(10) \
        .show(truncate=False)
    
    # Show activity streaks
    print("\n🔥 Activity Streaks:")
    analytics_df.select("userId", "date", "activity_streak") \
        .filter(analytics_df.activity_streak > 0) \
        .orderBy("activity_streak", ascending=False) \
        .limit(10) \
        .show(truncate=False)
    
    # Show anomalies
    print("\n⚠️  Detected Anomalies:")
    anomalies = analytics_df.filter(analytics_df.is_anomaly == True)
    anomaly_count = anomalies.count()
    if anomaly_count > 0:
        anomalies.select("userId", "date", "metric_name", "value", "avg_value", "stddev_value") \
            .show(truncate=False)
    else:
        print("   No anomalies detected")
    
    # Show percentile rankings
    print("\n📊 Percentile Rankings (Steps):")
    analytics_df.select("userId", "date", "percentile_steps") \
        .filter(analytics_df.percentile_steps.isNotNull()) \
        .orderBy("percentile_steps", ascending=False) \
        .limit(10) \
        .show(truncate=False)
    
    # Show trends
    print("\n📈 Detected Trends:")
    trends = analytics_df.filter(analytics_df.trend != "stable")
    trend_count = trends.count()
    if trend_count > 0:
        trends.select("userId", "date", "metric_name", "trend", "current_avg", "prev_avg") \
            .show(truncate=False)
    else:
        print("   All metrics stable")
    
    # Save to MongoDB
    print("\n💾 Saving analytics to MongoDB...")
    save_analytics_to_mongodb(analytics_df, MONGO_URI, MONGO_DB_NAME)
    print("✅ Analytics saved successfully")
    
else:
    print("\n⚠️  No analytics generated")

print("\n" + "="*60)
print("✅ BATCH PROCESSING COMPLETED")
print("="*60)

# Stop Spark
spark.stop()
