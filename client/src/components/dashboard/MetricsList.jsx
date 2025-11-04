/**
 * ============================================
 * METRICS LIST COMPONENT
 * ============================================
 *
 * Purpose: Display historical metrics grouped by date
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
 *
 * Props:
 * - metrics: Array of metric objects
 * - isLoading: Loading state
 * - onEdit: Callback when editing
 * - onDelete: Callback when deleting
 * - dateRange: Display current date range
 * - itemsPerPage: Pagination size (default 5)
 */

import { useState, useMemo } from 'react';
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
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-gray-100 rounded-lg p-6 space-y-3 animate-pulse">
          <div className="flex justify-between items-center">
            <div className="h-6 bg-gray-300 rounded w-32"></div>
            <div className="h-5 bg-gray-300 rounded w-24"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="h-10 bg-gray-300 rounded"></div>
            ))}
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <div className="h-8 bg-gray-300 rounded w-16"></div>
            <div className="h-8 bg-gray-300 rounded w-16"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * ============================================
 * INDIVIDUAL METRIC ENTRY COMPONENT
 * ============================================
 */

const MetricEntry = ({ date, metrics, onEdit, onDelete, isDeleting }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const metricIcons = {
    steps: '👟',
    calories: '🔥',
    distance: '🏃',
    activeMinutes: '⏱️',
    weight: '⚖️',
    sleepHours: '😴',
    heartRate: '❤️',
  };

  const formatMetricValue = (key, value) => {
    if (!value && value !== 0) return 'N/A';

    const unitMap = {
      steps: 'steps',
      calories: 'kcal',
      distance: 'km',
      activeMinutes: 'min',
      weight: 'kg',
      sleepHours: 'hrs',
      heartRate: 'bpm',
    };

    const formatted = typeof value === 'number' ? value.toLocaleString('en-US', { maximumFractionDigits: 1 }) : value;
    return `${formatted} ${unitMap[key] || ''}`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header: Date and Actions */}
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {dateUtils.formatDateLong(date)}
          </h3>
          <p className="text-sm text-gray-500">
            {dateUtils.getRelativeDateLabel(date)}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onEdit(date)}
            disabled={isDeleting}
          >
            Edit
          </Button>

          {!showDeleteConfirm ? (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
            >
              Delete
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="danger"
                size="sm"
                onClick={() => onDelete(date)}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Confirm'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Object.entries(metrics).map(([key, value]) => {
          // Skip internal fields
          if (key.startsWith('_') || key === 'id') return null;

          return (
            <div key={key} className="bg-gray-50 rounded p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{metricIcons[key] || '📊'}</span>
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {formatMetricValue(key, value)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="mt-4 pt-4 border-t border-gray-200 bg-red-50 p-3 rounded flex justify-between items-center">
          <p className="text-sm text-red-800">
            Are you sure you want to delete metrics for {dateUtils.formatDateShort(date)}?
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * ============================================
 * EDIT MODAL COMPONENT
 * ============================================
 */

const EditMetricModal = ({ date, metric, onSave, onCancel, isSaving }) => {
  const [formData, setFormData] = useState(metric);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value ? parseFloat(value) : '',
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(date, formData);
  };

  const metricLabels = {
    steps: 'Steps',
    calories: 'Calories',
    distance: 'Distance (km)',
    activeMinutes: 'Active Minutes',
    weight: 'Weight (kg)',
    sleepHours: 'Sleep Hours',
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Edit Metrics for {dateUtils.formatDateShort(date)}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {Object.entries(metricLabels).map(([key, label]) => (
            <div key={key} className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">{label}</label>
              <input
                type="number"
                name={key}
                value={formData[key] || ''}
                onChange={handleInputChange}
                placeholder="0"
                step="0.1"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors[key] && (
                <p className="text-red-500 text-xs">{errors[key]}</p>
              )}
            </div>
          ))}

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * ============================================
 * METRICS LIST COMPONENT
 * ============================================
 */

const MetricsList = ({
  metrics = [],
  isLoading = false,
  onMetricsChange = null,
  dateRange = null,
  itemsPerPage = 5,
}) => {
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [editingDate, setEditingDate] = useState(null);
  const [deletingDate, setDeletingDate] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [alert, setAlert] = useState({ visible: false, type: 'info', title: '', message: '' });

  // ===== HELPER FUNCTIONS =====

  const showAlert = (type, title, message, duration = 4000) => {
    setAlert({ visible: true, type, title, message });
    if (duration > 0) {
      setTimeout(() => {
        setAlert((prev) => ({ ...prev, visible: false }));
      }, duration);
    }
  };

  const hideAlert = () => {
    setAlert((prev) => ({ ...prev, visible: false }));
  };

  // Group metrics by date (newest first)
  const groupedMetrics = useMemo(() => {
    const groups = {};

    metrics.forEach((metric) => {
      const dateKey = metric.date.split('T')[0]; // YYYY-MM-DD
      if (!groups[dateKey]) {
        groups[dateKey] = metric.metrics;
      }
    });

    return Object.entries(groups)
      .sort(([dateA], [dateB]) => dateB.localeCompare(dateA)) // Sort newest first
      .map(([date, metricData]) => ({ date, metrics: metricData }));
  }, [metrics]);

  // Pagination
  const totalPages = Math.ceil(groupedMetrics.length / itemsPerPage);
  const paginatedMetrics = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return groupedMetrics.slice(startIndex, startIndex + itemsPerPage);
  }, [groupedMetrics, currentPage, itemsPerPage]);

  // ===== EVENT HANDLERS =====

  const handleEdit = (date) => {
    const metricEntry = metrics.find((m) => m.date.split('T')[0] === date);
    if (metricEntry) {
      setEditingDate(date);
    }
  };

  const handleSaveEdit = async (date, updatedMetrics) => {
    setIsSaving(true);

    try {
      const result = await metricsService.updateMetric(date, updatedMetrics);

      if (result.success) {
        showAlert('success', 'Success! ✓', `Metrics updated for ${dateUtils.formatDateShort(date)}`);
        setEditingDate(null);

        if (onMetricsChange && typeof onMetricsChange === 'function') {
          onMetricsChange();
        }
      } else {
        showAlert('error', 'Error', result.message || 'Failed to update metrics');
      }
    } catch (error) {
      showAlert('error', 'Error', error.message || 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (date) => {
    setDeletingDate(date);
    setIsDeleting(true);

    try {
      const result = await metricsService.deleteMetric(date);

      if (result.success) {
        showAlert('success', 'Deleted! ✓', `Metrics removed for ${dateUtils.formatDateShort(date)}`);
        setDeletingDate(null);

        if (onMetricsChange && typeof onMetricsChange === 'function') {
          onMetricsChange();
        }
      } else {
        showAlert('error', 'Error', result.message || 'Failed to delete metrics');
      }
    } catch (error) {
      showAlert('error', 'Error', error.message || 'An error occurred');
    } finally {
      setIsDeleting(false);
      setDeletingDate(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingDate(null);
  };

  // ===== RENDER =====

  if (isLoading) {
    return <MetricsSkeleton count={itemsPerPage} />;
  }

  return (
    <div className="w-full">
      {/* Alert */}
      {alert.visible && (
        <div className="mb-6">
          <Alert
            type={alert.type}
            title={alert.title}
            message={alert.message}
            onClose={hideAlert}
            dismissible
          />
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Metrics History</h2>
        {dateRange && (
          <p className="text-gray-600 mt-1">
            Showing {dateRange.label || `${dateRange.startDate} to ${dateRange.endDate}`}
          </p>
        )}
      </div>

      {/* Empty State */}
      {paginatedMetrics.length === 0 && !isLoading ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No metrics found
          </h3>
          <p className="text-gray-600 mb-6">
            {dateRange
              ? `No metrics recorded for the selected date range. Try adjusting your search or add new metrics.`
              : `Start tracking your health metrics to see them here!`}
          </p>
          {!dateRange && (
            <p className="text-gray-500 text-sm">
              Use the form above to log your daily metrics.
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Metrics List */}
          <div className="space-y-4 mb-6">
            {paginatedMetrics.map(({ date, metrics: metricData }) => (
              <MetricEntry
                key={date}
                date={date}
                metrics={metricData}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isDeleting={deletingDate === date && isDeleting}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
                {' • '}
                {groupedMetrics.length} total entries
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  ← Previous
                </Button>

                {/* Page Numbers */}
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-3 py-1 rounded transition ${
                        currentPage === i + 1
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next →
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit Modal */}
      {editingDate && (
        <EditMetricModal
          date={editingDate}
          metric={metrics.find((m) => m.date.split('T')[0] === editingDate)?.metrics || {}}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
          isSaving={isSaving}
        />
      )}
    </div>
  );
};

export default MetricsList;
