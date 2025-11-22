# Health Metrics Monitoring System - Frontend Client

## Overview

Modern React 19 single-page application (SPA) for health metrics tracking with real-time updates, comprehensive authentication, and responsive design. Built with Vite for lightning-fast development and optimized production builds.

### Key Features

- **✅ Complete Authentication System** - JWT-based auth with automatic token management
- **✅ Real-Time Updates** - Server-Sent Events (SSE) for live data streaming
- **✅ Comprehensive Dashboard** - Full health metrics CRUD with analytics visualization
- **✅ Google Fit Integration** - OAuth flow and sync status management
- **✅ Goals Management** - Set and track health goals with progress indicators
- **✅ Event Deduplication** - LRU cache-based duplicate event prevention
- **✅ Responsive Design** - Mobile-first with Tailwind CSS custom theme
- **✅ Advanced State Management** - Context API + custom hooks

### Architecture

**Pattern**: Component-based architecture with centralized state management  
**Rendering**: Client-side rendering (CSR) with React 19  
**Build Tool**: Vite 7.1.7 with HMR and optimized bundling  
**State**: Context API for auth + React hooks for local state  
**Real-Time**: SSE with automatic reconnection and state machine  
**Routing**: React Router 7.9.4 with protected routes  

---

## Tech Stack

### Core Framework
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 19.2.0 | UI framework with concurrent features |
| **Vite** | 7.1.7 | Build tool and dev server |
| **Node.js** | 18+ | JavaScript runtime |

### Routing & Navigation
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React Router DOM** | 7.9.4 | Client-side routing with data routers |
| **PrivateRoute** | Custom | Authentication-based route guards |

### State Management
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React Context API** | Built-in | Global auth state management |
| **React Hooks** | Built-in | Local component state |
| **Zustand** | 5.0.8 | State management library (installed, available) |

### Real-Time Features
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Server-Sent Events (SSE)** | Native API | Real-time data streaming |
| **EventService** | Custom (863 lines) | SSE connection management |
| **useRealtimeEvents Hook** | Custom (351 lines) | React hook for event subscriptions |
| **LRU Cache** | Custom (234 lines) | Event deduplication |

### HTTP & API
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Axios** | 1.12.2 | HTTP client with interceptors |
| **JWT** | Token-based | Authentication mechanism |

### Data & Utilities
| Technology | Version | Purpose |
|-----------|---------|---------|
| **date-fns** | 4.1.0 | Date manipulation library |
| **Custom Utils** | - | Date utils (636 lines), validation (302 lines) |

### Styling & UI
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Tailwind CSS** | 4.1.14 | Utility-first CSS framework |
| **@tailwindcss/postcss** | 4.1.14 | PostCSS plugin (Tailwind v4) |
| **Custom Theme** | - | Primary color palette, animations |

### Visualization (Ready for Use)
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Recharts** | 3.3.0 | React charting library |

### Development Tools
| Technology | Version | Purpose |
|-----------|---------|---------|
| **ESLint** | 9.38.0 | Code linting and quality |
| **@vitejs/plugin-react** | 5.0.4 | React plugin for Vite |

---

## Project Structure

```
client/
├── index.html                    # Entry HTML file
├── package.json                  # Dependencies and scripts
├── vite.config.js                # Vite configuration with API proxy
├── tailwind.config.js            # Tailwind CSS custom configuration
├── postcss.config.js             # PostCSS configuration
├── eslint.config.js              # ESLint configuration
│
├── public/                       # Static assets
│
└── src/                          # Source code
    ├── main.jsx                  # Application entry point (25 lines)
    ├── App.jsx                   # Root component with routing (153 lines)
    ├── index.css                 # Global styles + Tailwind directives (181 lines)
    │
    ├── pages/                    # Page components
    │   ├── Dashboard.jsx         # Main dashboard (1,893 lines) ✅
    │   ├── Home.jsx              # Landing page (176 lines) ✅
    │   ├── Login.jsx             # Login page (325 lines) ✅
    │   ├── Register.jsx          # Registration page (413 lines) ✅
    │   └── NotFound.jsx          # 404 page (57 lines) ✅
    │
    ├── components/               # Reusable components
    │   ├── common/               # Common UI components
    │   │   ├── Alert.jsx         # Alert component (317 lines) ✅
    │   │   ├── Button.jsx        # Button variants (266 lines) ✅
    │   │   ├── Card.jsx          # Card container (233 lines) ✅
    │   │   ├── Input.jsx         # Form input (333 lines) ✅
    │   │   ├── Toast.jsx         # Toast notifications (162 lines) ✅
    │   │   ├── PrivateRoute.jsx  # Route protection (129 lines) ✅
    │   │   └── ConnectionStatusBanner.jsx # SSE status (123 lines) ✅
    │   │
    │   ├── dashboard/            # Dashboard-specific components
    │   │   ├── SummaryStats.jsx  # Statistics summary (567 lines) ✅
    │   │   ├── MetricsForm.jsx   # Metrics input form (535 lines) ✅
    │   │   ├── MetricsList.jsx   # Metrics display (526 lines) ✅
    │   │   ├── GoalsSection.jsx  # Goals display (364 lines) ✅
    │   │   ├── GoalsForm.jsx     # Goals input (353 lines) ✅
    │   │   ├── GoogleFitConnection.jsx # OAuth flow (336 lines) ✅
    │   │   ├── GoogleFitStatus.jsx     # Sync status (145 lines) ✅
    │   │   ├── AnalyticsInsights.jsx   # Analytics display (292 lines) ✅
    │   │   └── AnalyticsMonitor.jsx    # Analytics monitor (141 lines) ✅
    │   │
    │   ├── metrics/              # Metric components
    │   │   └── MetricCard.jsx    # Individual metric card (379 lines) ✅
    │   │
    │   ├── layout/               # Layout components
    │   │   ├── Header.jsx        # App header (422 lines) ✅
    │   │   └── Layout.jsx        # Main layout (253 lines) ✅
    │   │
    │   ├── debug/                # Debug components
    │   │   └── EventDeduplicationDebug.jsx # Dedup debug (49 lines)
    │   │
    │   └── test/                 # Test components
    │       ├── EventServiceTest.jsx        # SSE testing (285 lines)
    │       ├── TestRealtimeHook.jsx        # Hook testing (164 lines)
    │       ├── GoogleFitTest.jsx           # Google Fit testing (171 lines)
    │       ├── ConnectionStatusTest.jsx    # Status testing (114 lines)
    │       ├── TestSSEComponent.jsx        # SSE component test (77 lines)
    │       ├── MultiEventTest.jsx          # Multi-event test (71 lines)
    │       ├── FilteredMetricsTest.jsx     # Filtered test (49 lines)
    │       ├── ManualUnsubscribeTest.jsx   # Unsubscribe test (31 lines)
    │       └── ConditionalSubscriptionTest.jsx # Conditional test (30 lines)
    │
    ├── services/                 # API service layer
    │   ├── eventService.js       # SSE service (786 lines) ✅
    │   ├── authService.js        # Authentication (620 lines) ✅
    │   ├── metricsService.js     # Health metrics (563 lines) ✅
    │   ├── googleFitService.js   # Google Fit (519 lines) ✅
    │   ├── goalsService.js       # Goals management (496 lines) ✅
    │   ├── axiosConfig.js        # Axios setup (259 lines) ✅
    │   └── sseService.js         # Legacy SSE (83 lines) [Deprecated]
    │
    ├── context/                  # React Context providers
    │   └── AuthContext.jsx       # Auth state (719 lines) ✅
    │
    ├── hooks/                    # Custom React hooks
    │   └── useRealtimeEvents.js  # SSE hook (351 lines) ✅
    │
    ├── utils/                    # Utility functions
    │   ├── dateUtils.js          # Date utilities (636 lines) ✅
    │   ├── validation.js         # Validation helpers (302 lines) ✅
    │   ├── LRUCache.js           # LRU cache impl (234 lines) ✅
    │   └── eventServiceHelper.js # Event helpers (197 lines) ✅
    │
    ├── stores/                   # State stores (Zustand)
    │   └── [Available for future use]
    │
    ├── api/                      # API constants
    │   └── [API configuration files]
    │
    ├── assets/                   # Static assets
    │   └── [Images, icons, etc.]
    │
    └── debug/                    # Debug utilities
        ├── RealtimeDebug.jsx     # Real-time debug UI (111 lines)
        └── verifyEventService.js # Event verification (92 lines)
```

**Total Lines of Code**: ~12,000+ lines (excluding node_modules and tests)

---

## Installation & Setup

### Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm or yarn** - Package manager
- **Backend Server** - Running on `http://localhost:5000`

### Quick Start

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Environment Variables

Create a `.env` file in the `client` directory:

```bash
# API Configuration
VITE_API_URL=http://localhost:5000
VITE_API_TIMEOUT=10000

# Storage Keys
VITE_TOKEN_KEY=health_metrics_token

# SSE Configuration (Optional)
VITE_SSE_RECONNECT_DELAY=1000
VITE_SSE_MAX_RECONNECT_ATTEMPTS=10
```

**Environment Variable Details**:

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000` |
| `VITE_API_TIMEOUT` | Axios request timeout (ms) | `10000` |
| `VITE_TOKEN_KEY` | localStorage key for JWT | `health_metrics_token` |
| `VITE_SSE_RECONNECT_DELAY` | Initial SSE reconnect delay (ms) | `1000` |
| `VITE_SSE_MAX_RECONNECT_ATTEMPTS` | Max SSE reconnect attempts | `10` |

---

## Available Scripts

```bash
# Development
npm run dev              # Start Vite dev server (port 5173)

# Production Build
npm run build            # Build for production

# Preview Production Build
npm run preview          # Preview production build locally

# Linting
npm run lint             # Run ESLint (if configured)
```

### Script Details

**`npm run dev`**:
- Starts Vite development server on port 5173
- Enables Hot Module Replacement (HMR)
- Proxies `/api` requests to `http://localhost:5000`
- Provides source maps for debugging

**`npm run build`**:
- Bundles app for production
- Minifies JavaScript and CSS
- Optimizes assets
- Output directory: `dist/`

**`npm run preview`**:
- Serves production build locally
- Useful for testing build before deployment

---

## Core Features

### 1. Authentication System (✅ Complete)

**Components**:
- `Login.jsx` (325 lines) - Login form with validation
- `Register.jsx` (413 lines) - Registration with password confirmation
- `AuthContext.jsx` (719 lines) - Global auth state management
- `authService.js` (620 lines) - API integration layer
- `PrivateRoute.jsx` (129 lines) - Route protection

**Features**:
- JWT token-based authentication
- Automatic token storage in localStorage
- Token attachment to all API requests via interceptors
- Password validation (8+ chars, uppercase, number, special char)
- Email format validation
- Auto-logout on token expiration (401 responses)
- User profile with name, email, picture, goals
- Profile update functionality
- Google Fit connection status tracking

**User Flow**:
1. Register → Email + Password + Name
2. Login → JWT token stored
3. Auto-attach token to requests
4. Access protected routes
5. Logout → Clear token and state

### 2. Real-Time Updates (✅ Complete)

**Architecture**:
```
Backend SSE → eventService → AuthContext → useRealtimeEvents → Components
```

**Components**:
- `eventService.js` (786 lines) - Core SSE management
- `useRealtimeEvents.js` (351 lines) - React hook for subscriptions
- `LRUCache.js` (234 lines) - Event deduplication
- `ConnectionStatusBanner.jsx` (123 lines) - Connection status UI

**Features**:
- **State Machine**: connecting → connected → disconnected → reconnecting → error
- **Automatic Reconnection**: Exponential backoff (1s → 30s max)
- **Event Deduplication**: LRU cache (last 50 events, 60s max age)
- **Connection Persistence**: Survives navigation
- **Heartbeat Monitoring**: 60s timeout detection
- **Error Recovery**: Automatic retry with max 10 attempts
- **Debug Logging**: Development mode console logs

**Supported Event Types**:
- `sync:start` - Google Fit sync initiated
- `sync:progress` - Sync progress updates
- `sync:complete` - Sync completed
- `sync:error` - Sync failed
- `metrics:updated` - Health metrics changed
- `goals:updated` - Goals changed
- `user:updated` - Profile updated
- `analytics:update` - Analytics computed
- `analytics:batch_update` - Batch analytics update
- `heartbeat` - Connection keep-alive

**React Hooks**:
```javascript
// Generic hook
useRealtimeEvents(eventType, callback, deps)

// Specialized hooks
useRealtimeMetrics(callback)      // Listen to metrics updates
useRealtimeSync(callback)         // Listen to sync events
useRealtimeGoals(callback)        // Listen to goals updates
useRealtimeAnalytics(callback)    // Listen to analytics updates
useConnectionStatus()             // Get connection status
```

**Example Usage**:
```javascript
import { useRealtimeMetrics, useConnectionStatus } from '../hooks/useRealtimeEvents';

function Dashboard() {
  // Listen to metric updates
  useRealtimeMetrics((data) => {
    console.log('Metrics updated:', data);
    // Refresh UI
  });

  // Monitor connection
  const connectionStatus = useConnectionStatus();
  
  return (
    <div>
      {!connectionStatus.connected && (
        <p>Reconnecting... ({connectionStatus.retryCount}/10)</p>
      )}
    </div>
  );
}
```

### 3. Dashboard (✅ Complete)

**Main Component**: `Dashboard.jsx` (1,893 lines)

**Sub-Components**:
- `SummaryStats.jsx` (567 lines) - Statistics overview
- `MetricsForm.jsx` (535 lines) - Add/edit metrics
- `MetricsList.jsx` (526 lines) - Display metrics with sorting/filtering
- `GoalsSection.jsx` (364 lines) - Goals display with progress bars
- `GoalsForm.jsx` (353 lines) - Goals input form
- `GoogleFitConnection.jsx` (336 lines) - OAuth integration
- `GoogleFitStatus.jsx` (145 lines) - Sync status display
- `AnalyticsInsights.jsx` (292 lines) - Analytics visualization
- `AnalyticsMonitor.jsx` (141 lines) - Analytics monitoring

**Features**:
- **Real-Time Updates**: Auto-refresh on SSE events
- **Metrics CRUD**: Create, read, update, delete health metrics
- **Goals Management**: Set and track 5 goal types (steps, calories, activeMinutes, weight, sleepHours)
- **Google Fit Sync**: Connect account, trigger sync, view status
- **Analytics Display**: 7-day rolling averages, streaks, anomalies, percentiles
- **Date Range Filtering**: Last 7/30/90 days
- **Sorting & Filtering**: Multiple sort options
- **Loading States**: Skeleton loaders during API calls
- **Error Handling**: User-friendly error messages
- **Responsive Design**: Mobile-optimized layout

**Metrics Supported** (Phone-Only):
- ✅ Steps (integer)
- ✅ Distance (km, decimal)
- ✅ Calories (integer)
- ✅ Active Minutes (integer)
- ✅ Weight (kg, decimal)
- ✅ Sleep Hours (decimal)

**Not Supported** (Wearable-Only):
- ❌ Heart Rate
- ❌ Blood Oxygen (SpO2)

### 4. Google Fit Integration (✅ Complete)

**Components**:
- `GoogleFitConnection.jsx` (336 lines) - OAuth flow
- `GoogleFitStatus.jsx` (145 lines) - Connection status
- `googleFitService.js` (519 lines) - API integration

**Features**:
- **OAuth 2.0 Flow**: Redirect to Google authorization
- **Connection Status**: Display connected/disconnected state
- **Manual Sync**: Trigger data sync on demand
- **Disconnect**: Remove Google Fit connection
- **Sync Progress**: Real-time sync status via SSE
- **Error Handling**: User-friendly error messages

**OAuth Flow**:
1. User clicks "Connect Google Fit"
2. Redirect to Google authorization page
3. User grants permissions
4. Callback returns to app with auth code
5. Backend exchanges code for tokens
6. Connection status updated
7. Automatic sync triggered

### 5. Goals Management (✅ Complete)

**Components**:
- `GoalsForm.jsx` (353 lines) - Goal setting form
- `GoalsSection.jsx` (364 lines) - Goal display with progress
- `goalsService.js` (496 lines) - API integration

**Goal Types**:
| Goal Type | Unit | Default | Min | Max |
|-----------|------|---------|-----|-----|
| **Steps** | steps/day | 10,000 | 1,000 | 50,000 |
| **Calories** | kcal/day | 2,000 | 500 | 5,000 |
| **Active Minutes** | minutes/day | 30 | 5 | 180 |
| **Weight** | kg | 70 | 30 | 200 |
| **Sleep Hours** | hours/day | 8 | 4 | 12 |

**Features**:
- Set custom goals for each metric
- Progress bars with percentage completion
- Color-coded progress (red < 50%, yellow < 100%, green ≥ 100%)
- Reset to defaults option
- Real-time updates on goal changes
- Input validation with min/max ranges

### 6. Analytics Display (✅ Complete)

**Components**:
- `AnalyticsInsights.jsx` (292 lines) - Analytics visualization
- `AnalyticsMonitor.jsx` (141 lines) - Analytics monitoring

**Analytics Types**:
- **7-Day Rolling Averages**: Smoothed trend lines
- **Activity Streaks**: Consecutive days tracking
- **Anomaly Detection**: Flagged unusual values (2σ threshold)
- **Percentile Rankings**: 90-day comparison
- **Trend Analysis**: Increasing/decreasing/stable indicators

**Features**:
- Real-time analytics updates via SSE
- Visual indicators for anomalies
- Trend badges (↑ increasing, ↓ decreasing, → stable)
- Multiple time ranges (7-day, 30-day, 90-day)
- Recharts integration ready for visualization

---

## Component Library

### Common Components

**Alert** (`Alert.jsx` - 317 lines):
- Multi-variant: success, error, warning, info
- Auto-dismiss with timer
- Custom icons
- Dismissible with close button

**Button** (`Button.jsx` - 266 lines):
- Variants: primary, secondary, outline, ghost, danger, success
- Sizes: sm, md, lg
- Loading state with spinner
- Disabled state
- Icon support

**Card** (`Card.jsx` - 233 lines):
- Container component with shadow
- Header/body/footer sections
- Padding variants
- Border customization

**Input** (`Input.jsx` - 333 lines):
- Text, email, password, number, date types
- Label and helper text
- Error state with message
- Icon support (prefix/suffix)
- Validation states

**Toast** (`Toast.jsx` - 162 lines):
- Notification system
- Auto-dismiss (3s default)
- Position control
- Multi-variant styling
- Stack management

**PrivateRoute** (`PrivateRoute.jsx` - 129 lines):
- Authentication guard
- Redirect to login if not authenticated
- Loading state during auth check
- Role-based access (extensible)

**ConnectionStatusBanner** (`ConnectionStatusBanner.jsx` - 123 lines):
- SSE connection status indicator
- Animated reconnection countdown
- Auto-hide when connected
- Error messages with retry button

### Layout Components

**Header** (`Header.jsx` - 422 lines):
- App navigation bar
- User profile dropdown
- Logout button
- Responsive mobile menu
- Connection status indicator

**Layout** (`Layout.jsx` - 253 lines):
- Main app wrapper
- Header + content area
- Footer (optional)
- Background styling

---

## Services Layer

### Authentication Service

**File**: `authService.js` (620 lines)

**Functions**:
```javascript
// User registration
register(name, email, password, passwordConfirm)

// User login
login(email, password)

// Get current user
getCurrentUser()

// Update user profile
updateProfile(name, profilePicture)

// Logout
logout()
```

**Features**:
- Client-side validation before API calls
- Password strength checking
- Email format validation
- Automatic token storage
- Error response standardization

### Metrics Service

**File**: `metricsService.js` (563 lines)

**Functions**:
```javascript
// Get metrics by date range
getMetrics(startDate, endDate)

// Get metrics for specific date
getMetricsByDate(date)

// Add or update metrics
addMetrics(date, metrics)

// Update existing metrics
updateMetrics(date, metrics)

// Delete metrics
deleteMetrics(date)

// Get summary stats
getSummary(period) // 'week', 'month', 'year'

// Get latest metrics
getLatestMetrics()
```

**Features**:
- Date range queries
- Summary statistics
- Phone-only metric validation
- Error handling
- Loading states

### Goals Service

**File**: `goalsService.js` (496 lines)

**Functions**:
```javascript
// Get user goals
getGoals()

// Set goals
setGoals(goals)

// Update specific goals
updateGoals(partialGoals)

// Reset to defaults
resetGoals()

// Get goal progress
getProgress()
```

**Features**:
- Default goal values
- Min/max validation
- Progress calculation
- Reset functionality

### Google Fit Service

**File**: `googleFitService.js` (519 lines)

**Functions**:
```javascript
// Initiate OAuth flow
connectGoogleFit()

// Get connection status
getConnectionStatus()

// Trigger manual sync
triggerSync()

// Disconnect account
disconnectGoogleFit()
```

**Features**:
- OAuth 2.0 flow handling
- Connection status tracking
- Manual sync trigger
- Disconnect functionality

### Event Service

**File**: `eventService.js` (786 lines)

**Core Class**: `EventService`

**Methods**:
```javascript
// Connect to SSE stream
connect(token)

// Disconnect from stream
disconnect()

// Subscribe to events
subscribe(eventType, callback)

// Unsubscribe from events
unsubscribe(eventType, callback)

// Get connection status
getConnectionStatus()

// Get connection state
getState()
```

**Features**:
- State machine management
- Automatic reconnection
- Event deduplication
- Error handling
- Debug logging
- Token-based authentication

---

## State Management

### AuthContext

**File**: `AuthContext.jsx` (719 lines)

**State Structure**:
```javascript
{
  user: {
    id: string,
    name: string,
    email: string,
    profilePicture: string,
    googleFitConnected: boolean,
    goals: {
      steps: number,
      calories: number,
      activeMinutes: number,
      weight: number,
      sleepHours: number,
    },
    createdAt: string,
  } | null,
  loading: boolean,
  error: string | null,
  initialized: boolean,
  connectionStatus: {
    connected: boolean,
    state: string,
    reason: string | null,
    error: string | null,
    retryCount: number,
    maxRetries: number,
  },
}
```

**Context Methods**:
```javascript
const {
  user,              // Current user object or null
  loading,           // Loading state
  error,             // Error message
  initialized,       // Auth check complete flag
  connectionStatus,  // SSE connection status
  login,             // Login function
  register,          // Register function
  logout,            // Logout function
  updateProfile,     // Profile update function
} = useAuth();
```

**Usage**:
```javascript
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, login, logout } = useAuth();
  
  if (!user) {
    return <button onClick={() => login(email, password)}>Login</button>;
  }
  
  return (
    <div>
      <p>Welcome, {user.name}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

---

## Custom Hooks

### useRealtimeEvents

**File**: `useRealtimeEvents.js` (351 lines)

**Main Hook**:
```javascript
useRealtimeEvents(eventType, callback, dependencies)
```

**Specialized Hooks**:
```javascript
// Metrics updates
useRealtimeMetrics(callback)

// Sync events (start, progress, complete, error)
useRealtimeSync(callback)

// Goals updates
useRealtimeGoals(callback)

// Analytics updates
useRealtimeAnalytics(callback)

// Connection status monitoring
useConnectionStatus()
```

**Example**:
```javascript
import { useRealtimeMetrics } from '../hooks/useRealtimeEvents';

function MetricsDashboard() {
  const [metrics, setMetrics] = useState([]);
  
  // Auto-refresh on real-time updates
  useRealtimeMetrics((data) => {
    console.log('Metrics updated:', data);
    setMetrics(prev => [...prev, data]);
  });
  
  return <div>{/* Render metrics */}</div>;
}
```

---

## Styling Guide

### Tailwind CSS Configuration

**File**: `tailwind.config.js`

**Custom Theme**:
- **Primary Color Palette**: Blue shades (50-900)
- **Font Family**: Inter, system-ui, sans-serif
- **Custom Animations**: shimmer, slideInDown

**Custom Utility Classes** (`index.css`):
```css
/* Button Styles */
.btn-primary        /* Primary blue button */
.btn-secondary      /* Gray secondary button */

/* Input Styles */
.input-field        /* Standard input field */

/* Card Styles */
.card               /* Container with shadow */

/* Utility Classes */
.scrollbar-hide     /* Hide scrollbar */
```

**Color Palette**:
```javascript
primary: {
  50: '#eff6ff',   // Lightest blue
  100: '#dbeafe',
  200: '#bfdbfe',
  300: '#93c5fd',
  400: '#60a5fa',
  500: '#3b82f6',  // Base blue
  600: '#2563eb',  // Primary button
  700: '#1d4ed8',  // Primary hover
  800: '#1e40af',
  900: '#1e3a8a',  // Darkest blue
}
```

### Responsive Design

**Breakpoints** (Tailwind defaults):
- `sm`: 640px (mobile)
- `md`: 768px (tablet)
- `lg`: 1024px (desktop)
- `xl`: 1280px (large desktop)
- `2xl`: 1536px (extra large)

**Usage**:
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>
```

---

## API Integration

### Axios Configuration

**File**: `axiosConfig.js` (259 lines)

**Base Setup**:
```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: import.meta.env.VITE_API_TIMEOUT || 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

**Request Interceptor**:
- Automatically attaches JWT token from localStorage
- Adds `Authorization: Bearer <token>` header

**Response Interceptor**:
- Handles 401 Unauthorized (auto-logout)
- Standardizes error responses
- Extracts response data

**Usage**:
```javascript
import api from '../services/axiosConfig';

// GET request
const response = await api.get('/api/metrics');

// POST request
const response = await api.post('/api/auth/login', { email, password });
```

### API Endpoints

All API calls go through Vite proxy (`/api` → `http://localhost:5000`):

**Authentication**:
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/logout` - Logout

**Health Metrics**:
- `POST /api/metrics` - Add/update metrics
- `GET /api/metrics?startDate=&endDate=` - Get metrics by range
- `GET /api/metrics/:date` - Get metrics for date
- `PUT /api/metrics/:date` - Update metrics
- `DELETE /api/metrics/:date` - Delete metrics
- `GET /api/metrics/summary/:period` - Get summary
- `GET /api/metrics/latest` - Get latest metrics

**Goals**:
- `POST /api/goals` - Set/update goals
- `GET /api/goals` - Get goals
- `PUT /api/goals` - Partial update
- `DELETE /api/goals` - Reset to defaults
- `GET /api/goals/progress` - Get progress

**Google Fit**:
- `GET /api/googlefit/connect` - Initiate OAuth
- `GET /api/googlefit/callback` - OAuth callback
- `GET /api/googlefit/status` - Connection status
- `GET /api/googlefit/sync` - Trigger sync
- `POST /api/googlefit/disconnect` - Disconnect

**Events (SSE)**:
- `GET /api/events/stream` - SSE stream (persistent)

---

## Routing

**File**: `App.jsx` (153 lines)

**Route Structure**:
```jsx
<Routes>
  {/* Public Routes */}
  <Route path="/" element={<Home />} />
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  
  {/* Protected Routes */}
  <Route
    path="/dashboard"
    element={
      <PrivateRoute>
        <Dashboard />
      </PrivateRoute>
    }
  />
  
  {/* 404 */}
  <Route path="*" element={<NotFound />} />
</Routes>
```

**Navigation**:
```javascript
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();
  
  const goToDashboard = () => {
    navigate('/dashboard');
  };
  
  return <button onClick={goToDashboard}>Go to Dashboard</button>;
}
```

---

## Development Workflow

### Local Development

1. **Start Backend** (port 5000)
2. **Start Frontend** (port 5173)
3. **Navigate to** `http://localhost:5173`

**Hot Module Replacement (HMR)**:
- Instant updates on file changes
- Preserves component state
- No full page reload needed

### Development Tools

**React DevTools**:
- Install browser extension
- Inspect component tree
- View props and state

**Redux DevTools** (if using Redux/Zustand):
- Time-travel debugging
- State inspection

**Vite DevTools**:
- Network requests
- Build stats
- Module graph

### Debugging SSE

**Debug Utilities**:
- `EventDeduplicationDebug.jsx` - View dedup cache
- `RealtimeDebug.jsx` - Monitor real-time events
- `EventServiceTest.jsx` - Test SSE functionality

**Console Logs** (Development Mode):
```
[SSE] Connecting to: http://localhost:5000/events/stream
[SSE] Connected successfully
[SSE] Received event: metrics:updated
[SSE Dedup] Cache size: 5/50
```

---

## Testing Components

The project includes comprehensive test components for validating functionality:

**SSE Testing**:
- `EventServiceTest.jsx` (285 lines) - Full SSE test suite
- `TestSSEComponent.jsx` (77 lines) - Basic SSE component
- `ConnectionStatusTest.jsx` (114 lines) - Connection status tests

**Hook Testing**:
- `TestRealtimeHook.jsx` (164 lines) - useRealtimeEvents hook tests
- `ManualUnsubscribeTest.jsx` (31 lines) - Unsubscribe tests
- `ConditionalSubscriptionTest.jsx` (30 lines) - Conditional subscription tests

**Event Testing**:
- `MultiEventTest.jsx` (71 lines) - Multiple event types
- `FilteredMetricsTest.jsx` (49 lines) - Filtered events

**Google Fit Testing**:
- `GoogleFitTest.jsx` (171 lines) - OAuth flow testing

**Debug Tools**:
- `RealtimeDebug.jsx` (111 lines) - Real-time event monitor
- `EventDeduplicationDebug.jsx` (49 lines) - Deduplication cache viewer

---

## Build & Deployment

### Production Build

```bash
# Build for production
npm run build

# Output directory: dist/
# Files are minified and optimized
```

**Build Output**:
```
dist/
├── index.html           # Entry HTML
├── assets/
│   ├── index-[hash].js  # Bundled JavaScript
│   ├── index-[hash].css # Bundled CSS
│   └── [images]         # Optimized images
└── ...
```

### Deployment

**Static Hosting** (Recommended):
- **Vercel**: `vercel deploy`
- **Netlify**: Drag & drop `dist/` folder
- **Cloudflare Pages**: Connect Git repo
- **AWS S3 + CloudFront**: Upload `dist/`
- **GitHub Pages**: Use gh-pages branch

**Environment Variables** (Production):
```
VITE_API_URL=https://api.yourdomain.com
VITE_API_TIMEOUT=10000
VITE_TOKEN_KEY=health_metrics_token
```

**Build Optimization**:
- Code splitting: Automatic with Vite
- Tree shaking: Removes unused code
- Asset optimization: Images, fonts
- Gzip compression: Enabled by default

---

## Performance Optimization

### Code Splitting

Vite automatically splits code by routes:
```javascript
// Lazy load components
const Dashboard = lazy(() => import('./pages/Dashboard'));
```

### Memoization

```javascript
// Prevent unnecessary re-renders
const MemoizedComponent = React.memo(MyComponent);

// Memoize expensive calculations
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);

// Memoize callbacks
const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
```

### Virtual Scrolling

For large lists, consider `react-window` or `react-virtualized`:
```javascript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={1000}
  itemSize={50}
  width="100%"
>
  {Row}
</FixedSizeList>
```

---

## Troubleshooting

### Common Issues

**1. API Connection Failed**
```
Error: Network Error
```
**Solution**:
- Verify backend is running on port 5000
- Check `VITE_API_URL` in `.env`
- Ensure Vite proxy is configured in `vite.config.js`

**2. SSE Not Connecting**
```
[SSE] Connection failed
```
**Solution**:
- Check backend SSE endpoint: `GET /api/events/stream`
- Verify JWT token is valid
- Check browser console for CORS errors
- Ensure backend supports SSE

**3. JWT Token Expired**
```
Error: 401 Unauthorized
```
**Solution**:
- Auto-logout triggered by axios interceptor
- User redirected to login page
- Log in again to get new token

**4. Hot Reload Not Working**
```
Changes not reflecting
```
**Solution**:
- Restart Vite dev server: `npm run dev`
- Clear browser cache
- Check file is saved
- Verify file extension is `.jsx` or `.js`

**5. Tailwind Styles Not Applied**
```
Classes not rendering
```
**Solution**:
- Verify `@import "tailwindcss"` in `index.css`
- Check `tailwind.config.js` content paths
- Restart Vite dev server
- Ensure PostCSS is configured

---

## Browser Support

**Supported Browsers**:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

**Required Features**:
- ES Modules
- EventSource (SSE)
- localStorage
- Fetch API
- Promises
- async/await

---

## Contributing

When adding features to the frontend:

1. **Component Structure**:
   - Place in appropriate directory (`components/`, `pages/`)
   - Use `.jsx` extension for React components
   - Use `.js` for utilities and services

2. **Styling**:
   - Use Tailwind utility classes
   - Follow existing color palette
   - Mobile-first responsive design

3. **State Management**:
   - Use Context API for global state
   - Use local state for component-specific data
   - Consider Zustand for complex state

4. **API Integration**:
   - Add service functions in `services/`
   - Use axios instance from `axiosConfig.js`
   - Handle errors gracefully

5. **Real-Time Features**:
   - Subscribe to events via `useRealtimeEvents`
   - Handle connection status
   - Test with SSE test components

---

## Project Status

### ✅ Completed Features (100%)

- [x] Authentication system with JWT
- [x] Real-time updates via SSE
- [x] Complete dashboard with CRUD operations
- [x] Google Fit OAuth integration
- [x] Goals management
- [x] Analytics display
- [x] Responsive design
- [x] Event deduplication
- [x] Error handling
- [x] Loading states
- [x] Connection status monitoring

### 🚧 Planned Enhancements

- [ ] Data visualization with Recharts
- [ ] Export data (CSV, JSON)
- [ ] Advanced filtering and sorting
- [ ] Dark mode theme
- [ ] Push notifications
- [ ] Offline support with service workers
- [ ] Progressive Web App (PWA)

---

## License

This frontend is part of the Health Metrics Monitoring System project.

---

## Support

For issues or questions:
1. Check browser console for errors
2. Verify backend is running
3. Check network tab for API calls
4. Review this README
5. Test with SSE debug components

**Version**: 1.0  
**Last Updated**: November 21, 2025  
**React Version**: 19.2.0  
**Node Version**: 18+  
**Vite Version**: 7.1.7
