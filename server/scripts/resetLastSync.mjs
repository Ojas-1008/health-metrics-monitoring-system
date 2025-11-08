/**
 * Reset lastSyncAt for a specific user (for testing purposes)
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import User model
import User from '../src/models/User.js';

const resetLastSync = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const email = 'ojasshrivastava1008@gmail.com';
    
    console.log(`🔍 Finding user: ${email}`);
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log(`📋 Current lastSyncAt: ${user.lastSyncAt}`);
    
    // Reset lastSyncAt to null
    await User.findByIdAndUpdate(user._id, { $set: { lastSyncAt: null } });
    
    console.log('✅ lastSyncAt reset to null');
    console.log('\n🚀 Next sync will fetch 30 days of data!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

resetLastSync();
