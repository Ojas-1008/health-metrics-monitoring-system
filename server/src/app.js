import express from 'express';
import cors from 'cors';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';

// Create Express app (no server listen here)
const app = express();

// Core middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Health Metrics API is running',
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Health Metrics Monitoring System API',
    version: '1.0.0',
  });
});

// Routes
app.use('/api/auth', authRoutes);

// 404 and error handlers (must be after routes)
app.use(notFound);
app.use(errorHandler);

export default app;
