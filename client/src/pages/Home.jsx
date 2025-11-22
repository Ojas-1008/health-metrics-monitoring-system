import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/layout/Layout';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

/**
 * ============================================
 * HOME PAGE (ENHANCED)
 * ============================================
 * 
 * Landing page for Health Metrics application
 * 
 * Features:
 * - Immersive Hero section with animated elements
 * - Interactive Features showcase
 * - Live Stats preview
 * - "How it Works" guide
 * - Responsive design with glassmorphism effects
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
      <div className="relative overflow-hidden mb-20 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white shadow-2xl animate-fadeIn">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-pink-400 rounded-full mix-blend-overlay filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10 px-8 py-20 md:py-32 text-center max-w-5xl mx-auto">
          <div className="inline-block px-4 py-1 mb-6 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium animate-slideDown">
            ✨ Your Personal Health Companion
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tight leading-tight">
            Master Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-cyan-200">Health Journey</span>
          </h1>

          <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed font-light">
            Monitor wellness with precision. Set ambitious goals, track real-time progress, and achieve your fitness targets with our comprehensive platform.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slideUp" style={{ animationDelay: '0.2s' }}>
            <Link to="/register">
              <button className="px-8 py-4 bg-white text-blue-700 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 transform">
                Get Started Free
              </button>
            </Link>
            <Link to="/login">
              <button className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white/10 transition-all duration-300 backdrop-blur-sm">
                Sign In
              </button>
            </Link>
          </div>

          {/* Hero Stats Preview */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto animate-slideUp" style={{ animationDelay: '0.4s' }}>
            {[
              { label: 'Active Users', value: '10k+', icon: '👥' },
              { label: 'Metrics Tracked', value: '1M+', icon: '📊' },
              { label: 'Countries', value: '50+', icon: '🌍' },
              { label: 'App Rating', value: '4.9', icon: '⭐' },
            ].map((stat, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 hover:bg-white/20 transition-colors">
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-blue-200 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== FEATURES SECTION ===== */}
      <div className="mb-20">
        <div className="text-center mb-12 animate-slideUp" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Powerful tools designed to help you understand your body and reach your full potential.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1: Track Metrics */}
          <div className="animate-slideUp" style={{ animationDelay: '0.2s' }}>
            <Card className="h-full hover-lift border-t-4 border-t-blue-500">
              <div className="p-2">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 transform rotate-3 transition-transform group-hover:rotate-6">
                  <span className="text-3xl">👟</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Track Metrics
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Monitor steps, calories, sleep, and weight with ease. Get detailed insights into your daily activities and spot trends over time.
                </p>
              </div>
            </Card>
          </div>

          {/* Feature 2: Set Goals */}
          <div className="animate-slideUp" style={{ animationDelay: '0.3s' }}>
            <Card className="h-full hover-lift border-t-4 border-t-green-500">
              <div className="p-2">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6 transform -rotate-3 transition-transform group-hover:-rotate-6">
                  <span className="text-3xl">🎯</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Set Goals
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Define your health objectives and track progress towards achieving them. Stay motivated with visual progress bars and achievements.
                </p>
              </div>
            </Card>
          </div>

          {/* Feature 3: Visualize Data */}
          <div className="animate-slideUp" style={{ animationDelay: '0.4s' }}>
            <Card className="h-full hover-lift border-t-4 border-t-purple-500">
              <div className="p-2">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 transform rotate-3 transition-transform group-hover:rotate-6">
                  <span className="text-3xl">📈</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Visualize Data
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Beautiful interactive charts and graphs help you understand your health trends at a glance. Make data-driven decisions for your health.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* ===== HOW IT WORKS SECTION ===== */}
      <div className="mb-20 bg-gray-50 rounded-3xl p-8 md:p-16 border border-gray-100">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600">
            Start your journey in three simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 z-0"></div>

          {[
            { step: '1', title: 'Create Account', desc: 'Sign up for free in seconds.', color: 'bg-blue-600' },
            { step: '2', title: 'Log Daily', desc: 'Input your health metrics easily.', color: 'bg-indigo-600' },
            { step: '3', title: 'See Results', desc: 'Watch your progress unfold.', color: 'bg-purple-600' },
          ].map((item, index) => (
            <div key={index} className="relative z-10 bg-white p-6 rounded-xl shadow-sm text-center hover-lift border border-gray-100">
              <div className={`w-12 h-12 ${item.color} text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-lg`}>
                {item.step}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ===== STATS SHOWCASE ===== */}
      <div className="mb-20 transform hover:scale-[1.01] transition-transform duration-500">
        <Card className="bg-gradient-to-r from-gray-900 to-blue-900 text-white border-none overflow-hidden relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>

          <div className="relative z-10 text-center py-12 px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-10">
              Join a Community of Achievers
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="p-6 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10">
                <div className="text-5xl font-bold text-blue-400 mb-2 animate-pulse">10K+</div>
                <div className="text-blue-200 font-medium">Daily Steps Avg</div>
              </div>
              <div className="p-6 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10">
                <div className="text-5xl font-bold text-green-400 mb-2 animate-pulse" style={{ animationDelay: '0.5s' }}>2k</div>
                <div className="text-green-200 font-medium">Calories Burned Avg</div>
              </div>
              <div className="p-6 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10">
                <div className="text-5xl font-bold text-purple-400 mb-2 animate-pulse" style={{ animationDelay: '1s' }}>8h</div>
                <div className="text-purple-200 font-medium">Sleep Tracked Avg</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ===== CALL TO ACTION ===== */}
      <div className="text-center py-16 px-4 rounded-3xl bg-gradient-to-b from-blue-50 to-white border border-blue-100">
        <h2 className="text-4xl font-bold text-gray-900 mb-6">
          Ready to Transform Your Health?
        </h2>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Join thousands of users who are already tracking their wellness journey with Health Metrics. It's free, easy, and effective.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register">
            <Button variant="primary" size="large" className="px-10 py-4 text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all">
              Create Free Account
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary" size="large" className="px-10 py-4 text-lg hover:-translate-y-1 transition-all">
              Log In Existing
            </Button>
          </Link>
        </div>
        <p className="mt-8 text-sm text-gray-500">
          No credit card required • Free forever plan available
        </p>
      </div>
    </Layout>
  );
}

export default Home;
