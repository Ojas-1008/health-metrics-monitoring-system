import sys
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from pyspark.sql import SparkSession, Window
from pyspark.sql.functions import (
    col, max as spark_max, avg, stddev, count, datediff, lag, lead,
    when, row_number, sum as spark_sum, lit, unix_timestamp, from_unixtime,
    percentile_approx, abs as spark_abs, explode, array, struct, to_date
)
from pyspark.sql.types import StructType, StructField, StringType, DoubleType, IntegerType, BooleanType, TimestampType

# Import MongoDB utilities for analytics write operations
from mongodb_utils import (
    save_analytics_to_mongodb, 
    build_analytics_record,
    get_analytics_schema
)

# Import batch logger for monitoring and metrics
from batch_logger import BatchLogger

# Set Hadoop home explicitly for Windows to avoid winutils requirement
# Spark on Windows requires these settings to bypass winutils.exe
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
HADOOP_HOME = os.path.join(SCRIPT_DIR, 'hadoop')
os.makedirs(os.path.join(HADOOP_HOME, 'bin'), exist_ok=True)

# Set environment variables before Spark initialization
os.environ['HADOOP_HOME'] = HADOOP_HOME
os.environ['hadoop.home.dir'] = HADOOP_HOME
os.environ['HADOOP_USER_NAME'] = 'spark'

# Disable permission checks on Windows (workaround for winutils requirement)
import warnings
warnings.filterwarnings('ignore')
os.environ['PYSPARK_SUBMIT_ARGS'] = '--conf spark.hadoop.fs.permissions.umask-mode=000 pyspark-shell'

# Load environment variables
load_dotenv()

# Verify required environment variables
required_vars = ['MONGO_URI', 'MONGO_DB_NAME', 'SPARK_APP_NAME']
missing_vars = [var for var in required_vars if not os.getenv(var)]

if missing_vars:
    print(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
    sys.exit(1)

MONGO_URI = os.getenv('MONGO_URI')
MONGO_DB_NAME = os.getenv('MONGO_DB_NAME')
SPARK_APP_NAME = os.getenv('SPARK_APP_NAME')

print(f"Starting Spark Application: {SPARK_APP_NAME}")
print(f"Connecting to MongoDB Database: {MONGO_DB_NAME}")

# Initialize Batch Logger for monitoring
batch_logger = BatchLogger(
    log_dir=os.getenv('LOG_DIRECTORY', './logs'),
    metrics_dir=os.getenv('METRICS_DIRECTORY', './metrics')
)

# Initialize Spark Session
spark = SparkSession.builder \
    .appName(SPARK_APP_NAME) \
    .master("local[*]") \
    .config("spark.mongodb.read.connection.uri", MONGO_URI) \
    .config("spark.mongodb.write.connection.uri", MONGO_URI) \
    .config("spark.jars.packages", "org.mongodb.spark:mongo-spark-connector_2.12:10.3.0") \
    .config("spark.hadoop.fs.permissions.umask-mode", "000") \
    .config("spark.hadoop.validateOutputSpecs", "false") \
    .config("spark.local.dir", os.path.join(os.getcwd(), "spark-local")) \
    .getOrCreate()

print("Spark Session Initialized")

def get_last_processed_timestamp(checkpoint_dir):
    """
    Loads the last processed timestamp from a checkpoint file.
    Defaults to 30 days ago if the file doesn't exist.
    
    Args:
        checkpoint_dir: Directory where checkpoint files are stored
        
    Returns:
        datetime: Last processed timestamp or 30 days ago as default
    """
    ts_file = os.path.join(checkpoint_dir, "last_processed_timestamp.txt")
    
    if os.path.exists(ts_file):
        try:
            with open(ts_file, "r") as f:
                content = f.read().strip()
                if content:
                    # Handle both ISO format with and without timezone
                    ts = datetime.fromisoformat(content.replace('Z', '+00:00'))
                    print(f"📁 Loaded checkpoint timestamp: {ts.isoformat()}")
                    return ts
        except Exception as e:
            print(f"⚠️ Error reading checkpoint file: {e}")
    
    # Default to 30 days ago
    default_ts = datetime.now() - timedelta(days=30)
    print(f"📁 No checkpoint found, using default: {default_ts.isoformat()}")
    return default_ts

def save_last_processed_timestamp(checkpoint_dir, timestamp):
    """
    Saves the last processed timestamp to a checkpoint file.
    This maintains state across Spark application restarts.
    
    Args:
        checkpoint_dir: Directory where checkpoint files are stored
        timestamp: datetime object to save
    """
    ts_file = os.path.join(checkpoint_dir, "last_processed_timestamp.txt")
    os.makedirs(checkpoint_dir, exist_ok=True)
    
    try:
        with open(ts_file, "w") as f:
            f.write(timestamp.isoformat())
        print(f"💾 Checkpoint saved successfully")
    except Exception as e:
        print(f"❌ Error saving checkpoint: {e}")

def process_health_metrics(df):
    """
    Process health metrics batch with phone-only constraints and compute analytics.
    
    This function:
    1. Filters to phone-supported metrics (manual/googlefit source)
    2. Drops rows with wearable-only fields (heartRate, bloodOxygen)
    3. Computes 7-day rolling averages
    4. Calculates activity streaks
    5. Detects anomalies (>2 std dev from 30-day mean)
    6. Computes percentile rankings (90-day window)
    7. Structures output for analytics collection
    
    Args:
        df: DataFrame with health metrics
        
    Returns:
        DataFrame with analytics results
    """
    print(f"📊 Processing health metrics batch...")
    
    # ========================================================================
    # STEP 1: Filter to phone-only metrics
    # ========================================================================
    print("🔍 Step 1: Filtering to phone-supported metrics...")
    
    # Filter by source (manual or googlefit)
    phone_only_df = df.filter(col('source').isin(['manual', 'googlefit']))
    
    # Drop rows with wearable-only fields (enforce constraint)
    # Check if these fields exist in the DataFrame schema
    schema_fields = phone_only_df.schema.names
    if 'heartRate' in schema_fields:
        phone_only_df = phone_only_df.filter(col('heartRate').isNull())
    if 'bloodOxygen' in schema_fields:
        phone_only_df = phone_only_df.filter(col('bloodOxygen').isNull())
    
    filtered_count = phone_only_df.count()
    print(f"   ✅ Filtered to {filtered_count} phone-only metric records")
    
    if filtered_count == 0:
        print("   ⚠️ No phone-only metrics to process")
        # Return empty DataFrame with expected schema
        return df.sparkSession.createDataFrame([], StructType([
            StructField("userId", StringType(), True),
            StructField("metricType", StringType(), True),
            StructField("date", StringType(), True),
            StructField("currentValue", DoubleType(), True),
            StructField("rollingAverage7Day", DoubleType(), True),
            StructField("trend", StringType(), True),
            StructField("anomalyDetected", BooleanType(), True),
            StructField("streakDays", IntegerType(), True),
            StructField("percentile", DoubleType(), True),
            StructField("comparisonToPrevious", DoubleType(), True),
            StructField("calculatedAt", StringType(), True),
            StructField("expiresAt", StringType(), True),
            StructField("updatedAt", StringType(), True)
        ]))
    
    # ========================================================================
    # STEP 2: Flatten metrics structure for processing
    # ========================================================================
    print("🔄 Step 2: Flattening metrics structure...")
    
    # Extract nested metrics fields
    flattened_df = phone_only_df.select(
        col('userId'),
        to_date(col('date')).alias('date'),
        col('metrics.steps').alias('steps'),
        col('metrics.distance').alias('distance'),
        col('metrics.calories').alias('calories'),
        col('metrics.activeMinutes').alias('activeMinutes'),
        col('metrics.weight').alias('weight'),
        col('metrics.sleepHours').alias('sleepHours'),
        col('source'),
        col('updatedAt')
    )
    
    # Unpivot/melt to long format for easier metric-type processing
    # Create array of metric types and values
    metrics_long = flattened_df.select(
        col('userId'),
        col('date'),
        col('source'),
        col('updatedAt'),
        explode(array(
            struct(lit('steps').alias('metricType'), col('steps').alias('value')),
            struct(lit('distance').alias('metricType'), col('distance').alias('value')),
            struct(lit('calories').alias('metricType'), col('calories').alias('value')),
            struct(lit('activeMinutes').alias('metricType'), col('activeMinutes').alias('value')),
            struct(lit('weight').alias('metricType'), col('weight').alias('value')),
            struct(lit('sleepHours').alias('metricType'), col('sleepHours').alias('value'))
        )).alias('metric')
    ).select(
        col('userId'),
        col('date'),
        col('source'),
        col('updatedAt'),
        col('metric.metricType').alias('metricType'),
        col('metric.value').alias('value')
    ).filter(col('value').isNotNull())  # Only keep metrics with values
    
    long_count = metrics_long.count()
    print(f"   ✅ Flattened to {long_count} individual metric values")
    
    # ========================================================================
    # STEP 3: Compute 7-day rolling averages
    # ========================================================================
    print("📈 Step 3: Computing 7-day rolling averages...")
    
    # Define window for 7-day rolling average
    window_7day = Window.partitionBy('userId', 'metricType') \
        .orderBy('date') \
        .rowsBetween(-6, 0)
    
    # Calculate rolling averages for activity metrics (steps, distance, calories, activeMinutes)
    metrics_with_rolling = metrics_long.withColumn(
        'rollingAverage7Day',
        when(
            col('metricType').isin(['steps', 'distance', 'calories', 'activeMinutes']),
            avg('value').over(window_7day)
        ).otherwise(None)
    )
    
    print(f"   ✅ 7-day rolling averages computed")
    
    # ========================================================================
    # STEP 4: Compute activity streaks (consecutive days with steps > 1000)
    # ========================================================================
    print("🔥 Step 4: Computing activity streaks...")
    
    # Filter to steps metric for streak calculation
    steps_df = metrics_with_rolling.filter(col('metricType') == 'steps')
    
    # Define window for streak calculation (by user, ordered by date)
    window_streak = Window.partitionBy('userId').orderBy('date')
    
    # Add lag to check previous day
    steps_with_lag = steps_df.withColumn(
        'prevDate',
        lag('date', 1).over(window_streak)
    ).withColumn(
        'prevValue',
        lag('value', 1).over(window_streak)
    )
    
    # Calculate if this is a streak day (steps > 1000)
    steps_with_streak_flag = steps_with_lag.withColumn(
        'isStreakDay',
        when(col('value') > 1000, 1).otherwise(0)
    ).withColumn(
        'isConsecutive',
        when(
            (datediff(col('date'), col('prevDate')) == 1) & 
            (col('prevValue') > 1000) & 
            (col('value') > 1000),
            1
        ).otherwise(0)
    ).withColumn(
        'streakReset',
        when(
            (col('isStreakDay') == 1) & (col('isConsecutive') == 0),
            1
        ).otherwise(0)
    )
    
    # Assign streak group IDs (increments when streak resets)
    steps_with_streak_group = steps_with_streak_flag.withColumn(
        'streakGroupId',
        spark_sum(col('streakReset')).over(window_streak)
    )
    
    # Calculate streak length for each group
    window_streak_group = Window.partitionBy('userId', 'streakGroupId').orderBy('date')
    
    steps_with_streak_days = steps_with_streak_group.withColumn(
        'streakDays',
        when(
            col('isStreakDay') == 1,
            row_number().over(window_streak_group)
        ).otherwise(0)
    )
    
    # Get current streak (most recent date's streak)
    window_current_streak = Window.partitionBy('userId').orderBy(col('date').desc())
    
    current_streaks = steps_with_streak_days.withColumn(
        'rank',
        row_number().over(window_current_streak)
    ).filter(col('rank') == 1).select(
        col('userId'),
        col('date'),
        col('streakDays').alias('currentStreak')
    )
    
    print(f"   ✅ Activity streaks computed")
    
    # ========================================================================
    # STEP 5: Compute 30-day statistics for anomaly detection
    # ========================================================================
    print("⚠️ Step 5: Computing 30-day statistics for anomaly detection...")
    
    # Define window for 30-day rolling statistics
    window_30day = Window.partitionBy('userId', 'metricType') \
        .orderBy('date') \
        .rowsBetween(-29, 0)
    
    # Calculate 30-day rolling mean and standard deviation
    metrics_with_30day_stats = metrics_with_rolling.withColumn(
        'rollingMean30Day',
        avg('value').over(window_30day)
    ).withColumn(
        'rollingStdDev30Day',
        stddev('value').over(window_30day)
    )
    
    # Detect anomalies (>2 std dev from 30-day mean)
    metrics_with_anomalies = metrics_with_30day_stats.withColumn(
        'anomalyDetected',
        when(
            (col('rollingStdDev30Day').isNotNull()) & 
            (col('rollingStdDev30Day') > 0) &
            (spark_abs(col('value') - col('rollingMean30Day')) > 2 * col('rollingStdDev30Day')),
            True
        ).otherwise(False)
    )
    
    print(f"   ✅ Anomaly detection completed")
    
    # ========================================================================
    # STEP 6: Compute percentile rankings (90-day window)
    # ========================================================================
    print("📊 Step 6: Computing percentile rankings (90-day window)...")
    
    # Define window for 90-day percentile calculation
    window_90day = Window.partitionBy('userId', 'metricType') \
        .orderBy('date') \
        .rowsBetween(-89, 0)
    
    # Calculate percentile rank for current value within 90-day window
    # Using rank-based calculation: (rank - 1) / (total_count - 1)
    metrics_with_percentile = metrics_with_anomalies.withColumn(
        'percentile',
        when(
            count('value').over(window_90day) > 1,
            (row_number().over(window_90day) - 1) / 
            (count('value').over(window_90day) - 1)
        ).otherwise(0.5)  # Default to 50th percentile if insufficient data
    )
    
    print(f"   ✅ Percentile rankings computed")
    
    # ========================================================================
    # STEP 7: Calculate trend (comparison to previous period)
    # ========================================================================
    print("📈 Step 7: Computing trends...")
    
    # Calculate previous period average (previous 7 days before current 7-day window)
    window_prev_7day = Window.partitionBy('userId', 'metricType') \
        .orderBy('date') \
        .rowsBetween(-13, -7)
    
    metrics_with_trend = metrics_with_percentile.withColumn(
        'previousPeriodAvg',
        avg('value').over(window_prev_7day)
    ).withColumn(
        'comparisonToPrevious',
        when(
            col('previousPeriodAvg').isNotNull() & (col('previousPeriodAvg') != 0),
            ((col('rollingAverage7Day') - col('previousPeriodAvg')) / col('previousPeriodAvg')) * 100
        ).otherwise(None)
    ).withColumn(
        'trend',
        when(col('comparisonToPrevious').isNull(), 'stable')
        .when(col('comparisonToPrevious') > 5, 'increasing')
        .when(col('comparisonToPrevious') < -5, 'decreasing')
        .otherwise('stable')
    )
    
    print(f"   ✅ Trends computed")
    
    # ========================================================================
    # STEP 8: Join streak data and structure final output
    # ========================================================================
    print("📦 Step 8: Structuring analytics output...")
    
    # Get current timestamp
    calculated_at = datetime.now()
    expires_at = calculated_at + timedelta(days=90)
    
    # Join streak data for steps metric
    metrics_with_streaks = metrics_with_trend.join(
        current_streaks,
        ['userId', 'date'],
        'left'
    ).withColumn(
        'streakDays',
        when(col('metricType') == 'steps', col('currentStreak')).otherwise(None)
    ).drop('currentStreak')
    
    # Create analytics structure with 7-day time range
    analytics_df = metrics_with_streaks.select(
        col('userId'),
        col('metricType'),
        lit('7-day').alias('timeRange'),
        col('date').cast('string').alias('date'),
        col('value').alias('currentValue'),
        col('rollingAverage7Day'),
        col('trend'),
        col('anomalyDetected'),
        col('streakDays'),
        col('percentile'),
        col('comparisonToPrevious'),
        lit(calculated_at.isoformat()).alias('calculatedAt'),
        lit(expires_at.isoformat()).alias('expiresAt'),
        col('updatedAt')
    ).filter(
        # Only include metrics with rolling averages computed
        # (ensures we have enough data for meaningful analytics)
        col('rollingAverage7Day').isNotNull()
    )
    
    analytics_count = analytics_df.count()
    print(f"   ✅ Analytics output structured ({analytics_count} records)")
    
    return analytics_df


def save_analytics_to_mongodb_deprecated(analytics_df):
    """
    DEPRECATED: Use mongodb_utils.save_analytics_to_mongodb instead.
    This function is kept for backward compatibility only.
    
    Save analytics results to MongoDB analytics collection.
    
    Args:
        analytics_df: DataFrame with analytics results
    """
    print(f"💾 Saving analytics to MongoDB (deprecated method)...")
    print(f"⚠️  Consider migrating to mongodb_utils.save_analytics_to_mongodb for better error handling")
    
    try:
        # Get MongoDB configuration
        mongo_uri = os.getenv('MONGO_URI')
        mongo_db = os.getenv('MONGO_DB_NAME')
        analytics_collection = os.getenv('ANALYTICS_COLLECTION', 'analytics')
        
        # Write to MongoDB
        analytics_df.write \
            .format("mongodb") \
            .mode("append") \
            .option("database", mongo_db) \
            .option("collection", analytics_collection) \
            .save()
        
        count = analytics_df.count()
        print(f"   ✅ Saved {count} analytics records to MongoDB")
        
    except Exception as e:
        print(f"   ❌ Error saving to MongoDB: {e}")
        import traceback
        traceback.print_exc()


def convert_analytics_df_to_records(analytics_df):
    """
    Convert the flat analytics DataFrame to properly structured records
    matching the Mongoose Analytics schema.
    
    This function takes the DataFrame output from process_health_metrics()
    and converts it to a list of dictionaries with the correct nested structure
    for the Analytics collection.
    
    Args:
        analytics_df: DataFrame with flat analytics fields
        
    Returns:
        list: List of properly structured analytics records
    """
    
    print(f"🔄 Converting DataFrame to structured analytics records...")
    
    # Collect DataFrame rows
    rows = analytics_df.collect()
    analytics_list = []
    
    for row in rows:
        # Extract values from the row
        user_id = row['userId']
        metric_type = row['metricType']
        time_range = row['timeRange']
        
        # Build analytics nested structure
        analytics_data = {
            'rollingAverage': float(row['rollingAverage7Day']) if row['rollingAverage7Day'] is not None else 0.0,
            'trend': row['trend'] if row['trend'] else 'stable',
            'trendPercentage': float(row.get('trendPercentage', 0.0)) if row.get('trendPercentage') is not None else 0.0,
            'anomalyDetected': bool(row['anomalyDetected']) if row['anomalyDetected'] is not None else False,
            'anomalyDetails': None,  # Will be populated if anomaly detected
            'streakDays': int(row['streakDays']) if row['streakDays'] is not None else 0,
            'longestStreak': int(row.get('longestStreak', 0)) if row.get('longestStreak') is not None else 0,
            'streakStartDate': None,  # Can be enhanced later
            'percentile': float(row['percentile']) if row['percentile'] is not None else 50.0,
            'comparisonToPrevious': {
                'absoluteChange': float(row.get('comparisonToPrevious', 0.0)) if row.get('comparisonToPrevious') is not None else 0.0,
                'percentageChange': 0.0,  # Can be calculated if needed
                'isImprovement': None
            },
            'statistics': {
                'standardDeviation': 0.0,
                'minValue': None,
                'maxValue': None,
                'medianValue': None,
                'dataPointsCount': 0,
                'completenessPercentage': 0.0
            }
        }
        
        # Parse timestamps
        try:
            calculated_at = datetime.fromisoformat(row['calculatedAt'].replace('Z', '+00:00')) if isinstance(row['calculatedAt'], str) else row['calculatedAt']
            expires_at = datetime.fromisoformat(row['expiresAt'].replace('Z', '+00:00')) if isinstance(row['expiresAt'], str) else row['expiresAt']
        except:
            calculated_at = datetime.now()
            expires_at = calculated_at + timedelta(days=90)
        
        # Build complete record using helper function
        record = build_analytics_record(
            user_id=user_id,
            metric_type=metric_type,
            time_range=time_range,
            analytics_data=analytics_data,
            calculated_at=calculated_at,
            expires_at=expires_at,
            metadata=None  # Can add Spark metadata if needed
        )
        
        analytics_list.append(record)
    
    print(f"✅ Converted {len(analytics_list)} records to structured format")
    return analytics_list


def process_batch(batch_df, batch_id):
    """
    Micro-batch function triggered by the rate stream.
    
    This function implements the polling pattern:
    (1) Loads the last processed timestamp from checkpoint file (defaults to 30 days ago)
    (2) Queries healthmetrics for documents where updatedAt > last_timestamp and userId exists
    (3) Processes the batch (placeholder for analytics processing)
    (4) Updates the checkpoint timestamp to the max updatedAt in the current batch
    
    Args:
        batch_df: DataFrame from the rate stream (contains timestamp and value columns)
        batch_id: Unique identifier for this batch
    """
    # Start batch tracking
    batch_context = batch_logger.start_batch(batch_id)
    
    checkpoint_dir = os.getenv('CHECKPOINT_LOCATION', './spark-checkpoints')
    
    # (1) Load the last processed timestamp from checkpoint file
    last_ts = get_last_processed_timestamp(checkpoint_dir)
    
    print(f"📊 Polling for data updated after: {last_ts.isoformat()}")
    
    # Initialize batch tracking variables
    records_processed = 0
    analytics_computed = 0
    write_result = {'success': True, 'records_written': 0}
    errors = []
    
    try:
        # Use the spark session from the batch DataFrame
        spark_session = batch_df.sparkSession
        
        # (2) Query MongoDB for documents where updatedAt > last_timestamp and userId exists
        # Load the healthmetrics collection
        df = spark_session.read.format("mongodb") \
            .option("database", MONGO_DB_NAME) \
            .option("collection", "healthmetrics") \
            .load()
        
        # Filter for new records: updatedAt > last_timestamp AND userId is not null
        # Convert last_ts to string for comparison with MongoDB timestamp
        last_ts_str = last_ts.isoformat()
        new_data = df.filter(
            (col("updatedAt") > last_ts_str) & 
            col("userId").isNotNull()
        )
        
        # Cache to avoid re-computing for count and max operations
        new_data.cache()
        
        count_new = new_data.count()
        records_processed = count_new
        
        if count_new > 0:
            print(f"✅ Found {count_new} new/updated records")
            
            # (3) Process the batch with phone-only analytics
            print(f"📈 Processing {count_new} health metrics records...")
            
            analytics_results = process_health_metrics(new_data)
            
            # Display sample results
            analytics_count = analytics_results.count()
            analytics_computed = analytics_count
            print(f"📊 Generated {analytics_count} analytics records")
            
            if analytics_count > 0:
                print(f"📋 Sample analytics:")
                analytics_results.select(
                    'userId', 'metricType', 'date', 'currentValue', 
                    'rollingAverage7Day', 'trend', 'anomalyDetected', 'streakDays'
                ).show(5, truncate=False)
                
                # Convert DataFrame to list of properly structured records
                print(f"🔄 Converting analytics to MongoDB-compatible format...")
                analytics_list = convert_analytics_df_to_records(analytics_results)
                
                # Save analytics to MongoDB using the new utility function
                write_result = save_analytics_to_mongodb(
                    spark_session=spark_session,
                    analytics_list=analytics_list,
                    batch_id=batch_id
                )
                
                # Log write results
                if write_result['success']:
                    print(f"✅ Successfully wrote {write_result['records_written']} analytics records")
                else:
                    print(f"⚠️  Write completed with errors:")
                    print(f"   - Processed: {write_result['records_processed']}")
                    print(f"   - Written: {write_result['records_written']}")
                    print(f"   - Failed: {write_result['records_failed']}")
                    for error in write_result.get('errors', []):
                        print(f"   - Error: {error['message']}")
                        errors.append(error)

            
            # (4) Update the checkpoint timestamp to the max updatedAt in the current batch
            max_ts_row = new_data.agg(spark_max("updatedAt")).collect()
            if max_ts_row and max_ts_row[0][0]:
                max_ts_str = max_ts_row[0][0]
                # Convert string timestamp back to datetime
                max_ts = datetime.fromisoformat(max_ts_str.replace('Z', '+00:00'))
                print(f"💾 Updating checkpoint to: {max_ts.isoformat()}")
                save_last_processed_timestamp(checkpoint_dir, max_ts)
            else:
                print("⚠️ No valid updatedAt timestamp found in results")
        else:
            print(f"ℹ️ No new data found since {last_ts.isoformat()}")
            
        # Clean up cached data
        new_data.unpersist()
        
        # Complete batch tracking with success
        batch_logger.complete_batch(
            batch_context=batch_context,
            records_processed=records_processed,
            analytics_computed=analytics_computed,
            write_result=write_result,
            errors=errors if errors else None
        )
        
    except Exception as e:
        error_message = f"Error in batch processing: {str(e)}"
        print(f"❌ {error_message}")
        import traceback
        traceback.print_exc()
        
        # Mark batch as failed
        batch_logger.fail_batch(
            batch_context=batch_context,
            error_message=error_message,
            error_details={'exception': str(e), 'type': type(e).__name__}
        )


# Only start streaming if run as main script
if __name__ == "__main__":
    # Set up the micro-batch polling stream
    # Using 'rate' source to trigger process_batch every BATCH_INTERVAL_SECONDS
    batch_interval = int(os.getenv('BATCH_INTERVAL_SECONDS', '60'))
    checkpoint_location = os.path.abspath(os.getenv('CHECKPOINT_LOCATION', './spark-checkpoints'))

    print(f"🚀 Starting micro-batch polling stream")
    print(f"⏱️  Polling interval: {batch_interval} seconds")
    print(f"📂 Checkpoint location: {checkpoint_location}")

    # Create checkpoint directory if it doesn't exist
    os.makedirs(checkpoint_location, exist_ok=True)

    # Create the rate stream - generates 1 row per second
    # The trigger controls when foreachBatch is called
    polling_stream = spark.readStream \
        .format("rate") \
        .option("rowsPerSecond", 1) \
        .load()

    # Configure the streaming query with:
    # - processingTime trigger to control polling interval
    # - foreachBatch to execute our polling logic
    # - checkpointLocation for Spark's internal state management
    query = polling_stream.writeStream \
        .trigger(processingTime=f"{batch_interval} seconds") \
        .option("checkpointLocation", checkpoint_location) \
        .foreachBatch(process_batch) \
        .start()

    print(f"✅ Streaming query started with ID: {query.id}")
    print(f"🔄 Polling for new health metrics every {batch_interval} seconds")
    print(f"Press Ctrl+C to stop the stream...")

    try:
        query.awaitTermination()
    except KeyboardInterrupt:
        print("\n🛑 Stream stopped by user")
        query.stop()
    except Exception as e:
        print(f"❌ Stream error: {e}")
        import traceback
        traceback.print_exc()
        query.stop()
    finally:
        # Print session summary
        batch_logger.print_session_summary()
        
        # Export batch history
        batch_logger.export_batch_history()
        
        print("🔌 Stopping Spark session...")
        spark.stop()
        print("✅ Spark application terminated")

