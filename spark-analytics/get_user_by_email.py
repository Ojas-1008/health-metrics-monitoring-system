"""
Get User ID by Email
"""

import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment from parent directory (server/.env)
load_dotenv('../server/.env')

# MongoDB connection
MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    print("❌ MONGODB_URI not found in environment")
    print("   Make sure server/.env exists with MONGODB_URI")
    exit(1)

client = MongoClient(MONGODB_URI)
db = client["health-metrics-db"]
users_collection = db["users"]

# Find user by email
email = "ojasshrivastava1008@gmail.com"

# First, let's see all users
print("📋 All users in database:")
for user in users_collection.find():
    print(f"   - {user.get('email', 'N/A')} (ID: {user['_id']})")
print()

user = users_collection.find_one({"email": email})

if user:
    print(f"✅ Found user:")
    print(f"   User ID: {user['_id']}")
    print(f"   Email: {user.get('email', 'N/A')}")
    print(f"   Name: {user.get('name', 'N/A')}")
    print()
    print(f"📋 Use this User ID in test_large_scale_batching.py:")
    print(f'   TEST_USER_ID = "{user["_id"]}"')
else:
    print(f"❌ No user found with email: {email}")

client.close()

