import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env') });

async function verifyDeletion() {
  try {
    console.log('🚀 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const count = await mongoose.connection.db.collection('healthmetrics').countDocuments();
    console.log(`📊 Total health metrics in database: ${count}`);

    if (count === 0) {
      console.log('✅ Verification successful: All health metrics have been deleted');
    } else {
      console.log(`⚠️  Warning: ${count} metrics still exist in database`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

verifyDeletion();
