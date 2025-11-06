// server/scripts/setupTestUser.mjs
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/health_metrics';
const GOOGLE_FIT_OAUTH_SCOPE = 'https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.body.read https://www.googleapis.com/auth/fitness.nutrition.read https://www.googleapis.com/auth/fitness.sleep.read https://www.googleapis.com/auth/fitness.location.read';

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;

    // Set up test tokens with expired access token
    const result = await db.collection('users').updateOne(
      { email: 'ojasshrivastava1008@gmail.com' },
      {
        $set: {
          googleFitConnected: true,
          'googleFitTokens.access_token': 'test_access_token_expired_' + Date.now(),
          'googleFitTokens.refresh_token': 'test_refresh_token_valid_' + Date.now(),
          'googleFitTokens.token_expiry': new Date('2025-11-05T00:00:00Z'), // Past date to trigger refresh
          'googleFitTokens.scope': GOOGLE_FIT_OAUTH_SCOPE
        }
      }
    );

    console.log('✅ Updated user for testing:', result.modifiedCount, 'document(s)');

    // Verify
    const user = await db.collection('users').findOne({ email: 'ojasshrivastava1008@gmail.com' });
    console.log('User state:', {
      googleFitConnected: user.googleFitConnected,
      hasTokens: !!user.googleFitTokens,
      tokenExpiry: user.googleFitTokens?.token_expiry,
      hasAccessToken: !!user.googleFitTokens?.access_token,
      hasRefreshToken: !!user.googleFitTokens?.refresh_token
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
})();