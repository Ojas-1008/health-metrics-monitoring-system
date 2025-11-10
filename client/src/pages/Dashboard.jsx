/**
 * ============================================
 * DASHBOARD PAGE WITH COMPLETE STATE MANAGEMENT
 * ============================================
 *
 * Purpose: Main dashboard with comprehensive state management
 *
 * State Structure:
 * - Metrics State: todayMetrics, allMetrics, isLoadingMetrics
 * - Summary State: summaryStats, isLoadingSummary
 * - Date Range State: dateRange, selectedPeriod
 * - UI State: showForm, showSidebar, isRefreshing
 * - Notification State: alert, lastAction
 *
 * Effects:
 * - Initial load on mount
 * - Reload on date range change
 * - Auto-refresh after data changes
 * - Cleanup on unmount
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as metricsService from '../services/metricsService';
import * as dateUtils from '../utils/dateUtils';
import { getAuthToken } from '../api/axiosConfig';
import { connectSSE, disconnectSSE } from '../services/sseService';
import MetricsForm from '../components/dashboard/MetricsForm';
import MetricCard from '../components/dashboard/MetricCard';
import MetricsList from '../components/dashboard/MetricsList';
import SummaryStats from '../components/dashboard/SummaryStats';
import GoalsSection from '../components/dashboard/GoalsSection';
import GoogleFitConnection from '../components/dashboard/GoogleFitConnection';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';

/**
 * ============================================
 * CONSTANTS
 * ============================================
 */

// Reserved for future state reset functionality
// eslint-disable-next-line no-unused-vars
const INITIAL_STATE = {
  metrics: {
    today: null,
    all: [],
    isLoading: false,
    error: null,
    lastFetch: null,
  },
  summary: {
    data: null,
    isLoading: false,
    error: null,
    period: 'week',
    lastFetch: null,
  },
  dateRange: {
    selected: 'last7days',
    range: null,
  },
  ui: {
    showForm: false,
    showSidebar: true,
    isRefreshing: false,
  },
  notification: {
    visible: false,
    type: 'info',
    title: '',
    message: '',
    autoHide: true,
  },
};

/**
 * ============================================
 * DASHBOARD PAGE COMPONENT
 * ============================================
 */

const Dashboard = () => {
  // ===== STATE MANAGEMENT =====

  // Metrics State
  const [todayMetrics, setTodayMetrics] = useState(null);
  const [allMetrics, setAllMetrics] = useState([]);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  // Reserved for future error display UI
  // eslint-disable-next-line no-unused-vars
  const [metricsError, setMetricsError] = useState(null);

  // Goals State
  const [goals, setGoals] = useState(null);

  // Previous Day Metrics State (for trend comparison)
  const [previousDayMetrics, setPreviousDayMetrics] = useState(null);
  const [trendData, setTrendData] = useState({
    steps: null,
    calories: null,
    weight: null,
    sleepHours: null,
  });

  // Summary Stats State
  // Reserved for future summary display UI
  // eslint-disable-next-line no-unused-vars
  const [summaryStats, setSummaryStats] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [summaryError, setSummaryError] = useState(null);
  const [summaryPeriod, setSummaryPeriod] = useState('week');

  // Summary period options
  const summaryPeriods = [
    { key: 'week', label: 'This Week', icon: '📅' },
    { key: 'month', label: 'This Month', icon: '📆' },
    { key: 'year', label: 'This Year', icon: '📊' },
  ];

  // Date Range State (legacy - kept for backward compatibility)
  // eslint-disable-next-line no-unused-vars
  const [dateRange, setDateRange] = useState(() => dateUtils.getLast7Days());
  // eslint-disable-next-line no-unused-vars
  const [selectedPeriod, setSelectedPeriod] = useState('last7days');

  // Metrics List State (separate from main date range)
  const [listDateRange, setListDateRange] = useState(() => dateUtils.getLast7Days());
  const [listPeriodSelected, setListPeriodSelected] = useState('last7days');

  // UI State
  const [showForm, setShowForm] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form Specific State
  // Reserved for future form submission loading indicator
  // eslint-disable-next-line no-unused-vars
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [formError, setFormError] = useState(null);

  // Notification State
  const [alert, setAlert] = useState({ visible: false, type: 'info', title: '', message: '' });

  // Refs for tracking
  const lastActionRef = useRef(null);
  const refreshTimeoutRef = useRef(null);

  // ===== HELPER FUNCTIONS =====

  /**
   * Show notification alert
   */
  const showAlert = useCallback((type, title, message, duration = 4000) => {
    setAlert({ visible: true, type, title, message });

    if (duration > 0) {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = setTimeout(() => {
        setAlert((prev) => ({ ...prev, visible: false }));
      }, duration);
    }
  }, []);

  /**
   * Hide notification alert
   */
  const hideAlert = useCallback(() => {
    setAlert((prev) => ({ ...prev, visible: false }));
  }, []);

  /**
   * Track last action for debugging
   */
  const trackAction = useCallback((action, details = {}) => {
    lastActionRef.current = {
      action,
      timestamp: new Date().toISOString(),
      details,
    };

    if (import.meta.env.VITE_NODE_ENV === 'development') {
      console.log('📊 Dashboard Action:', lastActionRef.current);
    }
  }, []);

  /**
   * Handle goals update
   */
  const handleGoalsUpdate = useCallback((updatedGoals) => {
    setGoals(updatedGoals);
    trackAction('GOALS_UPDATED', { goals: updatedGoals });
  }, [trackAction]);

  // ===== TREND CALCULATION UTILITIES =====

  /**
   * Calculate trend between two values
   * @param {number} current - Current value
   * @param {number} previous - Previous value
   * @returns {object} - { direction: 'up'|'down', percentage: number }
   */
  const calculateTrend = useCallback((current, previous) => {
    if (!current || !previous) return null;

    const difference = current - previous;
    const percentage = Math.round(Math.abs((difference / previous) * 100));

    return {
      direction: difference > 0 ? 'up' : 'down',
      percentage: percentage > 0 ? percentage : 0,
    };
  }, []);

  /**
   * Get goal value for a metric type
   */
  const getGoalForMetric = useCallback((metricType) => {
    const goals = {
      steps: 10000,
      calories: 2000,
      weight: null, // No goal for weight
      sleepHours: 8,
    };

    return goals[metricType];
  }, []);

  /**
   * Determine color for each metric
   * Reserved for dynamic color assignment
   */
  // eslint-disable-next-line no-unused-vars
  const getColorForMetric = useCallback((metricType) => {
    const colors = {
      steps: 'steps',
      calories: 'calories',
      weight: 'weight',
      sleepHours: 'sleep',
    };

    return colors[metricType];
  }, []);

  // ===== DATA FETCHING FUNCTIONS =====

  /**
   * Load today's metrics
   */
  const loadTodayMetrics = useCallback(async () => {
    try {
      setIsLoadingMetrics(true);
      setMetricsError(null);

      const today = dateUtils.formatDateISO(new Date());
      const result = await metricsService.getMetricByDate(today);

      if (result.success) {
        setTodayMetrics(result.data);
        trackAction('LOAD_TODAY_METRICS', { success: true });
      } else {
        setTodayMetrics(null);
        setMetricsError(result.message);
        trackAction('LOAD_TODAY_METRICS', { success: false, error: result.message });
      }
    } catch (error) {
      console.error('Error loading today metrics:', error);
      setTodayMetrics(null);
      setMetricsError(error.message || 'Failed to load today metrics');
      trackAction('LOAD_TODAY_METRICS', { success: false, error: error.message });
    } finally {
      setIsLoadingMetrics(false);
    }
  }, [trackAction]);

  /**
   * Load previous day metrics for trend comparison
   */
  const loadPreviousDayMetrics = useCallback(async () => {
    try {
      const yesterday = dateUtils.subtractDays(new Date(), 1);
      const yesterdayDate = dateUtils.formatDateISO(yesterday);

      const result = await metricsService.getMetricByDate(yesterdayDate);

      if (result.success && result.data) {
        setPreviousDayMetrics(result.data);

        // Calculate trends
        const trends = {
          steps: calculateTrend(
            todayMetrics?.metrics?.steps,
            result.data?.metrics?.steps
          ),
          calories: calculateTrend(
            todayMetrics?.metrics?.calories,
            result.data?.metrics?.calories
          ),
          weight: calculateTrend(
            todayMetrics?.metrics?.weight,
            result.data?.metrics?.weight
          ),
          sleepHours: calculateTrend(
            todayMetrics?.metrics?.sleepHours,
            result.data?.metrics?.sleepHours
          ),
        };

        setTrendData(trends);
        trackAction('LOAD_PREVIOUS_DAY_METRICS', { success: true });
      } else {
        setPreviousDayMetrics(null);
        trackAction('LOAD_PREVIOUS_DAY_METRICS', {
          success: false,
          reason: 'No data found',
        });
      }
    } catch (error) {
      console.error('Error loading previous day metrics:', error);
      setPreviousDayMetrics(null);
      trackAction('LOAD_PREVIOUS_DAY_METRICS', {
        success: false,
        error: error.message,
      });
    }
  }, [todayMetrics, calculateTrend, trackAction]);

  /**
   * Load metrics for date range
   */
  const loadMetricsRange = useCallback(async () => {
    try {
      setIsLoadingMetrics(true);
      setMetricsError(null);

      const result = await metricsService.getMetrics(listDateRange.startDate, listDateRange.endDate);

      if (result.success) {
        setAllMetrics(result.data);
        trackAction('LOAD_METRICS_RANGE', {
          success: true,
          count: result.data?.length || 0,
        });
      } else {
        setAllMetrics([]);
        setMetricsError(result.message);
        trackAction('LOAD_METRICS_RANGE', { success: false, error: result.message });
      }
    } catch (error) {
      console.error('Error loading metrics range:', error);
      setAllMetrics([]);
      setMetricsError(error.message || 'Failed to load metrics');
      trackAction('LOAD_METRICS_RANGE', { success: false, error: error.message });
    } finally {
      setIsLoadingMetrics(false);
    }
  }, [listDateRange, trackAction]);

  /**
   * Load summary statistics
   */
  const loadSummaryStats = useCallback(async (period = 'week') => {
    try {
      setIsLoadingSummary(true);
      setSummaryError(null);

      const result = await metricsService.getMetricsSummary(period);

      if (result.success) {
        setSummaryStats(result.data);
        setSummaryPeriod(period);
        trackAction('LOAD_SUMMARY_STATS', { success: true, period });
      } else {
        setSummaryStats(null);
        setSummaryError(result.message);
        trackAction('LOAD_SUMMARY_STATS', { success: false, period, error: result.message });
      }
    } catch (error) {
      console.error('Error loading summary stats:', error);
      setSummaryStats(null);
      setSummaryError(error.message || 'Failed to load summary stats');
      trackAction('LOAD_SUMMARY_STATS', { success: false, error: error.message });
    } finally {
      setIsLoadingSummary(false);
    }
  }, [trackAction]);

  /**
   * Master refresh function - loads all data
   */
  const refreshAllData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      trackAction('REFRESH_ALL', { timestamp: new Date().toISOString() });

      // Load all data in parallel for performance
      await Promise.all([
        loadTodayMetrics(),
        loadMetricsRange(),
        loadSummaryStats(summaryPeriod),
      ]);

      showAlert('success', 'Refreshed! ✓', 'All data updated successfully', 2000);
    } catch (error) {
      console.error('Error refreshing all data:', error);
      showAlert('error', 'Refresh Failed', 'Could not refresh all data');
    } finally {
      setIsRefreshing(false);
    }
  }, [loadTodayMetrics, loadMetricsRange, loadSummaryStats, summaryPeriod, showAlert, trackAction]);

  /**
   * Handle period change (legacy - kept for backward compatibility)
   */
  // eslint-disable-next-line no-unused-vars
  const handlePeriodChange = useCallback((periodKey) => {
    setSelectedPeriod(periodKey);
    trackAction('CHANGE_PERIOD', { period: periodKey });

    let newRange;

    switch (periodKey) {
      case 'today':
        newRange = dateUtils.getDateRange(
          dateUtils.formatDateISO(new Date()),
          dateUtils.formatDateISO(new Date())
        );
        break;
      case 'last7days':
        newRange = dateUtils.getLast7Days();
        break;
      case 'last30days':
        newRange = dateUtils.getLast30Days();
        break;
      case 'last90days':
        newRange = dateUtils.getLast90Days();
        break;
      case 'currentMonth':
        newRange = dateUtils.getCurrentMonth();
        break;
      case 'currentYear':
        newRange = dateUtils.getCurrentYear();
        break;
      default:
        newRange = dateUtils.getLast7Days();
    }

    setDateRange(newRange);
  }, [trackAction]);

  /**
   * Handle metrics form submission
   */
  const handleMetricSuccess = useCallback(() => {
    trackAction('METRIC_ADDED', {
      timestamp: new Date().toISOString(),
      source: 'MetricsForm',
    });

    // Show success notification
    showAlert('success', 'Success! 🎉', 'Metric recorded successfully', 3000);

    // Close form automatically
    setShowForm(false);
    setFormError(null);

    // Refresh all relevant data
    loadTodayMetrics();
    loadMetricsRange();

    // Optional: Scroll to metrics list
    setTimeout(() => {
      const element = document.getElementById('metrics-list-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 500);
  }, [loadTodayMetrics, loadMetricsRange, showAlert, trackAction]);

  /**
   * Handle metrics form submission error
   */
  const handleMetricError = useCallback((error) => {
    trackAction('METRIC_FORM_ERROR', {
      timestamp: new Date().toISOString(),
      error: error?.message || 'Unknown error',
    });

    setFormError(error?.message || 'Failed to save metric');
    showAlert('error', 'Error ❌', error?.message || 'Failed to save metric', 5000);
  }, [showAlert, trackAction]);

  /**
   * Toggle form visibility
   */
  const toggleFormVisibility = useCallback(() => {
    setShowForm((prev) => !prev);
    setFormError(null);
    trackAction('TOGGLE_FORM', { showForm: !showForm });
  }, [showForm, trackAction]);

  /**
   * Close form
   */
  const closeForm = useCallback(() => {
    setShowForm(false);
    setFormError(null);
    trackAction('CLOSE_FORM');
  }, [trackAction]);

  /**
   * Handle metrics updated or deleted (legacy - kept for backward compatibility)
   */
  // eslint-disable-next-line no-unused-vars
  const handleMetricsChange = useCallback(() => {
    trackAction('METRICS_CHANGED', { timestamp: new Date().toISOString() });
    loadTodayMetrics();
    loadMetricsRange();
  }, [loadTodayMetrics, loadMetricsRange, trackAction]);

  /**
   * Handle date range change for metrics list
   */
  const handleListDateRangeChange = useCallback((periodKey) => {
    setListPeriodSelected(periodKey);
    trackAction('LIST_PERIOD_CHANGED', { period: periodKey });

    let newRange;

    switch (periodKey) {
      case 'today':
        newRange = dateUtils.getDateRange(
          dateUtils.formatDateISO(new Date()),
          dateUtils.formatDateISO(new Date())
        );
        break;
      case 'last7days':
        newRange = dateUtils.getLast7Days();
        break;
      case 'last30days':
        newRange = dateUtils.getLast30Days();
        break;
      case 'last90days':
        newRange = dateUtils.getLast90Days();
        break;
      case 'currentMonth':
        newRange = dateUtils.getCurrentMonth();
        break;
      case 'currentYear':
        newRange = dateUtils.getCurrentYear();
        break;
      default:
        newRange = dateUtils.getLast7Days();
    }

    setListDateRange(newRange);
  }, [trackAction]);

  /**
   * Handle when metrics list changes (edit/delete)
   */
  const handleMetricsListChange = useCallback(() => {
    trackAction('METRICS_LIST_CHANGED', {
      timestamp: new Date().toISOString(),
    });

    // Reload all data
    loadTodayMetrics();
    loadMetricsRange();
    loadSummaryStats(summaryPeriod);

    // Show success message
    showAlert('success', 'Updated! ✓', 'Your changes have been saved', 3000);
  }, [loadTodayMetrics, loadMetricsRange, loadSummaryStats, summaryPeriod, showAlert, trackAction]);

  /**
   * Handle summary period change
   */
  const handleSummaryPeriodChange = useCallback((period) => {
    trackAction('SUMMARY_PERIOD_CHANGED', { period });
    loadSummaryStats(period);
  }, [loadSummaryStats, trackAction]);

  // ===== EFFECTS =====

  /**
   * Initial load on component mount
   */
  useEffect(() => {
    trackAction('DASHBOARD_MOUNTED');

    // Load all data on mount
    loadTodayMetrics();
    loadMetricsRange();
    loadSummaryStats('week');

    // Connect to SSE for real-time updates
    const token = getAuthToken();
    if (token) {
      connectSSE(token, {
        onConnect: () => {
          console.log('[Dashboard] SSE connected for real-time updates');
        },
        onConnected: (data) => {
          console.log('[Dashboard] SSE authenticated and ready:', data);
        },
        onMetricsUpdate: (data) => {
          console.log('[Dashboard] Real-time metrics update:', data);
          // Refresh metrics data when updated via SSE
          loadTodayMetrics();
          loadMetricsRange();
        },
        onGoalsUpdate: (data) => {
          console.log('[Dashboard] Real-time goals update:', data);
          // GoalsSection component handles its own data loading
          // No need to refresh here as component will reload when needed
        },
        onGoogleFitSync: (data) => {
          console.log('[Dashboard] Google Fit sync completed:', data);
          // Refresh all data after sync
          loadTodayMetrics();
          loadMetricsRange();
          loadSummaryStats(summaryPeriod);
        },
        onError: (error) => {
          console.error('[Dashboard] SSE connection error:', error);
        }
      });
    }

    return () => {
      trackAction('DASHBOARD_UNMOUNTED');
      // Disconnect SSE on unmount
      disconnectSSE();
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - runs once on mount

  /**
   * Load metrics when date range changes
   */
  useEffect(() => {
    trackAction('DATE_RANGE_CHANGED', {
      startDate: listDateRange.startDate,
      endDate: listDateRange.endDate,
    });

    loadMetricsRange();
  }, [listDateRange, loadMetricsRange, trackAction]);

  /**
   * Load previous day metrics when today metrics load
   */
  useEffect(() => {
    if (todayMetrics) {
      loadPreviousDayMetrics();
    }
  }, [todayMetrics, loadPreviousDayMetrics]);

  // ===== RENDER =====

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Alert - Top Right */}
      {alert.visible && (
        <div className="fixed top-4 right-4 z-50 w-full max-w-md">
          <Alert
            type={alert.type}
            title={alert.title}
            message={alert.message}
            onClose={hideAlert}
            dismissible
          />
        </div>
      )}

      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* ===== SIDEBAR ===== */}
        {showSidebar && (
          <aside className="w-full lg:w-64 bg-white border-b lg:border-r border-gray-200 p-6 lg:min-h-screen overflow-y-auto">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Navigation</h2>
              <nav className="space-y-2">
                <a
                  href="#dashboard"
                  className="block px-4 py-2 rounded-lg bg-blue-100 text-blue-700 font-medium"
                >
                  📊 Dashboard
                </a>
                <a
                  href="#analytics"
                  className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                >
                  📈 Analytics (Day 7)
                </a>
                <a
                  href="#goals"
                  className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                >
                  🎯 Goals
                </a>
                <a
                  href="#settings"
                  className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                >
                  ⚙️ Settings
                </a>
              </nav>
            </div>

            {/* State Info (Development Only) */}
            {import.meta.env.VITE_NODE_ENV === 'development' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs space-y-1">
                <p className="font-semibold text-yellow-900">State Info:</p>
                <p>Today Loaded: {todayMetrics ? '✓' : '✗'}</p>
                <p>Metrics Count: {allMetrics.length}</p>
                <p>Summary Period: {summaryPeriod}</p>
                <p>Refreshing: {isRefreshing ? '⟳' : '✓'}</p>
              </div>
            )}

            {/* Sidebar Info */}
            <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Quick Tips</h3>
              <ul className="text-xs text-gray-600 space-y-2">
                <li>✓ Log metrics daily</li>
                <li>✓ Set realistic goals</li>
                <li>✓ Check analytics Day 7</li>
              </ul>
            </div>
          </aside>
        )}

        {/* ===== MAIN CONTENT ===== */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {/* Mobile Sidebar Toggle */}
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="lg:hidden mb-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium"
          >
            {showSidebar ? '✕ Hide' : '☰ Show'} Navigation
          </button>

          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome back! 👋
                </h1>
                <p className="text-gray-600 mt-1">
                  {dateUtils.formatDateLong(new Date())}
                </p>
              </div>

              <div className="flex gap-2 flex-wrap">
                {/* Main CTA Button - Add Metrics */}
                <Button
                  variant="primary"
                  onClick={toggleFormVisibility}
                  disabled={isRefreshing}
                  className="flex items-center gap-2"
                >
                  <span className="text-lg">+</span>
                  <span>{showForm ? 'Close' : 'Add Metrics'}</span>
                </Button>

                {/* Refresh Button */}
                <Button
                  variant="secondary"
                  onClick={refreshAllData}
                  disabled={isRefreshing}
                  className="flex items-center gap-2"
                >
                  <span>{isRefreshing ? '⟳' : '🔄'}</span>
                  <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* ===== ADVANCED QUICK STATS SECTION ===== */}
          <div className="mb-8">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Today&apos;s Stats</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {dateUtils.formatDateLong(new Date())} •{' '}
                  {todayMetrics ? 'Updated' : 'No data logged yet'}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={loadTodayMetrics}
                  disabled={isLoadingMetrics}
                  className="flex items-center gap-2"
                >
                  <span>{isLoadingMetrics ? '⟳' : '🔄'}</span>
                  <span className="hidden sm:inline">Refresh</span>
                </Button>

                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2"
                >
                  <span>+</span>
                  <span className="hidden sm:inline">Add Metrics</span>
                </Button>
              </div>
            </div>

            {/* Stats Grid */}
            {isLoadingMetrics && !todayMetrics ? (
              /* Loading Skeleton */
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 rounded-lg h-40 mb-2"></div>
                  </div>
                ))}
              </div>
            ) : todayMetrics ? (
              /* Stats Cards */
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Steps */}
                <MetricCard
                  icon="👟"
                  title="Steps Taken"
                  value={todayMetrics.metrics?.steps || 0}
                  unit="steps"
                  color="steps"
                  goal={getGoalForMetric('steps')}
                  trend={trendData.steps}
                  lastValue={previousDayMetrics?.metrics?.steps}
                />

                {/* Calories */}
                <MetricCard
                  icon="🔥"
                  title="Calories Burned"
                  value={todayMetrics.metrics?.calories || 0}
                  unit="kcal"
                  color="calories"
                  goal={getGoalForMetric('calories')}
                  trend={trendData.calories}
                  lastValue={previousDayMetrics?.metrics?.calories}
                />

                {/* Sleep */}
                <MetricCard
                  icon="😴"
                  title="Sleep Quality"
                  value={todayMetrics.metrics?.sleepHours || 0}
                  unit="hours"
                  color="sleep"
                  goal={getGoalForMetric('sleepHours')}
                  trend={trendData.sleepHours}
                  lastValue={previousDayMetrics?.metrics?.sleepHours}
                />

                {/* Weight */}
                <MetricCard
                  icon="⚖️"
                  title="Body Weight"
                  value={todayMetrics.metrics?.weight || 0}
                  unit="kg"
                  color="weight"
                  trend={trendData.weight}
                  lastValue={previousDayMetrics?.metrics?.weight}
                />
              </div>
            ) : (
              /* No Data State */
              <div className="
                bg-gradient-to-br from-blue-50 to-cyan-50
                border-2 border-dashed border-blue-300
                rounded-lg p-12 text-center
              ">
                <div className="text-5xl mb-4">📊</div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Start Tracking Today
                </h3>

                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Begin logging your health metrics to see your daily performance,
                  track progress, and achieve your goals!
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    variant="primary"
                    onClick={() => setShowForm(true)}
                  >
                    + Log First Metric
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() => {
                      /* Navigate to learn more */
                    }}
                  >
                    Learn More
                  </Button>
                </div>

                <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div className="bg-white rounded p-3">
                    <div className="text-2xl mb-1">👟</div>
                    <p className="font-semibold text-gray-900">Steps</p>
                    <p className="text-xs text-gray-600">Track daily movement</p>
                  </div>

                  <div className="bg-white rounded p-3">
                    <div className="text-2xl mb-1">🔥</div>
                    <p className="font-semibold text-gray-900">Calories</p>
                    <p className="text-xs text-gray-600">Monitor energy</p>
                  </div>

                  <div className="bg-white rounded p-3">
                    <div className="text-2xl mb-1">😴</div>
                    <p className="font-semibold text-gray-900">Sleep</p>
                    <p className="text-xs text-gray-600">Rest quality</p>
                  </div>

                  <div className="bg-white rounded p-3">
                    <div className="text-2xl mb-1">⚖️</div>
                    <p className="font-semibold text-gray-900">Weight</p>
                    <p className="text-xs text-gray-600">Health tracking</p>
                  </div>
                </div>
              </div>
            )}

            {/* Trend Info */}
            {todayMetrics && previousDayMetrics && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                <p className="text-blue-900 font-semibold mb-2">
                  📈 Compared to yesterday:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  {trendData.steps && (
                    <div>
                      <span className="font-semibold text-gray-900">Steps:</span>
                      <span
                        className={`ml-2 ${
                          trendData.steps.direction === 'up'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {trendData.steps.direction === 'up' ? '↑' : '↓'}
                        {trendData.steps.percentage}%
                      </span>
                    </div>
                  )}

                  {trendData.calories && (
                    <div>
                      <span className="font-semibold text-gray-900">Calories:</span>
                      <span
                        className={`ml-2 ${
                          trendData.calories.direction === 'up'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {trendData.calories.direction === 'up' ? '↑' : '↓'}
                        {trendData.calories.percentage}%
                      </span>
                    </div>
                  )}

                  {trendData.sleepHours && (
                    <div>
                      <span className="font-semibold text-gray-900">Sleep:</span>
                      <span
                        className={`ml-2 ${
                          trendData.sleepHours.direction === 'up'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {trendData.sleepHours.direction === 'up' ? '↑' : '↓'}
                        {trendData.sleepHours.percentage}%
                      </span>
                    </div>
                  )}

                  {trendData.weight && (
                    <div>
                      <span className="font-semibold text-gray-900">Weight:</span>
                      <span
                        className={`ml-2 ${
                          trendData.weight.direction === 'down'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {trendData.weight.direction === 'down' ? '↓' : '↑'}
                        {trendData.weight.percentage}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ⭐ NEW: GOOGLE FIT CONNECTION SECTION */}
          <div className="mb-8">
            <GoogleFitConnection />
          </div>

          {/* ===== ADVANCED COLLAPSIBLE FORM SECTION ===== */}
          <div className="mb-8">
            {/* Form Trigger Header */}
            <div 
              onClick={toggleFormVisibility}
              className={`
                bg-white rounded-t-lg border-2 p-4 cursor-pointer
                transition-all duration-200 flex items-center justify-between
                ${showForm ? 'border-blue-400 border-b-0' : 'border-gray-200 hover:border-blue-300'}
              `}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📝</span>
                <div>
                  <h3 className="font-bold text-gray-900">Add Metrics</h3>
                  <p className="text-sm text-gray-600">
                    {showForm ? 'Click to collapse form' : 'Click to expand and log metrics'}
                  </p>
                </div>
              </div>
              <span className={`text-2xl transition-transform duration-200 ${showForm ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </div>

            {/* Animated Form Container */}
            {showForm && (
              <div className={`
                bg-white rounded-b-lg border-2 border-t-0 border-blue-400 p-6
                animate-fadeIn shadow-md
              `}>
                {/* Form Header */}
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-2">
                    📊 Log Today&apos;s Metrics
                  </h2>
                  <p className="text-sm text-gray-600">
                    Tracking your health metrics for {dateUtils.getRelativeDateLabel(new Date())}
                  </p>
                </div>

                {/* Form Error Alert */}
                {formError && (
                  <Alert
                    type="error"
                    title="Validation Error"
                    message={formError}
                    dismissible
                    onClose={() => setFormError(null)}
                  />
                )}

                {/* Metrics Form Component */}
                <div className="mb-4">
                  <MetricsForm
                    onSuccess={handleMetricSuccess}
                    onError={handleMetricError}
                  />
                </div>

                {/* Form Footer */}
                <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>✓ Required fields: Steps, Calories</p>
                    <p>✓ Optional fields: Distance, Weight, Sleep, etc.</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeForm}
                  >
                    Close Form
                  </Button>
                </div>
              </div>
            )}

            {/* Collapsed State CTA */}
            {!showForm && (
              <div className="
                bg-gradient-to-r from-blue-50 to-cyan-50
                rounded-b-lg border-2 border-t-0 border-blue-200
                p-4 hover:shadow-md transition cursor-pointer
                flex items-center gap-3
              "
                onClick={toggleFormVisibility}>
                <span className="text-3xl">🎯</span>
                <div className="flex-1">
                  <p className="font-semibold text-blue-900">Ready to track today?</p>
                  <p className="text-sm text-blue-700">
                    Open the form and start logging your health metrics
                  </p>
                </div>
                <span className="text-2xl text-blue-600">→</span>
              </div>
            )}
          </div>

          {/* ===== GOALS SECTION ===== */}
          <div className="mb-8">
            <GoalsSection
              onGoalsUpdate={handleGoalsUpdate}
              todayMetrics={todayMetrics}
            />
          </div>

          {/* ===== ADVANCED SUMMARY STATS SECTION ===== */}
          <div className="mb-8">
            {/* Main Summary Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              {/* Header with Period Selection */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      📊 Your Performance Summary
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Track your progress and achievements
                    </p>
                  </div>

                  {/* Period Selector */}
                  <div className="flex gap-2 bg-white rounded-lg p-1 border border-gray-200">
                    {summaryPeriods.map(({ key, label, icon }) => (
                      <button
                        key={key}
                        onClick={() => handleSummaryPeriodChange(key)}
                        className={`
                          px-4 py-2 rounded font-medium transition flex items-center gap-2
                          ${
                            summaryPeriod === key
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }
                        `}
                      >
                        <span>{icon}</span>
                        <span className="hidden sm:inline">{label}</span>
                        <span className="sm:hidden">{key[0].toUpperCase()}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Summary Stats Content */}
              <div className="p-6">
                <SummaryStats
                  period={summaryPeriod}
                  onPeriodChange={handleSummaryPeriodChange}
                  showComparison={true}
                />
              </div>
            </div>

            {/* Quick Achievements Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {/* Achievement: Consistency */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">🔥</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-green-900">Tracking Streak</h3>
                    <p className="text-sm text-green-700 mt-1">
                      Log metrics consistently to build momentum
                    </p>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-green-900">This Week</span>
                        <span className="text-green-700">5/7 days</span>
                      </div>
                      <div className="w-full bg-green-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{ width: '71%' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Achievement: Goals Progress */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">🎯</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-blue-900">Goals Met</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      You&apos;re on track with your health targets
                    </p>
                    <div className="mt-2 flex gap-2">
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-blue-900 mb-1">Steps</p>
                        <div className="h-6 bg-blue-200 rounded flex items-center justify-center">
                          <span className="text-xs font-bold text-blue-700">92%</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-blue-900 mb-1">Sleep</p>
                        <div className="h-6 bg-blue-200 rounded flex items-center justify-center">
                          <span className="text-xs font-bold text-blue-700">87%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Achievement: Personal Best */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">⭐</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-purple-900">Personal Bests</h3>
                    <p className="text-sm text-purple-700 mt-1">
                      Keep pushing to reach new heights
                    </p>
                    <div className="mt-2 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-purple-700">Max Steps:</span>
                        <span className="font-bold text-purple-900">12,543</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-700">Best Sleep:</span>
                        <span className="font-bold text-purple-900">8.5 hrs</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Motivational Footer */}
            <div className="mt-6 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-4 text-center">
              <p className="text-sm text-indigo-900">
                <span className="font-semibold">💡 Pro Tip:</span> Keep logging your metrics
                daily to unlock more insights and achievements!
              </p>
            </div>
          </div>

          {/* ===== COMPLETE INTEGRATED METRICS LIST SECTION ===== */}
          <section className="mb-8" id="metrics-history">
            {/* Main Container */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              {/* Header */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200 px-6 py-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      📋 Recent Metrics
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Edit and manage your health tracking records
                    </p>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleListDateRangeChange('last7days')}
                      className="flex items-center gap-1"
                    >
                      <span>🔄</span>
                      <span className="hidden sm:inline">Refresh</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setShowForm(true)}
                      className="flex items-center gap-1"
                    >
                      <span>+</span>
                      <span className="hidden sm:inline">Add Entry</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Period Filter Tabs */}
              <div className="border-b border-gray-200 px-6 py-3 overflow-x-auto">
                <div className="flex gap-1 whitespace-nowrap">
                  {[
                    { key: 'today', label: 'Today' },
                    { key: 'last7days', label: 'Last 7 Days' },
                    { key: 'last30days', label: 'Last 30 Days' },
                    { key: 'last90days', label: 'Last 90 Days' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => handleListDateRangeChange(key)}
                      className={`
                        px-3 py-2 text-sm font-medium rounded-t-lg transition
                        border-b-2
                        ${
                          listPeriodSelected === key
                            ? 'border-blue-600 text-blue-600 bg-blue-50'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                        }
                      `}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Area */}
              <div className="p-6">
                {isLoadingMetrics ? (
                  <div className="text-center py-8">
                    <div className="inline-block">
                      <div className="animate-spin text-3xl">⟳</div>
                    </div>
                    <p className="text-gray-600 mt-3">Loading metrics...</p>
                  </div>
                ) : allMetrics.length > 0 ? (
                  <MetricsList
                    metrics={allMetrics}
                    isLoading={isLoadingMetrics}
                    onMetricsChange={handleMetricsListChange}
                    dateRange={listDateRange}
                    itemsPerPage={10}
                  />
                ) : (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-4">📊</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No Metrics Found
                    </h3>
                    <p className="text-gray-600 mb-6">
                      For the selected period, no metrics have been recorded yet.
                    </p>
                    <Button
                      onClick={() => setShowForm(true)}
                      className="inline-flex items-center gap-2"
                    >
                      <span>+</span>
                      <span>Add Your First Metric</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* Footer Info */}
              {!isLoadingMetrics && allMetrics.length > 0 && (
                <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
                  <p className="text-xs text-gray-600 text-center">
                    Showing {allMetrics.length} metric entries • Use edit/delete buttons to
                    manage
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Charts Placeholder Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300 rounded-lg p-8 text-center">
            <div className="text-5xl mb-4">📈</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Advanced Analytics Coming Soon
            </h3>
            <p className="text-gray-600 mb-4 max-w-md mx-auto">
              Charts, trend analysis, and predictive insights will be available in Day 7 of the development roadmap.
            </p>
            <Button variant="secondary" disabled>
              Coming in Day 7
            </Button>
          </div>

          {/* Footer Spacing */}
          <div className="h-12"></div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
