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

The Health Metrics Monitoring System is a comprehensive platform for tracking and analyzing personal health data. It integrates with Google Fit API, provides real-time visualizations, and uses predictive analytics to help users achieve their health goals.

### Key Capabilities

- 🔐 Secure user authentication with JWT
- 📊 Real-time health metrics tracking and visualization
- 📈 Predictive analytics using Apache Spark
- 🔄 Google Fit API integration for automatic data sync
- 📱 Responsive design for mobile and desktop
- 🎨 Modern UI with Tailwind CSS

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
│   │   ├── assets/                  # Images, fonts, icons
│   │   ├── components/              # Reusable React components
│   │   │   ├── auth/               # Authentication components
│   │   │   ├── charts/             # Chart wrapper components
│   │   │   ├── common/             # Shared UI components
│   │   │   └── metrics/            # Health metrics components
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── layouts/                 # Layout wrapper components
│   │   ├── pages/                   # Full page components
│   │   │   ├── auth/               # Login, Register pages
│   │   │   └── dashboard/          # Dashboard pages
│   │   ├── services/                # API integration (Axios)
│   │   ├── stores/                  # Zustand state stores
│   │   ├── utils/                   # Helper functions
│   │   ├── App.jsx                  # Root component
│   │   ├── App.css                  # Component styles
│   │   ├── index.css                # Global styles + Tailwind
│   │   └── main.jsx                 # App entry point
│   ├── index.html                   # HTML template
│   ├── package.json                 # Frontend dependencies
│   ├── vite.config.js              # Vite configuration
│   ├── tailwind.config.js          # Tailwind customization
│   ├── postcss.config.js           # PostCSS plugins
│   └── eslint.config.js            # ESLint rules
│
├── server/                          # Backend Node.js/Express API
│   ├── src/                         # Source code
│   │   ├── config/                  # Configuration files
│   │   │   ├── db.config.js        # MongoDB connection
│   │   │   ├── jwt.config.js       # JWT settings
│   │   │   └── cors.config.js      # CORS configuration
│   │   ├── controllers/             # Request handlers
│   │   │   ├── authController.js   # Authentication logic
│   │   │   └── metricsController.js # Metrics CRUD
│   │   ├── models/                  # Mongoose schemas
│   │   │   ├── User.model.js       # User schema
│   │   │   └── HealthMetric.model.js # Metrics schema
│   │   ├── routes/                  # API endpoints
│   │   │   ├── auth.routes.js      # /api/auth routes
│   │   │   └── metrics.routes.js   # /api/metrics routes
│   │   ├── middleware/              # Express middleware
│   │   │   ├── auth.middleware.js  # JWT verification
│   │   │   ├── validation.middleware.js # Input validation
│   │   │   └── error.middleware.js # Error handling
│   │   ├── services/                # Business logic
│   │   │   ├── authService.js      # Auth operations
│   │   │   ├── metricsService.js   # Metrics operations
│   │   │   └── googleFitService.js # Google Fit integration
│   │   ├── utils/                   # Helper functions
│   │   │   ├── errorHandler.js     # Custom error classes
│   │   │   └── validators.js       # Validation helpers
│   │   └── server.js                # Express app entry point
│   ├── .env.example                 # Environment variables template
│   ├── .gitignore                   # Git ignore patterns
│   ├── package.json                 # Backend dependencies
│   └── README.md                    # Server documentation
│
├── spark-analytics/                 # Apache Spark analytics (planned)
│   └── (Coming soon)
│
├── docs/                            # Additional documentation
│   └── (API docs, architecture diagrams)
│
├── .gitignore                       # Root Git ignore
├── package.json                     # Root workspace config
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
- ✅ Monorepo structure with client and server
- ✅ React + Vite frontend with HMR
- ✅ Tailwind CSS v4 with custom theme
- ✅ Organized folder structure with documentation
- ✅ Express backend with MVC architecture
- ✅ Environment configuration setup

### Planned Features (In Development)
- 🚧 User authentication (JWT)
- 🚧 Health metrics tracking (steps, calories, weight, sleep, heart rate)
- 🚧 Interactive data visualizations with Recharts
- 🚧 Goals management system
- 🚧 Google Fit API integration
- 🚧 Predictive health analytics with Spark
- 🚧 Real-time notifications
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

4. **Set up environment variables**
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
React Component Tree
├── App.jsx (Root)
├── Layouts
│   ├── DashboardLayout (with navbar/sidebar)
│   └── AuthLayout (centered)
├── Pages
│   ├── Auth (Login, Register)
│   └── Dashboard (Home, Metrics, Profile)
└── Components (Reusable)
```

### Backend Architecture

```
Express Middleware Chain
├── CORS
├── Body Parser
├── Routes
│   ├── /api/auth (public)
│   ├── /api/metrics (protected)
│   └── /api/user (protected)
├── Auth Middleware (JWT verify)
├── Validation Middleware
├── Controllers
├── Services (Business Logic)
└── Error Handler
```

### Data Flow

```
Client Request → Vite Proxy → Express → Middleware Chain 
→ Controller → Service → Model → MongoDB
→ Response ← ← ← ← ← ←
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
  "password": "securePassword123"
}

Response: 201 Created
{
  "token": "jwt-token-here",
  "user": { "id": "...", "name": "...", "email": "..." }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}

Response: 200 OK
{
  "token": "jwt-token-here",
  "user": { "id": "...", "name": "...", "email": "..." }
}
```

### Health Metrics Endpoints (Coming Soon)

```http
GET    /api/metrics          # Get all user metrics
POST   /api/metrics          # Create new metric
GET    /api/metrics/:id      # Get single metric
PUT    /api/metrics/:id      # Update metric
DELETE /api/metrics/:id      # Delete metric
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

**Development Status**: 🚧 In Active Development - Week 1: Project Setup Complete

Last Updated: October 19, 2025