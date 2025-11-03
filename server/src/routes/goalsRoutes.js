import express from "express";
import {
  setGoals,
  getGoals,
  updateGoals,
  resetGoals,
  getGoalProgress,
} from "../controllers/goalsController.js";

import { protect } from "../middleware/auth.js";

const router = express.Router();

/**
 * ============================================
 * GOALS ROUTES
 * ============================================
 *
 * Purpose: Manage user fitness goals (stored in User.goals field)
 * Security: All endpoints protected by JWT middleware
 * Base Path: /api/goals
 */

// ===== PROTECTED ROUTES (All require authentication) =====

/**
 * @route   POST /api/goals
 * @desc    Set or update user fitness goals
 * @access  Private
 * 
 * Request Body:
 * {
 *   "weightGoal": 70,        // Optional: Target weight in kg (30-300)
 *   "stepGoal": 12000,       // Optional: Daily steps (1000-50000)
 *   "sleepGoal": 8,          // Optional: Sleep hours (4-12)
 *   "calorieGoal": 2200,     // Optional: Daily calories (500-5000)
 *   "distanceGoal": 6        // Optional: Distance in km (0.5-100)
 * }
 */
router.post("/", protect, setGoals);

/**
 * @route   GET /api/goals
 * @desc    Get current user's fitness goals
 * @access  Private
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "weightGoal": 70,
 *     "stepGoal": 10000,
 *     "sleepGoal": 8,
 *     "calorieGoal": 2000,
 *     "distanceGoal": 5
 *   }
 * }
 */
router.get("/", protect, getGoals);

/**
 * @route   PUT /api/goals
 * @desc    Update specific user goals (partial update)
 * @access  Private
 * 
 * Request Body (all fields optional):
 * {
 *   "stepGoal": 15000,
 *   "sleepGoal": 9
 * }
 */
router.put("/", protect, updateGoals);

/**
 * @route   DELETE /api/goals
 * @desc    Reset all goals to default values
 * @access  Private
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Goals reset to defaults",
 *   "data": { ...default goals }
 * }
 */
router.delete("/", protect, resetGoals);

/**
 * @route   GET /api/goals/progress
 * @desc    Get goal progress for current day (compares goals vs today's metrics)
 * @access  Private
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "goals": { ... },
 *     "currentMetrics": { ... },
 *     "progress": {
 *       "steps": { "goal": 10000, "current": 7500, "percentage": 75, "achieved": false },
 *       "sleep": { "goal": 8, "current": 7.5, "percentage": 93.75, "achieved": false }
 *     },
 *     "hasMetricsToday": true
 *   }
 * }
 */
router.get("/progress", protect, getGoalProgress);

export default router;
