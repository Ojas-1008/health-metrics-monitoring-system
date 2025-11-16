import mongoose from 'mongoose';
import Analytics from './src/models/Analytics.js';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;
console.log('Connecting to MongoDB...');

await mongoose.connect(uri);

console.log('Finding duplicates...');

// Find duplicates by metricType and timeRange, keep the most recent one
const duplicates = await Analytics.aggregate([
  {
    $group: {
      _id: { metricType: '$metricType', timeRange: '$timeRange' },
      docs: { $push: { _id: '$_id', createdAt: '$createdAt' } },
      count: { $sum: 1 }
    }
  },
  {
    $match: { count: { $gt: 1 } }
  }
]);

console.log('Duplicates found:', duplicates.length);

for (const dup of duplicates) {
  const { metricType, timeRange } = dup._id;
  const docs = dup.docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Keep the most recent, delete the rest
  const toDelete = docs.slice(1);

  console.log(`Keeping latest for ${metricType} ${timeRange}, deleting ${toDelete.length} older duplicates`);

  for (const doc of toDelete) {
    await Analytics.findByIdAndDelete(doc._id);
    console.log(`Deleted: ${doc._id}`);
  }
}

console.log('Cleanup complete');
process.exit(0);