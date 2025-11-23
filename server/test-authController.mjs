/**
 * ============================================
 * AUTH CONTROLLER COMPREHENSIVE TEST SUITE
 * ============================================
 * 
 * Purpose: Rigorously test all authController endpoints
 * Tests: register, login, getCurrentUser, updateProfile, logout
 * Coverage: Happy paths, error cases, validation, token management
 */

import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000';
const TEST_USER = {
  name: 'Test User Auth',
  email: 'testuser.auth@example.com',
  password: 'TestPass123!',
  confirmPassword: 'TestPass123!'
};

const REGISTERED_USER = {
  email: 'ojasshrivastava1008@gmail.com',
  password: 'Krishna@1008'
};

let authToken = null;
let userId = null;

// ============================================
// UTILITIES
// ============================================

const log = (category, message, data = null) => {
  console.log(`\n${category}`);
  console.log(`${message}`);
  if (data) console.log(`${JSON.stringify(data, null, 2)}`);
};

const makeRequest = async (method, endpoint, body = null, token = null) => {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
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

// ============================================
// TEST 1: REGISTER NEW USER
// ============================================

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║        AUTH CONTROLLER COMPREHENSIVE TEST SUITE             ║');
console.log('╚════════════════════════════════════════════════════════════╝');

console.log('\n\n📝 TEST 1: USER REGISTRATION');
console.log('═══════════════════════════════════════════════════════════');

let registerResult;

{
  console.log('\n1.1: Register new user with valid data');
  registerResult = await makeRequest('POST', '/api/auth/register', TEST_USER);

  test(
    'Registration status 201',
    registerResult.status === 201,
    registerResult.status,
    201
  );

  test(
    'Registration returns success=true',
    registerResult.data.success === true,
    registerResult.data.success,
    true
  );

  test(
    'Registration returns token',
    !!registerResult.data.token,
    !!registerResult.data.token,
    true
  );

  test(
    'Registration returns user object',
    !!registerResult.data.user,
    !!registerResult.data.user,
    true
  );

  if (registerResult.data.user) {
    test(
      'User object has id field',
      !!registerResult.data.user.id,
      !!registerResult.data.user.id,
      true
    );

    test(
      'User object has email field',
      registerResult.data.user.email === TEST_USER.email,
      registerResult.data.user.email,
      TEST_USER.email
    );

    test(
      'User object does NOT have password field (security)',
      !registerResult.data.user.password,
      !registerResult.data.user.password,
      true
    );

    userId = registerResult.data.user.id;
  }

  authToken = registerResult.data.token;

  console.log(`\n📊 User Details:`, registerResult.data.user);
}

{
  console.log('\n1.2: Attempt duplicate email registration (should fail)');
  const duplicateResult = await makeRequest('POST', '/api/auth/register', TEST_USER);

  test(
    'Duplicate registration rejected with 400',
    duplicateResult.status === 400,
    duplicateResult.status,
    400
  );

  test(
    'Duplicate error message indicates email exists',
    duplicateResult.data.message.toLowerCase().includes('already registered') ||
    duplicateResult.data.message.toLowerCase().includes('email'),
    duplicateResult.data.message,
    'Should mention duplicate email'
  );
}

{
  console.log('\n1.3: Register with invalid email format');
  const invalidEmailResult = await makeRequest('POST', '/api/auth/register', {
    ...TEST_USER,
    email: 'invalid-email',
    confirmPassword: TEST_USER.password
  });

  test(
    'Invalid email rejected',
    invalidEmailResult.status === 400,
    invalidEmailResult.status,
    400
  );
}

{
  console.log('\n1.4: Register with weak password');
  const weakPasswordResult = await makeRequest('POST', '/api/auth/register', {
    name: 'Test User',
    email: 'weak.pass@example.com',
    password: 'weak',
    confirmPassword: 'weak'
  });

  test(
    'Weak password rejected',
    weakPasswordResult.status === 400,
    weakPasswordResult.status,
    400
  );
}

{
  console.log('\n1.5: Register with mismatched password confirmation');
  const mismatchResult = await makeRequest('POST', '/api/auth/register', {
    ...TEST_USER,
    email: 'mismatch@example.com',
    confirmPassword: 'DifferentPassword123!'
  });

  test(
    'Mismatched passwords rejected',
    mismatchResult.status === 400,
    mismatchResult.status,
    400
  );
}

// ============================================
// TEST 2: LOGIN
// ============================================

console.log('\n\n📝 TEST 2: USER LOGIN');
console.log('═══════════════════════════════════════════════════════════');

let loginToken = null;

{
  console.log('\n2.1: Login with valid credentials (registered user)');
  const loginResult = await makeRequest('POST', '/api/auth/login', {
    email: REGISTERED_USER.email,
    password: REGISTERED_USER.password
  });

  test(
    'Login status 200',
    loginResult.status === 200,
    loginResult.status,
    200
  );

  test(
    'Login returns success=true',
    loginResult.data.success === true,
    loginResult.data.success,
    true
  );

  test(
    'Login returns token',
    !!loginResult.data.token,
    !!loginResult.data.token,
    true
  );

  test(
    'Login returns user object',
    !!loginResult.data.user,
    !!loginResult.data.user,
    true
  );

  if (loginResult.data.user) {
    test(
      'Login user email matches',
      loginResult.data.user.email === REGISTERED_USER.email,
      loginResult.data.user.email,
      REGISTERED_USER.email
    );
  }

  loginToken = loginResult.data.token;
  console.log(`\n📊 Login User Details:`, loginResult.data.user);
}

{
  console.log('\n2.2: Login with just-registered user');
  const loginNewResult = await makeRequest('POST', '/api/auth/login', {
    email: TEST_USER.email,
    password: TEST_USER.password
  });

  test(
    'Newly registered user can login',
    loginNewResult.status === 200,
    loginNewResult.status,
    200
  );

  test(
    'Login returns valid token',
    !!loginNewResult.data.token,
    !!loginNewResult.data.token,
    true
  );
}

{
  console.log('\n2.3: Login with incorrect password');
  const wrongPassResult = await makeRequest('POST', '/api/auth/login', {
    email: REGISTERED_USER.email,
    password: 'WrongPassword123!'
  });

  test(
    'Wrong password rejected with 401',
    wrongPassResult.status === 401,
    wrongPassResult.status,
    401
  );

  test(
    'Wrong password error message is generic (prevents email enumeration)',
    wrongPassResult.data.message.includes('Invalid'),
    wrongPassResult.data.message,
    'Should be generic error'
  );
}

{
  console.log('\n2.4: Login with non-existent email');
  const noEmailResult = await makeRequest('POST', '/api/auth/login', {
    email: 'nonexistent@example.com',
    password: 'SomePassword123!'
  });

  test(
    'Non-existent email rejected with 401',
    noEmailResult.status === 401,
    noEmailResult.status,
    401
  );

  test(
    'Non-existent email error is generic',
    noEmailResult.data.message.includes('Invalid'),
    noEmailResult.data.message,
    'Should be generic error'
  );
}

{
  console.log('\n2.5: Login with missing email');
  const missingEmailResult = await makeRequest('POST', '/api/auth/login', {
    email: '',
    password: REGISTERED_USER.password
  });

  test(
    'Missing email rejected with 400',
    missingEmailResult.status === 400,
    missingEmailResult.status,
    400
  );
}

{
  console.log('\n2.6: Login with missing password');
  const missingPassResult = await makeRequest('POST', '/api/auth/login', {
    email: REGISTERED_USER.email,
    password: ''
  });

  test(
    'Missing password rejected with 400',
    missingPassResult.status === 400,
    missingPassResult.status,
    400
  );
}

// ============================================
// TEST 3: GET CURRENT USER
// ============================================

console.log('\n\n📝 TEST 3: GET CURRENT USER');
console.log('═══════════════════════════════════════════════════════════');

{
  console.log('\n3.1: Get current user with valid token');
  const meResult = await makeRequest('GET', '/api/auth/me', null, loginToken);

  test(
    'Get current user status 200',
    meResult.status === 200,
    meResult.status,
    200
  );

  test(
    'Get current user returns success=true',
    meResult.data.success === true,
    meResult.data.success,
    true
  );

  test(
    'Get current user returns user object',
    !!meResult.data.user,
    !!meResult.data.user,
    true
  );

  if (meResult.data.user) {
    test(
      'User has id field',
      !!meResult.data.user.id,
      !!meResult.data.user.id,
      true
    );

    test(
      'User has email field',
      !!meResult.data.user.email,
      !!meResult.data.user.email,
      true
    );

    test(
      'User does NOT have password (security)',
      !meResult.data.user.password,
      !meResult.data.user.password,
      true
    );

    test(
      'User has goals field',
      'goals' in meResult.data.user,
      'goals' in meResult.data.user,
      true
    );
  }

  console.log(`\n📊 Current User Details:`, meResult.data.user);
}

{
  console.log('\n3.2: Get current user without token (should fail)');
  const noTokenResult = await makeRequest('GET', '/api/auth/me', null, null);

  test(
    'No token rejected with 401',
    noTokenResult.status === 401,
    noTokenResult.status,
    401
  );
}

{
  console.log('\n3.3: Get current user with invalid token');
  const invalidTokenResult = await makeRequest('GET', '/api/auth/me', null, 'invalid.token.here');

  test(
    'Invalid token rejected with 401',
    invalidTokenResult.status === 401,
    invalidTokenResult.status,
    401
  );
}

// ============================================
// TEST 4: UPDATE PROFILE
// ============================================

console.log('\n\n📝 TEST 4: UPDATE PROFILE');
console.log('═══════════════════════════════════════════════════════════');

{
  console.log('\n4.1: Update user name');
  const updateResult = await makeRequest('PUT', '/api/auth/profile', {
    name: 'Updated User Name'
  }, loginToken);

  test(
    'Update profile status 200',
    updateResult.status === 200,
    updateResult.status,
    200
  );

  test(
    'Update profile returns success=true',
    updateResult.data.success === true,
    updateResult.data.success,
    true
  );

  test(
    'Updated name is reflected',
    updateResult.data.user.name === 'Updated User Name',
    updateResult.data.user.name,
    'Updated User Name'
  );

  console.log(`\n📊 Updated User:`, updateResult.data.user);
}

{
  console.log('\n4.2: Update goals');
  const goalsUpdate = await makeRequest('PUT', '/api/auth/profile', {
    goals: {
      stepGoal: 12000,
      sleepGoal: 8,
      calorieGoal: 2200
    }
  }, loginToken);

  test(
    'Update goals status 200',
    goalsUpdate.status === 200,
    goalsUpdate.status,
    200
  );

  test(
    'Goals updated in response',
    !!goalsUpdate.data.user.goals,
    !!goalsUpdate.data.user.goals,
    true
  );

  console.log(`\n📊 Updated Goals:`, goalsUpdate.data.user.goals);
}

{
  console.log('\n4.3: Update with restricted field (email) - should be rejected');
  const emailUpdateResult = await makeRequest('PUT', '/api/auth/profile', {
    name: 'New Name',
    email: 'newemail@example.com'
  }, loginToken);

  test(
    'Email update attempt rejected with 400',
    emailUpdateResult.status === 400,
    emailUpdateResult.status,
    400
  );

  test(
    'Error message indicates restricted field',
    emailUpdateResult.data.message.toLowerCase().includes('restricted') ||
    emailUpdateResult.data.message.toLowerCase().includes('cannot update'),
    emailUpdateResult.data.message,
    'Should mention restricted field'
  );
}

{
  console.log('\n4.4: Update with restricted field (password) - should be rejected');
  const passUpdateResult = await makeRequest('PUT', '/api/auth/profile', {
    name: 'New Name',
    password: 'NewPassword123!'
  }, loginToken);

  test(
    'Password update attempt rejected with 400',
    passUpdateResult.status === 400,
    passUpdateResult.status,
    400
  );
}

{
  console.log('\n4.5: Update profile without token (should fail)');
  const noTokenUpdate = await makeRequest('PUT', '/api/auth/profile', {
    name: 'New Name'
  }, null);

  test(
    'Update without token rejected with 401',
    noTokenUpdate.status === 401,
    noTokenUpdate.status,
    401
  );
}

{
  console.log('\n4.6: Update with no fields provided (should fail)');
  const emptyUpdate = await makeRequest('PUT', '/api/auth/profile', {}, loginToken);

  test(
    'Empty update rejected with 400',
    emptyUpdate.status === 400,
    emptyUpdate.status,
    400
  );
}

// ============================================
// TEST 5: LOGOUT
// ============================================

console.log('\n\n📝 TEST 5: LOGOUT');
console.log('═══════════════════════════════════════════════════════════');

{
  console.log('\n5.1: Logout with valid token');
  const logoutResult = await makeRequest('POST', '/api/auth/logout', {}, loginToken);

  test(
    'Logout status 200',
    logoutResult.status === 200,
    logoutResult.status,
    200
  );

  test(
    'Logout returns success=true',
    logoutResult.data.success === true,
    logoutResult.data.success,
    true
  );

  console.log(`\n📊 Logout Response:`, logoutResult.data);
}

{
  console.log('\n5.2: Logout without token (should fail)');
  const noTokenLogout = await makeRequest('POST', '/api/auth/logout', {}, null);

  test(
    'Logout without token rejected with 401',
    noTokenLogout.status === 401,
    noTokenLogout.status,
    401
  );
}

{
  console.log('\n5.3: Verify token still works after logout (JWT is stateless)');
  const meAfterLogout = await makeRequest('GET', '/api/auth/me', null, loginToken);

  test(
    'Token still valid after logout (client must delete it)',
    meAfterLogout.status === 200,
    meAfterLogout.status,
    200
  );

  console.log('ℹ️  Note: JWT is stateless. Real logout happens client-side.');
}

// ============================================
// TEST 6: TOKEN EXPIRATION & SECURITY
// ============================================

console.log('\n\n📝 TEST 6: TOKEN VALIDATION & SECURITY');
console.log('═══════════════════════════════════════════════════════════');

{
  console.log('\n6.1: Token structure validation');
  const tokenParts = loginToken.split('.');

  test(
    'Token has 3 parts (JWT format)',
    tokenParts.length === 3,
    tokenParts.length,
    3
  );

  // Decode header and payload (not signature)
  const header = JSON.parse(Buffer.from(tokenParts[0], 'base64').toString());
  const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());

  test(
    'Token algorithm is HS256',
    header.alg === 'HS256',
    header.alg,
    'HS256'
  );

  test(
    'Token has id field in payload',
    !!payload.id,
    !!payload.id,
    true
  );

  test(
    'Token has exp (expiration) field',
    !!payload.exp,
    !!payload.exp,
    true
  );

  test(
    'Token has iat (issued at) field',
    !!payload.iat,
    !!payload.iat,
    true
  );

  console.log(`\n📊 Token Payload:`, payload);
}

{
  console.log('\n6.2: Verify password is not exposed in API responses');
  const meResult = await makeRequest('GET', '/api/auth/me', null, loginToken);

  test(
    'User response does NOT include password field',
    !meResult.data.user.password,
    !meResult.data.user.password,
    true
  );

  test(
    'User response does NOT include googleFitTokens',
    !meResult.data.user.googleFitTokens,
    !meResult.data.user.googleFitTokens,
    true
  );
}

{
  console.log('\n6.3: Verify error messages don\'t leak information');
  const wrongPassResult = await makeRequest('POST', '/api/auth/login', {
    email: REGISTERED_USER.email,
    password: 'WrongPassword123!'
  });

  const nonExistentResult = await makeRequest('POST', '/api/auth/login', {
    email: 'doesnotexist@example.com',
    password: 'SomePassword123!'
  });

  test(
    'Wrong password and non-existent email have same error',
    wrongPassResult.data.message === nonExistentResult.data.message,
    `Wrong: "${wrongPassResult.data.message}" | Non-exist: "${nonExistentResult.data.message}"`,
    'Should be identical'
  );

  console.log('ℹ️  Both return: "Invalid email or password" (prevents email enumeration)');
}

// ============================================
// TEST 7: CONCURRENT REQUESTS
// ============================================

console.log('\n\n📝 TEST 7: CONCURRENT REQUESTS');
console.log('═══════════════════════════════════════════════════════════');

{
  console.log('\n7.1: Multiple concurrent GET /api/auth/me requests');
  const promises = [];

  for (let i = 0; i < 5; i++) {
    promises.push(makeRequest('GET', '/api/auth/me', null, loginToken));
  }

  const results = await Promise.all(promises);
  const allSuccessful = results.every(r => r.status === 200);

  test(
    'All 5 concurrent requests succeed',
    allSuccessful,
    `${results.filter(r => r.status === 200).length}/5 successful`,
    '5/5 successful'
  );
}

// ============================================
// TEST SUMMARY
// ============================================

console.log('\n\n╔════════════════════════════════════════════════════════════╗');
console.log('║                      TEST SUMMARY                          ║');
console.log('╚════════════════════════════════════════════════════════════╝');

const totalTests = testsPassed + testsFailed;
const successRate = ((testsPassed / totalTests) * 100).toFixed(1);

console.log(`\n✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`⏱️  Total: ${totalTests}`);
console.log(`📊 Success Rate: ${successRate}%`);

if (testsFailed === 0) {
  console.log('\n🎉 ALL TESTS PASSED! Auth controller is fully functional.');
} else {
  console.log(`\n⚠️  ${testsFailed} tests failed. Review logs above.`);
}

console.log('\n════════════════════════════════════════════════════════════\n');

process.exit(testsFailed > 0 ? 1 : 0);
