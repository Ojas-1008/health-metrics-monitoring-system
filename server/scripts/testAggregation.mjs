import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

import User from '../src/models/User.js';

// Copy of aggregateByDay function from worker
const aggregateByDay = (dataPoints, field, aggregation = "sum") => {
  const dailyData = {};

  dataPoints.forEach((point) => {
    // Extract timestamp and normalize to midnight UTC
    const endTimeMs = parseInt(point.endTimeNanos) / 1000000;
    const date = new Date(endTimeMs);
    console.log(`   Raw timestamp: ${date.toISOString()}`);
    
    date.setUTCHours(0, 0, 0, 0);
    const dayKey = date.toISOString().split("T")[0]; // "YYYY-MM-DD"
    console.log(`   Day key: ${dayKey}`);

    let value = point.value && point.value[0] ? point.value[0][field] : 0;
    console.log(`   Value: ${value}`);

    if (aggregation === "last") {
      dailyData[dayKey] = value;
    }
  });

  return dailyData;
};

const testAggregation = async () => {
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

    console.log('🔍 Testing aggregation for weight data...\n');
    
    const url = `https://www.googleapis.com/fitness/v1/users/me/dataSources/derived:com.google.weight:com.google.android.gms:merge_weight/datasets/${thirtyDaysAgo * 1000000}-${now * 1000000}`;
    
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 10000,
    });

    const points = response.data.point || [];
    console.log(`📊 Total weight points: ${points.length}\n`);
    
    console.log('Aggregating...\n');
    const aggregated = aggregateByDay(points, 'fpVal', 'last');
    
    console.log('\n📊 Aggregated data:');
    console.log(JSON.stringify(aggregated, null, 2));
    
    console.log('\n🔍 Now testing with height...\n');
    
    const heightUrl = `https://www.googleapis.com/fitness/v1/users/me/dataSources/derived:com.google.height:com.google.android.gms:merge_height/datasets/${thirtyDaysAgo * 1000000}-${now * 1000000}`;
    
    const heightResponse = await axios.get(heightUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 10000,
    });

    const heightPoints = heightResponse.data.point || [];
    console.log(`📊 Total height points: ${heightPoints.length}\n`);
    
    console.log('Aggregating...\n');
    const heightAggregated = aggregateByDay(heightPoints, 'fpVal', 'last');
    
    console.log('\n📊 Height aggregated data:');
    console.log(JSON.stringify(heightAggregated, null, 2));

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

testAggregation();
