/**
 * @fileoverview Alert Model Integration Test Suite
 * @description Complete testing including database operations and validation
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config({ path: './server/.env' });

// Import models
import Alert from './server/src/models/Alert.js';
import User from './server/src/models/User.js';

// Test configuration
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

let testResults = { passed: 0, failed: 0, errors: [] };

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}═══ ${msg} ═══${colors.reset}`),
};

function assert(condition, message) {
  if (condition) {
    log.success(message);
    testResults.passed++;
  } else {
    log.error(message);
    testResults.failed++;
    testResults.errors.push(message);
  }
}

// Test Suite
async function runTests() {
  console.log(`\n${colors.cyan}╔════════════════════════════════════════════════════╗`);
  console.log(`║   ALERT MODEL COMPREHENSIVE INTEGRATION TEST   ║`);
  console.log(`╚════════════════════════════════════════════════════╝${colors.reset}\n`);

  let connection;
  let testUserId;

  try {
    // Connect to database
    log.section('Database Connection');
    connection = await mongoose.connect(process.env.MONGODB_URI);
    log.success('Connected to MongoDB');
    assert(mongoose.connection.readyState === 1, 'Connection state is active');

    // Create test user
    log.section('Test User Setup');
    await User.deleteOne({ email: 'alert-test@example.com' });
    const testUser = await User.create({
      name: 'Alert Test User',
      email: 'alert-test@example.com',
      password: 'TestPassword123!',
    });
    testUserId = testUser._id;
    log.success(`Test user created: ${testUserId}`);

    // Clean up existing test alerts
    await Alert.deleteMany({ userId: testUserId });
    log.success('Cleaned up existing test alerts');

    // Test 1: Schema Validation - Valid Alert
    log.section('Test 1: Create Valid Alert');
    const validAlert = await Alert.create({
      userId: testUserId,
      alertType: 'achievement',
      severity: 'success',
      title: 'Test Achievement',
      message: 'You completed a test!',
    });
    assert(validAlert._id !== undefined, 'Valid alert created successfully');
    assert(validAlert.alertType === 'achievement', 'Alert type set correctly');
    assert(validAlert.severity === 'success', 'Severity set correctly');
    await Alert.deleteOne({ _id: validAlert._id });

    // Test 2: Required Fields Validation
    log.section('Test 2: Required Fields Validation');
    try {
      await Alert.create({
        userId: testUserId,
        alertType: 'achievement',
        // Missing title and message
      });
      log.error('Should have thrown validation error for missing fields');
      testResults.failed++;
    } catch (error) {
      assert(
        error.message.includes('required') || error.name === 'ValidationError',
        'Correctly rejects missing required fields'
      );
    }

    // Test 3: Enum Validation
    log.section('Test 3: Enum Validation');
    try {
      await Alert.create({
        userId: testUserId,
        alertType: 'invalid_type',
        severity: 'success',
        title: 'Test',
        message: 'Test message',
      });
      log.error('Should have thrown validation error for invalid enum');
      testResults.failed++;
    } catch (error) {
      assert(
        error.message.includes('not a valid enum value') || error.name === 'ValidationError',
        'Correctly rejects invalid enum values'
      );
    }

    // Test 4: String Length Validation
    log.section('Test 4: String Length Validation');
    try {
      await Alert.create({
        userId: testUserId,
        alertType: 'achievement',
        severity: 'success',
        title: 'A'.repeat(101), // Exceeds maxlength
        message: 'Test',
      });
      log.error('Should have thrown validation error for long title');
      testResults.failed++;
    } catch (error) {
      assert(
        error.message.includes('cannot exceed') || error.name === 'ValidationError',
        'Correctly enforces string length limits'
      );
    }

    // Test 5: Pre-Save Hook - Priority Score
    log.section('Test 5: Priority Score Auto-Assignment');
    const severityTests = [
      { severity: 'critical', expectedScore: 90 },
      { severity: 'warning', expectedScore: 70 },
      { severity: 'success', expectedScore: 60 },
      { severity: 'info', expectedScore: 40 },
    ];

    for (const test of severityTests) {
      const alert = await Alert.create({
        userId: testUserId,
        alertType: 'achievement',
        severity: test.severity,
        title: `Test ${test.severity}`,
        message: 'Priority test',
      });
      assert(
        alert.priorityScore === test.expectedScore,
        `Priority score for ${test.severity} is ${alert.priorityScore} (expected ${test.expectedScore})`
      );
      await Alert.deleteOne({ _id: alert._id });
    }

    // Test 6: Pre-Save Hook - Auto-Expiration
    log.section('Test 6: Auto-Expiration Based on Alert Type');
    const expirationTests = [
      { type: 'goalreminder', hours: 24 },
      { type: 'syncstatus', hours: 6 },
      { type: 'goalreached', hours: 168 }, // 7 days
      { type: 'streakupdate', hours: 72 }, // 3 days
      { type: 'dataentry', hours: 12 },
    ];

    for (const test of expirationTests) {
      const beforeTime = new Date();
      const alert = await Alert.create({
        userId: testUserId,
        alertType: test.type,
        severity: 'info',
        title: `Test ${test.type}`,
        message: 'Expiration test',
      });

      const expirationHours = (alert.expiresAt - beforeTime) / (1000 * 60 * 60);
      const tolerance = 1; // 1 hour tolerance
      const isCorrect = Math.abs(expirationHours - test.hours) <= tolerance;
      
      assert(
        isCorrect,
        `Auto-expiration for ${test.type}: ${Math.round(expirationHours)}h (expected ~${test.hours}h)`
      );
      await Alert.deleteOne({ _id: alert._id });
    }

    // Test 7: Virtual Properties
    log.section('Test 7: Virtual Properties');
    
    // isExpired - not expired
    const futureAlert = await Alert.create({
      userId: testUserId,
      alertType: 'achievement',
      severity: 'success',
      title: 'Future Alert',
      message: 'Not expired',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    assert(futureAlert.isExpired === false, 'isExpired correctly identifies non-expired alert');

    // isExpired - expired
    const pastAlert = await Alert.create({
      userId: testUserId,
      alertType: 'achievement',
      severity: 'success',
      title: 'Past Alert',
      message: 'Expired',
      expiresAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    });
    assert(pastAlert.isExpired === true, 'isExpired correctly identifies expired alert');

    // ageInHours
    const recentAlert = await Alert.create({
      userId: testUserId,
      alertType: 'achievement',
      severity: 'success',
      title: 'Recent Alert',
      message: 'Age test',
    });
    const age = recentAlert.ageInHours;
    assert(age >= 0 && age <= 1, `ageInHours calculated: ${age.toFixed(2)} hours`);

    await Alert.deleteMany({ _id: { $in: [futureAlert._id, pastAlert._id, recentAlert._id] } });

    // Test 8: Instance Methods
    log.section('Test 8: Instance Methods');

    // markAsRead()
    const readTestAlert = await Alert.create({
      userId: testUserId,
      alertType: 'achievement',
      severity: 'success',
      title: 'Read Test',
      message: 'Testing markAsRead',
      read: false,
    });
    
    await readTestAlert.markAsRead();
    const updatedReadAlert = await Alert.findById(readTestAlert._id);
    assert(updatedReadAlert.read === true, 'markAsRead() sets read to true');
    assert(updatedReadAlert.readAt !== null, 'markAsRead() sets readAt timestamp');

    // dismiss()
    const dismissTestAlert = await Alert.create({
      userId: testUserId,
      alertType: 'achievement',
      severity: 'success',
      title: 'Dismiss Test',
      message: 'Testing dismiss',
      dismissed: false,
    });
    
    await dismissTestAlert.dismiss();
    const updatedDismissAlert = await Alert.findById(dismissTestAlert._id);
    assert(updatedDismissAlert.dismissed === true, 'dismiss() sets dismissed to true');
    assert(updatedDismissAlert.dismissedAt !== null, 'dismiss() sets dismissedAt timestamp');

    // shouldDisplay()
    const displayAlert = await Alert.create({
      userId: testUserId,
      alertType: 'achievement',
      severity: 'success',
      title: 'Display Test',
      message: 'Testing shouldDisplay',
    });
    assert(displayAlert.shouldDisplay() === true, 'shouldDisplay() returns true for active alert');

    await displayAlert.dismiss();
    const dismissedDisplayAlert = await Alert.findById(displayAlert._id);
    assert(
      dismissedDisplayAlert.shouldDisplay() === false,
      'shouldDisplay() returns false for dismissed alert'
    );

    await Alert.deleteMany({ userId: testUserId });

    // Test 9: Static Methods
    log.section('Test 9: Static Methods');

    // Create test data
    const testAlerts = await Alert.insertMany([
      {
        userId: testUserId,
        alertType: 'achievement',
        severity: 'success',
        title: 'Achievement 1',
        message: 'First achievement',
        read: false,
        dismissed: false,
      },
      {
        userId: testUserId,
        alertType: 'achievement',
        severity: 'success',
        title: 'Achievement 2',
        message: 'Second achievement',
        read: true,
        dismissed: false,
      },
      {
        userId: testUserId,
        alertType: 'trendwarning',
        severity: 'warning',
        title: 'Warning 1',
        message: 'Trend warning',
        read: false,
        dismissed: false,
      },
      {
        userId: testUserId,
        alertType: 'goalreminder',
        severity: 'info',
        title: 'Goal Reminder',
        message: 'Remember goals',
        read: false,
        dismissed: true,
      },
      {
        userId: testUserId,
        alertType: 'healthinsight',
        severity: 'critical',
        title: 'Critical Alert',
        message: 'Critical issue',
        read: false,
        dismissed: false,
      },
    ]);

    // getUnread()
    const unreadAlerts = await Alert.getUnread(testUserId);
    assert(unreadAlerts.length === 3, `getUnread() returns 3 unread alerts (got ${unreadAlerts.length})`);

    // getUnreadCount()
    const unreadCount = await Alert.getUnreadCount(testUserId);
    assert(unreadCount === 3, `getUnreadCount() returns 3 (got ${unreadCount})`);

    // getByType()
    const achievementAlerts = await Alert.getByType(testUserId, 'achievement');
    assert(achievementAlerts.length === 2, `getByType() returns 2 achievements (got ${achievementAlerts.length})`);

    // getRecent()
    const recentAlerts = await Alert.getRecent(testUserId, 10);
    assert(recentAlerts.length === 4, `getRecent() returns 4 recent alerts (got ${recentAlerts.length})`);

    // getCritical()
    const criticalAlerts = await Alert.getCritical(testUserId);
    assert(criticalAlerts.length === 1, `getCritical() returns 1 critical alert (got ${criticalAlerts.length})`);

    // markAllAsRead()
    await Alert.markAllAsRead(testUserId);
    const allAlerts = await Alert.find({ userId: testUserId });
    const allReadOrDismissed = allAlerts.every(a => a.read === true || a.dismissed === true);
    assert(allReadOrDismissed, 'markAllAsRead() marks all non-dismissed alerts as read');

    // Helper methods
    const achievementHelper = await Alert.createAchievement(
      testUserId,
      'Helper Test',
      'Testing helper method'
    );
    assert(achievementHelper.alertType === 'achievement', 'createAchievement() creates achievement alert');
    assert(achievementHelper.severity === 'success', 'createAchievement() sets success severity');

    const warningHelper = await Alert.createWarning(
      testUserId,
      'Warning Test',
      'Testing warning helper',
      'steps'
    );
    assert(warningHelper.alertType === 'trendwarning', 'createWarning() creates warning alert');
    assert(warningHelper.severity === 'warning', 'createWarning() sets warning severity');
    assert(warningHelper.relatedMetric === 'steps', 'createWarning() sets relatedMetric');

    await Alert.deleteMany({ userId: testUserId });

    // Test 10: Metadata and Action Buttons
    log.section('Test 10: Metadata and Action Buttons');

    const metadataAlert = await Alert.create({
      userId: testUserId,
      alertType: 'goalreached',
      severity: 'success',
      title: 'Goal Reached',
      message: 'You reached your goal!',
      metadata: {
        currentValue: 10000,
        targetValue: 10000,
        percentage: 100,
        streakDays: 7,
      },
      actionButton: {
        text: 'View Stats',
        action: 'view_metrics',
        route: '/dashboard/metrics',
      },
    });

    assert(metadataAlert.metadata.currentValue === 10000, 'Metadata currentValue stored correctly');
    assert(metadataAlert.metadata.percentage === 100, 'Metadata percentage stored correctly');
    assert(metadataAlert.actionButton.text === 'View Stats', 'Action button text stored correctly');
    assert(metadataAlert.actionButton.action === 'view_metrics', 'Action button action stored correctly');

    await Alert.deleteOne({ _id: metadataAlert._id });

    // Test 11: Index Verification
    log.section('Test 11: Index Verification');
    const indexes = await Alert.collection.getIndexes();
    const indexNames = Object.keys(indexes);
    
    assert(indexNames.includes('_id_'), 'Primary _id index exists');
    assert(indexNames.includes('userId_1'), 'userId index exists');
    assert(indexNames.includes('read_1'), 'read index exists');
    assert(indexNames.includes('expiresAt_1'), 'expiresAt TTL index exists');
    
    // Verify no duplicate index warning
    const duplicateCheck = indexNames.filter(name => name.includes('expiresAt')).length;
    assert(duplicateCheck === 1, 'No duplicate expiresAt indexes (only TTL index exists)');

    log.success(`Total indexes: ${indexNames.length}`);

    // Test 12: Timestamps
    log.section('Test 12: Automatic Timestamps');
    const timestampAlert = await Alert.create({
      userId: testUserId,
      alertType: 'achievement',
      severity: 'success',
      title: 'Timestamp Test',
      message: 'Testing timestamps',
    });

    assert(timestampAlert.createdAt !== undefined, 'createdAt timestamp is set');
    assert(timestampAlert.updatedAt !== undefined, 'updatedAt timestamp is set');
    assert(
      timestampAlert.createdAt.getTime() === timestampAlert.updatedAt.getTime(),
      'createdAt and updatedAt match on creation'
    );

    await Alert.deleteOne({ _id: timestampAlert._id });

    // Cleanup
    log.section('Cleanup');
    await Alert.deleteMany({ userId: testUserId });
    await User.deleteOne({ _id: testUserId });
    log.success('Test data cleaned up');

  } catch (error) {
    log.error(`Test suite error: ${error.message}`);
    console.error(error.stack);
    testResults.failed++;
  } finally {
    // Disconnect
    if (connection) {
      await mongoose.disconnect();
      log.success('Database disconnected');
    }

    // Print Summary
    log.section('TEST SUMMARY');
    console.log(`\nTotal Tests: ${testResults.passed + testResults.failed}`);
    console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);
    
    if (testResults.failed > 0) {
      console.log(`\n${colors.red}Failed Tests:${colors.reset}`);
      testResults.errors.forEach(err => console.log(`  • ${err}`));
    }

    const successRate = ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2);
    console.log(`\nSuccess Rate: ${successRate}%`);

    if (testResults.failed === 0) {
      console.log(`\n${colors.green}✅ ALL TESTS PASSED!${colors.reset}\n`);
    } else {
      console.log(`\n${colors.red}❌ SOME TESTS FAILED${colors.reset}\n`);
    }

    process.exit(testResults.failed === 0 ? 0 : 1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
