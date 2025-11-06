// server/scripts/testRevokedToken.mjs
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { refreshGoogleFitToken } from '../src/utils/googleFitHelper.js';
import User from '../src/models/User.js';

const USER_EMAIL = 'ojasshrivastava1008@gmail.com';
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/health_metrics';
const GOOGLE_FIT_OAUTH_SCOPE = 'https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.body.read https://www.googleapis.com/auth/fitness.nutrition.read https://www.googleapis.com/auth/fitness.sleep.read https://www.googleapis.com/auth/fitness.location.read';

async function setupUserForRevokedTest() {
  console.log('🔧 Setting up user for revoked token test...');

  const db = mongoose.connection.db;
  const result = await db.collection('users').updateOne(
    { email: USER_EMAIL },
    {
      $set: {
        googleFitConnected: true,
        'googleFitTokens.access_token': 'test_access_token_valid_' + Date.now(),
        'googleFitTokens.refresh_token': 'test_refresh_token_revoked_' + Date.now(), // This will be "revoked"
        'googleFitTokens.token_expiry': new Date(Date.now() - 1000), // Already expired
        'googleFitTokens.scope': GOOGLE_FIT_OAUTH_SCOPE
      }
    }
  );

  console.log('✅ User set up for revoked token test');
  return result;
}

async function runRevokedTokenTest() {
  console.log('\n🧪 TEST 2: Revoked Refresh Token');
  console.log('================================');

  let user;

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Setup user with "revoked" token
    await setupUserForRevokedTest();

    // Get user ID
    user = await User.findOne({ email: USER_EMAIL });
    if (!user) {
      throw new Error('User not found');
    }

    console.log('📋 Test Setup:');
    console.log('  - User ID:', user._id.toString());
    console.log('  - googleFitConnected:', user.googleFitConnected);
    console.log('  - Token expiry:', user.googleFitTokens?.token_expiry);
    console.log('  - Has refresh token:', !!user.googleFitTokens?.refresh_token);

    console.log('\n🔄 Calling refreshGoogleFitToken (expecting invalid_grant)...');

    // This should fail with invalid_grant and disconnect the user
    const result = await refreshGoogleFitToken(user._id.toString());

    console.log('❌ UNEXPECTED: Refresh succeeded:', result);
    console.log('This should not happen with revoked tokens!');

  } catch (err) {
    console.log('\n✅ EXPECTED: Refresh failed as expected');
    console.log('Error message:', err.message);

    // Verify the error is about revoked authorization
    if (err.message.includes('revoked') || err.message.includes('invalid_grant')) {
      console.log('✅ Correctly detected revoked/invalid token');
    } else {
      console.log('❌ Unexpected error type');
    }

    // Verify user was disconnected
    console.log('\n🔍 Verifying user disconnection...');
    const updatedUser = await User.findById(user._id).select('+googleFitTokens');

    console.log('After refresh attempt:');
    console.log('  - googleFitConnected:', updatedUser.googleFitConnected);
    console.log('  - Has tokens:', !!updatedUser.googleFitTokens);
    console.log('  - Tokens cleared:', !updatedUser.googleFitTokens?.access_token && !updatedUser.googleFitTokens?.refresh_token);

    if (!updatedUser.googleFitConnected && !updatedUser.googleFitTokens?.access_token) {
      console.log('✅ SUCCESS: User properly disconnected and tokens cleared');
    } else {
      console.log('❌ FAILURE: User not properly disconnected');
    }

  } finally {
    await mongoose.disconnect();
    console.log('\n🏁 Test completed');
  }
}

// Run the test
runRevokedTokenTest().catch(console.error);