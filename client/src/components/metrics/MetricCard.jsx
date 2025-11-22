/**
 * ============================================
 * METRIC CARD COMPONENT (ENHANCED WITH PREMIUM UI)
 * ============================================
 * 
 * Premium metric display with Modern Glassmorphism
 * 
 * Features:
 * - Glassmorphism with backdrop blur
 * - Gradient backgrounds and borders
 * - Animated value changes with shimmer effect
 * - Enhanced progress bars with gradients
 * - Pulsing animations for real-time updates
 * - Source badges with glassmorphism
 * - Interactive hover states with lift effect
 * - Optimistic update indicators
 */

import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * ============================================
 * ENHANCED COLOR CONFIGURATION
 * ============================================
 */
const METRIC_COLORS = {
  steps: {
    gradient: 'from-blue-500 to-indigo-600',
    bg: 'from-blue-50/80 to-indigo-50/80',
    border: 'border-blue-300/40',
    text: 'text-blue-900',
    accent: 'text-blue-600',
    iconBg: 'from-blue-500 to-indigo-500',
    glow: 'blue',
    progressGradient: 'from-blue-500 via-indigo-500 to-purple-500',
  },
  calories: {
    gradient: 'from-orange-500 to-red-600',
    bg: 'from-orange-50/80 to-red-50/80',
    border: 'border-orange-300/40',
    text: 'text-orange-900',
    accent: 'text-orange-600',
    iconBg: 'from-orange-500 to-red-500',
    glow: 'orange',
    progressGradient: 'from-orange-500 via-red-500 to-pink-500',
  },
  weight: {
    gradient: 'from-purple-500 to-pink-600',
    bg: 'from-purple-50/80 to-pink-50/80',
    border: 'border-purple-300/40',
    text: 'text-purple-900',
    accent: 'text-purple-600',
    iconBg: 'from-purple-500 to-pink-500',
    glow: 'purple',
    progressGradient: 'from-purple-500 via-pink-500 to-rose-500',
  },
  sleep: {
    gradient: 'from-indigo-500 to-purple-600',
    bg: 'from-indigo-50/80 to-purple-50/80',
    border: 'border-indigo-300/40',
    text: 'text-indigo-900',
    accent: 'text-indigo-600',
    iconBg: 'from-indigo-500 to-purple-500',
    glow: 'indigo',
    progressGradient: 'from-indigo-500 via-purple-500 to-pink-500',
  },
  distance: {
    gradient: 'from-green-500 to-emerald-600',
    bg: 'from-green-50/80 to-emerald-50/80',
    border: 'border-green-300/40',
    text: 'text-green-900',
    accent: 'text-green-600',
    iconBg: 'from-green-500 to-emerald-500',
    glow: 'green',
    progressGradient: 'from-green-500 via-emerald-500 to-teal-500',
  },
  heartRate: {
    gradient: 'from-pink-500 to-rose-600',
    bg: 'from-pink-50/80 to-rose-50/80',
    border: 'border-pink-300/40',
    text: 'text-pink-900',
    accent: 'text-pink-600',
    iconBg: 'from-pink-500 to-rose-500',
    glow: 'pink',
    progressGradient: 'from-pink-500 via-rose-500 to-red-500',
  },
  activeMinutes: {
    gradient: 'from-teal-500 to-cyan-600',
    bg: 'from-teal-50/80 to-cyan-50/80',
    border: 'border-teal-300/40',
    text: 'text-teal-900',
    accent: 'text-teal-600',
    iconBg: 'from-teal-500 to-cyan-500',
    glow: 'teal',
    progressGradient: 'from-teal-500 via-cyan-500 to-blue-500',
  },
  default: {
    gradient: 'from-gray-500 to-slate-600',
    bg: 'from-gray-50/80 to-slate-50/80',
    border: 'border-gray-300/40',
    text: 'text-gray-900',
    accent: 'text-gray-600',
    iconBg: 'from-gray-500 to-slate-500',
    glow: 'gray',
    progressGradient: 'from-gray-500 via-slate-500 to-zinc-500',
  },
};

/**
 * MetricCard Component
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
  // ===== STATE =====
  const [showFlash, setShowFlash] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const previousValueRef = useRef(value);
  const flashTimeoutRef = useRef(null);

  const colorScheme = METRIC_COLORS[color] || METRIC_COLORS.default;

  // ===== FLASH ANIMATION ON VALUE UPDATE =====
  useEffect(() => {
    if (previousValueRef.current !== null && previousValueRef.current !== value) {
      setShowFlash(true);

      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }

      flashTimeoutRef.current = setTimeout(() => {
        setShowFlash(false);
      }, 2000);
    }

    previousValueRef.current = value;

    return () => {
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
    };
  }, [value]);

  // ===== FLASH ON justUpdated PROP =====
  useEffect(() => {
    if (justUpdated) {
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

  const formatValue = (num) => {
    if (typeof num !== 'number') return num;
    return num.toLocaleString('en-US', {
      maximumFractionDigits: 1,
      minimumFractionDigits: 0,
    });
  };

  const getProgressPercentage = () => {
    if (!goal || goal === 0) return null;
    const percentage = (value / goal) * 100;
    return Math.min(Math.round(percentage), 100);
  };

  const getSourceBadge = () => {
    if (!source) return null;

    const badges = {
      manual: { text: '✍️ Manual', gradient: 'from-blue-400 to-indigo-400' },
      googlefit: { text: '🏃 Google Fit', gradient: 'from-green-400 to-emerald-400' },
      sync: { text: '🔄 Synced', gradient: 'from-purple-400 to-pink-400' },
    };

    return badges[source] || null;
  };

  const progressPercentage = getProgressPercentage();

  // ===== RENDER =====

  return (
    <div
      className={`
        group relative rounded-2xl border-2 
        bg-gradient-to-br ${colorScheme.bg} backdrop-blur-md
        ${showFlash
          ? `ring-4 ring-${colorScheme.glow}-400/50 shadow-2xl shadow-${colorScheme.glow}-500/30 scale-[1.03]`
          : `${colorScheme.border} shadow-xl hover:shadow-2xl`
        }
        ${isOptimistic ? 'opacity-70' : 'opacity-100'}
        ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''}
        transition-all duration-500 ease-out
        overflow-hidden
        ${className}
      `}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyPress={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 pointer-events-none"></div>

      {/* Flash Animation Shimmer */}
      {showFlash && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-50 animate-shimmer pointer-events-none"></div>
      )}

      {/* Glow Effect on Hover */}
      {isHovered && !isOptimistic && (
        <div className={`absolute -inset-0.5 bg-gradient-to-r ${colorScheme.gradient} opacity-30 blur-md -z-10 animate-pulse`}></div>
      )}

      {/* Optimistic Update Indicator */}
      {isOptimistic && (
        <div className="absolute top-3 right-3 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg animate-pulse">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-xs font-bold text-blue-600">Saving...</span>
        </div>
      )}

      {/* Source Badge */}
      {!isOptimistic && getSourceBadge() && (
        <div className="absolute top-3 right-3">
          <div className={`bg-gradient-to-r ${getSourceBadge().gradient} text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm`}>
            {getSourceBadge().text}
          </div>
        </div>
      )}

      {/* Card Content */}
      <div className="relative p-6">
        {/* Header: Icon + Title + Trend */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Animated Icon Container */}
            <div className="relative">
              <div className={`absolute inset-0 bg-gradient-to-r ${colorScheme.iconBg} rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity`}></div>
              <div className={`relative w-12 h-12 bg-gradient-to-br ${colorScheme.iconBg} rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                <span className="text-2xl" role="img" aria-label={title}>
                  {icon}
                </span>
              </div>
            </div>

            <h3 className={`text-sm font-bold ${colorScheme.text} tracking-wide uppercase`}>
              {title}
            </h3>
          </div>

          {/* Trend Indicator */}
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

        {/* Value Display */}
        <div className="mb-4">
          <div className={`text-4xl font-extrabold bg-gradient-to-r ${colorScheme.gradient} bg-clip-text text-transparent tracking-tight`}>
            {formatValue(value)}
            {unit && <span className="text-2xl ml-2 opacity-80">{unit}</span>}
          </div>
        </div>

        {/* Goal Progress Bar */}
        {goal && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-gray-600">
              <span>Goal: {formatValue(goal)}</span>
              <span className={`${progressPercentage >= 100 ? 'text-green-600' : colorScheme.accent}`}>
                {progressPercentage}%
              </span>
            </div>

            {/* Enhanced Progress Bar */}
            <div className="relative w-full h-3 bg-gray-200/60 backdrop-blur-sm rounded-full overflow-hidden shadow-inner">
              {/* Progress Fill with Gradient */}
              <div
                className={`
                  h-full bg-gradient-to-r ${colorScheme.progressGradient}
                  transition-all duration-700 ease-out
                  relative overflow-hidden
                `}
                style={{ width: `${progressPercentage}%` }}
              >
                {/* Shimmer Effect on Progress Bar */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>

              {/* Achievement Glow */}
              {progressPercentage >= 100 && (
                <div className="absolute inset-0 bg-green-400/20 animate-pulse rounded-full"></div>
              )}
            </div>

            {/* Achievement Badge */}
            {progressPercentage >= 100 && (
              <div className="flex justify-center mt-2">
                <span className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full shadow-sm animate-bounce">
                  🎉 Goal Achieved!
                </span>
              </div>
            )}
          </div>
        )}

        {/* Comparison with Last Value */}
        {lastValue !== null && lastValue !== value && !trend && (
          <div className="mt-3 text-xs font-medium text-gray-500 bg-gray-100/50 px-3 py-1.5 rounded-lg backdrop-blur-sm">
            Previous: {formatValue(lastValue)}
          </div>
        )}
      </div>

      {/* Bottom Gradient Line */}
      <div className={`h-1 bg-gradient-to-r ${colorScheme.gradient} opacity-50`}></div>
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