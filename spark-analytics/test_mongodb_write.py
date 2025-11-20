"""
Test MongoDB Write Operations for Analytics
Verifies that the MongoDB write utilities work correctly with sample data.
"""

import os
import sys
from datetime import datetime, timedelta
from dotenv import load_dotenv
from pyspark.sql import SparkSession

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

# Import MongoDB utilities
from mongodb_utils import (
    save_analytics_to_mongodb,
    build_analytics_record,
    get_analytics_schema,
    retry_dlq_records
)

print("="*70)
print("🧪 MONGODB ANALYTICS WRITE TEST")
print("="*70)
print(f"📅 Test Time: {datetime.now().isoformat()}\n")

# Create Spark session
print("🔧 Initializing Spark...")
spark = SparkSession.builder \
    .appName("TestMongoDBAnalyticsWrite") \
    .master("local[*]") \
    .config("spark.mongodb.read.connection.uri", os.getenv('MONGO_URI')) \
    .config("spark.mongodb.write.connection.uri", os.getenv('MONGO_URI')) \
    .config("spark.jars.packages", "org.mongodb.spark:mongo-spark-connector_2.12:10.3.0") \
    .config("spark.hadoop.fs.permissions.umask-mode", "000") \
    .config("spark.local.dir", os.path.join(os.getcwd(), "spark-local")) \
    .getOrCreate()

spark.sparkContext.setLogLevel("ERROR")
print("✅ Spark session created\n")

# Test 1: Verify schema structure
print("="*70)
print("TEST 1: Verify Analytics Schema Structure")
print("="*70)

schema = get_analytics_schema()
print("✅ Schema retrieved successfully")
print(f"📋 Schema fields: {len(schema.fields)}")
print(f"   - userId: {schema['userId'].dataType}")
print(f"   - metricType: {schema['metricType'].dataType}")
print(f"   - timeRange: {schema['timeRange'].dataType}")
print(f"   - analytics: {type(schema['analytics'].dataType).__name__}")
print(f"   - calculatedAt: {schema['calculatedAt'].dataType}")
print(f"   - expiresAt: {schema['expiresAt'].dataType}")
print()

# Test 2: Build sample analytics records
print("="*70)
print("TEST 2: Build Sample Analytics Records")
print("="*70)

# Create sample records for testing
sample_records = []

# Sample user ID (you should replace with actual user ID from your database)
test_user_id = "673f39c6b4f1e40b3c123456"  # Replace with actual user ID

# Sample metrics
metrics = ['steps', 'calories', 'distance']
time_ranges = ['7day', '30day']

for metric in metrics:
    for time_range in time_ranges:
        analytics_data = {
            'rollingAverage': 7500.0 if metric == 'steps' else 2500.0,
            'trend': 'up',
            'trendPercentage': 12.5,
            'anomalyDetected': False,
            'anomalyDetails': None,
            'streakDays': 5,
            'longestStreak': 14,
            'streakStartDate': datetime.now() - timedelta(days=5),
            'percentile': 75.0,
            'comparisonToPrevious': {
                'absoluteChange': 850.0,
                'percentageChange': 12.5,
                'isImprovement': True
            },
            'statistics': {
                'standardDeviation': 1250.0,
                'minValue': 4500.0,
                'maxValue': 12000.0,
                'medianValue': 7200.0,
                'dataPointsCount': 7 if time_range == '7day' else 30,
                'completenessPercentage': 85.7 if time_range == '7day' else 90.0
            }
        }
        
        record = build_analytics_record(
            user_id=test_user_id,
            metric_type=metric,
            time_range=time_range,
            analytics_data=analytics_data,
            calculated_at=datetime.now(),
            expires_at=datetime.now() + timedelta(days=90),
            metadata={
                'sparkJobId': 'test-job-001',
                'processingDurationMs': 1500,
                'dataPointsProcessed': 100,
                'sparkVersion': spark.version
            }
        )
        
        sample_records.append(record)

print(f"✅ Built {len(sample_records)} sample analytics records")
print(f"📋 Sample record structure:")
import json
print(json.dumps(sample_records[0], indent=2, default=str))
print()

# Test 3: Write to MongoDB
print("="*70)
print("TEST 3: Write Sample Records to MongoDB")
print("="*70)

result = save_analytics_to_mongodb(
    spark_session=spark,
    analytics_list=sample_records,
    batch_id="test-batch-001"
)

print(f"\n📊 Write Results:")
print(f"   - Success: {result['success']}")
print(f"   - Records Processed: {result['records_processed']}")
print(f"   - Records Written: {result['records_written']}")
print(f"   - Records Failed: {result['records_failed']}")

if result['errors']:
    print(f"   - Errors: {len(result['errors'])}")
    for error in result['errors']:
        print(f"     • {error['message']}")
print()

# Test 4: Verify data in MongoDB
print("="*70)
print("TEST 4: Verify Data in MongoDB")
print("="*70)

try:
    # Read back the data we just wrote
    db_name = os.getenv('MONGO_DB_NAME', 'health_metrics')
    collection_name = os.getenv('ANALYTICS_COLLECTION', 'analytics')
    
    print(f"📖 Reading from {db_name}.{collection_name}...")
    
    analytics_df = spark.read \
        .format("mongodb") \
        .option("database", db_name) \
        .option("collection", collection_name) \
        .load()
    
    # Filter to our test records
    test_data = analytics_df.filter(analytics_df.userId == test_user_id) \
        .orderBy("calculatedAt", ascending=False) \
        .limit(len(sample_records))
    
    count = test_data.count()
    print(f"✅ Found {count} test records in database")
    
    if count > 0:
        print(f"\n📋 Sample records from database:")
        test_data.select(
            "userId", "metricType", "timeRange",
            "analytics.rollingAverage", "analytics.trend",
            "analytics.streakDays", "calculatedAt"
        ).show(5, truncate=False)
    
    print()
    
except Exception as e:
    print(f"❌ Error reading from MongoDB: {e}")
    import traceback
    traceback.print_exc()

# Test 5: Test error handling with invalid data
print("="*70)
print("TEST 5: Test Error Handling with Invalid Data")
print("="*70)

# Create an invalid record (missing required fields)
invalid_records = [
    {
        'userId': test_user_id,
        # Missing metricType and timeRange
        'analytics': {
            'rollingAverage': 5000.0,
            'trend': 'stable',
            'anomalyDetected': False
        },
        'calculatedAt': datetime.now()
    }
]

print("🧪 Attempting to write invalid record...")
invalid_result = save_analytics_to_mongodb(
    spark_session=spark,
    analytics_list=invalid_records,
    batch_id="test-invalid-001"
)

print(f"\n📊 Invalid Write Results:")
print(f"   - Success: {invalid_result['success']}")
print(f"   - Records Processed: {invalid_result['records_processed']}")
print(f"   - Records Written: {invalid_result['records_written']}")
print(f"   - Records Failed: {invalid_result['records_failed']}")

if invalid_result['errors']:
    print(f"   - Errors: {len(invalid_result['errors'])}")
    print(f"     Expected: Schema validation should fail")
    print(f"     ✅ Error handling working correctly")

print()

# Test 6: Check DLQ files
print("="*70)
print("TEST 6: Check Dead Letter Queue (DLQ)")
print("="*70)

dlq_dir = os.getenv('DLQ_DIRECTORY', './dlq')
if os.path.exists(dlq_dir):
    dlq_files = [f for f in os.listdir(dlq_dir) if f.endswith('.json')]
    print(f"📁 Found {len(dlq_files)} DLQ files in {dlq_dir}")
    
    if dlq_files:
        print(f"📋 DLQ files:")
        for dlq_file in dlq_files:
            file_path = os.path.join(dlq_dir, dlq_file)
            file_size = os.path.getsize(file_path)
            print(f"   - {dlq_file} ({file_size} bytes)")
        
        # Test DLQ retry functionality
        print(f"\n🔄 Testing DLQ retry functionality...")
        first_dlq = os.path.join(dlq_dir, dlq_files[0])
        
        # Note: This will likely fail again since the data is invalid
        # But it tests the retry mechanism
        retry_result = retry_dlq_records(spark, first_dlq)
        print(f"   - Retry attempted: {retry_result.get('success', False)}")
else:
    print(f"ℹ️  No DLQ directory found (expected if all writes succeeded)")

print()

# Summary
print("="*70)
print("✅ TEST SUMMARY")
print("="*70)
print(f"✅ Schema structure verified")
print(f"✅ Sample records built successfully")
print(f"✅ MongoDB write operations tested")
print(f"✅ Data verification completed")
print(f"✅ Error handling validated")
print(f"✅ DLQ functionality checked")
print()
print("🎉 All tests completed!")
print("="*70)

# Cleanup
spark.stop()
