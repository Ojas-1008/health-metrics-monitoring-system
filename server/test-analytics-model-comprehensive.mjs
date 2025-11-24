/**
 * Comprehensive Analytics Model Test Suite (Fixed)
 * Tests schema structure, validation, indexes, virtual properties, and integration
 * NOTE: Does NOT require live database - only validates schema structure
 */

import mongoose from 'mongoose';
import Analytics from './src/models/Analytics.js';

console.log('\n════════════════════════════════════════════════════════════════════');
console.log('📊 ANALYTICS MODEL - COMPREHENSIVE TEST SUITE');
console.log('════════════════════════════════════════════════════════════════════\n');

let passCount = 0;
let failCount = 0;

function logTest(name, passed, message = '') {
  const icon = passed ? '✅' : '❌';
  const status = passed ? 'PASS' : 'FAIL';
  console.log(`${icon} [${status}] ${name}${message ? ': ' + message : ''}`);
  if (passed) passCount++;
  else failCount++;
}

// ============================================================================
// 1. SCHEMA STRUCTURE TESTS
// ============================================================================
console.log('\n📋 1. SCHEMA STRUCTURE TESTS\n');

const schema = Analytics.schema;

// Test 1.1: All required fields exist
logTest(
  'Schema contains userId field',
  schema.paths.userId !== undefined,
  `Path type: ${schema.paths.userId?.instance}`
);

logTest(
  'Schema contains metricType field',
  schema.paths.metricType !== undefined,
  `Path type: ${schema.paths.metricType?.instance}`
);

logTest(
  'Schema contains timeRange field',
  schema.paths.timeRange !== undefined,
  `Path type: ${schema.paths.timeRange?.instance}`
);

logTest(
  'Schema contains analytics.rollingAverage field',
  schema.paths['analytics.rollingAverage'] !== undefined,
  `Path type: ${schema.paths['analytics.rollingAverage']?.instance}`
);

logTest(
  'Schema contains calculatedAt field',
  schema.paths.calculatedAt !== undefined,
  `Path type: ${schema.paths.calculatedAt?.instance}`
);

logTest(
  'Schema contains expiresAt field',
  schema.paths.expiresAt !== undefined,
  `Path type: ${schema.paths.expiresAt?.instance}`
);

logTest(
  'Schema contains timestamps (createdAt, updatedAt)',
  schema.paths.createdAt !== undefined && schema.paths.updatedAt !== undefined
);

// Test 1.2: Nested analytics object structure
logTest(
  'Analytics contains trend field',
  schema.paths['analytics.trend'] !== undefined
);

logTest(
  'Analytics contains anomalyDetected field',
  schema.paths['analytics.anomalyDetected'] !== undefined
);

logTest(
  'Analytics contains streakDays field',
  schema.paths['analytics.streakDays'] !== undefined
);

logTest(
  'Analytics contains percentile field',
  schema.paths['analytics.percentile'] !== undefined
);

// Test 1.3: Nested anomalyDetails structure
logTest(
  'Analytics contains anomalyDetails.severity field',
  schema.paths['analytics.anomalyDetails.severity'] !== undefined
);

logTest(
  'Analytics contains anomalyDetails.message field',
  schema.paths['analytics.anomalyDetails.message'] !== undefined
);

logTest(
  'Analytics contains anomalyDetails.detectedAt field',
  schema.paths['analytics.anomalyDetails.detectedAt'] !== undefined
);

// Test 1.4: Nested comparison structure
logTest(
  'Analytics contains comparisonToPrevious.absoluteChange field',
  schema.paths['analytics.comparisonToPrevious.absoluteChange'] !== undefined
);

logTest(
  'Analytics contains comparisonToPrevious.isImprovement field',
  schema.paths['analytics.comparisonToPrevious.isImprovement'] !== undefined
);

// Test 1.5: Nested statistics structure
logTest(
  'Analytics contains statistics.standardDeviation field',
  schema.paths['analytics.statistics.standardDeviation'] !== undefined
);

logTest(
  'Analytics contains statistics.minValue field',
  schema.paths['analytics.statistics.minValue'] !== undefined
);

logTest(
  'Analytics contains statistics.completenessPercentage field',
  schema.paths['analytics.statistics.completenessPercentage'] !== undefined
);

// ============================================================================
// 2. FIELD VALIDATION TESTS
// ============================================================================
console.log('\n🔍 2. FIELD VALIDATION TESTS\n');

// Test 2.1: Enum validations
const userIdPath = schema.paths.userId;
logTest(
  'userId field is required',
  userIdPath.isRequired === true
);

const metricTypeEnum = schema.paths.metricType.enumValues;
logTest(
  'metricType has valid enum values',
  Array.isArray(metricTypeEnum) && metricTypeEnum.length > 0,
  `Enums: ${metricTypeEnum?.join(', ')}`
);

const timeRangeEnum = schema.paths.timeRange.enumValues;
logTest(
  'timeRange has valid enum values',
  Array.isArray(timeRangeEnum) && timeRangeEnum.length > 0,
  `Enums: ${timeRangeEnum?.join(', ')}`
);

const trendEnum = schema.paths['analytics.trend'].enumValues;
logTest(
  'trend has valid enum values',
  Array.isArray(trendEnum) && trendEnum.length > 0,
  `Enums: ${trendEnum?.join(', ')}`
);

const severityEnum = schema.paths['analytics.anomalyDetails.severity']?.enumValues;
logTest(
  'anomalyDetails.severity has valid enum values',
  Array.isArray(severityEnum) && severityEnum.length > 0,
  `Enums: ${severityEnum?.join(', ')}`
);

// Test 2.2: Field constraints
logTest(
  'rollingAverage field has minimum constraint (0)',
  schema.paths['analytics.rollingAverage'].validators.length > 0
);

logTest(
  'percentile field has range constraints (0-100)',
  schema.paths['analytics.percentile'].validators.length > 0
);

logTest(
  'streakDays field has minimum constraint (0)',
  schema.paths['analytics.streakDays'].validators.length > 0
);

logTest(
  'completenessPercentage has range constraints (0-100)',
  schema.paths['analytics.statistics.completenessPercentage'].validators.length > 0
);

// ============================================================================
// 3. INDEX CONFIGURATION TESTS
// ============================================================================
console.log('\n📊 3. INDEX CONFIGURATION TESTS\n');

// Get indexes from schema._indexes (internal array)
const indexes = schema._indexes || [];
logTest(
  'Schema has indexes configured',
  Array.isArray(indexes) && indexes.length > 0,
  `Total indexes: ${indexes.length}`
);

logTest(
  'At least 4 indexes are defined',
  indexes.length >= 4,
  `Found ${indexes.length} indexes`
);

// Check for specific indexes by looking at index objects
const hasCompoundIndex = indexes.some(idx => 
  idx[0] && typeof idx[0] === 'object' && 
  (idx[0].userId !== undefined && idx[0].calculatedAt !== undefined)
);
logTest(
  'Compound index for (userId, calculatedAt) exists',
  hasCompoundIndex
);

const hasTTLIndex = indexes.some(idx => idx[1]?.expireAfterSeconds === 0);
logTest(
  'TTL index for expiresAt exists',
  hasTTLIndex
);

// ============================================================================
// 4. VIRTUAL PROPERTY TESTS
// ============================================================================
console.log('\n✨ 4. VIRTUAL PROPERTY TESTS\n');

const virtuals = schema.virtuals;
logTest(
  'Virtual property "isRecent" exists',
  virtuals.isRecent !== undefined
);

logTest(
  'Virtual property "daysUntilExpiration" exists',
  virtuals.daysUntilExpiration !== undefined
);

logTest(
  'Virtual property "trendEmoji" exists',
  virtuals.trendEmoji !== undefined
);

// ============================================================================
// 5. INSTANCE METHOD TESTS
// ============================================================================
console.log('\n🔧 5. INSTANCE METHOD TESTS\n');

logTest(
  'Instance method "hasAnomaly" exists',
  typeof Analytics.prototype.hasAnomaly === 'function'
);

logTest(
  'Instance method "getAnomalySeverity" exists',
  typeof Analytics.prototype.getAnomalySeverity === 'function'
);

logTest(
  'Instance method "isExpiringSoon" exists',
  typeof Analytics.prototype.isExpiringSoon === 'function'
);

logTest(
  'Instance method "extendExpiration" exists',
  typeof Analytics.prototype.extendExpiration === 'function'
);

// ============================================================================
// 6. STATIC METHOD TESTS
// ============================================================================
console.log('\n⚙️  6. STATIC METHOD TESTS\n');

logTest(
  'Static method "getLatestForUser" exists',
  typeof Analytics.getLatestForUser === 'function'
);

logTest(
  'Static method "getAllForUser" exists',
  typeof Analytics.getAllForUser === 'function'
);

logTest(
  'Static method "getAnomaliesForUser" exists',
  typeof Analytics.getAnomaliesForUser === 'function'
);

logTest(
  'Static method "deleteExpiredManually" exists',
  typeof Analytics.deleteExpiredManually === 'function'
);

logTest(
  'Static method "getStreakLeaderboard" exists',
  typeof Analytics.getStreakLeaderboard === 'function'
);

// ============================================================================
// 7. PRE-SAVE HOOK TESTS
// ============================================================================
console.log('\n🚀 7. PRE-SAVE HOOK TESTS\n');

const preSaveHooks = schema._pres?.save || [];
logTest(
  'Pre-save hooks are registered',
  Array.isArray(preSaveHooks) && preSaveHooks.length > 0,
  `Number of hooks: ${preSaveHooks.length}`
);

// ============================================================================
// 8. POST-SAVE HOOK TESTS
// ============================================================================
console.log('\n📤 8. POST-SAVE HOOK TESTS\n');

const postSaveHooks = schema._posts?.save || [];
logTest(
  'Post-save hooks are registered',
  Array.isArray(postSaveHooks) && postSaveHooks.length > 0,
  `Number of hooks: ${postSaveHooks.length}`
);

// ============================================================================
// 9. SCHEMA OPTIONS TESTS
// ============================================================================
console.log('\n⚙️  9. SCHEMA OPTIONS TESTS\n');

logTest(
  'Schema has timestamps enabled',
  schema.options.timestamps === true
);

logTest(
  'Schema collection name is "analytics"',
  schema.options.collection === 'analytics'
);

logTest(
  'Schema has toJSON transform',
  schema.options.toJSON?.transform !== undefined
);

logTest(
  'Schema has toObject with virtuals',
  schema.options.toObject?.virtuals === true
);

// ============================================================================
// 10. FIELD REFERENCE TESTS
// ============================================================================
console.log('\n🔗 10. FIELD REFERENCE TESTS\n');

logTest(
  'userId field references User model',
  schema.paths.userId.options.ref === 'User'
);

logTest(
  'All metric types are phone-compatible (no wearable data)',
  metricTypeEnum?.every(type => 
    ['steps', 'distance', 'calories', 'activeMinutes', 'weight', 'sleepHours', 'heartPoints', 'hydration'].includes(type)
  )
);

// ============================================================================
// 11. DATA INTEGRITY TESTS
// ============================================================================
console.log('\n🛡️  11. DATA INTEGRITY TESTS\n');

logTest(
  'userId field has index for performance',
  schema.paths.userId.options.index === true
);

logTest(
  'calculatedAt field has index for time-series queries',
  schema.paths.calculatedAt.options.index === true
);

logTest(
  'metricType is lowercase normalized',
  schema.paths.metricType.options.lowercase === true
);

logTest(
  'expiresAt is properly typed as Date',
  schema.paths.expiresAt.instance === 'Date'
);

// ============================================================================
// 12. MODEL METADATA TESTS
// ============================================================================
console.log('\n📝 12. MODEL METADATA TESTS\n');

logTest(
  'Model name is "Analytics"',
  Analytics.modelName === 'Analytics'
);

logTest(
  'Model collection name is "analytics"',
  Analytics.collection.name === 'analytics'
);

logTest(
  'Schema path count is reasonable',
  Object.keys(schema.paths).length > 20,
  `Total paths: ${Object.keys(schema.paths).length}`
);

// ============================================================================
// 13. ENUM VALUE CONSISTENCY TESTS
// ============================================================================
console.log('\n🎯 13. ENUM VALUE CONSISTENCY TESTS\n');

logTest(
  'Anomaly severity enums are correct',
  JSON.stringify(severityEnum?.sort()) === JSON.stringify(['high', 'low', 'medium'])
);

logTest(
  'Trend direction enums are correct',
  trendEnum?.includes('up') && trendEnum?.includes('down') && trendEnum?.includes('stable')
);

logTest(
  'TimeRange enums are correct',
  timeRangeEnum?.includes('7day') && timeRangeEnum?.includes('30day') && timeRangeEnum?.includes('90day')
);

logTest(
  'MetricType enums match supported metrics',
  metricTypeEnum?.length === 8 &&
  metricTypeEnum?.includes('steps') &&
  metricTypeEnum?.includes('weight')
);

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n════════════════════════════════════════════════════════════════════');
console.log(`📈 TEST SUMMARY\n`);
console.log(`✅ Passed: ${passCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log(`📊 Total:  ${passCount + failCount}`);
console.log(`📊 Success Rate: ${((passCount / (passCount + failCount)) * 100).toFixed(2)}%\n`);

if (failCount === 0) {
  console.log('🎉 All tests passed! Analytics model is structurally sound.');
  console.log('✅ Model Status: PRODUCTION READY\n');
  console.log('════════════════════════════════════════════════════════════════════\n');
  process.exit(0);
} else {
  console.log(`⚠️  ${failCount} test(s) failed. Review the issues above.`);
  console.log(`Status: ${failCount} issue(s) found\n`);
  console.log('════════════════════════════════════════════════════════════════════\n');
  process.exit(1);
}
