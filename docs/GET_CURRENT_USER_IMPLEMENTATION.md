# Get Current User Controller Implementation

## Overview
Implementation of the `getCurrentUser` controller function for Sub-task 3.2.4, allowing authenticated users to retrieve their complete profile information.

## Implementation Date
January 2025

## Location
**File**: `server/src/controllers/authController.js`  
**Function**: `getCurrentUser` (with `getMe` alias for backwards compatibility)  
**Route**: `GET /api/auth/me`

---

## Features Implemented

### 1. **Profile Retrieval**
- Fetches complete user profile from database
- Excludes sensitive password field
- Returns fresh data (not cached from token)
- Includes all profile fields and goals

### 2. **Security**
- Requires valid JWT authentication
- Only returns data for authenticated user
- Password field automatically excluded
- No exposure of sensitive system fields

### 3. **Backwards Compatibility**
- Function name: `getCurrentUser`
- Legacy alias: `getMe` (exported for existing code)
- Both names reference same implementation

---

## Request Format

### Endpoint
```
GET /api/auth/me
```

### Headers
```
Authorization: Bearer <JWT_TOKEN>
```

### No Request Body Required
This is a GET request - user identification comes from JWT token.

---

## Response Format

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "profilePicture": "https://example.com/profile.jpg",
      "goals": {
        "stepGoal": 10000,
        "sleepGoal": 8,
        "calorieGoal": 2000,
        "weightGoal": 70,
        "distanceGoal": 5
      },
      "googleFitConnected": false,
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-15T12:00:00.000Z"
    }
  }
}
```

### Error Responses

#### 401 Unauthorized - No Token
```json
{
  "success": false,
  "message": "Not authorized, token missing"
}
```

#### 401 Unauthorized - Invalid Token
```json
{
  "success": false,
  "message": "Not authorized, invalid token"
}
```

#### 404 Not Found - User Deleted
```json
{
  "success": false,
  "message": "User not found"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error fetching user profile"
}
```

---

## Implementation Details

### Process Flow
1. **Authentication**: JWT token verified by `authenticate` middleware
2. **Extract User ID**: Retrieved from `req.userId` (set by middleware)
3. **Fetch User Data**: Query database with user ID
4. **Validate Existence**: Check if user still exists
5. **Exclude Password**: Use `.select('-password')` to remove password field
6. **Return Profile**: Send complete user profile data

### Code Structure
```javascript
/**
 * @desc    Get current authenticated user's profile
 * @route   GET /api/auth/me
 * @access  Private (requires authentication)
 * 
 * @description
 * Retrieves the complete profile of the currently authenticated user.
 * User identification comes from JWT token (via authenticate middleware).
 * Returns fresh data from database (not cached token data).
 * 
 * Process:
 * 1. Extract user ID from authenticated request (req.userId)
 * 2. Query database for user by ID
 * 3. Exclude password field from response
 * 4. Return user profile with all fields
 * 
 * @returns {Object} User profile object (without password)
 */
export const getCurrentUser = async (req, res) => {
  try {
    // Extract user ID from authenticated request
    // req.userId is set by authenticate middleware after JWT verification
    const userId = req.userId;
    
    // Fetch user from database (fresh data, not from token)
    // .select('-password') excludes password field from results
    const user = await User.findById(userId).select('-password');
    
    // Check if user exists (account may have been deleted)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Return user profile
    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        user: user
      }
    });
  } catch (error) {
    console.error('❌ Error in getCurrentUser:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile'
    });
  }
};

// Backwards compatibility alias
export const getMe = getCurrentUser;
```

---

## Security Measures

### 1. **Authentication Required**
- Protected by `authenticate` middleware
- JWT token must be present in Authorization header
- Token must be valid and not expired

### 2. **Data Protection**
- Password field never returned
- User can only access their own profile
- No user ID parameter (prevents accessing other users)

### 3. **Fresh Data**
- Queries database for current data
- Not reliant on potentially stale token data
- Reflects any recent profile updates

---

## Use Cases

### 1. **Profile Page Load**
```javascript
// Frontend fetches user data on profile page mount
useEffect(() => {
  const fetchProfile = async () => {
    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    setUserProfile(data.data.user);
  };
  
  fetchProfile();
}, []);
```

### 2. **Header User Info**
```javascript
// Fetch user info for app header/navigation
const getUserInfo = async (token) => {
  const response = await fetch('/api/auth/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const { data } = await response.json();
  return {
    name: data.user.name,
    avatar: data.user.profilePicture
  };
};
```

### 3. **Verify Account Status**
```javascript
// Check if user account still exists
try {
  const response = await fetch('/api/auth/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (response.status === 404) {
    // Account deleted - log out user
    logout();
  }
} catch (error) {
  console.error('Failed to verify account');
}
```

---

## Integration Points

### Database
- **Model**: `User` (server/src/models/User.js)
- **Query**: `User.findById(userId).select('-password')`
- **Returns**: Complete user document without password

### Middleware
- **Authentication**: `authenticate` (server/src/middleware/auth.js)
  - Verifies JWT token from Authorization header
  - Sets `req.userId` with user ID from token
  - Sets `req.user` with basic user info (if needed)

### Routes
- **File**: `server/src/routes/authRoutes.js`
- **Route**: `router.get('/me', authenticate, getCurrentUser);`

---

## Error Handling

### User Not Found
```javascript
if (!user) {
  return res.status(404).json({
    success: false,
    message: 'User not found'
  });
}
```
**Scenario**: User account was deleted after token was issued.

### Generic Errors
```javascript
catch (error) {
  console.error('❌ Error in getCurrentUser:', error);
  res.status(500).json({
    success: false,
    message: 'Error fetching user profile'
  });
}
```
**Scenario**: Database connection issues, unexpected errors.

---

## Testing

### Manual Test with Curl
```bash
# 1. Login first
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# 2. Copy token from response, then:
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Automated Test Script
**File**: `server/test-get-current-user.js`

```javascript
// Register user
const registerResponse = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Test User',
    email: 'test@example.com',
    password: 'testpass123'
  })
});

const { token } = await registerResponse.json();

// Get current user
const meResponse = await fetch('/api/auth/me', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const userData = await meResponse.json();
console.log('User Profile:', userData.data.user);
```

---

## Performance Considerations

### Database Query
- **Single query**: `User.findById()` is efficient (uses primary key)
- **Index**: MongoDB automatically indexes `_id` field
- **Field projection**: `.select('-password')` reduces data transfer

### Caching Opportunities (Future)
- Could cache user profile with short TTL (e.g., 5 minutes)
- Invalidate cache on profile updates
- Reduces database load for frequent requests

---

## Comparison with Similar Endpoints

### getCurrentUser vs Login
| Feature | getCurrentUser | Login |
|---------|----------------|-------|
| Purpose | Fetch profile | Authenticate user |
| Input | JWT token | Email + password |
| Output | Full profile | Profile + new token |
| Auth Required | Yes | No |

### getCurrentUser vs Token Data
| Feature | getCurrentUser | Token Data |
|---------|----------------|------------|
| Data Source | Database (fresh) | JWT payload (static) |
| Fields | All profile fields | Limited (id, email) |
| Updates | Reflects changes | Stale until re-login |
| Security | Password excluded | No password in token |

---

## Future Enhancements

### Potential Improvements
1. **Response Caching**: Cache profile data with invalidation
2. **Field Selection**: Allow client to specify which fields to return
3. **Include Stats**: Add metrics summary (recent activity, streaks)
4. **Preferences**: Include user preferences and settings
5. **Privacy**: Add privacy settings visibility

### Related Endpoints
- `PUT /api/auth/profile` - Update profile (implemented)
- `GET /api/auth/profile/stats` - Get activity statistics
- `GET /api/auth/profile/achievements` - Get achievements/badges

---

## Documentation References

- **Architecture**: See `ARCHITECTURE.md` for system design
- **User Model**: See `server/src/models/User.js` for schema
- **Auth Middleware**: See `server/src/middleware/auth.js` for JWT logic
- **Update Profile**: See `docs/UPDATE_PROFILE_IMPLEMENTATION.md`

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2025-01-15 | 1.0 | Initial implementation with enhanced documentation |

---

## Notes

- **Renamed Function**: Originally `getMe`, now `getCurrentUser` for clarity
- **Alias Maintained**: `getMe` still exported for backwards compatibility
- **Fresh Data**: Always queries database (not cached)
- **Security**: Password never exposed in response
- **User Deletion**: Returns 404 if account deleted after token issued

---

*This implementation follows REST best practices and maintains consistency with other authentication endpoints in the Health Metrics Monitoring System.*
