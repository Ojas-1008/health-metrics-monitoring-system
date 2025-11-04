/**
 * ============================================
 * METRICS INPUT FORM COMPONENT
 * ============================================
 *
 * Purpose: Allows users to input/track daily health metrics
 *
 * Features:
 * - Date picker (defaults to today)
 * - Metric input fields with validation
 * - Real-time error feedback
 * - Loading state during submission
 * - Success/error notifications
 * - Form reset after successful submission
 * - Responsive Tailwind design
 *
 * Integration:
 * - Uses metricsService for API calls
 * - Alerts for user feedback
 * - Tailwind CSS for styling
 */

import { useState } from 'react';
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

  // Form data state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0], // Today's date (YYYY-MM-DD)
    steps: '',
    calories: '',
    distance: '',
    activeMinutes: '',
    weight: '',
    sleepHours: '',
    heartRate: '',
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

  // ===== FIELD CONFIGURATION =====

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
    },
    {
      name: 'sleepHours',
      label: 'Sleep Hours',
      type: 'number',
      placeholder: 'e.g., 7.5',
      step: 0.5,
      unit: 'hours',
      min: 0,
      max: 16,
      required: false,
      icon: '😴',
    },
    {
      name: 'heartRate',
      label: 'Heart Rate',
      type: 'number',
      placeholder: 'e.g., 72',
      unit: 'bpm',
      min: 30,
      max: 200,
      required: false,
      icon: '❤️',
    },
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
   * Validate form data
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

    // Validate optional fields (only if provided)
    if (formData.distance && (isNaN(formData.distance) || formData.distance < 0 || formData.distance > 500)) {
      newErrors.distance = 'Distance must be between 0 and 500 km';
    }

    if (
      formData.activeMinutes &&
      (isNaN(formData.activeMinutes) || formData.activeMinutes < 0 || formData.activeMinutes > 1440)
    ) {
      newErrors.activeMinutes = 'Active minutes must be between 0 and 1440';
    }

    if (formData.weight && (isNaN(formData.weight) || formData.weight < 30 || formData.weight > 300)) {
      newErrors.weight = 'Weight must be between 30 and 300 kg';
    }

    if (
      formData.sleepHours &&
      (isNaN(formData.sleepHours) || formData.sleepHours < 0 || formData.sleepHours > 16)
    ) {
      newErrors.sleepHours = 'Sleep hours must be between 0 and 16';
    }

    if (formData.heartRate && (isNaN(formData.heartRate) || formData.heartRate < 30 || formData.heartRate > 200)) {
      newErrors.heartRate = 'Heart rate must be between 30 and 200 bpm';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Build metrics object from form data (only non-empty fields)
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

    // Note: heartRate is not in the backend HealthMetric schema
    // It will be ignored by the backend validation
    // Keeping it in the form for future extensibility

    return metrics;
  };

  /**
   * Reset form to initial state
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
      heartRate: '',
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
      showAlert('error', 'Validation Error', 'Please fix the errors above and try again.');
      return;
    }

    setIsLoading(true);

    try {
      // Build metrics object
      const metrics = buildMetricsObject();

      // Call metricsService to add metric
      const result = await metricsService.addMetric(formData.date, metrics);

      if (result.success) {
        // Show success alert
        showAlert('success', 'Success! 🎉', `Metrics recorded for ${formData.date}`, 4000);

        // Reset form
        resetForm();

        // Call onSuccess callback if provided
        if (onSuccess && typeof onSuccess === 'function') {
          onSuccess(result.data);
        }
      } else {
        // Show error alert
        showAlert('error', 'Error', result.message || 'Failed to save metrics');

        // Call onError callback if provided
        if (onError && typeof onError === 'function') {
          onError(result);
        }
      }
    } catch (error) {
      // Show error alert
      showAlert('error', 'Error', error.message || 'An error occurred while saving metrics');

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
    setFormData((prev) => ({ ...prev, date: today }));
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
    <div className="w-full">
      {/* Alert Container */}
      {alert.visible && (
        <div className="mb-6">
          <Alert type={alert.type} title={alert.title} message={alert.message} onClose={hideAlert} dismissible />
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        {/* Form Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Log Health Metrics</h2>
          <p className="text-gray-600 mt-1">Track your daily health metrics to monitor progress</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Section */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-800">
              Date <span className="text-red-500">*</span>
            </label>

            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  max={new Date().toISOString().split('T')[0]}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
                    errors.date
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />

                {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
              </div>

              <Button
                type="button"
                onClick={setDateToToday}
                variant="secondary"
                size="sm"
                className="whitespace-nowrap"
              >
                Today
              </Button>
            </div>
          </div>

          {/* Required Fields Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-red-500">*</span>Required Fields
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {metricFields
                .filter((field) => field.required)
                .map((field) => (
                  <div key={field.name} className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <span>{field.icon}</span>
                      {field.label}
                      <span className="text-gray-500 text-xs">({field.unit})</span>
                    </label>

                    <input
                      type={field.type}
                      name={field.name}
                      value={formData[field.name]}
                      onChange={handleInputChange}
                      placeholder={field.placeholder}
                      min={field.min}
                      max={field.max}
                      step={field.step || 1}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
                        errors[field.name]
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />

                    {errors[field.name] && (
                      <p className="text-red-500 text-sm">{errors[field.name]}</p>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Optional Fields Section */}
          <div className="space-y-4">
            <details className="group">
              <summary className="cursor-pointer text-lg font-semibold text-gray-800 flex items-center gap-2 select-none hover:text-blue-600 transition">
                <span className="group-open:rotate-90 transition duration-200">▶</span>
                Optional Fields
              </summary>

              <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                {metricFields
                  .filter((field) => !field.required)
                  .map((field) => (
                    <div key={field.name} className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <span>{field.icon}</span>
                        {field.label}
                        <span className="text-gray-500 text-xs">({field.unit})</span>
                      </label>

                      <input
                        type={field.type}
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleInputChange}
                        placeholder={field.placeholder}
                        min={field.min}
                        max={field.max}
                        step={field.step || 1}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
                          errors[field.name]
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      />

                      {errors[field.name] && (
                        <p className="text-red-500 text-sm">{errors[field.name]}</p>
                      )}
                    </div>
                  ))}
              </div>
            </details>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                '✓ Save Metrics'
              )}
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={resetForm}
              disabled={isLoading}
            >
              Reset
            </Button>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">💡 Tip:</span> Log your metrics daily for better health insights and progress tracking.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MetricsForm;
