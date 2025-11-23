import express from 'express';
import {
  registerUser,
  loginUser,
  getCurrentUser,
  updateProfile,
  logoutUser
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  handleValidationErrors
} from '../middleware/validator.js';
import { loginLimiter, registerLimiter, authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * ============================================
 * AUTHENTICATION ROUTES
 * ============================================
 *
 * Purpose: Handle user registration, login, profile management
 * All routes use centralized error handling via errorHandler middleware
 */

// ===== PUBLIC ROUTES =====

/**
 * POST /api/auth/register
 * Register a new user
 *
 * Request Body:
 * {
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "password": "Test1234!",
 *   "confirmPassword": "Test1234!"
 * }
 */
router.post(
  '/register',
  registerLimiter.middleware,
  validateRegister,
  handleValidationErrors,
  registerUser
);

/**
 * POST /api/auth/login
 * Login user and return JWT token
 *
 * Request Body:
 * {
 *   "email": "john@example.com",
 *   "password": "Test1234!"
 * }
 */
router.post(
  '/login',
  loginLimiter.middleware,
  validateLogin,
  handleValidationErrors,
  loginUser
);

// ===== PROTECTED ROUTES (Require Authentication) =====

/**
 * GET /api/auth/me
 * Get current authenticated user's profile
 *
 * Headers:
 * Authorization: Bearer <token>
 */
router.get('/me', protect, authLimiter.middleware, getCurrentUser);

/**
 * PUT /api/auth/profile
 * Update authenticated user's profile
 *
 * Updatable fields: name, profilePicture, goals (nested)
 *
 * Headers:
 * Authorization: Bearer <token>
 *
 * Request Body (all optional):
 * {
 *   "name": "Jane Doe",
 *   "profilePicture": "https://example.com/photo.jpg",
 *   "goals": {
 *     "stepGoal": 12000,
 *     "sleepGoal": 8,
 *     "calorieGoal": 2200
 *   }
 * }
 */
router.put(
  '/profile',
  protect,
  authLimiter.middleware,
  validateProfileUpdate,
  handleValidationErrors,
  updateProfile
);

/**
 * POST /api/auth/logout
 * Logout user (client-side token deletion)
 *
 * Note: JWT is stateless. Real logout happens when client deletes token.
 * This endpoint is for logging/tracking purposes.
 *
 * Headers:
 * Authorization: Bearer <token>
 */
router.post('/logout', protect, authLimiter.middleware, logoutUser);

export default router;
