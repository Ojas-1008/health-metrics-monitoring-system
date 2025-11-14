# API Services

Axios instances and API call functions.

- `api.js` - Base Axios instance with interceptors
- `authService.js` - Login, register, logout
- `metricsService.js` - CRUD for health metrics
- `googleFitService.js` - Google Fit OAuth and sync operations
- `userService.js` - User profile operations

Centralizes all backend communication.

## Google Fit Service

**Location:** `services/googleFitService.js`

**Purpose:** Handle Google Fit OAuth flow, connection management, and data synchronization.

### Available Methods

#### `initiateConnect()`
Initiates Google Fit OAuth flow by requesting authorization URL from backend.

```javascript
const authUrl = await googleFitService.initiateConnect();
window.open(authUrl, '_blank');
```

#### `getConnectionStatus()`
Gets basic Google Fit connection status (connected/disconnected).

```javascript
const result = await googleFitService.getConnectionStatus();
// Returns: { success: true, data: { connected: true }, message: "..." }
```

#### `getGoogleFitStatus()`
Gets detailed Google Fit connection and sync status including last sync time.

```javascript
const result = await googleFitService.getGoogleFitStatus();
// Returns: { success: true, data: { connected: true, lastSyncAt: "2025-11-14T10:30:00Z" }, message: "..." }
```

#### `triggerSync()`
Manually triggers Google Fit data synchronization.

```javascript
const result = await googleFitService.triggerSync();
// Returns: { success: true, data: { syncId: "sync_123", status: "running" }, message: "..." }
```

#### `disconnectGoogleFit()`
Disconnects Google Fit account and removes stored tokens.

```javascript
const result = await googleFitService.disconnectGoogleFit();
// Returns: { success: true, message: "Disconnected successfully" }
```

### Error Handling

All methods return a consistent response format:
```javascript
{
  success: boolean,
  data?: any,        // Present on success
  message: string    // User-friendly message
}
```

### Integration

Used by:
- `GoogleFitStatus` component for connection display and manual sync
- Dashboard for real-time sync status updates
- Authentication flow for Google Fit OAuth
