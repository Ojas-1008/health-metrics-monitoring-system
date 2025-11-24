/**
 * @fileoverview Alert Model Validation Test (No DB Operations)
 * @description Tests schema structure, methods, and validations without database
 */

import mongoose from 'mongoose';
import Alert from './server/src/models/Alert.js';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

let testResults = { passed: 0, failed: 0 };

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}═══ ${msg} ═══${colors.reset}`),
};

function assert(condition, message) {
  if (condition) {
    log.success(message);
    testResults.passed++;
  } else {
    log.error(message);
    testResults.failed++;
  }
}

async function runTests() {
  console.log(`\n${colors.cyan}╔═══════════════════════════════════════════════╗`);
  console.log(`║   ALERT MODEL STRUCTURE VALIDATION TEST   ║`);
  console.log(`╚═══════════════════════════════════════════════╝${colors.reset}\n`);

  try {
    log.section('Schema Structure Tests');

    // Test 1: Schema exists
    assert(Alert.schema !== undefined, 'Alert schema exists');

    // Test 2: Required fields
    const requiredFields = ['userId', 'alertType', 'severity', 'title', 'message'];
    requiredFields.forEach(field => {
      const fieldDef = Alert.schema.paths[field];
      const isRequired = fieldDef && (fieldDef.isRequired || fieldDef.options.required);
      assert(isRequired, `Field '${field}' is required`);
    });

    // Test 3: Alert types enum
    log.section('Alert Types Enum');
    const alertTypes = Alert.schema.paths.alertType.enumValues;
    const expectedTypes = [
      'lowactivity',
      'goalreminder',
      'goalreached',
      'trendwarning',
      'streakupdate',
      'dataentry',
      'syncstatus',
      'achievement',
      'healthinsight',
    ];
    
    expectedTypes.forEach(type => {
      assert(alertTypes.includes(type), `Alert type '${type}' is defined`);
    });
    assert(alertTypes.length === 9, `Total 9 alert types defined (got ${alertTypes.length})`);

    // Test 4: Severity levels enum
    log.section('Severity Levels Enum');
    const severities = Alert.schema.paths.severity.enumValues;
    const expectedSeverities = ['info', 'warning', 'critical', 'success'];
    
    expectedSeverities.forEach(severity => {
      assert(severities.includes(severity), `Severity '${severity}' is defined`);
    });
    assert(severities.length === 4, `Total 4 severity levels defined (got ${severities.length})`);

    // Test 5: Related metrics enum
    log.section('Related Metrics Enum');
    const metrics = Alert.schema.paths.relatedMetric.enumValues;
    const expectedMetrics = [
      'steps',
      'calories',
      'distance',
      'activeminutes',
      'weight',
      'heartrate',
      'sleep',
      'general',
    ];
    
    expectedMetrics.forEach(metric => {
      assert(metrics.includes(metric), `Related metric '${metric}' is defined`);
    });
    assert(metrics.length === 8, `Total 8 related metrics defined (got ${metrics.length})`);

    // Test 6: Instance methods
    log.section('Instance Methods');
    const instanceMethods = Object.keys(Alert.schema.methods);
    const expectedMethods = ['markAsRead', 'dismiss', 'shouldDisplay'];
    
    expectedMethods.forEach(method => {
      assert(instanceMethods.includes(method), `Instance method '${method}' exists`);
    });
    assert(instanceMethods.length >= 3, `At least 3 instance methods defined (got ${instanceMethods.length})`);

    // Test 7: Static methods
    log.section('Static Methods');
    const staticMethods = Object.keys(Alert.schema.statics);
    const expectedStatics = [
      'getUnread',
      'getUnreadCount',
      'getByType',
      'getRecent',
      'markAllAsRead',
      'cleanupDismissed',
      'getCritical',
      'createAchievement',
      'createWarning',
    ];
    
    expectedStatics.forEach(method => {
      assert(staticMethods.includes(method), `Static method '${method}' exists`);
    });
    assert(staticMethods.length === 9, `Total 9 static methods defined (got ${staticMethods.length})`);

    // Test 8: Virtual properties
    log.section('Virtual Properties');
    const virtuals = Object.keys(Alert.schema.virtuals);
    const expectedVirtuals = ['isExpired', 'ageInHours', 'id'];
    
    expectedVirtuals.forEach(virtual => {
      assert(virtuals.includes(virtual), `Virtual property '${virtual}' exists`);
    });

    // Test 9: String length validations
    log.section('String Length Validations');
    const titleMaxLength = Alert.schema.paths.title.options.maxlength;
    const messageMaxLength = Alert.schema.paths.message.options.maxlength;
    
    assert(titleMaxLength && titleMaxLength[0] === 100, 'Title max length is 100 characters');
    assert(messageMaxLength && messageMaxLength[0] === 500, 'Message max length is 500 characters');

    // Test 10: Number range validations
    log.section('Number Range Validations');
    const priorityMax = Alert.schema.paths.priorityScore.options.max;
    const priorityMin = Alert.schema.paths.priorityScore.options.min;
    
    assert(priorityMin && priorityMin[0] === 0, 'Priority score minimum is 0');
    assert(priorityMax && priorityMax[0] === 100, 'Priority score maximum is 100');

    // Test 11: Metadata structure
    log.section('Metadata Structure');
    const metadata = Alert.schema.paths.metadata;
    assert(metadata !== undefined, 'Metadata field exists');
    assert(metadata.schema !== undefined, 'Metadata is a nested schema');
    
    const metadataFields = ['currentValue', 'targetValue', 'percentage', 'streakDays', 'dateRange', 'analyticsId', 'trend'];
    metadataFields.forEach(field => {
      const exists = metadata.schema.paths[field] !== undefined;
      assert(exists, `Metadata field '${field}' exists`);
    });

    // Test 12: Action button structure
    log.section('Action Button Structure');
    const actionButton = Alert.schema.paths.actionButton;
    assert(actionButton !== undefined, 'Action button field exists');
    assert(actionButton.schema !== undefined, 'Action button is a nested schema');
    
    const buttonFields = ['text', 'action', 'route'];
    buttonFields.forEach(field => {
      const exists = actionButton.schema.paths[field] !== undefined;
      assert(exists, `Action button field '${field}' exists`);
    });

    // Test 13: Action button enum
    const actionEnum = actionButton.schema.paths.action.enumValues;
    const expectedActions = ['view_metrics', 'log_data', 'view_analytics', 'sync_googlefit', 'update_goals', null];
    
    expectedActions.forEach(action => {
      assert(actionEnum.includes(action), `Action '${action}' is defined in enum`);
    });

    // Test 14: Timestamps enabled
    log.section('Timestamps');
    assert(Alert.schema.options.timestamps === true, 'Timestamps are enabled');

    // Test 15: Indexes (check schema definitions)
    log.section('Index Definitions');
    const indexes = Alert.schema.indexes();
    
    assert(indexes.length >= 5, `At least 5 indexes defined (got ${indexes.length})`);
    
    // Check for specific indexes
    const hasUserIdIndex = indexes.some(idx => idx[0].userId !== undefined);
    const hasReadIndex = indexes.some(idx => idx[0].read !== undefined);
    const hasExpiresAtIndex = indexes.some(idx => idx[0].expiresAt !== undefined);
    const hasTTL = indexes.some(idx => idx[1] && idx[1].expireAfterSeconds !== undefined);
    
    assert(hasUserIdIndex, 'userId index is defined');
    assert(hasReadIndex, 'read index is defined');
    assert(hasExpiresAtIndex, 'expiresAt index is defined');
    assert(hasTTL, 'TTL index with expireAfterSeconds is defined');

    // Test 16: Check for duplicate expiresAt index (FIXED ISSUE)
    log.section('Duplicate Index Check (Fixed Issue)');
    const expiresAtIndexes = indexes.filter(idx => idx[0].expiresAt !== undefined);
    assert(
      expiresAtIndexes.length === 1,
      `Only ONE expiresAt index exists (was duplicate, now fixed: ${expiresAtIndexes.length})`
    );

    // Check field-level index was removed
    const expiresAtField = Alert.schema.paths.expiresAt;
    const hasFieldLevelIndex = expiresAtField.options.index === true;
    assert(
      !hasFieldLevelIndex,
      'Field-level index on expiresAt removed (no longer index: true)'
    );

    // Test 17: Pre-save hooks
    log.section('Pre-Save Hooks');
    const preSaveHooks = Alert.schema.s.hooks._pres.get('save') || [];
    assert(preSaveHooks.length >= 2, `At least 2 pre-save hooks defined (got ${preSaveHooks.length})`);

    // Test 18: Default values
    log.section('Default Values');
    assert(Alert.schema.paths.severity.options.default === 'info', 'Severity default is "info"');
    assert(Alert.schema.paths.relatedMetric.options.default === 'general', 'Related metric default is "general"');
    assert(Alert.schema.paths.read.options.default === false, 'Read default is false');
    assert(Alert.schema.paths.dismissed.options.default === false, 'Dismissed default is false');
    assert(Alert.schema.paths.priorityScore.options.default === 50, 'Priority score default is 50');

  } catch (error) {
    log.error(`Test error: ${error.message}`);
    console.error(error.stack);
    testResults.failed++;
  }

  // Print Summary
  log.section('TEST SUMMARY');
  console.log(`\nTotal Tests: ${testResults.passed + testResults.failed}`);
  console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);
  
  const successRate = ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2);
  console.log(`Success Rate: ${successRate}%`);

  if (testResults.failed === 0) {
    console.log(`\n${colors.green}✅ ALL TESTS PASSED!${colors.reset}`);
    console.log(`${colors.green}✅ DUPLICATE INDEX ISSUE FIXED!${colors.reset}\n`);
  } else {
    console.log(`\n${colors.red}❌ SOME TESTS FAILED${colors.reset}\n`);
  }

  process.exit(testResults.failed === 0 ? 0 : 1);
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
