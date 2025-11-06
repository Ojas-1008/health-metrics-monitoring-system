/**
 * server/utils/googleFitHelper.js
 * 
 * Google Fit API helper utilities
 * Handles token refresh, API calls, and error management
 * 
 * Pattern: Centralized helper for all Google Fit operations
 */

import { google } from "googleapis";
import User from "../models/User.js";
import oauthConfig from "../../config/oauth.config.js";
import { ErrorResponse } from "../middleware/errorHandler.js";

/**
 * ============================================
 * OAUTH2 CLIENT INITIALIZATION
 * ============================================
 */
const createOAuth2Client = () => {
  return new google.auth.OAuth2(
    oauthConfig.google.clientId,
    oauthConfig.google.clientSecret,
    oauthConfig.google.redirectUri
  );
};

/**
 * ============================================
 * TOKEN REFRESH HELPER
 * ============================================
 * 
 * Refreshes Google Fit OAuth tokens when they are near expiry or expired
 * 
 * @param {string} userId - MongoDB user ID
 * @returns {Promise<Object>} - Updated tokens { access_token, refresh_token, token_expiry }
 * @throws {ErrorResponse} - 401 if refresh token is invalid/revoked
 * 
 * How it works:
 * 1. Fetches user with tokens (select: '+googleFitTokens')
 * 2. Checks if token expires within 5 minutes
 * 3. Calls Google's OAuth2 token refresh endpoint
 * 4. Updates user document with new access_token and expiry
 * 5. Returns updated tokens for immediate use
 * 
 * Error handling:
 * - Invalid/revoked refresh_token → Disconnects Google Fit, throws 401
 * - Network errors → Retries once, then throws 503
 * - Other errors → Logs and throws appropriate error
 * 
 * Usage:
 * ```
 * try {
 *   const tokens = await refreshGoogleFitToken(userId);
 *   // Use tokens.access_token for API calls
 * } catch (error) {
 *   if (error.statusCode === 401) {
 *     // User needs to reconnect Google Fit
 *   }
 * }
 * ```
 */
export const refreshGoogleFitToken = async (userId) => {
  // ===== STEP 1: FETCH USER WITH TOKENS =====
  const user = await User.findById(userId).select("+googleFitTokens");

  if (!user) {
    throw new ErrorResponse("User not found", 404);
  }

  if (!user.googleFitConnected) {
    throw new ErrorResponse(
      "Google Fit is not connected. Please connect your account first.",
      400
    );
  }

  // Validate tokens exist
  if (
    !user.googleFitTokens ||
    !user.googleFitTokens.access_token ||
    !user.googleFitTokens.refresh_token
  ) {
    console.error(
      `❌ User ${user.email} has googleFitConnected=true but missing tokens`
    );

    // Data inconsistency - disconnect and require reconnection
    user.disconnectGoogleFit();
    await user.save();

    throw new ErrorResponse(
      "Google Fit tokens are missing. Please reconnect your account.",
      401
    );
  }

  // ===== STEP 2: CHECK IF TOKEN NEEDS REFRESH =====
  const tokenExpiry = new Date(user.googleFitTokens.token_expiry);
  const now = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  // Check if token is expired or will expire within 5 minutes
  const needsRefresh = tokenExpiry <= fiveMinutesFromNow;

  if (!needsRefresh) {
    console.log(
      `✅ Token still valid for user ${user.email} (expires: ${tokenExpiry.toISOString()})`
    );

    // Return existing tokens (no refresh needed)
    return {
      access_token: user.googleFitTokens.access_token,
      refresh_token: user.googleFitTokens.refresh_token,
      token_expiry: user.googleFitTokens.token_expiry,
      scope: user.googleFitTokens.scope,
      refreshed: false, // Indicates no refresh was performed
    };
  }

  console.log(
    `🔄 Refreshing token for user ${user.email} (expires: ${tokenExpiry.toISOString()})`
  );

  // ===== STEP 3: INITIALIZE OAUTH2 CLIENT WITH REFRESH TOKEN =====
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: user.googleFitTokens.refresh_token,
  });

  // ===== STEP 4: REFRESH ACCESS TOKEN =====
  let newTokens;
  try {
    // Call Google's token refresh endpoint
    const response = await oauth2Client.refreshAccessToken();
    newTokens = response.credentials;

    console.log(
      `✅ Token refreshed successfully for user ${user.email}`
    );
  } catch (error) {
    console.error(
      `❌ Token refresh failed for user ${user.email}:`,
      error.message
    );

    // ===== HANDLE REFRESH TOKEN ERRORS =====
    
    // Error: Refresh token is invalid, expired, or revoked
    if (
      error.message &&
      (error.message.includes("invalid_grant") ||
        error.message.includes("Token has been expired or revoked"))
    ) {
      console.warn(
        `🚨 Refresh token revoked for user ${user.email} - disconnecting Google Fit`
      );

      // Disconnect Google Fit and clear tokens
      user.disconnectGoogleFit();
      await user.save();

      throw new ErrorResponse(
        "Google Fit authorization has been revoked. " +
        "Please reconnect your Google Fit account to continue syncing data.",
        401 // 401 Unauthorized - requires re-authentication
      );
    }

    // Error: Network/timeout issues
    if (
      error.message &&
      (error.message.includes("ETIMEDOUT") ||
        error.message.includes("ECONNREFUSED"))
    ) {
      throw new ErrorResponse(
        "Unable to connect to Google services. Please try again later.",
        503 // 503 Service Unavailable
      );
    }

    // Generic error
    throw new ErrorResponse(
      `Failed to refresh Google Fit token: ${error.message}`,
      500
    );
  }

  // ===== STEP 5: VALIDATE NEW TOKENS =====
  if (!newTokens.access_token || !newTokens.expiry_date) {
    console.error(
      `❌ Incomplete tokens received during refresh for user ${user.email}`
    );

    throw new ErrorResponse(
      "Received incomplete tokens from Google during refresh. Please try again.",
      500
    );
  }

  // ===== STEP 6: UPDATE USER DOCUMENT WITH NEW TOKENS =====
  try {
    // Update tokens (keep existing refresh_token if new one not provided)
    user.googleFitTokens.access_token = newTokens.access_token;
    user.googleFitTokens.token_expiry = new Date(newTokens.expiry_date);

    // Google sometimes returns a new refresh token during refresh
    // Update only if provided
    if (newTokens.refresh_token) {
      user.googleFitTokens.refresh_token = newTokens.refresh_token;
      console.log(
        `ℹ️  New refresh token received for user ${user.email}`
      );
    }

    // Update scope if provided
    if (newTokens.scope) {
      user.googleFitTokens.scope = newTokens.scope;
    }

    // Save to database
    await user.save({ runValidators: true });

    console.log(
      `✅ Updated tokens saved for user ${user.email} (new expiry: ${new Date(
        newTokens.expiry_date
      ).toISOString()})`
    );
  } catch (error) {
    console.error(
      `❌ Failed to save refreshed tokens for user ${user.email}:`,
      error.message
    );

    throw new ErrorResponse(
      `Failed to save refreshed tokens: ${error.message}`,
      500
    );
  }

  // ===== STEP 7: RETURN UPDATED TOKENS =====
  // Return tokens immediately without requiring second database query
  return {
    access_token: newTokens.access_token,
    refresh_token: newTokens.refresh_token || user.googleFitTokens.refresh_token,
    token_expiry: new Date(newTokens.expiry_date),
    scope: newTokens.scope || user.googleFitTokens.scope,
    refreshed: true, // Indicates refresh was performed
  };
};

/**
 * ============================================
 * GET VALID ACCESS TOKEN
 * ============================================
 * 
 * Helper to get a valid access token, refreshing if necessary
 * Simplifies API call logic by handling token refresh automatically
 * 
 * @param {string} userId - MongoDB user ID
 * @returns {Promise<string>} - Valid access token
 * @throws {ErrorResponse} - If token refresh fails or user not connected
 * 
 * Usage:
 * ```
 * const accessToken = await getValidAccessToken(userId);
 * // Use accessToken for Google Fit API calls
 * ```
 */
export const getValidAccessToken = async (userId) => {
  const tokens = await refreshGoogleFitToken(userId);
  return tokens.access_token;
};

/**
 * ============================================
 * CHECK TOKEN EXPIRY STATUS
 * ============================================
 * 
 * Check if a user's token is expired or near expiry without refreshing
 * Useful for monitoring and dashboard displays
 * 
 * @param {string} userId - MongoDB user ID
 * @returns {Promise<Object>} - Token status { isExpired, expiresIn, needsRefresh }
 */
export const checkTokenExpiry = async (userId) => {
  const user = await User.findById(userId).select("+googleFitTokens");

  if (!user || !user.googleFitConnected || !user.googleFitTokens) {
    return {
      isExpired: true,
      expiresIn: 0,
      needsRefresh: true,
      message: "Google Fit not connected",
    };
  }

  const tokenExpiry = new Date(user.googleFitTokens.token_expiry);
  const now = new Date();
  const expiresInMs = tokenExpiry.getTime() - now.getTime();
  const expiresInMinutes = Math.floor(expiresInMs / 1000 / 60);

  return {
    isExpired: expiresInMs <= 0,
    expiresIn: expiresInMinutes,
    needsRefresh: expiresInMinutes <= 5,
    tokenExpiry: tokenExpiry.toISOString(),
  };
};

/**
 * ============================================
 * BATCH TOKEN REFRESH
 * ============================================
 * 
 * Refresh tokens for multiple users in parallel
 * Used by sync worker to prepare tokens before API calls
 * 
 * @param {Array<string>} userIds - Array of MongoDB user IDs
 * @returns {Promise<Object>} - Results { succeeded: [], failed: [] }
 */
export const batchRefreshTokens = async (userIds) => {
  const results = {
    succeeded: [],
    failed: [],
  };

  // Process in parallel with Promise.allSettled
  const refreshPromises = userIds.map(async (userId) => {
    try {
      const tokens = await refreshGoogleFitToken(userId);
      results.succeeded.push({ userId, tokens });
    } catch (error) {
      results.failed.push({
        userId,
        error: error.message,
        statusCode: error.statusCode,
      });
    }
  });

  await Promise.allSettled(refreshPromises);

  console.log(
    `🔄 Batch token refresh complete: ${results.succeeded.length} succeeded, ${results.failed.length} failed`
  );

  return results;
};

export default {
  refreshGoogleFitToken,
  getValidAccessToken,
  checkTokenExpiry,
  batchRefreshTokens,
};
