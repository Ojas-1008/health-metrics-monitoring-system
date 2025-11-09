import connectDB from '../src/config/database.js';
import HealthMetric from '../src/models/HealthMetric.js';

(async () => {
  await connectDB();
  
  // Get today's date
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  
  console.log('\n📊 Checking latest synced data...\n');
  
  // Find the record for today or most recent
  const record = await HealthMetric.findOne({ date: { $gte: today } })
    .sort({ date: -1 })
    .lean();
  
  if (!record) {
    console.log('❌ No records found for today');
    process.exit(0);
  }
  
  const dateStr = record.date.toISOString().split('T')[0];
  console.log(`📅 Date: ${dateStr}`);
  console.log(`🔄 Source: ${record.source}`);
  console.log(`⏱️  Synced: ${new Date(record.syncedAt).toLocaleString()}\n`);
  
  const m = record.metrics;
  
  console.log('📊 STANDARD METRICS:');
  console.log(`  Steps:          ${m.steps}`);
  console.log(`  Distance:       ${m.distance} km`);
  console.log(`  Calories:       ${m.calories}`);
  console.log(`  Active Min:     ${m.activeMinutes}`);
  console.log(`  Weight:         ${m.weight} kg`);
  console.log(`  Sleep:          ${m.sleepHours} hours\n`);
  
  console.log('⭐ WEARABLE METRICS:');
  console.log(`  Height:         ${m.height !== null && m.height !== undefined ? m.height + ' cm' : '❌ NULL'}`);
  
  if (m.bloodPressure) {
    const hasBP = m.bloodPressure.systolic !== null || m.bloodPressure.diastolic !== null;
    console.log(`  Blood Pressure: ${hasBP ? m.bloodPressure.systolic + '/' + m.bloodPressure.diastolic + ' mmHg' : '❌ NULL'}`);
  } else {
    console.log(`  Blood Pressure: ❌ NOT IN RECORD`);
  }
  
  console.log(`  Heart Rate:     ${m.heartRate !== null && m.heartRate !== undefined ? m.heartRate + ' bpm' : '❌ NULL'}`);
  console.log(`  SpO2:           ${m.oxygenSaturation !== null && m.oxygenSaturation !== undefined ? m.oxygenSaturation + '%' : '❌ NULL'}`);
  console.log(`  Temperature:    ${m.bodyTemperature !== null && m.bodyTemperature !== undefined ? m.bodyTemperature + '°C' : '❌ NULL'}`);
  console.log(`  Hydration:      ${m.hydration !== null && m.hydration !== undefined ? m.hydration + ' L' : '❌ NULL'}\n`);
  
  process.exit(0);
})().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
