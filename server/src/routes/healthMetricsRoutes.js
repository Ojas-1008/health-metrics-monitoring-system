import express from "express";
import {
  addOrUpdateMetrics,
  getMetricsByDateRange,
  getMetricsByDate,
  updateMetric,
  deleteMetrics,
  deleteMetricsByDate,
  getMetricsSummary,
  getLatestMetrics,
} from "../controllers/healthMetricsController.js";

import { protect } from "../middleware/auth.js";
import {
  validateHealthMetric,
  validateDeleteMetrics,
  handleValidationErrors,
} from "../middleware/validator.js";

const router = express.Router();

/**
 * ============================================
 * HEALTH METRICS ROUTES (PHONE-ONLY ENFORCED)
 * ============================================
 *
 * Purpose: CRUD endpoints and analytics for user health metrics
 * Security: All endpoints protected by JWT middleware + phone-only validation
 * Validation: Enhanced validation with wearable metric rejection
 */

// ----- Add or Update Health Metrics Entry (Upsert) -----
/**
 * @route   POST /api/metrics
 * @desc    Add or update a health metric for a specific day for current user
 * @access  Private
 * @body    { date: "YYYY-MM-DD", metrics: {...}, source: "manual|googlefit|import" }
 */
router.post(
  "/",
  protect,
  addOrUpdateMetrics
);

// ----- Get Metrics by Date Range -----
/**
 * @route   GET /api/metrics
 * @desc    Get all metrics for a date range (query: startDate, endDate)
 * @access  Private
 * @query   startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get("/", protect, getMetricsByDateRange);

// ----- Get Latest Metrics Entry -----
/**
 * @route   GET /api/metrics/latest
 * @desc    Get the latest metrics entry
 * @access  Private
 */
router.get("/latest", protect, getLatestMetrics);

// ----- Get Metrics for Specific Date -----
/**
 * @route   GET /api/metrics/:date
 * @desc    Get metrics for a single date (date as YYYY-MM-DD)
 * @access  Private
 */
router.get("/:date", protect, getMetricsByDate);

// ----- Delete Metrics by Date (Query Parameter) -----
/**
 * @route   DELETE /api/metrics?date=YYYY-MM-DD
 * @desc    Delete all metrics for a specific date
 * @access  Private
 * @query   date=YYYY-MM-DD
 */
router.delete("/", protect, validateDeleteMetrics, deleteMetricsByDate);

// ----- Update Metrics for Specific Date -----
/**
 * @route   PATCH /api/metrics/:date
 * @desc    Update metrics for a specific date (partial update)
 * @access  Private
 * @body    { metrics: {...} }
 */
router.patch("/:date", protect, updateMetric);

// ----- Delete Metrics for Specific Date -----
/**
 * @route   DELETE /api/metrics/:date
 * @desc    Delete metrics for a specific date
 * @access  Private
 */
router.delete("/:date", protect, deleteMetrics);

// ----- Get Metrics Summary -----
/**
 * @route   GET /api/metrics/summary/:period
 * @desc    Get aggregated summary for period (week|month|year)
 * @access  Private
 */
router.get("/summary/:period", protect, getMetricsSummary);

export default router;