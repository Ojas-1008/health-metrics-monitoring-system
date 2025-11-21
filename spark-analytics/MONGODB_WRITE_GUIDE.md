# MongoDB Analytics Write Configuration

## Overview

This document describes the MongoDB write operations for the analytics collection in the Health Metrics Monitoring System. The implementation converts Spark analytics output to properly structured documents matching the Mongoose Analytics model schema.

## Architecture

### Data Flow
```
Health Metrics (MongoDB) 
    → Spark Processing (main.py)
    → Analytics DataFrame (flat structure)
    → Conversion Layer (convert_analytics_df_to_records)
    → Structured Records (nested schema)
    → MongoDB Write (mongodb_utils.py)
    → Analytics Collection (MongoDB)
```

### Key Components

1. **`mongodb_utils.py`**: Core MongoDB write utilities
   - Schema definition (`get_analytics_schema()`)
   - Write operations (`save_analytics_to_mongodb()`)
   - Record builder (`build_analytics_record()`)
   - Dead-letter queue (DLQ) handling
   - Retry mechanism for failed writes

2. **`main.py`**: Analytics processing pipeline
   - Converts DataFrame to structured records
   - Calls MongoDB write utilities
   - Handles batch processing with checkpoints

3. **`test_mongodb_write.py`**: Comprehensive test suite
   - Schema verification
   - Sample record generation
   - Write operation testing
   - Error handling validation

## Schema Structure

### Mongoose Analytics Model

The Spark DataFrame schema exactly matches the Mongoose model defined in `server/src/models/Analytics.js`:

```javascript
{
  userId: ObjectId,              // User reference
  metricType: String,            // 'steps', 'calories', etc.
  timeRange: String,             // '7day', '30day', '90day'
  analytics: {                   // Nested analytics object
    rollingAverage: Number,      // Required
    trend: String,               // Required: 'up', 'down', 'stable'
    trendPercentage: Number,
    anomalyDetected: Boolean,    // Required
    anomalyDetails: {            // Conditional (if anomaly detected)
      severity: String,
      actualValue: Number,
      expectedValue: Number,
      deviation: Number,
      message: String,
      detectedAt: Date
    },
    streakDays: Number,
    longestStreak: Number,
    streakStartDate: Date,
    percentile: Number,
    comparisonToPrevious: {
      absoluteChange: Number,
      percentageChange: Number,
      isImprovement: Boolean
    },
    statistics: {
      standardDeviation: Number,
      minValue: Number,
      maxValue: Number,
      medianValue: Number,
      dataPointsCount: Number,
      completenessPercentage: Number
    }
  },
  calculatedAt: Date,            // Required
  expiresAt: Date,               // TTL index (90 days)
  metadata: {                    // Optional Spark metadata
    sparkJobId: String,
    processingDurationMs: Number,
    dataPointsProcessed: Number,
    sparkVersion: String
  }
}
```

### Spark DataFrame Schema

Defined in `mongodb_utils.get_analytics_schema()` using PySpark StructTypes:

```python
StructType([
    StructField("userId", StringType(), False),
    StructField("metricType", StringType(), False),
    StructField("timeRange", StringType(), False),
    StructField("analytics", StructType([
        StructField("rollingAverage", DoubleType(), False),
        StructField("trend", StringType(), False),
        # ... nested fields ...
    ]), False),
    StructField("calculatedAt", TimestampType(), False),
    StructField("expiresAt", TimestampType(), True),
    StructField("metadata", StructType([...]), True)
])
```

## Write Operations

### Upsert Logic (Prevents Duplicates)

The system uses an intelligent **upsert pattern** to prevent duplicate analytics entries for the same user/metric/timeRange combination:

```python
from mongodb_utils import save_analytics_to_mongodb

# Convert DataFrame to structured records
analytics_list = convert_analytics_df_to_records(analytics_df)

# Write to MongoDB with upsert logic
result = save_analytics_to_mongodb(
    spark_session=spark,
    analytics_list=analytics_list,
    batch_id="batch-001"
)

# Check results
print(f"Success: {result['success']}")
print(f"Inserts: {result['inserts']}")        # New documents
print(f"Updates: {result['updates']}")        # Replaced documents
print(f"Skipped: {result['skipped']}")        # Older timestamp ignored
print(f"Total written: {result['records_written']}")
```

### How Upsert Works

For each analytics document, the system:

1. **Identifies the document** using unique tuple: `(userId, metricType, timeRange)`
2. **Checks existing document** for matching tuple in MongoDB
3. **Compares timestamps**:
   - If no existing document → **INSERT** (new analytics)
   - If existing document has older `calculatedAt` → **UPDATE** (replace)
   - If existing document has same/newer `calculatedAt` → **SKIP** (keep existing)

```python
# Example upsert logic (simplified)
filter_query = {
    'userId': doc['userId'],
    'metricType': doc['metricType'],
    'timeRange': doc['timeRange']
}

existing_doc = collection.find_one(filter_query, {'calculatedAt': 1})

if existing_doc and doc['calculatedAt'] <= existing_doc['calculatedAt']:
    # Skip - existing data is newer or same
    print("⏭️  Skipped: existing timestamp is newer")
else:
    # Upsert - insert new or replace with newer data
    collection.replace_one(filter_query, doc, upsert=True)
```

### Upsert Benefits

- ✅ **No Duplicates**: Only one analytics entry per (user, metric, timeRange)
- ✅ **Always Latest**: Ensures most recent calculations are stored
- ✅ **Simple Retrieval**: Backend can query without sorting/limiting
- ✅ **Idempotent**: Safe to re-run batches without creating duplicates
- ✅ **Storage Efficient**: No manual cleanup of old analytics needed

### Detailed Logging

Each upsert operation is logged with full context:

```
📊 Upserting 5 analytics records to MongoDB...
   🆕 INSERT: userId=507f1f77bcf86cd799439011, metric=steps, range=7day
      Values: rollingAvg=8500.0, trend=up, anomaly=False
   🔄 UPDATE: userId=507f1f77bcf86cd799439011, metric=calories, range=7day
      Values: rollingAvg=2500.0, trend=stable, anomaly=False
   ⏭️  Skipped (userId=507f1f77bcf86cd799439011, metric=weight, range=7day): 
      existing timestamp 2025-11-21T10:00:00 >= new 2025-11-21T09:00:00

✅ Successfully upserted analytics records to MongoDB
   📥 Inserts: 3
   🔄 Updates: 1
   ⏭️  Skipped: 1
   Batch ID: batch-001
```

### Testing Upsert Logic

Run the comprehensive test suite:

```bash
python test_upsert_logic.py
```

Tests verify:
1. ✅ Initial insert of new documents
2. ✅ Update with newer timestamp (replaces)
3. ✅ Skip with older timestamp (ignores)
4. ✅ Mixed batch operations (inserts + updates + skips)
5. ✅ Database state verification

### Write Mode Comparison

**Previous Approach** (insert_many with append):
```python
# Problem: Creates duplicates on re-runs
collection.insert_many(prepared_records, ordered=False)
```

**Current Approach** (replace_one with upsert):
```python
# Solution: Prevents duplicates, keeps latest
for doc in prepared_records:
    filter_query = {
        'userId': doc['userId'],
        'metricType': doc['metricType'],
        'timeRange': doc['timeRange']
    }
    collection.replace_one(filter_query, doc, upsert=True)
```

### TTL Index Configuration

MongoDB automatically deletes expired documents:

```javascript
// In Analytics model (server/src/models/Analytics.js)
analyticsSchema.index(
  { expiresAt: 1 }, 
  { expireAfterSeconds: 0 }  // Delete immediately after expiresAt
);
```

Set expiration when creating records:

```python
expires_at = calculated_at + timedelta(days=90)
```

## Error Handling

### Multi-Layer Error Handling

1. **Schema Validation**: DataFrame creation validates structure
2. **Write Error Catching**: Catches MongoDB write failures
3. **Dead-Letter Queue**: Saves failed records for retry
4. **Logging**: Comprehensive error context

### Error Result Structure

```python
{
    'success': False,
    'records_processed': 100,
    'records_written': 95,
    'records_failed': 5,
    'errors': [
        {
            'type': 'write_error',
            'message': 'Connection timeout',
            'timestamp': '2025-11-21T10:30:00',
            'batch_id': 'batch-001'
        }
    ]
}
```

### Dead-Letter Queue (DLQ)

Failed records are automatically saved to DLQ files:

```
dlq/
├── analytics_dlq_20251121_103045_123456_batch_001.json
├── analytics_dlq_20251121_110215_789012.json
└── processed/                    # Archived after successful retry
    └── analytics_dlq_20251121_103045_123456_batch_001.json
```

**DLQ File Format:**

```json
{
  "timestamp": "2025-11-21T10:30:45",
  "batch_id": "batch-001",
  "error_message": "Connection timeout to MongoDB",
  "record_count": 5,
  "failed_records": [
    { /* full analytics record */ },
    { /* full analytics record */ }
  ]
}
```

### Retry Failed Records

```python
from mongodb_utils import retry_dlq_records

# Retry a specific DLQ file
result = retry_dlq_records(
    spark_session=spark,
    dlq_filepath='./dlq/analytics_dlq_20251121_103045.json'
)

# On success, file is moved to dlq/processed/
```

## Configuration

### Environment Variables

```bash
# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/health_metrics
MONGO_DB_NAME=health_metrics
ANALYTICS_COLLECTION=analytics

# DLQ Configuration
DLQ_DIRECTORY=./dlq

# Spark Configuration
SPARK_APP_NAME=HealthMetricsAnalytics
```

### Configurable Options

- **Database name**: `MONGO_DB_NAME` (default: `health_metrics`)
- **Collection name**: `ANALYTICS_COLLECTION` (default: `analytics`)
- **DLQ directory**: `DLQ_DIRECTORY` (default: `./dlq`)
- **TTL expiration**: Set in `expiresAt` field (default: 90 days)

## Testing

### Run Test Suite

```bash
cd spark-analytics
python test_mongodb_write.py
```

### Test Coverage

1. ✅ Schema structure verification
2. ✅ Sample record generation
3. ✅ MongoDB write operations
4. ✅ Data verification (read-back)
5. ✅ Error handling with invalid data
6. ✅ DLQ functionality
7. ✅ Retry mechanism

### Expected Output

```
🧪 MONGODB ANALYTICS WRITE TEST
======================================================================
📅 Test Time: 2025-11-21T10:30:00

TEST 1: Verify Analytics Schema Structure
✅ Schema retrieved successfully
📋 Schema fields: 7

TEST 2: Build Sample Analytics Records
✅ Built 6 sample analytics records

TEST 3: Write Sample Records to MongoDB
✅ Successfully wrote 6 analytics records to MongoDB

TEST 4: Verify Data in MongoDB
✅ Found 6 test records in database

TEST 5: Test Error Handling with Invalid Data
✅ Error handling working correctly

TEST 6: Check Dead Letter Queue (DLQ)
📁 Found 1 DLQ files in ./dlq

✅ TEST SUMMARY
✅ All tests completed!
```

## Usage Examples

### Example 1: Basic Write in Batch Processing

```python
# In main.py or custom batch script
from mongodb_utils import save_analytics_to_mongodb

# After processing health metrics
analytics_df = process_health_metrics(health_data)

# Convert to structured records
analytics_list = convert_analytics_df_to_records(analytics_df)

# Write to MongoDB
result = save_analytics_to_mongodb(
    spark_session=spark,
    analytics_list=analytics_list,
    batch_id=f"batch_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
)

# Check for errors
if not result['success']:
    print(f"⚠️  Write completed with {result['records_failed']} failures")
    # Check DLQ directory for failed records
```

### Example 2: Building Custom Records

```python
from mongodb_utils import build_analytics_record

# Build a single analytics record
record = build_analytics_record(
    user_id="673f39c6b4f1e40b3c123456",
    metric_type="steps",
    time_range="7day",
    analytics_data={
        'rollingAverage': 7500.0,
        'trend': 'up',
        'trendPercentage': 12.5,
        'anomalyDetected': False,
        'streakDays': 5,
        'percentile': 75.0,
        'comparisonToPrevious': {
            'absoluteChange': 850.0,
            'percentageChange': 12.5,
            'isImprovement': True
        },
        'statistics': {
            'standardDeviation': 1250.0,
            'dataPointsCount': 7,
            'completenessPercentage': 85.7
        }
    },
    metadata={
        'sparkJobId': 'custom-job-001',
        'processingDurationMs': 1500
    }
)

# Write single record
save_analytics_to_mongodb(spark, [record], batch_id="custom-001")
```

### Example 3: Monitoring and Alerts

```python
# Monitor write operations
result = save_analytics_to_mongodb(spark, analytics_list, batch_id)

# Set up alerts for failures
if result['records_failed'] > 0:
    failure_rate = result['records_failed'] / result['records_processed']
    
    if failure_rate > 0.1:  # More than 10% failures
        send_alert(
            severity="high",
            message=f"High failure rate in analytics write: {failure_rate:.2%}",
            details=result['errors']
        )
    
    # Log to monitoring system
    log_metric("analytics.write.failures", result['records_failed'])
    log_metric("analytics.write.success_rate", 1 - failure_rate)
```

## Performance Considerations

### Batch Size

- **Recommended**: 100-1000 records per batch
- **Large batches**: May timeout on slow connections
- **Small batches**: Higher overhead per write

### Write Performance

- **Append mode**: Fast writes, no index rebuilds
- **Connection pooling**: Reuses connections across batches
- **Parallel writes**: Consider partitioning large datasets

### Memory Management

```python
# For large DataFrames, process in chunks
chunk_size = 500
total_rows = analytics_df.count()

for i in range(0, total_rows, chunk_size):
    chunk_df = analytics_df.limit(chunk_size).offset(i)
    chunk_list = convert_analytics_df_to_records(chunk_df)
    
    result = save_analytics_to_mongodb(
        spark, chunk_list, 
        batch_id=f"chunk_{i//chunk_size}"
    )
```

## Troubleshooting

### Common Issues

**Issue: Schema validation errors**
```
❌ Failed to write analytics to MongoDB: field 'trend' is required
```
**Solution**: Ensure all required fields are present in analytics_data

**Issue: Connection timeout**
```
❌ Error saving to MongoDB: Connection timeout
```
**Solution**: Check MongoDB connection, increase timeout, or reduce batch size

**Issue: Duplicate key errors**
```
❌ E11000 duplicate key error
```
**Solution**: Analytics collection has no unique constraints except `_id`. Check if writing same data twice.

### Debug Mode

Enable verbose logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)

# Spark SQL logging
spark.sparkContext.setLogLevel("INFO")
```

### Verify MongoDB Connection

```python
# Test connection before writing
from pymongo import MongoClient

client = MongoClient(os.getenv('MONGO_URI'))
db = client[os.getenv('MONGO_DB_NAME')]

# Test write permission
test_doc = {'test': 'connection', 'timestamp': datetime.now()}
db.analytics.insert_one(test_doc)
db.analytics.delete_one({'_id': test_doc['_id']})

print("✅ MongoDB connection verified")
```

## Best Practices

1. **Always use structured records**: Don't write raw DataFrames
2. **Set appropriate TTL**: Adjust `expiresAt` based on retention policy
3. **Monitor DLQ**: Regularly check and retry failed writes
4. **Batch appropriately**: Balance between throughput and reliability
5. **Add metadata**: Include Spark job info for debugging
6. **Handle errors gracefully**: Don't fail entire batch on partial errors
7. **Use append mode**: Let TTL handle cleanup automatically
8. **Validate before write**: Check schema compliance before writing
9. **Log context**: Include batch_id, user_id, metric_type in errors
10. **Test regularly**: Run test suite after code changes

## Maintenance

### Cleanup DLQ Files

```bash
# Archive processed DLQ files older than 30 days
find ./dlq/processed -name "*.json" -mtime +30 -delete

# Alert on unprocessed DLQ files
dlq_count=$(ls -1 ./dlq/*.json 2>/dev/null | wc -l)
if [ $dlq_count -gt 10 ]; then
    echo "⚠️  Warning: $dlq_count unprocessed DLQ files"
fi
```

### Monitor Collection Size

```javascript
// MongoDB shell
db.analytics.stats()

// Check TTL index
db.analytics.getIndexes()

// Count expired documents
db.analytics.countDocuments({ 
    expiresAt: { $lt: new Date() } 
})
```

### Performance Tuning

```javascript
// Add compound indexes for common queries
db.analytics.createIndex({ userId: 1, metricType: 1, timeRange: 1 })
db.analytics.createIndex({ calculatedAt: -1 })

// Monitor slow queries
db.setProfilingLevel(1, { slowms: 100 })
db.system.profile.find().sort({ ts: -1 }).limit(5)
```

## Related Documentation

- **Analytics Model**: `server/src/models/Analytics.js`
- **Main Processing**: `spark-analytics/main.py`
- **Test Suite**: `spark-analytics/test_mongodb_write.py`
- **Architecture Guide**: `spark-analytics/ANALYTICS_GUIDE.md`
- **Integration Tests**: `spark-analytics/INTEGRATION_TEST_GUIDE.md`

## Support

For issues or questions:
1. Check test output: `python test_mongodb_write.py`
2. Review DLQ files in `./dlq/`
3. Check MongoDB logs for connection issues
4. Verify environment variables are set correctly
5. Consult the Analytics model documentation
