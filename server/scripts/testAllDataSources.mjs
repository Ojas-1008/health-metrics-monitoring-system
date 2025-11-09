import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

import User from '../src/models/User.js';

const ALL_DATA_SOURCES = {
  steps: "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps",
  distance: "derived:com.google.distance.delta:com.google.android.gms",
  calories: "derived:com.google.calories.expended:com.google.android.gms:merge_calories_expended",
  activeMinutes: "derived:com.google.active_minutes:com.google.android.gms:merge_active_minutes",
  heartPoints: "derived:com.google.heart_minutes:com.google.android.gms:merge_heart_minutes",
  moveMinutes: "derived:com.google.active_minutes:com.google.android.gms:from_activities",
  weight: "derived:com.google.weight:com.google.android.gms:merge_weight",
  sleep: "derived:com.google.sleep.segment:com.google.android.gms",
  height: "derived:com.google.height:com.google.android.gms:merge_height",
  bloodPressure: "derived:com.google.blood_pressure:com.google.android.gms:merged",
  heartRate: "derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm",
  oxygenSaturation: "derived:com.google.oxygen_saturation:com.google.android.gms:merged",
  bodyTemperature: "derived:com.google.body.temperature:com.google.android.gms:merged",
  hydration: "derived:com.google.hydration:com.google.android.gms:merged",
};

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
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);

    console.log('🔍 Testing ALL Google Fit data sources...\n');
    console.log('Time range: Last 7 days\n');
    console.log('========================================\n');

    const results = {
      available: [],
      unavailable: [],
      errors: [],
    };

    for (const [name, dataSourceId] of Object.entries(ALL_DATA_SOURCES)) {
      try {
        const url = `https://www.googleapis.com/fitness/v1/users/me/dataSources/${dataSourceId}/datasets/${sevenDaysAgo * 1000000}-${now * 1000000}`;
        
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 10000,
        });

        const pointCount = response.data.point?.length || 0;
        
        if (pointCount > 0) {
          results.available.push({
            name,
            count: pointCount,
            sample: response.data.point[0].value,
          });
          console.log(`✅ ${name.padEnd(20)}: ${pointCount} points`);
        } else {
          results.unavailable.push(name);
          console.log(`⚠️  ${name.padEnd(20)}: 0 points (no data)`);
        }
      } catch (error) {
        if (error.response?.status === 404) {
          results.errors.push({ name, error: 'Not found (404)' });
          console.log(`❌ ${name.padEnd(20)}: NOT FOUND (404)`);
        } else {
          results.errors.push({ name, error: error.message });
          console.log(`❌ ${name.padEnd(20)}: ${error.message}`);
        }
      }
    }

    console.log('\n========================================');
    console.log('📊 SUMMARY');
    console.log('========================================');
    console.log(`✅ Available: ${results.available.length}`);
    console.log(`⚠️  No Data: ${results.unavailable.length}`);
    console.log(`❌ Errors: ${results.errors.length}`);
    console.log('========================================\n');

    if (results.available.length > 0) {
      console.log('✅ Available Data Sources:');
      results.available.forEach(item => {
        console.log(`   - ${item.name} (${item.count} points)`);
        console.log(`     Sample: ${JSON.stringify(item.sample)}\n`);
      });
    }

    if (results.unavailable.length > 0) {
      console.log('\n⚠️  No Data (but source exists):');
      results.unavailable.forEach(name => {
        console.log(`   - ${name}`);
      });
    }

    if (results.errors.length > 0) {
      console.log('\n❌ Errors:');
      results.errors.forEach(item => {
        console.log(`   - ${item.name}: ${item.error}`);
      });
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal Error:', error.message);
    process.exit(1);
  }
};

testAllDataSources();
