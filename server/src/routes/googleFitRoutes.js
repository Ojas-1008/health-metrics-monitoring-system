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
import { protect, serviceAuth } from "../middleware/auth.js";
import { asyncHandler, ErrorResponse } from "../middleware/errorHandler.js";
import RateLimiter from "../middleware/rateLimiter.js";
import { triggerManualSync } from "../../workers/googleFitSyncWorker.js";

const router = express.Router();

/**
 * ============================================
 * RATE LIMITERS FOR GOOGLE FIT ROUTES
 * ============================================
 * 
 * Protect OAuth endpoints from abuse
 */

// Limit OAuth connection attempts (5 per 15 minutes)
const oauthLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 5,
  message: 'Too many Google Fit connection attempts. Please try again in 15 minutes.'
});

// Limit manual sync triggers (10 per 5 minutes)
const syncLimiter = new RateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxAttempts: 10,
  message: 'Too many sync requests. Please wait before triggering another sync.'
});

// Limit disconnect attempts (3 per 15 minutes)
const disconnectLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 3,
  message: 'Too many disconnect attempts. Please try again later.'
});

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
router.get("/connect", protect, oauthLimiter.middleware, initiateGoogleFitOAuth);

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
 * GET /api/googlefit/sync
 * Manually trigger Google Fit sync for current user
 *
 * Initiates background sync process for the authenticated user
 * Returns immediately while sync runs asynchronously
 *
 * Request:
 * - Headers: Authorization: Bearer <JWT>
 *
 * Response (200):
 * {
 *   "success": true,
 *   "message": "Google Fit sync started",
 *   "timestamp": "2025-11-14T10:30:00.000Z"
 * }
 *
 * Errors:
 * - 401: Not authenticated
 * - 400: Not connected to Google Fit
 * - 500: Sync worker error
 */
router.get('/sync', protect, syncLimiter.middleware, asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  console.log(`[googleFitRoutes] Manual sync triggered by user: ${userId}`);

  // Trigger sync asynchronously (don't wait for completion)
  triggerManualSync(userId).catch(error => {
    console.error(`[googleFitRoutes] Sync error for user ${userId}:`, error);
  });

  res.status(200).json({
    success: true,
    message: 'Google Fit sync started',
    timestamp: new Date().toISOString(),
  });
}));

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
router.post("/disconnect", protect, disconnectLimiter.middleware, disconnectGoogleFit);

/**
 * GET /api/googlefit/debug/token-scopes/:userId
 * Debug route to check token scopes for a specific user
 * 
 * PROTECTED: Requires service authentication (backend-to-backend)
 * 
 * Returns scope information for debugging OAuth token validation
 * 
 * Request:
 * - Headers: Authorization: Bearer <SERVICE_TOKEN>
 * - Params: userId - MongoDB user ID
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "userId": "690b9449c3325e85f9ab7a0e",
 *   "scopes": "https://www.googleapis.com/auth/fitness.activity.read https://...",
 *   "scopeArray": ["https://www.googleapis.com/auth/fitness.activity.read", ...],
 *   "hasActivityRead": true,
 *   "hasBodyRead": true,
 *   "hasSleepRead": true
 * }
 * 
 * Errors:
 * - 403: Missing or invalid service token
 * - 404: User not found
 * - 400: No Google Fit tokens found for user
 */
router.get("/debug/token-scopes/:userId", serviceAuth, asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Validate userId format
  if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ 
      success: false, 
      error: "Invalid user ID format. Must be a valid MongoDB ObjectId." 
    });
  }

  const User = (await import("../models/User.js")).default;
  const user = await User.findById(userId).select("+googleFitTokens");

  if (!user) {
    return res.status(404).json({ 
      success: false, 
      error: "User not found" 
    });
  }

  if (!user.googleFitTokens || !user.googleFitTokens.scope) {
    return res.status(400).json({ 
      success: false, 
      error: "No Google Fit tokens found for user" 
    });
  }

  res.json({
    success: true,
    userId: user._id,
    email: user.email,
    scopes: user.googleFitTokens.scope,
    scopeArray: user.googleFitTokens.scope.split(" "),
    hasActivityRead: user.googleFitTokens.scope.includes("fitness.activity.read"),
    hasBodyRead: user.googleFitTokens.scope.includes("fitness.body.read"),
    hasSleepRead: user.googleFitTokens.scope.includes("fitness.sleep.read"),
    tokenExpiry: user.googleFitTokens.token_expiry,
    lastSync: user.lastSyncAt,
  });
}));

export default router;