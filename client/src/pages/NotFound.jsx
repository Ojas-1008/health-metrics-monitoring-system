import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Button from '../components/common/Button';

/**
 * ============================================
 * NOT FOUND PAGE (404) - ENHANCED
 * ============================================
 * 
 * Visually appealing 404 page with health-themed animations
 */

function NotFound() {
  return (
    <Layout>
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center py-12 px-4">
        {/* Animated Illustration Container */}
        <div className="relative mb-12 animate-fadeIn">
          {/* Background Glow */}
          <div className="absolute inset-0 bg-blue-100 rounded-full filter blur-3xl opacity-50 animate-pulse"></div>

          {/* Main 404 Text with Heartbeat Line */}
          <div className="relative z-10">
            <h1 className="text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 tracking-tighter">
              4
              <span className="inline-block animate-bounce text-blue-500">0</span>
              4
            </h1>

            {/* ECG Line Decoration */}
            <div className="absolute top-1/2 left-0 w-full h-24 -translate-y-1/2 -z-10 opacity-20">
              <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="w-full h-full">
                <path
                  d="M0,75 L100,75 L120,25 L140,125 L160,75 L200,75 L220,25 L240,125 L260,75 L500,75"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-blue-500"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Text Content */}
        <div className="max-w-lg mx-auto animate-slideUp" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Off the Beaten Track?
          </h2>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Looks like you've wandered into uncharted territory. This page seems to be missing from our health records.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/dashboard">
              <Button
                variant="primary"
                size="large"
                className="min-w-[200px] shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
                leftIcon={<span className="text-xl">📊</span>}
              >
                Back to Dashboard
              </Button>
            </Link>

            <Link to="/">
              <Button
                variant="outline"
                size="large"
                className="min-w-[200px] hover:bg-gray-50"
                leftIcon={<span className="text-xl">🏠</span>}
              >
                Return Home
              </Button>
            </Link>
          </div>
        </div>

        {/* Helpful Links */}
        <div className="mt-16 animate-slideUp" style={{ animationDelay: '0.4s' }}>
          <p className="text-sm text-gray-500 mb-4 uppercase tracking-wider font-semibold">
            Popular Destinations
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link to="/login" className="text-blue-600 hover:text-blue-800 hover:underline">
              Login
            </Link>
            <span className="text-gray-300">•</span>
            <Link to="/register" className="text-blue-600 hover:text-blue-800 hover:underline">
              Sign Up
            </Link>
            <span className="text-gray-300">•</span>
            <a href="#" className="text-blue-600 hover:text-blue-800 hover:underline">
              Help Center
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default NotFound;
