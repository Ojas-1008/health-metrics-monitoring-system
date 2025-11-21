# Health Metrics Client 🎨

React 19 frontend application for Health Metrics Monitoring System - A modern, responsive web app built with Vite, Tailwind CSS, React Router, and Context API for authentication.

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Project Structure](#-project-structure)
- [Implemented Components](#-implemented-components)
- [Setup Instructions](#-setup-instructions)
- [Development](#-development)
- [Styling Guide](#-styling-guide)
- [State Management](#-state-management)
- [API Integration](#-api-integration)
- [Routing](#-routing)
- [Scripts](#-scripts)
- [Development Status](#-development-status)

---

## 🛠 Tech Stack

**Framework & Build:**
- **React 19.2.0** - Latest React with modern hooks and concurrent features
- **Vite 7.1.7** - Lightning-fast build tool with HMR and optimized production builds
- **Node.js 18+** - JavaScript runtime with ES modules support

**Routing & Navigation:**
- **React Router DOM 7.9.4** - Latest version with data routers and modern routing patterns
- **Protected Routes** - PrivateRoute component with authentication guards
- **Route Guards** - AuthRoute for preventing authenticated users accessing auth pages

**State Management:**
- **React Context API** - AuthContext for global authentication state management
- **React Hooks** - useState, useEffect, useCallback, useRef for component state
- **Zustand 5.0.8** - Lightweight state management library (installed, ready for implementation)

**Real-Time Features:**
- **Server-Sent Events (SSE)** - Real-time data streaming from backend
- **Event Service** - Centralized event management with connection handling and reconnection
- **Event Deduplication** - LRU cache-based duplicate event prevention
- **useRealtimeEvents Hook** - Custom React hook for event subscription

**HTTP & API:**
- **Axios 1.12.2** - HTTP client with request/response interceptors and error handling
- **JWT Token Management** - Automatic token attachment and refresh handling
- **Error Handling** - Centralized error handling with user-friendly messages

**Data & Visualization:**
- **Recharts 3.3.0** - React chart library for metrics visualization (installed, ready for implementation)
- **date-fns 4.1.0** - Modern date utility library for date manipulation and formatting

**Styling & UI:**
- **Tailwind CSS 4.1.14** - Utility-first CSS framework with custom primary color palette
- **@tailwindcss/postcss 4.1.14** - PostCSS plugin for Tailwind v4
- **Custom Tailwind Config** - Extended with primary color palette (50-900 range) and custom animations
- **Responsive Design** - Mobile-first approach with breakpoint system

**Development Tools:**
- **ESLint 9.38.0** - Code quality and style enforcement
- **Vite Dev Server** - Port 5173 with API proxy to localhost:5000
- **Hot Module Replacement** - Instant updates during development

---

## ✨ Features

### ✅ **Fully Implemented Features**

#### **1. Complete JWT Authentication System** (696 lines)
- **File:** `src/services/authService.js`
- **Features:**
  - User registration with comprehensive validation (name, email, password, confirmation)
  - Login with email/password credentials
  - Get current authenticated user profile
  - Update user profile (name, picture, goals)
  - Logout functionality
  - Automatic token storage/retrieval from localStorage
  - Client-side password strength validation (8+ chars, 1 uppercase, 1 number, 1 special char)
  - Email format validation
  - Input sanitization before API calls
  - Standardized error response handling
  - Integration with Axios interceptors for token attachment

#### **2. Authentication Context & State Management** (447 lines)
- **File:** `src/context/AuthContext.jsx`
- **Features:**
  - Global authentication state using React Context API
  - Auto-initialization on app load (checks for existing token)
  - Login state management with loading/error states
  - Register state management
  - Logout clearing local state
  - Profile update functionality
  - User object with structure: `{ id, name, email, profilePicture, googleFitConnected, goals, createdAt }`
  - Initialized flag to prevent auth flashing
  - Custom `useAuth()` hook for component consumption
  - Development console logging for debugging

#### **3. Route Protection & Private Routes** (139 lines)
- **File:** `src/components/common/PrivateRoute.jsx`
- **Features:**
  - Protects routes requiring authentication
  - Shows loading spinner during auth check (prevents flash)
  - Redirects unauthenticated users to login
  - Preserves intended destination for post-login redirect
  - Prevents flash of protected content during initialization
  - Works seamlessly with React Router v7

#### **4. API Configuration & Interceptors** (285 lines)
- **File:** `src/api/axiosConfig.js`
- **Features:**
  - Configured Axios instance with base URL and timeout
  - Request interceptor: Automatic JWT token attachment to Authorization header
  - Response interceptor: Centralized error handling
  - 401 error handling: Clears token and redirects to login
  - 400/403/404/500 error handling with user-friendly messages
  - Network error detection and messaging
  - Development console logging for all requests/responses
  - Environment variable support (VITE_API_URL, VITE_API_TIMEOUT, VITE_TOKEN_KEY)

#### **5. Health Metrics Management** (643 lines)
- **File:** `src/services/metricsService.js`
- **Features:**
  - Add/update daily metrics (upsert by date)
  - Get metrics by date range with query parameters
  - Get metrics for specific date
  - Delete metrics by date
  - Get latest metrics entry
  - Calculate summaries (week, month, year) with aggregations
  - Validation: Date format, metrics object validation, date range validation
  - Supported metrics: steps, distance, calories, activeMinutes, weight, sleepHours
  - Source tracking (manual vs. googlefit)
  - Optional activities array for activities performed
  - Error handling for all operations
  - Response format: `{ success, message, count, data }`

#### **6. Fitness Goals Management** (562 lines)
- **File:** `src/services/goalsService.js`
- **Features:**
  - Set/update user fitness goals (create or update)
  - Get current user goals
  - Partial goal updates (modify only specified goals)
  - Reset goals to default values
  - Get goal progress with achievement tracking
  - 5 goal types with validation ranges:
    - **Weight Goal:** 30-300 kg
    - **Step Goal:** 1000-50000 steps/day
    - **Sleep Goal:** 4-12 hours/night
    - **Calorie Goal:** 500-5000 calories/day
    - **Distance Goal:** 0.5-100 km/day
  - Progress calculation: percentage completion, remaining amount, achievement status
  - Overall progress percentage across all goals
  - Default values applied on registration: steps: 10000, sleep: 8, calories: 2000, distance: 5, weight: null

#### **7. Google Fit Integration** (450 lines)
- **File:** `src/services/googleFitService.js`
- **Features:**
  - Initiate Google Fit OAuth flow
  - Get connection status (connected, lastSync timestamp)
  - Disconnect Google Fit account
  - Manual sync trigger
  - User-friendly error handling
  - OAuth state token validation
  - Integration with backend OAuth flow

#### **8. Dashboard & Metrics Display** (1376 lines)
- **File:** `src/pages/Dashboard.jsx`
- **Features:**
  - Comprehensive state management for metrics, goals, summary stats
  - Today's metrics display with card-based layout
  - Previous day metrics for trend comparison
  - Metrics form for adding/updating daily data
  - Metrics list with date range filtering
  - Date range selection (last 7/30/90/365 days, custom)
  - Summary statistics (week, month, year)
  - Goals section with progress tracking
  - Google Fit connection status
  - Auto-refresh after data changes
  - Loading states and error handling
  - Real-time data updates

#### **9. Authentication Pages** (368 lines + 465 lines)
- **Files:** `src/pages/Login.jsx`, `src/pages/Register.jsx`
- **Features:**
  - Complete login page with form validation
  - Complete registration page with password strength indicator
  - Real-time field validation with error messages
  - Touch-based validation (validate on blur, show on touch)
  - Loading states during API calls
  - Error and success alerts
  - Remember me functionality
  - Links to alternate auth page
  - Auto-redirect if already authenticated
  - Responsive design for mobile/desktop
  - Password strength meter with color indicators (weak/fair/good/strong)

#### **11. Real-Time Event System** (892 lines)
- **File:** `src/services/eventService.js`
- **Features:**
  - Server-Sent Events (SSE) connection management
  - JWT-based authentication for event streams
  - Automatic reconnection with exponential backoff
  - Event subscription system with callback management
  - Connection status monitoring and error handling
  - Event emission with deduplication support
  - Statistics tracking for debugging
  - Graceful disconnect and cleanup

#### **12. Event Deduplication System** (245 lines)
- **File:** `src/utils/LRUCache.js`
- **Features:**
  - Time-based LRU cache with automatic expiry
  - O(1) operations for get, set, has, delete
  - Configurable capacity and TTL (time-to-live)
  - Periodic cleanup of expired entries
  - Statistics tracking (hits, misses, evictions, expirations)
  - Memory-efficient implementation using Map

#### **13. Real-Time Event Hook** (178 lines)
- **File:** `src/hooks/useRealtimeEvents.js`
- **Features:**
  - Custom React hook for event subscription
  - Automatic cleanup on unmount
  - Event filtering and processing
  - Connection status integration
  - Error handling and retry logic
  - TypeScript-ready interface

#### **14. Event Deduplication Debug Component** (312 lines)
- **File:** `src/components/debug/EventDeduplicationDebug.jsx`
- **Features:**
  - Real-time deduplication statistics display
  - Cache size and performance metrics
  - Event history with timestamps
  - Manual cache clearing functionality
  - Live updates via event subscriptions
  - Developer-friendly debugging interface

#### **15. Enhanced Dashboard with Real-Time Updates** (1376 lines + real-time integration)
- **File:** `src/pages/Dashboard.jsx`
- **Features:**
  - Real-time metrics updates via SSE
  - Optimistic UI updates for immediate feedback
  - Event deduplication to prevent duplicate displays
  - Live connection status indicators
  - Automatic data refresh on external changes
  - Debug panel integration for development

#### **16. Analytics Integration with Spark** (NEW ✅ - 315 lines + augmentation)
- **Components:**
  - **AnalyticsInsights.jsx** (315 lines) - Real-time analytics visualization
    - Trend indicators (↑ up, ↓ down, → stable) with color coding
    - Rolling 7-day averages with metric icons
    - Streak counters with 🔥 emoji
    - Percentile progress bars (green/blue/yellow/gray)
    - Anomaly detection badges (⚠️ warning)
    - Last updated timestamps (relative time format)
    - Responsive grid layout (1/2/3 columns)
    - Empty state messaging
    - Info banner explaining analytics
  
  - **SummaryStats.jsx** (augmented) - Spark analytics augmentation
    - Freshness checking (<5 minutes old)
    - Time range mapping (week/month/year → 7day/30day/90day)
    - Graceful fallback to MongoDB if stale
    - ⚡ indicator when Spark data active
    - Automatic re-augmentation on analytics update

- **Dashboard.jsx** (enhanced):
  - Analytics state management: `analyticsData` (object keyed by metricType → timeRange)
  - `lastAnalyticsUpdate` timestamp tracking
  - `handleAnalyticsUpdate` callback for SSE events
  - `useRealtimeAnalytics` hook subscription
  - Conditional rendering of AnalyticsInsights
  - Analytics data passed to SummaryStats for augmentation

- **Features:**
  - Real-time Spark analytics via SSE (`analytics:update`, `analytics:batch_update`)
  - Batch event handling (up to 50 analytics per event)
  - Data structure: `{ metricType: { timeRange: analytics } }`
  - Event deduplication via existing LRU cache
  - Toast notifications for batch updates ("📊 Received N analytics")
  - Production-ready error handling and validation

- **Data Flow:**
  ```
  Spark (Python) → POST /api/events/emit (SERVICE_TOKEN)
    ↓
  SSE eventEmitter → /api/events/stream
    ↓
  Frontend EventSource → useRealtimeAnalytics hook
    ↓
  handleAnalyticsUpdate callback
    ↓
  analyticsData state { steps: { '7day': {...} } }
    ↓
  AnalyticsInsights (display) + SummaryStats (augment)
  ```

- **Freshness Logic:**
  - Analytics valid if `calculatedAt` < 5 minutes old
  - Fallback to MongoDB aggregation if stale
  - Automatic re-validation when new events arrive
  - ⚡ indicator shows when Spark data active


#### **10. Date Utilities & Formatting** (717 lines)
- **File:** `src/utils/dateUtils.js`
- **Features:**
  - Multiple date formatting functions:
    - Short format: `"Nov 04, 2025"`
    - Long format: `"Monday, November 4, 2025"`
    - ISO format: `"2025-11-04"`
    - Custom pattern format
  - Date range calculation functions:
    - Last 7/30/90/365 days
    - Current week/month/year
    - Custom date ranges
  - Date arithmetic (add/subtract days)
  - Date validation and parsing
  - Relative date labels ("Today", "Yesterday", "Last week", etc.)
  - Date comparison utilities
  - UTC midnight normalization (matches backend convention)
  - Date parsing from various inputs

#### **11. Client-Side Validation** (333 lines)
- **File:** `src/utils/validation.js`
- **Features:**
  - Email validation (format check)
  - Password validation (strength requirements matching backend)
  - Name validation (length, character type)
  - Password confirmation matching
  - Password strength calculation with feedback
  - Metrics value validation (ranges, types)
  - Goals value validation (ranges, types)
  - All validations match backend requirements exactly
  - Real-time validation feedback
  - Detailed error messages

#### **12. Reusable UI Components** 
- **Directory:** `src/components/common/`
- **Components:**
  - **Button.jsx** - Customizable button with variants, loading state, disabled state
  - **Input.jsx** - Text input with label, placeholder, error display, optional icons
  - **Card.jsx** - Container component with flexible styling
  - **Alert.jsx** - Alert/notification component with types (success, error, warning, info)
  - **PrivateRoute.jsx** - Route protection wrapper

#### **13. Page Components**
- **Home Page** (`pages/Home.jsx`) - Landing page
- **Dashboard Page** (`pages/Dashboard.jsx`) - Main application interface
- **Login Page** (`pages/Login.jsx`) - Authentication
- **Register Page** (`pages/Register.jsx`) - User registration
- **Not Found Page** (`pages/NotFound.jsx`) - 404 handling

#### **14. Application Routing** (170+ lines)
- **File:** `App.jsx`
- **Routes:**
  - Public: `/`, `/home`
  - Auth (redirect if logged in): `/login`, `/register`
  - Protected: `/dashboard`, `/profile`, `/settings`
  - Test: `/test/googlefit`
  - Catch-all: `*` (404)
- **Route Guards:**
  - AuthRoute: Redirects authenticated users from auth pages
  - PrivateRoute: Protects app routes
- **Features:**
  - Router-level loading states
  - Automatic auth status checks
  - Clean URL structure

#### **15. Development Utilities**
- **Window Exposure** - Services available in console during development
  - `window.authService`
  - `window.metricsService`
  - `window.goalsService`
  - `window.dateUtils`
- **Development Logging** - Comprehensive console logging with emojis
- **Debug Component** - `src/debug.js` for console utilities

---

## 📁 Project Structure

```
client/
├── public/                          # Static assets
│   └── vite.svg                    # Vite logo
│
├── src/
│   ├── api/                         # API configuration layer (285 lines)
│   │   └── axiosConfig.js          # ✅ Axios instance, interceptors, error handling (285 lines)
│   │
│   ├── context/                     # React Context for state management
│   │   └── AuthContext.jsx         # ✅ Global auth state, login/register/logout (447 lines)
│   │
│   ├── services/                    # API service layer (3893 lines total)
│   │   ├── authService.js          # ✅ Auth operations: register, login, getCurrentUser, logout (696 lines)
│   │   ├── metricsService.js       # ✅ Metrics CRUD: add, get, delete, summary (643 lines)
│   │   ├── goalsService.js         # ✅ Goals management: set, get, update, reset, progress (562 lines)
│   │   ├── googleFitService.js     # ✅ Google Fit OAuth: connect, status, disconnect (450 lines)
│   │   ├── eventService.js         # ✅ Real-time event management: SSE, deduplication (892 lines)
│   │   └── README.md               # Service layer documentation
│   │
│   ├── utils/                       # Utility functions (1295 lines total)
│   │   ├── LRUCache.js             # ✅ LRU cache for event deduplication (245 lines)
│   │   ├── dateUtils.js            # ✅ Date formatting, ranges, arithmetic (717 lines)
│   │   ├── validation.js           # ✅ Client-side validation matching backend (333 lines)
│   │   └── README.md               # Utilities documentation
│   │
│   ├── components/                  # Reusable React components
│   │   ├── common/                 # ✅ Reusable UI components
│   │   │   ├── Button.jsx          # ✅ Customizable button component
│   │   │   ├── Input.jsx           # ✅ Form input with validation display
│   │   │   ├── Card.jsx            # ✅ Container/card component
│   │   │   ├── Alert.jsx           # ✅ Alert/notification component
│   │   │   ├── PrivateRoute.jsx    # ✅ Route protection wrapper (139 lines)
│   │   │   └── README.md           # Component documentation
│   │   │
│   │   ├── auth/                   # Authentication components (future)
│   │   │   └── (empty - future use)
│   │   │
│   │   ├── dashboard/              # Dashboard-specific components
│   │   │   ├── MetricsForm.jsx     # Health metrics input form
│   │   │   ├── MetricCard.jsx      # Single metric card display
│   │   │   ├── MetricsList.jsx     # List of metrics with filtering
│   │   │   ├── SummaryStats.jsx    # ✅ Summary statistics (augmented with Spark analytics)
│   │   │   ├── GoalsSection.jsx    # ✅ Goals display and management
│   │   │   ├── GoogleFitConnection.jsx # ✅ Google Fit status
│   │   │   ├── AnalyticsInsights.jsx # ✅ Real-time Spark analytics display (315 lines)
│   │   │   ├── AnalyticsMonitor.jsx # ✅ Analytics monitoring
│   │   │   └── GoogleFitStatus.jsx # ✅ Google Fit connection status
│   │   │
│   │   ├── metrics/                # Metrics-specific components (future)
│   │   │   └── (organized for metrics features)
│   │   │
│   │   ├── charts/                 # Chart components using Recharts
│   │   │   └── (chart visualizations)
│   │   │
│   │   ├── layout/                 # Layout components
│   │   │   └── (app layout structure)
│   │   │
│   │   ├── test/                   # Test/debug components
│   │   │   └── GoogleFitTest.jsx   # Google Fit testing component
│   │   │
│   │   ├── debug/                  # Debug and monitoring components
│   │   │   └── EventDeduplicationDebug.jsx # ✅ Real-time deduplication monitoring (312 lines)
│   │   │
│   │   └── README.md               # Components documentation
│   │
│   ├── pages/                       # Page-level components (2400+ lines total)
│   │   ├── Home.jsx                # Landing page
│   │   ├── Login.jsx               # ✅ Login page with form (368 lines)
│   │   ├── Register.jsx            # ✅ Registration page with strength meter (465 lines)
│   │   ├── Dashboard.jsx           # ✅ Main app dashboard (1376 lines)
│   │   ├── NotFound.jsx            # 404 page
│   │   ├── auth/                   # Auth-related pages (future)
│   │   ├── dashboard/              # Dashboard variations (future)
│   │   └── README.md               # Pages documentation
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── README.md               # Hooks documentation
│   │   └── useRealtimeEvents.js    # ✅ Real-time event subscription hook (178 lines)
│   │
│   ├── layouts/                     # Layout wrapper components (future)
│   │   └── README.md               # Layouts documentation
│   │
│   ├── stores/                      # Zustand stores (future)
│   │   └── README.md               # Stores documentation
│   │
│   ├── assets/                      # Images, icons, fonts
│   │   └── README.md               # Assets documentation
│   │
│   ├── App.jsx                      # ✅ Main app component with routing (170 lines)
│   ├── App.css                      # Application styles
│   ├── main.jsx                     # ✅ App entry point with service exposure (45 lines)
│   ├── index.css                    # Global styles
│   ├── debug.js                     # Debug utilities
│   └── README.md                    # (This file)
│
├── App.css                          # Global application styles
├── App.jsx                          # Main app component with React Router
├── main.jsx                         # Application entry point
├── index.css                        # Tailwind CSS imports
├── debug.js                         # Debugging utilities
├── vite.config.js                   # ✅ Vite configuration with API proxy
├── tailwind.config.js               # ✅ Tailwind CSS config with primary colors
├── postcss.config.js                # PostCSS configuration with Tailwind
├── index.html                       # HTML entry point
├── package.json                     # ✅ Dependencies and scripts
├── package-lock.json                # Locked dependency versions
├── eslint.config.js                 # ESLint configuration
├── .gitignore                       # Git ignore rules
└── README.md                        # Frontend README
│   │   ├── metrics/                # Metrics-specific components (empty)
│   │   └── README.md
│   ├── context/                     # React Context providers
│   │   └── AuthContext.jsx         # Authentication context + useAuth hook
│   ├── hooks/                       # Custom React hooks
│   │   └── README.md
│   ├── layouts/                     # Page layouts (empty)
│   │   └── README.md
│   ├── pages/                       # Full page components
│   │   ├── auth/                   # Auth-related pages (empty)
│   │   ├── dashboard/              # Dashboard views (empty)
│   │   ├── Dashboard.jsx           # Main dashboard page (IMPLEMENTED)
│   │   ├── Home.jsx                # Landing page (IMPLEMENTED)
│   │   ├── Login.jsx               # Login page (IMPLEMENTED)
│   │   ├── Register.jsx            # Registration page (IMPLEMENTED)
│   │   ├── NotFound.jsx            # 404 error page (IMPLEMENTED)
│   │   └── README.md
│   ├── services/                    # API service layer
│   │   ├── authService.js          # Authentication API calls (IMPLEMENTED)
│   │   │   ├── goalsService.js     # Goals API calls (IMPLEMENTED)
│   │   │   ├── metricsService.js   # Health metrics API calls (IMPLEMENTED)
│   │   └── README.md
│   ├── stores/                      # Zustand stores (empty)
│   │   └── README.md
│   ├── utils/                       # Helper functions
│   │   ├── dateUtils.js            # Date formatting utilities (IMPLEMENTED)
│   │   ├── validation.js           # Form validation helpers (IMPLEMENTED)
│   │   └── README.md
│   ├── App.jsx                      # Root component with routing (IMPLEMENTED)
│   ├── App.css                      # App-level styles
│   ├── main.jsx                     # Entry point
│   ├── index.css                    # Global styles + Tailwind imports
│   ├── debug.js                     # Debug utilities
│   └── README.md                    # This file
├── index.html                       # HTML entry point
├── vite.config.js                   # Vite configuration + API proxy
├── tailwind.config.js               # Tailwind theme customization
├── postcss.config.js                # PostCSS config for Tailwind v4
├── eslint.config.js                 # ESLint configuration
├── package.json                     # Dependencies and scripts
└── .gitignore

```

---

## 🧩 Implemented Components

### **Common Components** (`components/common/`)

#### `Alert.jsx` ✅
Alert/notification component with multiple variants:
```jsx
<Alert 
  type="success" // or "error", "warning", "info"
  title="Success!"
  message="Your data has been saved."
  onClose={handleClose}
  dismissible
/>
```
Features:
- Multiple types: success, error, warning, info
- Optional title and dismissible close button
- Auto-hide with customizable duration
- Icon display based on type

#### `Button.jsx` ✅
Reusable button with multiple variants and sizes:
```jsx
<Button 
  variant="primary" // or "secondary", "danger"
  size="md" // or "sm", "lg"
  onClick={handleClick}
  disabled={isLoading}
>
  Click Me
</Button>
```
Features:
- Variants: primary (blue), secondary (gray), danger (red)
- Sizes: sm, md, lg
- Loading states
- Disabled states
- Full Tailwind customization

#### `Card.jsx` ✅
Flexible card container component:
```jsx
<Card className="p-6">
  <h2>Card Title</h2>
  <p>Card content goes here</p>
</Card>
```
Features:
- White background with border
- Rounded corners
- Shadow on hover
- Fully customizable with className

#### `Input.jsx` ✅
Form input with validation feedback:
```jsx
<Input
  label="Email"
  type="email"
  name="email"
  value={email}
  onChange={handleChange}
  error={errors.email}
  placeholder="Enter your email"
  required
/>
```
Features:
- Label support
- Error message display
- Red border on error
- Required indicator
- Multiple input types

#### `PrivateRoute.jsx` ✅
Protected route wrapper for authentication:
```jsx
<Route 
  path="/dashboard" 
  element={
    <PrivateRoute>
      <Dashboard />
    </PrivateRoute>
  } 
/>
```
Features:
- Checks authentication status from AuthContext
- Redirects to login if not authenticated
- Preserves intended destination
- Used for all protected pages

### **Dashboard Components** (`components/dashboard/`)

#### `GoalsForm.jsx` ✅
Form for creating and editing user fitness goals:
```jsx
<GoalsForm
  initialGoals={currentGoals}
  onSuccess={(goals) => console.log('Goals saved:', goals)}
  onError={(error) => console.error('Error:', error)}
/>
```
Features:
- Input fields for all 5 goal types
- Client-side validation with range checking
- Real-time error feedback
- Loading states during submission
- Pre-fill with existing goals for editing
- Clear form functionality

Goal Types:
- Weight Goal: 30-300 kg
- Step Goal: 1,000-50,000 steps/day
- Sleep Goal: 4-12 hours
- Calorie Goal: 500-5,000 cal/day
- Distance Goal: 0.5-100 km

#### `GoalsSection.jsx` ✅
Display current goals with progress tracking:
```jsx
<GoalsSection
  onGoalsUpdate={(goals) => setGoals(goals)}
  todayMetrics={todayMetrics}
/>
```
Features:
- Display all user goals with progress bars
- Visual progress indicators (0-100%)
- Achievement badges for completed goals
- Edit button opens modal with GoalsForm
- Refresh functionality
- Empty state for new users
- Responsive grid layout (1 col mobile, 3 col desktop)

#### `MetricCard.jsx` ✅
Individual metric display card with icon and trend:
```jsx
<MetricCard
  title="Steps"
  value={8500}
  unit="steps"
  icon="👟"
  trend={{ direction: 'up', percentage: 12 }}
  color="blue"
  goal={10000}
/>
```
Features:
- Icon display
- Large value with unit
- Trend indicator (up/down arrows with percentage)
- Goal comparison
- Color variants (blue, green, purple, red)
- Responsive design

#### `MetricsForm.jsx` ✅
Form for adding daily health metrics:
```jsx
<MetricsForm
  onSuccess={() => console.log('Metrics saved')}
  onError={(error) => console.error('Error:', error)}
/>
```
Features:
- Date picker (defaults to today)
- Input fields for all metric types
- Client-side validation
- Loading states
- Success/error notifications
- Form reset after submission

Metric Types:
- Steps (number)
- Calories (number)
- Distance (km)
- Active Minutes (number)
- Weight (kg)
- Sleep Hours (decimal)
- Heart Rate (bpm)

#### `MetricsList.jsx` ✅
List display of health metrics with date filtering:
```jsx
<MetricsList
  dateRange={{ start: '2025-11-01', end: '2025-11-07' }}
  onMetricsChange={() => loadMetrics()}
/>
```
Features:
- Date range filtering (last 7 days, last 30 days, custom)
- Display all metrics for each date
- Edit and delete functionality
- Formatted dates (e.g., "November 4, 2025")
- Icon indicators for each metric type
- Sorted by date (newest first)
- Empty state when no metrics

#### `SummaryStats.jsx` ✅
Summary statistics display with period selection:
```jsx
<SummaryStats
  period="week" // or "month", "year"
  onPeriodChange={(period) => setPeriod(period)}
/>
```
Features:
- Period selector (week, month, year)
- Total and average calculations
- Visual stat cards
- Loading states
- Error handling
- Responsive grid layout

### **Layout Components** (`components/layout/`)

#### `Header.jsx` ✅
Application header with navigation:
```jsx
<Header />
```
Features:
- App logo/title
- Navigation links
- User menu with dropdown
- Logout functionality
- Responsive mobile menu
- Active link highlighting

#### `Layout.jsx` ✅
Main layout wrapper for pages:
```jsx
<Layout>
  <Dashboard />
</Layout>
```
Features:
- Wraps page content
- Includes Header component
- Footer (optional)
- Consistent spacing and styling
- Full-width or container options

### **Context** (`context/`)

#### `AuthContext.jsx` ✅
Authentication context provider with useAuth hook:
```jsx
// In App.jsx
<AuthProvider>
  <App />
</AuthProvider>

// In any component
const { user, login, logout, isAuthenticated } = useAuth();
```
Features:
- User state management
- Login function with token storage
- Logout function with cleanup
- Register function
- Authentication status check
- Automatic token persistence
- Loading states

Methods:
- `login(email, password)` - Authenticate user
- `register(userData)` - Create new account
- `logout()` - Clear authentication
- `updateProfile(userData)` - Update user data

---

## 📡 Services Layer

### **Auth Service** (`services/authService.js`) ✅

Complete authentication API integration:

```javascript
import * as authService from '../services/authService';

// Register new user
const result = await authService.register({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'securePassword123'
});

// Login
const result = await authService.login({
  email: 'john@example.com',
  password: 'securePassword123'
});

// Get current user
const result = await authService.getCurrentUser();

// Update profile
const result = await authService.updateProfile({
  name: 'John Updated'
});

// Logout
await authService.logout();
```

### **Goals Service** (`services/goalsService.js`) ✅

Complete goals management API:

```javascript
import * as goalsService from '../services/goalsService';

// Set goals (create or update)
const result = await goalsService.setGoals({
  weightGoal: 70,
  stepGoal: 10000,
  sleepGoal: 8,
  calorieGoal: 2000,
  distanceGoal: 5
});

// Get current goals
const result = await goalsService.getGoals();

// Update specific goals (partial update)
const result = await goalsService.updateGoals({
  stepGoal: 12000
});

// Reset to defaults
const result = await goalsService.resetGoals();

// Get goal progress for today
const result = await goalsService.getGoalProgress();
```

Helper functions:
- `calculateProgress(current, goal)` - Calculate percentage
- `isGoalAchieved(current, goal)` - Check if achieved
- `formatGoalDisplay(type, value)` - Format for display

### **Metrics Service** (`services/metricsService.js`) ✅

Complete health metrics API integration:

```javascript
import * as metricsService from '../services/metricsService';

// Add or update metrics
const result = await metricsService.addOrUpdateMetrics({
  date: '2025-11-04',
  metrics: {
    steps: 8500,
    calories: 1850,
    distance: 6.5,
    activeMinutes: 45,
    weight: 72,
    sleepHours: 7.5,
    heartRate: 68
  }
});

// Get metrics by date range
const result = await metricsService.getMetricsByDateRange(
  '2025-11-01',
  '2025-11-07'
);

// Get metrics for specific date
const result = await metricsService.getMetricsByDate('2025-11-04');

// Get latest metrics
const result = await metricsService.getLatestMetrics();

// Delete metrics
const result = await metricsService.deleteMetrics('2025-11-04');

// Get summary statistics
const result = await metricsService.getSummary('week'); // or 'month', 'year'
```

---

## 🎯 Pages

### **Home.jsx** ✅
Landing page with hero section:
- Welcome message
- Feature highlights
- CTA buttons (Login, Register)
- Responsive design
- Navigation to auth pages

### **Login.jsx** ✅
User login page:
- Email and password inputs
- Form validation
- Error handling
- "Remember me" option
- Link to registration
- Redirect to dashboard on success

### **Register.jsx** ✅
User registration page:
- Name, email, password inputs
- Password confirmation
- Password strength indicator
- Form validation
- Error handling
- Link to login
- Redirect to dashboard on success

### **Dashboard.jsx** ✅
Main dashboard page with comprehensive state management:

Features:
- Today's metrics display with MetricCard
- Metrics input form (MetricsForm)
- Metrics history list (MetricsList)
- Summary statistics (SummaryStats)
- Goals section (GoalsSection)
- Date range filtering
- Trend analysis
- Refresh functionality
- Loading states
- Error handling

State Management:
- Metrics state (today, all, loading, errors)
- Goals state
- Summary stats (weekly, monthly, yearly)
- UI state (form visibility, refreshing)
- Date range selection
- Alert notifications

### **NotFound.jsx** ✅
404 error page:
- "Page not found" message
- Link back to home
- Custom styling

---

## 🚀 Setup Instructions

### Prerequisites

- **Node.js v18+** installed (check with `node --version`)
- **Backend server** configured and running (see `server/README.md`)
- **MongoDB database** running (Atlas recommended for production)
- **Modern web browser** (Chrome, Firefox, Safari, Edge)

### Quick Start

1. **Navigate to client directory**
   ```bash
   cd health-metrics-monitoring-system/client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment (optional)**
   ```bash
   cp .env.example .env
   # Edit .env with your backend URL if different from default
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   - Navigate to `http://localhost:5173`
   - Register/login to access dashboard

### Complete Setup Process

#### 1. Backend Setup (Required)
```bash
# Terminal 1: Start backend server
cd ../server
npm install
npm run dev
```
Expected backend output:
```
✅ MongoDB Connected: cluster0.mongodb.net
🚀 SERVER STARTED SUCCESSFULLY
Port: 5000
Base URL: http://localhost:5000
```

#### 2. Frontend Setup
```bash
# Terminal 2: Start frontend
cd client
npm install
npm run dev
```
Expected frontend output:
```
VITE v7.1.7  ready in 234 ms
➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

#### 3. Environment Configuration
Create `.env` file in `client/` directory:
```env
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Application Configuration
VITE_APP_NAME=Health Metrics Monitoring System
VITE_APP_VERSION=1.0.0

# Environment
VITE_NODE_ENV=development

# Token Configuration
VITE_TOKEN_KEY=health_metrics_token

# Feature Flags
VITE_ENABLE_GOOGLE_FIT=false
VITE_ENABLE_ANALYTICS=false

# API Timeouts
VITE_API_TIMEOUT=10000
```

#### 4. First-Time User Setup
1. **Open browser** to `http://localhost:5173`
2. **Register** a new account with strong password
3. **Login** with your credentials
4. **Access dashboard** - you're ready to track metrics!

#### 5. Test Real-Time Features
- Add health metrics in dashboard
- Open browser DevTools → Console
- Services are exposed for testing: `window.authService`, `window.metricsService`
- Test SSE connection: Check for real-time updates

### Development Workflow

**Start Both Servers:**
```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend  
cd client && npm run dev
```

**Access Points:**
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/api/health

### Troubleshooting

**Port Conflicts:**
- Frontend uses port 5173 (Vite default)
- Backend uses port 5000 (configured in server)
- Change ports in respective config files if needed

**API Connection Issues:**
- Ensure backend is running on port 5000
- Check VITE_API_URL in client/.env
- Verify CORS settings in backend

**Build Issues:**
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (must be 18+)
- Verify all dependencies installed: `npm ls`

---

## 💻 Development

### Available Scripts

```bash
# Start dev server with HMR on port 5173
npm run dev

# Build for production (outputs to dist/)
npm run build

# Preview production build locally
npm run preview

# Run linter
npm run lint
```

### Development Workflow

1. **Start backend server** (in separate terminal)
   ```bash
   cd server
   npm run dev
   ```

2. **Start frontend dev server**
   ```bash
   cd client
   npm run dev
   ```

3. **Development cycle:**
   - Make changes to components
   - Vite automatically reloads with HMR
   - Check browser console for errors
   - Test in different screen sizes

4. **API Integration:**
   - All `/api/*` requests automatically proxy to backend
   - JWT tokens attached via Axios interceptors
   - Check Network tab for API calls

### Hot Module Replacement (HMR)

- Changes to components update instantly without full page reload
- React state preserved during updates
- CSS changes apply immediately
- Console logs errors and warnings

### Debugging Tips

**React DevTools:**
- Install React DevTools browser extension
- Inspect component tree
- View props and state
- Profile performance

**Console Debugging:**
```javascript
// In any component
console.log('Debug:', { user, metrics, goals });
```

**Network Debugging:**
- Open DevTools → Network tab
- Filter: XHR/Fetch
- Check request/response payloads
- Verify status codes (200, 401, 500, etc.)

**Authentication Issues:**
```javascript
// Check token in console
localStorage.getItem('token')

// Clear auth and re-login
localStorage.removeItem('token')
```

---

## 🎨 Styling Guide

### Tailwind CSS v4

This project uses **Tailwind CSS v4** with PostCSS integration.

**Global Styles** (`src/index.css`):
```css
@import "tailwindcss";

/* Custom utility classes are defined here */
```

### Custom Utility Classes

Pre-defined in `index.css`:

**Buttons:**
```jsx
<button className="btn-primary">Primary Action</button>
<button className="btn-secondary">Secondary Action</button>
```

**Inputs:**
```jsx
<input className="input-field" type="text" placeholder="Enter text" />
```

**Cards:**
```jsx
<div className="card">
  <h2>Card Title</h2>
  <p>Card content</p>
</div>
```

### Custom Color Palette

Primary blue shades (defined in `tailwind.config.js`):

```jsx
// Usage examples
<div className="bg-primary-50">Lightest</div>
<div className="bg-primary-500">Medium</div>
<div className="bg-primary-900">Darkest</div>
<h1 className="text-primary-600">Heading</h1>
```

**Available shades:** 50, 100, 200, 300, 400, 500, 600, 700, 800, 900

### Font Family

Default sans-serif stack with Inter:
```jsx
<p className="font-sans">Text with Inter font</p>
```

---

## 🗂 State Management

### Authentication State - AuthContext ✅

**Implementation:** `context/AuthContext.jsx`

```javascript
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { 
    user,              // Current user object
    isAuthenticated,   // Boolean auth status
    isLoading,         // Loading state
    login,             // Login function
    register,          // Register function
    logout,            // Logout function
    updateProfile      // Update user function
  } = useAuth();
  
  // Usage
  const handleLogin = async () => {
    const result = await login('user@example.com', 'password123');
    if (result.success) {
      // Redirect or show success
    }
  };
  
  return <div>Welcome, {user?.name}</div>;
}
```

**Features:**
- Centralized auth state
- Persistent authentication (localStorage)
- Automatic token management
- Login/logout/register methods
- User profile updates
- Loading states

### Zustand Stores (Planned)

**Metrics Store** (`stores/metricsStore.js` - To be implemented):
```javascript
import { create } from 'zustand';

export const useMetricsStore = create((set) => ({
  metrics: [],
  isLoading: false,
  fetchMetrics: async (dateRange) => {
    set({ isLoading: true });
    // Fetch logic
    set({ metrics: data, isLoading: false });
  },
  addMetric: (metric) => set((state) => ({ 
    metrics: [...state.metrics, metric] 
  })),
}));
```

**Goals Store** (`stores/goalsStore.js` - To be implemented):
- User goals state
- Progress tracking
- Goal CRUD operations

---

## 🔌 API Integration

### Axios Configuration ✅

**File:** `api/axiosConfig.js`

Centralized Axios instance with interceptors:

```javascript
import axiosInstance from '../api/axiosConfig';

// All requests automatically include:
// 1. Authorization header with JWT token
// 2. Content-Type: application/json
// 3. Error handling and retries
```

**Features:**
- Automatic JWT token attachment from localStorage
- Request interceptors for authentication
- Response interceptors for error handling
- Automatic 401 (Unauthorized) redirect to login
- Base URL configuration
- Timeout settings

### Vite Proxy Configuration ✅

**File:** `vite.config.js`

All `/api/*` requests are proxied to backend:

```javascript
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
  },
}
```

**How it works:**
```
Frontend Request: http://localhost:5173/api/auth/login
      ↓ (Vite proxy)
Backend Receives: http://localhost:5000/api/auth/login
```

### Service Layer Pattern

All API calls go through service files:

```javascript
// ❌ Don't do this in components
const response = await axios.get('/api/metrics');

// ✅ Do this instead
import * as metricsService from '../services/metricsService';
const result = await metricsService.getLatestMetrics();
```

**Benefits:**
- Centralized API logic
- Consistent error handling
- Easier testing and mocking
- Type safety (if using TypeScript)
- Reusable across components

### Error Handling Pattern

All services return consistent response format:

```javascript
// Success response
{
  success: true,
  data: { ... },
  message: "Operation successful"
}

// Error response
{
  success: false,
  message: "Error description",
  error: { ... }
}
```

Usage in components:
```javascript
const result = await metricsService.addMetrics(data);

if (result.success) {
  console.log('Success:', result.data);
} else {
  console.error('Error:', result.message);
}
```

---

## 🛣 Routing

### React Router Setup ✅

**File:** `App.jsx`

Complete routing with authentication:

```jsx
<AuthProvider>
  <Router>
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
  </Router>
</AuthProvider>
```

### Route Protection

**How it works:**
1. User tries to access `/dashboard`
2. `PrivateRoute` checks `isAuthenticated` from AuthContext
3. If authenticated: renders Dashboard
4. If not: redirects to `/login` with return URL

```jsx
// PrivateRoute.jsx implementation
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  
  if (isLoading) return <div>Loading...</div>;
  
  return isAuthenticated 
    ? children 
    : <Navigate to="/login" state={{ from: location }} replace />;
};
```

### Navigation

**Programmatic Navigation:**
```javascript
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();
  
  const handleSuccess = () => {
    navigate('/dashboard');
  };
}
```

**Link Navigation:**
```jsx
import { Link } from 'react-router-dom';

<Link to="/dashboard">Go to Dashboard</Link>
```

---

## 🧩 Component Organization

### Component Structure

```
components/
├── auth/                    # Authentication components (empty)
├── charts/                  # Chart wrapper components (empty)
├── common/                  # ✅ Reusable UI components (IMPLEMENTED)
│   ├── Alert.jsx           # ✅ Alert notifications
│   ├── Button.jsx          # ✅ Button component
│   ├── Card.jsx            # ✅ Card container
│   ├── Input.jsx           # ✅ Form input
│   └── PrivateRoute.jsx    # ✅ Route protection
├── dashboard/               # ✅ Dashboard components (IMPLEMENTED)
│   ├── GoalsForm.jsx       # ✅ Goals input form
│   ├── GoalsSection.jsx    # ✅ Goals display + progress
│   ├── MetricCard.jsx      # ✅ Metric display card
│   ├── MetricsForm.jsx     # ✅ Health metrics form
│   ├── MetricsList.jsx     # ✅ Metrics history list
│   └── SummaryStats.jsx    # ✅ Summary statistics
├── layout/                  # ✅ Layout components (IMPLEMENTED)
│   ├── Header.jsx          # ✅ App header/nav
│   └── Layout.jsx          # ✅ Page wrapper
└── metrics/                 # Metrics-specific components (empty)
```

### Component Naming Conventions

- **PascalCase** for component names: `MetricCard.jsx`
- **camelCase** for variables and functions: `handleSubmit`
- **SCREAMING_SNAKE_CASE** for constants: `API_BASE_URL`
- **Descriptive names**: `MetricsForm` not `Form1`

### Component Best Practices

**1. Single Responsibility**
```jsx
// ✅ Good - one purpose
function MetricCard({ metric }) {
  return <div>...</div>;
}

// ❌ Bad - too many responsibilities
function DashboardEverything() {
  // handles form, display, API calls, routing...
}
```

**2. Props Validation**
```jsx
import PropTypes from 'prop-types';

Button.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(['primary', 'secondary']),
};
```

**3. Composition over Inheritance**
```jsx
// ✅ Good - composition
<Card>
  <MetricCard metric={data} />
</Card>

// ❌ Bad - inheritance
class MetricCard extends Card { }
```

---

## 🛠 Utilities

### Date Utilities (`utils/dateUtils.js`) ✅

Helper functions for date manipulation:

```javascript
import * as dateUtils from '../utils/dateUtils';

// Format date for display
const formatted = dateUtils.formatDate('2025-11-04'); 
// "November 4, 2025"

// Format for API (ISO format: YYYY-MM-DD)
const apiDate = dateUtils.formatDateISO(new Date());
// "2025-11-04"

// Get date ranges
const last7Days = dateUtils.getLast7Days();
// { start: "2025-10-28", end: "2025-11-04" }

const last30Days = dateUtils.getLast30Days();
const thisMonth = dateUtils.getThisMonth();
const thisYear = dateUtils.getThisYear();

// Check if date is today
const isToday = dateUtils.isToday('2025-11-04'); // true/false

// Parse date strings
const date = dateUtils.parseDate('2025-11-04');
```

### Validation Utilities (`utils/validation.js`) ✅

Form validation helpers:

```javascript
import * as validation from '../utils/validation';

// Email validation
const isValid = validation.validateEmail('user@example.com');

// Password strength
const strength = validation.validatePassword('MyPass123!');
// { isValid: true, strength: 'strong', errors: [] }

// Number validation
const isValidNumber = validation.isValidNumber(123);
const isInRange = validation.isInRange(50, 1, 100);

// Required field check
const hasValue = validation.isRequired('some value');
```

---

## 📜 Scripts Breakdown

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Start dev server on port 5173 with HMR |
| `build` | `vite build` | Build production bundle to `dist/` |
| `preview` | `vite preview` | Preview production build locally |
| `lint` | `eslint .` | Run ESLint on all files |

### Build Output

Production build creates optimized files in `dist/`:
```
dist/
├── index.html              # Entry HTML
├── assets/
│   ├── index-[hash].js    # Bundled JavaScript
│   ├── index-[hash].css   # Bundled CSS
│   └── [other assets]
```

**Optimizations:**
- Code splitting
- Tree shaking
- Minification
- Asset optimization
- Source maps (optional)

---

## 🔧 Configuration Files

### `vite.config.js` ✅
- React plugin for JSX support (`@vitejs/plugin-react`)
- Dev server configuration (port 5173)
- API proxy to backend (port 5000)
- Build options and optimizations

### `tailwind.config.js` ✅
- Custom primary color palette (50-900 shades)
- Inter font family configuration
- Content paths for Tailwind purging
- Custom utilities and components

### `postcss.config.js` ✅
- Tailwind CSS v4 PostCSS plugin (`@tailwindcss/postcss`)
- Autoprefixer for vendor prefixes
- CSS optimization

### `eslint.config.js` ✅
- React-specific linting rules
- React Hooks rules enforcement
- React Refresh plugin integration
- ES2020+ syntax support

### `package.json` ✅
Main dependencies:
- `react@^19.2.0` - UI library
- `react-dom@^19.2.0` - React DOM renderer
- `react-router-dom@^7.9.4` - Routing
- `axios@^1.12.2` - HTTP client
- `tailwindcss@^4.1.14` - CSS framework
- `zustand@^5.0.8` - State management (installed, not implemented)
- `recharts@^3.3.0` - Charts library (installed, not implemented)
- `date-fns@^4.1.0` - Date utilities

---

## 🎣 Custom Hooks

### `useRealtimeEvents` Hook (`hooks/useRealtimeEvents.js`) ✅

Custom React hook for subscribing to real-time events:

```javascript
import { useRealtimeEvents } from '../hooks/useRealtimeEvents';

function MyComponent() {
  const { isConnected, lastEvent } = useRealtimeEvents('metrics:change', (eventData) => {
    console.log('Received metrics change:', eventData);
    // Handle the event
  });

  return (
    <div>
      <p>Connection Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <p>Last Event: {lastEvent ? JSON.stringify(lastEvent) : 'None'}</p>
    </div>
  );
}
```

Features:
- Automatic event subscription on mount
- Cleanup on unmount
- Connection status monitoring
- Event filtering and processing
- Error handling and retry logic
- TypeScript-ready interface

---

## 🔍 Debug Components

### `EventDeduplicationDebug` Component (`components/debug/EventDeduplicationDebug.jsx`) ✅

Real-time monitoring component for event deduplication:

```jsx
import EventDeduplicationDebug from '../components/debug/EventDeduplicationDebug';

function Dashboard() {
  return (
    <div>
      {/* Other dashboard content */}
      <EventDeduplicationDebug />
    </div>
  );
}
```

Features:
- Live deduplication statistics display
- Cache size and performance metrics
- Event history with timestamps
- Manual cache clearing functionality
- Real-time updates via event subscriptions
- Developer-friendly debugging interface

---

## 🚧 Development Status

### ✅ **Completed Features (Production Ready - 100%)**

**Authentication System (100%)**
- ✅ JWT-based authentication with AuthContext and SSE integration
- ✅ Login page with comprehensive form validation and error handling
- ✅ Registration page with real-time password strength indicator
- ✅ Protected routes with automatic redirects and loading states
- ✅ Persistent authentication with localStorage token management
- ✅ Automatic SSE connection establishment on login/registration
- ✅ Logout with SSE disconnection and state cleanup

**Dashboard & Metrics Management (100%)**
- ✅ Comprehensive dashboard with real-time updates (2042 lines)
- ✅ Health metrics display with today's data and previous day comparison
- ✅ Advanced metrics input form with validation and real-time feedback
- ✅ Metrics history list with date range filtering and pagination
- ✅ Summary statistics with period-based calculations (week/month/year)
- ✅ Goals management with progress tracking and achievement visualization
- ✅ Google Fit integration status and sync controls
- ✅ Auto-refresh functionality with real-time data synchronization
- ✅ Responsive design optimized for mobile, tablet, and desktop

**Real-Time Features (100%)**
- ✅ Server-Sent Events (SSE) with comprehensive connection management
- ✅ Event service with state machine, reconnection, and error handling
- ✅ Event deduplication using LRU cache with automatic expiry
- ✅ Custom useRealtimeEvents hook for component subscriptions
- ✅ Real-time dashboard updates with optimistic UI feedback
- ✅ Connection status monitoring and user-friendly error messages
- ✅ Event deduplication debug interface for development
- ✅ Centralized event distribution to prevent multiple subscriptions

**Analytics Integration with Spark (100% - NEW ✅)**
- ✅ AnalyticsInsights component with visual indicators (315 lines)
  - Trend arrows (↑↓→) with color coding
  - Rolling 7-day averages with metric icons
  - Streak counters with 🔥 emoji
  - Percentile progress bars with color scaling
  - Anomaly detection badges (⚠️)
  - Relative timestamps ("X minutes ago")
- ✅ SummaryStats augmentation with Spark data
  - Freshness checking (<5 minutes old)
  - Graceful fallback to MongoDB if stale
  - ⚡ indicator when Spark data active
  - Automatic re-augmentation on new events
- ✅ Dashboard analytics event subscription
  - Batch event handling (up to 50 analytics)
  - Analytics state management (metricType → timeRange)
  - Event deduplication via existing LRU cache
  - Toast notifications for batch updates
- ✅ Real-time data flow: Spark → SSE → React → UI
- ✅ Production-ready error handling and validation

**UI Components Library (100%)**
- ✅ Alert component with multiple types and auto-hide functionality
- ✅ Button component with variants, loading states, icons, and accessibility
- ✅ Card container with flexible styling and responsive design
- ✅ Input component with validation feedback and error display
- ✅ PrivateRoute wrapper with authentication checking and redirects
- ✅ Toast notification system with queue management
- ✅ ConnectionStatusBanner for real-time connection status display

**API Integration & Services (100%)**
- ✅ Axios configuration with request/response interceptors and error handling
- ✅ Comprehensive auth service with validation and token management
- ✅ Metrics service with full CRUD operations and data validation
- ✅ Goals service with management, progress calculation, and updates
- ✅ Google Fit service with OAuth flow and sync operations
- ✅ Event service with SSE connection and real-time event handling

**Routing & Navigation (100%)**
- ✅ React Router v7 with modern routing patterns and data handling
- ✅ Public routes (Home, Login, Register) with auth redirects
- ✅ Protected routes (Dashboard) with authentication guards
- ✅ Test routes for development and debugging
- ✅ 404 Not Found page with user-friendly messaging
- ✅ Automatic redirects based on authentication state

**Styling & Design System (100%)**
- ✅ Tailwind CSS v4 with @tailwindcss/postcss plugin integration
- ✅ Custom primary color palette (50-900 range) with consistent theming
- ✅ Custom utility classes and component styling
- ✅ Responsive design with mobile-first approach
- ✅ Custom animations and transitions for enhanced UX
- ✅ Consistent design system across all components

**Utility Functions & Validation (100%)**
- ✅ Comprehensive date utilities (717 lines) for formatting and calculations
- ✅ Client-side validation matching backend requirements exactly
- ✅ LRU cache implementation for event deduplication
- ✅ Development console service exposure for debugging

### ⏳ **Future Enhancements (Not Yet Implemented)**

**Data Visualization (0%)**
- ⏳ Recharts integration for interactive charts and graphs
- ⏳ Trend analysis visualizations
- ⏳ Comparative data displays
- ⏳ Progress tracking charts

**Advanced State Management (0%)**
- ⏳ Zustand stores implementation (library installed)
- ⏳ Complex state logic extraction from components
- ⏳ Global state optimization

**User Experience Improvements (0%)**
- ⏳ Dark mode theme toggle
- ⏳ Profile management page
- ⏳ Settings and preferences page
- ⏳ Data export functionality
- ⏳ Enhanced accessibility features

**Social & Sharing Features (0%)**
- ⏳ Progress sharing capabilities
- ⏳ Social connections and comparisons
- ⏳ Achievement system and badges
- ⏳ Leaderboards
- ⏳ Challenges

**Mobile**
- ⏳ Progressive Web App (PWA)
- ⏳ Offline support
- ⏳ Push notifications
- ⏳ Native app (React Native)

---

## 📝 Development Notes

### Important Considerations

**ES Modules Only:**
- All code uses `import/export` syntax
- No `require()` or `module.exports`
- `"type": "module"` in package.json

**React 19 Features:**
- Latest hooks and features available
- Check library compatibility before adding new packages
- Use concurrent features when appropriate

**Tailwind v4:**
- New PostCSS-based approach
- No traditional `tailwind.config.js` processing
- Uses `@import "tailwindcss"` in CSS

**Vite Proxy:**
- All `/api/*` requests forward to backend
- Development only (production uses actual API URL)
- No CORS issues in development

**Ports:**
- Frontend dev server: `5173`
- Backend server: `5000`
- MongoDB: `27017` (local) or Atlas (cloud)

---

## 🚀 Setup Instructions

### Prerequisites

- Node.js v18+ installed
- npm or yarn
- Backend server running on `http://localhost:5000`

### Installation Steps

**1. Install Dependencies**
```bash
cd client
npm install
```

**2. Start Development Server**
```bash
npm run dev
```

**Expected Output:**
```
  VITE v7.1.7  ready in 123 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h + enter to show help
```

**3. Open in Browser**
- Navigate to `http://localhost:5173`
- Login or register to access the dashboard

### Environment Configuration

Create `.env` file in `client/` directory (copy from `.env.example`):

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Application Configuration
VITE_APP_NAME=Health Metrics Monitoring System
VITE_APP_VERSION=1.0.0

# Environment
VITE_NODE_ENV=development

# Token Configuration
VITE_TOKEN_KEY=health_metrics_token

# Google Fit OAuth (Configure in Day 5)
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback

# Feature Flags
VITE_ENABLE_GOOGLE_FIT=false
VITE_ENABLE_ANALYTICS=false

# API Timeouts (milliseconds)
VITE_API_TIMEOUT=10000
VITE_REQUEST_RETRY_LIMIT=3
```

---

## 💻 Development Workflow

**1. Start Development Server**
```bash
npm run dev
```

**2. Make Changes**
- Edit files in `src/`
- Vite auto-reloads (HMR) immediately
- Check browser console for errors

**3. Test Components**
- Use browser DevTools
- Services exposed in console (development only)
- Import and test in browser console

### Code Quality Standards

**ES Modules Syntax (Required):**
```javascript
// ✅ Correct
import React from 'react';
export const MyComponent = () => {};

// ❌ Wrong - NOT supported
const React = require('react');
module.exports = MyComponent;
```

**Component Structure:**
```jsx
/**
 * ComponentName Component
 * @description Purpose of this component
 */
function ComponentName({ prop1, prop2 }) {
  const [state, setState] = useState(null);

  useEffect(() => {
    // Effect logic
  }, []);

  const handleEvent = () => {
    // Handler logic
  };

  return (
    <div>
      {/* JSX */}
    </div>
  );
}

export default ComponentName;
```

**Naming Conventions:**
- Components: PascalCase (`MetricsForm`, `DashboardPage`)
- Functions: camelCase (`handleSubmit`, `fetchMetrics`)
- Constants: SCREAMING_SNAKE_CASE (`MAX_METRICS`, `API_TIMEOUT`)
- Variables: camelCase (`userData`, `isLoading`)
- CSS classes: kebab-case (from Tailwind)

### Debugging Tips

**View Console Services (Dev Only):**
```javascript
// Services available as window properties
window.authService
window.metricsService
window.goalsService
window.dateUtils

// Test in console
window.authService.register({...})
window.metricsService.addMetric(...)
```

**Check localStorage:**
```javascript
// View token
localStorage.getItem('health_metrics_token')

// Clear storage
localStorage.clear()
```

**Common Issues:**

| Issue | Solution |
|-------|----------|
| `VITE_API_URL not found` | Restart dev server after editing .env.local |
| `Cannot find module` | Run `npm install` and restart dev server |
| `Port 5173 in use` | Use `npm run dev -- --port 5174` |
| `API calls fail` | Verify backend running on port 5000 |
| `Blank screen` | Check browser console, verify token in localStorage |

---

## 🎨 Styling System

### Tailwind CSS v4 Setup

Custom primary color palette:

```javascript
// tailwind.config.js
colors: {
  primary: {
    50: '#eff6ff',   // Lightest
    500: '#3b82f6',  // Main
    900: '#1e3a8a'   // Darkest
  }
}
```

**Usage:**
```jsx
<p className="text-primary-600">Primary text</p>
<div className="bg-primary-50">Light background</div>
<button className="bg-primary-500 hover:bg-primary-600">Button</button>
```

### Common Utility Patterns

```jsx
// Spacing
<div className="p-4 m-2 space-y-4">

// Typography
<h1 className="text-3xl font-bold">Heading</h1>

// Layout
<div className="flex items-center justify-between">

// Responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// States
<button className="hover:bg-gray-100 disabled:opacity-50">
```

---

## 🔄 State Management Patterns

### Using AuthContext

```jsx
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, login, logout, loading, isAuthenticated } = useAuth();

  const handleLogin = async () => {
    const result = await login({ email, password });
    if (result.success) {
      // Success
    }
  };

  if (!isAuthenticated) return <div>Please login</div>;
  return <div>Welcome, {user.name}</div>;
}
```

### Component State Pattern

```jsx
// For metrics
const [todayMetrics, setTodayMetrics] = useState(null);
const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);

// For UI
const [showForm, setShowForm] = useState(false);
const [alert, setAlert] = useState({ show: false, type: 'info' });
```

---

## 📡 API Integration

### Service Layer Pattern

All API calls go through `src/services/`:

```javascript
export const login = async (email, password) => {
  try {
    // 1. Validate input
    if (!email || !password) {
      return { success: false, message: 'Fields required' };
    }
    
    // 2. Make API call
    const response = await axiosInstance.post('/auth/login', {
      email, password
    });
    
    // 3. Handle response
    const { success, token, user } = response.data;
    if (success && token) {
      localStorage.setItem('health_metrics_token', token);
      return { success: true, user };
    }
    
    return { success: false };
  } catch (error) {
    return { success: false, message: error.message };
  }
};
```

### API Endpoints Used

**Authentication:**
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/logout` - Logout

**Metrics:**
- `POST /api/metrics` - Add/update metrics
- `GET /api/metrics` - Get by date range
- `GET /api/metrics/:date` - Get specific date
- `DELETE /api/metrics/:date` - Delete metrics
- `GET /api/metrics/summary/:period` - Summary stats
- `GET /api/metrics/latest` - Latest entry

**Goals:**
- `POST /api/goals` - Set/update goals
- `GET /api/goals` - Get goals
- `PUT /api/goals` - Partial update
- `DELETE /api/goals` - Reset to defaults
- `GET /api/goals/progress` - Get progress

---

## 🧪 Building for Production

### Build Command
```bash
npm run build
```

Creates optimized bundle in `dist/` directory.

### Preview Production Build
```bash
npm run preview
```

Tests the built version locally.

### Production Checklist
- [ ] Environment variables configured
- [ ] Backend API URL correct
- [ ] Remove console.log statements
- [ ] Test all features
- [ ] Verify on mobile
- [ ] Check CORS settings

---

## 📊 Code Statistics

**Frontend Codebase:**
- **Total Lines:** 7,600+
- **Services:** 3,001 lines
  - authService: 696 lines
  - metricsService: 643 lines
  - goalsService: 562 lines
  - googleFitService: 450 lines
- **Pages:** 2,400+ lines
  - Dashboard: 1,376 lines
  - Register: 465 lines
  - Login: 368 lines
- **Utilities:** 1,050+ lines
  - dateUtils: 717 lines
  - validation: 333 lines
- **Context:** 447 lines
- **API Config:** 285 lines

**Files:** 40+ total
**Components:** 10+ implemented
**Routes:** 8 total

---

## 🏗 Architecture Overview

### Component Hierarchy

```
App
├── AuthProvider
│   ├── AuthRoute
│   │   ├── Login
│   │   └── Register
│   ├── PrivateRoute
│   │   ├── Dashboard (with metrics, goals, forms)
│   │   └── Profile/Settings (placeholders)
│   ├── Home
│   └── NotFound (404)
```

### Data Flow

```
Component → Service Layer → Axios → Backend API
                              ↓
                        Response Interceptor
                              ↓
                        Format & Return
                              ↓
                        Component State
                              ↓
                        UI Re-render
```

---

## 📋 Development Status

### ✅ Completed (95%)

- [x] React 19 + Vite 7 setup
- [x] Tailwind CSS v4 configuration
- [x] Authentication system
- [x] AuthContext for global state
- [x] Private routes with protection
- [x] Axios configuration with interceptors
- [x] Health metrics service (643 lines)
- [x] Goals management service (562 lines)
- [x] Google Fit integration service (450 lines)
- [x] Date utilities (717 lines)
- [x] Validation utilities (333 lines)
- [x] Reusable UI components
- [x] Dashboard page
- [x] Login/Register pages
- [x] React Router v7 setup
- [x] API error handling
- [x] localStorage token persistence
- [x] Password strength indicator
- [x] Form validation

### ⏳ In Progress

- [ ] Chart components refinement
- [ ] Component optimization

### 📋 Planned

- [ ] Custom hooks (useMetrics, useGoals)
- [ ] Zustand store implementation
- [ ] Advanced charting
- [ ] Dark mode support
- [ ] Offline support
- [ ] Real-time updates

---

## 🔗 Related Documentation

- [Server API Documentation](../../server/README.md)
- [Architecture Documentation](../../ARCHITECTURE.md)
- [Tech Stack Details](../../TECH_STACK.md)
- [Main README](../../README.md)

---

## 🤝 Contributing

When adding features:

1. Follow existing patterns and code style
2. Update README with new features
3. Add JSDoc comments for functions
4. Test on mobile and desktop (320px, 768px, 1024px)
5. Validate forms (client and server-side)
6. Handle errors gracefully
7. Use meaningful commit messages

---

### Common Gotchas

1. **JWT Token Expiry:**
   - Tokens expire after 7 days
   - No automatic refresh yet
   - User must re-login

2. **Form Validation:**
   - Client-side validation is NOT security
   - Always validate on backend too
   - Display user-friendly error messages

3. **Date Handling:**
   - Always use ISO 8601 format for API
   - Display dates in user's locale
   - Handle timezone differences

4. **State Management:**
   - Use AuthContext for authentication
   - Consider Zustand for complex state
   - Avoid prop drilling

5. **Performance:**
   - Use React.memo for expensive components
   - Implement pagination for large lists
   - Lazy load routes and components

---

**Last Updated:** November 16, 2025

**Development Phase:** ✅ Core Features Complete | ✅ Real-Time Features Complete | ⏳ Ready for Data Visualization

**Status:** 🟢 Production Ready (Auth, Dashboard & Real-Time) | 🟡 Ready for Development (Charts & Advanced Features)

**Codebase Health:** 100% Frontend Implementation Complete | 8000+ lines of production-ready code | Comprehensive real-time features | Full API integration
