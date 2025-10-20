// ===== AUTHENTICATION ROUTES =====
// This file defines all authentication-related API endpoints
// Routes are organized into two categories:
// 1. Public routes - No authentication required (register, login)
// 2. Protected routes - Require valid JWT token (profile management, password change)

// Import Express Router to define routes
import express from 'express';

// Import authentication controllers
// These handle the business logic for each endpoint
import { 
  registerUser,      // POST /api/auth/register - Create new user account
  login,             // POST /api/auth/login - Authenticate user and return token
  getCurrentUser,    // GET /api/auth/me - Get current user profile
  updateProfile,     // PUT /api/auth/profile - Update user profile
  changePassword     // PUT /api/auth/change-password - Change user password
} from '../controllers/authController.js';

// Import authentication middleware
// This middleware verifies JWT tokens and attaches user data to request
import { authenticate } from '../middleware/auth.js';

// Import validation middleware
// These validate and sanitize incoming request data before it reaches controllers
import { 
  registerValidation,        // Validates name, email, password for registration
  loginValidation,           // Validates email and password for login
  updateProfileValidation,   // Validates profile update fields
  changePasswordValidation   // Validates current and new password
} from '../middleware/validator.js';

// Create Express router instance
const router = express.Router();

// ===== PUBLIC ROUTES =====
// These routes don't require authentication
// Anyone can access them to register or login

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user account
 * @access  Public
 * @body    { name, email, password }
 * @returns { success, message, data: { user, token } }
 */
router.post('/register', registerValidation, registerUser);

/**
 * @route   POST /api/auth/login
 * @desc    Login existing user and get authentication token
 * @access  Public
 * @body    { email, password }
 * @returns { success, message, data: { user, token } }
 */
router.post('/login', loginValidation, login);

// ===== PROTECTED ROUTES =====
// These routes require a valid JWT token in the Authorization header
// Format: "Authorization: Bearer <token>"

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user's profile
 * @access  Private (requires authentication)
 * @headers Authorization: Bearer <token>
 * @returns { success, message, data: { user } }
 */
router.get('/me', authenticate, getCurrentUser);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update current user's profile information
 * @access  Private (requires authentication)
 * @headers Authorization: Bearer <token>
 * @body    { name?, email?, goals?: { stepGoal?, weightGoal?, sleepGoal? } }
 * @returns { success, message, data: { user } }
 */
router.put('/profile', authenticate, updateProfileValidation, updateProfile);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change current user's password
 * @access  Private (requires authentication)
 * @headers Authorization: Bearer <token>
 * @body    { currentPassword, newPassword }
 * @returns { success, message }
 */
router.put('/change-password', authenticate, changePasswordValidation, changePassword);

// Export router to be mounted in main server.js
export default router;
