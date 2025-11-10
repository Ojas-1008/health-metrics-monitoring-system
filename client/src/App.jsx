import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';

// Components
import PrivateRoute from './components/common/PrivateRoute';
import GoogleFitTest from './components/test/GoogleFitTest';

// Styles
import './App.css';

/**
 * ============================================
 * APP COMPONENT
 * ============================================
 * 
 * Main application component with routing configuration
 * 
 * Route Structure:
 * - Public routes: /, /login, /register
 * - Protected routes: /dashboard, /profile, /settings
 * - 404 route: * (catch-all)
 * 
 * Features:
 * - React Router v7 configuration
 * - Route protection with PrivateRoute
 * - Auto-redirect for authenticated users on auth pages
 * - Clean URL structure
 */

/**
 * AuthRoute Component
 * Redirects to dashboard if user is already authenticated
 * Used for /login and /register routes
 */
function AuthRoute({ children }) {
  const { isAuthenticated, initialized } = useAuth();

  // Wait for auth initialization
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Not authenticated, show login/register page
  return children;
}

/**
 * Main App Component
 */
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
        {/* ===== PUBLIC ROUTES ===== */}
        
        {/* Home Page */}
        <Route path="/" element={<Home />} />

        {/* ===== AUTH ROUTES (redirect if logged in) ===== */}
        
        {/* Login Page */}
        <Route
          path="/login"
          element={
            <AuthRoute>
              <Login />
            </AuthRoute>
          }
        />

        {/* Register Page */}
        <Route
          path="/register"
          element={
            <AuthRoute>
              <Register />
            </AuthRoute>
          }
        />

        {/* ===== PROTECTED ROUTES (require authentication) ===== */}
        
        {/* Dashboard Page */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* Profile Page (placeholder for now) */}
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <div className="p-8 text-center">
                <h1 className="text-3xl font-bold">Profile Page</h1>
                <p className="text-gray-600 mt-4">Coming soon!</p>
              </div>
            </PrivateRoute>
          }
        />

        {/* Settings Page (placeholder for now) */}
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <div className="p-8 text-center">
                <h1 className="text-3xl font-bold">Settings Page</h1>
                <p className="text-gray-600 mt-4">Coming soon!</p>
              </div>
            </PrivateRoute>
          }
        />

        {/* ===== TEST ROUTES ===== */}
        
        {/* Google Fit Test Page */}
        <Route
          path="/test/googlefit"
          element={
            <PrivateRoute>
              <GoogleFitTest />
            </PrivateRoute>
          }
        />

        {/* ===== 404 NOT FOUND ===== */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
