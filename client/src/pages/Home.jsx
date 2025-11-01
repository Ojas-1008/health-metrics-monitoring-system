import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/layout/Layout';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

/**
 * ============================================
 * HOME PAGE
 * ============================================
 * 
 * Landing page for Health Metrics application
 * 
 * Features:
 * - Hero section with CTA buttons
 * - Features showcase
 * - Responsive design
 * - Links to login/register
 * - Auto-redirect if already authenticated
 */

function Home() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <Layout>
      {/* ===== HERO SECTION ===== */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Track Your Health Journey
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Monitor your wellness with precision. Set goals, track progress, and achieve
          your fitness targets with our comprehensive health metrics platform.
        </p>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register">
            <Button variant="primary" size="large">
              Get Started Free
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="large">
              Sign In
            </Button>
          </Link>
        </div>
      </div>

      {/* ===== FEATURES SECTION ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {/* Feature 1: Track Metrics */}
        <Card variant="elevated" hoverable>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Track Metrics
            </h3>
            <p className="text-gray-600">
              Monitor steps, calories, sleep, and more. Get insights into your daily activities.
            </p>
          </div>
        </Card>

        {/* Feature 2: Set Goals */}
        <Card variant="elevated" hoverable>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Set Goals
            </h3>
            <p className="text-gray-600">
              Define your health objectives and track progress towards achieving them.
            </p>
          </div>
        </Card>

        {/* Feature 3: Visualize Data */}
        <Card variant="elevated" hoverable>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Visualize Data
            </h3>
            <p className="text-gray-600">
              Beautiful charts and graphs to understand your health trends at a glance.
            </p>
          </div>
        </Card>
      </div>

      {/* ===== STATS SHOWCASE ===== */}
      <Card className="bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
        <div className="text-center py-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Health Metrics at Your Fingertips
          </h2>
          <div className="grid grid-cols-3 gap-8">
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">10K+</div>
              <div className="text-sm text-gray-600">Daily Steps</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">2000</div>
              <div className="text-sm text-gray-600">Calories Burned</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">8h</div>
              <div className="text-sm text-gray-600">Sleep Tracked</div>
            </div>
          </div>
        </div>
      </Card>

      {/* ===== CALL TO ACTION ===== */}
      <div className="text-center mt-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Ready to Start Your Health Journey?
        </h2>
        <p className="text-lg text-gray-600 mb-6">
          Join thousands of users tracking their wellness with Health Metrics
        </p>
        <Link to="/register">
          <Button variant="primary" size="large">
            Create Free Account
          </Button>
        </Link>
      </div>
    </Layout>
  );
}

export default Home;
