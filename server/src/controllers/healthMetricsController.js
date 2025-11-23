/**
 * ============================================
 * HEALTH METRICS CONTROLLER (PHONE-ONLY ENFORCED)
 * ============================================
 *
 * Purpose: Handle all health metrics CRUD operations and analytics
 *
 * Features:
 * - Add/Update daily health metrics
 * - Retrieve metrics by date range
 * - Get specific day metrics
 * - Delete metrics entries
 * - Calculate aggregated summaries and statistics
 * - ENFORCE PHONE-ONLY METRIC CONSTRAINTS
 *
 * Security:
 * - All operations scoped to authenticated user (req.user)
 * - Input validation for dates and metric values
 * - Prevent unauthorized access to other users' data
 * - Reject wearable-only metrics (heartRate, oxygenSaturation)
 *
 * Business Rules:
 * - One metrics entry per user per day (enforced by unique index)
 * - Dates normalized to midnight UTC for consistency
 * - Missing metrics default to 0 or null based on schema
 * - PHONE-ONLY: No wearable metrics allowed (heartRate, bloodOxygen)
 */

import HealthMetric from "../models/HealthMetric.js";
import { asyncHandler, ErrorResponse } from "../middleware/errorHandler.js";
import { emitToUser, getConnectionCount } from "../services/sseService.js";
import * as payloadOptimizer from "../utils/eventPayloadOptimizer.js";

/**
 * ============================================
 * PHONE-ONLY METRIC VALIDATION
 * ============================================
 *
 * Whitelist of metrics that can be collected from Android phones.
 * Any metric not in this list will be rejected.
 *
 * Wearable-only metrics (heartRate, oxygenSaturation) are explicitly
 * excluded and will trigger security warnings if present.
 */

// Whitelist of supported phone-only metrics
const PHONE_SUPPORTED_METRICS = [
  "steps",
  "distance",
  "calories",
  "activeMinutes",
  "heartPoints",
  "moveMinutes",
  "weight",
  "sleepHours",
  "height",
  "bloodPressure",
  "bodyTemperature",
  "hydration",
];

// Wearable-only metrics (NOT ALLOWED)
const WEARABLE_ONLY_METRICS = ["heartRate", "oxygenSaturation", "bloodOxygen"];

/**
 * ============================================
 * VALIDATION HELPER: VALIDATE AND SANITIZE METRICS
 * ============================================
 *
 * Validates incoming metrics object and:
 * 1. Checks for wearable-only fields (heartRate, oxygenSaturation)
 * 2. Logs security warnings if bypass attempt detected
 * 3. Removes unsupported fields from metrics object
 * 4. Returns sanitized metrics or throws validation error
 *
 * @param {Object} metrics - Raw metrics from request body
 * @param {string} source - Data source (manual, googlefit, import)
 * @returns {Object} { valid: boolean, sanitized: Object, errors: Array }
 */
const validateAndSanitizeMetrics = (metrics, source = "manual") => {
  if (!metrics || typeof metrics !== "object") {
    return {
      valid: false,
      errors: ["Metrics must be a valid object"],
      sanitized: null,
    };
  }

  const incomingFields = Object.keys(metrics);
  const rejectedFields = [];
  const wearableFields = [];
  const unsupportedFields = [];

  // Check each incoming field
  incomingFields.forEach((field) => {
    // Check if it's a wearable-only metric (security violation)
    if (WEARABLE_ONLY_METRICS.includes(field)) {
      wearableFields.push(field);
      rejectedFields.push(field);
    }
    // Check if it's unsupported but not wearable (unknown field)
    else if (!PHONE_SUPPORTED_METRICS.includes(field)) {
      unsupportedFields.push(field);
      rejectedFields.push(field);
    }
  });

  // If wearable-only metrics detected, log security warning
  if (wearableFields.length > 0) {
    console.warn("⚠️  SECURITY WARNING: Client-side validation bypass attempt detected");
    console.warn(`   User attempted to send wearable-only metrics: ${wearableFields.join(", ")}`);
    console.warn(`   Source: ${source}`);
    console.warn(`   All fields: ${incomingFields.join(", ")}`);
    console.warn(`   This indicates either:`);
    console.warn(`     1. Client-side validation is missing or broken`);
    console.warn(`     2. User is attempting to bypass validation`);
    console.warn(`     3. API is being called directly without proper client`);
  }

  // Return validation error if any rejected fields
  if (rejectedFields.length > 0) {
    const errorMessages = [];

    if (wearableFields.length > 0) {
      errorMessages.push(
        `Wearable-only metrics not supported: ${wearableFields.join(", ")}. ` +
        `These metrics require smartwatch or fitness band and cannot be collected from phones.`
      );
    }

    if (unsupportedFields.length > 0) {
      errorMessages.push(
        `Unsupported metric fields: ${unsupportedFields.join(", ")}. ` +
        `Supported phone metrics: ${PHONE_SUPPORTED_METRICS.join(", ")}.`
      );
    }

    return {
      valid: false,
      errors: errorMessages,
      sanitized: null,
      rejectedFields,
    };
  }

  // Sanitize metrics - only include whitelisted fields
  const sanitized = {};
  PHONE_SUPPORTED_METRICS.forEach((field) => {
    if (metrics[field] !== undefined) {
      sanitized[field] = metrics[field];
    }
  });

  return {
    valid: true,
    errors: [],
    sanitized,
    rejectedFields: [],
  };
};

/**
 * ============================================
 * ADD OR UPDATE HEALTH METRICS (ENHANCED WITH VALIDATION)
 * ============================================
 *
 * @route POST /api/metrics
 * @access Private
 */
export const addOrUpdateMetrics = asyncHandler(async (req, res, next) => {
  const { date, metrics, source, activities } = req.body;

  // Validate date presence
  if (!date) {
    return next(new ErrorResponse("Date is required", 400));
  }

  // Validate metrics presence
  if (!metrics || Object.keys(metrics).length === 0) {
    return next(
      new ErrorResponse("At least one metric value is required", 400)
    );
  }

  // ⭐ PHONE-ONLY VALIDATION - Reject wearable metrics
  const validation = validateAndSanitizeMetrics(metrics, source);

  if (!validation.valid) {
    // Return 400 with clear error message
    return next(
      new ErrorResponse(
        `Phone-only constraint violation: ${validation.errors.join(" ")}`,
        400
      )
    );
  }

  // Use sanitized metrics (wearable fields stripped)
  const sanitizedMetrics = validation.sanitized;

  // Date validation - parse as UTC to match MongoDB storage
  const normalizedDate = new Date(date + 'T00:00:00.000Z');

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  if (normalizedDate > today) {
    return next(
      new ErrorResponse("Cannot add metrics for future dates", 400)
    );
  }

  // Prepare metrics object with defaults
  const metricsToSave = {
    steps: sanitizedMetrics.steps || 0,
    distance: sanitizedMetrics.distance || 0,
    calories: sanitizedMetrics.calories || 0,
    activeMinutes: sanitizedMetrics.activeMinutes || 0,
    heartPoints: sanitizedMetrics.heartPoints || 0,
    moveMinutes: sanitizedMetrics.moveMinutes || 0,
    weight: sanitizedMetrics.weight || null,
    sleepHours: sanitizedMetrics.sleepHours || null,
    height: sanitizedMetrics.height || null,
    bloodPressure: sanitizedMetrics.bloodPressure || { systolic: null, diastolic: null },
    bodyTemperature: sanitizedMetrics.bodyTemperature || null,
    hydration: sanitizedMetrics.hydration || null,
  };

  // Create or update health metric
  const healthMetric = await HealthMetric.findOneAndUpdate(
    {
      userId: req.user._id,
      date: normalizedDate,
    },
    {
      userId: req.user._id,
      date: normalizedDate,
      metrics: metricsToSave,
      source: source || "manual",
      activities: activities || [],
      syncedAt: source === "googlefit" ? new Date() : null,
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    }
  );

  // ===== OPTIMIZED: EMIT EVENT WITH MINIMAL PAYLOAD =====
  const connectionCount = getConnectionCount(req.user._id);

  if (connectionCount > 0) {
    // Create optimized payload
    const payload = payloadOptimizer.optimizeMetricPayload(healthMetric, 'upsert');

    // Check if event should be emitted (date relevance check)
    if (payloadOptimizer.shouldEmitEvent(payload)) {
      // Validate payload size
      payloadOptimizer.validatePayloadSize(payload, 'metrics:change');

      // Log stats in development
      if (process.env.NODE_ENV === 'development') {
        payloadOptimizer.logPayloadStats(payload, 'metrics:change');
      }

      // Emit optimized event
      emitToUser(req.user._id, 'metrics:change', payload);

      console.log(
        `[healthMetricsController] Emitted metrics:change to ${connectionCount} connection(s) for ${date} (${payloadOptimizer.calculatePayloadSize(payload)} bytes)`
      );
    } else {
      console.log(
        `[healthMetricsController] Skipped event emission for ${date} (outside relevant date range)`
      );
    }
  }

  res.status(200).json({
    success: true,
    message: "Health metrics saved successfully",
    data: healthMetric,
  });
});

/**
 * ============================================
 * GET METRICS BY DATE RANGE
 * ============================================
 *
 * @route GET /api/metrics?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * @access Private
 */
export const getMetricsByDateRange = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return next(
      new ErrorResponse("Start date and end date are required", 400)
    );
  }

  // Parse dates as UTC to match MongoDB storage
  const start = new Date(startDate + 'T00:00:00.000Z');
  const end = new Date(endDate + 'T23:59:59.999Z');

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return next(new ErrorResponse("Invalid date format", 400));
  }

  if (start > end) {
    return next(
      new ErrorResponse("Start date must be before end date", 400)
    );
  }

  const daysDifference = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  if (daysDifference > 365) {
    return next(
      new ErrorResponse("Date range cannot exceed 365 days", 400)
    );
  }

  const healthMetrics = await HealthMetric.find({
    userId: req.user._id,
    date: {
      $gte: start,
      $lte: end,
    },
  }).sort({ date: 1 });

  res.status(200).json({
    success: true,
    count: healthMetrics.length,
    data: healthMetrics,
  });
});

/**
 * ============================================
 * GET METRICS BY SPECIFIC DATE
 * ============================================
 *
 * @route GET /api/metrics/:date
 * @access Private
 */
export const getMetricsByDate = asyncHandler(async (req, res, next) => {
  const { date } = req.params;

  if (!date) {
    return next(new ErrorResponse("Date parameter is required", 400));
  }

  // Parse date as UTC to avoid timezone issues
  const queryDate = new Date(date + 'T00:00:00.000Z');

  if (isNaN(queryDate.getTime())) {
    return next(new ErrorResponse("Invalid date format", 400));
  }

  const healthMetric = await HealthMetric.findOne({
    userId: req.user._id,
    date: queryDate,
  });

  if (!healthMetric) {
    // Return 200 with null data instead of 404 to avoid console errors
    return res.status(200).json({
      success: true,
      data: null,
      message: `No health metrics found for date: ${date}`
    });
  }

  res.status(200).json({
    success: true,
    data: healthMetric,
  });
});

/**
 * ============================================
 * UPDATE SPECIFIC METRIC (ENHANCED WITH VALIDATION)
 * ============================================
 *
 * Alternative update path - applies same phone-only constraints
 *
 * @route PATCH /api/metrics/:date
 * @access Private
 */
export const updateMetric = asyncHandler(async (req, res, next) => {
  const { date } = req.params;
  const { metrics } = req.body;

  if (!date) {
    return next(new ErrorResponse("Date parameter is required", 400));
  }

  if (!metrics || Object.keys(metrics).length === 0) {
    return next(
      new ErrorResponse("At least one metric value is required", 400)
    );
  }

  // ⭐ PHONE-ONLY VALIDATION - Reject wearable metrics on updates too
  const validation = validateAndSanitizeMetrics(metrics, "manual");

  if (!validation.valid) {
    return next(
      new ErrorResponse(
        `Phone-only constraint violation: ${validation.errors.join(" ")}`,
        400
      )
    );
  }

  // Parse date as UTC to match MongoDB storage
  const queryDate = new Date(date + 'T00:00:00.000Z');
  if (isNaN(queryDate.getTime())) {
    return next(new ErrorResponse("Invalid date format", 400));
  }

  // Find existing metric
  const existingMetric = await HealthMetric.findOne({
    userId: req.user._id,
    date: queryDate,
  });

  if (!existingMetric) {
    return next(
      new ErrorResponse(`No health metrics found for date: ${date}`, 404)
    );
  }

  // Merge sanitized metrics with existing
  const updatedMetrics = {
    ...existingMetric.metrics.toObject(),
    ...validation.sanitized,
  };

  existingMetric.metrics = updatedMetrics;
  await existingMetric.save();

  // ===== OPTIMIZED: EMIT EVENT WITH ONLY CHANGED FIELDS =====
  const connectionCount = getConnectionCount(req.user._id);

  if (connectionCount > 0) {
    // Create payload with only changed fields
    const payload = payloadOptimizer.optimizeMetricPayload(
      existingMetric,
      'update',
      metrics // Only changed fields
    );

    if (payloadOptimizer.shouldEmitEvent(payload)) {
      payloadOptimizer.validatePayloadSize(payload, 'metrics:change');
      emitToUser(req.user._id, 'metrics:change', payload);

      console.log(
        `[healthMetricsController] Emitted update with ${Object.keys(metrics).length} changed field(s) (${payloadOptimizer.calculatePayloadSize(payload)} bytes)`
      );
    }
  }

  res.status(200).json({
    success: true,
    message: "Health metrics updated successfully",
    data: existingMetric,
  });
});

/**
 * ============================================
 * DELETE METRICS
 * ============================================
 *
 * @route DELETE /api/metrics/:date
 * @access Private
 */
export const deleteMetrics = asyncHandler(async (req, res, next) => {
  const { date } = req.params;

  if (!date) {
    return next(new ErrorResponse("Date parameter is required", 400));
  }

  // Parse date as UTC to match MongoDB storage
  const queryDate = new Date(date + 'T00:00:00.000Z');
  if (isNaN(queryDate.getTime())) {
    return next(new ErrorResponse("Invalid date format", 400));
  }

  const healthMetric = await HealthMetric.findOneAndDelete({
    userId: req.user._id,
    date: queryDate,
  });

  if (!healthMetric) {
    return next(
      new ErrorResponse(`No health metrics found for date: ${date}`, 404)
    );
  }

  // ===== OPTIMIZED: MINIMAL DELETE EVENT =====
  const connectionCount = getConnectionCount(req.user._id);

  if (connectionCount > 0) {
    const payload = {
      operation: 'delete',
      date: queryDate,
      deletedAt: new Date().toISOString(),
    };

    if (payloadOptimizer.shouldEmitEvent(payload)) {
      emitToUser(req.user._id, 'metrics:change', payload);
    }
  }

  res.status(200).json({
    success: true,
    message: "Health metrics deleted successfully",
    data: healthMetric,
  });
});

/**
 * ============================================
 * GET METRICS SUMMARY
 * ============================================
 *
 * @route GET /api/metrics/summary/:period
 * @access Private
 */
export const getMetricsSummary = asyncHandler(async (req, res, next) => {
  const { period } = req.params;
  const validPeriods = ["week", "month", "year"];

  if (!validPeriods.includes(period)) {
    return next(
      new ErrorResponse(
        `Invalid period. Must be one of: ${validPeriods.join(", ")}`,
        400
      )
    );
  }

  const endDate = new Date();
  endDate.setUTCHours(23, 59, 59, 999);

  const startDate = new Date();
  startDate.setUTCHours(0, 0, 0, 0);

  switch (period) {
    case "week":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "month":
      startDate.setDate(startDate.getDate() - 30);
      break;
    case "year":
      startDate.setDate(startDate.getDate() - 365);
      break;
  }

  const metrics = await HealthMetric.find({
    userId: req.user._id,
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  }).sort({ date: 1 });

  // If no metrics found, return zeroed summary instead of 404
  // This prevents console errors and provides a better UX (empty state)
  /* 
  if (metrics.length === 0) {
    return next(
      new ErrorResponse(`No health metrics found for the last ${period}`, 404)
    );
  }
  */

  const summary = {
    totalSteps: metrics.reduce((sum, m) => sum + (m.metrics.steps || 0), 0),
    totalDistance: parseFloat(
      metrics.reduce((sum, m) => sum + (m.metrics.distance || 0), 0).toFixed(2)
    ),
    totalCalories: metrics.reduce((sum, m) => sum + (m.metrics.calories || 0), 0),
    totalActiveMinutes: metrics.reduce(
      (sum, m) => sum + (m.metrics.activeMinutes || 0),
      0
    ),
    avgSteps: Math.round(
      metrics.reduce((sum, m) => sum + (m.metrics.steps || 0), 0) / metrics.length
    ),
    avgDistance: parseFloat(
      (
        metrics.reduce((sum, m) => sum + (m.metrics.distance || 0), 0) /
        metrics.length
      ).toFixed(2)
    ),
    avgCalories: Math.round(
      metrics.reduce((sum, m) => sum + (m.metrics.calories || 0), 0) /
      metrics.length
    ),
    avgActiveMinutes: parseFloat(
      (
        metrics.reduce((sum, m) => sum + (m.metrics.activeMinutes || 0), 0) /
        metrics.length
      ).toFixed(1)
    ),
    avgWeight: (() => {
      const weights = metrics
        .map((m) => m.metrics.weight)
        .filter((w) => w !== null);
      return weights.length > 0
        ? parseFloat((weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1))
        : null;
    })(),
    avgSleepHours: (() => {
      const sleeps = metrics
        .map((m) => m.metrics.sleepHours)
        .filter((s) => s !== null);
      return sleeps.length > 0
        ? parseFloat((sleeps.reduce((a, b) => a + b, 0) / sleeps.length).toFixed(1))
        : null;
    })(),
    daysLogged: metrics.length,
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  };

  res.status(200).json({
    success: true,
    period,
    data: summary,
  });
});

/**
 * ============================================
 * GET LATEST METRICS
 * ============================================
 *
 * @route GET /api/metrics/latest
 * @access Private
 */
export const getLatestMetrics = asyncHandler(async (req, res, next) => {
  const healthMetric = await HealthMetric.findOne({
    userId: req.user._id,
  })
    .sort({ date: -1 })
    .limit(1);

  if (!healthMetric) {
    // Return 200 with null data instead of 404 to avoid console errors
    return res.status(200).json({
      success: true,
      data: null,
      message: "No health metrics found. Start tracking today!"
    });
  }

  res.status(200).json({
    success: true,
    data: healthMetric,
  });
});

/**
 * ============================================
 * DELETE METRICS BY DATE
 * ============================================
 * Deletes all health metrics for the authenticated user on a specific date
 * 
 * @route DELETE /api/metrics?date=YYYY-MM-DD
 * @access Private (requires authentication)
 * @param {string} req.query.date - Date in YYYY-MM-DD format
 * @returns {object} JSON response with deletion count
 */
export const deleteMetricsByDate = asyncHandler(async (req, res, next) => {
  const { date } = req.query;
  const userId = req.user._id; // From protect middleware

  // Delete all metrics for the user on the specified date
  const result = await HealthMetric.deleteMany({
    userId,
    date: {
      $gte: new Date(date + 'T00:00:00.000Z'), // Start of day (UTC)
      $lt: new Date(date + 'T23:59:59.999Z')   // End of day (UTC)
    }
  });

  // ===== EMIT DELETE EVENT =====
  if (result.deletedCount > 0) {
    const connectionCount = getConnectionCount(userId);

    if (connectionCount > 0) {
      console.log(
        `[healthMetricsController] Emitting metrics:change (bulk delete) for ${date}`
      );

      emitToUser(userId, 'metrics:change', {
        operation: 'bulk_delete',
        date: date,
        deletedCount: result.deletedCount,
        deletedAt: new Date().toISOString()
      });

      console.log(
        `[healthMetricsController] ✓ Emitted bulk delete event to ${connectionCount} connection(s)`
      );
    }
  }

  // Respond with success and count
  res.status(200).json({
    success: true,
    message: `Successfully deleted ${result.deletedCount} health metric(s) for date ${date}`,
    deletedCount: result.deletedCount,
    date,
    timestamp: new Date().toISOString()
  });
});

export default {
  addOrUpdateMetrics,
  getMetricsByDateRange,
  getMetricsByDate,
  updateMetric,
  deleteMetrics,
  deleteMetricsByDate,
  getMetricsSummary,
  getLatestMetrics,
};