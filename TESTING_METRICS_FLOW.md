# 🧪 Testing Metrics Flow - Complete Guide

## 📋 Test Objective
Verify the complete flow: **Frontend Form → Backend API → Database Storage → Frontend Display**

---

## ✅ Prerequisites

**Servers Running:**
- ✅ Backend: Running on port 5000 (already running)
- ✅ Frontend: Running on port 5174 (already running)

**What You Need:**
- Browser open
- MongoDB Atlas or local MongoDB running
- User account (logged in)

---

## 🎯 Sub-task 6.6.1: Test Adding Metrics

### Step 1: Fill Out Metrics Form

1. **Open Dashboard:**
   ```
   http://localhost:5174/dashboard
   ```

2. **Locate Metrics Form:**
   - Should be titled: "📊 Add Your Health Metrics"
   - Contains input fields for:
     - Date (defaults to today)
     - Steps
     - Calories
     - Distance (km)
     - Active Minutes
     - Weight (kg)
     - Sleep Hours
     - Heart Rate (bpm)

3. **Fill Form with Test Data:**
   ```
   Date:           2025-11-04 (today)
   Steps:          8500
   Calories:       1850
   Distance:       6.5
   Active Minutes: 45
   Weight:         72
   Sleep Hours:    7.5
   Heart Rate:     68
   ```

4. **Verify Form State:**
   - ✅ All fields accept input
   - ✅ Date defaults to today
   - ✅ No validation errors shown
   - ✅ "Add Metrics" button enabled

---

### Step 2: Submit and Verify Success Message

1. **Click "Add Metrics" Button:**
   - Button should show loading state: "Adding..." or spinner
   - Form should be disabled during submission

2. **Watch for Success Alert:**
   ```
   ✓ Success!
   Metrics added successfully for 2025-11-04
   ```

3. **Verify Success Indicators:**
   - ✅ Green success alert appears at top
   - ✅ Alert auto-dismisses after 4 seconds
   - ✅ Form resets to empty state
   - ✅ Date remains as today
   - ✅ Button returns to "Add Metrics" state

4. **Check Browser Console (F12):**
   ```javascript
   // Should see logs like:
   POST http://localhost:5000/api/health-metrics 200 OK
   Response: { success: true, message: "...", data: {...} }
   ```

5. **Check Network Tab (F12 → Network → XHR):**
   ```
   Request URL: http://localhost:5000/api/health-metrics
   Request Method: POST
   Status Code: 200 OK
   
   Request Headers:
     Authorization: Bearer eyJ...
     Content-Type: application/json
   
   Request Payload:
   {
     "date": "2025-11-04",
     "metrics": {
       "steps": 8500,
       "calories": 1850,
       "distance": 6.5,
       "activeMinutes": 45,
       "weight": 72,
       "sleepHours": 7.5,
       "heartRate": 68
     },
     "source": "manual"
   }
   
   Response:
   {
     "success": true,
     "message": "Health metrics added successfully for 2025-11-04",
     "data": {
       "_id": "...",
       "userId": "...",
       "date": "2025-11-04T00:00:00.000Z",
       "metrics": {
         "steps": 8500,
         "calories": 1850,
         "distance": 6.5,
         "activeMinutes": 45,
         "weight": 72,
         "sleepHours": 7.5,
         "heartRate": 68
       },
       "source": "manual",
       "createdAt": "...",
       "updatedAt": "..."
     }
   }
   ```

---

### Step 3: Check Metrics List Updates

1. **Locate Metrics List Component:**
   - Should be below the form
   - Title: "📈 Your Recent Metrics" or similar

2. **Verify New Entry Appears:**
   ```
   📅 November 4, 2025
   
   👟 Steps:        8,500
   🔥 Calories:     1,850
   📏 Distance:     6.5 km
   ⏱️  Active:       45 min
   ⚖️  Weight:       72 kg
   😴 Sleep:        7.5 hours
   ❤️  Heart Rate:  68 bpm
   ```

3. **Check Display Format:**
   - ✅ Date shows in readable format
   - ✅ Numbers formatted with commas
   - ✅ Units display correctly (km, kg, hours, bpm)
   - ✅ Icons show for each metric
   - ✅ Most recent entry at top

4. **Test Multiple Entries:**
   - Add another entry for yesterday (2025-11-03)
   - Verify list shows both entries
   - Verify sorting (newest first)

---

### Step 4: Verify Data in Database via Backend

#### Option A: Using Verification Script (Recommended)

1. **Open New Terminal (PowerShell):**
   ```powershell
   cd server
   node scripts/verify-metrics.js
   ```

2. **Expected Output:**
   ```
   🔌 Connecting to MongoDB...
   ✅ Connected to MongoDB
   
   👤 User Found:
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      Name:  Test User
      Email: testuser@example.com
      ID:    507f1f77bcf86cd799439011
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   📊 Found 1 Metric Entries (showing last 10):
   
   Entry 1:
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      Date:           2025-11-04
      Source:         manual
   
      Metrics:
        Steps:        8500
        Calories:     1850
        Distance:     6.5 km
        Active Mins:  45
        Weight:       72 kg
        Sleep:        7.5 hours
        Heart Rate:   68 bpm
   
      Created:        11/4/2025, 10:30:15 AM
      Updated:        11/4/2025, 10:30:15 AM
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   📅 TODAY'S METRICS:
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      Steps:        8500
      Calories:     1850
      Distance:     6.5 km
      Active Mins:  45
      Weight:       72 kg
      Sleep:        7.5 hours
      Heart Rate:   68 bpm
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   ✅ Verification complete
   
   🔌 Database connection closed
   ```

3. **Verify Specific User:**
   ```powershell
   node scripts/verify-metrics.js testuser@example.com
   ```

#### Option B: Using MongoDB Compass (GUI)

1. **Open MongoDB Compass**

2. **Connect to Database:**
   - Use connection string from `.env` file
   - Or: `mongodb://localhost:27017` for local

3. **Navigate to Collections:**
   ```
   Database: health_metrics_db (or your database name)
   Collection: healthmetrics
   ```

4. **Filter by User:**
   ```json
   {
     "userId": "YOUR_USER_ID_HERE"
   }
   ```

5. **Verify Document:**
   ```json
   {
     "_id": ObjectId("..."),
     "userId": ObjectId("..."),
     "date": ISODate("2025-11-04T00:00:00.000Z"),
     "metrics": {
       "steps": 8500,
       "calories": 1850,
       "distance": 6.5,
       "activeMinutes": 45,
       "weight": 72,
       "sleepHours": 7.5,
       "heartRate": 68
     },
     "source": "manual",
     "createdAt": ISODate("..."),
     "updatedAt": ISODate("...")
   }
   ```

#### Option C: Using MongoDB Shell

1. **Open Terminal:**
   ```powershell
   mongosh
   ```

2. **Connect to Database:**
   ```javascript
   use health_metrics_db
   ```

3. **Find User:**
   ```javascript
   db.users.findOne({ email: "testuser@example.com" })
   ```

4. **Copy User ID and Find Metrics:**
   ```javascript
   db.healthmetrics.find({ 
     userId: ObjectId("YOUR_USER_ID") 
   }).sort({ date: -1 }).pretty()
   ```

5. **Find Today's Metrics:**
   ```javascript
   db.healthmetrics.findOne({
     userId: ObjectId("YOUR_USER_ID"),
     date: ISODate("2025-11-04T00:00:00.000Z")
   })
   ```

---

## 🔍 Verification Checklist

### Frontend Form (Step 1)
- [ ] Form renders correctly
- [ ] All 8 fields visible
- [ ] Date defaults to today
- [ ] Fields accept input
- [ ] Submit button enabled

### Submission (Step 2)
- [ ] Loading state shows during submit
- [ ] Success alert appears
- [ ] Alert shows correct date
- [ ] Alert auto-dismisses
- [ ] Form resets after success
- [ ] No console errors

### Network Request (Step 2)
- [ ] POST request sent to `/api/health-metrics`
- [ ] Status code: 200 OK
- [ ] Authorization header present
- [ ] Request payload correct format
- [ ] Response contains `success: true`
- [ ] Response contains all metric values

### Metrics List (Step 3)
- [ ] New entry appears in list
- [ ] Entry shows at top (newest first)
- [ ] All values display correctly
- [ ] Date formatted properly
- [ ] Units shown correctly
- [ ] Icons display

### Database (Step 4)
- [ ] Document exists in `healthmetrics` collection
- [ ] `userId` matches logged-in user
- [ ] `date` is correct (midnight UTC)
- [ ] All metric values match form input
- [ ] `source` is "manual"
- [ ] `createdAt` timestamp present
- [ ] `updatedAt` timestamp present

---

## 🐛 Common Issues & Solutions

### Issue: Form Not Submitting

**Symptoms:**
- Button click does nothing
- No loading state
- No console logs

**Solutions:**
```javascript
// Check console for errors
// Verify user is logged in (check localStorage for token)
localStorage.getItem('token')

// Check if API endpoint is correct
// Network tab should show POST to /api/health-metrics
```

### Issue: Validation Errors

**Symptoms:**
- Red error messages under fields
- Form won't submit

**Solutions:**
- Ensure all values are numbers (not text)
- Check min/max constraints:
  - Steps: ≥ 0
  - Calories: ≥ 0
  - Distance: ≥ 0
  - Active Minutes: ≥ 0
  - Weight: > 0
  - Sleep Hours: ≥ 0, ≤ 24
  - Heart Rate: ≥ 0

### Issue: Success Alert Not Showing

**Symptoms:**
- Metrics save but no alert
- Console shows success

**Solutions:**
- Check if Alert component imported
- Verify `onSuccess` callback called
- Check CSS/Tailwind classes applied

### Issue: Metrics List Not Updating

**Symptoms:**
- Metrics save successfully
- List doesn't refresh

**Solutions:**
- Check if `onSuccess` prop passed to form
- Verify parent component re-fetches metrics
- Check React state updates in Dashboard

### Issue: Database Entry Not Found

**Symptoms:**
- Frontend shows success
- Database has no entry

**Solutions:**
```javascript
// Check backend logs in Terminal
// Should show: POST /api/health-metrics 200
// If 400/500, check error message

// Verify MongoDB connection
// Check server/.env has correct MONGODB_URI

// Check user authentication
// Verify req.user exists in controller
```

### Issue: Wrong Date in Database

**Symptoms:**
- Date is different than expected
- Date shows previous/next day

**Solutions:**
- Dates normalized to midnight UTC
- Check timezone differences
- Controller sets: `normalizedDate.setHours(0, 0, 0, 0)`

---

## 📊 Test Data Examples

### Minimal Entry (Only Required Fields)
```javascript
{
  date: "2025-11-04",
  steps: 5000
}
```

### Complete Entry (All Fields)
```javascript
{
  date: "2025-11-04",
  steps: 12500,
  calories: 2300,
  distance: 8.2,
  activeMinutes: 60,
  weight: 75,
  sleepHours: 8,
  heartRate: 72
}
```

### Edge Cases to Test
```javascript
// Zero values
{ date: "2025-11-04", steps: 0, calories: 0 }

// Maximum reasonable values
{ date: "2025-11-04", steps: 50000, calories: 5000 }

// Decimal values
{ date: "2025-11-04", distance: 5.75, sleepHours: 7.5, weight: 68.3 }

// Previous date
{ date: "2025-11-03", steps: 8000 }

// Same date (update existing)
{ date: "2025-11-04", steps: 9000 } // Updates previous entry
```

---

## 📸 Screenshots to Capture

1. **Empty Form** - Before filling
2. **Filled Form** - With test data
3. **Loading State** - During submission
4. **Success Alert** - After successful save
5. **Metrics List** - Showing new entry
6. **Network Tab** - Showing POST request and response
7. **Database** - MongoDB Compass or verification script output

---

## ✅ Success Criteria

**Test Passes If:**
1. ✅ Form accepts all metric inputs
2. ✅ Submit button triggers API call
3. ✅ Success alert appears with correct message
4. ✅ Network request shows 200 OK status
5. ✅ Response contains all submitted values
6. ✅ Metrics list updates with new entry
7. ✅ Database contains matching document
8. ✅ Document has correct userId, date, and metrics
9. ✅ No console errors at any step
10. ✅ Form resets after successful submission

---

## 🎯 Next Steps After Testing

If all tests pass:
- [ ] Test updating existing metrics (submit same date twice)
- [ ] Test date range queries
- [ ] Test metrics deletion
- [ ] Test with multiple users
- [ ] Test error scenarios (network failure, invalid data)

---

## 📝 Test Results Template

```
Test Date: November 4, 2025
Tester: [Your Name]
Environment: Development (localhost)

┌─────────────────────────────────────────────────┐
│ Step 1: Fill Metrics Form                      │
├─────────────────────────────────────────────────┤
│ Status: [ ] Pass  [ ] Fail                      │
│ Notes:                                          │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Step 2: Submit & Success Message               │
├─────────────────────────────────────────────────┤
│ Status: [ ] Pass  [ ] Fail                      │
│ Success Alert: [ ] Yes  [ ] No                  │
│ Status Code: _____                              │
│ Notes:                                          │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Step 3: Metrics List Updates                   │
├─────────────────────────────────────────────────┤
│ Status: [ ] Pass  [ ] Fail                      │
│ Entry Visible: [ ] Yes  [ ] No                  │
│ Values Correct: [ ] Yes  [ ] No                 │
│ Notes:                                          │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Step 4: Database Verification                  │
├─────────────────────────────────────────────────┤
│ Status: [ ] Pass  [ ] Fail                      │
│ Method Used: [ ] Script  [ ] Compass  [ ] Shell │
│ Document Found: [ ] Yes  [ ] No                 │
│ Values Match: [ ] Yes  [ ] No                   │
│ Notes:                                          │
└─────────────────────────────────────────────────┘

Overall Result: [ ] PASS  [ ] FAIL

Issues Found:


Recommendations:

```

---

**Ready to Test? 🚀**

1. Open: http://localhost:5174/dashboard
2. Fill the metrics form with test data
3. Submit and watch for success
4. Check the metrics list
5. Run: `node scripts/verify-metrics.js`

Good luck! 🎯
