/**
 * ============================================
 * AUTHENTICATION SERVICE
 * ============================================
 * 
 * Purpose: Centralized authentication logic for the Health Metrics app
 * 
 * Functions:
 * - register()      : Create new user account
 * - login()         : Authenticate user and store token
 * - getCurrentUser(): Fetch authenticated user details
 * - updateProfile() : Update user profile information
 * - logout()        : Clear authentication and redirect
 * 
 * Integrates with:
 * - Backend API (authController.js, authRoutes.js)
 * - Axios instance (axiosConfig.js)
 * - localStorage for token persistence
 * 
 * Error Handling:
 * - Validates input before API calls
 * - Catches and formats API errors
 * - Returns standardized response format
 */

import axiosInstance, { setAuthToken, removeAuthToken, getAuthToken } from '../api/axiosConfig.js';

/**
 * ============================================
 * UTILITY: INPUT VALIDATION
 * ============================================
 */

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * Backend requirements: 8+ chars, 1 uppercase, 1 number, 1 special char
 * @param {string} password - Password to validate
 * @returns {object} - { isValid: boolean, message: string }
 */
const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long',
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter',
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one number',
    };
  }

  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one special character',
    };
  }

  return { isValid: true, message: 'Password is valid' };
};

/**
 * ============================================
 * REGISTER NEW USER
 * ============================================
 * 
 * Creates a new user account and automatically logs them in
 * 
 * Backend endpoint: POST /api/auth/register
 * Backend request body: { name, email, password, confirmPassword }
 * Backend success response: { success: true, message, token, user }
 * Backend error response: { success: false, message }
 * 
 * @param {Object} userData - User registration data
 * @param {string} userData.name - User's full name
 * @param {string} userData.email - User's email address
 * @param {string} userData.password - User's password
 * @param {string} userData.confirmPassword - Password confirmation
 * 
 * @returns {Promise<Object>} - { success: boolean, message: string, user?: object, token?: string }
 * 
 * @example
 * const result = await register({
 *   name: "John Doe",
 *   email: "john@example.com",
 *   password: "Test1234!",
 *   confirmPassword: "Test1234!"
 * });
 */
export const register = async ({ name, email, password, confirmPassword }) => {
  try {
    // ===== CLIENT-SIDE VALIDATION =====
    
    // Validate required fields
    if (!name || !email || !password || !confirmPassword) {
      return {
        success: false,
        message: 'All fields are required',
      };
    }

    // Validate name length
    if (name.trim().length < 2) {
      return {
        success: false,
        message: 'Name must be at least 2 characters long',
      };
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return {
        success: false,
        message: 'Please enter a valid email address',
      };
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return {
        success: false,
        message: passwordValidation.message,
      };
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      return {
        success: false,
        message: 'Passwords do not match',
      };
    }

    // ===== API CALL =====
    
    // Development logging
    if (import.meta.env.VITE_NODE_ENV === 'development') {
      console.log('📝 Registering user:', { name, email });
    }

    // Make API request
    const response = await axiosInstance.post('/auth/register', {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      confirmPassword,
    });

    // ===== HANDLE SUCCESS RESPONSE =====
    
    // Extract data from backend response format
    const { success, message, token, user } = response.data;

    if (success && token) {
      // Store token in localStorage
      setAuthToken(token);

      // Development logging
      if (import.meta.env.VITE_NODE_ENV === 'development') {
        console.log('✅ Registration successful:', { user });
      }

      return {
        success: true,
        message: message || 'Registration successful',
        user,
        token,
      };
    }

    // Handle unexpected success response without token
    return {
      success: false,
      message: 'Registration failed. Please try again.',
    };

  } catch (error) {
    // ===== HANDLE ERROR RESPONSE =====
    
    // Development logging
    if (import.meta.env.VITE_NODE_ENV === 'development') {
      console.error('❌ Registration error:', error);
    }

    // Return formatted error (already processed by axios interceptor)
    return {
      success: false,
      message: error.message || 'Registration failed. Please try again.',
    };
  }
};

/**
 * ============================================
 * LOGIN USER
 * ============================================
 * 
 * Authenticates user credentials and stores JWT token
 * 
 * Backend endpoint: POST /api/auth/login
 * Backend request body: { email, password }
 * Backend success response: { success: true, message, token, user }
 * Backend error response: { success: false, message }
 * 
 * @param {Object} credentials - User login credentials
 * @param {string} credentials.email - User's email address
 * @param {string} credentials.password - User's password
 * 
 * @returns {Promise<Object>} - { success: boolean, message: string, user?: object, token?: string }
 * 
 * @example
 * const result = await login({
 *   email: "john@example.com",
 *   password: "Test1234!"
 * });
 */
export const login = async ({ email, password }) => {
  try {
    // ===== CLIENT-SIDE VALIDATION =====
    
    // Validate required fields
    if (!email || !password) {
      return {
        success: false,
        message: 'Email and password are required',
      };
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return {
        success: false,
        message: 'Please enter a valid email address',
      };
    }

    // ===== API CALL =====
    
    // Development logging
    if (import.meta.env.VITE_NODE_ENV === 'development') {
      console.log('🔐 Logging in user:', { email });
    }

    // Make API request
    const response = await axiosInstance.post('/auth/login', {
      email: email.trim().toLowerCase(),
      password,
    });

    // ===== HANDLE SUCCESS RESPONSE =====
    
    // Extract data from backend response format
    const { success, message, token, user } = response.data;

    if (success && token) {
      // Store token in localStorage
      setAuthToken(token);

      // Development logging
      if (import.meta.env.VITE_NODE_ENV === 'development') {
        console.log('✅ Login successful:', { user });
      }

      return {
        success: true,
        message: message || 'Login successful',
        user,
        token,
      };
    }

    // Handle unexpected success response without token
    return {
      success: false,
      message: 'Login failed. Please try again.',
    };

  } catch (error) {
    // ===== HANDLE ERROR RESPONSE =====
    
    // Development logging
    if (import.meta.env.VITE_NODE_ENV === 'development') {
      console.error('❌ Login error:', error);
    }

    // Return formatted error (already processed by axios interceptor)
    return {
      success: false,
      message: error.message || 'Login failed. Please check your credentials.',
    };
  }
};

/**
 * ============================================
 * GET CURRENT USER
 * ============================================
 * 
 * Fetches authenticated user's profile data
 * Requires valid JWT token in localStorage
 * 
 * Backend endpoint: GET /api/auth/me (protected route)
 * Backend success response: { success: true, user }
 * Backend error response: { success: false, message }
 * 
 * @returns {Promise<Object>} - { success: boolean, message: string, user?: object }
 * 
 * @example
 * const result = await getCurrentUser();
 * if (result.success) {
 *   console.log('Current user:', result.user);
 * }
 */
export const getCurrentUser = async () => {
  try {
    // ===== CHECK AUTHENTICATION =====
    
    const token = getAuthToken();
    if (!token) {
      return {
        success: false,
        message: 'No authentication token found. Please log in.',
      };
    }

    // ===== API CALL =====
    
    // Development logging
    if (import.meta.env.VITE_NODE_ENV === 'development') {
      console.log('👤 Fetching current user...');
    }

    // Make API request (token automatically attached by axios interceptor)
    const response = await axiosInstance.get('/auth/me');

    // ===== HANDLE SUCCESS RESPONSE =====
    
    // Extract data from backend response format
    const { success, user } = response.data;

    if (success && user) {
      // Development logging
      if (import.meta.env.VITE_NODE_ENV === 'development') {
        console.log('✅ User fetched successfully:', { user });
      }

      return {
        success: true,
        message: 'User data retrieved successfully',
        user,
      };
    }

    // Handle unexpected success response without user data
    return {
      success: false,
      message: 'Failed to retrieve user data',
    };

  } catch (error) {
    // ===== HANDLE ERROR RESPONSE =====
    
    // Development logging
    if (import.meta.env.VITE_NODE_ENV === 'development') {
      console.error('❌ Get current user error:', error);
    }

    // If 401 error, token is invalid/expired (already handled by interceptor)
    if (error.statusCode === 401) {
      return {
        success: false,
        message: 'Session expired. Please log in again.',
      };
    }

    // Return formatted error
    return {
      success: false,
      message: error.message || 'Failed to retrieve user data',
    };
  }
};

/**
 * ============================================
 * UPDATE USER PROFILE
 * ============================================
 * 
 * Updates authenticated user's profile information
 * Requires valid JWT token in localStorage
 * 
 * Backend endpoint: PUT /api/auth/profile (protected route)
 * Backend request body: { name?, email?, password?, currentPassword?, goals?, profilePicture? }
 * Backend success response: { success: true, message, user }
 * Backend error response: { success: false, message }
 * 
 * @param {Object} updates - Profile updates (all fields optional)
 * @param {string} [updates.name] - New name
 * @param {string} [updates.email] - New email address
 * @param {string} [updates.password] - New password
 * @param {string} [updates.currentPassword] - Current password (required if changing password)
 * @param {Object} [updates.goals] - Health goals object
 * @param {string} [updates.profilePicture] - Profile picture URL
 * 
 * @returns {Promise<Object>} - { success: boolean, message: string, user?: object }
 * 
 * @example
 * const result = await updateProfile({
 *   name: "John Smith",
 *   goals: { dailySteps: 10000, waterIntake: 2000 }
 * });
 */
export const updateProfile = async (updates) => {
  try {
    // ===== CHECK AUTHENTICATION =====
    
    const token = getAuthToken();
    if (!token) {
      return {
        success: false,
        message: 'No authentication token found. Please log in.',
      };
    }

    // ===== CLIENT-SIDE VALIDATION =====
    
    // Validate at least one field is being updated
    if (!updates || Object.keys(updates).length === 0) {
      return {
        success: false,
        message: 'No updates provided',
      };
    }

    // Validate name if provided
    if (updates.name && updates.name.trim().length < 2) {
      return {
        success: false,
        message: 'Name must be at least 2 characters long',
      };
    }

    // Validate email if provided
    if (updates.email && !isValidEmail(updates.email)) {
      return {
        success: false,
        message: 'Please enter a valid email address',
      };
    }

    // Validate password if provided
    if (updates.password) {
      const passwordValidation = validatePassword(updates.password);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: passwordValidation.message,
        };
      }

      // Current password is required when changing password
      if (!updates.currentPassword) {
        return {
          success: false,
          message: 'Current password is required to set a new password',
        };
      }
    }

    // ===== PREPARE REQUEST DATA =====
    
    const requestData = {};

    if (updates.name) requestData.name = updates.name.trim();
    if (updates.email) requestData.email = updates.email.trim().toLowerCase();
    if (updates.password) requestData.password = updates.password;
    if (updates.currentPassword) requestData.currentPassword = updates.currentPassword;
    if (updates.goals) requestData.goals = updates.goals;
    if (updates.profilePicture !== undefined) requestData.profilePicture = updates.profilePicture;

    // ===== API CALL =====
    
    // Development logging
    if (import.meta.env.VITE_NODE_ENV === 'development') {
      console.log('✏️ Updating user profile:', Object.keys(requestData));
    }

    // Make API request (token automatically attached by axios interceptor)
    const response = await axiosInstance.put('/auth/profile', requestData);

    // ===== HANDLE SUCCESS RESPONSE =====
    
    // Extract data from backend response format
    const { success, message, user } = response.data;

    if (success && user) {
      // Development logging
      if (import.meta.env.VITE_NODE_ENV === 'development') {
        console.log('✅ Profile updated successfully:', { user });
      }

      return {
        success: true,
        message: message || 'Profile updated successfully',
        user,
      };
    }

    // Handle unexpected success response without user data
    return {
      success: false,
      message: 'Failed to update profile',
    };

  } catch (error) {
    // ===== HANDLE ERROR RESPONSE =====
    
    // Development logging
    if (import.meta.env.VITE_NODE_ENV === 'development') {
      console.error('❌ Update profile error:', error);
    }

    // If 401 error, token is invalid/expired (already handled by interceptor)
    if (error.statusCode === 401) {
      return {
        success: false,
        message: 'Session expired. Please log in again.',
      };
    }

    // Return formatted error
    return {
      success: false,
      message: error.message || 'Failed to update profile',
    };
  }
};

/**
 * ============================================
 * LOGOUT USER
 * ============================================
 * 
 * Logs out user by calling backend endpoint and clearing local token
 * Redirects to login page after successful logout
 * 
 * Backend endpoint: POST /api/auth/logout (protected route)
 * Backend success response: { success: true, message }
 * 
 * @param {boolean} [redirect=true] - Whether to redirect to login page after logout
 * 
 * @returns {Promise<Object>} - { success: boolean, message: string }
 * 
 * @example
 * const result = await logout();
 * // User is logged out and redirected to /login
 * 
 * @example
 * // Logout without redirect (e.g., for session timeout)
 * const result = await logout(false);
 */
export const logout = async (redirect = true) => {
  try {
    // ===== CHECK AUTHENTICATION =====
    
    const token = getAuthToken();
    
    // Even if no token, still clear local storage and redirect
    if (!token) {
      removeAuthToken();
      
      if (redirect && typeof window !== 'undefined') {
        window.location.href = '/login';
      }

      return {
        success: true,
        message: 'Logged out successfully',
      };
    }

    // ===== API CALL =====
    
    // Development logging
    if (import.meta.env.VITE_NODE_ENV === 'development') {
      console.log('🚪 Logging out user...');
    }

    // Make API request (token automatically attached by axios interceptor)
    const response = await axiosInstance.post('/auth/logout');

    // ===== HANDLE SUCCESS RESPONSE =====
    
    const { message } = response.data;

    // Clear token from localStorage regardless of API response
    removeAuthToken();

    // Development logging
    if (import.meta.env.VITE_NODE_ENV === 'development') {
      console.log('✅ Logout successful');
    }

    // Redirect to login page
    if (redirect && typeof window !== 'undefined') {
      // Use setTimeout to allow any cleanup operations to complete
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    }

    return {
      success: true,
      message: message || 'Logged out successfully',
    };

  } catch (error) {
    // ===== HANDLE ERROR RESPONSE =====
    
    // Development logging
    if (import.meta.env.VITE_NODE_ENV === 'development') {
      console.error('❌ Logout error:', error);
    }

    // Even on error, clear token and redirect
    // This ensures user is logged out locally even if backend fails
    removeAuthToken();

    if (redirect && typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    }

    return {
      success: true, // Return success because local logout succeeded
      message: 'Logged out successfully (local)',
    };
  }
};

/**
 * ============================================
 * UTILITY: CHECK AUTHENTICATION STATUS
 * ============================================
 * 
 * Checks if user has a valid token stored
 * Note: This only checks token existence, not validity
 * Use getCurrentUser() to verify token is actually valid
 * 
 * @returns {boolean} - True if token exists, false otherwise
 * 
 * @example
 * if (isAuthenticated()) {
 *   console.log('User appears to be logged in');
 * }
 */
export const isAuthenticated = () => {
  return !!getAuthToken();
};

/**
 * ============================================
 * EXPORT ALL FUNCTIONS
 * ============================================
 */
export default {
  register,
  login,
  getCurrentUser,
  updateProfile,
  logout,
  isAuthenticated,
};
