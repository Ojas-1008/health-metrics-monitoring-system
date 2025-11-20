"""
Simple MongoDB Write Test (Windows-compatible, no emojis)
Tests the MongoDB write operations for analytics without Unicode emojis.
"""

import os
import sys
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import MongoDB utilities
from mongodb_utils import (
    save_analytics_to_mongodb,
    build_analytics_record
)

print("="*70)
print("MONGODB ANALYTICS WRITE TEST")
print("="*70)
print(f"Test Time: {datetime.now().isoformat()}\n")

# Test user ID (replace with actual user ID from your database if available)
test_user_id = "673f39c6b4f1e40b3c123456"

print("Building sample analytics records...")

# Create sample records
sample_records = []

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
                'sparkVersion': '3.5.0'
            }
        )
        
        sample_records.append(record)

print(f"Built {len(sample_records)} sample analytics records\n")

# Write to MongoDB
print("Writing sample records to MongoDB...")

result = save_analytics_to_mongodb(
    spark_session=None,  # PyMongo doesn't need Spark session
    analytics_list=sample_records,
    batch_id="test-batch-001"
)

print(f"\nWrite Results:")
print(f"  - Success: {result['success']}")
print(f"  - Records Processed: {result['records_processed']}")
print(f"  - Records Written: {result['records_written']}")
print(f"  - Records Failed: {result['records_failed']}")

if result['errors']:
    print(f"  - Errors: {len(result['errors'])}")
    for error in result['errors']:
        print(f"    * {error['message']}")
else:
    print("  - No errors")

print("\n" + "="*70)
if result['success'] and result['records_written'] > 0:
    print("TEST PASSED - Analytics written successfully!")
    print(f"Wrote {result['records_written']} records to MongoDB")
    print("\nNext steps:")
    print("1. Open MongoDB Compass")
    print("2. Connect to your database")
    print(f"3. View the 'analytics' collection")
    print("4. Verify documents have correct structure and timestamps")
    print("5. Check TTL index on expiresAt field")
else:
    print("TEST FAILED - Check error messages above")
    print("\nCheck the DLQ directory for failed records:")
    dlq_dir = os.getenv('DLQ_DIRECTORY', './dlq')
    print(f"  {dlq_dir}")

print("="*70)
