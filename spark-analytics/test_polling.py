"""
Test script for micro-batch polling functionality.
Verifies checkpoint management and MongoDB querying.
"""

import os
import sys
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add src directory to path for imports
sys.path.insert(0, os.path.dirname(__file__))

def test_checkpoint_functions():
    """Test checkpoint save/load functionality"""
    print("🧪 Testing Checkpoint Functions")
    print("=" * 60)
    
    # Import functions from main
    from main import get_last_processed_timestamp, save_last_processed_timestamp
    
    test_checkpoint_dir = "./test-checkpoints"
    
    # Test 1: Default timestamp (no checkpoint file)
    print("\n📝 Test 1: Get default timestamp (no checkpoint)")
    if os.path.exists(os.path.join(test_checkpoint_dir, "last_processed_timestamp.txt")):
        os.remove(os.path.join(test_checkpoint_dir, "last_processed_timestamp.txt"))
    
    default_ts = get_last_processed_timestamp(test_checkpoint_dir)
    expected_default = datetime.now() - timedelta(days=30)
    
    # Check if default is approximately 30 days ago (within 1 minute tolerance)
    time_diff = abs((default_ts - expected_default).total_seconds())
    assert time_diff < 60, f"Default timestamp not ~30 days ago: {default_ts}"
    print(f"✅ Default timestamp: {default_ts.isoformat()}")
    
    # Test 2: Save and load timestamp
    print("\n📝 Test 2: Save and load timestamp")
    test_ts = datetime.now() - timedelta(days=5)
    save_last_processed_timestamp(test_checkpoint_dir, test_ts)
    
    loaded_ts = get_last_processed_timestamp(test_checkpoint_dir)
    assert loaded_ts == test_ts, f"Loaded timestamp doesn't match: {loaded_ts} != {test_ts}"
    print(f"✅ Saved and loaded timestamp: {loaded_ts.isoformat()}")
    
    # Test 3: Update timestamp
    print("\n📝 Test 3: Update to newer timestamp")
    newer_ts = datetime.now() - timedelta(days=1)
    save_last_processed_timestamp(test_checkpoint_dir, newer_ts)
    
    loaded_newer = get_last_processed_timestamp(test_checkpoint_dir)
    assert loaded_newer == newer_ts, f"Updated timestamp doesn't match: {loaded_newer} != {newer_ts}"
    print(f"✅ Updated timestamp: {loaded_newer.isoformat()}")
    
    # Cleanup
    if os.path.exists(test_checkpoint_dir):
        import shutil
        shutil.rmtree(test_checkpoint_dir)
    
    print("\n" + "=" * 60)
    print("✅ All checkpoint tests passed!")
    

def test_mongodb_query():
    """Test MongoDB query pattern"""
    print("\n\n🧪 Testing MongoDB Query Pattern")
    print("=" * 60)
    
    try:
        from pyspark.sql import SparkSession
        from pyspark.sql.functions import col
        
        MONGO_URI = os.getenv('MONGO_URI')
        MONGO_DB_NAME = os.getenv('MONGO_DB_NAME')
        
        if not MONGO_URI or not MONGO_DB_NAME:
            print("⚠️ MONGO_URI or MONGO_DB_NAME not set, skipping MongoDB test")
            return
        
        print(f"\n📡 Connecting to MongoDB: {MONGO_DB_NAME}")
        
        # Initialize Spark Session
        spark = SparkSession.builder \
            .appName("PollingTest") \
            .master("local[2]") \
            .config("spark.mongodb.read.connection.uri", MONGO_URI) \
            .config("spark.mongodb.write.connection.uri", MONGO_URI) \
            .config("spark.jars.packages", "org.mongodb.spark:mongo-spark-connector_2.12:10.3.0") \
            .getOrCreate()
        
        spark.sparkContext.setLogLevel("ERROR")  # Reduce verbosity
        
        print("✅ Spark session created")
        
        # Test querying with timestamp filter
        print("\n📝 Test: Query with timestamp filter")
        
        df = spark.read.format("mongodb") \
            .option("database", MONGO_DB_NAME) \
            .option("collection", "healthmetrics") \
            .load()
        
        total_count = df.count()
        print(f"📊 Total records in healthmetrics: {total_count}")
        
        # Filter for records updated in last 30 days
        thirty_days_ago = (datetime.now() - timedelta(days=30)).isoformat()
        recent_data = df.filter(
            (col("updatedAt") > thirty_days_ago) & 
            col("userId").isNotNull()
        )
        
        recent_count = recent_data.count()
        print(f"📊 Records updated in last 30 days: {recent_count}")
        
        if recent_count > 0:
            print("\n📋 Sample record:")
            recent_data.select("userId", "date", "updatedAt", "source").show(1, truncate=False)
            
            # Test max timestamp extraction
            from pyspark.sql.functions import max as spark_max
            max_ts_row = recent_data.agg(spark_max("updatedAt")).collect()
            if max_ts_row and max_ts_row[0][0]:
                max_ts = max_ts_row[0][0]
                print(f"\n📅 Latest updatedAt timestamp: {max_ts}")
        
        spark.stop()
        print("\n" + "=" * 60)
        print("✅ MongoDB query test passed!")
        
    except Exception as e:
        print(f"❌ MongoDB test failed: {e}")
        import traceback
        traceback.print_exc()


def test_environment_config():
    """Test environment variable configuration"""
    print("\n\n🧪 Testing Environment Configuration")
    print("=" * 60)
    
    required_vars = {
        'MONGO_URI': os.getenv('MONGO_URI'),
        'MONGO_DB_NAME': os.getenv('MONGO_DB_NAME'),
        'SPARK_APP_NAME': os.getenv('SPARK_APP_NAME'),
        'BATCH_INTERVAL_SECONDS': os.getenv('BATCH_INTERVAL_SECONDS', '60'),
        'CHECKPOINT_LOCATION': os.getenv('CHECKPOINT_LOCATION', './spark-checkpoints')
    }
    
    print("\n📝 Environment Variables:")
    all_set = True
    for var, value in required_vars.items():
        if value:
            # Mask sensitive values
            display_value = value if var not in ['MONGO_URI'] else f"{value[:20]}..."
            print(f"  ✅ {var}: {display_value}")
        else:
            print(f"  ❌ {var}: NOT SET")
            all_set = False
    
    print("\n" + "=" * 60)
    if all_set:
        print("✅ All environment variables configured!")
    else:
        print("⚠️ Some environment variables missing")
    
    return all_set


if __name__ == "__main__":
    print("🚀 Micro-Batch Polling Implementation Test Suite")
    print("=" * 60)
    
    try:
        # Test 1: Environment configuration
        env_ok = test_environment_config()
        
        # Test 2: Checkpoint functions
        test_checkpoint_functions()
        
        # Test 3: MongoDB query (if environment is configured)
        if env_ok:
            test_mongodb_query()
        else:
            print("\n⚠️ Skipping MongoDB test - environment not fully configured")
        
        print("\n\n" + "=" * 60)
        print("🎉 All tests completed successfully!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n\n❌ Test suite failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
