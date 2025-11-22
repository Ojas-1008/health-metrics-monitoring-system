/**
 * ============================================
 * ANALYTICS INSIGHTS COMPONENT (ENHANCED)
 * ============================================
 * 
 * Premium analytics display with Modern Glassmorphism
 * 
 * Features:
 * - Glassmorphism analytics cards with gradients
 * - Animated trend indicators
 * - Enhanced streak badges
 * - Premium percentile bars with gradients
 * - Beautiful anomaly alerts
 * - Integrated trend charts
 * - Live status indicators
 * - Enhanced loading skeletons
 */

import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import AnalyticsTrendChart from './AnalyticsTrendChart';

/**
 * Get trend styling
 */
const getTrendArrow = (trend) => {
  switch (trend?.toLowerCase()) {
    case 'up':
      return { icon: '↑', gradient: 'from-green-400 to-emerald-400', text: 'text-green-700' };
    case 'down':
      return { icon: '↓', gradient: 'from-red-400 to-rose-400', text: 'text-red-700' };
    case 'stable':
      return { icon: '→', gradient: 'from-blue-400 to-indigo-400', text: 'text-blue-700' };
    default:
      return { icon: '→', gradient: 'from-gray-400 to-slate-400', text: 'text-gray-700' };
  }
};

/**
 * Get percentile gradient
 */
const getPercentileGradient = (percentile) => {
  if (percentile >= 75) return 'from-green-500 to-emerald-500';
  if (percentile >= 50) return 'from-blue-500 to-indigo-500';
  if (percentile >= 25) return 'from-yellow-500 to-amber-500';
  return 'from-gray-500 to-slate-500';
};

/**
 * Get metric info
 */
const getMetricInfo = (metricType) => {
  const info = {
    steps: { icon: '👟', label: 'Steps', unit: 'steps', gradient: 'from-blue-500 to-indigo-600' },
    calories: { icon: '🔥', label: 'Calories', unit: 'cal', gradient: 'from-orange-500 to-red-600' },
    activeMinutes: { icon: '⏱️', label: 'Active Minutes', unit: 'min', gradient: 'from-teal-500 to-cyan-600' },
    distance: { icon: '📏', label: 'Distance', unit: 'km', gradient: 'from-green-500 to-emerald-600' },
    weight: { icon: '⚖️', label: 'Weight', unit: 'kg', gradient: 'from-purple-500 to-pink-600' },
    sleepHours: { icon: '😴', label: 'Sleep', unit: 'hrs', gradient: 'from-indigo-500 to-purple-600' },
    heartPoints: { icon: '❤️', label: 'Heart Points', unit: 'pts', gradient: 'from-pink-500 to-rose-600' },
  };
  return info[metricType] || { icon: '📊', label: metricType, unit: '', gradient: 'from-gray-500 to-slate-600' };
};

/**
 * Format value
 */
const formatValue = (value, metricType) => {
  if (value === null || value === undefined) return '—';
  switch (metricType) {
    case 'steps':
    case 'calories':
    case 'activeMinutes':
    case 'heartPoints':
      return Math.round(value).toLocaleString();
    case 'distance':
    case 'weight':
    case 'sleepHours':
      return value.toFixed(1);
    default:
      return value.toLocaleString();
  }
};

/**
 * Enhanced Analytics Card
 */
const AnalyticsCard = ({ metricType, analytics, calculatedAt, trendData }) => {
  if (!analytics) return null;

  const trend = getTrendArrow(analytics.trend);
  const metricInfo = getMetricInfo(metricType);
  const value = formatValue(analytics.rollingAverage, metricType);

  return (
    <div className="relative bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md rounded-2xl border-2 border-gray-300/40 p-6 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 pointer-events-none"></div>

      {/* Header */}
      <div className="relative flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Animated Icon */}
          <div className="relative">
            <div className={`absolute inset-0 bg-gradient-to-r ${metricInfo.gradient} rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity`}></div>
            <div className={`relative w-12 h-12 bg-gradient-to-br ${metricInfo.gradient} rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
              <span className="text-2xl">{metricInfo.icon}</span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-900">{metricInfo.label}</h3>
            <p className="text-xs text-gray-600 font-medium">7-day average</p>
          </div>
        </div>

        {/* Trend Badge */}
        <div className={`px-3 py-2 bg-gradient-to-r ${trend.gradient} rounded-full shadow-lg`}>
          <span className="text-2xl font-bold text-white">{trend.icon}</span>
        </div>
      </div>

      {/* Main Value */}
      <div className="relative mb-4">
        <div className="flex items-baseline gap-2">
          <span className={`text-4xl font-extrabold bg-gradient-to-r ${metricInfo.gradient} bg-clip-text text-transparent`}>
            {value}
          </span>
          <span className="text-sm text-gray-600 font-semibold">{metricInfo.unit}</span>
        </div>

        {/* Trend Percentage */}
        {analytics.trendPercentage !== undefined && (
          <p className={`text-sm ${trend.text} mt-2 font-bold`}>
            {analytics.trendPercentage > 0 ? '+' : ''}
            {analytics.trendPercentage.toFixed(1)}% vs previous period
          </p>
        )}
      </div>

      {/* Stats Row */}
      <div className="relative flex items-center justify-between mb-4">
        {/* Streak */}
        {analytics.streakDays > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-50 to-red-50 backdrop-blur-sm border border-orange-300/40 rounded-full shadow-md">
            <span className="text-base">🔥</span>
            <span className="text-sm text-orange-700 font-bold">
              {analytics.streakDays} day{analytics.streakDays !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Percentile */}
        {analytics.percentile !== undefined && (
          <div className="flex items-center gap-2">
            <div className="w-20 h-3 bg-gray-200/60 backdrop-blur-sm rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full bg-gradient-to-r ${getPercentileGradient(analytics.percentile)} transition-all duration-700`}
                style={{ width: `${analytics.percentile}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>
            <span className="text-sm text-gray-700 font-bold">
              {Math.round(analytics.percentile)}%
            </span>
          </div>
        )}
      </div>

      {/* Anomaly Badge */}
      {analytics.anomalyDetected && (
        <div className="relative mb-4 p-3 bg-gradient-to-br from-yellow-50/90 to-amber-50/90 backdrop-blur-sm border-2 border-yellow-300/40 rounded-xl shadow-lg animate-pulse">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <span className="text-sm text-yellow-800 font-bold">
              Unusual pattern detected
            </span>
          </div>
        </div>
      )}

      {/* Trend Chart */}
      {trendData && trendData.length > 0 && (
        <div className="relative pt-4 border-t-2 border-gray-300/40">
          <p className="text-xs text-gray-600 font-semibold mb-2">7-day trend</p>
          <AnalyticsTrendChart
            data={trendData}
            metricType={metricType}
          />
        </div>
      )}

      {/* Live Indicator */}
      {calculatedAt && (
        <div className="relative mt-4 pt-4 border-t-2 border-gray-300/40 flex items-center justify-between">
          <p className="text-xs text-gray-500 font-medium">
            Updated {formatDistanceToNow(new Date(calculatedAt), { addSuffix: true })}
          </p>
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-green-400 rounded-full blur opacity-60 animate-pulse"></div>
              <div className="relative w-2 h-2 rounded-full bg-green-500"></div>
            </div>
            <span className="text-xs text-green-700 font-bold">Live</span>
          </div>
        </div>
      )}

      {/* Bottom Accent */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${metricInfo.gradient} opacity-50`}></div>
    </div>
  );
};

AnalyticsCard.propTypes = {
  metricType: PropTypes.string.isRequired,
  analytics: PropTypes.object,
  calculatedAt: PropTypes.string,
  trendData: PropTypes.array,
};

/**
 * Enhanced Loading Skeleton
 */
const AnalyticsLoadingSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse"></div>
          <div className="h-5 w-72 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse"></div>
        </div>
        <div className="space-y-2 text-right">
          <div className="h-4 w-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse ml-auto"></div>
          <div className="h-5 w-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse ml-auto"></div>
        </div>
      </div>

      {/* Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md rounded-2xl border-2 border-gray-300/40 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-300 rounded-xl animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-300 rounded animate-pulse"></div>
                  <div className="h-3 w-28 bg-gray-300 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="w-12 h-12 bg-gray-300 rounded-full animate-pulse"></div>
            </div>

            <div className="mb-4 space-y-2">
              <div className="h-10 w-36 bg-gray-300 rounded animate-pulse"></div>
              <div className="h-4 w-44 bg-gray-300 rounded animate-pulse"></div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="h-8 w-24 bg-gray-300 rounded-full animate-pulse"></div>
              <div className="h-4 w-28 bg-gray-300 rounded animate-pulse"></div>
            </div>

            <div className="pt-4 border-t-2 border-gray-300/40">
              <div className="h-3 w-20 bg-gray-300 rounded animate-pulse mb-2"></div>
              <div className="h-24 bg-gray-200/60 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Main AnalyticsInsights Component
 */
const AnalyticsInsights = ({ analyticsData, lastUpdated, isLoading }) => {
  if (isLoading) {
    return <AnalyticsLoadingSkeleton />;
  }

  if (!analyticsData || Object.keys(analyticsData).length === 0) {
    return (
      <div className="relative bg-gradient-to-br from-white/90 to-blue-50/90 backdrop-blur-md rounded-2xl border-2 border-gray-300/40 p-12 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 pointer-events-none"></div>
        <div className="relative text-center">
          <div className="text-7xl mb-6 animate-float">📊</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            No Analytics Available
          </h3>
          <p className="text-sm text-gray-700 font-medium">
            Analytics will appear here once Spark processes your health data.
          </p>
        </div>
      </div>
    );
  }

  const metricsWithAnalytics = Object.entries(analyticsData)
    .filter(([, timeRanges]) => timeRanges && timeRanges['7day'])
    .map(([metricType]) => metricType);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            ⚡ Analytics Insights
          </h2>
          <p className="text-sm text-gray-700 font-medium">
            Real-time analytics powered by Apache Spark
          </p>
        </div>

        {lastUpdated && (
          <div className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border-2 border-gray-300/40">
            <p className="text-xs text-gray-600 font-semibold">Last updated</p>
            <p className="text-sm font-bold text-gray-900">
              {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}
            </p>
          </div>
        )}
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
        {metricsWithAnalytics.map((metricType) => {
          const analytics = analyticsData[metricType]['7day'];
          const trendData = analytics?.historicalData || [];

          return (
            <AnalyticsCard
              key={metricType}
              metricType={metricType}
              analytics={analytics?.analytics}
              calculatedAt={analytics?.calculatedAt}
              trendData={trendData}
            />
          );
        })}
      </div>

      {/* Info Banner */}
      <div className="relative p-6 bg-gradient-to-br from-blue-50/90 to-indigo-50/90 backdrop-blur-md border-2 border-blue-300/40 rounded-xl shadow-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 pointer-events-none"></div>
        <div className="relative flex items-start gap-3">
          <span className="text-3xl">💡</span>
          <div>
            <h4 className="text-sm font-bold text-blue-900 mb-2">
              About Analytics
            </h4>
            <p className="text-sm text-blue-800 font-medium leading-relaxed">
              Analytics are calculated in real-time by our Apache Spark engine.
              Data includes rolling averages, trends, streaks, and percentile rankings
              compared to your historical data. Anomaly detection alerts you to unusual patterns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

AnalyticsInsights.propTypes = {
  analyticsData: PropTypes.object,
  lastUpdated: PropTypes.string,
  isLoading: PropTypes.bool,
};

export default AnalyticsInsights;
