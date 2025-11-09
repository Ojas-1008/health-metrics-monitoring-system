import connectDB from '../src/config/database.js';
import HealthMetric from '../src/models/HealthMetric.js';

(async () => {
  await connectDB();
  
  console.log('📊 Last 3 Health Metrics Records:\n');
  
  const records = await HealthMetric.find()
    .sort({ date: -1 })
    .limit(3)
    .lean();
  
  records.forEach((record, index) => {
    const dateStr = record.date.toISOString().split('T')[0];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Record ${index + 1}: ${dateStr}`);
    console.log(`${'='.repeat(60)}`);
    
    const metrics = record.metrics;
    console.log(`Steps:           ${metrics.steps}`);
    console.log(`Distance:        ${metrics.distance} m`);
    console.log(`Calories:        ${metrics.calories}`);
    console.log(`Active Minutes:  ${metrics.activeMinutes}`);
    console.log(`Weight:          ${metrics.weight} kg`);
    console.log(`Sleep Hours:     ${metrics.sleepHours}`);
    
    console.log(`\n⭐ WEARABLE DATA:`);
    console.log(`Height:          ${metrics.height || 'N/A'} cm`);
    if (metrics.bloodPressure && (metrics.bloodPressure.systolic || metrics.bloodPressure.diastolic)) {
      console.log(`Blood Pressure:  ${metrics.bloodPressure.systolic}/${metrics.bloodPressure.diastolic} mmHg`);
    } else {
      console.log(`Blood Pressure:  N/A`);
    }
    console.log(`Heart Rate:      ${metrics.heartRate || 'N/A'} bpm`);
    console.log(`SpO2:            ${metrics.oxygenSaturation || 'N/A'}%`);
    console.log(`Temperature:     ${metrics.bodyTemperature || 'N/A'}°C`);
    console.log(`Hydration:       ${metrics.hydration || 'N/A'} L`);
    
    console.log(`\nSource: ${record.source} | Synced: ${new Date(record.syncedAt).toLocaleString()}`);
  });
  
  console.log('\n' + '='.repeat(60) + '\n');
  process.exit(0);
})().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
