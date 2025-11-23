import { body, validationResult, query } from "express-validator";
import User from "../models/User.js";

/**
 * ============================================
 * VALIDATION RESULT HANDLER MIDDLEWARE
 * ============================================
 *
 * Purpose: Extract and format validation errors from express-validator
 *
 * This middleware should be placed AFTER validation chains in routes
 * It checks if any validation errors occurred and returns formatted error response
 *
 * Usage:
 * router.post('/register', validateRegister, handleValidationErrors, controller)
 */

const handleValidationErrors = (req, res, next) => {
  // Extract validation errors from request
  const errors = validationResult(req);

  // If no errors, proceed to next middleware/controller
  if (errors.isEmpty()) {
    return next();
  }

  // Format errors into a more readable structure
  // Instead of: [{ msg: 'Error', param: 'email', location: 'body' }]
  // Return: { email: 'Error', password: 'Error' }
  const formattedErrors = {};
  let primaryMessage = "Validation failed. Please check your input.";

  errors.array().forEach((error) => {
    // Group errors by field name
    if (!formattedErrors[error.path]) {
      formattedErrors[error.path] = error.msg;
    }
    
    // Set primary message to first specific error for better UX
    if (!primaryMessage.includes("Validation failed")) {
      primaryMessage = error.msg;
    }
  });

  // If there's a single specific error, use it as the main message
  const errorKeys = Object.keys(formattedErrors);
  if (errorKeys.length === 1) {
    primaryMessage = formattedErrors[errorKeys[0]];
  }

  // Return 400 Bad Request with detailed error information
  return res.status(400).json({
    success: false,
    message: primaryMessage,
    errors: formattedErrors,
    errorCount: errors.array().length,
  });
};

/**
 * ============================================
 * REGISTRATION VALIDATION CHAIN
 * ============================================
 *
 * Validates user registration data:
 * - Name: required, 2-50 characters, trimmed
 * - Email: required, valid format, unique in database
 * - Password: required, min 8 chars, 1 uppercase, 1 number
 * - Confirm Password: must match password
 *
 * Security Features:
 * - Trim and sanitize inputs to prevent XSS attacks
 * - Check for duplicate emails before registration
 * - Strong password requirements
 */

const validateRegister = [
  // ===== NAME VALIDATION =====
  body("name")
    .trim() // Remove leading/trailing whitespace
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Name can only contain letters and spaces")
    .escape(), // Sanitize to prevent XSS attacks

  // ===== EMAIL VALIDATION =====
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail() // Converts email to lowercase and removes dots from Gmail addresses
    .custom(async (email) => {
      // Check if email already exists in database
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error(
          "Email is already registered. Please use a different email or log in."
        );
      }
      return true;
    }),

  // ===== PASSWORD VALIDATION =====
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage(
      "Password must contain at least one special character (!@#$%^&*...)"
    ),

  // ===== CONFIRM PASSWORD VALIDATION =====
  body("confirmPassword")
    .notEmpty()
    .withMessage("Please confirm your password")
    .custom((value, { req }) => {
      // Check if password and confirmPassword match
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
];

/**
 * ============================================
 * LOGIN VALIDATION CHAIN
 * ============================================
 *
 * Validates user login credentials:
 * - Email: required, valid format
 * - Password: required
 *
 * Note: We don't check password strength here since it's already validated during registration
 */

const validateLogin = [
  // ===== EMAIL VALIDATION =====
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  // ===== PASSWORD VALIDATION =====
  body("password").notEmpty().withMessage("Password is required"),
];

/**
 * ============================================
 * PROFILE UPDATE VALIDATION CHAIN
 * ============================================
 *
 * Validates profile update data (all fields optional):
 * - Name: 2-50 characters if provided
 * - Profile Picture: valid URL if provided
 * - Goals: numeric values within reasonable ranges
 *
 * Note: Email cannot be updated (security best practice)
 * Note: Password updates should use a separate endpoint with old password verification
 */

const validateProfileUpdate = [
  // ===== NAME VALIDATION (Optional) =====
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Name can only contain letters and spaces")
    .escape(),

  // ===== PROFILE PICTURE VALIDATION (Optional) =====
  body("profilePicture")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isURL({ protocols: ["http", "https"], require_protocol: true })
    .withMessage("Profile picture must be a valid URL")
    .isLength({ max: 500 })
    .withMessage("Profile picture URL is too long"),

  // ===== GOALS VALIDATION (Optional) =====

  // Weight Goal
  body("goals.weightGoal")
    .optional({ nullable: true })
    .isFloat({ min: 30, max: 300 })
    .withMessage("Weight goal must be between 30 and 300 kg")
    .toFloat(), // Convert string to number

  // Step Goal
  body("goals.stepGoal")
    .optional({ nullable: true })
    .isInt({ min: 1000, max: 50000 })
    .withMessage("Step goal must be between 1,000 and 50,000 steps")
    .toInt(),

  // Sleep Goal (in hours)
  body("goals.sleepGoal")
    .optional({ nullable: true })
    .isFloat({ min: 4, max: 12 })
    .withMessage("Sleep goal must be between 4 and 12 hours")
    .toFloat(),

  // Calorie Goal
  body("goals.calorieGoal")
    .optional({ nullable: true })
    .isInt({ min: 500, max: 5000 })
    .withMessage("Calorie goal must be between 500 and 5,000 calories")
    .toInt(),

  // Distance Goal (in kilometers)
  body("goals.distanceGoal")
    .optional({ nullable: true })
    .isFloat({ min: 0.5, max: 100 })
    .withMessage("Distance goal must be between 0.5 and 100 km")
    .toFloat(),
];

/**
 * ============================================
 * PASSWORD CHANGE VALIDATION CHAIN
 * ============================================
 *
 * Validates password change request:
 * - Current Password: required (for security verification)
 * - New Password: required, meets strength requirements
 * - Confirm New Password: must match new password
 */

const validatePasswordChange = [
  // ===== CURRENT PASSWORD VALIDATION =====
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  // ===== NEW PASSWORD VALIDATION =====
  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters long")
    .matches(/[A-Z]/)
    .withMessage("New password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("New password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("New password must contain at least one number")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("New password must contain at least one special character")
    .custom((value, { req }) => {
      // Ensure new password is different from current password
      if (value === req.body.currentPassword) {
        throw new Error("New password must be different from current password");
      }
      return true;
    }),

  // ===== CONFIRM NEW PASSWORD VALIDATION =====
  body("confirmNewPassword")
    .notEmpty()
    .withMessage("Please confirm your new password")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Password confirmation does not match");
      }
      return true;
    }),
];

/**
 * ============================================
 * HEALTH METRICS VALIDATION CHAIN (For Future Use)
 * ============================================
 *
 * Validates health metric data submission:
 * - Metric Type: required, must be valid type
 * - Value: required, must be non-negative number
 * - Date: valid date format
 * - Unit: required for certain metrics
 */

const validateHealthMetric = [
  // ===== METRIC TYPE VALIDATION =====
  body("metricType")
    .trim()
    .notEmpty()
    .withMessage("Metric type is required")
    .isIn([
      "steps",
      "weight",
      "sleep",
      "heart_rate",
      "calories",
      "distance",
      "blood_pressure",
    ])
    .withMessage(
      "Invalid metric type. Allowed types: steps, weight, sleep, heart_rate, calories, distance, blood_pressure"
    ),

  // ===== VALUE VALIDATION =====
  body("value")
    .notEmpty()
    .withMessage("Metric value is required")
    .isFloat({ min: 0 })
    .withMessage("Metric value must be a non-negative number")
    .toFloat(),

  // ===== DATE VALIDATION =====
  body("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be in valid ISO 8601 format (YYYY-MM-DD)")
    .toDate()
    .custom((date) => {
      // Ensure date is not in the future
      if (new Date(date) > new Date()) {
        throw new Error("Date cannot be in the future");
      }
      return true;
    }),

  // ===== UNIT VALIDATION =====
  body("unit")
    .trim()
    .notEmpty()
    .withMessage("Unit is required")
    .isIn(["steps", "kg", "lbs", "hours", "bpm", "kcal", "km", "miles", "mmHg"])
    .withMessage("Invalid unit"),

  // ===== NOTES VALIDATION (Optional) =====
  body("notes")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Notes cannot exceed 500 characters")
    .escape(), // Sanitize to prevent XSS
];

/**
 * ============================================
 * VALIDATE ADD/UPDATE METRICS (POST /api/metrics)
 * ============================================
 * Validates request body for adding or updating health metrics
 */
const validateAddOrUpdateMetrics = [
  // Date validation
  body('date')
    .trim()
    .notEmpty()
    .withMessage('Date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be in YYYY-MM-DD format')
    .custom((value) => {
      const date = new Date(value + 'T00:00:00.000Z');
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format');
      }
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      if (date > today) {
        throw new Error('Cannot add metrics for future dates');
      }
      return true;
    }),

  // Metrics object validation
  body('metrics')
    .notEmpty()
    .withMessage('Metrics object is required')
    .isObject()
    .withMessage('Metrics must be an object')
    .custom((value) => {
      if (!value || typeof value !== 'object' || Object.keys(value).length === 0) {
        throw new Error('At least one metric value is required');
      }
      return true;
    }),

  // Optional source validation
  body('source')
    .optional()
    .isIn(['manual', 'googlefit', 'import'])
    .withMessage('Source must be one of: manual, googlefit, import'),

  handleValidationErrors
];

/**
 * ============================================
 * VALIDATE UPDATE METRICS (PATCH /api/metrics/:date)
 * ============================================
 * Validates request body for partial metric updates
 */
const validateUpdateMetrics = [
  // Metrics object validation
  body('metrics')
    .notEmpty()
    .withMessage('Metrics object is required')
    .isObject()
    .withMessage('Metrics must be an object')
    .custom((value) => {
      if (!value || typeof value !== 'object' || Object.keys(value).length === 0) {
        throw new Error('At least one metric value is required');
      }
      return true;
    }),

  handleValidationErrors
];

/**
 * ============================================
 * VALIDATE DELETE METRICS BY DATE
 * ============================================
 * Validates query parameters for deleting health metrics by date
 */
const validateDeleteMetrics = [
  query('date')
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage('Date must be in YYYY-MM-DD format (ISO 8601)'),
  handleValidationErrors
];

/**
 * ============================================
 * EMAIL VALIDATION (Standalone)
 * ============================================
 *
 * For endpoints that only need email validation (e.g., forgot password, resend verification)
 */

const validateEmail = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
];

/**
 * ============================================
 * GOOGLE FIT CONNECTION VALIDATION
 * ============================================
 *
 * Validates Google Fit authorization code
 */

const validateGoogleFitAuth = [
  body("authorizationCode")
    .trim()
    .notEmpty()
    .withMessage("Authorization code is required")
    .isLength({ min: 10 })
    .withMessage("Invalid authorization code format"),
];

/**
 * ============================================
 * EXPORT ALL VALIDATION FUNCTIONS
 * ============================================
 */

export {
  // Validation result handler (MUST be used after validation chains)
  handleValidationErrors,

  // Authentication validations
  validateRegister,
  validateLogin,
  validatePasswordChange,

  // Profile validations
  validateProfileUpdate,

  // Health metrics validations
  validateHealthMetric,
  validateAddOrUpdateMetrics,
  validateUpdateMetrics,
  validateDeleteMetrics,

  // Utility validations
  validateEmail,
  validateGoogleFitAuth,
};
