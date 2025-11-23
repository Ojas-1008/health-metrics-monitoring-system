/**
 * ============================================
 * AXIOS CONFIGURATION FOR HEALTH METRICS APP
 * ============================================
 * 
 * Purpose: Create a configured axios instance with:
 * - Automatic token attachment to protected requests
 * - Centralized error handling
 * - Request/response logging (development only)
 * - Token expiration handling
 * 
 * Integrates with backend API structure from authController.js
 */

import axios from 'axios';

/**
 * ============================================
 * CREATE AXIOS INSTANCE
 * ============================================
 * 
 * Base configuration for all API requests
 */
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * ============================================
 * REQUEST INTERCEPTOR
 * ============================================
 * 
 * Purpose: Attach JWT token to all protected requests
 * 
 * Process:
 * 1. Check if token exists in localStorage
 * 2. If exists, attach to Authorization header
 * 3. Log request details (development only)
 */
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const tokenKey = import.meta.env.VITE_TOKEN_KEY || 'health_metrics_token';
    const token = localStorage.getItem(tokenKey);

    // Attach token to Authorization header if exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Development logging
    if (import.meta.env.VITE_NODE_ENV === 'development') {
      console.log('🚀 API Request:', {
        method: config.method.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        hasToken: !!token,
        data: config.data,
      });
    }

    return config;
  },
  (error) => {
    // Log request errors
    if (import.meta.env.VITE_NODE_ENV === 'development') {
      console.error('❌ Request Error:', error);
    }
    return Promise.reject(error);
  }
);

/**
 * ============================================
 * RESPONSE INTERCEPTOR
 * ============================================
 * 
 * Purpose: Handle responses and errors globally
 * 
 * Success responses (2xx):
 * - Log response (development)
 * - Return response data directly
 * 
 * Error responses:
 * - 401 Unauthorized: Clear token, redirect to login
 * - 400, 403, 404, 500: Extract error message from backend format
 * - Network errors: Provide user-friendly message
 */
axiosInstance.interceptors.response.use(
  (response) => {
    // Development logging
    if (import.meta.env.VITE_NODE_ENV === 'development') {
      console.log('✅ API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }

    // Return response data directly
    // Backend format: { success: true, message, token?, user? }
    return response;
  },
  (error) => {
    // ===== EXTRACT ERROR INFORMATION =====
    const originalRequest = error.config;
    const statusCode = error.response?.status;
    const errorData = error.response?.data;

    // Development logging
    if (import.meta.env.VITE_NODE_ENV === 'development') {
      // Don't log 404s as errors, they are often expected (e.g. checking if resource exists)
      if (statusCode === 404) {
        console.log('ℹ️ API Resource Not Found (404):', {
          url: originalRequest?.url,
          message: errorData?.message
        });
      } else {
        console.error('❌ API Error:', {
          status: statusCode,
          url: originalRequest?.url,
          message: errorData?.message,
          fullError: error,
        });
      }
    }

    // ===== HANDLE SPECIFIC ERROR CASES =====

    /**
     * 401 UNAUTHORIZED - Token expired or invalid
     * Action: Clear token and redirect to login
     */
    if (statusCode === 401) {
      const tokenKey = import.meta.env.VITE_TOKEN_KEY || 'health_metrics_token';
      localStorage.removeItem(tokenKey);

      // Only redirect if not already on login/register page
      if (
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/register')
      ) {
        window.location.href = '/login';
      }

      return Promise.reject({
        message: 'Your session has expired. Please log in again.',
        statusCode: 401,
        originalError: error,
      });
    }

    /**
     * 429 TOO MANY REQUESTS - Rate limit exceeded
     * Action: Show user-friendly message with retry info
     */
    if (statusCode === 429) {
      const retryAfter = errorData?.retryAfter || 60;
      return Promise.reject({
        message: errorData?.message || `Too many requests. Please try again in ${retryAfter} seconds.`,
        statusCode: 429,
        retryAfter: retryAfter,
        originalError: error,
      });
    }

    /**
     * 400 BAD REQUEST - Validation errors or business logic errors
     * Extract message from backend: { success: false, message: "..." }
     */
    if (statusCode === 400) {
      return Promise.reject({
        message: errorData?.message || 'Invalid request. Please check your input.',
        statusCode: 400,
        originalError: error,
      });
    }

    /**
     * 403 FORBIDDEN - Insufficient permissions
     */
    if (statusCode === 403) {
      return Promise.reject({
        message: errorData?.message || 'You do not have permission to perform this action.',
        statusCode: 403,
        originalError: error,
      });
    }

    /**
     * 404 NOT FOUND - Resource not found
     */
    if (statusCode === 404) {
      return Promise.reject({
        message: errorData?.message || 'The requested resource was not found.',
        statusCode: 404,
        originalError: error,
      });
    }

    /**
     * 500 INTERNAL SERVER ERROR - Backend errors
     */
    if (statusCode === 500) {
      return Promise.reject({
        message: errorData?.message || 'Server error. Please try again later.',
        statusCode: 500,
        originalError: error,
      });
    }

    /**
     * NETWORK ERRORS - No response from server
     * Possible causes: Server down, no internet, CORS issues
     */
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        message: 'Request timeout. Please check your connection and try again.',
        statusCode: 'TIMEOUT',
        originalError: error,
      });
    }

    if (!error.response) {
      return Promise.reject({
        message: 'Network error. Please check your internet connection.',
        statusCode: 'NETWORK_ERROR',
        originalError: error,
      });
    }

    /**
     * FALLBACK - Generic error message
     */
    return Promise.reject({
      message: errorData?.message || 'An unexpected error occurred. Please try again.',
      statusCode: statusCode || 'UNKNOWN',
      originalError: error,
    });
  }
);

/**
 * ============================================
 * UTILITY: GET AUTH TOKEN
 * ============================================
 * 
 * Purpose: Helper function to retrieve stored token
 * 
 * @returns {string|null} - JWT token or null if not found
 */
export const getAuthToken = () => {
  const tokenKey = import.meta.env.VITE_TOKEN_KEY || 'health_metrics_token';
  return localStorage.getItem(tokenKey);
};

/**
 * ============================================
 * UTILITY: SET AUTH TOKEN
 * ============================================
 * 
 * Purpose: Helper function to store token after login/register
 * 
 * @param {string} token - JWT token from backend
 */
export const setAuthToken = (token) => {
  const tokenKey = import.meta.env.VITE_TOKEN_KEY || 'health_metrics_token';
  localStorage.setItem(tokenKey, token);
};

/**
 * ============================================
 * UTILITY: REMOVE AUTH TOKEN
 * ============================================
 * 
 * Purpose: Helper function to clear token on logout
 */
export const removeAuthToken = () => {
  const tokenKey = import.meta.env.VITE_TOKEN_KEY || 'health_metrics_token';
  localStorage.removeItem(tokenKey);
};

/**
 * ============================================
 * UTILITY: CHECK IF USER IS AUTHENTICATED
 * ============================================
 * 
 * Purpose: Check if token exists in localStorage
 * Note: This only checks existence, not validity (backend verifies)
 * 
 * @returns {boolean} - True if token exists, false otherwise
 */
export const isAuthenticated = () => {
  return !!getAuthToken();
};

/**
 * ============================================
 * EXPORT CONFIGURED AXIOS INSTANCE
 * ============================================
 */
export default axiosInstance;
