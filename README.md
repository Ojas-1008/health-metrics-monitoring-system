# Health Metrics Monitoring System

A comprehensive health tracking application with Google Fit integration, real-time analytics, and predictive insights. Built with modern web technologies and designed for scalability and performance.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-19.2.0-blue)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4.4+-green)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express-4.19.2-lightgrey)](https://expressjs.com/)

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
- [Testing](#testing)
- [Contributing](#contributing)
- [Deployment](#deployment)
- [Performance](#performance)
- [Security](#security)

## 🎯 Overview

The Health Metrics Monitoring System is a comprehensive full-stack platform for tracking and analyzing personal health data. Built with React 19 and Express, it features a complete authentication system, health metrics tracking, goal management, Google Fit integration, and automated data synchronization.

### Current Status

**Backend (100% Complete)** ✅: Fully functional RESTful API with complete JWT authentication system, comprehensive health metrics CRUD operations (add, update, retrieve by date/range, delete, summary analytics), goals management with progress tracking, full Google Fit OAuth2 integration with token refresh, and automated scheduled data synchronization worker. All endpoints are fully tested and production-ready.

**Frontend (95% Complete)** ✅: Complete authentication system with login/registration pages, fully protected routing with PrivateRoute, comprehensive dashboard with health metrics input form, metrics display with filtering, goals management, real-time progress tracking, Google Fit connection UI with sync status, responsive design across all devices, and complete API service layer with error handling and interceptors. Advanced visualizations and profile management in active development.

### Project Philosophy

The Health Metrics Monitoring System is built with a focus on:

- **User Privacy**: All health data is securely stored with industry-standard encryption and access controls.
- **Data Accuracy**: Validation at multiple levels ensures only accurate health metrics are recorded.
- **User Experience**: A clean, intuitive interface that makes tracking health metrics effortless.
- **Interoperability**: Seamless integration with Google Fit for automated data collection.
- **Extensibility**: Modular architecture allows for easy addition of new health metrics and features.

### Target Audience

- Individuals looking to track and improve their health metrics
- Health enthusiasts who want to monitor progress toward fitness goals
- Users who want to consolidate health data from multiple sources
- People who need to share health data with healthcare providers

### Key Capabilities

- 🔐 **Complete Authentication System**: Secure JWT-based authentication (7-day token expiration) with [`bcryptjs`](server/src/models/User.js) password hashing (10 salt rounds), user registration with strong password validation, login with automatic token generation, logout, profile management, and secure password comparison.
- 📊 **Comprehensive Health Metrics API**: Full CRUD operations for daily health metrics including steps, calories, distance, sleep hours, weight, active minutes, **heartPoints** (phone-supported intensity metric), and additional metrics. The API explicitly excludes wearable-only metrics like heart rate or SpO2. Endpoints include date range filtering, daily summaries, latest metrics retrieval, and automatic data validation to ensure realistic values.
- 🎯 **Fitness Goals Management**: Complete goals API supporting setting, retrieving, updating (partial updates supported), and resetting personal fitness goals with real-time progress calculation, achievement tracking, and visual progress indicators on the frontend.
- 🔗 **Google Fit Integration**: Full OAuth2 implementation with secure token storage and refresh flow, automatic token refresh before expiry, comprehensive error handling, scopes for activity, body, nutrition, sleep, and location data, connection management (connect/disconnect), and **scope enforcement** blocking wearable-only scopes.
- 🔄 **Automated Data Synchronization**: Scheduled node-cron worker that runs at configurable intervals (default: every 15 minutes, via `SYNC_CRON_SCHEDULE`), fetches health data from Google Fit API for all connected users, stores metrics in MongoDB, and updates sync timestamps with comprehensive error logging, retry logic, and token refresh handling. Batch size configurable via `SYNC_BATCH_SIZE` (default 50), sync windows auto-capped at 30 days. Manual sync endpoints: `GET /api/googlefit/sync` and `GET /api/sync/trigger`.
- 📱 **Responsive React UI**: Modern React 19 frontend with Tailwind CSS 4 for responsive design across all devices, custom theme with primary color palette, utility classes for consistent styling, built with Vite for fast HMR development experience, and production-ready build optimization.
- ✅ **Comprehensive Input Validation**: Server-side validation using [`express-validator`](server/src/middleware/validator.js) with detailed error messages, database-level validation in Mongoose schemas, client-side real-time form validation with immediate feedback, and password strength requirements (8+ chars, 1 uppercase, 1 number, 1 special character).
- 🔄 **Real-time Feedback & UX**: Dynamic form validation with instant error messages, password strength indicator during registration, loading states for all async operations, success/error notifications via Alert component, auto-dismiss alerts, and smooth loading spinners during auth initialization.
- 🔔 **Server-Sent Events (SSE) for Real-Time Updates**: Multi-tab SSE connections with automatic heartbeat pings (15s interval), exponential backoff reconnection (1s-30s), client-side LRU event deduplication (50 events, 60s max age), optimized minimal payloads, and debug endpoints (`/api/events/debug/*`).
- 📈 **Advanced Analytics**: Backend endpoints providing daily, weekly, monthly, and yearly metrics summaries with averages, totals, min/max values, trend indicators, and goal progress percentages for comprehensive health insights.
- 🎨 **Modern UI with Custom Theme**: Custom Tailwind CSS theme with carefully chosen color palette (primary-50 through primary-900), reusable component library including Button, Input, Card, Alert, and PrivateRoute, responsive layouts, semantic HTML, and accessible design patterns.
- 🧪 **Comprehensive Testing Suite**: Jest-based testing with Supertest for endpoint testing, mongodb-memory-server for isolated database testing, unit tests for models and utilities, integration tests for API endpoints, and extensive manual testing guides with Thunder Client collection.
- 🔒 **Security Features**: JWT authentication with secure token extraction from Authorization headers, automatic token refresh for expired tokens, password hashing with bcrypt before storage, CORS configuration for frontend integration, partial unique index for optional fields (googleId), protected routes with middleware, and graceful error handling without sensitive information leakage.

## 🛠 Tech Stack

### Frontend
- **Framework**: React 19.2.0 - A declarative, component-based JavaScript library for building user interfaces with the latest hooks and concurrent features.
- **Build Tool**: Vite 7.1.7 - A fast development build tool that provides instant server start and Hot Module Replacement (HMR) for optimal developer experience.
- **Styling**: Tailwind CSS 4.1.14 - A utility-first CSS framework for rapidly building custom designs with a custom theme palette.
- **Routing**: React Router DOM 7.9.4 - Declarative routing for React applications with support for protected routes and navigation guards.
- **State Management**: Zustand 5.0.8 - A small, fast, and scalable bear-bones state-management solution for global state.
- **Charts**: Recharts 3.3.0 - A composable charting library built with React and D3 for health metrics visualization.
- **Date Utilities**: date-fns 4.1.0 - A modern JavaScript date utility library for date manipulation and formatting.
- **HTTP Client**: Axios 1.12.2 - Promise-based HTTP client with request/response interceptors for API communication.
- **Code Quality**: ESLint 9.38.0 - Pluggable JavaScript linter for identifying and reporting on patterns in JavaScript code.

### Backend
- **Runtime**: Node.js (v18+) - A JavaScript runtime built on Chrome's V8 JavaScript engine with ES Modules support.
- **Framework**: Express 4.19.2 - A fast, unopinionated, minimalist web framework for Node.js with robust middleware support.
- **Database**: MongoDB with Mongoose 8.19.1 - A NoSQL database and an elegant MongoDB object modeling for Node.js with schema validation.
- **Authentication**: JWT (jsonwebtoken 9.0.2) - JSON Web Token implementation for secure authentication with 7-day expiration.
- **Password Hashing**: bcryptjs 2.4.3 - A library for hashing passwords with 10 salt rounds for enhanced security.
- **Validation**: express-validator 7.2.1 - Middleware for Express that wraps validator.js and sanitization for input validation.
- **API Integration**: googleapis 164.0.0 - Google APIs client library for Node.js for Google Fit integration.
- **OAuth2 Flow**: Google OAuth2 implementation for secure Google Fit authentication with token refresh.
- **Data Synchronization**: node-cron 3.0.3 - Task scheduling for automated data sync every 15 minutes.
- **Security**: CORS 2.8.5 - Node.js CORS middleware for secure cross-origin requests.
- **Environment**: dotenv 16.4.5 - Loads environment variables from a `.env` file for configuration management.
- **Testing**: Jest 29.7.0 + Supertest 7.1.4 - Testing framework and HTTP endpoint testing for comprehensive test coverage.
- **Development**: nodemon 3.1.0 - Automatically restarts the Node.js server when file changes are detected.

### Analytics (Planned)
- **Engine**: Apache Spark - A unified analytics engine for large-scale data processing for advanced health analytics.
- **Language**: Python/Scala - Programming languages for Spark applications for data processing and machine learning.

### Development Tools
- **Dev Server**: Vite HMR - Hot Module Replacement for instant feedback during frontend development.
- **Backend Dev**: nodemon 3.1.0 - Automatically restarts the Node.js server when file changes are detected.
- **CSS Processing**: PostCSS 8.5.6, Autoprefixer 10.4.21 - Tools for transforming CSS with JavaScript and vendor prefixing.
- **Version Control**: Git & GitHub - Distributed version control system and platform for hosting code.
- **API Testing**: Thunder Client - REST API testing tool integrated with VS Code for endpoint testing.
- **Database Management**: MongoDB Atlas - Cloud-hosted MongoDB service for scalable data storage.

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
│   │   │   └── test/               # Test components for development
│   │   │       ├── GoogleFitTest.jsx
│   │   │       └── ConnectionStatusTest.jsx
│   │   ├── context/                 # React Context API for global state
│   │   │   └── AuthContext.jsx     # Manages authentication state and provides useAuth hook
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── layouts/                 # Page layouts (e.g., authenticated layout)
│   │   ├── pages/                   # Full page components
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
│   │   ├── main.jsx                 # Entry point for the React application
│   │   ├── README.md                # Client-specific documentation
│   │   ├── debug.js                 # Debug utilities
│   │   └── test-sse.js              # Server-Sent Events testing utilities
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
│   │   │   ├── database.js         # MongoDB connection setup
│   │   │   └── oauth.config.js     # Google OAuth configuration
│   │   ├── controllers/             # Request handlers (MVC pattern)
│   │   │   ├── authController.js   # Logic for user authentication (register, login, profile, logout)
│   │   │   ├── eventsController.js  # Server-Sent Events controller
│   │   │   ├── goalsController.js  # Logic for managing user goals
│   │   │   ├── googleFitController.js # Google Fit API integration
│   │   │   └── healthMetricsController.js # Logic for health metrics CRUD and analytics
│   │   ├── middleware/              # Express middleware functions
│   │   │   ├── auth.js             # JWT verification and route protection
│   │   │   ├── validator.js        # Input validation chains using express-validator
│   │   │   └── errorHandler.js     # Centralized error handling and custom ErrorResponse class
│   │   ├── models/                  # Mongoose schemas for MongoDB
│   │   │   ├── User.js             # User model with bcrypt hashing and goals sub-document
│   │   │   ├── HealthMetric.js     # Schema for daily health metrics
│   │   │   ├── Alert.js            # Schema for notifications/alerts
│   │   │   └── Analytics.js        # Schema for health insights (planned)
│   │   ├── routes/                  # API endpoints definitions
│   │   │   ├── authRoutes.js       # Routes for /api/auth endpoints
│   │   │   ├── eventsRoutes.js     # Routes for Server-Sent Events
│   │   │   ├── goalsRoutes.js      # Routes for /api/goals endpoints
│   │   │   ├── googleFitRoutes.js  # Routes for Google Fit integration
│   │   │   └── healthMetricsRoutes.js # Routes for /api/metrics endpoints
│   │   ├── services/                # Business logic layer (Google Fit integration)
│   │   ├── utils/                   # Helper functions and utilities
│   │   ├── __tests__/               # Unit and integration tests
│   │   │   ├── GoogleFitController.test.js
│   │   │   ├── googleFitHelper.test.js
│   │   │   ├── IndexPerformance.test.js
│   │   │   └── User.test.js
│   │   └── server.js                # Main Express application entry point
│   ├── scripts/                     # Utility scripts for database management
│   │   ├── checkDates.mjs          # Date validation utilities
│   │   ├── checkHeartPoints.mjs     # Heart points validation
│   │   ├── checkLastSync.mjs        # Last sync status checker
│   │   ├── checkRecentMetrics.mjs   # Recent metrics checker
│   │   ├── checkScope.mjs           # OAuth scope validation
│   │   ├── checkUserPreferences.mjs # User preferences checker
│   │   ├── diagnoseSync.mjs         # Sync diagnostics
│   │   ├── displayAllMetrics.mjs    # Display all metrics
│   │   ├── mongoHelper.mjs          # MongoDB helper utilities
│   │   ├── refreshTokenTest.mjs     # Token refresh testing
│   │   ├── resetLastSync.mjs        # Reset last sync timestamp
│   │   ├── setupTestUser.mjs        # Test user setup
│   │   ├── simulateSync.mjs         # Sync simulation
│   │   ├── testAggregation.mjs      # Aggregation testing
│   │   ├── testAllDataSources.mjs   # Data source testing
│   │   ├── testFullSync.mjs         # Full sync testing
│   │   ├── testGoogleFitDataSources.mjs # Google Fit data source testing
│   │   ├── testPhoneOnlyConstraints.mjs # Phone-only constraints testing
│   │   ├── testRawWeight.mjs        # Raw weight testing
│   │   ├── testRevokedToken.mjs     # Revoked token testing
│   │   ├── testWeightHeight.mjs     # Weight and height testing
│   │   ├── verify-metrics.js        # Metrics verification
│   │   └── verify-wearable-data.mjs # Wearable data verification
│   ├── migrations/                  # Database migration scripts
│   │   └── create-sync-indexes.js  # Create indexes for sync operations
│   ├── tests/                       # Additional test files and manual testing guides
│   │   ├── GoogleFitControllerManualTests.md
│   │   ├── README-ThunderClient.md
│   │   ├── User.test.js
│   │   ├── googleFitHelper.test.js
│   │   └── thunder-client-requests.json
│   ├── workers/                     # Background workers
│   │   ├── changeStreamWorker.js    # MongoDB change stream worker
│   │   └── googleFitSyncWorker.js   # Google Fit synchronization worker
│   ├── config/                      # Additional configuration files
│   │   ├── index.js                 # Main configuration
│   │   └── oauth.config.js          # OAuth configuration
│   ├── generate-token.js            # Token generation utility
│   ├── jest.config.js               # Jest testing configuration
│   ├── package.json                 # Backend dependencies and scripts
│   ├── README.md                    # Server-specific documentation
│   └── test-realtime-hook.js        # Real-time testing utilities
│
├── spark-analytics/                 # Apache Spark analytics (planned)
│   └── README.md

├── docs/                            # Documentation
│   └── EVENTSERVICE_TESTING.md       # Event service testing documentation

├── .gitignore                       # Root Git ignore file
├── package.json                     # Root workspace configuration
├── ROADMAP.txt                     # Development roadmap and planning
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
  "date-fns": "^4.1.0",            // Provides a comprehensive set of functions for manipulating dates.
  "axios": "^1.7.9"                // Promise-based HTTP client with request/response interceptors.
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
  "eslint-plugin-react": "^7.37.5",     // ESLint plugin for React specific linting rules.
  "eslint-plugin-react-hooks": "^7.0.0", // ESLint plugin for React Hooks rules.
  "eslint-plugin-react-refresh": "^0.4.24" // ESLint plugin for React Refresh.
}
```

### Backend Dependencies

#### Production
```json
{
  "express": "^4.19.2",            // Fast, unopinionated, minimalist web framework for Node.js.
  "mongoose": "^8.19.1",           // MongoDB object modeling tool designed to work in an asynchronous environment.
  "jsonwebtoken": "^9.0.2",        // An implementation of JSON Web Tokens for authorization.
  "bcryptjs": "^2.4.3",            // A library to help hash passwords.
  "express-validator": "^7.2.1",   // Middleware for Express that wraps validator.js.
  "googleapis": "^164.0.0",        // Google APIs client library for Node.js.
  "cors": "^2.8.5",                // Provides a Connect/Express middleware that can be used to enable CORS.
  "dotenv": "^16.4.5",             // Loads environment variables from a .env file into process.env.
  "node-cron": "^3.0.3",           // Task scheduling for automated data synchronization.
  "axios": "^1.7.9",               // Promise-based HTTP client for external API calls.
  "crypto": "^1.0.1",              // Node.js crypto module for security operations.
  "node-fetch": "^3.3.2",          // Fetch API for Node.js.
  "validator": "^13.15.15"         // String validation and sanitization.
}
```

#### Development
```json
{
  "nodemon": "^3.1.0",             // Automatically restarts the Node.js server when file changes are detected.
  "jest": "^29.7.0",               // JavaScript testing framework.
  "@jest/globals": "^29.7.0",      // Jest globals for ES modules.
  "supertest": "^7.1.4",           // HTTP endpoint testing for Express apps.
  "cross-env": "^7.0.3",           // Cross-platform environment variable setting.
  "mongodb-memory-server": "^10.1.4" // In-memory MongoDB server for testing.
}
```

## ✨ Features

### Current Features (Implemented)

#### Backend (100% Complete) ✅
- ✅ Monorepo structure with client and server applications for organized development.
- ✅ Express backend following a clear MVC (Model-View-Controller) architecture for maintainability.
- ✅ MongoDB Atlas integration with Mongoose ODM for robust data management and schema validation.
- ✅ JWT authentication system covering user registration, login, logout, and profile management with 7-day token expiration.
- ✅ Google Fit OAuth2 integration with secure token management and automatic refresh flow.
- ✅ Automated data synchronization worker (node-cron) that fetches health metrics from Google Fit API every 15 minutes.
- ✅ Comprehensive health metrics tracking including steps, calories, distance, sleep, weight, heart points, and more with phone-only enforcement.
- ✅ Centralized error handling with a custom [`ErrorResponse`](server/src/middleware/errorHandler.js) class for consistent API error messages.
- ✅ [`express-validator`](server/src/middleware/validator.js) input validation chains for all critical API endpoints.
- ✅ Comprehensive Health Metrics CRUD API (add, update, get by date/range, delete, summary, latest) with aggregation pipelines.
- ✅ Goals Management API (set, get, update, reset, progress tracking) with real-time calculation.
- ✅ [`User`](server/src/models/User.js) model with [`bcryptjs`](server/src/models/User.js) password hashing and Google Fit token storage.
- ✅ Data models for [`HealthMetric`](server/src/models/HealthMetric.js), [`Alert`](server/src/models/Alert.js), and [`Analytics`](server/src/models/Analytics.js).
- ✅ Protected routes with [`JWT middleware`](server/src/middleware/auth.js) to ensure secure access.
- ✅ CORS configuration for seamless frontend integration.
- ✅ Environment configuration setup using [`dotenv`](server/src/server.js) with comprehensive settings.
- ✅ Comprehensive testing suite with Jest and Supertest covering all major functionality.
- ✅ Extensive utility scripts for database management and diagnostics in the [`scripts`](server/scripts) directory.
- ✅ Graceful server shutdown handling for clean resource cleanup.
- ✅ Server-Sent Events (SSE) implementation for real-time updates to connected clients.
- ✅ MongoDB change stream worker for reactive data updates.

#### Frontend (95% Complete) ✅
- ✅ React 19 + Vite 7 with Hot Module Replacement (HMR) for a fast development experience.
- ✅ Tailwind CSS v4 with a custom theme and utility classes for consistent styling.
- ✅ React Router v7 with protected routes using [`PrivateRoute.jsx`](client/src/components/common/PrivateRoute.jsx).
- ✅ [`AuthContext`](client/src/context/AuthContext.jsx) for global authentication state management with localStorage persistence.
- ✅ Configured [`Axios API layer`](client/src/api/axiosConfig.js) with interceptors for token attachment and centralized error handling.
- ✅ [`Auth service`](client/src/services/authService.js) for handling authentication API calls (register, login, getCurrentUser, updateProfile, logout).
- ✅ Complete authentication UI including [`Login.jsx`](client/src/pages/Login.jsx) and [`Register.jsx`](client/src/pages/Register.jsx) pages with form validation.
- ✅ Reusable UI components such as [`Button.jsx`](client/src/components/common/Button.jsx), [`Input.jsx`](client/src/components/common/Input.jsx), [`Card.jsx`](client/src/components/common/Card.jsx), and [`Alert.jsx`](client/src/components/common/Alert.jsx).
- ✅ Layout components including [`Header.jsx`](client/src/components/layout/Header.jsx) and [`Layout.jsx`](client/src/components/layout/Layout.jsx) for consistent page structure.
- ✅ [`Dashboard.jsx`](client/src/pages/Dashboard.jsx) page with integrated metrics cards ([`MetricCard.jsx`](client/src/components/dashboard/MetricCard.jsx)) and summary statistics ([`SummaryStats.jsx`](client/src/components/dashboard/SummaryStats.jsx)).
- ✅ [`Home.jsx`](client/src/pages/Home.jsx) landing page with a hero section and feature highlights.
- ✅ Form validation with real-time feedback for improved user experience and error prevention.
- ✅ Password strength indicator during registration with visual feedback.
- ✅ Responsive design for optimal viewing on mobile and desktop devices with Tailwind breakpoints.
- ✅ Comprehensive loading states and error handling across the application with user-friendly messages.
- ✅ Health metrics input form ([`MetricsForm.jsx`](client/src/components/dashboard/MetricsForm.jsx)) and display list ([`MetricsList.jsx`](client/src/components/dashboard/MetricsList.jsx)) with date filtering.
- ✅ Goals setting and display components ([`GoalsForm.jsx`](client/src/components/dashboard/GoalsForm.jsx), [`GoalsSection.jsx`](client/src/components/dashboard/GoalsSection.jsx)) with progress visualization.
- ✅ Date utilities ([`dateUtils.js`](client/src/utils/dateUtils.js)) and validation helpers ([`validation.js`](client/src/utils/validation.js)) for consistent data handling.
- ✅ Complete API service layer ([`authService.js`](client/src/services/authService.js), [`goalsService.js`](client/src/services/goalsService.js), [`metricsService.js`](client/src/services/metricsService.js)).
- ✅ Google Fit connection management component ([`GoogleFitConnection.jsx`](client/src/components/dashboard/GoogleFitConnection.jsx)) with connection status, sync timestamps, and token expiry tracking.
- ✅ Server-Sent Events (SSE) client implementation for real-time updates with automatic reconnection.
- ✅ Component-based architecture with clear separation of concerns for maintainability.

## 📊 Detailed Implementation Status

### Backend Subsystems

#### Authentication System ✅
- **JWT Implementation**: 7-day token expiration with HS256 signing algorithm
- **User Model**: Email uniqueness, bcrypt password hashing with 10 salt rounds, Google Fit token storage
- **Protected Routes**: Middleware-based JWT verification with automatic `req.user` attachment
- **Token Management**: Automatic refresh token handling for Google Fit OAuth, token revocation on logout
- **Validation**: Express-validator chains with detailed error messages for register, login, profile updates

#### Health Metrics System ✅
- **CRUD Operations**: Add/update metrics (upsert), retrieve by date/range, delete, latest metrics
- **Supported Metrics**: Steps, distance, calories, active minutes, heartPoints (phone-supported), weight, sleep hours, height, blood pressure, body temperature, hydration
- **Wearable-Only Exclusion**: Heart rate, SpO2, wearable blood pressure explicitly rejected at controller, pre-save hooks, and scope validation
- **Date-based Storage**: One entry per day per user, indexed for fast queries
- **Summaries**: Daily, weekly, monthly, yearly analytics with averages, totals, min/max
- **Validation**: Realistic value ranges with error messages, data type checking, automatic data sanitization

#### Goals Management ✅
- **Goal Types**: Steps, calories, sleep, weight, distance with configurable targets
- **Progress Tracking**: Real-time calculation against current metrics, percentage complete
- **CRUD**: Set, retrieve, update (partial supported), reset to defaults
- **User-specific**: Goals stored as sub-documents in User model

#### Google Fit Integration ✅
- **OAuth2 Flow**: Full authorization URL generation, callback handling with CSRF state validation
- **Token Management**: Secure token storage, automatic refresh before expiry, refresh token handling
- **Data Sync**: Fetches activity, body, nutrition, sleep, location data from Google Fit API
- **Sync Worker**: Node-cron scheduled task (configurable: SYNC_CRON_SCHEDULE, SYNC_BATCH_SIZE, SYNC_WORKER_ENABLED). Validates scopes, caps windows at 30 days
- **Scope Enforcement**: Rejects wearable-only scopes (heart rate, SpO2, blood pressure) during OAuth callback
- **Error Handling**: Comprehensive logging, retry logic, token expiry handling, scope mismatch detection
- **Manual Sync**: GET /api/googlefit/sync and GET /api/sync/trigger for testing

### Frontend Subsystems

#### Authentication Flow ✅
- **Registration**: Form validation, password strength indicator, duplicate email prevention
- **Login**: Email/password validation, token storage in localStorage, automatic redirect
- **Persistent Sessions**: Token restoration on app reload, automatic logout on token expiry
- **Protected Pages**: PrivateRoute component prevents unauthenticated access, preserves intended route

#### Dashboard System ✅
- **State Management**: Complex state for metrics, summaries, date ranges, UI state using React hooks
- **Date Range Filtering**: Preset ranges (today, last 7 days, last 30 days, all-time) with custom date pickers
- **Real-time Updates**: Auto-refresh after metric additions, optimistic UI updates
- **Responsive Layout**: Mobile-first design, collapsible sidebar, touch-friendly inputs

#### Health Metrics UI ✅
- **Metrics Form**: Date picker, input validation for all metric types, form reset after submission
- **Metrics Display**: List view with date headers, individual metric cards with values and trends
- **Summary Stats**: Widget-style cards showing weekly/monthly/yearly totals and averages
- **Visual Indicators**: Progress bars, trend arrows (up/down), achievement badges

#### Goals Management UI ✅
- **Goal Setting**: Form to configure all goal types with input validation
- **Progress Display**: Cards showing current vs. target, percentage completion, days to deadline
- **Achievement Tracking**: Visual indicators for completed goals, motivation messaging
- **Goal Updates**: Inline editing of goal values with backend persistence

### Platform Support

#### Browser Compatibility
- Modern browsers with ES6+ support (Chrome, Firefox, Safari, Edge)
- Responsive design tested on mobile, tablet, and desktop viewports
- Touch-optimized interface for mobile devices

#### Performance Optimizations
- Frontend: Code splitting with Vite, lazy loading of routes, image optimization
- Backend: Database indexes on userId, date, googleFitConnected fields
- Caching: Axios interceptors for request deduplication, localStorage for auth tokens
- API: Pagination-ready endpoints, aggregation pipelines for efficient summaries

### Planned Features (In Development)
- 🚧 Advanced data visualizations with Recharts for interactive health metrics charts, trend lines, and comparative analysis across time periods.
- 🚧 Dedicated profile management page with options to update user details, change password, profile picture management, and account settings.
- 🚧 Predictive health analytics with machine learning insights for personalized health recommendations.
- 🚧 Real-time notifications system for goal achievements, health alerts, and sync status updates.
- 🚧 Social features for sharing progress, comparing goals with friends, and community challenges.
- 🚧 Advanced dashboard customization and layout options with widget-based design.
- 🚧 Data export functionality (CSV, JSON, PDF reports) for personal records and medical sharing.
- 🚧 Mobile app development with React Native for iOS/Android platforms.
- 🚧 Progressive Web App (PWA) capabilities with offline support and home screen installation.
- 🚧 Apache Spark integration for large-scale data analytics and advanced statistical analysis.

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
    SYNC_CRON_SCHEDULE=*/15 * * * *
    SYNC_BATCH_SIZE=50
    SYNC_WORKER_ENABLED=true
    SYNC_TIMEZONE=Asia/Kolkata
    GOOGLE_FIT_API_TIMEOUT=30000
    GOOGLE_FIT_MAX_SYNC_WINDOW_DAYS=30
    OAUTH_STATE_EXPIRY_MINUTES=10
    TOKEN_REFRESH_BUFFER_MINUTES=5
    MAX_TOKEN_REFRESH_RETRIES=3
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

### Google Fit Endpoints (Implemented) ✅

#### Google OAuth Authorization
```http
GET /api/googlefit/auth
Authorization: Bearer <jwt>

Response: 302 Redirect
Redirects to Google OAuth2 authorization page
```

#### Google OAuth Callback
```http
GET /api/googlefit/callback?code=<authorization_code>&state=<csrf_token>

Response: 302 Redirect
Redirects to frontend with success/error status
```

#### Get Google Fit Connection Status
```http
GET /api/googlefit/status
Authorization: Bearer <jwt>

Response: 200 OK
{
  "success": true,
  "connected": true,
  "lastSync": "2025-11-03T15:30:00Z",
  "tokenExpiry": "2025-11-10T12:00:00Z"
}
```

#### Disconnect Google Fit
```http
DELETE /api/googlefit/disconnect
Authorization: Bearer <jwt>

Response: 200 OK
{
  "success": true,
  "message": "Google Fit disconnected successfully"
}
```

#### Trigger Manual Sync
```http
GET /api/googlefit/sync
Authorization: Bearer <jwt>

Response: 200 OK
{
  "success": true,
  "message": "Sync initiated",
  "syncId": "uuid-string"
}
```

### Server-Sent Events Endpoints (Implemented) ✅

#### Subscribe to Real-Time Updates
```http
GET /api/events/subscribe
Authorization: Bearer <jwt>
Accept: text/event-stream

Response: 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: {"type": "connected", "message": "Connected to event stream"}

data: {"type": "metric_update", "data": {...}}

data: {"type": "goal_achievement", "data": {...}}
```

#### Event Stream Debug Endpoints
```http
GET /api/events/debug/status
Authorization: Bearer <jwt>

Response: 200 OK
{
  "success": true,
  "activeConnections": 3,
  "uptime": "2h 15m 30s"
}
```

```http
POST /api/events/debug/ping
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "message": "Test message"
}

Response: 200 OK
{
  "success": true,
  "message": "Ping sent to all connections"
}
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

## � Testing

### Backend Testing

The backend includes a comprehensive test suite using Jest and Supertest:

#### Running Tests
```bash
cd server
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
```

#### Test Structure
- **Unit Tests**: Test individual functions and utilities
- **Integration Tests**: Test API endpoints with database operations
- **Controller Tests**: Test request handlers and business logic
- **Model Tests**: Test Mongoose schemas and validation
- **Middleware Tests**: Test authentication, validation, and error handling

#### Test Files
- `src/__tests__/User.test.js` - User model and authentication tests
- `src/__tests__/GoogleFitController.test.js` - Google Fit integration tests
- `src/__tests__/googleFitHelper.test.js` - Google Fit utility functions
- `src/__tests__/IndexPerformance.test.js` - Database performance tests
- `tests/User.test.js` - Additional user-related tests
- `tests/googleFitHelper.test.js` - Google Fit helper tests

#### Manual Testing
- `tests/GoogleFitControllerManualTests.md` - Manual testing guide for Google Fit features
- `tests/thunder-client-requests.json` - Thunder Client API testing collection

### Testing Dependencies
- **Jest**: Testing framework with ES modules support
- **Supertest**: HTTP endpoint testing for Express apps
- **MongoDB Memory Server**: In-memory MongoDB for isolated testing
- **Cross-env**: Cross-platform environment variable support

### Test Coverage
The test suite covers:
- ✅ User authentication (register, login, profile management)
- ✅ Health metrics CRUD operations
- ✅ Goals management and progress tracking
- ✅ Google Fit API integration
- ✅ Input validation and error handling
- ✅ Database operations and indexing
- ✅ API endpoint security and authorization

## �🤝 Contributing

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

## 🚀 Deployment

### Production Environment

The application is designed to be deployed in a production environment with the following considerations:

- **Frontend**: Can be deployed to any static hosting service (Vercel, Netlify, AWS S3, etc.)
- **Backend**: Requires Node.js 18+ runtime environment (Heroku, AWS EC2, Google Cloud, etc.)
- **Database**: MongoDB Atlas recommended for production with proper indexing
- **Environment Variables**: All sensitive data stored in environment variables, never in code
- **HTTPS**: Required for secure JWT transmission and OAuth2 callbacks

### Deployment Steps

1. **Backend Deployment**:
   ```bash
   # Set production environment variables
   NODE_ENV=production
   PORT=80
   MONGODB_URI=<production-mongodb-uri>
   JWT_SECRET=<strong-random-string>
   GOOGLE_CLIENT_ID=<google-oauth-client-id>
   GOOGLE_CLIENT_SECRET=<google-oauth-client-secret>
   
   # Install production dependencies
   cd server
   npm install --production
   
   # Start the server
   npm start
   ```

2. **Frontend Deployment**:
   ```bash
   # Build for production
   cd client
   npm run build
   
   # Deploy the dist/ folder to your hosting provider
   ```

### Docker Deployment

A Docker configuration can be created for containerized deployment:

```dockerfile
# Dockerfile (example)
FROM node:18-alpine

WORKDIR /app

# Copy backend files
COPY server/package*.json ./server/
RUN cd server && npm install --production

# Copy client files and build
COPY client/package*.json ./client/
RUN cd client && npm install && npm run build

# Copy backend source
COPY server/ ./server/

# Expose port
EXPOSE 5000

# Start the server
CMD ["node", "server/src/server.js"]
```

## ⚡ Performance

### Frontend Optimizations

- **Code Splitting**: Vite automatically splits code for optimal loading
- **Lazy Loading**: Components loaded on demand to reduce initial bundle size
- **Image Optimization**: Images optimized and served in modern formats
- **Caching**: Service worker implementation for offline functionality (planned)
- **Minification**: Production builds are minified for faster downloads

### Backend Optimizations

- **Database Indexing**: Critical fields indexed for fast queries
- **Pagination**: Large datasets served in pages to reduce load
- **Caching**: Frequently accessed data cached in memory (Redis planned)
- **Connection Pooling**: MongoDB connection pooling for efficient database access
- **Compression**: Gzip compression enabled for API responses

### Monitoring

- **Performance Metrics**: API response times tracked
- **Error Tracking**: Comprehensive error logging and alerting
- **Resource Usage**: Memory and CPU usage monitored
- **Database Performance**: Query optimization and slow query detection

## 🔒 Security

### Authentication & Authorization

- **JWT Tokens**: Secure token-based authentication with 7-day expiration
- **Password Security**: bcrypt with 10 salt rounds for password hashing
- **Protected Routes**: All sensitive endpoints protected with JWT middleware
- **Token Refresh**: Automatic token refresh for Google Fit API access

### Data Protection

- **Input Validation**: All user inputs validated and sanitized
- **SQL Injection Prevention**: Mongoose ORM prevents injection attacks
- **XSS Protection**: Content Security Policy headers implemented
- **HTTPS Only**: Production deployment requires HTTPS for all communications

### Privacy & Compliance

- **Data Minimization**: Only necessary health data collected and stored
- **User Consent**: Explicit consent required for Google Fit integration
- **Data Portability**: Users can export their health data (planned feature)
- **Right to Deletion**: Users can request account and data deletion

### Security Best Practices

- **Environment Variables**: All sensitive data stored in environment variables
- **Dependency Updates**: Regular updates to address security vulnerabilities
- **Rate Limiting**: API rate limiting to prevent abuse (planned)
- **Security Headers**: Proper security headers implemented

## 🙏 Acknowledgments

- React Team for React 19
- Tailwind Labs for Tailwind CSS
- Vercel for Vite
- MongoDB for Atlas
- Google for Fit API

---

**Development Status**: ✅ **Production Ready** - Backend API fully functional (100% complete) with comprehensive testing suite, comprehensive health metrics and goals management, Google Fit OAuth2 integration, and automated data synchronization. Frontend authentication and dashboard complete (95% complete) with robust API integration, real-time metrics tracking, goals management, and responsive design.

**Current Phase**: Advanced Visualizations & Enhanced UX - Implementing interactive Recharts visualizations, profile management page, data export features, and additional analytics endpoints.

**Last Updated**: November 10, 2025