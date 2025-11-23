/**
 * Enhanced Goals Controller Test Suite (Refactored Version)
 * Focus: Validating refactored controller logic, progress guards, consistency between POST & PUT
 */
import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000';
const TEST_USER = { email: 'ojasshrivastava1008@gmail.com', password: 'Krishna@1008' };
let authToken = null;

async function makeRequest(method, endpoint, body = null, token = null) {
  const options = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) options.body = JSON.stringify(body);
  if (token) options.headers.Authorization = `Bearer ${token}`;
  const res = await fetch(API_URL + endpoint, options);
  let data; try { data = await res.json(); } catch { data = {}; }
  return { status: res.status, data };
}

function logResult(name, passed, actual, expected) {
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${name}${passed ? '' : ` (actual: ${JSON.stringify(actual)} expected: ${JSON.stringify(expected)})`}`);
  return passed;
}

(async () => {
  console.log('\n===== ENHANCED GOALS CONTROLLER TESTS (Refactor Validation) =====');

  // Authenticate
  const login = await makeRequest('POST', '/api/auth/login', TEST_USER);
  if (!logResult('Login succeeds', login.status === 200, login.status, 200)) return;
  authToken = login.data.token;

  // 1. POST & PUT parity test (should produce identical results with same payload)
  console.log('\n-- Parity: POST vs PUT identical goal update --');
  const postResp = await makeRequest('POST', '/api/goals', { stepGoal: 12345, sleepGoal: 7 }, authToken);
  logResult('POST returns 200', postResp.status === 200, postResp.status, 200);
  const putResp = await makeRequest('PUT', '/api/goals', { stepGoal: 12345, sleepGoal: 7 }, authToken);
  logResult('PUT returns 200', putResp.status === 200, putResp.status, 200);
  logResult('Goals identical after PUT', JSON.stringify(postResp.data.data) === JSON.stringify(putResp.data.data), putResp.data.data, postResp.data.data);

  // 2. Validation: no fields provided
  console.log('\n-- Validation: no fields provided --');
  const noFieldsPost = await makeRequest('POST', '/api/goals', {}, authToken);
  logResult('POST empty body 400', noFieldsPost.status === 400, noFieldsPost.status, 400);
  const noFieldsPut = await makeRequest('PUT', '/api/goals', {}, authToken);
  logResult('PUT empty body 400', noFieldsPut.status === 400, noFieldsPut.status, 400);

  // 3. Progress calculation ignores missing metric fields (simulate partial metrics)
  console.log('\n-- Progress: partial metrics should not produce NaN --');
  // Set goals to known values
  await makeRequest('POST', '/api/goals', { stepGoal: 10000, calorieGoal: 2000, distanceGoal: 5, sleepGoal: 8 }, authToken);
  // Create metric with only steps & distance (omit calories & sleepHours intentionally)
  const today = new Date(); today.setUTCHours(0,0,0,0); const dateStr = today.toISOString().split('T')[0];
  await makeRequest('POST', '/api/metrics', { date: dateStr, metrics: { steps: 2500, distance: 2.5 } }, authToken);
  const progressPartial = await makeRequest('GET', '/api/goals/progress', null, authToken);
  logResult('Progress endpoint 200', progressPartial.status === 200, progressPartial.status, 200);
  const p = progressPartial.data.data.progress;
  logResult('Steps progress present', !!p.steps, p.steps, 'object');
  logResult('Distance progress present', !!p.distance, p.distance, 'object');
  logResult('Calories progress absent (missing metric)', p.calories === undefined, p.calories, undefined);
  logResult('Sleep progress absent (missing metric)', p.sleep === undefined, p.sleep, undefined);
  logResult('No NaN percentages', Object.values(p).every(x => typeof x.percentage === 'number' && !Number.isNaN(x.percentage)), p, 'numeric percentages');

  // 4. Weight goal progress difference & achievement threshold
  console.log('\n-- Weight goal progress difference threshold --');
  await makeRequest('POST', '/api/goals', { weightGoal: 75 }, authToken);
  // Add weight metric close to goal (within 0.5)
  await makeRequest('POST', '/api/metrics', { date: dateStr, metrics: { weight: 75.3 } }, authToken);
  const progressWeight = await makeRequest('GET', '/api/goals/progress', null, authToken);
  const pw = progressWeight.data.data.progress.weight;
  logResult('Weight progress exists', !!pw, pw, 'object');
  logResult('Weight difference calculation correct', pw && pw.difference === '0.3', pw && pw.difference, '0.3');
  logResult('Weight achieved (<=0.5 diff)', pw && pw.achieved === true, pw && pw.achieved, true);

  // 5. Event emission still occurs (cannot directly assert SSE, but state changes persist)
  console.log('\n-- Event emission side-effect (state changes) --');
  const updateAgain = await makeRequest('PUT', '/api/goals', { stepGoal: 9000 }, authToken);
  logResult('Update again 200', updateAgain.status === 200, updateAgain.status, 200);
  const getGoals = await makeRequest('GET', '/api/goals', null, authToken);
  logResult('GET reflects updated stepGoal', getGoals.data.data.stepGoal === 9000, getGoals.data.data.stepGoal, 9000);

  // 6. Invalid value (below minimum) should return 400 and message containing 1,000 or 1000
  console.log('\n-- Invalid value formatting acceptance --');
  const invalidValue = await makeRequest('PUT', '/api/goals', { stepGoal: 100 }, authToken);
  logResult('Invalid below-min returns 400', invalidValue.status === 400, invalidValue.status, 400);
  const msg = invalidValue.data.message || '';
  logResult('Error message mentions 1000 (with or without comma)', /1000|1,000/.test(msg), msg, 'contains 1000');

  console.log('\n===== Enhanced Tests Complete =====');
})();
