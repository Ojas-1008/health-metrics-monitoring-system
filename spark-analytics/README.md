# Health Metrics Monitoring System - Spark Analytics

## Purpose
This module handles real-time health metrics analytics processing for the Health Metrics Monitoring System. It computes rolling averages, tracks activity streaks, detects anomalies, and provides percentile rankings - all while enforcing phone-only constraints.

**Architecture**: Uses a micro-batch polling pattern (not MongoDB change streams) for compatibility with standalone MongoDB instances. See [POLLING_ARCHITECTURE.md](./POLLING_ARCHITECTURE.md) for detailed architecture documentation.

**Analytics**: Comprehensive health insights including 7-day rolling averages, streak tracking, anomaly detection (2σ threshold), and percentile rankings. See [ANALYTICS_GUIDE.md](./ANALYTICS_GUIDE.md) for detailed analytics documentation.

**Windows Support**: ✅ Includes batch processing mode (`process_batch_windows.py`) to avoid Spark Streaming checkpoint issues on Windows. For streaming mode, WSL2 is recommended. See [WINDOWS_TESTING_SUMMARY.md](./WINDOWS_TESTING_SUMMARY.md) for details.

## Tech Stack
- **Language**: Python 3.9+
- **Framework**: PySpark 3.5+
- **Database Connector**: PyMongo (for MongoDB integration)

## Architecture

### Micro-Batch Polling Pattern

Since MongoDB change streams require a replica set (not available in all dev environments), this application uses a **micro-batch polling pattern** with Spark Structured Streaming:

#### How It Works

1. **Rate Stream Trigger**: Uses `spark.readStream.format('rate')` to generate trigger events
2. **Polling Interval**: Configured via `BATCH_INTERVAL_SECONDS` (default: 60 seconds)
3. **Checkpoint Management**: Maintains last processed timestamp in `last_processed_timestamp.txt`
4. **Query Pattern**: Each batch queries MongoDB for records where `updatedAt > last_timestamp`

#### `process_batch()` Function Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Load last_processed_timestamp from checkpoint file      │
│    (defaults to 30 days ago if not found)                  │
└──────────────────┬──────────────────────────────────────────┘
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Query MongoDB healthmetrics collection:                 │
│    WHERE updatedAt > last_timestamp AND userId IS NOT NULL │
└──────────────────┬──────────────────────────────────────────┘
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Process batch (calculate analytics, detect anomalies)   │
│    [To be implemented in next phase]                       │
└──────────────────┬──────────────────────────────────────────┘
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Update checkpoint: last_timestamp = MAX(updatedAt)      │
│    Save to checkpoint file for next iteration              │
└─────────────────────────────────────────────────────────────┘
```

#### Checkpoint System

The application maintains two types of checkpoints:

1. **Spark Internal Checkpoint** (`checkpointLocation`)
   - Manages Spark's internal streaming state
   - Enables recovery after crashes/restarts
   - Stores offset information

2. **Application Checkpoint** (`last_processed_timestamp.txt`)
   - Tracks the last successfully processed timestamp
   - Stored in the same checkpoint directory
   - Used to determine which records to query in next batch

#### Benefits

- ✅ **No Replica Set Required**: Works with standalone MongoDB instances
- ✅ **Fault Tolerant**: Resumes from last checkpoint after restart
- ✅ **Scalable**: Can handle large datasets with incremental processing
- ✅ **Configurable**: Adjust polling interval based on data volume
- ✅ **Testable**: Easy to test locally without complex MongoDB setup



1. **Prerequisites**:
   - Python 3.9 or higher installed.
   - Java 8 or 11 installed (required for Spark).

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Environment Configuration**:
   Copy `.env.example` to `.env` and configure your variables:
   ```bash
   cp .env.example .env
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017` |
| `MONGO_DB_NAME` | Database name | `health-metrics` |
| `ANALYTICS_COLLECTION` | Collection for storing analytics results | `analytics` |
| `DLQ_DIRECTORY` | Directory for dead-letter queue (failed writes) | `./dlq` |
| `LOG_DIRECTORY` | Directory for batch processing logs | `./logs` |
| `METRICS_DIRECTORY` | Directory for Prometheus metrics files | `./metrics` |
| `SPARK_APP_NAME` | Name of the Spark application | `HealthMetricsAnalytics` |
| `BATCH_INTERVAL_SECONDS` | Micro-batch interval in seconds | `60` |
| `CHECKPOINT_LOCATION` | Directory for Spark checkpoints | `./spark-checkpoints` |
| `BACKEND_API_URL` | Node.js backend API URL for emitting events | `http://localhost:5000/api` |

## Running Locally

### Step 1: Install Java (Required for Spark)
Spark requires Java 8 or 11. Check if you have it:
```powershell
java -version
```

If not installed:
1. Download **Java 11 (LTS)** from [Adoptium](https://adoptium.net/temurin/releases/?version=11)
2. Choose Windows x64 MSI installer
3. Install with default settings
4. Verify installation: `java -version`

### Step 2: Windows Setup (Choose Your Mode)

#### Option A: Batch Processing Mode ⭐ RECOMMENDED for Windows Testing

Run analytics in batch mode without streaming checkpoints:

```powershell
# Process existing data without streaming (no Hadoop/winutils required)
python process_batch_windows.py
```

**Pros:**
- ✅ No Hadoop binaries required
- ✅ Works immediately on Windows  
- ✅ Full analytics capabilities
- ✅ Perfect for testing and development

**Cons:**
- ⚠️ Not real-time streaming (manual execution)
- ⚠️ No automatic checkpoint-based polling

#### Option B: Streaming Mode with WSL2 (Real-Time)

For continuous streaming with checkpoint-based polling:

```powershell
# 1. Install WSL2 with Ubuntu
wsl --install -d Ubuntu-22.04

# 2. Restart computer (required)

# 3. Open WSL terminal and navigate to project
cd /mnt/c/Users/ojass/OneDrive/Documents/Web\ Development/health-metrics-monitoring-system/spark-analytics

# 4. Install Python dependencies
pip3 install -r requirements.txt

# 5. Run streaming analytics
python3 main.py
```

**Pros:**
- ✅ Full streaming capabilities
- ✅ Real-time processing with 60-second intervals
- ✅ Checkpoint-based fault tolerance
- ✅ Native Linux environment

**Cons:**
- ⚠️ Requires system reboot after WSL installation
- ⚠️ Initial setup overhead (~15 minutes)

### Step 3: Set Up Python Environment
```powershell
# Navigate to spark-analytics directory
cd spark-analytics

# Create virtual environment (if not already created)
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

### Step 4: Configure Environment Variables
```powershell
# Copy example .env file
copy .env.example .env

# Edit .env file with your MongoDB connection string
# (Already configured with your Atlas URI)
```

### Step 5: Test MongoDB Connection (Optional but Recommended)
```powershell
python test_mongo_connection.py
```

Expected output:
```
✅ MongoDB Connection Successful!
📊 Total documents in 'healthmetrics': 22
✅ MongoDB is accessible and contains data!
```

### Step 6: Run Analytics

#### Batch Processing (Windows - Recommended)
```powershell
# Process all recent health metrics and compute analytics
python process_batch_windows.py
```

Expected output:
```
🚀 BATCH ANALYTICS PROCESSING (Windows Compatible)
📅 Run Time: 2025-11-20T23:17:00
📊 Database: health_metrics

✅ Spark session created
📊 Found 30 recent records

🔄 Processing analytics (this may take a minute)...

✅ Flattened to 120 metric records
✅ Computed 7-day rolling averages
✅ Calculated activity streaks
✅ Detected anomalies (2σ threshold)
✅ Computed percentile rankings (90-day window)
✅ Analyzed trends (week-over-week)

✅ Generated 400 analytics records

📊 ANALYTICS RESULTS
============================================================
📈 7-Day Rolling Averages (Steps - Last 15 days):
[Displays rolling averages table]

⚠️  Detected Anomalies:
Found 11 anomalies:
[Shows anomalies with Z-scores]

💾 Saving analytics to MongoDB...
✅ Analytics saved successfully to 'analytics' collection

✅ BATCH PROCESSING COMPLETED
```

#### Streaming Mode (WSL2 or Linux)
```bash
# Using Python directly
python main.py

# OR using spark-submit (recommended for production)
spark-submit --packages org.mongodb.spark:mongo-spark-connector_2.12:10.3.0 main.py
```

Expected output:
```
🚀 Starting Spark Application: HealthMetricsAnalytics
📡 Connecting to MongoDB Database: health_metrics
✅ Spark Session Initialized
🚀 Starting micro-batch polling stream
⏱️  Polling interval: 60 seconds
📂 Checkpoint location: ./spark-checkpoints
✅ Streaming query started
🔄 Polling for new health metrics every 60 seconds
Press Ctrl+C to stop the stream...
```

### Troubleshooting

**Error: "CreateProcess error=193, %1 is not a valid Win32 application"**
- This occurs with Spark Streaming on Windows (winutils.exe requirement)
- **Solution**: Use `process_batch_windows.py` instead of `main.py`
- OR: Set up WSL2 for full streaming support (see Step 2, Option B)

**Error: "Java not found"**
- Install Java 11 from Step 1
- Verify: `java -version` shows Java 11

**MongoDB Connection Error:**
- Check `.env` file has correct `MONGO_URI`
- Verify internet connection to MongoDB Atlas
- Run `python test_mongo_connection.py` to isolate the issue

**Error: "No records to process"**
- Check MongoDB has health metrics with recent `updatedAt` timestamps
- Run `python inspect_database.py` to view database contents
- Verify test data: `python test_analytics_patterns.py`

**Slow Startup:**
- First run downloads MongoDB connector JARs (~50MB)
- Subsequent runs will be faster (JARs are cached)

**WSL Installation Issues:**
- After `wsl --install`, restart your computer
- Verify installation: `wsl --list --verbose`
- If distribution not installed: `wsl --install -d Ubuntu-22.04`

### Quick Test
```powershell
# Test MongoDB connection (no Spark required)
python test_mongo_connection.py

# Inspect database contents
python inspect_database.py

# Verify test data patterns
python verify_test_data.py

# Run full batch analytics (Windows)
python process_batch_windows.py
```

## Deployment Notes

### Cloud Deployment (AWS EMR / Databricks)
For production environments, this application is designed to run on distributed Spark clusters.

- **AWS EMR**: Submit the job as a step in an EMR cluster. Ensure the MongoDB connector jar is available in the classpath or provided via `--packages`.
- **Databricks**: Create a job pointing to the main python script. Use Databricks secrets for sensitive environment variables like `MONGO_URI`.

### MongoDB Connector
Ensure the correct version of the MongoDB Spark Connector is used compatible with Spark 3.5.

## Testing

### Pattern-Based Analytics Testing

```powershell
# Insert test data with known patterns and verify analytics
python test_analytics_patterns.py
```

This test:
- ✅ Inserts 14 days of health metrics with specific patterns
- ✅ Includes steadily increasing steps (7000→10000)
- ✅ Creates a missing day for streak break testing
- ✅ Injects an 18,000-step spike for anomaly detection
- ✅ Validates all analytics computations

**Expected Test Patterns:**
- Days 1-7: Increasing steps (7000, 7500, 8000, 8500, 9000, 9500, 10000)
- Day 8: **Missing** (tests streak reset)
- Days 9-12: Consistent 8500 steps
- Day 13: **18,000 steps SPIKE** (anomaly detection ⚠️)
- Days 14-15: Return to 8200 steps

### Database Inspection

```powershell
# View database contents and structure
python inspect_database.py

# Verify test data with pandas-based analytics
python verify_test_data.py
```

### Test Checkpoint and Polling Logic

```powershell
# Run the test suite
python test_polling.py
```

This tests:
- ✅ Checkpoint save/load functionality
- ✅ Default timestamp handling (30 days ago)
- ✅ MongoDB query pattern with timestamp filters
- ✅ Environment variable configuration

### Test Output

```
🚀 Micro-Batch Polling Implementation Test Suite
============================================================

🧪 Testing Environment Configuration
============================================================
  ✅ MONGO_URI: mongodb+srv://...
  ✅ MONGO_DB_NAME: health-metrics
  ✅ SPARK_APP_NAME: HealthMetricsAnalytics
  ✅ BATCH_INTERVAL_SECONDS: 60
  ✅ CHECKPOINT_LOCATION: ./spark-checkpoints
✅ All environment variables configured!

🧪 Testing Checkpoint Functions
============================================================
  ✅ Default timestamp: 2025-10-21T10:00:00
  ✅ Saved and loaded timestamp: 2025-11-15T10:00:00
  ✅ Updated timestamp: 2025-11-19T10:00:00
✅ All checkpoint tests passed!

🧪 Testing MongoDB Query Pattern
============================================================
  📊 Total records in healthmetrics: 150
  📊 Records updated in last 30 days: 45
  📅 Latest updatedAt timestamp: 2025-11-20T09:55:00
✅ MongoDB query test passed!

🎉 All tests completed successfully!
```

## Analytics Results Summary

**Latest Test Run (November 20, 2025):**

✅ **Successfully Processed:**
- 30 health metric records from last 30 days
- 400 analytics records generated
- 11 anomalies detected
- 263 trending metrics identified

**Key Findings:**
- 📈 **Rolling Averages**: Correctly computed 7-day rolling averages for all metrics
- 🔥 **Activity Streaks**: Identified 6-day current streak
- ⚠️ **Anomaly Detection**: Successfully flagged 18,000-step spike (Nov 17) and 23,000-step spike (Nov 13)
- 📊 **Percentile Rankings**: Computed 90-day percentiles for all metrics
- 📈 **Trend Analysis**: Identified 263 increasing/decreasing trends

**Validation Status:**
- ✅ Test patterns correctly inserted
- ✅ Streak reset on missing day
- ✅ Anomaly detection working (2σ threshold)
- ✅ Rolling averages computed accurately
- ✅ All analytics saved to MongoDB

## Quick Reference

### Key Files

**Core Application:**
- **`main.py`** - Main Spark streaming application with polling logic (WSL/Linux)
- **`process_batch_windows.py`** - Windows-compatible batch analytics processor ⭐ NEW

**Testing & Validation:**
- **`test_analytics_patterns.py`** - Pattern-based analytics testing (500+ lines)
- **`test_polling.py`** - Test suite for polling implementation
- **`test_mongo_connection.py`** - MongoDB connectivity test
- **`inspect_database.py`** - Database structure inspector
- **`verify_test_data.py`** - Pandas-based analytics verification

**Documentation:**
- **`POLLING_ARCHITECTURE.md`** - Detailed architecture documentation
- **`ANALYTICS_GUIDE.md`** - Complete analytics implementation guide
- **`INTEGRATION_TEST_GUIDE.md`** - Integration testing procedures
- **`WINDOWS_TESTING_SUMMARY.md`** - Windows-specific setup and results ⭐ NEW
- **`TESTING.md`** - Quick testing reference

**Configuration:**
- **`.env`** - Environment configuration (create from `.env.example`)
- **`requirements.txt`** - Python dependencies

### Key Functions

```python
# Load last processed timestamp from checkpoint
def get_last_processed_timestamp(checkpoint_dir) -> datetime

# Save checkpoint timestamp
def save_last_processed_timestamp(checkpoint_dir, timestamp)

# Main batch processing function
def process_batch(batch_df, batch_id)
```

### Checkpoint Management

```powershell
# View current checkpoint
cat .\spark-checkpoints\last_processed_timestamp.txt

# Reset checkpoint to 7 days ago
$date = (Get-Date).AddDays(-7).ToString("yyyy-MM-ddTHH:mm:ss")
Set-Content .\spark-checkpoints\last_processed_timestamp.txt $date

# Delete checkpoint (reprocess last 30 days)
Remove-Item .\spark-checkpoints\last_processed_timestamp.txt
```

### Common Commands

```powershell
# Start the streaming application
python main.py

# Run tests
python test_polling.py

# Test MongoDB connection
python test_mongo_connection.py

# Test MongoDB write operations
python test_mongodb_write.py

# Check Spark logs (if errors occur)
ls .\spark-warehouse\
```

## MongoDB Write Operations

The analytics system writes processed results to MongoDB using a structured schema that matches the Mongoose Analytics model. See **[MONGODB_WRITE_GUIDE.md](./MONGODB_WRITE_GUIDE.md)** for complete documentation.

### Key Features

- ✅ **Schema Validation**: DataFrame schema matches Mongoose Analytics model exactly
- ✅ **Upsert Logic**: Prevents duplicates by replacing existing analytics with newer timestamps
- ✅ **Timestamp Comparison**: Only updates if new `calculatedAt` is newer than existing
- ✅ **Detailed Logging**: Logs each operation as insert, update, or skip with metric values
- ✅ **Error Handling**: Comprehensive error catching with detailed logging
- ✅ **Dead-Letter Queue**: Failed records saved to DLQ for retry
- ✅ **Retry Mechanism**: Automatic retry of failed writes from DLQ
- ✅ **Batch Context**: All writes tagged with batch_id for traceability

### Upsert Logic

To prevent duplicate analytics entries for the same user/metric/timeRange, the system implements an intelligent upsert pattern:

1. **Unique Filter**: Each document is identified by the tuple `(userId, metricType, timeRange)`
2. **Timestamp Comparison**: Before writing, the system checks if an existing document exists
3. **Smart Decision**:
   - If no existing document: **INSERT** (new analytics)
   - If existing document with older timestamp: **UPDATE** (replace with newer data)
   - If existing document with same or newer timestamp: **SKIP** (keep existing data)

This ensures:
- Only the most recent analytics per user/metric/timeRange are stored
- No manual deduplication needed in backend queries
- Simple retrieval with `getLatestAnalytics` endpoint
- Reduced storage overhead

**Example Log Output**:
```
📊 Upserting 5 analytics records to MongoDB...
   🆕 INSERT: userId=123, metric=steps, range=7day
      Values: rollingAvg=8500.0, trend=up, anomaly=False
   🔄 UPDATE: userId=123, metric=calories, range=7day
      Values: rollingAvg=2500.0, trend=stable, anomaly=False
   ⏭️  Skipped (userId=123, metric=weight, range=7day): existing timestamp 2025-11-21T10:00:00 >= new 2025-11-21T09:00:00

✅ Successfully upserted analytics records to MongoDB
   📥 Inserts: 3
   🔄 Updates: 1
   ⏭️  Skipped: 1
```

### Quick Start

```python
from mongodb_utils import save_analytics_to_mongodb

# Convert analytics DataFrame to structured records
analytics_list = convert_analytics_df_to_records(analytics_df)

# Write to MongoDB
result = save_analytics_to_mongodb(
    spark_session=spark,
    analytics_list=analytics_list,
    batch_id="batch-001"
)

# Check results
print(f"Written: {result['records_written']}")
print(f"Failed: {result['records_failed']}")
```

### Schema Structure

Analytics records have the following nested structure:

```python
{
  'userId': str,                    # User ObjectId
  'metricType': str,                # 'steps', 'calories', etc.
  'timeRange': str,                 # '7day', '30day', '90day'
  'analytics': {
    'rollingAverage': float,        # Required
    'trend': str,                   # 'up', 'down', 'stable'
    'anomalyDetected': bool,
    'streakDays': int,
    'percentile': float,
    'comparisonToPrevious': {...},
    'statistics': {...}
  },
  'calculatedAt': datetime,         # Required
  'expiresAt': datetime,            # TTL (90 days)
  'metadata': {...}                 # Optional Spark metadata
}
```

### Testing

```powershell
# Run comprehensive test suite
python test_mongodb_write.py
```

## Batch Processing Logging & Monitoring

The analytics system includes comprehensive logging and monitoring capabilities for tracking batch processing performance, errors, and metrics.

### Features

- ✅ **Structured Logging**: JSON log files for machine analysis + human-readable console output
- ✅ **Batch Statistics**: Tracks records processed, analytics computed, write operations, errors
- ✅ **Processing Time Metrics**: Millisecond-precision timing for each batch
- ✅ **Emoji Indicators**: Visual success/failure indicators in console output
- ✅ **Session Summaries**: Aggregated statistics across all batches in a session
- ✅ **Prometheus Integration**: Metrics file in Prometheus text format for monitoring
- ✅ **Batch History Export**: Complete processing history exported to JSON

### Log Output Formats

#### Console Output (Human-Readable)

**Successful Batch:**
```
✅ Batch batch_123 completed: 50 records → 20 analytics (450ms)
   📥 Inserts: 15 | 🔄 Updates: 5 | ⏭️  Skipped: 0
```

**Failed Batch:**
```
❌ Batch batch_124 failed: MongoDB write error
   Records Processed: 50
   Analytics Computed: 20
   Errors: 1
   Processing Time: 1200ms
```

#### JSON Log Files (Machine-Readable)

Location: `./logs/batch_logs_YYYYMMDD.jsonl` (JSON Lines format)

```json
{
  "batch_id": "batch_123",
  "start_time": "2025-11-21T10:00:00.123456",
  "end_time": "2025-11-21T10:00:00.573456",
  "processing_time_ms": 450,
  "records_processed": 50,
  "analytics_computed": 20,
  "analytics_written": 20,
  "analytics_inserted": 15,
  "analytics_updated": 5,
  "analytics_skipped": 0,
  "errors_count": 0,
  "errors": null,
  "success": true,
  "status": "completed"
}
```

### Prometheus Metrics

Location: `./metrics/spark_analytics_metrics.prom`

**Available Metrics:**
- `batches_processed_total` - Total batches processed (counter)
- `batches_succeeded_total` - Successful batches (counter)
- `batches_failed_total` - Failed batches (counter)
- `analytics_written_total` - Total analytics written (counter)
- `analytics_inserted_total` - New analytics inserted (counter)
- `analytics_updated_total` - Analytics updated (counter)
- `analytics_skipped_total` - Analytics skipped (counter)
- `records_processed_total` - Health metrics processed (counter)
- `errors_total` - Total errors encountered (counter)
- `processing_time_seconds` - Total processing time (gauge)
- `average_processing_time_ms` - Average time per batch (gauge)

**Example Metrics File:**
```
# HELP batches_processed_total Total number of batches processed
# TYPE batches_processed_total counter
batches_processed_total 42 1732188000000

# HELP analytics_written_total Total number of analytics records written
# TYPE analytics_written_total counter
analytics_written_total 840 1732188000000

# HELP average_processing_time_ms Average processing time per batch in milliseconds
# TYPE average_processing_time_ms gauge
average_processing_time_ms 325.50 1732188000000
```

### Monitoring Integration

#### Option 1: Prometheus File Scraping

Configure Prometheus to scrape the metrics file:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'spark_analytics'
    file_sd_configs:
      - files:
        - '/path/to/spark-analytics/metrics/*.prom'
```

#### Option 2: Custom HTTP Exporter

Create a simple HTTP server to expose metrics:

```python
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path

class MetricsHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/metrics':
            metrics_file = Path('./metrics/spark_analytics_metrics.prom')
            if metrics_file.exists():
                self.send_response(200)
                self.send_header('Content-Type', 'text/plain')
                self.end_headers()
                self.wfile.write(metrics_file.read_bytes())
            else:
                self.send_response(404)
                self.end_headers()

server = HTTPServer(('0.0.0.0', 9090), MetricsHandler)
server.serve_forever()
```

#### Option 3: Datadog Integration

Parse JSON logs and send to Datadog:

```python
import json
from datadog import initialize, api

initialize(api_key='YOUR_API_KEY', app_key='YOUR_APP_KEY')

# Read latest batch log
with open('./logs/batch_logs_20251121.jsonl', 'r') as f:
    for line in f:
        batch = json.loads(line)
        api.Metric.send(
            metric='spark.batch.processing_time',
            points=[(batch['end_time'], batch['processing_time_ms'])],
            tags=[f"status:{batch['status']}", f"batch:{batch['batch_id']}"]
        )
```

### Session Summary

At the end of each session, a comprehensive summary is printed and exported:

```
================================================================================
📊 BATCH PROCESSING SESSION SUMMARY
================================================================================

⏱️  Session Duration: 3600.00 seconds

📦 Batches:
   Total: 42
   ✅ Succeeded: 40
   ❌ Failed: 2
   Success Rate: 95.2%

📊 Analytics:
   Total Written: 840
   📥 Inserted: 600
   🔄 Updated: 220
   ⏭️  Skipped: 20

📈 Processing:
   Records Processed: 2100
   Total Time: 13680ms
   Average Time: 325.71ms per batch

⚠️  Errors: 2

================================================================================
```

### Testing the Logger

```bash
# Test batch logger functionality
python test_batch_logger.py
```

Expected output demonstrates:
- ✅ Successful batch logging with statistics
- ❌ Failed batch logging with error details
- 📦 Multiple batch processing
- ⚠️  Partial success with warnings
- 📊 Session summary generation
- 📁 Log file creation and verification
- 📈 Metrics file creation
- 📤 Batch history export

### Log Analysis

#### Query Successful Batches
```bash
# Using jq to analyze JSON logs
cat logs/batch_logs_*.jsonl | jq 'select(.success == true)'
```

#### Calculate Average Processing Time
```bash
cat logs/batch_logs_*.jsonl | jq '.processing_time_ms' | awk '{sum+=$1; count++} END {print sum/count " ms"}'
```

#### Find Failed Batches
```bash
cat logs/batch_logs_*.jsonl | jq 'select(.success == false) | {batch_id, errors}'
```

#### Aggregate Statistics
```python
import json

stats = {'total': 0, 'success': 0, 'failed': 0, 'total_time': 0}

with open('./logs/batch_logs_20251121.jsonl', 'r') as f:
    for line in f:
        batch = json.loads(line)
        stats['total'] += 1
        stats['total_time'] += batch['processing_time_ms']
        if batch['success']:
            stats['success'] += 1
        else:
            stats['failed'] += 1

print(f"Success Rate: {stats['success']/stats['total']*100:.1f}%")
print(f"Average Time: {stats['total_time']/stats['total']:.2f}ms")
```

Tests include:
- ✅ Schema structure verification
- ✅ Sample record generation
- ✅ MongoDB write operations
- ✅ Data verification (read-back)
- ✅ Error handling with invalid data
- ✅ DLQ functionality

### Dead-Letter Queue (DLQ)

Failed writes are automatically saved to `./dlq/` directory:

```powershell
# Check DLQ files
ls .\dlq\

# Retry a DLQ file
python -c "from mongodb_utils import retry_dlq_records; from pyspark.sql import SparkSession; spark = SparkSession.builder.appName('Retry').getOrCreate(); retry_dlq_records(spark, './dlq/analytics_dlq_20251121_103045.json')"
```

## Documentation

- **[MONGODB_WRITE_GUIDE.md](./MONGODB_WRITE_GUIDE.md)** - MongoDB write configuration and error handling ⭐ NEW
- **[WINDOWS_TESTING_SUMMARY.md](./WINDOWS_TESTING_SUMMARY.md)** - Windows setup guide and test results
- **[ANALYTICS_GUIDE.md](./ANALYTICS_GUIDE.md)** - Complete analytics implementation guide
- **[POLLING_ARCHITECTURE.md](./POLLING_ARCHITECTURE.md)** - Complete architecture guide with diagrams
- **[INTEGRATION_TEST_GUIDE.md](./INTEGRATION_TEST_GUIDE.md)** - Integration testing procedures  
- **[TESTING.md](./TESTING.md)** - Quick testing reference
- **[README.md](./README.md)** (this file) - Setup and quick start guide
- **Main Project Docs**:
  - [../ARCHITECTURE.md](../ARCHITECTURE.md) - Overall system architecture
  - [../TECH_STACK.md](../TECH_STACK.md) - Technology stack details
