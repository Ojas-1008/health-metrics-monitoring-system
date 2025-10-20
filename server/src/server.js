import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/database.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
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

// Define PORT
const PORT = process.env.PORT || 5000;

// ===== ROUTES (Must be defined BEFORE starting server) =====
app.use('/api/auth', authRoutes);

// ===== 404 HANDLER (Must be AFTER all routes) =====
app.use(notFound);       // 404 handler

// ===== ERROR HANDLER (Must be LAST middleware) =====
app.use(errorHandler);   // Error handler (MUST BE LAST)

// Connect to Database and Start Server
const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();
    
    // Start Express server only after successful DB connection
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      console.log(`📡 API endpoint: http://localhost:${PORT}/api`);
    });

    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;
