import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * ============================================
 * JWT AUTHENTICATION MIDDLEWARE
 * ============================================
 *
 * Purpose: Verify JWT tokens and protect routes from unauthorized access
 *
 * How it works:
 * 1. Extract JWT token from Authorization header (Bearer token format)
 * 2. Verify token signature and expiration using JWT_SECRET
 * 3. Decode token to get user ID
 * 4. Fetch user from database and attach to request object
 * 5. Handle all possible errors with specific, secure error messages
 *
 * Security Features:
 * - Token expiration validation
 * - Invalid signature detection
 * - Malformed token handling
 * - User existence verification
 * - No password exposure (using select('+password') when needed elsewhere)
 */

const protect = async (req, res, next) => {
  let token;

  try {
    // ===== STEP 1: Extract Token from Authorization Header =====

    // Check if Authorization header exists and starts with 'Bearer'
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      // Extract token from "Bearer <token>" format
      // Split by space and take the second element (the token itself)
      token = req.headers.authorization.split(" ")[1];
    }

    // ===== STEP 2: Check if Token Exists =====

    if (!token) {
      return res.status(401).json({
        success: false,
        message:
          "Access denied. No token provided. Please log in to access this resource.",
        error: "MISSING_TOKEN",
      });
    }

    // ===== STEP 3: Verify Token Signature and Expiration =====

    // jwt.verify() will throw an error if:
    // - Token signature is invalid (tampered token)
    // - Token has expired (based on JWT_EXPIRE setting)
    // - Token format is malformed
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Decoded token contains the payload we signed during login
    // Expected structure: { id: userId, iat: issuedAt, exp: expirationTime }

    // ===== STEP 4: Fetch User from Database =====

    // Find user by ID from the decoded token
    // select('-password') ensures password hash is NOT included in the response
    // This is critical for security - never expose password hashes
    const user = await User.findById(decoded.id).select("-password");

    // ===== STEP 5: Verify User Exists =====

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Access denied. User no longer exists or has been deleted.",
        error: "USER_NOT_FOUND",
      });
    }

    // ===== STEP 6: Attach User to Request Object =====

    // This makes the authenticated user available to all downstream middleware and controllers
    // Controllers can access user data via req.user
    req.user = user;

    // ===== STEP 7: Proceed to Next Middleware/Controller =====

    next();
  } catch (error) {
    // ===== ERROR HANDLING: Different JWT Error Types =====

    // Handle specific JWT-related errors with clear messages

    if (error.name === "TokenExpiredError") {
      // Token has passed its expiration time (JWT_EXPIRE in .env)
      return res.status(401).json({
        success: false,
        message: "Your session has expired. Please log in again.",
        error: "TOKEN_EXPIRED",
        expiredAt: error.expiredAt,
      });
    }

    if (error.name === "JsonWebTokenError") {
      // Token signature is invalid (tampered or malformed)
      // This could indicate:
      // - Token was modified after being issued
      // - Wrong JWT_SECRET is being used
      // - Token format is incorrect
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please log in again.",
        error: "INVALID_TOKEN",
      });
    }

    if (error.name === "NotBeforeError") {
      // Token is being used before its 'nbf' (not before) claim
      // Rare, but possible if token has future activation time
      return res.status(401).json({
        success: false,
        message: "Token not yet active. Please try again later.",
        error: "TOKEN_NOT_ACTIVE",
        notBefore: error.date,
      });
    }

    // Catch any other unexpected errors (database errors, etc.)
    console.error("Auth Middleware Error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication failed due to server error. Please try again.",
      error: "AUTHENTICATION_ERROR",
    });
  }
};

/**
 * ============================================
 * OPTIONAL AUTHENTICATION MIDDLEWARE
 * ============================================
 *
 * Purpose: Attach user to request IF token is present, but don't block if missing
 * Use case: Public routes that personalize content for logged-in users
 *
 * Example: A public homepage that shows different content for authenticated users
 */

const optionalAuth = async (req, res, next) => {
  let token;

  try {
    // Extract token if present
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // If no token, just proceed without attaching user
    if (!token) {
      return next();
    }

    // Verify token if present
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    // Attach user if found
    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    // On error, just proceed without user (don't block the request)
    // This is different from protect() which returns 401 on error
    next();
  }
};

/**
 * ============================================
 * EXPORT MIDDLEWARE FUNCTIONS
 * ============================================
 */

export { protect, optionalAuth };
