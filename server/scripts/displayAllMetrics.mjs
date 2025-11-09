import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

import HealthMetric from '../src/models/HealthMetric.js';

const displayAllMetrics = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const metrics = await HealthMetric.find({
      userId: new mongoose.Types.ObjectId('690b9449c3325e85f9ab7a0e')
    }).sort({ date: -1 }).limit(10);

    console.log('═══════════════════════════════════════════════════════════════════════════');
    console.log('📊 ALL HEALTH METRICS BEING FETCHED FROM GOOGLE FIT');
    console.log('═══════════════════════════════════════════════════════════════════════════\n');

    if (metrics.length === 0) {
      console.log('❌ No metrics found\n');
      await mongoose.disconnect();
      process.exit(0);
    }

    metrics.forEach((metric, idx) => {
      const dateStr = new Date(metric.date).toISOString().split('T')[0];
      console.log(`\n📅 ${dateStr} (${metric.source})`);
      console.log('─'.repeat(75));
      
      const m = metric.metrics;
      
      // Activity Metrics
      console.log('\n🏃 ACTIVITY METRICS:');
      if (m.steps > 0) console.log(`   Steps:          ${m.steps.toLocaleString()} steps`);
      if (m.distance > 0) console.log(`   Distance:       ${m.distance.toFixed(2)} km`);
      if (m.calories > 0) console.log(`   Calories:       ${Math.round(m.calories).toLocaleString()} kcal`);
      if (m.activeMinutes > 0) console.log(`   Active Minutes: ${m.activeMinutes} minutes`);
      if (m.heartPoints > 0) console.log(`   Heart Points:   ${m.heartPoints} points ⭐`);
      if (m.moveMinutes > 0) console.log(`   Move Minutes:   ${m.moveMinutes} minutes`);
      
      // Body Metrics
      const hasBodyMetrics = m.weight || m.height;
      if (hasBodyMetrics) {
        console.log('\n📏 BODY METRICS:');
        if (m.weight) console.log(`   Weight:         ${m.weight} kg`);
        if (m.height) console.log(`   Height:         ${m.height} cm`);
      }
      
      // Sleep
      if (m.sleepHours) {
        console.log('\n😴 SLEEP:');
        console.log(`   Sleep Duration: ${m.sleepHours} hours`);
      }
      
      // Vitals
      const hasVitals = m.heartRate || m.bloodPressure?.systolic || m.oxygenSaturation || m.bodyTemperature;
      if (hasVitals) {
        console.log('\n❤️ VITALS:');
        if (m.heartRate) console.log(`   Heart Rate:     ${m.heartRate} bpm`);
        if (m.bloodPressure?.systolic || m.bloodPressure?.diastolic) {
          console.log(`   Blood Pressure: ${m.bloodPressure.systolic || '?'}/${m.bloodPressure.diastolic || '?'} mmHg`);
        }
        if (m.oxygenSaturation) console.log(`   SpO2:           ${m.oxygenSaturation}%`);
        if (m.bodyTemperature) console.log(`   Temperature:    ${m.bodyTemperature}°C`);
      }
      
      // Hydration
      if (m.hydration) {
        console.log('\n💧 HYDRATION:');
        console.log(`   Water Intake:   ${m.hydration} liters`);
      }
      
      // Summary of what's available
      const nonNullMetrics = [];
      if (m.steps > 0) nonNullMetrics.push('Steps');
      if (m.distance > 0) nonNullMetrics.push('Distance');
      if (m.calories > 0) nonNullMetrics.push('Calories');
      if (m.activeMinutes > 0) nonNullMetrics.push('Active Minutes');
      if (m.heartPoints > 0) nonNullMetrics.push('Heart Points');
      if (m.weight) nonNullMetrics.push('Weight');
      if (m.height) nonNullMetrics.push('Height');
      if (m.sleepHours) nonNullMetrics.push('Sleep');
      
      console.log(`\n✅ Available metrics (${nonNullMetrics.length}): ${nonNullMetrics.join(', ')}`);
    });

    console.log('\n═══════════════════════════════════════════════════════════════════════════');
    console.log(`\n📊 SUMMARY: ${metrics.length} days of health data synced successfully!`);
    console.log('═══════════════════════════════════════════════════════════════════════════\n');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

displayAllMetrics();
