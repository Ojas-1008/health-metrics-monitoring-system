"""
Quick start script for Spark streaming job with enhanced logging.
"""

import sys
import os

# Ensure we're in the correct directory
script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)

print("=" * 70)
print("🚀 STARTING SPARK MICRO-BATCH POLLING STREAM")
print("=" * 70)

# Check prerequisites
print("\n📋 Pre-flight checks:")

# Check .env file
if os.path.exists('.env'):
    print("   ✅ .env file found")
else:
    print("   ❌ .env file missing - please create from .env.example")
    sys.exit(1)

# Check Hadoop home
if os.path.exists('C:\\hadoop\\bin\\winutils.exe'):
    print("   ✅ Hadoop binaries found")
else:
    print("   ⚠️ Hadoop binaries not found at C:\\hadoop\\bin")
    print("      You may encounter warnings, but the job should still work")

# Check checkpoint directory
checkpoint_dir = './spark-checkpoints'
checkpoint_file = os.path.join(checkpoint_dir, 'last_processed_timestamp.txt')

if os.path.exists(checkpoint_file):
    with open(checkpoint_file, 'r') as f:
        timestamp = f.read().strip()
    print(f"   ✅ Checkpoint exists: {timestamp}")
else:
    print("   ℹ️ No checkpoint found (will start from 30 days ago)")

print("\n" + "=" * 70)
print("📝 INSTRUCTIONS:")
print("   - Wait ~60 seconds for first batch to execute")
print("   - Watch for batch processing logs")
print("   - Press Ctrl+C to stop gracefully")
print("=" * 70)

print("\n🔄 Starting Spark application...\n")

# Import and run main
try:
    import main
except KeyboardInterrupt:
    print("\n\n🛑 Spark job stopped by user")
except Exception as e:
    print(f"\n\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
