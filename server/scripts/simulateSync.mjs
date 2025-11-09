import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

import User from '../src/models/User.js';

// Exact copy of aggregateByDay from worker
const aggregateByDay = (dataPoints, field, aggregation = "sum") => {
  const dailyData = {};

  dataPoints.forEach((point) => {
    const endTimeMs = parseInt(point.endTimeNanos) / 1000000;
    const date = new Date(endTimeMs);
    date.setUTCHours(0, 0, 0, 0);
    const dayKey = date.toISOString().split("T")[0];

    let value;
    if (field === "mapVal") {
      const mapData = point.value && point.value[0] ? point.value[0][field] : null;
      if (mapData) {
        value = {
          systolic: mapData.find(item => item.key === "systolic")?.value?.fpVal || null,
          diastolic: mapData.find(item => item.key === "diastolic")?.value?.fpVal || null,
        };
      } else {
        value = { systolic: null, diastolic: null };
      }
    } else {
      value = point.value && point.value[0] ? point.value[0][field] : 0;
    }

    if (aggregation === "sum") {
      if (typeof value === "object") {
        if (!dailyData[dayKey]) {
          dailyData[dayKey] = { systolic: 0, diastolic: 0 };
        }
        dailyData[dayKey].systolic += value.systolic || 0;
        dailyData[dayKey].diastolic += value.diastolic || 0;
      } else {
        dailyData[dayKey] = (dailyData[dayKey] || 0) + value;
      }
    } else if (aggregation === "last") {
      dailyData[dayKey] = value;
    } else if (aggregation === "average") {
      if (typeof value === "object") {
        if (!dailyData[dayKey]) {
          dailyData[dayKey] = { systolic: { sum: 0, count: 0 }, diastolic: { sum: 0, count: 0 } };
        }
        if (value.systolic !== null) {
          dailyData[dayKey].systolic.sum += value.systolic;
          dailyData[dayKey].systolic.count += 1;
        }
        if (value.diastolic !== null) {
          dailyData[dayKey].diastolic.sum += value.diastolic;
          dailyData[dayKey].diastolic.count += 1;
        }
      } else {
        if (!dailyData[dayKey]) {
          dailyData[dayKey] = { sum: 0, count: 0 };
        }
        dailyData[dayKey].sum += value;
        dailyData[dayKey].count += 1;
      }
    }
  });

  if (aggregation === "average") {
    Object.keys(dailyData).forEach((key) => {
      if (typeof dailyData[key] === "object" && dailyData[key].systolic) {
        dailyData[key].systolic = dailyData[key].systolic.count > 0
          ? Math.round(dailyData[key].systolic.sum / dailyData[key].systolic.count)
          : null;
        dailyData[key].diastolic = dailyData[key].diastolic.count > 0
          ? Math.round(dailyData[key].diastolic.sum / dailyData[key].diastolic.count)
          : null;
      } else if (typeof dailyData[key] === "object" && dailyData[key].sum !== undefined) {
        dailyData[key] = dailyData[key].count > 0
          ? Math.round(dailyData[key].sum / dailyData[key].count)
          : 0;
      }
    });
  }

  return dailyData;
};

const simulateSync = async () => {
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

    console.log('🔄 Simulating sync worker aggregation...\n');

    // Fetch all data
    const dataSources = {
      weight: {
        id: 'derived:com.google.weight:com.google.android.gms:merge_weight',
        field: 'fpVal',
        aggregation: 'last'
      },
      height: {
        id: 'derived:com.google.height:com.google.android.gms:merge_height',
        field: 'fpVal',
        aggregation: 'last'
      },
    };

    const fetchedData = {};

    for (const [name, source] of Object.entries(dataSources)) {
      const url = `https://www.googleapis.com/fitness/v1/users/me/dataSources/${source.id}/datasets/${startTimeMs * 1000000}-${now * 1000000}`;
      
      try {
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 10000,
        });

        const points = response.data.point || [];
        console.log(`📥 Fetched ${name}: ${points.length} points`);
        
        fetchedData[name] = aggregateByDay(points, source.field, source.aggregation);
        console.log(`📊 Aggregated ${name}:`, fetchedData[name]);
        
      } catch (error) {
        console.log(`❌ ${name}: ${error.response?.status || error.message}`);
        fetchedData[name] = {};
      }
    }

    // Now simulate metrics building
    console.log('\n🏗️  Building metrics for each date...\n');
    
    const allDates = new Set();
    Object.values(fetchedData).forEach((dailyData) => {
      Object.keys(dailyData).forEach((date) => allDates.add(date));
    });

    for (const dateStr of allDates) {
      console.log(`\n📅 Date: ${dateStr}`);
      const dayDate = new Date(dateStr);
      console.log(`   Day Date object: ${dayDate.toISOString()}`);
      
      const metrics = {
        weight: fetchedData.weight?.[dateStr] || null,
        height: fetchedData.height?.[dateStr]
          ? Math.round(fetchedData.height[dateStr] * 100)
          : null,
      };
      
      console.log(`   Metrics:`, metrics);
      console.log(`   Weight lookup: fetchedData.weight["${dateStr}"] = ${fetchedData.weight?.[dateStr]}`);
      console.log(`   Height lookup: fetchedData.height["${dateStr}"] = ${fetchedData.height?.[dateStr]}`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

simulateSync();
