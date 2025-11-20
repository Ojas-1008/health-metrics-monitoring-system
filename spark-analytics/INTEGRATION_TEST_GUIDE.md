# Micro-Batch Polling Stream - Integration Test Guide

## Test Objective

Verify that the Spark micro-batch polling stream correctly:
1. Polls MongoDB for new/updated health metrics
2. Processes new records in each batch
3. Updates checkpoint timestamp after processing
4. Resumes from correct timestamp after restart

## Prerequisites

- ✅ Backend server running on `http://localhost:5000`
- ✅ MongoDB Atlas accessible
- ✅ Java 11+ installed
- ✅ Hadoop binaries (winutils.exe) installed at `C:\hadoop\bin`
- ✅ Python dependencies installed (`pip install -r requirements.txt`)
- ✅ `.env` file configured with MongoDB credentials

## Test Procedure

### Phase 1: Initial Setup and Baseline

#### Step 1: Check Environment
```powershell
# Navigate to spark-analytics
cd spark-analytics

# Verify environment variables
cat .env

# Expected output:
# MONGO_URI=mongodb+srv://...
# MONGO_DB_NAME=health_metrics
# BATCH_INTERVAL_SECONDS=60
# CHECKPOINT_LOCATION=./spark-checkpoints
```

#### Step 2: Check Existing Checkpoint (Optional)
```powershell
# Check if checkpoint exists
if (Test-Path ./spark-checkpoints/last_processed_timestamp.txt) {
    cat ./spark-checkpoints/last_processed_timestamp.txt
} else {
    Write-Host "No checkpoint found - will default to 30 days ago"
}
```

#### Step 3: Start Spark Streaming Job
```powershell
# Start the streaming job
python main.py
```

**Expected Output:**
```
Starting Spark Application: HealthMetricsAnalytics
Connecting to MongoDB Database: health_metrics
Spark Session Initialized
🚀 Starting micro-batch polling stream
⏱️  Polling interval: 60 seconds
📂 Checkpoint location: C:\...\spark-checkpoints
✅ Streaming query started with ID: [uuid]
🔄 Polling for new health metrics every 60 seconds
Press Ctrl+C to stop the stream...
```

#### Step 4: Wait for First Batch
Wait approximately 60 seconds for the first batch to execute.

**Expected Output:**
```
🔄 Starting micro-batch 0 at 2025-11-20T10:00:00
📁 No checkpoint found, using default: 2025-10-21T10:00:00
📊 Polling for data updated after: 2025-10-21T10:00:00
✅ Found X new/updated records  (or)
ℹ️ No new data found since 2025-10-21T10:00:00
✅ Completed micro-batch 0
```

### Phase 2: Insert New Metric and Verify Processing

#### Step 5: Run Integration Test Script (New Terminal)

Open a **new PowerShell terminal** and run:

```powershell
cd spark-analytics
python test_streaming_integration.py
```

**This script will:**
1. ✅ Login to backend API with your credentials
2. ✅ Check current checkpoint status
3. ✅ Insert a new health metric with current timestamp
4. ✅ Display when next batch should process the data

**Expected Output:**
```
🧪 SPARK STREAMING INTEGRATION TEST
============================================================

STEP 1: Authenticate with Backend API
🔐 Logging in to backend API...
✅ Login successful!
   User ID: 673d123abc...
   Token: eyJhbGciOiJIUzI1NiIs...

STEP 2: Check Current Checkpoint
📁 Checking checkpoint file: ./spark-checkpoints/last_processed_timestamp.txt
✅ Checkpoint exists: 2025-11-20T09:45:00

STEP 3: Get Current Metrics
📋 Fetching metrics from 2025-11-13 to 2025-11-20
✅ Retrieved 15 metrics

STEP 4: Insert New Health Metric
📊 Inserting health metric for date: 2025-11-20
✅ Metric inserted successfully!
   Date: 2025-11-20
   Steps: 8500
   Timestamp: 2025-11-20T10:05:30.123456

STEP 5: Monitor Spark Logs
⏱️  Batch interval: 60 seconds
📅 Metric inserted at: 10:05:30
📅 Next batch expected around: 10:06:30

🔍 Watch your Spark terminal for:
   1. 🔄 Starting micro-batch [N]
   2. ✅ Found 1 new/updated records
   3. 📈 Processing 1 health metrics records...
   4. 💾 Updating checkpoint to: 2025-11-20T10:05...
```

#### Step 6: Monitor Spark Terminal

Switch back to your **Spark terminal** and watch for the next batch.

**Expected Output (after ~60 seconds):**
```
🔄 Starting micro-batch 1 at 2025-11-20T10:06:30
📁 Loaded checkpoint timestamp: 2025-11-20T09:45:00
📊 Polling for data updated after: 2025-11-20T09:45:00
✅ Found 1 new/updated records
📈 Processing 1 health metrics records...
💾 Updating checkpoint to: 2025-11-20T10:05:30
💾 Checkpoint saved successfully
✅ Completed micro-batch 1
```

**✅ SUCCESS CRITERIA:**
- [ ] Batch found the newly inserted metric
- [ ] Record count matches (1 new record)
- [ ] Checkpoint was updated to the insert timestamp
- [ ] No errors in console logs

### Phase 3: Verify Checkpoint Resume

#### Step 7: Stop Spark Job

In the Spark terminal, press **Ctrl+C**

**Expected Output:**
```
^C
🛑 Stream stopped by user
🔌 Stopping Spark session...
✅ Spark application terminated
```

#### Step 8: Verify Checkpoint File

```powershell
# Check checkpoint timestamp
cat ./spark-checkpoints/last_processed_timestamp.txt
```

**Expected:** Timestamp should match the last processed record from Step 6
```
2025-11-20T10:05:30
```

#### Step 9: Restart Spark Job

```powershell
python main.py
```

**Expected Output:**
```
Starting Spark Application: HealthMetricsAnalytics
...
🚀 Starting micro-batch polling stream
✅ Streaming query started with ID: [new-uuid]
🔄 Polling for new health metrics every 60 seconds

🔄 Starting micro-batch 0 at 2025-11-20T10:10:00
📁 Loaded checkpoint timestamp: 2025-11-20T10:05:30  ← CORRECT RESUME
📊 Polling for data updated after: 2025-11-20T10:05:30
ℹ️ No new data found since 2025-11-20T10:05:30  ← EXPECTED (no new inserts)
✅ Completed micro-batch 0
```

**✅ SUCCESS CRITERIA:**
- [ ] Job loaded checkpoint from file (not default 30 days ago)
- [ ] Timestamp matches the one saved in Step 6
- [ ] No new data found (since we didn't insert anything new)
- [ ] Job continues running normally

### Phase 4: Stress Test (Optional)

#### Step 10: Insert Multiple Metrics

```powershell
# Modify test script to insert multiple metrics
# Or use backend API directly with multiple POST requests
```

#### Step 11: Monitor Batch Processing

Watch for:
- Multiple records being processed in one batch
- Checkpoint advancing to the latest timestamp
- All records being captured without duplicates

## Verification Checklist

### Core Functionality
- [ ] Spark job starts successfully
- [ ] Rate stream generates trigger events
- [ ] `process_batch` function executes every 60 seconds
- [ ] MongoDB connection works
- [ ] Query filters by `updatedAt > last_timestamp`
- [ ] Query filters by `userId IS NOT NULL`

### Data Processing
- [ ] New metrics are detected in batches
- [ ] Record count is accurate
- [ ] No duplicate processing (with deduplication)
- [ ] Checkpoint updates to max `updatedAt` timestamp

### Checkpoint Management
- [ ] Checkpoint file created in correct location
- [ ] Timestamp format is ISO 8601
- [ ] File updates after each successful batch
- [ ] Default timestamp is 30 days ago (first run)
- [ ] Job resumes from saved timestamp (after restart)

### Error Handling
- [ ] Graceful shutdown on Ctrl+C
- [ ] Error messages are clear and informative
- [ ] Job doesn't crash on MongoDB connection issues
- [ ] Checkpoint not updated if batch processing fails

## Troubleshooting

### Issue: Job doesn't start

**Check:**
```powershell
# Verify Java installation
java -version

# Verify Hadoop binaries
Test-Path C:\hadoop\bin\winutils.exe

# Check environment variables
$env:HADOOP_HOME
```

**Fix:**
- Install Java 11+ if missing
- Download winutils.exe and hadoop.dll
- Set HADOOP_HOME environment variable

### Issue: MongoDB connection fails

**Check:**
```powershell
# Test MongoDB connection
python test_mongo_connection.py

# Verify .env file
cat .env
```

**Fix:**
- Verify MONGO_URI in .env
- Check internet connection
- Confirm IP whitelist in MongoDB Atlas

### Issue: No new data detected

**Check:**
1. Verify metric was inserted successfully
2. Check `updatedAt` field exists in document
3. Confirm timestamp is after checkpoint
4. Verify `userId` is not null

**Debug:**
```powershell
# View checkpoint
cat ./spark-checkpoints/last_processed_timestamp.txt

# Reset checkpoint to reprocess last hour
$date = (Get-Date).AddHours(-1).ToString("yyyy-MM-ddTHH:mm:ss")
Set-Content ./spark-checkpoints/last_processed_timestamp.txt $date
```

### Issue: Duplicate processing

**Check:**
- Multiple Spark instances using same checkpoint location
- Checkpoint not being saved properly

**Fix:**
- Ensure only one Spark instance is running
- Check write permissions on checkpoint directory
- Verify checkpoint file updates after each batch

### Issue: High memory usage

**Adjust Spark configuration:**
```python
# In main.py, modify SparkSession
.config("spark.driver.memory", "2g") \
.config("spark.executor.memory", "2g")
```

## Performance Metrics

### Expected Performance

| Metric | Value |
|--------|-------|
| Startup Time | 10-30 seconds |
| Batch Interval | 60 seconds (configurable) |
| Processing Time (100 records) | < 5 seconds |
| Processing Time (1000 records) | < 30 seconds |
| Memory Usage | 500MB - 2GB |
| CPU Usage | 10-30% |

### Monitoring Commands

```powershell
# Watch Spark logs in real-time
python main.py | Tee-Object -FilePath spark-logs.txt

# Monitor checkpoint updates
Get-Content ./spark-checkpoints/last_processed_timestamp.txt -Wait

# Count records in MongoDB (comparison)
# (Run in MongoDB shell or via pymongo script)
```

## Test Results Template

```
========================================
TEST EXECUTION REPORT
========================================
Date: 2025-11-20
Tester: [Your Name]
Environment: Windows / MongoDB Atlas

PHASE 1: Initial Setup
[ ] Job started successfully
[ ] First batch executed
[ ] Checkpoint created/loaded

PHASE 2: New Metric Processing  
[ ] Metric inserted via API
[ ] Detected in next batch
[ ] Checkpoint updated correctly
Insert Time: _______________
Process Time: _______________
Latency: _______________ seconds

PHASE 3: Checkpoint Resume
[ ] Job stopped gracefully
[ ] Checkpoint file verified
[ ] Job restarted successfully
[ ] Resumed from correct timestamp
Checkpoint Timestamp: _______________

PHASE 4: Stress Test (Optional)
[ ] Multiple metrics inserted
[ ] All records processed
[ ] No duplicates detected
Records Inserted: _______________
Records Processed: _______________

ISSUES ENCOUNTERED:
1. _______________
2. _______________

OVERALL RESULT: [ PASS / FAIL ]
========================================
```

## Additional Resources

- **Architecture Documentation**: [POLLING_ARCHITECTURE.md](./POLLING_ARCHITECTURE.md)
- **Setup Guide**: [README.md](./README.md)
- **Backend API Docs**: [../server/README.md](../server/README.md)
- **MongoDB Queries**: Use MongoDB Atlas UI for verification

## Next Steps After Successful Test

1. ✅ Implement analytics processing in `process_batch` (next sub-task)
2. ✅ Add monitoring and alerting
3. ✅ Configure production batch interval
4. ✅ Set up automated deployment
5. ✅ Enable distributed processing (multiple workers)
