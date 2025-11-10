# Health Metrics Server 🏥

Backend API for Health Metrics Monitoring System - A RESTful API built with Node.js, Express, and MongoDB Atlas featuring JWT authentication, comprehensive error handling, and input validation.

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Project Structure](#-project-structure)
- [Setup Instructions](#-setup-instructions)
- [API Documentation](#-api-documentation)
- [Environment Variables](#-environment-variables)
- [Development](#-development)
- [Testing](#-testing)
- [Scripts](#-scripts)
- [License](#-license)

---

## 🛠 Tech Stack

**Core Technologies:**
- **Runtime:** Node.js v18+ (ES Modules only - `"type": "module"`)
- **Framework:** Express.js 4.19.2 - Fast, unopinionated web framework
- **Database:** MongoDB Atlas with Mongoose ODM 8.19.1
- **Authentication:** JWT (jsonwebtoken 9.0.2) + bcryptjs 2.4.3 for password hashing

**Validation & Security:**
- **Input Validation:** express-validator 7.2.1 with comprehensive validation chains
- **CORS:** cors 2.8.5 for cross-origin resource sharing (frontend integration)
- **Security:** helmet (planned) for HTTP headers, partial unique indexes for optional fields
- **Password Policy:** Min 8 chars, 1 uppercase, 1 number, 1 special character
- **Token Security:** JWT with 7-day expiration, bcrypt with 10 salt rounds

**Development Tools:**
- **Hot Reload:** nodemon 3.1.0 - Auto-restart server on file changes
- **Testing:** Jest 29.7.0 + Supertest 7.1.4 + mongodb-memory-server 10.1.4 (comprehensive test suite implemented)
- **Environment:** dotenv 16.4.5 for environment variable management

**External Integrations:**
- **Google APIs:** googleapis 164.0.0 (Google Fit integration - fully implemented)
- **HTTP Client:** axios 1.7.9 for external API calls
- **Scheduling:** node-cron 3.0.3 for automated sync tasks
- **Date Handling:** Native JavaScript Date + ISO 8601 format
- **Validation:** validator 13.15.15 for additional input validation

**Important Notes:**
- ⚠️ **ES Modules Only:** All code uses `import/export` syntax. No CommonJS `require()`.
- ⚠️ **MongoDB Atlas:** Cloud database recommended (local MongoDB also supported).
- ⚠️ **JWT Strategy:** Stateless authentication (no refresh tokens currently).

---

## ✨ Features

### ✅ Complete Authentication System

**User Registration & Login:**
- Email/password registration with comprehensive validation
- Strong password requirements (8+ chars, uppercase, number, special character)
- Secure login with JWT token generation (7-day expiration)
- Password hashing with bcrypt (10 salt rounds)
- Duplicate email prevention with database-level unique constraint

**Protected Routes:**
- JWT middleware (`protect`) for route protection
- Token extraction from `Authorization: Bearer <token>` header
- Automatic token verification and user attachment to `req.user`
- Graceful error handling for expired/invalid tokens

**Profile Management:**
- Get current user profile (excludes password field)
- Update name, profile picture, and goals
- Partial updates supported (only modify specified fields)
- Validation for profile updates (name length, URL format)

**Security Features:**
- Passwords never returned in responses (`select: false` in schema)
- JWT tokens with configurable expiration
- bcrypt with 10 salt rounds for password hashing
- Partial unique index for optional `googleId` field
- Input sanitization and validation on all routes

**Implementation Details:**
- **Controller:** `src/controllers/authController.js` (5 functions)
  - `registerUser` - Create new user with hashed password
  - `loginUser` - Validate credentials and generate JWT
  - `getCurrentUser` - Retrieve authenticated user data
  - `updateProfile` - Update user profile fields
  - `logoutUser` - Client-side logout instruction
- **Middleware:** `src/middleware/auth.js` (`protect` function)
- **Routes:** `src/routes/authRoutes.js` (5 endpoints)
- **Validation:** `src/middleware/validator.js` (validateRegister, validateLogin, validateProfileUpdate)

---

### ✅ Health Metrics Management

**Daily Metrics Tracking:**
- Add/update daily health metrics (one entry per user per day)
- Track multiple metric types:
  - **Activity:** steps, calories burned, distance (km), active minutes
  - **Sleep:** sleep hours
  - **Body:** weight (kg)
- Support for manual entry and Google Fit automatic sync
- Optional activities array (e.g., "running", "cycling")

**Data Retrieval:**
- Get metrics by date range (with start/end date filters)
- Get metrics for specific date
- Get latest metrics entry
- Delete metrics for specific date

**Analytics & Summaries:**
- Calculate aggregated summaries (week/month/year)
- Compute averages, totals, min, and max values
- Track days with data vs. total days in period
- Summary includes:
  - Period type and date range
  - Total and active days count
  - Averages for all metrics
  - Totals for cumulative metrics (steps, calories, distance)
  - Min/Max values for comparative analysis

**Data Validation:**
- Prevent future date entries
- Required date and at least one metric value
- Date normalization to midnight UTC
- Source tracking (manual vs. Google Fit)

**Implementation Details:**
- **Controller:** `src/controllers/healthMetricsController.js` (6 functions)
  - `addOrUpdateMetrics` - Upsert daily metrics
  - `getMetricsByRange` - Query by date range
  - `getMetricsByDate` - Single day lookup
  - `deleteMetrics` - Remove entry for date
  - `getMetricsSummary` - Period aggregation (week/month/year)
  - `getLatestMetrics` - Most recent entry
- **Model:** `src/models/HealthMetric.js` (with userId index)
- **Routes:** `src/routes/healthMetricsRoutes.js` (6 endpoints, all protected)
- **Validation:** `src/middleware/validator.js` (validateHealthMetrics)

---

### ✅ Fitness Goals System

**Goal Management:**
- Set/update user fitness goals (stored in User.goals field)
- Support for 5 goal types:
  - **Weight Goal:** 30-300 kg
  - **Step Goal:** 1000-50000 steps/day
  - **Sleep Goal:** 4-12 hours/night
  - **Calorie Goal:** 500-5000 calories/day
  - **Distance Goal:** 0.5-100 km/day
- Partial updates (modify only specified goals)
- Reset goals to default values

**Progress Tracking:**
- Compare today's metrics with user goals
- Calculate percentage completion for each goal
- Track remaining amounts to achieve goals
- Overall progress percentage across all goals
- Achievement status (true/false for each goal)

**Default Goals:**
- `stepGoal`: 10000 steps
- `sleepGoal`: 8 hours
- `calorieGoal`: 2000 calories
- `distanceGoal`: 5 km
- `weightGoal`: null (user must set)

**Implementation Details:**
- **Controller:** `src/controllers/goalsController.js` (5 functions)
  - `setGoals` - Create or update goals
  - `getGoals` - Retrieve current goals
  - `updateGoals` - Partial goal updates
  - `resetGoals` - Reset to defaults
  - `getGoalProgress` - Compare with today's metrics
- **Model:** User.goals nested object in `src/models/User.js`
- **Routes:** `src/routes/goalsRoutes.js` (5 endpoints, all protected)
- **Validation:** `src/middleware/validator.js` (validateGoals with range constraints)

---

### ✅ Robust Error Handling

**Centralized Error Management:**
- Custom `ErrorResponse` class for structured errors
- `asyncHandler` wrapper eliminates try/catch boilerplate
- Centralized `errorHandler` middleware catches all errors
- `notFound` middleware for undefined routes (404)

**Error Type Handling:**
- **Mongoose Errors:**
  - CastError (invalid ObjectId) → 400 Bad Request
  - ValidationError → 400 with field-specific messages
  - Duplicate key error (code 11000) → 400 with field name
- **JWT Errors:**
  - `JsonWebTokenError` → 401 Unauthorized
  - `TokenExpiredError` → 401 with specific message
- **Validation Errors:**
  - express-validator errors → 400 with formatted field errors
- **File Upload Errors:**
  - Multer errors → 400 with specific messages
- **JSON Errors:**
  - SyntaxError → 400 Bad Request
- **Custom Errors:**
  - `ErrorResponse` → specified status code
- **Generic Errors:**
  - Unhandled errors → 500 Internal Server Error

**Response Format:**
```json
{
  "success": false,
  "message": "Error message here",
  "stack": "Stack trace (development only)"
}
```

**Implementation Details:**
- **File:** `src/middleware/errorHandler.js`
  - `ErrorResponse` class - Custom error with status code
  - `asyncHandler` - Wraps async functions, catches errors
  - `errorHandler` - Main error processing middleware
  - `notFound` - 404 handler for undefined routes
- **Registration:** In `src/server.js` AFTER all routes

---

### ✅ Comprehensive Input Validation

**Express-Validator Integration:**
- Validation chains for all user inputs
- Field-specific error messages
- Sanitization to prevent XSS attacks
- Database-level uniqueness checks

**Validation Chains:**
1. **Registration Validation** (`validateRegister`):
   - Name: 2-50 chars, letters and spaces only
   - Email: valid format, unique in database
   - Password: min 8 chars, 1 uppercase, 1 number, 1 special char
   - Confirm Password: must match password

2. **Login Validation** (`validateLogin`):
   - Email: required, valid format
   - Password: required

3. **Profile Update Validation** (`validateProfileUpdate`):
   - Name: optional, 2-50 chars, letters and spaces
   - Profile Picture: optional, valid URL format
   - Goals: optional, within valid ranges

4. **Health Metrics Validation** (`validateHealthMetrics`):
   - Date: required, valid ISO date, not in future
   - Metrics: at least one required
   - Steps: 0-100000
   - Calories: 0-10000
   - Distance: 0-200 km
   - Active Minutes: 0-1440
   - Sleep Hours: 0-24
   - Weight: 20-500 kg
   - Source: must be "manual" or "googlefit"

5. **Goals Validation** (`validateGoals`):
   - At least one goal required
   - Weight: 30-300 kg
   - Steps: 1000-50000
   - Sleep: 4-12 hours
   - Calories: 500-5000
   - Distance: 0.5-100 km

**Error Response Format:**
```json
{
  "success": false,
  "message": "Validation failed. Please check your input.",
  "errors": {
    "email": "Email must be valid",
    "password": "Password must be at least 8 characters"
  },
  "errorCount": 2
}
```

**Implementation Details:**
- **File:** `src/middleware/validator.js` (405 lines)
- **Middleware:** `handleValidationErrors` - Extracts and formats errors
- **Usage Pattern:** Chain validators → `handleValidationErrors` → controller

---

### ✅ Security Best Practices

**Authentication Security:**
- JWT tokens with configurable expiration (default: 7 days)
- Bcrypt password hashing with 10 salt rounds
- Passwords excluded from all API responses (`select: false`)
- Token verification on every protected route

**Database Security:**
- Partial unique index for `googleId` (prevents duplicate null values)
- Mongoose schema validation with strict constraints
- Input sanitization on all user inputs
- Protection against NoSQL injection via validation

**API Security:**
- CORS configured for frontend integration
- Input validation on all endpoints
- Error messages don't leak sensitive information
- Graceful error handling without stack traces in production

**Planned Security Enhancements:**
- Helmet middleware for HTTP security headers
- Rate limiting to prevent brute-force attacks
- Request logging with Morgan
- API key authentication for external integrations

---

## 📁 Project Structure

```
server/
├── src/
│   ├── config/
│   │   ├── database.js                 # ✅ MongoDB connection with Atlas + event listeners
│   │   ├── oauth.config.js             # ✅ Google OAuth configuration
│   │   └── README.md
│   │
│   ├── controllers/                    # Request handlers (business logic)
│   │   ├── authController.js           # ✅ Auth: register, login, getCurrentUser, updateProfile, logout
│   │   ├── healthMetricsController.js  # ✅ Metrics: add, get, getByDate, delete, summary, latest
│   │   ├── goalsController.js          # ✅ Goals: set, get, update, reset, getProgress
│   │   ├── googleFitController.js      # ✅ Google Fit: OAuth, sync, disconnect, status
│   │   └── README.md
│   │
│   ├── middleware/
│   │   ├── auth.js                     # ✅ JWT verification (protect middleware)
│   │   ├── errorHandler.js             # ✅ ErrorResponse class + asyncHandler + errorHandler
│   │   └── validator.js                # ✅ Validation chains: register, login, profile, metrics, goals
│   │
│   ├── models/                         # Mongoose schemas
│   │   ├── User.js                     # ✅ User with bcrypt + partial googleId index + goals
│   │   ├── HealthMetric.js             # ✅ Daily metrics (steps, calories, sleep, weight, etc.)
│   │   ├── Alert.js                    # ⏳ Notifications schema (planned)
│   │   ├── Analytics.js                # ⏳ Insights/trends schema (planned)
│   │   └── README.md
│   │
│   ├── routes/                         # API route definitions
│   │   ├── authRoutes.js               # ✅ /api/auth/* (5 endpoints)
│   │   ├── healthMetricsRoutes.js      # ✅ /api/metrics/* (6 endpoints)
│   │   ├── goalsRoutes.js              # ✅ /api/goals/* (5 endpoints)
│   │   ├── googleFitRoutes.js          # ✅ /api/googlefit/* (4 endpoints)
│   │   └── README.md
│   │
│   ├── services/                       # Business logic layer
│   │   └── README.md                   # ⏳ Additional services (planned)
│   │
│   ├── utils/                          # Helper functions
│   │   ├── googleFitHelper.js          # ✅ Google Fit API helpers and data transformation
│   │   ├── oauthState.js               # ✅ OAuth state management utilities
│   │   └── README.md
│   │
│   ├── __tests__/                      # Unit and integration tests
│   │   ├── GoogleFitController.test.js # ✅ Google Fit controller tests
│   │   ├── googleFitHelper.test.js     # ✅ Google Fit helper tests
│   │   ├── IndexPerformance.test.js    # ✅ Database index performance tests
│   │   ├── User.test.js                # ✅ User model tests
│   │   └── README.md
│   │
│   └── server.js                       # ✅ Express app + CORS + routes + error handlers
│
├── scripts/                            # Maintenance and utility scripts (23 files)
│   ├── check-latest-sync.mjs           # ✅ Sync status verification
│   ├── check-oauth-scopes.mjs          # ✅ OAuth scope validation
│   ├── checkDates.mjs                  # ✅ Date validation utilities
│   ├── checkHeartPoints.mjs            # ✅ Heart points data checking
│   ├── checkLastSync.mjs               # ✅ Last sync timestamp verification
│   ├── checkRecentMetrics.mjs          # ✅ Recent metrics validation
│   ├── checkScope.mjs                  # ✅ OAuth scope checking
│   ├── checkUserPreferences.mjs        # ✅ User preferences validation
│   ├── debug-wearable-api.mjs          # ✅ Wearable API debugging
│   ├── diagnoseSync.mjs                # ✅ Sync diagnostics
│   ├── displayAllMetrics.mjs           # ✅ Metrics display utility
│   ├── fix-googleid-index.js           # ✅ MongoDB partial unique index fix
│   ├── mongoHelper.mjs                 # ✅ MongoDB utility functions
│   ├── refreshTokenTest.mjs            # ✅ Token refresh testing
│   ├── resetLastSync.mjs               # ✅ Sync reset utility
│   ├── setupTestUser.mjs               # ✅ Test user setup
│   ├── simulateSync.mjs                # ✅ Sync simulation
│   ├── testAggregation.mjs             # ✅ Aggregation testing
│   ├── testAllDataSources.mjs          # ✅ Data source testing
│   ├── testFullSync.mjs                # ✅ Full sync testing
│   ├── testGoogleFitDataSources.mjs    # ✅ Google Fit data source testing
│   ├── testRawWeight.mjs               # ✅ Raw weight data testing
│   ├── testRevokedToken.mjs            # ✅ Revoked token testing
│   ├── testWeightHeight.mjs            # ✅ Weight/height testing
│   ├── verify-metrics.js               # ✅ Database verification script for metrics
│   └── README.md
│
├── workers/                            # Background workers
│   └── googleFitSyncWorker.js          # ✅ Cron-based Google Fit synchronization
│
├── migrations/                         # Database migrations
│   └── create-sync-indexes.js          # ✅ Sync-related index creation
│
├── tests/                              # Additional test files
│   ├── GoogleFitControllerManualTests.md # ✅ Manual testing guide
│   ├── googleFitHelper.test.js         # ✅ Additional helper tests
│   ├── thunder-client-requests.json    # ✅ API testing collection
│   ├── User.test.js                    # ✅ Additional user model tests
│   └── README.md
│
├── config/                             # Configuration files
│   ├── index.js                        # ✅ Main configuration
│   ├── oauth.config.js                 # ✅ OAuth configuration
│   └── README.md
│
├── .env                                # Environment variables (local, not in git)
├── .env.example                        # Environment template with all required vars
├── .gitignore                          # Git ignore rules
├── jest.config.js                      # Jest test configuration (ESM support)
├── package.json                        # Dependencies + scripts + ESM config
├── package-lock.json                   # Locked dependency versions
└── README.md                           # This file
```

**Legend:**
- ✅ Implemented and tested
- ⏳ Planned/In progress

---

## 🚀 Setup Instructions

### Prerequisites

- Node.js v18+ installed
- MongoDB Atlas account (or local MongoDB instance)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ojas-1008/health-metrics-monitoring-system.git
   cd health-metrics-monitoring-system/server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` file with your configuration**
   ```env
   # MongoDB
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/health-metrics

   # JWT
   JWT_SECRET=your_super_secret_key_here_change_in_production
   JWT_EXPIRE=7d

   # Server
   PORT=5000
   NODE_ENV=development

  # Client (for CORS)
  # Vite dev server runs on 5173 by default
  CLIENT_URL=http://localhost:5173

   # Google OAuth (for future Google Fit integration)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

   Expected output:
   ```
   ✅ MongoDB Connected: cluster.mongodb.net
   📦 Database Name: health-metrics
   🟢 Mongoose connected to MongoDB Atlas

   ========================================
   🚀 SERVER STARTED SUCCESSFULLY
   ========================================
   Environment: development
   Port: 5000
   Base URL: http://localhost:5000

   📍 Available Endpoints:
     • Health Check: GET /api/health

     Authentication:
     - Register: POST /api/auth/register
     - Login: POST /api/auth/login
     - Get User: GET /api/auth/me
     - Update Profile: PUT /api/auth/profile
     - Logout: POST /api/auth/logout

     Health Metrics:
     - Add/Update Metrics: POST /api/metrics
     - Get by Range: GET /api/metrics?startDate=...&endDate=...
     - Get by Date: GET /api/metrics/:date
     - Delete: DELETE /api/metrics/:date
     - Summary: GET /api/metrics/summary/:period
     - Latest: GET /api/metrics/latest

     Goals:
     - Set Goals: POST /api/goals
     - Get Goals: GET /api/goals
     - Update Goals: PUT /api/goals
     - Reset Goals: DELETE /api/goals
     - Get Progress: GET /api/goals/progress
   ========================================
   ```

---

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Routes (`/api/auth`)

See also: `docs/AUTH_API_REFERENCE.md`, `docs/REGISTRATION_CONTROLLER_IMPLEMENTATION.md`, `docs/GET_CURRENT_USER_IMPLEMENTATION.md`, and `docs/UPDATE_PROFILE_IMPLEMENTATION.md` for detailed behavior and examples.

#### 1. Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGc...",
  "user": {
    "id": "68f680960a96add2ff049508",
    "name": "John Doe",
    "email": "john@example.com",
    "profilePicture": null,
    "googleFitConnected": false,
    "goals": {
      "weightGoal": null,
      "stepGoal": 10000,
      "sleepGoal": 8,
      "calorieGoal": 2000,
      "distanceGoal": 5
    },
    "createdAt": "2025-10-24T15:49:28.949Z"
  }
}
```

#### 2. Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGc...",
  "user": { /* same as registration */ }
}
```

#### 3. Get Current User (Protected)
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "68f680960a96add2ff049508",
    "name": "John Doe",
    "email": "john@example.com",
    "profilePicture": null,
    "googleFitConnected": false,
    "googleId": null,
    "goals": { /* ... */ },
    "createdAt": "2025-10-24T15:49:28.949Z",
    "updatedAt": "2025-10-24T15:49:28.949Z"
  }
}
```

#### 4. Update Profile (Protected)
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Doe",
  "profilePicture": "https://example.com/photo.jpg",
  "goals": {
    "stepGoal": 12000,
    "sleepGoal": 8.5,
    "calorieGoal": 2200
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": { /* updated user object */ }
}
```

#### 5. Logout (Protected)
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully. Please delete your token on the client side."
}
```

### Utility Routes

#### Health Check
```http
GET /api/health
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-11-03T16:00:00.000Z",
  "environment": "development"
}
```

---

### Health Metrics Routes (`/api/metrics`)

All metrics routes require authentication via JWT token.

#### 1. Add or Update Metrics
```http
POST /api/metrics
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2025-11-03",
  "metrics": {
    "steps": 10247,
    "calories": 1500,
    "distance": 7.5,
    "activeMinutes": 60,
    "sleepHours": 8.5,
    "weight": 70
  },
  "source": "manual",
  "activities": ["running", "cycling"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Health metrics saved successfully",
  "data": {
    "_id": "...",
    "userId": "...",
    "date": "2025-11-03T00:00:00.000Z",
    "metrics": {
      "steps": 10247,
      "calories": 1500,
      "distance": 7.5,
      "activeMinutes": 60,
      "sleepHours": 8.5,
      "weight": 70
    },
    "source": "manual",
    "activities": ["running", "cycling"],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Notes:**
- Date is normalized to midnight UTC
- One entry per user per day (upsert operation)
- Cannot add metrics for future dates
- Missing metrics default to 0 (steps, calories, distance, activeMinutes) or null (weight, sleepHours)

#### 2. Get Metrics by Date Range
```http
GET /api/metrics?startDate=2025-11-01&endDate=2025-11-03
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "...",
      "date": "2025-11-01T00:00:00.000Z",
      "metrics": { ... }
    },
    {
      "_id": "...",
      "date": "2025-11-02T00:00:00.000Z",
      "metrics": { ... }
    },
    {
      "_id": "...",
      "date": "2025-11-03T00:00:00.000Z",
      "metrics": { ... }
    }
  ]
}
```

**Query Parameters:**
- `startDate` (required): ISO date string (YYYY-MM-DD)
- `endDate` (required): ISO date string (YYYY-MM-DD)

#### 3. Get Metrics by Specific Date
```http
GET /api/metrics/2025-11-03
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "userId": "...",
    "date": "2025-11-03T00:00:00.000Z",
    "metrics": { ... },
    "source": "manual",
    "activities": ["running"]
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "message": "No metrics found for this date"
}
```

#### 4. Get Metrics Summary
```http
GET /api/metrics/summary/week
Authorization: Bearer <token>
```

**Supported periods:** `week`, `month`, `year`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "period": "week",
    "startDate": "2025-10-28T00:00:00.000Z",
    "endDate": "2025-11-03T00:00:00.000Z",
    "totalDays": 7,
    "daysWithData": 5,
    "averages": {
      "steps": 8500.4,
      "calories": 1320.2,
      "distance": 6.2,
      "activeMinutes": 55.8,
      "sleepHours": 7.6,
      "weight": 70.5
    },
    "totals": {
      "steps": 59503,
      "calories": 9241,
      "distance": 43.4,
      "activeMinutes": 391
    },
    "min": {
      "steps": 5200,
      "calories": 980,
      "distance": 3.5
    },
    "max": {
      "steps": 12450,
      "calories": 1820,
      "distance": 9.2
    }
  }
}
```

#### 5. Get Latest Metrics
```http
GET /api/metrics/latest
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "date": "2025-11-03T00:00:00.000Z",
    "metrics": { ... }
  }
}
```

#### 6. Delete Metrics
```http
DELETE /api/metrics/2025-11-03
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Metrics deleted successfully"
}
```

---

### Goals Routes (`/api/goals`)

All goals routes require authentication via JWT token.

#### 1. Set Goals
```http
POST /api/goals
Authorization: Bearer <token>
Content-Type: application/json

{
  "stepGoal": 10000,
  "calorieGoal": 2000,
  "sleepGoal": 8,
  "weightGoal": 70,
  "distanceGoal": 5
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Goals updated successfully",
  "data": {
    "weightGoal": 70,
    "stepGoal": 10000,
    "sleepGoal": 8,
    "calorieGoal": 2000,
    "distanceGoal": 5
  }
}
```

**Validation Rules:**
- `stepGoal`: 1000-50000 steps
- `calorieGoal`: 500-5000 calories
- `sleepGoal`: 4-12 hours
- `weightGoal`: 30-300 kg
- `distanceGoal`: 0.5-100 km

#### 2. Get Goals
```http
GET /api/goals
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "weightGoal": null,
    "stepGoal": 10000,
    "sleepGoal": 8,
    "calorieGoal": 2000,
    "distanceGoal": 5
  }
}
```

#### 3. Update Goals (Partial Update)
```http
PUT /api/goals
Authorization: Bearer <token>
Content-Type: application/json

{
  "stepGoal": 12000,
  "sleepGoal": 9
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Goals updated successfully",
  "data": {
    "weightGoal": null,
    "stepGoal": 12000,
    "sleepGoal": 9,
    "calorieGoal": 2000,
    "distanceGoal": 5
  }
}
```

**Notes:**
- Only provided fields are updated
- Other goals remain unchanged
- At least one goal field must be provided

#### 4. Reset Goals to Defaults
```http
DELETE /api/goals
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Goals reset to defaults",
  "data": {
    "weightGoal": null,
    "stepGoal": 10000,
    "sleepGoal": 8,
    "calorieGoal": 2000,
    "distanceGoal": 5
  }
}
```

#### 5. Get Goal Progress
```http
GET /api/goals/progress
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "date": "2025-11-03T00:00:00.000Z",
    "goals": {
      "stepGoal": 10000,
      "calorieGoal": 2000,
      "sleepGoal": 8,
      "weightGoal": 70,
      "distanceGoal": 5
    },
    "currentMetrics": {
      "steps": 7500,
      "calories": 1500,
      "sleepHours": 7.5,
      "weight": 71,
      "distance": 4.2
    },
    "progress": {
      "steps": {
        "goal": 10000,
        "current": 7500,
        "percentage": 75,
        "achieved": false,
        "remaining": 2500
      },
      "calories": {
        "goal": 2000,
        "current": 1500,
        "percentage": 75,
        "achieved": false,
        "remaining": 500
      },
      "sleep": {
        "goal": 8,
        "current": 7.5,
        "percentage": 93.75,
        "achieved": false,
        "remaining": 0.5
      },
      "weight": {
        "goal": 70,
        "current": 71,
        "difference": 1,
        "achieved": false
      },
      "distance": {
        "goal": 5,
        "current": 4.2,
        "percentage": 84,
        "achieved": false,
        "remaining": 0.8
      }
    },
    "overallProgress": 80.55
  }
}
```

**Notes:**
- Compares today's metrics with user goals
- Returns 0 for metrics if no data exists for today
- Shows percentage completion and remaining amounts

---

### Google Fit Routes (`/api/googlefit`)

#### 1. Initiate Google Fit Connection
```http
GET /api/googlefit/connect
Authorization: Bearer <token>
```

**Response (302 Redirect):**
- Redirects to Google OAuth consent screen
- User grants permission for fitness data access
- Returns to callback URL after authorization

**Notes:**
- Requires Google OAuth credentials in environment variables
- Stores OAuth state for security

#### 2. OAuth Callback (Google Redirects Here)
```http
GET /api/googlefit/callback?code=<auth_code>&state=<state>
```

**Response (302 Redirect):**
- Processes authorization code
- Exchanges for access/refresh tokens
- Updates user with Google Fit connection
- Redirects to frontend success page

#### 3. Check Connection Status
```http
GET /api/googlefit/status
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "lastSync": "2025-11-03T10:30:00.000Z",
    "googleFitConnected": true
  }
}
```

#### 4. Disconnect Google Fit
```http
POST /api/googlefit/disconnect
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Google Fit disconnected successfully"
}
```

**Notes:**
- Removes Google Fit connection from user profile
- Stops automatic sync for this user
- Manual sync can still be triggered if needed

---

## 🔐 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` |
| `JWT_SECRET` | Secret key for JWT signing | `your_secret_key_min_32_chars` |
| `JWT_EXPIRE` | Token expiration time | `7d` (7 days) |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (optional) | `123456789-abc.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret (optional) | `GOCSPX-...` |

---

## 💻 Development

### Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `nodemon src/server.js` | Start development server with hot reload |
| `start` | `node src/server.js` | Start production server |
| `test` | `jest` | Run tests with Jest |
| `test:watch` | `jest --watch` | Run tests in watch mode |

**Start Development Server:**
```bash
cd server
npm run dev
```

**Expected Console Output:**
```
✅ MongoDB Connected: cluster0.mongodb.net
📦 Database Name: health-metrics
🟢 Mongoose connected to MongoDB Atlas

========================================
🚀 SERVER STARTED SUCCESSFULLY
========================================
Environment: development
Port: 5000
Base URL: http://localhost:5000

📍 Available Endpoints:
  • Health Check: GET /api/health

  Authentication:
  - Register: POST /api/auth/register
  - Login: POST /api/auth/login
  - Get User: GET /api/auth/me
  - Update Profile: PUT /api/auth/profile
  - Logout: POST /api/auth/logout

  Health Metrics:
  - Add/Update Metrics: POST /api/metrics
  - Get by Range: GET /api/metrics?startDate=...&endDate=...
  - Get by Date: GET /api/metrics/:date
  - Delete: DELETE /api/metrics/:date
  - Summary: GET /api/metrics/summary/:period
  - Latest: GET /api/metrics/latest

  Goals:
  - Set Goals: POST /api/goals
  - Get Goals: GET /api/goals
  - Update Goals: PUT /api/goals
  - Reset Goals: DELETE /api/goals
  - Get Progress: GET /api/goals/progress

  Google Fit:
  - Connect: GET /api/googlefit/connect
  - OAuth Callback: GET /api/googlefit/callback
  - Connection Status: GET /api/googlefit/status
  - Disconnect: POST /api/googlefit/disconnect
========================================
```

---

### Development Workflow

**1. Setup Development Environment:**
```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your MongoDB URI and JWT secret
# Start dev server
npm run dev
```

**2. Making Changes:**
- Edit files in `src/` directory
- Nodemon auto-restarts server on file save
- Check terminal for errors or success messages
- Test endpoints with Thunder Client/Postman

**3. Testing Endpoints:**
- Use Thunder Client (VS Code extension)
- Import collection from `docs/Thunder_Client_Collection_*.json`
- Or use Postman/Insomnia/curl

**4. Database Inspection:**
- Use MongoDB Compass for visual inspection
- Use `scripts/verify-metrics.js` to check metrics data
- Connection string from `.env` → `MONGODB_URI`

**5. Debugging:**
- Check terminal logs for detailed error messages
- Error responses include stack traces in development
- Use `console.log()` liberally (they show in terminal)
- MongoDB connection issues → Check MONGODB_URI format

---

### Code Quality Standards

**ES Modules Syntax:**
```javascript
// ✅ Correct (ES Modules)
import express from 'express';
export const myFunction = () => {};

// ❌ Wrong (CommonJS - NOT supported)
const express = require('express');
module.exports = myFunction;
```

**Async/Await Pattern:**
```javascript
// ✅ Use asyncHandler wrapper
export const myController = asyncHandler(async (req, res, next) => {
  const data = await Model.find();
  res.json({ success: true, data });
});

// ❌ Don't use raw try/catch (unless necessary)
export const myController = async (req, res, next) => {
  try {
    const data = await Model.find();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
```

**Error Handling:**
```javascript
// ✅ Use ErrorResponse for custom errors
if (!user) {
  return next(new ErrorResponse('User not found', 404));
}

// ❌ Don't throw raw errors
if (!user) {
  throw new Error('User not found'); // No status code!
}
```

**Controller Structure:**
```javascript
/**
 * @desc    Description of what function does
 * @route   HTTP_METHOD /api/route/path
 * @access  Public/Private
 */
export const controllerName = asyncHandler(async (req, res, next) => {
  // 1. Extract data from request
  const { field } = req.body;
  
  // 2. Validation (if not in middleware)
  if (!field) {
    return next(new ErrorResponse('Field is required', 400));
  }
  
  // 3. Database operations
  const result = await Model.findOne({ field });
  
  // 4. Send response
  res.status(200).json({
    success: true,
    data: result
  });
});
```

**Validation Pattern:**
```javascript
// In routes file
router.post(
  '/register',
  validateRegister,           // Validation chain
  handleValidationErrors,     // Error extraction
  registerUser                // Controller
);
```

---

### Environment Setup

**Required Environment Variables:**
Create `.env` file in `server/` directory:

```env
# ===== MongoDB Configuration =====
# Format: mongodb+srv://username:password@cluster.mongodb.net/database_name
MONGODB_URI=mongodb+srv://user:pass@cluster0.abc123.mongodb.net/health-metrics

# ===== JWT Configuration =====
# Secret: Use strong random string (min 32 characters)
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long
JWT_EXPIRE=7d

# ===== Server Configuration =====
PORT=5000
NODE_ENV=development

# ===== CORS Configuration =====
# Frontend URL (Vite dev server default: 5173)
CLIENT_URL=http://localhost:5173

# ===== Google OAuth (Optional - for Google Fit) =====
GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_google_oauth_secret
```

**Generate Secure JWT Secret:**
```bash
# PowerShell (Windows)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Output example:
# 9af8f4c3e2b1d5a6c8f7e9d4b3a2c1f0e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3
```

---

### Common Development Tasks

**Check Server Health:**
```bash
curl http://localhost:5000/api/health
```

**Fix MongoDB Index Issues:**
```bash
node scripts/fix-googleid-index.js
```

**Verify Metrics Data:**
```bash
# Check specific user's metrics
node scripts/verify-metrics.js user@example.com

# Check most recent user's metrics
node scripts/verify-metrics.js
```

**Clear Database (MongoDB Compass):**
1. Connect with MONGODB_URI
2. Select `health-metrics` database
3. Drop collections: `users`, `healthmetrics`
4. Restart server (indexes auto-recreate)

**Test Authentication Flow:**
1. Register new user → Save token
2. Login with credentials → Verify same token format
3. Get user profile → Verify data matches
4. Update profile → Verify changes persist
5. Logout → Client should delete token

---

### Debugging Tips

**MongoDB Connection Issues:**
```
Error: connect ECONNREFUSED
```
- Check MONGODB_URI format in `.env`
- Verify MongoDB Atlas IP whitelist (allow 0.0.0.0/0 for development)
- Check network connectivity

**JWT Token Issues:**
```
Error: jwt malformed / jwt expired
```
- Verify token is sent in header: `Authorization: Bearer <token>`
- Check JWT_SECRET matches between registration and login
- Ensure token hasn't expired (default: 7 days)

**Validation Errors:**
```
Validation failed. Please check your input.
```
- Check request body matches expected format
- Review validation rules in `middleware/validator.js`
- Ensure all required fields are provided

**Duplicate Key Errors:**
```
E11000 duplicate key error collection: health-metrics.users index: email_1
```
- Email already exists in database
- For googleId errors, run `scripts/fix-googleid-index.js`

---

### Development Notes

**Port Configuration:**
- Backend server: `5000` (configured in `.env`)
- Frontend dev server: `5173` (Vite default)
- MongoDB local: `27017` (if using local instead of Atlas)

**Database Indexes:**
- `User.email`: Unique index (prevents duplicates)
- `User.googleId`: Partial unique index (only when not null)
- `HealthMetric.userId`: Regular index (improves query performance)
- `HealthMetric.userId + date`: Compound unique index (one entry per user per day)

**Date Handling:**
- All dates stored as midnight UTC (`YYYY-MM-DDTHH:MM:SS.000Z`)
- Date normalization: `new Date(date).setHours(0, 0, 0, 0)`
- ISO 8601 format for API requests: `YYYY-MM-DD`

**Password Security:**
- Pre-save hook in User model automatically hashes passwords
- Never manually call bcrypt in controllers
- Password field excluded from all queries (`select: false`)
- Explicit selection required: `User.findById(id).select('+password')`

**Error Handler Registration:**
- Must register `notFound` and `errorHandler` AFTER all routes in `server.js`
- Order matters: routes → notFound → errorHandler

---

## 🧪 Testing

### Manual API Testing

**Recommended Tools:**
- **Thunder Client** (VS Code extension) - Recommended ⭐
- **Postman** - Full-featured API client
- **Insomnia** - Lightweight alternative
- **curl** - Command-line testing

---

### Complete Testing Workflows

#### **1. Authentication Flow Testing**

For detailed step-by-step auth testing, see: `docs/AUTH_ROUTES_VERIFICATION.md`

**Quick Test Sequence:**
```http
# 1. Register New User
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "Test@1234",
  "confirmPassword": "Test@1234"
}

# Expected: 201 Created with token and user object
# Save the token for subsequent requests!

# 2. Login
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Test@1234"
}

# Expected: 200 OK with token

# 3. Get Current User (Protected Route)
GET http://localhost:5000/api/auth/me
Authorization: Bearer <your_token_here>

# Expected: 200 OK with user profile

# 4. Update Profile (Protected Route)
PUT http://localhost:5000/api/auth/profile
Authorization: Bearer <your_token_here>
Content-Type: application/json

{
  "name": "Updated Name",
  "goals": {
    "stepGoal": 12000,
    "sleepGoal": 8.5
  }
}

# Expected: 200 OK with updated user

# 5. Logout
POST http://localhost:5000/api/auth/logout
Authorization: Bearer <your_token_here>

# Expected: 200 OK with logout message
```

---

#### **2. Health Metrics Flow Testing**

For detailed metrics testing, see: `docs/TESTING_METRICS_FLOW.md`

**Quick Test Sequence:**
```http
# 1. Add Today's Metrics
POST http://localhost:5000/api/metrics
Authorization: Bearer <your_token_here>
Content-Type: application/json

{
  "date": "2025-11-04",
  "metrics": {
    "steps": 10247,
    "calories": 1500,
    "distance": 7.5,
    "activeMinutes": 60,
    "sleepHours": 8.5,
    "weight": 70
  },
  "source": "manual",
  "activities": ["running", "cycling"]
}

# Expected: 200 OK with saved metrics

# 2. Get Latest Metrics
GET http://localhost:5000/api/metrics/latest
Authorization: Bearer <your_token_here>

# Expected: 200 OK with most recent metrics

# 3. Get Metrics by Date Range
GET http://localhost:5000/api/metrics?startDate=2025-11-01&endDate=2025-11-04
Authorization: Bearer <your_token_here>

# Expected: 200 OK with array of metrics

# 4. Get Weekly Summary
GET http://localhost:5000/api/metrics/summary/week
Authorization: Bearer <your_token_here>

# Expected: 200 OK with averages, totals, min, max

# 5. Get Specific Date Metrics
GET http://localhost:5000/api/metrics/2025-11-04
Authorization: Bearer <your_token_here>

# Expected: 200 OK with metrics for that date

# 6. Delete Metrics
DELETE http://localhost:5000/api/metrics/2025-11-04
Authorization: Bearer <your_token_here>

# Expected: 200 OK with deletion confirmation
```

**Verify in Database:**
```bash
node scripts/verify-metrics.js test@example.com
```

---

#### **3. Fitness Goals Flow Testing**

**Quick Test Sequence:**
```http
# 1. Set Initial Goals
POST http://localhost:5000/api/goals
Authorization: Bearer <your_token_here>
Content-Type: application/json

{
  "stepGoal": 10000,
  "calorieGoal": 2000,
  "sleepGoal": 8,
  "weightGoal": 70,
  "distanceGoal": 5
}

# Expected: 200 OK with all goals set

# 2. Get Current Goals
GET http://localhost:5000/api/goals
Authorization: Bearer <your_token_here>

# Expected: 200 OK with current goals

# 3. Update Specific Goals (Partial Update)
PUT http://localhost:5000/api/goals
Authorization: Bearer <your_token_here>
Content-Type: application/json

{
  "stepGoal": 12000,
  "sleepGoal": 9
}

# Expected: 200 OK with updated goals (others unchanged)

# 4. Get Goal Progress (Requires today's metrics)
GET http://localhost:5000/api/goals/progress
Authorization: Bearer <your_token_here>

# Expected: 200 OK with progress percentages and achievement status

# 5. Reset Goals to Defaults
DELETE http://localhost:5000/api/goals
Authorization: Bearer <your_token_here>

# Expected: 200 OK with default goals
```

---

### Thunder Client Collections

Pre-configured request collections available:
- `docs/Thunder_Client_Collection_Goals_API.json`
- Import into Thunder Client for instant testing

**How to Import:**
1. Open Thunder Client in VS Code
2. Click "Collections" tab
3. Click "Menu" (three dots) → "Import"
4. Select the JSON file
5. All requests ready to use!

---

### Test Data Examples

**Valid User Registration:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}
```

**Valid Health Metrics:**
```json
{
  "date": "2025-11-04",
  "metrics": {
    "steps": 10000,
    "calories": 1500,
    "distance": 7.5,
    "activeMinutes": 60,
    "sleepHours": 8,
    "weight": 70
  },
  "source": "manual"
}
```

**Valid Goals:**
```json
{
  "stepGoal": 10000,
  "calorieGoal": 2000,
  "sleepGoal": 8,
  "weightGoal": 70,
  "distanceGoal": 5
}
```

---

### Common Test Scenarios

**1. Validation Testing:**
```http
# Missing required field
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Test User"
  // Missing email, password
}

# Expected: 400 Bad Request with validation errors
```

**2. Authentication Testing:**
```http
# Access protected route without token
GET http://localhost:5000/api/auth/me

# Expected: 401 Unauthorized "Not authorized, no token"
```

**3. Duplicate Email Testing:**
```http
# Register with existing email
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Another User",
  "email": "existing@example.com",  // Already registered
  "password": "Test@1234",
  "confirmPassword": "Test@1234"
}

# Expected: 400 Bad Request "Email already in use"
```

**4. Future Date Prevention:**
```http
# Add metrics for future date
POST http://localhost:5000/api/metrics
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2026-01-01",  // Future date
  "metrics": { "steps": 10000 }
}

# Expected: 400 Bad Request "Cannot add metrics for future dates"
```

---

### Automated Testing (Planned)

**Test Structure:**
```
server/
└── src/
    └── controllers/
        └── __tests__/
            ├── authController.test.js
            ├── healthMetricsController.test.js
            └── goalsController.test.js
```

**Run Tests:**
```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

**Example Test (Planned):**
```javascript
import { registerUser } from '../authController.js';

describe('Auth Controller', () => {
  describe('registerUser', () => {
    it('should register new user with valid data', async () => {
      // Test implementation
    });

    it('should reject duplicate email', async () => {
      // Test implementation
    });

    it('should reject weak password', async () => {
      // Test implementation
    });
  });
});
```

**Test Coverage Goals:**
- Controllers: 80%+ coverage
- Middleware: 90%+ coverage
- Models: 85%+ coverage
- Overall: 80%+ coverage

---

### Success Criteria Checklist

**Authentication Tests:**
- [ ] Register with valid data → 201 Created
- [ ] Register with duplicate email → 400 Error
- [ ] Login with valid credentials → 200 OK
- [ ] Login with wrong password → 401 Unauthorized
- [ ] Access protected route without token → 401 Unauthorized
- [ ] Access protected route with valid token → 200 OK
- [ ] Update profile with valid data → 200 OK
- [ ] Logout → 200 OK

**Health Metrics Tests:**
- [ ] Add metrics for today → 200 OK
- [ ] Add metrics for future date → 400 Error
- [ ] Get metrics by valid date range → 200 OK
- [ ] Get metrics by specific date → 200 OK or 404
- [ ] Get weekly/monthly/yearly summary → 200 OK
- [ ] Get latest metrics → 200 OK
- [ ] Delete metrics → 200 OK

**Goals Tests:**
- [ ] Set all goals with valid values → 200 OK
- [ ] Set goal with out-of-range value → 400 Error
- [ ] Get current goals → 200 OK
- [ ] Update specific goals (partial) → 200 OK
- [ ] Get goal progress → 200 OK
- [ ] Reset goals to defaults → 200 OK

---

## 📜 Scripts

### NPM Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `nodemon src/server.js` | Development server with auto-reload on file changes |
| `start` | `node src/server.js` | Production server (no hot reload) |
| `test` | `jest` | Run Jest test suite (comprehensive tests implemented) |
| `test:watch` | `jest --watch` | Run tests in watch mode for development |

### Maintenance Scripts

Located in `scripts/` directory:

#### 1. Fix GoogleId Index (`fix-googleid-index.js`)

**Purpose:** Repair MongoDB unique index issues for `User.googleId` field

**When to Use:**
- Getting duplicate key errors for googleId
- After schema changes to User.googleId
- Migrating from old index structure

**What It Does:**
1. Drops old `googleId_1` unique index
2. Creates partial unique index (enforces uniqueness only for non-null values)
3. Unsets `googleId: null` from existing documents (prevents duplicate nulls)

**How to Run:**
```bash
cd server
node scripts/fix-googleid-index.js
```

**Expected Output:**
```
🚀 Starting MongoDB index fix for googleId...
✅ MongoDB Connected: cluster0.mongodb.net
📋 Attempting to drop old index: googleId_1
✅ Old index dropped successfully
🔧 Creating new partial unique index on googleId...
✅ New partial unique index created
📝 Unsetting null googleId values from existing documents...
✅ Updated 5 documents (removed googleId: null)
✅ Index fix completed successfully!
🟢 Database connection closed
```

**Partial Unique Index Details:**
```javascript
// Old index (causes errors with duplicate nulls)
{ googleId: 1 }, { unique: true }

// New index (allows multiple nulls, unique non-nulls only)
{ googleId: 1 }, { 
  unique: true, 
  partialFilterExpression: { googleId: { $type: "string" } } 
}
```

---

#### 2. Verify Metrics (`verify-metrics.js`)

**Purpose:** Verify health metrics data in MongoDB database

**When to Use:**
- After adding/updating metrics via API
- Debugging metrics storage issues
- Checking data integrity
- Verifying test data

**What It Does:**
1. Connects to MongoDB using MONGODB_URI from `.env`
2. Finds user by email (or most recent user if no email provided)
3. Lists all metrics for that user (shows last 10)
4. Shows today's specific metrics (if available)
5. Displays formatted console output with emojis and borders

**How to Run:**
```bash
# Check specific user's metrics
node scripts/verify-metrics.js user@example.com

# Check most recent user's metrics
node scripts/verify-metrics.js
```

**Expected Output:**
```
========================================
📊 HEALTH METRICS VERIFICATION
========================================
User: test@example.com

========================================
📋 LATEST 10 METRICS ENTRIES
========================================

📅 Date: 2025-11-04
   Steps: 10247 | Calories: 1500 | Distance: 7.5 km
   Active: 60 min | Sleep: 8.5 hrs | Weight: 70 kg
   Source: manual | Activities: running, cycling

📅 Date: 2025-11-03
   Steps: 9500 | Calories: 1400 | Distance: 6.8 km
   Active: 55 min | Sleep: 7.5 hrs | Weight: 70.5 kg
   Source: manual

========================================
📆 TODAY'S METRICS (2025-11-04)
========================================
   Steps: 10247 | Calories: 1500 | Distance: 7.5 km
   Active: 60 min | Sleep: 8.5 hrs | Weight: 70 kg
   Source: manual | Activities: running, cycling

✅ Verification complete!
```

**Error Handling:**
- If user not found: Shows message and lists all users
- If no metrics found: Shows appropriate message
- If database connection fails: Shows error details

**Usage Examples:**
```bash
# Verify after adding metrics
curl -X POST http://localhost:5000/api/metrics \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"date":"2025-11-04","metrics":{"steps":10000}}'
  
node scripts/verify-metrics.js test@example.com

# Check all users in database
node scripts/verify-metrics.js
# (Shows most recent user + total user count)
```

---

### Script Development Notes

**Environment Variables:**
Both scripts use environment variables from `.env`:
```javascript
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
```

**Error Handling:**
- All scripts use try/catch with graceful error messages
- Database connections are properly closed
- Exit codes: 0 (success), 1 (error)

**ES Modules:**
Both scripts use ES Modules syntax (`import/export`)

---

---

## � Additional Resources

### Related Documentation

**Project Documentation:**
- [Main README](../README.md) - Project overview and features
- [Architecture Documentation](../ARCHITECTURE.md) - System design and patterns
- [Tech Stack Details](../TECH_STACK.md) - Complete technology reference
- [Documentation Index](../DOCUMENTATION_INDEX.md) - Guide to all docs

**API Specific Documentation:**
- [Auth API Reference](../docs/AUTH_API_REFERENCE.md) - Detailed auth endpoints
- [Auth Routes Verification](../docs/AUTH_ROUTES_VERIFICATION.md) - Testing guide
- [Metrics Testing Flow](../TESTING_METRICS_FLOW.md) - Complete metrics testing
- [Goals API Collection](../docs/Thunder_Client_Collection_Goals_API.json) - Thunder Client requests

**Implementation Guides:**
- [Registration Controller](../docs/REGISTRATION_CONTROLLER_IMPLEMENTATION.md)
- [Get Current User](../docs/GET_CURRENT_USER_IMPLEMENTATION.md)
- [Update Profile](../docs/UPDATE_PROFILE_IMPLEMENTATION.md)

### Frontend Integration

**Client Directory:**
- Location: `../client/`
- Framework: React 19 + Vite 7
- Styling: Tailwind CSS 4
- Documentation: [Client README](../client/src/README.md)

**API Integration:**
- Base URL: `http://localhost:5000/api`
- Vite Proxy: `/api/*` forwards to backend
- Axios Configuration: `client/src/api/axiosConfig.js`
- Services: `client/src/services/` (authService, metricsService, goalsService)

---

## 🏗 Code Organization

### Controller Pattern

All controllers follow this structure:

```javascript
/**
 * @desc    Brief description
 * @route   HTTP_METHOD /api/route/path
 * @access  Public/Private
 */
export const controllerName = asyncHandler(async (req, res, next) => {
  // 1. Extract and validate input
  const { field } = req.body;
  
  // 2. Business logic
  const result = await Model.operation();
  
  // 3. Send response
  res.status(200).json({
    success: true,
    data: result
  });
});
```

### Middleware Chain Pattern

Routes use middleware chains:

```javascript
router.post(
  '/endpoint',
  validationChain,         // express-validator
  handleValidationErrors,  // Extract errors
  protect,                 // JWT auth (if protected)
  controller               // Request handler
);
```

### Error Handling Pattern

All errors go through centralized handler:

```javascript
// Custom errors
throw new ErrorResponse('Message', statusCode);

// Async errors (caught by asyncHandler)
const data = await Model.find(); // Errors caught automatically

// Validation errors (caught by errorHandler)
// MongoDB errors (caught by errorHandler)
// JWT errors (caught by errorHandler)
```

### Response Format

All API responses follow consistent format:

```javascript
// Success response
{
  "success": true,
  "message": "Optional message",
  "data": { /* response data */ },
  "count": 10  // For arrays
}

// Error response
{
  "success": false,
  "message": "Error message",
  "errors": { /* field errors */ },
  "stack": "Stack trace (dev only)"
}
```

---

## 🤝 Contributing

### Development Guidelines

**Before Starting:**
1. Read this README completely
2. Review [ARCHITECTURE.md](../ARCHITECTURE.md) for design patterns
3. Check existing code for style consistency
4. Set up development environment

**Making Changes:**
1. Create feature branch from `main`
2. Follow existing code patterns
3. Add JSDoc comments for new functions
4. Test manually with Thunder Client
5. Write unit tests (when test suite exists)
6. Update documentation if needed

**Code Style:**
- ES Modules only (`import/export`)
- Async/await for async operations
- Use `asyncHandler` wrapper for all controllers
- Use `ErrorResponse` for custom errors
- Follow existing naming conventions
- Add comprehensive comments

**Commit Messages:**
- Use conventional commits format
- Examples:
  - `feat: add password reset endpoint`
  - `fix: correct JWT expiration handling`
  - `docs: update API documentation`
  - `test: add controller unit tests`
  - `refactor: improve error handling`

**Pull Request Process:**
1. Update README if adding features
2. Ensure all tests pass (when available)
3. Update API documentation
4. Add Thunder Client examples if new endpoints
5. Request review from maintainer

---

## � Troubleshooting

### Common Issues

**Issue: "Module not found" errors**
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module
```
**Solution:**
- Ensure all imports include file extensions (`.js`)
- Check `"type": "module"` in package.json
- Use `import` not `require()`

**Issue: MongoDB connection fails**
```
MongoServerError: bad auth
```
**Solution:**
- Verify MONGODB_URI format in `.env`
- Check username/password (URL encode special characters)
- Verify MongoDB Atlas IP whitelist
- Test connection in MongoDB Compass

**Issue: JWT token expired**
```
Error: jwt expired
```
**Solution:**
- Token expires after 7 days (JWT_EXPIRE)
- User must re-login to get new token
- Check JWT_SECRET is consistent

**Issue: Duplicate key error for googleId**
```
E11000 duplicate key error collection: health-metrics.users index: googleId_1
```
**Solution:**
```bash
node scripts/fix-googleid-index.js
```

**Issue: Validation errors not showing**
**Solution:**
- Ensure `handleValidationErrors` middleware is after validation chain
- Check validation chain is imported and used correctly
- Verify express-validator version (7.x)

**Issue: CORS errors in frontend**
```
Access to fetch blocked by CORS policy
```
**Solution:**
- Verify CLIENT_URL in `.env` matches frontend URL
- Check CORS middleware is registered before routes
- Ensure credentials are included in frontend requests

---

## 📞 Support

**Developer:** Ojas Shrivastava
- **Email:** ojasshrivastava1008@gmail.com
- **GitHub:** [@Ojas-1008](https://github.com/Ojas-1008)
- **Repository:** [health-metrics-monitoring-system](https://github.com/Ojas-1008/health-metrics-monitoring-system)

**Issues:**
- Report bugs via GitHub Issues
- Include error messages and stack traces
- Provide steps to reproduce
- Specify environment (OS, Node version, etc.)

**Questions:**
- Check documentation first
- Search closed GitHub Issues
- Open new issue if not found
- Email for urgent matters

---

## 📄 License

MIT License - see [LICENSE](../LICENSE) file for details.

---

## 🎉 Acknowledgments

**Technologies:**
- Node.js and Express.js teams
- MongoDB and Mongoose teams
- jsonwebtoken and bcrypt maintainers
- express-validator team
- Jest and Supertest teams

**Inspiration:**
- Google Fit API
- Modern health tracking applications
- RESTful API best practices

---

**Last Updated:** November 5, 2025

**Development Phase:** ✅ Core Backend Complete | ✅ Google Fit Integration Complete | ⏳ Testing & Analytics In Progress

**Status:** 🟢 Production Ready (Core Features) | 🟡 Active Development (Advanced Features)

---

## 🚧 Development Status

### ✅ Completed Features (Production Ready)

**Core Infrastructure (100%)**
- ✅ ES Modules configuration (`"type": "module"` in package.json)
- ✅ Express server setup with CORS
- ✅ MongoDB Atlas integration with Mongoose 8.3.0
- ✅ Environment variable management with dotenv
- ✅ Graceful server shutdown (SIGTERM handler)
- ✅ Health check endpoint (`GET /api/health`)

**Database Layer (100%)**
- ✅ MongoDB connection with comprehensive event listeners
- ✅ Emoji logging for connection status (✅ ❌ 🟢 🚀)
- ✅ User model with validation and bcrypt pre-save hooks
- ✅ HealthMetric model with userId index and date normalization
- ✅ Partial unique index for User.googleId (prevents duplicate nulls)
- ✅ Compound unique index for HealthMetric (userId + date)
- ✅ Schema validation with custom error messages

**Authentication System (100%)**
- ✅ User registration with comprehensive validation
- ✅ Login with JWT token generation (7-day expiration)
- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ Protected routes with JWT middleware (`protect`)
- ✅ Get current user profile
- ✅ Update user profile (name, picture, goals)
- ✅ Logout functionality
- ✅ Password excluded from all responses (`select: false`)
- ✅ Token verification with error handling (expired/invalid)

**Input Validation (100%)**
- ✅ Express-validator integration
- ✅ Registration validation (name, email, password, confirmPassword)
- ✅ Login validation (email, password)
- ✅ Profile update validation (name, picture, goals)
- ✅ Health metrics validation (date, metrics, source)
- ✅ Goals validation (all 5 goal types with ranges)
- ✅ Formatted error responses with field-specific messages
- ✅ XSS protection via input sanitization

**Error Handling (100%)**
- ✅ Custom `ErrorResponse` class for structured errors
- ✅ `asyncHandler` wrapper to eliminate try/catch boilerplate
- ✅ Centralized `errorHandler` middleware
- ✅ `notFound` middleware for undefined routes (404)
- ✅ Specific handling for MongoDB errors (CastError, ValidationError, E11000)
- ✅ JWT error handling (expired, malformed)
- ✅ Multer file upload error handling
- ✅ JSON syntax error handling
- ✅ Development vs Production error responses (stack traces)

**Health Metrics API (100%)**
- ✅ Add/update daily metrics (upsert by userId + date)
- ✅ Get metrics by date range (with query parameters)
- ✅ Get metrics for specific date
- ✅ Delete metrics by date
- ✅ Get latest metrics entry
- ✅ Calculate summaries (week, month, year)
- ✅ Aggregation with averages, totals, min, max
- ✅ Days with data vs. total days tracking
- ✅ Source tracking (manual vs. googlefit)
- ✅ Optional activities array

**Fitness Goals API (100%)**
- ✅ Set/update user goals (stored in User.goals)
- ✅ Get current user goals
- ✅ Partial goal updates (modify only specified fields)
- ✅ Reset goals to default values
- ✅ Get goal progress (compare with today's metrics)
- ✅ Progress calculation with percentages
- ✅ Achievement status tracking
- ✅ Overall progress percentage
- ✅ Validation for all goal types with ranges

**Google Fit Integration (100%)**
- ✅ OAuth 2.0 authentication flow with Google
- ✅ Google Fit API data source mapping and fetching
- ✅ Automatic sync worker (cron-based scheduling)
- ✅ Manual sync trigger endpoint
- ✅ Connection status checking
- ✅ Disconnect Google Fit functionality
- ✅ Data transformation and storage
- ✅ Error handling for API failures and rate limits
- ✅ OAuth state management for security
- ✅ Comprehensive testing for all Google Fit features

**Testing Infrastructure (90%)**
- ✅ Jest configuration (ESM support)
- ✅ Supertest integration
- ✅ Manual testing workflows documented
- ✅ Thunder Client collections created
- ✅ Database verification script (`verify-metrics.js`)
- ✅ Comprehensive unit tests implemented (4 test files)
- ⏳ Additional integration tests (in progress)

**Documentation (100%)**
- ✅ Comprehensive README with all endpoints
- ✅ API documentation with request/response examples
- ✅ Authentication flow documentation
- ✅ Code quality standards documented
- ✅ Development workflow guide
- ✅ Environment setup instructions
- ✅ Debugging tips and common issues
- ✅ Testing workflows and test data

**Scripts (100%)**
- ✅ Development server with nodemon
- ✅ Production server script
- ✅ GoogleId index fix script
- ✅ Metrics verification script
- ✅ Jest test scripts (comprehensive tests implemented)

---

### ⏳ In Progress

**Testing (30%)**
- ⏳ Unit tests for controllers
- ⏳ Middleware tests
- ⏳ Model validation tests
- ⏳ Integration tests for complete flows

**Security Enhancements (20%)**
- ⏳ Helmet middleware for HTTP headers
- ⏳ Rate limiting (express-rate-limit)
- ⏳ Request logging (Morgan)
- ⏳ API key authentication for external services

---

### 📋 Planned Features

**Google Fit Integration**
- ✅ OAuth 2.0 authentication flow
- ✅ Fetch activity data from Google Fit API
- ✅ Sync metrics automatically (cron-based worker)
- ✅ Google Fit service layer (controllers, helpers, workers)
- ⏳ Webhook for real-time updates (planned)

**Alert System**
- ⏳ Alert model implementation
- ⏳ Goal achievement notifications
- ⏳ Inactive user reminders
- ⏳ Health anomaly detection
- ⏳ Email notifications (Nodemailer)
- ⏳ In-app notifications

**Analytics & Insights**
- ⏳ Analytics model implementation
- ⏳ Trend analysis (weekly, monthly, yearly)
- ⏳ Health score calculation
- ⏳ Personalized recommendations
- ⏳ Data visualization endpoints
- ⏳ Achievement badges

**Apache Spark Integration**
- ⏳ Spark data processing pipeline
- ⏳ Large-scale analytics
- ⏳ Predictive modeling
- ⏳ Machine learning insights
- ⏳ Data export for Spark

**Advanced Features**
- ⏳ Refresh tokens for JWT
- ⏳ Password reset via email
- ⏳ Social login (Google, Facebook)
- ⏳ Multi-factor authentication
- ⏳ Data export (CSV, JSON)
- ⏳ Import from other fitness apps
- ⏳ Webhook support for integrations
- ⏳ GraphQL API

**DevOps & Deployment**
- ⏳ Docker containerization
- ⏳ CI/CD pipeline (GitHub Actions)
- ⏳ Production deployment (AWS/Railway/Render)
- ⏳ Environment-specific configs
- ⏳ Database migrations
- ⏳ Monitoring and logging (Sentry)
- ⏳ API documentation (Swagger/OpenAPI)

**Performance Optimizations**
- ⏳ Database query optimization
- ⏳ Redis caching layer
- ⏳ Pagination for large datasets
- ⏳ Data aggregation pipelines
- ⏳ Background jobs (Bull queue)

---

### 📊 Project Metrics

**Code Statistics:**
- Total Files: 20+
- Lines of Code: 3000+ (including comments)
- Controllers: 3 (15+ endpoints)
- Models: 4 (2 active, 2 planned)
- Middleware: 3 files (auth, validation, error handling)
- Routes: 3 files (16 total endpoints)
- Scripts: 2 (maintenance utilities)

**API Endpoints:**
- Authentication: 5 endpoints
- Health Metrics: 6 endpoints
- Goals: 5 endpoints
- Utility: 1 endpoint (health check)
- **Total:** 17 endpoints

**Test Coverage (Target):**
- Controllers: 80%+
- Middleware: 90%+
- Models: 85%+
- Overall: 80%+

---

### 🎯 Next Milestones

**Milestone 1: Complete Testing (Current Focus)**
- [ ] Write unit tests for all controllers
- [ ] Test all middleware functions
- [ ] Model validation testing
- [ ] Integration tests for complete flows
- [ ] Achieve 80%+ test coverage

**Milestone 2: Google Fit Integration ✅ COMPLETED**
- [x] Set up Google OAuth 2.0
- [x] Implement Google Fit service (controllers, helpers, workers)
- [x] Create sync endpoints
- [x] Test with real Google Fit data
- [x] Handle rate limiting and error cases

**Milestone 3: Alert System**

**Milestone 3: Alert System**
- [ ] Implement Alert model
- [ ] Create alert triggers
- [ ] Email notification service
- [ ] In-app notification endpoints
- [ ] User preferences for alerts

**Milestone 4: Production Deployment**
- [ ] Docker containerization
- [ ] CI/CD pipeline setup
- [ ] Deploy to cloud platform
- [ ] SSL/HTTPS configuration
- [ ] Production monitoring

---

### 🔄 Recent Updates

**November 4, 2025:**
- ✅ Updated README with comprehensive documentation
- ✅ Added detailed API examples for all endpoints
- ✅ Documented all validation rules
- ✅ Enhanced development workflow section
- ✅ Added testing workflows and examples
- ✅ Documented all scripts in detail

**November 3, 2025:**
- ✅ Implemented complete goals management system
- ✅ Added goal progress tracking endpoint
- ✅ Created comprehensive validation for goals
- ✅ Updated Thunder Client collection

**Previous Updates:**
- ✅ Implemented health metrics API (6 endpoints)
- ✅ Added metrics summary calculations
- ✅ Created authentication system (5 endpoints)
- ✅ Centralized error handling
- ✅ Express-validator integration
- ✅ MongoDB Atlas connection with logging
- ✅ Added Thunder Client collection for API testing