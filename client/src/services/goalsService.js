/**
 * ============================================
 * GOALS SERVICE LAYER
 * ============================================
 *
 * Purpose: Centralized API service for managing user fitness goals
 *
 * Functions:
 * - setGoals(goals) - POST to /goals (create/update)
 * - getGoals() - GET /goals
 * - updateGoals(goals) - PUT /goals (partial update)
 * - resetGoals() - DELETE /goals (reset to defaults)
 * - getGoalProgress() - GET /goals/progress
 *
 * Integrates with:
 * - Backend API (goalsController.js, goalsRoutes.js)
 * - Axios instance (with JWT token attachment)
 * - User.goals field in User model
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
 * Validate goals object contains valid goal values
 * @param {object} goals - Goals data object
 * @returns {object} - { isValid: boolean, message: string }
 */
const validateGoals = (goals) => {
  if (!goals || typeof goals !== 'object') {
    return { isValid: false, message: 'Goals must be an object' };
  }

  if (Object.keys(goals).length === 0) {
    return { isValid: false, message: 'At least one goal field must be provided' };
  }

  // Define validation rules for each goal field
  const validationRules = {
    weightGoal: { min: 30, max: 300, name: 'Weight goal', unit: 'kg' },
    stepGoal: { min: 1000, max: 50000, name: 'Step goal', unit: 'steps' },
    sleepGoal: { min: 4, max: 12, name: 'Sleep goal', unit: 'hours' },
    calorieGoal: { min: 500, max: 5000, name: 'Calorie goal', unit: 'calories' },
    distanceGoal: { min: 0.5, max: 100, name: 'Distance goal', unit: 'km' },
  };

  // Validate each provided goal field
  for (const [key, value] of Object.entries(goals)) {
    // Check if field is allowed
    if (!validationRules[key]) {
      return { isValid: false, message: `Unknown goal field: ${key}` };
    }

    // Allow null values for optional goals
    if (value === null) {
      continue;
    }

    // Check if value is a number
    if (typeof value !== 'number') {
      return { isValid: false, message: `${validationRules[key].name} must be a number` };
    }

    // Check min/max constraints
    const { min, max, name, unit } = validationRules[key];
    if (value < min || value > max) {
      return {
        isValid: false,
        message: `${name} must be between ${min} and ${max} ${unit}`,
      };
    }
  }

  return { isValid: true, message: 'Goals are valid' };
};

/**
 * ============================================
 * SET GOALS (CREATE OR UPDATE)
 * ============================================
 *
 * Sets or updates user fitness goals
 * Backend uses upsert logic: creates if doesn't exist, updates if exists
 *
 * Backend endpoint: POST /api/goals
 * Backend request body: { weightGoal?, stepGoal?, sleepGoal?, calorieGoal?, distanceGoal? }
 * Backend success response: { success: true, message, data: goals }
 * Backend error response: { success: false, message }
 *
 * @param {Object} goals - Goals object
 * @param {number} [goals.weightGoal] - Target weight in kg (30-300)
 * @param {number} [goals.stepGoal] - Daily step goal (1000-50000)
 * @param {number} [goals.sleepGoal] - Sleep hours goal (4-12)
 * @param {number} [goals.calorieGoal] - Daily calorie goal (500-5000)
 * @param {number} [goals.distanceGoal] - Distance goal in km (0.5-100)
 *
 * @returns {Promise} - { success: boolean, message: string, data?: object }
 *
 * @example
 * const result = await setGoals({
 *   weightGoal: 70,
 *   stepGoal: 12000,
 *   sleepGoal: 8,
 *   calorieGoal: 2200,
 *   distanceGoal: 6
 * });
 */
export const setGoals = async (goals) => {
  try {
    // ===== CLIENT-SIDE VALIDATION =====
    const validation = validateGoals(goals);
    if (!validation.isValid) {
      return { success: false, message: validation.message };
    }

    // ===== PREPARE REQUEST DATA =====
    const requestData = {};

    // Only include defined goal fields
    if (goals.weightGoal !== undefined) requestData.weightGoal = goals.weightGoal;
    if (goals.stepGoal !== undefined) requestData.stepGoal = goals.stepGoal;
    if (goals.sleepGoal !== undefined) requestData.sleepGoal = goals.sleepGoal;
    if (goals.calorieGoal !== undefined) requestData.calorieGoal = goals.calorieGoal;
    if (goals.distanceGoal !== undefined) requestData.distanceGoal = goals.distanceGoal;

    // Development logging
    if (import.meta.env.VITE_NODE_ENV === 'development') {
      console.log('🎯 Setting goals:', requestData);
    }

    // ===== API CALL =====
    const response = await axiosInstance.post('/goals', requestData);

    // ===== HANDLE SUCCESS RESPONSE =====
    const { success, message, data } = response.data;

    if (success && data) {
      if (import.meta.env.VITE_NODE_ENV === 'development') {
        console.log('✅ Goals set successfully:', data);
      }

      return { success: true, message: message || 'Goals set successfully', data };
    }

    return { success: false, message: 'Failed to set goals' };
  } catch (error) {
    // ===== HANDLE ERROR RESPONSE =====
    if (import.meta.env.VITE_NODE_ENV === 'development') {
      console.error('❌ Set goals error:', error);
    }

    // Extract error message from API response or use default
    const errorMessage = error.response?.data?.message || error.message || 'Failed to set goals. Please try again.';

    return {
      success: false,
      message: errorMessage,
    };
  }
};

/**
 * ============================================
 * GET GOALS
 * ============================================
 *
 * Retrieves current user's fitness goals
 *
 * Backend endpoint: GET /api/goals
 * Backend success response: { success: true, data: goals }
 * Backend error response: { success: false, message }
 *
 * @returns {Promise} - { success: boolean, message: string, data?: object }
 *
 * @example
 * const result = await getGoals();
 * if (result.success) {
 *   console.log('Step goal:', result.data.stepGoal);
 *   console.log('Sleep goal:', result.data.sleepGoal);
 * }
 */
export const getGoals = async () => {
  try {
    // Development logging
    if (import.meta.env.VITE_NODE_ENV === 'development') {
      console.log('📊 Fetching goals...');
    }

    // ===== API CALL =====
    const response = await axiosInstance.get('/goals');

    // ===== HANDLE SUCCESS RESPONSE =====
    const { success, data } = response.data;

    if (success && data) {
      if (import.meta.env.VITE_NODE_ENV === 'development') {
        console.log('✅ Goals retrieved:', data);
      }

      return {
        success: true,
        message: 'Goals retrieved successfully',
        data,
      };
    }

    return { success: false, message: 'Failed to retrieve goals' };
  } catch (error) {
    // ===== HANDLE ERROR RESPONSE =====
    if (import.meta.env.VITE_NODE_ENV === 'development') {
      console.error('❌ Get goals error:', error);
    }

    // Check if it's a 404 (user not found)
    if (error.response?.status === 404) {
      return {
        success: false,
        message: 'User not found. Please log in again.',
      };
    }

    // Extract error message from API response or use default
    const errorMessage = error.response?.data?.message || error.message || 'Failed to retrieve goals. Please try again.';

    return {
      success: false,
      message: errorMessage,
    };
  }
};

/**
 * ============================================
 * UPDATE GOALS (PARTIAL UPDATE)
 * ============================================
 *
 * Updates specific user goals (only provided fields)
 * Same functionality as setGoals but uses PUT method
 *
 * Backend endpoint: PUT /api/goals
 * Backend request body: { ...goalFields } (partial)
 * Backend success response: { success: true, message, data: goals }
 * Backend error response: { success: false, message }
 *
 * @param {Object} goals - Goals object (partial update)
 * @param {number} [goals.weightGoal] - Target weight in kg
 * @param {number} [goals.stepGoal] - Daily step goal
 * @param {number} [goals.sleepGoal] - Sleep hours goal
 * @param {number} [goals.calorieGoal] - Daily calorie goal
 * @param {number} [goals.distanceGoal] - Distance goal in km
 *
 * @returns {Promise} - { success: boolean, message: string, data?: object }
 *
 * @example
 * // Update only step goal
 * const result = await updateGoals({ stepGoal: 15000 });
 *
 * // Update multiple goals
 * const result = await updateGoals({
 *   stepGoal: 15000,
 *   sleepGoal: 9
 * });
 */
export const updateGoals = async (goals) => {
  try {
    // ===== CLIENT-SIDE VALIDATION =====
    const validation = validateGoals(goals);
    if (!validation.isValid) {
      return { success: false, message: validation.message };
    }

    // ===== PREPARE REQUEST DATA =====
    const requestData = {};

    // Only include defined goal fields
    if (goals.weightGoal !== undefined) requestData.weightGoal = goals.weightGoal;
    if (goals.stepGoal !== undefined) requestData.stepGoal = goals.stepGoal;
    if (goals.sleepGoal !== undefined) requestData.sleepGoal = goals.sleepGoal;
    if (goals.calorieGoal !== undefined) requestData.calorieGoal = goals.calorieGoal;
    if (goals.distanceGoal !== undefined) requestData.distanceGoal = goals.distanceGoal;

    // Development logging
    if (import.meta.env.VITE_NODE_ENV === 'development') {
      console.log('🔄 Updating goals:', requestData);
    }

    // ===== API CALL =====
    const response = await axiosInstance.put('/goals', requestData);

    // ===== HANDLE SUCCESS RESPONSE =====
    const { success, message, data } = response.data;

    if (success && data) {
      if (import.meta.env.VITE_NODE_ENV === 'development') {
        console.log('✅ Goals updated successfully:', data);
      }

      return { success: true, message: message || 'Goals updated successfully', data };
    }

    return { success: false, message: 'Failed to update goals' };
  } catch (error) {
    // ===== HANDLE ERROR RESPONSE =====
    if (import.meta.env.VITE_NODE_ENV === 'development') {
      console.error('❌ Update goals error:', error);
    }

    // Extract error message from API response or use default
    const errorMessage = error.response?.data?.message || error.message || 'Failed to update goals. Please try again.';

    return {
      success: false,
      message: errorMessage,
    };
  }
};

/**
 * ============================================
 * RESET GOALS
 * ============================================
 *
 * Resets all goals to default values
 *
 * Default values:
 * - weightGoal: null
 * - stepGoal: 10000
 * - sleepGoal: 8
 * - calorieGoal: 2000
 * - distanceGoal: 5
 *
 * Backend endpoint: DELETE /api/goals
 * Backend success response: { success: true, message, data: defaultGoals }
 * Backend error response: { success: false, message }
 *
 * @returns {Promise} - { success: boolean, message: string, data?: object }
 *
 * @example
 * const result = await resetGoals();
 * if (result.success) {
 *   console.log('Goals reset to:', result.data);
 * }
 */
export const resetGoals = async () => {
  try {
    // Development logging
    if (import.meta.env.VITE_NODE_ENV === 'development') {
      console.log('🔄 Resetting goals to defaults...');
    }

    // ===== API CALL =====
    const response = await axiosInstance.delete('/goals');

    // ===== HANDLE SUCCESS RESPONSE =====
    const { success, message, data } = response.data;

    if (success && data) {
      if (import.meta.env.VITE_NODE_ENV === 'development') {
        console.log('✅ Goals reset successfully:', data);
      }

      return { success: true, message: message || 'Goals reset to defaults', data };
    }

    return { success: false, message: 'Failed to reset goals' };
  } catch (error) {
    // ===== HANDLE ERROR RESPONSE =====
    if (import.meta.env.VITE_NODE_ENV === 'development') {
      console.error('❌ Reset goals error:', error);
    }

    // Extract error message from API response or use default
    const errorMessage = error.response?.data?.message || error.message || 'Failed to reset goals. Please try again.';

    return {
      success: false,
      message: errorMessage,
    };
  }
};

/**
 * ============================================
 * GET GOAL PROGRESS
 * ============================================
 *
 * Retrieves goal progress for current day
 * Compares today's metrics with user's goals
 *
 * Backend endpoint: GET /api/goals/progress
 * Backend success response: {
 *   success: true,
 *   data: {
 *     goals: { ... },
 *     currentMetrics: { ... },
 *     progress: {
 *       steps: { goal, current, percentage, achieved },
 *       sleep: { goal, current, percentage, achieved },
 *       calories: { goal, current, percentage, achieved },
 *       distance: { goal, current, percentage, achieved },
 *       weight: { goal, current, difference, achieved }
 *     },
 *     hasMetricsToday: boolean
 *   }
 * }
 * Backend error response: { success: false, message }
 *
 * @returns {Promise} - { success: boolean, message: string, data?: object }
 *
 * @example
 * const result = await getGoalProgress();
 * if (result.success) {
 *   const { progress } = result.data;
 *   console.log('Steps progress:', progress.steps.percentage + '%');
 *   console.log('Steps achieved:', progress.steps.achieved);
 * }
 */
export const getGoalProgress = async () => {
  try {
    // Development logging
    if (import.meta.env.VITE_NODE_ENV === 'development') {
      console.log('📈 Fetching goal progress...');
    }

    // ===== API CALL =====
    const response = await axiosInstance.get('/goals/progress');

    // ===== HANDLE SUCCESS RESPONSE =====
    const { success, data } = response.data;

    if (success && data) {
      if (import.meta.env.VITE_NODE_ENV === 'development') {
        console.log('✅ Goal progress retrieved:', data);
      }

      return {
        success: true,
        message: 'Goal progress retrieved successfully',
        data,
      };
    }

    return { success: false, message: 'Failed to retrieve goal progress' };
  } catch (error) {
    // ===== HANDLE ERROR RESPONSE =====
    if (import.meta.env.VITE_NODE_ENV === 'development') {
      console.error('❌ Get goal progress error:', error);
    }

    // Check if it's a 404 (user not found)
    if (error.response?.status === 404) {
      return {
        success: false,
        message: 'User not found. Please log in again.',
      };
    }

    // Extract error message from API response or use default
    const errorMessage = error.response?.data?.message || error.message || 'Failed to retrieve goal progress. Please try again.';

    return {
      success: false,
      message: errorMessage,
    };
  }
};

/**
 * ============================================
 * HELPER: Calculate Progress Percentage
 * ============================================
 *
 * Client-side helper to calculate progress percentage
 * Useful for real-time UI updates before API call
 *
 * @param {number} current - Current value
 * @param {number} goal - Goal value
 * @returns {number} - Progress percentage (0-100)
 *
 * @example
 * const percentage = calculateProgress(7500, 10000); // 75
 */
export const calculateProgress = (current, goal) => {
  if (!goal || goal <= 0) return 0;
  return Math.min(Math.round((current / goal) * 100), 100);
};

/**
 * ============================================
 * HELPER: Check if Goal is Achieved
 * ============================================
 *
 * Client-side helper to check if goal is achieved
 *
 * @param {number} current - Current value
 * @param {number} goal - Goal value
 * @returns {boolean} - True if goal is achieved
 *
 * @example
 * const achieved = isGoalAchieved(10500, 10000); // true
 */
export const isGoalAchieved = (current, goal) => {
  if (!goal) return false;
  return current >= goal;
};

/**
 * ============================================
 * HELPER: Format Goal Display
 * ============================================
 *
 * Client-side helper to format goals for display
 *
 * @param {string} goalType - Type of goal (steps, sleep, etc.)
 * @param {number} value - Goal value
 * @returns {string} - Formatted goal string
 *
 * @example
 * formatGoalDisplay('stepGoal', 10000); // "10,000 steps"
 * formatGoalDisplay('sleepGoal', 8); // "8 hours"
 */
export const formatGoalDisplay = (goalType, value) => {
  if (!value && value !== 0) return 'Not set';

  const formatMap = {
    weightGoal: `${value} kg`,
    stepGoal: `${value.toLocaleString()} steps`,
    sleepGoal: `${value} hours`,
    calorieGoal: `${value.toLocaleString()} calories`,
    distanceGoal: `${value} km`,
  };

  return formatMap[goalType] || `${value}`;
};

/**
 * ============================================
 * EXPORT ALL FUNCTIONS
 * ============================================
 */

export default {
  setGoals,
  getGoals,
  updateGoals,
  resetGoals,
  getGoalProgress,
  calculateProgress,
  isGoalAchieved,
  formatGoalDisplay,
};
