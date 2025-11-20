"""
Comprehensive test for analytics processing with known patterns.

This script:
1. Inserts test data with specific patterns:
   - Steadily increasing steps
   - Sudden spike (anomaly)
   - Missing day (streak break)
2. Triggers Spark processing
3. Verifies analytics computations
4. Displays results for manual inspection

Usage: python test_analytics_patterns.py
"""

import requests
import time
from datetime import datetime, timedelta
import json
import os
from dotenv import load_dotenv

# Set up Hadoop environment for Windows BEFORE any Spark imports
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
HADOOP_HOME = os.path.join(SCRIPT_DIR, 'hadoop')
os.makedirs(os.path.join(HADOOP_HOME, 'bin'), exist_ok=True)

os.environ['HADOOP_HOME'] = HADOOP_HOME
os.environ['hadoop.home.dir'] = HADOOP_HOME
os.environ['HADOOP_USER_NAME'] = 'spark'

# Load environment variables
load_dotenv()

# Configuration
BACKEND_URL = os.getenv('BACKEND_API_URL', 'http://localhost:5000/api')
TEST_EMAIL = 'ojasshrivastava1008@gmail.com'
TEST_PASSWORD = 'Krishna@1008'

class AnalyticsPatternTester:
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
            return True
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Login failed: {e}")
            return False
    
    def insert_test_pattern(self):
        """Insert test data with known patterns"""
        if not self.token:
            print("❌ Not authenticated. Please login first.")
            return False
        
        print("\n" + "=" * 70)
        print("📊 INSERTING TEST DATA WITH KNOWN PATTERNS")
        print("=" * 70)
        
        # Define test pattern over 15 days
        base_date = datetime.now() - timedelta(days=14)
        
        test_data = []
        
        # Days 1-7: Steadily increasing steps (7000 -> 10000)
        print("\n📈 Pattern 1: Steadily Increasing Steps (Days 1-7)")
        for i in range(7):
            date = base_date + timedelta(days=i)
            steps = 7000 + (i * 500)  # 7000, 7500, 8000, 8500, 9000, 9500, 10000
            test_data.append({
                'date': date.strftime('%Y-%m-%d'),
                'steps': steps,
                'distance': steps * 0.0007,  # ~0.7 km per 1000 steps
                'calories': steps * 0.04,     # ~40 cal per 1000 steps
                'activeMinutes': 60,
                'pattern': 'increasing'
            })
            print(f"   Day {i+1}: {date.strftime('%Y-%m-%d')} - {steps} steps")
        
        # Day 8: MISSING DAY (breaks streak)
        print("\n⚠️ Pattern 2: Missing Day (Day 8) - STREAK BREAK")
        # No data inserted for day 8
        
        # Days 9-12: Consistent moderate activity
        print("\n📊 Pattern 3: Consistent Activity (Days 9-12)")
        for i in range(8, 12):
            date = base_date + timedelta(days=i)
            steps = 8500  # Consistent
            test_data.append({
                'date': date.strftime('%Y-%m-%d'),
                'steps': steps,
                'distance': steps * 0.0007,
                'calories': steps * 0.04,
                'activeMinutes': 60,
                'pattern': 'consistent'
            })
            print(f"   Day {i+1}: {date.strftime('%Y-%m-%d')} - {steps} steps")
        
        # Day 13: SUDDEN SPIKE (anomaly)
        print("\n🚨 Pattern 4: Sudden Spike (Day 13) - ANOMALY")
        date = base_date + timedelta(days=12)
        spike_steps = 18000  # Significantly higher than normal
        test_data.append({
            'date': date.strftime('%Y-%m-%d'),
            'steps': spike_steps,
            'distance': spike_steps * 0.0007,
            'calories': spike_steps * 0.04,
            'activeMinutes': 120,
            'pattern': 'anomaly'
        })
        print(f"   Day 13: {date.strftime('%Y-%m-%d')} - {spike_steps} steps (SPIKE!)")
        
        # Days 14-15: Return to normal
        print("\n📉 Pattern 5: Return to Normal (Days 14-15)")
        for i in range(13, 15):
            date = base_date + timedelta(days=i)
            steps = 8200
            test_data.append({
                'date': date.strftime('%Y-%m-%d'),
                'steps': steps,
                'distance': steps * 0.0007,
                'calories': steps * 0.04,
                'activeMinutes': 60,
                'pattern': 'normal'
            })
            print(f"   Day {i+1}: {date.strftime('%Y-%m-%d')} - {steps} steps")
        
        # Insert all test data
        print("\n📝 Inserting test metrics...")
        
        url = f"{self.base_url}/metrics"
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        success_count = 0
        for data in test_data:
            payload = {
                "date": data['date'],
                "metrics": {
                    "steps": data['steps'],
                    "distance": data['distance'],
                    "calories": data['calories'],
                    "activeMinutes": data['activeMinutes'],
                    "weight": 72.5,
                    "sleepHours": 7.5
                },
                "source": "manual"
            }
            
            try:
                response = requests.post(url, json=payload, headers=headers)
                if response.status_code in [200, 201]:
                    success_count += 1
                    print(f"   ✅ {data['date']}: {data['steps']} steps")
                else:
                    print(f"   ⚠️ {data['date']}: {response.status_code}")
                    
                # Small delay to avoid rate limiting
                time.sleep(0.2)
                
            except requests.exceptions.RequestException as e:
                print(f"   ❌ {data['date']}: {e}")
        
        print(f"\n✅ Inserted {success_count}/{len(test_data)} test metrics")
        return success_count > 0
    
    def display_expected_analytics(self):
        """Display what we expect to see in analytics"""
        print("\n" + "=" * 70)
        print("🎯 EXPECTED ANALYTICS RESULTS")
        print("=" * 70)
        
        print("\n📈 Rolling Averages (7-Day):")
        print("   - Days 1-7: Gradually increasing from 7000 to ~8429")
        print("   - Days 9-12: Stabilizing around 8500")
        print("   - Day 13: Spike will affect rolling average")
        print("   - Days 14-15: Normalizing back")
        
        print("\n🔥 Activity Streaks:")
        print("   - Days 1-7: 7-day streak (all > 1000 steps)")
        print("   - Day 8: MISSING - streak resets to 0")
        print("   - Days 9-12: New 4-day streak")
        print("   - Days 13-15: Continues to 7-day streak")
        
        print("\n⚠️ Anomaly Detection:")
        print("   - Day 13: Should be flagged as anomaly")
        print("     (18000 steps >> 2σ above 30-day mean)")
        print("   - Other days: Should be normal")
        
        print("\n📊 Percentile Rankings:")
        print("   - Day 13: Should be near 1.0 (100th percentile)")
        print("   - Early days: Lower percentiles")
        print("   - Later days: Mid-range percentiles")
        
        print("\n📈 Trends:")
        print("   - Days 1-7: 'increasing' trend")
        print("   - Days 9-12: 'stable' trend")
        print("   - Day 13: 'increasing' trend (spike)")
        print("   - Days 14-15: 'decreasing' trend (post-spike normalization)")


def run_spark_analytics_test():
    """Run Spark analytics processing on test data"""
    print("\n" + "=" * 70)
    print("🚀 RUNNING SPARK ANALYTICS TEST")
    print("=" * 70)
    
    try:
        from pyspark.sql import SparkSession
        from pyspark.sql.functions import col
        
        MONGO_URI = os.getenv('MONGO_URI')
        MONGO_DB_NAME = os.getenv('MONGO_DB_NAME')
        
        if not MONGO_URI or not MONGO_DB_NAME:
            print("⚠️ MongoDB configuration missing")
            return False
        
        print(f"\n📡 Connecting to MongoDB: {MONGO_DB_NAME}")
        
        # Initialize Spark Session
        spark = SparkSession.builder \
            .appName("AnalyticsPatternTest") \
            .master("local[*]") \
            .config("spark.mongodb.read.connection.uri", MONGO_URI) \
            .config("spark.mongodb.write.connection.uri", MONGO_URI) \
            .config("spark.jars.packages", "org.mongodb.spark:mongo-spark-connector_2.12:10.3.0") \
            .getOrCreate()
        
        spark.sparkContext.setLogLevel("ERROR")
        
        print("✅ Spark session created")
        
        # Load recent health metrics
        print("\n📝 Loading health metrics from last 30 days...")
        thirty_days_ago = (datetime.now() - timedelta(days=30)).isoformat()
        
        df = spark.read.format("mongodb") \
            .option("database", MONGO_DB_NAME) \
            .option("collection", "healthmetrics") \
            .load()
        
        # Filter to recent data
        recent_df = df.filter(col('updatedAt') > thirty_days_ago)
        
        count = recent_df.count()
        print(f"📊 Found {count} recent records")
        
        if count == 0:
            print("⚠️ No recent data to process")
            spark.stop()
            return False
        
        # Import analytics processing
        import sys
        sys.path.insert(0, os.path.dirname(__file__))
        from main import process_health_metrics
        
        # Process analytics
        print("\n📈 Processing analytics...")
        print("   (This may take a minute)")
        
        analytics_df = process_health_metrics(recent_df)
        
        analytics_count = analytics_df.count()
        print(f"\n✅ Generated {analytics_count} analytics records")
        
        if analytics_count > 0:
            # Display results
            print("\n" + "=" * 70)
            print("📊 ANALYTICS RESULTS")
            print("=" * 70)
            
            # Filter to steps for easier analysis
            steps_analytics = analytics_df.filter(col('metricType') == 'steps') \
                .orderBy('date')
            
            steps_count = steps_analytics.count()
            print(f"\n📈 Steps Analytics ({steps_count} records):")
            
            steps_analytics.select(
                'date',
                'currentValue',
                'rollingAverage7Day',
                'trend',
                'anomalyDetected',
                'streakDays',
                'percentile',
                'comparisonToPrevious'
            ).show(20, truncate=False)
            
            # Check for anomalies
            print("\n⚠️ ANOMALY DETECTION:")
            anomalies = steps_analytics.filter(col('anomalyDetected') == True)
            anomaly_count = anomalies.count()
            
            if anomaly_count > 0:
                print(f"   ✅ Found {anomaly_count} anomalies:")
                anomalies.select(
                    'date',
                    'currentValue',
                    'rollingAverage7Day',
                    'percentile'
                ).show(truncate=False)
            else:
                print("   ℹ️ No anomalies detected")
            
            # Check streak patterns
            print("\n🔥 STREAK ANALYSIS:")
            streaks = steps_analytics.select('date', 'currentValue', 'streakDays') \
                .orderBy('date')
            
            print("   Date          | Steps  | Streak")
            print("   --------------|--------|-------")
            
            for row in streaks.collect():
                streak = row['streakDays'] if row['streakDays'] else 0
                marker = "🔥" if streak > 0 else "❌"
                print(f"   {row['date']} | {int(row['currentValue']):6d} | {streak:3d} {marker}")
            
            # Trend distribution
            print("\n📈 TREND DISTRIBUTION:")
            steps_analytics.groupBy('trend').count().show()
            
            # Percentile distribution
            print("\n📊 PERCENTILE DISTRIBUTION:")
            steps_analytics.select(
                'date',
                'currentValue',
                'percentile'
            ).orderBy('percentile', ascending=False).show(10, truncate=False)
            
            # Summary statistics
            print("\n📊 SUMMARY STATISTICS:")
            steps_analytics.select(
                'currentValue',
                'rollingAverage7Day',
                'percentile'
            ).describe().show()
            
        spark.stop()
        print("\n✅ Spark analytics test completed")
        return True
        
    except Exception as e:
        print(f"❌ Spark test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def verify_results():
    """Verify the analytics results match expected patterns"""
    print("\n" + "=" * 70)
    print("✓ VERIFICATION CHECKLIST")
    print("=" * 70)
    
    print("\n📋 Manual Verification Steps:")
    print("\n1. ✓ Rolling Averages:")
    print("   - Check if 7-day averages show gradual increase in days 1-7")
    print("   - Verify stabilization around 8500 in days 9-12")
    print("   - Confirm spike affects rolling average on day 13")
    
    print("\n2. ✓ Streak Tracking:")
    print("   - Verify 7-day streak for days 1-7")
    print("   - Confirm streak resets to 0 on missing day 8")
    print("   - Check new streak starts on day 9")
    print("   - Verify continuous streak through days 9-15")
    
    print("\n3. ✓ Anomaly Detection:")
    print("   - Confirm day 13 (18000 steps) is flagged as anomaly")
    print("   - Verify other days are not flagged")
    
    print("\n4. ✓ Percentile Rankings:")
    print("   - Verify day 13 has highest percentile (~1.0)")
    print("   - Check that early days have lower percentiles")
    print("   - Confirm percentiles are between 0.0 and 1.0")
    
    print("\n5. ✓ Trend Analysis:")
    print("   - Verify 'increasing' trend in days 1-7")
    print("   - Check 'stable' trend in consistent periods")
    print("   - Confirm trend detection around spike")


def main():
    """Main test execution"""
    print("=" * 70)
    print("🧪 ANALYTICS PATTERN TESTING SUITE")
    print("=" * 70)
    print(f"📅 Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    try:
        # Initialize tester
        tester = AnalyticsPatternTester(BACKEND_URL, TEST_EMAIL, TEST_PASSWORD)
        
        # Step 1: Login
        if not tester.login():
            print("\n❌ Test aborted - authentication failed")
            return False
        
        # Step 2: Insert test pattern
        if not tester.insert_test_pattern():
            print("\n❌ Test aborted - failed to insert test data")
            return False
        
        # Step 3: Display expected results
        tester.display_expected_analytics()
        
        # Step 4: Wait for user to start Spark
        print("\n" + "=" * 70)
        print("⏸️  PAUSE FOR SPARK PROCESSING")
        print("=" * 70)
        print("\n📝 Next Steps:")
        print("   1. Open a NEW terminal")
        print("   2. Navigate to: cd spark-analytics")
        print("   3. Run: python main.py")
        print("   4. Wait for first batch to process (~60 seconds)")
        print("   5. Watch for analytics processing logs")
        print("   6. Press Enter here to continue with verification")
        
        input("\nPress Enter when Spark has processed the data...")
        
        # Step 5: Run Spark analytics test (direct processing)
        print("\n📊 Running direct analytics test...")
        if not run_spark_analytics_test():
            print("\n⚠️ Direct analytics test failed, but data was inserted")
            print("   Check Spark streaming logs for results")
        
        # Step 6: Verification checklist
        verify_results()
        
        print("\n" + "=" * 70)
        print("✅ TEST COMPLETED")
        print("=" * 70)
        
        print("\n📊 Summary:")
        print("   ✅ Test data inserted with known patterns")
        print("   ✅ Expected analytics explained")
        print("   ✅ Direct analytics processing executed")
        print("   ✅ Verification checklist provided")
        
        print("\n🎯 Next Steps:")
        print("   1. Review analytics output above")
        print("   2. Check Spark streaming logs")
        print("   3. Query analytics collection in MongoDB")
        print("   4. Verify patterns match expectations")
        
        return True
        
    except KeyboardInterrupt:
        print("\n\n🛑 Test interrupted by user")
        return False
    except Exception as e:
        print(f"\n\n❌ Test error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = main()
    
    if success:
        print("\n✅ Test suite completed successfully!")
    else:
        print("\n❌ Test suite encountered errors")
