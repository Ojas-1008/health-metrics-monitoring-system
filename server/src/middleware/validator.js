import { body, param, query, validationResult } from 'express-validator';

// ===== VALIDATION RESULT HANDLER =====
// This function checks if there were any validation errors
// Think of it as the "report card" for the data
export const handleValidationErrors = (req, res, next) => {
  // Get all validation errors from the request
  const errors = validationResult(req);
  
  // If there are no errors, continue to the next middleware
  if (errors.isEmpty()) {
    return next();
  }
  
  // If there ARE errors, send them back to the user
  // Format: array of error messages
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: errors.array().map(err => ({
      field: err.path,        // Which field has the problem
      message: err.msg,       // What's wrong with it
      value: err.value        // What value they sent (optional)
    }))
  });
};

// ===== EMAIL VALIDATION =====
// Checks if the email format is correct
export const validateEmail = () => {
  return body('email')
    .trim()                              // Remove extra spaces
    .notEmpty()                          // Can't be empty
    .withMessage('Email is required')
    .isEmail()                           // Must be valid email format
    .withMessage('Please provide a valid email address')
    .normalizeEmail();                   // Convert to lowercase
};

// ===== PASSWORD VALIDATION =====
// Checks if password is strong enough
export const validatePassword = (fieldName = 'password') => {
  return body(fieldName)
    .trim()
    .notEmpty()
    .withMessage(`${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`)
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .matches(/[@$!%*?&#]/)
    .withMessage('Password must contain at least one special character (@$!%*?&#)');
};

// ===== NAME VALIDATION =====
export const validateName = () => {
  return body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces');
};

// ===== REGISTRATION VALIDATION CHAIN =====
// Combines all validations needed for user registration
export const registerValidation = [
  validateName(),
  validateEmail(),
  validatePassword(),
  handleValidationErrors  // IMPORTANT: Must be last
];

// ===== LOGIN VALIDATION CHAIN =====
// Simpler validation for login (just check if fields exist)
export const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// ===== HEALTH METRICS VALIDATION =====
// Validation for health metrics data

// Validate date field
export const validateDate = () => {
  return body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Date must be in valid ISO format (YYYY-MM-DD)');
};

// Validate steps (must be positive number)
export const validateSteps = () => {
  return body('metrics.steps')
    .optional()
    .isInt({ min: 0, max: 100000 })
    .withMessage('Steps must be a number between 0 and 100,000');
};

// Validate distance (must be positive)
export const validateDistance = () => {
  return body('metrics.distance')
    .optional()
    .isFloat({ min: 0, max: 500 })
    .withMessage('Distance must be between 0 and 500 km');
};

// Validate calories
export const validateCalories = () => {
  return body('metrics.calories')
    .optional()
    .isInt({ min: 0, max: 10000 })
    .withMessage('Calories must be between 0 and 10,000');
};

// Validate weight
export const validateWeight = () => {
  return body('metrics.weight')
    .optional()
    .isFloat({ min: 30, max: 300 })
    .withMessage('Weight must be between 30 and 300 kg');
};

// Validate sleep hours
export const validateSleepHours = () => {
  return body('metrics.sleepHours')
    .optional()
    .isFloat({ min: 0, max: 24 })
    .withMessage('Sleep hours must be between 0 and 24');
};

// Complete health metrics validation chain
export const createMetricValidation = [
  validateDate(),
  validateSteps(),
  validateDistance(),
  validateCalories(),
  validateWeight(),
  validateSleepHours(),
  handleValidationErrors
];

// ===== UPDATE PROFILE VALIDATION =====
export const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('goals.stepGoal')
    .optional()
    .isInt({ min: 1000, max: 50000 })
    .withMessage('Step goal must be between 1,000 and 50,000'),
  
  body('goals.weightGoal')
    .optional()
    .isFloat({ min: 30, max: 300 })
    .withMessage('Weight goal must be between 30 and 300 kg'),
  
  body('goals.sleepGoal')
    .optional()
    .isFloat({ min: 4, max: 12 })
    .withMessage('Sleep goal must be between 4 and 12 hours'),
  
  handleValidationErrors
];

// ===== PASSWORD CHANGE VALIDATION =====
export const changePasswordValidation = [
  body('currentPassword')
    .trim()
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .trim()
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('New password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('New password must contain at least one number')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),
  
  handleValidationErrors
];

// ===== MONGODB ID VALIDATION =====
// Validate MongoDB ObjectId format in URL parameters
export const validateMongoId = (paramName = 'id') => {
  return param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName} format`);
};

// ===== QUERY PARAMETER VALIDATION =====
// For filtering and pagination
export const validateDateRange = () => {
  return [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be in valid ISO format'),
    
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be in valid ISO format')
      .custom((value, { req }) => {
        if (req.query.startDate && value) {
          const start = new Date(req.query.startDate);
          const end = new Date(value);
          if (end < start) {
            throw new Error('End date must be after start date');
          }
        }
        return true;
      }),
    
    handleValidationErrors
  ];
};

// ===== PAGINATION VALIDATION =====
export const validatePagination = () => {
  return [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    handleValidationErrors
  ];
};