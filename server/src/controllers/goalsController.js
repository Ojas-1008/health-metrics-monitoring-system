/**
 * ============================================
 * GOALS CONTROLLER
 * ============================================
 * 
 * Purpose: Manage user fitness goals (stored in User.goals field)
 * 
 * Features:
 * - Set/update user fitness goals (weight, steps, sleep, calories, distance)
 * - Retrieve current user goals
 * - Partial updates supported (only modify specified fields)
 * 
 * Security:
 * - All operations scoped to authenticated user (req.user)
 * - Input validation for goal value ranges
 * - Prevents unauthorized access to other users' goals
 * 
 * Business Rules:
 * - Goals are stored as nested object in User document
 * - Default values applied from User schema when not specified
 * - Validation enforced by Mongoose schema (min/max constraints)
 */

import User from "../models/User.js";
import { asyncHandler, ErrorResponse } from "../middleware/errorHandler.js";
import { emitToUser } from "../utils/eventEmitter.js";

// Shared list of goal field names for iteration (avoids repetition)
const GOAL_FIELDS = ["weightGoal", "stepGoal", "sleepGoal", "calorieGoal", "distanceGoal"];

/**
 * Apply incoming goal updates to a user document (only defined fields).
 * Returns true if at least one field was updated, otherwise false.
 */
function applyGoalUpdates(user, body) {
  let updated = false;
  for (const field of GOAL_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, field) && body[field] !== undefined) {
      user.goals[field] = body[field];
      updated = true;
    }
  }
  return updated;
}

/**
 * Validate that at least one goal field is present in request body.
 */
function hasAtLeastOneGoal(body) {
  return GOAL_FIELDS.some(f => Object.prototype.hasOwnProperty.call(body, f));
}

/**
 * ============================================
 * @desc    Set or Update User Fitness Goals
 * @route   POST /api/goals
 * @access  Private (requires authentication)
 * ============================================
 */
export const setGoals = asyncHandler(async (req, res, next) => {
  const body = req.body || {};

  if (!hasAtLeastOneGoal(body)) {
    return next(new ErrorResponse("At least one goal field must be provided", 400));
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  applyGoalUpdates(user, body);
  await user.save();

  emitToUser(req.user._id, 'goals:updated', { goals: user.goals, updatedAt: new Date() });

  res.status(200).json({ success: true, message: "Goals updated successfully", data: user.goals });
});

/**
 * ============================================
 * @desc    Get Current User Goals
 * @route   GET /api/goals
 * @access  Private (requires authentication)
 * ============================================
 */
export const getGoals = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("goals");

  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  res.status(200).json({
    success: true,
    data: user.goals,
  });
});

/**
 * ============================================
 * @desc    Update Specific User Goals (Partial Update)
 * @route   PUT /api/goals
 * @access  Private (requires authentication)
 * ============================================
 */
export const updateGoals = asyncHandler(async (req, res, next) => {
  const body = req.body || {};

  if (!hasAtLeastOneGoal(body)) {
    return next(new ErrorResponse("At least one goal field must be provided", 400));
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  applyGoalUpdates(user, body);
  await user.save();

  emitToUser(req.user._id, 'goals:updated', { goals: user.goals, updatedAt: new Date() });

  res.status(200).json({ success: true, message: "Goals updated successfully", data: user.goals });
});

/**
 * ============================================
 * @desc    Reset User Goals to Defaults
 * @route   DELETE /api/goals
 * @access  Private (requires authentication)
 * ============================================
 */
export const resetGoals = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  user.goals = {
    weightGoal: null,
    stepGoal: 10000,
    sleepGoal: 8,
    calorieGoal: 2000,
    distanceGoal: 5,
  };

  await user.save();

  res.status(200).json({
    success: true,
    message: "Goals reset to defaults",
    data: user.goals,
  });
});

/**
 * ============================================
 * @desc    Get Goal Progress for Current Day
 * @route   GET /api/goals/progress
 * @access  Private (requires authentication)
 * ============================================
 */
export const getGoalProgress = asyncHandler(async (req, res, next) => {
  const HealthMetric = (await import("../models/HealthMetric.js")).default;

  const user = await User.findById(req.user._id).select("goals");

  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const todayMetrics = await HealthMetric.findOne({
    userId: req.user._id,
    date: today,
  });

  const progress = {};

  if (todayMetrics) {
    if (user.goals.stepGoal && typeof todayMetrics.metrics.steps === 'number') {
      const stepPercentage = Math.min(
        Math.round((todayMetrics.metrics.steps / user.goals.stepGoal) * 100),
        100
      );
      progress.steps = {
        goal: user.goals.stepGoal,
        current: todayMetrics.metrics.steps,
        percentage: stepPercentage,
        achieved: todayMetrics.metrics.steps >= user.goals.stepGoal,
      };
    }

    if (user.goals.sleepGoal && typeof todayMetrics.metrics.sleepHours === 'number') {
      const sleepPercentage = Math.min(
        Math.round((todayMetrics.metrics.sleepHours / user.goals.sleepGoal) * 100),
        100
      );
      progress.sleep = {
        goal: user.goals.sleepGoal,
        current: todayMetrics.metrics.sleepHours,
        percentage: sleepPercentage,
        achieved: todayMetrics.metrics.sleepHours >= user.goals.sleepGoal,
      };
    }
    if (user.goals.calorieGoal && typeof todayMetrics.metrics.calories === 'number') {
      const caloriePercentage = Math.min(
        Math.round((todayMetrics.metrics.calories / user.goals.calorieGoal) * 100),
        100
      );
      progress.calories = {
        goal: user.goals.calorieGoal,
        current: todayMetrics.metrics.calories,
        percentage: caloriePercentage,
        achieved: todayMetrics.metrics.calories >= user.goals.calorieGoal,
      };
    }

    if (user.goals.distanceGoal && typeof todayMetrics.metrics.distance === 'number') {
      const distancePercentage = Math.min(
        Math.round((todayMetrics.metrics.distance / user.goals.distanceGoal) * 100),
        100
      );
      progress.distance = {
        goal: user.goals.distanceGoal,
        current: todayMetrics.metrics.distance,
        percentage: distancePercentage,
        achieved: todayMetrics.metrics.distance >= user.goals.distanceGoal,
      };
    }

    if (user.goals.weightGoal && typeof todayMetrics.metrics.weight === 'number') {
      const weightDifference = Math.abs(
        todayMetrics.metrics.weight - user.goals.weightGoal
      );
      progress.weight = {
        goal: user.goals.weightGoal,
        current: todayMetrics.metrics.weight,
        difference: weightDifference.toFixed(1),
        achieved: weightDifference <= 0.5,
      };
    }
  }

  res.status(200).json({
    success: true,
    data: {
      goals: user.goals,
      currentMetrics: todayMetrics?.metrics || null,
      progress,
      hasMetricsToday: !!todayMetrics,
    },
  });
});

export default {
  setGoals,
  getGoals,
  updateGoals,
  resetGoals,
  getGoalProgress,
};
