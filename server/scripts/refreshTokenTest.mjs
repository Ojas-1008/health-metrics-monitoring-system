// server/scripts/refreshTokenTest.mjs
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { refreshGoogleFitToken } from '../src/utils/googleFitHelper.js';
import User from '../src/models/User.js';

const USER_EMAIL = 'ojasshrivastava1008@gmail.com';
const FALLBACK_URI = 'mongodb://localhost:27017/health_metrics';

(async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || FALLBACK_URI;
    console.log('Connecting to', mongoUri);
    await mongoose.connect(mongoUri, {});

    const user = await User.findOne({ email: USER_EMAIL }).select('+googleFitTokens');
    if (!user) {
      console.error('❌ User not found:', USER_EMAIL);
      return process.exitCode = 2;
    }

    console.log('Found user id:', user._id.toString());
    console.log('Current tokens (partial):', {
      googleFitConnected: user.googleFitConnected,
      token_expiry: user.googleFitTokens?.token_expiry?.toISOString?.(),
      hasAccessToken: !!user.googleFitTokens?.access_token,
      hasRefreshToken: !!user.googleFitTokens?.refresh_token,
    });

    console.log('\n🔄 Calling refreshGoogleFitToken...');
    const result = await refreshGoogleFitToken(user._id.toString());
    console.log('✅ Token refreshed result:', result);
    console.log('New token_expiry:', result.token_expiry || result.googleFitTokens?.token_expiry);
  } catch (err) {
    console.error('❌ Refresh failed:', err && err.message ? err.message : err);
    if (err.response) console.error('Response data:', err.response.data || err.response);
  } finally {
    await mongoose.disconnect();
  }
})();