/**
 * ============================================
 * ANALYTICS TREND CHART COMPONENT (PREMIUM)
 * ============================================
 * Returns enhanced gradient configurations for each metric
 */

import PropTypes from 'prop-types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatDateShort } from '../../utils/dateUtils';
const getMetricTheme = (metricType) => {
  const themes = {
    steps: {
      primary: '#3b82f6', // Blue
      secondary: '#60a5fa',
      gradient: ['#3b82f6', '#93c5fd'],
      glow: 'rgba(59, 130, 246, 0.5)',
      id: 'steps-theme'
    },
    calories: {
      primary: '#f59e0b', // Amber/Orange
      secondary: '#fbbf24',
      gradient: ['#f59e0b', '#fcd34d'],
      glow: 'rgba(245, 158, 11, 0.5)',
      id: 'calories-theme'
    },
    activeMinutes: {
      primary: '#8b5cf6', // Violet
      secondary: '#a78bfa',
      gradient: ['#8b5cf6', '#c4b5fd'],
      glow: 'rgba(139, 92, 246, 0.5)',
      id: 'active-theme'
    },
    distance: {
      primary: '#10b981', // Emerald
      secondary: '#34d399',
      gradient: ['#10b981', '#6ee7b7'],
      glow: 'rgba(16, 185, 129, 0.5)',
      id: 'distance-theme'
    },
    weight: {
      primary: '#ec4899', // Pink
      secondary: '#f472b6',
      gradient: ['#ec4899', '#fbcfe8'],
      glow: 'rgba(236, 72, 153, 0.5)',
      id: 'weight-theme'
    },
    sleepHours: {
      primary: '#6366f1', // Indigo
      secondary: '#818cf8',
      gradient: ['#6366f1', '#a5b4fc'],
      glow: 'rgba(99, 102, 241, 0.5)',
      id: 'sleep-theme'
    },
    heartPoints: {
      primary: '#ef4444', // Red
      secondary: '#f87171',
      gradient: ['#ef4444', '#fca5a5'],
      glow: 'rgba(239, 68, 68, 0.5)',
      id: 'heart-theme'
    },
  };

  return themes[metricType] || {
    primary: '#64748b',
    secondary: '#94a3b8',
    gradient: ['#64748b', '#cbd5e1'],
    glow: 'rgba(100, 116, 139, 0.5)',
    id: 'default-theme'
  };
};

/**
 * Formatter for tooltip values
 */
const formatValue = (value, metricType) => {
  if (value === null || value === undefined) return '—';

  // Add commas for large numbers
  if (['steps', 'calories', 'heartPoints'].includes(metricType)) {
    return Math.round(value).toLocaleString();
  }

  // One decimal for others
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  });
};

const getUnit = (metricType) => {
  const units = {
    steps: 'steps',
    calories: 'kcal',
    activeMinutes: 'min',
    distance: 'km',
    weight: 'kg',
    sleepHours: 'hrs',
    heartPoints: 'pts',
  };
  return units[metricType] || '';
};

/**
 * Premium Glassmorphism Tooltip
 */
const CustomTooltip = ({ active, payload, metricType }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const theme = getMetricTheme(metricType);

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/20 bg-white/80 p-3 shadow-xl backdrop-blur-md transition-all duration-300 animate-scaleIn dark:bg-gray-900/80 dark:border-gray-700/30">
      {/* Decorative Glow */}
      <div
        className="absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-20 blur-xl"
        style={{ background: theme.primary }}
      />

      <div className="relative z-10">
        <p className="mb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
          {formatDateShort(data.date)}
        </p>
        <div className="flex items-baseline gap-1">
          <span
            className="text-xl font-bold tracking-tight"
            style={{
              color: theme.primary,
              textShadow: `0 0 20px ${theme.glow}`
            }}
          >
            {formatValue(data.value, metricType)}
          </span>
          <span className="text-xs font-medium text-gray-400">
            {getUnit(metricType)}
          </span>
        </div>
      </div>
    </div>
  );
};

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  metricType: PropTypes.string.isRequired,
};

/**
 * Main Component
 */
const AnalyticsTrendChart = ({ data, metricType, color }) => {
  const theme = getMetricTheme(metricType);

  // Handle empty state
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex h-24 w-full flex-col items-center justify-center rounded-xl bg-gray-50/50 p-4 text-center backdrop-blur-sm dark:bg-gray-800/30">
        <div className="mb-2 text-2xl opacity-40 grayscale">�</div>
        <p className="text-xs font-medium text-gray-400">No data available</p>
      </div>
    );
  }

  // Sort data chronologically
  const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="group relative h-24 w-full overflow-hidden rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-none">
      {/* Background subtle glow on hover */}
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-10"
        style={{
          background: `radial-gradient(circle at center, ${theme.primary}, transparent 70%)`
        }}
      />

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={sortedData}
          margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={`gradient-${theme.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={theme.primary} stopOpacity={0.35} />
              <stop offset="95%" stopColor={theme.primary} stopOpacity={0.02} />
            </linearGradient>

            {/* Stroke Gradient */}
            <linearGradient id={`stroke-${theme.id}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={theme.primary} />
              <stop offset="100%" stopColor={theme.secondary} />
            </linearGradient>

            {/* Glow Filter */}
            <filter id={`glow-${theme.id}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
                result="goo"
              />
              <feComposite in="SourceGraphic" in2="goo" operator="atop" />
            </filter>
          </defs>

          <XAxis dataKey="date" hide />
          <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />

          <Tooltip
            content={<CustomTooltip metricType={metricType} />}
            cursor={{
              stroke: theme.primary,
              strokeWidth: 1,
              strokeDasharray: '4 4',
              opacity: 0.5
            }}
            isAnimationActive={true}
          />

          <Area
            type="monotone"
            dataKey="value"
            stroke={`url(#stroke-${theme.id})`}
            strokeWidth={3}
            fill={`url(#gradient-${theme.id})`}
            fillOpacity={1}
            animationDuration={1500}
            animationEasing="ease-out"
            style={{
              filter: `drop-shadow(0 4px 6px ${theme.glow})`
            }}
            activeDot={{
              r: 6,
              fill: '#fff',
              stroke: theme.primary,
              strokeWidth: 3,
              style: {
                filter: `drop-shadow(0 0 8px ${theme.glow})`,
                transition: 'all 0.3s ease'
              }
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

AnalyticsTrendChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
    })
  ).isRequired,
  metricType: PropTypes.string.isRequired,
  color: PropTypes.string,
};

export default AnalyticsTrendChart;
