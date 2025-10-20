import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { asyncHandler, ErrorResponse } from "../middleware/errorHandler.js";

/**
 * ============================================
 * JWT TOKEN GENERATION UTILITY
 * ============================================
 *
 * Purpose: Generate JWT tokens consistently across all auth controllers
 *
 * Security considerations:
 * - Tokens expire after JWT_EXPIRE time (7 days in your .env)
 * - Uses HS256 algorithm (symmetric key)
 * - Payload contains only user ID (minimal data exposure)
 *
 * @param {string} userId - The MongoDB ObjectId of the user
 * @returns {string} - Signed JWT token
 */

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId }, // Payload: only user ID
    process.env.JWT_SECRET, // Secret key from .env
    {
      expiresIn: process.env.JWT_EXPIRE, // Expiration time from .env (7d)
      algorithm: "HS256", // Signing algorithm
    }
  );
};

/**
 * ============================================
 * UTILITY: SEND TOKEN RESPONSE
 * ============================================
 *
 * Purpose: Standardize token response format across registration and login
 *
 * @param {Object} user - User document from MongoDB
 * @param {number} statusCode - HTTP status code (200 or 201)
 * @param {Object} res - Express response object
 */

const sendTokenResponse = (user, statusCode, res) => {
  // Generate JWT token
  const token = generateToken(user._id);

  // Create user object without password
  const userResponse = {
    id: user._id,
    name: user.name,
    email: user.email,
    profilePicture: user.profilePicture,
    googleFitConnected: user.googleFitConnected,
    goals: user.goals,
    createdAt: user.createdAt,
  };

  // Send response
  res.status(statusCode).json({
    success: true,
    message:
      statusCode === 201 ? "User registered successfully" : "Login successful",
    token,
    user: userResponse,
  });
};

/**
 * ============================================
 * SUB-TASK 3.2.2: USER REGISTRATION
 * ============================================
 *
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 *
 * Process:
 * 1. Extract registration data from request body
 * 2. Check if user already exists (email uniqueness)
 * 3. Create new user (password is hashed via User model pre-save hook)
 * 4. Generate JWT token
 * 5. Return user data and token
 *
 * Request Body:
 * {
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "password": "Test1234!",
 *   "confirmPassword": "Test1234!"
 * }
 *
 * Response (201):
 * {
 *   "success": true,
 *   "message": "User registered successfully",
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "user": { ... }
 * }
 *
 * Errors:
 * - 400: User already exists (handled by validator.js duplicate check)
 * - 400: Validation errors (handled by validator.js)
 * - 500: Server error during user creation
 */

export const registerUser = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  // ===== DOUBLE-CHECK: User Existence =====
  // Note: This is also checked in validator.js, but we check again
  // for extra security in case validation is bypassed
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return next(
      new ErrorResponse(
        "Email is already registered. Please use a different email or log in.",
        400
      )
    );
  }

  // ===== CREATE USER =====
  // Password is automatically hashed via User model pre-save middleware
  // No need to manually hash here - the User schema handles it
  const user = await User.create({
    name,
    email,
    password, // Will be hashed by bcrypt in User model pre-save hook
  });

  // ===== VERIFY USER CREATION =====
  if (!user) {
    return next(
      new ErrorResponse("Failed to create user. Please try again.", 500)
    );
  }

  // ===== LOG REGISTRATION (Optional for analytics) =====
  console.log(`✅ New user registered: ${user.email} (ID: ${user._id})`);

  // ===== SEND TOKEN RESPONSE =====
  sendTokenResponse(user, 201, res);
});

/**
 * ============================================
 * SUB-TASK 3.2.3: USER LOGIN
 * ============================================
 *
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return token
 * @access  Public
 *
 * Process:
 * 1. Extract email and password from request body
 * 2. Find user by email (include password field)
 * 3. Verify password using comparePassword method
 * 4. Generate JWT token
 * 5. Return user data and token
 *
 * Request Body:
 * {
 *   "email": "john@example.com",
 *   "password": "Test1234!"
 * }
 *
 * Response (200):
 * {
 *   "success": true,
 *   "message": "Login successful",
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "user": { ... }
 * }
 *
 * Errors:
 * - 401: Invalid credentials (email not found or password mismatch)
 * - 400: Validation errors (missing email/password)
 */

export const loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // ===== VALIDATE INPUT =====
  // Note: This is also handled by validator.js, but we check for extra safety
  if (!email || !password) {
    return next(new ErrorResponse("Please provide email and password", 400));
  }

  // ===== FIND USER BY EMAIL (INCLUDING PASSWORD) =====
  // By default, password is excluded (select: false in User model)
  // We need to explicitly include it for comparison
  const user = await User.findOne({ email }).select("+password");

  // ===== CHECK USER EXISTENCE =====
  if (!user) {
    // Security best practice: Don't reveal whether email exists
    // Use generic message to prevent email enumeration attacks
    return next(new ErrorResponse("Invalid email or password", 401));
  }

  // ===== VERIFY PASSWORD =====
  // Use comparePassword method from User model
  // This method uses bcrypt.compare() internally
  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    return next(new ErrorResponse("Invalid email or password", 401));
  }

  // ===== LOG LOGIN (Optional for security monitoring) =====
  console.log(`✅ User logged in: ${user.email} (ID: ${user._id})`);

  // ===== SEND TOKEN RESPONSE =====
  sendTokenResponse(user, 200, res);
});

/**
 * ============================================
 * SUB-TASK 3.2.4: GET CURRENT USER
 * ============================================
 *
 * @route   GET /api/auth/me
 * @desc    Get currently authenticated user's profile
 * @access  Private (requires authentication)
 *
 * Process:
 * 1. Extract user ID from req.user (attached by auth middleware)
 * 2. Fetch full user data from database
 * 3. Return user profile without password
 *
 * Headers:
 * Authorization: Bearer <token>
 *
 * Response (200):
 * {
 *   "success": true,
 *   "user": {
 *     "id": "671f8a3c5d6e7f8a9b0c1d2e",
 *     "name": "John Doe",
 *     "email": "john@example.com",
 *     "profilePicture": null,
 *     "googleFitConnected": false,
 *     "goals": { ... },
 *     "createdAt": "2025-10-20T15:30:00.000Z"
 *   }
 * }
 *
 * Errors:
 * - 401: Not authenticated (no token or invalid token)
 * - 404: User not found in database
 */

export const getCurrentUser = asyncHandler(async (req, res, next) => {
  // ===== EXTRACT USER FROM REQUEST =====
  // The auth middleware already attached the user to req.user
  // We fetch fresh data from database to ensure it's up-to-date

  const user = await User.findById(req.user._id).select("-password");

  // ===== VERIFY USER EXISTS =====
  if (!user) {
    return next(
      new ErrorResponse("User not found. Account may have been deleted.", 404)
    );
  }

  // ===== RETURN USER DATA =====
  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
      googleFitConnected: user.googleFitConnected,
      googleId: user.googleId,
      goals: user.goals,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
});

/**
 * ============================================
 * SUB-TASK 3.2.5: UPDATE USER PROFILE
 * ============================================
 *
 * @route   PUT /api/auth/profile
 * @desc    Update authenticated user's profile
 * @access  Private (requires authentication)
 *
 * Process:
 * 1. Extract updatable fields from request body
 * 2. Validate that restricted fields (email, password) are not being updated
 * 3. Update user document in database
 * 4. Return updated user data
 *
 * Updatable fields:
 * - name
 * - profilePicture
 * - goals (weightGoal, stepGoal, sleepGoal, calorieGoal, distanceGoal)
 *
 * Non-updatable fields (security):
 * - email (requires separate email change flow with verification)
 * - password (requires separate password change flow with old password)
 * - googleId, googleFitConnected (managed by OAuth flow)
 *
 * Request Body (all fields optional):
 * {
 *   "name": "John Updated",
 *   "profilePicture": "https://example.com/photo.jpg",
 *   "goals": {
 *     "stepGoal": 12000,
 *     "sleepGoal": 8,
 *     "calorieGoal": 2200
 *   }
 * }
 *
 * Response (200):
 * {
 *   "success": true,
 *   "message": "Profile updated successfully",
 *   "user": { ... }
 * }
 *
 * Errors:
 * - 400: Attempting to update restricted fields
 * - 400: Validation errors (invalid values)
 * - 404: User not found
 */

export const updateProfile = asyncHandler(async (req, res, next) => {
  // ===== DEFINE UPDATABLE FIELDS =====
  // Only these fields can be updated via this endpoint
  const allowedUpdates = ["name", "profilePicture", "goals"];

  // ===== EXTRACT UPDATE DATA =====
  const updates = {};

  // Only include fields that are present in request body and are allowed
  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  // ===== CHECK IF ANY UPDATES PROVIDED =====
  if (Object.keys(updates).length === 0) {
    return next(new ErrorResponse("No valid fields provided for update", 400));
  }

  // ===== PREVENT RESTRICTED FIELD UPDATES =====
  // Security: Prevent users from updating email, password, or OAuth fields
  const restrictedFields = [
    "email",
    "password",
    "googleId",
    "googleFitConnected",
  ];
  const attemptedRestrictedUpdates = restrictedFields.filter(
    (field) => req.body[field] !== undefined
  );

  if (attemptedRestrictedUpdates.length > 0) {
    return next(
      new ErrorResponse(
        `Cannot update restricted fields: ${attemptedRestrictedUpdates.join(
          ", "
        )}. ` + "Use dedicated endpoints for email/password changes.",
        400
      )
    );
  }

  // ===== UPDATE USER IN DATABASE =====
  // findByIdAndUpdate with runValidators ensures Mongoose schema validation runs
  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true, // Return updated document
    runValidators: true, // Run Mongoose schema validators
  }).select("-password");

  // ===== VERIFY UPDATE SUCCESS =====
  if (!user) {
    return next(
      new ErrorResponse("Failed to update profile. User not found.", 404)
    );
  }

  // ===== LOG UPDATE (Optional for audit trail) =====
  console.log(`✅ Profile updated for user: ${user.email} (ID: ${user._id})`);

  // ===== RETURN UPDATED USER DATA =====
  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
      googleFitConnected: user.googleFitConnected,
      goals: user.goals,
      updatedAt: user.updatedAt,
    },
  });
});

/**
 * ============================================
 * BONUS: LOGOUT USER (Optional)
 * ============================================
 *
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token deletion)
 * @access  Private
 *
 * Note: JWT is stateless, so logout is handled client-side by deleting token
 * This endpoint is mainly for logging purposes and future token blacklisting
 */

export const logoutUser = asyncHandler(async (req, res, next) => {
  // In a stateless JWT system, logout is handled client-side
  // The client deletes the token from localStorage/cookies

  // Optional: Log logout for security monitoring
  console.log(`✅ User logged out: ${req.user.email} (ID: ${req.user._id})`);

  res.status(200).json({
    success: true,
    message:
      "Logged out successfully. Please delete your token on the client side.",
  });
});

/**
 * ============================================
 * EXPORT ALL CONTROLLERS
 * ============================================
 */

export default {
  registerUser,
  loginUser,
  getCurrentUser,
  updateProfile,
  logoutUser,
};
