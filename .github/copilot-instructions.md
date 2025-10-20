# Health Metrics Monitoring System - AI Development Guide

## Project Overview
Full-stack health tracking app with React 19 frontend, Express/MongoDB backend, and planned Apache Spark analytics. Built as a monorepo with separate client/server packages.

## Architecture & Structure

### Monorepo Layout
- `client/` - React 19 + Vite 7 + Tailwind CSS 4 frontend
- `server/` - Express 4 + MongoDB backend with JWT auth
- `spark-analytics/` - Planned Apache Spark data processing (not yet implemented)

**Critical**: This is ES Modules only (`"type": "module"` in all package.json). Use `import/export`, not `require()`.

### Backend Patterns

**MVC Structure**: Follow strict separation
- `models/` - Mongoose schemas (User, HealthMetric, Alert, Analytics)
- `middleware/auth.js` - JWT verification with `authenticate` middleware
- `controllers/` - Request handlers (thin layer, delegate to services)
- `services/` - Business logic (auth, metrics, googleFit integration)
- `routes/` - API endpoints (not yet implemented)

**Authentication Flow**:
```javascript
// All protected routes use: authenticate middleware from middleware/auth.js
// Extracts JWT from "Authorization: Bearer <token>" header
// Attaches req.userId and req.user (without password) to request
```

**Data Models Pattern**:
- All models use detailed validation with custom error messages
- `User.password` has `select: false` - explicitly include when needed
- `HealthMetric.userId` indexed for performance, references User model
- Pre-save hooks for password hashing, timestamps for audit trail
- Enums for controlled values (e.g., `source: ["googlefit", "manual"]`)

**Database Connection**: `config/database.js` exports async `connectDB()` function with comprehensive event listeners. Always call before starting Express server (see `server.js` line 40+).

### Frontend Patterns

**Current State**: Minimal implementation - only `App.jsx` and `main.jsx` exist. Directory structure is placeholder.

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
npm run dev        # nodemon watches src/server.js

# Frontend (from client/)  
npm run dev        # Vite dev server on port 5173
```

**No root-level scripts** - must run from client/ or server/ subdirectories.

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

### Error Handling
- Models throw validation errors automatically
- Middleware catches errors and responds with `{ success: false, message: string }`
- JWT errors: `JsonWebTokenError` → 401, `TokenExpiredError` → 401

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

1. **Tailwind v4**: Must use `@tailwindcss/postcss` plugin (not the old config method)
2. **React 19**: Latest APIs - use if beneficial, but avoid breaking changes
3. **Mongoose**: Always handle connection errors gracefully with process.exit(1)
4. **JWT**: No refresh tokens currently - single token with 7d expiry
5. **No TypeScript**: Pure JavaScript project
6. **Windows Dev**: Author uses Windows/PowerShell - test cross-platform

## Documentation References
- `README.md` - Setup and feature overview
- `ARCHITECTURE.md` - Deep technical details and design decisions  
- `TECH_STACK.md` - Complete technology reference with examples
- `DOCUMENTATION_INDEX.md` - Guide to all docs

When implementing new features, maintain consistency with these established patterns and update documentation accordingly.
