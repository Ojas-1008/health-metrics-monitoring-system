import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

async function deleteAllMetrics() {
  try {
    // Connect to MongoDB
    console.log('🚀 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Count existing metrics
    const count = await mongoose.connection.db.collection('healthmetrics').countDocuments();
    console.log(`📊 Found ${count} health metrics in database`);

    if (count === 0) {
      console.log('✅ No metrics to delete');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Delete all metrics
    console.log('🗑️  Deleting all health metrics...');
    const result = await mongoose.connection.db.collection('healthmetrics').deleteMany({});
    console.log(`✅ Successfully deleted ${result.deletedCount} health metrics from database`);

    // Verify deletion
    const remainingCount = await mongoose.connection.db.collection('healthmetrics').countDocuments();
    console.log(`📊 Remaining metrics: ${remainingCount}`);

    await mongoose.disconnect();
    console.log('✅ Database cleanup complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

deleteAllMetrics();
