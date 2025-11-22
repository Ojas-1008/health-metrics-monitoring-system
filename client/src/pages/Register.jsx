import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import {
  validateName,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  getPasswordStrength,
} from '../utils/validation';

/**
 * ============================================
 * REGISTER PAGE (ENHANCED)
 * ============================================
 * 
 * User registration page with premium split-screen design
 * 
 * Features:
 * - Split layout with animated branding section
 * - Glassmorphism effects
 * - Interactive form validation
 * - Real-time password strength indicator
 * - Smooth transitions and animations
 * - Integration with AuthContext
 * - Responsive design (mobile-friendly)
 */

/**
 * Password Strength Indicator Component
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
    <div className="mt-2 animate-fadeIn">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-500">Strength</span>
        <span className={`text-xs font-medium ${textColorClasses[color]} capitalize`}>
          {strength}
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ease-out ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

PasswordStrengthIndicator.propTypes = {
  password: PropTypes.string,
};

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

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }

    if (alert.show) {
      setAlert({ show: false, type: 'info', message: '' });
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    const error = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    const newErrors = {
      name: validateField('name', formData.name),
      email: validateField('email', formData.email),
      password: validateField('password', formData.password),
      confirmPassword: validateField('confirmPassword', formData.confirmPassword),
    };

    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some((error) => error !== '');

    if (hasErrors) {
      setAlert({
        show: true,
        type: 'error',
        message: 'Please fix the errors in the form before submitting',
      });
      return;
    }

    setAlert({ show: false, type: 'info', message: '' });

    const result = await registerUser(formData);

    if (result.success) {
      setAlert({
        show: true,
        type: 'success',
        message: 'Registration successful! Redirecting to dashboard...',
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } else {
      setAlert({
        show: true,
        type: 'error',
        message: result.message || 'Registration failed. Please try again.',
      });
    }
  };

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
    <div className="min-h-screen flex items-stretch bg-white overflow-hidden">
      {/* ===== LEFT SIDE - BRANDING & VISUALS (Desktop) ===== */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-purple-700 via-indigo-600 to-blue-600 text-white overflow-hidden">
        {/* Animated Background Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-pulse opacity-20"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-cyan-400 rounded-full mix-blend-overlay filter blur-3xl animate-pulse opacity-20" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-[40%] right-[60%] w-72 h-72 bg-purple-400 rounded-full mix-blend-overlay filter blur-3xl animate-pulse opacity-20" style={{ animationDelay: '4s' }}></div>
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col justify-center px-16 w-full h-full">
          <div className="animate-slideUp" style={{ animationDelay: '0.1s' }}>
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/20 shadow-xl">
              <span className="text-4xl">🚀</span>
            </div>

            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Start Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200">
                Wellness Journey
              </span>
            </h1>

            <p className="text-xl text-purple-100 mb-10 max-w-md leading-relaxed font-light">
              Join thousands of users transforming their lives. Track, analyze, and improve your health with our comprehensive platform.
            </p>

            {/* Testimonial Card */}
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/10 max-w-md">
              <div className="flex gap-1 mb-3 text-yellow-300">
                {'★★★★★'.split('').map((star, i) => <span key={i}>{star}</span>)}
              </div>
              <p className="text-blue-50 italic mb-4">
                "This platform completely changed how I view my daily health habits. The insights are incredible!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-400 rounded-full flex items-center justify-center text-xs font-bold">JD</div>
                <div className="text-sm font-medium">Jane Doe, Fitness Enthusiast</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="absolute bottom-8 left-16 text-sm text-purple-200/60">
            © {new Date().getFullYear()} Health Metrics System
          </div>
        </div>
      </div>

      {/* ===== RIGHT SIDE - REGISTER FORM ===== */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-12 lg:p-16 bg-gray-50 relative overflow-y-auto">
        {/* Mobile Background Gradient (visible only on small screens) */}
        <div className="absolute inset-0 lg:hidden bg-gradient-to-br from-purple-600 to-blue-700 opacity-10 z-0"></div>

        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 relative z-10 animate-scaleIn my-8">
          {/* Mobile Logo (visible only on small screens) */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg text-white text-2xl">
              🚀
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Health Metrics</h2>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
            <p className="text-gray-600">
              It's free and takes less than a minute.
            </p>
          </div>

          {/* Alert */}
          {alert.show && (
            <div className="mb-6 animate-slideDown">
              <Alert
                type={alert.type}
                message={alert.message}
                onClose={() => setAlert({ show: false, type: 'info', message: '' })}
              />
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
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
              className="bg-gray-50 focus:bg-white transition-colors"
            />

            {/* Email Input */}
            <Input
              type="email"
              name="email"
              label="Email Address"
              placeholder="name@company.com"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.email ? errors.email : ''}
              required
              disabled={loading}
              autoComplete="email"
              className="bg-gray-50 focus:bg-white transition-colors"
            />

            {/* Password Input */}
            <div>
              <Input
                type="password"
                name="password"
                label="Password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.password ? errors.password : ''}
                required
                disabled={loading}
                autoComplete="new-password"
                className="bg-gray-50 focus:bg-white transition-colors"
              />
              {/* Password Strength Indicator */}
              <PasswordStrengthIndicator password={formData.password} />
            </div>

            {/* Confirm Password Input */}
            <Input
              type="password"
              name="confirmPassword"
              label="Confirm Password"
              placeholder="Repeat your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.confirmPassword ? errors.confirmPassword : ''}
              required
              disabled={loading}
              autoComplete="new-password"
              className="bg-gray-50 focus:bg-white transition-colors"
            />

            {/* Password Requirements */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-xs text-blue-800">
              <p className="font-semibold mb-2">Password requirements:</p>
              <ul className="space-y-1 list-disc list-inside text-blue-700/80">
                <li>At least 8 characters long</li>
                <li>One uppercase letter & one number</li>
                <li>One special character (!@#$%^&*)</li>
              </ul>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              disabled={!isFormValid || loading}
              className="py-3 text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 border-none"
            >
              {loading ? 'Creating Account...' : 'Create Free Account'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">
                Already have an account?
              </span>
            </div>
          </div>

          {/* Link to Login */}
          <div className="text-center">
            <Link to="/login">
              <Button
                variant="outline"
                fullWidth
                className="py-3 border-2 hover:bg-gray-50 transition-colors"
              >
                Sign in instead
              </Button>
            </Link>
          </div>

          {/* Terms Footer */}
          <p className="text-center text-xs text-gray-500 mt-6 leading-relaxed">
            By creating an account, you agree to our{' '}
            <a href="#" className="text-purple-600 hover:text-purple-700 font-medium hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-purple-600 hover:text-purple-700 font-medium hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
