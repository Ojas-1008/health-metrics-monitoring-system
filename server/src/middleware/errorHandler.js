/**
 * ============================================
 * CENTRALIZED ERROR HANDLING MIDDLEWARE
 * ============================================
 *
 * Purpose: Handle all application errors in a single place
 *
 * This middleware catches errors from:
 * - Controllers (via try/catch blocks and next(error))
 * - Mongoose validation errors
 * - MongoDB duplicate key errors
 * - JWT authentication errors
 * - Express-validator errors
 * - Custom application errors
 *
 * Benefits:
 * - Consistent error response format across all endpoints
 * - Centralized logging for debugging
 * - Clean, maintainable code (no repetitive error handling)
 * - Environment-specific error details (stack traces in dev only)
 *
 * Usage:
 * This middleware MUST be registered AFTER all routes in server.js
 */

/**
 * ============================================
 * CUSTOM ERROR CLASS
 * ============================================
 *
 * Purpose: Create structured errors with status codes and messages
 * This allows controllers to throw meaningful errors easily
 *
 * Example:
 * throw new ErrorResponse('User not found', 404);
 */

class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ErrorResponse";

    // Capture stack trace (excludes constructor call from stack trace)
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * ============================================
 * MAIN ERROR HANDLER MIDDLEWARE
 * ============================================
 *
 * Express error-handling middleware signature: (err, req, res, next)
 * The 4 parameters are required - don't remove 'next' even if unused
 */

const errorHandler = (err, req, res, next) => {
  // Create a copy of the error to avoid mutating the original
  let error = { ...err };
  error.message = err.message;
  error.name = err.name;

  // ===== LOG ERROR FOR DEBUGGING =====

  // In development, log full error details
  if (process.env.NODE_ENV === "development") {
    console.error("\n========================================");
    console.error("🚨 ERROR CAUGHT BY ERROR HANDLER");
    console.error("========================================");
    console.error("Error Name:", err.name);
    console.error("Error Message:", err.message);
    console.error("Status Code:", err.statusCode || 500);
    console.error("Stack Trace:", err.stack);
    console.error("========================================\n");
  } else {
    // In production, log only essential info (avoid exposing sensitive data)
    console.error("Error:", err.name, "-", err.message);
  }

  // ===== HANDLE SPECIFIC ERROR TYPES =====

  // ===== 1. MONGOOSE BAD OBJECTID (CastError) =====

  /**
   * Occurs when an invalid MongoDB ObjectId is provided
   * Example: /api/users/invalid-id-format
   *
   * Error: CastError
   * Message: Cast to ObjectId failed for value "invalid-id" at path "_id"
   */
  if (err.name === "CastError") {
    const message = `Resource not found. Invalid ${err.path}: ${err.value}`;
    error = new ErrorResponse(message, 404);
  }

  // ===== 2. MONGOOSE DUPLICATE KEY ERROR (Code 11000) =====

  /**
   * Occurs when trying to insert a duplicate value in a unique field
   * Example: Registering with an already-existing email
   *
   * Error Code: 11000
   * MongoDB Error: E11000 duplicate key error
   */
  if (err.code === 11000) {
    // Extract the field name that caused the duplicate error
    // err.keyValue contains { email: 'test@example.com' }
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];

    const message = `${
      field.charAt(0).toUpperCase() + field.slice(1)
    } '${value}' already exists. Please use a different ${field}.`;
    error = new ErrorResponse(message, 400);
  }

  // ===== 3. MONGOOSE VALIDATION ERROR =====

  /**
   * Occurs when Mongoose schema validation fails
   * Example: Required field missing, value out of range, invalid type
   *
   * Error: ValidationError
   * Contains multiple errors for each invalid field
   */
  if (err.name === "ValidationError") {
    // Extract all validation error messages
    // err.errors is an object with field names as keys
    const messages = Object.values(err.errors).map((error) => error.message);

    const message = `Validation failed: ${messages.join(", ")}`;
    error = new ErrorResponse(message, 400);
  }

  // ===== 4. JWT ERRORS =====

  /**
   * These are already handled in auth.js middleware,
   * but included here as a fallback if errors slip through
   */

  // JWT Token Expired
  if (err.name === "TokenExpiredError") {
    const message = "Your session has expired. Please log in again.";
    error = new ErrorResponse(message, 401);
  }

  // JWT Invalid Token
  if (err.name === "JsonWebTokenError") {
    const message = "Invalid authentication token. Please log in again.";
    error = new ErrorResponse(message, 401);
  }

  // JWT Not Active Yet
  if (err.name === "NotBeforeError") {
    const message = "Token not yet active. Please try again later.";
    error = new ErrorResponse(message, 401);
  }

  // ===== 5. MULTER FILE UPLOAD ERRORS (For Future Use) =====

  /**
   * Multer errors occur during file upload
   * Useful for profile picture uploads in Week 2
   */
  if (err.name === "MulterError") {
    let message = "File upload error";

    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File is too large. Maximum size is 5MB.";
    } else if (err.code === "LIMIT_FILE_COUNT") {
      message = "Too many files uploaded. Maximum is 1 file.";
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      message = "Unexpected file field. Please check the upload field name.";
    }

    error = new ErrorResponse(message, 400);
  }

  // ===== 6. SYNTAX ERROR (Invalid JSON) =====

  /**
   * Occurs when client sends malformed JSON in request body
   * Express automatically catches these with express.json() middleware
   */
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    const message = "Invalid JSON in request body. Please check your syntax.";
    error = new ErrorResponse(message, 400);
  }

  // ===== SEND ERROR RESPONSE =====

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Server Error",
    error: error.name || "Error",

    // Only include stack trace in development (security best practice)
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      originalError: err,
    }),
  });
};

/**
 * ============================================
 * 404 NOT FOUND HANDLER
 * ============================================
 *
 * Purpose: Handle requests to undefined routes
 * This should be registered BEFORE the error handler in server.js
 *
 * Example:
 * GET /api/nonexistent-route → 404 error
 */

const notFound = (req, res, next) => {
  const message = `Route not found: ${req.method} ${req.originalUrl}`;
  const error = new ErrorResponse(message, 404);
  next(error); // Pass to error handler
};

/**
 * ============================================
 * ASYNC HANDLER WRAPPER (UTILITY)
 * ============================================
 *
 * Purpose: Eliminate repetitive try/catch blocks in async controllers
 * Automatically catches errors and passes them to error handler
 *
 * Usage:
 * Instead of:
 *
 * const getUsers = async (req, res, next) => {
 *   try {
 *     const users = await User.find();
 *     res.json(users);
 *   } catch (error) {
 *     next(error);
 *   }
 * };
 *
 * Use:
 *
 * const getUsers = asyncHandler(async (req, res) => {
 *   const users = await User.find();
 *   res.json(users);
 * });
 */

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * ============================================
 * CUSTOM ERROR LOGGER (For Production)
 * ============================================
 *
 * Purpose: Log errors to external service (e.g., Sentry, LogRocket)
 * In production, you should integrate with a logging service
 *
 * This is a placeholder function you can expand later
 */

const logErrorToService = (error, req) => {
  // In production, send to external logging service
  // Example: Sentry.captureException(error);

  const errorLog = {
    timestamp: new Date().toISOString(),
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user ? req.user._id : "Unauthenticated",
  };

  // For now, just console log
  // Replace with actual logging service in production
  if (process.env.NODE_ENV === "production") {
    console.error("PRODUCTION ERROR:", JSON.stringify(errorLog));
  }
};

/**
 * ============================================
 * EXPORT ERROR HANDLING FUNCTIONS
 * ============================================
 */

export {
  errorHandler, // Main centralized error handler
  notFound, // 404 handler for undefined routes
  ErrorResponse, // Custom error class for throwing structured errors
  asyncHandler, // Utility to wrap async functions
  logErrorToService, // Production error logging
};
