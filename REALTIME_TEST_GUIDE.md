# Real-Time Dashboard Testing Guide

## 📋 Prerequisites

### 1. Start Backend Server
```bash
# In server directory
cd server
npm run dev

# Expected output:
# ✅ MongoDB Connected: cluster0....mongodb.net
# 🚀 Server running on port 5000
# 🔄 Google Fit Sync Worker started (interval: 30 minutes)
# 👁️  Change Stream Worker started
```

### 2. Start Frontend Dev Server
```bash
# In client directory
cd client
npm run dev

# Expected output:
# VITE vX.X.X ready in XXX ms
# ➜ Local: http://localhost:5173/
```

### 3. Verify Backend Health
Open browser: `http://localhost:5000/api/health`

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-11-13T..."
}
```

---

## 🧪 Test 1: Multi-Tab Synchronization

### Step 1: Open Two Browser Tabs

1. **Tab 1 (Submitter)**: `http://localhost:5173/dashboard`
2. **Tab 2 (Observer)**: `http://localhost:5173/dashboard`

💡 **Tip**: Use Chrome's "Duplicate Tab" feature (Ctrl+Shift+K or right-click → Duplicate)

---

### Step 2: Log In with Same User in Both Tabs

If not already logged in:
1. Click "Login" in both tabs
2. Use credentials:
   - Email: `testuser@example.com`
   - Password: `password123`
   
Or register a new user if needed.

---

### Step 3: Add Metrics in Tab 1

**In Tab 1 (Submitter):**

1. Click **"Add Metrics"** button
2. Fill in the form:
   - **Date**: Select today's date
   - **Steps**: 10000
   - **Calories**: 2500
   - **Sleep**: (optional) 7.5
   - **Weight**: (optional) 75
3. Click **"Save Metrics"**

---

## ✅ Expected Results

### Tab 1 (Submitter) - Immediate Feedback

| Timeline | Expected Behavior | What to Look For |
|----------|------------------|------------------|
| **0ms** | Optimistic update appears | Cards turn **blue** with `opacity-90` |
| **0ms** | "Saving..." indicator | Small blue text appears under each metric title |
| **0ms** | Form collapses | Form closes automatically |
| **200-500ms** | Server response | Cards revert to normal color scheme |
| **200-500ms** | Success toast | 🎉 **"Success! Metrics saved successfully!"** (green) |
| **400ms** | Summary refresh | Weekly stats update with debounce |
| **Continuous** | Connection indicator | 🟢 **"Live"** with pulsing animation (top-right) |

**Visual Checklist:**
- [ ] Cards immediately show data (optimistic)
- [ ] Blue border and background on all cards
- [ ] "Saving..." text visible
- [ ] Success toast appears
- [ ] Cards revert to original colors
- [ ] Summary stats update
- [ ] No errors in console

---

### Tab 2 (Observer) - SSE Real-Time Update

| Timeline | Expected Behavior | What to Look For |
|----------|------------------|------------------|
| **0-2s** | SSE event received | Check browser console for `[Dashboard] Received metrics:change event` |
| **0-2s** | Cards update | Metric values appear in cards |
| **0-2s** | Success toast | ✓ **"Metrics Updated: Changes saved for 2025-11-13"** (green) |
| **200ms** | Summary refresh | Weekly stats update automatically |
| **Continuous** | Connection indicator | 🟢 **"Live"** with pulsing animation |
| **Never** | "Saving..." indicator | **Should NOT appear** (not optimistic) |
| **Never** | Blue styling | Cards use normal color scheme |

**Visual Checklist:**
- [ ] Metrics appear within 2 seconds
- [ ] NO blue border/background
- [ ] NO "Saving..." text
- [ ] Success toast appears
- [ ] Summary stats update
- [ ] Connection indicator shows "Live"
- [ ] No errors in console

---

## 🔍 Console Debugging

### Tab 1 (Submitter) Console Output

```javascript
// Expected console logs:
[Dashboard] Applying optimistic update...
[Dashboard] ✓ Metrics saved to server
[Dashboard] Received metrics:change event: {operation: "insert", date: "2025-11-13", ...}
[Dashboard] Skipping event (already applied optimistically): 2025-11-13-upsert
[Dashboard] Refetching summary stats (debounced)...
[Dashboard] ✓ Summary stats refreshed
```

### Tab 2 (Observer) Console Output

```javascript
// Expected console logs:
[Dashboard] Received metrics:change event: {operation: "insert", date: "2025-11-13", ...}
[Dashboard] Processing insert for 2025-11-13
[Dashboard] Refetching summary stats (debounced)...
[Dashboard] ✓ Summary stats refreshed
```

---

## 🧪 Test 2: Google Fit Sync (Optional)

### Prerequisites
1. User must have Google Fit connected
2. Google Fit account has health data

### Steps
1. In Tab 1, click **"Sync with Google Fit"** button
2. Wait for sync to complete

### Expected Results (Both Tabs)

**Tab 1:**
- Success toast: **"Google Fit Sync Complete: Synced X day(s) - Y steps, Z calories"**
- All metrics update
- Summary stats refresh

**Tab 2:**
- Individual `metrics:change` events for each synced date
- Toasts: **"Synced from Google Fit: Data updated for 2025-11-XX"**
- Metrics update automatically
- Summary stats refresh

---

## 🧪 Test 3: Connection Status Indicators

### Test Offline Behavior

1. **In Chrome DevTools**:
   - Press F12 → Network tab → Throttling dropdown
   - Select "Offline"

2. **Expected Results**:
   - Connection indicator: 🔴 **"Offline"** (red background)
   - Auto-reconnect attempts start
   - Indicator updates: 🔴 **"Reconnecting... (1)"**, **(2)**, etc.

3. **Restore Connection**:
   - Set throttling back to "No throttling"
   - Connection indicator: 🟢 **"Live"** (green background)
   - Console: `[SSE] Connection established`

---

## 🧪 Test 4: Duplicate Event Prevention

### Test Deduplication

1. Submit metrics in Tab 1
2. Check Tab 1 console for:
   ```javascript
   [Dashboard] Skipping event (already applied optimistically): 2025-11-13-upsert
   ```
3. Verify metrics appear only once (not duplicated)
4. Check Tab 2 console for:
   ```javascript
   [Dashboard] Processing insert for 2025-11-13
   ```

---

## 🐛 Troubleshooting

### Issue: Tab 2 doesn't update

**Possible Causes:**
1. SSE not connected
   - Check console for `[SSE] Connection established`
   - Verify backend is running on port 5000
   
2. Change Stream Worker not running
   - Check server console for `👁️ Change Stream Worker started`
   - Verify MongoDB is replica set (required for change streams)

**Solution:**
```bash
# Restart server
cd server
npm run dev
```

### Issue: "Saving..." never disappears

**Possible Causes:**
1. Backend not responding
2. Network error
3. Validation error

**Solution:**
1. Check browser console for errors
2. Check Network tab for failed requests
3. Verify backend is running
4. Check server console for errors

### Issue: Connection indicator shows "Offline"

**Possible Causes:**
1. Backend not running
2. SSE endpoint not accessible
3. CORS issues

**Solution:**
1. Verify backend is running: `http://localhost:5000/api/health`
2. Check browser console for CORS errors
3. Restart both frontend and backend

### Issue: No console logs appearing

**Possible Causes:**
1. Console filtering enabled
2. Log level too high

**Solution:**
1. Clear console filters
2. Check console settings (All levels enabled)
3. Refresh page

---

## 📊 Success Criteria

### All Tests Pass If:

- [x] **Optimistic Updates**: Tab 1 shows immediate feedback
- [x] **Real-Time Sync**: Tab 2 updates within 2 seconds
- [x] **Visual Indicators**: "Saving..." appears only in submitting tab
- [x] **Connection Status**: Indicator shows "Live" when connected
- [x] **Deduplication**: No duplicate metrics appear
- [x] **Error Recovery**: Optimistic updates revert on error
- [x] **Summary Stats**: Auto-refresh in both tabs
- [x] **Toast Notifications**: Appropriate messages in both tabs
- [x] **No Console Errors**: Clean console in both tabs

---

## 🎯 Advanced Testing Scenarios

### Scenario 1: Rapid Submissions
1. Submit metrics 3 times quickly in Tab 1
2. Verify all submissions process correctly
3. Check debouncing prevents summary stat thrashing

### Scenario 2: Simultaneous Submissions
1. Open 3 tabs
2. Submit different metrics in each tab simultaneously
3. Verify all tabs receive all updates
4. Check for race conditions

### Scenario 3: Network Interruption
1. Submit metrics in Tab 1
2. Immediately toggle offline mode
3. Verify optimistic update appears
4. Restore connection
5. Verify server sync completes

---

## 📝 Test Results Template

```markdown
## Test Results - [Date]

### Environment
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- MongoDB: [Connected/Disconnected]
- Browser: Chrome/Firefox/Safari

### Test 1: Multi-Tab Sync
- Tab 1 Optimistic Update: ✅ / ❌
- Tab 2 Real-Time Update: ✅ / ❌
- Visual Indicators: ✅ / ❌
- Console Logs: ✅ / ❌
- Notes: [Any observations]

### Test 2: Connection Status
- Online Indicator: ✅ / ❌
- Offline Detection: ✅ / ❌
- Reconnection: ✅ / ❌
- Notes: [Any observations]

### Test 3: Deduplication
- Optimistic Skip: ✅ / ❌
- No Duplicates: ✅ / ❌
- Notes: [Any observations]

### Issues Found
1. [Issue description]
2. [Issue description]

### Overall Result: ✅ PASS / ❌ FAIL
```

---

## 🚀 Ready to Test!

Follow the steps above and verify each expected behavior. The real-time system is working correctly if all visual indicators, console logs, and timing match the expectations.

**Happy Testing! 🎉**
