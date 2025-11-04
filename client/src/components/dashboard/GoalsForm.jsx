/**
 * ============================================
 * GOALS FORM COMPONENT
 * ============================================
 *
 * Purpose: Form for creating and editing user fitness goals
 *
 * Features:
 * - Input fields for all goal types
 * - Client-side validation with feedback
 * - Loading state during submission
 * - Error handling
 * - Success callback
 * - Pre-fill with existing goals
 * - Range validation helpers
 *
 * Props:
 * - initialGoals: Pre-filled goal values (optional)
 * - onSuccess: Callback when goals saved successfully
 * - onError: Callback when save fails
 */

import { useState, useCallback } from 'react';
import * as goalsService from '../../services/goalsService';
import Button from '../common/Button';
import Alert from '../common/Alert';

/**
 * ============================================
 * GOALS FORM COMPONENT
 * ============================================
 */

const GoalsForm = ({
  initialGoals = null,
  onSuccess = null,
  onError = null,
}) => {
  // ===== STATE MANAGEMENT =====

  const [formData, setFormData] = useState({
    weightGoal: initialGoals?.weightGoal || '',
    stepGoal: initialGoals?.stepGoal || '',
    sleepGoal: initialGoals?.sleepGoal || '',
    calorieGoal: initialGoals?.calorieGoal || '',
    distanceGoal: initialGoals?.distanceGoal || '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ visible: false, type: 'info', message: '' });

  // ===== VALIDATION RULES =====

  const validationRules = {
    weightGoal: { min: 30, max: 300, label: 'Weight Goal', unit: 'kg' },
    stepGoal: { min: 1000, max: 50000, label: 'Step Goal', unit: 'steps' },
    sleepGoal: { min: 4, max: 12, label: 'Sleep Goal', unit: 'hours' },
    calorieGoal: { min: 500, max: 5000, label: 'Calorie Goal', unit: 'cal' },
    distanceGoal: { min: 0.5, max: 100, label: 'Distance Goal', unit: 'km' },
  };

  // ===== HELPER FUNCTIONS =====

  /**
   * Validate field value
   */
  const validateField = useCallback((name, value) => {
    // Allow empty values
    if (value === '' || value === null || value === undefined) {
      return '';
    }

    const rule = validationRules[name];
    if (!rule) return '';

    const numValue = Number(value);

    if (isNaN(numValue)) {
      return `${rule.label} must be a number`;
    }

    if (numValue < rule.min) {
      return `${rule.label} must be at least ${rule.min} ${rule.unit}`;
    }

    if (numValue > rule.max) {
      return `${rule.label} must not exceed ${rule.max} ${rule.unit}`;
    }

    return '';
  }, []);

  /**
   * Validate entire form
   */
  const validateForm = useCallback(() => {
    const newErrors = {};

    // Check if at least one goal is provided
    const hasAnyGoal = Object.entries(formData).some(
      ([, value]) => value !== '' && value !== null && value !== undefined
    );

    if (!hasAnyGoal) {
      return { hasErrors: true, message: 'Please set at least one goal' };
    }

    // Validate each field
    Object.entries(formData).forEach(([name, value]) => {
      const error = validateField(name, value);
      if (error) {
        newErrors[name] = error;
      }
    });

    setErrors(newErrors);
    return { hasErrors: Object.keys(newErrors).length > 0 };
  }, [formData, validateField]);

  // ===== EVENT HANDLERS =====

  /**
   * Handle input change
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? '' : Number(value),
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validation = validateForm();
    if (validation.hasErrors) {
      setAlert({
        visible: true,
        type: 'error',
        message: validation.message || 'Please fix the errors below',
      });
      return;
    }

    setIsLoading(true);
    setAlert({ visible: false, type: 'info', message: '' });

    try {
      // Filter out empty values
      const goalsToSave = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          goalsToSave[key] = value;
        }
      });

      // Call appropriate service function
      const result = initialGoals
        ? await goalsService.updateGoals(goalsToSave)
        : await goalsService.setGoals(goalsToSave);

      if (result.success && result.data) {
        if (onSuccess && typeof onSuccess === 'function') {
          onSuccess(result.data);
        }
      } else {
        setAlert({
          visible: true,
          type: 'error',
          message: result.message || 'Failed to save goals',
        });

        if (onError && typeof onError === 'function') {
          onError(result.message);
        }
      }
    } catch (error) {
      console.error('Error saving goals:', error);

      setAlert({
        visible: true,
        type: 'error',
        message: error.message || 'An unexpected error occurred',
      });

      if (onError && typeof onError === 'function') {
        onError(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle clear form
   */
  const handleClear = () => {
    setFormData({
      weightGoal: '',
      stepGoal: '',
      sleepGoal: '',
      calorieGoal: '',
      distanceGoal: '',
    });
    setErrors({});
    setAlert({ visible: false, type: 'info', message: '' });
  };

  // ===== RENDER =====

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Alert */}
      {alert.visible && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert((prev) => ({ ...prev, visible: false }))}
          dismissible
        />
      )}

      {/* Weight Goal */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ⚖️ Weight Goal (kg)
        </label>
        <input
          type="number"
          name="weightGoal"
          value={formData.weightGoal}
          onChange={handleInputChange}
          placeholder="e.g., 70"
          min="30"
          max="300"
          step="0.5"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
            errors.weightGoal ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        <p className="text-xs text-gray-500 mt-1">Range: 30 - 300 kg</p>
        {errors.weightGoal && (
          <p className="text-xs text-red-600 mt-1 font-medium">
            {errors.weightGoal}
          </p>
        )}
      </div>

      {/* Step Goal */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          👟 Step Goal (steps/day)
        </label>
        <input
          type="number"
          name="stepGoal"
          value={formData.stepGoal}
          onChange={handleInputChange}
          placeholder="e.g., 10000"
          min="1000"
          max="50000"
          step="100"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
            errors.stepGoal ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        <p className="text-xs text-gray-500 mt-1">Range: 1,000 - 50,000 steps</p>
        {errors.stepGoal && (
          <p className="text-xs text-red-600 mt-1 font-medium">
            {errors.stepGoal}
          </p>
        )}
      </div>

      {/* Sleep Goal */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          😴 Sleep Goal (hours)
        </label>
        <input
          type="number"
          name="sleepGoal"
          value={formData.sleepGoal}
          onChange={handleInputChange}
          placeholder="e.g., 8"
          min="4"
          max="12"
          step="0.5"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
            errors.sleepGoal ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        <p className="text-xs text-gray-500 mt-1">Range: 4 - 12 hours</p>
        {errors.sleepGoal && (
          <p className="text-xs text-red-600 mt-1 font-medium">
            {errors.sleepGoal}
          </p>
        )}
      </div>

      {/* Calorie Goal */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          🔥 Calorie Goal (cal/day)
        </label>
        <input
          type="number"
          name="calorieGoal"
          value={formData.calorieGoal}
          onChange={handleInputChange}
          placeholder="e.g., 2000"
          min="500"
          max="5000"
          step="50"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
            errors.calorieGoal ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        <p className="text-xs text-gray-500 mt-1">Range: 500 - 5,000 calories</p>
        {errors.calorieGoal && (
          <p className="text-xs text-red-600 mt-1 font-medium">
            {errors.calorieGoal}
          </p>
        )}
      </div>

      {/* Distance Goal */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          🏃 Distance Goal (km)
        </label>
        <input
          type="number"
          name="distanceGoal"
          value={formData.distanceGoal}
          onChange={handleInputChange}
          placeholder="e.g., 5"
          min="0.5"
          max="100"
          step="0.5"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
            errors.distanceGoal ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        <p className="text-xs text-gray-500 mt-1">Range: 0.5 - 100 km</p>
        {errors.distanceGoal && (
          <p className="text-xs text-red-600 mt-1 font-medium">
            {errors.distanceGoal}
          </p>
        )}
      </div>

      {/* Helper Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900">
        <p className="font-medium mb-1">💡 Tip:</p>
        <p>Leave any fields empty to keep current values. Set at least one goal to save.</p>
      </div>

      {/* Form Actions */}
      <div className="flex gap-2 pt-4 border-t border-gray-200">
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? '💾 Saving...' : '💾 Save Goals'}
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={handleClear}
          disabled={isLoading}
          className="flex-1"
        >
          Clear
        </Button>
      </div>
    </form>
  );
};

export default GoalsForm;
