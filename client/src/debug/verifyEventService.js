/**
 * ============================================
 * EVENTSERVICE VERIFICATION SCRIPT
 * ============================================
 * 
 * Run this in browser DevTools Console to verify the fix
 */

console.log('%c🔍 EventService Configuration Verification', 'font-size: 14px; font-weight: bold; color: #667eea;');
console.log('='.repeat(60));

// Check 1: Import and verify config
try {
  const { CONFIG } = await import('/src/services/eventService.js');
  
  console.log('\n✅ Module imported successfully');
  console.log('\nConfiguration:');
  console.table({
    'Base URL': CONFIG.baseUrl,
    'Endpoint': CONFIG.endpoint,
    'Full URL': CONFIG.baseUrl + CONFIG.endpoint,
    'Max Retries': CONFIG.maxRetries,
    'Initial Retry Delay': CONFIG.initialRetryDelay + 'ms',
    'Heartbeat Timeout': CONFIG.heartbeatTimeout + 'ms'
  });

  // Check 2: Verify URL construction
  console.log('\n📋 URL Analysis:');
  const expectedUrl = 'http://localhost:5000/api/events/stream';
  const actualUrl = CONFIG.baseUrl + CONFIG.endpoint;
  
  if (actualUrl === expectedUrl) {
    console.log(`✅ CORRECT: ${actualUrl}`);
  } else {
    console.warn(`❌ INCORRECT: ${actualUrl}`);
    console.warn(`   Expected: ${expectedUrl}`);
  }

  // Check 3: Verify token
  const token = localStorage.getItem('health_metrics_token');
  if (token) {
    console.log('\n🔐 Token Status:');
    console.log(`✅ Token found in localStorage`);
    console.log(`   Key: 'health_metrics_token'`);
    console.log(`   Length: ${token.length} characters`);
    console.log(`   Sample: ${token.substring(0, 20)}...`);
  } else {
    console.error('❌ No token found in localStorage');
    console.error('   Key should be: "health_metrics_token"');
    console.error('   Please log in first');
  }

  // Check 4: Test connection
  console.log('\n🚀 Connection Test:');
  console.log('Running: await eventService.connect(token)');
  
  const { default: eventService } = await import('/src/services/eventService.js');
  
  // Subscribe before connecting
  eventService.on('connected', (data) => {
    console.log('✅ Connected event received:', data);
  });

  eventService.on('connectionStatus', (status) => {
    if (status.connected) {
      console.log('✅ Connection Status: Connected');
    } else {
      console.warn('⚠️  Connection Status: ' + status.reason);
    }
  });

  if (token) {
    await eventService.connect(token);
    
    // Wait a bit for connection
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const status = eventService.getStatus();
    console.log('\n📊 Final Status:');
    console.table({
      'Connected': status.connected ? '✅ Yes' : '❌ No',
      'Ready State': status.readyStateName,
      'Retry Count': status.retryCount,
      'Connection Attempt': status.connectionAttempt
    });

    if (status.connected) {
      console.log('\n%c✅ SUCCESS! EventService is working correctly', 'font-size: 12px; font-weight: bold; color: #10b981;');
    } else {
      console.warn('\n%c⚠️  Connection failed. Check server logs.', 'font-size: 12px; font-weight: bold; color: #f59e0b;');
    }
  } else {
    console.error('Skipping connection test - no token available');
  }

  console.log('\n' + '='.repeat(60));
  console.log('Verification complete!');

} catch (error) {
  console.error('❌ Error during verification:', error);
  console.error('Stack:', error.stack);
}
