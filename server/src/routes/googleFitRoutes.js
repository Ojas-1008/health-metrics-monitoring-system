/**
* server/routes/googleFitRoutes.js
* 
* Google Fit OAuth and data synchronization routes
* Handles OAuth flow, token management, and sync operations
* 
* Pattern matches authRoutes.js structure with validation and error handling
*/
import express from "express";
import {
  initiateGoogleFitOAuth,
  handleGoogleFitCallback,
  getGoogleFitStatus,
  disconnectGoogleFit,
} from "../controllers/googleFitController.js";
import { protect } from "../middleware/auth.js";
import { asyncHandler, ErrorResponse } from "../middleware/errorHandler.js";

const router = express.Router();

/**
 * ============================================
 * GOOGLE FIT OAUTH ROUTES
 * ============================================
 * 
 * All routes require authentication to ensure users are logged in
 * before connecting their Google Fit accounts
 */

/**
 * GET /api/googlefit/connect
 * Initiate Google OAuth flow
 * 
 * Returns authorization URL for frontend to redirect to
 * 
 * Request:
 * - Headers: Authorization: Bearer <JWT>
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
 * }
 * 
 * Errors:
 * - 401: Not authenticated
 * - 400: Already connected to Google Fit
 */
router.get("/connect", protect, initiateGoogleFitOAuth);

/**
 * GET /api/googlefit/callback
 * Handle Google OAuth callback
 * 
 * Called by Google after user authorizes the application
 * Exchanges authorization code for tokens and stores them
 * 
 * Query Parameters:
 * - code: Authorization code from Google
 * - state: CSRF protection parameter
 * - error: Error code if user denied (optional)
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "message": "Google Fit connected successfully",
 *   "user": {
 *     "id": "...",
 *     "googleFitConnected": true
 *   }
 * }
 * 
 * Errors:
 * - 400: Invalid code or state
 * - 400: CSRF validation failed
 * - 500: Token exchange failed
 */
router.get("/callback", handleGoogleFitCallback);

/**
 * GET /api/googlefit/status
 * Get Google Fit connection status
 * 
 * Returns current OAuth status, last sync time, and preferences
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "connected": true,
 *   "isActive": true,
 *   "daysUntilExpiry": 28,
 *   "lastSync": "2025-11-05T18:00:00Z"
 * }
 */
router.get("/status", protect, getGoogleFitStatus);

/**
 * POST /api/googlefit/disconnect
 * Disconnect Google Fit account
 * 
 * Revokes authorization and clears stored tokens
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "message": "Google Fit disconnected successfully"
 * }
 */
router.post("/disconnect", protect, disconnectGoogleFit);

/**
 * GET /api/googlefit/debug/token-scopes
 * Debug route to check token scopes for a specific user
 * 
 * Returns scope information for debugging OAuth token validation
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "scopes": "https://www.googleapis.com/auth/fitness.activity.read https://...",
 *   "scopeArray": ["https://www.googleapis.com/auth/fitness.activity.read", ...],
 *   "hasActivityRead": true,
 *   "hasBodyRead": true,
 *   "hasSleepRead": true
 * }
 */
router.get("/debug/token-scopes", async (req, res) => {
  try {
    const User = (await import("../models/User.js")).default;
    const user = await User.findById("690b9449c3325e85f9ab7a0e").select("+googleFitTokens");
    
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    if (!user.googleFitTokens || !user.googleFitTokens.scope) {
      return res.status(400).json({ success: false, error: "No Google Fit tokens found for user" });
    }

    res.json({
      success: true,
      scopes: user.googleFitTokens.scope,
      scopeArray: user.googleFitTokens.scope.split(" "),
      hasActivityRead: user.googleFitTokens.scope.includes("fitness.activity.read"),
      hasBodyRead: user.googleFitTokens.scope.includes("fitness.body.read"),
      hasSleepRead: user.googleFitTokens.scope.includes("fitness.sleep.read"),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;