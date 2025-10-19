import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    // Reference to User
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },

    // Alert type/category
    alertType: {
      type: String,
      enum: [
        "lowactivity", // User hasn't been active
        "goalreminder", // Remind user about goals
        "goalreached", // User achieved a goal
        "trendwarning", // Negative trend detected
        "streakupdate", // Activity streak notification
        "dataentry", // Reminder to log manual data
        "syncstatus", // Google Fit sync updates
        "achievement", // Milestones and badges
        "healthinsight", // General health tips from analytics
      ],
      required: [true, "Alert type is required"],
    },

    // Alert severity/priority
    severity: {
      type: String,
      enum: ["info", "warning", "critical", "success"],
      default: "info",
      required: true,
    },

    // Alert title (short heading)
    title: {
      type: String,
      required: [true, "Alert title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },

    // Alert message (detailed description)
    message: {
      type: String,
      required: [true, "Alert message is required"],
      trim: true,
      maxlength: [500, "Message cannot exceed 500 characters"],
    },

    // Related metric (if applicable)
    relatedMetric: {
      type: String,
      enum: [
        "steps",
        "calories",
        "distance",
        "activeminutes",
        "weight",
        "heartrate",
        "sleep",
        "general",
      ],
      default: "general",
    },

    // Additional context data (flexible structure)
    metadata: {
      // Current value (e.g., current steps)
      currentValue: {
        type: Number,
        default: null,
      },

      // Target/goal value
      targetValue: {
        type: Number,
        default: null,
      },

      // Percentage completion
      percentage: {
        type: Number,
        min: [0, "Percentage cannot be negative"],
        max: [100, "Percentage cannot exceed 100"],
        default: null,
      },

      // Streak count (for streak alerts)
      streakDays: {
        type: Number,
        default: null,
      },

      // Date range (for trend alerts)
      dateRange: {
        start: { type: Date, default: null },
        end: { type: Date, default: null },
      },

      // Related analytics ID (if triggered by analytics)
      analyticsId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Analytics",
        default: null,
      },

      // Trend direction (for trend alerts)
      trend: {
        type: String,
        enum: ["increasing", "decreasing", "stable", null],
        default: null,
      },
    },

    // Read status
    read: {
      type: Boolean,
      default: false,
      index: true, // Index for filtering unread alerts
    },

    // When user read the alert
    readAt: {
      type: Date,
      default: null,
    },

    // Action button data (for interactive alerts)
    actionButton: {
      text: {
        type: String,
        maxlength: [50, "Button text cannot exceed 50 characters"],
        default: null,
      },
      action: {
        type: String,
        enum: [
          "view_metrics",
          "log_data",
          "view_analytics",
          "sync_googlefit",
          "update_goals",
          null,
        ],
        default: null,
      },
      route: {
        type: String, // Frontend route to navigate to
        default: null,
      },
    },

    // Alert expiration (for time-sensitive alerts)
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },

    // Alert dismissed by user (different from "read")
    dismissed: {
      type: Boolean,
      default: false,
    },

    dismissedAt: {
      type: Date,
      default: null,
    },

    // Priority score (for sorting)
    priorityScore: {
      type: Number,
      min: [0, "Priority score cannot be negative"],
      max: [100, "Priority score cannot exceed 100"],
      default: 50, // Medium priority
    },

    // Notification sent status (for push notifications)
    notificationSent: {
      type: Boolean,
      default: false,
    },

    sentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// ===== INDEXES =====

// Compound index: Find unread alerts for a user
alertSchema.index({ userId: 1, read: false, createdAt: -1 });

// Index for filtering by alert type
alertSchema.index({ alertType: 1, createdAt: -1 });

// Index for finding alerts by severity
alertSchema.index({ severity: 1 });

// Index for filtering by related metric
alertSchema.index({ relatedMetric: 1 });

// TTL index for expired alerts (auto-delete)
alertSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ===== VIRTUAL PROPERTIES =====

// Check if alert is expired
alertSchema.virtual("isExpired").get(function () {
  if (!this.expiresAt) return false;
  return this.expiresAt < new Date();
});

// Get age of alert in hours
alertSchema.virtual("ageInHours").get(function () {
  const now = new Date();
  const ageInMs = now - this.createdAt;
  return Math.floor(ageInMs / (1000 * 60 * 60));
});

// ===== PRE-SAVE MIDDLEWARE =====

// Set priority score based on severity
alertSchema.pre("save", function (next) {
  if (!this.isModified("severity")) {
    return next();
  }

  // Auto-assign priority scores
  switch (this.severity) {
    case "critical":
      this.priorityScore = 90;
      break;
    case "warning":
      this.priorityScore = 70;
      break;
    case "success":
      this.priorityScore = 60;
      break;
    case "info":
      this.priorityScore = 40;
      break;
    default:
      this.priorityScore = 50;
  }

  next();
});

// Auto-set expiration for certain alert types
alertSchema.pre("save", function (next) {
  if (!this.expiresAt) {
    const now = new Date();

    // Set expiration based on alert type
    switch (this.alertType) {
      case "goalreminder":
        // Expire after 24 hours (daily reminder)
        this.expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case "syncstatus":
        // Expire after 6 hours (status updates)
        this.expiresAt = new Date(now.getTime() + 6 * 60 * 60 * 1000);
        break;
      case "goalreached":
        // Keep for 7 days (achievements)
        this.expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case "streakupdate":
        // Keep for 3 days
        this.expiresAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        break;
      case "dataentry":
        // Expire after 12 hours
        this.expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000);
        break;
      default:
        // Default: 7 days
        this.expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
  }
  next();
});

// ===== INSTANCE METHODS =====

// Mark alert as read
alertSchema.methods.markAsRead = function () {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

// Dismiss alert
alertSchema.methods.dismiss = function () {
  this.dismissed = true;
  this.dismissedAt = new Date();
  return this.save();
};

// Check if alert should be displayed
alertSchema.methods.shouldDisplay = function () {
  // Don't show if dismissed or expired
  if (this.dismissed) return false;
  if (this.expiresAt && this.expiresAt < new Date()) return false;

  return true;
};

// ===== STATIC METHODS =====

// Get all unread alerts for a user
alertSchema.statics.getUnread = function (userId, limit = 10) {
  return this.find({
    userId: userId,
    read: false,
    dismissed: false,
    $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }],
  })
    .sort({ priorityScore: -1, createdAt: -1 })
    .limit(limit);
};

// Get unread count
alertSchema.statics.getUnreadCount = function (userId) {
  return this.countDocuments({
    userId: userId,
    read: false,
    dismissed: false,
    $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }],
  });
};

// Get alerts by type
alertSchema.statics.getByType = function (userId, alertType, limit = 20) {
  return this.find({
    userId: userId,
    alertType: alertType,
    dismissed: false,
  })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Get recent alerts (dashboard feed)
alertSchema.statics.getRecent = function (userId, limit = 10) {
  return this.find({
    userId: userId,
    dismissed: false,
    $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }],
  })
    .sort({ priorityScore: -1, createdAt: -1 })
    .limit(limit);
};

// Mark all alerts as read
alertSchema.statics.markAllAsRead = function (userId) {
  return this.updateMany(
    { userId: userId, read: false },
    { read: true, readAt: new Date() }
  );
};

// Cleanup old dismissed alerts
alertSchema.statics.cleanupDismissed = function (daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return this.deleteMany({
    dismissed: true,
    dismissedAt: { $lt: cutoffDate },
  });
};

// Get critical alerts only
alertSchema.statics.getCritical = function (userId) {
  return this.find({
    userId: userId,
    severity: "critical",
    read: false,
    dismissed: false,
    $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }],
  }).sort({ createdAt: -1 });
};

// Create achievement alert (helper method)
alertSchema.statics.createAchievement = function (
  userId,
  title,
  message,
  metadata = {}
) {
  return this.create({
    userId: userId,
    alertType: "achievement",
    severity: "success",
    title: title,
    message: message,
    metadata: metadata,
  });
};

// Create warning alert (helper method)
alertSchema.statics.createWarning = function (
  userId,
  title,
  message,
  relatedMetric,
  metadata = {}
) {
  return this.create({
    userId: userId,
    alertType: "trendwarning",
    severity: "warning",
    title: title,
    message: message,
    relatedMetric: relatedMetric,
    metadata: metadata,
  });
};

const Alert = mongoose.model("Alert", alertSchema);

export default Alert;
