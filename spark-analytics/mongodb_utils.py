"""
MongoDB Utilities for Analytics Write Operations
Provides schema definitions and write functions for saving Spark analytics to MongoDB.
"""

import os
import json
from datetime import datetime
from pyspark.sql.types import (
    StructType, StructField, StringType, DoubleType, 
    IntegerType, BooleanType, TimestampType, DateType
)

# Import event emitter for real-time notifications
try:
    from event_emitter import add_to_batch, emit_batched_analytics, flush_all_batches
    EVENT_EMITTER_AVAILABLE = True
except ImportError:
    EVENT_EMITTER_AVAILABLE = False
    print("⚠️  WARNING: event_emitter module not found. Real-time events will be skipped.")



def get_analytics_schema():
    """
    Define the Spark DataFrame schema that matches the Mongoose Analytics model.
    
    This schema mirrors the structure defined in server/src/models/Analytics.js
    with nested subdocuments for analytics details, anomaly information, 
    comparison data, and statistics.
    
    Returns:
        StructType: Complete schema for Analytics collection
    """
    
    # Define nested schema for anomaly details
    anomaly_details_schema = StructType([
        StructField("severity", StringType(), True),           # 'low', 'medium', 'high'
        StructField("actualValue", DoubleType(), True),        # Actual value that triggered anomaly
        StructField("expectedValue", DoubleType(), True),      # Expected value based on history
        StructField("deviation", DoubleType(), True),          # Statistical deviation (z-score/IQR)
        StructField("message", StringType(), True),            # Human-readable anomaly description
        StructField("detectedAt", TimestampType(), True)       # When anomaly was detected
    ])
    
    # Define nested schema for comparison to previous period
    comparison_schema = StructType([
        StructField("absoluteChange", DoubleType(), True),     # Absolute difference
        StructField("percentageChange", DoubleType(), True),   # Percentage change
        StructField("isImprovement", BooleanType(), True)      # Whether change is positive
    ])
    
    # Define nested schema for statistical measures
    statistics_schema = StructType([
        StructField("standardDeviation", DoubleType(), True),  # StdDev of values in period
        StructField("minValue", DoubleType(), True),           # Minimum value
        StructField("maxValue", DoubleType(), True),           # Maximum value
        StructField("medianValue", DoubleType(), True),        # Median value
        StructField("dataPointsCount", IntegerType(), True),   # Number of data points
        StructField("completenessPercentage", DoubleType(), True)  # Data completeness (0-100)
    ])
    
    # Define main analytics nested structure
    analytics_schema = StructType([
        StructField("rollingAverage", DoubleType(), False),    # Required: rolling avg for metric
        StructField("trend", StringType(), False),             # Required: 'up', 'down', 'stable'
        StructField("trendPercentage", DoubleType(), True),    # Percentage change from previous
        StructField("anomalyDetected", BooleanType(), False),  # Required: anomaly flag
        StructField("anomalyDetails", anomaly_details_schema, True),  # Populated if anomaly detected
        StructField("streakDays", IntegerType(), True),        # Current consecutive days streak
        StructField("longestStreak", IntegerType(), True),     # Historical longest streak
        StructField("streakStartDate", DateType(), True),      # When current streak started
        StructField("percentile", DoubleType(), True),         # Percentile ranking (0-100)
        StructField("comparisonToPrevious", comparison_schema, True),  # Period-over-period comparison
        StructField("statistics", statistics_schema, True)     # Statistical measures
    ])
    
    # Define metadata schema
    metadata_schema = StructType([
        StructField("sparkJobId", StringType(), True),         # Spark application ID
        StructField("processingDurationMs", IntegerType(), True),  # Processing time in ms
        StructField("dataPointsProcessed", IntegerType(), True),   # Number of raw data points
        StructField("sparkVersion", StringType(), True)        # Spark version used
    ])
    
    # Define the complete Analytics schema
    schema = StructType([
        StructField("userId", StringType(), False),            # Required: User ObjectId as string
        StructField("metricType", StringType(), False),        # Required: metric type
        StructField("timeRange", StringType(), False),         # Required: '7day', '30day', '90day'
        StructField("analytics", analytics_schema, False),     # Required: nested analytics object
        StructField("calculatedAt", TimestampType(), False),   # Required: when analytics calculated
        StructField("expiresAt", TimestampType(), True),       # Optional: TTL expiration date
        StructField("metadata", metadata_schema, True)         # Optional: Spark job metadata
    ])
    
    return schema


def save_analytics_to_mongodb(spark_session, analytics_list, batch_id=None):
    """
    Convert analytics list to properly structured documents and upsert to MongoDB analytics collection.
    
    This function:
    1. Creates structured documents from the analytics list using the correct schema
    2. Uses upsert pattern to prevent duplicates - replaces documents with same (userId, metricType, timeRange)
    3. Only updates if new calculatedAt timestamp is newer than existing document
    4. Logs each operation as insert, update, or skip with detailed metric values
    5. Handles errors with comprehensive logging and DLQ for failed records
    6. Allows TTL index to handle data expiration automatically
    
    Upsert Logic:
    - Filter by unique tuple: (userId, metricType, timeRange)
    - Check existing document's calculatedAt timestamp
    - Skip if new timestamp is older or equal to existing
    - Replace if new timestamp is newer (update)
    - Insert if no existing document found
    
    Args:
        spark_session: Active SparkSession instance
        analytics_list: List of analytics dictionaries to write
        batch_id: Optional batch identifier for logging context
        
    Returns:
        dict: Write operation results with status, count, inserts, updates, skipped, and any errors
    """
    
    # Get environment configuration
    db_name = os.getenv('MONGO_DB_NAME', 'health_metrics')
    collection_name = os.getenv('ANALYTICS_COLLECTION', 'analytics')
    dlq_dir = os.getenv('DLQ_DIRECTORY', './dlq')
    mongo_uri = os.getenv('MONGO_URI')
    
    # Initialize result tracking
    result = {
        'success': False,
        'records_processed': 0,
        'records_written': 0,
        'records_failed': 0,
        'errors': []
    }
    
    # Validate input
    if not analytics_list or len(analytics_list) == 0:
        print("⚠️  No analytics records to write")
        result['success'] = True
        return result
    
    result['records_processed'] = len(analytics_list)
    
    try:
        # Use PyMongo for direct write with upsert logic (more reliable than Spark DataFrame on Windows)
        print(f"📊 Upserting {len(analytics_list)} analytics records to MongoDB...")
        
        from pymongo import MongoClient
        from datetime import datetime, date
        
        # Connect to MongoDB
        client = MongoClient(mongo_uri)
        db = client[db_name]
        collection = db[collection_name]
        
        # Convert datetime objects to strings for MongoDB storage
        def prepare_for_mongo(record):
            """Convert datetime objects to ISO format strings"""
            rec = record.copy()
            if isinstance(rec.get('calculatedAt'), datetime):
                rec['calculatedAt'] = rec['calculatedAt'].isoformat()
            if isinstance(rec.get('expiresAt'), datetime):
                rec['expiresAt'] = rec['expiresAt'].isoformat()
            
            # Handle nested analytics dates
            if 'analytics' in rec and rec['analytics']:
                analytics = rec['analytics'].copy()
                if isinstance(analytics.get('streakStartDate'), (datetime, date)):
                    analytics['streakStartDate'] = analytics['streakStartDate'].isoformat()
                rec['analytics'] = analytics
            
            return rec
        
        # Prepare records
        prepared_records = [prepare_for_mongo(r) for r in analytics_list]
        
        # Perform upsert for each record to prevent duplicates
        # Only insert/update if the new calculatedAt is newer than existing
        inserts = 0
        updates = 0
        skipped = 0
        
        for doc in prepared_records:
            # Build unique filter for this analytics document
            filter_query = {
                'userId': doc['userId'],
                'metricType': doc['metricType'],
                'timeRange': doc['timeRange']
            }
            
            # Check if document exists with newer calculatedAt
            existing_doc = collection.find_one(filter_query, {'calculatedAt': 1})
            
            should_upsert = True
            operation_type = 'insert'
            
            if existing_doc:
                # Compare calculatedAt timestamps
                existing_ts = existing_doc.get('calculatedAt')
                new_ts = doc['calculatedAt']
                
                # Handle string comparison (ISO format strings compare correctly)
                if isinstance(existing_ts, str) and isinstance(new_ts, str):
                    if new_ts <= existing_ts:
                        should_upsert = False
                        skipped += 1
                        print(f"   ⏭️  Skipped (userId={doc['userId']}, metric={doc['metricType']}, range={doc['timeRange']}): existing timestamp {existing_ts} >= new {new_ts}")
                    else:
                        operation_type = 'update'
                
            if should_upsert:
                # Perform upsert operation
                upsert_result = collection.replace_one(
                    filter_query,
                    doc,
                    upsert=True
                )
                
                if upsert_result.upserted_id:
                    inserts += 1
                    operation_type = 'insert'
                elif upsert_result.modified_count > 0:
                    updates += 1
                    operation_type = 'update'
                
                # Log the upsert operation
                rolling_avg = doc.get('analytics', {}).get('rollingAverage', 'N/A')
                trend = doc.get('analytics', {}).get('trend', 'N/A')
                anomaly = doc.get('analytics', {}).get('anomalyDetected', False)
                
                print(f"   {'🆕' if operation_type == 'insert' else '🔄'} {operation_type.upper()}: userId={doc['userId']}, metric={doc['metricType']}, range={doc['timeRange']}")
                print(f"      Values: rollingAvg={rolling_avg}, trend={trend}, anomaly={anomaly}")
                
                # ===== ADD TO BATCH FOR DEBOUNCED EVENT EMISSION =====
                # Instead of emitting individual events, collect analytics in batch
                # This prevents overwhelming SSE clients during large batch processing
                # Batches are automatically sent when user has enough analytics or at end of job
                if EVENT_EMITTER_AVAILABLE:
                    try:
                        add_to_batch(
                            user_id=doc['userId'],
                            metric_type=doc['metricType'],
                            time_range=doc['timeRange'],
                            analytics_data=doc.get('analytics', {}),
                            operation_type=operation_type
                        )
                    except Exception as batch_error:
                        # Don't fail the entire batch if batching fails
                        print(f"      ⚠️  Batch accumulation error: {str(batch_error)}")
        
        result['records_written'] = inserts + updates
        result['inserts'] = inserts
        result['updates'] = updates
        result['skipped'] = skipped
        result['success'] = True
        
        print(f"✅ Successfully upserted analytics records to MongoDB")
        print(f"   📥 Inserts: {inserts}")
        print(f"   🔄 Updates: {updates}")
        print(f"   ⏭️  Skipped: {skipped}")
        
        # Log batch context if provided
        if batch_id:
            print(f"   Batch ID: {batch_id}")
        
        # ===== FLUSH ACCUMULATED BATCHES TO SSE =====
        # After all analytics are written to MongoDB, send batched events
        # This sends one aggregated event per user instead of N individual events
        if EVENT_EMITTER_AVAILABLE and (inserts + updates) > 0:
            try:
                print(f"\n📡 Emitting batched analytics events...")
                batch_stats = flush_all_batches()
                
                if batch_stats['batches_sent'] > 0:
                    print(f"   ✅ Sent {batch_stats['batches_sent']} batch event(s) for {batch_stats['users_processed']} user(s)")
                    print(f"   📊 Total analytics in events: {batch_stats['analytics_sent']}")
            except Exception as flush_error:
                print(f"   ⚠️  Batch flush error: {str(flush_error)}")
                print(f"      Analytics saved to DB but events may not have been sent")
        
        # Close connection
        client.close()
        
        return result
        
    except Exception as e:
        error_msg = f"Failed to write analytics to MongoDB: {str(e)}"
        print(f"❌ {error_msg}")
        
        result['errors'].append({
            'type': 'write_error',
            'message': str(e),
            'timestamp': datetime.now().isoformat(),
            'batch_id': batch_id
        })
        result['records_failed'] = result['records_processed'] - result['records_written']
        
        # Write failed records to dead-letter queue
        try:
            write_to_dlq(analytics_list, batch_id, str(e), dlq_dir)
        except Exception as dlq_error:
            print(f"⚠️  Failed to write to DLQ: {dlq_error}")
        
        # Print stack trace for debugging
        import traceback
        traceback.print_exc()
        
        return result


def write_to_dlq(failed_records, batch_id, error_message, dlq_dir='./dlq'):
    """
    Write failed records to a dead-letter queue (DLQ) for manual inspection and retry.
    
    DLQ files are stored as JSON with metadata about the failure, allowing
    administrators to investigate issues and retry failed writes manually.
    
    Args:
        failed_records: List of records that failed to write
        batch_id: Batch identifier (optional)
        error_message: Error description
        dlq_dir: Directory to store DLQ files
    """
    
    # Create DLQ directory if it doesn't exist
    os.makedirs(dlq_dir, exist_ok=True)
    
    # Generate unique DLQ filename
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_%f')
    batch_suffix = f"_batch_{batch_id}" if batch_id else ""
    dlq_filename = f"analytics_dlq_{timestamp}{batch_suffix}.json"
    dlq_filepath = os.path.join(dlq_dir, dlq_filename)
    
    # Prepare DLQ record
    dlq_record = {
        'timestamp': datetime.now().isoformat(),
        'batch_id': batch_id,
        'error_message': error_message,
        'record_count': len(failed_records),
        'failed_records': failed_records
    }
    
    # Write to DLQ file
    with open(dlq_filepath, 'w') as f:
        json.dump(dlq_record, f, indent=2, default=str)
    
    print(f"📝 Wrote {len(failed_records)} failed records to DLQ: {dlq_filepath}")
    print(f"   You can manually inspect and retry these records")


def retry_dlq_records(spark_session, dlq_filepath):
    """
    Retry writing records from a DLQ file to MongoDB.
    
    This function reads a DLQ file, extracts the failed records,
    and attempts to write them again using the standard write function.
    
    Args:
        spark_session: Active SparkSession instance
        dlq_filepath: Path to the DLQ JSON file
        
    Returns:
        dict: Retry operation results
    """
    
    print(f"🔄 Retrying DLQ records from: {dlq_filepath}")
    
    try:
        # Read DLQ file
        with open(dlq_filepath, 'r') as f:
            dlq_record = json.load(f)
        
        failed_records = dlq_record.get('failed_records', [])
        original_batch_id = dlq_record.get('batch_id')
        
        if not failed_records:
            print("⚠️  No records found in DLQ file")
            return {'success': False, 'message': 'No records to retry'}
        
        print(f"📊 Found {len(failed_records)} records to retry")
        print(f"   Original error: {dlq_record.get('error_message')}")
        
        # Attempt to write records again
        result = save_analytics_to_mongodb(
            spark_session, 
            failed_records, 
            batch_id=f"retry_{original_batch_id}"
        )
        
        # If successful, archive the DLQ file
        if result['success'] and result['records_written'] > 0:
            archive_dir = os.path.join(os.path.dirname(dlq_filepath), 'processed')
            os.makedirs(archive_dir, exist_ok=True)
            
            archive_path = os.path.join(archive_dir, os.path.basename(dlq_filepath))
            os.rename(dlq_filepath, archive_path)
            
            print(f"✅ Successfully retried DLQ records")
            print(f"   Archived DLQ file to: {archive_path}")
        
        return result
        
    except Exception as e:
        error_msg = f"Failed to retry DLQ records: {str(e)}"
        print(f"❌ {error_msg}")
        import traceback
        traceback.print_exc()
        
        return {'success': False, 'message': error_msg}


def build_analytics_record(user_id, metric_type, time_range, analytics_data, 
                           calculated_at=None, expires_at=None, metadata=None):
    """
    Build a properly structured analytics record matching the Mongoose schema.
    
    This helper function ensures all required fields are present and properly
    formatted for writing to MongoDB.
    
    Args:
        user_id: User ObjectId as string
        metric_type: Metric type ('steps', 'calories', etc.)
        time_range: Time range period ('7day', '30day', '90day')
        analytics_data: Dict with analytics fields (rollingAverage, trend, etc.)
        calculated_at: Timestamp when calculated (defaults to now)
        expires_at: Expiration timestamp for TTL (defaults to 90 days from now)
        metadata: Optional Spark job metadata
        
    Returns:
        dict: Properly structured analytics record
    """
    
    from datetime import datetime, timedelta, date
    
    # Set defaults
    if calculated_at is None:
        calculated_at = datetime.now()
    elif isinstance(calculated_at, str):
        calculated_at = datetime.fromisoformat(calculated_at.replace('Z', '+00:00'))
    
    if expires_at is None:
        expires_at = calculated_at + timedelta(days=90)
    elif isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
    
    # Helper function to convert date fields
    def convert_to_date(value):
        """Convert various date formats to date object for DateType fields"""
        if value is None:
            return None
        if isinstance(value, date) and not isinstance(value, datetime):
            return value  # Already a date
        if isinstance(value, datetime):
            return value.date()  # Convert datetime to date
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value.replace('Z', '+00:00')).date()
            except:
                return None
        return None
    
    # Build the complete record
    record = {
        'userId': str(user_id),
        'metricType': metric_type.lower().strip(),
        'timeRange': time_range.lower().strip(),
        'analytics': {
            'rollingAverage': float(analytics_data.get('rollingAverage', 0.0)),
            'trend': str(analytics_data.get('trend', 'stable')),
            'trendPercentage': float(analytics_data.get('trendPercentage', 0.0)),
            'anomalyDetected': bool(analytics_data.get('anomalyDetected', False)),
            'anomalyDetails': analytics_data.get('anomalyDetails'),  # Can be None
            'streakDays': int(analytics_data.get('streakDays', 0)),
            'longestStreak': int(analytics_data.get('longestStreak', 0)),
            'streakStartDate': convert_to_date(analytics_data.get('streakStartDate')),  # Convert to date
            'percentile': float(analytics_data.get('percentile', 50.0)),
            'comparisonToPrevious': analytics_data.get('comparisonToPrevious', {
                'absoluteChange': 0.0,
                'percentageChange': 0.0,
                'isImprovement': None
            }),
            'statistics': analytics_data.get('statistics', {
                'standardDeviation': 0.0,
                'minValue': None,
                'maxValue': None,
                'medianValue': None,
                'dataPointsCount': 0,
                'completenessPercentage': 0.0
            })
        },
        'calculatedAt': calculated_at,
        'expiresAt': expires_at,
        'metadata': metadata
    }
    
    return record
