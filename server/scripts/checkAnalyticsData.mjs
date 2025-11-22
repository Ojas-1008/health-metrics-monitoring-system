import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const checkAnalyticsData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const count = await mongoose.connection.db.collection('analytics').countDocuments();
    console.log(`📊 Total Analytics Documents: ${count}`);

    if (count > 0) {
      const results = await mongoose.connection.db.collection('analytics').find()
        .sort({ calculatedAt: -1 })
        .limit(5)
        .toArray();

      console.log(`\n📊 Latest 5 Analytics Documents:`);
      results.forEach((doc, index) => {
        console.log(`\n--- Document ${index + 1} ---`);
        console.log(JSON.stringify(doc, null, 2));
      });
    } else {
      console.log('❌ No analytics data found in the database.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected');
  }
};

checkAnalyticsData();
