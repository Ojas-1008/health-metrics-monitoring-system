/**
 * ============================================
 * VERIFY METRICS IN DATABASE
 * ============================================
 * 
 * Purpose: Script to verify health metrics were saved correctly
 * 
 * Usage:
 *   node scripts/verify-metrics.js [email]
 * 
 * Examples:
 *   node scripts/verify-metrics.js testuser@example.com
 *   node scripts/verify-metrics.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import HealthMetric from '../src/models/HealthMetric.js';

// Load environment variables
dotenv.config();

const verifyMetrics = async (userEmail) => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find user
    let user;
    if (userEmail) {
      user = await User.findOne({ email: userEmail }).select('-password');
      if (!user) {
        console.log(`❌ User not found: ${userEmail}`);
        process.exit(1);
      }
    } else {
      // Get the most recently created user
      user = await User.findOne().sort({ createdAt: -1 }).select('-password');
      if (!user) {
        console.log('❌ No users found in database');
        process.exit(1);
      }
    }

    console.log('👤 User Found:');
    console.log('━'.repeat(60));
    console.log(`   Name:  ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   ID:    ${user._id}`);
    console.log('━'.repeat(60));
    console.log('');

    // Find all metrics for this user
    const metrics = await HealthMetric.find({ userId: user._id })
      .sort({ date: -1 })
      .limit(10);

    if (metrics.length === 0) {
      console.log('📊 No metrics found for this user\n');
      console.log('💡 Try adding metrics through the frontend form\n');
    } else {
      console.log(`📊 Found ${metrics.length} Metric Entries (showing last 10):\n`);

      metrics.forEach((metric, index) => {
        console.log(`Entry ${index + 1}:`);
        console.log('━'.repeat(60));
        console.log(`   Date:           ${metric.date.toISOString().split('T')[0]}`);
        console.log(`   Source:         ${metric.source}`);
        console.log('');
        console.log('   Metrics:');
        console.log(`     Steps:        ${metric.metrics.steps || 0}`);
        console.log(`     Calories:     ${metric.metrics.calories || 0}`);
        console.log(`     Distance:     ${metric.metrics.distance || 0} km`);
        console.log(`     Active Mins:  ${metric.metrics.activeMinutes || 0}`);
        console.log(`     Weight:       ${metric.metrics.weight || 'N/A'} kg`);
        console.log(`     Sleep:        ${metric.metrics.sleepHours || 'N/A'} hours`);
        console.log(`     Heart Rate:   ${metric.metrics.heartRate || 'N/A'} bpm`);
        console.log('');
        console.log(`   Created:        ${metric.createdAt.toLocaleString()}`);
        console.log(`   Updated:        ${metric.updatedAt.toLocaleString()}`);
        console.log('━'.repeat(60));
        console.log('');
      });

      // Show today's metrics specifically
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayMetric = await HealthMetric.findOne({
        userId: user._id,
        date: today
      });

      if (todayMetric) {
        console.log('📅 TODAY\'S METRICS:');
        console.log('━'.repeat(60));
        console.log(`   Steps:        ${todayMetric.metrics.steps || 0}`);
        console.log(`   Calories:     ${todayMetric.metrics.calories || 0}`);
        console.log(`   Distance:     ${todayMetric.metrics.distance || 0} km`);
        console.log(`   Active Mins:  ${todayMetric.metrics.activeMinutes || 0}`);
        console.log(`   Weight:       ${todayMetric.metrics.weight || 'N/A'} kg`);
        console.log(`   Sleep:        ${todayMetric.metrics.sleepHours || 'N/A'} hours`);
        console.log(`   Heart Rate:   ${todayMetric.metrics.heartRate || 'N/A'} bpm`);
        console.log('━'.repeat(60));
        console.log('');
      } else {
        console.log('📅 No metrics found for today\n');
      }
    }

    console.log('✅ Verification complete\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Get email from command line args
const userEmail = process.argv[2];

verifyMetrics(userEmail);
