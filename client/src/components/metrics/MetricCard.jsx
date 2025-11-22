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
    gradient: 'from-emerald-400 to-cyan-500',
    bg: 'from-emerald-50/90 to-cyan-50/90',
    border: 'border-emerald-200/60',
    text: 'text-emerald-950',
    accent: 'text-emerald-600',
    iconBg: 'from-emerald-400 to-cyan-500',
    glow: 'emerald',
    progressGradient: 'from-emerald-400 via-teal-400 to-cyan-400',
    shadow: 'shadow-emerald-500/20',
  },
  calories: {
    gradient: 'from-orange-400 to-rose-500',
    bg: 'from-orange-50/90 to-rose-50/90',
    border: 'border-orange-200/60',
    text: 'text-orange-950',
    accent: 'text-orange-600',
    iconBg: 'from-orange-400 to-rose-500',
    glow: 'orange',
    progressGradient: 'from-orange-400 via-red-400 to-rose-400',
    shadow: 'shadow-orange-500/20',
  },
  weight: {
    gradient: 'from-violet-400 to-fuchsia-500',
    bg: 'from-violet-50/90 to-fuchsia-50/90',
    border: 'border-violet-200/60',
    text: 'text-violet-950',
    accent: 'text-violet-600',
    iconBg: 'from-violet-400 to-fuchsia-500',
    glow: 'violet',
    progressGradient: 'from-violet-400 via-purple-400 to-fuchsia-400',
    shadow: 'shadow-violet-500/20',
  },
  sleep: {
    gradient: 'from-indigo-400 to-blue-500',
    bg: 'from-indigo-50/90 to-blue-50/90',
    border: 'border-indigo-200/60',
    text: 'text-indigo-950',
    accent: 'text-indigo-600',
    iconBg: 'from-indigo-400 to-blue-500',
    glow: 'indigo',
    progressGradient: 'from-indigo-400 via-blue-400 to-sky-400',
    shadow: 'shadow-indigo-500/20',
  },
  distance: {
    gradient: 'from-teal-400 to-emerald-500',
    bg: 'from-teal-50/90 to-emerald-50/90',
    border: 'border-teal-200/60',
    text: 'text-teal-950',
    accent: 'text-teal-600',
    iconBg: 'from-teal-400 to-emerald-500',
    glow: 'teal',
    progressGradient: 'from-teal-400 via-emerald-400 to-green-400',
    shadow: 'shadow-teal-500/20',
  },
  heartRate: {
    gradient: 'from-rose-400 to-red-500',
    bg: 'from-rose-50/90 to-red-50/90',
    border: 'border-rose-200/60',
    text: 'text-rose-950',
    accent: 'text-rose-600',
    iconBg: 'from-rose-400 to-red-500',
    glow: 'rose',
    progressGradient: 'from-rose-400 via-red-400 to-orange-400',
    shadow: 'shadow-rose-500/20',
  },
  activeMinutes: {
    gradient: 'from-blue-400 to-indigo-500',
    bg: 'from-blue-50/90 to-indigo-50/90',
    border: 'border-blue-200/60',
    text: 'text-blue-950',
    accent: 'text-blue-600',
    iconBg: 'from-blue-400 to-indigo-500',
    glow: 'blue',
    progressGradient: 'from-blue-400 via-indigo-400 to-violet-400',
    shadow: 'shadow-blue-500/20',
  },
  default: {
    gradient: 'from-slate-400 to-gray-500',
    bg: 'from-slate-50/90 to-gray-50/90',
    border: 'border-slate-200/60',
    text: 'text-slate-950',
    accent: 'text-slate-600',
    iconBg: 'from-slate-400 to-gray-500',
    glow: 'slate',
    progressGradient: 'from-slate-400 via-gray-400 to-zinc-400',
    shadow: 'shadow-slate-500/20',
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
        group relative rounded-3xl border 
        bg-gradient-to-br ${colorScheme.bg} backdrop-blur-xl
        ${showFlash
          ? `ring-4 ring-${colorScheme.glow}-400/50 shadow-2xl shadow-${colorScheme.glow}-500/40 scale-[1.02]`
          : `${colorScheme.border} shadow-lg hover:shadow-2xl hover:shadow-${colorScheme.glow}-500/20`
        }
        ${isOptimistic ? 'opacity-70' : 'opacity-100'}
        ${onClick ? 'cursor-pointer hover:-translate-y-2' : ''}
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
      {/* Glass Reflection Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/10 to-transparent opacity-50 pointer-events-none z-0"></div>
      
      {/* Animated Background Blob */}
      <div className={`absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br ${colorScheme.gradient} rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-700 animate-pulse-slow pointer-events-none`}></div>

      {/* Flash Animation Shimmer */}
      {showFlash && (
        <div className="absolute inset-0 z-20 rounded-3xl bg-gradient-to-r from-transparent via-white/80 to-transparent opacity-60 animate-shimmer pointer-events-none"></div>
      )}

      {/* Optimistic Update Indicator */}
      {isOptimistic && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm animate-pulse border border-white/50">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-xs font-bold text-blue-600">Saving...</span>
        </div>
      )}

      {/* Source Badge */}
      {!isOptimistic && getSourceBadge() && (
        <div className="absolute top-4 right-4 z-20">
          <div className={`bg-gradient-to-r ${getSourceBadge().gradient} text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md backdrop-blur-md border border-white/20 tracking-wide uppercase`}>
            {getSourceBadge().text}
          </div>
        </div>
      )}

      {/* Card Content */}
      <div className="relative p-6 z-10 h-full flex flex-col justify-between">
        {/* Header: Icon + Title */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-4">
            {/* Animated Icon Container */}
            <div className="relative group-hover:scale-110 transition-transform duration-300">
              <div className={`absolute inset-0 bg-gradient-to-br ${colorScheme.iconBg} rounded-2xl blur-md opacity-40 group-hover:opacity-60 transition-opacity`}></div>
              <div className={`relative w-14 h-14 bg-gradient-to-br ${colorScheme.iconBg} rounded-2xl flex items-center justify-center shadow-lg border border-white/20`}>
                <span className="text-3xl drop-shadow-md filter" role="img" aria-label={title}>
                  {icon}
                </span>
              </div>
            </div>

            <div className="flex flex-col">
              <h3 className={`text-sm font-bold ${colorScheme.text} tracking-wider uppercase opacity-80`}>
                {title}
              </h3>
              
              {/* Trend Indicator (Moved here for better layout) */}
              {trend && (
                <div className={`
                  flex items-center gap-1 mt-1 text-xs font-bold
                  ${trend.direction === 'up' ? 'text-emerald-600' : 'text-rose-600'}
                `}>
                  <span className={`bg-${trend.direction === 'up' ? 'emerald' : 'rose'}-100 px-1.5 py-0.5 rounded-md`}>
                    {trend.direction === 'up' ? '↗' : '↘'} {trend.percentage}%
                  </span>
                  <span className="text-gray-500 font-medium ml-1">vs last</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Value Display */}
        <div className="mt-4 mb-2">
          <div className="flex items-baseline gap-2">
            <span className={`text-5xl font-black bg-gradient-to-r ${colorScheme.gradient} bg-clip-text text-transparent tracking-tight drop-shadow-sm`}>
              {formatValue(value)}
            </span>
            {unit && <span className={`text-lg font-bold ${colorScheme.text} opacity-60`}>{unit}</span>}
          </div>
        </div>

        {/* Goal Progress Bar */}
        {goal && (
          <div className="mt-auto pt-4">
            <div className="flex justify-between text-xs font-bold mb-2">
              <span className={`${colorScheme.text} opacity-70`}>Goal: {formatValue(goal)}</span>
              <span className={`${progressPercentage >= 100 ? 'text-emerald-600' : colorScheme.accent}`}>
                {progressPercentage}%
              </span>
            </div>

            {/* Enhanced Progress Bar */}
            <div className="relative w-full h-3.5 bg-white/50 backdrop-blur-sm rounded-full overflow-hidden shadow-inner border border-white/30">
              {/* Progress Fill with Gradient */}
              <div
                className={`
                  h-full bg-gradient-to-r ${colorScheme.progressGradient}
                  transition-all duration-1000 ease-out
                  relative overflow-hidden shadow-sm
                `}
                style={{ width: `${progressPercentage}%` }}
              >
                {/* Shimmer Effect on Progress Bar */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
              </div>
            </div>
            
            {/* Achievement Message */}
            {progressPercentage >= 100 && (
              <div className="mt-2 text-center">
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50/80 px-2 py-0.5 rounded-full border border-emerald-100 shadow-sm inline-block animate-bounce-subtle">
                  🎉 Goal Reached!
                </span>
              </div>
            )}
          </div>
        )}

        {/* Comparison with Last Value (if no trend) */}
        {lastValue !== null && lastValue !== value && !trend && (
          <div className="mt-auto pt-2">
            <div className="text-xs font-medium text-gray-500 bg-white/40 px-3 py-1.5 rounded-lg backdrop-blur-sm inline-block border border-white/30">
              Prev: {formatValue(lastValue)}
            </div>
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