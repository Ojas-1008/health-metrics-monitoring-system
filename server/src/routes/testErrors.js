import express from 'express';
import { ErrorResponse, asyncHandler } from '../middleware/errorHandler.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * Test Route 1: Trigger CastError (Invalid MongoDB ObjectId)
 * GET /api/test-errors/cast-error
 */
router.get('/cast-error', asyncHandler(async (req, res) => {
  // Intentionally use an invalid ObjectId format
  const user = await User.findById('invalid-id-format-123');
  res.json({ user });
}));

/**
 * Test Route 2: Trigger Duplicate Key Error (Code 11000)
 * POST /api/test-errors/duplicate-key
 */
router.post('/duplicate-key', asyncHandler(async (req, res) => {
  // Try to create user with same email twice
  // First, create a user
  await User.create({
    name: 'Test User',
    email: 'duplicate@test.com',
    password: 'Test1234!'
  });
  
  // Then try to create another with same email (will trigger duplicate key error)
  await User.create({
    name: 'Another User',
    email: 'duplicate@test.com', // Same email - will fail
    password: 'Test1234!'
  });
  
  res.json({ message: 'This will never be reached' });
}));

/**
 * Test Route 3: Trigger Mongoose ValidationError
 * POST /api/test-errors/validation-error
 */
router.post('/validation-error', asyncHandler(async (req, res) => {
  // Try to create user without required fields
  const user = await User.create({
    // Missing name, email, password (all required)
  });
  
  res.json({ user });
}));

/**
 * Test Route 4: Trigger Custom ErrorResponse
 * GET /api/test-errors/custom-error
 */
router.get('/custom-error', asyncHandler(async (req, res) => {
  // Throw a custom error
  throw new ErrorResponse('This is a custom error for testing', 400);
}));

/**
 * Test Route 5: Trigger Generic 500 Error
 * GET /api/test-errors/generic-error
 */
router.get('/generic-error', asyncHandler(async (req, res) => {
  // Trigger a generic JavaScript error
  throw new Error('Something went wrong unexpectedly!');
}));

/**
 * Test Route 6: Trigger JSON Syntax Error
 * This is tested by sending malformed JSON in Thunder Client
 * No special route needed - just send invalid JSON to any POST route
 */

/**
 * Test Route 7: Test asyncHandler catches errors
 * GET /api/test-errors/async-error
 */
router.get('/async-error', asyncHandler(async (req, res) => {
  // Simulate async operation that fails
  await new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error('Async operation failed')), 100);
  });
  
  res.json({ message: 'This will never be reached' });
}));

/**
 * Test Route 8: Trigger resource not found (user doesn't exist)
 * GET /api/test-errors/user-not-found/:id
 */
router.get('/user-not-found/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    throw new ErrorResponse('User not found', 404);
  }
  
  res.json({ user });
}));

export default router;
