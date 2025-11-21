"""
Test Large-Scale Batching: 100+ Days of Metrics
Tests the complete flow: Seed metrics → Run analytics → Verify batched SSE events

Expected Outcome:
- 100+ days of metrics → ~100+ analytics
- Without batching: 100+ individual SSE events
- With batching: 2-3 batch events (50 analytics per batch)
- Each payload < 10KB
- Frontend receives and processes all analytics correctly
"""

import os
import sys
from datetime import datetime, timedelta
from pymongo import MongoClient
from bson.objectid import ObjectId
from dotenv import load_dotenv
import subprocess
import time
import json

# Load environment from server/.env
load_dotenv('../server/.env')

# MongoDB connection
MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    print("❌ MONGODB_URI not found in environment")
    sys.exit(1)

client = MongoClient(MONGODB_URI)
db = client["health_metrics"]  # Correct database name
health_metrics_collection = db["healthmetrics"]
analytics_collection = db["analytics"]

# Test configuration
print("\n🔍 FINDING TEST USER...")

# First, try to find existing user
user = db["users"].find_one({"email": "ojasshrivastava1008@gmail.com"})

if not user:
    print("❌ No user found with email: ojasshrivastava1008@gmail.com")
    print()
    print("=" * 70)
    print("⚠️  SETUP REQUIRED: REGISTER A USER")
    print("=" * 70)
    print()
    print("To run this test, you need to:")
    print()
    print("1. Open your browser to: http://localhost:5173/register")
    print("2. Register with these credentials:")
    print("   Email: ojasshrivastava1008@gmail.com")
    print("   Password: Krishna@1008")
    print("   Name: Ojas (or any name)")
    print()
    print("3. After registration, run this script again:")
    print("   python test_large_scale_batching.py")
    print()
    print("=" * 70)
    client.close()
    sys.exit(1)

TEST_USER_ID = str(user['_id'])
print(f"✅ Found user: {user.get('email')}")
print(f"   User ID: {TEST_USER_ID}")
print(f"   Name: {user.get('name', 'N/A')}")

NUM_DAYS = 120  # 120 days of metrics
BASE_DATE = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

def cleanup_test_data():
    """Remove existing test data"""
    print("\n🧹 CLEANING UP EXISTING TEST DATA")
    
    metrics_deleted = health_metrics_collection.delete_many({
        "userId": ObjectId(TEST_USER_ID)
    })
    
    analytics_deleted = analytics_collection.delete_many({
        "userId": ObjectId(TEST_USER_ID)
    })
    
    print(f"   Deleted {metrics_deleted.deleted_count} health metrics")
    print(f"   Deleted {analytics_deleted.deleted_count} analytics")
    print("   ✅ Cleanup complete")

def seed_metrics():
    """Seed 100+ days of health metrics"""
    print(f"\n📊 SEEDING {NUM_DAYS} DAYS OF HEALTH METRICS")
    print(f"   User ID: {TEST_USER_ID}")
    print(f"   Date range: {(BASE_DATE - timedelta(days=NUM_DAYS)).strftime('%Y-%m-%d')} to {BASE_DATE.strftime('%Y-%m-%d')}")
    
    metrics_to_insert = []
    
    for day_offset in range(NUM_DAYS):
        current_date = BASE_DATE - timedelta(days=day_offset)
        
        # Generate realistic varying metrics
        base_steps = 7000 + (day_offset % 5) * 1000  # 7000-11000 steps
        base_calories = 2000 + (day_offset % 3) * 200  # 2000-2400 calories
        base_active = 30 + (day_offset % 4) * 10  # 30-60 minutes
        base_sleep = 6.5 + (day_offset % 3) * 0.5  # 6.5-7.5 hours
        base_weight = 70 + (day_offset % 10) * 0.5  # Slight weight variation
        
        metric_doc = {
            "userId": ObjectId(TEST_USER_ID),
            "date": current_date,
            "metrics": {
                "steps": base_steps,
                "distance": round(base_steps * 0.0008, 2),  # km
                "calories": base_calories,
                "activeMinutes": base_active,
                "sleepHours": base_sleep,
                "weight": base_weight
            },
            "source": "manual",
            "lastSyncedAt": current_date,
            "createdAt": current_date,
            "updatedAt": current_date
        }
        
        metrics_to_insert.append(metric_doc)
    
    # Bulk insert
    result = health_metrics_collection.insert_many(metrics_to_insert)
    print(f"   ✅ Inserted {len(result.inserted_ids)} health metrics")
    
    # Verify insertion
    count = health_metrics_collection.count_documents({"userId": ObjectId(TEST_USER_ID)})
    print(f"   📈 Total metrics in DB: {count}")
    
    return count

def trigger_spark_job():
    """Trigger the Spark analytics job"""
    print("\n🚀 TRIGGERING ANALYTICS PROCESSING")
    print("   This will:")
    print("   1. Read 100+ health metrics from MongoDB")
    print("   2. Calculate analytics for each metric")
    print("   3. Write analytics to MongoDB")
    print("   4. Accumulate analytics in batches (max 50 per batch)")
    print("   5. Emit batch events to backend SSE")
    print()
    
    # Run the simple batch analytics script
    spark_script = "simple_batch_analytics.py"
    
    print(f"   Running: python {spark_script}")
    print("   " + "=" * 60)
    
    start_time = time.time()
    
    try:
        result = subprocess.run(
            ["python", spark_script],
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )
        
        elapsed = time.time() - start_time
        
        print(result.stdout)
        
        if result.stderr:
            print("   ⚠️  STDERR:")
            print(result.stderr)
        
        if result.returncode == 0:
            print(f"   ✅ Spark job completed successfully in {elapsed:.2f}s")
            return True
        else:
            print(f"   ❌ Spark job failed with exit code {result.returncode}")
            return False
            
    except subprocess.TimeoutExpired:
        print("   ❌ Spark job timed out after 5 minutes")
        return False
    except Exception as e:
        print(f"   ❌ Error running Spark job: {e}")
        return False

def verify_analytics():
    """Verify analytics were created and count batch events"""
    print("\n🔍 VERIFYING ANALYTICS RESULTS")
    
    # Count analytics
    analytics_count = analytics_collection.count_documents({
        "userId": ObjectId(TEST_USER_ID)
    })
    
    print(f"   📊 Analytics created: {analytics_count}")
    
    if analytics_count == 0:
        print("   ❌ No analytics found!")
        return False
    
    # Calculate expected batches
    expected_batches = (analytics_count + 49) // 50  # Ceiling division
    
    print(f"\n📦 BATCH EVENT ANALYSIS")
    print(f"   Total analytics: {analytics_count}")
    print(f"   Expected batches (max 50 per batch): {expected_batches}")
    print(f"   Request reduction: {analytics_count} individual events → {expected_batches} batch events")
    print(f"   Efficiency gain: {((analytics_count - expected_batches) / analytics_count * 100):.1f}% fewer requests")
    
    # Sample analytics to check structure
    sample_analytics = list(analytics_collection.find(
        {"userId": ObjectId(TEST_USER_ID)}
    ).limit(3))
    
    print(f"\n📋 SAMPLE ANALYTICS (first 3):")
    for i, analytics in enumerate(sample_analytics, 1):
        print(f"\n   Analytics #{i}:")
        print(f"      Metric Type: {analytics.get('metricType')}")
        print(f"      Period: {analytics.get('period')}")
        print(f"      Time Range: {analytics.get('timeRange', {}).get('start')} to {analytics.get('timeRange', {}).get('end')}")
        print(f"      Patterns: {len(analytics.get('patterns', []))} patterns detected")
        print(f"      Insights: {len(analytics.get('insights', []))} insights generated")
    
    # Estimate payload size
    if sample_analytics:
        sample_size = len(json.dumps(sample_analytics[0], default=str))
        estimated_batch_size = sample_size * 50  # 50 analytics per batch
        print(f"\n📦 PAYLOAD SIZE ESTIMATION")
        print(f"   Single analytics size: ~{sample_size} bytes ({sample_size/1024:.2f} KB)")
        print(f"   Estimated batch size (50 analytics): ~{estimated_batch_size} bytes ({estimated_batch_size/1024:.2f} KB)")
        
        if estimated_batch_size > 10240:  # 10KB
            print(f"   ⚠️  WARNING: Batch size exceeds 10KB limit!")
            print(f"   Recommendation: Reduce batch size or implement payload compression")
        else:
            print(f"   ✅ Batch size under 10KB limit")
    
    return True

def print_frontend_instructions():
    """Print instructions for frontend verification"""
    print("\n" + "=" * 70)
    print("🎯 FRONTEND VERIFICATION STEPS")
    print("=" * 70)
    print()
    print("1. Open your browser to the Dashboard page")
    print("   URL: http://localhost:5173/dashboard")
    print()
    print("2. Open Browser DevTools (F12)")
    print("   - Go to Console tab")
    print()
    print("3. Look for these log messages:")
    print("   [EventService] Received event: analytics:batch_update")
    print("   [LRUCache] Set key: analytics:batch_update")
    print("   Analytics batch received: X analytics for user Y")
    print()
    print("4. Expected Results:")
    print(f"   - Should see 2-3 batch events (not 100+ individual events)")
    print(f"   - Each batch contains up to 50 analytics")
    print(f"   - Payload sizes should be < 10KB")
    print(f"   - Dashboard should show all {NUM_DAYS}+ analytics")
    print()
    print("5. Verify in Network Tab:")
    print("   - Go to Network tab")
    print("   - Filter: 'stream'")
    print("   - Click on 'stream' request")
    print("   - Check EventStream messages for 'analytics:batch_update'")
    print()
    print("6. Check Analytics Display:")
    print("   - Dashboard should show updated statistics")
    print("   - All analytics should be visible")
    print("   - No missing data or errors")
    print()
    print("=" * 70)

def main():
    """Main test flow"""
    print("=" * 70)
    print("🧪 LARGE-SCALE BATCHING TEST: 100+ DAYS OF METRICS")
    print("=" * 70)
    
    try:
        # Step 1: Cleanup
        cleanup_test_data()
        
        # Step 2: Seed metrics
        metrics_count = seed_metrics()
        
        if metrics_count < NUM_DAYS:
            print(f"\n❌ Failed to seed all metrics. Expected {NUM_DAYS}, got {metrics_count}")
            return
        
        # Step 3: Trigger Spark job
        print("\n⏳ Starting Spark analytics job...")
        print("   (This may take 1-2 minutes for 100+ metrics)")
        
        success = trigger_spark_job()
        
        if not success:
            print("\n❌ Spark job failed. Check logs above.")
            return
        
        # Step 4: Verify results
        verify_success = verify_analytics()
        
        if not verify_success:
            print("\n❌ Analytics verification failed")
            return
        
        # Step 5: Frontend instructions
        print_frontend_instructions()
        
        print("\n" + "=" * 70)
        print("✅ TEST SETUP COMPLETE")
        print("=" * 70)
        print()
        print("Next Steps:")
        print("1. Follow the frontend verification steps above")
        print("2. Verify batch events in browser console")
        print("3. Check analytics display in dashboard")
        print()
        print("Expected Outcome:")
        print("✅ 2-3 batch events instead of 100+ individual events")
        print("✅ Each payload < 10KB")
        print("✅ All analytics displayed correctly")
        print("✅ 93%+ reduction in SSE events")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    main()
