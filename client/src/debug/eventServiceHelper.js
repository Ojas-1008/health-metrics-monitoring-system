/**
 * ============================================
 * EVENTSERVICE BROWSER CONSOLE HELPERS
 * ============================================
 *
 * Copy and paste this into browser console for quick testing
 * Provides helper functions to test EventService functionality
 */

// ===== SETUP HELPERS =====

/**
 * Initialize EventService with automatic setup
 */
window.__setupEventService = async function() {
  console.log('🔧 Setting up EventService...');

  // Import service
  const { default: eventService } = await import('/src/services/eventService.js');
  window.__eventService = eventService;

  // Get token
  const token = localStorage.getItem('health_metrics_token');
  if (!token) {
    console.error('❌ No token found in localStorage');
    console.error('   Check: localStorage.getItem("health_metrics_token")');
    return;
  }

  console.log('✓ Token found:', token.substring(0, 20) + '...');

  // Subscribe to all events
  window.__setupEventListeners();

  // Connect
  await eventService.connect(token);

  console.log('✓ EventService ready!');
  console.log('Available commands:');
  console.log('  - __es.getStatus() - Get current status');
  console.log('  - __es.disconnect() - Disconnect');
  console.log('  - __es.on(type, fn) - Subscribe to event');
  console.log('  - __es.off(type, fn) - Unsubscribe from event');
};

/**
 * Setup event listeners
 */
window.__setupEventListeners = function() {
  const es = window.__eventService;

  if (!es) {
    console.error('❌ EventService not initialized. Run __setupEventService() first');
    return;
  }

  console.log('📌 Setting up event listeners...');

  es.on('connected', (data) => {
    console.log('✅ Connected:', data);
  });

  es.on('ping', (data) => {
    console.log('❤️  Heartbeat:', data);
  });

  es.on('metrics:change', (data) => {
    console.log('📊 Metrics changed:', data);
  });

  es.on('sync:update', (data) => {
    console.log('🔄 Sync update:', data);
  });

  es.on('goals:updated', (data) => {
    console.log('🎯 Goals updated:', data);
  });

  es.on('connectionStatus', (status) => {
    const icon = status.connected ? '🟢' : '🔴';
    console.log(`${icon} Connection status:`, status);
  });

  console.log('✓ Event listeners configured');
};

/**
 * Quick alias for easier access
 */
Object.defineProperty(window, '__es', {
  get: () => window.__eventService || { error: 'EventService not initialized' },
  enumerable: true
});

// ===== STATUS HELPERS =====

/**
 * Print formatted status
 */
window.__esStatus = function() {
  const es = window.__eventService;
  if (!es) {
    console.error('❌ EventService not initialized');
    return;
  }

  const status = es.getStatus();
  console.table({
    'Connected': status.connected,
    'Ready State': status.readyStateName,
    'Retry Count': `${status.retryCount}/${status.maxRetries}`,
    'Last Heartbeat': new Date(status.lastHeartbeat).toLocaleTimeString(),
    'Time Since Heartbeat': `${Math.round(status.timeSinceHeartbeat / 1000)}s ago`,
    'Connection Attempt': status.connectionAttempt
  });
};

/**
 * Print listeners summary
 */
window.__esListeners = function() {
  const es = window.__eventService;
  if (!es) {
    console.error('❌ EventService not initialized');
    return;
  }

  const summary = {};
  es.listeners.forEach((listeners, eventType) => {
    summary[eventType] = `${listeners.size} listener(s)`;
  });

  console.log('📡 Subscribed Events:');
  console.table(summary);
};

/**
 * Test the connection with a simple disconnect/reconnect
 */
window.__esTest = async function() {
  const es = window.__eventService;
  if (!es) {
    console.error('❌ EventService not initialized');
    return;
  }

  console.log('🧪 Running connection test...');

  // Store token
  const token = es.token;
  if (!token) {
    console.error('❌ No token stored in EventService');
    return;
  }

  // Disconnect
  console.log('1️⃣  Disconnecting...');
  es.disconnect();

  // Wait 1 second
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Reconnect
  console.log('2️⃣  Reconnecting...');
  await es.connect(token);

  // Check status
  console.log('3️⃣  Final status:');
  window.__esStatus();
};

/**
 * Simulate connection loss
 */
window.__esSimulateLoss = function() {
  const es = window.__eventService;
  if (!es || !es.eventSource) {
    console.error('❌ EventService not connected');
    return;
  }

  console.log('💥 Simulating connection loss...');
  es.eventSource.close();
  console.log('Watch console for reconnection attempts...');
};

/**
 * Monitor connection attempts
 */
window.__esMonitorReconnection = function() {
  const es = window.__eventService;
  if (!es) {
    console.error('❌ EventService not initialized');
    return;
  }

  console.log('👁️  Monitoring reconnection attempts...');

  let attempt = 0;
  es.on('connectionStatus', (status) => {
    if (status.reason === 'reconnecting') {
      attempt++;
      console.log(
        `\n🔄 Reconnection Attempt ${attempt}:\n` +
        `   Retry: ${status.retryCount}/${status.maxRetries}\n` +
        `   Delay: ${status.delay}ms (${(status.delay / 1000).toFixed(1)}s)\n` +
        `   Timestamp: ${new Date(status.timestamp).toLocaleTimeString()}`
      );
    }
  });
};

// ===== PRINT HELP =====

console.log(`
╔════════════════════════════════════════════════════════════╗
║         EventService Browser Console Helpers              ║
╚════════════════════════════════════════════════════════════╝

🚀 QUICK START:
  await __setupEventService()    Initialize and connect

📊 STATUS COMMANDS:
  __esStatus()                   Show connection status
  __esListeners()                Show active listeners
  __es                           Quick access to service

🧪 TESTING COMMANDS:
  __esTest()                     Test disconnect/reconnect
  __esSimulateLoss()             Simulate connection loss
  __esMonitorReconnection()      Watch reconnection attempts

💡 MANUAL CONTROL:
  __es.connect(token)            Manual connect
  __es.disconnect()              Manual disconnect
  __es.on(type, fn)              Subscribe to event
  __es.off(type, fn)             Unsubscribe from event

📚 DOCUMENTATION:
  See docs/EVENTSERVICE_TESTING.md for full guide
`);
