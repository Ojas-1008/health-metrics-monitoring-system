"""
Health check endpoint for Spark job monitoring

Exposes /health endpoint for monitoring systems to query job status
Allows external systems to track:
- Job health status
- Last processed batch
- Last processing timestamp
- Error count and types
"""

import os
import json
from datetime import datetime
from typing import Dict, Any, Optional
from flask import Flask, jsonify, request
from threading import Thread, Lock
import time

# Thread-safe globals for job status
job_status_lock = Lock()
job_status = {
    'status': 'initializing',
    'last_batch_id': None,
    'last_processed_at': None,
    'errors_count': 0,
    'errors_by_type': {},
    'batches_processed': 0,
    'records_processed': 0,
    'start_time': datetime.utcnow().isoformat(),
    'version': '1.0'
}

# Store application reference globally for access from Spark job
_app_instance = None
_app_thread = None


def create_health_check_app(port: int = 5001, host: str = '0.0.0.0') -> Flask:
    """
    Create Flask app for health check endpoint
    
    Args:
        port: Port to run health check server on (default: 5001)
        host: Host to bind to (default: 0.0.0.0 for all interfaces)
        
    Returns:
        Flask application instance
    """
    app = Flask('spark-health-check')
    
    @app.route('/health', methods=['GET'])
    def health():
        """
        Health check endpoint
        
        Returns:
            JSON with job status
            
        Example response:
            {
                "status": "healthy",
                "last_batch_id": 42,
                "last_processed_at": "2025-11-21T09:45:30.123456",
                "errors_count": 2,
                "errors_by_type": {
                    "ServerSelectionTimeoutError": 1,
                    "AnalysisException": 1
                },
                "batches_processed": 100,
                "records_processed": 15000,
                "start_time": "2025-11-21T09:00:00.000000",
                "uptime_seconds": 2730,
                "version": "1.0"
            }
        """
        with job_status_lock:
            status_copy = job_status.copy()
        
        # Calculate uptime
        try:
            start = datetime.fromisoformat(status_copy['start_time'])
            uptime = (datetime.utcnow() - start).total_seconds()
            status_copy['uptime_seconds'] = int(uptime)
        except:
            status_copy['uptime_seconds'] = 0
        
        # Determine overall health
        if status_copy['errors_count'] > 0:
            status_copy['status'] = 'degraded' if status_copy['errors_count'] < 5 else 'unhealthy'
        else:
            status_copy['status'] = 'healthy'
        
        return jsonify(status_copy), 200
    
    @app.route('/health/detailed', methods=['GET'])
    def health_detailed():
        """
        Detailed health check with more information
        
        Returns:
            JSON with detailed job status and recommendations
        """
        with job_status_lock:
            status_copy = job_status.copy()
        
        # Calculate metrics
        try:
            start = datetime.fromisoformat(status_copy['start_time'])
            uptime = (datetime.utcnow() - start).total_seconds()
            status_copy['uptime_seconds'] = int(uptime)
            
            if status_copy['batches_processed'] > 0 and uptime > 0:
                status_copy['avg_batch_processing_time_sec'] = uptime / status_copy['batches_processed']
                status_copy['records_per_second'] = status_copy['records_processed'] / uptime
        except:
            pass
        
        # Determine health status with recommendations
        recommendations = []
        if status_copy['errors_count'] > 10:
            status_copy['status'] = 'unhealthy'
            recommendations.append('High error count detected - Review DLQ and error logs')
        elif status_copy['errors_count'] > 5:
            status_copy['status'] = 'degraded'
            recommendations.append('Moderate error rate - Monitor for patterns')
        else:
            status_copy['status'] = 'healthy'
        
        if status_copy['last_batch_id'] is None:
            recommendations.append('No batches processed yet - Job may be initializing')
        
        # Check if job is stale (no activity in 5 minutes)
        if status_copy['last_processed_at']:
            try:
                last_run = datetime.fromisoformat(status_copy['last_processed_at'])
                time_since_last_run = (datetime.utcnow() - last_run).total_seconds()
                status_copy['seconds_since_last_batch'] = int(time_since_last_run)
                
                if time_since_last_run > 300:  # 5 minutes
                    recommendations.append('Job appears stale (>5 min since last batch) - Check batch processing')
            except:
                pass
        
        status_copy['recommendations'] = recommendations
        
        return jsonify(status_copy), 200
    
    @app.route('/health/dlq', methods=['GET'])
    def health_dlq():
        """
        Get DLQ statistics
        
        Returns:
            JSON with dead-letter queue statistics
        """
        from error_handler import DeadLetterQueue
        
        dlq_stats = DeadLetterQueue.get_dlq_stats()
        
        return jsonify({
            'dlq': dlq_stats,
            'timestamp': datetime.utcnow().isoformat()
        }), 200
    
    @app.route('/health/ready', methods=['GET'])
    def ready():
        """
        Kubernetes-style readiness check
        
        Returns:
            200 if ready, 503 if not ready
        """
        with job_status_lock:
            is_ready = job_status['status'] in ['healthy', 'degraded']
        
        if is_ready:
            return jsonify({'ready': True}), 200
        else:
            return jsonify({'ready': False, 'reason': 'Job initializing or unhealthy'}), 503
    
    @app.route('/health/live', methods=['GET'])
    def live():
        """
        Kubernetes-style liveness check
        
        Returns:
            200 if alive, 503 if dead
        """
        # Simple liveness - just check if we can respond
        return jsonify({'alive': True}), 200
    
    return app


def start_health_check_server(port: int = 5001, debug: bool = False):
    """
    Start health check server in background thread
    
    Args:
        port: Port to run server on
        debug: Enable Flask debug mode
    """
    global _app_instance, _app_thread
    
    app = create_health_check_app(port)
    _app_instance = app
    
    def run_server():
        # Disable Flask's default logging
        import logging
        log = logging.getLogger('werkzeug')
        log.setLevel(logging.ERROR)
        
        app.run(host='0.0.0.0', port=port, debug=False, threaded=True)
    
    _app_thread = Thread(target=run_server, daemon=True)
    _app_thread.start()
    
    print(f"🏥 Health check server started on http://0.0.0.0:{port}")
    print(f"   - GET /health - Basic health status")
    print(f"   - GET /health/detailed - Detailed status with recommendations")
    print(f"   - GET /health/dlq - Dead-letter queue statistics")
    print(f"   - GET /health/ready - Kubernetes readiness probe")
    print(f"   - GET /health/live - Kubernetes liveness probe")


def update_batch_status(batch_id: int, records_processed: int = 0):
    """
    Update job status after batch completion
    
    Args:
        batch_id: ID of completed batch
        records_processed: Number of records processed in batch
    """
    with job_status_lock:
        job_status['last_batch_id'] = batch_id
        job_status['last_processed_at'] = datetime.utcnow().isoformat()
        job_status['batches_processed'] = job_status.get('batches_processed', 0) + 1
        job_status['records_processed'] = job_status.get('records_processed', 0) + records_processed
        job_status['status'] = 'healthy' if job_status['errors_count'] == 0 else 'degraded'


def update_error_status(error_type: str, increment: int = 1):
    """
    Update error tracking after error occurs
    
    Args:
        error_type: Type of error that occurred
        increment: Number to increment error count by (default: 1)
    """
    with job_status_lock:
        job_status['errors_count'] += increment
        if error_type not in job_status['errors_by_type']:
            job_status['errors_by_type'][error_type] = 0
        job_status['errors_by_type'][error_type] += increment
        
        # Mark as degraded if errors are occurring
        if job_status['errors_count'] > 0:
            job_status['status'] = 'degraded'


def set_job_status(status: str):
    """
    Set overall job status
    
    Args:
        status: Status string ('healthy', 'degraded', 'unhealthy', 'initializing')
    """
    with job_status_lock:
        job_status['status'] = status


# Example usage in Spark job:
if __name__ == '__main__':
    # This file is meant to be imported and used with Spark
    # But can be run standalone for testing
    print("Starting health check server for testing...")
    start_health_check_server(port=5001)
    
    # Simulate some activity
    for i in range(10):
        update_batch_status(i, records_processed=100 * (i + 1))
        if i == 3:
            update_error_status('TestError')
        time.sleep(2)
        print(f"Batch {i} completed. Status: {job_status['status']}")
    
    print("Test complete. Server still running on :5001/health")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Shutting down...")
