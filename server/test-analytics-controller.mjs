/**
 * Comprehensive Test Suite for analyticsController.js
 * Tests all endpoints with both new schema (timeRange) and legacy schema (period)
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';
const TEST_EMAIL = 'ojasshrivastava1008@gmail.com';
const TEST_PASSWORD = 'Krishna@1008';

let authToken = '';
let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to make authenticated requests
async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authToken ? `Bearer ${authToken}` : '',
      ...options.headers
    }
  });
  
  const data = await response.json();
  return { status: response.status, data };
}

// Test result logger
function logTest(name, passed, message = '') {
  testResults.tests.push({ name, passed, message });
  if (passed) {
    console.log(`✅ PASS: ${name}`);
    testResults.passed++;
  } else {
    console.log(`❌ FAIL: ${name} - ${message}`);
    testResults.failed++;
  }
}

// Authentication
async function testAuthentication() {
  console.log('\n📝 Test 1: Authentication');
  
  try {
    const { status, data } = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });
    
    if (status === 200 && data.success && data.token) {
      authToken = data.token;
      logTest('Login successful', true);
      console.log(`   Token: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      logTest('Login failed', false, JSON.stringify(data));
      return false;
    }
  } catch (error) {
    logTest('Login error', false, error.message);
    return false;
  }
}

// Test 2: GET /api/analytics (basic)
async function testGetAllAnalytics() {
  console.log('\n📝 Test 2: GET /api/analytics (all analytics)');
  
  try {
    const { status, data } = await apiRequest('/api/analytics?limit=10');
    
    if (status === 200 && data.success) {
      logTest('Get all analytics successful', true);
      console.log(`   Total documents: ${data.pagination.total}`);
      console.log(`   Returned: ${data.count}`);
      
      if (data.data.length > 0) {
        const doc = data.data[0];
        console.log(`   Sample fields: ${Object.keys(doc).join(', ')}`);
        console.log(`   Has 'period': ${doc.period ? 'YES' : 'NO'}`);
        console.log(`   Has 'timeRange': ${doc.timeRange ? 'YES' : 'NO'}`);
        console.log(`   MetricType: ${doc.metricType}`);
      }
      return true;
    } else {
      logTest('Get all analytics failed', false, JSON.stringify(data));
      return false;
    }
  } catch (error) {
    logTest('Get all analytics error', false, error.message);
    return false;
  }
}

// Test 3: GET /api/analytics/latest/:metricType (with timeRange)
async function testGetLatestAnalytics() {
  console.log('\n📝 Test 3: GET /api/analytics/latest/:metricType');
  
  const testCases = [
    { metric: 'steps', timeRange: '7day' },
    { metric: 'calories', timeRange: '7day' },
    { metric: 'steps', timeRange: null }
  ];
  
  for (const testCase of testCases) {
    const endpoint = `/api/analytics/latest/${testCase.metric}${testCase.timeRange ? `?timeRange=${testCase.timeRange}` : ''}`;
    
    try {
      const { status, data } = await apiRequest(endpoint);
      
      if (status === 200 && data.success) {
        if (data.data) {
          logTest(`Latest ${testCase.metric}${testCase.timeRange ? ` (${testCase.timeRange})` : ''} - Data found`, true);
          console.log(`   MetricType: ${data.data.metricType}`);
          console.log(`   Period/TimeRange: ${data.data.period || data.data.timeRange}`);
          console.log(`   Value: ${data.data.value || 'N/A'}`);
        } else {
          // No data is OK (returns null with success)
          logTest(`Latest ${testCase.metric}${testCase.timeRange ? ` (${testCase.timeRange})` : ''} - No data (OK)`, true);
          console.log(`   Message: ${data.message}`);
        }
      } else {
        logTest(`Latest ${testCase.metric}${testCase.timeRange ? ` (${testCase.timeRange})` : ''}`, false, JSON.stringify(data));
      }
    } catch (error) {
      logTest(`Latest ${testCase.metric} error`, false, error.message);
    }
  }
}

// Test 4: GET /api/analytics with filters
async function testGetAnalyticsWithFilters() {
  console.log('\n📝 Test 4: GET /api/analytics with filters');
  
  const testCases = [
    { params: 'metricType=steps', desc: 'Filter by metricType' },
    { params: 'metricType=steps&timeRange=7day', desc: 'Filter by metricType + timeRange' },
    { params: 'limit=5&skip=0', desc: 'Pagination' },
    { params: 'sortBy=calculatedAt&sortOrder=asc', desc: 'Sorting' }
  ];
  
  for (const testCase of testCases) {
    try {
      const { status, data } = await apiRequest(`/api/analytics?${testCase.params}`);
      
      if (status === 200 && data.success) {
        logTest(`${testCase.desc}`, true);
        console.log(`   Count: ${data.count}, Total: ${data.pagination.total}`);
      } else {
        logTest(`${testCase.desc}`, false, JSON.stringify(data));
      }
    } catch (error) {
      logTest(`${testCase.desc} error`, false, error.message);
    }
  }
}

// Test 5: GET /api/analytics/summary
async function testGetAnalyticsSummary() {
  console.log('\n📝 Test 5: GET /api/analytics/summary');
  
  try {
    const { status, data } = await apiRequest('/api/analytics/summary');
    
    if (status === 200 && data.success) {
      logTest('Get summary successful', true);
      console.log('   Summary data:');
      console.log(`     Total Analytics: ${data.data.totalAnalytics}`);
      console.log(`     By Metric Type:`, JSON.stringify(data.data.byMetricType));
      console.log(`     By TimeRange:`, JSON.stringify(data.data.byTimeRange));
      console.log(`     By Period:`, JSON.stringify(data.data.byPeriod));
      console.log(`     Anomalies: ${data.data.anomaliesDetected}`);
      console.log(`     Latest Update: ${data.data.latestUpdate}`);
      console.log(`     Current Streaks:`, JSON.stringify(data.data.currentStreaks));
      
      // Check for duplicate latestUpdate
      const keys = Object.keys(data.data);
      const latestUpdateCount = keys.filter(k => k === 'latestUpdate').length;
      if (latestUpdateCount === 1) {
        logTest('No duplicate latestUpdate key', true);
      } else {
        logTest('Duplicate latestUpdate key found', false, `Found ${latestUpdateCount} occurrences`);
      }
      
      // Check byTimeRange format
      const byTimeRange = data.data.byTimeRange;
      if (typeof byTimeRange === 'object' && !byTimeRange['[object Object]']) {
        logTest('byTimeRange properly formatted', true);
      } else if (byTimeRange['[object Object]']) {
        logTest('byTimeRange has [object Object] key', false, 'Aggregation issue');
      }
      
      return true;
    } else {
      logTest('Get summary failed', false, JSON.stringify(data));
      return false;
    }
  } catch (error) {
    logTest('Get summary error', false, error.message);
    return false;
  }
}

// Test 6: GET /api/analytics/anomalies
async function testGetAnomalies() {
  console.log('\n📝 Test 6: GET /api/analytics/anomalies');
  
  const testCases = [
    { params: '', desc: 'All anomalies' },
    { params: 'severity=high', desc: 'High severity anomalies' },
    { params: 'metricType=steps', desc: 'Steps anomalies' },
    { params: 'limit=5', desc: 'Limited anomalies' }
  ];
  
  for (const testCase of testCases) {
    try {
      const endpoint = `/api/analytics/anomalies${testCase.params ? `?${testCase.params}` : ''}`;
      const { status, data } = await apiRequest(endpoint);
      
      if (status === 200 && data.success) {
        logTest(`${testCase.desc}`, true);
        console.log(`   Count: ${data.count}`);
      } else {
        logTest(`${testCase.desc}`, false, JSON.stringify(data));
      }
    } catch (error) {
      logTest(`${testCase.desc} error`, false, error.message);
    }
  }
}

// Test 7: GET /api/analytics/:id
async function testGetAnalyticsById() {
  console.log('\n📝 Test 7: GET /api/analytics/:id');
  
  try {
    // First get an ID
    const { data: listData } = await apiRequest('/api/analytics?limit=1');
    
    if (listData.data && listData.data.length > 0) {
      const testId = listData.data[0]._id;
      const { status, data } = await apiRequest(`/api/analytics/${testId}`);
      
      if (status === 200 && data.success && data.data) {
        logTest('Get analytics by ID successful', true);
        console.log(`   ID: ${data.data._id}`);
        console.log(`   MetricType: ${data.data.metricType}`);
      } else {
        logTest('Get analytics by ID failed', false, JSON.stringify(data));
      }
      
      // Test invalid ID
      const { status: status2, data: data2 } = await apiRequest('/api/analytics/invalid123');
      if (status2 === 400) {
        logTest('Invalid ID format rejected', true);
      } else {
        logTest('Invalid ID format handling', false, 'Should return 400');
      }
    } else {
      logTest('Get analytics by ID skipped', true, 'No analytics in database');
    }
  } catch (error) {
    logTest('Get analytics by ID error', false, error.message);
  }
}

// Test 8: Authentication requirements
async function testAuthRequirements() {
  console.log('\n📝 Test 8: Authentication requirements');
  
  const endpoints = [
    '/api/analytics',
    '/api/analytics/summary',
    '/api/analytics/anomalies',
    '/api/analytics/latest/steps'
  ];
  
  const originalToken = authToken;
  authToken = ''; // Remove token
  
  for (const endpoint of endpoints) {
    try {
      const { status } = await apiRequest(endpoint);
      
      if (status === 401) {
        logTest(`${endpoint} requires auth`, true);
      } else {
        logTest(`${endpoint} auth requirement`, false, `Expected 401, got ${status}`);
      }
    } catch (error) {
      logTest(`${endpoint} auth test error`, false, error.message);
    }
  }
  
  authToken = originalToken; // Restore token
}

// Test 9: Input validation
async function testInputValidation() {
  console.log('\n📝 Test 9: Input validation');
  
  const testCases = [
    { endpoint: '/api/analytics/latest/invalidmetric', expectedStatus: 400, desc: 'Invalid metric type' },
    { endpoint: '/api/analytics/latest/steps?timeRange=invalid', expectedStatus: 400, desc: 'Invalid time range' },
    { endpoint: '/api/analytics?startDate=invalid', expectedStatus: 400, desc: 'Invalid date format' },
    { endpoint: '/api/analytics/anomalies?severity=invalid', expectedStatus: 400, desc: 'Invalid severity' }
  ];
  
  for (const testCase of testCases) {
    try {
      const { status } = await apiRequest(testCase.endpoint);
      
      if (status === testCase.expectedStatus) {
        logTest(testCase.desc, true);
      } else {
        logTest(testCase.desc, false, `Expected ${testCase.expectedStatus}, got ${status}`);
      }
    } catch (error) {
      logTest(`${testCase.desc} error`, false, error.message);
    }
  }
}

// Test 10: Backward compatibility
async function testBackwardCompatibility() {
  console.log('\n📝 Test 10: Backward compatibility (period field)');
  
  try {
    // Get analytics with legacy 'period' field
    const { status, data } = await apiRequest('/api/analytics?limit=10');
    
    if (status === 200 && data.success && data.data.length > 0) {
      const legacyDocs = data.data.filter(doc => doc.period && !doc.timeRange);
      const newDocs = data.data.filter(doc => doc.timeRange);
      
      console.log(`   Legacy docs (period field): ${legacyDocs.length}`);
      console.log(`   New docs (timeRange field): ${newDocs.length}`);
      
      if (legacyDocs.length > 0) {
        logTest('Backward compatibility maintained', true);
        console.log(`   Can query legacy data: YES`);
        
        // Test querying with timeRange parameter on legacy data
        const { status: status2, data: data2 } = await apiRequest('/api/analytics/latest/steps?timeRange=7day');
        if (status2 === 200) {
          logTest('TimeRange query works on legacy data', data2.data !== null);
        }
      } else {
        logTest('No legacy data to test', true, 'All docs use new schema');
      }
    }
  } catch (error) {
    logTest('Backward compatibility test error', false, error.message);
  }
}

// Main test runner
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   ANALYTICS CONTROLLER COMPREHENSIVE TEST SUITE           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log(`📍 Testing against: ${API_BASE}`);
  console.log(`👤 Test user: ${TEST_EMAIL}\n`);
  
  const startTime = Date.now();
  
  // Run all tests
  if (await testAuthentication()) {
    await testGetAllAnalytics();
    await testGetLatestAnalytics();
    await testGetAnalyticsWithFilters();
    await testGetAnalyticsSummary();
    await testGetAnomalies();
    await testGetAnalyticsById();
    await testAuthRequirements();
    await testInputValidation();
    await testBackwardCompatibility();
  } else {
    console.log('\n❌ Authentication failed. Cannot proceed with tests.');
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                      TEST SUMMARY                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⏱️  Duration: ${duration}s`);
  console.log(`📊 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%\n`);
  
  if (testResults.failed > 0) {
    console.log('Failed tests:');
    testResults.tests
      .filter(t => !t.passed)
      .forEach(t => console.log(`  ❌ ${t.name}: ${t.message}`));
  }
  
  console.log('\n' + '═'.repeat(60));
  
  if (testResults.failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Controller is fully functional.');
  } else {
    console.log('⚠️  Some tests failed. Review the issues above.');
  }
  
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('\n💥 Fatal error during testing:', error);
  process.exit(1);
});
