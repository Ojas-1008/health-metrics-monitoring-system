import axiosInstance from '../api/axiosConfig';

/**
 * Get analytics summary
 * @returns {Promise<Object>} Analytics summary data
 */
export const getAnalyticsSummary = async () => {
  try {
    const response = await axiosInstance.get('/analytics/summary');
    return response.data;
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    throw error.response?.data || { message: 'Failed to fetch analytics summary' };
  }
};

/**
 * Get latest analytics for a specific metric type
 * @param {string} metricType - Metric type (steps, calories, etc.)
 * @param {string} timeRange - Optional time range (7day, 30day, 90day)
 * @returns {Promise<Object>} Latest analytics data
 */
export const getLatestAnalytics = async (metricType, timeRange) => {
  try {
    const params = timeRange ? { timeRange } : {};
    const response = await axiosInstance.get(`/analytics/latest/${metricType}`, { params });
    return response.data;
  } catch (error) {
    console.error(`Error fetching latest analytics for ${metricType}:`, error);
    throw error.response?.data || { message: 'Failed to fetch latest analytics' };
  }
};

/**
 * Get all analytics with pagination and filtering
 * @param {Object} params - Query parameters (limit, skip, metricType, timeRange, etc.)
 * @returns {Promise<Object>} List of analytics
 */
export const getAllAnalytics = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/analytics', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching all analytics:', error);
    throw error.response?.data || { message: 'Failed to fetch analytics' };
  }
};

/**
 * Get anomalies
 * @param {Object} params - Query parameters (metricType, severity, since, limit)
 * @returns {Promise<Object>} List of anomalies
 */
export const getAnomalies = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/analytics/anomalies', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching anomalies:', error);
    throw error.response?.data || { message: 'Failed to fetch anomalies' };
  }
};
