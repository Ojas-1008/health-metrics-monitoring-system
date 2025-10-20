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
 * This requires authentication - user must provide a valid JWT token
 * @route GET /api/auth/me
 * @access Private (requires authentication token)
 */
export const getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    console.error("❌ Get me error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching user data",
      error: error.message,
    });
  }
};

// ===== UPDATE USER PROFILE CONTROLLER =====
/**
 * Update the authenticated user's profile
 * Allows users to update their name, profile picture, and health goals
 * @route PUT /api/auth/profile
 * @access Private (requires authentication token)
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, profilePicture, goals } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (profilePicture) updateData.profilePicture = profilePicture;
    if (goals) updateData.goals = goals;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No update data provided",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    console.error("❌ Update profile error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: messages,
      });
    }

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
