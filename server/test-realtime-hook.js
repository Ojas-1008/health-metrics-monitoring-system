/**
 * ============================================
 * TEST REALTIME HOOK - API TEST SCRIPT
 * ============================================
 *
 * Simple script to test the useRealtimeEvents hook by triggering
 * a metrics change event via the API.
 *
 * Usage:
 * 1. Start the server: npm run dev
 * 2. Start the client: npm run dev (in client directory)
 * 3. Run this script: node test-realtime-hook.js
 * 4. Watch the browser for real-time updates
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
const TEST_USER_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MGI5NDQ5YzMzMjVlODVmOWFiN2EwZSIsImlhdCI6MTc2MzA1MTQyMywiZXhwIjoxNzYzNjU2MjIzfQ.KDcsasf2lsTT89rFdgWq9jt7AModA7aCvorOMbI_Maw"; // Replace with actual token

async function testRealtimeHook() {
  console.log('🧪 Testing useRealtimeEvents hook...\n');

  try {
    // First, get a valid token by logging in
    console.log('1. Logging in to get token...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'ojasshrivastava1008@gmail.com', // Use your test user
        password: 'Krishna@1008'
      })
    });

    const loginData = await loginResponse.json();

    if (!loginData.success) {
      console.error('❌ Login failed:', loginData.message);
      console.log('\n💡 Make sure to create a test user first or update the credentials');
      return;
    }

    const token = loginData.token;
    console.log('✅ Login successful, got token\n');

    // Now trigger a metrics change event
    console.log('2. Adding test metrics to trigger real-time event...');
    const metricsResponse = await fetch(`${BASE_URL}/api/metrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        date: new Date().toISOString().split('T')[0], // Today's date
        metrics: {
          steps: Math.floor(Math.random() * 1000) + 5000,
          calories: Math.floor(Math.random() * 500) + 1500,
          sleepHours: Math.floor(Math.random() * 3) + 6,
          weight: 70 + Math.random() * 5
        },
        source: 'manual'
      })
    });

    const metricsData = await metricsResponse.json();

    if (metricsData.success) {
      console.log('✅ Metrics added successfully!');
      console.log('📊 Added metrics:', metricsData.data.metrics);
      console.log('\n🎉 Check your browser - the TestRealtimeHook component should show the new event!');
      console.log('🔔 Look for the "metrics:change" event in the event log.');
    } else {
      console.error('❌ Failed to add metrics:', metricsData.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure the server is running on port 5000');
    console.log('2. Make sure you have a test user account');
    console.log('3. Check that the client is running and logged in');
  }
}

// Run the test
testRealtimeHook();