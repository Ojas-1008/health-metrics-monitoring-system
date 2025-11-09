import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

import User from '../src/models/User.js';

const diagnoseSync = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const user = await User.findOne({ 
      email: 'ojasshrivastava1008@gmail.com' 
    }).select('+googleFitTokens');

    if (!user || !user.googleFitConnected) {
      console.log('❌ User not found or not connected');
      process.exit(1);
    }

    const accessToken = user.googleFitTokens.access_token;
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

    // Test the exact data sources from the sync worker
    const dataSources = {
      weight: {
        id: 'derived:com.google.weight:com.google.android.gms:merge_weight',
        field: 'fpVal'
      },
      height: {
        id: 'derived:com.google.height:com.google.android.gms:merge_height',
        field: 'fpVal'
      },
      distance: {
        id: 'derived:com.google.distance.delta:com.google.android.gms',
        field: 'fpVal'
      },
      sleep: {
        id: 'derived:com.google.sleep.segment:com.google.android.gms',
        field: 'intVal'
      }
    };

    console.log('🔍 Diagnosing sync for key data sources...\n');
    console.log('Time range: Last 30 days\n');
    console.log('═══════════════════════════════════════════════════════════════════════════\n');

    for (const [name, source] of Object.entries(dataSources)) {
      try {
        const url = `https://www.googleapis.com/fitness/v1/users/me/dataSources/${source.id}/datasets/${thirtyDaysAgo * 1000000}-${now * 1000000}`;
        
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 10000,
        });

        const points = response.data.point || [];
        console.log(`📊 ${name.toUpperCase()}:`);
        console.log(`   Total points: ${points.length}`);
        
        if (points.length > 0) {
          console.log(`   Latest value: ${points[points.length - 1].value[0][source.field]}`);
          console.log(`   Latest timestamp: ${new Date(parseInt(points[points.length - 1].endTimeNanos) / 1000000).toISOString()}`);
          console.log(`   Field used: ${source.field}`);
          
          // Show all points with dates
          console.log(`\n   All data points:`);
          points.forEach((point, idx) => {
            const date = new Date(parseInt(point.endTimeNanos) / 1000000);
            const value = point.value[0][source.field];
            console.log(`      ${idx + 1}. ${date.toISOString().split('T')[0]}: ${value}`);
          });
        } else {
          console.log(`   ⚠️  No data points found`);
        }
        console.log('');
      } catch (error) {
        console.log(`❌ ${name.toUpperCase()}: ${error.response?.status || error.message}\n`);
      }
    }

    console.log('═══════════════════════════════════════════════════════════════════════════');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

diagnoseSync();
