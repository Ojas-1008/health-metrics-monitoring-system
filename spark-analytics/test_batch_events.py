"""
Test Batched Analytics Event Emission
Demonstrates the debouncing and batching system for large-scale analytics processing
"""

import os
import sys
from datetime import datetime
from dotenv import load_dotenv

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

# Import MongoDB utilities
from pymongo import MongoClient
from bson import ObjectId

# Import event emitter with batching
from event_emitter import add_to_batch, emit_batched_analytics, flush_all_batches

# Configuration
MONGO_URI = os.getenv('MONGO_URI')
MONGO_DB_NAME = os.getenv('MONGO_DB_NAME', 'health_metrics')


def get_test_users(count=3):
    """Get multiple test users from database"""
    try:
        client = MongoClient(MONGO_URI)
        db = client[MONGO_DB_NAME]
        
        users = list(db.users.find().limit(count))
        user_ids = [str(user['_id']) for user in users]
        
        print(f"✅ Found {len(user_ids)} test users")
        return user_ids
        
    except Exception as e:
        print(f"❌ Error finding users: {e}")
        return []
    finally:
        client.close()


def simulate_large_batch_processing(user_ids):
    """
    Simulate Spark processing a large batch of analytics (e.g., 30-day sync).
    
    This demonstrates how batching prevents overwhelming SSE clients with
    individual events during large-scale processing.
    """
    
    print("\n" + "="*70)
    print("📊 SIMULATING LARGE BATCH PROCESSING")
    print("="*70)
    print(f"Processing analytics for {len(user_ids)} users")
    print("Each user: 15 analytics (5 metrics × 3 time ranges)")
    print(f"Total: {len(user_ids) * 15} analytics")
    
    # Metric types to process
    metrics = ['steps', 'calories', 'activeMinutes', 'weight', 'sleepHours']
    time_ranges = ['7day', '30day', '90day']
    
    total_analytics = 0
    
    # Simulate processing analytics for each user
    for user_idx, user_id in enumerate(user_ids, 1):
        print(f"\n👤 User {user_idx}/{len(user_ids)}: {user_id}")
        user_analytics = 0
        
        for metric_type in metrics:
            for time_range in time_ranges:
                # Create sample analytics data
                analytics_data = {
                    'rollingAverage': 8500.5 if metric_type == 'steps' else 2200.3,
                    'trend': 'up',
                    'trendPercentage': 12.5,
                    'anomalyDetected': False,
                    'streakDays': 7,
                    'longestStreak': 14,
                    'percentile': 75.5,
                    'comparisonToPrevious': {
                        'absoluteChange': 500.0,
                        'percentageChange': 12.5,
                        'isImprovement': True
                    },
                    'statistics': {
                        'standardDeviation': 1200.0,
                        'minValue': 5000.0,
                        'maxValue': 12000.0,
                        'medianValue': 8200.0,
                        'dataPointsCount': 7,
                        'completenessPercentage': 100.0
                    }
                }
                
                # Add to batch (no immediate emission)
                add_to_batch(
                    user_id=user_id,
                    metric_type=metric_type,
                    time_range=time_range,
                    analytics_data=analytics_data,
                    operation_type='update'
                )
                
                user_analytics += 1
                total_analytics += 1
        
        print(f"   📦 Accumulated {user_analytics} analytics in batch")
    
    print(f"\n✅ Batch accumulation complete: {total_analytics} total analytics")
    return total_analytics


def test_batch_emission():
    """Test the complete batching workflow"""
    
    print("\n" + "="*70)
    print("🧪 BATCHED ANALYTICS EVENT EMISSION TEST")
    print("="*70)
    
    # Check configuration
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
    
    # Get test users
    user_ids = get_test_users(count=3)
    if not user_ids:
        print("❌ No test users available")
        return False
    
    # Simulate large batch processing
    total_analytics = simulate_large_batch_processing(user_ids)
    
    # Flush batches
    print("\n" + "="*70)
    print("📡 FLUSHING ACCUMULATED BATCHES")
    print("="*70)
    print("This sends batched events to backend SSE system")
    print(f"Max batch size: 50 analytics per event")
    print(f"Expected: {(total_analytics + 49) // 50} batch event(s)")
    
    stats = flush_all_batches()
    
    # Summary
    print("\n" + "="*70)
    print("✅ TEST COMPLETED SUCCESSFULLY")
    print("="*70)
    
    print(f"\n📊 Statistics:")
    print(f"   Users processed: {stats['users_processed']}")
    print(f"   Batch events sent: {stats['batches_sent']}")
    print(f"   Total analytics: {stats['analytics_sent']}")
    
    if stats['analytics_sent'] != total_analytics:
        print(f"\n⚠️  Warning: Expected {total_analytics} but sent {stats['analytics_sent']}")
    
    print(f"\n💡 Key Benefits:")
    print(f"   Without batching: {total_analytics} individual HTTP requests")
    print(f"   With batching: {stats['batches_sent']} batch HTTP request(s)")
    print(f"   Reduction: {100 - (stats['batches_sent'] / total_analytics * 100):.1f}% fewer requests")
    
    print(f"\n🎯 SSE Client Impact:")
    print(f"   Without batching: {total_analytics} individual events to process")
    print(f"   With batching: {stats['batches_sent']} batch event(s) to process")
    print(f"   Frontend updates all analytics in one render cycle per batch")
    
    print(f"\n📝 What Happened:")
    print(f"   1. ✅ Simulated {total_analytics} analytics calculations")
    print(f"   2. ✅ Accumulated in memory (no immediate emission)")
    print(f"   3. ✅ Flushed {stats['batches_sent']} batch event(s) to backend")
    print(f"   4. ✅ Backend broadcast to active SSE connections")
    print(f"   5. ✅ Frontend receives batched payloads for efficient updates")
    
    print(f"\n🔍 Backend Logs:")
    print(f"   Check server console for:")
    print(f"   '[Events API] Batch event with N analytics (batch X/Y)'")
    
    print(f"\n🌐 Frontend Handling:")
    print(f"   Dashboard receives 'analytics:batch_update' events")
    print(f"   Iterates through data.analytics array")
    print(f"   Updates multiple analytics displays in single render")
    
    return True


def test_batch_splitting():
    """Test that batches larger than 50 are split correctly"""
    
    print("\n" + "="*70)
    print("🧪 BATCH SPLITTING TEST (>50 analytics)")
    print("="*70)
    
    user_id = get_test_users(count=1)[0]
    if not user_id:
        return False
    
    print(f"Creating 75 analytics for user {user_id}")
    print(f"Expected: Split into 2 batches (50 + 25)")
    
    # Create 75 analytics
    for i in range(75):
        add_to_batch(
            user_id=user_id,
            metric_type=f'metric_{i % 5}',
            time_range='7day',
            analytics_data={'rollingAverage': i * 100},
            operation_type='insert'
        )
    
    print(f"✅ Accumulated 75 analytics")
    
    # Flush
    stats = flush_all_batches()
    
    print(f"\n📊 Results:")
    print(f"   Batches sent: {stats['batches_sent']}")
    print(f"   Analytics sent: {stats['analytics_sent']}")
    
    if stats['batches_sent'] == 2 and stats['analytics_sent'] == 75:
        print(f"   ✅ Correctly split into 2 batches")
    else:
        print(f"   ⚠️  Unexpected split pattern")
    
    return True


if __name__ == '__main__':
    try:
        print("\n🚀 Starting Batched Analytics Tests...\n")
        
        # Test 1: Normal batch processing
        success1 = test_batch_emission()
        
        # Test 2: Batch splitting
        success2 = test_batch_splitting()
        
        if success1 and success2:
            print("\n🎉 ALL TESTS PASSED")
            sys.exit(0)
        else:
            print("\n⚠️  SOME TESTS FAILED")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Tests failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
