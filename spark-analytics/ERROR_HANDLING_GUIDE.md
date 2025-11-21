# Spark Job Error Handling & Health Check System

## Overview

The Spark analytics job now includes comprehensive error handling and health monitoring capabilities:

1. **Error Handler Module** (`error_handler.py`) - Centralized error management
2. **Health Check Endpoint** (`health_check.py`) - Real-time job status monitoring  
3. **Dead-Letter Queue (DLQ)** - Failed batch storage and inspection
4. **Integration with Main Job** - Wrapped error handling in `process_batch`

This ensures the streaming job is robust, observable, and can recover from transient failures without crashing.

---

## Error Handler Module (`error_handler.py`)

### ErrorHandler Class

Provides centralized error logging and classification with specific handlers for known failure modes.

#### Methods

**`log_error(batch_id, error, error_type, context=None)`**
- Generic error logging with full stack trace
- Logs to console and batch logger
- Records timestamp, batch_id, error type, and context
- Returns formatted error details dict

**`handle_mongodb_error(batch_id, error, context=None)`**
- Handles `pymongo.errors.ServerSelectionTimeoutError`
- Logs connection timeout details
- Recommendation: "Retry after 30 seconds - Check MongoDB connection"
- Tracks in `errors_by_type['ServerSelectionTimeoutError']`

**`handle_request_timeout(batch_id, error, context=None)`**
- Handles `requests.exceptions.Timeout`
- Logs API timeout details
- Recommendation: "Retry after 60 seconds - Check API availability"
- Tracks in `errors_by_type['Timeout']`

**`handle_schema_mismatch(batch_id, error, context=None)`**
- Handles `pyspark.sql.utils.AnalysisException`
- Logs SQL schema incompatibility details
- Recommendation: "Check data schema and collection structure"
- Tracks in `errors_by_type['SchemaError']`

**`handle_generic_error(batch_id, error, context=None)`**
- Catch-all handler for unexpected exceptions
- Logs full exception details with stack trace
- Recommendation: "Review stack trace and DLQ entry"
- Tracks in `errors_by_type[exception_type]`

#### Global Error Tracking

- `ErrorHandler.total_errors` - Total error count across all batches
- `ErrorHandler.errors_by_type` - Dict mapping error types to counts
- Used by health check endpoint to report error statistics

### DeadLetterQueue Class

Persists failed batches to JSON files for manual inspection and replay.

#### Methods

**`get_dlq_filename()`**
- Returns DLQ filename with date rotation
- Format: `failed_batches_YYYYMMDD.json`
- Rotates daily (new file each day)
- Located in `spark-analytics/dlq/` directory

**`write_failed_batch(batch_id, batch_df, error_details, sample_records)`**
- Writes failed batch to DLQ JSON file
- Appends to file if it exists (JSON lines format)
- Records:
  - `batch_id`: Unique batch identifier
  - `timestamp`: ISO format timestamp
  - `error`: Error details (type, message, recommendation, action)
  - `context`: Batch context information
  - `sample_records`: First 5 records from batch for inspection
- Creates directory if it doesn't exist

**`get_dlq_stats()`**
- Returns DLQ statistics dict:
  - `total_entries`: Total failed batches in DLQ
  - `error_types`: Dict of error counts by type
  - `first_error`: Oldest failed batch details
  - `last_error`: Most recent failed batch details
  - `dlq_directory`: Path to DLQ storage

#### DLQ Storage Format

**File Location**: `spark-analytics/dlq/failed_batches_YYYYMMDD.json`

**Entry Format** (JSON lines - one entry per line):
```json
{
  "batch_id": 42,
  "timestamp": "2025-11-21T09:45:30.123456",
  "error": {
    "type": "ServerSelectionTimeoutError",
    "message": "No suitable servers found",
    "recommendation": "Retry after 30 seconds - Check MongoDB connection",
    "action": "Continue to next batch"
  },
  "context": {
    "batch_id": 42,
    "last_ts": "2025-11-21T09:40:00.000000",
    "records_queried": 0
  },
  "sample_records": [
    {"userId": "user123", "date": "2025-11-21", "steps": 8450},
    {"userId": "user456", "date": "2025-11-21", "steps": 6230}
  ]
}
```

---

## Health Check Endpoint (`health_check.py`)

Provides real-time job status monitoring via Flask HTTP endpoints.

### Server Setup

**`start_health_check_server(port=5001, debug=False)`**
- Starts Flask server in background thread (daemon)
- Runs on `0.0.0.0:port` (all interfaces, specified port)
- Non-blocking - allows Spark job to continue
- Disables Flask debug logging

### Endpoints

#### GET `/health`
Basic health status check

**Response (200 OK):**
```json
{
  "status": "healthy",
  "last_batch_id": 42,
  "last_processed_at": "2025-11-21T09:45:30.123456",
  "errors_count": 0,
  "errors_by_type": {},
  "batches_processed": 100,
  "records_processed": 15000,
  "start_time": "2025-11-21T09:00:00.000000",
  "uptime_seconds": 2730,
  "version": "1.0"
}
```

**Status Values:**
- `"healthy"` - No errors recorded
- `"degraded"` - 1-4 errors
- `"unhealthy"` - 5+ errors
- `"initializing"` - Job starting up

---

#### GET `/health/detailed`
Detailed status with metrics and recommendations

**Response (200 OK):**
```json
{
  "status": "healthy",
  "last_batch_id": 42,
  "last_processed_at": "2025-11-21T09:45:30.123456",
  "errors_count": 0,
  "errors_by_type": {},
  "batches_processed": 100,
  "records_processed": 15000,
  "start_time": "2025-11-21T09:00:00.000000",
  "uptime_seconds": 2730,
  "avg_batch_processing_time_sec": 27.3,
  "records_per_second": 5.49,
  "seconds_since_last_batch": 15,
  "recommendations": [],
  "version": "1.0"
}
```

**Recommendations Include:**
- "High error count detected - Review DLQ and error logs" (>10 errors)
- "Moderate error rate - Monitor for patterns" (5-10 errors)
- "No batches processed yet - Job may be initializing" (no batches)
- "Job appears stale (>5 min since last batch) - Check batch processing"

---

#### GET `/health/dlq`
Dead-Letter Queue statistics

**Response (200 OK):**
```json
{
  "dlq": {
    "total_entries": 3,
    "error_types": {
      "ServerSelectionTimeoutError": 2,
      "AnalysisException": 1
    },
    "first_error": {
      "batch_id": 5,
      "timestamp": "2025-11-21T08:30:00.000000",
      "error_type": "ServerSelectionTimeoutError"
    },
    "last_error": {
      "batch_id": 42,
      "timestamp": "2025-11-21T09:45:30.123456",
      "error_type": "AnalysisException"
    },
    "dlq_directory": "/path/to/spark-analytics/dlq"
  },
  "timestamp": "2025-11-21T09:50:00.123456"
}
```

---

#### GET `/health/ready`
Kubernetes-style readiness probe

**Response (200 OK) - Ready:**
```json
{"ready": true}
```

**Response (503 Service Unavailable) - Not Ready:**
```json
{
  "ready": false,
  "reason": "Job initializing or unhealthy"
}
```

**Use Case:** K8s/container orchestration - determines if traffic should be sent to pod

---

#### GET `/health/live`
Kubernetes-style liveness probe

**Response (200 OK) - Alive:**
```json
{"alive": true}
```

**Use Case:** K8s/container orchestration - determines if pod should be restarted

---

### Status Update Functions

Called from Spark job to update health check status:

**`update_batch_status(batch_id, records_processed=0)`**
- Called after successful batch completion
- Updates:
  - `last_batch_id`
  - `last_processed_at` (current timestamp)
  - `batches_processed` (increment)
  - `records_processed` (sum)
- Thread-safe with lock

**`update_error_status(error_type, increment=1)`**
- Called when error occurs
- Updates:
  - `errors_count` (increment)
  - `errors_by_type[error_type]` (increment)
  - Sets `status` to 'degraded' if errors exist
- Thread-safe with lock

**`set_job_status(status)`**
- Manually set job status
- Values: 'healthy', 'degraded', 'unhealthy', 'initializing'

---

## Integration in main.py

### Initialization

```python
# Added to imports
from error_handler import ErrorHandler, DeadLetterQueue
from health_check import start_health_check_server, update_batch_status, update_error_status

# Start server before streaming query
start_health_check_server(port=5001)
```

### Error Handling in process_batch

Enhanced exception handling with specific routing:

```python
except Exception as e:
    error_type = type(e).__name__
    error_handler = ErrorHandler()
    dlq = DeadLetterQueue()
    
    # Route to specific handler based on exception type
    if isinstance(e, ServerSelectionTimeoutError):
        error_handler.handle_mongodb_error(batch_id, e, context)
        dlq.write_failed_batch(batch_id, batch_df, error_details, sample_records)
    elif isinstance(e, requests.exceptions.Timeout):
        error_handler.handle_request_timeout(batch_id, e, context)
        dlq.write_failed_batch(batch_id, batch_df, error_details, sample_records)
    elif isinstance(e, AnalysisException):
        error_handler.handle_schema_mismatch(batch_id, e, context)
        dlq.write_failed_batch(batch_id, batch_df, error_details, sample_records)
    else:
        error_handler.handle_generic_error(batch_id, e, context)
        dlq.write_failed_batch(batch_id, batch_df, error_details, sample_records)
    
    # Update health check status
    update_error_status(error_type)
```

### Success Handling

```python
# After batch completes successfully
update_batch_status(batch_id, records_processed=records_processed)
```

---

## Workflow

### Normal Operation

1. **Startup**
   - Health check server starts on port 5001
   - `status` = 'initializing'
   - Main Spark job begins polling

2. **Batch Processing**
   - Query MongoDB for new health metrics
   - Process analytics
   - Write to MongoDB
   - Update checkpoint

3. **Success**
   - Call `update_batch_status(batch_id, records_processed)`
   - Health check reports: `status='healthy'`, `batches_processed++`, `records_processed+=count`

4. **Error Occurs**
   - Catch specific exception type
   - Route to appropriate error handler
   - Extract sample records from batch_df
   - Write to DLQ JSON file
   - Call `update_error_status(error_type)`
   - Health check reports: `status='degraded'`, `errors_count++`, `errors_by_type[type]++`

5. **Monitoring**
   - External system calls `/health` endpoint
   - Checks for health status and error count
   - Calls `/health/dlq` to inspect failed batches
   - On alert, reviews DLQ entries to understand failures

### Error Recovery

1. **Transient Error** (e.g., MongoDB timeout)
   - Error written to DLQ
   - Job continues to next batch
   - May succeed on retry (batch polling will eventually query again)

2. **Data Issue** (e.g., schema mismatch)
   - Error written to DLQ with sample records
   - Developer reviews sample records in DLQ
   - Fixes data issue or code
   - Manually replays batch if needed

3. **No Auto-Replay**
   - Current design: Failed batches go to DLQ
   - Manual replay: Extract batch info from DLQ, re-run processing
   - Future enhancement: Automatic retry with backoff

---

## Monitoring Integration

### Prometheus Metrics (Optional Future Enhancement)

Could export metrics from `/health/detailed`:
```
spark_batch_processing_time_sec gauge
spark_records_per_second gauge
spark_errors_total counter
spark_batches_processed_total counter
```

### Alerting Rules (Example)

```
alert: HighErrorRate
  condition: spark_errors_count > 5
  action: Page on-call engineer

alert: JobStale
  condition: seconds_since_last_batch > 300
  action: Investigate batch processing
```

### Dashboard Example

Query health endpoint every 30 seconds:
- Chart 1: Status (green/yellow/red)
- Chart 2: Batches processed over time
- Chart 3: Records processed per second
- Chart 4: Error count by type
- Chart 5: Uptime and restart count

---

## Testing Error Scenarios

### Test 1: MongoDB Connection Error

Temporarily stop MongoDB connection:
```bash
# Simulate by updating MONGO_URI to invalid host in .env
MONGO_URI=mongodb://invalid-host:27017/health_metrics

# Run Spark job, trigger batch processing
# Check health endpoint
curl http://localhost:5001/health
# Should show: status='degraded', errors_count=1, errors_by_type={'ServerSelectionTimeoutError': 1}

# Check DLQ
curl http://localhost:5001/health/dlq
# Should show DLQ entry with error type and sample records
```

### Test 2: API Timeout

Mock API timeout (if using external API):
```python
# In test mode, artificially raise timeout:
raise requests.exceptions.Timeout("API request timed out")

# Check health endpoint response
curl http://localhost:5001/health
# Should show: errors_by_type={'Timeout': 1}
```

### Test 3: Schema Mismatch

Change expected schema or MongoDB collection structure:
```python
# Try to process metrics with unexpected schema
# Should raise AnalysisException from Spark SQL

# Check health endpoint
curl http://localhost:5001/health
# Should show: errors_by_type={'AnalysisException': 1}
```

### Test 4: DLQ Inspection

After errors occur, inspect DLQ:
```bash
# Check DLQ stats
curl http://localhost:5001/health/dlq

# Read DLQ file
cat spark-analytics/dlq/failed_batches_*.json | python -m json.tool

# Should show entries with batch_id, error details, and sample records
```

---

## Deployment

### Docker / Container Setup

```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy code
COPY . .

# Expose health check port
EXPOSE 5001

# Run Spark job
CMD ["python", "main.py"]
```

### Port Configuration

- **Spark Job**: Runs on container
- **Health Check**: Exposed on port 5001
- **Orchestration** (K8s): Configure liveness/readiness probes on :5001/health/live and :5001/health/ready

### Environment Variables

```bash
# In .env or container env
MONGO_URI=mongodb://...
MONGO_DB_NAME=health_metrics
BATCH_INTERVAL_SECONDS=60
CHECKPOINT_LOCATION=./spark-checkpoints

# Health check uses port 5001 by default (hardcoded)
# To change: Edit health_check.py start_health_check_server(port=...)
```

---

## Best Practices

1. **Monitor Health Endpoint**
   - Set up external monitoring to query `/health` every 30-60 seconds
   - Alert if `status` becomes 'unhealthy' or `errors_count` exceeds threshold

2. **Review DLQ Regularly**
   - Check `/health/dlq` to understand failure patterns
   - Look for error type clusters (all MongoDB timeouts vs mixed)
   - Use sample records to debug data issues

3. **Act on Errors**
   - Transient errors (timeouts) may self-resolve
   - Data errors (schema mismatch) require code/schema fixes
   - Monitor trends - 1 error ok, 10+ errors needs investigation

4. **Clean Up DLQ**
   - DLQ files accumulate (one per day)
   - Archive or delete old files periodically
   - Implement cleanup job if retention becomes issue

5. **Error Handler Customization**
   - Add more specific handlers for other error types
   - Customize recommendations based on your infrastructure
   - Add retry logic if auto-recovery is needed

---

## Troubleshooting

### Health Check Not Responding

```bash
# Check if server started
curl http://localhost:5001/health
# Connection refused → Server didn't start

# Check Spark job logs for errors
# Verify Flask is installed: pip install flask

# Check if port 5001 is in use
netstat -tlnp | grep 5001
```

### DLQ Not Being Written

```bash
# Verify dlq directory exists
ls -la spark-analytics/dlq/

# Check permissions
chmod 755 spark-analytics/dlq/

# Verify error handler is being called
# Add debug prints to error_handler.py write_failed_batch()
```

### Health Check Shows Wrong Status

```bash
# Verify update functions are called
# Add logging to update_batch_status() and update_error_status()

# Check thread safety (lock being acquired)
# Review job_status_lock usage in health_check.py

# Verify time calculations
curl http://localhost:5001/health/detailed
# Compare uptime_seconds, avg_batch_processing_time_sec with actual values
```

---

## Summary

The error handling and health check system provides:

✅ **Robustness** - Specific error handlers prevent job crashes  
✅ **Observability** - Real-time health status via HTTP endpoints  
✅ **Debuggability** - Failed batches stored in DLQ with sample records  
✅ **Reliability** - Thread-safe status tracking for multi-threaded environment  
✅ **Monitoring** - Easy integration with external monitoring/alerting systems  

**Key Components:**
- `error_handler.py` - Centralized error handling and DLQ
- `health_check.py` - Flask health check endpoints
- Modified `main.py` - Integrated error handling and status updates
- `requirements.txt` - Added Flask dependency

**Next Steps:**
1. Test error scenarios using curl examples
2. Set up monitoring to query health endpoint
3. Implement alerting on error thresholds
4. Add DLQ cleanup job for production
5. Customize error handlers for your infrastructure
