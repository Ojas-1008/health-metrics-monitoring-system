import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import validator from "validator";

// Define the User Schema
const userSchema = new mongoose.Schema(
  {
    // Email field with validation
    email: {
      type: String,
      required: [true, "Email is required"], // Custom error message
      unique: true, // No duplicate emails allowed
      lowercase: true, // Convert to lowercase automatically
      trim: true, // Remove whitespace
      validate: {
        validator: validator.isEmail, // Check if valid email format
        message: "Please provide a valid email address",
      },
    },

    // Password field (will be hashed before saving)
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      select: false, // Don't include password in queries by default (security)
    },

    // Name field
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    // Google ID (for OAuth login - optional for now)
    googleId: {
      type: String,
      default: null,
      unique: true,
      sparse: true, // Allows multiple null values
    },

    // Profile picture URL
    profilePicture: {
      type: String,
      default: null,
      validate: {
        validator: function (value) {
          if (!value) return true; // Allow null
          return validator.isURL(value); // Check if valid URL
        },
        message: "Profile picture must be a valid URL",
      },
    },

    // Google Fit connection status
    googleFitConnected: {
      type: Boolean,
      default: false,
    },

    // User's health goals (nested object)
    goals: {
      weightGoal: {
        type: Number,
        default: null,
        min: [30, "Weight goal must be at least 30 kg"],
        max: [300, "Weight goal cannot exceed 300 kg"],
      },
      stepGoal: {
        type: Number,
        default: 10000, // Default 10,000 steps
        min: [1000, "Step goal must be at least 1,000"],
        max: [50000, "Step goal cannot exceed 50,000"],
      },
      sleepGoal: {
        type: Number,
        default: 8, // Default 8 hours
        min: [4, "Sleep goal must be at least 4 hours"],
        max: [12, "Sleep goal cannot exceed 12 hours"],
      },
    },
  },
  {
    // Mongoose automatically creates createdAt and updatedAt fields
    timestamps: true,
  }
);

// ===== MIDDLEWARE: Hash Password Before Saving =====

// This runs automatically before saving a user document
userSchema.pre("save", async function (next) {
  // Only hash the password if it's new or modified
  if (!this.isModified("password")) {
    return next(); // Skip hashing
  }

  try {
    // Generate salt (random data added to password)
    const salt = await bcrypt.genSalt(10); // 10 rounds = good security vs performance balance

    // Hash the password with the salt
    this.password = await bcrypt.hash(this.password, salt);

    next(); // Continue saving
  } catch (error) {
    next(error); // Pass error to Mongoose
  }
});

// ===== INSTANCE METHOD: Compare Passwords =====

// This method will be used during login to verify passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    // Compare plain text password with hashed password
    // Returns true if they match, false otherwise
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

// ===== CREATE AND EXPORT THE MODEL =====

// The model name 'User' will create a collection called 'users' in MongoDB
const User = mongoose.model("User", userSchema);

export default User;
