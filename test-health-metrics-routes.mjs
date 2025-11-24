#!/usr/bin/env node

/**
 * ================================================
 * HEALTH METRICS ROUTES - COMPREHENSIVE TEST SUITE
 * ================================================
 * 
 * Tests all health metrics endpoints with authentication
 * Validates: structure, validation, SSE integration, error handling
 */

import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
let authToken = null;
let testResults = [];

// Test configuration
const TEST_USER = {
  email: 'ojasshrivastava1008@gmail.com',
  password: 'Krishna@1008',
};

const TEST_DATE = '2025-01-15';
const TEST_METRICS = {
  steps: 8000,
  distance: 5.5,
  calories: 2000,
  activeMinutes: 45,
  weight: 75,
  sleepHours: 7.5,
};

// Utility functions
const logTest = (testName, passed, details = '') => {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  testResults.push({ testName, passed, details });
  console.log(`${status}: ${testName}`);
  if (details) console.log(`   📝 ${details}`);
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================
// PHASE 1: AUTHENTICATION & TOKEN MANAGEMENT
// ============================================

async function testAuthentication() {
  console.log('\n🔐 PHASE 1: AUTHENTICATION');
  console.log('=' .repeat(60));

  try {
    console.log('\n1️⃣  Attempting login...');
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password,
    });

    if (response.data.success && response.data.token) {
      authToken = response.data.token;
      logTest('Login successful', true, `Got token: ${authToken.substring(0, 20)}...`);
      return true;
    }
  } catch (error) {
    const statusCode = error.response?.status;
    
    if (statusCode === 429) {
      logTest('Login rate limited', false, 'Too many login attempts. Waiting 180s...');
      console.log('⏳ Waiting 180 seconds for rate limit to reset...');
      await sleep(180000); // Wait 3 minutes
      return testAuthentication(); // Retry
    }

    logTest('Login failed', false, error.response?.data?.message || error.message);
    return false;
  }
}

// ============================================
// PHASE 2: POST ENDPOINT TESTS
// ============================================

async function testPostMetrics() {
  console.log('\n📝 PHASE 2: POST /api/metrics (Add/Update)');
  console.log('=' .repeat(60));

  if (!authToken) {
    logTest('POST without auth', false, 'No token available');
    return;
  }

  try {
    console.log('\n1️⃣  Test: Valid metrics payload');
    const response = await axios.post(
      `${API_URL}/metrics`,
      {
        date: TEST_DATE,
        metrics: TEST_METRICS,
        source: 'manual',
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    logTest('POST valid metrics', response.data.success, response.data.message);
  } catch (error) {
    logTest('POST valid metrics', false, error.response?.data?.message || error.message);
  }

  try {
    console.log('\n2️⃣  Test: Missing date parameter');
    const response = await axios.post(
      `${API_URL}/metrics`,
      {
        metrics: TEST_METRICS,
      },
      { headers: { Authorization: `Bearer ${authToken}` }, validateStatus: () => true }
    );

    logTest('POST without date returns 400', response.status === 400, `Status: ${response.status}`);
  } catch (error) {
    logTest('POST without date error', false, error.message);
  }

  try {
    console.log('\n3️⃣  Test: Empty metrics object');
    const response = await axios.post(
      `${API_URL}/metrics`,
      {
        date: TEST_DATE,
        metrics: {},
      },
      { headers: { Authorization: `Bearer ${authToken}` }, validateStatus: () => true }
    );

    logTest('POST with empty metrics returns 400', response.status === 400, `Status: ${response.status}`);
  } catch (error) {
    logTest('POST with empty metrics error', false, error.message);
  }

  try {
    console.log('\n4️⃣  Test: Phone-only constraint (wearable rejection)');
    const response = await axios.post(
      `${API_URL}/metrics`,
      {
        date: TEST_DATE,
        metrics: {
          steps: 8000,
          heartRate: 72, // NOT ALLOWED
        },
      },
      { headers: { Authorization: `Bearer ${authToken}` }, validateStatus: () => true }
    );

    const isPhoneOnlyEnforced = response.status === 400 && 
      response.data.message.includes('Phone-only');
    logTest('Phone-only constraint enforced', isPhoneOnlyEnforced, 
      `Status: ${response.status}, Message: ${response.data.message?.substring(0, 50)}`);
  } catch (error) {
    logTest('Phone-only constraint test error', false, error.message);
  }

  try {
    console.log('\n5️⃣  Test: Future date rejection');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    const response = await axios.post(
      `${API_URL}/metrics`,
      {
        date: futureDateStr,
        metrics: { steps: 5000 },
      },
      { headers: { Authorization: `Bearer ${authToken}` }, validateStatus: () => true }
    );

    logTest('Future date rejected', response.status === 400, `Status: ${response.status}`);
  } catch (error) {
    logTest('Future date test error', false, error.message);
  }
}

// ============================================
// PHASE 3: GET ENDPOINT TESTS
// ============================================

async function testGetMetrics() {
  console.log('\n📖 PHASE 3: GET ENDPOINTS');
  console.log('=' .repeat(60));

  if (!authToken) {
    logTest('GET without auth', false, 'No token available');
    return;
  }

  try {
    console.log('\n1️⃣  Test: GET /api/metrics/latest');
    const response = await axios.get(
      `${API_URL}/metrics/latest`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    logTest('GET latest metrics', response.data.success, 
      `Data: ${response.data.data ? JSON.stringify(response.data.data).substring(0, 50) : 'null'}`);
  } catch (error) {
    logTest('GET latest metrics', false, error.response?.data?.message || error.message);
  }

  try {
    console.log('\n2️⃣  Test: GET /api/metrics/:date');
    const response = await axios.get(
      `${API_URL}/metrics/${TEST_DATE}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    logTest('GET metrics by date', response.data.success, 
      `Data found: ${response.data.data ? 'yes' : 'no'}`);
  } catch (error) {
    logTest('GET metrics by date', false, error.response?.data?.message || error.message);
  }

  try {
    console.log('\n3️⃣  Test: GET /api/metrics (with date range)');
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 7);

    const response = await axios.get(
      `${API_URL}/metrics`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        params: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        },
      }
    );

    logTest('GET metrics by date range', response.data.success, 
      `Records: ${response.data.count || 0}`);
  } catch (error) {
    logTest('GET metrics by date range', false, error.response?.data?.message || error.message);
  }

  try {
    console.log('\n4️⃣  Test: GET /api/metrics/summary/:period');
    const response = await axios.get(
      `${API_URL}/metrics/summary/week`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    logTest('GET metrics summary', response.data.success, 
      `Summary: ${JSON.stringify(response.data.data?.summary || {}).substring(0, 50)}`);
  } catch (error) {
    // Summary might not exist if no data
    const isExpectedError = error.response?.status === 404;
    logTest('GET metrics summary', isExpectedError, 
      error.response?.data?.message || error.message);
  }

  try {
    console.log('\n5️⃣  Test: GET /api/metrics (missing date range)');
    const response = await axios.get(
      `${API_URL}/metrics`,
      { headers: { Authorization: `Bearer ${authToken}` }, validateStatus: () => true }
    );

    logTest('GET metrics without date range returns 400', response.status === 400, 
      `Status: ${response.status}`);
  } catch (error) {
    logTest('GET metrics without date range error', false, error.message);
  }
}

// ============================================
// PHASE 4: UPDATE ENDPOINT TESTS
// ============================================

async function testPatchMetrics() {
  console.log('\n✏️  PHASE 4: PATCH /api/metrics/:date (Partial Update)');
  console.log('=' .repeat(60));

  if (!authToken) {
    logTest('PATCH without auth', false, 'No token available');
    return;
  }

  try {
    console.log('\n1️⃣  Test: PATCH with valid data');
    const response = await axios.patch(
      `${API_URL}/metrics/${TEST_DATE}`,
      {
        metrics: {
          steps: 9000,
          distance: 6.0,
        },
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    logTest('PATCH metrics valid update', response.data.success, response.data.message);
  } catch (error) {
    // Expected if no existing metrics for date
    const isExpectedError = error.response?.status === 404;
    logTest('PATCH metrics valid update', isExpectedError, 
      `Status: ${error.response?.status}, Message: ${error.response?.data?.message}`);
  }

  try {
    console.log('\n2️⃣  Test: PATCH with phone-only constraint');
    const response = await axios.patch(
      `${API_URL}/metrics/${TEST_DATE}`,
      {
        metrics: {
          steps: 5000,
          oxygenSaturation: 98, // NOT ALLOWED
        },
      },
      { headers: { Authorization: `Bearer ${authToken}` }, validateStatus: () => true }
    );

    const isPhoneOnlyEnforced = response.status === 400 && 
      response.data.message.includes('Phone-only');
    logTest('PATCH phone-only constraint enforced', isPhoneOnlyEnforced, 
      `Status: ${response.status}`);
  } catch (error) {
    logTest('PATCH phone-only constraint test error', false, error.message);
  }

  try {
    console.log('\n3️⃣  Test: PATCH without metrics object');
    const response = await axios.patch(
      `${API_URL}/metrics/${TEST_DATE}`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` }, validateStatus: () => true }
    );

    logTest('PATCH without metrics returns 400', response.status === 400, 
      `Status: ${response.status}`);
  } catch (error) {
    logTest('PATCH without metrics error', false, error.message);
  }
}

// ============================================
// PHASE 5: DELETE ENDPOINT TESTS
// ============================================

async function testDeleteMetrics() {
  console.log('\n🗑️  PHASE 5: DELETE ENDPOINTS');
  console.log('=' .repeat(60));

  if (!authToken) {
    logTest('DELETE without auth', false, 'No token available');
    return;
  }

  try {
    console.log('\n1️⃣  Test: DELETE /api/metrics/:date');
    const response = await axios.delete(
      `${API_URL}/metrics/${TEST_DATE}`,
      { headers: { Authorization: `Bearer ${authToken}` }, validateStatus: () => true }
    );

    const isSuccess = response.status === 200 || response.status === 404;
    logTest('DELETE metrics by date', isSuccess, 
      `Status: ${response.status}, Message: ${response.data?.message || 'N/A'}`);
  } catch (error) {
    logTest('DELETE metrics by date error', false, error.message);
  }
}

// ============================================
// PHASE 6: AUTHENTICATION ENFORCEMENT
// ============================================

async function testAuthEnforcement() {
  console.log('\n🔒 PHASE 6: AUTHENTICATION ENFORCEMENT');
  console.log('=' .repeat(60));

  try {
    console.log('\n1️⃣  Test: POST without token');
    const response = await axios.post(
      `${API_URL}/metrics`,
      { date: TEST_DATE, metrics: TEST_METRICS },
      { validateStatus: () => true }
    );

    logTest('POST without auth returns 401', response.status === 401, 
      `Status: ${response.status}`);
  } catch (error) {
    logTest('POST without auth error', false, error.message);
  }

  try {
    console.log('\n2️⃣  Test: GET without token');
    const response = await axios.get(
      `${API_URL}/metrics/latest`,
      { validateStatus: () => true }
    );

    logTest('GET without auth returns 401', response.status === 401, 
      `Status: ${response.status}`);
  } catch (error) {
    logTest('GET without auth error', false, error.message);
  }

  try {
    console.log('\n3️⃣  Test: Invalid token');
    const response = await axios.get(
      `${API_URL}/metrics/latest`,
      {
        headers: { Authorization: 'Bearer invalid_token_xyz' },
        validateStatus: () => true,
      }
    );

    logTest('Invalid token returns 401', response.status === 401, 
      `Status: ${response.status}`);
  } catch (error) {
    logTest('Invalid token error', false, error.message);
  }
}

// ============================================
// PHASE 7: VALIDATION TESTING
// ============================================

async function testValidation() {
  console.log('\n✔️  PHASE 7: INPUT VALIDATION');
  console.log('=' .repeat(60));

  if (!authToken) {
    logTest('Validation tests', false, 'No token available');
    return;
  }

  try {
    console.log('\n1️⃣  Test: Invalid date format');
    const response = await axios.post(
      `${API_URL}/metrics`,
      {
        date: 'invalid-date',
        metrics: { steps: 5000 },
      },
      { headers: { Authorization: `Bearer ${authToken}` }, validateStatus: () => true }
    );

    logTest('Invalid date format rejected', response.status === 400, 
      `Status: ${response.status}`);
  } catch (error) {
    logTest('Invalid date format test error', false, error.message);
  }

  try {
    console.log('\n2️⃣  Test: Non-numeric metric values');
    const response = await axios.post(
      `${API_URL}/metrics`,
      {
        date: TEST_DATE,
        metrics: { steps: 'not-a-number' },
      },
      { headers: { Authorization: `Bearer ${authToken}` }, validateStatus: () => true }
    );

    logTest('Non-numeric metrics rejected', response.status === 400, 
      `Status: ${response.status}`);
  } catch (error) {
    logTest('Non-numeric metrics test error', false, error.message);
  }

  try {
    console.log('\n3️⃣  Test: Negative metric values');
    const response = await axios.post(
      `${API_URL}/metrics`,
      {
        date: TEST_DATE,
        metrics: { steps: -5000 },
      },
      { headers: { Authorization: `Bearer ${authToken}` }, validateStatus: () => true }
    );

    logTest('Negative metrics rejected', response.status === 400, 
      `Status: ${response.status}`);
  } catch (error) {
    logTest('Negative metrics test error', false, error.message);
  }
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function runTests() {
  console.log('\n' + '=' .repeat(60));
  console.log('🧪 HEALTH METRICS ROUTES - COMPREHENSIVE TEST SUITE');
  console.log('=' .repeat(60));
  console.log(`📅 Test Date: ${new Date().toISOString()}`);
  console.log(`🎯 Target: healthMetricsRoutes.js + Controller Integration`);

  try {
    // Phase 1: Auth
    const authSuccess = await testAuthentication();
    if (!authSuccess) {
      console.log('\n❌ Authentication failed. Exiting tests.');
      process.exit(1);
    }

    // Remaining phases
    await testPostMetrics();
    await testGetMetrics();
    await testPatchMetrics();
    await testDeleteMetrics();
    await testAuthEnforcement();
    await testValidation();

    // Summary
    const passed = testResults.filter(r => r.passed).length;
    const failed = testResults.filter(r => !r.passed).length;
    const total = testResults.length;

    console.log('\n' + '=' .repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('=' .repeat(60));
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${failed}/${total}`);
    console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      testResults
        .filter(r => !r.passed)
        .forEach(r => console.log(`   - ${r.testName}: ${r.details}`));
    }

    console.log('\n' + '=' .repeat(60));
    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Test suite error:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests();
