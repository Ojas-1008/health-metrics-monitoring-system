/**
 * ============================================
 * ENHANCED AUTH CONTROLLER TEST SUITE
 * WITH RATE LIMITING & FIXES
 * ============================================
 * 
 * Purpose: Verify all fixes work properly
 * Tests: register, login, rate limiting, error messages
 * Coverage: Happy paths, rate limiting, improved errors
 */

import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000';
const TEST_USER = {
  name: 'Test User Auth Enhanced',
  email: `testuser.enhanced.${Date.now()}@example.com`,
  password: 'TestPass123!',
  confirmPassword: 'TestPass123!'
};

const REGISTERED_USER = {
  email: 'ojasshrivastava1008@gmail.com',
  password: 'Krishna@1008'
};

let authToken = null;

const makeRequest = async (method, endpoint, body = null, token = null, forceIP = null) => {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Force a different IP for rate limiting tests (bypass IP-based rate limiting)
  if (forceIP) {
    headers['X-Forwarded-For'] = forceIP;
  }

  const options = {
    method,
    headers
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, options);
  const data = await response.json();

  return {
    status: response.status,
    headers: response.headers,
    data
  };
};

let testsPassed = 0;
let testsFailed = 0;

const test = (name, passed, actual, expected = null) => {
  if (passed) {
    console.log(`✅ PASS: ${name}`);
    testsPassed++;
  } else {
    console.log(`❌ FAIL: ${name}`);
    if (expected !== null) console.log(`   Expected: ${expected}`);
    if (actual !== null) console.log(`   Actual: ${actual}`);
    testsFailed++;
  }
};

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║     ENHANCED AUTH CONTROLLER TEST SUITE - WITH FIXES       ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// ============================================
// TEST 1: IMPROVED ERROR MESSAGES
// ============================================

console.log('📝 TEST 1: IMPROVED ERROR MESSAGES');
console.log('═══════════════════════════════════════════════════════════\n');

{
  console.log('1.1: Register with duplicate email - specific error message');
  
  // First, register a user
  const firstReg = await makeRequest('POST', '/api/auth/register', TEST_USER);
  
  // Try to register with same email
  const secondReg = await makeRequest('POST', '/api/auth/register', TEST_USER);
  
  test(
    'Duplicate registration rejected with 400',
    secondReg.status === 400,
    secondReg.status,
    400
  );

  test(
    'Error message is specific (not generic)',
    secondReg.data.message && 
    (secondReg.data.message.includes('already registered') || 
     secondReg.data.message.includes('Email is already')),
    secondReg.data.message,
    'Should mention duplicate email'
  );

  test(
    'Specific error also in errors.email field',
    secondReg.data.errors && secondReg.data.errors.email &&
    secondReg.data.errors.email.includes('already registered'),
    secondReg.data.errors?.email,
    'Should be in errors.email'
  );

  console.log(`   Message: "${secondReg.data.message}"`);
  console.log(`   Errors: ${JSON.stringify(secondReg.data.errors)}\n`);
}

{
  console.log('1.2: Register with invalid email - specific error message');
  const invalidEmail = await makeRequest('POST', '/api/auth/register', {
    name: 'Test User',
    email: 'invalid-email',
    password: 'TestPass123!',
    confirmPassword: 'TestPass123!'
  });

  test(
    'Invalid email rejected with specific message',
    invalidEmail.status === 400 && 
    invalidEmail.data.message.includes('email'),
    invalidEmail.data.message,
    'Should mention email'
  );

  console.log(`   Message: "${invalidEmail.data.message}"\n`);
}

{
  console.log('1.3: Register with weak password - specific error message');
  // Use unique IP to bypass rate limiting
  const weakPass = await makeRequest('POST', '/api/auth/register', {
    name: 'Test User',
    email: 'weakpass@example.com',
    password: 'weak',
    confirmPassword: 'weak'
  }, null, '192.168.1.50');

  test(
    'Weak password rejected with specific message',
    weakPass.status === 400 && 
    (weakPass.data.message.includes('Password') || weakPass.data.message.includes('password')),
    weakPass.data.message,
    'Should mention password requirement'
  );

  console.log(`   Message: "${weakPass.data.message}"\n`);
}

// ============================================
// TEST 2: RATE LIMITING - LOGIN
// ============================================

console.log('\n📝 TEST 2: RATE LIMITING - LOGIN ENDPOINT');
console.log('═══════════════════════════════════════════════════════════\n');

{
  console.log('2.1: Multiple failed login attempts - rate limiting');
  
  const attempts = 6; // Try 6 times (limit is 5)
  const results = [];
  const uniqueIP = `192.168.1.${100 + Math.floor(Math.random() * 150)}`; // Random IP for this test

  for (let i = 1; i <= attempts; i++) {
    const result = await makeRequest('POST', '/api/auth/login', {
      email: REGISTERED_USER.email,
      password: 'WrongPassword123!'
    }, null, uniqueIP); // Use same IP for all attempts in this test
    
    results.push({
      attempt: i,
      status: result.status,
      message: result.data.message || result.data.error,
      rateLimitRemaining: result.headers.get('x-ratelimit-remaining')
    });

    console.log(`   Attempt ${i}: Status ${result.status}`);
  }

  test(
    'First 5 login attempts return 401 (unauthorized)',
    results.slice(0, 5).every(r => r.status === 401),
    `Attempts 1-5 statuses: [${results.slice(0, 5).map(r => r.status).join(', ')}]`,
    'All should be 401'
  );

  test(
    '6th login attempt returns 429 (too many requests)',
    results[5].status === 429,
    results[5].status,
    429
  );

  test(
    'Rate limit response has proper error message',
    results[5].message && (results[5].message.includes('Too many') || results[5].message.includes('attempts')),
    results[5].message,
    'Should mention rate limit'
  );

  console.log(`   6th attempt message: "${results[5].message}"\n`);
}

// ============================================
// TEST 3: RATE LIMITING - REGISTRATION
// ============================================

console.log('\n📝 TEST 3: RATE LIMITING - REGISTRATION ENDPOINT');
console.log('═══════════════════════════════════════════════════════════\n');

{
  console.log('3.1: Multiple registration attempts - rate limiting');
  
  const results = [];
  const uniqueIP = `192.168.1.${200 + Math.floor(Math.random() * 50)}`; // Unique IP for registration tests

  for (let i = 1; i <= 4; i++) {
    const result = await makeRequest('POST', '/api/auth/register', {
      name: 'Test User',
      email: `newuser${i}.${Date.now()}@example.com`,
      password: 'TestPass123!',
      confirmPassword: 'TestPass123!'
    }, null, uniqueIP); // Use unique IP for this test series
    
    results.push({
      attempt: i,
      status: result.status
    });

    console.log(`   Attempt ${i}: Status ${result.status}`);
  }

  test(
    'First 3 registrations succeed (201)',
    results.slice(0, 3).every(r => r.status === 201),
    `First 3 statuses: [${results.slice(0, 3).map(r => r.status).join(', ')}]`,
    'All should be 201'
  );

  test(
    '4th registration attempt returns 429',
    results[3].status === 429,
    results[3].status,
    429
  );

  console.log();
}

// ============================================
// TEST 4: NORMAL OPERATIONS UNAFFECTED
// ============================================

console.log('\n📝 TEST 4: NORMAL AUTH OPERATIONS STILL WORK');
console.log('═══════════════════════════════════════════════════════════\n');

{
  console.log('4.1: Successful login returns token');
  const loginResult = await makeRequest('POST', '/api/auth/login', {
    email: REGISTERED_USER.email,
    password: REGISTERED_USER.password
  });

  test(
    'Successful login returns 200',
    loginResult.status === 200,
    loginResult.status,
    200
  );

  test(
    'Login returns valid token',
    !!loginResult.data.token && loginResult.data.token.split('.').length === 3,
    !!loginResult.data.token,
    true
  );

  test(
    'Login returns user data',
    !!loginResult.data.user && !!loginResult.data.user.email,
    !!loginResult.data.user,
    true
  );

  authToken = loginResult.data.token;
  console.log(`   User: ${loginResult.data.user.email}\n`);
}

{
  console.log('4.2: Get current user works');
  const meResult = await makeRequest('GET', '/api/auth/me', null, authToken);

  test(
    'Get current user returns 200',
    meResult.status === 200,
    meResult.status,
    200
  );

  test(
    'User data returned',
    !!meResult.data.user && !!meResult.data.user.id,
    !!meResult.data.user,
    true
  );

  console.log(`   User ID: ${meResult.data.user.id}\n`);
}

{
  console.log('4.3: Update profile works');
  const updateResult = await makeRequest('PUT', '/api/auth/profile', {
    name: 'Updated Test Name'
  }, authToken);

  test(
    'Profile update returns 200',
    updateResult.status === 200,
    updateResult.status,
    200
  );

  test(
    'Updated name reflected',
    updateResult.data.user.name === 'Updated Test Name',
    updateResult.data.user.name,
    'Updated Test Name'
  );

  console.log(`   Updated name: ${updateResult.data.user.name}\n`);
}

{
  console.log('4.4: Logout works');
  const logoutResult = await makeRequest('POST', '/api/auth/logout', {}, authToken);

  test(
    'Logout returns 200',
    logoutResult.status === 200,
    logoutResult.status,
    200
  );

  console.log();
}

// ============================================
// TEST 5: RATE LIMITING HEADERS
// ============================================

console.log('\n📝 TEST 5: RATE LIMITING HEADERS');
console.log('═══════════════════════════════════════════════════════════\n');

{
  console.log('5.1: Login request includes rate limit headers');
  const loginResult = await makeRequest('POST', '/api/auth/login', {
    email: REGISTERED_USER.email,
    password: REGISTERED_USER.password
  });

  const limitHeader = loginResult.headers.get('x-ratelimit-limit');
  const remainingHeader = loginResult.headers.get('x-ratelimit-remaining');
  const resetHeader = loginResult.headers.get('x-ratelimit-reset');

  test(
    'X-RateLimit-Limit header present',
    !!limitHeader,
    limitHeader,
    'Should be present'
  );

  test(
    'X-RateLimit-Remaining header present',
    !!remainingHeader,
    remainingHeader,
    'Should be present'
  );

  test(
    'X-RateLimit-Reset header present',
    !!resetHeader,
    resetHeader,
    'Should be present'
  );

  console.log(`   Limit: ${limitHeader}`);
  console.log(`   Remaining: ${remainingHeader}`);
  console.log(`   Reset: ${new Date(parseInt(resetHeader)).toISOString()}\n`);
}

// ============================================
// TEST SUMMARY
// ============================================

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║                      TEST SUMMARY                          ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

const totalTests = testsPassed + testsFailed;
const successRate = ((testsPassed / totalTests) * 100).toFixed(1);

console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`⏱️  Total: ${totalTests}`);
console.log(`📊 Success Rate: ${successRate}%\n`);

if (testsFailed === 0) {
  console.log('🎉 ALL TESTS PASSED! All fixes working correctly.\n');
} else {
  console.log(`⚠️  ${testsFailed} tests failed. Review logs above.\n`);
}

console.log('════════════════════════════════════════════════════════════\n');

process.exit(testsFailed > 0 ? 1 : 0);
