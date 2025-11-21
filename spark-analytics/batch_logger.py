"""
Batch Processing Logger and Monitoring Framework

Provides structured logging for Spark batch processing with:
- Batch statistics tracking (records processed, analytics computed, write results)
- Summary log lines with emoji indicators
- Processing time metrics
- Error tracking and reporting
- JSON log file output for analysis
- Metrics file for Prometheus/monitoring integration
"""

import os
import json
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any


class BatchLogger:
    """
    Logger for tracking batch processing statistics and metrics.
    
    Writes structured logs to:
    1. Console (stdout) - Human-readable with emojis
    2. JSON log file - Machine-readable for analysis
    3. Metrics file - Prometheus-compatible format
    """
    
    def __init__(self, log_dir: str = './logs', metrics_dir: str = './metrics'):
        """
        Initialize the batch logger.
        
        Args:
            log_dir: Directory for JSON log files
            metrics_dir: Directory for metrics files
        """
        self.log_dir = Path(log_dir)
        self.metrics_dir = Path(metrics_dir)
        
        # Create directories if they don't exist
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self.metrics_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize metrics tracking
        self.session_metrics = {
            'batches_processed_total': 0,
            'batches_succeeded': 0,
            'batches_failed': 0,
            'analytics_written_total': 0,
            'analytics_inserted_total': 0,
            'analytics_updated_total': 0,
            'analytics_skipped_total': 0,
            'records_processed_total': 0,
            'errors_total': 0,
            'total_processing_time_ms': 0,
            'session_start': datetime.now().isoformat()
        }
        
        # Batch history for this session
        self.batch_history: List[Dict[str, Any]] = []
        
        print(f"📊 Batch Logger initialized")
        print(f"   Log directory: {self.log_dir.absolute()}")
        print(f"   Metrics directory: {self.metrics_dir.absolute()}")
    
    def start_batch(self, batch_id: str) -> Dict[str, Any]:
        """
        Start tracking a new batch.
        
        Args:
            batch_id: Unique identifier for the batch
            
        Returns:
            dict: Batch context with start time
        """
        batch_context = {
            'batch_id': batch_id,
            'start_time': datetime.now().isoformat(),
            'start_timestamp': time.time(),
            'status': 'running'
        }
        
        print(f"\n🚀 Starting Batch {batch_id}")
        print(f"   Start Time: {batch_context['start_time']}")
        
        return batch_context
    
    def complete_batch(
        self,
        batch_context: Dict[str, Any],
        records_processed: int,
        analytics_computed: int,
        write_result: Dict[str, Any],
        errors: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Complete batch tracking and log results.
        
        Args:
            batch_context: Context from start_batch()
            records_processed: Number of health metrics records processed
            analytics_computed: Number of analytics records computed
            write_result: Result from save_analytics_to_mongodb()
            errors: Optional list of errors encountered
            
        Returns:
            dict: Complete batch statistics
        """
        end_time = datetime.now()
        end_timestamp = time.time()
        
        # Calculate processing time
        processing_time_ms = int((end_timestamp - batch_context['start_timestamp']) * 1000)
        
        # Extract write statistics
        analytics_written = write_result.get('records_written', 0)
        analytics_inserted = write_result.get('inserts', 0)
        analytics_updated = write_result.get('updates', 0)
        analytics_skipped = write_result.get('skipped', 0)
        write_success = write_result.get('success', False)
        write_errors = write_result.get('errors', [])
        
        # Combine all errors
        all_errors = []
        if errors:
            all_errors.extend(errors)
        if write_errors:
            all_errors.extend(write_errors)
        
        errors_count = len(all_errors)
        success = write_success and errors_count == 0
        
        # Build complete batch statistics
        batch_stats = {
            'batch_id': batch_context['batch_id'],
            'start_time': batch_context['start_time'],
            'end_time': end_time.isoformat(),
            'processing_time_ms': processing_time_ms,
            'records_processed': records_processed,
            'analytics_computed': analytics_computed,
            'analytics_written': analytics_written,
            'analytics_inserted': analytics_inserted,
            'analytics_updated': analytics_updated,
            'analytics_skipped': analytics_skipped,
            'errors_count': errors_count,
            'errors': all_errors if all_errors else None,
            'success': success,
            'status': 'completed' if success else 'failed'
        }
        
        # Log summary to console
        self._log_batch_summary(batch_stats)
        
        # Write to JSON log file
        self._write_json_log(batch_stats)
        
        # Update session metrics
        self._update_session_metrics(batch_stats)
        
        # Write metrics file
        self._write_metrics_file()
        
        # Add to batch history
        self.batch_history.append(batch_stats)
        
        return batch_stats
    
    def fail_batch(
        self,
        batch_context: Dict[str, Any],
        error_message: str,
        error_details: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Mark batch as failed and log error.
        
        Args:
            batch_context: Context from start_batch()
            error_message: Error description
            error_details: Optional additional error information
            
        Returns:
            dict: Batch statistics with failure info
        """
        end_time = datetime.now()
        end_timestamp = time.time()
        
        processing_time_ms = int((end_timestamp - batch_context['start_timestamp']) * 1000)
        
        batch_stats = {
            'batch_id': batch_context['batch_id'],
            'start_time': batch_context['start_time'],
            'end_time': end_time.isoformat(),
            'processing_time_ms': processing_time_ms,
            'records_processed': 0,
            'analytics_computed': 0,
            'analytics_written': 0,
            'analytics_inserted': 0,
            'analytics_updated': 0,
            'analytics_skipped': 0,
            'errors_count': 1,
            'errors': [{
                'message': error_message,
                'details': error_details,
                'timestamp': end_time.isoformat()
            }],
            'success': False,
            'status': 'failed'
        }
        
        # Log failure to console
        print(f"\n❌ Batch {batch_context['batch_id']} failed: {error_message}")
        print(f"   Processing Time: {processing_time_ms}ms")
        if error_details:
            print(f"   Error Details: {json.dumps(error_details, indent=2)}")
        
        # Write to JSON log file
        self._write_json_log(batch_stats)
        
        # Update session metrics
        self._update_session_metrics(batch_stats)
        
        # Write metrics file
        self._write_metrics_file()
        
        # Add to batch history
        self.batch_history.append(batch_stats)
        
        return batch_stats
    
    def _log_batch_summary(self, batch_stats: Dict[str, Any]):
        """Log batch summary to console with emoji indicators."""
        batch_id = batch_stats['batch_id']
        records = batch_stats['records_processed']
        analytics = batch_stats['analytics_written']
        inserted = batch_stats['analytics_inserted']
        updated = batch_stats['analytics_updated']
        skipped = batch_stats['analytics_skipped']
        time_ms = batch_stats['processing_time_ms']
        success = batch_stats['success']
        errors = batch_stats['errors_count']
        
        if success:
            # Success message with details
            emoji = "✅"
            print(f"\n{emoji} Batch {batch_id} completed: {records} records → {analytics} analytics ({time_ms}ms)")
            if inserted > 0 or updated > 0 or skipped > 0:
                print(f"   📥 Inserts: {inserted} | 🔄 Updates: {updated} | ⏭️  Skipped: {skipped}")
        else:
            # Failure message
            emoji = "❌"
            error_msg = batch_stats['errors'][0]['message'] if batch_stats['errors'] else 'Unknown error'
            print(f"\n{emoji} Batch {batch_id} failed: {error_msg}")
            print(f"   Records Processed: {records}")
            print(f"   Analytics Computed: {batch_stats['analytics_computed']}")
            print(f"   Errors: {errors}")
            print(f"   Processing Time: {time_ms}ms")
    
    def _write_json_log(self, batch_stats: Dict[str, Any]):
        """Write batch statistics to JSON log file."""
        # Create log filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d')
        log_file = self.log_dir / f"batch_logs_{timestamp}.jsonl"
        
        # Append batch stats as JSON line
        with open(log_file, 'a') as f:
            f.write(json.dumps(batch_stats) + '\n')
    
    def _update_session_metrics(self, batch_stats: Dict[str, Any]):
        """Update cumulative session metrics."""
        self.session_metrics['batches_processed_total'] += 1
        
        if batch_stats['success']:
            self.session_metrics['batches_succeeded'] += 1
        else:
            self.session_metrics['batches_failed'] += 1
        
        self.session_metrics['records_processed_total'] += batch_stats['records_processed']
        self.session_metrics['analytics_written_total'] += batch_stats['analytics_written']
        self.session_metrics['analytics_inserted_total'] += batch_stats['analytics_inserted']
        self.session_metrics['analytics_updated_total'] += batch_stats['analytics_updated']
        self.session_metrics['analytics_skipped_total'] += batch_stats['analytics_skipped']
        self.session_metrics['errors_total'] += batch_stats['errors_count']
        self.session_metrics['total_processing_time_ms'] += batch_stats['processing_time_ms']
        
        # Calculate average processing time
        if self.session_metrics['batches_processed_total'] > 0:
            self.session_metrics['average_processing_time_ms'] = (
                self.session_metrics['total_processing_time_ms'] / 
                self.session_metrics['batches_processed_total']
            )
    
    def _write_metrics_file(self):
        """
        Write metrics in Prometheus text format.
        
        Format: https://prometheus.io/docs/instrumenting/exposition_formats/
        """
        metrics_file = self.metrics_dir / 'spark_analytics_metrics.prom'
        
        timestamp_ms = int(time.time() * 1000)
        
        metrics = [
            "# HELP batches_processed_total Total number of batches processed",
            "# TYPE batches_processed_total counter",
            f"batches_processed_total {self.session_metrics['batches_processed_total']} {timestamp_ms}",
            "",
            "# HELP batches_succeeded_total Total number of successful batches",
            "# TYPE batches_succeeded_total counter",
            f"batches_succeeded_total {self.session_metrics['batches_succeeded']} {timestamp_ms}",
            "",
            "# HELP batches_failed_total Total number of failed batches",
            "# TYPE batches_failed_total counter",
            f"batches_failed_total {self.session_metrics['batches_failed']} {timestamp_ms}",
            "",
            "# HELP analytics_written_total Total number of analytics records written",
            "# TYPE analytics_written_total counter",
            f"analytics_written_total {self.session_metrics['analytics_written_total']} {timestamp_ms}",
            "",
            "# HELP analytics_inserted_total Total number of analytics records inserted",
            "# TYPE analytics_inserted_total counter",
            f"analytics_inserted_total {self.session_metrics['analytics_inserted_total']} {timestamp_ms}",
            "",
            "# HELP analytics_updated_total Total number of analytics records updated",
            "# TYPE analytics_updated_total counter",
            f"analytics_updated_total {self.session_metrics['analytics_updated_total']} {timestamp_ms}",
            "",
            "# HELP analytics_skipped_total Total number of analytics records skipped",
            "# TYPE analytics_skipped_total counter",
            f"analytics_skipped_total {self.session_metrics['analytics_skipped_total']} {timestamp_ms}",
            "",
            "# HELP records_processed_total Total number of health metrics records processed",
            "# TYPE records_processed_total counter",
            f"records_processed_total {self.session_metrics['records_processed_total']} {timestamp_ms}",
            "",
            "# HELP errors_total Total number of errors encountered",
            "# TYPE errors_total counter",
            f"errors_total {self.session_metrics['errors_total']} {timestamp_ms}",
            "",
            "# HELP processing_time_seconds Total processing time in seconds",
            "# TYPE processing_time_seconds gauge",
            f"processing_time_seconds {self.session_metrics['total_processing_time_ms'] / 1000:.3f} {timestamp_ms}",
            "",
            "# HELP average_processing_time_ms Average processing time per batch in milliseconds",
            "# TYPE average_processing_time_ms gauge",
            f"average_processing_time_ms {self.session_metrics.get('average_processing_time_ms', 0):.2f} {timestamp_ms}",
            ""
        ]
        
        with open(metrics_file, 'w') as f:
            f.write('\n'.join(metrics))
    
    def get_session_summary(self) -> Dict[str, Any]:
        """
        Get summary statistics for the current session.
        
        Returns:
            dict: Session statistics
        """
        session_duration = (
            datetime.now() - 
            datetime.fromisoformat(self.session_metrics['session_start'])
        ).total_seconds()
        
        return {
            **self.session_metrics,
            'session_duration_seconds': session_duration,
            'batches_in_history': len(self.batch_history)
        }
    
    def print_session_summary(self):
        """Print formatted session summary to console."""
        summary = self.get_session_summary()
        
        print("\n" + "=" * 80)
        print("📊 BATCH PROCESSING SESSION SUMMARY")
        print("=" * 80)
        print(f"\n⏱️  Session Duration: {summary['session_duration_seconds']:.2f} seconds")
        print(f"\n📦 Batches:")
        print(f"   Total: {summary['batches_processed_total']}")
        print(f"   ✅ Succeeded: {summary['batches_succeeded']}")
        print(f"   ❌ Failed: {summary['batches_failed']}")
        
        success_rate = (
            (summary['batches_succeeded'] / summary['batches_processed_total'] * 100)
            if summary['batches_processed_total'] > 0 else 0
        )
        print(f"   Success Rate: {success_rate:.1f}%")
        
        print(f"\n📊 Analytics:")
        print(f"   Total Written: {summary['analytics_written_total']}")
        print(f"   📥 Inserted: {summary['analytics_inserted_total']}")
        print(f"   🔄 Updated: {summary['analytics_updated_total']}")
        print(f"   ⏭️  Skipped: {summary['analytics_skipped_total']}")
        
        print(f"\n📈 Processing:")
        print(f"   Records Processed: {summary['records_processed_total']}")
        print(f"   Total Time: {summary['total_processing_time_ms']}ms")
        print(f"   Average Time: {summary.get('average_processing_time_ms', 0):.2f}ms per batch")
        
        if summary['errors_total'] > 0:
            print(f"\n⚠️  Errors: {summary['errors_total']}")
        
        print("\n" + "=" * 80)
    
    def export_batch_history(self, filepath: Optional[str] = None) -> str:
        """
        Export complete batch history to JSON file.
        
        Args:
            filepath: Optional custom filepath for export
            
        Returns:
            str: Path to exported file
        """
        if filepath is None:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filepath = self.log_dir / f"batch_history_{timestamp}.json"
        
        export_data = {
            'session_metrics': self.session_metrics,
            'batch_history': self.batch_history,
            'exported_at': datetime.now().isoformat()
        }
        
        with open(filepath, 'w') as f:
            json.dump(export_data, f, indent=2)
        
        print(f"📁 Batch history exported to: {filepath}")
        return str(filepath)
