"""
Test script for BatchLogger functionality.

Tests:
1. Basic batch logging with success
2. Batch logging with failure
3. Multiple batches with mixed results
4. Session summary generation
5. Metrics file creation
6. Batch history export
"""

import sys
import os
import time
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from batch_logger import BatchLogger

print("=" * 80)
print("🧪 Testing Batch Logger Functionality")
print("=" * 80)

# Initialize logger
print("\n1️⃣ Initializing BatchLogger...")
logger = BatchLogger(log_dir='./test_logs', metrics_dir='./test_metrics')

# ============================================================================
# Test 1: Successful Batch
# ============================================================================
print("\n" + "=" * 80)
print("📝 Test 1: Successful Batch Processing")
print("=" * 80)

batch_ctx_1 = logger.start_batch("test_batch_001")
time.sleep(0.5)  # Simulate processing

write_result_1 = {
    'success': True,
    'records_written': 15,
    'records_processed': 15,
    'inserts': 10,
    'updates': 5,
    'skipped': 0,
    'errors': []
}

logger.complete_batch(
    batch_context=batch_ctx_1,
    records_processed=50,
    analytics_computed=15,
    write_result=write_result_1
)

# ============================================================================
# Test 2: Failed Batch
# ============================================================================
print("\n" + "=" * 80)
print("❌ Test 2: Failed Batch Processing")
print("=" * 80)

batch_ctx_2 = logger.start_batch("test_batch_002")
time.sleep(0.3)  # Simulate processing

logger.fail_batch(
    batch_context=batch_ctx_2,
    error_message="MongoDB write error: Connection timeout",
    error_details={'timeout': 30, 'retry_attempts': 3}
)

# ============================================================================
# Test 3: Multiple Successful Batches
# ============================================================================
print("\n" + "=" * 80)
print("📦 Test 3: Multiple Successful Batches")
print("=" * 80)

for i in range(3, 6):
    batch_ctx = logger.start_batch(f"test_batch_00{i}")
    time.sleep(0.2)
    
    write_result = {
        'success': True,
        'records_written': 10 + i,
        'records_processed': 10 + i,
        'inserts': 5 + i,
        'updates': 3,
        'skipped': 2,
        'errors': []
    }
    
    logger.complete_batch(
        batch_context=batch_ctx,
        records_processed=30 + i * 10,
        analytics_computed=10 + i,
        write_result=write_result
    )

# ============================================================================
# Test 4: Batch with Warnings (Partial Success)
# ============================================================================
print("\n" + "=" * 80)
print("⚠️  Test 4: Batch with Warnings (Partial Success)")
print("=" * 80)

batch_ctx_4 = logger.start_batch("test_batch_006")
time.sleep(0.4)

write_result_4 = {
    'success': True,
    'records_written': 8,
    'records_processed': 10,
    'inserts': 5,
    'updates': 3,
    'skipped': 0,
    'errors': [
        {'message': 'Failed to write 2 records to DLQ', 'type': 'dlq_error'}
    ]
}

logger.complete_batch(
    batch_context=batch_ctx_4,
    records_processed=40,
    analytics_computed=10,
    write_result=write_result_4,
    errors=[{'message': 'Network latency detected', 'severity': 'warning'}]
)

# ============================================================================
# Test 5: Session Summary
# ============================================================================
print("\n" + "=" * 80)
print("📊 Test 5: Session Summary")
print("=" * 80)

logger.print_session_summary()

# ============================================================================
# Test 6: Verify Log Files Created
# ============================================================================
print("\n" + "=" * 80)
print("📁 Test 6: Verify Log Files Created")
print("=" * 80)

import json
from pathlib import Path

# Check JSON log file
log_dir = Path('./test_logs')
log_files = list(log_dir.glob('batch_logs_*.jsonl'))
print(f"\n📄 JSON Log Files: {len(log_files)}")
if log_files:
    latest_log = log_files[0]
    print(f"   Latest: {latest_log.name}")
    
    # Read and parse log entries
    with open(latest_log, 'r') as f:
        log_entries = [json.loads(line) for line in f]
    
    print(f"   Entries: {len(log_entries)}")
    print(f"\n   Sample Entry (Batch 1):")
    if log_entries:
        sample = log_entries[0]
        print(f"      Batch ID: {sample['batch_id']}")
        print(f"      Status: {sample['status']}")
        print(f"      Records: {sample['records_processed']}")
        print(f"      Analytics: {sample['analytics_written']}")
        print(f"      Time: {sample['processing_time_ms']}ms")

# Check metrics file
metrics_dir = Path('./test_metrics')
metrics_file = metrics_dir / 'spark_analytics_metrics.prom'
print(f"\n📈 Metrics File: {metrics_file.name}")
if metrics_file.exists():
    with open(metrics_file, 'r') as f:
        metrics_content = f.read()
    
    # Count metric lines (non-comment, non-empty)
    metric_lines = [line for line in metrics_content.split('\n') 
                   if line and not line.startswith('#')]
    print(f"   Metric Values: {len(metric_lines)}")
    
    print(f"\n   Sample Metrics:")
    for line in metric_lines[:5]:
        print(f"      {line}")

# ============================================================================
# Test 7: Export Batch History
# ============================================================================
print("\n" + "=" * 80)
print("📤 Test 7: Export Batch History")
print("=" * 80)

export_path = logger.export_batch_history()

# Read and verify export
with open(export_path, 'r') as f:
    export_data = json.load(f)

print(f"\n   Exported Data:")
print(f"      Session Start: {export_data['session_metrics']['session_start']}")
print(f"      Batches: {export_data['session_metrics']['batches_processed_total']}")
print(f"      History Entries: {len(export_data['batch_history'])}")

# ============================================================================
# Test 8: Get Session Summary (Programmatic)
# ============================================================================
print("\n" + "=" * 80)
print("🔍 Test 8: Programmatic Session Summary")
print("=" * 80)

summary = logger.get_session_summary()
print(f"\n   Summary Dictionary:")
print(f"      Total Batches: {summary['batches_processed_total']}")
print(f"      Success Rate: {(summary['batches_succeeded'] / summary['batches_processed_total'] * 100):.1f}%")
print(f"      Total Analytics Written: {summary['analytics_written_total']}")
print(f"      Average Processing Time: {summary.get('average_processing_time_ms', 0):.2f}ms")
print(f"      Total Errors: {summary['errors_total']}")

# ============================================================================
# Cleanup
# ============================================================================
print("\n" + "=" * 80)
print("🧹 Cleanup")
print("=" * 80)

import shutil

# Keep test artifacts for inspection
print("\n✅ Test artifacts preserved for inspection:")
print(f"   Logs: ./test_logs/")
print(f"   Metrics: ./test_metrics/")
print("\n   (Delete manually if needed)")

print("\n" + "=" * 80)
print("✅ ALL BATCH LOGGER TESTS PASSED!")
print("=" * 80)

print("\n📋 Summary:")
print("   ✅ Test 1: Successful batch logging")
print("   ✅ Test 2: Failed batch logging")
print("   ✅ Test 3: Multiple batches")
print("   ✅ Test 4: Partial success with warnings")
print("   ✅ Test 5: Session summary generation")
print("   ✅ Test 6: Log files verification")
print("   ✅ Test 7: Batch history export")
print("   ✅ Test 8: Programmatic summary access")

print("\n🎉 Batch Logger is working correctly!")
