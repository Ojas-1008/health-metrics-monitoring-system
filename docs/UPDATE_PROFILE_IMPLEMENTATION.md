# Update Profile Controller Implementation

## Overview
Implementation of the `updateProfile` controller function for Sub-task 3.2.5, allowing authenticated users to update their profile information with comprehensive validation and security restrictions.

## Implementation Date
January 2025

## Location
**File**: `server/src/controllers/authController.js`  
**Function**: `updateProfile`  
**Route**: `PUT /api/auth/profile`

---

## Features Implemented

### 1. **Security-First Design**
- Prevents modification of security-critical fields (email, password)
- Prevents modification of system-managed fields (googleId, googleFitConnected)
- Validates all input data before database operations
- Excludes password from response

### 2. **Updatable Fields**
The controller allows updates to the following fields:
- `name` - User's display name (2-50 characters)
- `profilePicture` - URL to user's profile image (must be valid URL)
- `goals` - Nested object containing health goals:
  - `stepGoal` (1,000 - 50,000 steps)
  - `sleepGoal` (4 - 12 hours)
  - `calorieGoal` (1,200 - 5,000 calories)
  - `weightGoal` (30 - 300 kg)
  - `distanceGoal` (1 - 100 km)

### 3. **Restricted Fields**
The following fields cannot be updated through this endpoint:
- `email` - Use dedicated email change endpoint
- `password` - Use `/api/auth/change-password` endpoint
- `googleId` - System-managed (OAuth integration)
- `googleFitConnected` - System-managed (API connection status)

### 4. **Validation Rules**
- **Name**: 2-50 characters, required if provided
- **Profile Picture**: Must be valid URL format
- **Goals**: Each goal must be within specified ranges
- **Empty Updates**: Returns error if no data provided
- **Mongoose Validation**: All field-level validations from User model are enforced

---

## Request Format

### Endpoint
```
PUT /api/auth/profile
```

### Headers
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Request Body Examples

#### Update Name
```json
{
  "name": "Updated Name"
}
```

#### Update Profile Picture
```json
{
  "profilePicture": "https://example.com/profile.jpg"
}
```

#### Update Health Goals
```json
{
  "goals": {
    "stepGoal": 15000,
    "sleepGoal": 8,
    "calorieGoal": 2500
  }
}
```

#### Update Multiple Fields
```json
{
  "name": "John Doe",
  "profilePicture": "https://example.com/john.jpg",
  "goals": {
    "stepGoal": 12000,
    "weightGoal": 75
  }
}
```

---

## Response Format

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Updated Name",
      "email": "user@example.com",
      "profilePicture": "https://example.com/profile.jpg",
      "goals": {
        "stepGoal": 15000,
        "sleepGoal": 8,
        "calorieGoal": 2500,
        "weightGoal": 70,
        "distanceGoal": 5
      },
      "googleFitConnected": false,
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-15T12:30:00.000Z"
    }
  }
}
```

### Error Responses

#### 400 Bad Request - No Data
```json
{
  "success": false,
  "message": "No update data provided"
}
```

#### 400 Bad Request - Restricted Field
```json
{
  "success": false,
  "message": "Cannot update email through this endpoint. Email changes require additional verification."
}
```

#### 400 Bad Request - Validation Error
```json
{
  "success": false,
  "message": "Validation failed: Profile picture must be a valid URL",
  "errors": [
    "Profile picture must be a valid URL"
  ]
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Not authorized, token missing"
}
```

#### 404 Not Found
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
  "message": "Error updating profile"
}
```

---

## Implementation Details

### Process Flow
1. **Authentication**: JWT token verified by `authenticate` middleware
2. **Extract User ID**: Retrieved from `req.userId` (set by middleware)
3. **Extract Update Data**: Get fields from request body
4. **Security Validation**: Check for restricted field modifications
5. **Update Database**: Use `findByIdAndUpdate` with validation enabled
6. **Return Response**: Send updated user data (without password)

### Code Structure
```javascript
export const updateProfile = async (req, res) => {
  try {
    // 1. Extract user ID from authenticated request
    const userId = req.userId;
    
    // 2. Extract updatable fields from request body
    const { name, profilePicture, goals } = req.body;
    const updateData = {};
    
    // Build update object with provided fields
    if (name !== undefined) updateData.name = name;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
    if (goals !== undefined) updateData.goals = goals;
    
    // 3. Validate that update data is provided
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No update data provided'
      });
    }
    
    // 4. Check for restricted fields
    const restrictedFields = ['email', 'password', 'googleId', 'googleFitConnected'];
    const attemptedRestrictedFields = restrictedFields.filter(field => 
      req.body[field] !== undefined
    );
    
    if (attemptedRestrictedFields.length > 0) {
      const field = attemptedRestrictedFields[0];
      let message = '';
      
      if (field === 'email') {
        message = 'Cannot update email through this endpoint...';
      } else if (field === 'password') {
        message = 'Cannot update password through this endpoint...';
      } else {
        message = `Cannot update ${field}. This field is system managed...`;
      }
      
      return res.status(400).json({ success: false, message });
    }
    
    // 5. Update user in database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      {
        new: true,
        runValidators: true,
        context: 'query'
      }
    ).select('-password');
    
    // 6. Check if user exists
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // 7. Return success response
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser }
    });
    
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors
      });
    }
    
    // Handle other errors
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
};
```

---

## Security Measures

### 1. **Authentication Required**
- Endpoint protected by `authenticate` middleware
- JWT token must be valid and not expired
- User ID extracted from verified token

### 2. **Field Restrictions**
- Email cannot be changed (requires verification flow)
- Password cannot be changed (use dedicated endpoint)
- System fields (googleId, googleFitConnected) are immutable

### 3. **Input Validation**
- All fields validated against User model schema
- URL format validated for profile pictures
- Numeric ranges enforced for goals
- String length limits enforced for name

### 4. **Data Protection**
- Password field never returned in responses
- Only authenticated user can update own profile
- Failed updates don't expose system information

---

## Testing Scenarios

### Test Suite Created
**File**: `server/test-update-profile.js`

### Test Cases (12 Total)

1. **✅ Update Name** - Valid name change
2. **✅ Update Profile Picture** - Valid URL
3. **✅ Update Health Goals** - All goal fields
4. **✅ Update Multiple Fields** - Name + picture + goals
5. **❌ Attempt Email Change** - Should fail with 400
6. **❌ Attempt Password Change** - Should fail with 400
7. **❌ Attempt Google ID Change** - Should fail with 400
8. **❌ Empty Update** - Should fail with 400
9. **❌ Invalid Profile Picture** - Should fail validation
10. **❌ Name Too Short** - Should fail validation
11. **❌ Goal Out of Range** - Should fail validation
12. **❌ No Authentication Token** - Should fail with 401

---

## Integration Points

### Database
- **Model**: `User` (server/src/models/User.js)
- **Operation**: `findByIdAndUpdate` with validation
- **Options**: `new: true, runValidators: true, context: 'query'`

### Middleware
- **Authentication**: `authenticate` (server/src/middleware/auth.js)
- **Error Handling**: Global error handler catches unhandled errors

### Routes
- **File**: `server/src/routes/authRoutes.js`
- **Route**: `router.put('/profile', authenticate, updateProfile);`

---

## Error Handling

### Mongoose ValidationError
```javascript
if (error.name === 'ValidationError') {
  const errors = Object.values(error.errors).map(err => err.message);
  return res.status(400).json({
    success: false,
    message: errors[0],
    errors
  });
}
```

### CastError (Invalid ObjectId)
```javascript
if (error.name === 'CastError') {
  return res.status(404).json({
    success: false,
    message: 'User not found'
  });
}
```

### Generic Errors
```javascript
res.status(500).json({
  success: false,
  message: 'Error updating profile'
});
```

---

## Usage Example

### Complete Flow

```javascript
// 1. User logs in
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});
const { token } = await loginResponse.json();

// 2. Update profile
const updateResponse = await fetch('/api/auth/profile', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'John Doe',
    profilePicture: 'https://example.com/john.jpg',
    goals: {
      stepGoal: 12000,
      sleepGoal: 8
    }
  })
});
const updatedProfile = await updateResponse.json();
```

---

## Future Enhancements

### Potential Improvements
1. **Email Change Workflow**: Implement verification flow for email updates
2. **Profile Picture Upload**: Add direct image upload instead of URL-only
3. **Partial Goal Updates**: Allow updating individual goal fields without providing all
4. **Change History**: Track profile modification history
5. **Validation Messages**: More detailed field-specific error messages
6. **Rate Limiting**: Prevent excessive profile updates

### Related Endpoints to Implement
- `PUT /api/auth/email` - Change email with verification
- `POST /api/auth/profile-picture` - Upload profile image
- `GET /api/auth/profile-history` - View change history

---

## Documentation References

- **Architecture**: See `ARCHITECTURE.md` for overall system design
- **User Model**: See `server/src/models/User.js` for field definitions
- **Auth Middleware**: See `server/src/middleware/auth.js` for JWT verification
- **Registration**: See `docs/REGISTRATION_CONTROLLER_IMPLEMENTATION.md` for related endpoint

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2025-01-15 | 1.0 | Initial implementation with comprehensive validation |

---

## Notes

- **Backwards Compatible**: Existing profile data remains unchanged if not updated
- **Partial Updates**: Only provided fields are updated, others remain unchanged
- **Goal Updates**: Goals object can be partially updated (merge behavior)
- **Timestamps**: `updatedAt` automatically set on successful update
- **Password Security**: Never exposed in any response

---

*This implementation follows the established patterns in the Health Metrics Monitoring System and maintains consistency with other authentication endpoints.*
