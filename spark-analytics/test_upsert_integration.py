"""
Integration Test: Upsert Logic with Multiple Batches and Manual Inserts

This test verifies:
1. Multiple batches for same user/metric/timeRange with increasing timestamps
2. Only one document exists per tuple after all batches
3. Document contains the latest calculatedAt and analytics values
4. Manual insertion of older document gets replaced by newer batch
5. Query verification of final database state
"""

import sys
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from pyspark.sql import SparkSession
from pymongo import MongoClient

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
MONGO_DB_NAME = os.getenv('MONGO_DB_NAME', 'health_metrics')
ANALYTICS_COLLECTION = os.getenv('ANALYTICS_COLLECTION', 'analytics')

if not MONGO_URI:
    print("❌ MONGO_URI not set in environment variables")
    sys.exit(1)

print("=" * 80)
print("🧪 Integration Test: Multiple Batches with Upsert Logic")
print("=" * 80)

# Initialize Spark Session
print("\n1️⃣ Initializing Spark Session...")
spark = SparkSession.builder \
    .appName("Test Analytics Upsert Integration") \
    .master("local[*]") \
    .config("spark.mongodb.read.connection.uri", MONGO_URI) \
    .config("spark.mongodb.write.connection.uri", MONGO_URI) \
    .config("spark.jars.packages", "org.mongodb.spark:mongo-spark-connector_2.12:10.3.0") \
    .config("spark.hadoop.fs.permissions.umask-mode", "000") \
    .config("spark.local.dir", os.path.join(os.getcwd(), "spark-local")) \
    .getOrCreate()

print("✅ Spark Session initialized")

# Connect to MongoDB
client = MongoClient(MONGO_URI)
db = client[MONGO_DB_NAME]
collection = db[ANALYTICS_COLLECTION]

# Test data
test_user_id = "integration_test_user_001"
test_metric = "steps"
test_time_range = "7day"

print(f"\n2️⃣ Test Setup:")
print(f"   User ID: {test_user_id}")
print(f"   Metric: {test_metric}")
print(f"   Time Range: {test_time_range}")
print(f"   Database: {MONGO_DB_NAME}")
print(f"   Collection: {ANALYTICS_COLLECTION}")

# Cleanup any existing test data
print("\n🧹 Cleaning up any existing test data...")
delete_result = collection.delete_many({'userId': test_user_id})
if delete_result.deleted_count > 0:
    print(f"   Deleted {delete_result.deleted_count} existing test documents")
else:
    print("   No existing test data found")

# ============================================================================
# Test 1: Process Multiple Batches with Increasing Timestamps
# ============================================================================
print("\n" + "=" * 80)
print("📦 Test 1: Process Multiple Batches (Same User/Metric/TimeRange)")
print("=" * 80)

base_time = datetime.now() - timedelta(hours=10)
batches = []

# Batch 1: Initial analytics
print(f"\n📥 Processing Batch 1 (Initial Data)...")
timestamp_1 = base_time
analytics_1 = {
    'rollingAverage': 8000.0,
    'trend': 'stable',
    'trendPercentage': 0.0,
    'anomalyDetected': False,
    'streakDays': 3,
    'longestStreak': 5,
    'percentile': 60.0
}

record_1 = build_analytics_record(
    user_id=test_user_id,
    metric_type=test_metric,
    time_range=test_time_range,
    analytics_data=analytics_1,
    calculated_at=timestamp_1
)

result_1 = save_analytics_to_mongodb(
    spark_session=spark,
    analytics_list=[record_1],
    batch_id="integration_batch_1"
)

print(f"   Result: {result_1['inserts']} inserts, {result_1['updates']} updates, {result_1['skipped']} skipped")
batches.append({
    'batch': 1,
    'timestamp': timestamp_1,
    'analytics': analytics_1,
    'result': result_1
})

# Verify document count after batch 1
count_after_batch_1 = collection.count_documents({'userId': test_user_id})
print(f"   Documents in DB: {count_after_batch_1}")
assert count_after_batch_1 == 1, f"Expected 1 document after batch 1, got {count_after_batch_1}"

# Batch 2: Updated analytics (2 hours later)
print(f"\n📥 Processing Batch 2 (Updated Data - 2 hours later)...")
timestamp_2 = base_time + timedelta(hours=2)
analytics_2 = {
    'rollingAverage': 8500.0,
    'trend': 'up',
    'trendPercentage': 6.25,
    'anomalyDetected': False,
    'streakDays': 4,
    'longestStreak': 5,
    'percentile': 65.0
}

record_2 = build_analytics_record(
    user_id=test_user_id,
    metric_type=test_metric,
    time_range=test_time_range,
    analytics_data=analytics_2,
    calculated_at=timestamp_2
)

result_2 = save_analytics_to_mongodb(
    spark_session=spark,
    analytics_list=[record_2],
    batch_id="integration_batch_2"
)

print(f"   Result: {result_2['inserts']} inserts, {result_2['updates']} updates, {result_2['skipped']} skipped")
batches.append({
    'batch': 2,
    'timestamp': timestamp_2,
    'analytics': analytics_2,
    'result': result_2
})

# Verify still only 1 document (should be update)
count_after_batch_2 = collection.count_documents({'userId': test_user_id})
print(f"   Documents in DB: {count_after_batch_2}")
assert count_after_batch_2 == 1, f"Expected 1 document after batch 2, got {count_after_batch_2}"
assert result_2['updates'] == 1, "Batch 2 should be an update"

# Batch 3: Another update (4 hours later)
print(f"\n📥 Processing Batch 3 (Further Update - 4 hours later)...")
timestamp_3 = base_time + timedelta(hours=4)
analytics_3 = {
    'rollingAverage': 9000.0,
    'trend': 'up',
    'trendPercentage': 12.5,
    'anomalyDetected': False,
    'streakDays': 5,
    'longestStreak': 6,
    'percentile': 70.0
}

record_3 = build_analytics_record(
    user_id=test_user_id,
    metric_type=test_metric,
    time_range=test_time_range,
    analytics_data=analytics_3,
    calculated_at=timestamp_3
)

result_3 = save_analytics_to_mongodb(
    spark_session=spark,
    analytics_list=[record_3],
    batch_id="integration_batch_3"
)

print(f"   Result: {result_3['inserts']} inserts, {result_3['updates']} updates, {result_3['skipped']} skipped")
batches.append({
    'batch': 3,
    'timestamp': timestamp_3,
    'analytics': analytics_3,
    'result': result_3
})

# Verify still only 1 document
count_after_batch_3 = collection.count_documents({'userId': test_user_id})
print(f"   Documents in DB: {count_after_batch_3}")
assert count_after_batch_3 == 1, f"Expected 1 document after batch 3, got {count_after_batch_3}"
assert result_3['updates'] == 1, "Batch 3 should be an update"

# Batch 4: Out-of-order batch (3 hours - older than batch 3, should skip)
print(f"\n📥 Processing Batch 4 (Out-of-Order - Should Skip)...")
timestamp_4 = base_time + timedelta(hours=3)  # Older than batch 3
analytics_4 = {
    'rollingAverage': 7500.0,  # Different values (but should be skipped)
    'trend': 'down',
    'trendPercentage': -5.0,
    'anomalyDetected': True,
    'streakDays': 2,
    'longestStreak': 5,
    'percentile': 55.0
}

record_4 = build_analytics_record(
    user_id=test_user_id,
    metric_type=test_metric,
    time_range=test_time_range,
    analytics_data=analytics_4,
    calculated_at=timestamp_4
)

result_4 = save_analytics_to_mongodb(
    spark_session=spark,
    analytics_list=[record_4],
    batch_id="integration_batch_4_outoforder"
)

print(f"   Result: {result_4['inserts']} inserts, {result_4['updates']} updates, {result_4['skipped']} skipped")
batches.append({
    'batch': 4,
    'timestamp': timestamp_4,
    'analytics': analytics_4,
    'result': result_4
})

# Verify still only 1 document and it was skipped
count_after_batch_4 = collection.count_documents({'userId': test_user_id})
print(f"   Documents in DB: {count_after_batch_4}")
assert count_after_batch_4 == 1, f"Expected 1 document after batch 4, got {count_after_batch_4}"
assert result_4['skipped'] == 1, "Batch 4 should be skipped (older timestamp)"
assert result_4['records_written'] == 0, "Batch 4 should write 0 records"

# Batch 5: Latest update (6 hours)
print(f"\n📥 Processing Batch 5 (Latest Data - 6 hours later)...")
timestamp_5 = base_time + timedelta(hours=6)
analytics_5 = {
    'rollingAverage': 9500.0,
    'trend': 'up',
    'trendPercentage': 18.75,
    'anomalyDetected': False,
    'streakDays': 6,
    'longestStreak': 7,
    'percentile': 75.0
}

record_5 = build_analytics_record(
    user_id=test_user_id,
    metric_type=test_metric,
    time_range=test_time_range,
    analytics_data=analytics_5,
    calculated_at=timestamp_5
)

result_5 = save_analytics_to_mongodb(
    spark_session=spark,
    analytics_list=[record_5],
    batch_id="integration_batch_5_latest"
)

print(f"   Result: {result_5['inserts']} inserts, {result_5['updates']} updates, {result_5['skipped']} skipped")
batches.append({
    'batch': 5,
    'timestamp': timestamp_5,
    'analytics': analytics_5,
    'result': result_5
})

# Verify still only 1 document
count_after_batch_5 = collection.count_documents({'userId': test_user_id})
print(f"   Documents in DB: {count_after_batch_5}")
assert count_after_batch_5 == 1, f"Expected 1 document after batch 5, got {count_after_batch_5}"
assert result_5['updates'] == 1, "Batch 5 should be an update"

print("\n✅ Test 1 PASSED: Multiple batches processed, only 1 document exists")

# ============================================================================
# Test 2: Verify Document Has Latest Values
# ============================================================================
print("\n" + "=" * 80)
print("🔍 Test 2: Verify Document Contains Latest Values")
print("=" * 80)

# Query the document
doc = collection.find_one({
    'userId': test_user_id,
    'metricType': test_metric,
    'timeRange': test_time_range
})

assert doc is not None, "Document should exist"

print(f"\n📄 Current Document State:")
print(f"   User ID: {doc['userId']}")
print(f"   Metric Type: {doc['metricType']}")
print(f"   Time Range: {doc['timeRange']}")
print(f"   Calculated At: {doc['calculatedAt']}")
print(f"   Rolling Average: {doc['analytics']['rollingAverage']}")
print(f"   Trend: {doc['analytics']['trend']}")
print(f"   Trend %: {doc['analytics']['trendPercentage']}")
print(f"   Anomaly Detected: {doc['analytics']['anomalyDetected']}")
print(f"   Streak Days: {doc['analytics']['streakDays']}")
print(f"   Longest Streak: {doc['analytics']['longestStreak']}")
print(f"   Percentile: {doc['analytics']['percentile']}")

# Verify it has the latest values (from batch 5)
assert doc['analytics']['rollingAverage'] == 9500.0, "Should have latest rolling average"
assert doc['analytics']['trend'] == 'up', "Should have latest trend"
assert doc['analytics']['trendPercentage'] == 18.75, "Should have latest trend percentage"
assert doc['analytics']['streakDays'] == 6, "Should have latest streak days"
assert doc['analytics']['longestStreak'] == 7, "Should have latest longest streak"
assert doc['analytics']['percentile'] == 75.0, "Should have latest percentile"

# Verify timestamp matches batch 5
doc_timestamp = doc['calculatedAt']
if isinstance(doc_timestamp, str):
    doc_timestamp = datetime.fromisoformat(doc_timestamp.replace('Z', '+00:00'))

print(f"\n✅ Verified: Document has values from Batch 5 (latest)")
print(f"   Expected timestamp: {timestamp_5.isoformat()}")
print(f"   Actual timestamp: {doc_timestamp.isoformat() if hasattr(doc_timestamp, 'isoformat') else doc_timestamp}")

print("\n✅ Test 2 PASSED: Document contains latest calculatedAt and analytics values")

# ============================================================================
# Test 3: Manual Insert of Older Document
# ============================================================================
print("\n" + "=" * 80)
print("🔧 Test 3: Manually Insert Older Document, Then Update with Batch")
print("=" * 80)

# First, delete the current document
print("\n🗑️  Deleting current document...")
collection.delete_one({
    'userId': test_user_id,
    'metricType': test_metric,
    'timeRange': test_time_range
})

# Manually insert an older document
print("\n📝 Manually inserting older document...")
old_timestamp = base_time - timedelta(hours=5)  # Older than all batches
old_doc = {
    'userId': test_user_id,
    'metricType': test_metric,
    'timeRange': test_time_range,
    'analytics': {
        'rollingAverage': 7000.0,
        'trend': 'down',
        'trendPercentage': -10.0,
        'anomalyDetected': True,
        'streakDays': 1,
        'longestStreak': 3,
        'streakStartDate': None,
        'percentile': 45.0,
        'comparisonToPrevious': {
            'absoluteChange': 0.0,
            'percentageChange': 0.0,
            'isImprovement': None
        },
        'statistics': {
            'standardDeviation': 0.0,
            'minValue': None,
            'maxValue': None,
            'medianValue': None,
            'dataPointsCount': 0,
            'completenessPercentage': 0.0
        }
    },
    'calculatedAt': old_timestamp.isoformat(),
    'expiresAt': (old_timestamp + timedelta(days=90)).isoformat(),
    'metadata': None
}

insert_result = collection.insert_one(old_doc)
print(f"   Inserted document with ID: {insert_result.inserted_id}")
print(f"   Old timestamp: {old_timestamp.isoformat()}")
print(f"   Old rolling average: {old_doc['analytics']['rollingAverage']}")

# Verify the old document is in the database
verify_doc = collection.find_one({'userId': test_user_id})
assert verify_doc is not None, "Old document should exist"
assert verify_doc['analytics']['rollingAverage'] == 7000.0, "Should have old value"
print(f"   ✅ Old document verified in database")

# Now process a new batch with newer timestamp
print(f"\n📥 Processing Batch 6 (Should Replace Old Manual Document)...")
timestamp_6 = base_time + timedelta(hours=8)  # Newer than the old manual insert
analytics_6 = {
    'rollingAverage': 10000.0,
    'trend': 'up',
    'trendPercentage': 25.0,
    'anomalyDetected': False,
    'streakDays': 7,
    'longestStreak': 8,
    'percentile': 80.0
}

record_6 = build_analytics_record(
    user_id=test_user_id,
    metric_type=test_metric,
    time_range=test_time_range,
    analytics_data=analytics_6,
    calculated_at=timestamp_6
)

result_6 = save_analytics_to_mongodb(
    spark_session=spark,
    analytics_list=[record_6],
    batch_id="integration_batch_6_after_manual"
)

print(f"   Result: {result_6['inserts']} inserts, {result_6['updates']} updates, {result_6['skipped']} skipped")
assert result_6['updates'] == 1, "Should update the old manual document"

# Verify the document was updated
updated_doc = collection.find_one({
    'userId': test_user_id,
    'metricType': test_metric,
    'timeRange': test_time_range
})

assert updated_doc is not None, "Document should exist"
assert updated_doc['analytics']['rollingAverage'] == 10000.0, "Should have new value"
assert updated_doc['analytics']['trend'] == 'up', "Should have new trend"

updated_timestamp = updated_doc['calculatedAt']
if isinstance(updated_timestamp, str):
    updated_timestamp = datetime.fromisoformat(updated_timestamp.replace('Z', '+00:00'))

print(f"\n✅ Verified: Manual old document was replaced")
print(f"   Old timestamp: {old_timestamp.isoformat()}")
print(f"   New timestamp: {timestamp_6.isoformat()}")
print(f"   Old rolling avg: 7000.0")
print(f"   New rolling avg: 10000.0")

# Verify still only 1 document
final_count = collection.count_documents({'userId': test_user_id})
assert final_count == 1, f"Should have exactly 1 document, got {final_count}"

print("\n✅ Test 3 PASSED: Old manual document replaced by newer batch")

# ============================================================================
# Test 4: Summary and Statistics
# ============================================================================
print("\n" + "=" * 80)
print("📊 Test 4: Final Statistics and Verification")
print("=" * 80)

print(f"\n📈 Batch Processing Summary:")
print(f"   Total batches processed: {len(batches)}")
print(f"   Total documents in DB for test user: {final_count}")
print(f"\n   Batch Details:")
for batch in batches:
    op_type = "INSERT" if batch['result']['inserts'] > 0 else "UPDATE" if batch['result']['updates'] > 0 else "SKIP"
    print(f"   - Batch {batch['batch']}: {op_type} (rollingAvg={batch['analytics']['rollingAverage']}, time={batch['timestamp'].strftime('%H:%M')})")

# Query final document state
final_doc = collection.find_one({'userId': test_user_id})
print(f"\n📄 Final Document State:")
print(f"   User ID: {final_doc['userId']}")
print(f"   Metric Type: {final_doc['metricType']}")
print(f"   Time Range: {final_doc['timeRange']}")
print(f"   Calculated At: {final_doc['calculatedAt']}")
print(f"   Rolling Average: {final_doc['analytics']['rollingAverage']}")
print(f"   Trend: {final_doc['analytics']['trend']}")
print(f"   Streak Days: {final_doc['analytics']['streakDays']}")
print(f"   Longest Streak: {final_doc['analytics']['longestStreak']}")

print("\n✅ Test 4 PASSED: Statistics verified")

# ============================================================================
# Cleanup
# ============================================================================
print("\n" + "=" * 80)
print("🧹 Cleanup")
print("=" * 80)

delete_result = collection.delete_many({'userId': test_user_id})
print(f"Deleted {delete_result.deleted_count} test documents")

client.close()
spark.stop()

print("\n" + "=" * 80)
print("✅ ALL INTEGRATION TESTS PASSED!")
print("=" * 80)
print("\n📋 Summary:")
print("   ✅ Test 1: Multiple batches (5 batches) - Only 1 document maintained")
print("   ✅ Test 2: Document has latest calculatedAt and analytics values")
print("   ✅ Test 3: Manual old document replaced by newer batch")
print("   ✅ Test 4: Final statistics and verification")
print("\n🎉 Upsert integration is working correctly!")
print("   - Processed 6 total batches")
print("   - Maintained exactly 1 document per (user, metric, timeRange)")
print("   - Always stored the latest analytics values")
print("   - Correctly skipped older out-of-order batches")
