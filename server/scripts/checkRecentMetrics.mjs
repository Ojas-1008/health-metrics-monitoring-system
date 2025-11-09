import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const checkRecentMetrics = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const results = await mongoose.connection.db.collection('healthmetrics').find(
      { userId: new mongoose.Types.ObjectId('690b9449c3325e85f9ab7a0e') }
    ).sort({ date: -1 }).limit(5).toArray();

    if (results.length > 0) {
      console.log(`📊 Found ${results.length} recent metrics:`);
      results.forEach((doc, index) => {
        console.log(`\n--- Document ${index + 1} ---`);
        console.log(`Date: ${doc.date}`);
        console.log(`Metrics:`, JSON.stringify(doc.metrics, null, 2));
      });
    } else {
      console.log('❌ No metrics found for this user');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkRecentMetrics();