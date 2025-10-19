import mongoose from "mongoose";

const healthMetricSchema = new mongoose.Schema(
  {
    // Reference to User
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },

    // Date for the metrics (one entry per day)
    date: {
      type: Date,
      required: [true, "Date is required"],
      index: true,
    },

    // Metrics object - data available from phone sensors
    metrics: {
      // Steps count (from accelerometer)
      steps: {
        type: Number,
        default: 0,
        min: [0, "Steps cannot be negative"],
        max: [100000, "Steps value seems unrealistic"],
      },

      // Distance in kilometers
      distance: {
        type: Number,
        default: 0,
        min: [0, "Distance cannot be negative"],
        max: [500, "Distance value seems unrealistic"],
      },

      // Calories burned (estimated)
      calories: {
        type: Number,
        default: 0,
        min: [0, "Calories cannot be negative"],
        max: [10000, "Calories value seems unrealistic"],
      },

      // Active minutes (time spent moving)
      activeMinutes: {
        type: Number,
        default: 0,
        min: [0, "Active minutes cannot be negative"],
        max: [1440, "Active minutes cannot exceed 24 hours"],
      },

      // Weight in kg (manually entered by user)
      weight: {
        type: Number,
        default: null,
        min: [30, "Weight must be at least 30 kg"],
        max: [300, "Weight cannot exceed 300 kg"],
      },

      // Sleep hours (manually entered or estimated)
      sleepHours: {
        type: Number,
        default: null,
        min: [0, "Sleep hours cannot be negative"],
        max: [24, "Sleep hours cannot exceed 24"],
      },

      // Note: Heart rate NOT included (requires wearable)
      // Note: SpO2 NOT included (requires wearable)
    },

    // Data source tracking
    source: {
      type: String,
      enum: ["googlefit", "manual"],
      default: "manual",
      required: true,
    },

    // Activity sessions (if Google Fit detected specific activities)
    activities: [
      {
        type: {
          type: String,
          enum: ["walking", "running", "cycling", "unknown"],
          default: "unknown",
        },
        duration: {
          type: Number, // Minutes
          min: 0,
        },
        startTime: Date,
        endTime: Date,
      },
    ],

    // Sync status
    syncedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ===== INDEXES =====

// Compound index: Ensure one entry per user per day
healthMetricSchema.index({ userId: 1, date: 1 }, { unique: true });

// Index for date range queries
healthMetricSchema.index({ date: -1 });

// ===== INSTANCE METHODS =====

// Calculate total active time
healthMetricSchema.methods.getTotalActiveTime = function () {
  return this.metrics.activeMinutes;
};

// Check if goals are met (requires user goals)
healthMetricSchema.methods.checkGoals = function (userGoals) {
  return {
    stepsGoalMet: this.metrics.steps >= (userGoals.stepGoal || 10000),
    sleepGoalMet: this.metrics.sleepHours >= (userGoals.sleepGoal || 8),
    weightGoalMet: this.metrics.weight
      ? Math.abs(this.metrics.weight - userGoals.weightGoal) <= 0.5
      : false,
  };
};

// ===== STATIC METHODS =====

// Get metrics for date range
healthMetricSchema.statics.getMetricsInRange = async function (
  userId,
  startDate,
  endDate
) {
  return this.find({
    userId,
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  }).sort({ date: 1 });
};

// Get weekly summary
healthMetricSchema.statics.getWeeklySummary = async function (userId) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const metrics = await this.find({
    userId,
    date: { $gte: sevenDaysAgo },
  });

  return {
    totalSteps: metrics.reduce((sum, m) => sum + m.metrics.steps, 0),
    totalDistance: metrics.reduce((sum, m) => sum + m.metrics.distance, 0),
    totalCalories: metrics.reduce((sum, m) => sum + m.metrics.calories, 0),
    avgActiveMinutes:
      metrics.reduce((sum, m) => sum + m.metrics.activeMinutes, 0) / 7,
    daysLogged: metrics.length,
  };
};

// Create and export model
const HealthMetric = mongoose.model("HealthMetric", healthMetricSchema);

export default HealthMetric;
