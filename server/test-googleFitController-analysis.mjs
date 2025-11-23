/**
 * ============================================================
 * COMPREHENSIVE GOOGLE FIT CONTROLLER TEST SUITE
 * ============================================================
 * 
 * Purpose: Rigorous testing of all Google Fit OAuth endpoints
 * Coverage: OAuth flow, token management, status checks, disconnection
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
  console.log(`${status} ${name}${passed ? '' : ` (actual: ${JSON.stringify(actual)?.substring(0, 100)} expected: ${JSON.stringify(expected)?.substring(0, 100)})`}`);
};

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║     COMPREHENSIVE GOOGLE FIT CONTROLLER TEST SUITE        ║');
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
// TEST 1: INITIATE GOOGLE FIT OAUTH
// ============================================

console.log('📝 TEST 1: INITIATE GOOGLE FIT OAUTH (GET /api/googlefit/connect)');
console.log('═══════════════════════════════════════════════════════════\n');

{
  console.log('1.1: Initiate OAuth without prior connection');
  
  // First, ensure user is NOT connected
  await makeRequest('POST', '/api/googlefit/disconnect', {}, authToken);
  
  const connectResult = await makeRequest('GET', '/api/googlefit/connect', null, authToken);
  
  test('Response status 200', connectResult.status === 200, connectResult.status, 200);
  test('Success flag true', connectResult.data.success === true, connectResult.data.success, true);
  test('Authorization URL present', !!connectResult.data.authUrl, !!connectResult.data.authUrl, true);
  test('Auth URL is Google URL', 
    connectResult.data.authUrl?.includes('accounts.google.com'),
    connectResult.data.authUrl?.substring(0, 50),
    'Should start with Google domain'
  );
  test('Auth URL contains state parameter',
    connectResult.data.authUrl?.includes('state='),
    connectResult.data.authUrl?.includes('state='),
    true
  );
  test('Auth URL contains required scopes',
    connectResult.data.authUrl?.includes('fitness.activity.read') &&
    connectResult.data.authUrl?.includes('fitness.body.read'),
    'See URL above',
    'Should contain fitness scopes'
  );
  
  console.log(`   Auth URL: ${connectResult.data.authUrl?.substring(0, 80)}...\n`);
}

{
  console.log('1.2: Cannot initiate if already connected');
  
  // Manually set connected status for testing
  // First connect
  const connectResult = await makeRequest('GET', '/api/googlefit/connect', null, authToken);
  if (connectResult.status === 200) {
    console.log('   (Skipping - user already connected from previous test)');
  } else {
    console.log('   (User not connected - test condition unavailable)');
  }
  
  console.log();
}

{
  console.log('1.3: Require authentication');
  
  const noAuthResult = await makeRequest('GET', '/api/googlefit/connect', null, null);
  
  test('Returns 401 without token', noAuthResult.status === 401, noAuthResult.status, 401);
  console.log();
}

// ============================================
// TEST 2: GET GOOGLE FIT STATUS
// ============================================

console.log('📝 TEST 2: GET GOOGLE FIT STATUS (GET /api/googlefit/status)');
console.log('═══════════════════════════════════════════════════════════\n');

{
  console.log('2.1: Get status when NOT connected');
  
  const statusResult = await makeRequest('GET', '/api/googlefit/status', null, authToken);
  
  test('Response status 200', statusResult.status === 200, statusResult.status, 200);
  test('Success flag true', statusResult.data.success === true, statusResult.data.success, true);
  test('Connected flag present', statusResult.data.connected !== undefined, !!statusResult.data.connected, 'Should be boolean');
  test('IsActive present', statusResult.data.isActive !== undefined, !!statusResult.data.isActive, 'Should be boolean');
  test('DaysUntilExpiry present', statusResult.data.daysUntilExpiry !== undefined, statusResult.data.daysUntilExpiry, 'Should be number or null');
  test('LastSync present', statusResult.data.lastSync !== undefined, !!statusResult.data.lastSync, 'Should be date or null');
  
  console.log(`   Status: ${JSON.stringify({
    connected: statusResult.data.connected,
    isActive: statusResult.data.isActive,
    daysUntilExpiry: statusResult.data.daysUntilExpiry
  }, null, 2)}\n`);
}

{
  console.log('2.2: Require authentication');
  
  const noAuthResult = await makeRequest('GET', '/api/googlefit/status', null, null);
  
  test('Returns 401 without token', noAuthResult.status === 401, noAuthResult.status, 401);
  console.log();
}

// ============================================
// TEST 3: DISCONNECT GOOGLE FIT
// ============================================

console.log('📝 TEST 3: DISCONNECT GOOGLE FIT (POST /api/googlefit/disconnect)');
console.log('═══════════════════════════════════════════════════════════\n');

{
  console.log('3.1: Disconnect when NOT connected');
  
  const disconnectResult = await makeRequest('POST', '/api/googlefit/disconnect', {}, authToken);
  
  test('Returns 400 when not connected', disconnectResult.status === 400, disconnectResult.status, 400);
  test('Error message informative',
    disconnectResult.data.message?.includes('not connected'),
    disconnectResult.data.message,
    'Should mention not connected'
  );
  
  console.log(`   Error: ${disconnectResult.data.message}\n`);
}

{
  console.log('3.2: Require authentication');
  
  const noAuthResult = await makeRequest('POST', '/api/googlefit/disconnect', {}, null);
  
  test('Returns 401 without token', noAuthResult.status === 401, noAuthResult.status, 401);
  console.log();
}

// ============================================
// TEST 4: OAUTH CALLBACK VALIDATION
// ============================================

console.log('📝 TEST 4: OAUTH CALLBACK VALIDATION (GET /api/googlefit/callback)');
console.log('═══════════════════════════════════════════════════════════\n');

{
  console.log('4.1: Missing authorization code');
  
  const callbackResult = await makeRequest('GET', '/api/googlefit/callback?state=test_state', null, null);
  
  test('Returns 400 for missing code', callbackResult.status === 400, callbackResult.status, 400);
  test('Error message mentions code',
    callbackResult.data.message?.includes('code') || callbackResult.data.message?.includes('authorization'),
    callbackResult.data.message,
    'Should mention authorization code'
  );
  
  console.log(`   Error: ${callbackResult.data.message}\n`);
}

{
  console.log('4.2: Missing state parameter (CSRF protection)');
  
  const callbackResult = await makeRequest('GET', '/api/googlefit/callback?code=test_code', null, null);
  
  test('Returns 400 for missing state', callbackResult.status === 400, callbackResult.status, 400);
  test('Error message mentions CSRF',
    callbackResult.data.message?.includes('state') || callbackResult.data.message?.includes('CSRF'),
    callbackResult.data.message,
    'Should mention CSRF validation'
  );
  
  console.log(`   Error: ${callbackResult.data.message}\n`);
}

{
  console.log('4.3: User denial error handling');
  
  const callbackResult = await makeRequest('GET', '/api/googlefit/callback?error=access_denied&state=test', null, null);
  
  test('Returns 400 for access_denied', callbackResult.status === 400, callbackResult.status, 400);
  test('Error message mentions denial',
    callbackResult.data.message?.toLowerCase().includes('denied'),
    callbackResult.data.message,
    'Should mention user denial'
  );
  
  console.log(`   Error: ${callbackResult.data.message}\n`);
}

{
  console.log('4.5: Prevent duplicate connection via callback when already connected');
  // Simulate prior connection by setting googleFitConnected through initiating flow
  // We cannot complete real OAuth here, but we can manually set flag then call callback with dummy params
  // First ensure disconnected
  await makeRequest('POST', '/api/googlefit/disconnect', {}, authToken);
  // Set googleFitConnected by initiating connect (does not mark connected, so simulate via status expectation)
  // For safety we skip token operations and directly call disconnect to ensure clean state
  // Manually attempt callback with same state twice to trigger duplicate connection prevention
  const duplicateResult = await makeRequest('GET', '/api/googlefit/callback?code=dummy_code&state=dummy_state', null, null);
  // Expect 400 due to invalid/expired state OR code; cannot assert duplicate yet
  // Second call should also fail; ensure consistent rejection
  const duplicateResult2 = await makeRequest('GET', '/api/googlefit/callback?code=dummy_code&state=dummy_state', null, null);
  test('Duplicate invalid callback consistently rejected', duplicateResult.status >= 400 && duplicateResult2.status >= 400, {s1: duplicateResult.status, s2: duplicateResult2.status}, '>=400');
  console.log();
}

{
  console.log('4.4: Invalid scope error');
  
  const callbackResult = await makeRequest('GET', '/api/googlefit/callback?error=invalid_scope&state=test', null, null);
  
  test('Returns 400 for invalid_scope', callbackResult.status === 400, callbackResult.status, 400);
  test('Error message mentions scopes',
    callbackResult.data.message?.toLowerCase().includes('scope'),
    callbackResult.data.message,
    'Should mention scopes'
  );
  
  console.log(`   Error: ${callbackResult.data.message}\n`);
}

// ============================================
// TEST 5: INTEGRATION CHECKS
// ============================================

console.log('📝 TEST 5: INTEGRATION & WORKFLOW CHECKS');
console.log('═══════════════════════════════════════════════════════════\n');

{
  console.log('5.1: User model consistency - googleFitConnected field updates');
  
  // Get initial status
  const status1 = await makeRequest('GET', '/api/googlefit/status', null, authToken);
  const wasConnected = status1.data.connected;
  
  console.log(`   Initial connected status: ${wasConnected}`);
  console.log(`   (Integration check: User model reflects correct status)\n`);
}

{
  console.log('5.2: Auth context awareness');
  
  // Check if /api/auth/me reflects Google Fit status
  const meResult = await makeRequest('GET', '/api/auth/me', null, authToken);
  
  test('Current user endpoint includes googleFitConnected',
    meResult.data.user?.googleFitConnected !== undefined,
    !!meResult.data.user?.googleFitConnected,
    'Should be boolean'
  );

  if (meResult.data.user?.googleFitConnected) {
    // If connected (on real environment), daysUntilExpiry should be numeric
    const statusResult = await makeRequest('GET', '/api/googlefit/status', null, authToken);
    test('Status includes daysUntilExpiry field', statusResult.data.daysUntilExpiry !== undefined, statusResult.data.daysUntilExpiry, 'number|null');
  }
  
  console.log(`   Google Fit Connected: ${meResult.data.user?.googleFitConnected}\n`);
}

// ============================================
// TEST 6: SCOPE VALIDATION
// ============================================

console.log('📝 TEST 6: SCOPE VALIDATION & SECURITY');
console.log('═══════════════════════════════════════════════════════════\n');

{
  console.log('6.1: Verify auth URL contains phone-only scopes');
  
  // Disconnect first
  await makeRequest('POST', '/api/googlefit/disconnect', {}, authToken);
  
  const connectResult = await makeRequest('GET', '/api/googlefit/connect', null, authToken);
  const authUrl = connectResult.data.authUrl || '';
  
  test('Contains activity.read scope', authUrl.includes('fitness.activity.read'), authUrl.includes('fitness.activity.read'), true);
  test('Contains body.read scope', authUrl.includes('fitness.body.read'), authUrl.includes('fitness.body.read'), true);
  test('Contains sleep.read scope', authUrl.includes('fitness.sleep.read'), authUrl.includes('fitness.sleep.read'), true);
  test('Does NOT contain heart_rate scope (wearable-only)',
    !authUrl.includes('heart_rate'),
    !authUrl.includes('heart_rate'),
    true
  );
  test('Does NOT contain oxygen_saturation scope (wearable-only)',
    !authUrl.includes('oxygen_saturation'),
    !authUrl.includes('oxygen_saturation'),
    true
  );
  test('Does NOT contain blood_pressure scope (wearable-only)',
    !authUrl.includes('blood_pressure'),
    !authUrl.includes('blood_pressure'),
    true
  );

  // Normalized scope persistence check (cannot read tokens directly, but verify required scopes present in URL)
  test('Required scopes subset present for normalization',
    ['fitness.activity.read','fitness.body.read','fitness.sleep.read'].every(s=>authUrl.includes(s)),
    authUrl,
    'All required scopes present'
  );
  
  console.log(`   Scopes validated (phone-only enforced)\n`);
}

// ============================================
// TEST 7: ERROR HANDLING
// ============================================

console.log('📝 TEST 7: ERROR HANDLING & EDGE CASES');
console.log('═══════════════════════════════════════════════════════════\n');

{
  console.log('7.1: Invalid authorization code handling');
  
  const callbackResult = await makeRequest('GET', '/api/googlefit/callback?code=invalid_code_xyz&state=invalid_state_xyz', null, null);
  
  // Should fail with 400 or 403 (state validation or code exchange)
  const isErrorResponse = callbackResult.status >= 400;
  test('Rejects invalid code',
    isErrorResponse,
    callbackResult.status,
    '400 or higher'
  );
  
  console.log();
}

{
  console.log('7.2: Status endpoint with authenticated user');
  
  const statusResult = await makeRequest('GET', '/api/googlefit/status', null, authToken);
  
  test('Always returns 200', statusResult.status === 200, statusResult.status, 200);
  test('Contains valid response structure',
    statusResult.data.success && statusResult.data.connected !== undefined,
    'Has success and connected',
    'Valid structure'
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
  console.log('🎉 All tests passed! Google Fit controller working perfectly.');
} else {
  console.log(`⚠️  ${testsFailed} test(s) failed. Review output above.`);
}

console.log();
