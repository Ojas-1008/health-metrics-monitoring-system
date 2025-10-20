---
description: Repository Information Overview
alwaysApply: true
---

# Health Metrics Monitoring System Information

## Summary
A full-stack health tracking application with real-time analytics and predictive insights. The system integrates with Google Fit API, provides data visualizations, and uses predictive analytics to help users achieve health goals.

## Structure
- **client/**: React frontend application with Vite
- **server/**: Node.js/Express backend API
- **spark-analytics/**: Planned Apache Spark data processing (in development)
- **docs/**: Additional documentation

## Language & Runtime
**Frontend Language**: JavaScript (React)
**Backend Language**: JavaScript (Node.js)
**Frontend Version**: React 19.2.0
**Backend Version**: Node.js v18+
**Build System**: Vite 7.1.7
**Package Manager**: npm

## Dependencies

### Frontend Dependencies
**Main Dependencies**:
- react: ^19.2.0
- react-dom: ^19.2.0
- react-router-dom: ^7.9.4
- recharts: ^3.3.0 (for data visualization)
- zustand: ^5.0.8 (state management)
- date-fns: ^4.1.0

**Development Dependencies**:
- vite: ^7.1.7
- tailwindcss: ^4.1.14
- eslint: ^9.38.0

### Backend Dependencies
**Main Dependencies**:
- express: ^4.19.2
- mongoose: ^8.19.1
- jsonwebtoken: ^9.0.2
- bcryptjs: ^2.4.3
- express-validator: ^7.0.1
- googleapis: ^134.0.0
- cors: ^2.8.5
- dotenv: ^16.4.5

**Development Dependencies**:
- nodemon: ^3.1.0

## Build & Installation

### Frontend
```bash
cd client
npm install
npm run dev    # Development server on http://localhost:5173
npm run build  # Production build
```

### Backend
```bash
cd server
npm install
npm run dev    # Development server with nodemon on http://localhost:5000
npm start      # Production server
```

## Database
**Type**: MongoDB
**Connection**: MongoDB Atlas (cloud) or local MongoDB
**ODM**: Mongoose 8.19.1
**Configuration**: Environment variables in .env file

## API Endpoints

### Authentication
- POST /api/auth/register - Register new user
- POST /api/auth/login - User login

### Health Metrics (Planned)
- GET /api/metrics - Get all user metrics
- POST /api/metrics - Create new metric
- GET /api/metrics/:id - Get single metric
- PUT /api/metrics/:id - Update metric
- DELETE /api/metrics/:id - Delete metric

## Frontend Architecture
- Modern React with functional components and hooks
- Zustand for lightweight state management
- Tailwind CSS for styling with custom theme
- React Router for navigation
- Vite for fast development and optimized builds
- Proxy configuration for API requests

## Backend Architecture
- Express.js REST API with MVC pattern
- JWT authentication
- MongoDB with Mongoose ODM
- Environment-based configuration
- Middleware for validation, authentication, and error handling