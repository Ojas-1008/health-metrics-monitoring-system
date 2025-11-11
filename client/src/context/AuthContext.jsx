/* eslint-disable react-refresh/only-export-components */

/**
 * ============================================
 * AUTHENTICATION CONTEXT (WITH SSE INTEGRATION)
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
 * - ENHANCED: Real-time event streaming via Server-Sent Events (SSE)
 * - ENHANCED: Automatic SSE connection on login/initialization
 * - ENHANCED: Automatic SSE disconnection on logout
 * - ENHANCED: Event listener proxy methods for components
 *
 * Integration:
 * - Uses authService for API calls
 * - Uses eventService for real-time updates (SSE)
 * - Syncs with localStorage token
 * - Provides auth state and event subscriptions to entire app
 */

import { createContext, useState, useEffect, useCallback, useMemo, useContext } from 'react';
import PropTypes from 'prop-types';
import * as authService from '../services/authService.js';
import eventService from '../services/eventService.js'; // ← NEW: Import SSE service

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
 * - connectionStatus: SSE connection status object (NEW)
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
   * ===== NEW: CONNECTION STATUS STATE =====
   * Tracks SSE connection status for UI indicators
   * { connected: boolean, reason?: string, retryCount?: number }
   */
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    reason: 'not_initialized'
  });

  /**
   * ============================================
   * SSE EVENT SUBSCRIPTIONS (NEW)
   * ============================================
   *
   * Subscribe to SSE connection status changes
   * Updates UI indicators when connection state changes
   */
  useEffect(() => {
    // Subscribe to connection status events
    const handleConnectionStatus = (status) => {
      setConnectionStatus(status);

      // Development logging
      if (import.meta.env.DEV) {
        if (status.connected) {
          console.log('🟢 SSE Connected');
        } else {
          console.log('🔴 SSE Disconnected:', status.reason);
        }
      }
    };

    eventService.on('connectionStatus', handleConnectionStatus);

    // Cleanup on unmount
    return () => {
      eventService.off('connectionStatus', handleConnectionStatus);
    };
  }, []);

  /**
   * ============================================
   * INITIALIZATION: CHECK FOR EXISTING SESSION
   * ============================================
   *
   * On app load, check if user has valid token and fetch user data
   * This enables persistent login across page refreshes
   * ENHANCED: Also establishes SSE connection if token exists
   *
   * Flow:
   * 1. Check if token exists in localStorage
   * 2. If exists, call getCurrentUser() API
   * 3. If successful, set user state
   * 4. If successful, establish SSE connection (NEW)
   * 5. If failed (401), token is invalid - clear it
   * 6. Mark initialization as complete
   */
  useEffect(() => {
    const initializeAuth = async () => {
      // Development logging
      if (import.meta.env.DEV) {
        console.log('🔐 Initializing authentication...');
      }

      // Check if token exists
      const hasToken = authService.isAuthenticated();
      if (!hasToken) {
        // No token found - user is not logged in
        if (import.meta.env.DEV) {
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

          if (import.meta.env.DEV) {
            console.log('✅ User authenticated:', result.user.email);
          }

          // ===== NEW: ESTABLISH SSE CONNECTION =====
          const token = localStorage.getItem('token');
          if (token) {
            try {
              await eventService.connect(token);
              if (import.meta.env.DEV) {
                console.log('🔔 SSE connection established on initialization');
              }
            } catch (sseError) {
              console.error('⚠️ Failed to establish SSE connection:', sseError);
              // Don't fail initialization if SSE connection fails
              // User can still use the app, just without real-time updates
            }
          }
        } else {
          // Token exists but API returned error
          if (import.meta.env.DEV) {
            console.log('❌ Token invalid:', result.message);
          }
        }
      } catch (err) {
        // Token verification failed - silently clear invalid session
        if (import.meta.env.DEV) {
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
   * LOGIN FUNCTION (ENHANCED WITH SSE)
   * ============================================
   *
   * Authenticates user with email and password
   * ENHANCED: Establishes SSE connection after successful login
   *
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - User's email
   * @param {string} credentials.password - User's password
   *
   * @returns {Promise} - { success: boolean, message: string, user?: object }
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

        if (import.meta.env.DEV) {
          console.log('✅ Login successful:', result.user.email);
        }

        // ===== NEW: ESTABLISH SSE CONNECTION =====
        const token = localStorage.getItem('token');
        if (token) {
          try {
            await eventService.connect(token);
            if (import.meta.env.DEV) {
              console.log('🔔 SSE connection established after login');
            }
          } catch (sseError) {
            console.error('⚠️ Failed to establish SSE connection:', sseError);
            // Don't fail login if SSE connection fails
            // User can still use the app, just without real-time updates
          }
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

      if (import.meta.env.DEV) {
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
   * REGISTER FUNCTION (ENHANCED WITH SSE)
   * ============================================
   *
   * Creates new user account and automatically logs them in
   * ENHANCED: Establishes SSE connection after successful registration
   *
   * @param {Object} userData - Registration data
   * @param {string} userData.name - User's full name
   * @param {string} userData.email - User's email
   * @param {string} userData.password - User's password
   * @param {string} userData.confirmPassword - Password confirmation
   *
   * @returns {Promise} - { success: boolean, message: string, user?: object }
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

        if (import.meta.env.DEV) {
          console.log('✅ Registration successful:', result.user.email);
        }

        // ===== NEW: ESTABLISH SSE CONNECTION =====
        const token = localStorage.getItem('token');
        if (token) {
          try {
            await eventService.connect(token);
            if (import.meta.env.DEV) {
              console.log('🔔 SSE connection established after registration');
            }
          } catch (sseError) {
            console.error('⚠️ Failed to establish SSE connection:', sseError);
          }
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

      if (import.meta.env.DEV) {
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
   * LOGOUT FUNCTION (ENHANCED WITH SSE)
   * ============================================
   *
   * Logs out user, clears token, and redirects to login page
   * ENHANCED: Disconnects SSE connection to prevent orphaned connections
   *
   * @param {boolean} [redirect=true] - Whether to redirect to login page
   *
   * @returns {Promise} - { success: boolean, message: string }
   *
   * @example
   * const { logout } = useAuth();
   * await logout(); // Logs out and redirects to /login
   */
  const logout = useCallback(async (redirect = true) => {
    try {
      setLoading(true);
      setError(null);

      // ===== NEW: DISCONNECT SSE BEFORE LOGOUT =====
      try {
        eventService.disconnect();
        if (import.meta.env.DEV) {
          console.log('🔴 SSE connection closed before logout');
        }
      } catch (sseError) {
        console.error('⚠️ Error disconnecting SSE:', sseError);
        // Continue with logout even if SSE disconnect fails
      }

      // Call authService logout (clears token and calls backend)
      const result = await authService.logout(redirect);

      // Clear user state immediately (don't wait for backend response)
      setUser(null);

      if (import.meta.env.DEV) {
        console.log('✅ Logout successful');
      }

      return {
        success: true,
        message: result.message,
      };
    } catch (err) {
      // Even on error, clear local state
      setUser(null);

      if (import.meta.env.DEV) {
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
   * @returns {Promise} - { success: boolean, message: string, user?: object }
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

        if (import.meta.env.DEV) {
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

      if (import.meta.env.DEV) {
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
   * NEW: EVENT LISTENER PROXY METHODS
   * ============================================
   *
   * Expose event subscription methods so components can listen to
   * real-time events without directly importing eventService
   *
   * This provides a cleaner API and keeps eventService encapsulated
   */

  /**
   * Subscribe to real-time events
   *
   * @param {string} eventType - Event type to listen for
   * @param {Function} callback - Callback function to invoke
   *
   * @example
   * const { addEventListener } = useAuth();
   *
   * addEventListener('metrics:change', (data) => {
   *   console.log('Metrics updated:', data);
   * });
   */
  const addEventListener = useCallback((eventType, callback) => {
    eventService.on(eventType, callback);

    if (import.meta.env.DEV) {
      console.log(`[AuthContext] Subscribed to ${eventType}`);
    }
  }, []);

  /**
   * Unsubscribe from real-time events
   *
   * @param {string} eventType - Event type to stop listening for
   * @param {Function} callback - Callback function to remove
   *
   * @example
   * const { removeEventListener } = useAuth();
   *
   * removeEventListener('metrics:change', callback);
   */
  const removeEventListener = useCallback((eventType, callback) => {
    eventService.off(eventType, callback);

    if (import.meta.env.DEV) {
      console.log(`[AuthContext] Unsubscribed from ${eventType}`);
    }
  }, []);

  /**
   * Get current SSE connection status
   *
   * @returns {object} Connection status object
   *
   * @example
   * const { getConnectionStatus } = useAuth();
   * const status = getConnectionStatus();
   * console.log('Connected:', status.connected);
   */
  const getConnectionStatus = useCallback(() => {
    return eventService.getStatus();
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
   *
   * ENHANCED: Includes connection status and event listener methods
   */
  const value = useMemo(
    () => ({
      // State
      user,
      loading,
      error,
      initialized,
      isAuthenticated,
      connectionStatus, // NEW: SSE connection status

      // Functions
      login,
      register,
      logout,
      updateUser,
      clearError,

      // NEW: Event subscription methods
      addEventListener,
      removeEventListener,
      getConnectionStatus,
    }),
    [
      user,
      loading,
      error,
      initialized,
      isAuthenticated,
      connectionStatus,
      login,
      register,
      logout,
      updateUser,
      clearError,
      addEventListener,
      removeEventListener,
      getConnectionStatus
    ]
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
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.5rem',
        color: '#666'
      }}>
        Loading...
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
 *
 * ENHANCED: Now includes SSE connection status and event listeners
 *
 * @example
 * const {
 *   user,
 *   loading,
 *   connectionStatus,
 *   addEventListener,
 *   removeEventListener
 * } = useAuth();
 */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
