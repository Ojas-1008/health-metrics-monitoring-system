"""
Test script to verify the upsert logic for analytics documents.

This script tests:
1. Initial insert of analytics documents
2. Update with newer timestamp (should replace)
3. Attempted update with older timestamp (should skip)
4. Multiple upserts in same batch
5. Logging of insert/update/skip operations
"""

import sys
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from pyspark.sql import SparkSession

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from mongodb_utils import save_analytics_to_mongodb, build_analytics_record

# Set Hadoop home for Windows
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
HADOOP_HOME = os.path.join(SCRIPT_DIR, 'hadoop')
os.makedirs(os.path.join(HADOOP_HOME, 'bin'), exist_ok=True)
os.environ['HADOOP_HOME'] = HADOOP_HOME
os.environ['hadoop.home.dir'] = HADOOP_HOME
os.environ['HADOOP_USER_NAME'] = 'spark'

# Load environment variables
load_dotenv()

# Verify MongoDB connection
MONGO_URI = os.getenv('MONGO_URI')
if not MONGO_URI:
    print("❌ MONGO_URI not set in environment variables")
    sys.exit(1)

print("=" * 80)
print("🧪 Testing Analytics Upsert Logic")
print("=" * 80)

# Initialize Spark Session
print("\n1️⃣ Initializing Spark Session...")
spark = SparkSession.builder \
    .appName("Test Analytics Upsert") \
    .master("local[*]") \
    .config("spark.mongodb.read.connection.uri", MONGO_URI) \
    .config("spark.mongodb.write.connection.uri", MONGO_URI) \
    .config("spark.jars.packages", "org.mongodb.spark:mongo-spark-connector_2.12:10.3.0") \
    .config("spark.hadoop.fs.permissions.umask-mode", "000") \
    .config("spark.local.dir", os.path.join(os.getcwd(), "spark-local")) \
    .getOrCreate()

print("✅ Spark Session initialized")

# Test user ID (use a test user from your database)
test_user_id = "test_upsert_user_001"
test_metric = "steps"
test_time_range = "7day"

print(f"\n2️⃣ Test Setup:")
print(f"   User ID: {test_user_id}")
print(f"   Metric: {test_metric}")
print(f"   Time Range: {test_time_range}")

# ============================================================================
# Test 1: Initial Insert
# ============================================================================
print("\n" + "=" * 80)
print("📝 Test 1: Initial Insert (New Document)")
print("=" * 80)

timestamp_1 = datetime.now() - timedelta(hours=2)

analytics_data_1 = {
    'rollingAverage': 8500.0,
    'trend': 'up',
    'trendPercentage': 15.5,
    'anomalyDetected': False,
    'streakDays': 5,
    'longestStreak': 10,
    'percentile': 75.0
}

record_1 = build_analytics_record(
    user_id=test_user_id,
    metric_type=test_metric,
    time_range=test_time_range,
    analytics_data=analytics_data_1,
    calculated_at=timestamp_1
)

result_1 = save_analytics_to_mongodb(
    spark_session=spark,
    analytics_list=[record_1],
    batch_id="test_batch_1_insert"
)

print(f"\n📊 Result 1:")
print(f"   Success: {result_1['success']}")
print(f"   Records Written: {result_1['records_written']}")
print(f"   Inserts: {result_1.get('inserts', 0)}")
print(f"   Updates: {result_1.get('updates', 0)}")
print(f"   Skipped: {result_1.get('skipped', 0)}")

assert result_1['success'], "Test 1 should succeed"
assert result_1.get('inserts', 0) == 1, "Should have 1 insert"
print("✅ Test 1 PASSED: Initial insert successful")

# ============================================================================
# Test 2: Update with Newer Timestamp (Should Replace)
# ============================================================================
print("\n" + "=" * 80)
print("🔄 Test 2: Update with Newer Timestamp (Should Replace)")
print("=" * 80)

timestamp_2 = datetime.now() - timedelta(hours=1)  # Newer than timestamp_1

analytics_data_2 = {
    'rollingAverage': 9000.0,  # Changed value
    'trend': 'up',
    'trendPercentage': 20.0,  # Changed value
    'anomalyDetected': False,
    'streakDays': 6,  # Changed value
    'longestStreak': 10,
    'percentile': 80.0  # Changed value
}

record_2 = build_analytics_record(
    user_id=test_user_id,
    metric_type=test_metric,
    time_range=test_time_range,
    analytics_data=analytics_data_2,
    calculated_at=timestamp_2
)

result_2 = save_analytics_to_mongodb(
    spark_session=spark,
    analytics_list=[record_2],
    batch_id="test_batch_2_update"
)

print(f"\n📊 Result 2:")
print(f"   Success: {result_2['success']}")
print(f"   Records Written: {result_2['records_written']}")
print(f"   Inserts: {result_2.get('inserts', 0)}")
print(f"   Updates: {result_2.get('updates', 0)}")
print(f"   Skipped: {result_2.get('skipped', 0)}")

assert result_2['success'], "Test 2 should succeed"
assert result_2.get('updates', 0) == 1, "Should have 1 update"
assert result_2.get('inserts', 0) == 0, "Should have no inserts"
print("✅ Test 2 PASSED: Update with newer timestamp successful")

# ============================================================================
# Test 3: Attempted Update with Older Timestamp (Should Skip)
# ============================================================================
print("\n" + "=" * 80)
print("⏭️  Test 3: Attempted Update with Older Timestamp (Should Skip)")
print("=" * 80)

timestamp_3 = datetime.now() - timedelta(hours=3)  # Older than both previous

analytics_data_3 = {
    'rollingAverage': 7000.0,  # Different value (but older)
    'trend': 'down',
    'trendPercentage': -10.0,
    'anomalyDetected': True,
    'streakDays': 3,
    'longestStreak': 8,
    'percentile': 60.0
}

record_3 = build_analytics_record(
    user_id=test_user_id,
    metric_type=test_metric,
    time_range=test_time_range,
    analytics_data=analytics_data_3,
    calculated_at=timestamp_3
)

result_3 = save_analytics_to_mongodb(
    spark_session=spark,
    analytics_list=[record_3],
    batch_id="test_batch_3_skip"
)

print(f"\n📊 Result 3:")
print(f"   Success: {result_3['success']}")
print(f"   Records Written: {result_3['records_written']}")
print(f"   Inserts: {result_3.get('inserts', 0)}")
print(f"   Updates: {result_3.get('updates', 0)}")
print(f"   Skipped: {result_3.get('skipped', 0)}")

assert result_3['success'], "Test 3 should succeed"
assert result_3.get('skipped', 0) == 1, "Should have 1 skipped"
assert result_3['records_written'] == 0, "Should write 0 records"
print("✅ Test 3 PASSED: Older timestamp correctly skipped")

# ============================================================================
# Test 4: Multiple Records in Same Batch (Mixed Operations)
# ============================================================================
print("\n" + "=" * 80)
print("📦 Test 4: Multiple Records in Same Batch (Mixed Operations)")
print("=" * 80)

timestamp_4 = datetime.now()

# Create multiple records for different metrics/ranges
records_batch = []

# Record 1: New metric (calories) - should INSERT
records_batch.append(build_analytics_record(
    user_id=test_user_id,
    metric_type="calories",
    time_range="7day",
    analytics_data={
        'rollingAverage': 2500.0,
        'trend': 'stable',
        'trendPercentage': 0.0,
        'anomalyDetected': False,
        'streakDays': 7,
        'longestStreak': 15,
        'percentile': 65.0
    },
    calculated_at=timestamp_4
))

# Record 2: Update existing steps with newer timestamp - should UPDATE
records_batch.append(build_analytics_record(
    user_id=test_user_id,
    metric_type=test_metric,  # steps
    time_range=test_time_range,  # 7day
    analytics_data={
        'rollingAverage': 9500.0,
        'trend': 'up',
        'trendPercentage': 25.0,
        'anomalyDetected': False,
        'streakDays': 7,
        'longestStreak': 12,
        'percentile': 85.0
    },
    calculated_at=timestamp_4
))

# Record 3: New time range for steps (30day) - should INSERT
records_batch.append(build_analytics_record(
    user_id=test_user_id,
    metric_type=test_metric,  # steps
    time_range="30day",
    analytics_data={
        'rollingAverage': 8000.0,
        'trend': 'up',
        'trendPercentage': 12.0,
        'anomalyDetected': False,
        'streakDays': 15,
        'longestStreak': 20,
        'percentile': 70.0
    },
    calculated_at=timestamp_4
))

result_4 = save_analytics_to_mongodb(
    spark_session=spark,
    analytics_list=records_batch,
    batch_id="test_batch_4_mixed"
)

print(f"\n📊 Result 4:")
print(f"   Success: {result_4['success']}")
print(f"   Records Written: {result_4['records_written']}")
print(f"   Inserts: {result_4.get('inserts', 0)}")
print(f"   Updates: {result_4.get('updates', 0)}")
print(f"   Skipped: {result_4.get('skipped', 0)}")

assert result_4['success'], "Test 4 should succeed"
assert result_4.get('inserts', 0) == 2, "Should have 2 inserts (calories and steps 30day)"
assert result_4.get('updates', 0) == 1, "Should have 1 update (steps 7day)"
print("✅ Test 4 PASSED: Mixed batch operations successful")

# ============================================================================
# Test 5: Verify Final Database State
# ============================================================================
print("\n" + "=" * 80)
print("🔍 Test 5: Verify Final Database State")
print("=" * 80)

from pymongo import MongoClient

client = MongoClient(MONGO_URI)
db = client[os.getenv('MONGO_DB_NAME', 'health_metrics')]
collection = db[os.getenv('ANALYTICS_COLLECTION', 'analytics')]

# Query all test records
test_records = list(collection.find({'userId': test_user_id}))

print(f"\n📊 Found {len(test_records)} analytics documents for test user:")
for idx, doc in enumerate(test_records, 1):
    print(f"\n   Document {idx}:")
    print(f"      Metric: {doc['metricType']}")
    print(f"      Time Range: {doc['timeRange']}")
    print(f"      Rolling Average: {doc['analytics']['rollingAverage']}")
    print(f"      Trend: {doc['analytics']['trend']}")
    print(f"      Calculated At: {doc['calculatedAt']}")

# Verify expected documents exist
assert len(test_records) == 3, f"Should have 3 documents, got {len(test_records)}"

# Verify steps 7day has latest value (9500.0)
steps_7day = next((doc for doc in test_records if doc['metricType'] == 'steps' and doc['timeRange'] == '7day'), None)
assert steps_7day is not None, "steps 7day document should exist"
assert steps_7day['analytics']['rollingAverage'] == 9500.0, "steps 7day should have latest value"

print("\n✅ Test 5 PASSED: Database state verified")

# Cleanup
print("\n🧹 Cleaning up test data...")
delete_result = collection.delete_many({'userId': test_user_id})
print(f"   Deleted {delete_result.deleted_count} test documents")

client.close()
spark.stop()

print("\n" + "=" * 80)
print("✅ ALL TESTS PASSED!")
print("=" * 80)
print("\n📋 Summary:")
print("   ✅ Test 1: Initial insert - PASSED")
print("   ✅ Test 2: Update with newer timestamp - PASSED")
print("   ✅ Test 3: Skip older timestamp - PASSED")
print("   ✅ Test 4: Mixed batch operations - PASSED")
print("   ✅ Test 5: Database state verification - PASSED")
print("\n🎉 Upsert logic is working correctly!")
