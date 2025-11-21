"""
Debug: Check database connection and users
"""

import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment from server/.env
load_dotenv('../server/.env')

# MongoDB connection
MONGODB_URI = os.getenv("MONGODB_URI")
print(f"📡 MONGODB_URI found: {bool(MONGODB_URI)}")
if MONGODB_URI:
    # Hide credentials in output
    safe_uri = MONGODB_URI.split('@')[-1] if '@' in MONGODB_URI else MONGODB_URI
    print(f"   Connecting to: ...@{safe_uri}")

if not MONGODB_URI:
    print("❌ MONGODB_URI not found")
    exit(1)

try:
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    
    # Test connection
    client.admin.command('ping')
    print("✅ Connected to MongoDB")
    
    # List all databases
    print("\n📚 Available databases:")
    for db_name in client.list_database_names():
        print(f"   - {db_name}")
    
    # Try different possible database names
    possible_db_names = ['health-metrics-db', 'health_metrics', 'health-metrics', 'test']
    
    for db_name in possible_db_names:
        db = client[db_name]
        users_collection = db["users"]
        user_count = users_collection.count_documents({})
        
        if user_count > 0:
            print(f"\n✅ Found {user_count} user(s) in database: {db_name}")
            print("\n👥 Users:")
            for user in users_collection.find():
                print(f"   - Email: {user.get('email', 'N/A')}")
                print(f"     ID: {user['_id']}")
                print(f"     Name: {user.get('name', 'N/A')}")
                print()
        else:
            print(f"\n❌ No users in database: {db_name}")
    
    client.close()
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
