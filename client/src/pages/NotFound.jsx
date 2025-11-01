import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Button from '../components/common/Button';

/**
 * ============================================
 * NOT FOUND PAGE (404)
 * ============================================
 * 
 * Page displayed when user accesses non-existent route
 */

function NotFound() {
  return (
    <Layout>
      <div className="text-center py-16">
        {/* 404 Illustration */}
        <div className="mb-8">
          <svg
            className="w-64 h-64 mx-auto text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Error Message */}
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back on track!
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button variant="primary">
              Go Home
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="outline">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}

export default NotFound;
