# EventService Testing Guide

## Overview

Complete testing guide for the **EventService** - a production-ready Server-Sent Events (SSE) service with automatic reconnection, event routing, and real-time updates.

**Location:** `client/src/services/eventService.js`  
**Backend Endpoint:** `GET /api/events/stream?token=<jwt-token>`  
**Frontend Base URL:** Configured via `VITE_API_URL` (defaults to `http://localhost:5000/api`)

---

## Prerequisites

### 1. **Backend Running**
```bash
cd server
npm run dev
# Server should be on http://localhost:5000
```

### 2. **Frontend Running**
```bash
cd client
npm run dev
# Frontend should be on http://localhost:5173
```

### 3. **Valid JWT Token**
- Log in to your React app
- Token is automatically stored in `localStorage` under key `token`
- Check DevTools → Application → Local Storage → token

---

## Test 1: Browser Console Connection

The simplest test - connect directly from browser console.

### Steps:

1. **Open React App**
   - Navigate to `http://localhost:5173`
   - Log in to your account

2. **Open DevTools Console**
   - Press `F12` or `Ctrl+Shift+I`
   - Click "Console" tab

3. **Get Token**
   ```javascript
   const token = localStorage.getItem('health_metrics_token');
   console.log('Token:', token);
   ```
   Should output something like: `Token: eyJhbGciOiJIUzI1NiIs...`

4. **Import EventService**
   ```javascript
   const { default: eventService } = await import('/src/services/eventService.js');
   ```

5. **Subscribe to Events**
   ```javascript
   // Connection status monitoring
   eventService.on('connectionStatus', (status) => {
     console.log('🔌 Connection Status:', status);
   });

   // Heartbeat/ping
   eventService.on('ping', (data) => {
     console.log('❤️ Heartbeat received:', data);
   });

   // Connection confirmed
   eventService.on('connected', (data) => {
     console.log('✓ Connected:', data);
   });

   // Metrics changed
   eventService.on('metrics:change', (data) => {
     console.log('📊 Metrics changed:', data);
   });

   // Google Fit sync update
   eventService.on('sync:update', (data) => {
     console.log('🔄 Sync update:', data);
   });

   // Goals updated
   eventService.on('goals:updated', (data) => {
     console.log('🎯 Goals updated:', data);
   });
   ```

6. **Connect**
   ```javascript
   await eventService.connect(token);
   ```

### Expected Output (Console):

```
[EventService] Connection attempt 1...
[EventService] ✓ Connection established
[EventService] Connection confirmed: { userId: '...', timestamp: ... }
[EventService] Subscribed to connectionStatus (1 listener(s))
[EventService] Subscribed to ping (1 listener(s))
...
🔌 Connection Status: { connected: true, attempt: 1, timestamp: '...' }
✓ Connected: { userId: '...', timestamp: ... }
❤️ Heartbeat received: { message: 'ping', timestamp: ... }
```

### Verification Checklist:
- ✅ Connection established message appears
- ✅ Heartbeat (ping) events received every 30 seconds
- ✅ No connection errors in console
- ✅ `eventService.getStatus()` returns `connected: true`

---

## Test 2: Check Connection Status

Monitor the current connection state.

### Steps:

```javascript
// Get full status
const status = eventService.getStatus();
console.log('Full Status:', status);

// Expected output:
{
  connected: true,
  readyState: 1,                    // 1 = OPEN
  readyStateName: 'open',
  retryCount: 0,
  maxRetries: 10,
  lastHeartbeat: 1731312345678,
  timeSinceHeartbeat: 2345,         // milliseconds
  connectionAttempt: 1
}
```

### Key Values:

| Field | Meaning |
|-------|---------|
| `connected` | True = SSE connection active |
| `readyState` | 0=CONNECTING, 1=OPEN, 2=CLOSED |
| `retryCount` | Current reconnection attempt (0 if connected) |
| `lastHeartbeat` | Timestamp of last ping |
| `timeSinceHeartbeat` | Milliseconds since last ping |

---

## Test 3: Simulate Connection Loss & Reconnection

Test automatic reconnection with exponential backoff.

### Steps:

1. **Establish connection** (see Test 1)

2. **Check initial status**
   ```javascript
   console.log('Before disconnect:', eventService.getStatus());
   ```

3. **Simulate connection loss**
   ```javascript
   // Close the underlying EventSource
   eventService.eventSource.close();
   ```

4. **Watch reconnection**
   ```javascript
   // Monitor status changes
   let attempt = 0;
   eventService.on('connectionStatus', (status) => {
     if (status.reason === 'reconnecting') {
       console.log(`Reconnection attempt ${++attempt}: Waiting ${status.delay}ms...`);
     }
   });
   ```

5. **Expected Behavior:**
   - Connection marked as failed
   - Backoff delays: 1s, 2s, 4s, 8s, 16s, 30s, 30s, 30s, 30s, 30s
   - Eventually reconnects and resumes
   - Heartbeat resumes after reconnection

### Expected Console Output:

```
[EventService] Connection closed by server
[EventService] Scheduling reconnection attempt 1/10 in 1000ms (1.0s)
🔌 Connection Status: { connected: false, reason: 'reconnecting', retryCount: 1, delay: 1000 }

[After 1s delay...]

[EventService] Reconnecting now (attempt 1)...
[EventService] ✓ Connection established
🔌 Connection Status: { connected: true, attempt: 2 }
❤️ Heartbeat received
```

### Verification Checklist:
- ✅ Reconnection attempts logged
- ✅ Exponential backoff delays increase
- ✅ Connection eventually reestablishes
- ✅ Heartbeat resumes after reconnection

---

## Test 4: Detailed Reconnection Timing

Test and verify exponential backoff calculations.

### Steps:

```javascript
// Setup timing tracker
const timing = {};
let attemptCount = 0;

eventService.on('connectionStatus', (status) => {
  if (status.reason === 'reconnecting') {
    timing[`attempt_${++attemptCount}`] = {
      delay: status.delay,
      retryCount: status.retryCount,
      timestamp: new Date().toISOString()
    };
    console.log(`Attempt ${attemptCount}: ${status.delay}ms delay`);
  }
});

// Simulate loss
setTimeout(() => {
  eventService.eventSource.close();
}, 1000);

// Check timing after 2 minutes
setTimeout(() => {
  console.log('Backoff timing verification:', timing);
  // Should show: 1000, 2000, 4000, 8000, 16000, 30000, 30000, ...
}, 120000);
```

### Expected Output:

```
Attempt 1: 1000ms delay
Attempt 2: 2000ms delay
Attempt 3: 4000ms delay
Attempt 4: 8000ms delay
Attempt 5: 16000ms delay
Attempt 6: 30000ms delay
(repeats at 30s intervals)
```

### Verification Checklist:
- ✅ First attempt: 1 second
- ✅ Each attempt doubles until 30 seconds
- ✅ Maximum 10 attempts before giving up
- ✅ Exponential sequence: 1s, 2s, 4s, 8s, 16s, 30s, 30s, 30s, 30s, 30s

---

## Test 5: Event Deduplication

Test that duplicate events are properly detected and handled.

### Steps:

1. **Establish connection** (see Test 1)

2. **Set up event tracking**
   ```javascript
   let eventCount = 0;
   const seenEvents = new Set();

   eventService.on('metrics:change', (data) => {
     eventCount++;
     const eventKey = `${data.operation}-${data.date}`;
     
     if (seenEvents.has(eventKey)) {
       console.warn('⚠️ Duplicate event detected:', eventKey);
     } else {
       seenEvents.add(eventKey);
       console.log('✓ New event:', eventKey);
     }
     
     console.log(`Total events: ${eventCount}, Unique: ${seenEvents.size}`);
   });
   ```

3. **Add a metric via API**
   ```bash
   curl -X POST http://localhost:5000/api/metrics \
     -H "Authorization: Bearer <TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"date":"2025-11-11","metrics":{"steps":10000}}'
   ```

4. **Expected Output**
   ```
   ✓ New event: upsert-2025-11-11
   Total events: 1, Unique: 1
   
   (If duplicates occur:)
   ⚠️ Duplicate event detected: insert-2025-11-11  
   Total events: 2, Unique: 1
   ```

### Verification Checklist:
- ✅ First event received and logged as new
- ✅ Unique event count tracked correctly
- ✅ Duplicate events detected and warned about
- ✅ Event data structure includes `operation` and `date` fields

---

## Test 6: Unsubscribe from Events

Test event listener cleanup.

### Steps:

```javascript
// Create a callback
const metricsCallback = (data) => {
  console.log('Metrics update:', data);
};

// Subscribe
eventService.on('metrics:change', metricsCallback);
console.log('[EventService] Subscribed to metrics:change (1 listener(s))');

// Unsubscribe
eventService.off('metrics:change', metricsCallback);
console.log('[EventService] Unsubscribed from metrics:change (0 listener(s) remaining)');

// Verify no more metrics events
console.log('Listeners map:', eventService.listeners);
// Should NOT have 'metrics:change' key anymore
```

### Expected Output:

```
[EventService] Subscribed to metrics:change (1 listener(s))
[EventService] Unsubscribed from metrics:change (0 listener(s) remaining)
```

---

## Test 7: Manual Disconnect

Test clean shutdown of SSE connection.

### Steps:

```javascript
// Check status before
console.log('Before disconnect:', eventService.getStatus());

// Disconnect
eventService.disconnect();

// Check status after
console.log('After disconnect:', eventService.getStatus());

// Try to reconnect - should fail silently
setTimeout(() => {
  console.log('Status after timeout:', eventService.getStatus());
}, 2000);
```

### Expected Output:

```
Before disconnect: { connected: true, retryCount: 0, ... }
[EventService] Disconnecting...
[EventService] ✓ Disconnected
🔌 Connection Status: { connected: false, reason: 'manual' }
After disconnect: { connected: false, retryCount: 0, ... }
Status after timeout: { connected: false, ... }
```

### Verification Checklist:
- ✅ Disconnect completes successfully
- ✅ No reconnection attempts after manual disconnect
- ✅ Connection status reflects `connected: false`

---

## Test 8: Invalid Token Handling

Test behavior with expired/invalid token.

### Steps:

1. **Create an invalid token**
   ```javascript
   const invalidToken = 'invalid.token.here';
   ```

2. **Try to connect**
   ```javascript
   eventService.on('connectionStatus', (status) => {
     console.log('Status:', status);
   });

   await eventService.connect(invalidToken);
   ```

3. **Expected Error Response**
   ```javascript
   // Server returns 401 error
   // EventService logs error and triggers reconnection
   ```

### Expected Console Output:

```
[EventService] Connection attempt 1...
[EventService] ✗ Failed to connect: Error: ...
🔌 Connection Status: {
  connected: false,
  reason: 'error',
  error: 'Token is invalid',
  timestamp: '...'
}
[EventService] Scheduling reconnection attempt 1/10...
```

### Verification Checklist:
- ✅ Error response logged
- ✅ Reconnection scheduled
- ✅ No infinite retry loop (respects max retries)

---

## Test 9: Multiple Connections (Multi-Tab)

Test EventService with multiple browser tabs.

### Steps:

1. **Open React app in Tab 1**
   - Log in
   - Open DevTools Console

2. **Connect EventService in Tab 1**
   ```javascript
   const { default: eventService } = await import('/src/services/eventService.js');
   const token = localStorage.getItem('health_metrics_token');
   await eventService.connect(token);
   ```

3. **Open same app in Tab 2**
   - Should already be logged in
   - Open DevTools Console

4. **Connect EventService in Tab 2**
   ```javascript
   const { default: eventService } = await import('/src/services/eventService.js');
   const token = localStorage.getItem('health_metrics_token');
   await eventService.connect(token);
   ```

5. **Verify Both Connections**
   - Tab 1: `eventService.getStatus()` → `connected: true`
   - Tab 2: `eventService.getStatus()` → `connected: true`

6. **Test Event Broadcasting**
   - From backend, emit event to user
   - Both tabs should receive the event

### Backend Test (Optional):

```bash
curl -X POST http://localhost:5000/api/events/debug/test \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Multi-tab test"}'
```

### Expected Behavior:
- ✅ Both tabs establish independent SSE connections
- ✅ Both tabs receive same events
- ✅ Closing Tab 1 doesn't affect Tab 2
- ✅ Logging out in Tab 1 disconnects its SSE only

---

## Test 10: Debug Endpoints

Check server-side connection status.

### Test Connection Count:

```bash
# Get YOUR connection count
curl -H "Authorization: Bearer <your-token>" \
  http://localhost:5000/api/events/debug/count

# Expected response:
{
  "success": true,
  "userId": "507f1f77bcf86cd799439011",
  "connectionCount": 1,
  "isConnected": true
}
```

### Test All Active Connections:

```bash
# Requires admin/auth
curl -H "Authorization: Bearer <your-token>" \
  http://localhost:5000/api/events/debug/connections

# Expected response:
{
  "success": true,
  "totalUsers": 2,
  "totalConnections": 3,
  "users": [
    { "userId": "507f1f77bcf86cd799439011", "connections": 2 },
    { "userId": "507f1f77bcf86cd799439012", "connections": 1 }
  ]
}
```

### Test Event Broadcasting:

```bash
curl -X POST http://localhost:5000/api/events/debug/test \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello from test!"}'

# Expected response:
{
  "success": true,
  "message": "Test event sent",
  "sentToConnections": 2,
  "userId": "507f1f77bcf86cd799439011",
  "hasActiveConnections": true
}
```

---

## Troubleshooting

### Issue: "CORS error" or "Connection refused"

**Solution:**
- Ensure backend is running on `http://localhost:5000`
- Check `VITE_API_URL` in `client/.env`
- Verify `vite.config.js` has proxy configured

### Issue: "Token is invalid" or "Missing token"

**Solution:**
- Log in again to get fresh token
- Check `localStorage.getItem('token')` not null
- Verify token wasn't tampered with

### Issue: No heartbeat events received

**Solution:**
- Wait at least 30 seconds (heartbeat interval)
- Check server logs for errors
- Verify connection is active: `eventService.getStatus().connected === true`

### Issue: Reconnection keeps failing (max retries reached)

**Solution:**
- Check server logs for persistent errors
- Verify token hasn't expired
- Try refreshing page to get new token
- Check network connectivity

### Issue: Events not broadcasting to all tabs

**Solution:**
- Ensure all tabs subscribed to same event type
- Check subscription via: `eventService.listeners.get('event-type')`
- Verify backend is sending events correctly
- Check browser console for errors

---

## Quick Reference: EventService API

### Connection

```javascript
// Connect to SSE stream
await eventService.connect(token);

// Disconnect manually
eventService.disconnect();

// Get connection status
const status = eventService.getStatus();
```

### Event Subscription

```javascript
// Subscribe to event
eventService.on('eventType', (data) => {
  console.log(data);
});

// Unsubscribe from event
eventService.off('eventType', callback);
```

### Available Events

| Event | Description | Data |
|-------|-------------|------|
| `connected` | Initial connection confirmed | `{ userId, timestamp, message }` |
| `ping` | Heartbeat every 30s | `{ message, timestamp }` |
| `metrics:change` | Metrics updated | Metric document |
| `sync:update` | Google Fit synced | Sync status |
| `goals:updated` | Goals changed | Goals document |
| `connectionStatus` | Connection state changed | Status object |

### Debug Commands

```javascript
// Check if connected
eventService.isConnected

// Get retry count
eventService.retryCount

// Get connection attempt number
eventService.connectionAttempt

// Inspect listeners
eventService.listeners

// Get readable status
eventService.getReadyStateName()
```

---

## Next Steps

### Integration with React Components

```jsx
import { useEffect } from 'react';
import eventService from '../services/eventService';
import { useAuth } from '../context/AuthContext';

function MetricsMonitor() {
  const { user, token } = useAuth();

  useEffect(() => {
    if (!user || !token) return;

    // Connect to SSE
    eventService.connect(token);

    // Subscribe to metrics updates
    const handleMetricsChange = (data) => {
      console.log('Metrics updated:', data);
      // Update UI...
    };

    eventService.on('metrics:change', handleMetricsChange);

    // Cleanup
    return () => {
      eventService.off('metrics:change', handleMetricsChange);
    };
  }, [user, token]);

  return <div>Monitoring metrics...</div>;
}

export default MetricsMonitor;
```

---

## Performance Considerations

### Memory Usage
- Each listener is stored in a Set
- Unsubscribe from events you no longer need
- Use cleanup function in `useEffect` return

### Network
- Single EventSource connection per tab
- Heartbeat every 30 seconds (lightweight)
- Exponential backoff prevents connection storms

### CPU
- Event listeners are called synchronously
- Avoid heavy processing in listeners
- Use `setTimeout` for async work in callbacks

---

## Support

For issues or questions:
1. Check browser DevTools Console for errors
2. Enable debug logging (already enabled in dev mode)
3. Check server logs: `server/src/server.js` output
4. Review backend route: `server/src/routes/eventsRoutes.js`

