import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * ============================================
 * PRIVATE ROUTE COMPONENT (ENHANCED)
 * ============================================
 * 
 * Premium route protection with Modern Glassmorphism loading state
 * 
 * Features:
 * - Beautiful loading animation with gradient effects
 * - Glassmorphism loading screen
 * - Smooth transitions and pulsing animations
 * - Authentication status verification
 * - Preserved redirect functionality
 * - Industry-standard code structure
 */

/**
 * Enhanced Loading Spinner Component
 * Displays premium loading state while verifying authentication
 */
const LoadingSpinner = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[40%] left-[60%] w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Loading Content */}
      <div className="relative z-10 text-center animate-fadeIn">
        {/* Glassmorphism Container */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border border-white/20 max-w-md mx-auto">
          {/* Animated Logo/Icon */}
          <div className="relative inline-block mb-8">
            {/* Pulsing Rings */}
            <div className="absolute inset-0 -m-4">
              <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping"></div>
              <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" style={{ animationDelay: '0.5s' }}></div>
            </div>

            {/* Main Icon */}
            <div className="relative w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 animate-pulse">
              <svg
                className="w-8 h-8 text-white animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          </div>

          {/* Loading Text */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">
            Verifying Session
          </h2>

          <p className="text-gray-600 font-medium mb-6">
            Please wait while we authenticate your access
          </p>

          {/* Progress Dots */}
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="w-2 h-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full animate-pulse"
                style={{ animationDelay: `${index * 0.2}s` }}
              />
            ))}
          </div>
        </div>

        {/* Bottom Text */}
        <p className="mt-8 text-sm text-gray-500 font-medium">
          Health Metrics Monitoring System
        </p>
      </div>
    </div>
  );
};

/**
 * PrivateRoute Component
 * 
 * Wraps protected routes and handles authentication checks
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Protected component to render
 * @param {string} [props.redirectTo='/login'] - Path to redirect if not authenticated
 * 
 * @example
 * <Route
 *   path="/dashboard"
 *   element={
 *     <PrivateRoute>
 *       <Dashboard />
 *     </PrivateRoute>
 *   }
 * />
 */
function PrivateRoute({ children, redirectTo = '/login' }) {
  const { isAuthenticated, initialized } = useAuth();
  const location = useLocation();

  // ===== WAIT FOR AUTH INITIALIZATION =====

  /**
   * Show loading spinner while AuthContext initializes
   * Prevents flash of login page and race conditions
   */
  if (!initialized) {
    return <LoadingSpinner />;
  }

  // ===== CHECK AUTHENTICATION =====

  /**
   * If user is not authenticated, redirect to login page
   * Preserve current location in state for redirect after login
   */
  if (!isAuthenticated) {
    // Development logging
    if (import.meta.env.DEV) {
      console.log(
        '🔒 PrivateRoute: User not authenticated, redirecting to',
        redirectTo,
        'from',
        location.pathname
      );
    }

    return (
      <Navigate
        to={redirectTo}
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // ===== RENDER PROTECTED CONTENT =====

  /**
   * User is authenticated and initialization complete
   * Render the protected component with fade-in animation
   */
  if (import.meta.env.DEV) {
    console.log('✅ PrivateRoute: User authenticated, rendering protected content');
  }

  return (
    <div className="animate-fadeIn">
      {children}
    </div>
  );
}

export default PrivateRoute;
