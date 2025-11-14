/**
 * ============================================
 * METRICS LIST COMPONENT (WITH REAL-TIME UPDATES)
 * ============================================
 *
 * Purpose: Display historical metrics grouped by date
 * ENHANCED: Scroll position preservation and update indicators
 *
 * Features:
 * - Grouped by date display (newest first)
 * - Shows all metrics for each date
 * - Edit and delete buttons per entry
 * - Pagination (configurable items per page)
 * - Loading skeletons
 * - Empty state
 * - Edit modal with form
 * - Delete confirmation
 * - Responsive grid layout
 * - Error handling
 * - NEW: Scroll position preservation on prepend
 * - NEW: Visual indicators for newly added/updated entries
 * - NEW: Flash animation on updates
 * - NEW: Real-time sync badges
 *
 * Props:
 * - metrics: Array of metric objects
 * - isLoading: Loading state
 * - onEdit: Callback when editing
 * - onDelete: Callback when deleting
 * - dateRange: Display current date range
 * - itemsPerPage: Pagination size (default 5)
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import * as dateUtils from '../../utils/dateUtils';
import * as metricsService from '../../services/metricsService';
import Button from '../common/Button';
import Alert from '../common/Alert';

/**
 * ============================================
 * LOADING SKELETON COMPONENT
 * ============================================
 */
const MetricsSkeleton = ({ count = 3 }) => {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-8 bg-gray-200 rounded w-full"></div>
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

  // ===== NEW: STATE FOR REAL-TIME UPDATES =====
  const [newlyAddedDates, setNewlyAddedDates] = useState(new Set());
  const [updatedDates, setUpdatedDates] = useState(new Set());
  const listRef = useRef(null);
  const previousMetricsRef = useRef([]);
  const scrollPositionRef = useRef(0);

  /**
   * ============================================
   * EFFECT: DETECT NEWLY ADDED/UPDATED METRICS
   * ============================================
   *
   * Compares current metrics with previous metrics
   * to determine which dates were added or updated
   */
  useEffect(() => {
    const previousDates = new Set(previousMetricsRef.current.map(m => m.date));
    const currentDates = new Set(metrics.map(m => m.date));

    // Detect newly added dates
    const added = new Set();
    for (const date of currentDates) {
      if (!previousDates.has(date)) {
        added.add(date);
        console.log(`[MetricsList] New metric detected: ${date}`);
      }
    }

    // Detect updated dates (existing dates with changed data)
    const updated = new Set();
    for (const metric of metrics) {
      const previousMetric = previousMetricsRef.current.find(m => m.date === metric.date);
      if (previousMetric && JSON.stringify(previousMetric.metrics) !== JSON.stringify(metric.metrics)) {
        updated.add(metric.date);
        console.log(`[MetricsList] Updated metric detected: ${metric.date}`);
      }
    }

    // Update state
    if (added.size > 0) {
      setNewlyAddedDates(added);
      // Clear indicators after 3 seconds
      setTimeout(() => {
        setNewlyAddedDates(new Set());
      }, 3000);
    }

    if (updated.size > 0) {
      setUpdatedDates(updated);
      // Clear indicators after 2 seconds
      setTimeout(() => {
        setUpdatedDates(new Set());
      }, 2000);
    }

    // Update previous metrics ref
    previousMetricsRef.current = metrics;
  }, [metrics]);

  /**
   * ============================================
   * EFFECT: PRESERVE SCROLL POSITION
   * ============================================
   *
   * When metrics are prepended (new metrics added at top),
   * adjust scroll position to maintain user's view
   */
  useEffect(() => {
    if (!listRef.current) return;

    const currentMetricsCount = metrics.length;
    const previousMetricsCount = previousMetricsRef.current.length;

    // Check if new metrics were prepended
    if (currentMetricsCount > previousMetricsCount) {
      const newMetricsCount = currentMetricsCount - previousMetricsCount;

      // Only adjust if user was scrolled down (not at top)
      if (scrollPositionRef.current > 100) {
        console.log(
          `[MetricsList] ${newMetricsCount} new metric(s) prepended, preserving scroll position`
        );

        // Calculate approximate height of new items (estimate 200px per item)
        const estimatedNewHeight = newMetricsCount * 200;

        // Adjust scroll position
        requestAnimationFrame(() => {
          if (listRef.current) {
            listRef.current.scrollTop = scrollPositionRef.current + estimatedNewHeight;
          }
        });
      }
    }
  }, [metrics.length]);

  /**
   * ============================================
   * EFFECT: TRACK SCROLL POSITION
   * ============================================
   */
  useEffect(() => {
    const listElement = listRef.current;
    if (!listElement) return;

    const handleScroll = () => {
      scrollPositionRef.current = listElement.scrollTop;
    };

    listElement.addEventListener('scroll', handleScroll);
    return () => listElement.removeEventListener('scroll', handleScroll);
  }, []);

  // ===== SORT METRICS BY DATE (DESCENDING) =====
  const sortedMetrics = useMemo(() => {
    return [...metrics].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA; // Descending order (newest first)
    });
  }, [metrics]);

  // ===== PAGINATION =====
  const totalPages = Math.ceil(sortedMetrics.length / itemsPerPage);
  const paginatedMetrics = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedMetrics.slice(startIndex, endIndex);
  }, [sortedMetrics, currentPage, itemsPerPage]);

  // Reset to page 1 when metrics change significantly
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // ===== HELPER FUNCTIONS =====

  /**
   * Check if a date is newly added
   */
  const isNewlyAdded = (date) => {
    return newlyAddedDates.has(date);
  };

  /**
   * Check if a date was recently updated
   */
  const isRecentlyUpdated = (date) => {
    return updatedDates.has(date);
  };

  /**
   * Get visual indicator classes for a metric card
   */
  const getCardClasses = (date) => {
    const baseClasses = 'bg-white rounded-lg shadow-sm p-6 transition-all duration-300';

    if (isNewlyAdded(date)) {
      return `${baseClasses} border-2 border-green-400 shadow-lg animate-slideInDown`;
    }

    if (isRecentlyUpdated(date)) {
      return `${baseClasses} border-2 border-blue-400 shadow-md`;
    }

    return baseClasses;
  };

  /**
   * Format metric value for display
   */
  const formatMetricValue = (value, metricKey) => {
    if (value === null || value === undefined) return '--';

    // Handle object-based metrics
    if (typeof value === 'object') {
      if (metricKey === 'bloodPressure' && value.systolic && value.diastolic) {
        return `${value.systolic}/${value.diastolic} mmHg`;
      }
      // For other objects, return a placeholder
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

  /**
   * Handle edit button click
   */
  const handleEditClick = (metric) => {
    if (onEdit) onEdit(metric);
  };

  /**
   * Handle delete button click
   */
  const handleDeleteClick = (date) => {
    setDeletingDate(date);
    setDeleteError(null);
  };

  /**
   * Confirm delete
   */
  const confirmDelete = async () => {
    if (!deletingDate) return;

    try {
      setDeleteLoading(true);
      setDeleteError(null);

      const result = await metricsService.deleteMetric(deletingDate);

      if (result.success) {
        console.log(`[MetricsList] Metrics deleted for ${deletingDate}`);
        setDeletingDate(null);
        if (onDelete) onDelete(deletingDate);
      } else {
        setDeleteError(result.message || 'Failed to delete metrics');
      }
    } catch (error) {
      console.error('[MetricsList] Delete error:', error);
      setDeleteError(error.message || 'Failed to delete metrics');
    } finally {
      setDeleteLoading(false);
    }
  };

  /**
   * Cancel delete
   */
  const cancelDelete = () => {
    setDeletingDate(null);
    setDeleteError(null);
  };

  // ===== RENDER FUNCTIONS =====

  /**
   * Render individual metric card
   */
  const renderMetricCard = (metric) => {
    const { date, metrics: metricsData, source } = metric;
    const isNew = isNewlyAdded(date);
    const isUpdated = isRecentlyUpdated(date);

    return (
      <div key={date} className={getCardClasses(date)}>
        {/* Header: Date + Actions */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {dateUtils.getRelativeDateLabel(date)}
            </h3>
            <span className="text-sm text-gray-500">
              {dateUtils.formatDateShort(date)}
            </span>

            {/* NEW/UPDATED Badge */}
            {isNew && (
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full animate-pulse">
                New
              </span>
            )}
            {isUpdated && !isNew && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                Updated
              </span>
            )}

            {/* Source Badge */}
            {source && source !== 'manual' && (
              <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                {source === 'googlefit' ? 'Google Fit' : 'Synced'}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleEditClick(metric)}
              disabled={deleteLoading}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDeleteClick(date)}
              disabled={deleteLoading}
            >
              Delete
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Object.entries(metricsData).map(([key, value]) => {
            if (value === null || value === undefined || value === 0) return null;

            const metricIcons = {
              steps: '👟',
              calories: '🔥',
              distance: '📏',
              activeMinutes: '⏱️',
              sleepHours: '😴',
              weight: '⚖️',
              heartRate: '❤️',
              oxygenSaturation: '🫁',
              bloodPressure: '🩸',
              bodyTemperature: '🌡️',
              hydration: '💧',
              heartPoints: '💖',
            };

            const metricLabels = {
              steps: 'Steps',
              calories: 'Calories',
              distance: 'Distance',
              activeMinutes: 'Active Minutes',
              sleepHours: 'Sleep',
              weight: 'Weight',
              heartRate: 'Heart Rate',
              oxygenSaturation: 'SpO2',
              bloodPressure: 'Blood Pressure',
              bodyTemperature: 'Temperature',
              hydration: 'Hydration',
              heartPoints: 'Heart Points',
            };

            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <span>{metricIcons[key] || '📊'}</span>
                  <span>{metricLabels[key] || key}</span>
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatMetricValue(value, key)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ===== MAIN RENDER =====

  // Loading state
  if (isLoading) {
    return <MetricsSkeleton count={3} />;
  }

  // Empty state
  if (sortedMetrics.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No metrics recorded yet
        </h3>
        <p className="text-gray-600 mb-4">
          {dateRange
            ? 'No metrics recorded for the selected date range. Try adjusting your search or add new metrics.'
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
    <div className="space-y-6">
      {/* Date Range Info */}
      {dateRange && (
        <div className="text-sm text-gray-600">
          Showing {dateRange.label || `${dateRange.startDate} to ${dateRange.endDate}`}
        </div>
      )}

      {/* Metrics List with Scroll Preservation */}
      <div ref={listRef} className="space-y-6 max-h-[800px] overflow-y-auto">
        {paginatedMetrics.map(renderMetricCard)}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages} ({sortedMetrics.length} total)
          </div>
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Confirm Delete
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete metrics for{' '}
              <strong>{dateUtils.formatDateShort(deletingDate)}</strong>? This
              action cannot be undone.
            </p>

            {deleteError && (
              <Alert variant="error" className="mb-4">
                {deleteError}
              </Alert>
            )}

            <div className="flex justify-end space-x-2">
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
                disabled={deleteLoading}
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
