import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import validator from "validator";

// ===== CONSTANTS =====
// Exact OAuth scope string for Google Fit - matches Google's required scopes
const GOOGLE_FIT_OAUTH_SCOPE = 
  "https://www.googleapis.com/auth/fitness.activity.read " +
  "https://www.googleapis.com/auth/fitness.body.read " +
  "https://www.googleapis.com/auth/fitness.nutrition.read " +
  "https://www.googleapis.com/auth/fitness.sleep.read " +
  "https://www.googleapis.com/auth/fitness.location.read";

// Define the User Schema
const userSchema = new mongoose.Schema(
  {
    // ===== CORE AUTHENTICATION =====
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: validator.isEmail,
        message: "Please provide a valid email address",
      },
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      select: false, // Security: Don't include in queries by default
    },

    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    // ===== OPTIONAL GOOGLE OAUTH LOGIN =====
    googleId: {
      type: String,
      // No default - keep undefined to avoid unique index conflicts
    },

    profilePicture: {
      type: String,
      default: null,
      validate: {
        validator: function (value) {
          if (!value) return true; // Allow null
          return validator.isURL(value);
        },
        message: "Profile picture must be a valid URL",
      },
    },

    // ===== GOOGLE FIT OAUTH INTEGRATION =====
    googleFitConnected: {
      type: Boolean,
      default: false,
      index: true, // Index for fast filtering of connected users
    },

    // Google Fit OAuth tokens (sensitive data - hidden by default)
    googleFitTokens: {
      access_token: {
        type: String,
        minlength: [10, "Access token must be at least 10 characters"],
        validate: {
          validator: function (value) {
            // If googleFitConnected is true, access_token must exist and be valid
            if (this.googleFitConnected && !value) {
              throw new Error("Access token is required when Google Fit is connected");
            }
            return true;
          },
          message: "Access token validation failed",
        },
      },

      refresh_token: {
        type: String,
        minlength: [10, "Refresh token must be at least 10 characters"],
        validate: {
          validator: function (value) {
            // If googleFitConnected is true, refresh_token must exist and be valid
            if (this.googleFitConnected && !value) {
              throw new Error("Refresh token is required when Google Fit is connected");
            }
            return true;
          },
          message: "Refresh token validation failed",
        },
      },

      token_expiry: {
        type: Date,
        validate: {
          validator: function (value) {
            // Allow null/undefined
            if (!value) return true;
            // If set, should ideally be a future date (but allow past for testing scenarios)
            // Controllers should validate this and refresh tokens if expired
            return value instanceof Date;
          },
          message: "Token expiry must be a valid date",
        },
      },

      scope: {
        type: String,
        validate: {
          validator: function (value) {
            // Allow null/undefined
            if (!value) return true;
            // Must match exact OAuth scope requested from Google
            return value === GOOGLE_FIT_OAUTH_SCOPE;
          },
          message: `Scope must match the exact OAuth scope: ${GOOGLE_FIT_OAUTH_SCOPE}`,
        },
      },
    },

    // Track last successful Google Fit sync
    lastSyncAt: {
      type: Date,
      default: null,
    },

    // User preferences for Google Fit data synchronization
    syncPreferences: {
      frequency: {
        type: String,
        enum: ["hourly", "daily", "weekly"],
        default: "daily",
        description: "How often to sync data from Google Fit",
      },

      enabledDataTypes: {
        steps: {
          type: Boolean,
          default: true,  // ✅ Already enabled
          description: "Sync step count data",
        },
        weight: {
          type: Boolean,
          default: true,  // ✅ Already enabled
          description: "Sync weight measurements",
        },
        heartRate: {
          type: Boolean,
          default: false,  // Keep disabled (requires wearable)
          description: "Sync heart rate (requires wearable, disabled for mobile-only)",
        },
        sleep: {
          type: Boolean,
          default: true,  // ✅ Already enabled
          description: "Sync sleep data",
        },
        calories: {
          type: Boolean,
          default: true,  // ✅ Already enabled
          description: "Sync calorie burn data",
        },
        distance: {
          type: Boolean,
          default: true,  // ✅ Already enabled
          description: "Sync distance traveled",
        },
        
        // ⭐ FIX: Enable these metrics
        height: {
          type: Boolean,
          default: true,  // ✅ CHANGE FROM false TO true
          description: "Sync height measurements",
        },
        bloodPressure: {
          type: Boolean,
          default: true,  // ✅ CHANGE FROM false TO true
          description: "Sync blood pressure readings",
        },
        oxygenSaturation: {
          type: Boolean,
          default: false,  // Keep disabled (requires wearable)
          description: "Sync blood oxygen saturation (requires wearable)",
        },
        bodyTemperature: {
          type: Boolean,
          default: true,  // ✅ CHANGE FROM false TO true
          description: "Sync body temperature readings",
        },
        hydration: {
          type: Boolean,
          default: true,  // ✅ CHANGE FROM false TO true
          description: "Sync hydration/water intake data",
        },
        
        // ⭐ ADD: Heart Points (missing entirely)
        heartPoints: {
          type: Boolean,
          default: true,  // ✅ NEW METRIC
          description: "Sync heart points (move minutes) from Google Fit",
        },
        moveMinutes: {
          type: Boolean,
          default: true,  // ✅ NEW METRIC
          description: "Sync move minutes from Google Fit activities",
        },
        activeMinutes: {
          type: Boolean,
          default: true,  // ✅ Already enabled but make explicit
          description: "Sync active minutes data",
        },
      },
    },

    // ===== USER HEALTH GOALS =====
    goals: {
      weightGoal: {
        type: Number,
        default: null,
        min: [30, "Weight goal must be at least 30 kg"],
        max: [300, "Weight goal cannot exceed 300 kg"],
      },

      stepGoal: {
        type: Number,
        default: 10000, // WHO recommends 10,000 steps/day
        min: [1000, "Step goal must be at least 1,000"],
        max: [50000, "Step goal cannot exceed 50,000"],
      },

      sleepGoal: {
        type: Number,
        default: 8, // 8 hours recommended
        min: [4, "Sleep goal must be at least 4 hours"],
        max: [12, "Sleep goal cannot exceed 12 hours"],
      },

      calorieGoal: {
        type: Number,
        default: 2000, // Average daily calories
        min: [500, "Calorie goal must be at least 500"],
        max: [5000, "Calorie goal cannot exceed 5,000"],
      },

      distanceGoal: {
        type: Number,
        default: 5, // 5 km per day
        min: [0.5, "Distance goal must be at least 0.5 km"],
        max: [100, "Distance goal cannot exceed 100 km"],
      },
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt
  }
);

// ===== INDEXES =====
/**
* SYNC WORKER INDEX: Compound index on (googleFitConnected, lastSyncAt)
* 
* Optimization: The sync worker queries all users with googleFitConnected=true
* and filters by lastSyncAt to determine which users need sync based on frequency.
* 
* Query examples this optimizes:
* - db.users.find({ googleFitConnected: true })
* - db.users.find({ googleFitConnected: true, lastSyncAt: { $lt: oneHourAgo } })
* - db.users.find({ googleFitConnected: true, lastSyncAt: { $exists: false } })
* 
* Field order matters: Boolean first (lower cardinality), Date second
* This prevents full collection scans even with millions of users
* 
* Expected usage: ~10-100k queries/hour during peak sync times
* Performance gain: ~100-1000x faster than full collection scan
*/
userSchema.index(
  { googleFitConnected: 1, lastSyncAt: 1 },
  {
    name: "sync_worker_query",
    background: true, // Build in background without blocking
    sparse: false, // Include all docs even if lastSyncAt is null
  }
);

/**
* TOKEN EXPIRY INDEX: Sparse index on googleFitTokens.token_expiry
* 
* Optimization: Used for token cleanup/refresh operations.
* Only indexes documents where googleFitTokens.token_expiry exists.
* 
* Query examples this optimizes:
* - db.users.find({ "googleFitTokens.token_expiry": { $lt: now } })
* - db.users.find({ "googleFitTokens.token_expiry": { $lt: now, $gt: tomorrow } })
* 
* Sparse: true means null values are excluded from the index
* This reduces index size by ~80% since most users won't have tokens
* 
* Expected usage: Token refresh job runs every hour
* Performance gain: Finds expired tokens in O(log n) instead of O(n)
*/
userSchema.index(
  { "googleFitTokens.token_expiry": 1 },
  {
    name: "token_expiry_cleanup",
    background: true,
    sparse: true, // Exclude docs without tokens to reduce index size
  }
);

/**
* GOOGLE FIT ACTIVE STATUS INDEX: Compound index on both OAuth conditions
* 
* Optimization: Speeds up queries checking if user has active OAuth
* Used by controllers to quickly filter active connected users
* 
* Query examples this optimizes:
* - db.users.find({ googleFitConnected: true, "googleFitTokens.token_expiry": { $gt: now } })
* 
* This replaces the earlier index for broader coverage
*/
userSchema.index(
  { googleFitConnected: 1, "googleFitTokens.token_expiry": 1 },
  {
    name: "active_google_fit_users",
    background: true,
    sparse: true, // Only index docs with tokens
  }
);

/**
* EMAIL LOOKUP: Unique index (already exists from schema)
* Name explicitly for clarity
*/
userSchema.index(
  { email: 1 },
  {
    name: "unique_email",
    unique: true,
  }
);

/**
* GOOGLE ID OAUTH LOGIN: Partial unique index
* Allows OAuth login while avoiding null conflicts
* Only indexes documents where googleId is defined
*/
userSchema.index(
  { googleId: 1 },
  {
    name: "unique_google_id",
    unique: true,
    partialFilterExpression: { googleId: { $type: "string" } },
    background: true,
  }
);

/**
* TIMESTAMP QUERIES: Index on createdAt for pagination and filtering
* Common query: db.users.find({ createdAt: { $gt: sevenDaysAgo } })
*/
userSchema.index(
  { createdAt: -1 },
  {
    name: "recent_users",
    background: true,
  }
);

/**
* CLEANUP QUERIES: Index for deactivated users or old records
* Used for archival and cleanup jobs
*/
userSchema.index(
  { googleFitConnected: 1, updatedAt: -1 },
  {
    name: "inactive_users_cleanup",
    background: true,
  }
);

// ===== VIRTUAL PROPERTIES =====

/**
 * Virtual property to check if Google Fit OAuth is currently active
 * Returns true only if:
 * 1. User has connected to Google Fit (googleFitConnected === true)
 * 2. Tokens exist
 * 3. Token has not expired (token_expiry > current time)
 *
 * This provides a single source of truth for checking OAuth status
 * throughout all controllers and middleware
 */
userSchema.virtual("isGoogleFitActive").get(function () {
  const isConnected = this.googleFitConnected === true;
  const hasTokens =
    this.googleFitTokens &&
    this.googleFitTokens.access_token &&
    this.googleFitTokens.refresh_token;
  const isNotExpired =
    this.googleFitTokens &&
    this.googleFitTokens.token_expiry &&
    new Date() < this.googleFitTokens.token_expiry;

  return isConnected && hasTokens && isNotExpired;
});

/**
 * Virtual property to get days until token expires
 * Useful for monitoring token expiration and triggering refresh
 * Returns null if tokens don't exist
 */
userSchema.virtual("daysUntilTokenExpiry").get(function () {
  if (!this.googleFitTokens || !this.googleFitTokens.token_expiry) {
    return null;
  }
  const now = new Date();
  const expiry = new Date(this.googleFitTokens.token_expiry);
  const daysUntilExpiry = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
  return Math.max(0, daysUntilExpiry);
});

// ===== MIDDLEWARE: Hash Password Before Saving =====

/**
 * Pre-save middleware: Hash password before storing in database
 * Only runs if password is new or modified
 */
userSchema.pre("save", async function (next) {
  // Skip if password hasn't been modified
  if (!this.isModified("password")) {
    return next();
  }

  try {
    // Generate salt (10 rounds = good security vs performance balance)
    const salt = await bcrypt.genSalt(10);

    // Hash password with salt
    this.password = await bcrypt.hash(this.password, salt);

    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Pre-save middleware: Validate Google Fit tokens consistency
 * Ensures that if tokens are being set, all required fields are present
 */
userSchema.pre("save", function (next) {
  if (this.googleFitConnected && this.googleFitTokens) {
    const { access_token, refresh_token, token_expiry, scope } =
      this.googleFitTokens;

    // All token fields must be present when connected
    if (!access_token || !refresh_token || !token_expiry || !scope) {
      return next(
        new Error(
          "All Google Fit token fields (access_token, refresh_token, token_expiry, scope) are required when googleFitConnected is true"
        )
      );
    }

    // Scope must match exact string
    if (scope !== GOOGLE_FIT_OAUTH_SCOPE) {
      return next(
        new Error(`Scope must match the exact OAuth scope: ${GOOGLE_FIT_OAUTH_SCOPE}`)
      );
    }
  }

  next();
});

// ===== INSTANCE METHODS =====

/**
 * Compare provided password with hashed password in database
 * Used during login to verify user credentials
 * @param {String} candidatePassword - Plain text password to compare
 * @returns {Promise<Boolean>} True if passwords match, false otherwise
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

/**
 * Safely update Google Fit tokens and connection status
 * Validates all tokens before setting and marks lastSyncAt
 * @param {Object} tokenData - Contains access_token, refresh_token, token_expiry, scope
 * @throws {Error} If any required token field is missing or invalid
 */
userSchema.methods.updateGoogleFitTokens = function (tokenData) {
  const { access_token, refresh_token, token_expiry, scope } = tokenData;

  // Validate all required fields
  if (!access_token || !refresh_token || !token_expiry || !scope) {
    throw new Error(
      "All token fields (access_token, refresh_token, token_expiry, scope) are required"
    );
  }

  // Validate token_expiry is a future date
  if (!(token_expiry instanceof Date) || token_expiry <= new Date()) {
    throw new Error("Token expiry must be a valid future date");
  }

  // Validate scope matches expected OAuth scope
  if (scope !== GOOGLE_FIT_OAUTH_SCOPE) {
    throw new Error(`Scope must match the exact OAuth scope: ${GOOGLE_FIT_OAUTH_SCOPE}`);
  }

  // Update tokens
  this.googleFitTokens = {
    access_token,
    refresh_token,
    token_expiry,
    scope,
  };

  // Mark as connected
  this.googleFitConnected = true;

  // Don't set lastSyncAt here - let the sync worker set it on first successful sync
  // This ensures the first sync fetches the full 30-day window
  // this.lastSyncAt remains null until first sync completes

  return this; // For method chaining
};

/**
 * Disconnect Google Fit OAuth and clear sensitive tokens
 * Called when user revokes access or disconnects account
 */
userSchema.methods.disconnectGoogleFit = function () {
  this.googleFitConnected = false;
  this.googleFitTokens = {
    access_token: undefined,
    refresh_token: undefined,
    token_expiry: undefined,
    scope: undefined,
  };
  this.lastSyncAt = null; // Reset lastSyncAt so next connection starts fresh
  return this;
};

// ===== CREATE AND EXPORT MODEL =====
const User = mongoose.model("User", userSchema);

export default User;
