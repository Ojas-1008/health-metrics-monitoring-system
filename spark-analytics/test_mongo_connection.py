"""
Test MongoDB connectivity without Spark
This verifies the MongoDB connection works before running Spark jobs
"""
import os
from dotenv import load_dotenv
from pymongo import MongoClient
import json

# Load environment variables
load_dotenv()

MONGO_URI = os.getenv('MONGO_URI')
MONGO_DB_NAME = os.getenv('MONGO_DB_NAME')

print("🔍 Testing MongoDB Connection...")
print(f"📡 Database: {MONGO_DB_NAME}")
print("-" * 50)

try:
    # Connect to MongoDB
    client = MongoClient(MONGO_URI)
    db = client[MONGO_DB_NAME]
    
    # Test connection
    client.admin.command('ping')
    print("✅ MongoDB Connection Successful!")
    
    # List collections
    collections = db.list_collection_names()
    print(f"\n📚 Available Collections: {', '.join(collections)}")
    
    # Get healthmetrics collection
    healthmetrics = db['healthmetrics']
    
    # Count documents
    count = healthmetrics.count_documents({})
    print(f"\n📊 Total documents in 'healthmetrics': {count}")
    
    if count > 0:
        # Get sample document
        print("\n📝 Sample Document:")
        sample = healthmetrics.find_one()
        
        # Pretty print the sample
        print(json.dumps({
            '_id': str(sample.get('_id')),
            'userId': str(sample.get('userId')),
            'date': str(sample.get('date')),
            'metrics': sample.get('metrics'),
            'source': sample.get('source')
        }, indent=2))
        
        print(f"\n✅ MongoDB is accessible and contains data!")
    else:
        print("\n⚠️  No documents found in healthmetrics collection")
    
    client.close()
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
