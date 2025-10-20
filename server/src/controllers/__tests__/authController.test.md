# Auth Controller Manual Test Cases

## Registration Controller (`registerUser`) Tests

### Test 1: Successful Registration
**Request:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "testPassword123"
}
```

**Expected Response:** 201 Created
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "<mongodb_id>",
      "name": "John Doe",
      "email": "john@example.com",
      "profilePicture": null,
      "googleFitConnected": false,
      "goals": {
        "stepGoal": 10000,
        "sleepGoal": 8,
        "calorieGoal": 2000,
        "distanceGoal": 5
      },
      "createdAt": "<timestamp>"
    },
    "token": "<jwt_token>"
  }
}
```

---

### Test 2: Missing Required Fields
**Request:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "john@example.com"
}
```

**Expected Response:** 400 Bad Request
```json
{
  "success": false,
  "message": "Please provide name, email, and password"
}
```

---

### Test 3: Duplicate Email
**Prerequisite:** User with email already exists

**Request:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "john@example.com",
  "password": "anotherPassword123"
}
```

**Expected Response:** 400 Bad Request
```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

---

### Test 4: Invalid Email Format
**Request:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "not-an-email",
  "password": "testPassword123"
}
```

**Expected Response:** 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    "Please provide a valid email address"
  ]
}
```

---

### Test 5: Password Too Short
**Request:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "short"
}
```

**Expected Response:** 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    "Password must be at least 8 characters long"
  ]
}
```

---

### Test 6: Name Too Short
**Request:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "J",
  "email": "john@example.com",
  "password": "testPassword123"
}
```

**Expected Response:** 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    "Name must be at least 2 characters"
  ]
}
```

---

### Test 7: Multiple Validation Errors
**Request:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "J",
  "email": "not-an-email",
  "password": "short"
}
```

**Expected Response:** 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    "Name must be at least 2 characters",
    "Please provide a valid email address",
    "Password must be at least 8 characters long"
  ]
}
```

---

## Testing with cURL

### Successful Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "testPassword123"
  }'
```

### Missing Fields
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }'
```

### Duplicate Email
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "john@example.com",
    "password": "anotherPassword123"
  }'
```

---

## Testing with Postman/Thunder Client

1. **Create a new request**
   - Method: POST
   - URL: `http://localhost:5000/api/auth/register`
   - Headers: `Content-Type: application/json`

2. **Test Cases to Run:**
   - Valid registration
   - Missing name
   - Missing email
   - Missing password
   - Duplicate email
   - Invalid email format
   - Password too short
   - Name too short

3. **Verify:**
   - Status codes match expected
   - Response structure is consistent
   - JWT token is returned on success
   - Password is never in response
   - Error messages are clear

---

## Database Verification

After successful registration, verify in MongoDB:

```javascript
// Check user was created
db.users.findOne({ email: "john@example.com" })

// Verify password is hashed (should not be readable)
// Verify default goals are populated
// Verify timestamps (createdAt, updatedAt) exist
```

**Expected Document:**
```javascript
{
  "_id": ObjectId("..."),
  "name": "John Doe",
  "email": "john@example.com",
  "password": "$2a$10$...", // Hashed password
  "googleFitConnected": false,
  "goals": {
    "stepGoal": 10000,
    "sleepGoal": 8,
    "calorieGoal": 2000,
    "distanceGoal": 5
  },
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("..."),
  "__v": 0
}
```

---

## Notes for Testing

1. **Start the server first:**
   ```bash
   cd server
   npm run dev
   ```

2. **Ensure MongoDB is running and connected**

3. **Check environment variables:**
   - `MONGODB_URI` is set
   - `JWT_SECRET` is set
   - `JWT_EXPIRE` is set (optional, defaults to 7d)

4. **Clear test data between runs:**
   ```javascript
   db.users.deleteMany({ email: /test|example/ })
   ```

5. **Monitor server logs for error messages** (marked with ❌)
