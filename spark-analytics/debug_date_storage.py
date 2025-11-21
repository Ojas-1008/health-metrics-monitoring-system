"""Debug the date storage format in MongoDB."""

from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv('../server/.env')

client = MongoClient(os.getenv('MONGODB_URI'))
db = client['health_metrics']

user_id = ObjectId('690b9449c3325e85f9ab7a0e')

# Get the metric for Nov 19
metric = db['healthmetrics'].find_one({
    'userId': user_id,
    'date': datetime(2025, 11, 19)
})

if metric:
    print("\n✅ Found metric for 2025-11-19")
    print(f"Date stored in DB: {metric['date']}")
    print(f"Date type: {type(metric['date'])}")
    print(f"Date ISO format: {metric['date'].isoformat()}")
    print(f"Date string: {str(metric['date'])}")
else:
    print("\n❌ No metric found for 2025-11-19")
    
    # Try to find any metric close to that date
    print("\nLet's check metrics around that date:")
    nearby = list(db['healthmetrics'].find({
        'userId': user_id
    }).sort('date', -1).limit(10))
    
    for m in nearby:
        print(f"  - {m['date']} ({m['date'].isoformat()})")

client.close()
