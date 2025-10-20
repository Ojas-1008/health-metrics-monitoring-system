# Authentication Routes - Quick Reference

## 📍 API Endpoints

### Public Routes (No Auth Required)
```
POST /api/auth/register
POST /api/auth/login
```

### Protected Routes (Requires JWT Token)
```
GET  /api/auth/me
PUT  /api/auth/profile
PUT  /api/auth/change-password
```

## 🔄 Request/Response Examples

### 1. Register User
**Request:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!@#"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "profilePicture": "",
      "googleFitConnected": false,
      "goals": {},
      "createdAt": "2025-10-20T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Login
**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!@#"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "profilePicture": "",
      "googleFitConnected": false,
      "goals": {}
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Get Current User
**Request:**
```http
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "profilePicture": "",
      "googleId": null,
      "googleFitConnected": false,
      "goals": {},
      "createdAt": "2025-10-20T10:30:00.000Z",
      "updatedAt": "2025-10-20T10:30:00.000Z"
    }
  }
}
```

### 4. Update Profile
**Request:**
```http
PUT /api/auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "John Smith",
  "goals": {
    "stepGoal": 10000,
    "sleepGoal": 8,
    "weightGoal": 75.5
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Smith",
      "email": "john@example.com",
      "profilePicture": "",
      "googleId": null,
      "googleFitConnected": false,
      "goals": {
        "stepGoal": 10000,
        "sleepGoal": 8,
        "weightGoal": 75.5
      },
      "createdAt": "2025-10-20T10:30:00.000Z",
      "updatedAt": "2025-10-20T11:00:00.000Z"
    }
  }
}
```

### 5. Change Password
**Request:**
```http
PUT /api/auth/change-password
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "currentPassword": "SecurePass123!@#",
  "newPassword": "NewSecurePass456!@#"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## ❌ Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "password",
      "message": "Password must be at least 8 characters long",
      "value": "weak"
    },
    {
      "field": "email",
      "message": "Please provide a valid email address",
      "value": "invalid"
    }
  ]
}
```

### Authentication Error (401)
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

### Invalid Credentials (401)
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "User not found"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Server error during registration",
  "error": "Error details (only in development)"
}
```

## 🔒 Password Requirements

- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- At least 1 special character (@$!%*?&#)

## 📝 Validation Rules

### Registration
- **name**: 2-50 characters, letters and spaces only
- **email**: Valid email format, automatically normalized
- **password**: Must meet password requirements

### Login
- **email**: Required, valid email format
- **password**: Required

### Update Profile
- **name**: Optional, 2-50 characters
- **email**: Cannot be changed (security)
- **goals.stepGoal**: Optional, 1,000-50,000
- **goals.weightGoal**: Optional, 30-300 kg
- **goals.sleepGoal**: Optional, 4-12 hours

### Change Password
- **currentPassword**: Required
- **newPassword**: Required, must meet password requirements, must differ from current

## 🛡️ Security Features

1. **Password Hashing**: bcrypt with salt
2. **JWT Authentication**: 7-day token expiration
3. **Input Validation**: All inputs sanitized and validated
4. **Protected Fields**: email, password, googleId cannot be changed via updateProfile
5. **Error Handling**: Generic error messages in production (no sensitive data exposed)

## 🚀 Usage in Frontend

```javascript
// Registration
const register = async (name, email, password) => {
  const response = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  return response.json();
};

// Login
const login = async (email, password) => {
  const response = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return response.json();
};

// Get Current User
const getCurrentUser = async (token) => {
  const response = await fetch('http://localhost:5000/api/auth/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// Update Profile
const updateProfile = async (token, data) => {
  const response = await fetch('http://localhost:5000/api/auth/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  return response.json();
};

// Change Password
const changePassword = async (token, currentPassword, newPassword) => {
  const response = await fetch('http://localhost:5000/api/auth/change-password', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ currentPassword, newPassword })
  });
  return response.json();
};
```
