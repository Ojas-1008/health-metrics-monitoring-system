/**
 * @fileoverview Comprehensive Test Script for analyticsController.js
 * @description Tests all endpoints and functionalities of the analytics controller
 * @created 2025-11-23
 * 
 * This script tests:
 * 1. GET /api/analytics/latest/:metricType - Get latest analytics for a metric
 * 2. GET /api/analytics - Get all analytics with filters
 * 3. GET /api/analytics/:id - Get analytics by ID
 * 4. GET /api/analytics/anomalies - Get all anomalies
 * 5. GET /api/analytics/summary - Get analytics summary
 * 6. DELETE /api/analytics/:id - Delete analytics by ID
 * 
 * Authentication: Uses real credentials to get JWT token
 * Email: ojasshrivastava1008@gmail.com
 * Password: Krishna@1008
 */

const BASE_URL = process.env.SERVER_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

// Test credentials
const TEST_USER = {
    email: 'ojasshrivastava1008@gmail.com',
    password: 'Krishna@1008'
};

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// Test results tracker
const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
};

/**
 * Helper function to make HTTP requests
 */
async function makeRequest(method, endpoint, data = null, token = null) {
    const url = `${API_URL}${endpoint}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        const responseData = await response.json();

        return {
            status: response.status,
            ok: response.ok,
            data: responseData
        };
    } catch (error) {
        return {
            status: 0,
            ok: false,
            error: error.message
        };
    }
}

/**
 * Helper function to log test results
 */
function logTest(testName, passed, message, details = null) {
    testResults.total++;
    if (passed) {
        testResults.passed++;
        console.log(`${colors.green}✓${colors.reset} ${testName}`);
    } else {
        testResults.failed++;
        console.log(`${colors.red}✗${colors.reset} ${testName}`);
        console.log(`  ${colors.red}Message: ${message}${colors.reset}`);
        if (details) {
            console.log(`  ${colors.yellow}Details: ${JSON.stringify(details, null, 2)}${colors.reset}`);
        }
    }

    testResults.tests.push({
        name: testName,
        passed,
        message,
        details
    });
}

/**
 * Step 1: Authenticate and get JWT token
 */
async function authenticate() {
    console.log(`\n${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}  STEP 1: AUTHENTICATION${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════${colors.reset}\n`);

    const response = await makeRequest('POST', '/auth/login', TEST_USER);

    if (response.ok && response.data.token) {
        logTest('User authentication', true, 'Successfully authenticated');
        console.log(`  ${colors.blue}Token received: ${response.data.token.substring(0, 20)}...${colors.reset}\n`);
        return response.data.token;
    } else {
        logTest('User authentication', false, 'Failed to authenticate', response.data);
        console.log(`\n${colors.red}${colors.bright}CRITICAL ERROR: Cannot proceed without authentication${colors.reset}\n`);
        return null;
    }
}

/**
 * Step 2: Test GET /api/analytics/latest/:metricType
 */
async function testGetLatestAnalytics(token) {
    console.log(`\n${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}  STEP 2: TEST GET LATEST ANALYTICS${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════${colors.reset}\n`);

    const metricTypes = ['steps', 'calories', 'distance', 'activeMinutes', 'weight', 'sleepHours', 'heartPoints', 'hydration'];
    const timeRanges = ['7day', '30day', '90day'];

    // Test valid metric types
    for (const metricType of metricTypes) {
        const response = await makeRequest('GET', `/analytics/latest/${metricType}`, null, token);

        if (response.ok) {
            logTest(`Get latest analytics for ${metricType}`, true, 'Request successful');
            if (response.data.data) {
                console.log(`  ${colors.blue}Found analytics for ${metricType}${colors.reset}`);
            } else {
                console.log(`  ${colors.yellow}No analytics data available yet for ${metricType}${colors.reset}`);
            }
        } else {
            logTest(`Get latest analytics for ${metricType}`, false, 'Request failed', response.data);
        }
    }

    // Test with timeRange parameter
    console.log(`\n${colors.magenta}Testing with timeRange parameter...${colors.reset}\n`);
    for (const timeRange of timeRanges) {
        const response = await makeRequest('GET', `/analytics/latest/steps?timeRange=${timeRange}`, null, token);

        if (response.ok) {
            logTest(`Get latest analytics for steps with timeRange=${timeRange}`, true, 'Request successful');
        } else {
            logTest(`Get latest analytics for steps with timeRange=${timeRange}`, false, 'Request failed', response.data);
        }
    }

    // Test invalid metric type
    console.log(`\n${colors.magenta}Testing invalid inputs...${colors.reset}\n`);
    const invalidResponse = await makeRequest('GET', '/analytics/latest/invalidMetric', null, token);

    if (!invalidResponse.ok && invalidResponse.status === 400) {
        logTest('Reject invalid metric type', true, 'Correctly rejected invalid metric');
    } else {
        logTest('Reject invalid metric type', false, 'Should reject invalid metric type', invalidResponse.data);
    }

    // Test invalid timeRange
    const invalidTimeRange = await makeRequest('GET', '/analytics/latest/steps?timeRange=invalidRange', null, token);

    if (!invalidTimeRange.ok && invalidTimeRange.status === 400) {
        logTest('Reject invalid timeRange', true, 'Correctly rejected invalid timeRange');
    } else {
        logTest('Reject invalid timeRange', false, 'Should reject invalid timeRange', invalidTimeRange.data);
    }
}

/**
 * Step 3: Test GET /api/analytics (Get all analytics)
 */
async function testGetAllAnalytics(token) {
    console.log(`\n${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}  STEP 3: TEST GET ALL ANALYTICS${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════${colors.reset}\n`);

    // Test basic retrieval
    const basicResponse = await makeRequest('GET', '/analytics', null, token);

    if (basicResponse.ok) {
        logTest('Get all analytics (basic)', true, 'Request successful');
        console.log(`  ${colors.blue}Total analytics: ${basicResponse.data.count}${colors.reset}`);
        console.log(`  ${colors.blue}Pagination info: ${JSON.stringify(basicResponse.data.pagination)}${colors.reset}\n`);
    } else {
        logTest('Get all analytics (basic)', false, 'Request failed', basicResponse.data);
    }

    // Test with metricType filter
    console.log(`${colors.magenta}Testing with filters...${colors.reset}\n`);
    const filterResponse = await makeRequest('GET', '/analytics?metricType=steps&limit=10', null, token);

    if (filterResponse.ok) {
        logTest('Get all analytics with metricType filter', true, 'Request successful');
        console.log(`  ${colors.blue}Filtered results: ${filterResponse.data.count}${colors.reset}\n`);
    } else {
        logTest('Get all analytics with metricType filter', false, 'Request failed', filterResponse.data);
    }

    // Test with timeRange filter
    const timeRangeResponse = await makeRequest('GET', '/analytics?timeRange=7day&limit=10', null, token);

    if (timeRangeResponse.ok) {
        logTest('Get all analytics with timeRange filter', true, 'Request successful');
    } else {
        logTest('Get all analytics with timeRange filter', false, 'Request failed', timeRangeResponse.data);
    }

    // Test with anomaliesOnly filter
    const anomaliesResponse = await makeRequest('GET', '/analytics?anomaliesOnly=true', null, token);

    if (anomaliesResponse.ok) {
        logTest('Get all analytics with anomaliesOnly filter', true, 'Request successful');
        console.log(`  ${colors.blue}Anomalies found: ${anomaliesResponse.data.count}${colors.reset}\n`);
    } else {
        logTest('Get all analytics with anomaliesOnly filter', false, 'Request failed', anomaliesResponse.data);
    }

    // Test pagination
    console.log(`${colors.magenta}Testing pagination...${colors.reset}\n`);
    const paginationResponse = await makeRequest('GET', '/analytics?limit=5&skip=0', null, token);

    if (paginationResponse.ok) {
        logTest('Get all analytics with pagination', true, 'Request successful');
        console.log(`  ${colors.blue}Has more data: ${paginationResponse.data.pagination.hasMore}${colors.reset}\n`);
    } else {
        logTest('Get all analytics with pagination', false, 'Request failed', paginationResponse.data);
    }

    // Test date range filtering
    console.log(`${colors.magenta}Testing date range filtering...${colors.reset}\n`);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const dateRangeResponse = await makeRequest('GET', `/analytics?startDate=${startDate.toISOString()}`, null, token);

    if (dateRangeResponse.ok) {
        logTest('Get all analytics with date range', true, 'Request successful');
    } else {
        logTest('Get all analytics with date range', false, 'Request failed', dateRangeResponse.data);
    }

    // Test sorting
    console.log(`${colors.magenta}Testing sorting...${colors.reset}\n`);
    const sortResponse = await makeRequest('GET', '/analytics?sortBy=calculatedAt&sortOrder=asc&limit=5', null, token);

    if (sortResponse.ok) {
        logTest('Get all analytics with sorting', true, 'Request successful');
    } else {
        logTest('Get all analytics with sorting', false, 'Request failed', sortResponse.data);
    }

    // Test invalid date format
    console.log(`${colors.magenta}Testing invalid inputs...${colors.reset}\n`);
    const invalidDateResponse = await makeRequest('GET', '/analytics?startDate=invalid-date', null, token);

    if (!invalidDateResponse.ok && invalidDateResponse.status === 400) {
        logTest('Reject invalid date format', true, 'Correctly rejected invalid date');
    } else {
        logTest('Reject invalid date format', false, 'Should reject invalid date format', invalidDateResponse.data);
    }
}

/**
 * Step 4: Test GET /api/analytics/anomalies
 */
async function testGetAnomalies(token) {
    console.log(`\n${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}  STEP 4: TEST GET ANOMALIES${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════${colors.reset}\n`);

    // Test basic anomalies retrieval
    const basicResponse = await makeRequest('GET', '/analytics/anomalies', null, token);

    if (basicResponse.ok) {
        logTest('Get all anomalies (basic)', true, 'Request successful');
        console.log(`  ${colors.blue}Total anomalies: ${basicResponse.data.count}${colors.reset}\n`);
    } else {
        logTest('Get all anomalies (basic)', false, 'Request failed', basicResponse.data);
    }

    // Test with severity filter
    console.log(`${colors.magenta}Testing with filters...${colors.reset}\n`);
    const severities = ['low', 'medium', 'high'];
    for (const severity of severities) {
        const response = await makeRequest('GET', `/analytics/anomalies?severity=${severity}`, null, token);

        if (response.ok) {
            logTest(`Get anomalies with severity=${severity}`, true, 'Request successful');
            console.log(`  ${colors.blue}Found ${response.data.count} ${severity} severity anomalies${colors.reset}\n`);
        } else {
            logTest(`Get anomalies with severity=${severity}`, false, 'Request failed', response.data);
        }
    }

    // Test with metricType filter
    const metricResponse = await makeRequest('GET', '/analytics/anomalies?metricType=steps', null, token);

    if (metricResponse.ok) {
        logTest('Get anomalies with metricType filter', true, 'Request successful');
    } else {
        logTest('Get anomalies with metricType filter', false, 'Request failed', metricResponse.data);
    }

    // Test with since parameter
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - 7);
    const sinceResponse = await makeRequest('GET', `/analytics/anomalies?since=${sinceDate.toISOString()}`, null, token);

    if (sinceResponse.ok) {
        logTest('Get anomalies with since parameter', true, 'Request successful');
    } else {
        logTest('Get anomalies with since parameter', false, 'Request failed', sinceResponse.data);
    }

    // Test with limit parameter
    const limitResponse = await makeRequest('GET', '/analytics/anomalies?limit=10', null, token);

    if (limitResponse.ok) {
        logTest('Get anomalies with limit', true, 'Request successful');
    } else {
        logTest('Get anomalies with limit', false, 'Request failed', limitResponse.data);
    }

    // Test invalid severity
    console.log(`${colors.magenta}Testing invalid inputs...${colors.reset}\n`);
    const invalidSeverity = await makeRequest('GET', '/analytics/anomalies?severity=invalid', null, token);

    if (!invalidSeverity.ok && invalidSeverity.status === 400) {
        logTest('Reject invalid severity', true, 'Correctly rejected invalid severity');
    } else {
        logTest('Reject invalid severity', false, 'Should reject invalid severity', invalidSeverity.data);
    }

    // Test invalid since date
    const invalidSince = await makeRequest('GET', '/analytics/anomalies?since=invalid-date', null, token);

    if (!invalidSince.ok && invalidSince.status === 400) {
        logTest('Reject invalid since date', true, 'Correctly rejected invalid date');
    } else {
        logTest('Reject invalid since date', false, 'Should reject invalid date', invalidSince.data);
    }
}

/**
 * Step 5: Test GET /api/analytics/summary
 */
async function testGetAnalyticsSummary(token) {
    console.log(`\n${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}  STEP 5: TEST GET ANALYTICS SUMMARY${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════${colors.reset}\n`);

    const response = await makeRequest('GET', '/analytics/summary', null, token);

    if (response.ok && response.data.success) {
        logTest('Get analytics summary', true, 'Request successful');

        const summary = response.data.data;
        console.log(`\n${colors.blue}Summary Statistics:${colors.reset}`);
        console.log(`  Total Analytics: ${summary.totalAnalytics}`);
        console.log(`  By Metric Type: ${JSON.stringify(summary.byMetricType, null, 2)}`);
        console.log(`  By Time Range: ${JSON.stringify(summary.byTimeRange, null, 2)}`);
        console.log(`  Anomalies Detected: ${summary.anomaliesDetected}`);
        console.log(`  Current Streaks: ${JSON.stringify(summary.currentStreaks, null, 2)}`);
        console.log(`  Latest Update: ${summary.latestUpdate}\n`);
    } else {
        logTest('Get analytics summary', false, 'Request failed', response.data);
    }
}

/**
 * Step 6: Test GET /api/analytics/:id and DELETE /api/analytics/:id
 */
async function testGetAndDeleteAnalyticsById(token) {
    console.log(`\n${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}  STEP 6: TEST GET AND DELETE BY ID${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════${colors.reset}\n`);

    // First, get all analytics to find a valid ID
    const allAnalytics = await makeRequest('GET', '/analytics?limit=1', null, token);

    if (allAnalytics.ok && allAnalytics.data.count > 0) {
        const analyticsId = allAnalytics.data.data[0]._id;
        console.log(`  ${colors.blue}Using analytics ID: ${analyticsId}${colors.reset}\n`);

        // Test GET by ID
        const getResponse = await makeRequest('GET', `/analytics/${analyticsId}`, null, token);

        if (getResponse.ok) {
            logTest('Get analytics by ID', true, 'Request successful');
            console.log(`  ${colors.blue}Retrieved analytics: ${getResponse.data.data.metricType} - ${getResponse.data.data.timeRange}${colors.reset}\n`);
        } else {
            logTest('Get analytics by ID', false, 'Request failed', getResponse.data);
        }

        // Test DELETE by ID (optional - comment out if you don't want to delete)
        // Uncomment the lines below to test deletion
        /*
        const deleteResponse = await makeRequest('DELETE', `/analytics/${analyticsId}`, null, token);
        
        if (deleteResponse.ok) {
          logTest('Delete analytics by ID', true, 'Successfully deleted');
          
          // Verify deletion
          const verifyResponse = await makeRequest('GET', `/analytics/${analyticsId}`, null, token);
          if (!verifyResponse.ok && verifyResponse.status === 404) {
            logTest('Verify analytics deletion', true, 'Analytics no longer exists');
          } else {
            logTest('Verify analytics deletion', false, 'Analytics still exists after deletion', verifyResponse.data);
          }
        } else {
          logTest('Delete analytics by ID', false, 'Deletion failed', deleteResponse.data);
        }
        */
    } else {
        console.log(`  ${colors.yellow}No analytics data available to test GET/DELETE by ID${colors.reset}\n`);
        logTest('Get analytics by ID', false, 'No analytics data available', null);
    }

    // Test with invalid ID
    console.log(`${colors.magenta}Testing invalid ID...${colors.reset}\n`);
    const invalidIdResponse = await makeRequest('GET', '/analytics/invalid-id-format', null, token);

    if (!invalidIdResponse.ok && invalidIdResponse.status === 404) {
        logTest('Reject invalid ID format', true, 'Correctly rejected invalid ID');
    } else {
        logTest('Reject invalid ID format', false, 'Should reject invalid ID', invalidIdResponse.data);
    }

    // Test with non-existent ID
    const nonExistentId = '673d8f9a0b2c4e1234567890';
    const nonExistentResponse = await makeRequest('GET', `/analytics/${nonExistentId}`, null, token);

    if (!nonExistentResponse.ok && nonExistentResponse.status === 404) {
        logTest('Reject non-existent ID', true, 'Correctly returned 404 for non-existent ID');
    } else {
        logTest('Reject non-existent ID', false, 'Should return 404 for non-existent ID', nonExistentResponse.data);
    }
}

/**
 * Step 7: Test authentication requirements
 */
async function testAuthenticationRequirements() {
    console.log(`\n${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}  STEP 7: TEST AUTHENTICATION REQUIREMENTS${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════${colors.reset}\n`);

    const endpoints = [
        '/analytics/latest/steps',
        '/analytics',
        '/analytics/anomalies',
        '/analytics/summary'
    ];

    for (const endpoint of endpoints) {
        const response = await makeRequest('GET', endpoint, null, null);

        if (!response.ok && response.status === 401) {
            logTest(`Require authentication for ${endpoint}`, true, 'Correctly rejected unauthenticated request');
        } else {
            logTest(`Require authentication for ${endpoint}`, false, 'Should require authentication', response.data);
        }
    }
}

/**
 * Print final test summary
 */
function printTestSummary() {
    console.log(`\n${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}  TEST SUMMARY${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════${colors.reset}\n`);

    console.log(`  Total Tests: ${testResults.total}`);
    console.log(`  ${colors.green}Passed: ${testResults.passed}${colors.reset}`);
    console.log(`  ${colors.red}Failed: ${testResults.failed}${colors.reset}`);

    const successRate = ((testResults.passed / testResults.total) * 100).toFixed(2);
    const successColor = successRate >= 90 ? colors.green : successRate >= 70 ? colors.yellow : colors.red;
    console.log(`  ${successColor}Success Rate: ${successRate}%${colors.reset}\n`);

    if (testResults.failed > 0) {
        console.log(`${colors.red}${colors.bright}Failed Tests:${colors.reset}\n`);
        testResults.tests
            .filter(test => !test.passed)
            .forEach(test => {
                console.log(`  ${colors.red}✗ ${test.name}${colors.reset}`);
                console.log(`    Message: ${test.message}`);
                if (test.details) {
                    console.log(`    Details: ${JSON.stringify(test.details, null, 2)}`);
                }
                console.log();
            });
    }

    console.log(`${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════${colors.reset}\n`);
}

/**
 * Main test execution
 */
async function runTests() {
    console.log(`\n${colors.bright}${colors.cyan}╔═══════════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}║                                                               ║${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}║   COMPREHENSIVE ANALYTICS CONTROLLER TEST SUITE               ║${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}║                                                               ║${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}╚═══════════════════════════════════════════════════════════════╝${colors.reset}\n`);

    console.log(`${colors.blue}Testing API at: ${API_URL}${colors.reset}`);
    console.log(`${colors.blue}Test User: ${TEST_USER.email}${colors.reset}\n`);

    try {
        // Step 1: Authenticate
        const token = await authenticate();

        if (!token) {
            console.log(`${colors.red}${colors.bright}Test suite aborted due to authentication failure${colors.reset}\n`);
            return;
        }

        // Step 2: Test getLatestAnalytics
        await testGetLatestAnalytics(token);

        // Step 3: Test getAllAnalytics
        await testGetAllAnalytics(token);

        // Step 4: Test getAnomalies
        await testGetAnomalies(token);

        // Step 5: Test getAnalyticsSummary
        await testGetAnalyticsSummary(token);

        // Step 6: Test getAnalyticsById and deleteAnalytics
        await testGetAndDeleteAnalyticsById(token);

        // Step 7: Test authentication requirements
        await testAuthenticationRequirements();

        // Print summary
        printTestSummary();

    } catch (error) {
        console.error(`\n${colors.red}${colors.bright}FATAL ERROR:${colors.reset}`);
        console.error(`${colors.red}${error.message}${colors.reset}`);
        console.error(`${colors.red}${error.stack}${colors.reset}\n`);
    }
}

// Run the tests
runTests();
