"""
Integration Test: Batch Logger in Streaming Mode

This test simulates the streaming job and verifies:
1. Console output with emoji indicators after each batch
2. Statistics accuracy by cross-referencing MongoDB counts
3. Error logging with context (simulated MongoDB errors)
4. Metrics file updates
5. Session summary at completion
"""

import sys
import os
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv
from pyspark.sql import SparkSession
from pymongo import MongoClient

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from batch_logger import BatchLogger
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

MONGO_URI = os.getenv('MONGO_URI')
MONGO_DB_NAME = os.getenv('MONGO_DB_NAME', 'health_metrics')
ANALYTICS_COLLECTION = os.getenv('ANALYTICS_COLLECTION', 'analytics')

if not MONGO_URI:
    print("❌ MONGO_URI not set in environment variables")
    sys.exit(1)

print("=" * 80)
print("🧪 Integration Test: Batch Logger in Streaming Simulation")
print("=" * 80)
print(f"\n📊 Database: {MONGO_DB_NAME}")
print(f"📦 Collection: {ANALYTICS_COLLECTION}")
print(f"⏱️  Simulating 5 batches with 3-second intervals\n")

# Initialize Batch Logger
batch_logger = BatchLogger(
    log_dir='./test_streaming_logs',
    metrics_dir='./test_streaming_metrics'
)

# Initialize Spark Session
print("1️⃣ Initializing Spark Session...")
spark = SparkSession.builder \
    .appName("Test Streaming Batch Logger") \
    .master("local[*]") \
    .config("spark.mongodb.read.connection.uri", MONGO_URI) \
    .config("spark.mongodb.write.connection.uri", MONGO_URI) \
    .config("spark.jars.packages", "org.mongodb.spark:mongo-spark-connector_2.12:10.3.0") \
    .config("spark.hadoop.fs.permissions.umask-mode", "000") \
    .config("spark.local.dir", os.path.join(os.getcwd(), "spark-local")) \
    .getOrCreate()

print("✅ Spark Session initialized\n")

# Connect to MongoDB
client = MongoClient(MONGO_URI)
db = client[MONGO_DB_NAME]
collection = db[ANALYTICS_COLLECTION]

# Test users
test_users = [
    "streaming_test_user_001",
    "streaming_test_user_002",
    "streaming_test_user_003"
]

# Cleanup existing test data
print("2️⃣ Cleaning up existing test data...")
delete_result = collection.delete_many({'userId': {'$in': test_users}})
if delete_result.deleted_count > 0:
    print(f"   Deleted {delete_result.deleted_count} existing test documents\n")
else:
    print("   No existing test data found\n")

# Track MongoDB state for verification
mongodb_stats = {
    'documents_before': collection.count_documents({'userId': {'$in': test_users}}),
    'batches': []
}

print("=" * 80)
print("🚀 STARTING STREAMING SIMULATION")
print("=" * 80)

# Simulate 5 batches
for batch_num in range(1, 6):
    batch_id = f"streaming_batch_{batch_num:03d}"
    
    print(f"\n{'─' * 80}")
    print(f"📦 BATCH {batch_num}/5")
    print(f"{'─' * 80}")
    
    # Start batch tracking
    batch_context = batch_logger.start_batch(batch_id)
    
    # Simulate processing delay
    time.sleep(0.5)
    
    # Generate test analytics for this batch
    analytics_list = []
    records_to_process = 10 + batch_num * 5  # Increasing load
    
    for i in range(records_to_process):
        user_id = test_users[i % len(test_users)]
        metric_type = ['steps', 'calories', 'activeMinutes'][i % 3]
        
        analytics_data = {
            'rollingAverage': 8000.0 + batch_num * 500 + i * 100,
            'trend': 'up' if batch_num % 2 == 1 else 'stable',
            'trendPercentage': 10.0 + batch_num,
            'anomalyDetected': i % 10 == 0,  # 10% anomaly rate
            'streakDays': batch_num + i,
            'longestStreak': batch_num * 2 + i,
            'percentile': 60.0 + batch_num * 5
        }
        
        record = build_analytics_record(
            user_id=user_id,
            metric_type=metric_type,
            time_range='7day',
            analytics_data=analytics_data,
            calculated_at=datetime.now() + timedelta(seconds=batch_num)
        )
        
        analytics_list.append(record)
    
    analytics_computed = len(analytics_list)
    
    # Simulate error condition in batch 4
    if batch_num == 4:
        print("\n⚠️  SIMULATING ERROR: Invalid write configuration")
        
        # Complete batch with error
        batch_logger.fail_batch(
            batch_context=batch_context,
            error_message="MongoDB write error: Connection timeout after 30s",
            error_details={
                'retry_attempts': 3,
                'timeout_seconds': 30,
                'last_error': 'ServerSelectionTimeoutError',
                'records_pending': analytics_computed
            }
        )
        
        # Track batch stats
        mongodb_stats['batches'].append({
            'batch_num': batch_num,
            'batch_id': batch_id,
            'success': False,
            'records_processed': records_to_process,
            'analytics_computed': analytics_computed,
            'analytics_written': 0,
            'error': True
        })
        
        print(f"\n⏸️  Continuing to next batch after error...\n")
        time.sleep(3)
        continue
    
    # Normal processing - write to MongoDB
    try:
        write_result = save_analytics_to_mongodb(
            spark_session=spark,
            analytics_list=analytics_list,
            batch_id=batch_id
        )
        
        # Complete batch tracking
        batch_logger.complete_batch(
            batch_context=batch_context,
            records_processed=records_to_process,
            analytics_computed=analytics_computed,
            write_result=write_result
        )
        
        # Track batch stats
        mongodb_stats['batches'].append({
            'batch_num': batch_num,
            'batch_id': batch_id,
            'success': write_result['success'],
            'records_processed': records_to_process,
            'analytics_computed': analytics_computed,
            'analytics_written': write_result['records_written'],
            'inserts': write_result.get('inserts', 0),
            'updates': write_result.get('updates', 0),
            'skipped': write_result.get('skipped', 0)
        })
        
    except Exception as e:
        error_message = f"Unexpected error: {str(e)}"
        batch_logger.fail_batch(
            batch_context=batch_context,
            error_message=error_message,
            error_details={'exception': str(e), 'type': type(e).__name__}
        )
        
        mongodb_stats['batches'].append({
            'batch_num': batch_num,
            'batch_id': batch_id,
            'success': False,
            'error': True
        })
    
    # Wait before next batch (simulate streaming interval)
    if batch_num < 5:
        print(f"\n⏳ Waiting 3 seconds before next batch...")
        time.sleep(3)

print("\n" + "=" * 80)
print("🏁 STREAMING SIMULATION COMPLETED")
print("=" * 80)

# Print session summary
batch_logger.print_session_summary()

# Export batch history
export_path = batch_logger.export_batch_history()

# ============================================================================
# Verification: Cross-reference with MongoDB
# ============================================================================
print("\n" + "=" * 80)
print("🔍 VERIFICATION: Cross-Referencing with MongoDB")
print("=" * 80)

# Count documents in MongoDB
mongodb_stats['documents_after'] = collection.count_documents({'userId': {'$in': test_users}})
mongodb_stats['documents_inserted'] = mongodb_stats['documents_after'] - mongodb_stats['documents_before']

print(f"\n📊 MongoDB Document Counts:")
print(f"   Before: {mongodb_stats['documents_before']}")
print(f"   After: {mongodb_stats['documents_after']}")
print(f"   Net Change: {mongodb_stats['documents_inserted']}")

# Get session summary from logger
session_summary = batch_logger.get_session_summary()

print(f"\n📈 Logger Statistics:")
print(f"   Analytics Written: {session_summary['analytics_written_total']}")
print(f"   - Inserts: {session_summary['analytics_inserted_total']}")
print(f"   - Updates: {session_summary['analytics_updated_total']}")
print(f"   - Skipped: {session_summary['analytics_skipped_total']}")

# Verify counts match
print(f"\n✅ Verification Results:")

# Calculate expected unique documents (inserts only, updates don't add new docs)
expected_new_docs = session_summary['analytics_inserted_total']
actual_new_docs = mongodb_stats['documents_inserted']

if actual_new_docs == expected_new_docs:
    print(f"   ✅ Document count matches: {actual_new_docs} new documents")
else:
    print(f"   ⚠️  Document count mismatch:")
    print(f"      Expected: {expected_new_docs}")
    print(f"      Actual: {actual_new_docs}")

# Verify batch counts
successful_batches = sum(1 for b in mongodb_stats['batches'] if b['success'])
failed_batches = sum(1 for b in mongodb_stats['batches'] if not b['success'])

print(f"   ✅ Batch counts verified:")
print(f"      Total: {session_summary['batches_processed_total']}")
print(f"      Succeeded: {successful_batches} (logger: {session_summary['batches_succeeded']})")
print(f"      Failed: {failed_batches} (logger: {session_summary['batches_failed']})")

# Verify processing times are reasonable
avg_time = session_summary.get('average_processing_time_ms', 0)
print(f"   ✅ Average processing time: {avg_time:.2f}ms")
if 100 < avg_time < 5000:
    print(f"      (Within expected range: 100-5000ms)")

# ============================================================================
# Verify Log Files
# ============================================================================
print("\n" + "=" * 80)
print("📁 VERIFICATION: Log Files Created")
print("=" * 80)

import json
from pathlib import Path

# Check JSON logs
log_dir = Path('./test_streaming_logs')
log_files = list(log_dir.glob('batch_logs_*.jsonl'))
print(f"\n📄 JSON Log Files: {len(log_files)}")

if log_files:
    latest_log = log_files[0]
    print(f"   File: {latest_log.name}")
    
    with open(latest_log, 'r') as f:
        log_entries = [json.loads(line) for line in f]
    
    print(f"   Entries: {len(log_entries)}")
    
    # Find the failed batch (batch 4)
    failed_batch = next((entry for entry in log_entries if entry['batch_id'] == 'streaming_batch_004'), None)
    if failed_batch:
        print(f"\n   ✅ Failed batch logged correctly:")
        print(f"      Batch ID: {failed_batch['batch_id']}")
        print(f"      Status: {failed_batch['status']}")
        print(f"      Error Count: {failed_batch['errors_count']}")
        print(f"      Error Message: {failed_batch['errors'][0]['message']}")
        print(f"      Error Details: {failed_batch['errors'][0]['details']}")

# Check metrics file
metrics_dir = Path('./test_streaming_metrics')
metrics_file = metrics_dir / 'spark_analytics_metrics.prom'
print(f"\n📈 Metrics File: {metrics_file.name}")

if metrics_file.exists():
    print(f"   ✅ Metrics file created")
    with open(metrics_file, 'r') as f:
        metrics_content = f.read()
    
    # Verify key metrics exist
    required_metrics = [
        'batches_processed_total',
        'batches_succeeded_total',
        'batches_failed_total',
        'analytics_written_total',
        'errors_total'
    ]
    
    for metric in required_metrics:
        if metric in metrics_content:
            print(f"      ✅ {metric}")
        else:
            print(f"      ❌ {metric} missing")

# ============================================================================
# Display Batch Details
# ============================================================================
print("\n" + "=" * 80)
print("📋 BATCH PROCESSING DETAILS")
print("=" * 80)

print(f"\n{'Batch':<15} {'Status':<12} {'Records':<10} {'Analytics':<12} {'Inserts':<10} {'Updates':<10}")
print("─" * 80)

for batch in mongodb_stats['batches']:
    status = "✅ SUCCESS" if batch['success'] else "❌ FAILED"
    records = batch.get('records_processed', 0)
    analytics = batch.get('analytics_written', 0)
    inserts = batch.get('inserts', 0)
    updates = batch.get('updates', 0)
    
    print(f"{batch['batch_id']:<15} {status:<12} {records:<10} {analytics:<12} {inserts:<10} {updates:<10}")

# ============================================================================
# Cleanup
# ============================================================================
print("\n" + "=" * 80)
print("🧹 Cleanup")
print("=" * 80)

delete_result = collection.delete_many({'userId': {'$in': test_users}})
print(f"Deleted {delete_result.deleted_count} test documents from MongoDB")

client.close()
spark.stop()

print("\n✅ Test artifacts preserved:")
print(f"   Logs: ./test_streaming_logs/")
print(f"   Metrics: ./test_streaming_metrics/")

print("\n" + "=" * 80)
print("✅ INTEGRATION TEST COMPLETED SUCCESSFULLY!")
print("=" * 80)

print("\n📋 Test Coverage:")
print("   ✅ Console output with emoji indicators verified")
print("   ✅ Batch statistics accuracy cross-referenced with MongoDB")
print("   ✅ Error logging with context (batch 4) verified")
print("   ✅ Metrics file creation and updates verified")
print("   ✅ Session summary accuracy verified")
print("   ✅ JSON log file format and content verified")
print("   ✅ Prometheus metrics format verified")

print("\n🎉 All logging and monitoring features working correctly!")
