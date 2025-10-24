# Health Metrics Client 🎨

React 19 frontend application for Health Metrics Monitoring System - A modern, responsive web app built with Vite, Tailwind CSS, and Zustand state management.

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Project Structure](#-project-structure)
- [Setup Instructions](#-setup-instructions)
- [Development](#-development)
- [Styling Guide](#-styling-guide)
- [State Management](#-state-management)
- [API Integration](#-api-integration)
- [Scripts](#-scripts)

---

## 🛠 Tech Stack

- **Framework:** React 19.2.0 (latest)
- **Build Tool:** Vite 7.1.7
- **Styling:** Tailwind CSS 4.1.14
- **Routing:** React Router DOM 7.9.4
- **State Management:** Zustand 5.0.8
- **Charts:** Recharts 3.3.0
- **Date Utilities:** date-fns 4.1.0
- **Dev Server:** Vite (with HMR)

---

## ✨ Features

✅ **Modern React 19**
- Latest React features and hooks
- Fast Refresh for instant feedback
- ES Modules only (`type: "module"`)

✅ **Tailwind CSS 4**
- Utility-first CSS framework
- Custom color palette (primary blue shades)
- Custom utility classes (.btn-primary, .btn-secondary, .input-field, .card)
- Responsive design patterns
- PostCSS processing with @tailwindcss/postcss

✅ **Vite Development Experience**
- Lightning-fast HMR (Hot Module Replacement)
- Optimized production builds
- API proxy to backend (`/api` → `http://localhost:5000`)
- Port 5173 for dev server

✅ **Planned Features**
- Zustand state management for auth and metrics
- React Router for multi-page navigation
- Recharts for health data visualization
- date-fns for date formatting and manipulation

---

## 📁 Project Structure

```
client/
├── public/                      # Static assets (served as-is)
├── src/
│   ├── assets/                  # Images, icons, fonts
│   │   └── README.md
│   ├── components/              # Reusable UI components
│   │   ├── auth/                # Login, Register, etc.
│   │   ├── charts/              # Recharts wrappers
│   │   ├── common/              # Button, Input, Card, etc.
│   │   ├── metrics/             # MetricCard, MetricForm, etc.
│   │   └── README.md
│   ├── hooks/                   # Custom React hooks
│   │   └── README.md
│   ├── layouts/                 # Page layout components
│   │   └── README.md
│   ├── pages/                   # Full page components
│   │   ├── auth/                # Login page, Register page
│   │   ├── dashboard/           # Dashboard views
│   │   └── README.md
│   ├── services/                # API integration (Axios/fetch)
│   │   └── README.md
│   ├── stores/                  # Zustand stores
│   │   └── README.md
│   ├── utils/                   # Helper functions
│   │   └── README.md
│   ├── App.jsx                  # Root component
│   ├── App.css                  # App-level styles
│   ├── main.jsx                 # Entry point
│   ├── index.css                # Global styles + Tailwind imports
│   └── README.md                # This file
├── index.html                   # HTML entry point
├── vite.config.js               # Vite configuration + API proxy
├── tailwind.config.js           # Tailwind theme customization
├── postcss.config.js            # PostCSS config for Tailwind v4
├── eslint.config.js             # ESLint configuration
├── package.json                 # Dependencies and scripts
└── .gitignore

```

---

## 🚀 Setup Instructions

### Prerequisites

- Node.js v18+ installed
- Backend server running on `http://localhost:5000`

### Installation

1. **Navigate to client directory**
   ```bash
   cd health-metrics-monitoring-system/client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
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

4. **Open browser**
   - Navigate to `http://localhost:5173`
   - You should see the Health Metrics landing page

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

3. **Make changes** - Vite will auto-reload
4. **API calls** automatically proxy to `http://localhost:5000/api`

### Hot Module Replacement (HMR)

- Changes to components update instantly without full page reload
- State is preserved during updates
- Logs errors in browser console

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

### Zustand Stores (Planned)

**Auth Store** (`stores/authStore.js`):
```javascript
import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: (user, token) => set({ user, token, isAuthenticated: true }),
  logout: () => set({ user: null, token: null, isAuthenticated: false }),
}));
```

**Usage in components:**
```jsx
import { useAuthStore } from '../stores/authStore';

function Profile() {
  const { user, logout } = useAuthStore();
  
  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

**Metrics Store** (`stores/metricsStore.js`):
- Health metrics data
- CRUD operations
- Loading states

---

## 🔌 API Integration

### Vite Proxy Configuration

All `/api/*` requests are proxied to backend:

```javascript
// vite.config.js
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

### API Service Layer (Planned)

**Auth Service** (`services/authService.js`):
```javascript
const API_URL = '/api/auth';

export const authService = {
  register: async (userData) => {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return response.json();
  },
  
  login: async (credentials) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return response.json();
  },
};
```

**Metrics Service** (`services/metricsService.js`):
- Fetch health metrics
- Create/update/delete metrics
- Date range queries

---

## 🧩 Component Organization

### Component Categories

**1. Common Components** (`components/common/`)
- Button, Input, Card
- Modal, Tooltip, Spinner
- Reusable across features

**2. Auth Components** (`components/auth/`)
- LoginForm, RegisterForm
- ProtectedRoute wrapper

**3. Metrics Components** (`components/metrics/`)
- MetricCard (display single metric)
- MetricForm (input health data)
- MetricsList

**4. Charts Components** (`components/charts/`)
- LineChart (steps over time)
- BarChart (calories, sleep)
- Recharts wrappers with custom styling

### Component Structure Example

```jsx
// components/common/Button.jsx
import PropTypes from 'prop-types';

export default function Button({ 
  children, 
  variant = 'primary', 
  onClick, 
  ...props 
}) {
  const baseClasses = 'btn';
  const variantClasses = variant === 'primary' ? 'btn-primary' : 'btn-secondary';
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary']),
  onClick: PropTypes.func,
};
```

---

## 📜 Scripts Breakdown

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Start dev server on port 5173 with HMR |
| `build` | `vite build` | Build production-ready bundle to `dist/` |
| `preview` | `vite preview` | Preview production build locally |

---

## 🔧 Configuration Files

### `vite.config.js`
- React plugin for JSX support
- Dev server on port 5173
- API proxy to backend

### `tailwind.config.js`
- Custom primary color palette
- Inter font family
- Content paths for purging

### `postcss.config.js`
- Tailwind CSS v4 PostCSS plugin
- Autoprefixer for vendor prefixes

### `eslint.config.js`
- React-specific linting rules
- React Hooks rules
- React Refresh plugin

---

## 🚧 Development Status

**Current Phase:** Project Setup & Styling ✅

**Completed:**
- ✅ Vite + React 19 setup
- ✅ Tailwind CSS 4 integration
- ✅ Custom utility classes
- ✅ API proxy configuration
- ✅ Basic landing page UI
- ✅ Dependencies installed (Zustand, Recharts, React Router)

**Next Steps:**
- ⏳ Create authentication UI (Login, Register pages)
- ⏳ Implement Zustand stores (auth, metrics)
- ⏳ Set up React Router with protected routes
- ⏳ Build dashboard layout
- ⏳ Create health metrics components
- ⏳ Integrate Recharts for data visualization
- ⏳ Connect to backend API
- ⏳ Add form validation
- ⏳ Responsive design for mobile
- ⏳ Production build optimization

---

## 📝 Notes

- **ES Modules Only:** All imports use `import/export` syntax
- **React 19:** Uses latest features - check compatibility when adding libraries
- **Tailwind v4:** New PostCSS-based approach (no `tailwind.config.js` processing)
- **Vite Proxy:** API calls to `/api/*` auto-forward to backend server
- **Port 5173:** Default Vite dev server port (frontend)
- **Port 5000:** Backend server port (API)

---

**Last Updated:** October 24, 2025
