/**
 * ============================================
 * REGISTER PAGE
 * ============================================
 * 
 * User registration page with complete form validation
 * 
 * Features:
 * - Real-time validation feedback
 * - Password strength indicator
 * - Integration with AuthContext
 * - Error/success alerts
 * - Loading states
 * - Responsive design
 * - Link to login page
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Alert from '../components/common/Alert';
import {
  validateName,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  getPasswordStrength,
} from '../utils/validation';

/**
 * Password Strength Indicator Component
 * @param {Object} props - Component props
 * @param {string} props.password - Password to check strength
 */
const PasswordStrengthIndicator = ({ password }) => {
  const { strength, color, percentage } = getPasswordStrength(password);

  if (!password) return null;

  const colorClasses = {
    gray: 'bg-gray-300',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
  };

  const textColorClasses = {
    gray: 'text-gray-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    green: 'text-green-600',
  };

  return (
    <div className="mt-2">
      {/* Strength Bar */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Strength Label */}
      <p className={`text-sm mt-1 ${textColorClasses[color]} capitalize`}>
        Password strength: {strength}
      </p>
    </div>
  );
};

PasswordStrengthIndicator.propTypes = {
  password: PropTypes.string,
};

/**
 * Register Page Component
 */
function Register() {
  const navigate = useNavigate();
  const { register: registerUser, loading, isAuthenticated } = useAuth();

  // ===== FORM STATE =====
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const [alert, setAlert] = useState({
    show: false,
    type: 'info',
    message: '',
  });

  // ===== REDIRECT IF ALREADY AUTHENTICATED =====
  
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // ===== VALIDATION FUNCTIONS =====
  
  /**
   * Validate individual field
   */
  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'name': {
        const nameResult = validateName(value);
        error = nameResult.isValid ? '' : nameResult.message;
        break;
      }

      case 'email': {
        const emailResult = validateEmail(value);
        error = emailResult.isValid ? '' : emailResult.message;
        break;
      }

      case 'password': {
        const passwordResult = validatePassword(value);
        error = passwordResult.isValid ? '' : passwordResult.message;
        break;
      }

      case 'confirmPassword': {
        const confirmResult = validatePasswordConfirmation(
          formData.password,
          value
        );
        error = confirmResult.isValid ? '' : confirmResult.message;
        break;
      }

      default:
        break;
    }

    return error;
  };

  // ===== EVENT HANDLERS =====
  
  /**
   * Handle input change
   */
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Update form data
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Validate field if already touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }

    // Clear alert on user input
    if (alert.show) {
      setAlert({ show: false, type: 'info', message: '' });
    }
  };

  /**
   * Handle input blur (mark as touched and validate)
   */
  const handleBlur = (e) => {
    const { name, value } = e.target;

    // Mark field as touched
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    // Validate field
    const error = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    // Validate all fields
    const newErrors = {
      name: validateField('name', formData.name),
      email: validateField('email', formData.email),
      password: validateField('password', formData.password),
      confirmPassword: validateField('confirmPassword', formData.confirmPassword),
    };

    setErrors(newErrors);

    // Check if form has errors
    const hasErrors = Object.values(newErrors).some((error) => error !== '');

    if (hasErrors) {
      setAlert({
        show: true,
        type: 'error',
        message: 'Please fix the errors in the form before submitting',
      });
      return;
    }

    // Clear previous alerts
    setAlert({ show: false, type: 'info', message: '' });

    // Call register function from AuthContext
    const result = await registerUser(formData);

    if (result.success) {
      // Show success message
      setAlert({
        show: true,
        type: 'success',
        message: 'Registration successful! Redirecting to dashboard...',
      });

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } else {
      // Show error message
      setAlert({
        show: true,
        type: 'error',
        message: result.message || 'Registration failed. Please try again.',
      });
    }
  };

  // ===== COMPUTED VALUES =====
  
  /**
   * Check if form is valid (all fields filled and no errors)
   */
  const isFormValid =
    formData.name &&
    formData.email &&
    formData.password &&
    formData.confirmPassword &&
    !errors.name &&
    !errors.email &&
    !errors.password &&
    !errors.confirmPassword;

  // ===== RENDER =====
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-primary-600 mb-2">
              Create Account
            </h1>
            <p className="text-gray-600">
              Join Health Metrics to track your wellness journey
            </p>
          </div>

          {/* Alert */}
          {alert.show && (
            <div className="mb-6">
              <Alert
                type={alert.type}
                message={alert.message}
                onClose={() => setAlert({ show: false, type: 'info', message: '' })}
              />
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Input */}
            <Input
              type="text"
              name="name"
              label="Full Name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.name ? errors.name : ''}
              required
              disabled={loading}
              autoComplete="name"
            />

            {/* Email Input */}
            <Input
              type="email"
              name="email"
              label="Email Address"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.email ? errors.email : ''}
              required
              disabled={loading}
              autoComplete="email"
            />

            {/* Password Input */}
            <div>
              <Input
                type="password"
                name="password"
                label="Password"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.password ? errors.password : ''}
                required
                disabled={loading}
                autoComplete="new-password"
              />
              {/* Password Strength Indicator */}
              <PasswordStrengthIndicator password={formData.password} />
            </div>

            {/* Confirm Password Input */}
            <Input
              type="password"
              name="confirmPassword"
              label="Confirm Password"
              placeholder="Re-enter password"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.confirmPassword ? errors.confirmPassword : ''}
              required
              disabled={loading}
              autoComplete="new-password"
            />

            {/* Password Requirements */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Password must contain:
              </p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className="flex items-center gap-2">
                  <span className="text-gray-400">•</span>
                  At least 8 characters
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gray-400">•</span>
                  One uppercase letter (A-Z)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gray-400">•</span>
                  One number (0-9)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gray-400">•</span>
                  One special character (!@#$%^&*)
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              disabled={!isFormValid || loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Already have an account?
              </span>
            </div>
          </div>

          {/* Link to Login */}
          <div className="text-center">
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              Sign in to your account
            </Link>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-4">
          By creating an account, you agree to our{' '}
          <a href="#" className="text-primary-600 hover:text-primary-700">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-primary-600 hover:text-primary-700">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}

export default Register;
