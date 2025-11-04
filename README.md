# Health Metrics Monitoring System

A full-stack health tracking application with real-time analytics and predictive insights. Built with modern web technologies and designed for scalability and performance.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-19.2.0-blue)](https://reactjs.org/)

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Dependencies](#dependencies)
- [Features](#features)
- [Getting Started](#getting-started)
- [Development](#development)
- [Architecture](#architecture)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)

## 🎯 Overview

The Health Metrics Monitoring System is a comprehensive full-stack platform for tracking and analyzing personal health data. Built with React 19 and Express, it features a complete authentication system, health metrics tracking, goal management, and is designed for scalability with planned Apache Spark analytics integration.

### Current Status

**Backend**: Fully functional RESTful API with JWT authentication, health metrics CRUD operations, and goals management system.

**Frontend**: Complete authentication UI with login/registration, protected routing, and dashboard foundation. Health metrics visualization in development.

### Key Capabilities

- 🔐 Complete authentication system (JWT-based with bcrypt password hashing)
- 📊 Health metrics tracking API (steps, calories, distance, sleep, weight)
- 🎯 Fitness goals management with progress tracking
- 📱 Responsive React UI with Tailwind CSS
- �️ Comprehensive input validation and error handling
- 🔄 Real-time form validation and password strength indicators
- � Metrics summary and analytics (daily, weekly, monthly, yearly)
- 🎨 Modern UI with custom Tailwind theme and reusable components

## 🛠 Tech Stack

### Frontend
- **Framework**: React 19.2.0
- **Build Tool**: Vite 7.1.7
- **Styling**: Tailwind CSS 4.1.14
- **Routing**: React Router DOM 7.9.4
- **State Management**: Zustand 5.0.8
- **Charts**: Recharts 3.3.0
- **Date Utilities**: date-fns 4.1.0
- **Code Quality**: ESLint 9.38.0

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express 4.19.2
- **Database**: MongoDB with Mongoose 8.3.0
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Password Hashing**: bcryptjs 2.4.3
- **Validation**: express-validator 7.0.1
- **API Integration**: googleapis 134.0.0
- **Security**: CORS 2.8.5
- **Environment**: dotenv 16.4.5

### Analytics (Planned)
- **Engine**: Apache Spark
- **Language**: Python/Scala

### Development Tools
- **Dev Server**: Vite HMR
- **Backend Dev**: nodemon 3.1.0
- **CSS Processing**: PostCSS 8.5.6, Autoprefixer 10.4.21
- **Version Control**: Git & GitHub

## 📁 Project Structure

```
health-metrics-monitoring-system/
├── client/                          # Frontend React application
│   ├── public/                      # Static assets
│   ├── src/                         # Source code
│   │   ├── api/                     # API configuration
│   │   │   └── axiosConfig.js      # Axios instance + interceptors
│   │   ├── assets/                  # Images, fonts, icons
│   │   ├── components/              # Reusable React components
│   │   │   ├── auth/               # Authentication components (planned)
│   │   │   ├── charts/             # Chart wrapper components (planned)
│   │   │   ├── common/             # Shared UI components
│   │   │   │   ├── Alert.jsx       # Alert/notification component
│   │   │   │   ├── Button.jsx      # Reusable button
│   │   │   │   ├── Card.jsx        # Card container
│   │   │   │   ├── Input.jsx       # Form input with validation
│   │   │   │   └── PrivateRoute.jsx # Route protection wrapper
│   │   │   ├── layout/             # Layout components
│   │   │   │   ├── Header.jsx      # App header/navbar
│   │   │   │   └── Layout.jsx      # Main layout wrapper
│   │   │   └── metrics/            # Health metrics components (planned)
│   │   ├── context/                 # React Context
│   │   │   └── AuthContext.jsx     # Authentication state + useAuth hook
│   │   ├── hooks/                   # Custom React hooks (planned)
│   │   ├── layouts/                 # Page layouts (planned)
│   │   ├── pages/                   # Full page components
│   │   │   ├── auth/               # Auth-related pages (planned)
│   │   │   ├── dashboard/          # Dashboard views (planned)
│   │   │   ├── Dashboard.jsx       # Main dashboard page
│   │   │   ├── Home.jsx            # Landing page
│   │   │   ├── Login.jsx           # Login page
│   │   │   ├── Register.jsx        # Registration page
│   │   │   └── NotFound.jsx        # 404 error page
│   │   ├── services/                # API integration layer
│   │   │   └── authService.js      # Auth API calls
│   │   ├── stores/                  # Zustand state stores (planned)
│   │   ├── utils/                   # Helper functions
│   │   │   └── validation.js       # Form validation utilities
│   │   ├── App.jsx                  # Root component with routes
│   │   ├── App.css                  # Component styles
│   │   ├── index.css                # Global styles + Tailwind
│   │   └── main.jsx                 # App entry point
│   ├── index.html                   # HTML template
│   ├── package.json                 # Frontend dependencies
│   ├── vite.config.js              # Vite configuration + API proxy
│   ├── tailwind.config.js          # Tailwind customization
│   ├── postcss.config.js           # PostCSS plugins
│   └── eslint.config.js            # ESLint rules
│
├── server/                          # Backend Node.js/Express API
│   ├── src/                         # Source code
│   │   ├── config/                  # Configuration files
│   │   │   └── database.js         # MongoDB connection
│   │   ├── controllers/             # Request handlers (MVC)
│   │   │   ├── authController.js   # Auth logic (register/login/profile/logout)
│   │   │   ├── goalsController.js  # Goals management
│   │   │   └── healthMetricsController.js # Metrics CRUD + analytics
│   │   ├── models/                  # Mongoose schemas
│   │   │   ├── User.js             # User model with bcrypt
│   │   │   ├── HealthMetric.js     # Daily health metrics
│   │   │   ├── Alert.js            # Notifications/alerts
│   │   │   └── Analytics.js        # Health insights
│   │   ├── routes/                  # API endpoints
│   │   │   ├── authRoutes.js       # /api/auth routes
│   │   │   ├── goalsRoutes.js      # /api/goals routes
│   │   │   └── healthMetricsRoutes.js # /api/metrics routes
│   │   ├── middleware/              # Express middleware
│   │   │   ├── auth.js             # JWT verification (protect)
│   │   │   ├── validator.js        # Input validation chains
│   │   │   └── errorHandler.js     # Error handling + ErrorResponse
│   │   ├── services/                # Business logic layer (planned)
│   │   ├── utils/                   # Helper functions (planned)
│   │   └── server.js                # Express app entry point
│   ├── scripts/                     # Utility scripts
│   │   └── fix-googleid-index.js   # MongoDB index maintenance
│   ├── .env.example                 # Environment variables template
│   ├── package.json                 # Backend dependencies
│   └── README.md                    # Server documentation
│
├── spark-analytics/                 # Apache Spark analytics (planned)
│   └── README.md
│
├── docs/                            # Additional documentation
│   ├── AUTH_API_REFERENCE.md       # Auth API detailed docs
│   ├── AUTH_ROUTES_VERIFICATION.md # Auth testing guide
│   └── (other documentation)
│
├── .gitignore                       # Root Git ignore
├── package.json                     # Root workspace config
├── ARCHITECTURE.md                  # Architecture documentation
├── TECH_STACK.md                   # Technology stack details
├── DOCUMENTATION_INDEX.md          # Documentation index
└── README.md                        # This file
```

## 📦 Dependencies

### Frontend Dependencies

#### Production
```json
{
  "react": "^19.2.0",              // UI library
  "react-dom": "^19.2.0",          // React DOM renderer
  "react-router-dom": "^7.9.4",   // Client-side routing
  "recharts": "^3.3.0",            // Chart library
  "zustand": "^5.0.8",             // State management
  "date-fns": "^4.1.0"             // Date utilities
}
```

#### Development
```json
{
  "vite": "^7.1.7",                      // Build tool
  "@vitejs/plugin-react": "^5.0.4",     // React plugin for Vite
  "tailwindcss": "^4.1.14",             // Utility-first CSS
  "@tailwindcss/postcss": "^4.1.14",    // Tailwind PostCSS plugin
  "postcss": "^8.5.6",                  // CSS transformer
  "autoprefixer": "^10.4.21",           // CSS vendor prefixes
  "eslint": "^9.38.0",                  // Code linter
  "eslint-plugin-react": "^7.37.5"      // React ESLint rules
}
```

### Backend Dependencies

#### Production
```json
{
  "express": "^4.19.2",            // Web framework
  "mongoose": "^8.3.0",            // MongoDB ODM
  "jsonwebtoken": "^9.0.2",        // JWT implementation
  "bcryptjs": "^2.4.3",            // Password hashing
  "express-validator": "^7.0.1",   // Input validation
  "googleapis": "^134.0.0",        // Google APIs client
  "cors": "^2.8.5",                // CORS middleware
  "dotenv": "^16.4.5"              // Environment variables
}
```

#### Development
```json
{
  "nodemon": "^3.1.0"              // Auto-restart dev server
}
```

## ✨ Features

### Current Features (Implemented)

#### Backend (100% Complete) ✅
- ✅ Monorepo structure with client and server
- ✅ Express backend with MVC architecture
- ✅ MongoDB Atlas integration with Mongoose ODM
- ✅ JWT authentication system (register, login, logout, profile management)
- ✅ Centralized error handling with custom ErrorResponse class
- ✅ Express-validator input validation chains
- ✅ Health metrics CRUD API (add, update, get by date/range, delete, summary)
- ✅ Goals management API (set, get, update, reset, progress tracking)
- ✅ User model with bcrypt password hashing and partial unique indexes
- ✅ HealthMetric, Alert, and Analytics data models
- ✅ Protected routes with JWT middleware
- ✅ CORS configuration for frontend integration
- ✅ Environment configuration setup
- ✅ Graceful server shutdown handling

#### Frontend (90% Complete) ✅
- ✅ React 19 + Vite 7 with HMR
- ✅ Tailwind CSS v4 with custom theme and utility classes
- ✅ React Router v7 with protected routes
- ✅ AuthContext for global authentication state
- ✅ Axios API layer with interceptors (token attach, error handling)
- ✅ Auth service (register, login, getCurrentUser, updateProfile, logout)
- ✅ Complete authentication UI (Login, Register pages)
- ✅ Reusable UI components (Button, Input, Card, Alert, PrivateRoute)
- ✅ Layout components (Header, Layout)
- ✅ Dashboard page with metrics cards
- ✅ Home landing page with hero section
- ✅ Form validation with real-time feedback
- ✅ Password strength indicator
- ✅ Responsive design for mobile and desktop
- ✅ Loading states and error handling

### Planned Features (In Development)
- 🚧 Health metrics form and submission UI
- 🚧 Interactive data visualizations with Recharts
- 🚧 Goals setting and progress visualization UI
- 🚧 Profile management page
- 🚧 Google Fit API integration
- 🚧 Predictive health analytics with Apache Spark
- 🚧 Real-time notifications system
- 🚧 Social features (sharing progress)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB (local or Atlas account)
- Git

### Installation

1. **Clone the repository**
```bash
git clone git@github.com:Ojas-1008/health-metrics-monitoring-system.git
cd health-metrics-monitoring-system
```

2. **Install client dependencies**
```bash
cd client
npm install
```

3. **Install server dependencies**
```bash
cd ../server
npm install
```

4. **Set up environment variables (server)**
```bash
cd server
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/health-metrics
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

5. **Set up environment variables (client)**

```bash
cd client
cp .env.example .env
# Edit .env if needed (default values work for local dev)
```

Client .env variables used by Vite (restart Vite after changes):

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Health Metrics Monitoring System
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=development
VITE_TOKEN_KEY=health_metrics_token
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
VITE_ENABLE_GOOGLE_FIT=false
VITE_ENABLE_ANALYTICS=false
VITE_API_TIMEOUT=10000
VITE_REQUEST_RETRY_LIMIT=3
```

### Running the Application

#### Development Mode

**Start the backend server:**
```bash
cd server
npm run dev
# Server runs on http://localhost:5000
```

**Start the frontend (in a new terminal):**
```bash
cd client
npm run dev
# Client runs on http://localhost:5173
```

#### Production Mode

**Build the frontend:**
```bash
cd client
npm run build
```

**Start the backend:**
```bash
cd server
npm start
```

## � Development

### Frontend Development

- **Hot Module Replacement (HMR)**: Instant updates without full page reload
- **Tailwind CSS**: Utility-first styling with custom theme
- **Component Structure**: Organized by feature (auth, metrics, charts, common)
- **State Management**: Zustand for lightweight global state
- **API Proxy**: Vite proxies `/api` requests to backend

### Backend Development

- **MVC Architecture**: Models, Views (JSON), Controllers
- **RESTful API**: Standard HTTP methods and status codes
- **Validation**: express-validator for input sanitization
- **Error Handling**: Centralized error middleware
- **Security**: JWT authentication, bcrypt hashing, CORS

### Code Quality

- **ESLint**: Enforces React best practices
- **Git Hooks**: (Coming soon) Pre-commit linting
- **Documentation**: README files in each directory

### Custom Tailwind Theme

```javascript
// Primary color palette (custom blue shades)
primary: {
  50: '#eff6ff',   100: '#dbeafe',
  200: '#bfdbfe',  300: '#93c5fd',
  400: '#60a5fa',  500: '#3b82f6',
  600: '#2563eb',  700: '#1d4ed8',
  800: '#1e40af',  900: '#1e3a8a'
}
```

### Custom CSS Components

- `.btn-primary` - Primary action button
- `.btn-secondary` - Secondary button
- `.input-field` - Form input styling
- `.card` - Card container with shadow

## 🏗 Architecture

### Frontend Architecture

```
React Application Structure
├── App.jsx (Root with React Router)
│   ├── AuthProvider (Global auth state)
│   ├── Routes
│   │   ├── Public Routes
│   │   │   ├── / (Home)
│   │   │   ├── /login (Login - redirects if authenticated)
│   │   │   └── /register (Register - redirects if authenticated)
│   │   ├── Protected Routes (require authentication)
│   │   │   └── /dashboard (Dashboard)
│   │   └── /404 (Not Found)
│
├── context/
│   └── AuthContext.jsx (useAuth hook, login/register/logout)
│
├── services/
│   └── authService.js (API calls: register, login, getCurrentUser, updateProfile, logout)
│
├── components/
│   ├── common/ (Button, Input, Card, Alert, PrivateRoute)
│   └── layout/ (Header, Layout)
│
└── pages/
    ├── Home.jsx (Landing page)
    ├── Login.jsx (Authentication)
    ├── Register.jsx (Registration with password strength)
    ├── Dashboard.jsx (Main app dashboard)
    └── NotFound.jsx (404 page)
```

### Backend Architecture

```
Express API Structure
├── server.js (Entry point)
│   ├── Middleware Chain
│   │   ├── CORS
│   │   ├── Body Parser
│   │   ├── Request Logger (dev only)
│   │   ├── Routes
│   │   ├── 404 Handler
│   │   └── Error Handler
│   │
│   ├── Routes
│   │   ├── /api/health (Health check)
│   │   ├── /api/auth/* (Authentication endpoints)
│   │   ├── /api/metrics/* (Health metrics CRUD)
│   │   └── /api/goals/* (Goals management)
│   │
│   ├── Controllers
│   │   ├── authController.js (register, login, me, updateProfile, logout)
│   │   ├── healthMetricsController.js (CRUD + summary + latest)
│   │   └── goalsController.js (set, get, update, reset, progress)
│   │
│   ├── Models (Mongoose)
│   │   ├── User.js (with bcrypt, partial googleId index)
│   │   ├── HealthMetric.js (daily metrics tracking)
│   │   ├── Alert.js (notifications)
│   │   └── Analytics.js (insights)
│   │
│   ├── Middleware
│   │   ├── auth.js (JWT protect middleware)
│   │   ├── validator.js (express-validator chains)
│   │   └── errorHandler.js (ErrorResponse + asyncHandler)
│   │
│   └── Config
│       └── database.js (MongoDB connection)
```

### Data Flow

```
Client Request → Vite Proxy → Express Server
                                    ↓
                           Middleware Chain:
                           1. CORS
                           2. Body Parser
                           3. Request Logger (dev)
                           4. Route Matching
                                    ↓
                      Protected Route → JWT Middleware (protect)
                                    ↓
                           Validation Middleware (express-validator)
                                    ↓
                           Controller (wrapped in asyncHandler)
                                    ↓
                           Mongoose Model
                                    ↓
                           MongoDB Atlas
                                    ↓
                           Response ← ErrorResponse (if error)
                                    ↓
Client Response ← JSON Response ← Express
```

### Request/Response Flow Example

```
1. User submits login form
   ↓
2. AuthContext.login() called
   ↓
3. authService.login() → axios.post('/api/auth/login')
   ↓
4. Vite proxy forwards to Express :5000
   ↓
5. Express validates email/password
   ↓
6. Controller verifies credentials with bcrypt
   ↓
7. JWT token generated and returned
   ↓
8. Token stored in localStorage
   ↓
9. Axios interceptor attaches token to future requests
   ↓
10. User redirected to dashboard
```

## 📡 API Documentation

### Base URL
```
Development: http://localhost:5000/api
Production: TBD
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Test1234!",
  "confirmPassword": "Test1234!"
}

Response: 201 Created
{
  "success": true,
  "message": "User registered successfully",
  "token": "<jwt>",
  "user": { "id": "...", "name": "...", "email": "..." }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Test1234!"
}

Response: 200 OK
{
  "success": true,
  "message": "Login successful",
  "token": "<jwt>",
  "user": { "id": "...", "name": "...", "email": "..." }
}
```

#### Get Current User (Protected)
```http
GET /api/auth/me
Authorization: Bearer <jwt>

Response: 200 OK
{
  "success": true,
  "user": { "id": "...", "name": "...", "email": "...", "goals": {...} }
}
```

#### Update Profile (Protected)
```http
PUT /api/auth/profile
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "name": "New Name"
}

Response: 200 OK
{
  "success": true,
  "message": "Profile updated successfully",
  "user": { "id": "...", "name": "New Name", "email": "..." }
}
```

#### Logout (Protected)
```http
POST /api/auth/logout
Authorization: Bearer <jwt>

Response: 200 OK
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Health Metrics Endpoints (Implemented) ✅

#### Add or Update Metrics
```http
POST /api/metrics
Authorization: Bearer <jwt>
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

Response: 201 Created
{
  "success": true,
  "message": "Metrics added successfully",
  "data": { ...metrics document }
}
```

#### Get Metrics by Date Range
```http
GET /api/metrics?startDate=2025-11-01&endDate=2025-11-03
Authorization: Bearer <jwt>

Response: 200 OK
{
  "success": true,
  "count": 3,
  "data": [ ...metrics array ]
}
```

#### Get Metrics by Date
```http
GET /api/metrics/2025-11-03
Authorization: Bearer <jwt>

Response: 200 OK
{
  "success": true,
  "data": { ...metrics document }
}
```

#### Get Metrics Summary
```http
GET /api/metrics/summary/week
Authorization: Bearer <jwt>

Response: 200 OK
{
  "success": true,
  "data": {
    "period": "week",
    "totalDays": 7,
    "averages": { steps: 8500, calories: 1200, ... },
    "totals": { steps: 59500, ... }
  }
}
```

#### Get Latest Metrics
```http
GET /api/metrics/latest
Authorization: Bearer <jwt>

Response: 200 OK
{
  "success": true,
  "data": { ...latest metrics }
}
```

#### Delete Metrics
```http
DELETE /api/metrics/2025-11-03
Authorization: Bearer <jwt>

Response: 200 OK
{
  "success": true,
  "message": "Metrics deleted successfully"
}
```

### Goals Endpoints (Implemented) ✅

#### Set Goals
```http
POST /api/goals
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "stepGoal": 10000,
  "calorieGoal": 2000,
  "sleepGoal": 8,
  "weightGoal": 70,
  "distanceGoal": 5
}

Response: 200 OK
{
  "success": true,
  "message": "Goals updated successfully",
  "data": { ...goals object }
}
```

#### Get Goals
```http
GET /api/goals
Authorization: Bearer <jwt>

Response: 200 OK
{
  "success": true,
  "data": { stepGoal: 10000, calorieGoal: 2000, ... }
}
```

#### Update Goals (Partial)
```http
PUT /api/goals
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "stepGoal": 12000
}

Response: 200 OK
{
  "success": true,
  "message": "Goals updated successfully",
  "data": { ...updated goals }
}
```

#### Reset Goals
```http
DELETE /api/goals
Authorization: Bearer <jwt>

Response: 200 OK
{
  "success": true,
  "message": "Goals reset to defaults",
  "data": { ...default goals }
}
```

#### Get Goal Progress
```http
GET /api/goals/progress
Authorization: Bearer <jwt>

Response: 200 OK
{
  "success": true,
  "data": {
    "goals": { ... },
    "currentMetrics": { ... },
    "progress": {
      "steps": { "goal": 10000, "current": 7500, "percentage": 75, "achieved": false },
      ...
    }
  }
}
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Ojas Shrivastava**
- Email: ojasshrivastava1008@gmail.com
- GitHub: [@Ojas-1008](https://github.com/Ojas-1008)

## 🙏 Acknowledgments

- React Team for React 19
- Tailwind Labs for Tailwind CSS
- Vercel for Vite
- MongoDB for Atlas
- Google for Fit API

---

**Development Status**: ✅ **Core Features Complete** - Backend API fully functional, Frontend authentication and UI foundation complete

**Next Steps**: Implement health metrics UI components, charts, and data visualization

Last Updated: November 3, 2025