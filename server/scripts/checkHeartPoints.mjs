import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const checkHeartPoints = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const result = await mongoose.connection.db.collection('healthmetrics').find(
      { userId: new mongoose.Types.ObjectId('690b9449c3325e85f9ab7a0e') },
      { date: 1, 'metrics.heartPoints': 1 }
    ).sort({ date: -1 }).limit(1).toArray();

    if (result.length > 0) {
      console.log('📊 Latest heart points data:');
      console.log(JSON.stringify(result[0], null, 2));
    } else {
      console.log('❌ No heart points data found');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkHeartPoints();