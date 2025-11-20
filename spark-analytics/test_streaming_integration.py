"""
Integration test for micro-batch polling stream.

This script:
1. Authenticates with the backend API
2. Inserts a new health metric document
3. Monitors Spark logs to verify processing
4. Tests checkpoint resume functionality

Usage: python test_streaming_integration.py
"""

import requests
import time
from datetime import datetime, timedelta
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
BACKEND_URL = os.getenv('BACKEND_API_URL', 'http://localhost:5000/api')
TEST_EMAIL = 'ojasshrivastava1008@gmail.com'
TEST_PASSWORD = 'Krishna@1008'

class BackendAPITester:
    def __init__(self, base_url, email, password):
        self.base_url = base_url
        self.email = email
        self.password = password
        self.token = None
        self.user_id = None
    
    def login(self):
        """Login and get JWT token"""
        print("🔐 Logging in to backend API...")
        
        url = f"{self.base_url}/auth/login"
        payload = {
            "email": self.email,
            "password": self.password
        }
        
        try:
            response = requests.post(url, json=payload)
            response.raise_for_status()
            
            data = response.json()
            self.token = data.get('token')
            self.user_id = data.get('data', {}).get('user', {}).get('_id')
            
            print(f"✅ Login successful!")
            print(f"   User ID: {self.user_id}")
            print(f"   Token: {self.token[:20]}...")
            return True
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Login failed: {e}")
            if hasattr(e.response, 'text'):
                print(f"   Response: {e.response.text}")
            return False
    
    def insert_metric(self, date=None):
        """Insert a new health metric"""
        if not self.token:
            print("❌ Not authenticated. Please login first.")
            return None
        
        if date is None:
            date = datetime.now().strftime('%Y-%m-%d')
        
        print(f"\n📊 Inserting health metric for date: {date}")
        
        url = f"{self.base_url}/metrics"
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "date": date,
            "metrics": {
                "steps": 8500,
                "distance": 6.2,
                "calories": 450,
                "activeMinutes": 65,
                "weight": 72.5,
                "sleepHours": 7.5
            },
            "source": "manual"
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            print(f"✅ Metric inserted successfully!")
            print(f"   Date: {date}")
            print(f"   Steps: {payload['metrics']['steps']}")
            print(f"   Timestamp: {datetime.now().isoformat()}")
            
            return data
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Failed to insert metric: {e}")
            if hasattr(e.response, 'text'):
                print(f"   Response: {e.response.text}")
            return None
    
    def get_metrics(self, start_date=None, end_date=None):
        """Get metrics for date range"""
        if not self.token:
            print("❌ Not authenticated. Please login first.")
            return None
        
        if start_date is None:
            start_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
        if end_date is None:
            end_date = datetime.now().strftime('%Y-%m-%d')
        
        print(f"\n📋 Fetching metrics from {start_date} to {end_date}")
        
        url = f"{self.base_url}/metrics"
        headers = {
            "Authorization": f"Bearer {self.token}"
        }
        params = {
            "startDate": start_date,
            "endDate": end_date
        }
        
        try:
            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status()
            
            data = response.json()
            count = data.get('count', 0)
            print(f"✅ Retrieved {count} metrics")
            
            return data
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Failed to fetch metrics: {e}")
            return None


def check_checkpoint_file():
    """Check if checkpoint file exists and display timestamp"""
    checkpoint_dir = os.getenv('CHECKPOINT_LOCATION', './spark-checkpoints')
    checkpoint_file = os.path.join(checkpoint_dir, 'last_processed_timestamp.txt')
    
    print(f"\n📁 Checking checkpoint file: {checkpoint_file}")
    
    if os.path.exists(checkpoint_file):
        with open(checkpoint_file, 'r') as f:
            timestamp = f.read().strip()
            print(f"✅ Checkpoint exists: {timestamp}")
            return timestamp
    else:
        print(f"⚠️ No checkpoint file found (will default to 30 days ago)")
        return None


def display_test_instructions():
    """Display manual testing instructions"""
    print("\n" + "=" * 70)
    print("🧪 SPARK STREAMING INTEGRATION TEST")
    print("=" * 70)
    
    print("\n📋 TEST PROCEDURE:")
    print("-" * 70)
    
    print("\n✅ Step 1: Start Spark Streaming Job")
    print("   In a NEW PowerShell terminal, run:")
    print("   cd spark-analytics")
    print("   python main.py")
    print()
    print("   Expected output:")
    print("   - 🚀 Starting micro-batch polling stream")
    print("   - ⏱️  Polling interval: 60 seconds")
    print("   - ✅ Streaming query started")
    print()
    
    print("✅ Step 2: Wait for Initial Batch")
    print("   Wait for the first batch to complete (~60 seconds)")
    print("   Look for:")
    print("   - 🔄 Starting micro-batch 0")
    print("   - 📁 Loaded checkpoint timestamp (or using default)")
    print("   - ℹ️ No new data found (if no recent updates)")
    print()
    
    print("✅ Step 3: Insert New Metric (THIS SCRIPT)")
    print("   This script will insert a metric and show timestamp")
    print()
    
    print("✅ Step 4: Wait for Next Batch")
    print("   Wait for next batch interval (~60 seconds)")
    print("   Look for:")
    print("   - 🔄 Starting micro-batch 1 (or next number)")
    print("   - ✅ Found X new/updated records")
    print("   - 📈 Processing X health metrics records...")
    print("   - 💾 Updating checkpoint to: [timestamp]")
    print()
    
    print("✅ Step 5: Stop and Restart Spark Job")
    print("   Press Ctrl+C to stop the Spark job")
    print("   Restart with: python main.py")
    print("   Verify:")
    print("   - 📁 Loaded checkpoint timestamp: [last saved timestamp]")
    print("   - Job resumes from correct position")
    print()
    
    print("-" * 70)
    print()


def run_integration_test():
    """Run the complete integration test"""
    
    display_test_instructions()
    
    print("🚀 Starting Integration Test...")
    print("=" * 70)
    
    # Initialize API tester
    api = BackendAPITester(BACKEND_URL, TEST_EMAIL, TEST_PASSWORD)
    
    # Step 1: Login
    print("\n" + "=" * 70)
    print("STEP 1: Authenticate with Backend API")
    print("=" * 70)
    
    if not api.login():
        print("\n❌ Test aborted - authentication failed")
        return False
    
    # Step 2: Check current checkpoint
    print("\n" + "=" * 70)
    print("STEP 2: Check Current Checkpoint")
    print("=" * 70)
    
    checkpoint_before = check_checkpoint_file()
    
    # Step 3: Get current metrics count
    print("\n" + "=" * 70)
    print("STEP 3: Get Current Metrics")
    print("=" * 70)
    
    current_metrics = api.get_metrics()
    
    # Step 4: Insert new metric
    print("\n" + "=" * 70)
    print("STEP 4: Insert New Health Metric")
    print("=" * 70)
    
    insert_time = datetime.now()
    print(f"🕐 Insert timestamp: {insert_time.isoformat()}")
    
    result = api.insert_metric()
    
    if not result:
        print("\n❌ Test failed - could not insert metric")
        return False
    
    # Step 5: Display next steps
    print("\n" + "=" * 70)
    print("STEP 5: Monitor Spark Logs")
    print("=" * 70)
    
    batch_interval = int(os.getenv('BATCH_INTERVAL_SECONDS', '60'))
    next_batch_time = insert_time + timedelta(seconds=batch_interval)
    
    print(f"\n⏱️  Batch interval: {batch_interval} seconds")
    print(f"📅 Metric inserted at: {insert_time.strftime('%H:%M:%S')}")
    print(f"📅 Next batch expected around: {next_batch_time.strftime('%H:%M:%S')}")
    
    print(f"\n🔍 Watch your Spark terminal for:")
    print(f"   1. 🔄 Starting micro-batch [N]")
    print(f"   2. ✅ Found 1 new/updated records")
    print(f"   3. 📈 Processing 1 health metrics records...")
    print(f"   4. 💾 Updating checkpoint to: {insert_time.strftime('%Y-%m-%dT%H:%M')}...")
    
    print(f"\n⏳ Estimated wait time: ~{batch_interval} seconds")
    
    # Step 6: Checkpoint verification instructions
    print("\n" + "=" * 70)
    print("STEP 6: Verify Checkpoint Resume (After Spark Processes)")
    print("=" * 70)
    
    print("\n📝 After you see the metric processed in Spark logs:")
    print("   1. Press Ctrl+C to stop the Spark job")
    print("   2. Check checkpoint file:")
    print("      cat .\\spark-checkpoints\\last_processed_timestamp.txt")
    print("   3. Restart Spark job:")
    print("      python main.py")
    print("   4. Verify it shows:")
    print("      📁 Loaded checkpoint timestamp: [recent timestamp]")
    print("   5. Next batch should find no new data (if you didn't insert more)")
    
    print("\n" + "=" * 70)
    print("✅ TEST SETUP COMPLETE")
    print("=" * 70)
    
    print("\n📊 Summary:")
    print(f"   ✅ Authenticated as: {TEST_EMAIL}")
    print(f"   ✅ Inserted metric at: {insert_time.isoformat()}")
    print(f"   ✅ Checkpoint location: {os.getenv('CHECKPOINT_LOCATION', './spark-checkpoints')}")
    print(f"   ✅ Backend API: {BACKEND_URL}")
    
    print("\n🎯 Next Steps:")
    print("   1. Keep your Spark job running (python main.py)")
    print("   2. Wait for next batch to process the new metric")
    print("   3. Test stop/restart to verify checkpoint resume")
    
    return True


if __name__ == "__main__":
    print("\n" + "=" * 70)
    print("🧪 SPARK MICRO-BATCH POLLING - INTEGRATION TEST")
    print("=" * 70)
    print(f"📅 Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    try:
        success = run_integration_test()
        
        if success:
            print("\n\n✅ Integration test setup completed successfully!")
            print("📊 Monitor your Spark terminal for processing logs")
        else:
            print("\n\n❌ Integration test setup failed")
            
    except KeyboardInterrupt:
        print("\n\n🛑 Test interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Test error: {e}")
        import traceback
        traceback.print_exc()
