/**
 * ============================================
 * SUMMARY STATISTICS COMPONENT
 * ============================================
 *
 * Purpose: Display aggregated health metrics statistics
 *
 * Features:
 * - Weekly/monthly/yearly statistics
 * - Averages and totals
 * - Visual progress indicators
 * - Comparison with previous period
 * - Period selector
 * - Loading state
 * - Error handling
 * - Responsive grid layout
 * - Color-coded metric cards
 *
 * Props:
 * - period: 'week' | 'month' | 'year' (default: 'week')
 * - onPeriodChange: Callback when period changes
 * - showComparison: Show comparison with previous period
 */

import { useState, useEffect } from 'react';
import * as metricsService from '../../services/metricsService';
import * as dateUtils from '../../utils/dateUtils';
import Button from '../common/Button';
import Alert from '../common/Alert';

/**
 * ============================================
 * STAT CARD COMPONENT
 * ============================================
 */

const StatCard = ({
  icon,
  title,
  value,
  unit,
  subtext,
  trend,
  color = 'blue',
  isLoading = false,
}) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      text: 'text-blue-900',
      progress: 'bg-blue-500',
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-600',
      text: 'text-green-900',
      progress: 'bg-green-500',
    },
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      icon: 'text-orange-600',
      text: 'text-orange-900',
      progress: 'bg-orange-500',
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      icon: 'text-purple-600',
      text: 'text-purple-900',
      progress: 'bg-purple-500',
    },
    pink: {
      bg: 'bg-pink-50',
      border: 'border-pink-200',
      icon: 'text-pink-600',
      text: 'text-pink-900',
      progress: 'bg-pink-500',
    },
    indigo: {
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      icon: 'text-indigo-600',
      text: 'text-indigo-900',
      progress: 'bg-indigo-500',
    },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  if (isLoading) {
    return (
      <div className={`${colors.bg} border-2 ${colors.border} rounded-lg p-6 animate-pulse`}>
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
          <div className="w-16 h-6 bg-gray-300 rounded"></div>
        </div>
        <div className="h-8 bg-gray-300 rounded w-24 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-full"></div>
      </div>
    );
  }

  return (
    <div className={`${colors.bg} border-2 ${colors.border} rounded-lg p-6 hover:shadow-md transition-shadow`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className={`${colors.icon} text-3xl`}>{icon}</div>
        {trend && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
              trend.direction === 'up'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            <span>{trend.direction === 'up' ? '↑' : '↓'}</span>
            <span>{trend.percentage}%</span>
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className={`${colors.text} text-sm font-semibold mb-2`}>{title}</h3>

      {/* Value */}
      <div className="mb-3">
        <div className={`${colors.text} text-3xl font-bold`}>
          {typeof value === 'number' ? value.toLocaleString('en-US', { maximumFractionDigits: 1 }) : value}
        </div>
        <div className={`${colors.text} opacity-70 text-sm`}>{unit}</div>
      </div>

      {/* Subtext */}
      {subtext && (
        <div className={`${colors.text} text-xs opacity-75`}>
          {subtext}
        </div>
      )}
    </div>
  );
};

/**
 * ============================================
 * PROGRESS STAT CARD COMPONENT
 * ============================================
 */

const ProgressStatCard = ({
  icon,
  title,
  current,
  goal,
  unit,
  color = 'blue',
  isLoading = false,
}) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
    indigo: 'bg-indigo-500',
  };

  const bgColors = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    orange: 'bg-orange-50 border-orange-200',
    purple: 'bg-purple-50 border-purple-200',
    pink: 'bg-pink-50 border-pink-200',
    indigo: 'bg-indigo-50 border-indigo-200',
  };

  const textColors = {
    blue: 'text-blue-900',
    green: 'text-green-900',
    orange: 'text-orange-900',
    purple: 'text-purple-900',
    pink: 'text-pink-900',
    indigo: 'text-indigo-900',
  };

  const percentage = goal ? Math.min((current / goal) * 100, 100) : 0;

  if (isLoading) {
    return (
      <div className={`${bgColors[color]} border-2 rounded-lg p-6 animate-pulse`}>
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
          <div className="w-16 h-6 bg-gray-300 rounded"></div>
        </div>
        <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-32"></div>
      </div>
    );
  }

  const achieved = percentage >= 100;

  return (
    <div className={`${bgColors[color]} border-2 rounded-lg p-6 hover:shadow-md transition-shadow`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="text-3xl">{icon}</div>
        {achieved && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
            <span>✓</span>
            <span>Goal!</span>
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className={`${textColors[color]} text-sm font-semibold mb-3`}>{title}</h3>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
          <div
            className={`${colorClasses[color]} h-full transition-all duration-500 rounded-full`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-end justify-between">
        <div>
          <div className={`${textColors[color]} text-2xl font-bold`}>
            {current.toLocaleString('en-US', { maximumFractionDigits: 1 })}
          </div>
          <div className={`${textColors[color]} opacity-70 text-xs`}>{unit}</div>
        </div>
        <div className={`${textColors[color]} opacity-75 text-sm font-semibold`}>
          {Math.round(percentage)}% / {goal}
        </div>
      </div>
    </div>
  );
};

/**
 * ============================================
 * SUMMARY STATS COMPONENT
 * ============================================
 */

const SummaryStats = ({
  period = 'week',
  onPeriodChange = null,
  showComparison = true,
}) => {
  // State management
  const [stats, setStats] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(period);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ visible: false, type: 'info', title: '', message: '' });

  // ===== HELPER FUNCTIONS =====

  const showAlert = (type, title, message) => {
    setAlert({ visible: true, type, title, message });
    setTimeout(() => {
      setAlert((prev) => ({ ...prev, visible: false }));
    }, 4000);
  };

  const hideAlert = () => {
    setAlert((prev) => ({ ...prev, visible: false }));
  };

  // Format period label
  const getPeriodLabel = (p) => {
    const labels = {
      week: 'This Week',
      month: 'This Month',
      year: 'This Year',
    };
    return labels[p] || p;
  };

  // ===== DATA FETCHING =====

  const loadStats = async (p) => {
    setIsLoading(true);

    try {
      const result = await metricsService.getMetricsSummary(p);

      if (result.success) {
        setStats(result.data);
      } else {
        showAlert('warning', 'No Data', result.message || `No metrics found for ${getPeriodLabel(p)}`);
        setStats(null);
      }
    } catch (error) {
      showAlert('error', 'Error', error.message || 'Failed to load statistics');
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== EFFECTS =====

  useEffect(() => {
    loadStats(selectedPeriod);
  }, [selectedPeriod]);

  // ===== EVENT HANDLERS =====

  const handlePeriodChange = (newPeriod) => {
    setSelectedPeriod(newPeriod);

    if (onPeriodChange && typeof onPeriodChange === 'function') {
      onPeriodChange(newPeriod);
    }
  };

  // ===== RENDER =====

  return (
    <div className="w-full">
      {/* Alert */}
      {alert.visible && (
        <div className="mb-6">
          <Alert
            type={alert.type}
            title={alert.title}
            message={alert.message}
            onClose={hideAlert}
            dismissible
          />
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Statistics</h2>

        {/* Period Selector */}
        <div className="flex gap-2 flex-wrap">
          {['week', 'month', 'year'].map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedPeriod === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {getPeriodLabel(p)}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {!isLoading && !stats && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-5xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Statistics Available
          </h3>
          <p className="text-gray-600">
            Start logging metrics to see your statistics for {getPeriodLabel(selectedPeriod).toLowerCase()}
          </p>
        </div>
      )}

      {/* Statistics Grid */}
      {stats && (
        <div className="space-y-8">
          {/* Totals Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Totals</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon="👟"
                title="Total Steps"
                value={stats.totalSteps || 0}
                unit="steps"
                color="blue"
                isLoading={isLoading}
              />
              <StatCard
                icon="🔥"
                title="Total Calories"
                value={stats.totalCalories || 0}
                unit="kcal"
                color="orange"
                isLoading={isLoading}
              />
              <StatCard
                icon="🏃"
                title="Total Distance"
                value={stats.totalDistance || 0}
                unit="km"
                color="green"
                isLoading={isLoading}
              />
              <StatCard
                icon="⏱️"
                title="Active Minutes"
                value={stats.totalActiveMinutes || 0}
                unit="minutes"
                color="teal"
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Averages Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Averages</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ProgressStatCard
                icon="👟"
                title="Avg Steps"
                current={stats.avgSteps || 0}
                goal={10000}
                unit="steps"
                color="blue"
                isLoading={isLoading}
              />
              <ProgressStatCard
                icon="🔥"
                title="Avg Calories"
                current={stats.avgCalories || 0}
                goal={2000}
                unit="kcal"
                color="orange"
                isLoading={isLoading}
              />
              <StatCard
                icon="😴"
                title="Avg Sleep"
                value={stats.avgSleepHours || 0}
                unit="hours"
                color="indigo"
                isLoading={isLoading}
                subtext="Goal: 8 hours"
              />
              <StatCard
                icon="⚖️"
                title="Avg Weight"
                value={stats.avgWeight || 0}
                unit="kg"
                color="purple"
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">📅 Period Coverage</h4>
                <p className="text-lg font-bold text-blue-600">
                  {stats.daysTracked || 0} days tracked
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedPeriod === 'week' && 'Out of 7 days'}
                  {selectedPeriod === 'month' && 'Out of ~30 days'}
                  {selectedPeriod === 'year' && 'Out of 365 days'}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">📈 Tracking Rate</h4>
                <p className="text-lg font-bold text-indigo-600">
                  {Math.round(
                    (stats.daysTracked /
                      (selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 365)) *
                      100
                  )}%
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Consistency is key to progress!
                </p>
              </div>
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-xs text-gray-500 text-center pt-4">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-8">
          {/* Totals Skeleton */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Totals</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <StatCard key={i} icon="📊" title="" value={0} unit="" isLoading={true} />
              ))}
            </div>
          </div>

          {/* Averages Skeleton */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Averages</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <ProgressStatCard
                  key={i}
                  icon="📊"
                  title=""
                  current={0}
                  goal={10000}
                  unit=""
                  isLoading={true}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryStats;
