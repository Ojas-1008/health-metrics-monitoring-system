"""
Check checkpoint status and provide insights.
"""

import os
from datetime import datetime

print("=" * 70)
print("📁 CHECKPOINT STATUS CHECK")
print("=" * 70)

checkpoint_dir = './spark-checkpoints'
checkpoint_file = os.path.join(checkpoint_dir, 'last_processed_timestamp.txt')

print(f"\n📂 Checkpoint Directory: {os.path.abspath(checkpoint_dir)}")
print(f"📄 Checkpoint File: last_processed_timestamp.txt")

if os.path.exists(checkpoint_file):
    print("\n✅ Checkpoint file exists")
    
    # Read timestamp
    with open(checkpoint_file, 'r') as f:
        timestamp_str = f.read().strip()
    
    print(f"📅 Timestamp: {timestamp_str}")
    
    # Parse and analyze
    try:
        checkpoint_time = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
        current_time = datetime.now()
        time_diff = current_time - checkpoint_time
        
        print(f"🕐 Current Time: {current_time.isoformat()}")
        print(f"⏱️  Time Since Checkpoint: {time_diff}")
        
        # Calculate how far behind
        hours = time_diff.total_seconds() / 3600
        
        if hours < 1:
            print(f"✅ Status: UP TO DATE (< 1 hour behind)")
        elif hours < 24:
            print(f"⚠️ Status: SLIGHTLY BEHIND ({hours:.1f} hours)")
        else:
            print(f"❌ Status: SIGNIFICANTLY BEHIND ({hours:.1f} hours)")
        
        # Next batch prediction
        from dotenv import load_dotenv
        load_dotenv()
        batch_interval = int(os.getenv('BATCH_INTERVAL_SECONDS', '60'))
        
        print(f"\n📊 Batch Configuration:")
        print(f"   Interval: {batch_interval} seconds")
        print(f"   Next Query: Records with updatedAt > {timestamp_str}")
        
    except Exception as e:
        print(f"⚠️ Could not parse timestamp: {e}")
        
else:
    print("\n⚠️ Checkpoint file does not exist")
    print("📝 This means:")
    print("   - First run of the streaming job, OR")
    print("   - Checkpoint was deleted/reset")
    print("   - Next run will default to 30 days ago")

# Check Spark checkpoint metadata
spark_checkpoint_path = os.path.join(checkpoint_dir, 'offsets')
if os.path.exists(spark_checkpoint_path):
    print(f"\n📁 Spark Internal Checkpoint: EXISTS")
    # Count offset files
    offset_files = [f for f in os.listdir(spark_checkpoint_path) if f.isdigit()]
    if offset_files:
        latest_batch = max([int(f) for f in offset_files])
        print(f"   Latest Batch ID: {latest_batch}")
else:
    print(f"\n📁 Spark Internal Checkpoint: NOT FOUND")
    print("   (Will be created on first run)")

print("\n" + "=" * 70)
print("💡 ACTIONS:")
print("=" * 70)

print("\n🔄 To reset checkpoint (reprocess data):")
print("   Remove-Item ./spark-checkpoints/last_processed_timestamp.txt")

print("\n🔄 To set specific timestamp:")
print("   $date = '2025-11-20T10:00:00'")
print("   Set-Content ./spark-checkpoints/last_processed_timestamp.txt $date")

print("\n🔄 To reset everything (full reprocess):")
print("   Remove-Item -Recurse -Force ./spark-checkpoints")

print("\n" + "=" * 70)
