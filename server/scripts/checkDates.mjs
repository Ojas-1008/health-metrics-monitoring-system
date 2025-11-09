import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

import HealthMetric from '../src/models/HealthMetric.js';

const checkDates = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const metrics = await HealthMetric.find({
      userId: new mongoose.Types.ObjectId('690b9449c3325e85f9ab7a0e')
    }).sort({ date: -1 }).limit(10);

    console.log(`📊 Found ${metrics.length} metrics:\n`);
    
    metrics.forEach((metric, idx) => {
      const dateObj = new Date(metric.date);
      console.log(`${idx + 1}. Date field: ${metric.date}`);
      console.log(`   ISO String: ${dateObj.toISOString()}`);
      console.log(`   Date only: ${dateObj.toISOString().split('T')[0]}`);
      console.log(`   Weight: ${metric.metrics.weight}`);
      console.log(`   Height: ${metric.metrics.height}`);
      console.log(`   Steps: ${metric.metrics.steps}`);
      console.log('');
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkDates();
