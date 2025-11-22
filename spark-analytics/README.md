# Health Metrics Monitoring System - Spark Analytics

## Overview

The Spark Analytics module is a distributed data processing pipeline that computes comprehensive health insights from user health metrics data. It processes health metrics in micro-batches, calculates advanced analytics (rolling averages, streaks, anomalies, percentiles), stores results in MongoDB, and emits real-time events to the backend SSE system for instant dashboard updates.

### Key Capabilities

- **Phone-Only Constraint Enforcement**: Filters and validates health metrics to exclude wearable-only data (heart rate, blood oxygen)
- **Advanced Analytics Computation**: 7-day rolling averages, activity streak tracking, anomaly detection (2σ threshold), percentile rankings (90-day window), trend analysis
- **Real-Time Event Emission**: Automatically notifies backend SSE system after analytics are computed, enabling live frontend updates
- **Intelligent Batching**: Smart event aggregation reduces HTTP requests by 93%+ during bulk processing (e.g., 30-day sync)
- **Micro-Batch Polling**: No MongoDB replica set required - works with standalone MongoDB instances
- **Windows Compatibility**: Batch processing mode bypasses Spark Streaming checkpoint issues on Windows
- **Comprehensive Monitoring**: Health check endpoints, structured logging, metrics tracking, error handling with DLQ

### Architecture Pattern

Uses a **micro-batch polling pattern** (not MongoDB change streams) for maximum compatibility:
- Spark Structured Streaming with rate source triggers
- Configurable polling interval (default: 60 seconds)
- Checkpoint-based state management for crash recovery
- Incremental processing (only new/updated records)

See [POLLING_ARCHITECTURE.md](./POLLING_ARCHITECTURE.md) for detailed architecture documentation.

## Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Language** | Python | 3.9+ |
| **Processing Framework** | Apache Spark (PySpark) | 3.5.0 |
| **Database Connector** | PyMongo | 4.6.1 |
| **HTTP Client** | Requests | 2.31.0 |
| **Web Framework** | Flask | 3.0.0 (health checks) |
| **Configuration** | python-dotenv | 1.0.0 |
| **Data Analysis** | Pandas | 2.1.0+ |
| **Spark Connector** | MongoDB Spark Connector | 10.3.0 (Scala 2.12) |

## Installation & Setup

### Prerequisites

**Required Software**:
- **Python 3.9 or higher** - [Download](https://www.python.org/downloads/)
- **Java 11** - [Download OpenJDK](https://adoptium.net/temurin/releases/?version=11)
- **MongoDB** - Running instance (local or Atlas)
- **Backend Server** - Health Metrics backend API running on port 5000

**Platform Considerations**:
- **Linux/Mac**: Full Spark Streaming support with checkpoints
- **Windows**: 
  - **Option 1** (Recommended): Use WSL2 with Ubuntu for native Spark support
  - **Option 2**: Use batch processing mode (`process_batch_windows.py`) to avoid checkpoint issues
  - See [WINDOWS_TESTING_SUMMARY.md](./WINDOWS_TESTING_SUMMARY.md) for detailed Windows guidance

### Quick Setup (Automated - Windows)

```powershell
# Navigate to spark-analytics directory
cd spark-analytics

# Run setup script
.\setup_windows.ps1
```

This script will:
1. Verify Python and Java installations
2. Create Python virtual environment
3. Install all dependencies from `requirements.txt`
4. Create `.env` file from `.env.example`
5. Create required directories (hadoop, spark-checkpoints, dlq, etc.)
6. Test MongoDB connection

### Manual Setup

**1. Create Virtual Environment**:
```bash
# Linux/Mac/WSL
python3 -m venv venv
source venv/bin/activate

# Windows PowerShell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**2. Install Dependencies**:
```bash
pip install -r requirements.txt
```

**3. Configure Environment Variables**:

Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

Edit `.env` with your settings (see Configuration section below).

**4. Create Required Directories**:
```bash
# Linux/Mac/WSL
mkdir -p hadoop/bin spark-checkpoints spark-local dlq logs metrics

# Windows PowerShell
New-Item -ItemType Directory -Path "hadoop\bin","spark-checkpoints","spark-local","dlq","logs","metrics" -Force
```

**5. Verify MongoDB Connection**:
```bash
python test_mongo_connection.py
```

Expected output:
```
🔍 Testing MongoDB Connection
✅ MongoDB connection successful!
📊 Database: health_metrics
📁 Collections: users, healthmetrics, analytics, ...
```

### Configuration

Create a `.env` file in the `spark-analytics` directory with the following variables:

```bash
# ============================================================================
# MongoDB Configuration
# ============================================================================
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGO_DB_NAME=health_metrics
ANALYTICS_COLLECTION=analytics

# ============================================================================
# Spark Application Configuration
# ============================================================================
SPARK_APP_NAME=HealthMetricsAnalytics
BATCH_INTERVAL_SECONDS=60
CHECKPOINT_LOCATION=./spark-checkpoints

# ============================================================================
# Backend API Configuration (Real-Time Events)
# ============================================================================
BACKEND_API_URL=http://localhost:5000
SERVICE_TOKEN=your_shared_secret_token_change_in_production

# ============================================================================
# Monitoring & Health Check Configuration (Optional)
# ============================================================================
HEALTH_CHECK_PORT=5001
HEALTH_CHECK_HOST=0.0.0.0
LOG_DIRECTORY=./logs
METRICS_DIRECTORY=./metrics
DLQ_DIRECTORY=./dlq

# ============================================================================
# Debugging (Optional)
# ============================================================================
# SPARK_LOG_LEVEL=WARN  # Options: DEBUG, INFO, WARN, ERROR
```

**Configuration Details**:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MONGO_URI` | MongoDB connection string | - | ✅ Yes |
| `MONGO_DB_NAME` | Database name | `health_metrics` | ✅ Yes |
| `ANALYTICS_COLLECTION` | Analytics collection name | `analytics` | ✅ Yes |
| `SPARK_APP_NAME` | Spark application name | `HealthMetricsAnalytics` | ✅ Yes |
| `BATCH_INTERVAL_SECONDS` | Polling frequency in seconds | `60` | ❌ No |
| `CHECKPOINT_LOCATION` | Checkpoint directory path | `./spark-checkpoints` | ❌ No |
| `BACKEND_API_URL` | Backend API base URL | `http://localhost:5000` | ✅ Yes (for events) |
| `SERVICE_TOKEN` | Shared secret for service auth | - | ✅ Yes (for events) |
| `HEALTH_CHECK_PORT` | Health check server port | `5001` | ❌ No |
| `HEALTH_CHECK_HOST` | Health check server host | `0.0.0.0` | ❌ No |
| `LOG_DIRECTORY` | JSON logs directory | `./logs` | ❌ No |
| `METRICS_DIRECTORY` | Metrics files directory | `./metrics` | ❌ No |
| `DLQ_DIRECTORY` | Dead-letter queue directory | `./dlq` | ❌ No |

**Important**: The `SERVICE_TOKEN` must match the backend's `SERVICE_TOKEN` environment variable for real-time event emission to work.

## Core Features

### 📊 Analytics Computation

**7-Day Rolling Averages**:
- Smooths daily fluctuations to identify trends
- Applied to: steps, distance, calories, active minutes
- Window: Last 7 days including current day
- Formula: `avg(value) OVER (PARTITION BY userId, metricType ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)`

**Activity Streak Tracking**:
- Counts consecutive days with steps > 1000
- Resets on days with < 1000 steps or missing data
- Tracks longest streak and current streak start date
- Encourages consistency in physical activity

**Anomaly Detection**:
- Statistical approach using 2-sigma threshold
- Compares current value to 30-day mean ± 2 standard deviations
- Flags values outside normal range
- Provides severity levels: low, medium, high
- Includes expected value and actual deviation in results

**Percentile Rankings**:
- Compares user's metric to their 90-day history
- Calculates percentile (0-100) for each metric value
- Uses approximate percentile algorithm for efficiency
- Helps users understand relative performance

**Trend Analysis**:
- Compares current period to previous period
- Categories: `increasing`, `decreasing`, `stable`
- Includes percentage change calculation
- Identifies improvement vs regression

### 🔔 Real-Time Event Emission

After writing analytics to MongoDB, the system automatically emits events to the backend's Server-Sent Events (SSE) system:

**Event Flow**:
```
Spark Analytics → MongoDB Write → HTTP POST /api/events/emit → Backend SSE → Frontend Dashboard
```

**Features**:
- **Automatic Notification**: Users receive instant updates when new analytics are available
- **Service Authentication**: Uses `SERVICE_TOKEN` for secure service-to-service communication
- **Retry Logic**: Exponential backoff with up to 3 retry attempts for transient network failures
- **Non-Blocking**: Event emission failures don't stop analytics processing (logged to console)
- **Detailed Payload**: Includes metric type, time range, and complete analytics data

**Event Types**:
- `analytics:update` - Single analytics record updated
- `analytics:batch_update` - Batch of analytics updated (during bulk processing)

**Example Event Payload**:
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "eventType": "analytics:update",
  "data": {
    "metricType": "steps",
    "timeRange": "7day",
    "analytics": {
      "rollingAverage": 8500.5,
      "trend": "increasing",
      "trendPercentage": 12.5,
      "anomalyDetected": false,
      "streakDays": 7,
      "percentile": 85.3
    },
    "operationType": "update"
  }
}
```

### 📦 Intelligent Batching & Debouncing

For large-scale processing (e.g., 30-day initial sync), the system uses smart batching to optimize performance:

**Batch Accumulation**:
- Collects all analytics for a user during processing
- Sends one `analytics:batch_update` event per user instead of N individual events
- **93%+ Request Reduction**: Dramatically reduces HTTP requests and SSE events

**Size Limits**:
- Caps batches at 50 analytics per event (prevents exceeding SSE ~10KB limit)
- Automatically splits larger batches into multiple events
- Maintains event ordering for frontend consistency

**Performance Benefits**:
- **Without Batching**: 30 analytics → 30 HTTP requests → 30 SSE events → 30 frontend re-renders
- **With Batching**: 30 analytics → 1 HTTP request → 1 SSE event → 1 frontend re-render

**Implementation**:
```python
# Accumulate analytics for a user
add_to_batch(user_id, analytics_data)

# Flush batch at end of processing
flush_all_batches()  # Emits consolidated batch events
```

**Testing**:
```bash
# Test single event emission
python test_realtime_flow.py

# Test batched event emission (simulates large-scale processing)
python test_batch_events.py

# Test event splitting for large batches
python test_large_scale_batching.py
```

### 📱 Phone-Only Constraint Enforcement

The system strictly enforces the phone-only design constraint through multiple validation layers:

**Layer 1: Source Filtering**:
```python
# Only accept manual entry or Google Fit data
phone_only_df = df.filter(col('source').isin(['manual', 'googlefit']))
```

**Layer 2: Field Validation**:
```python
# Drop records with wearable-only fields
if 'heartRate' in schema_fields:
    phone_only_df = phone_only_df.filter(col('heartRate').isNull())
if 'bloodOxygen' in schema_fields:
    phone_only_df = phone_only_df.filter(col('bloodOxygen').isNull())
```

**Supported Metrics** (Phone-Compatible):
- ✅ Steps (accelerometer)
- ✅ Distance (GPS + accelerometer)
- ✅ Calories (calculated from activity)
- ✅ Active Minutes (activity recognition)
- ✅ Weight (manual entry)
- ✅ Sleep Hours (manual entry or phone sensors)

**Excluded Metrics** (Wearable-Only):
- ❌ Heart Rate (requires chest strap or wrist sensor)
- ❌ Blood Oxygen / SpO2 (requires pulse oximeter)

### 🔄 Micro-Batch Polling Architecture

**Why Polling Instead of Change Streams?**
- MongoDB change streams require a **replica set**
- Many development environments use standalone MongoDB instances
- Polling pattern works with any MongoDB deployment (standalone, replica set, sharded cluster)

**How It Works**:
1. **Rate Source Trigger**: Spark Structured Streaming generates trigger events every N seconds
2. **Checkpoint Loading**: Loads last processed timestamp from `last_processed_timestamp.txt`
3. **Incremental Query**: Queries MongoDB for records where `updatedAt > last_timestamp`
4. **Batch Processing**: Computes analytics for new/updated records
5. **Checkpoint Update**: Saves `MAX(updatedAt)` as new checkpoint
6. **State Persistence**: Checkpoint survives application restarts

**Polling Flow Diagram**:
```
┌──────────────────────────────────────────────────────────────┐
│  Spark Structured Streaming (Rate Source)                   │
│  - Trigger: processingTime = BATCH_INTERVAL_SECONDS         │
│  - Default: 60 seconds                                       │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  process_batch(batch_df, batch_id)                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 1. Load checkpoint: last_processed_timestamp.txt    │   │
│  │    Default: 30 days ago if not found                │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       │                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 2. Query MongoDB:                                   │   │
│  │    WHERE updatedAt > last_timestamp                 │   │
│  │    AND userId IS NOT NULL                           │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       │                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 3. Compute Analytics:                               │   │
│  │    - Phone-only filtering                           │   │
│  │    - Rolling averages, streaks                      │   │
│  │    - Anomaly detection, percentiles                 │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       │                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 4. Write to MongoDB & Emit Events                   │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       │                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 5. Update checkpoint: MAX(updatedAt)                │   │
│  │    Save to last_processed_timestamp.txt             │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

**Checkpoint Management**:
- **File**: `spark-checkpoints/last_processed_timestamp.txt`
- **Format**: ISO 8601 timestamp (e.g., `2025-11-21T10:30:45.123456`)
- **Purpose**: Tracks last successfully processed record
- **Recovery**: Application resumes from checkpoint after restart
- **Reset**: Delete file to reprocess last 30 days

See [POLLING_ARCHITECTURE.md](./POLLING_ARCHITECTURE.md) for detailed architecture documentation.

### 🛡️ Error Handling & Monitoring

**Error Handler** (`error_handler.py`):
- Comprehensive exception handling (MongoDB, HTTP, Spark SQL)
- Dead-letter queue (DLQ) for failed batches
- Error categorization and tracking
- Detailed error logging with stack traces
- Recovery recommendations

**Dead-Letter Queue**:
```
dlq/
  batch_0042_error_2025-11-21T10-30-45.json  # Failed batch metadata
```

**Health Check Endpoint** (`health_check.py`):
- Flask server on port 5001 (configurable)
- `/health` - Basic health status
- `/health/detailed` - Comprehensive metrics
- Thread-safe status updates from Spark job

**Health Check Response**:
```json
{
  "status": "healthy",
  "last_batch_id": 42,
  "last_processed_at": "2025-11-21T10:45:30",
  "errors_count": 0,
  "batches_processed": 100,
  "records_processed": 15000,
  "uptime_seconds": 2730,
  "version": "1.0"
}
```

**Batch Logger** (`batch_logger.py`):
- Structured logging to console (human-readable with emojis)
- JSON log files (machine-readable for analysis)
- Metrics files (Prometheus-compatible format)
- Batch statistics tracking
- Processing time metrics

**Log Output Locations**:
```
logs/batch_YYYYMMDD_HHMMSS.json       # Structured JSON logs
metrics/metrics_YYYYMMDD_HHMMSS.txt   # Prometheus metrics
```

## Running the Application

### Streaming Mode (Linux/Mac/WSL)

**Start the Spark Streaming Job**:
```bash
# Using enhanced startup script (recommended)
python start_streaming.py

# Or directly
python main.py
```

**Expected Output**:
```
🚀 Starting Spark Application: HealthMetricsAnalytics
📊 Connecting to MongoDB Database: health_metrics
✅ Spark Session Initialized
🔄 Starting micro-batch polling stream
⏱️  Polling interval: 60 seconds
📂 Checkpoint location: ./spark-checkpoints
✅ Streaming query started
🔄 Polling for new health metrics every 60 seconds
Press Ctrl+C to stop the stream...
```

**First Batch Execution**:
```
🔄 Starting micro-batch 0 at 2025-11-21T10:30:00
📁 No checkpoint found, using default: 2025-10-21T10:30:00
📊 Polling for data updated after: 2025-10-21T10:30:00
✅ Found 150 new/updated records
📊 Processing health metrics batch...
   ✅ Filtered to 150 phone-only metric records
   ✅ Flattened to 900 individual metric values
   📈 7-day rolling averages computed
   🔥 Activity streaks computed
   ⚠️ Anomaly detection complete (2 anomalies found)
   📊 Percentile rankings computed
💾 Saving 45 analytics records to MongoDB...
✅ Analytics saved successfully!
   📝 15 inserted, 30 updated
✨ Emitting real-time events to backend...
   ✅ Sent analytics:update event for user 507f...
💾 Updating checkpoint to: 2025-11-21T10:29:30
💾 Checkpoint saved successfully
✅ Completed micro-batch 0 (duration: 12.3s)
```

**Stopping the Job**:
```
# Press Ctrl+C
^C
🛑 Stream stopped by user
🔌 Stopping Spark session...
✅ Spark application terminated
```

### Batch Mode (Windows - No Checkpoints)

For Windows environments without WSL, use the batch processing script that avoids Spark Streaming checkpoints:

```powershell
python process_batch_windows.py
```

**Features**:
- Processes existing data from MongoDB (no streaming)
- No checkpoint requirement (avoids winutils.exe issue)
- Loads last 30 days of health metrics
- Computes and saves analytics
- Single execution (not continuous)

**Output**:
```
======================================================================
🚀 BATCH ANALYTICS PROCESSING (Windows Compatible)
======================================================================
📅 Run Time: 2025-11-21T10:30:00
📊 Database: health_metrics

🔧 Initializing Spark...
✅ Spark session created

📝 Loading health metrics from last 30 days...
📊 Found 1,250 recent records

🔄 Processing analytics (this may take a minute)...

📊 Processing health metrics batch...
   ✅ Filtered to 1,250 phone-only metric records
   ✅ Flattened to 7,500 individual metric values
   📈 7-day rolling averages computed
   🔥 Activity streaks computed
   ⚠️ Anomaly detection complete
   📊 Percentile rankings computed

💾 Saving 375 analytics records to MongoDB...
✅ Analytics saved successfully!
   📝 125 inserted, 250 updated

======================================================================
✅ BATCH PROCESSING COMPLETE
======================================================================
📊 Records Processed: 1,250
📈 Analytics Computed: 375
⏱️ Processing Time: 45.2s
======================================================================
```

**Scheduling Batch Execution**:
```powershell
# Windows Task Scheduler (run every hour)
schtasks /create /tn "SparkAnalytics" /tr "python C:\path\to\spark-analytics\process_batch_windows.py" /sc hourly

# Or use a simple loop
while ($true) {
    python process_batch_windows.py
    Start-Sleep -Seconds 3600  # Wait 1 hour
}
```

See [WINDOWS_TESTING_SUMMARY.md](./WINDOWS_TESTING_SUMMARY.md) for detailed Windows setup and WSL2 instructions.

### Verifying Checkpoint Status

```bash
python check_checkpoint.py
```

**Output**:
```
📁 CHECKPOINT STATUS CHECK
✅ Checkpoint file exists
📅 Timestamp: 2025-11-21T10:29:30
⏱️  Time Since Checkpoint: 0:00:45
✅ Status: UP TO DATE (< 1 hour behind)

💡 To reset checkpoint (reprocess last 30 days):
   rm spark-checkpoints/last_processed_timestamp.txt
```

### Monitoring the Job

**Health Check**:
```bash
curl http://localhost:5001/health
```

**View Logs**:
```bash
# Console logs (live)
tail -f output.log

# Structured JSON logs
cat logs/batch_20251121_103000.json | jq .

# Metrics
cat metrics/metrics_20251121_103000.txt
```

## Testing

The Spark Analytics module includes comprehensive test suites for validating all components:

### Test Suite Overview

| Test Script | Purpose | Command |
|------------|---------|---------|
| `test_mongo_connection.py` | Verify MongoDB connectivity | `python test_mongo_connection.py` |
| `test_polling.py` | Unit tests for polling logic | `python test_polling.py` |
| `test_analytics.py` | Analytics computation tests | `python test_analytics.py` |
| `test_analytics_patterns.py` | Pattern-based integration test | `python test_analytics_patterns.py` |
| `test_batch_events.py` | Batch event emission tests | `python test_batch_events.py` |
| `test_realtime_flow.py` | End-to-end real-time flow | `python test_realtime_flow.py` |
| `test_streaming_integration.py` | Streaming integration test | `python test_streaming_integration.py` |
| `test_error_handling.py` | Error handling tests | `python test_error_handling.py` |
| `test_mongodb_write.py` | MongoDB write operations | `python test_mongodb_write.py` |
| `test_upsert_logic.py` | Upsert logic validation | `python test_upsert_logic.py` |

### Quick Test (Verify Setup)

```bash
# 1. Test MongoDB connection
python test_mongo_connection.py

# Expected output:
# ✅ MongoDB connection successful!
# 📊 Database: health_metrics
# 📁 Collections: users, healthmetrics, analytics
```

### Pattern-Based Integration Test

Inserts test data with known patterns and validates analytics computations:

```bash
python test_analytics_patterns.py
```

**Test Data Pattern**:
- **Days 1-7**: Steadily increasing steps (7000 → 10000)
- **Day 8**: Missing (tests streak reset)
- **Days 9-12**: Consistent 8500 steps
- **Day 13**: 18,000 steps SPIKE (anomaly detection test)
- **Days 14-15**: Return to 8200 steps

**Expected Results**:
```
✅ Test Data Inserted Successfully
   - 14 metrics with known patterns
   - Dates: Nov 5-19, 2025

🔍 Verifying Analytics Computations...

📈 7-Day Rolling Averages:
   ✅ Nov 5: 7000 (1-day avg)
   ✅ Nov 11: 8429 (7-day avg)
   ✅ Nov 17: 10214 (spike affects avg)

🔥 Activity Streaks:
   ✅ Nov 5-11: 7-day streak
   ✅ Nov 12: RESET (missing data)
   ✅ Nov 13-19: 7-day streak

⚠️ Anomaly Detection:
   ✅ Nov 17: ANOMALY DETECTED (18000 steps)
   Z-score: 2.5σ above mean
   Expected: ~8700, Actual: 18000

📊 Percentile Rankings:
   ✅ Nov 17: 100th percentile (highest value)
   ✅ Other days: 10th-70th percentile

✅ ALL ANALYTICS TESTS PASSED
```

### Database Inspection Tools

```bash
# View database structure and contents
python inspect_database.py

# Verify test data with pandas analytics
python verify_test_data.py

# Check recent metric dates
python check_metric_dates.py
```

### Real-Time Event Testing

```bash
# Test single event emission
python test_realtime_flow.py

# Test batch event emission (bulk processing simulation)
python test_batch_events.py

# Test large-scale batching (100+ analytics)
python test_large_scale_batching.py
```

**Expected Output**:
```
🧪 Testing Real-Time Event Emission

1️⃣ Emitting single analytics event...
   ✅ Event sent successfully (HTTP 200)
   📨 Event type: analytics:update

2️⃣ Emitting batch update event (50 analytics)...
   ✅ Batch event sent successfully (HTTP 200)
   📨 Event type: analytics:batch_update
   📊 Batch size: 50 analytics

3️⃣ Testing event splitting (>50 analytics)...
   ✅ Split into 3 batch events
   📊 Events: 50 + 50 + 25 analytics

✅ ALL EVENT TESTS PASSED
⏱️ Average latency: 25ms
```

### Streaming Integration Test

Tests the complete streaming workflow with backend API:

```bash
python test_streaming_integration.py
```

**What It Tests**:
1. Backend API authentication
2. Health metric insertion via API
3. Timestamp recording for checkpoint verification
4. Data validation in MongoDB

**Expected Output**:
```
🧪 Testing Streaming Integration

1️⃣ Authenticating with backend API...
   ✅ Login successful
   🔑 JWT token: eyJhbGciOi...

2️⃣ Inserting test health metric...
   ✅ Metric inserted successfully
   📅 Date: 2025-11-21
   📊 Steps: 8500
   🕒 Timestamp: 2025-11-21T10:30:22

3️⃣ Next batch should process at: 2025-11-21T10:31:22

💡 Next Steps:
   1. Start Spark streaming job: python main.py
   2. Wait ~60 seconds for next batch
   3. Verify checkpoint: python check_checkpoint.py
   4. Check analytics in MongoDB: python verify_analytics_mongodb.py
```

### Error Handling Tests

```bash
# Test error handling and recovery
python test_error_handling.py

# Comprehensive error scenarios
python test_error_handling_comprehensive.py
```

**Test Coverage**:
- MongoDB connection failures
- HTTP timeout errors
- Spark SQL analysis exceptions
- Invalid data handling
- Dead-letter queue functionality
- Retry logic validation

### Checkpoint Testing

```bash
# Check checkpoint status
python check_checkpoint.py

# Expected output:
# 📁 CHECKPOINT STATUS CHECK
# ✅ Checkpoint file exists
# 📅 Timestamp: 2025-11-21T10:29:30
# ⏱️  Time Since Checkpoint: 0:00:45
# ✅ Status: UP TO DATE (< 1 hour behind)
```

**Checkpoint Reset** (reprocess last 30 days):
```bash
# Linux/Mac/WSL
rm spark-checkpoints/last_processed_timestamp.txt

# Windows PowerShell
Remove-Item "spark-checkpoints\last_processed_timestamp.txt"
```

### MongoDB Write Tests

```bash
# Test MongoDB write operations
python test_mongodb_write.py

# Simple write test
python test_mongodb_write_simple.py

# Test upsert logic
python test_upsert_logic.py
python test_upsert_integration.py
```

### Batch Logger Tests

```bash
# Test batch logging functionality
python test_batch_logger.py

# Test streaming logger
python test_streaming_logger.py
```

### Verification Utilities

```bash
# Verify analytics in MongoDB
python verify_analytics_mongodb.py

# Check recent metrics
python check_metric_dates.py

# Display all metrics
python get_user_by_email.py your_email@example.com
```

## Deployment

### Local Development

**Linux/Mac/WSL (Streaming Mode)**:
```bash
# Start streaming job
python main.py

# Or with enhanced startup
python start_streaming.py
```

**Windows (Batch Mode)**:
```powershell
# Process existing data
python process_batch_windows.py

# Schedule with Task Scheduler
schtasks /create /tn "SparkAnalytics" /tr "python C:\path\to\spark-analytics\process_batch_windows.py" /sc hourly
```

### Production Deployment

#### AWS EMR

**1. Create EMR Cluster**:
```bash
aws emr create-cluster \
  --name "HealthMetrics Analytics" \
  --release-label emr-6.13.0 \
  --applications Name=Spark \
  --ec2-attributes KeyName=your-key \
  --instance-type m5.xlarge \
  --instance-count 3 \
  --use-default-roles
```

**2. Submit Spark Job**:
```bash
aws emr add-steps \
  --cluster-id j-XXXXXXXXXXXXX \
  --steps Type=Spark,Name="Analytics Job",ActionOnFailure=CONTINUE,Args=[
    --deploy-mode,cluster,
    --master,yarn,
    --packages,org.mongodb.spark:mongo-spark-connector_2.12:10.3.0,
    s3://your-bucket/spark-analytics/main.py
  ]
```

**3. Environment Variables**:
Store sensitive variables in AWS Secrets Manager:
```bash
aws secretsmanager create-secret \
  --name spark-analytics-config \
  --secret-string '{
    "MONGO_URI": "mongodb+srv://...",
    "SERVICE_TOKEN": "your_secret"
  }'
```

#### Databricks

**1. Create Databricks Cluster**:
- Runtime: 13.3 LTS (Spark 3.4)
- Python: 3.10+
- Libraries: Install MongoDB Spark Connector

**2. Upload Code**:
```bash
# Upload to DBFS
databricks fs cp main.py dbfs:/analytics/
databricks fs cp mongodb_utils.py dbfs:/analytics/
databricks fs cp event_emitter.py dbfs:/analytics/
# ... upload all Python files
```

**3. Create Job**:
```json
{
  "name": "Health Metrics Analytics",
  "tasks": [{
    "task_key": "analytics",
    "spark_python_task": {
      "python_file": "dbfs:/analytics/main.py"
    },
    "libraries": [{
      "maven": {
        "coordinates": "org.mongodb.spark:mongo-spark-connector_2.12:10.3.0"
      }
    }]
  }],
  "schedule": {
    "quartz_cron_expression": "0 0 * * * ?",
    "timezone_id": "UTC"
  }
}
```

**4. Configure Secrets**:
Use Databricks Secret Scopes:
```bash
databricks secrets create-scope --scope analytics
databricks secrets put --scope analytics --key MONGO_URI
databricks secrets put --scope analytics --key SERVICE_TOKEN
```

#### Docker Deployment

**Dockerfile**:
```dockerfile
FROM openjdk:11-jre-slim

# Install Python
RUN apt-get update && apt-get install -y python3 python3-pip

# Set working directory
WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip3 install -r requirements.txt

# Copy application code
COPY . .

# Set environment variables
ENV SPARK_HOME=/usr/local/spark
ENV PYTHONUNBUFFERED=1

# Run application
CMD ["python3", "main.py"]
```

**Build and Run**:
```bash
# Build image
docker build -t spark-analytics .

# Run container
docker run -d \
  --name spark-analytics \
  -e MONGO_URI=$MONGO_URI \
  -e SERVICE_TOKEN=$SERVICE_TOKEN \
  -v $(pwd)/spark-checkpoints:/app/spark-checkpoints \
  spark-analytics
```

### Monitoring in Production

**Health Check Monitoring**:
```bash
# Kubernetes liveness probe
livenessProbe:
  httpGet:
    path: /health
    port: 5001
  initialDelaySeconds: 30
  periodSeconds: 10

# Prometheus scraping
scrape_configs:
  - job_name: 'spark-analytics'
    static_configs:
      - targets: ['spark-analytics:5001']
```

**Log Aggregation**:
- Forward JSON logs to ELK Stack or CloudWatch
- Set up alerts for error rates
- Monitor DLQ for failed batches

**Metrics Collection**:
- Batch processing duration
- Records processed per batch
- Analytics computation rate
- Event emission success rate
- Error counts by type

## Project Structure

```
spark-analytics/
├── main.py                           # Main Spark application (streaming mode)
├── process_batch_windows.py          # Windows batch mode (no checkpoints)
├── mongodb_utils.py                  # MongoDB schema and write operations
├── event_emitter.py                  # Real-time event emission to backend
├── batch_logger.py                   # Structured logging and metrics
├── error_handler.py                  # Error handling and DLQ
├── health_check.py                   # Health check endpoint (Flask)
│
├── requirements.txt                  # Python dependencies
├── .env.example                      # Environment variable template
├── setup_windows.ps1                 # Windows setup script
├── run_analytics.ps1                 # PowerShell runner script
│
├── tests/                            # Test suite
│   ├── test_mongo_connection.py      # MongoDB connectivity test
│   ├── test_polling.py               # Polling logic unit tests
│   ├── test_analytics.py             # Analytics computation tests
│   ├── test_analytics_patterns.py    # Pattern-based integration test
│   ├── test_batch_events.py          # Batch event emission tests
│   ├── test_realtime_flow.py         # End-to-end real-time test
│   ├── test_streaming_integration.py # Streaming workflow test
│   ├── test_error_handling.py        # Error handling tests
│   ├── test_mongodb_write.py         # MongoDB write tests
│   └── test_upsert_logic.py          # Upsert logic tests
│
├── utilities/                        # Utility scripts
│   ├── check_checkpoint.py           # Checkpoint status viewer
│   ├── inspect_database.py           # Database inspection tool
│   ├── verify_analytics_mongodb.py   # Analytics verification
│   ├── verify_test_data.py           # Test data verification
│   ├── get_user_by_email.py          # User lookup utility
│   └── start_streaming.py            # Enhanced streaming starter
│
├── docs/                             # Documentation
│   ├── ANALYTICS_GUIDE.md            # Analytics computation guide
│   ├── POLLING_ARCHITECTURE.md       # Architecture documentation
│   ├── IMPLEMENTATION_SUMMARY.md     # Implementation summary
│   ├── WINDOWS_TESTING_SUMMARY.md    # Windows testing guide
│   ├── INTEGRATION_TEST_GUIDE.md     # Integration testing guide
│   ├── MONGODB_WRITE_GUIDE.md        # MongoDB write guide
│   └── TESTING.md                    # Testing documentation
│
├── spark-checkpoints/                # Spark streaming checkpoints
│   └── last_processed_timestamp.txt  # Application checkpoint
├── dlq/                              # Dead-letter queue
├── logs/                             # JSON log files
├── metrics/                          # Prometheus metrics
├── spark-local/                      # Spark temporary files
└── hadoop/                           # Hadoop binaries (Windows)
    └── bin/
```

## Troubleshooting

### Common Issues

**1. MongoDB Connection Timeout**
```
Error: ServerSelectionTimeoutError
```
**Solution**:
- Verify `MONGO_URI` in `.env` file
- Check network connectivity
- Ensure MongoDB Atlas IP whitelist includes your IP
- Test connection: `python test_mongo_connection.py`

**2. Windows Checkpoint Error**
```
Error: CreateProcess error=193, %1 is not a valid Win32 application
```
**Solution**:
- Use `process_batch_windows.py` instead of `main.py`
- Or install WSL2 for full streaming support
- See [WINDOWS_TESTING_SUMMARY.md](./WINDOWS_TESTING_SUMMARY.md)

**3. Java Not Found**
```
Error: Java is not installed
```
**Solution**:
- Install Java 11: https://adoptium.net/temurin/releases/?version=11
- Verify: `java -version`
- Add Java to PATH if needed

**4. Event Emission Fails**
```
⚠️ SERVICE_TOKEN not configured, skipping event emission
```
**Solution**:
- Add `SERVICE_TOKEN` to `.env` file
- Ensure it matches backend's `SERVICE_TOKEN`
- Verify backend is running: `curl http://localhost:5000/api/health`

**5. No Records to Process**
```
ℹ️ No new data found since [timestamp]
```
**Solution**:
- Insert test data: `python test_streaming_integration.py`
- Check MongoDB for recent metrics: `python inspect_database.py`
- Verify checkpoint timestamp: `python check_checkpoint.py`
- Reset checkpoint if needed: delete `spark-checkpoints/last_processed_timestamp.txt`

**6. Spark Connector Not Found**
```
Error: java.lang.ClassNotFoundException: com.mongodb.spark.sql.connector
```
**Solution**:
- Ensure `requirements.txt` dependencies installed
- First run downloads MongoDB connector JARs (~50MB)
- Check internet connection for Maven Central access
- Manually specify: `--packages org.mongodb.spark:mongo-spark-connector_2.12:10.3.0`

**7. Memory Issues**
```
Error: OutOfMemoryError
```
**Solution**:
- Increase Spark driver memory:
  ```bash
  export SPARK_DRIVER_MEMORY=4g
  python main.py
  ```
- Reduce `BATCH_INTERVAL_SECONDS` to process smaller batches
- Use batch mode instead of streaming for large datasets

**8. Health Check Not Accessible**
```
Error: Connection refused on port 5001
```
**Solution**:
- Verify health check server started (check console logs)
- Check `HEALTH_CHECK_PORT` in `.env`
- Ensure firewall allows port 5001
- Try: `curl http://localhost:5001/health`

### Debug Mode

**Enable Verbose Logging**:
```python
# In main.py, add before Spark session creation:
import logging
logging.basicConfig(level=logging.DEBUG)
spark.sparkContext.setLogLevel("DEBUG")
```

**Check Spark UI**:
```
http://localhost:4040
```

**Inspect DLQ**:
```bash
# View failed batches
ls dlq/
cat dlq/batch_0042_error_*.json | jq .
```

**View Detailed Logs**:
```bash
# Structured logs
cat logs/batch_*.json | jq '.batch_id, .status, .errors'

# Metrics
cat metrics/metrics_*.txt | grep errors_total
```

## Documentation

- **[ANALYTICS_GUIDE.md](./ANALYTICS_GUIDE.md)** - Detailed analytics computation guide (515 lines)
  - Phone-only filtering strategy
  - Rolling average calculations
  - Streak tracking algorithm
  - Anomaly detection methodology
  - Percentile ranking approach
  - Trend analysis formulas

- **[POLLING_ARCHITECTURE.md](./POLLING_ARCHITECTURE.md)** - Architecture deep dive (358 lines)
  - Micro-batch polling pattern
  - Checkpoint management system
  - Data flow diagrams
  - Configuration tuning
  - Advantages vs change streams

- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Implementation checklist (328 lines)
  - Completed features
  - Test suite coverage
  - Configuration details
  - Key learnings

- **[WINDOWS_TESTING_SUMMARY.md](./WINDOWS_TESTING_SUMMARY.md)** - Windows testing guide (207 lines)
  - Windows limitations
  - WSL2 setup instructions
  - Batch mode usage
  - Expected test results

- **[INTEGRATION_TEST_GUIDE.md](./INTEGRATION_TEST_GUIDE.md)** - Integration testing guide
  - Step-by-step test procedures
  - Expected outputs
  - Verification checklists

- **[MONGODB_WRITE_GUIDE.md](./MONGODB_WRITE_GUIDE.md)** - MongoDB write operations
  - Upsert strategy
  - Schema mapping
  - Performance optimization

- **[TESTING.md](./TESTING.md)** - Testing documentation (309 lines)
  - Test scenarios
  - Helper scripts
  - Troubleshooting tips

## Performance Tuning

### Spark Configuration

```python
# Optimize for large datasets
spark = SparkSession.builder \
    .config("spark.driver.memory", "4g") \
    .config("spark.executor.memory", "4g") \
    .config("spark.sql.shuffle.partitions", "200") \
    .config("spark.default.parallelism", "100") \
    .getOrCreate()
```

### Batch Interval Tuning

| Data Volume | Recommended Interval |
|-------------|---------------------|
| < 100 records/min | 60 seconds (default) |
| 100-1000 records/min | 30 seconds |
| > 1000 records/min | 15 seconds |

**Adjust in `.env`**:
```
BATCH_INTERVAL_SECONDS=30
```

### MongoDB Optimization

- **Indexes**: Ensure `updatedAt` index on `healthmetrics` collection
- **Connection Pooling**: Configure in `MONGO_URI` query params:
  ```
  mongodb+srv://.../?maxPoolSize=50&minPoolSize=10
  ```

### Event Emission Optimization

- **Batch Size**: Default 50 analytics per event (optimal for SSE limits)
- **Debounce Time**: 2 seconds collection window
- **Retry Config**: Adjust `MAX_RETRIES` in `event_emitter.py` if needed

## Contributing

When adding features to the Spark Analytics module:

1. **Follow Existing Patterns**:
   - Use emoji logging conventions (✅ ❌ ⚠️ 📊 🔄)
   - Implement error handling with `ErrorHandler`
   - Add structured logging with `BatchLogger`

2. **Testing**:
   - Add unit tests to `tests/` directory
   - Update integration tests if needed
   - Verify Windows compatibility

3. **Documentation**:
   - Update relevant .md files
   - Add docstrings to new functions
   - Update this README

4. **Phone-Only Constraint**:
   - Always validate new metrics are phone-compatible
   - Update filtering logic in `process_health_metrics()`
   - Document any metric additions

## License

This module is part of the Health Metrics Monitoring System project.

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review relevant documentation in `docs/`
3. Run diagnostic scripts (`inspect_database.py`, `check_checkpoint.py`)
4. Check application logs in `logs/` directory
5. Inspect DLQ for failed batches in `dlq/`

---

**Version**: 1.0  
**Last Updated**: November 21, 2025  
**Python Version**: 3.9+  
**Spark Version**: 3.5.0  
**MongoDB Connector**: 10.3.0

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
