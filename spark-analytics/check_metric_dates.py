"""Check what dates have health metrics in the database."""

from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('../server/.env')

# Connect to MongoDB
client = MongoClient(os.getenv('MONGODB_URI'))
db = client['health_metrics']

user_id = ObjectId('690b9449c3325e85f9ab7a0e')

# Get latest 5 metrics
latest_metrics = list(db['healthmetrics'].find(
    {'userId': user_id}
).sort('date', -1).limit(5))

print("\n📅 Latest 5 metric dates:")
for m in latest_metrics:
    print(f"  - {m['date'].strftime('%Y-%m-%d')}")

# Get earliest metric
earliest_metrics = list(db['healthmetrics'].find(
    {'userId': user_id}
).sort('date', 1).limit(1))

if earliest_metrics:
    print(f"\n📅 Earliest metric date: {earliest_metrics[0]['date'].strftime('%Y-%m-%d')}")

# Get total count
total = db['healthmetrics'].count_documents({'userId': user_id})
print(f"\n📊 Total metrics: {total}")

# Check for November 19, 2025 specifically
nov_19_metric = db['healthmetrics'].find_one({
    'userId': user_id,
    'date': datetime(2025, 11, 19)
})

print(f"\n🔍 Metric for 2025-11-19: {'Found ✅' if nov_19_metric else 'Not Found ❌'}")

client.close()
