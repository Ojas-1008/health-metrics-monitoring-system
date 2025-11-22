/**
 * ============================================
 * ANALYTICS TREND CHART COMPONENT (ENHANCED)
 * ============================================
 * 
 * Premium mini chart with Modern Glassmorphism
 * 
 * Features:
 * - Enhanced LineChart with gradient fills
 * - Premium glassmorphism tooltip
 * - Customizable colors per metric type
 * - Smooth animations
 * - Gradient stroke for lines
 * - Enhanced empty state
 * - Responsive design
 */

import PropTypes from 'prop-types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { formatDateShort } from '../../utils/dateUtils';

/**
 * Get gradient colors for metric type
 */
const getMetricGradient = (metricType) => {
  const gradients = {
    steps: { from: '#3b82f6', to: '#6366f1', id: 'stepsGradient' },        // blue to indigo
    calories: { from: '#ef4444', to: '#f97316', id: 'caloriesGradient' },   // red to orange
    activeMinutes: { from: '#8b5cf6', to: '#a855f7', id: 'activeGradient' }, // purple to fuchsia
    distance: { from: '#10b981', to: '#14b8a6', id: 'distanceGradient' },   // green to teal
    weight: { from: '#f59e0b', to: '#f97316', id: 'weightGradient' },       // amber to orange
    sleepHours: { from: '#6366f1', to: '#8b5cf6', id: 'sleepGradient' },    // indigo to purple
    heartPoints: { from: '#ec4899', to: '#f43f5e', id: 'heartGradient' },   // pink to rose
  };
  return gradients[metricType] || { from: '#3b82f6', to: '#6366f1', id: 'defaultGradient' };
};

/**
 * Format value for tooltip
 */
const formatTooltipValue = (value, metricType) => {
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
 * Get unit for metric type
 */
const getUnit = (metricType) => {
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
 * Enhanced Custom Tooltip
 */
const CustomTooltip = ({ active, payload, metricType }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const value = data.value;
  const date = data.date;
  const gradient = getMetricGradient(metricType);

  return (
    <div className="relative bg-white/95 backdrop-blur-xl border-2 border-gray-300/40 rounded-xl shadow-2xl px-4 py-3 overflow-hidden animate-scaleIn">
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 pointer-events-none"></div>

      <div className="relative">
        <p className="text-xs text-gray-600 font-semibold mb-1">
          {formatDateShort(date)}
        </p>
        <p className="text-lg font-extrabold" style={{
          background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          {formatTooltipValue(value, metricType)} {getUnit(metricType)}
        </p>
      </div>

      {/* Bottom Accent */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1 opacity-50"
        style={{
          background: `linear-gradient(to right, ${gradient.from}, ${gradient.to})`
        }}
      ></div>
    </div>
  );
};

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  metricType: PropTypes.string.isRequired,
};

/**
 * Enhanced AnalyticsTrendChart Component
 */
const AnalyticsTrendChart = ({ data, metricType, color }) => {
  // Validate data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-24 text-center">
        <div className="text-2xl mb-1 opacity-50">📊</div>
        <p className="text-xs text-gray-500 font-medium">No trend data</p>
      </div>
    );
  }

  // Get gradient colors
  const gradient = getMetricGradient(metricType);
  const strokeColor = color || gradient.from;

  // Sort data by date
  const sortedData = [...data].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA - dateB;
  });

  return (
    <div className="w-full h-24">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={sortedData}
          margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
        >
          {/* Gradient Definition */}
          <defs>
            <linearGradient id={gradient.id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={gradient.from} stopOpacity={0.3} />
              <stop offset="95%" stopColor={gradient.to} stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id={`${gradient.id}Stroke`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={gradient.from} />
              <stop offset="100%" stopColor={gradient.to} />
            </linearGradient>
          </defs>

          {/* X-Axis */}
          <XAxis dataKey="date" hide />

          {/* Y-Axis */}
          <YAxis hide domain={['auto', 'auto']} />

          {/* Tooltip */}
          <Tooltip
            content={<CustomTooltip metricType={metricType} />}
            cursor={{
              stroke: gradient.from,
              strokeWidth: 2,
              strokeDasharray: '5 5',
              opacity: 0.5
            }}
          />

          {/* Area with gradient fill */}
          <Area
            type="monotone"
            dataKey="value"
            stroke={`url(#${gradient.id}Stroke)`}
            strokeWidth={3}
            fill={`url(#${gradient.id})`}
            dot={false}
            activeDot={{
              r: 6,
              fill: gradient.from,
              stroke: '#fff',
              strokeWidth: 2,
              style: { filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }
            }}
            animationDuration={800}
            animationEasing="ease-in-out"
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
