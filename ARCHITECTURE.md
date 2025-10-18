# System Architecture Documentation

## Overview

This document provides detailed technical information about the Health Metrics Monitoring System architecture, design patterns, and implementation details.

## Architecture Patterns

### Overall Architecture: Monorepo

The project uses a monorepo structure to manage multiple related packages:

```
Monorepo Root
├── client/       → Frontend React application
├── server/       → Backend Node.js API
├── spark-analytics/ → Analytics engine (planned)
└── docs/         → Shared documentation
```

**Benefits:**
- Single repository for version control
- Shared dependencies and tooling
- Easier code sharing between packages
- Simplified deployment coordination

### Frontend Architecture: Component-Based (React)

```
┌─────────────────────────────────────────┐
│           Browser (Client)              │
├─────────────────────────────────────────┤
│  React Router (Navigation)              │
│  ┌───────────────────────────────────┐  │
│  │  Pages (Route Components)         │  │
│  │  ├── AuthLayout                   │  │
│  │  │   └── Login / Register         │  │
│  │  └── DashboardLayout              │  │
│  │      └── Dashboard / Metrics      │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  Components (Reusable UI)         │  │
│  │  ├── Common (Button, Input)       │  │
│  │  ├── Charts (Recharts wrappers)   │  │
│  │  ├── Metrics (MetricCard)         │  │
│  │  └── Auth (LoginForm)             │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  State Management (Zustand)       │  │
│  │  ├── authStore (user, token)      │  │
│  │  ├── metricsStore (health data)   │  │
│  │  └── uiStore (modals, loading)    │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  Services (API Layer)             │  │
│  │  ├── api.js (Axios instance)      │  │
│  │  ├── authService.js               │  │
│  │  └── metricsService.js            │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
         │ HTTP/HTTPS
         ▼
  Vite Dev Proxy → Backend
```

### Backend Architecture: MVC Pattern

```
┌─────────────────────────────────────────┐
│        Express Server (Node.js)         │
├─────────────────────────────────────────┤
│  Middleware Stack                       │
│  ├── CORS                               │
│  ├── Body Parser                        │
│  ├── Request Logger                     │
│  └── Error Handler                      │
├─────────────────────────────────────────┤
│  Routes (API Endpoints)                 │
│  ├── /api/auth/*                        │
│  └── /api/metrics/*                     │
│         │                               │
│         ▼                               │
│  Controllers (Request Handlers)         │
│  ├── authController.js                  │
│  └── metricsController.js               │
│         │                               │
│         ▼                               │
│  Services (Business Logic)              │
│  ├── authService.js                     │
│  ├── metricsService.js                  │
│  └── googleFitService.js                │
│         │                               │
│         ▼                               │
│  Models (Data Layer)                    │
│  ├── User.model.js                      │
│  └── HealthMetric.model.js              │
│         │                               │
│         ▼                               │
│  MongoDB (Database)                     │
└─────────────────────────────────────────┘
```

## Technology Stack Details

### Frontend Stack

#### React 19.2.0
- **Purpose**: UI library for building interactive interfaces
- **Key Features**: 
  - React Server Components support
  - Improved hooks API
  - Concurrent rendering
  - Automatic batching

#### Vite 7.1.7
- **Purpose**: Build tool and dev server
- **Features**:
  - Lightning-fast HMR (Hot Module Replacement)
  - ESM-based dev server
  - Optimized production builds
  - Built-in TypeScript support (if needed)
  - Plugin ecosystem

**Configuration** (`vite.config.js`):
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000'  // Backend proxy
    }
  }
})
```

#### Tailwind CSS 4.1.14
- **Purpose**: Utility-first CSS framework
- **Version**: v4 (latest) with new features
- **Plugin**: @tailwindcss/postcss (required for v4)
- **Custom Theme**: Primary blue color palette (10 shades)

**Key Configuration**:
- Content paths: `./index.html`, `./src/**/*.{js,jsx}`
- Custom colors: `primary-50` through `primary-900`
- Custom components: `.btn-primary`, `.card`, `.input-field`

#### React Router DOM 7.9.4
- **Purpose**: Client-side routing
- **Features**:
  - Data loading APIs
  - Nested routes
  - Protected routes
  - Lazy loading

#### Zustand 5.0.8
- **Purpose**: State management
- **Why Zustand?**:
  - Minimal boilerplate (vs Redux)
  - No context providers needed
  - Simple API
  - TypeScript support
  - Devtools integration

**Example Store Structure**:
```javascript
// authStore.js
const useAuthStore = create((set) => ({
  user: null,
  token: null,
  login: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null })
}))
```

#### Recharts 3.3.0
- **Purpose**: Data visualization
- **Chart Types**: Line, Bar, Area, Pie, Radar
- **Integration**: React-native, responsive
- **Use Cases**: Health metrics trends, daily stats

#### date-fns 4.1.0
- **Purpose**: Date manipulation and formatting
- **Why date-fns?** 
  - Modular (tree-shakeable)
  - Immutable
  - TypeScript support
  - Simple API

### Backend Stack

#### Node.js (v18+)
- **Runtime**: JavaScript runtime for server
- **Features**: 
  - ES Modules support
  - Improved performance
  - Native Fetch API

#### Express 4.19.2
- **Purpose**: Web framework for Node.js
- **Features**:
  - Routing
  - Middleware support
  - Template engines (if needed)
  - Error handling

**Middleware Chain**:
1. CORS → Allow cross-origin requests
2. express.json() → Parse JSON bodies
3. Custom logger → Log requests
4. Routes → Handle endpoints
5. Error handler → Catch and format errors

#### MongoDB + Mongoose 8.3.0
- **Database**: NoSQL document database
- **ODM**: Mongoose for schema modeling
- **Features**:
  - Schema validation
  - Middleware (pre/post hooks)
  - Query builders
  - Virtuals and methods

**Connection**:
```javascript
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
```

#### JWT (jsonwebtoken 9.0.2)
- **Purpose**: Stateless authentication
- **Token Structure**: `header.payload.signature`
- **Flow**:
  1. User logs in with credentials
  2. Server validates and creates JWT
  3. Client stores token (localStorage/cookie)
  4. Client sends token in Authorization header
  5. Server verifies token on protected routes

**Token Payload**:
```javascript
{
  userId: "...",
  email: "...",
  iat: 1234567890,  // issued at
  exp: 1234999999   // expires at
}
```

#### bcryptjs 2.4.3
- **Purpose**: Password hashing
- **Algorithm**: bcrypt (adaptive hash function)
- **Salt Rounds**: 10 (configurable)
- **Usage**:
  - Hash password before storing
  - Compare password during login

#### express-validator 7.0.1
- **Purpose**: Input validation and sanitization
- **Features**:
  - Chain-based validation
  - Custom validators
  - Automatic error messages
- **Example**:
```javascript
body('email').isEmail().normalizeEmail(),
body('password').isLength({ min: 8 })
```

#### googleapis 134.0.0
- **Purpose**: Google Fit API integration
- **Features**:
  - OAuth 2.0 authentication
  - Fitness data access
  - Activity tracking
- **Use Cases**: 
  - Sync steps, calories from Google Fit
  - Auto-import health data

## Design Patterns

### 1. MVC (Model-View-Controller)

**Server Implementation**:
- **Model**: Mongoose schemas (data structure + validation)
- **View**: JSON responses (no templates)
- **Controller**: Route handlers (request/response logic)

### 2. Repository Pattern (Services)

Services abstract business logic from controllers:

```javascript
// authService.js
export const registerUser = async (userData) => {
  // Hash password
  // Create user in DB
  // Generate JWT
  // Return user + token
}

// authController.js
export const register = async (req, res) => {
  try {
    const result = await authService.registerUser(req.body)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
```

### 3. Custom Hooks Pattern (React)

Extract reusable logic:

```javascript
// useAuth.js
export const useAuth = () => {
  const { user, token, login, logout } = useAuthStore()
  
  const checkAuth = () => {
    // Verify token validity
  }
  
  return { user, token, login, logout, checkAuth }
}
```

### 4. Component Composition

Build complex UIs from simple components:

```javascript
<DashboardLayout>
  <MetricsList>
    <MetricCard type="steps" />
    <MetricCard type="calories" />
  </MetricsList>
</DashboardLayout>
```

### 5. Error Handling Pattern

Centralized error handling:

```javascript
// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
  }
}

// Global error middleware
app.use((err, req, res, next) => {
  const { statusCode = 500, message } = err
  res.status(statusCode).json({ error: message })
})
```

## Data Models

### User Model

```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  createdAt: Date,
  updatedAt: Date,
  googleFitConnected: Boolean,
  refreshToken: String
}
```

### Health Metric Model

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  metricType: String (steps|calories|weight|sleep|heartRate),
  value: Number (required),
  unit: String (steps|kcal|kg|hours|bpm),
  recordedAt: Date (required),
  source: String (manual|googleFit),
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

## API Flow Examples

### User Registration Flow

```
1. Client submits form
   POST /api/auth/register
   { name, email, password }
   
2. Express receives request
   ↓
3. Validation middleware
   - Check email format
   - Check password length
   ↓
4. Controller (authController.register)
   ↓
5. Service (authService.registerUser)
   - Hash password with bcrypt
   - Check if email exists
   - Create user in MongoDB
   - Generate JWT token
   ↓
6. Response to client
   { token, user: { id, name, email } }
   
7. Client stores token
   - Save to localStorage
   - Update Zustand store
   - Redirect to dashboard
```

### Protected Route Access

```
1. Client makes request
   GET /api/metrics
   Headers: { Authorization: "Bearer <token>" }
   
2. Auth middleware
   - Extract token from header
   - Verify JWT signature
   - Decode payload
   - Attach user to req.user
   ↓
3. If valid → Continue to controller
   If invalid → 401 Unauthorized
   
4. Controller fetches user-specific data
   ↓
5. Response with data
```

## Security Measures

### Authentication & Authorization
- JWT tokens with expiration
- Password hashing with bcrypt (10 rounds)
- Protected routes with middleware
- Token refresh mechanism (planned)

### Input Validation
- express-validator for sanitization
- Mongoose schema validation
- Type checking at runtime

### CORS Configuration
- Whitelist allowed origins
- Credentials support for cookies
- Specific methods allowed

### Environment Variables
- Sensitive data in .env
- .env files in .gitignore
- Different configs per environment

## Performance Optimizations

### Frontend
- **Vite HMR**: Instant updates during development
- **Code Splitting**: React.lazy() for route-based splitting
- **Tree Shaking**: Unused code eliminated in production
- **Asset Optimization**: Vite optimizes images and fonts
- **Zustand**: Minimal re-renders with targeted subscriptions

### Backend
- **Connection Pooling**: MongoDB connection reuse
- **Indexing**: Database indexes on frequently queried fields
- **Caching**: (Planned) Redis for session storage
- **Compression**: (Planned) gzip for responses

## Deployment Architecture (Planned)

```
┌──────────────────────────────────────────────┐
│            CDN (Cloudflare)                  │
│         Static Assets Caching               │
└──────────────────────────────────────────────┘
                    │
┌──────────────────────────────────────────────┐
│         Frontend (Vercel/Netlify)            │
│         React SPA Build                      │
└──────────────────────────────────────────────┘
                    │
                   API
                    │
┌──────────────────────────────────────────────┐
│      Backend API (Render/Railway)            │
│      Node.js + Express                       │
└──────────────────────────────────────────────┘
                    │
┌──────────────────────────────────────────────┐
│      Database (MongoDB Atlas)                │
│      Cloud-hosted MongoDB                    │
└──────────────────────────────────────────────┘
```

## Development Workflow

### Local Development

1. **Start Backend**: `cd server && npm run dev`
   - Runs on http://localhost:5000
   - Nodemon auto-restarts on changes

2. **Start Frontend**: `cd client && npm run dev`
   - Runs on http://localhost:5173
   - HMR for instant updates
   - Proxies API requests to backend

3. **Database**: MongoDB running locally or Atlas connection

### Git Workflow

1. Create feature branch: `git checkout -b feature/name`
2. Make changes and commit: `git commit -m "feat: description"`
3. Push to GitHub: `git push origin feature/name`
4. Create Pull Request
5. Review and merge to main

### Commit Convention

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Build/tooling changes

## Future Enhancements

### Phase 2: Analytics Engine
- Apache Spark integration
- Predictive modeling
- Trend analysis
- Goal recommendations

### Phase 3: Mobile Apps
- React Native (iOS/Android)
- Shared components with web
- Push notifications
- Offline support

### Phase 4: Social Features
- Share progress with friends
- Challenges and competitions
- Leaderboards
- Achievement badges

---

**Last Updated**: October 19, 2025
**Version**: 1.0.0 (Initial Setup)
