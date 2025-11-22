/**
 * ============================================
 * GOALS FORM COMPONENT (ENHANCED)
 * ============================================
 *
 * Premium form with Modern Glassmorphism
 *
 * Features:
 * - Glassmorphism input fields with focus glow
 * - Real-time validation with visual feedback
 * - Success checkmarks on valid inputs
 * - Animated error messages
 * - Enhanced buttons with gradients
 * - Beautiful tip card
 * - Smooth transitions
 */

import { useState, useCallback } from 'react';
import * as goalsService from '../../services/goalsService';
import Button from '../common/Button';
import Alert from '../common/Alert';

const GoalsForm = ({
  initialGoals = null,
  onSuccess = null,
  onError = null,
}) => {
  // ===== STATE =====
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
    weightGoal: { min: 30, max: 300, label: 'Weight Goal', unit: 'kg', icon: '⚖️', gradient: 'from-purple-500 to-pink-600' },
    stepGoal: { min: 1000, max: 50000, label: 'Step Goal', unit: 'steps', icon: '👟', gradient: 'from-blue-500 to-indigo-600' },
    sleepGoal: { min: 4, max: 12, label: 'Sleep Goal', unit: 'hours', icon: '😴', gradient: 'from-green-500 to-emerald-600' },
    calorieGoal: { min: 500, max: 5000, label: 'Calorie Goal', unit: 'cal', icon: '🔥', gradient: 'from-orange-500 to-red-600' },
    distanceGoal: { min: 0.5, max: 100, label: 'Distance Goal', unit: 'km', icon: '🏃', gradient: 'from-teal-500 to-cyan-600' },
  };

  // ===== VALIDATION =====
  const validateField = useCallback((name, value) => {
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

  const validateForm = useCallback(() => {
    const newErrors = {};

    const hasAnyGoal = Object.entries(formData).some(
      ([, value]) => value !== '' && value !== null && value !== undefined
    );

    if (!hasAnyGoal) {
      return { hasErrors: true, message: 'Please set at least one goal' };
    }

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
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? '' : Number(value),
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

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
      const goalsToSave = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          goalsToSave[key] = value;
        }
      });

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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Alert */}
      {alert.visible && (
        <div className="animate-slideDown">
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert((prev) => ({ ...prev, visible: false }))}
            dismissible
          />
        </div>
      )}

      {/* Form Fields */}
      {Object.entries(validationRules).map(([fieldName, rule]) => (
        <div key={fieldName}>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            <span className="text-xl mr-2">{rule.icon}</span>
            {rule.label}
            <span className="text-gray-600 text-xs ml-2 font-normal">
              ({rule.unit})
            </span>
          </label>

          <div className="relative">
            <input
              type="number"
              name={fieldName}
              value={formData[fieldName]}
              onChange={handleInputChange}
              placeholder={`e.g., ${fieldName === 'stepGoal' ? '10000' : fieldName === 'weightGoal' ? '70' : fieldName === 'sleepGoal' ? '8' : fieldName === 'calorieGoal' ? '2000' : '5'}`}
              min={rule.min}
              max={rule.max}
              step={fieldName === 'stepGoal' || fieldName === 'calorieGoal' ? (fieldName === 'stepGoal' ? '100' : '50') : '0.5'}
              className={`
                w-full px-4 py-3
                bg-white/80 backdrop-blur-sm
                border-2 rounded-xl
                font-medium text-gray-900
                transition-all duration-300
                focus:outline-none focus:ring-4 focus:shadow-lg
                placeholder:text-gray-400 placeholder:font-normal
                ${errors[fieldName]
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-200/30'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200/30'
                }
              `}
            />

            {/* Success Checkmark */}
            {formData[fieldName] && !errors[fieldName] && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-xl animate-scaleIn">
                ✓
              </span>
            )}
          </div>

          <p className="text-xs text-gray-600 mt-1.5 font-medium">
            Range: {rule.min.toLocaleString()} - {rule.max.toLocaleString()} {rule.unit}
          </p>

          {errors[fieldName] && (
            <p className="mt-2 text-sm text-red-600 font-semibold flex items-center gap-1 animate-slideDown">
              <span>❌</span> {errors[fieldName]}
            </p>
          )}
        </div>
      ))}

      {/* Tip Card */}
      <div className="p-6 bg-gradient-to-br from-blue-50/90 to-indigo-50/90 backdrop-blur-md border-2 border-blue-300/40 rounded-xl shadow-lg">
        <p className="text-sm text-blue-900 font-medium flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <span>
            <strong className="font-bold">Tip:</strong> Leave any fields empty to keep current values. Set at least one goal to save.
          </span>
        </p>
      </div>

      {/* Form Actions */}
      <div className="flex gap-4 pt-6 border-t-2 border-gray-300/40">
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
          loading={isLoading}
          className="flex-1"
        >
          {isLoading ? '💾 Saving...' : '💾 Save Goals'}
        </Button>

        <button
          type="button"
          onClick={handleClear}
          disabled={isLoading}
          className="flex-1 px-8 py-3 bg-white/80 backdrop-blur-sm border-2 border-gray-300 text-gray-800 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-105"
        >
          🔄 Clear
        </button>
      </div>
    </form>
  );
};

export default GoalsForm;
