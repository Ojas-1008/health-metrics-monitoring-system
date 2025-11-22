#!/usr/bin/env python3
"""
Comprehensive Error Handling Testing Script

Tests all error handling scenarios:
1. MongoDB connection failure
2. Backend API timeout
3. Schema mismatch
4. Graceful recovery after service restart
5. DLQ dead-letter queue functionality
6. Health check endpoint

Run: python test_error_handling.py
"""

import os
import sys
import json
import time
import requests
from datetime import datetime
from typing import Dict, List, Tuple
import traceback

# Add spark-analytics directory to path
sys.path.insert(0, os.path.dirname(__file__))

print("""
╔════════════════════════════════════════════════════════════════╗
║     SPARK ANALYTICS - ERROR HANDLING TEST SUITE               ║
╚════════════════════════════════════════════════════════════════╝
""")

class TestResults:
    """Track test results"""
    def __init__(self):
        self.passed = []
        self.failed = []
        self.warnings = []
    
    def add_pass(self, test_name: str):
        self.passed.append(test_name)
        print(f"  ✅ {test_name}")
    
    def add_fail(self, test_name: str, reason: str):
        self.failed.append((test_name, reason))
        print(f"  ❌ {test_name}: {reason}")
    
    def add_warning(self, test_name: str, message: str):
        self.warnings.append((test_name, message))
        print(f"  ⚠️  {test_name}: {message}")
    
    def summary(self):
        total = len(self.passed) + len(self.failed)
        print(f"\n{'='*60}")
        print(f"TEST SUMMARY")
        print(f"{'='*60}")
        print(f"✅ Passed:  {len(self.passed)}/{total}")
        print(f"❌ Failed:  {len(self.failed)}/{total}")
        print(f"⚠️  Warnings: {len(self.warnings)}")
        
        if self.failed:
            print(f"\nFailed Tests:")
            for test, reason in self.failed:
                print(f"  - {test}: {reason}")
        
        if self.warnings:
            print(f"\nWarnings:")
            for test, message in self.warnings:
                print(f"  - {test}: {message}")
        
        return len(self.failed) == 0

results = TestResults()

def safe_import(module_name):
    """Safely import a module"""
    try:
        return __import__(module_name)
    except ImportError:
        return None

# ============================================
# TEST 1: Import Error Handling Modules
# ============================================

print("\n[TEST 1] Import Error Handling Modules")
print("-" * 60)

error_handler_module = safe_import('error_handler')
health_check_module = safe_import('health_check')

if error_handler_module:
    results.add_pass("error_handler module imported")
else:
    results.add_fail("error_handler import", "Module not found")
        print(f"❌ {name} - Error: {e}")
        return False

def main():
    """Run tests"""
    print_header("Health Check System Test Suite")
    
    print("📋 Testing health check endpoints...")
    print(f"   Base URL: {HEALTH_CHECK_URL}")
    print(f"   (Make sure Spark job is running with health check started)")
    
    # Test basic endpoint
    print_header("Test 1: Basic Health Check")
    if not test_endpoint("GET /health", ENDPOINTS['health']):
        print("\n⚠️  Health check server not responding")
        print("   Start the Spark job first: python main.py")
        return
    
    # Wait a moment
    time.sleep(1)
    
    # Test detailed endpoint
    print_header("Test 2: Detailed Health Status")
    test_endpoint("GET /health/detailed", ENDPOINTS['detailed'])
    
    # Test DLQ endpoint
    print_header("Test 3: Dead-Letter Queue Statistics")
    test_endpoint("GET /health/dlq", ENDPOINTS['dlq'])
    
    # Test readiness probe
    print_header("Test 4: Kubernetes Readiness Probe")
    try:
        response = requests.get(ENDPOINTS['ready'], timeout=5)
        status = "READY" if response.status_code == 200 else "NOT_READY"
        print(f"✅ GET /health/ready")
        print(f"   Status: {response.status_code}")
        print(f"   Readiness: {status}")
        print(f"   Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"❌ GET /health/ready - Error: {e}")
    
    # Test liveness probe
    print_header("Test 5: Kubernetes Liveness Probe")
    try:
        response = requests.get(ENDPOINTS['live'], timeout=5)
        status = "ALIVE" if response.status_code == 200 else "DEAD"
        print(f"✅ GET /health/live")
        print(f"   Status: {response.status_code}")
        print(f"   Liveness: {status}")
        print(f"   Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"❌ GET /health/live - Error: {e}")
    
    # Test health check details
    print_header("Test 6: Analyze Health Status")
    try:
        response = requests.get(ENDPOINTS['health'], timeout=5)
        data = response.json()
        
        print("📊 Job Status Analysis:")
        print(f"   Status: {data.get('status', 'unknown').upper()}")
        print(f"   Batches Processed: {data.get('batches_processed', 0)}")
        print(f"   Records Processed: {data.get('records_processed', 0)}")
        print(f"   Uptime: {data.get('uptime_seconds', 0)} seconds")
        print(f"   Errors: {data.get('errors_count', 0)}")
        
        if data.get('errors_by_type'):
            print(f"\n   Error Breakdown:")
            for error_type, count in data['errors_by_type'].items():
                print(f"     - {error_type}: {count}")
        
        if data.get('last_batch_id') is not None:
            print(f"\n   Last Batch: {data['last_batch_id']}")
            print(f"   Last Processed: {data.get('last_processed_at', 'N/A')}")
        
    except Exception as e:
        print(f"❌ Analysis failed: {e}")
    
    # Instructions
    print_header("Next Steps")
    print("""
1. 📊 Monitor health status:
   curl http://localhost:5001/health | python -m json.tool
   
2. 🔍 Check DLQ for failed batches:
   curl http://localhost:5001/health/dlq | python -m json.tool
   
3. 📂 View DLQ files:
   ls -la spark-analytics/dlq/
   cat spark-analytics/dlq/failed_batches_*.json | python -m json.tool
   
4. 🔄 Trigger an error (optional):
   - Stop MongoDB to simulate connection error
   - Job will write to DLQ instead of crashing
   - Check health endpoint to see degraded status
   
5. 📖 Read documentation:
   - ERROR_HANDLING_GUIDE.md - Full system documentation
   - error_handler.py - ErrorHandler and DLQ classes
   - health_check.py - Health check endpoints
   - main.py - Integration in Spark job
   """)

if __name__ == '__main__':
    main()
