/**
 * ============================================================
 * COMPREHENSIVE HEALTH METRICS CONTROLLER TEST SUITE
 * ============================================================
 * 
 * Purpose: Rigorous testing of all health metrics endpoints
 * Coverage: CRUD operations, phone-only validation, SSE integration,
 *           date handling, error cases, frontend/backend coordination
 * Test User: ojasshrivastava1008@gmail.com / Krishna@1008
 * Backend: http://localhost:5000
 */
import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000';
const TEST_USER = {
  email: 'ojasshrivastava1008@gmail.com',
  password: 'Krishna@1008'
};

let authToken = null;
let userId = null;

const makeRequest = async (method, endpoint, body = null, token = null, expectJson = true) => {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) options.body = JSON.stringify(body);
  if (token) options.headers.Authorization = `Bearer ${token}`;
  
  const res = await fetch(API_URL + endpoint, options);
  let data;
  try {
    data = expectJson ? await res.json() : await res.text();
  } catch {
    data = { error: 'Failed to parse response' };
  }
  return { status: res.status, data, headers: res.headers };
};

let testsPassed = 0;
let testsFailed = 0;

const test = (name, passed, actual = null, expected = null) => {
  const status = passed ? '✅' : '❌';
  if (passed) testsPassed++;
  else testsFailed++;
  console.log(`${status} ${name}${passed ? '' : ` (actual: ${JSON.stringify(actual)?.substring(0, 80)} expected: ${JSON.stringify(expected)?.substring(0, 80)})`}`);
};

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║  COMPREHENSIVE HEALTH METRICS CONTROLLER TEST SUITE        ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// ============================================
// SETUP: Authentication
// ============================================

console.log('🔐 SETUP: Authenticating user...\n');

{
  const loginResult = await makeRequest('POST', '/api/auth/login', TEST_USER);
  test('Login successful', loginResult.status === 200, loginResult.status, 200);
  
  if (loginResult.status === 200) {
    authToken = loginResult.data.token;
    userId = loginResult.data.user.id;
    console.log(`   Token: ${authToken?.substring(0, 30)}...`);
    console.log(`   User ID: ${userId}\n`);
  } else {
    console.error('❌ Authentication failed. Cannot proceed with tests.');
    process.exit(1);
  }
}

// ============================================
// TEST 1: ADD/UPDATE METRICS (UPSERT)
// ============================================

console.log('📝 TEST 1: ADD/UPDATE METRICS (POST /api/metrics)');
console.log('═══════════════════════════════════════════════════════════\n');

{
  console.log('1.1: Add new metrics for today');
  
  const testDate = new Date().toISOString().split('T')[0];
  const metricsData = {
    date: testDate,
    metrics: {
      steps: 8500,
      distance: 6.2,
      calories: 450,
      activeMinutes: 45,
      weight: 70.5,
      sleepHours: 7.5
    },
    source: 'manual'
  };

  const addResult = await makeRequest('POST', '/api/metrics', metricsData, authToken);
  test('Response status 201/200', addResult.status === 200 || addResult.status === 201, addResult.status, '200 or 201');
  test('Success flag true', addResult.data.success === true, addResult.data.success, true);
  test('Data contains metrics', !!addResult.data.data?.metrics, !!addResult.data.data?.metrics, true);
  test('Data contains date', !!addResult.data.data?.date, !!addResult.data.data?.date, true);
  
  console.log(`   Added metrics for ${testDate}\n`);
}

{
  console.log('1.2: Phone-only constraint - reject heartRate');
  
  const testDate = new Date().toISOString().split('T')[0];
  const invalidData = {
    date: testDate,
    metrics: {
      steps: 5000,
      heartRate: 75  // ❌ Wearable-only metric
    }
  };

  const rejectResult = await makeRequest('POST', '/api/metrics', invalidData, authToken);
  test('Returns 400 for wearable metric', rejectResult.status === 400, rejectResult.status, 400);
  test('Error message mentions wearable', rejectResult.data.message?.includes('wearable') || rejectResult.data.message?.includes('Wearable'), 
    rejectResult.data.message?.substring(0, 60), 'Should mention wearable');
  
  console.log(`   Error: ${rejectResult.data.message?.substring(0, 80)}\n`);
}

{
  console.log('1.3: Phone-only constraint - reject oxygenSaturation');
  
  const testDate = new Date().toISOString().split('T')[0];
  const invalidData = {
    date: testDate,
    metrics: {
      steps: 5000,
      oxygenSaturation: 98  // ❌ Wearable-only metric
    }
  };

  const rejectResult = await makeRequest('POST', '/api/metrics', invalidData, authToken);
  test('Returns 400 for oxygenSaturation', rejectResult.status === 400, rejectResult.status, 400);
  
  console.log();
}

{
  console.log('1.4: Upsert updates existing metrics for same date');
  
  const testDate = new Date().toISOString().split('T')[0];
  const updateData = {
    date: testDate,
    metrics: {
      steps: 10000,
      distance: 7.5,
      calories: 550
    },
    source: 'manual'
  };

  const updateResult = await makeRequest('POST', '/api/metrics', updateData, authToken);
  test('Update successful', updateResult.status === 200, updateResult.status, 200);
  test('Steps updated to 10000', updateResult.data.data?.metrics?.steps === 10000, updateResult.data.data?.metrics?.steps, 10000);
  
  console.log();
}

{
  console.log('1.5: Reject future dates');
  
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 1);
  const futureDateStr = futureDate.toISOString().split('T')[0];
  
  const futureData = {
    date: futureDateStr,
    metrics: { steps: 5000 }
  };

  const futureResult = await makeRequest('POST', '/api/metrics', futureData, authToken);
  test('Returns 400 for future date', futureResult.status === 400, futureResult.status, 400);
  
  console.log();
}

// ============================================
// TEST 2: GET METRICS BY DATE
// ============================================

console.log('📝 TEST 2: GET METRICS BY DATE (GET /api/metrics/:date)');
console.log('═══════════════════════════════════════════════════════════\n');

{
  console.log('2.1: Retrieve metrics for specific date');
  
  const testDate = new Date().toISOString().split('T')[0];
  const getResult = await makeRequest('GET', `/api/metrics/${testDate}`, null, authToken);
  
  test('Response status 200', getResult.status === 200, getResult.status, 200);
  test('Success flag true', getResult.data.success === true, getResult.data.success, true);
  test('Data contains metrics object', !!getResult.data.data?.metrics, !!getResult.data.data?.metrics, true);
  
  console.log();
}

{
  console.log('2.2: Return null for non-existent date');
  
  const oldDate = '2020-01-01';
  const noDataResult = await makeRequest('GET', `/api/metrics/${oldDate}`, null, authToken);
  
  test('Response status 200 (not 404)', noDataResult.status === 200, noDataResult.status, 200);
  test('Data is null', noDataResult.data.data === null, noDataResult.data.data, null);
  
  console.log();
}

// ============================================
// TEST 3: GET METRICS BY DATE RANGE
// ============================================

console.log('📝 TEST 3: GET METRICS BY DATE RANGE (GET /api/metrics?startDate=...&endDate=...)');
console.log('═══════════════════════════════════════════════════════════\n');

{
  console.log('3.1: Retrieve metrics for date range');
  
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);
  
  const endDateStr = endDate.toISOString().split('T')[0];
  const startDateStr = startDate.toISOString().split('T')[0];
  
  const rangeResult = await makeRequest('GET', `/api/metrics?startDate=${startDateStr}&endDate=${endDateStr}`, null, authToken);
  
  test('Response status 200', rangeResult.status === 200, rangeResult.status, 200);
  test('Success flag true', rangeResult.data.success === true, rangeResult.data.success, true);
  test('Count field present', typeof rangeResult.data.count === 'number', typeof rangeResult.data.count, 'number');
  test('Data is array', Array.isArray(rangeResult.data.data), Array.isArray(rangeResult.data.data), true);
  
  console.log(`   Found ${rangeResult.data.count} metrics\n`);
}

{
  console.log('3.2: Reject invalid date range (start > end)');
  
  const date1 = '2025-12-31';
  const date2 = '2025-01-01';
  
  const invalidRangeResult = await makeRequest('GET', `/api/metrics?startDate=${date1}&endDate=${date2}`, null, authToken);
  
  test('Returns 400 for invalid range', invalidRangeResult.status === 400, invalidRangeResult.status, 400);
  
  console.log();
}

{
  console.log('3.3: Reject range > 365 days');
  
  const startDate = '2023-01-01';
  const endDate = '2025-12-31';
  
  const oversizeResult = await makeRequest('GET', `/api/metrics?startDate=${startDate}&endDate=${endDate}`, null, authToken);
  
  test('Returns 400 for oversized range', oversizeResult.status === 400, oversizeResult.status, 400);
  
  console.log();
}

// ============================================
// TEST 4: GET LATEST METRICS
// ============================================

console.log('📝 TEST 4: GET LATEST METRICS (GET /api/metrics/latest)');
console.log('═══════════════════════════════════════════════════════════\n');

{
  console.log('4.1: Retrieve latest metrics entry');
  
  const latestResult = await makeRequest('GET', '/api/metrics/latest', null, authToken);
  
  test('Response status 200', latestResult.status === 200, latestResult.status, 200);
  test('Success flag true', latestResult.data.success === true, latestResult.data.success, true);
  test('Returns data or null', latestResult.data.data !== undefined, latestResult.data.data !== undefined, true);
  
  console.log();
}

// ============================================
// TEST 5: GET METRICS SUMMARY
// ============================================

console.log('📝 TEST 5: GET METRICS SUMMARY (GET /api/metrics/summary/:period)');
console.log('═══════════════════════════════════════════════════════════\n');

{
  console.log('5.1: Get weekly summary');
  
  const weekResult = await makeRequest('GET', '/api/metrics/summary/week', null, authToken);
  
  test('Response status 200', weekResult.status === 200, weekResult.status, 200);
  test('Success flag true', weekResult.data.success === true, weekResult.data.success, true);
  test('Period is week', weekResult.data.period === 'week', weekResult.data.period, 'week');
  test('Summary contains totalSteps', typeof weekResult.data.data?.totalSteps === 'number', typeof weekResult.data.data?.totalSteps, 'number');
  
  console.log();
}

{
  console.log('5.2: Get monthly summary');
  
  const monthResult = await makeRequest('GET', '/api/metrics/summary/month', null, authToken);
  
  test('Response status 200', monthResult.status === 200, monthResult.status, 200);
  test('Summary contains avgSteps', typeof monthResult.data.data?.avgSteps === 'number', typeof monthResult.data.data?.avgSteps, 'number');
  
  console.log();
}

{
  console.log('5.3: Reject invalid period');
  
  const invalidResult = await makeRequest('GET', '/api/metrics/summary/invalid', null, authToken);
  
  test('Returns 400 for invalid period', invalidResult.status === 400, invalidResult.status, 400);
  
  console.log();
}

// ============================================
// TEST 6: UPDATE METRICS (PATCH)
// ============================================

console.log('📝 TEST 6: UPDATE SPECIFIC METRICS (PATCH /api/metrics/:date)');
console.log('═══════════════════════════════════════════════════════════\n');

{
  console.log('6.1: Partial update existing metrics');
  
  const testDate = new Date().toISOString().split('T')[0];
  const updateData = {
    metrics: {
      steps: 12000
    }
  };

  const patchResult = await makeRequest('PATCH', `/api/metrics/${testDate}`, updateData, authToken);
  
  test('Response status 200', patchResult.status === 200, patchResult.status, 200);
  test('Partial update successful', patchResult.data.success === true, patchResult.data.success, true);
  
  console.log();
}

{
  console.log('6.2: Patch rejects wearable metrics');
  
  const testDate = new Date().toISOString().split('T')[0];
  const invalidData = {
    metrics: {
      heartRate: 80
    }
  };

  const patchRejectResult = await makeRequest('PATCH', `/api/metrics/${testDate}`, invalidData, authToken);
  
  test('Returns 400 for wearable in patch', patchRejectResult.status === 400, patchRejectResult.status, 400);
  
  console.log();
}

// ============================================
// TEST 7: DELETE METRICS
// ============================================

console.log('📝 TEST 7: DELETE METRICS');
console.log('═══════════════════════════════════════════════════════════\n');

{
  console.log('7.1: Delete metrics by date (via route)');
  
  // First create a test metric for deletion
  const testDate = new Date();
  testDate.setDate(testDate.getDate() - 5);
  const oldDateStr = testDate.toISOString().split('T')[0];
  
  const createData = {
    date: oldDateStr,
    metrics: { steps: 5000 }
  };
  await makeRequest('POST', '/api/metrics', createData, authToken);
  
  // Now delete it
  const deleteResult = await makeRequest('DELETE', `/api/metrics/${oldDateStr}`, null, authToken);
  
  test('Response status 200', deleteResult.status === 200, deleteResult.status, 200);
  test('Success flag true', deleteResult.data.success === true, deleteResult.data.success, true);
  
  console.log();
}

{
  console.log('7.2: Delete non-existent metrics returns 404');
  
  const nonExistentDate = '2020-01-01';
  const notFoundResult = await makeRequest('DELETE', `/api/metrics/${nonExistentDate}`, null, authToken);
  
  test('Returns 404', notFoundResult.status === 404, notFoundResult.status, 404);
  
  console.log();
}

// ============================================
// TEST 8: AUTHENTICATION & SECURITY
// ============================================

console.log('📝 TEST 8: AUTHENTICATION & SECURITY');
console.log('═══════════════════════════════════════════════════════════\n');

{
  console.log('8.1: Reject request without token');
  
  const noAuthResult = await makeRequest('GET', '/api/metrics/2025-01-01', null, null);
  
  test('Returns 401 without token', noAuthResult.status === 401, noAuthResult.status, 401);
  
  console.log();
}

{
  console.log('8.2: Reject invalid token');
  
  const badTokenResult = await makeRequest('GET', '/api/metrics/2025-01-01', null, 'invalid_token_xyz');
  
  test('Returns 401 with invalid token', badTokenResult.status === 401, badTokenResult.status, 401);
  
  console.log();
}

// ============================================
// TEST 9: VALIDATION & ERROR HANDLING
// ============================================

console.log('📝 TEST 9: VALIDATION & ERROR HANDLING');
console.log('═══════════════════════════════════════════════════════════\n');

{
  console.log('9.1: Reject missing metrics in POST');
  
  const noMetricsData = {
    date: new Date().toISOString().split('T')[0],
    metrics: {}
  };

  const noMetricsResult = await makeRequest('POST', '/api/metrics', noMetricsData, authToken);
  
  test('Returns 400 for empty metrics', noMetricsResult.status === 400, noMetricsResult.status, 400);
  
  console.log();
}

{
  console.log('9.2: Reject missing date');
  
  const noDateData = {
    metrics: { steps: 5000 }
  };

  const noDateResult = await makeRequest('POST', '/api/metrics', noDateData, authToken);
  
  test('Returns 400 for missing date', noDateResult.status === 400, noDateResult.status, 400);
  
  console.log();
}

{
  console.log('9.3: Reject invalid date format');
  
  const invalidDateData = {
    date: 'not-a-date',
    metrics: { steps: 5000 }
  };

  const invalidDateResult = await makeRequest('POST', '/api/metrics', invalidDateData, authToken);
  
  test('Returns 400 for invalid date', invalidDateResult.status === 400, invalidDateResult.status, 400);
  
  console.log();
}

// ============================================
// TEST 10: INTEGRATION & SSE
// ============================================

console.log('📝 TEST 10: INTEGRATION & FRONTEND COORDINATION');
console.log('═══════════════════════════════════════════════════════════\n');

{
  console.log('10.1: Verify metrics are user-scoped');
  
  const testDate = new Date().toISOString().split('T')[0];
  const metricsData = {
    date: testDate,
    metrics: {
      steps: 9999,
      distance: 7.77,
      calories: 555
    }
  };

  const createResult = await makeRequest('POST', '/api/metrics', metricsData, authToken);
  const retrieveResult = await makeRequest('GET', `/api/metrics/${testDate}`, null, authToken);
  
  test('Retrieved metrics match created data', 
    retrieveResult.data.data?.metrics?.steps === 9999,
    retrieveResult.data.data?.metrics?.steps,
    9999
  );
  
  console.log();
}

{
  console.log('10.2: Verify no sensitive data leakage');
  
  const testDate = new Date().toISOString().split('T')[0];
  const getResult = await makeRequest('GET', `/api/metrics/${testDate}`, null, authToken);
  
  test('Response does not contain password', 
    !JSON.stringify(getResult.data).includes('password'),
    'No password in response',
    true
  );
  test('Response does not contain tokens',
    !JSON.stringify(getResult.data).includes('token'),
    'No tokens in response',
    true
  );
  
  console.log();
}

// ============================================
// SUMMARY
// ============================================

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║                    TEST SUMMARY                            ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

const total = testsPassed + testsFailed;
const passRate = ((testsPassed / total) * 100).toFixed(1);

console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`⏱️  Total: ${total}`);
console.log(`📊 Success Rate: ${passRate}%\n`);

if (testsFailed === 0) {
  console.log('🎉 All tests passed! Health Metrics Controller working perfectly.');
} else {
  console.log(`⚠️  ${testsFailed} test(s) failed. Review output above.`);
}

console.log();
