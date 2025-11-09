import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

import User from '../src/models/User.js';

const checkUserPreferences = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const user = await User.findOne({ email: 'ojasshrivastava1008@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('📋 User Sync Preferences:');
    console.log('═══════════════════════════════════════════════════════════════════════════\n');
    console.log('Enabled Data Types:');
    Object.entries(user.syncPreferences.enabledDataTypes).forEach(([key, value]) => {
      const status = value ? '✅' : '❌';
      console.log(`   ${status} ${key}: ${value}`);
    });
    
    console.log(`\n📅 Sync Frequency: ${user.syncPreferences.frequency}`);
    console.log(`🔗 Google Fit Connected: ${user.googleFitConnected}`);
    console.log(`⏰ Last Sync: ${user.lastSyncAt || 'Never'}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkUserPreferences();
