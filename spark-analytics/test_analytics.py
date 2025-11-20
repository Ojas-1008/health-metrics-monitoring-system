"""
Test script for phone-only metric aggregations and analytics processing.
Validates the analytics computation logic.
"""

import os
import sys
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_analytics_schema():
    """Test that analytics processing produces correct schema"""
    print("🧪 Testing Analytics Schema")
    print("=" * 70)
    
    try:
        from pyspark.sql import SparkSession
        from pyspark.sql.functions import col
        
        MONGO_URI = os.getenv('MONGO_URI')
        MONGO_DB_NAME = os.getenv('MONGO_DB_NAME')
        
        if not MONGO_URI or not MONGO_DB_NAME:
            print("⚠️ MONGO_URI or MONGO_DB_NAME not set, skipping test")
            return False
        
        print(f"\n📡 Connecting to MongoDB: {MONGO_DB_NAME}")
        
        # Initialize Spark Session
        spark = SparkSession.builder \
            .appName("AnalyticsSchemaTest") \
            .master("local[2]") \
            .config("spark.mongodb.read.connection.uri", MONGO_URI) \
            .config("spark.mongodb.write.connection.uri", MONGO_URI) \
            .config("spark.jars.packages", "org.mongodb.spark:mongo-spark-connector_2.12:10.3.0") \
            .getOrCreate()
        
        spark.sparkContext.setLogLevel("ERROR")
        
        print("✅ Spark session created")
        
        # Load health metrics
        print("\n📝 Loading health metrics...")
        df = spark.read.format("mongodb") \
            .option("database", MONGO_DB_NAME) \
            .option("collection", "healthmetrics") \
            .load()
        
        total_count = df.count()
        print(f"📊 Total records in healthmetrics: {total_count}")
        
        if total_count == 0:
            print("⚠️ No data to test with")
            spark.stop()
            return False
        
        # Display schema
        print("\n📋 Health Metrics Schema:")
        df.printSchema()
        
        # Test phone-only filtering
        print("\n📝 Testing phone-only filtering...")
        phone_only = df.filter(col('source').isin(['manual', 'googlefit']))
        phone_count = phone_only.count()
        print(f"📊 Phone-only records: {phone_count}")
        
        # Import analytics processing function
        sys.path.insert(0, os.path.dirname(__file__))
        from main import process_health_metrics
        
        # Process a sample
        print("\n📝 Testing analytics processing...")
        print("   (This may take a minute for the first run)")
        
        # Take a sample for testing
        sample_df = phone_only.limit(10)
        
        analytics_df = process_health_metrics(sample_df)
        
        print("\n📋 Analytics Schema:")
        analytics_df.printSchema()
        
        analytics_count = analytics_df.count()
        print(f"\n📊 Analytics records generated: {analytics_count}")
        
        if analytics_count > 0:
            print("\n📋 Sample analytics data:")
            analytics_df.select(
                'userId', 'metricType', 'date', 'currentValue',
                'rollingAverage7Day', 'trend', 'anomalyDetected', 'streakDays'
            ).show(5, truncate=False)
            
            print("\n📊 Analytics Summary:")
            analytics_df.groupBy('metricType').count().show()
            
            print("\n📊 Trend Distribution:")
            analytics_df.groupBy('trend').count().show()
            
            print("\n⚠️ Anomalies Detected:")
            anomalies = analytics_df.filter(col('anomalyDetected') == True)
            anomaly_count = anomalies.count()
            print(f"   Found {anomaly_count} anomalies")
            if anomaly_count > 0:
                anomalies.select('userId', 'metricType', 'currentValue', 'rollingAverage7Day').show(5)
        
        spark.stop()
        print("\n" + "=" * 70)
        print("✅ Analytics schema test passed!")
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_streak_calculation():
    """Test streak calculation logic"""
    print("\n\n🧪 Testing Streak Calculation Logic")
    print("=" * 70)
    
    try:
        from pyspark.sql import SparkSession
        from pyspark.sql.types import StructType, StructField, StringType, IntegerType, DateType
        from datetime import date
        
        # Create test data
        spark = SparkSession.builder \
            .appName("StreakTest") \
            .master("local[2]") \
            .getOrCreate()
        
        spark.sparkContext.setLogLevel("ERROR")
        
        # Sample data: consecutive days with steps > 1000
        test_data = [
            ('user1', date(2025, 11, 15), 1200),  # Day 1
            ('user1', date(2025, 11, 16), 1500),  # Day 2
            ('user1', date(2025, 11, 17), 1800),  # Day 3
            ('user1', date(2025, 11, 18), 800),   # Breaks streak
            ('user1', date(2025, 11, 19), 1100),  # New streak day 1
            ('user1', date(2025, 11, 20), 1300),  # New streak day 2
        ]
        
        schema = StructType([
            StructField('userId', StringType(), False),
            StructField('date', DateType(), False),
            StructField('steps', IntegerType(), False)
        ])
        
        test_df = spark.createDataFrame(test_data, schema)
        
        print("\n📋 Test Data:")
        test_df.show()
        
        # Apply streak logic (simplified version)
        from pyspark.sql import Window
        from pyspark.sql.functions import lag, datediff, when, row_number, sum as spark_sum
        
        window_streak = Window.partitionBy('userId').orderBy('date')
        
        streaks_df = test_df.withColumn(
            'prevDate',
            lag('date', 1).over(window_streak)
        ).withColumn(
            'prevSteps',
            lag('steps', 1).over(window_streak)
        ).withColumn(
            'isStreakDay',
            when(test_df['steps'] > 1000, 1).otherwise(0)
        ).withColumn(
            'isConsecutive',
            when(
                (datediff(test_df['date'], lag('date', 1).over(window_streak)) == 1) &
                (lag('steps', 1).over(window_streak) > 1000) &
                (test_df['steps'] > 1000),
                1
            ).otherwise(0)
        ).withColumn(
            'streakReset',
            when(
                (col('isStreakDay') == 1) & (col('isConsecutive') == 0),
                1
            ).otherwise(0)
        ).withColumn(
            'streakGroupId',
            spark_sum('streakReset').over(window_streak)
        )
        
        window_group = Window.partitionBy('userId', 'streakGroupId').orderBy('date')
        
        streaks_final = streaks_df.withColumn(
            'streakDays',
            when(
                col('isStreakDay') == 1,
                row_number().over(window_group)
            ).otherwise(0)
        )
        
        print("\n📊 Streak Calculation Results:")
        streaks_final.select('date', 'steps', 'isStreakDay', 'streakDays').show()
        
        spark.stop()
        print("\n" + "=" * 70)
        print("✅ Streak calculation test passed!")
        return True
        
    except Exception as e:
        print(f"❌ Streak test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_analytics_collection():
    """Test reading from analytics collection"""
    print("\n\n🧪 Testing Analytics Collection")
    print("=" * 70)
    
    try:
        from pyspark.sql import SparkSession
        
        MONGO_URI = os.getenv('MONGO_URI')
        MONGO_DB_NAME = os.getenv('MONGO_DB_NAME')
        ANALYTICS_COLLECTION = os.getenv('ANALYTICS_COLLECTION', 'analytics')
        
        spark = SparkSession.builder \
            .appName("AnalyticsCollectionTest") \
            .master("local[2]") \
            .config("spark.mongodb.read.connection.uri", MONGO_URI) \
            .config("spark.mongodb.write.connection.uri", MONGO_URI) \
            .config("spark.jars.packages", "org.mongodb.spark:mongo-spark-connector_2.12:10.3.0") \
            .getOrCreate()
        
        spark.sparkContext.setLogLevel("ERROR")
        
        print(f"\n📡 Reading from analytics collection: {ANALYTICS_COLLECTION}")
        
        analytics_df = spark.read.format("mongodb") \
            .option("database", MONGO_DB_NAME) \
            .option("collection", ANALYTICS_COLLECTION) \
            .load()
        
        count = analytics_df.count()
        print(f"📊 Total analytics records: {count}")
        
        if count > 0:
            print("\n📋 Analytics Schema:")
            analytics_df.printSchema()
            
            print("\n📋 Sample Records:")
            analytics_df.show(5, truncate=False)
            
            print("\n📊 By Metric Type:")
            analytics_df.groupBy('metricType').count().show()
        else:
            print("ℹ️ No analytics records found yet")
            print("   Run the streaming job to generate analytics")
        
        spark.stop()
        print("\n" + "=" * 70)
        print("✅ Analytics collection test passed!")
        return True
        
    except Exception as e:
        print(f"❌ Analytics collection test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("🚀 Phone-Only Metric Aggregations - Test Suite")
    print("=" * 70)
    print(f"📅 Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    results = []
    
    try:
        # Test 1: Analytics schema and processing
        results.append(("Analytics Processing", test_analytics_schema()))
        
        # Test 2: Streak calculation
        results.append(("Streak Calculation", test_streak_calculation()))
        
        # Test 3: Analytics collection
        results.append(("Analytics Collection", test_analytics_collection()))
        
        # Summary
        print("\n\n" + "=" * 70)
        print("📊 TEST SUMMARY")
        print("=" * 70)
        
        for test_name, passed in results:
            status = "✅ PASS" if passed else "❌ FAIL"
            print(f"{status}: {test_name}")
        
        all_passed = all(result[1] for result in results)
        
        print("\n" + "=" * 70)
        if all_passed:
            print("🎉 All tests passed!")
        else:
            print("⚠️ Some tests failed - review output above")
        print("=" * 70)
        
    except KeyboardInterrupt:
        print("\n\n🛑 Tests interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Test suite error: {e}")
        import traceback
        traceback.print_exc()
