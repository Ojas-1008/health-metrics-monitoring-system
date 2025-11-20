"""
Verify Analytics in MongoDB
Checks that analytics records were written correctly with proper structure.
"""

import os
from datetime import datetime
from dotenv import load_dotenv
from pymongo import MongoClient
import json

load_dotenv()

print("="*70)
print("VERIFY ANALYTICS IN MONGODB")
print("="*70)
print(f"Verification Time: {datetime.now().isoformat()}\n")

# Connect to MongoDB
mongo_uri = os.getenv('MONGO_URI')
db_name = os.getenv('MONGO_DB_NAME', 'health_metrics')
collection_name = os.getenv('ANALYTICS_COLLECTION', 'analytics')

print(f"Connecting to MongoDB...")
print(f"Database: {db_name}")
print(f"Collection: {collection_name}\n")

client = MongoClient(mongo_uri)
db = client[db_name]
collection = db[collection_name]

# Count total documents
total_count = collection.count_documents({})
print(f"Total analytics documents: {total_count}\n")

# Get test records (last 10)
print("Fetching recent analytics records...")
recent_docs = list(collection.find().sort('calculatedAt', -1).limit(10))

if recent_docs:
    print(f"Found {len(recent_docs)} recent documents\n")
    
    # Display first document structure
    print("="*70)
    print("SAMPLE DOCUMENT STRUCTURE")
    print("="*70)
    first_doc = recent_docs[0]
    
    # Remove _id for cleaner display
    display_doc = {k: v for k, v in first_doc.items() if k != '_id'}
    
    print(json.dumps(display_doc, indent=2, default=str))
    print()
    
    # Verify required fields
    print("="*70)
    print("FIELD VERIFICATION")
    print("="*70)
    
    required_fields = ['userId', 'metricType', 'timeRange', 'analytics', 'calculatedAt']
    all_valid = True
    
    for field in required_fields:
        exists = field in first_doc
        print(f"  {field}: {'PRESENT' if exists else 'MISSING'}")
        if not exists:
            all_valid = False
    
    print()
    
    # Check nested analytics structure
    if 'analytics' in first_doc:
        print("Analytics nested fields:")
        analytics = first_doc['analytics']
        analytics_fields = ['rollingAverage', 'trend', 'anomalyDetected', 'streakDays', 'percentile']
        
        for field in analytics_fields:
            exists = field in analytics
            value = analytics.get(field, 'N/A')
            print(f"  {field}: {value} ({'PRESENT' if exists else 'MISSING'})")
        print()
    
    # Check timestamps
    print("="*70)
    print("TIMESTAMP VERIFICATION")
    print("="*70)
    
    if 'calculatedAt' in first_doc:
        calc_at = first_doc['calculatedAt']
        print(f"  calculatedAt: {calc_at}")
        print(f"  Type: {type(calc_at).__name__}")
    
    if 'expiresAt' in first_doc:
        exp_at = first_doc['expiresAt']
        print(f"  expiresAt: {exp_at}")
        print(f"  Type: {type(exp_at).__name__}")
        
        # Calculate days until expiration
        if isinstance(exp_at, str):
            try:
                exp_date = datetime.fromisoformat(exp_at.replace('Z', '+00:00'))
                days_until_expire = (exp_date - datetime.now()).days
                print(f"  Days until expiration: {days_until_expire}")
            except:
                print(f"  Could not parse expiration date")
    
    print()
    
    # Check TTL index
    print("="*70)
    print("INDEX VERIFICATION")
    print("="*70)
    
    indexes = list(collection.list_indexes())
    print(f"Total indexes: {len(indexes)}\n")
    
    ttl_index_found = False
    for index in indexes:
        index_name = index.get('name', 'unknown')
        keys = index.get('key', {})
        expire_after = index.get('expireAfterSeconds')
        
        print(f"Index: {index_name}")
        print(f"  Keys: {dict(keys)}")
        
        if expire_after is not None:
            print(f"  TTL: expires after {expire_after} seconds")
            ttl_index_found = True
        
        print()
    
    if not ttl_index_found:
        print("WARNING: No TTL index found!")
        print("Analytics documents will not auto-expire.")
        print("\nTo create TTL index, run in MongoDB shell:")
        print(f'  db.{collection_name}.createIndex({{ "expiresAt": 1 }}, {{ expireAfterSeconds: 0 }})')
        print()
    
    # Summary
    print("="*70)
    print("VERIFICATION SUMMARY")
    print("="*70)
    
    if all_valid:
        print("SUCCESS: All required fields present")
    else:
        print("WARNING: Some required fields missing")
    
    print(f"Documents verified: {len(recent_docs)}")
    print(f"TTL index: {'CONFIGURED' if ttl_index_found else 'NOT CONFIGURED'}")
    
    # Group by metric type
    print("\nDocuments by metric type:")
    pipeline = [
        {'$group': {'_id': '$metricType', 'count': {'$sum': 1}}},
        {'$sort': {'count': -1}}
    ]
    metric_counts = list(collection.aggregate(pipeline))
    for item in metric_counts:
        print(f"  {item['_id']}: {item['count']} documents")
    
    # Group by time range
    print("\nDocuments by time range:")
    pipeline = [
        {'$group': {'_id': '$timeRange', 'count': {'$sum': 1}}},
        {'$sort': {'count': -1}}
    ]
    range_counts = list(collection.aggregate(pipeline))
    for item in range_counts:
        print(f"  {item['_id']}: {item['count']} documents")
    
else:
    print("No analytics documents found in collection")
    print("\nRun test_mongodb_write_simple.py to create test data")

print("\n" + "="*70)
print("VERIFICATION COMPLETE")
print("="*70)

# Close connection
client.close()
