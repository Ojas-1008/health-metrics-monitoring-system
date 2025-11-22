/**
 * ============================================
 * SUMMARY STATISTICS COMPONENT (ENHANCED)
 * ============================================
 *
 * Premium statistics display with Modern Glassmorphism
 *
 * Features:
 * - Glassmorphism stat cards with gradients
 * - Animated progress bars with shimmer
 * - Enhanced period selector with animations
 * - Spark analytics integration indicator
 * - Achievement badges and celebrations
 * - Beautiful loading skeletons
 * - Responsive grid layouts
 */

import { useState, useEffect } from 'react';
import * as metricsService from '../../services/metricsService';
import * as dateUtils from '../../utils/dateUtils';
import Button from '../common/Button';
import Alert from '../common/Alert';

/**
 * ============================================
 * ENHANCED STAT CARD COMPONENT
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
  const colorSchemes = {
    blue: {
      gradient: 'from-blue-500 to-indigo-600',
      bg: 'from-blue-50/80 to-indigo-50/80',
      border: 'border-blue-300/40',
      text: 'text-blue-900',
      iconBg: 'from-blue-500 to-indigo-500',
      glow: 'blue',
    },
    green: {
      gradient: 'from-green-500 to-emerald-600',
      bg: 'from-green-50/80 to-emerald-50/80',
      border: 'border-green-300/40',
      text: 'text-green-900',
      iconBg: 'from-green-500 to-emerald-500',
      glow: 'green',
    },
    orange: {
      gradient: 'from-orange-500 to-red-600',
      bg: 'from-orange-50/80 to-red-50/80',
      border: 'border-orange-300/40',
      text: 'text-orange-900',
      iconBg: 'from-orange-500 to-red-500',
      glow: 'orange',
    },
    purple: {
      gradient: 'from-purple-500 to-pink-600',
      bg: 'from-purple-50/80 to-pink-50/80',
      border: 'border-purple-300/40',
      text: 'text-purple-900',
      iconBg: 'from-purple-500 to-pink-500',
      glow: 'purple',
    },
    pink: {
      gradient: 'from-pink-500 to-rose-600',
      bg: 'from-pink-50/80 to-rose-50/80',
      border: 'border-pink-300/40',
      text: 'text-pink-900',
      iconBg: 'from-pink-500 to-rose-500',
      glow: 'pink',
    },
    indigo: {
      gradient: 'from-indigo-500 to-purple-600',
      bg: 'from-indigo-50/80 to-purple-50/80',
      border: 'border-indigo-300/40',
      text: 'text-indigo-900',
      iconBg: 'from-indigo-500 to-purple-500',
      glow: 'indigo',
    },
    teal: {
      gradient: 'from-teal-500 to-cyan-600',
      bg: 'from-teal-50/80 to-cyan-50/80',
      border: 'border-teal-300/40',
      text: 'text-teal-900',
      iconBg: 'from-teal-500 to-cyan-500',
      glow: 'teal',
    },
  };

  const colors = colorSchemes[color] || colorSchemes.blue;

  if (isLoading) {
    return (
      <div className={`bg-gradient-to-br ${colors.bg} backdrop-blur-md border-2 ${colors.border} rounded-2xl p-6 animate-pulse shadow-lg`}>
        <div className="flex items-start justify-between mb-4">
          <div className="w-14 h-14 bg-gray-300 rounded-xl"></div>
          <div className="w-20 h-6 bg-gray-300 rounded-full"></div>
        </div>
        <div className="h-8 bg-gray-300 rounded w-28 mb-2"></div>
        <div className="h-5 bg-gray-300 rounded w-full"></div>
      </div>
    );
  }

  return (
    <div className={`group relative bg-gradient-to-br ${colors.bg} backdrop-blur-md border-2 ${colors.border} rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden`}>
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 pointer-events-none"></div>

      {/* Header */}
      <div className="relative flex items-start justify-between mb-4">
        {/* Animated Icon */}
        <div className="relative">
          <div className={`absolute inset-0 bg-gradient-to-r ${colors.iconBg} rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity`}></div>
          <div className={`relative w-14 h-14 bg-gradient-to-br ${colors.iconBg} rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
            <span className="text-3xl">{icon}</span>
          </div>
        </div>

        {/* Trend Badge */}
        {trend && (
          <div className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-md
            ${trend.direction === 'up'
              ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-white'
              : 'bg-gradient-to-r from-red-400 to-rose-400 text-white'
            }
          `}>
            <span className="text-base">{trend.direction === 'up' ? '↑' : '↓'}</span>
            <span>{trend.percentage}%</span>
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className={`relative ${colors.text} text-sm font-bold mb-2 tracking-wide uppercase`}>
        {title}
      </h3>

      {/* Value */}
      <div className="relative mb-3">
        <div className={`text-4xl font-extrabold bg-gradient-to-r ${colors.gradient} bg-clip-text text-transparent`}>
          {typeof value === 'number' ? value.toLocaleString('en-US', { maximumFractionDigits: 1 }) : value}
        </div>
        <div className={`${colors.text} opacity-70 text-sm font-semibold mt-1`}>{unit}</div>
      </div>

      {/* Subtext */}
      {subtext && (
        <div className={`relative ${colors.text} text-xs opacity-75 font-medium`}>
          {subtext}
        </div>
      )}

      {/* Bottom Accent Line */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${colors.gradient} opacity-50`}></div>
    </div>
  );
};

/**
 * ============================================
 * ENHANCED PROGRESS STAT CARD COMPONENT
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
  const colorSchemes = {
    blue: {
      gradient: 'from-blue-500 via-indigo-500 to-purple-500',
      bg: 'from-blue-50/80 to-indigo-50/80',
      border: 'border-blue-300/40',
      text: 'text-blue-900',
      iconBg: 'from-blue-500 to-indigo-500',
    },
    green: {
      gradient: 'from-green-500 via-emerald-500 to-teal-500',
      bg: 'from-green-50/80 to-emerald-50/80',
      border: 'border-green-300/40',
      text: 'text-green-900',
      iconBg: 'from-green-500 to-emerald-500',
    },
    orange: {
      gradient: 'from-orange-500 via-red-500 to-pink-500',
      bg: 'from-orange-50/80 to-red-50/80',
      border: 'border-orange-300/40',
      text: 'text-orange-900',
      iconBg: 'from-orange-500 to-red-500',
    },
    purple: {
      gradient: 'from-purple-500 via-pink-500 to-rose-500',
      bg: 'from-purple-50/80 to-pink-50/80',
      border: 'border-purple-300/40',
      text: 'text-purple-900',
      iconBg: 'from-purple-500 to-pink-500',
    },
    teal: {
      gradient: 'from-teal-500 via-cyan-500 to-blue-500',
      bg: 'from-teal-50/80 to-cyan-50/80',
      border: 'border-teal-300/40',
      text: 'text-teal-900',
      iconBg: 'from-teal-500 to-cyan-500',
    },
  };

  const colors = colorSchemes[color] || colorSchemes.blue;
  const percentage = goal ? Math.min((current / goal) * 100, 100) : 0;
  const achieved = percentage >= 100;

  if (isLoading) {
    return (
      <div className={`bg-gradient-to-br ${colors.bg} backdrop-blur-md border-2 ${colors.border} rounded-2xl p-6 animate-pulse shadow-lg`}>
        <div className="flex items-start justify-between mb-4">
          <div className="w-14 h-14 bg-gray-300 rounded-xl"></div>
          <div className="w-20 h-6 bg-gray-300 rounded-full"></div>
        </div>
        <div className="h-4 bg-gray-300 rounded-full w-full mb-3"></div>
        <div className="h-6 bg-gray-300 rounded w-32"></div>
      </div>
    );
  }

  return (
    <div className={`group relative bg-gradient-to-br ${colors.bg} backdrop-blur-md border-2 ${colors.border} rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden`}>
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 pointer-events-none"></div>

      {/* Header */}
      <div className="relative flex items-start justify-between mb-4">
        {/* Animated Icon */}
        <div className="relative">
          <div className={`absolute inset-0 bg-gradient-to-r ${colors.iconBg} rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity`}></div>
          <div className={`relative w-14 h-14 bg-gradient-to-br ${colors.iconBg} rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
            <span className="text-3xl">{icon}</span>
          </div>
        </div>

        {/* Achievement Badge */}
        {achieved && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 text-white text-xs font-bold shadow-md animate-bounce">
            <span>✓</span>
            <span>Goal!</span>
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className={`relative ${colors.text} text-sm font-bold mb-3 tracking-wide uppercase`}>
        {title}
      </h3>

      {/* Progress Bar */}
      <div className="relative mb-4">
        <div className="w-full h-4 bg-gray-200/60 backdrop-blur-sm rounded-full overflow-hidden shadow-inner">
          {/* Progress Fill */}
          <div
            className={`h-full bg-gradient-to-r ${colors.gradient} transition-all duration-700 ease-out relative overflow-hidden`}
            style={{ width: `${percentage}%` }}
          >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
          </div>

          {/* Achievement Glow */}
          {achieved && (
            <div className="absolute inset-0 bg-green-400/20 animate-pulse rounded-full"></div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="relative flex items-end justify-between">
        <div>
          <div className={`text-3xl font-extrabold bg-gradient-to-r ${colors.gradient} bg-clip-text text-transparent`}>
            {current.toLocaleString('en-US', { maximumFractionDigits: 1 })}
          </div>
          <div className={`${colors.text} opacity-70 text-xs font-semibold mt-1`}>{unit}</div>
        </div>
        <div className={`${colors.text} opacity-75 text-sm font-bold`}>
          {Math.round(percentage)}% / {goal}
        </div>
      </div>

      {/* Bottom Accent Line */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${colors.gradient} opacity-50`}></div>
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
  analyticsData = null,
}) => {
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

  const getPeriodLabel = (p) => {
    const labels = { week: 'This Week', month: 'This Month', year: 'This Year' };
    return labels[p] || p;
  };

  const isAnalyticsFresh = (calculatedAt) => {
    if (!calculatedAt) return false;
    const calculatedTime = new Date(calculatedAt).getTime();
    const now = Date.now();
    const fiveMinutesMs = 5 * 60 * 1000;
    return (now - calculatedTime) < fiveMinutesMs;
  };

  const getTimeRangeKey = (period) => {
    const mapping = { week: '7day', month: '30day', year: '90day' };
    return mapping[period] || '7day';
  };

  const augmentStatsWithAnalytics = (mongoStats) => {
    if (!mongoStats || !analyticsData) return mongoStats;

    const augmented = { ...mongoStats };
    const timeRange = getTimeRangeKey(selectedPeriod);
    let hasAugmentation = false;

    const metricTypes = ['steps', 'calories', 'distance', 'activeMinutes', 'sleepHours'];

    metricTypes.forEach(metricType => {
      if (analyticsData[metricType]?.[timeRange]) {
        const analytics = analyticsData[metricType][timeRange];

        if (isAnalyticsFresh(analytics.calculatedAt)) {
          if (analytics.rollingAverage !== undefined) {
            const avgKey = `avg${metricType.charAt(0).toUpperCase() + metricType.slice(1)}`;
            augmented[avgKey] = Math.round(analytics.rollingAverage);
            augmented[`${avgKey}_source`] = 'spark';
            hasAugmentation = true;
          }
        }
      }
    });

    if (hasAugmentation) {
      augmented._sparkAugmented = true;
      augmented._lastSparkUpdate = new Date().toISOString();
    }

    return augmented;
  };

  // ===== DATA FETCHING =====

  const loadStats = async (p) => {
    setIsLoading(true);

    try {
      const result = await metricsService.getMetricsSummary(p);

      if (result.success) {
        const augmentedStats = augmentStatsWithAnalytics(result.data);
        setStats(augmentedStats);
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

  useEffect(() => {
    if (stats && analyticsData) {
      const augmentedStats = augmentStatsWithAnalytics(stats);
      setStats(augmentedStats);
    }
  }, [analyticsData]);

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
        <div className="mb-6 animate-slideDown">
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
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Statistics
          </h2>

          {/* Spark Analytics Indicator */}
          {stats?._sparkAugmented && (
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300/40 rounded-xl shadow-lg backdrop-blur-sm">
              <span className="text-xl animate-pulse">⚡</span>
              <span className="text-sm font-bold text-purple-900">
                Spark Analytics Active
              </span>
            </div>
          )}
        </div>

        {/* Period Selector */}
        <div className="flex gap-3 flex-wrap">
          {['week', 'month', 'year'].map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={`
                px-6 py-3 rounded-xl font-bold text-sm tracking-wide
                transition-all duration-300 transform
                ${selectedPeriod === p
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl scale-105'
                  : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white hover:shadow-lg hover:scale-105 border-2 border-gray-300/40'
                }
              `}
            >
              {getPeriodLabel(p)}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {!isLoading && !stats && (
        <div className="text-center py-16 bg-gradient-to-br from-gray-50/80 to-blue-50/80 rounded-2xl border-2 border-gray-300/40 backdrop-blur-md shadow-xl">
          <div className="text-6xl mb-4 animate-float">📊</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            No Statistics Available
          </h3>
          <p className="text-gray-600 font-medium">
            Start logging metrics to see your statistics for {getPeriodLabel(selectedPeriod).toLowerCase()}
          </p>
        </div>
      )}

      {/* Statistics Grid */}
      {stats && (
        <div className="space-y-10 animate-fadeIn">
          {/* Totals Section */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
              <span className="text-2xl">📈</span>
              Totals
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard icon="👟" title="Total Steps" value={stats.totalSteps || 0} unit="steps" color="blue" isLoading={isLoading} />
              <StatCard icon="🔥" title="Total Calories" value={stats.totalCalories || 0} unit="kcal" color="orange" isLoading={isLoading} />
              <StatCard icon="🏃" title="Total Distance" value={stats.totalDistance || 0} unit="km" color="green" isLoading={isLoading} />
              <StatCard icon="⏱️" title="Active Minutes" value={stats.totalActiveMinutes || 0} unit="minutes" color="teal" isLoading={isLoading} />
            </div>
          </div>

          {/* Averages Section */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
              <span className="text-2xl">📊</span>
              Daily Averages
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <ProgressStatCard icon="👟" title="Avg Steps" current={stats.avgSteps || 0} goal={10000} unit="steps" color="blue" isLoading={isLoading} />
              <ProgressStatCard icon="🔥" title="Avg Calories" current={stats.avgCalories || 0} goal={2000} unit="kcal" color="orange" isLoading={isLoading} />
              <StatCard icon="😴" title="Avg Sleep" value={stats.avgSleepHours || 0} unit="hours" color="indigo" isLoading={isLoading} subtext="Goal: 8 hours" />
              <StatCard icon="⚖️" title="Avg Weight" value={stats.avgWeight || 0} unit="kg" color="purple" isLoading={isLoading} />
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-gradient-to-br from-blue-50/90 to-indigo-50/90 backdrop-blur-md border-2 border-blue-300/40 rounded-2xl p-8 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-xl">📅</span>
                  Period Coverage
                </h4>
                <p className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {stats.daysLogged || 0} days
                </p>
                <p className="text-sm text-gray-600 mt-2 font-medium">
                  {selectedPeriod === 'week' && 'Out of 7 days'}
                  {selectedPeriod === 'month' && 'Out of ~30 days'}
                  {selectedPeriod === 'year' && 'Out of 365 days'}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-xl">📈</span>
                  Tracking Rate
                </h4>
                <p className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {Math.round(
                    ((stats.daysLogged || 0) /
                      (selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 365)) *
                    100
                  )}%
                </p>
                <p className="text-sm text-gray-600 mt-2 font-medium">
                  Consistency is key to progress!
                </p>
              </div>
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-xs text-gray-500 text-center pt-2 font-medium">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-10">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-5">Totals</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <StatCard key={i} icon="📊" title="" value={0} unit="" isLoading={true} />
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-5">Daily Averages</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <ProgressStatCard key={i} icon="📊" title="" current={0} goal={10000} unit="" isLoading={true} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryStats;
