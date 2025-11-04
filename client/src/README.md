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

- **Framework:** React 19.2.0
- **Build Tool:** Vite 7.1.7
- **Styling:** Tailwind CSS 4.1.14
- **Routing:** React Router DOM 7.9.4
- **State Management:** Context API (AuthContext) + Zustand 5.0.8
- **HTTP Client:** Axios 1.7.9 (with interceptors)
- **Charts:** Recharts 3.3.0
- **Date Utilities:** date-fns 4.1.0
- **Dev Server:** Vite with HMR

---

## ✨ Features

### ✅ **Implemented Features**

**Authentication System**
- Complete JWT-based authentication with AuthContext
- Login and registration with form validation
- Password strength indicator
- Protected routes with PrivateRoute component
- Automatic token attachment via Axios interceptors
- Persistent authentication with localStorage

**Dashboard**
- Comprehensive health metrics dashboard
- Health metrics input form with validation
- Metrics list display with date filtering
- Summary statistics (weekly, monthly, yearly)
- Goals section with progress tracking
- Trend analysis and progress bars
- Real-time data refresh

**Health Metrics Management**
- Add daily health metrics (steps, calories, distance, sleep, weight, heart rate, active minutes)
- View metrics history with date range filtering
- Edit and delete metrics
- Automatic progress calculation
- Visual progress indicators

**Goals Management**
- Set fitness goals (weight, steps, sleep, calories, distance)
- Track goal progress with visual indicators
- Edit and update goals
- Achievement badges for completed goals
- Progress bars for each goal type

**UI Components**
- Reusable component library (Button, Input, Card, Alert)
- Responsive layouts for mobile and desktop
- Custom Tailwind utility classes
- Loading states and error handling
- Modal dialogs for forms

**Routing**
- React Router v7 with protected routes
- Public routes: Home, Login, Register
- Protected routes: Dashboard
- 404 Not Found page
- Automatic redirects based on auth status

---

## 📁 Project Structure

```
client/
├── public/                          # Static assets (vite.svg)
├── src/
│   ├── api/                         # API configuration
│   │   └── axiosConfig.js          # Configured Axios instance with interceptors
│   ├── assets/                      # Images, icons, fonts
│   │   └── README.md
│   ├── components/                  # Reusable UI components
│   │   ├── auth/                   # Authentication components (planned)
│   │   ├── charts/                 # Chart wrapper components (planned)
│   │   ├── common/                 # Shared UI components
│   │   │   ├── Alert.jsx           # Alert/notification component
│   │   │   ├── Button.jsx          # Reusable button with variants
│   │   │   ├── Card.jsx            # Card container component
│   │   │   ├── Input.jsx           # Form input with validation
│   │   │   └── PrivateRoute.jsx    # Protected route wrapper
│   │   ├── dashboard/              # Dashboard-specific components
│   │   │   ├── GoalsForm.jsx       # Form for setting/editing goals
│   │   │   ├── GoalsSection.jsx    # Goals display with progress
│   │   │   ├── MetricCard.jsx      # Individual metric display card
│   │   │   ├── MetricsForm.jsx     # Form for adding health metrics
│   │   │   ├── MetricsList.jsx     # List of health metrics
│   │   │   └── SummaryStats.jsx    # Summary statistics display
│   │   ├── layout/                 # Layout components
│   │   │   ├── Header.jsx          # App header/navigation
│   │   │   └── Layout.jsx          # Main layout wrapper
│   │   ├── metrics/                # Metrics-specific components (placeholder)
│   │   └── README.md
│   ├── context/                     # React Context providers
│   │   └── AuthContext.jsx         # Authentication context + useAuth hook
│   ├── hooks/                       # Custom React hooks
│   │   └── README.md
│   ├── layouts/                     # Page layouts (placeholder)
│   │   └── README.md
│   ├── pages/                       # Full page components
│   │   ├── auth/                   # Auth-related pages (placeholder)
│   │   ├── dashboard/              # Dashboard views (placeholder)
│   │   ├── Dashboard.jsx           # Main dashboard page (IMPLEMENTED)
│   │   ├── Home.jsx                # Landing page (IMPLEMENTED)
│   │   ├── Login.jsx               # Login page (IMPLEMENTED)
│   │   ├── Register.jsx            # Registration page (IMPLEMENTED)
│   │   ├── NotFound.jsx            # 404 error page (IMPLEMENTED)
│   │   └── README.md
│   ├── services/                    # API service layer
│   │   ├── authService.js          # Authentication API calls (IMPLEMENTED)
│   │   ├── goalsService.js         # Goals API calls (IMPLEMENTED)
│   │   ├── metricsService.js       # Health metrics API calls (IMPLEMENTED)
│   │   └── README.md
│   ├── stores/                      # Zustand stores (placeholder)
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

- Node.js v18+ installed
- Backend server configured (see `server/README.md`)
- MongoDB database running (Atlas or local)

### Installation

1. **Navigate to client directory**
   ```bash
   cd health-metrics-monitoring-system/client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables (optional)**
   Create `.env` file in client directory:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_APP_NAME=Health Metrics Monitoring System
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   Expected output:
   ```
   VITE v7.1.7  ready in 234 ms

   ➜  Local:   http://localhost:5173/
   ➜  Network: use --host to expose
   ➜  press h + enter to show help
   ```

5. **Open browser**
   - Navigate to `http://localhost:5173`
   - You should see the Health Metrics landing page

### First-Time Setup

1. **Start backend server** (required for authentication)
   ```bash
   cd server
   npm run dev
   ```

2. **Create account**
   - Click "Get Started" or "Sign Up"
   - Fill registration form
   - Set strong password

3. **Login**
   - Use registered credentials
   - Automatically redirected to dashboard

4. **Start tracking**
   - Add your first health metrics
   - Set your fitness goals
   - View progress and trends

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
├── auth/                    # Authentication components (placeholder)
│   └── (Future: LoginForm, RegisterForm, PasswordReset)
├── charts/                  # Chart wrapper components (placeholder)
│   └── (Future: LineChart, BarChart, PieChart)
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
└── metrics/                 # Metrics-specific components (placeholder)
    └── (Future: MetricChart, MetricTrend)
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

// Format for API (YYYY-MM-DD)
const apiDate = dateUtils.formatDateForAPI(new Date());
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
- `axios@^1.7.9` - HTTP client
- `tailwindcss@^4.1.14` - CSS framework
- `zustand@^5.0.8` - State management
- `recharts@^3.3.0` - Charts library
- `date-fns@^4.1.0` - Date utilities

---

## 🚧 Development Status

### ✅ Completed Features (Production Ready)

**Authentication System (100%)**
- ✅ JWT-based authentication with AuthContext
- ✅ Login page with form validation
- ✅ Registration page with password strength indicator
- ✅ Protected routes with automatic redirects
- ✅ Persistent authentication (localStorage)
- ✅ Automatic token refresh

**Dashboard Core (100%)**
- ✅ Main dashboard layout
- ✅ Health metrics display cards
- ✅ Metrics input form with validation
- ✅ Metrics history list with filtering
- ✅ Summary statistics (weekly, monthly, yearly)
- ✅ Responsive design (mobile, tablet, desktop)

**Goals Management (100%)**
- ✅ Goals input form with validation
- ✅ Goals display with progress bars
- ✅ Progress calculation and tracking
- ✅ Achievement badges
- ✅ Edit and update functionality
- ✅ Empty state handling

**UI Components Library (100%)**
- ✅ Alert (success, error, warning, info)
- ✅ Button (multiple variants and sizes)
- ✅ Card container
- ✅ Input with validation feedback
- ✅ PrivateRoute wrapper

**API Integration (100%)**
- ✅ Axios configuration with interceptors
- ✅ Auth service (register, login, profile, logout)
- ✅ Metrics service (CRUD operations)
- ✅ Goals service (CRUD operations)
- ✅ Error handling and retry logic

**Routing (100%)**
- ✅ React Router v7 setup
- ✅ Public routes (Home, Login, Register)
- ✅ Protected routes (Dashboard)
- ✅ 404 Not Found page
- ✅ Automatic redirects based on auth

**Styling (100%)**
- ✅ Tailwind CSS v4 integration
- ✅ Custom color palette
- ✅ Custom utility classes
- ✅ Responsive breakpoints
- ✅ Consistent design system

### ⏳ In Progress

**Data Visualization (50%)**
- ⏳ Recharts integration (library installed)
- ⏳ Line charts for trends
- ⏳ Bar charts for comparisons
- ⏳ Pie charts for distributions
- ⏳ Custom chart components

**Advanced Features (30%)**
- ⏳ Profile management page
- ⏳ Settings page
- ⏳ Export data functionality
- ⏳ Print reports

### 📋 Planned Features

**State Management**
- ⏳ Zustand stores for metrics
- ⏳ Zustand stores for goals
- ⏳ Optimistic UI updates

**User Experience**
- ⏳ Dark mode toggle
- ⏳ Customizable dashboard layout
- ⏳ Keyboard shortcuts
- ⏳ Accessibility improvements (ARIA labels)

**Data Features**
- ⏳ Data export (CSV, JSON)
- ⏳ Import from Google Fit
- ⏳ Bulk data entry
- ⏳ Predictive analytics

**Social Features**
- ⏳ Share progress
- ⏳ Connect with friends
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

## 🔗 Related Documentation

- [Server API Documentation](../../server/README.md)
- [Architecture Documentation](../../ARCHITECTURE.md)
- [Tech Stack Details](../../TECH_STACK.md)
- [Testing Guide](../../TESTING_METRICS_FLOW.md)

---

## 🤝 Contributing

When adding new features:

1. **Follow existing patterns** - Match code style and structure
2. **Update README** - Document new components and features
3. **Add comments** - Explain complex logic
4. **Test thoroughly** - Verify on mobile and desktop
5. **Check responsiveness** - Test at 320px, 768px, 1024px, 1920px
6. **Validate forms** - Both client and server-side
7. **Handle errors** - Graceful error messages and fallbacks

---

**Last Updated:** November 4, 2025

**Development Phase:** Core Features Complete - Data Visualization In Progress

**Status:** 🟢 Production Ready (Core Features) | 🟡 Active Development (Charts & Advanced Features)
