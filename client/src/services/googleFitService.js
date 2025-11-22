/**
 * ============================================
 * GOOGLE FIT SERVICE - FRONTEND API LAYER
 * ============================================
 *
 * Purpose: Handle all Google Fit OAuth and connection operations
 *
 * Features:
 * - Initiate Google Fit OAuth flow
 * - Get connection status
 * - Disconnect Google Fit account
 * - User-friendly error handling
 * - Consistent with existing service patterns
 *
 * Integration:
 * - Uses axiosInstance for automatic JWT attachment
 * - Follows backend API structure from googleFitController.js
 * - Error handling consistent with authService.js pattern
 */

import axiosInstance from '../api/axiosConfig';

/**
 * ============================================
 * INITIATE GOOGLE FIT CONNECTION
 * ============================================
 *
 * Purpose: Start OAuth flow by getting authorization URL from backend
 *
 * Process:
 * 1. Call backend GET /api/googlefit/connect
 * 2. Backend generates OAuth URL with state token
 * 3. Return authUrl for frontend to open in new window
 *
 * Backend Response Format:
 * {
 *   success: true,
 *   message: "Google Fit OAuth flow initiated",
 *   authUrl: "https://accounts.google.com/o/oauth2/v2/auth?..."
 * }
 *
 * @returns {Promise<string>} - Google OAuth authorization URL
 * @throws {Error} - User-friendly error message
 *
 * Usage:
 * ```
 * try {
 *   const authUrl = await initiateConnect();
 *   window.open(authUrl, '_blank');
 * } catch (error) {
 *   console.error(error.message);
 * }
 * ```
 */
export const initiateConnect = async () => {
  try {
    const response = await axiosInstance.get('/googlefit/connect');

    // Validate response structure
    if (!response.data || !response.data.success) {
      throw new Error('Invalid response from server');
    }

    const { authUrl } = response.data;

    // ⭐ VALIDATION: Check if authUrl is valid
    if (!authUrl || typeof authUrl !== 'string') {
      throw new Error('Server did not return a valid authorization URL');
    }

    // ⭐ VALIDATION: Check if authUrl is actually a URL
    if (!authUrl.startsWith('http://') && !authUrl.startsWith('https://')) {
      throw new Error('Authorization URL is malformed');
    }

    // ⭐ VALIDATION: Check if authUrl is empty
    if (authUrl.trim().length === 0) {
      throw new Error('Authorization URL is empty');
    }

    // ✅ Return valid authUrl
    return authUrl;
  } catch (error) {
    // ===== ERROR HANDLING =====

    // Handle specific status codes with user-friendly messages
    if (error.statusCode === 500 || error.message.includes('500')) {
      throw new Error(
        'Unable to connect to Google Fit - please try again later'
      );
    }

    if (error.statusCode === 401) {
      throw new Error(
        'Your session has expired. Please log in again to connect Google Fit.'
      );
    }

    if (error.statusCode === 400) {
      throw new Error(
        error.message || 'Invalid request. Please check your account settings.'
      );
    }

    if (error.statusCode === 'NETWORK_ERROR') {
      throw new Error(
        'Network error. Please check your internet connection and try again.'
      );
    }

    if (error.statusCode === 'TIMEOUT') {
      throw new Error(
        'Request timed out. Please check your connection and try again.'
      );
    }

    // Fallback error message
    throw new Error(
      error.message ||
        'Failed to initiate Google Fit connection. Please try again.'
    );
  }
};

/**
 * ============================================
 * GET GOOGLE FIT CONNECTION STATUS
 * ============================================
 *
 * Purpose: Check if user has connected Google Fit and get sync status
 *
 * Backend Response Format:
 * {
 *   success: true,
 *   connected: true/false,
 *   isActive: true/false,
 *   daysUntilExpiry: 28,
 *   lastSync: "2025-11-09T10:00:00.000Z"
 * }
 *
 * @returns {Promise<Object>} - Connection status object
 * @returns {boolean} returns.connected - Whether Google Fit is connected
 * @returns {boolean} returns.isActive - Whether connection is active (not expired)
 * @returns {number|null} returns.daysUntilExpiry - Days until token expires
 * @returns {string|null} returns.lastSync - Last sync timestamp (ISO format)
 *
 * @throws {Error} - User-friendly error message
 *
 * Usage:
 * ```
 * const status = await getConnectionStatus();
 * if (status.connected && status.isActive) {
 *   console.log('Google Fit connected!');
 *   console.log('Last sync:', status.lastSync);
 * }
 * ```
 */
export const getConnectionStatus = async () => {
  try {
    const response = await axiosInstance.get('/googlefit/status');

    // Validate response structure
    if (!response.data || !response.data.success) {
      throw new Error('Invalid response from server');
    }

    const { connected, isActive, daysUntilExpiry, lastSync } = response.data;

    // Return standardized status object
    return {
      connected: connected || false,
      isActive: isActive || false,
      daysUntilExpiry: daysUntilExpiry !== undefined ? daysUntilExpiry : null,
      lastSync: lastSync || null,
    };
  } catch (error) {
    // ===== ERROR HANDLING =====

    // Handle specific status codes
    if (error.statusCode === 500 || error.message.includes('500')) {
      throw new Error(
        'Unable to fetch Google Fit status - please try again later'
      );
    }

    if (error.statusCode === 401) {
      throw new Error(
        'Your session has expired. Please log in again.'
      );
    }

    if (error.statusCode === 'NETWORK_ERROR') {
      throw new Error(
        'Network error. Please check your internet connection.'
      );
    }

    // Fallback error message
    throw new Error(
      error.message || 'Failed to get Google Fit status. Please try again.'
    );
  }
};

/**
 * ============================================
 * DISCONNECT GOOGLE FIT
 * ============================================
 *
 * Purpose: Revoke Google Fit OAuth tokens and remove connection
 *
 * Process:
 * 1. Call backend POST /api/googlefit/disconnect
 * 2. Backend revokes tokens with Google
 * 3. Backend clears tokens from database
 *
 * Backend Response Format:
 * {
 *   success: true,
 *   message: "Google Fit disconnected successfully"
 * }
 *
 * @returns {Promise<Object>} - Success response
 * @returns {boolean} returns.success - Whether disconnection succeeded
 * @returns {string} returns.message - Success message
 *
 * @throws {Error} - User-friendly error message
 *
 * Usage:
 * ```
 * try {
 *   const result = await disconnectGoogleFit();
 *   console.log(result.message);
 * } catch (error) {
 *   console.error(error.message);
 * }
 * ```
 */
export const disconnectGoogleFit = async () => {
  try {
    const response = await axiosInstance.post('/googlefit/disconnect');

    // Validate response structure
    if (!response.data || !response.data.success) {
      throw new Error('Failed to disconnect Google Fit');
    }

    return {
      success: true,
      message: response.data.message || 'Google Fit disconnected successfully',
    };
  } catch (error) {
    // ===== ERROR HANDLING =====

    // Handle specific status codes
    if (error.statusCode === 500 || error.message.includes('500')) {
      throw new Error(
        'Unable to disconnect Google Fit - please try again later'
      );
    }

    if (error.statusCode === 401) {
      throw new Error(
        'Your session has expired. Please log in again.'
      );
    }

    if (error.statusCode === 400) {
      // User might not be connected
      throw new Error(
        error.message || 'Google Fit is not connected to your account.'
      );
    }

    if (error.statusCode === 'NETWORK_ERROR') {
      throw new Error(
        'Network error. Please check your internet connection.'
      );
    }

    // Fallback error message
    throw new Error(
      error.message || 'Failed to disconnect Google Fit. Please try again.'
    );
  }
};

/**
 * ============================================
 * HANDLE OAUTH CALLBACK (OPTIONAL - FOR SPA)
 * ============================================
 *
 * Purpose: Handle OAuth callback in SPA after redirect from Google
 *
 * Note: This is OPTIONAL because your backend likely handles the callback
 * at GET /api/googlefit/callback directly. Only use this if you need to
 * process the callback in the React app before sending to backend.
 *
 * @param {string} code - OAuth authorization code from Google
 * @param {string} state - State token for CSRF protection
 *
 * @returns {Promise<Object>} - Connection result
 * @returns {boolean} returns.success - Whether connection succeeded
 * @returns {string} returns.message - Success/error message
 *
 * @throws {Error} - User-friendly error message
 *
 * Usage (if needed):
 * ```
 * // In your callback component
 * const urlParams = new URLSearchParams(window.location.search);
 * const code = urlParams.get('code');
 * const state = urlParams.get('state');
 *
 * const result = await handleCallback(code, state);
 * ```
 */
export const handleCallback = async (code, state) => {
  try {
    // Validate input parameters
    if (!code || typeof code !== 'string') {
      throw new Error('Invalid authorization code');
    }

    if (!state || typeof state !== 'string') {
      throw new Error('Invalid state token');
    }

    // Call backend callback endpoint
    const response = await axiosInstance.get('/googlefit/callback', {
      params: { code, state },
    });

    // Validate response
    if (!response.data || !response.data.success) {
      throw new Error(
        response.data?.message || 'Failed to complete Google Fit connection'
      );
    }

    return {
      success: true,
      message:
        response.data.message || 'Google Fit connected successfully',
    };
  } catch (error) {
    // ===== ERROR HANDLING =====

    if (error.statusCode === 500 || error.message.includes('500')) {
      throw new Error(
        'Unable to complete Google Fit connection - please try again later'
      );
    }

    if (error.statusCode === 401) {
      throw new Error(
        'Your session has expired. Please log in and try connecting again.'
      );
    }

    if (error.statusCode === 400) {
      throw new Error(
        error.message ||
          'Invalid authorization. Please try connecting to Google Fit again.'
      );
    }

    // Fallback error message
    throw new Error(
      error.message ||
        'Failed to complete Google Fit connection. Please try again.'
    );
  }
};

/**
 * ============================================
 * GET USER PROFILE WITH GOOGLE FIT STATUS
 * ============================================
 *
 * Purpose: Convenience function to get user profile including Google Fit status
 *
 * Note: This assumes your backend user profile endpoint includes googleFitConnected
 * and lastSyncAt fields. If not, use getConnectionStatus() separately.
 *
 * @returns {Promise<Object>} - User profile with Google Fit status
 * @returns {boolean} returns.googleFitConnected
 * @returns {string|null} returns.lastSyncAt
 * @returns {Object} returns.user - Full user profile
 *
 * @throws {Error} - User-friendly error message
 *
 * Usage:
 * ```
 * const profile = await getUserProfile();
 * if (profile.googleFitConnected) {
 *   console.log('Google Fit is connected!');
 *   console.log('Last sync:', profile.lastSyncAt);
 * }
 * ```
 */
export const getUserProfile = async () => {
  try {
    // Call existing auth/me endpoint
    const response = await axiosInstance.get('/auth/me');

    // Validate response
    if (!response.data || !response.data.success) {
      throw new Error('Failed to fetch user profile');
    }

    const user = response.data.user || response.data.data;

    return {
      googleFitConnected: user.googleFitConnected || false,
      lastSyncAt: user.lastSyncAt || null,
      user: user,
    };
  } catch (error) {
    // ===== ERROR HANDLING =====

    if (error.statusCode === 500 || error.message.includes('500')) {
      throw new Error(
        'Unable to fetch user profile - please try again later'
      );
    }

    if (error.statusCode === 401) {
      throw new Error('Your session has expired. Please log in again.');
    }

    // Fallback error message
    throw new Error(
      error.message || 'Failed to fetch user profile. Please try again.'
    );
  }
};

/**
 * ============================================
 * TRIGGER MANUAL GOOGLE FIT SYNC
 * ============================================
 *
 * Purpose: Manually trigger Google Fit data synchronization
 *
 * Process:
 * 1. Call backend GET /api/googlefit/sync
 * 2. Backend initiates sync process with Google Fit API
 * 3. Returns sync status and results
 *
 * Backend Response Format:
 * {
 *   success: true,
 *   message: "Sync initiated successfully",
 *   data: {
 *     syncId: "sync_123",
 *     status: "running"
 *   }
 * }
 *
 * @returns {Promise<Object>} - Sync initiation result
 * @throws {Error} - User-friendly error message
 *
 * Usage:
 * ```
 * try {
 *   const result = await triggerSync();
 *   if (result.success) {
 *     console.log('Sync started:', result.data);
 *   }
 * } catch (error) {
 *   console.error('Sync failed:', error.message);
 * }
 * ```
 */
export const triggerSync = async () => {
  try {
    const response = await axiosInstance.get('/googlefit/sync');
    return {
      success: true,
      data: response.data,
      message: 'Sync triggered successfully',
    };
  } catch (error) {
    console.error('[googleFitService] Trigger sync error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to trigger sync',
    };
  }
};

/**
 * ============================================
 * GET GOOGLE FIT CONNECTION STATUS
 * ============================================
 *
 * Purpose: Get detailed Google Fit connection and sync status
 *
 * Process:
 * 1. Call backend GET /api/googlefit/status
 * 2. Backend returns connection status and last sync info
 * 3. Includes sync history and connection health
 *
 * Backend Response Format:
 * {
 *   success: true,
 *   message: "Status retrieved successfully",
 *   data: {
 *     connected: true,
 *     lastSyncAt: "2025-11-14T10:30:00Z",
 *     syncStatus: "idle",
 *     totalSyncedDays: 30,
 *     lastSyncSummary: {
 *       steps: 12500,
 *       calories: 450,
 *       distance: 8.5
 *     }
 *   }
 * }
 *
 * @returns {Promise<Object>} - Connection status details
 * @throws {Error} - User-friendly error message
 *
 * Usage:
 * ```
 * try {
 *   const result = await getGoogleFitStatus();
 *   if (result.success) {
 *     console.log('Connected:', result.data.connected);
 *     console.log('Last sync:', result.data.lastSyncAt);
 *   }
 * } catch (error) {
 *   console.error('Status check failed:', error.message);
 * }
 * ```
 */
export const getGoogleFitStatus = async () => {
  try {
    const response = await axiosInstance.get('/googlefit/status');
    
    // Backend returns flat structure: { success, connected, isActive, lastSync, ... }
    // We wrap it in 'data' property to match service pattern expected by Dashboard
    const statusData = {
      connected: response.data.connected,
      isActive: response.data.isActive,
      daysUntilExpiry: response.data.daysUntilExpiry,
      lastSyncAt: response.data.lastSync, // Map backend 'lastSync' to frontend 'lastSyncAt'
      syncPreferences: response.data.syncPreferences
    };

    return {
      success: true,
      data: statusData,
      message: 'Status retrieved successfully',
    };
  } catch (error) {
    console.error('[googleFitService] Get status error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to get status',
    };
  }
};

/**
 * ============================================
 * EXPORTS
 * ============================================
 */
export default {
  initiateConnect,
  getConnectionStatus,
  disconnectGoogleFit,
  handleCallback, // Optional
  getUserProfile,
  triggerSync,
  getGoogleFitStatus,
};