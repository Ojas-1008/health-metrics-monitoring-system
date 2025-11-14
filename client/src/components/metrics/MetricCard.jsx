/**
 * ============================================
 * METRIC CARD COMPONENT (WITH REAL-TIME UPDATES)
 * ============================================
 * 
 * Purpose: Display individual health metric in a card layout
 * ENHANCED: Flash animation on real-time updates
 * 
 * Features:
 * - Large metric value display with unit
 * - Optional trend indicator (up/down with percentage)
 * - Color coding based on metric type
 * - Responsive design (mobile-first)
 * - Icon support
 * - Accessibility features
 * - Hover effects
 * - NEW: Flash animation on data update
 * - NEW: Optimistic update indicator
 * - NEW: Real-time sync badge
 * 
 * Props:
 * - title: Metric title (e.g., "Steps", "Calories")
 * - value: Metric value (number)
 * - unit: Unit of measurement (e.g., "steps", "kcal")
 * - icon: Emoji or icon (e.g., "👟")
 * - trend: Optional trend object { direction: 'up'|'down', percentage: number }
 * - color: Optional color theme ('blue', 'green', 'orange', 'purple', 'pink')
 * - goal: Optional goal value for comparison
 * - lastValue: Optional previous value for comparison
 * - isOptimistic: NEW - Flag for optimistic updates
 * - justUpdated: NEW - Flag for triggering flash animation
 * - source: NEW - Data source ('manual', 'googlefit', 'sync')
 */

import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * ============================================
 * COLOR CONFIGURATION BY METRIC TYPE
 * ============================================
 */
const METRIC_COLORS = {
  steps: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-900',
    accent: 'text-blue-600',
    darkAccent: 'bg-blue-600',
    lightAccent: 'bg-blue-100',
    flashBorder: 'border-blue-400', // NEW: Flash animation color
    trend: {
      positive: 'text-green-600 bg-green-50',
      negative: 'text-red-600 bg-red-50',
    },
  },
  calories: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-900',
    accent: 'text-orange-600',
    darkAccent: 'bg-orange-600',
    lightAccent: 'bg-orange-100',
    flashBorder: 'border-orange-400',
    trend: {
      positive: 'text-green-600 bg-green-50',
      negative: 'text-red-600 bg-red-50',
    },
  },
  weight: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-900',
    accent: 'text-purple-600',
    darkAccent: 'bg-purple-600',
    lightAccent: 'bg-purple-100',
    flashBorder: 'border-purple-400',
    trend: {
      positive: 'text-red-600 bg-red-50',
      negative: 'text-green-600 bg-green-50',
    },
  },
  sleep: {
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    text: 'text-indigo-900',
    accent: 'text-indigo-600',
    darkAccent: 'bg-indigo-600',
    lightAccent: 'bg-indigo-100',
    flashBorder: 'border-indigo-400',
    trend: {
      positive: 'text-green-600 bg-green-50',
      negative: 'text-red-600 bg-red-50',
    },
  },
  distance: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-900',
    accent: 'text-green-600',
    darkAccent: 'bg-green-600',
    lightAccent: 'bg-green-100',
    flashBorder: 'border-green-400',
    trend: {
      positive: 'text-green-600 bg-green-50',
      negative: 'text-red-600 bg-red-50',
    },
  },
  heartRate: {
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    text: 'text-pink-900',
    accent: 'text-pink-600',
    darkAccent: 'bg-pink-600',
    lightAccent: 'bg-pink-100',
    flashBorder: 'border-pink-400',
    trend: {
      positive: 'text-red-600 bg-red-50',
      negative: 'text-green-600 bg-green-50',
    },
  },
  activeMinutes: {
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    text: 'text-teal-900',
    accent: 'text-teal-600',
    darkAccent: 'bg-teal-600',
    lightAccent: 'bg-teal-100',
    flashBorder: 'border-teal-400',
    trend: {
      positive: 'text-green-600 bg-green-50',
      negative: 'text-red-600 bg-red-50',
    },
  },
  default: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-900',
    accent: 'text-gray-600',
    darkAccent: 'bg-gray-600',
    lightAccent: 'bg-gray-100',
    flashBorder: 'border-gray-400',
    trend: {
      positive: 'text-green-600 bg-green-50',
      negative: 'text-red-600 bg-red-50',
    },
  },
};

/**
 * ============================================
 * METRIC CARD COMPONENT
 * ============================================
 */
const MetricCard = ({
  title = 'Metric',
  value = 0,
  unit = '',
  icon = '📊',
  trend = null,
  color = 'default',
  goal = null,
  lastValue = null,
  onClick = null,
  className = '',
  isOptimistic = false,
  justUpdated = false,
  source = null,
}) => {
  // ===== STATE FOR FLASH ANIMATION =====
  const [showFlash, setShowFlash] = useState(false);
  const previousValueRef = useRef(value);
  const flashTimeoutRef = useRef(null);

  // Get color scheme based on metric type or custom color
  const colorScheme = METRIC_COLORS[color] || METRIC_COLORS.default;

  /**
   * ============================================
   * EFFECT: TRIGGER FLASH ON VALUE UPDATE
   * ============================================
   * 
   * Detects when value changes from real-time events
   * and triggers a 2-second flash animation
   */
  useEffect(() => {
    // Check if value actually changed (not initial render)
    if (previousValueRef.current !== null && previousValueRef.current !== value) {
      console.log(`[MetricCard] ${title} value changed: ${previousValueRef.current} → ${value}`);
      
      // Trigger flash animation
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowFlash(true);

      // Clear existing timeout
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }

      // Reset flash after 2 seconds
      flashTimeoutRef.current = setTimeout(() => {
        setShowFlash(false);
      }, 2000);
    }

    // Update previous value ref
    previousValueRef.current = value;

    // Cleanup timeout on unmount
    return () => {
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
    };
  }, [value, title]);

  /**
   * ============================================
   * EFFECT: TRIGGER FLASH ON justUpdated PROP
   * ============================================
   * 
   * Alternative trigger mechanism via prop
   * Useful when parent component wants to explicitly trigger flash
   */
  useEffect(() => {
    if (justUpdated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowFlash(true);

      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }

      flashTimeoutRef.current = setTimeout(() => {
        setShowFlash(false);
      }, 2000);
    }
  }, [justUpdated]);

  // ===== HELPER FUNCTIONS =====

  /**
   * Format large numbers with thousand separators
   */
  const formatValue = (num) => {
    if (typeof num !== 'number') return num;
    return num.toLocaleString('en-US', {
      maximumFractionDigits: 1,
      minimumFractionDigits: 0,
    });
  };

  /**
   * Calculate progress percentage toward goal
   */
  const getProgressPercentage = () => {
    if (!goal || goal === 0) return null;
    const percentage = (value / goal) * 100;
    return Math.min(Math.round(percentage), 100);
  };

  /**
   * Get progress bar color based on achievement
   */
  const getProgressColor = () => {
    const percentage = getProgressPercentage();
    if (!percentage) return 'bg-gray-200';
    if (percentage >= 100) return colorScheme.darkAccent;
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  /**
   * Get source badge configuration
   */
  const getSourceBadge = () => {
    if (!source) return null;

    const badges = {
      manual: { text: 'Manual', color: 'bg-blue-100 text-blue-700' },
      googlefit: { text: 'Google Fit', color: 'bg-green-100 text-green-700' },
      sync: { text: 'Synced', color: 'bg-purple-100 text-purple-700' },
    };

    return badges[source] || null;
  };

  // ===== RENDER =====

  return (
    <div
      className={`
        relative rounded-lg border-2 transition-all duration-300 ease-in-out
        ${colorScheme.bg}
        ${showFlash ? `${colorScheme.flashBorder} shadow-lg scale-[1.02]` : colorScheme.border}
        ${isOptimistic ? 'opacity-75 animate-pulse' : 'opacity-100'}
        ${onClick ? 'cursor-pointer hover:shadow-md' : ''}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyPress={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {/* ===== FLASH ANIMATION OVERLAY ===== */}
      {showFlash && (
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer pointer-events-none" />
      )}

      {/* ===== OPTIMISTIC UPDATE INDICATOR ===== */}
      {isOptimistic && (
        <div className="absolute top-2 right-2 flex items-center space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium text-blue-600">Saving...</span>
        </div>
      )}

      {/* ===== SOURCE BADGE ===== */}
      {!isOptimistic && getSourceBadge() && (
        <div className="absolute top-2 right-2">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${getSourceBadge().color}`}>
            {getSourceBadge().text}
          </span>
        </div>
      )}

      {/* ===== CARD CONTENT ===== */}
      <div className="p-4">
        {/* Header: Icon + Title */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl" role="img" aria-label={title}>
              {icon}
            </span>
            <h3 className={`text-sm font-medium ${colorScheme.text}`}>
              {title}
            </h3>
          </div>

          {/* Trend Indicator */}
          {trend && (
            <div
              className={`
                flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium
                ${trend.direction === 'up' ? colorScheme.trend.positive : colorScheme.trend.negative}
              `}
            >
              <span>{trend.direction === 'up' ? '↑' : '↓'}</span>
              <span>{trend.percentage}%</span>
            </div>
          )}
        </div>

        {/* Value Display */}
        <div className="mb-2">
          <div className={`text-3xl font-bold ${colorScheme.accent}`}>
            {formatValue(value)}
            {unit && <span className="text-lg ml-1">{unit}</span>}
          </div>
        </div>

        {/* Goal Progress Bar */}
        {goal && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Goal: {formatValue(goal)}</span>
              <span className="font-medium">{getProgressPercentage()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ease-out ${getProgressColor()}`}
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>
        )}

        {/* Comparison with Last Value */}
        {lastValue !== null && lastValue !== value && !trend && (
          <div className="mt-2 text-xs text-gray-500">
            Previous: {formatValue(lastValue)}
          </div>
        )}
      </div>
    </div>
  );
};

MetricCard.propTypes = {
  title: PropTypes.string,
  value: PropTypes.number,
  unit: PropTypes.string,
  icon: PropTypes.string,
  trend: PropTypes.shape({
    direction: PropTypes.oneOf(['up', 'down']),
    percentage: PropTypes.number,
  }),
  color: PropTypes.string,
  goal: PropTypes.number,
  lastValue: PropTypes.number,
  onClick: PropTypes.func,
  className: PropTypes.string,
  isOptimistic: PropTypes.bool,
  justUpdated: PropTypes.bool,
  source: PropTypes.oneOf(['manual', 'googlefit', 'sync']),
};

export default MetricCard;