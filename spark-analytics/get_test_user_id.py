"""
Get Test User ID
Retrieves the first user from the database for testing purposes
"""

import os
import sys
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment
load_dotenv()

# MongoDB connection
MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    print("❌ MONGODB_URI not found in environment")
    sys.exit(1)

client = MongoClient(MONGODB_URI)
db = client["health-metrics-db"]
users_collection = db["users"]

# Get first user
user = users_collection.find_one()

if user:
    print(f"✅ Found user:")
    print(f"   User ID: {user['_id']}")
    print(f"   Email: {user.get('email', 'N/A')}")
    print(f"   Name: {user.get('name', 'N/A')}")
    print()
    print(f"📋 Copy this User ID for testing:")
    print(f'   TEST_USER_ID = "{user["_id"]}"')
else:
    print("❌ No users found in database")
    print("   Please register a user first")

client.close()
