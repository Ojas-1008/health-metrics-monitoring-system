"""
Simplified Analytics Test Runner
Sets up Hadoop environment variables to avoid winutils requirement on Windows
"""

import os
import sys

# Set Hadoop home to current directory to avoid winutils errors on Windows
hadoop_dir = os.path.join(os.getcwd(), 'hadoop')
os.makedirs(hadoop_dir, exist_ok=True)
os.environ['HADOOP_HOME'] = hadoop_dir
os.environ['hadoop.home.dir'] = hadoop_dir

# Suppress Hadoop warnings
os.environ['HADOOP_USER_NAME'] = 'spark'

print("🔧 Setting up Hadoop environment...")
print(f"   HADOOP_HOME = {hadoop_dir}")
print()

# Now import and run the analytics test
from test_analytics_patterns import run_spark_analytics_test

if __name__ == '__main__':
    try:
        run_spark_analytics_test()
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
