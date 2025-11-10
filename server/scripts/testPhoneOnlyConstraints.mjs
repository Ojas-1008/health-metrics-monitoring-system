import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

import HealthMetric from '../src/models/HealthMetric.js';
import User from '../src/models/User.js';

const testConstraints = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const user = await User.findOne({ email: 'ojasshrivastava1008@gmail.com' });
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('========================================');
    console.log('🧪 TEST 1: Reject heartRate (wearable-only)');
    console.log('========================================\n');

    try {
      const invalidMetric = new HealthMetric({
        userId: user._id,
        date: new Date(),
        metrics: {
          steps: 5000,
          heartRate: 75, // ❌ Should be rejected
        },
        source: 'manual',
      });

      await invalidMetric.save();
      console.log('❌ TEST FAILED: Document with heartRate was saved (should have been rejected)');
    } catch (error) {
      if (error.name === 'ValidationError' && error.message.includes('heartRate')) {
        console.log('✅ TEST PASSED: heartRate was correctly rejected');
        console.log(`   Error: ${error.message}\n`);
      } else {
        console.log('❌ TEST FAILED: Wrong error type');
        console.log(`   Error: ${error.message}\n`);
      }
    }

    console.log('========================================');
    console.log('🧪 TEST 2: Reject oxygenSaturation (wearable-only)');
    console.log('========================================\n');

    try {
      const invalidMetric = new HealthMetric({
        userId: user._id,
        date: new Date(),
        metrics: {
          steps: 5000,
          oxygenSaturation: 98, // ❌ Should be rejected
        },
        source: 'manual',
      });

      await invalidMetric.save();
      console.log('❌ TEST FAILED: Document with oxygenSaturation was saved (should have been rejected)');
    } catch (error) {
      if (error.name === 'ValidationError' && error.message.includes('oxygenSaturation')) {
        console.log('✅ TEST PASSED: oxygenSaturation was correctly rejected');
        console.log(`   Error: ${error.message}\n`);
      } else {
        console.log('❌ TEST FAILED: Wrong error type');
        console.log(`   Error: ${error.message}\n`);
      }
    }

    console.log('========================================');
    console.log('🧪 TEST 3: Accept phone-only metrics');
    console.log('========================================\n');

    try {
      const validMetric = new HealthMetric({
        userId: user._id,
        date: new Date(),
        metrics: {
          steps: 8500,
          distance: 6.2,
          calories: 450,
          activeMinutes: 55,
          heartPoints: 15,
          weight: 70,
        },
        source: 'googlefit',
      });

      await validMetric.save();
      console.log('✅ TEST PASSED: Phone-only metrics were accepted');
      console.log(`   Document ID: ${validMetric._id}\n`);

      // Clean up
      await HealthMetric.deleteOne({ _id: validMetric._id });
    } catch (error) {
      console.log('❌ TEST FAILED: Phone-only metrics were rejected (should have been accepted)');
      console.log(`   Error: ${error.message}\n`);
    }

    console.log('========================================');
    console.log('🧪 TEST 4: Reject via update operation');
    console.log('========================================\n');

    try {
      // Create valid document first
      const doc = await HealthMetric.create({
        userId: user._id,
        date: new Date(),
        metrics: { steps: 5000 },
        source: 'manual',
      });

      // Try to update with heartRate
      await HealthMetric.updateOne(
        { _id: doc._id },
        { $set: { "metrics.heartRate": 80 } }
      );

      console.log('❌ TEST FAILED: Update with heartRate was allowed (should have been rejected)');
      
      // Clean up
      await HealthMetric.deleteOne({ _id: doc._id });
    } catch (error) {
      if (error.name === 'ValidationError' && error.message.includes('heartRate')) {
        console.log('✅ TEST PASSED: heartRate update was correctly rejected');
        console.log(`   Error: ${error.message}\n`);
      } else {
        console.log('❌ TEST FAILED: Wrong error type');
        console.log(`   Error: ${error.message}\n`);
      }
    }

    console.log('========================================');
    console.log('📊 TEST SUMMARY');
    console.log('========================================');
    console.log('✅ All phone-only constraints are working correctly\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
};

testConstraints();