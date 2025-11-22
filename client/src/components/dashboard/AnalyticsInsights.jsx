/**
 * ============================================
 * ANALYTICS INSIGHTS COMPONENT
 * ============================================
 * 
 * Purpose: Display real-time analytics results from Spark analytics engine
 * 
 * Features:
 * - Rolling 7-day averages
 * - Trend indicators (↑/↓/→)
 * - Streak tracking
 * - Anomaly detection badges
 * - Percentile rankings
 * - Last updated timestamp
 * 
 * Data Source: Spark analytics via SSE (analytics:update, analytics:batch_update events)
 */

import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import AnalyticsTrendChart from './AnalyticsTrendChart';

/**
 * Get trend arrow based on trend type
 */
const getTrendArrow = (trend) => {
  switch (trend?.toLowerCase()) {
    case 'up':
      return { icon: '↑', color: 'text-green-600', bgColor: 'bg-green-50' };
    case 'down':
      return { icon: '↓', color: 'text-red-600', bgColor: 'bg-red-50' };
    case 'stable':
      return { icon: '→', color: 'text-blue-600', bgColor: 'bg-blue-50' };
    default:
      return { icon: '→', color: 'text-gray-600', bgColor: 'bg-gray-50' };
  }
};

/**
 * Get percentile color based on value
 */
const getPercentileColor = (percentile) => {
  if (percentile >= 75) return 'bg-green-500';
  if (percentile >= 50) return 'bg-blue-500';
  if (percentile >= 25) return 'bg-yellow-500';
  return 'bg-gray-500';
};

/**
 * Get metric icon
 */
const getMetricIcon = (metricType) => {
  const icons = {
    steps: '👟',
    calories: '🔥',
    activeMinutes: '⏱️',
    distance: '📏',
    weight: '⚖️',
    sleepHours: '😴',
    heartPoints: '❤️',
  };
  return icons[metricType] || '📊';
};

/**
 * Get metric label
 */
const getMetricLabel = (metricType) => {
  const labels = {
    steps: 'Steps',
    calories: 'Calories',
    activeMinutes: 'Active Minutes',
    distance: 'Distance',
    weight: 'Weight',
    sleepHours: 'Sleep',
    heartPoints: 'Heart Points',
  };
  return labels[metricType] || metricType;
};

/**
 * Get metric unit
 */
const getMetricUnit = (metricType) => {
  const units = {
    steps: 'steps',
    calories: 'cal',
    activeMinutes: 'min',
    distance: 'km',
    weight: 'kg',
    sleepHours: 'hrs',
    heartPoints: 'pts',
  };
  return units[metricType] || '';
};

/**
 * Format value based on metric type
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
 * Single Analytics Card Component
 */
const AnalyticsCard = ({ metricType, analytics, calculatedAt, trendData }) => {
  if (!analytics) return null;

  const trend = getTrendArrow(analytics.trend);
  const icon = getMetricIcon(metricType);
  const label = getMetricLabel(metricType);
  const unit = getMetricUnit(metricType);
  const value = formatValue(analytics.rollingAverage, metricType);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{icon}</span>
          <div>
            <h3 className="text-sm font-medium text-gray-700">{label}</h3>
            <p className="text-xs text-gray-500">7-day average</p>
          </div>
        </div>

        {/* Trend Arrow */}
        <div className={`${trend.bgColor} ${trend.color} px-2 py-1 rounded-full`}>
          <span className="text-xl font-bold">{trend.icon}</span>
        </div>
      </div>

      {/* Main Value */}
      <div className="mb-3">
        <div className="flex items-baseline space-x-1">
          <span className="text-2xl font-bold text-gray-900">{value}</span>
          <span className="text-sm text-gray-500">{unit}</span>
        </div>

        {/* Trend Percentage */}
        {analytics.trendPercentage && (
          <p className={`text-xs ${trend.color} mt-1`}>
            {analytics.trendPercentage > 0 ? '+' : ''}
            {analytics.trendPercentage.toFixed(1)}% vs previous period
          </p>
        )}
      </div>

      {/* Stats Row */}
      <div className="flex items-center justify-between text-xs">
        {/* Streak */}
        {analytics.streakDays > 0 && (
          <div className="flex items-center space-x-1">
            <span>🔥</span>
            <span className="text-gray-600">
              {analytics.streakDays} day streak
            </span>
          </div>
        )}

        {/* Percentile */}
        {analytics.percentile !== undefined && (
          <div className="flex items-center space-x-1">
            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${getPercentileColor(analytics.percentile)}`}
                style={{ width: `${analytics.percentile}%` }}
              />
            </div>
            <span className="text-gray-600">
              {Math.round(analytics.percentile)}%
            </span>
          </div>
        )}
      </div>

      {/* Anomaly Badge */}
      {analytics.anomalyDetected && (
        <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded px-2 py-1">
          <div className="flex items-center space-x-1">
            <span className="text-yellow-600">⚠️</span>
            <span className="text-xs text-yellow-700 font-medium">
              Unusual pattern detected
            </span>
          </div>
        </div>
      )}

      {/* Trend Chart */}
      {trendData && trendData.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">7-day trend</p>
          <AnalyticsTrendChart
            data={trendData}
            metricType={metricType}
          />
        </div>
      )}

      {/* Last Updated */}
      {calculatedAt && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Updated {formatDistanceToNow(new Date(calculatedAt), { addSuffix: true })}
            </p>
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs text-green-600 font-medium">Live</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

AnalyticsCard.propTypes = {
  metricType: PropTypes.string.isRequired,
  analytics: PropTypes.shape({
    rollingAverage: PropTypes.number,
    trend: PropTypes.string,
    trendPercentage: PropTypes.number,
    anomalyDetected: PropTypes.bool,
    streakDays: PropTypes.number,
    longestStreak: PropTypes.number,
    percentile: PropTypes.number,
  }),
  calculatedAt: PropTypes.string,
  trendData: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
    })
  ),
};

/**
 * Loading Skeleton Component
 */
const AnalyticsLoadingSkeleton = () => {
  return (
    <div className="space-y-4">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="space-y-2 text-right">
          <div className="h-3 w-20 bg-gray-200 rounded animate-pulse ml-auto"></div>
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse ml-auto"></div>
        </div>
      </div>

      {/* Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="space-y-1">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
            </div>

            {/* Value */}
            <div className="mb-3 space-y-1">
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 w-40 bg-gray-200 rounded animate-pulse"></div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>

            {/* Chart */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-24 bg-gray-100 rounded animate-pulse"></div>
            </div>

            {/* Footer */}
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="h-3 w-28 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Banner Skeleton */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-3 w-full bg-gray-200 rounded animate-pulse"></div>
            <div className="h-3 w-5/6 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Main AnalyticsInsights Component
 */
const AnalyticsInsights = ({ analyticsData, lastUpdated, isLoading }) => {
  // Show loading skeleton while waiting for first analytics update
  if (isLoading) {
    return <AnalyticsLoadingSkeleton />;
  }

  if (!analyticsData || Object.keys(analyticsData).length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            No Analytics Available
          </h3>
          <p className="text-sm text-gray-500">
            Analytics will appear here once Spark processes your health data.
          </p>
        </div>
      </div>
    );
  }

  // Get list of metrics with analytics
  const metricsWithAnalytics = Object.entries(analyticsData)
    .filter(([, timeRanges]) => timeRanges && timeRanges['7day'])
    .map(([metricType]) => metricType);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Analytics Insights</h2>
          <p className="text-sm text-gray-500">
            Real-time analytics powered by Apache Spark
          </p>
        </div>

        {lastUpdated && (
          <div className="text-right">
            <p className="text-xs text-gray-500">Last updated</p>
            <p className="text-sm font-medium text-gray-700">
              {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}
            </p>
          </div>
        )}
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricsWithAnalytics.map((metricType) => {
          const analytics = analyticsData[metricType]['7day'];

          // Extract trend data for chart (last 7 data points if available)
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <span className="text-blue-600 text-xl">ℹ️</span>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              About Analytics
            </h4>
            <p className="text-xs text-blue-700">
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
