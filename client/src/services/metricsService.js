/**
 * ============================================
 * HEALTH METRICS SERVICE LAYER
 * ============================================
 *
 * Purpose: Centralized API service for all health metrics operations
 *
 * Functions:
 * - addMetric(date, metrics) - POST to /metrics (upsert)
 * - getMetrics(startDate, endDate) - GET /metrics with query params
 * - getMetricByDate(date) - GET /metrics/:date
 * - updateMetric(date, data) - PUT /metrics (upsert via addMetric)
 * - deleteMetric(date) - DELETE /metrics/:date
 * - getMetricsSummary(period) - GET /metrics/summary/:period
 * - getLatestMetrics() - GET /metrics/latest
 *
 * Integrates with:
 * - Backend API (healthMetricsController.js, healthMetricsRoutes.js)
 * - Axios instance (with JWT token attachment)
 * - Error handling patterns from errorHandler.js
 *
 * Error Handling:
 * - Validates input before API calls
 * - Catches and formats API errors
 * - Returns standardized response format
 */

import axiosInstance from '../api/axiosConfig.js';

/**
 * ============================================
 * UTILITY: INPUT VALIDATION
 * ============================================
 */

/**
 * Validate date format and return ISO string
 * @param {string|Date} date - Date to validate
 * @returns {object} - { isValid: boolean, message: string, isoDate?: string }
 */
export const validateDate = (date) => {
  if (!date) {
    return { isValid: false, message: 'Date is required' };
  }

  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, message: 'Invalid date format' };
  }

  // Normalize to midnight UTC
  const normalized = new Date(dateObj);
  normalized.setHours(0, 0, 0, 0);

  return {
    isValid: true,
    message: 'Date is valid',
    isoDate: normalized.toISOString().split('T')[0],
    normalizedDate: normalized,
  };
};

/**
 * Validate metrics object contains required data
 * @param {object} metrics - Metrics data object
 * @returns {object} - { isValid: boolean, message: string }
 */
export const validateMetrics = (metrics) => {
  if (!metrics || typeof metrics !== 'object') {
    return { isValid: false, message: 'Metrics must be an object' };
  }

  if (Object.keys(metrics).length === 0) {
    return { isValid: false, message: 'At least one metric value is required' };
  }

  // Validate metric values are numbers or null
  const allowedFields = ['steps', 'distance', 'calories', 'activeMinutes', 'weight', 'sleepHours'];
  
  for (const [key, value] of Object.entries(metrics)) {
    if (!allowedFields.includes(key)) {
      return { isValid: false, message: `Unknown metric field: ${key}` };
    }

    if (value !== null && typeof value !== 'number') {
      return { isValid: false, message: `${key} must be a number or null` };
    }

    if (typeof value === 'number' && value < 0) {
      return { isValid: false, message: `${key} cannot be negative` };
    }
  }

  return { isValid: true, message: 'Metrics are valid' };
};

/**
 * Validate date range
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {object} - { isValid: boolean, message: string }
 */
export const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return { isValid: false, message: 'Both start date and end date are required' };
  }

  const startValidation = validateDate(startDate);
  const endValidation = validateDate(endDate);

  if (!startValidation.isValid) return startValidation;
  if (!endValidation.isValid) return endValidation;

  const start = new Date(startValidation.normalizedDate);
  const end = new Date(endValidation.normalizedDate);

  if (start > end) {
    return { isValid: false, message: 'Start date must be before or equal to end date' };
  }

  const daysDifference = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  if (daysDifference > 365) {
    return { isValid: false, message: 'Date range cannot exceed 365 days' };
  }

  return { isValid: true, message: 'Date range is valid' };
};

/**
 * ============================================
 * ADD OR UPDATE METRIC (UPSERT)
 * ============================================
 *
 * Adds a new health metric for a date or updates existing one
 * Backend uses upsert logic: creates if doesn't exist, updates if exists
 *
 * Backend endpoint: POST /api/metrics
 * Backend request body: { date, metrics, source?, activities? }
 * Backend success response: { success: true, message, data: healthMetric }
 * Backend error response: { success: false, message }
 *
 * @param {string|Date} date - Date for the metrics (YYYY-MM-DD format)
 * @param {Object} metrics - Metrics object
 * @param {number} [metrics.steps=0] - Steps count
 * @param {number} [metrics.distance=0] - Distance in kilometers
 * @param {number} [metrics.calories=0] - Calories burned
 * @param {number} [metrics.activeMinutes=0] - Active minutes
 * @param {number} [metrics.weight] - Weight in kg (optional)
 * @param {number} [metrics.sleepHours] - Sleep hours (optional)
 * @param {string} [source='manual'] - Data source (manual, googlefit)
 * @param {Array} [activities] - List of activities performed
 *
 * @returns {Promise} - { success: boolean, message: string, data?: object }
 *
 * @example
 * const result = await addMetric('2025-11-03', {
 *   steps: 8500,
 *   distance: 6.2,
 *   calories: 450,
 *   activeMinutes: 45,
 *   weight: 72.5,
 *   sleepHours: 7.5
 * });
 */
export const addMetric = async (date, metrics, source = 'manual', activities = []) => {
  try {
    // ===== CLIENT-SIDE VALIDATION =====
    const dateValidation = validateDate(date);
    if (!dateValidation.isValid) {
      return { success: false, message: dateValidation.message };
    }

    const metricsValidation = validateMetrics(metrics);
    if (!metricsValidation.isValid) {
      return { success: false, message: metricsValidation.message };
    }

    // Validate source
    if (!['manual', 'googlefit'].includes(source)) {
      return { success: false, message: 'Source must be either manual or googlefit' };
    }

    // ===== PREPARE REQUEST DATA =====
    const requestData = {
      date: dateValidation.normalizedDate.toISOString(),
      metrics: {
        steps: metrics.steps || 0,
        distance: metrics.distance || 0,
        calories: metrics.calories || 0,
        activeMinutes: metrics.activeMinutes || 0,
        weight: metrics.weight || null,
        sleepHours: metrics.sleepHours || null,
      },
      source,
      activities: activities || [],
    };

    // Development logging
    if (import.meta.env.VITE_NODE_ENV === 'development') {
      console.log('📊 Adding metric for date:', dateValidation.isoDate, requestData.metrics);
    }

    // ===== API CALL =====
    const response = await axiosInstance.post('/metrics', requestData);

    // ===== HANDLE SUCCESS RESPONSE =====
    const { success, message, data } = response.data;

    if (success && data) {
      if (import.meta.env.VITE_NODE_ENV === 'development') {
        console.log('✅ Metric added successfully:', data);
      }

      return { success: true, message: message || 'Metric added successfully', data };
    }

    return { success: false, message: 'Failed to add metric' };
  } catch (error) {
    // ===== HANDLE ERROR RESPONSE =====
    if (import.meta.env.VITE_NODE_ENV === 'development') {
      console.error('❌ Add metric error:', error);
    }

    return {
      success: false,
      message: error.message || 'Failed to add metric. Please try again.',
    };
  }
};

/**
 * ============================================
 * GET METRICS BY DATE RANGE
 * ============================================
 *
 * Retrieves health metrics for a date range
 *
 * Backend endpoint: GET /api/metrics?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Backend success response: { success: true, count: number, data: array }
 * Backend error response: { success: false, message }
 *
 * @param {string|Date} startDate - Start date (YYYY-MM-DD format)
 * @param {string|Date} endDate - End date (YYYY-MM-DD format)
 *
 * @returns {Promise} - { success: boolean, message: string, data?: array, count?: number }
 *
 * @example
 * const result = await getMetrics('2025-10-01', '2025-11-03');
 * if (result.success) {
 *   console.log(`Retrieved ${result.count} metrics`);
 *   result.data.forEach(metric => console.log(metric.date, metric.metrics.steps));
 * }
 */
export const getMetrics = async (startDate, endDate) => {
  try {
    // ===== CLIENT-SIDE VALIDATION =====
    const dateRangeValidation = validateDateRange(startDate, endDate);
    if (!dateRangeValidation.isValid) {
      return { success: false, message: dateRangeValidation.message };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const startISOString = start.toISOString().split('T')[0];
    const endISOString = end.toISOString().split('T')[0];

    // Development logging
    if (import.meta.env.VITE_NODE_ENV === 'development') {
      console.log('📅 Fetching metrics from', startISOString, 'to', endISOString);
    }

    // ===== API CALL =====
    const response = await axiosInstance.get('/metrics', {
      params: {
        startDate: startISOString,
        endDate: endISOString,
      },
    });

    // ===== HANDLE SUCCESS RESPONSE =====
    const { success, count, data } = response.data;

    if (success && Array.isArray(data)) {
      if (import.meta.env.VITE_NODE_ENV === 'development') {
        console.log(`✅ Retrieved ${count} metrics`);
      }

      return { success: true, message: `Retrieved ${count} metrics`, data, count };
    }

    return { success: false, message: 'Failed to retrieve metrics' };
  } catch (error) {
    // ===== HANDLE ERROR RESPONSE =====
    if (import.meta.env.VITE_NODE_ENV === 'development') {
      console.error('❌ Get metrics error:', error);
    }

    return {
      success: false,
      message: error.message || 'Failed to retrieve metrics. Please try again.',
      data: [],
      count: 0,
    };
  }
};

/**
 * ============================================
 * GET METRIC BY DATE
 * ============================================
 *
 * Retrieves health metrics for a specific date
 *
 * Backend endpoint: GET /api/metrics/:date
 * Backend success response: { success: true, data: healthMetric }
 * Backend error response: { success: false, message }
 *
 * @param {string|Date} date - Specific date (YYYY-MM-DD format)
 *
 * @returns {Promise} - { success: boolean, message: string, data?: object }
 *
 * @example
 * const result = await getMetricByDate('2025-11-03');
 * if (result.success) {
 *   console.log('Steps:', result.data.metrics.steps);
 * }
 */
export const getMetricByDate = async (date) => {
  try {
    // ===== CLIENT-SIDE VALIDATION =====
    const dateValidation = validateDate(date);
    if (!dateValidation.isValid) {
      return { success: false, message: dateValidation.message };
    }

    const dateString = dateValidation.isoDate;

    // Development logging
    if (import.meta.env.VITE_NODE_ENV === 'development') {
      console.log('📆 Fetching metric for date:', dateString);
    }

    // ===== API CALL =====
    const response = await axiosInstance.get(`/metrics/${dateString}`);

    // ===== HANDLE SUCCESS RESPONSE =====
    const { success, data } = response.data;

    if (success && data) {
      if (import.meta.env.VITE_NODE_ENV === 'development') {
        console.log('✅ Metric retrieved:', data);
      }

      return { success: true, message: 'Metric retrieved successfully', data };
    }

    return { success: false, message: 'Failed to retrieve metric' };
  } catch (error) {
    // ===== HANDLE ERROR RESPONSE =====
    if (import.meta.env.VITE_NODE_ENV === 'development') {
      console.error('❌ Get metric by date error:', error);
    }

    // Check if it's a 404 (no metrics found for that date)
    if (error.statusCode === 404) {
      return {
        success: false,
        message: 'No metrics found for this date. Add your first metric!',
      };
    }

    return {
      success: false,
      message: error.message || 'Failed to retrieve metric. Please try again.',
    };
  }
};

/**
 * ============================================
 * UPDATE METRIC (ALIAS FOR ADD METRIC)
 * ============================================
 *
 * Updates an existing health metric or creates new one if doesn't exist
 * Backend uses upsert logic, so this is essentially the same as addMetric
 *
 * @param {string|Date} date - Date for the metrics
 * @param {Object} data - Metrics object (same structure as addMetric)
 * @param {string} [source='manual'] - Data source
 * @param {Array} [activities] - Activities list
 *
 * @returns {Promise} - { success: boolean, message: string, data?: object }
 *
 * @example
 * const result = await updateMetric('2025-11-03', {
 *   steps: 9000,
 *   distance: 6.5,
 *   calories: 500
 * });
 */
export const updateMetric = async (date, data, source = 'manual', activities = []) => {
  // Since backend uses upsert on POST /metrics, updating is the same as adding
  return addMetric(date, data, source, activities);
};

/**
 * ============================================
 * DELETE METRIC
 * ============================================
 *
 * Deletes a health metric entry for a specific date
 *
 * Backend endpoint: DELETE /api/metrics/:date
 * Backend success response: { success: true, message, data: deletedMetric }
 * Backend error response: { success: false, message }
 *
 * @param {string|Date} date - Date of metric to delete
 *
 * @returns {Promise} - { success: boolean, message: string, data?: object }
 *
 * @example
 * const result = await deleteMetric('2025-11-03');
 * if (result.success) {
 *   console.log('Metric deleted for:', result.data.date);
 * }
 */
export const deleteMetric = async (date) => {
  try {
    // ===== CLIENT-SIDE VALIDATION =====
    const dateValidation = validateDate(date);
    if (!dateValidation.isValid) {
      return { success: false, message: dateValidation.message };
    }

    const dateString = dateValidation.isoDate;

    // Development logging
    if (import.meta.env.VITE_NODE_ENV === 'development') {
      console.log('🗑️ Deleting metric for date:', dateString);
    }

    // ===== API CALL =====
    const response = await axiosInstance.delete(`/metrics/${dateString}`);

    // ===== HANDLE SUCCESS RESPONSE =====
    const { success, message, data } = response.data;

    if (success) {
      if (import.meta.env.VITE_NODE_ENV === 'development') {
        console.log('✅ Metric deleted successfully');
      }

      return { success: true, message: message || 'Metric deleted successfully', data };
    }

    return { success: false, message: 'Failed to delete metric' };
  } catch (error) {
    // ===== HANDLE ERROR RESPONSE =====
    if (import.meta.env.VITE_NODE_ENV === 'development') {
      console.error('❌ Delete metric error:', error);
    }

    return {
      success: false,
      message: error.message || 'Failed to delete metric. Please try again.',
    };
  }
};

/**
 * ============================================
 * GET METRICS SUMMARY
 * ============================================
 *
 * Retrieves aggregated metrics summary for a time period
 * Calculates totals, averages, and trends
 *
 * Backend endpoint: GET /api/metrics/summary/:period
 * Backend success response: { success: true, period, data: summaryObject }
 * Backend error response: { success: false, message }
 *
 * @param {string} [period='week'] - Time period ('week', 'month', or 'year')
 *
 * @returns {Promise} - { success: boolean, message: string, data?: object, period?: string }
 *
 * @example
 * const result = await getMetricsSummary('week');
 * if (result.success) {
 *   console.log('Weekly summary:');
 *   console.log('Avg steps:', result.data.avgSteps);
 *   console.log('Total calories:', result.data.totalCalories);
 * }
 */
export const getMetricsSummary = async (period = 'week') => {
  try {
    // ===== CLIENT-SIDE VALIDATION =====
    const validPeriods = ['week', 'month', 'year'];
    
    if (!validPeriods.includes(period)) {
      return {
        success: false,
        message: `Invalid period. Must be one of: ${validPeriods.join(', ')}`,
      };
    }

    // Development logging
    if (import.meta.env.VITE_NODE_ENV === 'development') {
      console.log(`📈 Fetching ${period} summary...`);
    }

    // ===== API CALL =====
    const response = await axiosInstance.get(`/metrics/summary/${period}`);

    // ===== HANDLE SUCCESS RESPONSE =====
    const { success, data, period: responsePeriod } = response.data;

    if (success && data) {
      if (import.meta.env.VITE_NODE_ENV === 'development') {
        console.log(`✅ ${period} summary retrieved:`, data);
      }

      return {
        success: true,
        message: `${period.charAt(0).toUpperCase() + period.slice(1)} summary retrieved`,
        data,
        period: responsePeriod,
      };
    }

    return { success: false, message: 'Failed to retrieve summary' };
  } catch (error) {
    // ===== HANDLE ERROR RESPONSE =====
    if (import.meta.env.VITE_NODE_ENV === 'development') {
      console.error('❌ Get metrics summary error:', error);
    }

    // Check if it's a 404 (no metrics in that period)
    if (error.statusCode === 404) {
      return {
        success: false,
        message: `No metrics found for the last ${period}. Start tracking!`,
      };
    }

    return {
      success: false,
      message: error.message || 'Failed to retrieve summary. Please try again.',
    };
  }
};

/**
 * ============================================
 * GET LATEST METRICS
 * ============================================
 *
 * Retrieves the most recent health metric entry
 * Useful for dashboard quick view of latest data
 *
 * Backend endpoint: GET /api/metrics/latest
 * Backend success response: { success: true, data: healthMetric }
 * Backend error response: { success: false, message }
 *
 * @returns {Promise} - { success: boolean, message: string, data?: object }
 *
 * @example
 * const result = await getLatestMetrics();
 * if (result.success) {
 *   console.log('Latest metric date:', result.data.date);
 *   console.log('Steps:', result.data.metrics.steps);
 * }
 */
export const getLatestMetrics = async () => {
  try {
    // Development logging
    if (import.meta.env.VITE_NODE_ENV === 'development') {
      console.log('📍 Fetching latest metrics...');
    }

    // ===== API CALL =====
    const response = await axiosInstance.get('/metrics/latest');

    // ===== HANDLE SUCCESS RESPONSE =====
    const { success, data } = response.data;

    if (success && data) {
      if (import.meta.env.VITE_NODE_ENV === 'development') {
        console.log('✅ Latest metric retrieved:', data);
      }

      return {
        success: true,
        message: 'Latest metric retrieved successfully',
        data,
      };
    }

    return { success: false, message: 'Failed to retrieve latest metric' };
  } catch (error) {
    // ===== HANDLE ERROR RESPONSE =====
    if (import.meta.env.VITE_NODE_ENV === 'development') {
      console.error('❌ Get latest metrics error:', error);
    }

    // Check if it's a 404 (no metrics exist yet)
    if (error.statusCode === 404) {
      return {
        success: false,
        message: 'No metrics found yet. Start tracking today!',
      };
    }

    return {
      success: false,
      message: error.message || 'Failed to retrieve latest metric. Please try again.',
    };
  }
};

/**
 * ============================================
 * EXPORT ALL FUNCTIONS
 * ============================================
 */

// Default export with all API functions and validators
export default {
  addMetric,
  getMetrics,
  getMetricByDate,
  updateMetric,
  deleteMetric,
  getMetricsSummary,
  getLatestMetrics,
  validateDate,
  validateMetrics,
  validateDateRange,
};
