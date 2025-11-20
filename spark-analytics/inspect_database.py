"""
Database Inspector - Check actual data structure
"""

import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

client = MongoClient(os.getenv('MONGO_URI'))
db = client[os.getenv('MONGO_DB_NAME', 'health_metrics')]

print("="*60)
print("🔍 DATABASE INSPECTION")
print("="*60)

# Check collections
collections = db.list_collection_names()
print(f"\n📁 Collections: {', '.join(collections)}")

# Count documents in each
print("\n📊 Document Counts:")
for coll in collections:
    count = db[coll].count_documents({})
    print(f"   {coll}: {count}")

# Check health metrics structure
print("\n" + "="*60)
print("📋 HEALTHMETRICS SAMPLE")
print("="*60)

# Get the most recent record
recent = db.healthmetrics.find_one(sort=[('_id', -1)])
if recent:
    print(f"\nMost recent record:")
    print(f"   _id: {recent.get('_id')}")
    print(f"   userId: {recent.get('userId')}")
    print(f"   date: {recent.get('date')}")
    print(f"   updatedAt: {recent.get('updatedAt')}")
    print(f"   source: {recent.get('source')}")
    print(f"   metrics: {recent.get('metrics')}")
else:
    print("No health metrics found")

# Check all records from the last few days
print("\n" + "="*60)
print("📅 RECENT METRICS (All)")
print("="*60)

cutoff_date = datetime(2025, 11, 1)  # Check from November as datetime
recent_metrics = list(db.healthmetrics.find(
    {'date': {'$gte': cutoff_date}},
    {'date': 1, 'metrics.steps': 1, 'source': 1, 'updatedAt': 1}
).sort('date', 1))

print(f"\nFound {len(recent_metrics)} records since {cutoff_date}")
for m in recent_metrics:
    date = m.get('date', 'N/A')
    steps = m.get('metrics', {}).get('steps', 0)
    source = m.get('source', 'N/A')
    updated = m.get('updatedAt', 'N/A')
    print(f"   {date}: {steps} steps (source: {source}, updated: {updated if isinstance(updated, str) else str(updated)[:19]})")

# Check for test pattern data (7000, 7500, 8000, etc.)
print("\n" + "="*60)
print("🎯 TEST PATTERN DATA")
print("="*60)

test_steps = [7000, 7500, 8000, 8500, 9000, 9500, 10000, 18000, 8200]
for steps in test_steps:
    count = db.healthmetrics.count_documents({'metrics.steps': steps})
    if count > 0:
        records = list(db.healthmetrics.find({'metrics.steps': steps}, {'date': 1}))
        dates = [str(r.get('date')) if r.get('date') else 'N/A' for r in records]
        print(f"   {steps} steps: {count} records on dates: {', '.join(dates)}")

print("\n" + "="*60)
print("✅ INSPECTION COMPLETED")
print("="*60)

client.close()
