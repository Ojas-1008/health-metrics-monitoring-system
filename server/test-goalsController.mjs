/**
 * ============================================
 * COMPREHENSIVE GOALS CONTROLLER TEST SUITE
 * ============================================
 * 
 * Purpose: Rigorous testing of all 5 goals controller endpoints
 * Coverage: Happy paths, edge cases, error handling, integration
 * 
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

  try {
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();
    return {
      status: response.status,
      data,
      success: response.ok
    };
  } catch (error) {
    return {
      status: 0,
      error: error.message,
      success: false
    };
  }
};

let testsPassed = 0;
let testsFailed = 0;

const test = (name, passed, actual = null, expected = null) => {
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
console.log('║        COMPREHENSIVE GOALS CONTROLLER TEST SUITE           ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// ============================================
// SETUP: Authentication
// ============================================

console.log('🔐 SETUP: Authenticating user...\n');

{
  const loginResult = await makeRequest('POST', '/api/auth/login', TEST_USER);
  
  test(
    'Login successful',
    loginResult.status === 200,
    loginResult.status,
    200
  );

  if (loginResult.status === 200) {
    authToken = loginResult.data.token;
    userId = loginResult.data.user.id;
    console.log(`   User ID: ${userId}`);
    console.log(`   Token obtained: ${authToken.substring(0, 20)}...\n`);
  } else {
    console.log('❌ Authentication failed! Cannot proceed with tests.');
    process.exit(1);
  }
}

// ============================================
// TEST 1: SET GOALS (POST /api/goals)
// ============================================

console.log('📝 TEST 1: SET GOALS (POST /api/goals)');
console.log('═══════════════════════════════════════════════════════════\n');

{
  console.log('1.1: Set all goals - valid input');
  
  const setAllGoals = await makeRequest('POST', '/api/goals', {
    stepGoal: 12000,
    sleepGoal: 8,
    calorieGoal: 2200,
    distanceGoal: 6,
    weightGoal: 75
  }, authToken);

  test(
    'Response status 200',
    setAllGoals.status === 200,
    setAllGoals.status,
    200
  );

  test(
    'Success flag true',
    setAllGoals.data.success === true,
    setAllGoals.data.success,
    true
  );

  test(
    'Contains goals data',
    setAllGoals.data.data && Object.keys(setAllGoals.data.data).length > 0,
    !!setAllGoals.data.data,
    'Should contain goals object'
  );

  test(
    'Goals correctly updated',
    setAllGoals.data.data.stepGoal === 12000 &&
    setAllGoals.data.data.sleepGoal === 8 &&
    setAllGoals.data.data.calorieGoal === 2200,
    'See values above',
    'stepGoal:12000, sleepGoal:8, calorieGoal:2200'
  );

  console.log(`   Message: "${setAllGoals.data.message}"`);
  console.log(`   Goals: ${JSON.stringify(setAllGoals.data.data)}\n`);
}

{
  console.log('1.2: Set partial goals - only stepGoal');
  
  const setPartialGoals = await makeRequest('POST', '/api/goals', {
    stepGoal: 15000
  }, authToken);

  test(
    'Partial update status 200',
    setPartialGoals.status === 200,
    setPartialGoals.status,
    200
  );

  test(
    'Only specified goal updated',
    setPartialGoals.data.data.stepGoal === 15000,
    setPartialGoals.data.data.stepGoal,
    15000
  );

  console.log(`   Updated step goal: ${setPartialGoals.data.data.stepGoal}\n`);
}

{
  console.log('1.3: Set goals with no fields - validation error');
  
  const noFields = await makeRequest('POST', '/api/goals', {}, authToken);

  test(
    'Returns 400 error',
    noFields.status === 400,
    noFields.status,
    400
  );

  test(
    'Error message present',
    noFields.data.message && noFields.data.message.includes('one goal'),
    noFields.data.message,
    'Should mention "one goal"'
  );

  console.log(`   Error: "${noFields.data.message}"\n`);
}

{
  console.log('1.4: Set goals with invalid values - out of range');
  
  const invalidSteps = await makeRequest('POST', '/api/goals', {
    stepGoal: 100000 // Max is 50000
  }, authToken);

  test(
    'Returns 400 error for out of range',
    invalidSteps.status === 400,
    invalidSteps.status,
    400
  );

  test(
    'Error explains constraint',
    invalidSteps.data.message && (invalidSteps.data.message.includes('50000') || invalidSteps.data.message.includes('exceed')),
    invalidSteps.data.message,
    'Should mention 50000 or exceed'
  );

  console.log(`   Error: "${invalidSteps.data.message}"\n`);
}

{
  console.log('1.5: Set goals with invalid data types');
  
  const invalidType = await makeRequest('POST', '/api/goals', {
    stepGoal: 'not-a-number'
  }, authToken);

  test(
    'Returns 400 error for invalid type',
    invalidType.status === 400,
    invalidType.status,
    400
  );

  test(
    'Error message present',
    invalidType.data.message && typeof invalidType.data.message === 'string',
    invalidType.data.message ? 'Yes' : 'No',
    'Should be string'
  );

  console.log(`   Error: "${invalidType.data.message}"\n`);
}

{
  console.log('1.6: Set goals without authentication token');
  
  const noAuth = await makeRequest('POST', '/api/goals', {
    stepGoal: 10000
  }); // No token

  test(
    'Returns 401 unauthorized',
    noAuth.status === 401,
    noAuth.status,
    401
  );

  console.log(`   Error: "${noAuth.data.message}"\n`);
}

// ============================================
// TEST 2: GET GOALS (GET /api/goals)
// ============================================

console.log('📝 TEST 2: GET GOALS (GET /api/goals)');
console.log('═══════════════════════════════════════════════════════════\n');

{
  console.log('2.1: Get current goals');
  
  const getGoals = await makeRequest('GET', '/api/goals', null, authToken);

  test(
    'Response status 200',
    getGoals.status === 200,
    getGoals.status,
    200
  );

  test(
    'Success flag true',
    getGoals.data.success === true,
    getGoals.data.success,
    true
  );

  test(
    'Contains goals data',
    getGoals.data.data && typeof getGoals.data.data === 'object',
    !!getGoals.data.data,
    'Should be object'
  );

  test(
    'Has all goal fields',
    getGoals.data.data.stepGoal !== undefined &&
    getGoals.data.data.sleepGoal !== undefined &&
    getGoals.data.data.calorieGoal !== undefined,
    'See goals structure',
    'Should have stepGoal, sleepGoal, calorieGoal'
  );

  console.log(`   Goals: ${JSON.stringify(getGoals.data.data)}\n`);
}

{
  console.log('2.2: Get goals without authentication');
  
  const noAuth = await makeRequest('GET', '/api/goals');

  test(
    'Returns 401 unauthorized',
    noAuth.status === 401,
    noAuth.status,
    401
  );

  console.log(`   Error: "${noAuth.data.message}"\n`);
}

{
  console.log('2.3: Get goals with invalid token');
  
  const badToken = await makeRequest('GET', '/api/goals', null, 'invalid-token-here');

  test(
    'Returns 401 unauthorized',
    badToken.status === 401,
    badToken.status,
    401
  );

  console.log(`   Error: "${badToken.data.message}"\n`);
}

// ============================================
// TEST 3: UPDATE GOALS (PUT /api/goals)
// ============================================

console.log('📝 TEST 3: UPDATE GOALS (PUT /api/goals)');
console.log('═══════════════════════════════════════════════════════════\n');

{
  console.log('3.1: Update specific goals - partial update');
  
  const updateGoals = await makeRequest('PUT', '/api/goals', {
    stepGoal: 20000,
    sleepGoal: 9
  }, authToken);

  test(
    'Response status 200',
    updateGoals.status === 200,
    updateGoals.status,
    200
  );

  test(
    'Step goal updated',
    updateGoals.data.data.stepGoal === 20000,
    updateGoals.data.data.stepGoal,
    20000
  );

  test(
    'Sleep goal updated',
    updateGoals.data.data.sleepGoal === 9,
    updateGoals.data.data.sleepGoal,
    9
  );

  console.log(`   Updated goals: stepGoal=${updateGoals.data.data.stepGoal}, sleepGoal=${updateGoals.data.data.sleepGoal}\n`);
}

{
  console.log('3.2: Update with no fields - validation error');
  
  const noFields = await makeRequest('PUT', '/api/goals', {}, authToken);

  test(
    'Returns 400 error',
    noFields.status === 400,
    noFields.status,
    400
  );

  console.log(`   Error: "${noFields.data.message}"\n`);
}

{
  console.log('3.3: Update with invalid value - below minimum');
  
  const invalidValue = await makeRequest('PUT', '/api/goals', {
    stepGoal: 100 // Min is 1000
  }, authToken);

  test(
    'Returns 400 error for below minimum',
    invalidValue.status === 400,
    invalidValue.status,
    400
  );

  test(
    'Error message mentions constraint',
    invalidValue.data.message && invalidValue.data.message.includes('1000'),
    invalidValue.data.message,
    'Should mention 1000'
  );

  console.log(`   Error: "${invalidValue.data.message}"\n`);
}

{
  console.log('3.4: Update multiple goals at once');
  
  const multiUpdate = await makeRequest('PUT', '/api/goals', {
    weightGoal: 80,
    calorieGoal: 2400,
    distanceGoal: 7
  }, authToken);

  test(
    'Multiple updates successful',
    multiUpdate.status === 200 &&
    multiUpdate.data.data.weightGoal === 80 &&
    multiUpdate.data.data.calorieGoal === 2400 &&
    multiUpdate.data.data.distanceGoal === 7,
    'All updated',
    'Should update all 3 fields'
  );

  console.log(`   Updated: weight=${multiUpdate.data.data.weightGoal}, calories=${multiUpdate.data.data.calorieGoal}, distance=${multiUpdate.data.data.distanceGoal}\n`);
}

// ============================================
// TEST 4: RESET GOALS (DELETE /api/goals)
// ============================================

console.log('📝 TEST 4: RESET GOALS (DELETE /api/goals)');
console.log('═══════════════════════════════════════════════════════════\n');

{
  console.log('4.1: Reset goals to defaults');
  
  const resetGoals = await makeRequest('DELETE', '/api/goals', {}, authToken);

  test(
    'Response status 200',
    resetGoals.status === 200,
    resetGoals.status,
    200
  );

  test(
    'Success message present',
    resetGoals.data.message && resetGoals.data.message.includes('default'),
    resetGoals.data.message,
    'Should mention default'
  );

  test(
    'Goals reset to defaults',
    resetGoals.data.data.stepGoal === 10000 &&
    resetGoals.data.data.sleepGoal === 8 &&
    resetGoals.data.data.calorieGoal === 2000 &&
    resetGoals.data.data.distanceGoal === 5,
    'See values',
    'stepGoal:10000, sleepGoal:8, calorieGoal:2000, distanceGoal:5'
  );

  test(
    'Weight goal reset to null',
    resetGoals.data.data.weightGoal === null,
    resetGoals.data.data.weightGoal,
    null
  );

  console.log(`   Default goals: ${JSON.stringify(resetGoals.data.data)}\n`);
}

{
  console.log('4.2: Reset goals without authentication');
  
  const noAuth = await makeRequest('DELETE', '/api/goals', {});

  test(
    'Returns 401 unauthorized',
    noAuth.status === 401,
    noAuth.status,
    401
  );

  console.log(`   Error: "${noAuth.data.message}"\n`);
}

// Re-set goals for progress test
await makeRequest('POST', '/api/goals', {
  stepGoal: 10000,
  sleepGoal: 8,
  calorieGoal: 2000,
  distanceGoal: 5
}, authToken);

// ============================================
// TEST 5: GET GOAL PROGRESS (GET /api/goals/progress)
// ============================================

console.log('📝 TEST 5: GET GOAL PROGRESS (GET /api/goals/progress)');
console.log('═══════════════════════════════════════════════════════════\n');

{
  console.log('5.1: Get goal progress for today');
  
  const progress = await makeRequest('GET', '/api/goals/progress', null, authToken);

  test(
    'Response status 200',
    progress.status === 200,
    progress.status,
    200
  );

  test(
    'Contains goals data',
    progress.data.data.goals && typeof progress.data.data.goals === 'object',
    !!progress.data.data.goals,
    'Should have goals'
  );

  test(
    'Contains progress object',
    progress.data.data.progress && typeof progress.data.data.progress === 'object',
    !!progress.data.data.progress,
    'Should have progress object'
  );

  test(
    'Contains hasMetricsToday flag',
    progress.data.data.hasMetricsToday !== undefined,
    progress.data.data.hasMetricsToday,
    'Should be boolean'
  );

  test(
    'Contains currentMetrics',
    progress.data.data.currentMetrics !== undefined,
    progress.data.data.currentMetrics ? 'Has metrics' : 'No metrics today',
    'Should be null or object'
  );

  console.log(`   Has metrics today: ${progress.data.data.hasMetricsToday}`);
  console.log(`   Progress structure: ${Object.keys(progress.data.data.progress).join(', ') || 'Empty'}\n`);
}

{
  console.log('5.2: Progress without authentication');
  
  const noAuth = await makeRequest('GET', '/api/goals/progress');

  test(
    'Returns 401 unauthorized',
    noAuth.status === 401,
    noAuth.status,
    401
  );

  console.log(`   Error: "${noAuth.data.message}"\n`);
}

{
  console.log('5.3: Progress structure validation (when metrics exist)');
  
  // First, add a metric for today
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const dateString = today.toISOString().split('T')[0];

  await makeRequest('POST', '/api/metrics', {
    date: dateString,
    metrics: {
      steps: 5000,
      sleepHours: 6,
      calories: 1800,
      distance: 4,
      weight: 75
    }
  }, authToken);

  // Now get progress
  const progressWithMetrics = await makeRequest('GET', '/api/goals/progress', null, authToken);

  test(
    'Has metrics today after creating one',
    progressWithMetrics.data.data.hasMetricsToday === true,
    progressWithMetrics.data.data.hasMetricsToday,
    true
  );

  test(
    'Progress contains step progress',
    progressWithMetrics.data.data.progress.steps !== undefined,
    !!progressWithMetrics.data.data.progress.steps,
    'Should have steps progress'
  );

  test(
    'Step progress has required fields',
    progressWithMetrics.data.data.progress.steps &&
    progressWithMetrics.data.data.progress.steps.goal !== undefined &&
    progressWithMetrics.data.data.progress.steps.current !== undefined &&
    progressWithMetrics.data.data.progress.steps.percentage !== undefined &&
    progressWithMetrics.data.data.progress.steps.achieved !== undefined,
    'All fields present',
    'Should have goal, current, percentage, achieved'
  );

  test(
    'Percentage calculation correct',
    progressWithMetrics.data.data.progress.steps.percentage === 50, // 5000/10000 * 100
    progressWithMetrics.data.data.progress.steps.percentage,
    50
  );

  test(
    'Achieved flag correct',
    progressWithMetrics.data.data.progress.steps.achieved === false, // 5000 < 10000
    progressWithMetrics.data.data.progress.steps.achieved,
    false
  );

  console.log(`   Step progress: ${JSON.stringify(progressWithMetrics.data.data.progress.steps)}\n`);
}

// ============================================
// TEST 6: INTEGRATION TESTS
// ============================================

console.log('📝 TEST 6: INTEGRATION & WORKFLOW TESTS');
console.log('═══════════════════════════════════════════════════════════\n');

{
  console.log('6.1: Complete workflow - Set → Get → Update → Reset');
  
  // Set
  const set = await makeRequest('POST', '/api/goals', {
    stepGoal: 12000,
    sleepGoal: 8,
    calorieGoal: 2200
  }, authToken);
  test('Step 1: Set goals', set.status === 200);

  // Get
  const get = await makeRequest('GET', '/api/goals', null, authToken);
  test('Step 2: Get goals', get.status === 200 && get.data.data.stepGoal === 12000);

  // Update
  const update = await makeRequest('PUT', '/api/goals', {
    stepGoal: 15000
  }, authToken);
  test('Step 3: Update goals', update.status === 200 && update.data.data.stepGoal === 15000);

  // Get again
  const getAgain = await makeRequest('GET', '/api/goals', null, authToken);
  test('Step 4: Verify update', getAgain.status === 200 && getAgain.data.data.stepGoal === 15000);

  // Reset
  const reset = await makeRequest('DELETE', '/api/goals', {}, authToken);
  test('Step 5: Reset goals', reset.status === 200 && reset.data.data.stepGoal === 10000);

  console.log('   Workflow completed successfully\n');
}

{
  console.log('6.2: SSE event emission test - goals:updated event');
  
  // This test checks if the event is emitted (requires manual SSE verification)
  // The controller calls: emitToUser(req.user._id, 'goals:updated', { goals, updatedAt })
  
  const updateForEvent = await makeRequest('POST', '/api/goals', {
    stepGoal: 11000,
    sleepGoal: 9
  }, authToken);

  test(
    'Goals updated (event trigger)',
    updateForEvent.status === 200,
    updateForEvent.status,
    200
  );

  console.log('   ✓ Event emission triggered (check SSE in browser)\n');
}

{
  console.log('6.3: All goal types in single request');
  
  const allGoals = await makeRequest('POST', '/api/goals', {
    weightGoal: 70,
    stepGoal: 10000,
    sleepGoal: 8,
    calorieGoal: 2000,
    distanceGoal: 5
  }, authToken);

  test(
    'All 5 goal types set successfully',
    allGoals.status === 200 &&
    allGoals.data.data.weightGoal === 70 &&
    allGoals.data.data.stepGoal === 10000 &&
    allGoals.data.data.sleepGoal === 8 &&
    allGoals.data.data.calorieGoal === 2000 &&
    allGoals.data.data.distanceGoal === 5,
    'All set',
    'All 5 goals should be set'
  );

  console.log('   All goal types successfully set\n');
}

{
  console.log('6.4: Null values for optional goals (weightGoal)');
  
  const nullWeight = await makeRequest('POST', '/api/goals', {
    weightGoal: null,
    stepGoal: 10000
  }, authToken);

  test(
    'Can set weightGoal to null',
    nullWeight.status === 200 && nullWeight.data.data.weightGoal === null,
    nullWeight.data.data.weightGoal,
    null
  );

  console.log(`   Weight goal set to: ${nullWeight.data.data.weightGoal}\n`);
}

// ============================================
// TEST 7: EDGE CASES & BOUNDARY VALUES
// ============================================

console.log('📝 TEST 7: EDGE CASES & BOUNDARY VALUES');
console.log('═══════════════════════════════════════════════════════════\n');

{
  console.log('7.1: Minimum valid values');
  
  const minValues = await makeRequest('POST', '/api/goals', {
    weightGoal: 30,    // Min weight
    stepGoal: 1000,    // Min steps
    sleepGoal: 4,      // Min sleep
    calorieGoal: 500,  // Min calories
    distanceGoal: 0.5  // Min distance
  }, authToken);

  test(
    'Minimum values accepted',
    minValues.status === 200,
    minValues.status,
    200
  );

  test(
    'All minimum values set correctly',
    minValues.data.data.weightGoal === 30 &&
    minValues.data.data.stepGoal === 1000 &&
    minValues.data.data.sleepGoal === 4 &&
    minValues.data.data.calorieGoal === 500 &&
    minValues.data.data.distanceGoal === 0.5,
    'See values',
    'All minimums should be accepted'
  );

  console.log(`   Min values: ${JSON.stringify(minValues.data.data)}\n`);
}

{
  console.log('7.2: Maximum valid values');
  
  const maxValues = await makeRequest('POST', '/api/goals', {
    weightGoal: 300,    // Max weight
    stepGoal: 50000,    // Max steps
    sleepGoal: 12,      // Max sleep
    calorieGoal: 5000,  // Max calories
    distanceGoal: 100   // Max distance
  }, authToken);

  test(
    'Maximum values accepted',
    maxValues.status === 200,
    maxValues.status,
    200
  );

  test(
    'All maximum values set correctly',
    maxValues.data.data.weightGoal === 300 &&
    maxValues.data.data.stepGoal === 50000 &&
    maxValues.data.data.sleepGoal === 12 &&
    maxValues.data.data.calorieGoal === 5000 &&
    maxValues.data.data.distanceGoal === 100,
    'See values',
    'All maximums should be accepted'
  );

  console.log(`   Max values: ${JSON.stringify(maxValues.data.data)}\n`);
}

{
  console.log('7.3: Just below minimum - should fail');
  
  const belowMin = await makeRequest('POST', '/api/goals', {
    stepGoal: 999 // Min is 1000
  }, authToken);

  test(
    'Below minimum rejected',
    belowMin.status === 400,
    belowMin.status,
    400
  );

  console.log(`   Error: "${belowMin.data.message}"\n`);
}

{
  console.log('7.4: Just above maximum - should fail');
  
  const aboveMax = await makeRequest('POST', '/api/goals', {
    stepGoal: 50001 // Max is 50000
  }, authToken);

  test(
    'Above maximum rejected',
    aboveMax.status === 400,
    aboveMax.status,
    400
  );

  console.log(`   Error: "${aboveMax.data.message}"\n`);
}

{
  console.log('7.5: Zero values - some allowed, some not');
  
  const zeroDistance = await makeRequest('POST', '/api/goals', {
    distanceGoal: 0 // Min is 0.5
  }, authToken);

  test(
    'Zero distance rejected (min is 0.5)',
    zeroDistance.status === 400,
    zeroDistance.status,
    400
  );

  console.log(`   Error: "${zeroDistance.data.message}"\n`);
}

{
  console.log('7.6: Floating point values');
  
  const floatValues = await makeRequest('POST', '/api/goals', {
    distanceGoal: 7.5,  // Decimal allowed
    sleepGoal: 7.5      // Decimal for sleep
  }, authToken);

  test(
    'Floating point values accepted',
    floatValues.status === 200,
    floatValues.status,
    200
  );

  console.log(`   Float values: distance=${floatValues.data.data.distanceGoal}, sleep=${floatValues.data.data.sleepGoal}\n`);
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
  console.log('🎉 ALL TESTS PASSED! Goals controller working perfectly.\n');
} else {
  console.log(`⚠️  ${testsFailed} tests failed. Review logs above.\n`);
}

console.log('════════════════════════════════════════════════════════════\n');

process.exit(testsFailed > 0 ? 1 : 0);
