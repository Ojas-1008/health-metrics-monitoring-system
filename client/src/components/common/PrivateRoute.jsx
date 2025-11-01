import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * ============================================
 * PRIVATE ROUTE COMPONENT
 * ============================================
 * 
 * Route protection component for authenticated-only pages
 * 
 * Features:
 * - Checks authentication status from AuthContext
 * - Redirects to login if not authenticated
 * - Preserves intended destination URL (redirect after login)
 * - Shows loading spinner during auth initialization
 * - Prevents flash of protected content
 * - Works with React Router v7
 */

/**
 * Loading Spinner Component
 * Displays while checking authentication status
 */
const LoadingSpinner = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        {/* Animated Spinner */}
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
        
        {/* Loading Text */}
        <p className="text-gray-600 font-medium">Loading...</p>
        <p className="text-sm text-gray-500 mt-2">Please wait while we verify your session</p>
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
 * // In App.jsx or router configuration
 * <Route
 *   path="/dashboard"
 *   element={
 *     <PrivateRoute>
 *       <Dashboard />
 *     </PrivateRoute>
 *   }
 * />
 * 
 * @example
 * // With custom redirect path
 * <Route
 *   path="/admin"
 *   element={
 *     <PrivateRoute redirectTo="/admin-login">
 *       <AdminPanel />
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
   * This prevents:
   * 1. Flash of login page while checking token
   * 2. Unnecessary redirects during initialization
   * 3. Race conditions with token validation
   * 
   * The 'initialized' flag is set to true in AuthContext after:
   * - Token existence check completes
   * - getCurrentUser() API call finishes (if token exists)
   * - Or immediately if no token found
   */
  if (!initialized) {
    return <LoadingSpinner />;
  }

  // ===== CHECK AUTHENTICATION =====
  
  /**
   * If user is not authenticated, redirect to login page
   * 
   * Preserve current location in state for redirect after login
   * This allows returning to the intended page after successful auth
   * 
   * Example flow:
   * 1. User tries to access /dashboard (not logged in)
   * 2. Redirected to /login with state: { from: '/dashboard' }
   * 3. After login, redirect back to /dashboard
   */
  if (!isAuthenticated) {
    // Development logging
    if (import.meta.env.VITE_NODE_ENV === 'development') {
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
   * Render the protected component
   */
  if (import.meta.env.VITE_NODE_ENV === 'development') {
    console.log('✅ PrivateRoute: User authenticated, rendering protected content');
  }

  return children;
}

export default PrivateRoute;
