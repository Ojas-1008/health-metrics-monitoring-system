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

**Backend**: Fully functional RESTful API with JWT authentication, health metrics CRUD operations, and goals management system. All core backend features are implemented and tested.

**Frontend**: Complete authentication UI with login/registration, protected routing, and a robust dashboard foundation. Health metrics input forms, goal setting, and initial data visualizations are implemented. Profile management and advanced analytics visualizations are in active development.

### Key Capabilities

- 🔐 **Complete Authentication System**: Secure JWT-based authentication with [`bcryptjs`](server/src/models/User.js) password hashing, user registration, login, and profile management.
- 📊 **Health Metrics Tracking API**: Comprehensive CRUD operations for various health metrics including steps, calories, distance, sleep, and weight, managed via [`healthMetricsController.js`](server/src/controllers/healthMetricsController.js).
- 🎯 **Fitness Goals Management**: API for setting, retrieving, updating, and resetting personal fitness goals with progress tracking, handled by [`goalsController.js`](server/src/controllers/goalsController.js).
- 📱 **Responsive React UI**: Modern and responsive user interface built with [`React 19`](client/package.json) and styled using [`Tailwind CSS 4`](client/tailwind.config.js) for a seamless experience across devices.
- ✅ **Comprehensive Input Validation**: Robust server-side validation using [`express-validator`](server/src/middleware/validator.js) and client-side real-time form validation for data integrity.
- 🔄 **Real-time Feedback**: Dynamic form validation and password strength indicators provide immediate user feedback during registration and login.
- 📈 **Metrics Summary and Analytics**: Backend endpoints provide daily, weekly, monthly, and yearly summaries of health metrics.
- 🎨 **Modern UI with Custom Theme**: Features a custom Tailwind CSS theme and a library of reusable components like [`Button.jsx`](client/src/components/common/Button.jsx), [`Input.jsx`](client/src/components/common/Input.jsx), and [`Card.jsx`](client/src/components/common/Card.jsx).

## 🛠 Tech Stack

### Frontend
- **Framework**: React 19.2.0 - A declarative, component-based JavaScript library for building user interfaces.
- **Build Tool**: Vite 7.1.7 - A fast development build tool that provides instant server start and Hot Module Replacement (HMR).
- **Styling**: Tailwind CSS 4.1.14 - A utility-first CSS framework for rapidly building custom designs.
- **Routing**: React Router DOM 7.9.4 - Declarative routing for React applications.
- **State Management**: Zustand 5.0.8 - A small, fast, and scalable bear-bones state-management solution.
- **Charts**: Recharts 3.3.0 - A composable charting library built with React and D3.
- **Date Utilities**: date-fns 4.1.0 - A modern JavaScript date utility library.
- **Code Quality**: ESLint 9.38.0 - Pluggable JavaScript linter for identifying and reporting on patterns in JavaScript code.

### Backend
- **Runtime**: Node.js (v18+) - A JavaScript runtime built on Chrome's V8 JavaScript engine.
- **Framework**: Express 4.19.2 - A fast, unopinionated, minimalist web framework for Node.js.
- **Database**: MongoDB with Mongoose 8.3.0 - A NoSQL database and an elegant MongoDB object modeling for Node.js.
- **Authentication**: JWT (jsonwebtoken 9.0.2) - JSON Web Token implementation for secure authentication.
- **Password Hashing**: bcryptjs 2.4.3 - A library for hashing passwords.
- **Validation**: express-validator 7.0.1 - Middleware for Express that wraps validator.js and sanitization.
- **API Integration**: googleapis 134.0.0 - Google APIs client library for Node.js.
- **Security**: CORS 2.8.5 - Node.js CORS middleware.
- **Environment**: dotenv 16.4.5 - Loads environment variables from a `.env` file.

### Analytics (Planned)
- **Engine**: Apache Spark - A unified analytics engine for large-scale data processing.
- **Language**: Python/Scala - Programming languages for Spark applications.

### Development Tools
- **Dev Server**: Vite HMR - Hot Module Replacement for instant feedback during frontend development.
- **Backend Dev**: nodemon 3.1.0 - Automatically restarts the Node.js server when file changes are detected.
- **CSS Processing**: PostCSS 8.5.6, Autoprefixer 10.4.21 - Tools for transforming CSS with JavaScript.
- **Version Control**: Git & GitHub - Distributed version control system and platform for hosting code.

## 📁 Project Structure

```
health-metrics-monitoring-system/
├── client/                          # Frontend React application
│   ├── public/                      # Static assets (e.g., vite.svg)
│   ├── src/                         # Frontend source code
│   │   ├── api/                     # API configuration and Axios instance
│   │   │   └── axiosConfig.js      # Configured Axios for API requests with interceptors
│   │   ├── assets/                  # Images, fonts, icons
│   │   ├── components/              # Reusable React components
│   │   │   ├── auth/               # Authentication-related components (e.g., forms)
│   │   │   ├── charts/             # Chart wrapper components (e.g., for Recharts)
│   │   │   ├── common/             # Shared UI components (Alert, Button, Card, Input, PrivateRoute)
│   │   │   │   ├── Alert.jsx       # Generic alert/notification component
│   │   │   │   ├── Button.jsx      # Reusable button component
│   │   │   │   ├── Card.jsx        # Flexible card container
│   │   │   │   ├── Input.jsx       # Form input with validation feedback
│   │   │   │   └── PrivateRoute.jsx # HOC for protecting routes
│   │   │   ├── dashboard/          # Components specific to the dashboard
│   │   │   │   ├── GoalsForm.jsx   # Form for setting/updating goals
│   │   │   │   ├── GoalsSection.jsx # Displays user goals and progress
│   │   │   │   ├── MetricCard.jsx  # Displays individual health metrics
│   │   │   │   ├── MetricsForm.jsx # Form for adding/updating health metrics
│   │   │   │   ├── MetricsList.jsx # Lists daily health metrics
│   │   │   │   └── SummaryStats.jsx # Displays summary statistics for metrics
│   │   │   ├── layout/             # Layout-related components
│   │   │   │   ├── Header.jsx      # Application header/navigation bar
│   │   │   │   └── Layout.jsx      # Main layout wrapper for pages
│   │   │   └── metrics/            # Health metrics specific components
│   │   ├── context/                 # React Context API for global state
│   │   │   └── AuthContext.jsx     # Manages authentication state and provides useAuth hook
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── layouts/                 # Page layouts (e.g., authenticated layout)
│   │   ├── pages/                   # Full page components
│   │   │   ├── auth/               # Auth-related pages (e.g., password reset)
│   │   │   ├── dashboard/          # Dashboard views
│   │   │   ├── Dashboard.jsx       # Main authenticated dashboard page
│   │   │   ├── Home.jsx            # Public landing page
│   │   │   ├── Login.jsx           # User login page
│   │   │   ├── Register.jsx        # User registration page
│   │   │   └── NotFound.jsx        # 404 error page
│   │   ├── services/                # API integration layer for specific resources
│   │   │   ├── authService.js      # Functions for authentication API calls
│   │   │   ├── goalsService.js     # Functions for goals API calls
│   │   │   └── metricsService.js   # Functions for health metrics API calls
│   │   ├── stores/                  # Zustand state stores
│   │   ├── utils/                   # Helper functions and utilities
│   │   │   ├── dateUtils.js        # Date formatting and manipulation utilities
│   │   │   └── validation.js       # Client-side form validation utilities
│   │   ├── App.jsx                  # Root component defining application routes
│   │   ├── App.css                  # Application-wide CSS styles
│   │   ├── index.css                # Global styles and Tailwind CSS imports
│   │   └── main.jsx                 # Entry point for the React application
│   ├── index.html                   # Main HTML template
│   ├── package.json                 # Frontend dependencies and scripts
│   ├── vite.config.js              # Vite build tool configuration, including API proxy
│   ├── tailwind.config.js          # Tailwind CSS customization and theme definition
│   ├── postcss.config.js           # PostCSS configuration for Tailwind
│   └── eslint.config.js            # ESLint configuration for code quality
│
├── server/                          # Backend Node.js/Express API
│   ├── src/                         # Backend source code
│   │   ├── config/                  # Configuration files
│   │   │   └── database.js         # MongoDB connection setup
│   │   ├── controllers/             # Request handlers (MVC pattern)
│   │   │   ├── authController.js   # Logic for user authentication (register, login, profile, logout)
│   │   │   ├── goalsController.js  # Logic for managing user goals
│   │   │   └── healthMetricsController.js # Logic for health metrics CRUD and analytics
│   │   ├── models/                  # Mongoose schemas for MongoDB
│   │   │   ├── User.js             # User model with bcrypt hashing and goals sub-document
│   │   │   ├── HealthMetric.js     # Schema for daily health metrics
│   │   │   ├── Alert.js            # Schema for notifications/alerts
│   │   │   └── Analytics.js        # Schema for health insights (planned)
│   │   ├── routes/                  # API endpoints definitions
│   │   │   ├── authRoutes.js       # Routes for /api/auth endpoints
│   │   │   ├── goalsRoutes.js      # Routes for /api/goals endpoints
│   │   │   └── healthMetricsRoutes.js # Routes for /api/metrics endpoints
│   │   ├── middleware/              # Express middleware functions
│   │   │   ├── auth.js             # JWT verification and route protection
│   │   │   ├── validator.js        # Input validation chains using express-validator
│   │   │   └── errorHandler.js     # Centralized error handling and custom ErrorResponse class
│   │   ├── services/                # Business logic layer (e.g., external API integrations)
│   │   ├── utils/                   # Helper functions and utilities
│   │   └── server.js                # Main Express application entry point
│   ├── scripts/                     # Utility scripts
│   │   └── fix-googleid-index.js   # Script for MongoDB index maintenance
│   ├── .env.example                 # Template for environment variables
│   ├── package.json                 # Backend dependencies and scripts
│   └── README.md                    # Server-specific documentation
│
├── spark-analytics/                 # Apache Spark analytics (planned)
│   └── README.md
│
├── docs/                            # Additional documentation
│   ├── AUTH_API_REFERENCE.md       # Detailed documentation for Authentication API
│   ├── AUTH_ROUTES_VERIFICATION.md # Guide for testing authentication routes
│   └── TESTING_GOALS_COMPONENTS.md # Guide for testing goals components
│
├── .gitignore                       # Root Git ignore file
├── package.json                     # Root workspace configuration
├── ARCHITECTURE.md                  # High-level architecture documentation
├── TECH_STACK.md                   # Detailed technology stack information
├── DOCUMENTATION_INDEX.md          # Index of all project documentation
└── README.md                        # This file
```

## 📦 Dependencies

### Frontend Dependencies

#### Production
```json
{
  "react": "^19.2.0",              // UI library for building interactive user interfaces.
  "react-dom": "^19.2.0",          // Entry point for DOM-specific rendering methods.
  "react-router-dom": "^7.9.4",   // Enables client-side routing in React applications.
  "recharts": "^3.3.0",            // A charting library for React, used for data visualization.
  "zustand": "^5.0.8",             // A lightweight state management solution for React.
  "date-fns": "^4.1.0"             // Provides a comprehensive set of functions for manipulating dates.
}
```

#### Development
```json
{
  "vite": "^7.1.7",                      // Next-generation frontend tooling, used as a build tool and dev server.
  "@vitejs/plugin-react": "^5.0.4",     // Vite plugin for React projects.
  "tailwindcss": "^4.1.14",             // A utility-first CSS framework.
  "@tailwindcss/postcss": "^4.1.14",    // PostCSS plugin for Tailwind CSS.
  "postcss": "^8.5.6",                  // A tool for transforming CSS with JavaScript.
  "autoprefixer": "^10.4.21",           // PostCSS plugin to parse CSS and add vendor prefixes.
  "eslint": "^9.38.0",                  // A pluggable linting utility for JavaScript and JSX.
  "eslint-plugin-react": "^7.37.5"      // ESLint plugin for React specific linting rules.
}
```

### Backend Dependencies

#### Production
```json
{
  "express": "^4.19.2",            // Fast, unopinionated, minimalist web framework for Node.js.
  "mongoose": "^8.3.0",            // MongoDB object modeling tool designed to work in an asynchronous environment.
  "jsonwebtoken": "^9.0.2",        // An implementation of JSON Web Tokens for authorization.
  "bcryptjs": "^2.4.3",            // A library to help hash passwords.
  "express-validator": "^7.0.1",   // Middleware for Express that wraps validator.js.
  "googleapis": "^134.0.0",        // Google APIs client library for Node.js.
  "cors": "^2.8.5",                // Provides a Connect/Express middleware that can be used to enable CORS.
  "dotenv": "^16.4.5"              // Loads environment variables from a .env file into process.env.
}
```

#### Development
```json
{
  "nodemon": "^3.1.0"              // A tool that helps develop Node.js based applications by automatically restarting the node application when file changes in the directory are detected.
}
```

## ✨ Features

### Current Features (Implemented)

#### Backend (100% Complete) ✅
- ✅ Monorepo structure with client and server applications.
- ✅ Express backend following a clear MVC (Model-View-Controller) architecture.
- ✅ MongoDB Atlas integration with Mongoose ODM for robust data management.
- ✅ JWT authentication system covering user registration, login, logout, and profile management.
- ✅ Centralized error handling with a custom [`ErrorResponse`](server/src/middleware/errorHandler.js) class for consistent API error messages.
- ✅ [`express-validator`](server/src/middleware/validator.js) input validation chains for all critical API endpoints.
- ✅ Comprehensive Health Metrics CRUD API (add, update, get by date/range, delete, summary, latest).
- ✅ Goals Management API (set, get, update, reset, progress tracking).
- ✅ [`User`](server/src/models/User.js) model with [`bcryptjs`](server/src/models/User.js) password hashing and partial unique indexes for Google ID.
- ✅ Data models for [`HealthMetric`](server/src/models/HealthMetric.js), [`Alert`](server/src/models/Alert.js), and [`Analytics`](server/src/models/Analytics.js).
- ✅ Protected routes with [`JWT middleware`](server/src/middleware/auth.js) to ensure secure access.
- ✅ CORS configuration for seamless frontend integration.
- ✅ Environment configuration setup using [`dotenv`](server/src/server.js).
- ✅ Graceful server shutdown handling.

#### Frontend (90% Complete) ✅
- ✅ React 19 + Vite 7 with Hot Module Replacement (HMR) for a fast development experience.
- ✅ Tailwind CSS v4 with a custom theme and utility classes for consistent styling.
- ✅ React Router v7 with protected routes using [`PrivateRoute.jsx`](client/src/components/common/PrivateRoute.jsx).
- ✅ [`AuthContext`](client/src/context/AuthContext.jsx) for global authentication state management.
- ✅ Configured [`Axios API layer`](client/src/api/axiosConfig.js) with interceptors for token attachment and centralized error handling.
- ✅ [`Auth service`](client/src/services/authService.js) for handling authentication API calls (register, login, getCurrentUser, updateProfile, logout).
- ✅ Complete authentication UI including [`Login.jsx`](client/src/pages/Login.jsx) and [`Register.jsx`](client/src/pages/Register.jsx) pages.
- ✅ Reusable UI components such as [`Button.jsx`](client/src/components/common/Button.jsx), [`Input.jsx`](client/src/components/common/Input.jsx), [`Card.jsx`](client/src/components/common/Card.jsx), and [`Alert.jsx`](client/src/components/common/Alert.jsx).
- ✅ Layout components including [`Header.jsx`](client/src/components/layout/Header.jsx) and [`Layout.jsx`](client/src/components/layout/Layout.jsx).
- ✅ [`Dashboard.jsx`](client/src/pages/Dashboard.jsx) page with integrated metrics cards ([`MetricCard.jsx`](client/src/components/dashboard/MetricCard.jsx)) and summary statistics ([`SummaryStats.jsx`](client/src/components/dashboard/SummaryStats.jsx)).
- ✅ [`Home.jsx`](client/src/pages/Home.jsx) landing page with a hero section.
- ✅ Form validation with real-time feedback for improved user experience.
- ✅ Password strength indicator during registration.
- ✅ Responsive design for optimal viewing on mobile and desktop devices.
- ✅ Comprehensive loading states and error handling across the application.
- ✅ Health metrics input form ([`MetricsForm.jsx`](client/src/components/dashboard/MetricsForm.jsx)) and display list ([`MetricsList.jsx`](client/src/components/dashboard/MetricsList.jsx)).
- ✅ Goals setting and display components ([`GoalsForm.jsx`](client/src/components/dashboard/GoalsForm.jsx), [`GoalsSection.jsx`](client/src/components/dashboard/GoalsSection.jsx)).

### Planned Features (In Development)
- 🚧 Interactive data visualizations with Recharts for health metrics and goal progress.
- 🚧 Dedicated profile management page with options to update user details.
- 🚧 Google Fit API integration for automatic health data synchronization.
- 🚧 Predictive health analytics with Apache Spark for personalized insights.
- 🚧 Real-time notifications system for goal achievements and health alerts.
- 🚧 Social features for sharing progress and connecting with friends.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB (local instance or a free MongoDB Atlas account)
- Git

### Installation

1.  **Clone the repository**
    ```bash
    git clone git@github.com:Ojas-1008/health-metrics-monitoring-system.git
    cd health-metrics-monitoring-system
    ```

2.  **Install client dependencies**
    ```bash
    cd client
    npm install
    ```

3.  **Install server dependencies**
    ```bash
    cd ../server
    npm install
    ```

4.  **Set up environment variables (server)**
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

5.  **Set up environment variables (client)**

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

## ⚙️ Development

### Frontend Development

-   **Hot Module Replacement (HMR)**: Vite provides instant updates without a full page reload, significantly speeding up development.
-   **Tailwind CSS**: Utilizes a utility-first approach for styling, allowing for rapid UI development and easy customization with a defined custom theme in [`tailwind.config.js`](client/tailwind.config.js).
-   **Component Structure**: Organized logically by feature (e.g., `auth`, `metrics`, `charts`, `common`, `dashboard`) for maintainability and scalability.
-   **State Management**: [`Zustand`](client/package.json) is used for lightweight and efficient global state management, making state accessible across components.
-   **API Proxy**: [`Vite`](client/vite.config.js) is configured to proxy `/api` requests to the backend server, simplifying API calls during development.

### Backend Development

-   **MVC Architecture**: The backend follows a clear Model-View-Controller pattern, separating concerns for better organization and testability.
-   **RESTful API**: Adheres to REST principles, using standard HTTP methods and status codes for predictable and efficient communication.
-   **Validation**: [`express-validator`](server/src/middleware/validator.js) is integrated to provide robust input sanitization and validation, ensuring data integrity and security.
-   **Error Handling**: A centralized error handling middleware ([`errorHandler.js`](server/src/middleware/errorHandler.js)) ensures consistent and informative error responses across the API.
-   **Security**: Implements JWT authentication, [`bcryptjs`](server/src/models/User.js) for password hashing, and [`CORS`](server/src/server.js) to secure the application.

### Code Quality

-   **ESLint**: Enforces consistent code style and best practices for React and JavaScript.
-   **Git Hooks**: (Coming soon) Pre-commit linting and formatting to maintain code quality before commits.
-   **Documentation**: Comprehensive `README.md` files in each directory provide context and guidance.

### Custom Tailwind Theme

The [`tailwind.config.js`](client/tailwind.config.js) file defines a custom primary color palette, ensuring a consistent and branded look throughout the application.

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

The application utilizes custom CSS classes defined within the Tailwind ecosystem for common UI elements:

-   `.btn-primary` - Styles for the primary action button.
-   `.btn-secondary` - Styles for secondary action buttons.
-   `.input-field` - Standardized styling for form input elements.
-   `.card` - Styling for card-like containers with shadows and padding.

## 🏗 Architecture

### Frontend Architecture

```
React Application Structure
├── App.jsx (Root component with React Router configuration)
│   ├── AuthProvider (Global authentication state management via AuthContext)
│   ├── Routes
│   │   ├── Public Routes
│   │   │   ├── / (Home landing page)
│   │   │   ├── /login (Login page - redirects to dashboard if authenticated)
│   │   │   └── /register (Registration page - redirects to dashboard if authenticated)
│   │   ├── Protected Routes (require user authentication)
│   │   │   ├── /dashboard (Main application dashboard)
│   │   │   ├── /profile (User profile management page - placeholder)
│   │   │   └── /settings (Application settings page - placeholder)
│   │   └── /404 (Catch-all route for Not Found pages)
│
├── context/
│   └── AuthContext.jsx (Provides authentication state, login/register/logout functions, and useAuth hook)
│
├── services/
│   └── authService.js (Handles API calls related to user authentication: register, login, getCurrentUser, updateProfile, logout)
│   └── goalsService.js (Handles API calls related to user goals: set, get, update, reset, progress)
│   └── metricsService.js (Handles API calls related to health metrics: add, get, update, delete, summary, latest)
│
├── components/
│   ├── common/ (Reusable UI components: Button, Input, Card, Alert, PrivateRoute)
│   └── layout/ (Structural components: Header, Layout)
│   └── dashboard/ (Dashboard specific components: GoalsForm, GoalsSection, MetricCard, MetricsForm, MetricsList, SummaryStats)
│
└── pages/
    ├── Home.jsx (Public landing page)
    ├── Login.jsx (User login interface)
    ├── Register.jsx (User registration interface with password strength)
    ├── Dashboard.jsx (Authenticated user's main dashboard displaying metrics and goals)
    └── NotFound.jsx (Custom 404 error page)
```

### Backend Architecture

```
Express API Structure
├── server.js (Main entry point for the Express application)
│   ├── Middleware Chain
│   │   ├── CORS (Handles Cross-Origin Resource Sharing)
│   │   ├── Body Parser (Parses JSON and URL-encoded request bodies)
│   │   ├── Request Logger (Logs incoming requests in development mode)
│   │   ├── Routes (Dispatches requests to appropriate route handlers)
│   │   ├── 404 Handler (Catches requests to undefined routes)
│   │   └── Error Handler (Centralized error handling middleware)
│   │
│   ├── Routes
│   │   ├── /api/health (Endpoint for server health check)
│   │   ├── /api/auth/* (Authentication-related endpoints: register, login, me, updateProfile, logout)
│   │   ├── /api/metrics/* (Health metrics CRUD and summary endpoints)
│   │   └── /api/goals/* (Goals management endpoints)
│   │
│   ├── Controllers
│   │   ├── authController.js (Implements logic for authentication operations)
│   │   ├── healthMetricsController.js (Implements logic for health metrics operations)
│   │   └── goalsController.js (Implements logic for goals management operations)
│   │
│   ├── Models (Mongoose schemas for MongoDB collections)
│   │   ├── User.js (Defines user schema, including password hashing and goals)
│   │   ├── HealthMetric.js (Defines schema for daily health metrics)
│   │   ├── Alert.js (Defines schema for user notifications)
│   │   └── Analytics.js (Defines schema for health insights and predictions)
│   │
│   ├── Middleware
│   │   ├── auth.js (JWT protection middleware for private routes)
│   │   ├── validator.js (express-validator chains for input validation)
│   │   └── errorHandler.js (Custom error handling and ErrorResponse class)
│   │
│   └── Config
│       └── database.js (Handles MongoDB connection setup)
```

### Data Flow

```
Client Request → Vite Proxy → Express Server
                                    ↓
                           Middleware Chain:
                           1. CORS (Ensures secure cross-origin communication)
                           2. Body Parser (Parses request payload)
                           3. Request Logger (Logs request details in development)
                           4. Route Matching (Directs request to the correct handler)
                                    ↓
                      Protected Route → JWT Middleware (protect) (Verifies authentication token)
                                    ↓
                           Validation Middleware (express-validator) (Validates request data)
                                    ↓
                           Controller (wrapped in asyncHandler) (Executes business logic)
                                    ↓
                           Mongoose Model (Interacts with MongoDB)
                                    ↓
                           MongoDB Atlas (Persistent data storage)
                                    ↓
                           Response ← ErrorResponse (if error) (Returns structured error if any)
                                    ↓
Client Response ← JSON Response ← Express (Sends back the final JSON response)
```

### Request/Response Flow Example

```
1. User submits login form on the frontend.
   ↓
2. AuthContext.login() is called, triggering the authentication process.
   ↓
3. authService.login() makes an axios.post('/api/auth/login') request to the backend.
   ↓
4. Vite proxy intercepts the /api/auth/login request and forwards it to the Express server running on :5000.
   ↓
5. Express server receives the request and applies middleware: CORS, Body Parser, and Request Logger.
   ↓
6. The request is routed to authController.js, where email and password are validated.
   ↓
7. The controller verifies credentials against the User model using bcrypt.
   ↓
8. If credentials are valid, a JWT token is generated and returned in the response.
   ↓
9. The token is stored in localStorage on the client-side.
   ↓
10. An Axios interceptor automatically attaches this token to all subsequent protected requests.
    ↓
11. The user is redirected to the /dashboard page, now authenticated.
```

## 📡 API Documentation

### Base URL
```
Development: http://localhost:5000/api
Production: TBD (e.g., https://api.healthmetrics.com/api)
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
  "name": "New Name",
  "profilePicture": "https://example.com/new-photo.jpg",
  "goals": {
    "stepGoal": 12000,
    "sleepGoal": 8
  }
}

Response: 200 OK
{
  "success": true,
  "message": "Profile updated successfully",
  "user": { "id": "...", "name": "New Name", "email": "...", "profilePicture": "...", "goals": {...} }
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

1.  Fork the repository
2.  Create a feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

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

**Development Status**: ✅ **Core Features Complete** - Backend API fully functional, Frontend authentication, UI foundation, health metrics input, and goal management complete.

**Next Steps**: Implement interactive data visualizations, profile management, and Google Fit integration.

Last Updated: November 4, 2025