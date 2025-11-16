# Health Metrics Monitoring System - AI Development Guide

## Project Overview
Full-stack health tracking application with real-time data synchronization, built using React 19 frontend, Express 4/MongoDB backend with comprehensive JWT authentication, Google Fit OAuth2 integration, Server-Sent Events (SSE) for real-time updates, and automated background synchronization workers. Built as a monorepo with separate client/server packages.

**Development Status:** 
- **Backend**: 100% Complete ✅ - All features production-ready with comprehensive real-time capabilities
- **Frontend**: 100% Complete ✅ - Full dashboard with SSE integration, authentication, and real-time updates
- **Analytics**: Planned (Apache Spark integration) ⏳

## Architecture & Structure

### Monorepo Layout
- **`client/`** - React 19.2.0 + Vite 7.1.7 + Tailwind CSS 4.1.14 frontend (✅ 100% Complete - 8000+ lines)
  - Full authentication UI with SSE integration
  - Complete dashboard with real-time updates
  - Comprehensive component library (15+ components)
  - Advanced state management with AuthContext
  - Real-time event system with deduplication
  
- **`server/`** - Express 4.19.2 + MongoDB (Mongoose 8.19.1) backend (✅ 100% Complete - 15000+ lines)
  - JWT authentication with protect middleware
  - Health metrics CRUD with phone-only enforcement
  - Google Fit OAuth2 integration with automatic sync
  - Goals management with progress tracking
  - Server-Sent Events (SSE) for real-time updates
  - MongoDB change streams for reactive updates
  - Background workers (sync + change stream monitoring)
  - Comprehensive error handling and validation
  
- **`spark-analytics/`** - Apache Spark data processing (⏳ Planned - not yet implemented)

**Critical**: This is ES Modules only (`"type": "module"` in all package.json). Use `import/export`, not `require()`.

### Backend Patterns

**MVC Structure**: Strict separation with complete implementation ✅
- **`models/`** - Mongoose schemas with comprehensive validation
  - `User.js` (551 lines) - User model with goals, Google Fit tokens, OAuth state, indexes
  - `HealthMetric.js` (361 lines) - Health metrics with phone-only validation, pre-save hooks
  - `Alert.js` (434 lines) - Alert system with priority levels, read status
  - `Analytics.js` (311 lines) - Analytics data with aggregation methods
  
- **`controllers/`** - Request handlers with comprehensive business logic ✅
  - `authController.js` (451 lines) - registerUser, loginUser, getCurrentUser, updateProfile, logoutUser
  - `healthMetricsController.js` (731 lines) - CRUD operations with SSE integration, phone-only enforcement
  - `googleFitController.js` (535 lines) - OAuth flow, connection status, sync trigger, disconnect
  - `goalsController.js` (317 lines) - Goals CRUD with progress calculation
  
- **`middleware/`** - Request processing and validation ✅
  - `auth.js` (191 lines) - JWT verification with `protect` middleware
  - `validator.js` (419 lines) - Express-validator chains for all routes
  - `errorHandler.js` (302 lines) - Centralized error handling with ErrorResponse class
  
- **`services/`** - Business logic layer ✅
  - `sseService.js` (41 lines) - SSE event emission service
  
- **`routes/`** - API endpoint definitions ✅
  - `authRoutes.js` - Authentication endpoints (register, login, profile, logout)
  - `healthMetricsRoutes.js` - Metrics CRUD endpoints with validation
  - `googleFitRoutes.js` - Google Fit OAuth and sync endpoints
  - `goalsRoutes.js` - Goals management endpoints
  - `eventsRoutes.js` (291 lines) - SSE stream endpoints with connection management
  
- **`workers/`** - Background processing ✅
  - `googleFitSyncWorker.js` (1088 lines) - Automated sync with cron scheduling (every 15 minutes)
  - `changeStreamWorker.js` - MongoDB change streams for real-time database monitoring
  
- **`utils/`** - Utility functions and helpers ✅
  - `eventEmitter.js` (423 lines) - SSE connection management and event distribution
  - `eventPayloadOptimizer.js` (274 lines) - Payload optimization and aggregation
  - `googleFitHelper.js` (357 lines) - Google Fit token refresh and validation
  - `oauthState.js` (156 lines) - OAuth state token management
  - `generateToken.js` - JWT token generation utility
  
- **`config/`** - Configuration modules ✅
  - `database.js` - MongoDB connection with event listeners
  - `oauth.config.js` (167 lines) - Google OAuth configuration with scopes
  - `index.js` - Centralized app configuration

**Real-Time Architecture** (Fully Implemented ✅):
```javascript
// SSE Event Flow:
// 1. Client establishes SSE connection → GET /api/events/stream
// 2. Server adds connection to eventEmitter connection pool
// 3. Controllers emit events → emitToUser(userId, eventType, data)
// 4. eventEmitter distributes to all user connections
// 5. Client receives real-time updates via EventSource
// 6. Event deduplication via LRU cache on client-side

// Example: Health metrics update flow
// healthMetricsController → emitToUser(userId, 'metrics:updated', payload)
// → eventEmitter sends to all user SSE connections
// → Client Dashboard auto-updates without refresh

// Change Stream Integration:
// changeStreamWorker monitors MongoDB collections
// Detects external changes (Google Fit sync, manual updates)
// Emits real-time events to affected users
```

**Phone-Only Constraint Enforcement** (Multi-Layer ✅):
```javascript
// Layer 1: Mongoose Schema Validation (HealthMetric.js)
// Pre-save hook validates wearable-only metrics
// Throws validation error if heart rate/SpO2 detected

// Layer 2: Controller Validation (healthMetricsController.js)
// validateAndSanitizeMetrics() sanitizes input
// Strips wearable-only fields before saving

// Layer 3: Google Fit Data Processing
// googleFitSyncWorker filters wearable data sources
// Only syncs phone-compatible data types
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

**Current State**: Production-ready ✅ - Complete dashboard with 8000+ lines, real-time updates, authentication, and comprehensive component library.

**Architecture**:
- **React 19.2.0** with concurrent features and modern hooks
- **Vite 7.1.7** for lightning-fast development and optimized builds
- **Tailwind CSS 4.1.14** with @tailwindcss/postcss plugin
- **React Router 7.9.4** with data routers and protected routes
- **Axios 1.12.2** with request/response interceptors
- **Server-Sent Events** for real-time updates

**State Management**: 
- **AuthContext** (800 lines) - Global auth state with SSE integration
- **Context API** for authentication and real-time event distribution
- **Zustand 5.0.8** installed for future complex state (not yet implemented)
- **localStorage** for JWT token persistence

**Component Structure** (15+ components, 4000+ lines):
```
components/
├── common/           # Core UI components (1200+ lines)
│   ├── Alert.jsx     # Notification system (156 lines)
│   ├── Button.jsx    # Multi-variant buttons (283 lines)
│   ├── Card.jsx      # Container component (89 lines)
│   ├── ConnectionStatusBanner.jsx # SSE status (124 lines)
│   ├── Input.jsx     # Form inputs with validation (247 lines)
│   ├── PrivateRoute.jsx # Route protection (139 lines)
│   └── Toast.jsx     # Toast notifications (178 lines)
│
├── dashboard/        # Dashboard components (1900+ lines)
│   ├── GoalsForm.jsx       # Goals setting (267 lines)
│   ├── GoalsSection.jsx    # Progress tracking (345 lines)
│   ├── GoogleFitStatus.jsx # Sync controls (198 lines)
│   ├── MetricsForm.jsx     # Metrics input (412 lines)
│   ├── MetricsList.jsx     # Data display (387 lines)
│   └── SummaryStats.jsx    # Statistics (298 lines)
│
├── metrics/          # Metric components (156 lines)
│   └── MetricCard.jsx # Individual metrics (156 lines)
│
├── layout/           # Layout components (400+ lines)
│   ├── Header.jsx    # App header with navigation
│   └── Layout.jsx    # Main layout wrapper
│
├── debug/            # Debug components (312 lines)
│   └── EventDeduplicationDebug.jsx # Dev tools
│
└── test/             # Testing components (2000+ lines)
    └── 8 test components for SSE, events, real-time
```

**Services Layer** (3000+ lines):
```javascript
// services/authService.js (696 lines)
// - register(), login(), getCurrentUser(), updateProfile(), logout()
// - Client-side validation matching backend
// - Token management and storage

// services/metricsService.js (643 lines)
// - CRUD operations for health metrics
// - Date range queries and summaries
// - Validation and error handling

// services/goalsService.js (562 lines)
// - Goals management with progress calculation
// - 5 goal types with validation ranges
// - Default values and reset functionality

// services/googleFitService.js (450 lines)
// - OAuth flow initiation
// - Connection status and sync triggers
// - Token validation

// services/eventService.js (863 lines)
// - SSE connection management with state machine
// - Event subscription and callback management
// - Automatic reconnection with exponential backoff
// - Event deduplication with LRU cache
```

**Real-Time Features** (Fully Implemented ✅):
```javascript
// Event Service Architecture:
// - State machine: connecting → connected → disconnected → reconnecting
// - JWT authentication for SSE streams
// - Event deduplication using LRU cache (245 lines)
// - Connection status monitoring
// - Graceful disconnect and cleanup

// useRealtimeEvents Hook (178 lines):
// - Custom React hook for event subscriptions
// - Automatic cleanup on unmount
// - Event filtering and processing
// - Multiple hook variants for different use cases

// Dashboard Integration (2042 lines):
// - Real-time metrics updates
// - Optimistic UI updates
// - Live connection status indicators
// - Automatic data refresh on external changes
```

**Styling Conventions**:
- Tailwind CSS v4 with @tailwindcss/postcss plugin (required)
- Custom primary color palette: `primary-50` through `primary-900` (blue)
- Custom utility classes: `.btn-primary`, `.btn-secondary`, `.input-field`, `.card`
- Mobile-first responsive design with breakpoint system
- Custom animations: shimmer, slideInDown

**API Integration**:
- Vite dev server proxies `/api` to `http://localhost:5000`
- Axios instance with base URL and timeout configuration
- Request interceptor: Automatic JWT token attachment
- Response interceptor: Centralized error handling (401 → login redirect)
- Environment variable support (VITE_API_URL, VITE_API_TIMEOUT, VITE_TOKEN_KEY)

## Development Workflow

### Running the Stack
```bash
# Backend (from server/)
npm run dev        # nodemon watches src/server.js on port 5000

# Frontend (from client/)  
npm run dev        # Vite dev server on port 5173 with HMR
```

**No root-level scripts** - must run from client/ or server/ subdirectories.

**API Endpoints (Fully Implemented ✅)**:
```
# Server Health
GET  /api/health                      # Server health check

# Authentication (authRoutes.js)
POST /api/auth/register               # Register new user
POST /api/auth/login                  # Login user
GET  /api/auth/me                     # Get current user (protected)
PUT  /api/auth/profile                # Update user profile (protected)
POST /api/auth/logout                 # Logout user (protected)

# Health Metrics (healthMetricsRoutes.js)
POST   /api/metrics                   # Add/update metrics (protected)
GET    /api/metrics                   # Get metrics by date range (protected)
GET    /api/metrics/:date             # Get metrics for specific date (protected)
PUT    /api/metrics/:date             # Update metrics for date (protected)
DELETE /api/metrics/:date             # Delete metrics (protected)
GET    /api/metrics/summary/:period   # Get summary (week/month/year) (protected)
GET    /api/metrics/latest            # Get latest metrics (protected)

# Goals (goalsRoutes.js)
POST   /api/goals                     # Set/update goals (protected)
GET    /api/goals                     # Get user goals (protected)
PUT    /api/goals                     # Partial goal update (protected)
DELETE /api/goals                     # Reset to defaults (protected)
GET    /api/goals/progress            # Get goal progress (protected)

# Google Fit (googleFitRoutes.js)
GET  /api/googlefit/connect           # Initiate OAuth flow (protected)
GET  /api/googlefit/callback          # OAuth callback (public)
GET  /api/googlefit/status            # Connection status (protected)
GET  /api/googlefit/sync              # Manual sync trigger (protected)
POST /api/googlefit/disconnect        # Disconnect account (protected)

# Server-Sent Events (eventsRoutes.js)
GET  /api/events/stream               # SSE stream (protected, persistent connection)
GET  /api/events/debug/connections    # Connection stats (protected)
GET  /api/events/debug/test           # Test event emission (protected)
```

**SSE Event Types**:
```javascript
// Real-time events emitted to clients:
'sync:start'      - Google Fit sync initiated
'sync:progress'   - Sync progress updates
'sync:complete'   - Sync completed successfully
'sync:error'      - Sync failed with error details
'metrics:updated' - Health metrics modified
'goals:updated'   - User goals changed
'user:updated'    - User profile updated
'heartbeat'       - Connection keep-alive (every 30 seconds)
```

**Testing**:
- Thunder Client used for API testing with comprehensive request collection
- All authentication endpoints tested successfully ✅
- All health metrics endpoints tested successfully ✅
- Google Fit OAuth flow tested successfully ✅
- SSE connection and event emission tested successfully ✅
- JWT tokens expire in 7 days (JWT_EXPIRE=7d)
- Test users created and validated in MongoDB Atlas

### Environment Setup
**Backend (.env in server/)**: 
```bash
# Database
MONGODB_URI=your_mongodb_connection_string

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Google OAuth2 Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/googlefit/callback

# Google Fit API Configuration
GOOGLE_FITNESS_SCOPES=https://www.googleapis.com/auth/fitness.activity.read,https://www.googleapis.com/auth/fitness.body.read,https://www.googleapis.com/auth/fitness.sleep.read

# Sync Worker Configuration
SYNC_CRON_SCHEDULE=*/15 * * * *  # Every 15 minutes
SYNC_LOOKBACK_DAYS=7
```

**Frontend (.env in client/)**:
```bash
# API Configuration
VITE_API_URL=http://localhost:5000
VITE_API_TIMEOUT=10000

# Storage Keys
VITE_TOKEN_KEY=health_metrics_token

# SSE Configuration
VITE_SSE_RECONNECT_DELAY=1000
VITE_SSE_MAX_RECONNECT_ATTEMPTS=5
```

### Database
- MongoDB connection: Always use `MONGODB_URI` from env (supports local or Atlas)
- Models auto-create indexes - startup logs show index creation ✅
- Emoji logging convention: ✅ success, ❌ errors, 🟢 events, 🚀 startup
- Collections: `users`, `healthmetrics`, `alerts`, `analytics`
- Indexes created on startup:
  - `User`: unique email, partial unique googleId, indexed googleFitConnected
  - `HealthMetric`: indexed userId (for queries), indexed date (for sorting)
  - `Alert`: indexed userId, indexed read status, compound index on priority + createdAt
  - `Analytics`: indexed userId + period combination
- Change streams active on `users`, `healthmetrics`, `goals` collections for real-time monitoring

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

### Backend (Server) ✅ 100% Complete (15000+ lines)
**Authentication System**:
- [x] MongoDB connection with Atlas and event listeners
- [x] User model with bcrypt password hashing (551 lines)
- [x] JWT authentication middleware (`protect`) (191 lines)
- [x] Express-validator validation chains (419 lines)
- [x] Centralized error handling (ErrorResponse, asyncHandler) (302 lines)
- [x] Auth controller with all endpoints (451 lines)
- [x] Auth routes with validation middleware chains
- [x] Partial unique index for User.googleId
- [x] Token generation and management utilities

**Health Metrics System**:
- [x] HealthMetric model with phone-only constraints (361 lines)
- [x] Health metrics controller with CRUD operations (731 lines)
- [x] Phone-only constraint enforcement (multi-layer validation)
- [x] Date range queries and summary endpoints
- [x] Pre-save hooks for data sanitization
- [x] SSE integration for real-time updates

**Google Fit Integration**:
- [x] OAuth2 configuration with scopes (167 lines)
- [x] Google Fit controller with complete OAuth flow (535 lines)
- [x] Token refresh and validation utilities (357 lines)
- [x] OAuth state management (156 lines)
- [x] Connection status and sync endpoints
- [x] Automated sync worker with cron scheduling (1088 lines)
- [x] Data source filtering for phone-only metrics
- [x] Error handling and retry logic

**Goals Management**:
- [x] Goals controller with progress tracking (317 lines)
- [x] Goal types: steps, calories, activeMinutes, weight, sleepHours
- [x] Default values and validation ranges
- [x] Progress calculation and reset functionality

**Real-Time Features**:
- [x] Server-Sent Events (SSE) implementation
- [x] Event emitter with connection pool management (423 lines)
- [x] Event payload optimization (274 lines)
- [x] MongoDB change streams worker
- [x] Real-time event types: sync, metrics, goals, user updates
- [x] Connection status monitoring and heartbeat
- [x] Event routing and distribution system

**Infrastructure**:
- [x] Server.js with CORS, error handlers, health check
- [x] Environment configuration with validation
- [x] Background workers (sync + change stream monitoring)
- [x] Comprehensive logging with emoji conventions
- [x] Thunder Client testing suite with all endpoints verified

### Frontend (Client) ✅ 100% Complete (8000+ lines)
**Core Setup**:
- [x] Vite 7.1.7 + React 19.2.0 configuration
- [x] Tailwind CSS 4.1.14 with custom theme
- [x] API proxy configuration (5173 → 5000)
- [x] Environment variable system
- [x] Custom utility classes and animations

**Authentication UI**:
- [x] Login page with validation (368 lines)
- [x] Register page with validation (368 lines)
- [x] AuthContext with SSE integration (800 lines)
- [x] Auth service layer (696 lines)
- [x] Token management and storage
- [x] Protected route system (139 lines)
- [x] JWT token persistence

**Dashboard System**:
- [x] Complete dashboard layout (2042 lines)
- [x] Real-time metrics updates with SSE
- [x] Summary statistics component (298 lines)
- [x] Metrics list with sorting/filtering (387 lines)
- [x] Metrics form with validation (412 lines)
- [x] Goals management UI (267 + 345 lines)
- [x] Google Fit integration UI (198 lines)
- [x] Connection status banner (124 lines)

**Real-Time Features**:
- [x] Event service with SSE (863 lines)
- [x] useRealtimeEvents hook (178 lines)
- [x] Event deduplication with LRU cache (245 lines)
- [x] State machine for connection management
- [x] Automatic reconnection with exponential backoff
- [x] Event subscription and callback system
- [x] Multiple hook variants for different use cases

**Component Library** (15+ components, 4000+ lines):
- [x] Common components: Alert, Button, Card, Input, Toast (1053 lines)
- [x] Dashboard components: Goals, Metrics, GoogleFit, Summary (1609 lines)
- [x] Layout components: Header, Layout (400+ lines)
- [x] Debug components: Event deduplication debug (312 lines)
- [x] Test components: SSE testing suite (2000+ lines)

**Services Layer** (3000+ lines):
- [x] Auth service with validation (696 lines)
- [x] Metrics service with CRUD operations (643 lines)
- [x] Goals service with progress tracking (562 lines)
- [x] Google Fit service with OAuth (450 lines)
- [x] Event service with SSE management (863 lines)

**Utilities & Hooks**:
- [x] Date utilities with formatting (717 lines)
- [x] Validation utilities (333 lines)
- [x] LRU cache for deduplication (245 lines)
- [x] Axios configuration with interceptors
- [x] Custom React hooks for real-time events

**Routing**:
- [x] React Router 7.9.4 setup with data routers
- [x] Protected route implementation
- [x] Page components: Home, Login, Register, Dashboard, NotFound
- [x] Route-based code splitting

### Integration & Testing ✅ Complete
**API Integration**:
- [x] Axios instance with base URL and timeout
- [x] Request interceptor for JWT attachment
- [x] Response interceptor for error handling
- [x] 401 redirect to login flow
- [x] Environment variable configuration

**Real-Time Communication**:
- [x] SSE connection to `/api/events/stream`
- [x] Event type handling: sync, metrics, goals, user updates
- [x] Connection status monitoring
- [x] Automatic reconnection on disconnect
- [x] Event deduplication to prevent duplicates
- [x] Heartbeat for connection keep-alive

**Testing & Validation**:
- [x] Thunder Client request collection
- [x] All endpoints tested and verified
- [x] SSE connection testing
- [x] Event emission verification
- [x] OAuth flow validation
- [x] Phone-only constraint testing

### Pending Features ⏳
**Analytics System** (Planned):
- [ ] Apache Spark integration
- [ ] Data processing pipelines
- [ ] Advanced analytics queries
- [ ] Trend analysis and predictions
- [ ] Export functionality

**Future Enhancements** (Optional):
- [ ] Push notifications
- [ ] Email alerts
- [ ] Data export (CSV, JSON)
- [ ] Advanced charting with Recharts
- [ ] Mobile app integration
- [ ] Multi-language support
- [ ] Dark mode theme

## Documentation References
- `README.md` - Setup and feature overview
- `ARCHITECTURE.md` - Deep technical details and design decisions  
- `TECH_STACK.md` - Complete technology reference with examples
- `DOCUMENTATION_INDEX.md` - Guide to all docs
- `ROADMAP.txt` - Project roadmap and future plans
- `server/README.md` - Complete backend API documentation with examples ✅
- `client/src/README.md` - Complete frontend documentation with patterns ✅
- `docs/AUTH_API_REFERENCE.md` - Authentication API reference
- `docs/AUTH_ROUTES_VERIFICATION.md` - Auth routes testing guide
- `docs/EVENTSERVICE_TESTING.md` - SSE and real-time testing documentation
- `tests/README-ThunderClient.md` - Thunder Client testing guide
- `tests/GoogleFitControllerManualTests.md` - Google Fit integration testing

## Recent Changes (January 2025)
**✅ Backend - 100% Complete (15000+ lines)**:
- Implemented complete authentication system with JWT and bcrypt
- Built comprehensive health metrics CRUD with phone-only enforcement
- Integrated Google Fit OAuth2 with automated sync worker (cron: every 15 minutes)
- Developed complete goals management with progress tracking
- Implemented Server-Sent Events for real-time updates
- Built MongoDB change streams worker for database monitoring
- Created event emitter system with connection pool management
- Added event payload optimization and aggregation
- Implemented multi-layer validation (schema, controller, worker)
- Added comprehensive error handling with ErrorResponse class
- Created all utility modules (googleFitHelper, oauthState, generateToken)
- Tested all endpoints with Thunder Client ✅

**✅ Frontend - 100% Complete (8000+ lines)**:
- Built complete authentication UI (Login, Register, Profile)
- Developed comprehensive Dashboard with real-time updates (2042 lines)
- Implemented AuthContext with SSE integration (800 lines)
- Created complete component library (15+ components, 4000+ lines)
- Built comprehensive services layer (5 services, 3000+ lines)
- Implemented event service with SSE management (863 lines)
- Created useRealtimeEvents hook with multiple variants (178 lines)
- Added event deduplication with LRU cache (245 lines)
- Implemented automatic reconnection with exponential backoff
- Built connection status monitoring and heartbeat system
- Created comprehensive utilities (date, validation, cache)
- Integrated React Router with protected routes
- Added Tailwind CSS custom theme with animations

**🔄 Integration - Fully Operational**:
- Real-time communication via SSE working end-to-end
- Google Fit OAuth flow tested and validated
- Automated background sync running every 15 minutes
- MongoDB change streams monitoring database updates
- Event distribution system routing updates to connected clients
- Phone-only constraint enforcement across all layers
- JWT authentication flow with token refresh

**⏳ Pending Features**:
- Apache Spark analytics integration
- Advanced data visualization with Recharts
- Push notification system
- Email alert system
- Data export functionality (CSV, JSON)

When implementing new features, maintain consistency with these established patterns and update documentation accordingly.

## Development Best Practices

### Code Organization
- **Separation of Concerns**: Strict MVC pattern with models, controllers, routes
- **Service Layer**: Business logic isolated in services/ directory
- **Utilities**: Reusable functions in utils/ directory
- **Middleware**: Request processing in middleware/ directory
- **Workers**: Background jobs in workers/ directory

### Error Handling
- Always wrap async controllers in `asyncHandler()`
- Use `ErrorResponse` class for throwing custom errors
- Centralized error handler catches all errors
- Proper HTTP status codes for all error types
- Stack traces only in development mode

### Validation
- Express-validator chains for all route inputs
- Mongoose schema validation for database models
- Client-side validation matching backend rules
- Custom validators for complex logic
- Detailed error messages for user feedback

### Real-Time Features
- SSE for server-to-client real-time updates
- Event deduplication to prevent duplicate processing
- Connection status monitoring with heartbeat
- Graceful reconnection with exponential backoff
- Event payload optimization for bandwidth efficiency

### Security
- JWT tokens with 7-day expiration
- Bcrypt password hashing with salt rounds (10)
- CORS configuration for client origin
- Protected routes with auth middleware
- OAuth state tokens for CSRF protection
- Input sanitization and validation

### Testing
- Thunder Client for API endpoint testing
- Manual testing for Google Fit OAuth flow
- SSE connection and event emission testing
- Phone-only constraint validation
- Real-time update verification

### Performance
- MongoDB indexes for query optimization
- Event payload aggregation for reduced bandwidth
- Connection pooling for database
- Efficient data structures (LRU cache)
- Background workers for heavy operations

### Logging
- Emoji conventions: ✅ success, ❌ errors, 🟢 events, 🚀 startup
- Structured log messages with context
- Database connection event logging
- Worker status logging
- SSE connection lifecycle logging

## Common Commands

### Development
```bash
# Start backend (from server/)
npm run dev        # nodemon on port 5000

# Start frontend (from client/)
npm run dev        # Vite on port 5173

# Build frontend
npm run build      # Production build

# Preview frontend build
npm run preview    # Preview production build
```

### Database
```bash
# Run MongoDB locally
mongod --dbpath /path/to/data

# Connect to MongoDB shell
mongosh

# Run migration scripts (from server/)
node scripts/create-sync-indexes.js
```

### Testing
```bash
# Backend tests (from server/)
npm test           # Run Jest tests

# Manual testing scripts
node scripts/testFullSync.mjs
node scripts/diagnoseSync.mjs
node scripts/checkRecentMetrics.mjs
```

### Utilities
```bash
# Generate test user (from server/)
node scripts/setupTestUser.mjs

# Check OAuth scopes
node scripts/check-oauth-scopes.mjs

# Verify metrics
node scripts/verify-metrics.js

# Display all metrics
node scripts/displayAllMetrics.mjs
```

## Troubleshooting Guide

### Common Issues

**1. MongoDB Connection Errors**:
- Verify `MONGODB_URI` in .env file
- Check network access in MongoDB Atlas
- Ensure IP address is whitelisted
- Verify database user credentials

**2. JWT Authentication Failures**:
- Check `JWT_SECRET` in .env file
- Verify token expiration (JWT_EXPIRE=7d)
- Ensure token is sent in Authorization header
- Check for expired tokens

**3. Google Fit Sync Issues**:
- Verify OAuth credentials (CLIENT_ID, CLIENT_SECRET)
- Check redirect URI matches OAuth configuration
- Ensure required scopes are enabled
- Verify token refresh logic
- Check sync worker cron schedule

**4. SSE Connection Problems**:
- Verify client is sending JWT token
- Check CORS configuration in server
- Ensure SSE endpoint is accessible
- Verify event emitter is initialized
- Check connection timeout settings

**5. Phone-Only Constraint Violations**:
- Verify HealthMetric pre-save hook
- Check controller validation logic
- Ensure Google Fit worker filters wearable data
- Validate data sources in sync process

**6. Real-Time Update Delays**:
- Check event emitter connection pool
- Verify MongoDB change streams are active
- Ensure SSE connections are established
- Check event payload optimization
- Monitor network latency

### Debug Mode

**Backend Debug**:
```bash
# Enable debug logging
NODE_ENV=development npm run dev

# Check database connection
node scripts/checkRecentMetrics.mjs

# Diagnose sync issues
node scripts/diagnoseSync.mjs

# Test OAuth scopes
node scripts/check-oauth-scopes.mjs
```

**Frontend Debug**:
```javascript
// Enable debug mode in browser console
localStorage.setItem('debug', 'true')

// Check SSE connection status
// Navigate to Dashboard → Connection Status Banner

// View event deduplication stats
// Use EventDeduplicationDebug component
```

### Performance Optimization

**Database Queries**:
- Use indexed fields for filtering
- Limit result sets with pagination
- Use projection to reduce data transfer
- Aggregate data on server side
- Cache frequently accessed data

**SSE Optimization**:
- Use event payload optimization
- Implement event deduplication
- Batch events when possible
- Monitor connection pool size
- Close inactive connections

**Frontend Performance**:
- Use React.memo for expensive components
- Implement virtual scrolling for large lists
- Lazy load components with React.lazy
- Optimize re-renders with useMemo/useCallback
- Use event deduplication to prevent redundant updates

## AI Agent Guidelines

### When Analyzing Code
1. **Check Implementation Status**: Refer to Implementation Status section for current state
2. **Review Patterns**: Follow established patterns in Backend/Frontend Patterns sections
3. **Validate Against Docs**: Cross-reference with server/README.md and client/src/README.md
4. **Check Dependencies**: Verify package.json versions match tech stack
5. **Test Changes**: Run both servers and test affected endpoints

### When Adding Features
1. **Follow MVC Pattern**: Models → Controllers → Routes → Services
2. **Add Validation**: Express-validator chains + Mongoose schema validation
3. **Error Handling**: Wrap in asyncHandler, use ErrorResponse
4. **SSE Integration**: Emit events for real-time updates if applicable
5. **Update Docs**: Update relevant README files and this guide
6. **Test Thoroughly**: Add Thunder Client tests, manual testing

### When Debugging
1. **Check Logs**: Look for emoji-coded log messages
2. **Verify Environment**: Ensure all .env variables are set
3. **Test Isolation**: Test components individually before integration
4. **Use Debug Scripts**: Leverage scripts in server/scripts/ directory
5. **Monitor SSE**: Check connection status and event flow

### When Refactoring
1. **Maintain Patterns**: Keep existing architectural patterns
2. **Update Tests**: Ensure Thunder Client tests still pass
3. **Check Dependencies**: Verify no breaking changes in imports
4. **Test Real-Time**: Ensure SSE and change streams still work
5. **Update Documentation**: Keep all docs synchronized with changes
