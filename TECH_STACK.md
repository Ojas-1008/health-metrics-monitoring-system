# Technology Stack Documentation

## Table of Contents
- [Frontend Technologies](#frontend-technologies)
- [Backend Technologies](#backend-technologies)
- [Development Tools](#development-tools)
- [Third-Party Services](#third-party-services)
- [Version Requirements](#version-requirements)

---

## Frontend Technologies

### 🎨 React 19.2.0
**Purpose**: JavaScript library for building user interfaces

**Why React?**
- Component-based architecture for reusability
- Virtual DOM for efficient rendering
- Large ecosystem and community support
- Strong TypeScript integration (if needed)
- React Server Components for better performance

**Key Features Used**:
- Functional components with Hooks
- useState, useEffect for state and side effects
- Custom hooks for logic reuse
- Context API (minimal, Zustand preferred)

**Documentation**: https://react.dev/

---

### ⚡ Vite 7.1.7
**Purpose**: Next-generation frontend build tool

**Why Vite?**
- Lightning-fast HMR (Hot Module Replacement)
- Instant server start (no bundling in dev)
- Optimized production builds with Rollup
- Native ES modules support
- Built-in TypeScript, JSX, CSS support

**Features**:
```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
```

**Commands**:
- `npm run dev` - Start dev server
- `npm run build` - Production build
- `npm run preview` - Preview production build

**Documentation**: https://vitejs.dev/

---

### 🎨 Tailwind CSS 4.1.14
**Purpose**: Utility-first CSS framework

**Why Tailwind?**
- Rapid UI development
- Consistent design system
- No CSS file bloat (tree-shaking)
- Responsive design utilities
- Dark mode support (planned)

**Configuration**:
```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb', // Main brand color
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  }
}
```

**PostCSS Setup** (Required for Tailwind v4):
```javascript
// postcss.config.js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {}
  }
}
```

**Custom Components**:
- `.btn-primary` - Primary action buttons
- `.btn-secondary` - Secondary buttons
- `.input-field` - Form inputs with focus states
- `.card` - Content cards with shadow

**Documentation**: https://tailwindcss.com/

---

### 🧭 React Router DOM 7.9.4
**Purpose**: Client-side routing for React

**Why React Router?**
- Declarative routing
- Nested routes support
- Data loading APIs
- Protected routes (authentication)
- Lazy loading for code splitting

**Usage Example**:
```javascript
import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}
```

**Features**:
- Dynamic routing
- URL parameters
- Query strings
- Navigation hooks (useNavigate, useLocation)
- Route protection

**Documentation**: https://reactrouter.com/

---

### 🐻 Zustand 5.0.8
**Purpose**: Lightweight state management

**Why Zustand?**
- Simple API (less boilerplate than Redux)
- No providers needed
- TypeScript support
- Devtools integration
- Middleware support

**Store Example**:
```javascript
// stores/authStore.js
import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  
  login: (user, token) => {
    localStorage.setItem('token', token)
    set({ user, token, isAuthenticated: true })
  },
  
  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null, isAuthenticated: false })
  },
  
  updateUser: (userData) => set({ user: userData })
}))

export default useAuthStore
```

**Usage in Components**:
```javascript
function Profile() {
  const { user, logout } = useAuthStore()
  
  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

**Documentation**: https://zustand-demo.pmnd.rs/

---

### 📊 Recharts 3.3.0
**Purpose**: Composable charting library for React

**Why Recharts?**
- React-native (uses React components)
- Responsive and customizable
- Various chart types
- Animation support
- SVG-based rendering

**Chart Types Available**:
- LineChart - Trends over time
- BarChart - Comparisons
- AreaChart - Cumulative data
- PieChart - Proportions
- RadarChart - Multi-metric comparison

**Example**:
```javascript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

function StepsChart({ data }) {
  return (
    <LineChart width={600} height={300} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="steps" stroke="#2563eb" />
    </LineChart>
  )
}
```

**Documentation**: https://recharts.org/

---

### 📅 date-fns 4.1.0
**Purpose**: Modern JavaScript date utility library

**Why date-fns?**
- Modular (tree-shakeable)
- Immutable & pure functions
- TypeScript support
- Consistent API
- Locale support

**Common Functions**:
```javascript
import { format, parseISO, subDays, isToday } from 'date-fns'

// Format dates
format(new Date(), 'MMM dd, yyyy') // "Oct 19, 2025"

// Parse ISO strings
const date = parseISO('2025-10-19T10:00:00Z')

// Date math
const yesterday = subDays(new Date(), 1)

// Comparisons
isToday(new Date()) // true
```

**Documentation**: https://date-fns.org/

---

## Backend Technologies

### 🟢 Node.js (v18+)
**Purpose**: JavaScript runtime for server-side applications

**Why Node.js?**
- JavaScript everywhere (frontend + backend)
- Non-blocking I/O (event-driven)
- NPM ecosystem (millions of packages)
- ES Modules support
- Native Fetch API

**Features Used**:
- ES Modules (`import`/`export`)
- Async/await
- Environment variables
- Native crypto module

**Documentation**: https://nodejs.org/

---

### 🚂 Express 4.19.2
**Purpose**: Fast, minimalist web framework for Node.js

**Why Express?**
- Industry standard
- Middleware architecture
- Routing system
- Large ecosystem
- Well-documented

**Basic Setup**:
```javascript
import express from 'express'
import cors from 'cors'

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/metrics', metricsRoutes)

// Error handling
app.use(errorHandler)

app.listen(5000, () => console.log('Server running on port 5000'))
```

**Middleware Stack**:
1. CORS - Cross-origin requests
2. Body Parser - Parse JSON
3. Logger - Request logging
4. Auth - JWT verification
5. Validation - Input validation
6. Error Handler - Centralized errors

**Documentation**: https://expressjs.com/

---

### 🍃 MongoDB + Mongoose 8.3.0
**Purpose**: NoSQL database with ODM (Object Data Modeling)

**Why MongoDB?**
- Flexible schema (JSON-like documents)
- Scalable and performant
- Rich query language
- Aggregation framework
- Atlas cloud hosting

**Mongoose Features**:
- Schema definition with types
- Validation rules
- Middleware (pre/post hooks)
- Virtual properties
- Query builders

**Schema Example**:
```javascript
import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: {
      validator: (v) => /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v),
      message: 'Invalid email format'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false  // Don't return in queries
  }
}, { 
  timestamps: true  // Adds createdAt, updatedAt
})

// Pre-save hook to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

export default mongoose.model('User', userSchema)
```

**Documentation**: https://mongoosejs.com/

---

### 🔐 jsonwebtoken 9.0.2
**Purpose**: JWT (JSON Web Token) implementation

**Why JWT?**
- Stateless authentication
- Self-contained (payload + signature)
- Can be verified without database
- Works across domains

**Usage**:
```javascript
import jwt from 'jsonwebtoken'

// Generate token
const token = jwt.sign(
  { userId: user._id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
)

// Verify token
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET)
  console.log(decoded.userId)
} catch (error) {
  console.error('Invalid token')
}
```

**Token Structure**:
```
header.payload.signature
```

**Security Notes**:
- Use strong secret (256-bit minimum)
- Set appropriate expiration
- Store securely (httpOnly cookies preferred)
- Verify signature on every request

**Documentation**: https://github.com/auth0/node-jsonwebtoken

---

### 🔒 bcryptjs 2.4.3
**Purpose**: Password hashing library

**Why bcrypt?**
- Industry standard
- Adaptive (adjustable cost factor)
- Salt included in hash
- Slow by design (resist brute-force)

**Usage**:
```javascript
import bcrypt from 'bcryptjs'

// Hash password (on registration)
const hashedPassword = await bcrypt.hash(password, 10) // 10 salt rounds

// Compare password (on login)
const isMatch = await bcrypt.compare(password, hashedPassword)
if (isMatch) {
  // Password correct
}
```

**Salt Rounds**:
- 10 rounds = ~150ms (recommended)
- 12 rounds = ~600ms (more secure)
- Higher = more secure but slower

**Documentation**: https://github.com/dcodeIO/bcrypt.js

---

### ✅ express-validator 7.0.1
**Purpose**: Input validation and sanitization middleware

**Why express-validator?**
- Built on validator.js
- Express-native middleware
- Chain-based API
- Custom validators
- Automatic error messages

**Usage**:
```javascript
import { body, validationResult } from 'express-validator'

// Validation rules
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('Password must contain a number')
]

// Controller
export const register = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  // Proceed with registration
}
```

**Documentation**: https://express-validator.github.io/

---

### 🌐 CORS 2.8.5
**Purpose**: Cross-Origin Resource Sharing middleware

**Why CORS?**
- Allow frontend to call backend API
- Security (restrict origins)
- Credentials support

**Configuration**:
```javascript
import cors from 'cors'

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,  // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
```

**Documentation**: https://github.com/expressjs/cors

---

### 🔌 googleapis 134.0.0
**Purpose**: Google APIs client library

**Why googleapis?**
- Official Google library
- OAuth 2.0 support
- All Google services
- TypeScript definitions

**Google Fit API Integration**:
```javascript
import { google } from 'googleapis'

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:5000/auth/google/callback'
)

const fitness = google.fitness({ version: 'v1', auth: oauth2Client })

// Get steps data
const response = await fitness.users.dataset.aggregate({
  userId: 'me',
  requestBody: {
    aggregateBy: [{ dataTypeName: 'com.google.step_count.delta' }],
    bucketByTime: { durationMillis: 86400000 }, // 1 day
    startTimeMillis: Date.now() - 7 * 86400000,  // 7 days ago
    endTimeMillis: Date.now()
  }
})
```

**Documentation**: https://github.com/googleapis/google-api-nodejs-client

---

## Development Tools

### 🔧 ESLint 9.38.0
**Purpose**: JavaScript linter for code quality

**Configuration**:
```javascript
// eslint.config.js
export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    rules: {
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn'
    }
  }
]
```

---

### 🔄 nodemon 3.1.0
**Purpose**: Auto-restart Node.js server on file changes

**Configuration**:
```json
// package.json
{
  "scripts": {
    "dev": "nodemon src/server.js"
  }
}
```

---

### 🎨 PostCSS 8.5.6 + Autoprefixer 10.4.21
**Purpose**: CSS transformation and vendor prefixing

**Configuration**:
```javascript
// postcss.config.js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {}
  }
}
```

---

## Third-Party Services

### MongoDB Atlas
- **Purpose**: Cloud-hosted MongoDB
- **Plan**: Free tier (512MB)
- **Features**: Auto-scaling, backups, monitoring

### Google Fit API
- **Purpose**: Health data integration
- **Authentication**: OAuth 2.0
- **Data**: Steps, calories, heart rate, sleep

### GitHub
- **Purpose**: Version control and collaboration
- **Repository**: https://github.com/Ojas-1008/health-metrics-monitoring-system

---

## Version Requirements

### Minimum Versions

| Technology | Minimum Version | Installed Version |
|------------|----------------|-------------------|
| Node.js    | 18.0.0         | 18.x              |
| npm        | 9.0.0          | 9.x               |
| MongoDB    | 6.0            | 8.x (Atlas)       |
| React      | 18.0.0         | 19.2.0            |
| Express    | 4.18.0         | 4.19.2            |

### Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

(Modern browsers with ES2020 support)

---

## Package Sizes

### Frontend (Production Bundle)
- React + React DOM: ~45 KB (gzipped)
- React Router: ~15 KB (gzipped)
- Recharts: ~90 KB (gzipped)
- Zustand: ~2 KB (gzipped)
- date-fns: ~10-20 KB (tree-shaken)
- Tailwind CSS: ~3-10 KB (purged)

**Total**: ~165-200 KB (typical)

### Backend (node_modules)
- Express + dependencies: ~2 MB
- Mongoose: ~1 MB
- googleapis: ~5 MB
- Other dependencies: ~3 MB

**Total**: ~11 MB

---

## Performance Benchmarks

### Frontend
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Lighthouse Score: 90+ (target)

### Backend
- API Response Time: < 200ms (local)
- Database Queries: < 50ms (indexed)
- JWT Verification: < 5ms

---

**Last Updated**: October 19, 2025
**Maintained by**: Ojas Shrivastava
