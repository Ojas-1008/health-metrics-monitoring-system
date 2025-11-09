import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

import User from '../src/models/User.js';

const testFullSync = async () => {
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
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const startTimeMs = startDate.getTime();

    console.log(`📅 Sync Window:`);
    console.log(`   From: ${startDate.toISOString()}`);
    console.log(`   To: ${new Date(now).toISOString()}`);
    console.log(`   Days: ${((now - startTimeMs) / (1000 * 60 * 60 * 24)).toFixed(1)}\n`);

    // Test all enabled data sources
    const dataSources = {
      steps: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
      calories: 'derived:com.google.calories.expended:com.google.android.gms:merge_calories_expended',
      activeMinutes: 'derived:com.google.active_minutes:com.google.android.gms:merge_active_minutes',
      heartPoints: 'derived:com.google.heart_minutes:com.google.android.gms:merge_heart_minutes',
      weight: 'derived:com.google.weight:com.google.android.gms:merge_weight',
      height: 'derived:com.google.height:com.google.android.gms:merge_height',
    };

    console.log('🔍 Fetching data from each source...\n');
    
    const allDatesSet = new Set();

    for (const [name, sourceId] of Object.entries(dataSources)) {
      const url = `https://www.googleapis.com/fitness/v1/users/me/dataSources/${sourceId}/datasets/${startTimeMs * 1000000}-${now * 1000000}`;
      
      try {
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 10000,
        });

        const points = response.data.point || [];
        console.log(`✅ ${name}: ${points.length} points`);
        
        // Extract unique dates from this data source
        points.forEach(point => {
          const endTimeMs = parseInt(point.endTimeNanos) / 1000000;
          const date = new Date(endTimeMs);
          date.setUTCHours(0, 0, 0, 0);
          const dayKey = date.toISOString().split("T")[0];
          allDatesSet.add(dayKey);
        });
        
      } catch (error) {
        console.log(`❌ ${name}: ${error.response?.status || error.message}`);
      }
    }

    console.log(`\n📊 Total unique dates found: ${allDatesSet.size}`);
    console.log(`📅 Date range: ${Array.from(allDatesSet).sort()[0]} to ${Array.from(allDatesSet).sort()[allDatesSet.size - 1]}`);
    console.log(`\nAll dates:`);
    Array.from(allDatesSet).sort().forEach(date => console.log(`   • ${date}`));

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

testFullSync();
