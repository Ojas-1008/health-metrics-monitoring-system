/**
 * ============================================
 * VALIDATION UTILITIES
 * ============================================
 * 
 * Client-side validation functions matching backend requirements
 * Provides real-time validation feedback for forms
 * 
 * Backend requirements reference: server/src/middleware/validator.js
 */

/**
 * ============================================
 * EMAIL VALIDATION
 * ============================================
 * 
 * Validates email format using regex pattern
 * 
 * @param {string} email - Email address to validate
 * @returns {Object} - { isValid: boolean, message: string }
 * 
 * @example
 * const result = validateEmail('test@example.com');
 * if (!result.isValid) console.log(result.message);
 */
export const validateEmail = (email) => {
  // Check if email is provided
  if (!email || email.trim() === '') {
    return {
      isValid: false,
      message: 'Email is required',
    };
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      message: 'Please enter a valid email address',
    };
  }

  return {
    isValid: true,
    message: '',
  };
};

/**
 * ============================================
 * PASSWORD VALIDATION
 * ============================================
 * 
 * Validates password strength based on backend requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 number
 * - At least 1 special character
 * 
 * Backend reference: authController.js password validation
 * 
 * @param {string} password - Password to validate
 * @returns {Object} - { isValid: boolean, message: string, strength: string }
 * 
 * @example
 * const result = validatePassword('Test1234!');
 * console.log(result.strength); // 'strong'
 */
export const validatePassword = (password) => {
  // Check if password is provided
  if (!password || password.trim() === '') {
    return {
      isValid: false,
      message: 'Password is required',
      strength: 'none',
    };
  }

  // Minimum length check
  if (password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long',
      strength: 'weak',
    };
  }

  // Uppercase letter check
  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter',
      strength: 'weak',
    };
  }

  // Number check
  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one number',
      strength: 'medium',
    };
  }

  // Special character check (any non-alphanumeric)
  if (!/[^A-Za-z0-9]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one special character (!@#$%^&*)',
      strength: 'medium',
    };
  }

  // All checks passed - determine strength
  let strength = 'strong';
  
  // Extra strong: 12+ characters with multiple special chars
  if (password.length >= 12 && (password.match(/[^A-Za-z0-9]/g) || []).length >= 2) {
    strength = 'very strong';
  }

  return {
    isValid: true,
    message: '',
    strength,
  };
};

/**
 * ============================================
 * PASSWORD CONFIRMATION VALIDATION
 * ============================================
 * 
 * Validates that password confirmation matches original password
 * 
 * @param {string} password - Original password
 * @param {string} confirmPassword - Confirmation password
 * @returns {Object} - { isValid: boolean, message: string }
 */
export const validatePasswordConfirmation = (password, confirmPassword) => {
  if (!confirmPassword || confirmPassword.trim() === '') {
    return {
      isValid: false,
      message: 'Please confirm your password',
    };
  }

  if (password !== confirmPassword) {
    return {
      isValid: false,
      message: 'Passwords do not match',
    };
  }

  return {
    isValid: true,
    message: '',
  };
};

/**
 * ============================================
 * NAME VALIDATION
 * ============================================
 * 
 * Validates name field
 * - Minimum 2 characters
 * - Maximum 50 characters
 * - Required field
 * 
 * @param {string} name - Name to validate
 * @returns {Object} - { isValid: boolean, message: string }
 */
export const validateName = (name) => {
  if (!name || name.trim() === '') {
    return {
      isValid: false,
      message: 'Name is required',
    };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 2) {
    return {
      isValid: false,
      message: 'Name must be at least 2 characters long',
    };
  }

  if (trimmedName.length > 50) {
    return {
      isValid: false,
      message: 'Name must not exceed 50 characters',
    };
  }

  return {
    isValid: true,
    message: '',
  };
};

/**
 * ============================================
 * FORM VALIDATION
 * ============================================
 * 
 * Validates entire registration form
 * Returns object with field-specific errors
 * 
 * @param {Object} formData - Form data object
 * @param {string} formData.name - User's name
 * @param {string} formData.email - User's email
 * @param {string} formData.password - User's password
 * @param {string} formData.confirmPassword - Password confirmation
 * 
 * @returns {Object} - { isValid: boolean, errors: Object }
 * 
 * @example
 * const result = validateRegistrationForm(formData);
 * if (!result.isValid) {
 *   console.log(result.errors.email); // Error message for email field
 * }
 */
export const validateRegistrationForm = (formData) => {
  const errors = {};
  let isValid = true;

  // Validate name
  const nameResult = validateName(formData.name);
  if (!nameResult.isValid) {
    errors.name = nameResult.message;
    isValid = false;
  }

  // Validate email
  const emailResult = validateEmail(formData.email);
  if (!emailResult.isValid) {
    errors.email = emailResult.message;
    isValid = false;
  }

  // Validate password
  const passwordResult = validatePassword(formData.password);
  if (!passwordResult.isValid) {
    errors.password = passwordResult.message;
    isValid = false;
  }

  // Validate password confirmation
  const confirmResult = validatePasswordConfirmation(
    formData.password,
    formData.confirmPassword
  );
  if (!confirmResult.isValid) {
    errors.confirmPassword = confirmResult.message;
    isValid = false;
  }

  return {
    isValid,
    errors,
  };
};

/**
 * ============================================
 * LOGIN FORM VALIDATION
 * ============================================
 * 
 * Validates login form fields
 * 
 * @param {Object} formData - Form data object
 * @param {string} formData.email - User's email
 * @param {string} formData.password - User's password
 * 
 * @returns {Object} - { isValid: boolean, errors: Object }
 */
export const validateLoginForm = (formData) => {
  const errors = {};
  let isValid = true;

  // Validate email
  const emailResult = validateEmail(formData.email);
  if (!emailResult.isValid) {
    errors.email = emailResult.message;
    isValid = false;
  }

  // Check password is provided (don't validate strength for login)
  if (!formData.password || formData.password.trim() === '') {
    errors.password = 'Password is required';
    isValid = false;
  }

  return {
    isValid,
    errors,
  };
};

/**
 * ============================================
 * PASSWORD STRENGTH INDICATOR
 * ============================================
 * 
 * Returns visual indicator data for password strength
 * 
 * @param {string} password - Password to check
 * @returns {Object} - { strength: string, color: string, percentage: number }
 */
export const getPasswordStrength = (password) => {
  const result = validatePassword(password);
  
  const strengthMap = {
    'none': { color: 'gray', percentage: 0 },
    'weak': { color: 'red', percentage: 25 },
    'medium': { color: 'yellow', percentage: 50 },
    'strong': { color: 'green', percentage: 75 },
    'very strong': { color: 'green', percentage: 100 },
  };

  return {
    strength: result.strength || 'none',
    ...strengthMap[result.strength || 'none'],
    isValid: result.isValid,
  };
};
