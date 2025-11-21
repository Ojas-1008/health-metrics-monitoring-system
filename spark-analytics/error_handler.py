"""
Comprehensive error handling for Spark job

Handles:
- Dead-letter queue (DLQ) for failed batches
- Specific exception handling (MongoDB, requests, Spark SQL)
- Detailed error logging with stack traces
- Error recovery and continuation logic
"""

import os
import json
import traceback
from datetime import datetime
from typing import Dict, List, Any, Optional
import pymongo
import requests
from pyspark.sql.utils import AnalysisException

# DLQ Configuration
DLQ_DIR = os.path.join(os.path.dirname(__file__), 'dlq')
os.makedirs(DLQ_DIR, exist_ok=True)


class ErrorHandler:
    """Centralized error handling for Spark job"""
    
    # Global error tracking
    total_errors = 0
    errors_by_type = {}
    
    @staticmethod
    def log_error(batch_id: int, error: Exception, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Log error with full context and stack trace
        
        Args:
            batch_id: ID of the batch that failed
            error: The exception that occurred
            context: Additional context information (e.g., records processed, stage)
            
        Returns:
            Error details dictionary
        """
        timestamp = datetime.utcnow().isoformat()
        error_type = type(error).__name__
        error_message = str(error)
        stack_trace = traceback.format_exc()
        
        error_details = {
            'timestamp': timestamp,
            'batch_id': batch_id,
            'error_type': error_type,
            'error_message': error_message,
            'stack_trace': stack_trace,
            'context': context or {}
        }
        
        # Update global error tracking
        ErrorHandler.total_errors += 1
        ErrorHandler.errors_by_type[error_type] = ErrorHandler.errors_by_type.get(error_type, 0) + 1
        
        # Print to console with emoji indicators
        print(f"❌ Error in batch {batch_id} ({error_type}): {error_message}")
        print(f"   Timestamp: {timestamp}")
        if context:
            print(f"   Context: {context}")
        
        return error_details


    @staticmethod
    def handle_mongodb_error(batch_id: int, error: pymongo.errors.ServerSelectionTimeoutError, 
                            context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Handle MongoDB connection timeout errors
        
        Args:
            batch_id: ID of the batch that failed
            error: MongoDB ServerSelectionTimeoutError
            context: Additional context
            
        Returns:
            Error details with retry recommendation
        """
        error_details = ErrorHandler.log_error(batch_id, error, context)
        
        # Add specific MongoDB recommendations
        error_details['recommendation'] = 'MongoDB connection timeout - Check network connectivity and MongoDB Atlas status'
        error_details['action'] = 'RETRY'
        error_details['retry_delay_seconds'] = 30
        
        print(f"   💡 Recommendation: {error_details['recommendation']}")
        print(f"   🔄 Action: {error_details['action']} (after {error_details['retry_delay_seconds']}s)")
        
        return error_details


    @staticmethod
    def handle_request_timeout(batch_id: int, error: requests.exceptions.Timeout,
                               context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Handle API request timeout errors
        
        Args:
            batch_id: ID of the batch that failed
            error: requests.exceptions.Timeout
            context: Additional context (e.g., endpoint, timeout_seconds)
            
        Returns:
            Error details with retry recommendation
        """
        error_details = ErrorHandler.log_error(batch_id, error, context)
        
        # Add specific request timeout recommendations
        endpoint = context.get('endpoint', 'unknown') if context else 'unknown'
        error_details['recommendation'] = f'API request timeout to {endpoint} - Backend may be slow or unreachable'
        error_details['action'] = 'RETRY'
        error_details['retry_delay_seconds'] = 60
        
        print(f"   💡 Recommendation: {error_details['recommendation']}")
        print(f"   🔄 Action: {error_details['action']} (after {error_details['retry_delay_seconds']}s)")
        
        return error_details


    @staticmethod
    def handle_schema_mismatch(batch_id: int, error: AnalysisException,
                               context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Handle Spark SQL schema mismatch errors
        
        Args:
            batch_id: ID of the batch that failed
            error: AnalysisException from Spark SQL
            context: Additional context (e.g., expected_schema, actual_schema)
            
        Returns:
            Error details with debug information
        """
        error_details = ErrorHandler.log_error(batch_id, error, context)
        
        # Add schema-specific debugging info
        error_details['recommendation'] = 'Spark SQL schema mismatch - Check MongoDB document structure and schema definition'
        error_details['action'] = 'SKIP_BATCH'  # Cannot retry schema mismatches
        error_details['debug_info'] = {
            'expected_schema': context.get('expected_schema') if context else None,
            'actual_schema': context.get('actual_schema') if context else None
        }
        
        print(f"   💡 Recommendation: {error_details['recommendation']}")
        print(f"   🔄 Action: {error_details['action']} - Batch will be written to DLQ")
        
        return error_details


    @staticmethod
    def handle_generic_error(batch_id: int, error: Exception,
                            context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Handle generic/unexpected errors
        
        Args:
            batch_id: ID of the batch that failed
            error: Any other exception
            context: Additional context
            
        Returns:
            Error details with safe defaults
        """
        error_details = ErrorHandler.log_error(batch_id, error, context)
        
        # Safe default: skip batch to prevent cascading failures
        error_details['recommendation'] = 'Unexpected error - Batch will be written to DLQ for manual investigation'
        error_details['action'] = 'SKIP_BATCH_TO_DLQ'
        
        print(f"   💡 Recommendation: {error_details['recommendation']}")
        print(f"   🔄 Action: {error_details['action']}")
        
        return error_details


class DeadLetterQueue:
    """Dead-letter queue for failed batches"""
    
    @staticmethod
    def get_dlq_filename() -> str:
        """Get DLQ filename with current date"""
        date_str = datetime.utcnow().strftime('%Y%m%d')
        return f'failed_batches_{date_str}.json'
    
    @staticmethod
    def write_failed_batch(batch_id: int, batch_df, error_details: Dict[str, Any],
                          sample_records: List[Dict[str, Any]] = None, max_samples: int = 5) -> bool:
        """
        Write failed batch to DLQ for manual inspection
        
        Args:
            batch_id: ID of the batch that failed
            batch_df: The Spark DataFrame (if available)
            error_details: Error details from ErrorHandler
            sample_records: Sample records from the failed batch (optional)
            max_samples: Maximum number of sample records to include
            
        Returns:
            True if write successful, False otherwise
        """
        try:
            dlq_entry = {
                'batch_id': batch_id,
                'timestamp': datetime.utcnow().isoformat(),
                'error': {
                    'type': error_details.get('error_type'),
                    'message': error_details.get('error_message'),
                    'recommendation': error_details.get('recommendation'),
                    'action': error_details.get('action')
                },
                'context': error_details.get('context'),
                'sample_records': sample_records[:max_samples] if sample_records else []
            }
            
            # Get DLQ filename
            dlq_filename = DeadLetterQueue.get_dlq_filename()
            dlq_filepath = os.path.join(DLQ_DIR, dlq_filename)
            
            # Read existing entries or create new list
            dlq_entries = []
            if os.path.exists(dlq_filepath):
                try:
                    with open(dlq_filepath, 'r') as f:
                        dlq_entries = json.load(f)
                except (json.JSONDecodeError, IOError):
                    dlq_entries = []
            
            # Append new entry
            dlq_entries.append(dlq_entry)
            
            # Write back to file
            with open(dlq_filepath, 'w') as f:
                json.dump(dlq_entries, f, indent=2, default=str)
            
            print(f"📝 Failed batch {batch_id} written to DLQ: {dlq_filepath}")
            print(f"   Error: {error_details.get('error_type')} - {error_details.get('error_message')}")
            print(f"   Sample records included: {len(sample_records) if sample_records else 0}")
            
            return True
            
        except Exception as e:
            print(f"⚠️  Failed to write DLQ entry: {str(e)}")
            return False
    
    @staticmethod
    def get_dlq_stats() -> Dict[str, Any]:
        """Get statistics about DLQ entries"""
        try:
            dlq_filename = DeadLetterQueue.get_dlq_filename()
            dlq_filepath = os.path.join(DLQ_DIR, dlq_filename)
            
            if not os.path.exists(dlq_filepath):
                return {'entries': 0, 'filepath': dlq_filepath}
            
            with open(dlq_filepath, 'r') as f:
                dlq_entries = json.load(f)
            
            error_types = {}
            for entry in dlq_entries:
                error_type = entry.get('error', {}).get('type', 'unknown')
                error_types[error_type] = error_types.get(error_type, 0) + 1
            
            return {
                'entries': len(dlq_entries),
                'filepath': dlq_filepath,
                'error_types': error_types,
                'first_error': dlq_entries[0] if dlq_entries else None,
                'last_error': dlq_entries[-1] if dlq_entries else None
            }
        except Exception as e:
            print(f"⚠️  Error reading DLQ stats: {str(e)}")
            return {'error': str(e)}
