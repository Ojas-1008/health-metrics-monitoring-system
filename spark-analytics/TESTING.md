# Testing the Micro-Batch Polling Stream

## Quick Start

### 1. Insert Test Metric (Already Done ✅)

You've already run `test_streaming_integration.py` which:
- ✅ Authenticated with backend API
- ✅ Inserted metric at: `2025-11-20T22:29:22`
- ✅ Next batch should process around: `22:30:22`

### 2. Start Spark Streaming Job

Open a **NEW PowerShell terminal** and run:

```powershell
cd "C:\Users\ojass\OneDrive\Documents\Web Development\health-metrics-monitoring-system\spark-analytics"
python start_streaming.py
```

**OR directly:**

```powershell
cd spark-analytics
python main.py
```

### 3. Watch the Logs

After starting, you should see:

**Initial Output:**
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

**First Batch (after ~60 seconds):**
```
🔄 Starting micro-batch 0 at 2025-11-20T22:30:00
📁 No checkpoint found, using default: 2025-10-21T22:30:00
📊 Polling for data updated after: 2025-10-21T22:30:00
✅ Found X new/updated records
📈 Processing X health metrics records...
💾 Updating checkpoint to: 2025-11-20T22:29:22
💾 Checkpoint saved successfully
✅ Completed micro-batch 0
```

**Key Points to Verify:**
- ✅ The metric inserted at `22:29:22` is detected
- ✅ Checkpoint updates to that timestamp
- ✅ Console shows "Found 1 new/updated records" (or more if other recent data exists)

### 4. Test Checkpoint Resume

**Step A: Stop the Job**
```
Press Ctrl+C in Spark terminal
```

**Expected:**
```
^C
🛑 Stream stopped by user
🔌 Stopping Spark session...
✅ Spark application terminated
```

**Step B: Verify Checkpoint**
```powershell
python check_checkpoint.py
```

**Expected Output:**
```
📁 CHECKPOINT STATUS CHECK
✅ Checkpoint file exists
📅 Timestamp: 2025-11-20T22:29:22
⏱️  Time Since Checkpoint: 0:02:15
✅ Status: UP TO DATE (< 1 hour behind)
```

**Step C: Restart Job**
```powershell
python main.py
```

**Expected Output:**
```
🔄 Starting micro-batch 0 at 2025-11-20T22:32:00
📁 Loaded checkpoint timestamp: 2025-11-20T22:29:22  ← RESUMED FROM CHECKPOINT
📊 Polling for data updated after: 2025-11-20T22:29:22
ℹ️ No new data found since 2025-11-20T22:29:22  ← EXPECTED (no new inserts)
✅ Completed micro-batch 0
```

**✅ SUCCESS:** Job resumed from the saved checkpoint!

## Full Test Scenario

### Scenario 1: Basic Flow

```powershell
# Terminal 1: Start Spark
cd spark-analytics
python main.py
# Wait for first batch to initialize

# Terminal 2: Insert metric
python test_streaming_integration.py
# Note the insert timestamp

# Terminal 1: Watch logs
# Wait ~60 seconds for next batch
# Verify metric is processed
# Check checkpoint updated

# Stop with Ctrl+C
# Verify checkpoint: python check_checkpoint.py
# Restart: python main.py
# Verify resumes from checkpoint
```

### Scenario 2: Multiple Metrics

```powershell
# Start Spark job
python main.py

# Insert multiple metrics (in another terminal)
python test_streaming_integration.py
# Wait 10 seconds
python test_streaming_integration.py
# Wait 10 seconds  
python test_streaming_integration.py

# Next batch should find all 3 metrics
# Checkpoint should update to latest timestamp
```

### Scenario 3: Restart After Downtime

```powershell
# Start Spark job
python main.py
# Let it run for 2-3 batches
# Stop with Ctrl+C

# While stopped, insert several metrics
python test_streaming_integration.py
# Wait 30 seconds
python test_streaming_integration.py

# Restart Spark
python main.py
# First batch should find all metrics inserted during downtime
```

## Helper Scripts

### `start_streaming.py`
Enhanced startup with pre-flight checks
```powershell
python start_streaming.py
```

### `check_checkpoint.py`
View checkpoint status and analytics
```powershell
python check_checkpoint.py
```

### `test_streaming_integration.py`
Insert test metrics via backend API
```powershell
python test_streaming_integration.py
```

### `test_polling.py`
Unit tests for polling components
```powershell
python test_polling.py
```

### `test_mongo_connection.py`
Verify MongoDB connectivity
```powershell
python test_mongo_connection.py
```

## Troubleshooting

### No Data Being Processed

**Check 1: Verify metric was inserted**
```powershell
# Via backend API
curl http://localhost:5000/api/metrics `
  -H "Authorization: Bearer YOUR_TOKEN" | ConvertFrom-Json
```

**Check 2: Verify checkpoint isn't too recent**
```powershell
python check_checkpoint.py
# If too recent, reset:
Remove-Item ./spark-checkpoints/last_processed_timestamp.txt
```

**Check 3: Check MongoDB directly**
```powershell
python test_mongo_connection.py
```

### Job Crashes on Startup

**Check 1: Java installed**
```powershell
java -version
# Should show Java 11 or higher
```

**Check 2: Hadoop binaries**
```powershell
Test-Path C:\hadoop\bin\winutils.exe
# Should return True
```

**Check 3: Environment variables**
```powershell
cat .env
# Verify all values are set
```

### Checkpoint Not Updating

**Check 1: File permissions**
```powershell
# Ensure write permissions
New-Item -ItemType Directory -Force ./spark-checkpoints
```

**Check 2: Batch completing successfully**
```
# Look for errors in Spark logs
# Checkpoint only updates if batch succeeds
```

### High Memory Usage

**Reduce Spark memory:**
Edit `main.py` and add:
```python
spark = SparkSession.builder \
    .config("spark.driver.memory", "1g") \
    .config("spark.executor.memory", "1g")
```

## Verification Checklist

After running tests, verify:

- [ ] Spark job starts without errors
- [ ] First batch executes after ~60 seconds
- [ ] MongoDB connection successful
- [ ] New metrics are detected in batches
- [ ] Record counts are accurate
- [ ] Checkpoint file is created
- [ ] Checkpoint updates after each batch
- [ ] Job resumes from checkpoint after restart
- [ ] No duplicate processing
- [ ] Graceful shutdown with Ctrl+C

## Expected Behavior Summary

| Action | Expected Result |
|--------|----------------|
| **First Run** | Default to 30 days ago, process all recent records |
| **Insert Metric** | Detected in next batch (within 60 seconds) |
| **Batch Complete** | Checkpoint updates to max `updatedAt` |
| **Stop Job** | Graceful shutdown, checkpoint saved |
| **Restart Job** | Resumes from saved checkpoint |
| **No New Data** | "No new data found" message |
| **Multiple Metrics** | All processed in single batch |

## Next Steps

After successful testing:

1. ✅ Verify all tests pass
2. ✅ Document any issues encountered
3. ✅ Proceed to next sub-task (analytics processing)
4. ✅ Configure production batch interval
5. ✅ Set up monitoring and alerting

## Support

For detailed documentation:
- **Architecture**: [POLLING_ARCHITECTURE.md](./POLLING_ARCHITECTURE.md)
- **Integration Tests**: [INTEGRATION_TEST_GUIDE.md](./INTEGRATION_TEST_GUIDE.md)
- **Setup Guide**: [README.md](./README.md)
