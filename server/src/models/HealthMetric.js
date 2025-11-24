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

      // Heart points (Google Fit intensity metric)
      heartPoints: {
        type: Number,
        default: 0,
        min: [0, "Heart points cannot be negative"],
        max: [500, "Heart points value seems unrealistic"],
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

      // Height in centimeters (manually entered)
      height: {
        type: Number,
        default: null,
        min: [50, "Height must be at least 50 cm"],
        max: [300, "Height cannot exceed 300 cm"],
      },

      // Blood pressure (systolic/diastolic in mmHg)
      bloodPressure: {
        systolic: {
          type: Number,
          default: null,
          min: [60, "Systolic pressure too low"],
          max: [250, "Systolic pressure too high"],
        },
        diastolic: {
          type: Number,
          default: null,
          min: [40, "Diastolic pressure too low"],
          max: [150, "Diastolic pressure too high"],
        },
      },

      // Body temperature (in Celsius)
      bodyTemperature: {
        type: Number,
        default: null,
        min: [35, "Body temperature too low"],
        max: [42, "Body temperature too high"],
      },

      // Hydration (water intake in liters)
      hydration: {
        type: Number,
        default: null,
        min: [0, "Hydration cannot be negative"],
        max: [10, "Hydration value seems unrealistic"],
      },

      // ========================================
      // ⭐ WEARABLE-ONLY METRICS (NOT SUPPORTED)
      // ========================================
      // These fields are explicitly set to undefined and cannot be populated
      // Heart rate and blood oxygen require wearable devices (smartwatch, fitness band)
      // Android phones do NOT support these metrics via Google Fit API

      // NOT SUPPORTED - Wearable only
      // Heart rate monitoring requires dedicated optical sensors not present in phones
      heartRate: {
        type: Number,
        default: undefined, // Explicitly undefined
        // No validation rules - should never be set
      },

      // NOT SUPPORTED - Wearable only
      // Blood oxygen saturation (SpO2) requires pulse oximetry sensors
      oxygenSaturation: {
        type: Number,
        default: undefined, // Explicitly undefined
        // No validation rules - should never be set
      },
    },

    // Data source tracking
    // 'googlefit' = Phone-collected data only (no wearables)
    // 'manual' = User-entered data
    // 'import' = Bulk data import from CSV/JSON
    source: {
      type: String,
      enum: {
        values: ["googlefit", "manual", "import"],
        message: "Source must be 'googlefit', 'manual', or 'import'",
      },
      default: "manual",
      lowercase: true, // Normalize to lowercase for case-insensitive matching
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

// ========================================
// ⭐ CUSTOM VALIDATOR: ENFORCE PHONE-ONLY CONSTRAINTS
// ========================================
/**
 * Pre-save hook to enforce phone-only metric constraints
 *
 * This validator ensures that wearable-only metrics (heartRate, oxygenSaturation)
 * are NEVER stored in the database, regardless of source.
 *
 * Why this is critical:
 * - Android phones do NOT have optical sensors for heart rate
 * - Android phones do NOT have pulse oximetry for SpO2
 * - These metrics can ONLY come from wearable devices (smartwatch, fitness band)
 * - Our app explicitly supports PHONE DATA ONLY
 *
 * If these fields are present and non-null, the save operation will be rejected
 * with a clear error message explaining the constraint.
 */
healthMetricSchema.pre("save", function (next) {
  // Check if wearable-only metrics are present
  const hasHeartRate = this.metrics.heartRate !== null &&
                       this.metrics.heartRate !== undefined;
  const hasOxygenSaturation = this.metrics.oxygenSaturation !== null &&
                               this.metrics.oxygenSaturation !== undefined;

  // Reject if either wearable-only metric is present
  if (hasHeartRate || hasOxygenSaturation) {
    const rejectedMetrics = [];
    if (hasHeartRate) rejectedMetrics.push("heartRate");
    if (hasOxygenSaturation) rejectedMetrics.push("oxygenSaturation");

    const error = new Error(
      `Phone-only constraint violation: ${rejectedMetrics.join(", ")} cannot be set. ` +
      `These metrics require wearable devices and are not supported for phone data collection. ` +
      `Supported phone metrics: steps, distance, calories, activeMinutes, heartPoints, weight, ` +
      `sleepHours, height, bloodPressure, bodyTemperature, hydration.`
    );
    error.name = "ValidationError";
    return next(error);
  }

  // Additional enforcement: Explicitly remove these fields if somehow present
  if (this.metrics.heartRate !== undefined) {
    delete this.metrics.heartRate;
  }
  if (this.metrics.oxygenSaturation !== undefined) {
    delete this.metrics.oxygenSaturation;
  }

  next();
});

// ========================================
// ⭐ CUSTOM VALIDATOR: ENFORCE PHONE-ONLY ON UPDATE
// ========================================
/**
 * Pre-update hook to enforce phone-only constraints on updates
 *
 * This ensures that even when using findOneAndUpdate, updateOne, etc.,
 * wearable-only metrics cannot be added to existing documents.
 */
healthMetricSchema.pre(["updateOne", "findOneAndUpdate"], function (next) {
  const update = this.getUpdate();

  // Check if update contains wearable-only metrics
  const hasHeartRate = update.$set?.["metrics.heartRate"] !== null &&
                       update.$set?.["metrics.heartRate"] !== undefined;
  const hasOxygenSaturation = update.$set?.["metrics.oxygenSaturation"] !== null &&
                               update.$set?.["metrics.oxygenSaturation"] !== undefined;

  if (hasHeartRate || hasOxygenSaturation) {
    const rejectedMetrics = [];
    if (hasHeartRate) rejectedMetrics.push("heartRate");
    if (hasOxygenSaturation) rejectedMetrics.push("oxygenSaturation");

    const error = new Error(
      `Phone-only constraint violation: ${rejectedMetrics.join(", ")} cannot be set. ` +
      `These metrics require wearable devices and are not supported.`
    );
    error.name = "ValidationError";
    return next(error);
  }

  next();
});

// ===== INDEXES =====
// Compound index: Ensure one entry per user per day
healthMetricSchema.index({ userId: 1, date: 1 }, { unique: true });

// Index for date range queries
healthMetricSchema.index({ date: -1 });

// Index for source filtering
healthMetricSchema.index({ source: 1 });

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

// Get supported metrics list (phone-only)
healthMetricSchema.methods.getSupportedMetrics = function () {
  return [
    "steps",
    "distance",
    "calories",
    "activeMinutes",
    "heartPoints",
    "weight",
    "sleepHours",
    "height",
    "bloodPressure",
    "bodyTemperature",
    "hydration",
  ];
};

// Get unsupported metrics list (wearable-only)
healthMetricSchema.statics.getUnsupportedMetrics = function () {
  return ["heartRate", "oxygenSaturation"];
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
