"""
Event Emitter Utility for Spark Analytics
Emits real-time events to the backend SSE system after writing analytics to MongoDB.
"""

import os
import time
from typing import Dict, Any, Optional, List
from collections import defaultdict
from dotenv import load_dotenv

# Import requests only when needed (lazy import for better startup performance)
try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False
    print("⚠️  WARNING: 'requests' library not installed. Event emission will be skipped.")
    print("   Install with: pip install requests")


# Load environment variables
load_dotenv()

# Configuration
BACKEND_API_URL = os.getenv('BACKEND_API_URL', 'http://localhost:5000')
SERVICE_TOKEN = os.getenv('SERVICE_TOKEN', '')
EMIT_ENDPOINT = f"{BACKEND_API_URL}/api/events/emit"

# Retry configuration
MAX_RETRIES = 3
INITIAL_BACKOFF_SECONDS = 0.5  # 500ms
MAX_BACKOFF_SECONDS = 5.0

# Batch configuration
MAX_BATCH_SIZE = 50  # Max analytics per batch event (prevents exceeding SSE size limits)
BATCH_DEBOUNCE_SECONDS = 2.0  # Collect events for 2 seconds before sending batch

# Global batch accumulator
_analytics_batch = defaultdict(list)  # {user_id: [analytics_objects]}
_batch_lock = None  # Thread lock for batch operations


def emit_analytics_event(
    user_id: str,
    metric_type: str,
    time_range: str,
    analytics_data: Dict[str, Any],
    operation_type: str = 'update'
) -> bool:
    """
    Emit an analytics:update event to the backend SSE system.
    
    Makes an HTTP POST request to the backend's /api/events/emit endpoint
    with retry logic to handle transient network failures.
    
    Args:
        user_id: MongoDB ObjectId as string (24 hex characters)
        metric_type: Health metric type (e.g., 'steps', 'calories', 'weight')
        time_range: Analytics time range ('7day', '30day', '90day')
        analytics_data: Complete analytics object to send in event payload
        operation_type: Type of operation ('insert', 'update', 'recalculate')
        
    Returns:
        bool: True if event was successfully emitted, False otherwise
        
    Example:
        success = emit_analytics_event(
            user_id='507f1f77bcf86cd799439011',
            metric_type='steps',
            time_range='7day',
            analytics_data={
                'rollingAverage': 8500.5,
                'trend': 'up',
                'anomalyDetected': False,
                ...
            },
            operation_type='update'
        )
    """
    
    # Skip if requests library not available
    if not REQUESTS_AVAILABLE:
        return False
    
    # Skip if SERVICE_TOKEN not configured
    if not SERVICE_TOKEN:
        print("⚠️  SERVICE_TOKEN not configured, skipping event emission")
        return False
    
    # Build event payload
    payload = {
        'userId': user_id,
        'eventType': 'analytics:update',
        'data': {
            'metricType': metric_type,
            'timeRange': time_range,
            'analytics': analytics_data,
            'operationType': operation_type
        }
    }
    
    # Build request headers with service token
    headers = {
        'Authorization': f'Bearer {SERVICE_TOKEN}',
        'Content-Type': 'application/json'
    }
    
    # Retry loop with exponential backoff
    backoff_seconds = INITIAL_BACKOFF_SECONDS
    
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            # Make HTTP POST request
            response = requests.post(
                EMIT_ENDPOINT,
                json=payload,
                headers=headers,
                timeout=5  # 5 second timeout
            )
            
            # Check response status
            if response.status_code == 200:
                result = response.json()
                connections_notified = result.get('connectionsNotified', 0)
                
                if connections_notified > 0:
                    print(f"   📡 Event emitted to {connections_notified} connection(s)")
                else:
                    print(f"   📡 Event emitted (no active connections)")
                
                return True
                
            elif response.status_code == 403:
                # Invalid service token - don't retry
                print(f"   ❌ Event emission failed: Invalid service token (403)")
                print(f"      Check SERVICE_TOKEN configuration")
                return False
                
            elif response.status_code == 400:
                # Bad request - don't retry (invalid payload)
                print(f"   ❌ Event emission failed: Bad request (400)")
                error_msg = response.json().get('message', 'Unknown error')
                print(f"      Error: {error_msg}")
                return False
                
            else:
                # Other errors - retry
                print(f"   ⚠️  Event emission attempt {attempt}/{MAX_RETRIES} failed: HTTP {response.status_code}")
                
                if attempt < MAX_RETRIES:
                    print(f"      Retrying in {backoff_seconds:.1f}s...")
                    time.sleep(backoff_seconds)
                    backoff_seconds = min(backoff_seconds * 2, MAX_BACKOFF_SECONDS)
                    
        except requests.exceptions.Timeout:
            print(f"   ⚠️  Event emission attempt {attempt}/{MAX_RETRIES} timed out")
            
            if attempt < MAX_RETRIES:
                print(f"      Retrying in {backoff_seconds:.1f}s...")
                time.sleep(backoff_seconds)
                backoff_seconds = min(backoff_seconds * 2, MAX_BACKOFF_SECONDS)
                
        except requests.exceptions.ConnectionError as e:
            print(f"   ⚠️  Event emission attempt {attempt}/{MAX_RETRIES} failed: Connection error")
            print(f"      Error: {str(e)}")
            
            if attempt < MAX_RETRIES:
                print(f"      Retrying in {backoff_seconds:.1f}s...")
                time.sleep(backoff_seconds)
                backoff_seconds = min(backoff_seconds * 2, MAX_BACKOFF_SECONDS)
                
        except Exception as e:
            print(f"   ⚠️  Event emission attempt {attempt}/{MAX_RETRIES} failed: {type(e).__name__}")
            print(f"      Error: {str(e)}")
            
            if attempt < MAX_RETRIES:
                print(f"      Retrying in {backoff_seconds:.1f}s...")
                time.sleep(backoff_seconds)
                backoff_seconds = min(backoff_seconds * 2, MAX_BACKOFF_SECONDS)
    
    # All retries exhausted
    print(f"   ❌ Event emission failed after {MAX_RETRIES} attempts")
    return False


def emit_analytics_error(
    user_id: str,
    error_message: str,
    error_type: str = 'processing_error',
    context: Optional[Dict[str, Any]] = None
) -> bool:
    """
    Emit an analytics:error event to notify users of processing failures.
    
    Args:
        user_id: MongoDB ObjectId as string
        error_message: Human-readable error message
        error_type: Error category (e.g., 'processing_error', 'insufficient_data')
        context: Optional additional context about the error
        
    Returns:
        bool: True if event was successfully emitted, False otherwise
    """
    
    if not REQUESTS_AVAILABLE or not SERVICE_TOKEN:
        return False
    
    payload = {
        'userId': user_id,
        'eventType': 'analytics:error',
        'data': {
            'errorType': error_type,
            'message': error_message,
            'context': context or {},
            'timestamp': time.time()
        }
    }
    
    headers = {
        'Authorization': f'Bearer {SERVICE_TOKEN}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.post(
            EMIT_ENDPOINT,
            json=payload,
            headers=headers,
            timeout=5
        )
        
        if response.status_code == 200:
            print(f"   📡 Error event emitted to user {user_id}")
            return True
        else:
            print(f"   ⚠️  Failed to emit error event: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"   ⚠️  Failed to emit error event: {str(e)}")
        return False


def add_to_batch(
    user_id: str,
    metric_type: str,
    time_range: str,
    analytics_data: Dict[str, Any],
    operation_type: str = 'update'
) -> None:
    """
    Add analytics to the batch accumulator for later batch emission.
    
    This function is used during large batch processing (e.g., 30-day initial sync)
    to collect all analytics for a user and send them in aggregated batches
    instead of N individual events.
    
    Args:
        user_id: MongoDB ObjectId as string
        metric_type: Health metric type
        time_range: Analytics time range
        analytics_data: Complete analytics object
        operation_type: Type of operation
    """
    
    analytics_obj = {
        'metricType': metric_type,
        'timeRange': time_range,
        'analytics': analytics_data,
        'operationType': operation_type
    }
    
    _analytics_batch[user_id].append(analytics_obj)


def emit_batched_analytics(user_id: str = None, force_all: bool = False) -> Dict[str, int]:
    """
    Emit accumulated analytics as batched events.
    
    Sends analytics:batch_update events with up to MAX_BATCH_SIZE analytics per event.
    If a user has more than MAX_BATCH_SIZE analytics, splits into multiple batch events.
    
    Args:
        user_id: Specific user to emit batch for (None = all users)
        force_all: Force emission even if batch is small
        
    Returns:
        dict: Statistics about emission (users_processed, batches_sent, analytics_sent)
    """
    
    if not REQUESTS_AVAILABLE or not SERVICE_TOKEN:
        return {'users_processed': 0, 'batches_sent': 0, 'analytics_sent': 0}
    
    stats = {'users_processed': 0, 'batches_sent': 0, 'analytics_sent': 0}
    
    # Determine which users to process
    users_to_process = [user_id] if user_id else list(_analytics_batch.keys())
    
    for uid in users_to_process:
        if uid not in _analytics_batch or len(_analytics_batch[uid]) == 0:
            continue
        
        analytics_list = _analytics_batch[uid]
        total_analytics = len(analytics_list)
        
        # Skip if batch is too small and not forced (debouncing)
        if total_analytics < 3 and not force_all:
            continue
        
        print(f"\n📦 Batching {total_analytics} analytics for user {uid}")
        
        # Split into chunks of MAX_BATCH_SIZE
        chunks = [
            analytics_list[i:i + MAX_BATCH_SIZE]
            for i in range(0, total_analytics, MAX_BATCH_SIZE)
        ]
        
        for chunk_idx, chunk in enumerate(chunks, 1):
            # Build batch payload
            payload = {
                'userId': uid,
                'eventType': 'analytics:batch_update',
                'data': {
                    'analytics': chunk,
                    'count': len(chunk),
                    'batchIndex': chunk_idx,
                    'totalBatches': len(chunks)
                }
            }
            
            headers = {
                'Authorization': f'Bearer {SERVICE_TOKEN}',
                'Content-Type': 'application/json'
            }
            
            # Send batch event with retry logic
            backoff_seconds = INITIAL_BACKOFF_SECONDS
            success = False
            
            for attempt in range(1, MAX_RETRIES + 1):
                try:
                    response = requests.post(
                        EMIT_ENDPOINT,
                        json=payload,
                        headers=headers,
                        timeout=5
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        connections_notified = result.get('connectionsNotified', 0)
                        
                        if connections_notified > 0:
                            print(f"   📡 Batch {chunk_idx}/{len(chunks)} emitted to {connections_notified} connection(s) ({len(chunk)} analytics)")
                        else:
                            print(f"   📡 Batch {chunk_idx}/{len(chunks)} emitted (no active connections)")
                        
                        stats['batches_sent'] += 1
                        stats['analytics_sent'] += len(chunk)
                        success = True
                        break
                    
                    elif response.status_code in [403, 400]:
                        print(f"   ❌ Batch emission failed: HTTP {response.status_code}")
                        break
                    else:
                        print(f"   ⚠️  Batch emission attempt {attempt}/{MAX_RETRIES} failed: HTTP {response.status_code}")
                        if attempt < MAX_RETRIES:
                            time.sleep(backoff_seconds)
                            backoff_seconds = min(backoff_seconds * 2, MAX_BACKOFF_SECONDS)
                            
                except Exception as e:
                    print(f"   ⚠️  Batch emission attempt {attempt}/{MAX_RETRIES} failed: {str(e)}")
                    if attempt < MAX_RETRIES:
                        time.sleep(backoff_seconds)
                        backoff_seconds = min(backoff_seconds * 2, MAX_BACKOFF_SECONDS)
            
            if not success:
                print(f"   ❌ Failed to emit batch {chunk_idx}/{len(chunks)} after {MAX_RETRIES} attempts")
        
        # Clear batch for this user
        _analytics_batch[uid].clear()
        stats['users_processed'] += 1
    
    return stats


def flush_all_batches() -> Dict[str, int]:
    """
    Force emission of all accumulated batches.
    
    Call this at the end of a Spark batch job to ensure all analytics are sent.
    
    Returns:
        dict: Statistics about emission
    """
    
    print("\n🚀 Flushing all accumulated analytics batches...")
    stats = emit_batched_analytics(force_all=True)
    
    if stats['batches_sent'] > 0:
        print(f"✅ Flushed {stats['analytics_sent']} analytics across {stats['batches_sent']} batch(es) for {stats['users_processed']} user(s)")
    else:
        print("📭 No batches to flush")
    
    return stats


def test_event_emission():
    """
    Test function to verify event emission is working correctly.
    Run this before processing analytics to ensure connectivity.
    """
    
    print("\n" + "="*60)
    print("🧪 TESTING EVENT EMISSION")
    print("="*60)
    
    if not REQUESTS_AVAILABLE:
        print("❌ FAIL: requests library not installed")
        return False
    
    if not SERVICE_TOKEN:
        print("❌ FAIL: SERVICE_TOKEN not configured")
        return False
    
    print(f"✅ Backend API URL: {BACKEND_API_URL}")
    print(f"✅ Service token configured: {SERVICE_TOKEN[:10]}...")
    
    # Test with dummy data
    test_user_id = "507f1f77bcf86cd799439011"  # Example MongoDB ObjectId
    
    print(f"\n📤 Sending test event to {EMIT_ENDPOINT}...")
    
    success = emit_analytics_event(
        user_id=test_user_id,
        metric_type='steps',
        time_range='7day',
        analytics_data={
            'rollingAverage': 8500.5,
            'trend': 'up',
            'anomalyDetected': False
        },
        operation_type='test'
    )
    
    if success:
        print("\n✅ Event emission test PASSED")
        return True
    else:
        print("\n❌ Event emission test FAILED")
        print("   Check:")
        print("   1. Backend server is running (http://localhost:5000)")
        print("   2. SERVICE_TOKEN matches between Spark and backend .env")
        print("   3. Network connectivity to backend")
        return False


if __name__ == '__main__':
    # Run test when executed directly
    test_event_emission()
