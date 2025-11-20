# Micro-Batch Polling Architecture

## Overview

The Spark analytics system uses a **micro-batch polling pattern** instead of MongoDB change streams, making it compatible with standalone MongoDB instances (no replica set required).

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Spark Structured Streaming                      │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Rate Source (rowsPerSecond=1)                             │    │
│  │  Generates trigger events                                  │    │
│  └──────────────────────────┬─────────────────────────────────┘    │
│                             │                                        │
│                             ▼                                        │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Trigger (processingTime = BATCH_INTERVAL_SECONDS)         │    │
│  │  Default: 60 seconds                                       │    │
│  └──────────────────────────┬─────────────────────────────────┘    │
│                             │                                        │
│                             ▼                                        │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  foreachBatch(process_batch)                               │    │
│  │  Executes polling logic for each micro-batch               │    │
│  └──────────────────────────┬─────────────────────────────────┘    │
│                             │                                        │
└─────────────────────────────┼─────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      process_batch(batch_df, batch_id)              │
│                                                                       │
│  1. Load Checkpoint                                                  │
│     ┌───────────────────────────────────────┐                      │
│     │ Read last_processed_timestamp.txt     │                      │
│     │ Default: NOW - 30 days                │                      │
│     └───────────────┬───────────────────────┘                      │
│                     │                                                │
│                     ▼                                                │
│  2. Query MongoDB                                                    │
│     ┌───────────────────────────────────────┐                      │
│     │ SELECT * FROM healthmetrics           │                      │
│     │ WHERE updatedAt > last_timestamp      │                      │
│     │   AND userId IS NOT NULL              │                      │
│     └───────────────┬───────────────────────┘                      │
│                     │                                                │
│                     ▼                                                │
│  3. Process Batch                                                    │
│     ┌───────────────────────────────────────┐                      │
│     │ - Calculate analytics                 │                      │
│     │ - Detect anomalies                    │                      │
│     │ - Track streaks                       │                      │
│     │ - Compute rolling averages            │                      │
│     └───────────────┬───────────────────────┘                      │
│                     │                                                │
│                     ▼                                                │
│  4. Update Checkpoint                                                │
│     ┌───────────────────────────────────────┐                      │
│     │ new_timestamp = MAX(updatedAt)        │                      │
│     │ Save to last_processed_timestamp.txt  │                      │
│     └───────────────────────────────────────┘                      │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Rate Source Stream

```python
polling_stream = spark.readStream \
    .format("rate") \
    .option("rowsPerSecond", 1) \
    .load()
```

- **Purpose**: Generates a continuous stream of trigger events
- **Frequency**: 1 row per second (controlled by trigger, not this setting)
- **Output**: DataFrame with `timestamp` and `value` columns

### 2. Processing Trigger

```python
.trigger(processingTime=f"{batch_interval} seconds")
```

- **Purpose**: Controls how often `process_batch` is called
- **Configuration**: `BATCH_INTERVAL_SECONDS` environment variable (default: 60)
- **Behavior**: Waits for specified interval between micro-batch executions

### 3. foreachBatch Sink

```python
.foreachBatch(process_batch)
```

- **Purpose**: Custom logic for each micro-batch
- **Function**: `process_batch(batch_df, batch_id)`
- **Execution**: Runs synchronously for each batch

### 4. Checkpoint Management

#### Spark Internal Checkpoint

```python
.option("checkpointLocation", checkpoint_location)
```

- **Location**: `./spark-checkpoints` (configurable via `CHECKPOINT_LOCATION`)
- **Purpose**: Manages Spark's internal streaming state
- **Contents**: 
  - Offset tracking
  - Source metadata
  - Sink commit information

#### Application Checkpoint

```
./spark-checkpoints/last_processed_timestamp.txt
```

- **Format**: ISO 8601 timestamp string
- **Purpose**: Tracks last successfully processed MongoDB record
- **Usage**: Determines starting point for next query
- **Default**: 30 days ago if file doesn't exist

## Data Flow Example

### Initial Run (No Checkpoint)

```
Time: 2025-11-20 10:00:00

1. Load checkpoint: None found
   → Default to 2025-10-21 10:00:00 (30 days ago)

2. Query MongoDB:
   → WHERE updatedAt > '2025-10-21T10:00:00'
   → Found 150 records

3. Process batch:
   → Calculate analytics for 150 records
   
4. Update checkpoint:
   → MAX(updatedAt) = '2025-11-20T09:55:00'
   → Save to last_processed_timestamp.txt
```

### Second Run (60 seconds later)

```
Time: 2025-11-20 10:01:00

1. Load checkpoint: 2025-11-20T09:55:00

2. Query MongoDB:
   → WHERE updatedAt > '2025-11-20T09:55:00'
   → Found 3 new records

3. Process batch:
   → Calculate analytics for 3 records
   
4. Update checkpoint:
   → MAX(updatedAt) = '2025-11-20T10:00:45'
   → Save to last_processed_timestamp.txt
```

### After Restart

```
Time: 2025-11-20 11:30:00

1. Load checkpoint: 2025-11-20T10:00:45
   → Resumes from last successful batch

2. Query MongoDB:
   → WHERE updatedAt > '2025-11-20T10:00:45'
   → Found 95 records (accumulated during downtime)

3. Process batch:
   → Calculate analytics for 95 records
   
4. Update checkpoint:
   → MAX(updatedAt) = '2025-11-20T11:29:30'
   → Save to last_processed_timestamp.txt
```

## Configuration

### Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `BATCH_INTERVAL_SECONDS` | Polling frequency | `60` |
| `CHECKPOINT_LOCATION` | Checkpoint directory | `./spark-checkpoints` |
| `MONGO_URI` | MongoDB connection | Required |
| `MONGO_DB_NAME` | Database name | Required |

### Tuning Guidelines

#### Polling Interval

- **Low Volume** (< 100 records/minute): 60-300 seconds
- **Medium Volume** (100-1000 records/minute): 30-60 seconds  
- **High Volume** (> 1000 records/minute): 10-30 seconds

#### Considerations

1. **Latency vs Load**
   - Shorter intervals = lower latency, higher database load
   - Longer intervals = higher latency, lower database load

2. **Batch Size**
   - Too small: Inefficient processing overhead
   - Too large: Higher memory usage, longer processing time

3. **MongoDB Performance**
   - Ensure `updatedAt` field is indexed
   - Use compound index: `(userId: 1, updatedAt: 1)`

## Advantages Over Change Streams

### ✅ Benefits

1. **No Replica Set Required**
   - Works with standalone MongoDB instances
   - Simpler development environment setup
   - Lower infrastructure costs

2. **Fault Tolerant**
   - Automatic recovery after crashes
   - Checkpoint-based resume capability
   - No lost data during downtime

3. **Configurable Latency**
   - Adjust polling interval based on requirements
   - Balance between real-time and efficiency

4. **Predictable Resource Usage**
   - Controlled batch sizes
   - Scheduled execution
   - Easier capacity planning

5. **Testable**
   - Simple local testing
   - No complex MongoDB setup
   - Easy debugging

### ⚠️ Tradeoffs

1. **Not True Real-Time**
   - Minimum latency = polling interval
   - Change streams have sub-second latency

2. **Polling Overhead**
   - Queries even when no new data
   - Network and database load per interval

3. **Eventual Consistency**
   - Brief delay between write and processing
   - Not suitable for millisecond-critical applications

## Best Practices

### 1. Index Optimization

```javascript
// MongoDB indexes
db.healthmetrics.createIndex({ userId: 1, updatedAt: 1 })
db.healthmetrics.createIndex({ updatedAt: 1 })
```

### 2. Error Handling

```python
def process_batch(batch_df, batch_id):
    try:
        # Processing logic
        pass
    except Exception as e:
        # Log error but don't update checkpoint
        # Next batch will retry failed records
        print(f"Error in batch {batch_id}: {e}")
```

### 3. Monitoring

- Track batch processing time
- Monitor record counts per batch
- Alert on checkpoint lag (time since last update)

### 4. Checkpointing Strategy

- Save checkpoint AFTER successful processing
- Don't update on errors (enables retry)
- Periodically backup checkpoint files

## Troubleshooting

### Issue: No Data Being Processed

**Check:**
1. MongoDB has records with recent `updatedAt`
2. Checkpoint timestamp is not too recent
3. `userId` field is not null in records
4. MongoDB connection is working

**Solution:**
```bash
# Reset checkpoint to reprocess last 7 days
echo "2025-11-13T00:00:00" > ./spark-checkpoints/last_processed_timestamp.txt
```

### Issue: Processing Same Data Multiple Times

**Check:**
1. Checkpoint not being saved (write permissions)
2. Multiple Spark instances using same checkpoint
3. Checkpoint being reset externally

**Solution:**
- Verify checkpoint file is writable
- Use unique checkpoint locations per instance
- Check for automated cleanup scripts

### Issue: High Database Load

**Check:**
1. Polling interval too short
2. Large batch sizes
3. Missing indexes on MongoDB

**Solution:**
- Increase `BATCH_INTERVAL_SECONDS`
- Add indexes on `updatedAt` and `userId`
- Use query projection to reduce data transfer

## Future Enhancements

1. **Adaptive Polling**
   - Adjust interval based on data volume
   - Faster polling during active periods

2. **Parallel Processing**
   - Partition by userId for parallel processing
   - Scale across multiple Spark workers

3. **Delta Lake Integration**
   - Store processed results in Delta Lake
   - Enable time-travel queries

4. **Metrics & Monitoring**
   - Expose Prometheus metrics
   - Grafana dashboards for monitoring
