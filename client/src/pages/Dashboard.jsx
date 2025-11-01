import { useAuth } from '../context/AuthContext';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

/**
 * ============================================
 * DASHBOARD PAGE
 * ============================================
 * 
 * Main dashboard for authenticated users
 * 
 * Features:
 * - Welcome message with user name
 * - Health metrics cards
 * - Quick actions
 * - Responsive grid layout
 */

function Dashboard() {
  const { user } = useAuth();

  // Placeholder metrics data
  const metrics = [
    {
      label: 'Steps Today',
      value: '10,247',
      change: '+15%',
      color: 'primary',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      label: 'Calories Burned',
      value: '1,500',
      change: '+8%',
      color: 'green',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        </svg>
      ),
    },
    {
      label: 'Sleep Duration',
      value: '8h 15m',
      change: 'Good',
      color: 'purple',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ),
    },
    {
      label: 'Water Intake',
      value: '6 / 8',
      change: '75%',
      color: 'blue',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
    },
  ];

  // Color mapping
  const colorClasses = {
    primary: {
      bg: 'bg-primary-100',
      text: 'text-primary-600',
      border: 'border-primary-200',
    },
    green: {
      bg: 'bg-green-100',
      text: 'text-green-600',
      border: 'border-green-200',
    },
    purple: {
      bg: 'bg-purple-100',
      text: 'text-purple-600',
      border: 'border-purple-200',
    },
    blue: {
      bg: 'bg-blue-100',
      text: 'text-blue-600',
      border: 'border-blue-200',
    },
  };

  return (
    <Layout>
      {/* ===== WELCOME SECTION ===== */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name || 'User'}! 👋
        </h1>
        <p className="text-gray-600">
          Here&apos;s your health overview for today
        </p>
      </div>

      {/* ===== METRICS GRID ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => {
          const colors = colorClasses[metric.color];
          return (
            <Card key={index} variant="elevated" hoverable>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mb-2">
                    {metric.value}
                  </p>
                  <p className="text-sm text-green-600">{metric.change}</p>
                </div>
                <div className={`${colors.bg} ${colors.text} p-3 rounded-lg`}>
                  {metric.icon}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ===== QUICK ACTIONS ===== */}
      <Card title="Quick Actions" className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button variant="primary" fullWidth>
            Log Activity
          </Button>
          <Button variant="secondary" fullWidth>
            View Reports
          </Button>
          <Button variant="outline" fullWidth>
            Update Goals
          </Button>
        </div>
      </Card>

      {/* ===== RECENT ACTIVITY ===== */}
      <Card title="Recent Activity" subtitle="Your latest health entries">
        <div className="space-y-4">
          {/* Activity Item 1 */}
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Morning Walk</p>
              <p className="text-sm text-gray-500">5,000 steps · 30 minutes ago</p>
            </div>
            <span className="text-sm font-medium text-primary-600">+250 cal</span>
          </div>

          {/* Activity Item 2 */}
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Breakfast Logged</p>
              <p className="text-sm text-gray-500">2 hours ago</p>
            </div>
            <span className="text-sm font-medium text-green-600">450 cal</span>
          </div>

          {/* Activity Item 3 */}
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Water Intake</p>
              <p className="text-sm text-gray-500">3 hours ago</p>
            </div>
            <span className="text-sm font-medium text-blue-600">250 ml</span>
          </div>
        </div>
      </Card>
    </Layout>
  );
}

export default Dashboard;
