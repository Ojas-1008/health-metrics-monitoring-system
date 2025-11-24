/**
 * User Model - Integration & Functionality Tests
 * Tests database operations, OAuth flow, sync coordination, and real-world usage patterns
 * NO MODIFICATIONS - ANALYSIS ONLY
 */

import mongoose from 'mongoose';
import User from './src/models/User.js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

console.log('\n════════════════════════════════════════════════════════════════════');
console.log('🧪 USER MODEL - INTEGRATION & FUNCTIONALITY TESTS');
console.log('════════════════════════════════════════════════════════════════════\n');

let passCount = 0;
let failCount = 0;
const testUsers = [];

function logTest(name, passed, message = '') {
  const icon = passed ? '✅' : '❌';
  const status = passed ? 'PASS' : 'FAIL';
  console.log(`${icon} [${status}] ${name}${message ? ': ' + message : ''}`);
  if (passed) passCount++;
  else failCount++;
}

async function runTests() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...\n');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connected\n');

    // ============================================================================
    // 1. USER CREATION & VALIDATION TESTS
    // ============================================================================
    console.log('📝 1. USER CREATION & VALIDATION TESTS\n');

    // Test 1.1: Create a valid user
    try {
      const user = await User.create({
        email: `test-user-${Date.now()}@example.com`,
        password: 'SecurePassword123!',
        name: 'Test User',
      });
      testUsers.push(user);
      logTest('Create valid user with all required fields', true, `ID: ${user._id}`);
    } catch (error) {
      logTest('Create valid user', false, error.message);
    }

    // Test 1.2: Email validation (invalid email)
    try {
      await User.create({
        email: 'invalid-email',
        password: 'Password123!',
        name: 'Test User',
      });
      logTest('Reject invalid email format', false, 'Should have failed');
    } catch (error) {
      logTest('Reject invalid email format', true, 'Validation error thrown');
    }

    // Test 1.3: Password minlength validation
    try {
      await User.create({
        email: `test-${Date.now()}@example.com`,
        password: 'short',
        name: 'Test User',
      });
      logTest('Reject short password (<8 chars)', false, 'Should have failed');
    } catch (error) {
      logTest('Reject short password (<8 chars)', true, 'Validation error: ' + error.message.substring(0, 50));
    }

    // Test 1.4: Email uniqueness constraint
    if (testUsers.length > 0) {
      try {
        await User.create({
          email: testUsers[0].email,
          password: 'Password123!',
          name: 'Another User',
        });
        logTest('Enforce email uniqueness', false, 'Should have rejected duplicate');
      } catch (error) {
        logTest('Enforce email uniqueness', true, 'Duplicate key error');
      }
    }

    // Test 1.5: Email normalization (lowercase)
    try {
      const user = await User.create({
        email: `MixedCase-${Date.now()}@EXAMPLE.COM`,
        password: 'Password123!',
        name: 'Test User',
      });
      testUsers.push(user);
      logTest('Email normalized to lowercase', user.email === user.email.toLowerCase(), `Stored as: ${user.email}`);
    } catch (error) {
      logTest('Email normalization', false, error.message);
    }

    // ============================================================================
    // 2. PASSWORD HASHING & COMPARISON TESTS
    // ============================================================================
    console.log('\n🔐 2. PASSWORD HASHING & COMPARISON TESTS\n');

    if (testUsers.length > 0) {
      const user = testUsers[0];
      const plainPassword = 'SecurePassword123!';

      // Test 2.1: Password is hashed (not stored in plain text)
      logTest('Password stored as hash (not plain text)', user.password !== plainPassword, 'Hash verification');

      // Test 2.2: Password field not selected by default
      try {
        const fetchedUser = await User.findById(user._id);
        logTest('Password field not selected by default', fetchedUser.password === undefined, 'Password undefined without explicit select');
      } catch (error) {
        logTest('Password field not selected', false, error.message);
      }

      // Test 2.3: comparePassword with correct password
      try {
        const fetchedUser = await User.findById(user._id).select('+password');
        const match = await fetchedUser.comparePassword(plainPassword);
        logTest('comparePassword matches correct password', match === true);
      } catch (error) {
        logTest('comparePassword correct', false, error.message);
      }

      // Test 2.4: comparePassword with incorrect password
      try {
        const fetchedUser = await User.findById(user._id).select('+password');
        const match = await fetchedUser.comparePassword('WrongPassword123!');
        logTest('comparePassword rejects wrong password', match === false);
      } catch (error) {
        logTest('comparePassword incorrect', false, error.message);
      }
    }

    // ============================================================================
    // 3. GOOGLE FIT OAUTH INTEGRATION TESTS
    // ============================================================================
    console.log('\n🔗 3. GOOGLE FIT OAUTH INTEGRATION TESTS\n');

    if (testUsers.length > 0) {
      const user = testUsers[0];

      // Test 3.1: Initial OAuth state
      logTest('Initial googleFitConnected is false', user.googleFitConnected === false);
      logTest('Initial googleId is undefined', user.googleId === undefined);
      logTest('Initial isGoogleFitActive is false', user.isGoogleFitActive === false);

      // Test 3.2: Update Google Fit tokens
      try {
        const tokenData = {
          access_token: 'ya29.c.test_access_token_long_string_' + Date.now(),
          refresh_token: 'test_refresh_token_string_' + Date.now(),
          token_expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          scope: 'https://www.googleapis.com/auth/fitness.activity.read',
        };
        user.updateGoogleFitTokens(tokenData);
        await user.save();
        logTest('Update Google Fit tokens via method', user.googleFitConnected === true);
      } catch (error) {
        logTest('Update Google Fit tokens', false, error.message);
      }

      // Test 3.3: Verify tokens are stored
      try {
        const fetchedUser = await User.findById(user._id);
        logTest('OAuth tokens persist after save', 
          fetchedUser.googleFitConnected === true &&
          fetchedUser.googleFitTokens.access_token !== undefined);
      } catch (error) {
        logTest('OAuth tokens persist', false, error.message);
      }

      // Test 3.4: isGoogleFitActive virtual property
      try {
        const fetchedUser = await User.findById(user._id);
        logTest('isGoogleFitActive is true for connected user', fetchedUser.isGoogleFitActive === true);
      } catch (error) {
        logTest('isGoogleFitActive virtual', false, error.message);
      }

      // Test 3.5: daysUntilTokenExpiry virtual property
      try {
        const fetchedUser = await User.findById(user._id);
        const daysLeft = fetchedUser.daysUntilTokenExpiry;
        logTest('daysUntilTokenExpiry calculates correctly', 
          daysLeft >= 6 && daysLeft <= 7, 
          `Days: ${daysLeft}`);
      } catch (error) {
        logTest('daysUntilTokenExpiry virtual', false, error.message);
      }

      // Test 3.6: Disconnect Google Fit
      try {
        user.disconnectGoogleFit();
        await user.save();
        const fetchedUser = await User.findById(user._id);
        logTest('Disconnect Google Fit resets connection', 
          fetchedUser.googleFitConnected === false &&
          fetchedUser.googleFitTokens.access_token === undefined);
      } catch (error) {
        logTest('Disconnect Google Fit', false, error.message);
      }

      // Test 3.7: Reconnect after disconnect
      try {
        const newTokenData = {
          access_token: 'ya29.c.new_token_' + Date.now(),
          refresh_token: 'refresh_' + Date.now(),
          token_expiry: new Date(Date.now() + 3600000),
          scope: 'https://www.googleapis.com/auth/fitness.body.read',
        };
        user.updateGoogleFitTokens(newTokenData);
        await user.save();
        logTest('Reconnect OAuth after previous disconnect', user.googleFitConnected === true);
      } catch (error) {
        logTest('Reconnect OAuth', false, error.message);
      }
    }

    // ============================================================================
    // 4. GOOGLE ID & OAUTH LOGIN TESTS
    // ============================================================================
    console.log('\n🆔 4. GOOGLE ID & OAUTH LOGIN TESTS\n');

    // Test 4.1: Set googleId (OAuth login)
    try {
      const user = await User.create({
        email: `oauth-user-${Date.now()}@example.com`,
        password: 'OAuthPassword123!',
        name: 'OAuth User',
        googleId: `110${Date.now()}`, // Sample Google ID format
      });
      testUsers.push(user);
      logTest('Create user with googleId (OAuth login)', user.googleId !== undefined);
    } catch (error) {
      logTest('Create user with googleId', false, error.message);
    }

    // Test 4.2: Query by googleId
    try {
      if (testUsers.length > 1) {
        const oauthUser = testUsers[testUsers.length - 1];
        const found = await User.findOne({ googleId: oauthUser.googleId });
        logTest('Query user by googleId', found !== null && found._id.equals(oauthUser._id));
      }
    } catch (error) {
      logTest('Query by googleId', false, error.message);
    }

    // ============================================================================
    // 5. HEALTH GOALS TESTS
    // ============================================================================
    console.log('\n🎯 5. HEALTH GOALS TESTS\n');

    if (testUsers.length > 0) {
      const user = testUsers[0];

      // Test 5.1: Default goals
      logTest('Default step goal is 10000', user.goals.stepGoal === 10000);
      logTest('Default sleep goal is 8 hours', user.goals.sleepGoal === 8);
      logTest('Default calorie goal is 2000', user.goals.calorieGoal === 2000);
      logTest('Default distance goal is 5 km', user.goals.distanceGoal === 5);
      logTest('Default weight goal is null', user.goals.weightGoal === null);

      // Test 5.2: Update goals (use a fresh user to avoid state pollution)
      try {
        const updateUser = await User.create({
          email: `goal-test-${Date.now()}@example.com`,
          password: 'Password123!',
          name: 'Goal Test User',
        });
        updateUser.goals.stepGoal = 12000;
        updateUser.goals.calorieGoal = 2500;
        updateUser.goals.weightGoal = 75;
        await updateUser.save();
        const fetched = await User.findById(updateUser._id);
        logTest('Update custom goals', 
          fetched.goals.stepGoal === 12000 &&
          fetched.goals.calorieGoal === 2500 &&
          fetched.goals.weightGoal === 75);
        testUsers.push(updateUser);
      } catch (error) {
        logTest('Update goals', false, error.message);
      }

      // Test 5.3: Goal constraints (with fresh user)
      try {
        const constraintUser = await User.create({
          email: `constraint-test-${Date.now()}@example.com`,
          password: 'Password123!',
          name: 'Constraint Test User',
        });
        constraintUser.goals.stepGoal = 60000; // Exceeds max
        await constraintUser.save();
        logTest('Enforce step goal max constraint', false, 'Should reject 60000');
      } catch (error) {
        logTest('Enforce step goal max constraint (50000)', true, 'Validation error');
      }

      try {
        const sleepUser = await User.create({
          email: `sleep-test-${Date.now()}@example.com`,
          password: 'Password123!',
          name: 'Sleep Test User',
        });
        sleepUser.goals.sleepGoal = 2; // Below min
        await sleepUser.save();
        logTest('Enforce sleep goal min constraint', false, 'Should reject 2');
      } catch (error) {
        logTest('Enforce sleep goal min constraint (4)', true, 'Validation error');
      }
    }

    // ============================================================================
    // 6. SYNC PREFERENCES TESTS
    // ============================================================================
    console.log('\n📊 6. SYNC PREFERENCES TESTS\n');

    if (testUsers.length > 0) {
      const user = testUsers[0];

      // Test 6.1: Default sync frequency
      logTest('Default sync frequency is daily', user.syncPreferences.frequency === 'daily');

      // Test 6.2: Phone-enabled metrics
      const phoneMetrics = [
        'steps', 'weight', 'sleep', 'calories', 'distance',
        'height', 'bloodPressure', 'bodyTemperature', 'hydration',
        'heartPoints', 'moveMinutes', 'activeMinutes'
      ];
      const allPhoneEnabled = phoneMetrics.every(metric => user.syncPreferences.enabledDataTypes[metric] === true);
      logTest('Phone-compatible metrics enabled by default', allPhoneEnabled, `${phoneMetrics.length} metrics`);

      // Test 6.3: Wearable-only metrics disabled
      logTest('Heart rate disabled (wearable-only)', user.syncPreferences.enabledDataTypes.heartRate === false);
      logTest('Oxygen saturation disabled (wearable-only)', user.syncPreferences.enabledDataTypes.oxygenSaturation === false);

      // Test 6.4: Toggle sync preferences (use fresh user to avoid state pollution)
      try {
        const prefUser = await User.create({
          email: `pref-test-${Date.now()}@example.com`,
          password: 'Password123!',
          name: 'Pref Test User',
        });
        prefUser.syncPreferences.enabledDataTypes.steps = false;
        prefUser.syncPreferences.frequency = 'weekly';
        await prefUser.save();
        const fetched = await User.findById(prefUser._id);
        logTest('Modify sync preferences', 
          fetched.syncPreferences.enabledDataTypes.steps === false &&
          fetched.syncPreferences.frequency === 'weekly');
        testUsers.push(prefUser);
      } catch (error) {
        logTest('Modify sync preferences', false, error.message);
      }
    }

    // ============================================================================
    // 7. SYNC WORKER COORDINATION TESTS
    // ============================================================================
    console.log('\n🔄 7. SYNC WORKER COORDINATION TESTS\n');

    // Test 7.1: lastSyncAt initialization
    if (testUsers.length > 0) {
      const user = testUsers[0];
      logTest('lastSyncAt initialized to null', user.lastSyncAt === null);
    }

    // Test 7.2: Query users needing sync
    try {
      // Create a user with old sync time
      const oldSyncUser = await User.create({
        email: `old-sync-${Date.now()}@example.com`,
        password: 'Password123!',
        name: 'Old Sync User',
        googleFitConnected: true,
        lastSyncAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        googleFitTokens: {
          access_token: 'test_token_' + Date.now(),
          refresh_token: 'test_refresh_' + Date.now(),
          token_expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          scope: 'test_scope',
        }
      });
      testUsers.push(oldSyncUser);
      logTest('Create user with old sync time', oldSyncUser.lastSyncAt !== null);
    } catch (error) {
      logTest('Create old sync user', false, error.message);
    }

    // Test 7.3: Query optimization for sync worker
    try {
      const usersNeedingSync = await User.find({
        googleFitConnected: true,
        $or: [
          { lastSyncAt: null },
          { lastSyncAt: { $lt: new Date(Date.now() - 15 * 60 * 1000) } } // 15 minutes
        ]
      });
      logTest('Query users for sync worker', usersNeedingSync.length > 0, `Found: ${usersNeedingSync.length} users`);
    } catch (error) {
      logTest('Query users for sync worker', false, error.message);
    }

    // ============================================================================
    // 8. PROFILE PICTURE TESTS
    // ============================================================================
    console.log('\n🖼️  8. PROFILE PICTURE TESTS\n');

    // Test 8.1: Profile picture null by default
    if (testUsers.length > 0) {
      const user = testUsers[0];
      logTest('Profile picture null by default', user.profilePicture === null);
    }

    // Test 8.2: Profile picture URL validation (use fresh user)
    try {
      const picUser = await User.create({
        email: `pic-test-${Date.now()}@example.com`,
        password: 'Password123!',
        name: 'Pic Test User',
      });
      picUser.profilePicture = 'https://example.com/valid-image.jpg';
      await picUser.save();
      logTest('Accept valid URL for profile picture', true);
      testUsers.push(picUser);
    } catch (error) {
      logTest('Accept valid URL', false, error.message);
    }

    // Test 8.3: Reject invalid URL
    try {
      const user = testUsers[0];
      user.profilePicture = 'not-a-url';
      await user.save();
      logTest('Reject invalid URL for profile picture', false, 'Should have failed');
    } catch (error) {
      logTest('Reject invalid URL for profile picture', true, 'URL validation error');
    }

    // ============================================================================
    // 9. TIMESTAMP TESTS
    // ============================================================================
    console.log('\n⏰ 9. TIMESTAMP TESTS\n');

    if (testUsers.length > 0) {
      const user = testUsers[0];
      logTest('createdAt timestamp set automatically', user.createdAt instanceof Date);
      logTest('updatedAt timestamp set automatically', user.updatedAt instanceof Date);
    }

    // ============================================================================
    // 10. QUERY PERFORMANCE TESTS
    // ============================================================================
    console.log('\n⚡ 10. QUERY PERFORMANCE TESTS\n');

    // Test 10.1: Email lookup
    try {
      if (testUsers.length > 0) {
        const user = testUsers[0];
        const start = Date.now();
        const found = await User.findOne({ email: user.email });
        const duration = Date.now() - start;
        logTest('Email lookup performance', found !== null, `${duration}ms`);
      }
    } catch (error) {
      logTest('Email lookup', false, error.message);
    }

    // Test 10.2: ID lookup
    try {
      if (testUsers.length > 0) {
        const user = testUsers[0];
        const start = Date.now();
        const found = await User.findById(user._id);
        const duration = Date.now() - start;
        logTest('ID lookup performance', found !== null, `${duration}ms`);
      }
    } catch (error) {
      logTest('ID lookup', false, error.message);
    }

  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error);
    console.error(error.stack);
  } finally {
    // Cleanup: Delete test users
    console.log('\n🧹 Cleaning up test users...\n');
    try {
      if (testUsers.length > 0) {
        const ids = testUsers.map(u => u._id);
        const result = await User.deleteMany({ _id: { $in: ids } });
        console.log(`✅ Deleted ${result.deletedCount} test users\n`);
      }
    } catch (error) {
      console.error('Cleanup error:', error.message);
    }

    // Disconnect
    await mongoose.disconnect();
    console.log('✅ Database disconnected\n');

    // Summary
    console.log('════════════════════════════════════════════════════════════════════');
    console.log(`📈 TEST SUMMARY\n`);
    console.log(`✅ Passed: ${passCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📊 Total:  ${passCount + failCount}`);
    console.log(`📊 Success Rate: ${((passCount / (passCount + failCount)) * 100).toFixed(2)}%\n`);

    if (failCount === 0) {
      console.log('🎉 All integration tests passed!');
      console.log('✅ User Model: FULLY FUNCTIONAL');
      console.log('✅ OAuth Integration: WORKING');
      console.log('✅ Sync Coordination: READY');
      console.log('✅ Database Operations: VERIFIED\n');
      console.log('════════════════════════════════════════════════════════════════════\n');
      process.exit(0);
    } else {
      console.log(`⚠️  ${failCount} test(s) failed. Review the issues above.`);
      console.log(`Status: Review needed\n`);
      console.log('════════════════════════════════════════════════════════════════════\n');
      process.exit(1);
    }
  }
}

// Run tests
runTests();
