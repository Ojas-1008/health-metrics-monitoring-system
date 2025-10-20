import express from 'express';
import {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validateHealthMetric,
  validateEmail,
  validateGoogleFitAuth,
  handleValidationErrors
} from '../middleware/validator.js';

const router = express.Router();

/**
 * ============================================
 * TEST ROUTES FOR VALIDATION MIDDLEWARE
 * ============================================
 * 
 * These routes simulate what your actual authentication
 * controllers will receive, but just return validation results.
 * 
 * Use these to test validation before building controllers:
 * - POST /api/test/register - Test registration validation
 * - POST /api/test/login - Test login validation
 * - PUT /api/test/profile - Test profile update validation
 * - POST /api/test/change-password - Test password change validation
 * - POST /api/test/health-metric - Test health metric validation
 * - POST /api/test/email - Test email validation
 * - POST /api/test/google-fit - Test Google Fit auth validation
 */

/**
 * Test Registration Validation
 * POST /api/test/register
 * 
 * Expected request body:
 * {
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "password": "SecurePass123!",
 *   "confirmPassword": "SecurePass123!"
 * }
 */
router.post('/register', validateRegister, handleValidationErrors, (req, res) => {
  res.status(200).json({
    success: true,
    message: '✅ Registration validation passed!',
    data: {
      name: req.body.name,
      email: req.body.email,
      // Don't return password in real implementation
      passwordLength: req.body.password.length
    }
  });
});

/**
 * Test Login Validation
 * POST /api/test/login
 * 
 * Expected request body:
 * {
 *   "email": "john@example.com",
 *   "password": "SecurePass123!"
 * }
 */
router.post('/login', validateLogin, handleValidationErrors, (req, res) => {
  res.status(200).json({
    success: true,
    message: '✅ Login validation passed!',
    data: {
      email: req.body.email
    }
  });
});

/**
 * Test Profile Update Validation
 * PUT /api/test/profile
 * 
 * Expected request body (all optional):
 * {
 *   "name": "Jane Doe",
 *   "profilePicture": "https://example.com/profile.jpg",
 *   "goals": {
 *     "weightGoal": 70,
 *     "stepGoal": 10000,
 *     "sleepGoal": 8,
 *     "calorieGoal": 2000,
 *     "distanceGoal": 5
 *   }
 * }
 */
router.put('/profile', validateProfileUpdate, handleValidationErrors, (req, res) => {
  res.status(200).json({
    success: true,
    message: '✅ Profile update validation passed!',
    data: req.body
  });
});

/**
 * Test Password Change Validation
 * POST /api/test/change-password
 * 
 * Expected request body:
 * {
 *   "currentPassword": "OldPass123!",
 *   "newPassword": "NewPass456!",
 *   "confirmNewPassword": "NewPass456!"
 * }
 */
router.post('/change-password', validatePasswordChange, handleValidationErrors, (req, res) => {
  res.status(200).json({
    success: true,
    message: '✅ Password change validation passed!',
    data: {
      message: 'Password validation successful'
    }
  });
});

/**
 * Test Health Metric Validation
 * POST /api/test/health-metric
 * 
 * Expected request body:
 * {
 *   "metricType": "steps",
 *   "value": 8500,
 *   "date": "2025-10-20",
 *   "unit": "steps",
 *   "notes": "Went for a morning jog"
 * }
 */
router.post('/health-metric', validateHealthMetric, handleValidationErrors, (req, res) => {
  res.status(200).json({
    success: true,
    message: '✅ Health metric validation passed!',
    data: req.body
  });
});

/**
 * Test Email Validation
 * POST /api/test/email
 * 
 * Expected request body:
 * {
 *   "email": "john@example.com"
 * }
 */
router.post('/email', validateEmail, handleValidationErrors, (req, res) => {
  res.status(200).json({
    success: true,
    message: '✅ Email validation passed!',
    data: {
      email: req.body.email
    }
  });
});

/**
 * Test Google Fit Authorization Validation
 * POST /api/test/google-fit
 * 
 * Expected request body:
 * {
 *   "authorizationCode": "4/0AY0e-g..."
 * }
 */
router.post('/google-fit', validateGoogleFitAuth, handleValidationErrors, (req, res) => {
  res.status(200).json({
    success: true,
    message: '✅ Google Fit authorization validation passed!',
    data: {
      authCodeLength: req.body.authorizationCode.length
    }
  });
});

/**
 * Health check endpoint for test routes
 * GET /api/test/health
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🟢 Validator test routes are running',
    routes: [
      'POST /api/test/register',
      'POST /api/test/login',
      'PUT /api/test/profile',
      'POST /api/test/change-password',
      'POST /api/test/health-metric',
      'POST /api/test/email',
      'POST /api/test/google-fit'
    ]
  });
});

export default router;
