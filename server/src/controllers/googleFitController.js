/**
* server/controllers/googleFitController.js
* 
* Google Fit OAuth authentication and token management
* Handles OAuth flow, token storage, and data synchronization initiation
* 
* Pattern matches existing authController.js with asyncHandler and ErrorResponse
*/
import { google } from "googleapis";
import User from "../models/User.js";
import { asyncHandler, ErrorResponse } from "../middleware/errorHandler.js";
import oauthConfig from "../../config/oauth.config.js";
import {
  generateOAuthState,
  validateOAuthState,
  getUserIdFromState,
} from "../utils/oauthState.js";

/**
 * ============================================
 * OAUTH2 CLIENT INITIALIZATION
 * ============================================
 * 
 * Creates configured OAuth2 client from Google API library
 * Used in both authorization and callback handlers
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
 * STEP 1: INITIATE OAUTH FLOW
 * ============================================
 * 
 * @route GET /api/googlefit/connect
 * @desc Generate Google OAuth authorization URL
 * @access Private (requires authentication)
 * 
 * Process:
 * 1. Create OAuth2 client with Google credentials
 * 2. Generate CSRF state parameter for security
 * 3. Build authorization URL with required scopes
 * 4. Return URL for frontend redirect
 * 
 * Request:
 * - Headers: Authorization: Bearer <JWT>
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "message": "Authorization URL generated successfully",
 *   "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=..."
 * }
 * 
 * Errors:
 * - 401: Not authenticated
 * - 400: User already has connected Google Fit account
 * - 500: OAuth configuration error
 */
export const initiateGoogleFitOAuth = asyncHandler(async (req, res, next) => {
  // ===== VERIFY USER NOT ALREADY CONNECTED =====
  // User is already attached by protect middleware
  const user = await User.findById(req.user._id);
  if (user.googleFitConnected) {
    return next(
      new ErrorResponse(
        "You already have a connected Google Fit account. " +
        "Disconnect the existing account first to connect a new one.",
        400
      )
    );
  }

  // ===== CREATE OAUTH2 CLIENT =====
  const oauth2Client = createOAuth2Client();

  // ===== GENERATE CSRF STATE PARAMETER =====
  // This prevents CSRF attacks by verifying state matches on callback
  const state = generateOAuthState(req.user._id.toString());

  // ===== BUILD AUTHORIZATION URL =====
  // access_type: 'offline' gets a refresh_token (required for long-lived access)
  // prompt: 'consent' forces consent screen every time (good for testing)
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline", // Required to get refresh_token
    prompt: "consent", // Force consent screen every time (for testing)
    scope: oauthConfig.googleFit.scopes,
    state: state, // CSRF protection parameter
    include_granted_scopes: true, // Allow incremental authorization
  });

  console.log(
    `✅ OAuth authorization URL generated for user: ${req.user.email}`
  );

  // ===== RETURN AUTHORIZATION URL TO FRONTEND =====
  res.status(200).json({
    success: true,
    message: "Authorization URL generated successfully",
    authUrl: authUrl,
    hint: "Open this URL in a new window/tab or redirect user to Google's consent screen",
  });
});

/**
 * ============================================
 * STEP 2: HANDLE OAUTH CALLBACK
 * ============================================
 * 
 * @route GET /api/googlefit/callback
 * @desc Handle Google OAuth callback and store tokens
 * @access Private (requires authentication)
 * 
 * Query Parameters (from Google redirect):
 * - code: Authorization code (exchanged for tokens)
 * - state: CSRF parameter (validated against stored value)
 * - error: Error code if user denied (e.g., "access_denied")
 * 
 * Process:
 * 1. Validate state parameter (CSRF protection)
 * 2. Check for errors in callback (user denial, invalid scope, etc.)
 * 3. Exchange authorization code for tokens
 * 4. Store tokens securely in User document
 * 5. Trigger initial data sync (optional)
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "message": "Google Fit connected successfully",
 *   "user": {
 *     "id": "...",
 *     "googleFitConnected": true,
 *     "lastSyncAt": "2025-11-05T18:30:00Z"
 *   }
 * }
 * 
 * Errors:
 * - 401: Not authenticated
 * - 400: Missing code or state parameter
 * - 400: State validation failed (CSRF attack attempt)
 * - 400: User denied authorization
 * - 500: Token exchange failed
 */
export const handleGoogleFitCallback = asyncHandler(
  async (req, res, next) => {
    const { code, state, error } = req.query;

    // ===== STEP 1: CHECK FOR USER DENIAL OR OTHER ERRORS =====
    if (error) {
      console.warn(
        `❌ Google OAuth error: ${error}`
      );
      if (error === "access_denied") {
        return next(
          new ErrorResponse(
            "You denied access to Google Fit. " +
            "Please authorize the application to connect your account.",
            400
          )
        );
      }
      if (error === "invalid_scope") {
        return next(
          new ErrorResponse(
            "The requested scopes are invalid. " +
            "This may indicate an app configuration error.",
            400
          )
        );
      }
      return next(
        new ErrorResponse(
          `Google OAuth error: ${error}. Please try again.`,
          400
        )
      );
    }

    // ===== STEP 2: VALIDATE REQUIRED PARAMETERS =====
    if (!code) {
      return next(
        new ErrorResponse(
          "Missing authorization code. Google OAuth callback error.",
          400
        )
      );
    }
    if (!state) {
      return next(
        new ErrorResponse(
          "Missing state parameter. CSRF validation failed.",
          400
        )
      );
    }

    // ===== STEP 3: GET USER ID FROM STATE (CSRF PROTECTION) =====
    // Extract userId from the state token (state is stored per-user)
    const userId = getUserIdFromState(state);
    if (!userId) {
      console.error(`🚨 CSRF state validation failed: state not found or expired`);
      return next(
        new ErrorResponse(
          "CSRF validation failed: invalid or expired state. Please restart the OAuth flow.",
          400
        )
      );
    }

    // ===== STEP 4: VALIDATE STATE PARAMETER (prevents tampering) =====
    try {
      validateOAuthState(userId, state);
    } catch (error) {
      console.error(`🚨 CSRF state validation failed for user ${userId}`);
      return next(
        new ErrorResponse(
          `CSRF validation failed: ${error.message}`,
          400
        )
      );
    }

    // ===== STEP 5: EXCHANGE AUTHORIZATION CODE FOR TOKENS =====
    const oauth2Client = createOAuth2Client();
    let tokens;
    try {
      const { tokens: receivedTokens } = await oauth2Client.getToken(code);
      tokens = receivedTokens;
      console.log(
        `✅ Authorization code exchanged for tokens (user: ${userId})`
      );
    } catch (error) {
      console.error(`❌ Token exchange failed for user ${userId}:`, error.message);
      return next(
        new ErrorResponse(
          `Failed to exchange authorization code for tokens: ${error.message}`,
          500
        )
      );
    }

    // ===== STEP 6: VALIDATE RECEIVED TOKENS =====
    if (
      !tokens.access_token ||
      !tokens.refresh_token ||
      !tokens.expiry_date
    ) {
      console.error(
        `❌ Incomplete tokens received for user ${userId}`
      );
      return next(
        new ErrorResponse(
          "Incomplete tokens received from Google. " +
          "Please ensure 'offline' access is enabled.",
          500
        )
      );
    }

    // ===== STEP 7: STORE TOKENS IN USER DOCUMENT =====
    const user = await User.findById(userId).select(
      "+googleFitTokens"
    );
    if (!user) {
      return next(
        new ErrorResponse("User not found. Account may have been deleted.", 404)
      );
    }

    // Use the updateGoogleFitTokens method from User model
    // This method validates all tokens and handles errors
    try {
      user.updateGoogleFitTokens({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: new Date(tokens.expiry_date),
        scope: oauthConfig.googleFit.scopes,
      });

      // Save updated user document
      await user.save();
      console.log(`✅ Google Fit tokens stored for user: ${user.email}`);
    } catch (error) {
      console.error(
        `❌ Failed to store tokens for user ${userId}:`,
        error.message
      );
      return next(
        new ErrorResponse(
          `Failed to store authentication tokens: ${error.message}`,
          500
        )
      );
    }

    // ===== STEP 8: REFRESH USER DATA =====
    const updatedUser = await User.findById(user._id).select(
      "-password -googleFitTokens"
    );
    console.log(
      `✅ Google Fit connected successfully for user: ${updatedUser.email}`
    );

    // ===== STEP 9: RETURN SUCCESS RESPONSE =====
    res.status(200).json({
      success: true,
      message:
        "Google Fit connected successfully. Your health data will start syncing.",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        googleFitConnected: updatedUser.googleFitConnected,
        lastSyncAt: updatedUser.lastSyncAt,
        isGoogleFitActive: updatedUser.isGoogleFitActive,
        syncPreferences: updatedUser.syncPreferences,
      },
    });

    // ===== OPTIONAL: TRIGGER INITIAL SYNC =====
    // In production, emit an event here to trigger immediate initial sync
    // Example: eventEmitter.emit('googlefit:connected', { userId: user._id });
  }
);

/**
 * ============================================
 * GET GOOGLE FIT CONNECTION STATUS
 * ============================================
 * 
 * @route GET /api/googlefit/status
 * @desc Get current Google Fit connection status
 * @access Private (requires authentication)
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "connected": true,
 *   "isActive": true,
 *   "daysUntilExpiry": 28,
 *   "lastSync": "2025-11-05T18:00:00Z",
 *   "syncPreferences": { ... }
 * }
 */
export const getGoogleFitStatus = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).select(
    "googleFitConnected lastSyncAt isGoogleFitActive daysUntilTokenExpiry syncPreferences"
  );
  if (!user) {
    return next(
      new ErrorResponse("User not found. Account may have been deleted.", 404)
    );
  }

  res.status(200).json({
    success: true,
    connected: user.googleFitConnected,
    isActive: user.isGoogleFitActive,
    daysUntilExpiry: user.daysUntilTokenExpiry,
    lastSync: user.lastSyncAt,
    syncPreferences: user.syncPreferences,
  });
});

/**
 * ============================================
 * DISCONNECT GOOGLE FIT
 * ============================================
 * 
 * @route POST /api/googlefit/disconnect
 * @desc Revoke Google Fit access and clear tokens
 * @access Private (requires authentication)
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "message": "Google Fit disconnected successfully"
 * }
 */
export const disconnectGoogleFit = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("+googleFitTokens");
  if (!user) {
    return next(
      new ErrorResponse("User not found. Account may have been deleted.", 404)
    );
  }
  if (!user.googleFitConnected) {
    return next(
      new ErrorResponse("Google Fit is not connected to your account.", 400)
    );
  }

  // Call the disconnect method from User model
  user.disconnectGoogleFit();
  await user.save();
  console.log(`✅ Google Fit disconnected for user: ${user.email}`);

  res.status(200).json({
    success: true,
    message: "Google Fit disconnected successfully. No further data will be synced.",
  });
});

export default {
  initiateGoogleFitOAuth,
  handleGoogleFitCallback,
  getGoogleFitStatus,
  disconnectGoogleFit,
};