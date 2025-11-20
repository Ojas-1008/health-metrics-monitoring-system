"""
Quick Analytics Test - Direct MongoDB Query
Queries MongoDB for recent test data and displays analytics computations
"""

import os
import sys
from datetime import datetime, timedelta
from dotenv import load_dotenv
from pymongo import MongoClient
import pandas as pd

# Load environment variables
load_dotenv()

MONGO_URI = os.getenv('MONGO_URI')
MONGO_DB_NAME = os.getenv('MONGO_DB_NAME', 'health_metrics')

print("="*60)
print("📊 ANALYTICS DATA VERIFICATION")
print("="*60)
print(f"📅 Query Time: {datetime.now().isoformat()}")
print()

# Connect to MongoDB
print("📡 Connecting to MongoDB...")
client = MongoClient(MONGO_URI)
db = client[MONGO_DB_NAME]

# Query recent health metrics
print("🔍 Querying health metrics from last 30 days...")
end_date = datetime.now()
start_date = end_date - timedelta(days=30)

metrics = list(db.healthmetrics.find(
    {
        'updatedAt': {'$gte': start_date.isoformat()},
        'userId': {'$exists': True}
    },
    {
        'userId': 1,
        'date': 1,
        'metrics.steps': 1,
        'metrics.distance': 1,
        'metrics.calories': 1,
        'metrics.activeMinutes': 1,
        'source': 1,
        'updatedAt': 1
    }
).sort('date', -1))

print(f"✅ Found {len(metrics)} health metric records\n")

if len(metrics) > 0:
    # Convert to DataFrame for analysis
    df = pd.DataFrame(metrics)
    
    print("="*60)
    print("📈 RECENT HEALTH METRICS")
    print("="*60)
    
    for metric in metrics[:15]:  # Show last 15
        date = metric.get('date', 'N/A')
        steps = metric.get('metrics', {}).get('steps', 0)
        distance = metric.get('metrics', {}).get('distance', 0)
        calories = metric.get('metrics', {}).get('calories', 0)
        active_min = metric.get('metrics', {}).get('activeMinutes', 0)
        source = metric.get('source', 'N/A')
        
        print(f"\n📅 Date: {date}")
        print(f"   🚶 Steps: {steps:,}")
        print(f"   📏 Distance: {distance:.2f} km")
        print(f"   🔥 Calories: {calories:,}")
        print(f"   ⏱️  Active Minutes: {active_min}")
        print(f"   📱 Source: {source}")
    
    # Calculate simple analytics
    print("\n" + "="*60)
    print("📊 QUICK ANALYTICS")
    print("="*60)
    
    # Extract steps for all metrics
    steps_data = [(m.get('date'), m.get('metrics', {}).get('steps', 0)) for m in metrics]
    steps_data = [(d, s) for d, s in steps_data if s > 0]  # Filter non-zero
    
    if len(steps_data) > 0:
        steps_df = pd.DataFrame(steps_data, columns=['date', 'steps'])
        steps_df = steps_df.sort_values('date')
        
        # Rolling average
        steps_df['rolling_avg_7day'] = steps_df['steps'].rolling(window=7, min_periods=1).mean()
        
        # Calculate streaks (consecutive days > 1000 steps)
        steps_df['active_day'] = steps_df['steps'] > 1000
        steps_df['streak_break'] = (~steps_df['active_day']).cumsum()
        steps_df['streak'] = steps_df.groupby('streak_break').cumsum()['active_day']
        
        # Anomaly detection (simple 2-sigma rule)
        mean_steps = steps_df['steps'].mean()
        std_steps = steps_df['steps'].std()
        steps_df['is_anomaly'] = (steps_df['steps'] - mean_steps).abs() > (2 * std_steps)
        
        print("\n📈 7-Day Rolling Averages:")
        print(steps_df[['date', 'steps', 'rolling_avg_7day']].tail(10).to_string(index=False))
        
        print(f"\n🔥 Activity Streaks:")
        current_streak = int(steps_df['streak'].iloc[-1])
        max_streak = int(steps_df['streak'].max())
        print(f"   Current Streak: {current_streak} days")
        print(f"   Max Streak: {max_streak} days")
        
        print(f"\n⚠️  Anomaly Detection:")
        anomalies = steps_df[steps_df['is_anomaly']]
        if len(anomalies) > 0:
            print(f"   Detected {len(anomalies)} anomalies:")
            for _, row in anomalies.iterrows():
                print(f"   - {row['date']}: {int(row['steps'])} steps (Mean: {int(mean_steps)}, Std: {int(std_steps)})")
        else:
            print("   No anomalies detected")
        
        print(f"\n📊 Statistics:")
        print(f"   Mean Steps: {int(mean_steps)}")
        print(f"   Std Dev: {int(std_steps)}")
        print(f"   Min: {int(steps_df['steps'].min())}")
        print(f"   Max: {int(steps_df['steps'].max())}")
        print(f"   Total Days: {len(steps_df)}")
else:
    print("⚠️  No metrics found")

# Check if analytics collection has data
print("\n" + "="*60)
print("💾 ANALYTICS COLLECTION STATUS")
print("="*60)

analytics_count = db.analytics.count_documents({})
print(f"📊 Analytics records in database: {analytics_count}")

if analytics_count > 0:
    recent_analytics = list(db.analytics.find().sort('calculatedAt', -1).limit(5))
    print(f"\n📈 Recent Analytics (Last 5):")
    for ana in recent_analytics:
        print(f"\n   Date: {ana.get('date', 'N/A')}")
        print(f"   User: {ana.get('userId', 'N/A')}")
        print(f"   Calculated: {ana.get('calculatedAt', 'N/A')}")
        if 'rollingAverages' in ana:
            print(f"   Rolling Avg Steps: {ana['rollingAverages'].get('steps', 'N/A')}")
        if 'anomalies' in ana:
            print(f"   Anomalies: {len(ana['anomalies'])}")

print("\n" + "="*60)
print("✅ VERIFICATION COMPLETED")
print("="*60)

client.close()
