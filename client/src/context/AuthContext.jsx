/* eslint-disable react-refresh/only-export-components */
/**
* ============================================
* AUTHENTICATION CONTEXT
* ============================================
* 
* Purpose: Global authentication state management using React Context API
* 
* Features:
* - Centralized user state management
* - Auto-initialization on app load (checks for existing token)
* - Login, register, logout functionality
* - Profile update functionality
* - Loading and error states
* - Custom useAuth() hook for easy consumption
* 
* Integration:
* - Uses authService for API calls
* - Syncs with localStorage token
* - Provides auth state to entire app
*/
import { createContext, useState, useEffect, useCallback, useMemo, useContext } from 'react';
import PropTypes from 'prop-types';
import * as authService from '../services/authService.js';
/**
* ============================================
* CREATE CONTEXT
* ============================================
*/
const AuthContext = createContext(undefined);
/**
* ============================================
* AUTH PROVIDER COMPONENT
* ============================================
* 
* Manages authentication state and provides it to child components
* 
* State:
* - user: Current authenticated user object or null
* - loading: Boolean indicating if auth operation is in progress
* - error: Error message string or null
* - initialized: Boolean indicating if initial auth check is complete
* 
* @param {Object} props - Component props
* @param {React.ReactNode} props.children - Child components to wrap
*/
export const AuthProvider = ({ children }) => {
  // ===== STATE MANAGEMENT =====
  /**
   * User state: null (logged out) or user object (logged in)
   * User object structure from backend:
   * { id, name, email, profilePicture, googleFitConnected, goals, createdAt }
   */
  const [user, setUser] = useState(null);
  /**
   * Loading state: true during API calls, false otherwise
   */
  const [loading, setLoading] = useState(false);
  /**
   * Error state: stores error messages from failed operations
   */
  const [error, setError] = useState(null);
  /**
   * Initialized state: tracks if initial auth check is complete
   * Prevents flash of login screen while checking token
   */
  const [initialized, setInitialized] = useState(false);
  /**
   * ============================================
   * INITIALIZATION: CHECK FOR EXISTING SESSION
   * ============================================
   * 
   * On app load, check if user has valid token and fetch user data
   * This enables persistent login across page refreshes
   * 
   * Flow:
   * 1. Check if token exists in localStorage
   * 2. If exists, call getCurrentUser() API
   * 3. If successful, set user state
   * 4. If failed (401), token is invalid - clear it
   * 5. Mark initialization as complete
   */
  useEffect(() => {
    const initializeAuth = async () => {
      // Development logging
      if (import.meta.env.VITE_NODE_ENV === 'development') {
        console.log('🔐 Initializing authentication...');
      }
      // Check if token exists
      const hasToken = authService.isAuthenticated();
      if (!hasToken) {
        // No token found - user is not logged in
        if (import.meta.env.VITE_NODE_ENV === 'development') {
          console.log('❌ No token found - user not authenticated');
        }
        setInitialized(true);
        return;
      }
      // Token exists - verify it's valid by fetching user data
      try {
        setLoading(true);
        const result = await authService.getCurrentUser();
        if (result.success && result.user) {
          // Token is valid - set user state
          setUser(result.user);
          if (import.meta.env.VITE_NODE_ENV === 'development') {
            console.log('✅ User authenticated:', result.user.email);
          }
        } else {
          // Token exists but API returned error
          if (import.meta.env.VITE_NODE_ENV === 'development') {
            console.log('❌ Token invalid:', result.message);
          }
        }
      } catch (err) {
        // Token verification failed - silently clear invalid session
        if (import.meta.env.VITE_NODE_ENV === 'development') {
          console.error('❌ Auth initialization error:', err);
        }
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };
    initializeAuth();
  }, []); // Run once on mount
  /**
   * ============================================
   * LOGIN FUNCTION
   * ============================================
   * 
   * Authenticates user with email and password
   * 
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - User's email
   * @param {string} credentials.password - User's password
   * 
   * @returns {Promise<Object>} - { success: boolean, message: string, user?: object }
   * 
   * @example
   * const { login } = useAuth();
   * const result = await login({ email: 'test@example.com', password: 'Test1234!' });
   * if (result.success) {
   *   console.log('Logged in as:', result.user.name);
   * }
   */
  const login = useCallback(async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      // Call authService login
      const result = await authService.login(credentials);
      if (result.success && result.user) {
        // Login successful - update user state
        setUser(result.user);
        if (import.meta.env.VITE_NODE_ENV === 'development') {
          console.log('✅ Login successful:', result.user.email);
        }
        return {
          success: true,
          message: result.message,
          user: result.user,
        };
      } else {
        // Login failed - set error message
        setError(result.message);
        return {
          success: false,
          message: result.message,
        };
      }
    } catch (err) {
      const errorMessage = err.message || 'Login failed. Please try again.';
      setError(errorMessage);
      if (import.meta.env.VITE_NODE_ENV === 'development') {
        console.error('❌ Login error:', err);
      }
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, []);
  /**
   * ============================================
   * REGISTER FUNCTION
   * ============================================
   * 
   * Creates new user account and automatically logs them in
   * 
   * @param {Object} userData - Registration data
   * @param {string} userData.name - User's full name
   * @param {string} userData.email - User's email
   * @param {string} userData.password - User's password
   * @param {string} userData.confirmPassword - Password confirmation
   * 
   * @returns {Promise<Object>} - { success: boolean, message: string, user?: object }
   * 
   * @example
   * const { register } = useAuth();
   * const result = await register({
   *   name: 'John Doe',
   *   email: 'john@example.com',
   *   password: 'Test1234!',
   *   confirmPassword: 'Test1234!'
   * });
   */
  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);
      // Call authService register
      const result = await authService.register(userData);
      if (result.success && result.user) {
        // Registration successful - update user state
        setUser(result.user);
        if (import.meta.env.VITE_NODE_ENV === 'development') {
          console.log('✅ Registration successful:', result.user.email);
        }
        return {
          success: true,
          message: result.message,
          user: result.user,
        };
      } else {
        // Registration failed - set error message
        setError(result.message);
        return {
          success: false,
          message: result.message,
        };
      }
    } catch (err) {
      const errorMessage = err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      if (import.meta.env.VITE_NODE_ENV === 'development') {
        console.error('❌ Registration error:', err);
      }
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, []);
  /**
   * ============================================
   * LOGOUT FUNCTION
   * ============================================
   * 
   * Logs out user, clears token, and redirects to login page
   * 
   * @param {boolean} [redirect=true] - Whether to redirect to login page
   * 
   * @returns {Promise<Object>} - { success: boolean, message: string }
   * 
   * @example
   * const { logout } = useAuth();
   * await logout(); // Logs out and redirects to /login
   */
  const logout = useCallback(async (redirect = true) => {
    try {
      setLoading(true);
      setError(null);
      // Call authService logout (clears token and calls backend)
      const result = await authService.logout(redirect);
      // Clear user state immediately (don't wait for backend response)
      setUser(null);
      if (import.meta.env.VITE_NODE_ENV === 'development') {
        console.log('✅ Logout successful');
      }
      return {
        success: true,
        message: result.message,
      };
    } catch (err) {
      // Even on error, clear local state
      setUser(null);
      if (import.meta.env.VITE_NODE_ENV === 'development') {
        console.error('❌ Logout error:', err);
      }
      return {
        success: true, // Return success because local logout succeeded
        message: 'Logged out successfully',
      };
    } finally {
      setLoading(false);
    }
  }, []);
  /**
   * ============================================
   * UPDATE USER FUNCTION
   * ============================================
   * 
   * Updates authenticated user's profile
   * 
   * @param {Object} updates - Profile updates
   * @param {string} [updates.name] - New name
   * @param {string} [updates.email] - New email
   * @param {string} [updates.password] - New password
   * @param {string} [updates.currentPassword] - Current password (required for password change)
   * @param {Object} [updates.goals] - Health goals
   * @param {string} [updates.profilePicture] - Profile picture URL
   * 
   * @returns {Promise<Object>} - { success: boolean, message: string, user?: object }
   * 
   * @example
   * const { updateUser } = useAuth();
   * const result = await updateUser({ name: 'New Name' });
   */
  const updateUser = useCallback(async (updates) => {
    try {
      setLoading(true);
      setError(null);
      // Call authService updateProfile
      const result = await authService.updateProfile(updates);
      if (result.success && result.user) {
        // Update successful - update user state
        setUser(result.user);
        if (import.meta.env.VITE_NODE_ENV === 'development') {
          console.log('✅ Profile updated successfully');
        }
        return {
          success: true,
          message: result.message,
          user: result.user,
        };
      } else {
        // Update failed - set error message
        setError(result.message);
        return {
          success: false,
          message: result.message,
        };
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to update profile';
      setError(errorMessage);
      if (import.meta.env.VITE_NODE_ENV === 'development') {
        console.error('❌ Update profile error:', err);
      }
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, []);
  /**
   * ============================================
   * CLEAR ERROR FUNCTION
   * ============================================
   * 
   * Clears current error message
   * Useful for dismissing error alerts
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  /**
   * ============================================
   * COMPUTED VALUE: IS AUTHENTICATED
   * ============================================
   * 
   * Derived state indicating if user is logged in
   * Returns true if user object exists, false otherwise
   */
  const isAuthenticated = useMemo(() => {
    return user !== null;
  }, [user]);
  /**
   * ============================================
   * CONTEXT VALUE
   * ============================================
   * 
   * Memoized context value to prevent unnecessary re-renders
   * Only re-computes when dependencies change
   */
  const value = useMemo(
    () => ({
      // State
      user,
      loading,
      error,
      initialized,
      isAuthenticated,
      // Functions
      login,
      register,
      logout,
      updateUser,
      clearError,
    }),
    [user, loading, error, initialized, isAuthenticated, login, register, logout, updateUser, clearError]
  );
  /**
   * ============================================
   * RENDER PROVIDER
   * ============================================
   * 
   * Show loading screen while initializing
   * Prevents flash of login screen while checking token
   */
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
* ============================================
* DEFAULT EXPORT
* ============================================
*/
export default AuthContext;

/**
* ============================================
* HOOK: useAuth
* ============================================
* 
* Convenience hook to access AuthContext. Ensures the hook is used
* within an AuthProvider and provides a clear error otherwise.
*/
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
