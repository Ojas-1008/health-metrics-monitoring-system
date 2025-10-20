/**
 * CENTRALIZED ERROR HANDLER
 *
 * This middleware catches ALL errors in your application.
 * Think of it as the final safety net that catches errors
 * from routes, controllers, and other middleware.
 *
 * Error Flow:
 * Route → Controller → Error occurs → This middleware catches it
 */

/**
 * Main error handling middleware
 * @param {Error} err - The error object
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Next middleware (not used in error handlers)
 */
export const errorHandler = (err, req, res, next) => {
  // Start with default error structure
  let error = {
    success: false,
    message: err.message || "Server Error",
    statusCode: err.statusCode || 500,
  };

  // ===== LOG ERROR FOR DEBUGGING =====
  // In development: Show full error details
  // In production: Only log to console, don't expose to user
  if (process.env.NODE_ENV === "development") {
    console.error("❌ Error Details:", {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: err.code,
    });
  } else {
    // Production: Only log error message
    console.error("❌ Error:", err.message);
  }

  // ===== HANDLE SPECIFIC ERROR TYPES =====

  // 1. MONGOOSE VALIDATION ERROR
  // Example: User tries to register without a name
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((val) => val.message);
    error.message = "Validation failed";
    error.statusCode = 400;
    error.errors = messages;

    console.log("🔴 Validation Error:", messages.join(", "));
  }

  // 2. MONGOOSE CAST ERROR
  // Example: Invalid MongoDB ObjectId format (like "abc123" instead of "507f1f77bcf86cd799439011")
  if (err.name === "CastError") {
    error.message = `Invalid ${err.path}: ${err.value}`;
    error.statusCode = 400;

    console.log("🔴 Cast Error:", error.message);
  }

  // 3. DUPLICATE KEY ERROR
  // Example: User tries to register with an email that already exists
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    error.message = `${
      field.charAt(0).toUpperCase() + field.slice(1)
    } '${value}' already exists`;
    error.statusCode = 400;

    console.log("🔴 Duplicate Key Error:", error.message);
  }

  // 4. JWT ERRORS (Already handled in auth middleware, but backup)
  if (err.name === "JsonWebTokenError") {
    error.message = "Invalid authentication token";
    error.statusCode = 401;

    console.log("🔴 JWT Error:", error.message);
  }

  if (err.name === "TokenExpiredError") {
    error.message = "Authentication token has expired";
    error.statusCode = 401;

    console.log("🔴 Token Expired:", error.message);
  }

  // 5. MONGOOSE CONNECTION ERRORS
  if (
    err.name === "MongooseServerSelectionError" ||
    err.name === "MongoNetworkError"
  ) {
    error.message = "Database connection error. Please try again later.";
    error.statusCode = 503; // Service Unavailable

    console.error("🔴 Database Error:", err.message);
  }

  // 6. CUSTOM API ERRORS (if you create custom error classes)
  if (err.isOperational) {
    error.message = err.message;
    error.statusCode = err.statusCode;
  }

  // ===== SEND ERROR RESPONSE =====
  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    ...(error.errors && { errors: error.errors }),
    // Include stack trace ONLY in development mode
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

/**
 * NOT FOUND HANDLER (404)
 *
 * This handles routes that don't exist.
 * Example: User tries to access /api/nonexistent
 *
 * Place this BEFORE errorHandler in server.js
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;

  console.log(`🔴 404 Error: ${req.method} ${req.originalUrl}`);

  // Pass error to error handler
  next(error);
};

/**
 * ASYNC ERROR WRAPPER
 *
 * Wraps async route handlers to catch errors automatically.
 * This prevents having to write try-catch in every route.
 *
 * Usage in routes:
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await User.find();
 *   res.json(users);
 * }));
 *
 * Without this, you'd need:
 * router.get('/users', async (req, res, next) => {
 *   try {
 *     const users = await User.find();
 *     res.json(users);
 *   } catch (error) {
 *     next(error);
 *   }
 * });
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * CUSTOM ERROR CLASS (Optional but useful)
 *
 * Create custom errors with specific status codes.
 * Example: throw new ApiError('User not found', 404);
 */
export class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Flag to identify our custom errors

    Error.captureStackTrace(this, this.constructor);
  }
}
