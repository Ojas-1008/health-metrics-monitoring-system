/**
 * Debug script to test Google Fit API directly for wearable data
 */
import axios from 'axios';
import connectDB from '../src/config/database.js';
import User from '../src/models/User.js';

const GOOGLE_FIT_API_BASE = 'https://www.googleapis.com/fitness/v1/users/me';

const GOOGLE_FIT_DATA_SOURCES = {
  height: {
    dataSourceId: "derived:com.google.height:com.google.android.gms:merge_height",
    field: "fpVal",
  },
  bloodPressure: {
    dataSourceId: "derived:com.google.blood_pressure:com.google.android.gms:merged",
    field: "mapVal",
  },
  hydration: {
    dataSourceId: "derived:com.google.hydration:com.google.android.gms:merged",
    field: "fpVal",
  },
};

(async () => {
  try {
    await connectDB();
    
    // Get test user
    const user = await User.findOne({ googleFitConnected: true }).select('+googleFitTokens');
    if (!user) {
      console.log('❌ No user with Google Fit connected');
      process.exit(1);
    }
    
    console.log(`\n👤 Testing with user: ${user.email}\n`);
    
    const accessToken = user.googleFitTokens.accessToken;
    
    // Sync window: last 7 days
    const endTimeMs = Date.now();
    const startTimeMs = endTimeMs - (7 * 24 * 60 * 60 * 1000);
    const startTimeNanos = startTimeMs * 1000000;
    const endTimeNanos = endTimeMs * 1000000;
    
    console.log(`📅 Fetching from ${new Date(startTimeMs).toISOString()} to ${new Date(endTimeMs).toISOString()}\n`);
    
    for (const [dataType, config] of Object.entries(GOOGLE_FIT_DATA_SOURCES)) {
      console.log(`\n🔍 Testing: ${dataType}`);
      console.log(`   DataSourceId: ${config.dataSourceId}`);
      console.log(`   Field: ${config.field}`);
      
      try {
        const url = `${GOOGLE_FIT_API_BASE}/dataSources/${config.dataSourceId}/datasets/${startTimeNanos}-${endTimeNanos}`;
        
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 5000,
        });
        
        const points = response.data.point || [];
        console.log(`   ✅ Got ${points.length} data points`);
        
        if (points.length > 0) {
          console.log(`\n   📦 Sample data point:`);
          const firstPoint = points[0];
          console.log(`      endTimeNanos: ${firstPoint.endTimeNanos}`);
          console.log(`      value: ${JSON.stringify(firstPoint.value)}`);
          
          // Test aggregation
          if (config.field === "mapVal" && firstPoint.value && firstPoint.value[0]) {
            const mapData = firstPoint.value[0].mapVal;
            console.log(`\n   🔬 Blood Pressure mapVal:`);
            if (mapData) {
              mapData.forEach(item => {
                console.log(`      ${item.key}: ${item.value.fpVal}`);
              });
            }
          }
        }
      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`   ℹ️  Data source not available (404)`);
        } else {
          console.log(`   ❌ Error: ${error.response?.status || 'Unknown'} - ${error.message}`);
        }
      }
    }
    
    console.log('\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
})();
