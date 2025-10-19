import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema(
  {
    // Reference to User
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },

    // Type of analysis performed
    analysisType: {
      type: String,
      enum: [
        "movingaverage", // Smoothed averages over time
        "trend", // Increasing/decreasing patterns
        "prediction", // Future value forecasts
        "goalanalysis", // Goal achievement stats
        "comparison", // Compare different metrics
      ],
      required: [true, "Analysis type is required"],
    },

    // Which health metric this analysis is for
    metricType: {
      type: String,
      enum: [
        "steps", // ✅ From Google Fit
        "calories", // ✅ From Google Fit
        "distance", // ✅ From Google Fit
        "activeminutes", // ✅ From Google Fit
        "weight", // ⚠️ Manual entry
        "heartrate", // ⚠️ Manual entry
        "sleep", // ⚠️ Manual entry
      ],
      required: [true, "Metric type is required"],
    },

    // Time range for this analysis
    timeRange: {
      type: String,
      enum: ["7days", "14days", "30days", "90days"],
      required: [true, "Time range is required"],
    },

    // Start and end dates for the analysis period
    periodStart: {
      type: Date,
      required: [true, "Period start date is required"],
    },

    periodEnd: {
      type: Date,
      required: [true, "Period end date is required"],
    },

    // ===== ANALYTICS RESULTS (Flexible structure) =====

    result: {
      // For Moving Average analysis
      movingAverageValue: {
        type: Number,
        default: null,
      },

      // For Trend analysis
      trendDirection: {
        type: String,
        enum: ["increasing", "decreasing", "stable", null],
        default: null,
      },
      trendSlope: {
        type: Number, // Rate of change
        default: null,
      },
      trendPercentage: {
        type: Number, // Percentage change
        default: null,
      },

      // For Prediction analysis
      predictedValue: {
        type: Number,
        default: null,
      },
      predictionConfidence: {
        type: Number, // 0-100 (percentage)
        min: [0, "Confidence cannot be negative"],
        max: [100, "Confidence cannot exceed 100"],
        default: null,
      },

      // For Goal Analysis
      goalAchievementRate: {
        type: Number, // Percentage of days goal was met
        min: [0, "Rate cannot be negative"],
        max: [100, "Rate cannot exceed 100"],
        default: null,
      },
      currentStreak: {
        type: Number, // Consecutive days meeting goal
        default: 0,
      },
      longestStreak: {
        type: Number,
        default: 0,
      },

      // Additional metadata
      dataPoints: {
        type: Number, // Number of data points used in analysis
        default: 0,
      },

      // Raw data for charts (array of values)
      chartData: {
        type: [Number],
        default: [],
      },

      // Additional insights or notes from Spark
      insights: {
        type: String,
        maxlength: [1000, "Insights cannot exceed 1000 characters"],
        default: null,
      },
    },

    // Spark computation metadata
    computationMetadata: {
      sparkJobId: {
        type: String,
        default: null,
      },
      processingTime: {
        type: Number, // milliseconds
        default: null,
      },
      dataQuality: {
        type: String,
        enum: ["excellent", "good", "fair", "poor"],
        default: "good",
      },
    },

    // When this analysis was calculated
    calculatedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },

    // Expiration time for cache invalidation (TTL)
    expiresAt: {
      type: Date,
      required: true,
      index: true, // TTL index will use this field
    },

    // Status of this analytics entry
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "expired"],
      default: "completed",
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// ===== INDEXES =====

// Compound index: Unique analytics per user + type + metric + timeRange
analyticsSchema.index(
  {
    userId: 1,
    analysisType: 1,
    metricType: 1,
    timeRange: 1,
  },
  { unique: true }
);

// Index for querying by metric type
analyticsSchema.index({ metricType: 1, calculatedAt: -1 });

// Index for filtering by analysis type
analyticsSchema.index({ analysisType: 1 });

// ===== TTL INDEX (Auto-delete expired analytics) =====
// MongoDB will automatically delete documents where expiresAt < current time
analyticsSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ===== PRE-SAVE MIDDLEWARE =====

// Automatically set expiration time based on time range
analyticsSchema.pre("save", function (next) {
  if (!this.expiresAt) {
    const now = new Date();

    // Set expiration based on time range
    // Shorter ranges expire faster (more volatile data)
    switch (this.timeRange) {
      case "7days":
        // Expire after 6 hours (data changes frequently)
        this.expiresAt = new Date(now.getTime() + 6 * 60 * 60 * 1000);
        break;
      case "14days":
        // Expire after 12 hours
        this.expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000);
        break;
      case "30days":
        // Expire after 24 hours
        this.expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case "90days":
        // Expire after 48 hours (more stable data)
        this.expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);
        break;
      default:
        // Default: 24 hours
        this.expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }
  next();
});

// ===== INSTANCE METHODS =====

// Check if analytics is still valid (not expired)
analyticsSchema.methods.isValid = function () {
  return this.expiresAt > new Date();
};

// Get age of this analytics in hours
analyticsSchema.methods.getAgeInHours = function () {
  const now = new Date();
  const ageInMs = now - this.calculatedAt;
  return Math.floor(ageInMs / (1000 * 60 * 60));
};

// Check if analytics needs refresh
analyticsSchema.methods.needsRefresh = function () {
  const hoursOld = this.getAgeInHours();

  switch (this.timeRange) {
    case "7days":
      return hoursOld > 6;
    case "14days":
      return hoursOld > 12;
    case "30days":
      return hoursOld > 24;
    case "90days":
      return hoursOld > 48;
    default:
      return hoursOld > 24;
  }
};

// ===== STATIC METHODS =====

// Get latest analytics for a user
analyticsSchema.statics.getLatestForUser = function (
  userId,
  analysisType,
  metricType,
  timeRange
) {
  return this.findOne({
    userId: userId,
    analysisType: analysisType,
    metricType: metricType,
    timeRange: timeRange,
    status: "completed",
    expiresAt: { $gt: new Date() }, // Not expired
  }).sort({ calculatedAt: -1 });
};

// Get all analytics for a specific metric
analyticsSchema.statics.getByMetric = function (userId, metricType) {
  return this.find({
    userId: userId,
    metricType: metricType,
    expiresAt: { $gt: new Date() },
  }).sort({ calculatedAt: -1 });
};

// Delete expired analytics manually (in case TTL monitor is delayed)
analyticsSchema.statics.cleanupExpired = function () {
  return this.deleteMany({
    expiresAt: { $lt: new Date() },
  });
};

// Get analytics summary for dashboard
analyticsSchema.statics.getDashboardSummary = function (userId) {
  return this.find({
    userId: userId,
    status: "completed",
    expiresAt: { $gt: new Date() },
  })
    .sort({ calculatedAt: -1 })
    .limit(10);
};

const Analytics = mongoose.model("Analytics", analyticsSchema);

export default Analytics;
