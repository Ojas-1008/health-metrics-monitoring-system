/**
 * ============================================
 * METRICS INPUT FORM COMPONENT (ENHANCED)
 * ============================================
 *
 * Premium form with Modern Glassmorphism
 *
 * Features:
 * - Glassmorphism design with gradients
 * - Animated input fields with focus glow
 * - Enhanced validation with visual feedback
 * - Beautiful success/error alerts
 * - Loading state with spinner animation
 * - Responsive grid layout
 * - Phone-only metric constraints
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import * as metricsService from '../../services/metricsService';
import Button from '../common/Button';
import Alert from '../common/Alert';

/**
 * MetricsForm Component
 */
const MetricsForm = ({ onSuccess, onError }) => {
  // ===== STATE =====
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    steps: '',
    calories: '',
    distance: '',
    activeMinutes: '',
    weight: '',
    sleepHours: '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({
    visible: false,
    type: 'info',
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
      description: 'Tracked by phone accelerometer',
      gradient: 'from-blue-500 to-indigo-600',
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
      gradient: 'from-orange-500 to-red-600',
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
      gradient: 'from-green-500 to-emerald-600',
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
      gradient: 'from-teal-500 to-cyan-600',
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
      gradient: 'from-purple-500 to-pink-600',
    },
    {
      name: 'sleepHours',
      label: 'Sleep Hours',
      type: 'number',
      placeholder: 'e.g., 7.5',
      step: 0.5,
      unit: 'hours',
      min: 0,
      max: 24,
      required: false,
      icon: '😴',
      description: 'Manual entry or phone tracking',
      gradient: 'from-indigo-500 to-purple-600',
    },
  ];

  // ===== UTILITY FUNCTIONS =====

  const showAlert = (type, title, message, duration = 5000) => {
    setAlert({ visible: true, type, title, message });
    if (duration > 0) {
      setTimeout(() => {
        setAlert((prev) => ({ ...prev, visible: false }));
      }, duration);
    }
  };

  const hideAlert = () => {
    setAlert((prev) => ({ ...prev, visible: false }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

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

    if (formData.distance && (isNaN(formData.distance) || formData.distance < 0 || formData.distance > 500)) {
      newErrors.distance = 'Distance must be between 0 and 500 km';
    }

    if (formData.activeMinutes && (isNaN(formData.activeMinutes) || formData.activeMinutes < 0 || formData.activeMinutes > 1440)) {
      newErrors.activeMinutes = 'Active minutes must be between 0 and 1440';
    }

    if (formData.weight && (isNaN(formData.weight) || formData.weight < 30 || formData.weight > 300)) {
      newErrors.weight = 'Weight must be between 30 and 300 kg';
    }

    if (formData.sleepHours && (isNaN(formData.sleepHours) || formData.sleepHours < 0 || formData.sleepHours > 24)) {
      newErrors.sleepHours = 'Sleep hours must be between 0 and 24';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildMetricsObject = () => {
    const metrics = {
      steps: parseInt(formData.steps) || 0,
      calories: parseInt(formData.calories) || 0,
    };

    if (formData.distance) metrics.distance = parseFloat(formData.distance);
    if (formData.activeMinutes) metrics.activeMinutes = parseInt(formData.activeMinutes);
    if (formData.weight) metrics.weight = parseFloat(formData.weight);
    if (formData.sleepHours) metrics.sleepHours = parseFloat(formData.sleepHours);

    return metrics;
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      steps: '',
      calories: '',
      distance: '',
      activeMinutes: '',
      weight: '',
      sleepHours: '',
    });
    setErrors({});
  };

  // ===== EVENT HANDLERS =====

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showAlert('error', 'Validation Error', 'Please fix the errors above and try again.');
      return;
    }

    setIsLoading(true);

    try {
      const metrics = buildMetricsObject();
      const result = await metricsService.addMetric(formData.date, metrics);

      if (result.success) {
        showAlert('success', 'Success! 🎉', `Metrics recorded for ${formData.date}`, 4000);
        resetForm();
        if (onSuccess && typeof onSuccess === 'function') {
          onSuccess(result.data);
        }
      } else {
        showAlert('error', 'Error', result.message || 'Failed to save metrics');
        if (onError && typeof onError === 'function') {
          onError(result);
        }
      }
    } catch (error) {
      showAlert('error', 'Error', error.message || 'An error occurred while saving metrics');
      if (onError && typeof onError === 'function') {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

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
    <div className="relative max-w-5xl mx-auto p-8 bg-gradient-to-br from-white/90 to-blue-50/90 backdrop-blur-xl rounded-2xl shadow-2xl border-2 border-gray-300/40 overflow-hidden">
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 pointer-events-none"></div>

      {/* Header */}
      <div className="relative mb-8">
        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
          📊 Track Daily Metrics
        </h2>
        <p className="text-gray-700 font-medium">
          Track your daily health metrics to monitor progress
        </p>
      </div>

      {/* Phone-Only Info Card */}
      <div className="relative mb-8 p-6 bg-gradient-to-br from-blue-50/90 to-indigo-50/90 backdrop-blur-md border-2 border-blue-300/40 rounded-xl shadow-lg">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-blue-900 mb-2">
              📱 Phone-Only Metrics Supported
            </h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>
                Only metrics collected by your Android phone are supported. Wearable-exclusive data like <strong>heart rate</strong> and <strong>blood oxygen</strong> is not available without a smartwatch.
              </p>
              <p className="flex items-center gap-2">
                <span className="text-green-600 font-bold">✅</span>
                Steps, calories, distance, active minutes, weight, sleep hours
              </p>
              <p className="flex items-center gap-2">
                <span className="text-red-600 font-bold">❌</span>
                Heart rate, blood oxygen (requires wearable)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert */}
      {alert.visible && (
        <div className="relative mb-8 animate-slideDown">
          <Alert
            type={alert.type}
            title={alert.title}
            message={alert.message}
            onClose={hideAlert}
          />
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="relative space-y-8">
        {/* Date Picker */}
        <div>
          <label htmlFor="date" className="block text-sm font-bold text-gray-900 mb-2">
            📅 Date <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3">
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              max={new Date().toISOString().split('T')[0]}
              className={`
                flex-1 px-4 py-3 
                bg-white/80 backdrop-blur-sm 
                border-2 rounded-xl 
                font-medium text-gray-900
                transition-all duration-300
                focus:outline-none focus:ring-4 focus:shadow-lg
                ${errors.date
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-200/30'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200/30'
                }
              `}
              required
            />
            <button
              type="button"
              onClick={setDateToToday}
              className="px-6 py-3 bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 text-gray-800 font-bold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              Today
            </button>
          </div>
          {errors.date && (
            <p className="mt-2 text-sm text-red-600 font-semibold flex items-center gap-1">
              <span>❌</span> {errors.date}
            </p>
          )}
        </div>

        {/* Metric Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {metricFields.map((field) => (
            <div key={field.name} className="group">
              <label htmlFor={field.name} className="block text-sm font-bold text-gray-900 mb-2">
                <span className="text-xl mr-1">{field.icon}</span>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
                {field.unit && (
                  <span className="text-gray-600 text-xs ml-2 font-normal">
                    ({field.unit})
                  </span>
                )}
              </label>
              {field.description && (
                <p className="text-xs text-gray-600 mb-2 font-medium">
                  {field.description}
                </p>
              )}
              <div className="relative">
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
                  className={`
                    w-full px-4 py-3 
                    bg-white/80 backdrop-blur-sm 
                    border-2 rounded-xl 
                    font-medium text-gray-900
                    transition-all duration-300
                    focus:outline-none focus:ring-4 focus:shadow-lg
                    placeholder:text-gray-400 placeholder:font-normal
                    ${errors[field.name]
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-200/30'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200/30'
                    }
                  `}
                />
                {formData[field.name] && !errors[field.name] && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-xl animate-scaleIn">
                    ✓
                  </span>
                )}
              </div>
              {errors[field.name] && (
                <p className="mt-2 text-sm text-red-600 font-semibold flex items-center gap-1 animate-slideDown">
                  <span>❌</span> {errors[field.name]}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Form Actions */}
        <div className="flex gap-4 pt-6">
          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? '💾 Saving...' : '✨ Save Metrics'}
          </Button>
          <button
            type="button"
            onClick={resetForm}
            disabled={isLoading}
            className="px-8 py-3 bg-white/80 backdrop-blur-sm border-2 border-gray-300 text-gray-800 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-105"
          >
            🔄 Reset
          </button>
        </div>
      </form>

      {/* Helpful Tip */}
      <div className="relative mt-8 p-6 bg-gradient-to-br from-gray-50/90 to-blue-50/90 backdrop-blur-md rounded-xl border-2 border-gray-300/40 shadow-lg">
        <p className="text-sm text-gray-800 font-medium flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <span>
            <strong className="text-gray-900">Tip:</strong> Log your metrics daily for better health insights and progress tracking. Connect Google Fit for automatic sync!
          </span>
        </p>
      </div>

      {/* Bottom Accent Line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50"></div>
    </div>
  );
};

MetricsForm.propTypes = {
  onSuccess: PropTypes.func,
  onError: PropTypes.func,
};

export default MetricsForm;
