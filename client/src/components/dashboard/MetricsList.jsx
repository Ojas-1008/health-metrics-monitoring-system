/**
 * ============================================
 * METRICS LIST COMPONENT (ENHANCED WITH PREMIUM UI)
 * ============================================
 *
 * Premium metrics display with Modern Glassmorphism
 *
 * Features:
 * - Glassmorphism metric cards with gradients
 * - Animated new/updated indicators
 * - Enhanced delete confirmation modal
 * - Beautiful loading skeletons
 * - Scroll position preservation
 * - Source badges with glassmorphism
 * - Interactive hover states
 * - Modern pagination controls
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import * as dateUtils from '../../utils/dateUtils';
import * as metricsService from '../../services/metricsService';
import Button from '../common/Button';
import Alert from '../common/Alert';

/**
 * ============================================
 * ENHANCED LOADING SKELETON
 * ============================================
 */
const MetricsSkeleton = ({ count = 3 }) => {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-gradient-to-br from-gray-50/80 to-blue-50/80 backdrop-blur-md border-2 border-gray-300/40 rounded-2xl p-6 shadow-xl animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-8 bg-gray-300 rounded-lg w-40"></div>
            <div className="flex gap-2">
              <div className="h-8 bg-gray-300 rounded-lg w-16"></div>
              <div className="h-8 bg-gray-300 rounded-lg w-20"></div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-24"></div>
                <div className="h-8 bg-gray-300 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

MetricsSkeleton.propTypes = {
  count: PropTypes.number,
};

/**
 * ============================================
 * METRICS LIST COMPONENT
 * ============================================
 */
const MetricsList = ({
  metrics = [],
  isLoading = false,
  onEdit = null,
  onDelete = null,
  dateRange = null,
  itemsPerPage = 5,
}) => {
  // ===== STATE =====
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingDate, setDeletingDate] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [newlyAddedDates, setNewlyAddedDates] = useState(new Set());
  const [updatedDates, setUpdatedDates] = useState(new Set());

  const listRef = useRef(null);
  const previousMetricsRef = useRef([]);
  const scrollPositionRef = useRef(0);

  // ===== DETECT NEW/UPDATED METRICS =====
  useEffect(() => {
    const previousDates = new Set(previousMetricsRef.current.map(m => m.date));
    const currentDates = new Set(metrics.map(m => m.date));

    // Detect newly added dates
    const added = new Set();
    for (const date of currentDates) {
      if (!previousDates.has(date)) {
        added.add(date);
      }
    }

    // Detect updated dates
    const updated = new Set();
    for (const metric of metrics) {
      const previousMetric = previousMetricsRef.current.find(m => m.date === metric.date);
      if (previousMetric && JSON.stringify(previousMetric.metrics) !== JSON.stringify(metric.metrics)) {
        updated.add(metric.date);
      }
    }

    if (added.size > 0) {
      setNewlyAddedDates(added);
      setTimeout(() => setNewlyAddedDates(new Set()), 3000);
    }

    if (updated.size > 0) {
      setUpdatedDates(updated);
      setTimeout(() => setUpdatedDates(new Set()), 2000);
    }

    previousMetricsRef.current = metrics;
  }, [metrics]);

  // ===== SCROLL POSITION PRESERVATION =====
  useEffect(() => {
    if (!listRef.current) return;

    const currentMetricsCount = metrics.length;
    const previousMetricsCount = previousMetricsRef.current.length;

    if (currentMetricsCount > previousMetricsCount) {
      const newMetricsCount = currentMetricsCount - previousMetricsCount;

      if (scrollPositionRef.current > 100) {
        const estimatedNewHeight = newMetricsCount * 200;

        requestAnimationFrame(() => {
          if (listRef.current) {
            listRef.current.scrollTop = scrollPositionRef.current + estimatedNewHeight;
          }
        });
      }
    }
  }, [metrics.length]);

  useEffect(() => {
    const listElement = listRef.current;
    if (!listElement) return;

    const handleScroll = () => {
      scrollPositionRef.current = listElement.scrollTop;
    };

    listElement.addEventListener('scroll', handleScroll);
    return () => listElement.removeEventListener('scroll', handleScroll);
  }, []);

  // ===== SORT & PAGINATION =====
  const sortedMetrics = useMemo(() => {
    return [...metrics].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    });
  }, [metrics]);

  const totalPages = Math.ceil(sortedMetrics.length / itemsPerPage);
  const paginatedMetrics = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedMetrics.slice(startIndex, endIndex);
  }, [sortedMetrics, currentPage, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // ===== HELPER FUNCTIONS =====

  const isNewlyAdded = (date) => newlyAddedDates.has(date);
  const isRecentlyUpdated = (date) => updatedDates.has(date);

  const getCardClasses = (date) => {
    const baseClasses = 'group relative bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md border-2 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden';

    if (isNewlyAdded(date)) {
      return `${baseClasses} border-green-400/60 ring-4 ring-green-400/30 animate-slideDown`;
    }

    if (isRecentlyUpdated(date)) {
      return `${baseClasses} border-blue-400/60 ring-2 ring-blue-400/20`;
    }

    return `${baseClasses} border-gray-300/40`;
  };

  const formatMetricValue = (value, metricKey) => {
    if (value === null || value === undefined) return '--';

    if (typeof value === 'object') {
      if (metricKey === 'bloodPressure' && value.systolic && value.diastolic) {
        return `${value.systolic}/${value.diastolic} mmHg`;
      }
      return '--';
    }

    const formats = {
      steps: (v) => v.toLocaleString(),
      calories: (v) => v.toLocaleString(),
      distance: (v) => `${v.toFixed(1)} km`,
      activeMinutes: (v) => `${v} min`,
      sleepHours: (v) => `${v.toFixed(1)} hrs`,
      weight: (v) => `${v.toFixed(1)} kg`,
      heartRate: (v) => `${v} bpm`,
      oxygenSaturation: (v) => `${v}%`,
      bodyTemperature: (v) => `${v.toFixed(1)}°C`,
      hydration: (v) => `${v.toFixed(1)} L`,
      heartPoints: (v) => v.toLocaleString(),
    };

    const formatter = formats[metricKey];
    return formatter ? formatter(value) : value;
  };

  const handleEditClick = (metric) => {
    if (onEdit) onEdit(metric);
  };

  const handleDeleteClick = (date) => {
    setDeletingDate(date);
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (!deletingDate) return;

    try {
      setDeleteLoading(true);
      setDeleteError(null);

      const result = await metricsService.deleteMetric(deletingDate);

      if (result.success) {
        setDeletingDate(null);
        if (onDelete) onDelete(deletingDate);
      } else {
        setDeleteError(result.message || 'Failed to delete metrics');
      }
    } catch (error) {
      setDeleteError(error.message || 'Failed to delete metrics');
    } finally {
      setDeleteLoading(false);
    }
  };

  const cancelDelete = () => {
    setDeletingDate(null);
    setDeleteError(null);
  };

  // ===== RENDER METRIC CARD =====

  const renderMetricCard = (metric) => {
    const { date, metrics: metricsData, source } = metric;
    const isNew = isNewlyAdded(date);
    const isUpdated = isRecentlyUpdated(date);

    const metricIcons = {
      steps: '👟', calories: '🔥', distance: '📏', activeMinutes: '⏱️',
      sleepHours: '😴', weight: '⚖️', heartRate: '❤️', oxygenSaturation: '🫁',
      bloodPressure: '🩸', bodyTemperature: '🌡️', hydration: '💧', heartPoints: '💖',
    };

    const metricLabels = {
      steps: 'Steps', calories: 'Calories', distance: 'Distance', activeMinutes: 'Active Minutes',
      sleepHours: 'Sleep', weight: 'Weight', heartRate: 'Heart Rate', oxygenSaturation: 'SpO2',
      bloodPressure: 'Blood Pressure', bodyTemperature: 'Temperature', hydration: 'Hydration', heartPoints: 'Heart Points',
    };

    const metricColors = {
      steps: 'from-blue-500 to-indigo-600',
      calories: 'from-orange-500 to-red-600',
      distance: 'from-green-500 to-emerald-600',
      activeMinutes: 'from-teal-500 to-cyan-600',
      sleepHours: 'from-indigo-500 to-purple-600',
      weight: 'from-purple-500 to-pink-600',
      heartRate: 'from-pink-500 to-rose-600',
      default: 'from-gray-500 to-slate-600',
    };

    return (
      <div key={date} className={getCardClasses(date)}>
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 pointer-events-none"></div>

        {/* Header */}
        <div className="relative flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {dateUtils.getRelativeDateLabel(date)}
              </h3>
              <span className="text-sm text-gray-600 font-medium">
                {dateUtils.formatDateShort(date)}
              </span>
            </div>

            {/* Badges */}
            {isNew && (
              <span className="px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-green-400 to-emerald-400 text-white rounded-full shadow-md animate-pulse">
                ✨ New
              </span>
            )}
            {isUpdated && !isNew && (
              <span className="px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-blue-400 to-indigo-400 text-white rounded-full shadow-md">
                🔄 Updated
              </span>
            )}
            {source && source !== 'manual' && (
              <span className="px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-full shadow-md">
                {source === 'googlefit' ? '🏃 Google Fit' : '🔄 Synced'}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="small"
              onClick={() => handleEditClick(metric)}
              disabled={deleteLoading}
            >
              ✏️ Edit
            </Button>
            <Button
              variant="danger"
              size="small"
              onClick={() => handleDeleteClick(date)}
              disabled={deleteLoading}
            >
              🗑️ Delete
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="relative grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Object.entries(metricsData).map(([key, value]) => {
            if (value === null || value === undefined || value === 0) return null;

            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600 font-semibold">
                  <span className="text-xl">{metricIcons[key] || '📊'}</span>
                  <span>{metricLabels[key] || key}</span>
                </div>
                <div className={`text-2xl font-extrabold bg-gradient-to-r ${metricColors[key] || metricColors.default} bg-clip-text text-transparent`}>
                  {formatMetricValue(value, key)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Accent Line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50"></div>
      </div>
    );
  };

  // ===== MAIN RENDER =====

  if (isLoading) {
    return <MetricsSkeleton count={3} />;
  }

  if (sortedMetrics.length === 0) {
    return (
      <div className="text-center py-16 bg-gradient-to-br from-gray-50/80 to-blue-50/80 backdrop-blur-md rounded-2xl border-2 border-gray-300/40 shadow-xl">
        <div className="text-7xl mb-6 animate-float">📊</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          No metrics recorded yet
        </h3>
        <p className="text-gray-600 font-medium mb-2">
          {dateRange
            ? 'No metrics recorded for the selected date range.'
            : 'Start tracking your health metrics to see them here!'}
        </p>
        {!dateRange && (
          <p className="text-sm text-gray-500">
            Use the form above to log your daily metrics.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Date Range Info */}
      {dateRange && (
        <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 backdrop-blur-sm border-2 border-blue-300/40 rounded-xl text-sm text-gray-700 font-semibold shadow-md">
          📅 Showing {dateRange.label || `${dateRange.startDate} to ${dateRange.endDate}`}
        </div>
      )}

      {/* Metrics List */}
      <div ref={listRef} className="space-y-6 max-h-[800px] overflow-y-auto pr-2 scrollbar-thin">
        {paginatedMetrics.map(renderMetricCard)}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t-2 border-gray-300/40">
          <div className="text-sm text-gray-700 font-semibold">
            Page {currentPage} of {totalPages} • {sortedMetrics.length} total entries
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="small"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ← Previous
            </Button>
            <Button
              variant="secondary"
              size="small"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next →
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingDate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-gradient-to-br from-white/95 to-gray-50/95 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border-2 border-gray-300/40 animate-scaleIn">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Confirm Delete
            </h3>
            <p className="text-gray-700 mb-6 font-medium">
              Are you sure you want to delete metrics for{' '}
              <strong className="text-red-600">{dateUtils.formatDateShort(deletingDate)}</strong>?
              This action cannot be undone.
            </p>

            {deleteError && (
              <div className="mb-4">
                <Alert type="error" title="Error" message={deleteError} />
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={cancelDelete}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={confirmDelete}
                loading={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

MetricsList.propTypes = {
  metrics: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      metrics: PropTypes.object.isRequired,
      source: PropTypes.string,
    })
  ),
  isLoading: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  dateRange: PropTypes.shape({
    label: PropTypes.string,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
  }),
  itemsPerPage: PropTypes.number,
};

export default MetricsList;
