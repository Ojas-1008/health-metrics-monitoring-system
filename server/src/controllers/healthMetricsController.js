/**
 * ============================================
 * HEALTH METRICS CONTROLLER
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
 * 
 * Security:
 * - All operations scoped to authenticated user (req.user)
 * - Input validation for dates and metric values
 * - Prevent unauthorized access to other users' data
 * 
 * Business Rules:
 * - One metrics entry per user per day (enforced by unique index)
 * - Dates normalized to midnight UTC for consistency
 * - Missing metrics default to 0 or null based on schema
 */

import HealthMetric from "../models/HealthMetric.js";
import { asyncHandler, ErrorResponse } from "../middleware/errorHandler.js";

export const addOrUpdateMetrics = asyncHandler(async (req, res, next) => {
  const { date, metrics, source, activities } = req.body;

  if (!date) {
    return next(new ErrorResponse("Date is required", 400));
  }
  if (!metrics || Object.keys(metrics).length === 0) {
    return next(
      new ErrorResponse("At least one metric value is required", 400)
    );
  }

  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (normalizedDate > today) {
    return next(
      new ErrorResponse("Cannot add metrics for future dates", 400)
    );
  }

  const healthMetric = await HealthMetric.findOneAndUpdate(
    {
      userId: req.user._id,
      date: normalizedDate,
    },
    {
      userId: req.user._id,
      date: normalizedDate,
      metrics: {
        steps: metrics.steps || 0,
        distance: metrics.distance || 0,
        calories: metrics.calories || 0,
        activeMinutes: metrics.activeMinutes || 0,
        weight: metrics.weight || null,
        sleepHours: metrics.sleepHours || null,
      },
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

  res.status(200).json({
    success: true,
    message: "Health metrics saved successfully",
    data: healthMetric,
  });
});

export const getMetricsByDateRange = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return next(
      new ErrorResponse("Start date and end date are required", 400)
    );
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return next(new ErrorResponse("Invalid date format", 400));
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

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

export const getMetricsByDate = asyncHandler(async (req, res, next) => {
  const { date } = req.params;

  if (!date) {
    return next(new ErrorResponse("Date parameter is required", 400));
  }

  const queryDate = new Date(date);

  if (isNaN(queryDate.getTime())) {
    return next(new ErrorResponse("Invalid date format", 400));
  }
  queryDate.setHours(0, 0, 0, 0);

  const healthMetric = await HealthMetric.findOne({
    userId: req.user._id,
    date: queryDate,
  });

  if (!healthMetric) {
    return next(
      new ErrorResponse(`No health metrics found for date: ${date}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: healthMetric,
  });
});

export const deleteMetrics = asyncHandler(async (req, res, next) => {
  const { date } = req.params;

  if (!date) {
    return next(new ErrorResponse("Date parameter is required", 400));
  }

  const queryDate = new Date(date);

  if (isNaN(queryDate.getTime())) {
    return next(new ErrorResponse("Invalid date format", 400));
  }
  queryDate.setHours(0, 0, 0, 0);

  const healthMetric = await HealthMetric.findOneAndDelete({
    userId: req.user._id,
    date: queryDate,
  });

  if (!healthMetric) {
    return next(
      new ErrorResponse(`No health metrics found for date: ${date}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    message: "Health metrics deleted successfully",
    data: healthMetric,
  });
});

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
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
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

  if (metrics.length === 0) {
    return next(
      new ErrorResponse(`No health metrics found for the last ${period}`, 404)
    );
  }

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

export const getLatestMetrics = asyncHandler(async (req, res, next) => {
  const healthMetric = await HealthMetric.findOne({
    userId: req.user._id,
  })
    .sort({ date: -1 })
    .limit(1);

  if (!healthMetric) {
    return next(
      new ErrorResponse("No health metrics found. Start tracking today!", 404)
    );
  }

  res.status(200).json({
    success: true,
    data: healthMetric,
  });
});

export default {
  addOrUpdateMetrics,
  getMetricsByDateRange,
  getMetricsByDate,
  deleteMetrics,
  getMetricsSummary,
  getLatestMetrics,
};