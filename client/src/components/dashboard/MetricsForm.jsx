/**
 * ============================================
 * METRICS INPUT FORM COMPONENT (PHONE-ONLY)
 * ============================================
 *
 * Purpose: Allows users to input/track daily health metrics (PHONE DATA ONLY)
 *
 * Features:
 * - Date picker (defaults to today)
 * - Phone-supported metric input fields with validation
 * - Real-time error feedback
 * - Loading state during submission
 * - Success/error notifications
 * - Form reset after successful submission
 * - Responsive Tailwind design
 * - ENFORCES PHONE-ONLY CONSTRAINTS (no wearable metrics)
 *
 * Integration:
 * - Uses metricsService for API calls
 * - Alerts for user feedback
 * - Tailwind CSS for styling
 * - Backend validation ensures data integrity
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import * as metricsService from '../../services/metricsService';
import Button from '../common/Button';
import Alert from '../common/Alert';

/**
 * ============================================
 * METRICS FORM COMPONENT
 * ============================================
 */
const MetricsForm = ({ onSuccess, onError }) => {
  // ===== STATE MANAGEMENT =====

  // Form data state (PHONE-ONLY METRICS)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0], // Today's date (YYYY-MM-DD)
    steps: '',
    calories: '',
    distance: '',
    activeMinutes: '',
    weight: '',
    sleepHours: '',
    // ⚠️ heartRate REMOVED - Not supported by phone sensors
  });

  // Form validation errors
  const [errors, setErrors] = useState({});

  // Loading state for form submission
  const [isLoading, setIsLoading] = useState(false);

  // Alert message state
  const [alert, setAlert] = useState({
    visible: false,
    type: 'info', // 'success', 'error', 'info', 'warning'
    title: '',
    message: '',
  });

  // ===== FIELD CONFIGURATION (PHONE-ONLY) =====
  const metricFields = [
    {
      name: 'steps',
      label: 'Steps',
      type: 'number',
      placeholder: 'e.g., 8500',
      unit: 'steps',
      min: 0,
      max: 100000,
      required: true,
      icon: '👟',
      description: 'Tracked by phone accelerometer',
    },
    {
      name: 'calories',
      label: 'Calories Burned',
      type: 'number',
      placeholder: 'e.g., 450',
      unit: 'calories',
      min: 0,
      max: 10000,
      required: true,
      icon: '🔥',
      description: 'Estimated from activity',
    },
    {
      name: 'distance',
      label: 'Distance',
      type: 'number',
      placeholder: 'e.g., 6.2',
      step: 0.1,
      unit: 'km',
      min: 0,
      max: 500,
      required: false,
      icon: '🏃',
      description: 'Tracked via GPS',
    },
    {
      name: 'activeMinutes',
      label: 'Active Minutes',
      type: 'number',
      placeholder: 'e.g., 45',
      unit: 'minutes',
      min: 0,
      max: 1440,
      required: false,
      icon: '⏱️',
      description: 'Time spent moving',
    },
    {
      name: 'weight',
      label: 'Weight',
      type: 'number',
      placeholder: 'e.g., 72.5',
      step: 0.1,
      unit: 'kg',
      min: 30,
      max: 300,
      required: false,
      icon: '⚖️',
      description: 'Manual entry',
    },
    {
      name: 'sleepHours',
      label: 'Sleep Hours',
      type: 'number',
      placeholder: 'e.g., 7.5',
      step: 0.5,
      unit: 'hours',
      min: 0,
      max: 24, // ⭐ UPDATED: Changed from 16 to 24 to match backend
      required: false,
      icon: '😴',
      description: 'Manual entry or phone tracking',
    },
    // ⚠️ heartRate field COMPLETELY REMOVED
    // Reason: Android phones do not have optical heart rate sensors
    // Only available on smartwatches and fitness bands
  ];

  // ===== UTILITY FUNCTIONS =====

  /**
   * Show alert message
   */
  const showAlert = (type, title, message, duration = 5000) => {
    setAlert({ visible: true, type, title, message });

    // Auto-hide after duration
    if (duration > 0) {
      setTimeout(() => {
        setAlert((prev) => ({ ...prev, visible: false }));
      }, duration);
    }
  };

  /**
   * Hide alert message
   */
  const hideAlert = () => {
    setAlert((prev) => ({ ...prev, visible: false }));
  };

  /**
   * Validate form data (UPDATED WITH EXACT BACKEND RANGES)
   */
  const validateForm = () => {
    const newErrors = {};

    // Validate date
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    // Validate required fields (steps and calories)
    if (!formData.steps) {
      newErrors.steps = 'Steps is required';
    } else if (isNaN(formData.steps) || formData.steps < 0) {
      newErrors.steps = 'Please enter a valid number';
    } else if (formData.steps > 100000) {
      newErrors.steps = 'Steps cannot exceed 100,000';
    }

    if (!formData.calories) {
      newErrors.calories = 'Calories is required';
    } else if (isNaN(formData.calories) || formData.calories < 0) {
      newErrors.calories = 'Please enter a valid number';
    } else if (formData.calories > 10000) {
      newErrors.calories = 'Calories cannot exceed 10,000';
    }

    // ⭐ UPDATED: Validate optional fields with EXACT backend schema ranges
    if (
      formData.distance &&
      (isNaN(formData.distance) ||
        formData.distance < 0 ||
        formData.distance > 500)
    ) {
      newErrors.distance = 'Distance must be between 0 and 500 km';
    }

    if (
      formData.activeMinutes &&
      (isNaN(formData.activeMinutes) ||
        formData.activeMinutes < 0 ||
        formData.activeMinutes > 1440)
    ) {
      newErrors.activeMinutes = 'Active minutes must be between 0 and 1440';
    }

    if (
      formData.weight &&
      (isNaN(formData.weight) || formData.weight < 30 || formData.weight > 300)
    ) {
      newErrors.weight = 'Weight must be between 30 and 300 kg';
    }

    // ⭐ UPDATED: Sleep hours now 0-24 (matches backend schema)
    if (
      formData.sleepHours &&
      (isNaN(formData.sleepHours) ||
        formData.sleepHours < 0 ||
        formData.sleepHours > 24)
    ) {
      newErrors.sleepHours = 'Sleep hours must be between 0 and 24';
    }

    // ⚠️ heartRate validation COMPLETELY REMOVED

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Build metrics object from form data (only non-empty fields)
   * ⭐ UPDATED: heartRate explicitly excluded
   */
  const buildMetricsObject = () => {
    const metrics = {
      steps: parseInt(formData.steps) || 0,
      calories: parseInt(formData.calories) || 0,
    };

    // Add optional fields if provided
    if (formData.distance) {
      metrics.distance = parseFloat(formData.distance);
    }

    if (formData.activeMinutes) {
      metrics.activeMinutes = parseInt(formData.activeMinutes);
    }

    if (formData.weight) {
      metrics.weight = parseFloat(formData.weight);
    }

    if (formData.sleepHours) {
      metrics.sleepHours = parseFloat(formData.sleepHours);
    }

    // ⭐ CRITICAL: heartRate is NEVER included in metrics object
    // Backend will reject any request containing heartRate or oxygenSaturation
    // This ensures phone-only constraint is enforced

    return metrics;
  };

  /**
   * Reset form to initial state
   * ⭐ UPDATED: heartRate removed from reset
   */
  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      steps: '',
      calories: '',
      distance: '',
      activeMinutes: '',
      weight: '',
      sleepHours: '',
      // heartRate: '', // ⚠️ REMOVED
    });
    setErrors({});
  };

  // ===== EVENT HANDLERS =====

  /**
   * Handle input field changes
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form data
    if (!validateForm()) {
      showAlert(
        'error',
        'Validation Error',
        'Please fix the errors above and try again.'
      );
      return;
    }

    setIsLoading(true);

    try {
      // Build metrics object (phone-only metrics)
      const metrics = buildMetricsObject();

      // Call metricsService to add metric
      const result = await metricsService.addMetric(formData.date, metrics);

      if (result.success) {
        // Show success alert
        showAlert(
          'success',
          'Success! 🎉',
          `Metrics recorded for ${formData.date}`,
          4000
        );

        // Reset form
        resetForm();

        // Call onSuccess callback if provided
        if (onSuccess && typeof onSuccess === 'function') {
          onSuccess(result.data);
        }
      } else {
        // Show error alert
        showAlert(
          'error',
          'Error',
          result.message || 'Failed to save metrics'
        );

        // Call onError callback if provided
        if (onError && typeof onError === 'function') {
          onError(result);
        }
      }
    } catch (error) {
      // Show error alert
      showAlert(
        'error',
        'Error',
        error.message || 'An error occurred while saving metrics'
      );

      // Call onError callback if provided
      if (onError && typeof onError === 'function') {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Set date to today
   */
  const setDateToToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData((prev) => ({
      ...prev,
      date: today,
    }));

    if (errors.date) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.date;
        return newErrors;
      });
    }
  };

  // ===== RENDER =====
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* ===== HEADER ===== */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          📊 Track Daily Metrics
        </h2>
        <p className="text-gray-600">
          Track your daily health metrics to monitor progress
        </p>
      </div>

      {/* ⭐ NEW: PHONE-ONLY INFORMATIONAL CALLOUT */}
      <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-500 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              📱 Phone-Only Metrics Supported
            </h3>
            <div className="mt-1 text-sm text-blue-700">
              <p>
                Only metrics collected by your Android phone are supported.
                Wearable-exclusive data like <strong>heart rate</strong> and{' '}
                <strong>blood oxygen</strong> is not available without a
                smartwatch or fitness band.
              </p>
              <p className="mt-2">
                ✅ Supported: Steps, calories, distance, active minutes, weight,
                sleep hours
              </p>
              <p className="mt-1">
                ❌ Not supported: Heart rate, blood oxygen (requires wearable
                device)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== ALERT MESSAGE ===== */}
      {alert.visible && (
        <div className="mb-6">
          <Alert
            type={alert.type}
            title={alert.title}
            message={alert.message}
            onClose={hideAlert}
          />
        </div>
      )}

      {/* ===== FORM ===== */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date Picker */}
        <div>
          <label
            htmlFor="date"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Date <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              max={new Date().toISOString().split('T')[0]}
              className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.date ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            <button
              type="button"
              onClick={setDateToToday}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
            >
              Today
            </button>
          </div>
          {errors.date && (
            <p className="mt-1 text-sm text-red-600">{errors.date}</p>
          )}
        </div>

        {/* Metric Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {metricFields.map((field) => (
            <div key={field.name}>
              <label
                htmlFor={field.name}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {field.icon} {field.label}{' '}
                {field.required && <span className="text-red-500">*</span>}
                {field.unit && (
                  <span className="text-gray-500 text-xs ml-1">
                    ({field.unit})
                  </span>
                )}
              </label>
              {field.description && (
                <p className="text-xs text-gray-500 mb-1">
                  {field.description}
                </p>
              )}
              <input
                type={field.type}
                id={field.name}
                name={field.name}
                value={formData[field.name]}
                onChange={handleInputChange}
                placeholder={field.placeholder}
                step={field.step || 1}
                min={field.min}
                max={field.max}
                required={field.required}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors[field.name] ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors[field.name] && (
                <p className="mt-1 text-sm text-red-600">
                  {errors[field.name]}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Form Actions */}
        <div className="flex gap-4 pt-4">
          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Saving...' : 'Save Metrics'}
          </Button>
          <button
            type="button"
            onClick={resetForm}
            disabled={isLoading}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset
          </button>
        </div>
      </form>

      {/* ===== HELPFUL TIP ===== */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          💡 <strong>Tip:</strong> Log your metrics daily for better health
          insights and progress tracking. Connect Google Fit for automatic sync!
        </p>
      </div>
    </div>
  );
};

MetricsForm.propTypes = {
  onSuccess: PropTypes.func,
  onError: PropTypes.func,
};

export default MetricsForm;
