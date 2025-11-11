# ⚠️ Token Not Found in localStorage - Fix

## The Issue

You're getting `null` when trying to access the token:

```javascript
const token = localStorage.getItem('token');  // ❌ Returns null
console.log('Token:', token);  // null
```

**BUT** the token IS there in DevTools → Application → Local Storage

---

## The Root Cause

The token is stored under a **different key**, not `'token'`:

**Token Key:** `'health_metrics_token'` (configurable via `VITE_TOKEN_KEY`)

Not: `'token'`

---

## The Fix

Use the correct token key:

```javascript
// ❌ WRONG
const token = localStorage.getItem('token');

// ✅ CORRECT
const token = localStorage.getItem('health_metrics_token');
console.log('Token:', token);
```

---

## Quick Verification

Run this in DevTools Console:

```javascript
// Method 1: Check all localStorage keys
console.log('All localStorage keys:');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  console.log(`  - ${key}`);
}

// Method 2: Get token with correct key
const token = localStorage.getItem('health_metrics_token');
console.log('Token found:', !!token);
console.log('Token:', token?.substring(0, 30) + '...');
```

---

## Updated Test Commands

After getting the correct token, run:

```javascript
// 1. Get correct token
const token = localStorage.getItem('health_metrics_token');
console.log('✓ Token:', token ? 'Found' : 'Not found');

// 2. Import eventService
const { default: eventService } = await import('./services/eventService.js');

// 3. Subscribe to events
eventService.on('connected', (data) => {
  console.log('✓ Connected:', data);
});

eventService.on('connectionStatus', (status) => {
  console.log('Connection status:', status.connected ? '✅ Online' : '❌ Offline');
});

// 4. Connect
await eventService.connect(token);
```

### Expected Output:
```
✓ Token: Found
[EventService] Connection attempt 1...
[EventService] ✓ Connection established
Connection status: ✅ Online
✓ Connected: { userId: '...', timestamp: ... }
```

---

## Why This Happens

The token key is defined in `client/src/api/axiosConfig.js`:

```javascript
const tokenKey = import.meta.env.VITE_TOKEN_KEY || 'health_metrics_token';
```

- **Default Key:** `'health_metrics_token'`
- **Custom Key:** Set via environment variable `VITE_TOKEN_KEY` in `.env`

Check your `.env` file:

```bash
# .env (if it exists)
VITE_TOKEN_KEY=health_metrics_token  # Or your custom key
```

---

## Summary

✅ **Correct Token Key:** `health_metrics_token`  
❌ **Wrong Token Key:** `token`

Run this in DevTools Console:
```javascript
const token = localStorage.getItem('health_metrics_token');
const { default: eventService } = await import('./services/eventService.js');
await eventService.connect(token);
```

Now you should see the SSE connection succeed! 🎉
