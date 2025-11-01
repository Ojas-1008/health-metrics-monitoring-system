/**
 * ============================================
 * LOGIN PAGE
 * ============================================
 * 
 * User login page with form validation and error handling
 * 
 * Features:
 * - Email and password validation
 * - Integration with AuthContext
 * - Error/success alerts
 * - Loading states
 * - Remember me option
 * - Forgot password link
 * - Link to registration
 * - Responsive design
 * - Auto-redirect if authenticated
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Alert from '../components/common/Alert';
import { validateEmail } from '../utils/validation';

/**
 * Login Page Component
 */
function Login() {
  const navigate = useNavigate();
  const { login, loading, isAuthenticated } = useAuth();

  // ===== FORM STATE =====
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });

  const [touched, setTouched] = useState({
    email: false,
    password: false,
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
      case 'email': {
        const emailResult = validateEmail(value);
        error = emailResult.isValid ? '' : emailResult.message;
        break;
      }

      case 'password': {
        if (!value || value.trim() === '') {
          error = 'Password is required';
        }
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
    const { name, value, type, checked } = e.target;

    // Update form data (handle checkbox differently)
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Validate field if already touched (skip checkbox)
    if (type !== 'checkbox' && touched[name]) {
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
      email: true,
      password: true,
    });

    // Validate all fields
    const newErrors = {
      email: validateField('email', formData.email),
      password: validateField('password', formData.password),
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

    // Call login function from AuthContext
    const result = await login({
      email: formData.email,
      password: formData.password,
    });

    if (result.success) {
      // Show success message
      setAlert({
        show: true,
        type: 'success',
        message: 'Login successful! Redirecting...',
      });

      // Redirect to dashboard after 1 second
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } else {
      // Show error message
      setAlert({
        show: true,
        type: 'error',
        message: result.message || 'Login failed. Please check your credentials.',
      });
    }
  };

  /**
   * Handle forgot password click
   */
  const handleForgotPassword = (e) => {
    e.preventDefault();
    // TODO: Implement forgot password functionality in future
    setAlert({
      show: true,
      type: 'info',
      message: 'Forgot password feature coming soon! Please contact support for assistance.',
    });
  };

  // ===== COMPUTED VALUES =====
  
  /**
   * Check if form is valid (all fields filled and no errors)
   */
  const isFormValid =
    formData.email &&
    formData.password &&
    !errors.email &&
    !errors.password;

  // ===== RENDER =====
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-primary-600 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600">
              Sign in to your Health Metrics account
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

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
              autoFocus
            />

            {/* Password Input */}
            <Input
              type="password"
              name="password"
              label="Password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.password ? errors.password : ''}
              required
              disabled={loading}
              autoComplete="current-password"
            />

            {/* Remember Me & Forgot Password Row */}
            <div className="flex items-center justify-between">
              {/* Remember Me Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                />
                <span className="text-sm text-gray-700">Remember me</span>
              </label>

              {/* Forgot Password Link */}
              <a
                href="#"
                onClick={handleForgotPassword}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              disabled={!isFormValid || loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Don&apos;t have an account?
              </span>
            </div>
          </div>

          {/* Link to Register */}
          <div className="text-center">
            <Link
              to="/register"
              className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              Create a new account
            </Link>
          </div>
        </Card>

        {/* Footer - App Info */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600 mb-2">
            Health Metrics Monitoring System
          </p>
          <p className="text-xs text-gray-500">
            Track your wellness journey with precision
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
