import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

import User from '../src/models/User.js';

const testAllDataSources = async () => {
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
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000); // 7 days for more data

    // Comprehensive list of Google Fit data sources
    const dataSources = [
      // Activity Tracking
      {
        name: 'Steps',
        id: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
        field: 'intVal'
      },
      {
        name: 'Distance',
        id: 'derived:com.google.distance.delta:com.google.android.gms',
        field: 'fpVal'
      },
      {
        name: 'Calories',
        id: 'derived:com.google.calories.expended:com.google.android.gms:merge_calories_expended',
        field: 'fpVal'
      },
      {
        name: 'Active Minutes',
        id: 'derived:com.google.active_minutes:com.google.android.gms:merge_active_minutes',
        field: 'intVal'
      },
      {
        name: 'Heart Points',
        id: 'derived:com.google.heart_minutes:com.google.android.gms:merge_heart_minutes',
        field: 'fpVal'
      },
      
      // Alternative Activity Sources
      {
        name: 'Activity Segments',
        id: 'derived:com.google.activity.segment:com.google.android.gms:merge_activity_segments',
        field: 'intVal'
      },
      
      // Body Metrics
      {
        name: 'Weight',
        id: 'derived:com.google.weight:com.google.android.gms:merge_weight',
        field: 'fpVal'
      },
      {
        name: 'Height',
        id: 'derived:com.google.height:com.google.android.gms:merge_height',
        field: 'fpVal'
      },
      
      // Sleep
      {
        name: 'Sleep Segments',
        id: 'derived:com.google.sleep.segment:com.google.android.gms',
        field: 'intVal'
      },
      
      // Health Vitals (may require wearable)
      {
        name: 'Heart Rate',
        id: 'derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm',
        field: 'fpVal'
      },
      {
        name: 'Blood Pressure',
        id: 'derived:com.google.blood_pressure:com.google.android.gms:merged',
        field: 'mapVal'
      },
      {
        name: 'Oxygen Saturation',
        id: 'derived:com.google.oxygen_saturation:com.google.android.gms:merged',
        field: 'fpVal'
      },
      {
        name: 'Body Temperature',
        id: 'derived:com.google.body.temperature:com.google.android.gms:merged',
        field: 'fpVal'
      },
      {
        name: 'Hydration',
        id: 'derived:com.google.hydration:com.google.android.gms:merged',
        field: 'fpVal'
      },
      
      // Alternative data sources (phone sensors)
      {
        name: 'Speed',
        id: 'derived:com.google.speed:com.google.android.gms',
        field: 'fpVal'
      },
      {
        name: 'Location Samples',
        id: 'derived:com.google.location.sample:com.google.android.gms',
        field: 'fpVal'
      },
    ];

    console.log('🔍 Testing Google Fit data sources...\n');
    console.log(`Time range: Last 7 days (${new Date(sevenDaysAgo).toISOString()} to ${new Date(now).toISOString()})\n`);
    console.log('═══════════════════════════════════════════════════════════════════════════\n');

    const workingDataSources = [];
    const emptyDataSources = [];
    const failedDataSources = [];

    for (const source of dataSources) {
      try {
        const url = `https://www.googleapis.com/fitness/v1/users/me/dataSources/${source.id}/datasets/${sevenDaysAgo * 1000000}-${now * 1000000}`;
        
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 10000,
        });

        const pointCount = response.data.point?.length || 0;
        
        if (pointCount > 0) {
          console.log(`✅ ${source.name}: ${pointCount} data points`);
          const sampleValue = response.data.point[0].value[0];
          const value = sampleValue[source.field] !== undefined ? sampleValue[source.field] : JSON.stringify(sampleValue);
          console.log(`   📊 Sample value: ${value}`);
          console.log(`   📝 Data source ID: ${source.id}\n`);
          workingDataSources.push({
            name: source.name,
            id: source.id,
            field: source.field,
            points: pointCount
          });
        } else {
          console.log(`⚠️  ${source.name}: 0 data points (no data available)`);
          console.log(`   📝 Data source ID: ${source.id}\n`);
          emptyDataSources.push(source.name);
        }
      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`❌ ${source.name}: Data source not found (404)`);
          console.log(`   📝 Data source ID: ${source.id}\n`);
          failedDataSources.push({ name: source.name, error: '404 Not Found' });
        } else if (error.response?.status === 403) {
          console.log(`🔒 ${source.name}: Permission denied (403 - scope not granted)`);
          console.log(`   📝 Data source ID: ${source.id}\n`);
          failedDataSources.push({ name: source.name, error: '403 Forbidden' });
        } else {
          console.log(`❌ ${source.name}: Error - ${error.message}`);
          console.log(`   📝 Data source ID: ${source.id}\n`);
          failedDataSources.push({ name: source.name, error: error.message });
        }
      }
    }

    console.log('═══════════════════════════════════════════════════════════════════════════');
    console.log('\n📊 SUMMARY:\n');
    console.log(`✅ Working data sources: ${workingDataSources.length}`);
    console.log(`⚠️  Empty data sources: ${emptyDataSources.length}`);
    console.log(`❌ Failed/Not Available: ${failedDataSources.length}`);
    
    if (workingDataSources.length > 0) {
      console.log('\n✅ AVAILABLE DATA SOURCES:');
      workingDataSources.forEach(ds => {
        console.log(`   • ${ds.name}: ${ds.points} points (field: ${ds.field})`);
      });
    }

    if (emptyDataSources.length > 0) {
      console.log('\n⚠️  EMPTY (No recent data):');
      emptyDataSources.forEach(name => console.log(`   • ${name}`));
    }

    if (failedDataSources.length > 0) {
      console.log('\n❌ UNAVAILABLE (Error or not supported):');
      failedDataSources.forEach(ds => console.log(`   • ${ds.name}: ${ds.error}`));
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

testAllDataSources();
