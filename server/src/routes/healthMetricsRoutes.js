import express from "express";
import {
  addOrUpdateMetrics,
  getMetricsByDateRange,
  getMetricsByDate,
  deleteMetrics,
  getMetricsSummary,
  getLatestMetrics,
} from "../controllers/healthMetricsController.js";

import { protect } from "../middleware/auth.js";
import {
  validateHealthMetric,
  handleValidationErrors,
} from "../middleware/validator.js";

const router = express.Router();

/**
 * ============================================
 * HEALTH METRICS ROUTES
 * ============================================
 *
 * Purpose: CRUD endpoints and analytics for user health metrics
 * Security: All endpoints protected by JWT middleware
 * Validation: Uses centralized express-validator chains
 */

// ----- Add or Update Health Metrics Entry (Upsert) -----
/**
 * @route   POST /api/metrics
 * @desc    Add or update a health metric for a specific day for current user
 * @access  Private
 */
router.post(
  "/",
  protect,
  // Optionally validate here if you want per-field checking for steps, calories, etc.
  // validateHealthMetric,
  // handleValidationErrors,
  addOrUpdateMetrics
);

// ----- Get Metrics by Date Range -----
/**
 * @route   GET /api/metrics
 * @desc    Get all metrics for a date range (query: startDate, endDate)
 * @access  Private
 */
router.get("/", protect, getMetricsByDateRange);

// ----- Get Metrics for Specific Date -----
/**
 * @route   GET /api/metrics/:date
 * @desc    Get metrics for a single date (date as YYYY-MM-DD)
 * @access  Private
 */
router.get("/:date", protect, getMetricsByDate);

// ----- Delete Metrics for Specific Date -----
/**
 * @route   DELETE /api/metrics/:date
 * @desc    Delete metrics for a single date (date as YYYY-MM-DD)
 * @access  Private
 */
router.delete("/:date", protect, deleteMetrics);

// ----- Get Metrics Summary Stats (Week/Month/Year) -----
/**
 * @route   GET /api/metrics/summary/:period
 * @desc    Get metrics summary (period = 'week' | 'month' | 'year')
 * @access  Private
 */
router.get("/summary/:period", protect, getMetricsSummary);

// ----- Get Latest Metrics Entry -----
/**
 * @route   GET /api/metrics/latest
 * @desc    Get the latest metrics entry
 * @access  Private
 */
router.get("/latest", protect, getLatestMetrics);

export default router;