import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import { validateEmail } from '../utils/validation';

/**
 * ============================================
 * LOGIN PAGE (ENHANCED)
 * ============================================
 * 
 * User login page with premium split-screen design
 * 
 * Features:
 * - Split layout with animated branding section
 * - Glassmorphism effects
 * - Interactive form validation
 * - Smooth transitions and animations
 * - Integration with AuthContext
 * - Responsive design (mobile-friendly)
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (type !== 'checkbox' && touched[name]) {
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
      email: true,
      password: true,
    });

    const newErrors = {
      email: validateField('email', formData.email),
      password: validateField('password', formData.password),
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

    const result = await login({
      email: formData.email,
      password: formData.password,
    });

    if (result.success) {
      setAlert({
        show: true,
        type: 'success',
        message: 'Login successful! Redirecting...',
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } else {
      setAlert({
        show: true,
        type: 'error',
        message: result.message || 'Login failed. Please check your credentials.',
      });
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setAlert({
      show: true,
      type: 'info',
      message: 'Forgot password feature coming soon! Please contact support for assistance.',
    });
  };

  const isFormValid =
    formData.email &&
    formData.password &&
    !errors.email &&
    !errors.password;

  // ===== RENDER =====

  return (
    <div className="min-h-screen flex items-stretch bg-white overflow-hidden">
      {/* ===== LEFT SIDE - BRANDING & VISUALS (Desktop) ===== */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white overflow-hidden">
        {/* Animated Background Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-pulse opacity-20"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-pink-400 rounded-full mix-blend-overlay filter blur-3xl animate-pulse opacity-20" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-[40%] left-[60%] w-72 h-72 bg-blue-400 rounded-full mix-blend-overlay filter blur-3xl animate-pulse opacity-20" style={{ animationDelay: '4s' }}></div>
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col justify-center px-16 w-full h-full">
          <div className="animate-slideUp" style={{ animationDelay: '0.1s' }}>
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/20 shadow-xl">
              <span className="text-4xl">📊</span>
            </div>

            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Welcome to <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-cyan-200">
                Health Metrics
              </span>
            </h1>

            <p className="text-xl text-blue-100 mb-10 max-w-md leading-relaxed font-light">
              Your personal command center for wellness tracking. Monitor, analyze, and improve your health journey with precision.
            </p>

            {/* Feature List */}
            <div className="space-y-4">
              {[
                'Real-time health monitoring',
                'Advanced analytics & insights',
                'Goal tracking & achievements'
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3 text-blue-50 bg-white/5 p-3 rounded-lg backdrop-blur-sm border border-white/5 w-fit">
                  <span className="text-green-300">✓</span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="absolute bottom-8 left-16 text-sm text-blue-200/60">
            © {new Date().getFullYear()} Health Metrics System
          </div>
        </div>
      </div>

      {/* ===== RIGHT SIDE - LOGIN FORM ===== */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-12 lg:p-24 bg-gray-50 relative">
        {/* Mobile Background Gradient (visible only on small screens) */}
        <div className="absolute inset-0 lg:hidden bg-gradient-to-br from-blue-600 to-purple-700 opacity-10 z-0"></div>

        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 relative z-10 animate-scaleIn">
          {/* Mobile Logo (visible only on small screens) */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg text-white text-2xl">
              📊
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Health Metrics</h2>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h2>
            <p className="text-gray-600">
              Welcome back! Please enter your details.
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

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
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
              autoFocus
              className="bg-gray-50 focus:bg-white transition-colors"
            />

            {/* Password Input */}
            <div>
              <Input
                type="password"
                name="password"
                label="Password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.password ? errors.password : ''}
                required
                disabled={loading}
                autoComplete="current-password"
                className="bg-gray-50 focus:bg-white transition-colors"
              />
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    disabled={loading}
                    className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-gray-300 bg-white transition-all checked:border-blue-600 checked:bg-blue-600 hover:border-blue-400 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <svg
                    className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
                    width="10"
                    height="8"
                    viewBox="0 0 10 8"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 3.5L3.5 6L9 1"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Remember me</span>
              </label>

              <a
                href="#"
                onClick={handleForgotPassword}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
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
              className="py-3 text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">
                New to Health Metrics?
              </span>
            </div>
          </div>

          {/* Link to Register */}
          <div className="text-center">
            <Link to="/register">
              <Button
                variant="outline"
                fullWidth
                className="py-3 border-2 hover:bg-gray-50 transition-colors"
              >
                Create an account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
