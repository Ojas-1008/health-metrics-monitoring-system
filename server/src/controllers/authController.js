// Import necessary modules
import bcrypt from "bcryptjs";  // Library for hashing and comparing passwords securely
import jwt from "jsonwebtoken";  // Library for creating and verifying JSON Web Tokens (JWT)
import User from "../models/User.js";  // Import the User database model

// ===== REGISTER CONTROLLER =====
/**
 * Register a new user account
 * This function handles user registration by creating a new user in the database
 * 
 * Process Flow:
 * 1. Extract email, password, name from request body
 * 2. Validate required fields are present
 * 3. Check if user already exists in database
 * 4. Create new user document (password is automatically hashed via User model pre-save hook)
 * 5. Generate JWT token for immediate authentication
 * 6. Return user data (without password) and token
 * 
 * Error Handling:
 * - 400: Missing required fields (name, email, password)
 * - 400: Duplicate email (user already exists)
 * - 400: Validation errors (invalid email format, password too short, etc.)
 * - 500: Server errors (database connection issues, etc.)
 * 
 * @route POST /api/auth/register
 * @access Public (anyone can register)
 */
export const registerUser = async (req, res) => {
  try {
    // Step 1: Extract email, password, name from request body
    const { name, email, password } = req.body;

    // Step 2: Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password",
      });
    }

    // Step 3: Check if user already exists
    // This prevents duplicate email registrations
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Step 4: Create new user document
    // Note: Password hashing happens automatically via User model's pre-save hook
    // The User model uses bcrypt to hash the password before saving to database
    const user = await User.create({
      name,
      email,
      password,  // Will be hashed by User model pre-save middleware
    });

    // Step 5: Generate JWT token
    // Token includes user ID and expires in 7 days (or value from JWT_EXPIRE env var)
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "7d" }
    );

    // Step 6: Return user data (without password) and token
    // Password is automatically excluded because User model has 'select: false'
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          profilePicture: user.profilePicture,
          googleFitConnected: user.googleFitConnected,
          goals: user.goals,
          createdAt: user.createdAt,
        },
        token,
      },
    });
  } catch (error) {
    console.error("❌ Registration error:", error);

    // Error Handling: Mongoose validation errors
    if (error.name === "ValidationError") {
      // Extract all validation error messages
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: messages,
      });
    }

    // Error Handling: Duplicate email (MongoDB unique constraint violation)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Error Handling: Server errors
    res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: error.message,
    });
  }
};

// Export register as an alias for backwards compatibility
export const register = registerUser;

// ===== LOGIN CONTROLLER =====
/**
 * Login an existing user
 * This function authenticates a user by checking their email and password
 * @route POST /api/auth/login
 * @access Public (anyone can attempt to login)
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          profilePicture: user.profilePicture,
          googleFitConnected: user.googleFitConnected,
          goals: user.goals,
        },
        token,
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error);

    res.status(500).json({
      success: false,
      message: "Server error during login",
      error: error.message,
    });
  }
};

// ===== GET CURRENT USER CONTROLLER =====
/**
 * Get the currently authenticated user's profile
 * This function retrieves the complete profile of the authenticated user
 * 
 * Process Flow:
 * 1. Extract user ID from authenticated request (set by authenticate middleware)
 * 2. Fetch fresh user data from database
 * 3. Return user profile with all details (password automatically excluded)
 * 
 * Error Handling:
 * - 404: User not found in database
 * - 500: Server/database errors
 * 
 * @route GET /api/auth/me
 * @access Private (requires authentication token)
 */
export const getCurrentUser = async (req, res) => {
  try {
    // Step 1: Extract user ID from authenticated request
    // The authenticate middleware has already verified the token and set req.userId
    const userId = req.userId;

    // Step 2: Fetch user data from database
    // We fetch fresh data to ensure we have the most up-to-date information
    // Password is automatically excluded due to 'select: false' in User model
    const user = await User.findById(userId);

    // Step 3: Error handling - User not found
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Step 4: Return user profile
    res.status(200).json({
      success: true,
      message: "User profile retrieved successfully",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          profilePicture: user.profilePicture,
          googleId: user.googleId,
          googleFitConnected: user.googleFitConnected,
          goals: user.goals,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error("❌ Get current user error:", error);

    // Error Handling: Server errors
    res.status(500).json({
      success: false,
      message: "Server error while fetching user data",
      error: error.message,
    });
  }
};

// Export getMe as an alias for backwards compatibility
export const getMe = getCurrentUser;

// ===== UPDATE USER PROFILE CONTROLLER =====
/**
 * Update the authenticated user's profile
 * This function allows users to update specific profile fields
 * 
 * Process Flow:
 * 1. Extract updatable fields from request body (name, profilePicture, goals)
 * 2. Validate that email/password are NOT being changed (security)
 * 3. Build update object with only provided fields
 * 4. Update user document with validation
 * 5. Return updated user data
 * 
 * Updatable Fields:
 * - name: User's display name (2-50 characters)
 * - profilePicture: URL to profile image (must be valid URL)
 * - goals: Health goals object (weightGoal, stepGoal, sleepGoal, calorieGoal, distanceGoal)
 * 
 * Non-updatable Fields (Security):
 * - email: Cannot be changed (use separate endpoint if needed)
 * - password: Cannot be changed here (use changePassword endpoint)
 * - googleId: System managed
 * - googleFitConnected: System managed
 * 
 * Error Handling:
 * - 400: No data provided or attempting to change restricted fields
 * - 400: Validation errors (invalid URL, out of range values, etc.)
 * - 404: User not found
 * - 500: Server/database errors
 * 
 * @route PUT /api/auth/profile
 * @access Private (requires authentication token)
 */
export const updateProfile = async (req, res) => {
  try {
    // Step 1: Extract fields from request body
    const { name, profilePicture, goals, email, password, googleId, googleFitConnected } = req.body;

    // Step 2: Validate that restricted fields are not being changed
    if (email !== undefined) {
      return res.status(400).json({
        success: false,
        message: "Email cannot be changed. Please contact support if you need to update your email.",
      });
    }

    if (password !== undefined) {
      return res.status(400).json({
        success: false,
        message: "Password cannot be changed here. Please use the change password endpoint.",
      });
    }

    if (googleId !== undefined) {
      return res.status(400).json({
        success: false,
        message: "Google ID is system managed and cannot be changed.",
      });
    }

    if (googleFitConnected !== undefined) {
      return res.status(400).json({
        success: false,
        message: "Google Fit connection status is system managed.",
      });
    }

    // Step 3: Build update object with only provided, updatable fields
    const updateData = {};
    
    if (name !== undefined) {
      updateData.name = name;
    }
    
    if (profilePicture !== undefined) {
      updateData.profilePicture = profilePicture;
    }
    
    if (goals !== undefined) {
      // Allow partial goal updates - merge with existing goals
      updateData.goals = goals;
    }

    // Check if any valid update data was provided
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No update data provided. Please provide at least one field to update (name, profilePicture, or goals).",
      });
    }

    // Step 4: Update user document with validation
    // new: true -> return updated document
    // runValidators: true -> run schema validations
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true, runValidators: true }
    );

    // Step 5: Handle user not found
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Step 6: Return updated user data
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          profilePicture: updatedUser.profilePicture,
          googleId: updatedUser.googleId,
          googleFitConnected: updatedUser.googleFitConnected,
          goals: updatedUser.goals,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error("❌ Update profile error:", error);

    // Error Handling: Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: messages,
      });
    }

    // Error Handling: Cast errors (invalid data types)
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: `Invalid ${error.path}: ${error.value}`,
      });
    }

    // Error Handling: Server errors
    res.status(500).json({
      success: false,
      message: "Server error while updating profile",
      error: error.message,
    });
  }
};

// ===== CHANGE PASSWORD CONTROLLER =====
/**
 * Change the authenticated user's password
 * Requires the current password for security verification
 * @route PUT /api/auth/change-password
 * @access Private (requires authentication token)
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide current password and new password",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long",
      });
    }

    const user = await User.findById(req.userId).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isPasswordCorrect = await user.comparePassword(currentPassword);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
      data: {
        token,
      },
    });
  } catch (error) {
    console.error("❌ Change password error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while changing password",
      error: error.message,
    });
  }
};
