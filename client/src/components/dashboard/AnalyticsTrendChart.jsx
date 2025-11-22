/**
 * ============================================
 * ANALYTICS TREND CHART COMPONENT
 * ============================================
 * 
 * Purpose: Mini chart component for displaying 7-day rolling average trends
 * 
 * Features:
 * - Responsive LineChart using Recharts
 * - Accepts data array of {date, value} points
 * - Customizable color per metric type
 * - Compact design for inline display with analytics badges
 * - Tooltip for data point inspection
 * 
 * Props:
 * - data: Array of {date, value} points (required)
 * - metricType: String identifier for metric (required)
 * - color: Hex color for line (optional, defaults to blue)
 */

import PropTypes from 'prop-types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatDateShort } from '../../utils/dateUtils';

/**
 * Get default color for metric type
 */
const getDefaultColor = (metricType) => {
  const colors = {
    steps: '#3b82f6',        // blue
    calories: '#ef4444',     // red
    activeMinutes: '#8b5cf6', // purple
    distance: '#10b981',     // green
    weight: '#f59e0b',       // amber
    sleepHours: '#6366f1',   // indigo
    heartPoints: '#ec4899',  // pink
  };
  return colors[metricType] || '#3b82f6';
};

/**
 * Format value for tooltip based on metric type
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
 * Custom Tooltip Component
 */
const CustomTooltip = ({ active, payload, metricType }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const value = data.value;
  const date = data.date;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2">
      <p className="text-xs text-gray-500 mb-1">
        {formatDateShort(date)}
      </p>
      <p className="text-sm font-semibold text-gray-900">
        {formatTooltipValue(value, metricType)} {getUnit(metricType)}
      </p>
    </div>
  );
};

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  metricType: PropTypes.string.isRequired,
};

/**
 * Main AnalyticsTrendChart Component
 */
const AnalyticsTrendChart = ({ data, metricType, color }) => {
  // Validate data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-xs text-gray-400">
        No trend data available
      </div>
    );
  }

  // Get color
  const lineColor = color || getDefaultColor(metricType);

  // Sort data by date (oldest first)
  const sortedData = [...data].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA - dateB;
  });

  return (
    <div className="w-full h-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={sortedData}
          margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
        >
          {/* X-Axis - Hidden but used for positioning */}
          <XAxis
            dataKey="date"
            hide
          />
          
          {/* Y-Axis - Hidden but used for scaling */}
          <YAxis
            hide
            domain={['auto', 'auto']}
          />
          
          {/* Tooltip */}
          <Tooltip
            content={<CustomTooltip metricType={metricType} />}
            cursor={{ stroke: lineColor, strokeWidth: 1, strokeDasharray: '3 3' }}
          />
          
          {/* Line */}
          <Line
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: lineColor }}
            animationDuration={500}
          />
        </LineChart>
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
