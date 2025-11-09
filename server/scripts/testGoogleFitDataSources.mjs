import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

import User from '../src/models/User.js';

const testDataSources = async () => {
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
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    const dataSources = [
      {
        name: 'Steps',
        id: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps'
      },
      {
        name: 'Distance',
        id: 'derived:com.google.distance.delta:com.google.android.gms'
      },
      {
        name: 'Heart Points (v1)',
        id: 'derived:com.google.heart_minutes:com.google.android.gms:merge_heart_minutes'
      },
      {
        name: 'Heart Points (v2)',
        id: 'derived:com.google.heart_minutes:com.google.android.gms'
      },
      {
        name: 'Move Minutes',
        id: 'derived:com.google.active_minutes:com.google.android.gms:from_activities'
      },
      {
        name: 'Sleep Segments',
        id: 'derived:com.google.sleep.segment:com.google.android.gms'
      },
    ];

    console.log('🔍 Testing Google Fit data sources...\n');
    console.log('Time range: Last 24 hours\n');

    for (const source of dataSources) {
      try {
        const url = `https://www.googleapis.com/fitness/v1/users/me/dataSources/${source.id}/datasets/${oneDayAgo * 1000000}-${now * 1000000}`;

        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 10000,
        });

        const pointCount = response.data.point?.length || 0;

        if (pointCount > 0) {
          console.log(`✅ ${source.name}: ${pointCount} data points`);
          console.log(`   Sample: ${JSON.stringify(response.data.point[0].value)}\n`);
        } else {
          console.log(`⚠️  ${source.name}: 0 data points (no data available)\n`);
        }
      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`❌ ${source.name}: Data source not found (404)\n`);
        } else {
          console.log(`❌ ${source.name}: Error - ${error.message}\n`);
        }
      }
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

testDataSources();