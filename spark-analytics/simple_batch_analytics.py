"""
Simple Batch Analytics - Process all metrics and emit events
"""

import os
import sys
from datetime import datetime, timedelta
from dotenv import load_dotenv
from pymongo import MongoClient
from bson.objectid import ObjectId

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Load environment
load_dotenv('../server/.env')

# Import event emitter
from event_emitter import flush_all_batches, add_to_batch

print("="*60)
print("🚀 SIMPLE BATCH ANALYTICS PROCESSING")
print("="*60)
print(f"📅 Run Time: {datetime.now().isoformat()}")
print()

# MongoDB connection
MONGODB_URI = os.getenv("MONGODB_URI")
client = MongoClient(MONGODB_URI)
db = client["health_metrics"]

# Get user to process
user_email = "ojasshrivastava1008@gmail.com"
user = db["users"].find_one({"email": user_email})

if not user:
    print(f"❌ User not found: {user_email}")
    sys.exit(1)

user_id = str(user['_id'])
print(f"👤 Processing analytics for: {user.get('name', 'Unknown')}")
print(f"   User ID: {user_id}")
print()

# Get all health metrics for this user
health_metrics = list(db["healthmetrics"].find({"userId": ObjectId(user_id)}).sort("date", 1))

if not health_metrics:
    print("⚠️  No health metrics found for this user")
    sys.exit(0)

print(f"📊 Found {len(health_metrics)} health metrics")
print()

# Process each metric and create analytics
print("🔄 Processing analytics...")
analytics_created = 0
analytics_collection = db["analytics"]

for i, metric in enumerate(health_metrics, 1):
    if i % 10 == 0:
        print(f"   Progress: {i}/{len(health_metrics)} metrics processed...")
    
    try:
        metrics_data = metric.get('metrics', {})
        metric_date = metric['date']
        
        # Create a simple analytics record for each metric type
        for metric_type in ['steps', 'calories', 'activeMinutes', 'sleepHours', 'weight']:
            if metrics_data.get(metric_type):
                analytics_doc = {
                    "userId": ObjectId(user_id),
                    "metricType": metric_type,
                    "period": "week",
                    "timeRange": {
                        "start": metric_date - timedelta(days=7),
                        "end": metric_date
                    },
                    "value": metrics_data[metric_type],
                    "patterns": [
                        {
                            "type": "trend",
                            "description": f"{metric_type} tracking",
                            "confidence": 0.85
                        }
                    ],
                    "insights": [
                        {
                            "category": "performance",
                            "message": f"Your {metric_type} data has been analyzed",
                            "priority": "medium"
                        }
                    ],
                    "recommendations": [
                        f"Continue monitoring your {metric_type}"
                    ],
                    "createdAt": datetime.now(),
                    "updatedAt": datetime.now()
                }
                
                # Insert into MongoDB
                result = analytics_collection.insert_one(analytics_doc)
                
                # Add to batch for SSE emission
                # Convert MongoDB doc to JSON-serializable format
                analytics_for_sse = {
                    **analytics_doc,
                    '_id': str(result.inserted_id),
                    'userId': str(analytics_doc['userId']),
                    'timeRange': {
                        'start': analytics_doc['timeRange']['start'].isoformat(),
                        'end': analytics_doc['timeRange']['end'].isoformat()
                    },
                    'createdAt': analytics_doc['createdAt'].isoformat(),
                    'updatedAt': analytics_doc['updatedAt'].isoformat()
                }
                
                add_to_batch(
                    user_id=str(user_id),
                    metric_type=metric_type,
                    time_range=analytics_doc['period'],
                    analytics_data=analytics_for_sse
                )
                
                analytics_created += 1
            
    except Exception as e:
        print(f"   ⚠️  Error processing metric {i}: {e}")
        continue

print(f"\n✅ Created {analytics_created} analytics records")
print()

# Flush all accumulated batches
print("📦 Flushing accumulated analytics batches...")
flush_all_batches()

print()
print("="*60)
print("✅ BATCH PROCESSING COMPLETE")
print("="*60)

client.close()
