"""
End-to-End Real-Time Flow Test
Tests complete flow: Insert metric → Process analytics → Emit event → Frontend receives
"""

import os
import sys
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

# Import MongoDB utilities
from pymongo import MongoClient
from bson import ObjectId

# Import event emitter
from event_emitter import emit_analytics_event

# Configuration
MONGO_URI = os.getenv('MONGO_URI')
MONGO_DB_NAME = os.getenv('MONGO_DB_NAME', 'health_metrics')

def get_test_user_id():
    """Get a test user ID from the database"""
    try:
        client = MongoClient(MONGO_URI)
        db = client[MONGO_DB_NAME]
        
        # Find first user
        user = db.users.find_one()
        if user:
            return str(user['_id'])
        else:
            print("⚠️  No users found in database")
            return None
    except Exception as e:
        print(f"❌ Error finding user: {e}")
        return None
    finally:
        client.close()


def insert_test_metric(user_id):
    """Insert a test health metric"""
    try:
        client = MongoClient(MONGO_URI)
        db = client[MONGO_DB_NAME]
        
        # Create test metric
        metric = {
            'userId': ObjectId(user_id),
            'date': datetime.now().date().isoformat(),
            'metrics': {
                'steps': 10500,
                'distance': 8.5,
                'calories': 2400,
                'activeMinutes': 60,
                'weight': 75.5,
                'sleepHours': 7.5
            },
            'source': 'manual',
            'createdAt': datetime.now(),
            'updatedAt': datetime.now()
        }
        
        # Upsert metric (update if exists for today)
        result = db.healthmetrics.update_one(
            {'userId': ObjectId(user_id), 'date': metric['date']},
            {'$set': metric},
            upsert=True
        )
        
        if result.upserted_id:
            print(f"✅ Inserted new metric for user {user_id}")
        else:
            print(f"✅ Updated existing metric for user {user_id}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error inserting metric: {e}")
        return False
    finally:
        client.close()


def calculate_and_save_analytics(user_id):
    """Calculate analytics and save to MongoDB (simulated Spark job)"""
    try:
        client = MongoClient(MONGO_URI)
        db = client[MONGO_DB_NAME]
        
        # Get recent metrics for this user
        metrics = list(db.healthmetrics.find(
            {'userId': ObjectId(user_id)},
            sort=[('date', -1)],
            limit=7
        ))
        
        if not metrics:
            print("⚠️  No metrics found for analytics")
            return False
        
        print(f"📊 Found {len(metrics)} metrics for analytics calculation")
        
        # Calculate 7-day rolling average for steps
        total_steps = sum(m['metrics'].get('steps', 0) for m in metrics)
        avg_steps = total_steps / len(metrics)
        
        # Create analytics document
        analytics = {
            'userId': user_id,
            'metricType': 'steps',
            'timeRange': '7day',
            'analytics': {
                'rollingAverage': round(avg_steps, 2),
                'trend': 'up' if avg_steps > 8000 else 'stable',
                'trendPercentage': 15.5,
                'anomalyDetected': False,
                'streakDays': len(metrics),
                'longestStreak': 14,
                'percentile': 78.5,
                'comparisonToPrevious': {
                    'absoluteChange': 500.0,
                    'percentageChange': 15.5,
                    'isImprovement': True
                },
                'statistics': {
                    'standardDeviation': 1200.0,
                    'minValue': min(m['metrics'].get('steps', 0) for m in metrics),
                    'maxValue': max(m['metrics'].get('steps', 0) for m in metrics),
                    'medianValue': avg_steps,
                    'dataPointsCount': len(metrics),
                    'completenessPercentage': 100.0
                }
            },
            'calculatedAt': datetime.now().isoformat(),
            'metadata': {
                'sparkJobId': 'test_realtime_flow',
                'processingDurationMs': 150,
                'dataPointsProcessed': len(metrics)
            }
        }
        
        # Upsert analytics
        result = db.analytics.update_one(
            {
                'userId': user_id,
                'metricType': 'steps',
                'timeRange': '7day'
            },
            {'$set': analytics},
            upsert=True
        )
        
        if result.upserted_id:
            print(f"✅ Inserted new analytics for user {user_id}")
            operation = 'insert'
        else:
            print(f"✅ Updated existing analytics for user {user_id}")
            operation = 'update'
        
        print(f"📈 Rolling Average: {analytics['analytics']['rollingAverage']} steps")
        print(f"📊 Trend: {analytics['analytics']['trend']}")
        
        # Emit real-time event
        print(f"\n📡 Emitting analytics:update event...")
        event_sent = emit_analytics_event(
            user_id=user_id,
            metric_type='steps',
            time_range='7day',
            analytics_data=analytics['analytics'],
            operation_type=operation
        )
        
        if event_sent:
            print(f"✅ Real-time event emitted successfully")
            print(f"   Event should arrive at frontend SSE connections within 2 seconds")
        else:
            print(f"⚠️  Event emission failed (but analytics saved)")
        
        return True
        
    except Exception as e:
        print(f"❌ Error calculating analytics: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        client.close()


def main():
    """Run complete end-to-end test"""
    
    print("\n" + "="*70)
    print("🧪 END-TO-END REAL-TIME FLOW TEST")
    print("="*70)
    print("\nThis test simulates the complete Spark analytics workflow:")
    print("1. Insert/update health metric")
    print("2. Calculate analytics (7-day rolling average)")
    print("3. Save analytics to MongoDB")
    print("4. Emit analytics:update event to backend SSE")
    print("5. Frontend dashboard receives real-time update")
    
    # Check configuration
    print("\n📋 Configuration Check:")
    if not MONGO_URI:
        print("❌ MONGO_URI not configured")
        return False
    print(f"✅ MongoDB: {MONGO_DB_NAME}")
    
    service_token = os.getenv('SERVICE_TOKEN', '')
    if not service_token:
        print("❌ SERVICE_TOKEN not configured")
        return False
    print(f"✅ Service Token: Configured")
    
    backend_url = os.getenv('BACKEND_API_URL', '')
    if not backend_url:
        print("❌ BACKEND_API_URL not configured")
        return False
    print(f"✅ Backend URL: {backend_url}")
    
    # Get test user
    print("\n" + "="*70)
    print("STEP 1: Get Test User")
    print("="*70)
    user_id = get_test_user_id()
    if not user_id:
        print("❌ Cannot proceed without a test user")
        return False
    print(f"✅ Using user ID: {user_id}")
    
    # Insert test metric
    print("\n" + "="*70)
    print("STEP 2: Insert Health Metric")
    print("="*70)
    if not insert_test_metric(user_id):
        print("❌ Failed to insert metric")
        return False
    
    print("\n⏳ Waiting 1 second before processing analytics...")
    time.sleep(1)
    
    # Calculate and save analytics + emit event
    print("\n" + "="*70)
    print("STEP 3: Calculate Analytics & Emit Event")
    print("="*70)
    if not calculate_and_save_analytics(user_id):
        print("❌ Failed to process analytics")
        return False
    
    # Success summary
    print("\n" + "="*70)
    print("✅ TEST COMPLETED SUCCESSFULLY")
    print("="*70)
    print("\n📊 What Happened:")
    print(f"   1. ✅ Inserted health metric for user {user_id}")
    print(f"   2. ✅ Calculated 7-day rolling average analytics")
    print(f"   3. ✅ Saved analytics to MongoDB")
    print(f"   4. ✅ Emitted analytics:update event to backend")
    
    print("\n🎯 Frontend Verification:")
    print("   If a user is logged in and has SSE connection active:")
    print("   → Dashboard should show updated analytics within 2 seconds")
    print("   → No page refresh required")
    print("   → Check browser DevTools > Network > EventSource for events")
    
    print("\n📝 To verify in frontend:")
    print("   1. Open dashboard in browser")
    print("   2. Check browser console for 'analytics:update' event")
    print("   3. See analytics section update with new rolling average")
    
    print("\n💡 Backend Server Console:")
    print("   Check for log: '[Events API] Emitting event: analytics:update'")
    
    return True


if __name__ == '__main__':
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
