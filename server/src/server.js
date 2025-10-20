import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/database.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Import test routes
import testRoutes from './routes/test.js';
import validatorTestRoutes from './routes/validatorTest.js';
import testErrorRoutes from './routes/testErrors.js';

// Import production routes
import authRoutes from './routes/authRoutes.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ===== TEST ROUTES =====
app.use('/api/test', testRoutes);
app.use('/api/validator-test', validatorTestRoutes);
app.use('/api/test-errors', testErrorRoutes);

// ===== PRODUCTION ROUTES =====
app.use('/api/auth', authRoutes);

// ===== 404 handler for unknown routes (should be after all routes)
app.use(notFound);

// ===== Global error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test the auth middleware at: http://localhost:${PORT}/api/test`);
  console.log(`Test validator routes at: http://localhost:${PORT}/api/validator-test`);
  console.log(`Test error routes at: http://localhost:${PORT}/api/test-errors`);
  console.log(`Auth API endpoints at: http://localhost:${PORT}/api/auth`);
});
