# Health Metrics Monitoring System - AI Development Guide

## Project Overview
Full-stack health tracking app with React 19 frontend, Express/MongoDB backend, and planned Apache Spark analytics. Built as a monorepo with separate client/server packages.

**Development Status:** Backend authentication layer complete ✅ | Frontend setup complete, components pending ⏳

## Architecture & Structure

### Monorepo Layout
- `client/` - React 19 + Vite 7 + Tailwind CSS 4 frontend (setup complete, UI pending)
- `server/` - Express 4 + MongoDB backend with JWT auth (authentication complete ✅)
- `spark-analytics/` - Planned Apache Spark data processing (not yet implemented)

**Critical**: This is ES Modules only (`"type": "module"` in all package.json). Use `import/export`, not `require()`.

### Backend Patterns

**MVC Structure**: Follow strict separation
- `models/` - Mongoose schemas (User ✅, HealthMetric ✅, Alert ✅, Analytics ✅)
- `middleware/auth.js` - JWT verification with `protect` middleware ✅
- `middleware/validator.js` - Express-validator chains for input validation ✅
- `middleware/errorHandler.js` - Centralized error handling with ErrorResponse class ✅
- `controllers/authController.js` - Auth request handlers (registerUser, loginUser, getCurrentUser, updateProfile, logoutUser) ✅
- `services/` - Business logic (planned, not yet implemented)
- `routes/authRoutes.js` - Authentication API endpoints ✅

**Authentication Flow** (Implemented ✅):
```javascript
// All protected routes use: protect middleware from middleware/auth.js
// Extracts JWT from "Authorization: Bearer <token>" header
// Verifies token with JWT_SECRET, handles TokenExpiredError/JsonWebTokenError
// Attaches req.user (full User document without password) to request
// Usage: router.get('/me', protect, getCurrentUser)
```

**Validation Pattern** (Implemented ✅):
```javascript
// All routes use express-validator chains from middleware/validator.js
// Validation chains: validateRegister, validateLogin, validateProfileUpdate, validatePasswordChange
// handleValidationErrors middleware extracts and formats errors
// Usage: router.post('/register', validateRegister, handleValidationErrors, registerUser)
```

**Error Handling Pattern** (Implemented ✅):
```javascript
// All controllers wrapped in asyncHandler from middleware/errorHandler.js
// ErrorResponse class for throwing structured errors: throw new ErrorResponse('msg', statusCode)
// Centralized errorHandler catches all errors (Mongoose, JWT, validation, custom)
// notFound middleware catches undefined routes (404)
// Registered in server.js AFTER all routes
```

**Data Models Pattern** (Implemented ✅):
- All models use detailed validation with custom error messages
- `User.password` has `select: false` - explicitly include when needed (done in loginUser controller)
- `User.googleId` uses partial unique index: `{ googleId: 1 }, { unique: true, partialFilterExpression: { googleId: { $type: "string" } } }`
- `User.comparePassword()` instance method for bcrypt password verification
- `HealthMetric.userId` indexed for performance, references User model
- Pre-save hooks for password hashing (bcrypt.genSalt(10)), timestamps for audit trail
- Enums for controlled values (e.g., `source: ["googlefit", "manual"]`)
- **Important**: No default values for optional unique fields (googleId has no default)

**Database Connection** (Implemented ✅): 
- `config/database.js` exports async `connectDB()` function with comprehensive event listeners
- MongoDB Atlas connection with emoji logging: ✅ success, ❌ errors, 🟢 events, 🚀 startup
- Called before starting Express server (see `server.js` line 22)
- Connection string: `process.env.MONGODB_URI`
- Graceful shutdown with SIGTERM handler in server.js

### Frontend Patterns

**Current State**: Setup complete ✅ - Vite + React 19 running, Tailwind CSS configured, folder structure prepared. Only `App.jsx` and `main.jsx` implemented. Component development pending.

**Styling Conventions**:
- Tailwind CSS v4 (requires `@tailwindcss/postcss` plugin)
- Custom utility classes defined: `.btn-primary`, `.btn-secondary`, `.input-field`, `.card`
- Primary color palette: `primary-50` through `primary-900` (blue)
- Use utility classes first, custom CSS only when necessary

**State Management**: Zustand (planned)
```javascript
// Store pattern (from ARCHITECTURE.md):
// stores/authStore.js - user, token, login(), logout()
// stores/metricsStore.js - health data and operations
```

**API Layer**: Services directory will contain Axios-based API clients
- Expected pattern: `services/authService.js`, `services/metricsService.js`
- Vite dev server proxies `/api` to `http://localhost:5000`

## Development Workflow

### Running the Stack
```bash
# Backend (from server/)
npm run dev        # nodemon watches src/server.js on port 5000

# Frontend (from client/)  
npm run dev        # Vite dev server on port 5173 with HMR
```

**No root-level scripts** - must run from client/ or server/ subdirectories.

**API Endpoints (Implemented ✅)**:
```
GET  /api/health                 # Server health check
POST /api/auth/register          # Register new user
POST /api/auth/login             # Login user
GET  /api/auth/me                # Get current user (protected)
PUT  /api/auth/profile           # Update user profile (protected)
POST /api/auth/logout            # Logout user (protected)
```

**Testing**:
- Thunder Client used for API testing (register/login tested successfully ✅)
- JWT tokens expire in 7 days (JWT_EXPIRE=7d)
- Test user created: testuser@example.com

### Environment Setup
Backend requires `.env` with: `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRE`, `PORT`, `NODE_ENV`, `CLIENT_URL`, Google OAuth credentials.

### Database
- MongoDB connection: Always use `MONGODB_URI` from env (supports local or Atlas)
- Models auto-create indexes - startup logs show index creation
- Emoji logging convention: ✅ success, ❌ errors, 🟢 events, 🚀 startup

## Code Quality Standards

### Documentation Requirements
- Every file should have inline comments explaining complex logic
- Models include detailed validation rules with custom messages
- Use JSDoc for public functions when implementing services/controllers

### Error Handling (Implemented ✅)
- All controllers wrapped in `asyncHandler(fn)` - eliminates try/catch boilerplate
- `ErrorResponse` class for custom errors: `throw new ErrorResponse(message, statusCode)`
- Centralized `errorHandler` middleware handles:
  - Mongoose CastError (invalid ObjectId) → 400
  - MongoDB duplicate key error (code 11000) → 400
  - Mongoose ValidationError → 400
  - JWT errors: `JsonWebTokenError` → 401, `TokenExpiredError` → 401
  - Multer file upload errors → 400
  - JSON SyntaxError → 400
  - Custom ErrorResponse errors → specified status code
  - Generic errors → 500
- `notFound` middleware catches undefined routes → 404
- Response format: `{ success: false, message: string, stack?: string }`
- Stack traces only shown in development mode

### Naming Conventions
- Models: PascalCase (`User`, `HealthMetric`)
- Middleware/services: camelCase (`authenticate`, `connectDB`)
- Files: Match export name (`User.js` exports `User` model)
- Routes: kebab-case in URLs (`/api/health-metrics`)

## Key Integration Points

### Google Fit API
- `googleapis` v134 installed on backend
- Schema fields: `User.googleId`, `User.googleFitConnected`, `HealthMetric.source`
- Service stub: `services/googleFitService.js` (planned)

### Health Metrics Data Structure
```javascript
// HealthMetric.metrics nested object includes:
steps, distance, calories, activeMinutes (sensor data)
weight, sleepHours (manual entry)
// NOTE: NO heart rate or SpO2 (requires wearables)
```

### React Components (Planned Structure)
- `components/auth/` - LoginForm, RegisterForm
- `components/common/` - Button, Input, Card (reusable UI)
- `components/metrics/` - MetricCard, MetricForm
- `components/charts/` - Recharts wrappers
- `pages/auth/` - Full Login/Register pages
- `pages/dashboard/` - Main dashboard views

## Project-Specific Gotchas

1. **Tailwind v4**: Must use `@tailwindcss/postcss` plugin (not the old config method) ✅
2. **React 19**: Latest APIs - use if beneficial, but avoid breaking changes
3. **Mongoose**: Always handle connection errors gracefully with process.exit(1) ✅
4. **JWT**: No refresh tokens currently - single token with 7d expiry ✅
5. **No TypeScript**: Pure JavaScript project
6. **Windows Dev**: Author uses Windows/PowerShell - test cross-platform
7. **Partial Unique Index**: `User.googleId` uses partial unique index - only enforces uniqueness when value is a string (not null/undefined). Never use `default: null` with unique indexes.
8. **Express-Validator**: Validation chains must be followed by `handleValidationErrors` middleware ✅
9. **AsyncHandler**: All controller functions must be wrapped in `asyncHandler()` for proper error handling ✅
10. **Password Hashing**: Handled automatically by User model pre-save hook (bcrypt.genSalt(10)) - never manually hash ✅
11. **Error Handler Registration**: Must register `notFound` and `errorHandler` middlewares AFTER all routes in server.js ✅
12. **Token Generation**: Use `generateToken(userId)` utility in authController for consistency ✅

## Implementation Status

### Backend (Server) ✅ Complete
- [x] MongoDB connection with Atlas
- [x] User model with bcrypt password hashing
- [x] JWT authentication middleware (`protect`)
- [x] Express-validator validation chains
- [x] Centralized error handling (ErrorResponse, asyncHandler)
- [x] Auth controller (register, login, getCurrentUser, updateProfile, logout)
- [x] Auth routes with validation middleware chains
- [x] Server.js with CORS, error handlers, health check
- [x] Partial unique index for User.googleId (no duplicate null values)
- [x] Thunder Client testing (register ✅, login ✅)

### Frontend (Client) ⏳ In Progress
- [x] Vite + React 19 setup
- [x] Tailwind CSS 4 configuration with custom theme
- [x] API proxy configuration (port 5173 → 5000)
- [x] Custom utility classes (.btn-primary, .input-field, .card)
- [x] Folder structure prepared
- [ ] Auth UI components (Login, Register forms)
- [ ] Zustand stores (auth, metrics)
- [ ] React Router setup with protected routes
- [ ] Dashboard layout
- [ ] Health metrics UI components
- [ ] Recharts integration

### Pending Backend Features
- [ ] Health metrics controller and routes
- [ ] Google Fit integration service
- [ ] Analytics endpoints
- [ ] Alert system implementation
- [ ] Services layer (business logic)

## Documentation References
- `README.md` - Setup and feature overview
- `ARCHITECTURE.md` - Deep technical details and design decisions  
- `TECH_STACK.md` - Complete technology reference with examples
- `DOCUMENTATION_INDEX.md` - Guide to all docs
- `server/README.md` - Complete backend API documentation with examples ✅
- `client/src/README.md` - Complete frontend documentation with patterns ✅
- `docs/AUTH_API_REFERENCE.md` - Authentication API reference
- `docs/AUTH_ROUTES_VERIFICATION.md` - Auth routes testing guide

## Recent Changes (October 24, 2025)
- ✅ Implemented complete authentication layer (middleware, controllers, routes)
- ✅ Fixed MongoDB googleId partial unique index issue
- ✅ Added express-validator chains for all auth endpoints
- ✅ Created centralized error handling with ErrorResponse and asyncHandler
- ✅ Tested registration and login endpoints successfully
- ✅ Updated server and client README files with comprehensive documentation
- 🚀 Ready for frontend component development

When implementing new features, maintain consistency with these established patterns and update documentation accordingly.
