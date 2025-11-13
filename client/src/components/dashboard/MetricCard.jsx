/**
 * ============================================
 * METRIC CARD COMPONENT
 * ============================================
 *
 * Purpose: Display individual health metric in a card layout
 *
 * Features:
 * - Large metric value display with unit
 * - Optional trend indicator (up/down with percentage)
 * - Color coding based on metric type
 * - Responsive design (mobile-first)
 * - Icon support
 * - Accessibility features
 * - Hover effects
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
 */

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
}) => {
  // Get color scheme based on metric type or custom color
  const colorScheme = METRIC_COLORS[color] || METRIC_COLORS.default;

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

  // ===== RENDER =====

  return (
    <div
      className={`
        ${isOptimistic 
          ? 'border-blue-300 bg-blue-50 opacity-90' 
          : `${colorScheme.bg} ${colorScheme.border}`
        }
        rounded-lg border-2 p-6
        transition-all duration-200 ease-in-out
        ${onClick ? 'cursor-pointer hover:shadow-lg hover:scale-105' : ''}
        ${className}
      `}
      onClick={onClick}
      role="article"
      aria-label={`${title}: ${value} ${unit}`}
    >
      {/* Header: Icon and Title */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <span className="text-3xl" aria-hidden="true">
            {icon}
          </span>
          <div className="flex-1">
            <h3 className={`${colorScheme.text} text-sm font-semibold truncate`}>
              {title}
            </h3>
            {isOptimistic && (
              <span className="text-xs text-blue-600 font-medium">
                Saving...
              </span>
            )}
          </div>
        </div>

        {/* Trend Badge */}
        {trend && (
          <div
            className={`
              ${
                trend.direction === 'up'
                  ? colorScheme.trend.positive
                  : colorScheme.trend.negative
              }
              px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ml-2
              flex items-center gap-1
            `}
            aria-label={`Trend: ${trend.direction} ${trend.percentage}%`}
          >
            <span>{trend.direction === 'up' ? '↑' : '↓'}</span>
            <span>{trend.percentage}%</span>
          </div>
        )}
      </div>

      {/* Main Value Display */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className={`${colorScheme.accent} text-4xl font-bold`}>
            {formatValue(value)}
          </span>
          <span className={`${colorScheme.text} text-lg font-medium opacity-75`}>
            {unit}
          </span>
        </div>
      </div>

      {/* Goal Progress Section */}
      {goal && (
        <div className="space-y-2">
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`${getProgressColor()} h-full transition-all duration-500 rounded-full`}
              style={{ width: `${Math.min(getProgressPercentage(), 100)}%` }}
              role="progressbar"
              aria-valuenow={getProgressPercentage()}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-label={`Progress: ${getProgressPercentage()}% of goal ${goal} ${unit}`}
            />
          </div>

          {/* Goal Info */}
          <div className="flex justify-between items-center text-xs">
            <span className={`${colorScheme.text} opacity-70`}>
              Goal: {formatValue(goal)} {unit}
            </span>
            <span className={`${colorScheme.accent} font-semibold`}>
              {getProgressPercentage()}%
            </span>
          </div>

          {/* Achievement Badge */}
          {getProgressPercentage() >= 100 && (
            <div className="flex items-center justify-center gap-1 pt-1">
              <span className="text-lg">🎉</span>
              <span className={`${colorScheme.accent} text-xs font-bold uppercase`}>
                Goal Achieved!
              </span>
            </div>
          )}
        </div>
      )}

      {/* Last Value Comparison (when no goal) */}
      {!goal && lastValue !== null && lastValue !== undefined && (
        <div className={`${colorScheme.lightAccent} rounded px-3 py-2 text-xs`}>
          <div className={`${colorScheme.text} opacity-70`}>
            Last: {formatValue(lastValue)} {unit}
          </div>
          <div className={`${colorScheme.accent} font-semibold`}>
            Change: {formatValue(value - lastValue)} {value >= lastValue ? '↑' : '↓'}
          </div>
        </div>
      )}

      {/* Interactive Indicator */}
      {onClick && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
          <span className="text-xs font-medium">Click to view details</span>
          <span>→</span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
