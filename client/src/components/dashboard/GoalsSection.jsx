/**
 * ============================================
 * GOALS SECTION COMPONENT
 * ============================================
 *
 * Purpose: Display current goals and progress
 * in the dashboard
 *
 * Features:
 * - Show current goals with progress bars
 * - Display achievement status
 * - Edit button to open GoalsForm modal
 * - Load goals on mount
 * - Refresh goals
 * - Progress calculation based on today's metrics
 * - Empty state when no goals set
 *
 * Props:
 * - onGoalsUpdate: Callback when goals updated
 * - todayMetrics: Current day's metrics for progress
 */

import { useState, useEffect, useCallback } from 'react';
import * as goalsService from '../../services/goalsService';
import GoalsForm from './GoalsForm';
import Button from '../common/Button';
import Alert from '../common/Alert';

/**
 * ============================================
 * GOAL PROGRESS CARD COMPONENT
 * ============================================
 */

const GoalProgressCard = ({
  icon,
  title,
  current,
  goal,
  unit,
  color = 'blue',
}) => {
  if (!goal) return null;

  const percentage = Math.min((current / goal) * 100, 100);
  const achieved = percentage >= 100;

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-900',
      progress: 'bg-blue-600',
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-900',
      progress: 'bg-green-600',
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-900',
      progress: 'bg-purple-600',
    },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div className={`${colors.bg} border-2 ${colors.border} rounded-lg p-4`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <div>
            <h4 className={`${colors.text} font-semibold text-sm`}>{title}</h4>
            <p className={`${colors.text} text-xs opacity-75`}>
              Goal: {goal} {unit}
            </p>
          </div>
        </div>

        {achieved && (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
            <span className="text-lg">✓</span>
            <span className="text-xs font-bold text-green-700">Achieved!</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-2">
        <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
          <div
            className={`${colors.progress} h-full transition-all duration-500 rounded-full`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex justify-between items-center">
        <div className={`${colors.text} text-sm font-bold`}>
          {current.toLocaleString()} {unit}
        </div>
        <div className={`${colors.text} text-sm font-semibold opacity-75`}>
          {Math.round(percentage)}%
        </div>
      </div>
    </div>
  );
};

/**
 * ============================================
 * GOALS SECTION COMPONENT
 * ============================================
 */

const GoalsSection = ({
  onGoalsUpdate = null,
  todayMetrics = null,
}) => {
  // ===== STATE MANAGEMENT =====

  const [goals, setGoals] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [alert, setAlert] = useState({ visible: false, type: 'info', title: '', message: '' });

  // ===== HELPER FUNCTIONS =====

  /**
   * Show alert notification
   */
  const showAlert = useCallback((type, title, message, duration = 4000) => {
    setAlert({ visible: true, type, title, message });

    if (duration > 0) {
      setTimeout(() => {
        setAlert((prev) => ({ ...prev, visible: false }));
      }, duration);
    }
  }, []);

  /**
   * Hide alert
   */
  const hideAlert = useCallback(() => {
    setAlert((prev) => ({ ...prev, visible: false }));
  }, []);

  // ===== DATA LOADING =====

  /**
   * Load goals from API
   */
  const loadGoals = useCallback(async () => {
    setIsRefreshing(true);

    try {
      const result = await goalsService.getGoals();

      if (result.success && result.data) {
        setGoals(result.data);
      } else {
        setGoals(null);
      }
    } catch (error) {
      console.error('Error loading goals:', error);
      setGoals(null);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  /**
   * Handle goals form success
   */
  const handleGoalsSuccess = useCallback((updatedGoals) => {
    setGoals(updatedGoals);
    setShowEditForm(false);
    showAlert('success', 'Success! 🎉', 'Your goals have been updated');

    if (onGoalsUpdate && typeof onGoalsUpdate === 'function') {
      onGoalsUpdate(updatedGoals);
    }
  }, [showAlert, onGoalsUpdate]);

  // ===== EFFECTS =====

  /**
   * Load goals on mount
   */
  useEffect(() => {
    setIsLoading(true);
    loadGoals().finally(() => setIsLoading(false));
  }, [loadGoals]);

  // ===== RENDER =====

  return (
    <div className="w-full">
      {/* Alert */}
      {alert.visible && (
        <div className="mb-4">
          <Alert
            type={alert.type}
            title={alert.title}
            message={alert.message}
            onClose={hideAlert}
            dismissible
          />
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      ) : goals && Object.keys(goals).some(key => goals[key]) ? (
        <>
          {/* Goals Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  🎯 Your Goals
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Track your progress toward your health targets
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={loadGoals}
                  disabled={isRefreshing}
                  className="flex items-center gap-1"
                >
                  <span>{isRefreshing ? '⟳' : '🔄'}</span>
                  <span className="hidden sm:inline">Refresh</span>
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowEditForm(true)}
                  className="flex items-center gap-1"
                >
                  <span>✎</span>
                  <span className="hidden sm:inline">Edit Goals</span>
                </Button>
              </div>
            </div>

            {/* Goals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {goals.weightGoal && (
                <GoalProgressCard
                  icon="⚖️"
                  title="Weight Goal"
                  current={todayMetrics?.metrics?.weight || 0}
                  goal={goals.weightGoal}
                  unit="kg"
                  color="purple"
                />
              )}

              {goals.stepGoal && (
                <GoalProgressCard
                  icon="👟"
                  title="Daily Steps"
                  current={todayMetrics?.metrics?.steps || 0}
                  goal={goals.stepGoal}
                  unit="steps"
                  color="blue"
                />
              )}

              {goals.sleepGoal && (
                <GoalProgressCard
                  icon="😴"
                  title="Sleep Hours"
                  current={todayMetrics?.metrics?.sleepHours || 0}
                  goal={goals.sleepGoal}
                  unit="hours"
                  color="green"
                />
              )}
            </div>

            {/* Goals Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">💡 Pro Tip:</span> Keep your goals
                realistic and adjust them as you progress. Small, consistent steps
                lead to big changes!
              </p>
            </div>
          </div>

          {/* Edit Form Modal */}
          {showEditForm && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">
                    Edit Your Goals
                  </h3>
                  <button
                    onClick={() => setShowEditForm(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                  >
                    ✕
                  </button>
                </div>

                {/* Modal Content */}
                <div>
                  <GoalsForm
                    initialGoals={goals}
                    onSuccess={handleGoalsSuccess}
                    onError={() => {
                      showAlert('error', 'Error', 'Failed to update goals');
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300 rounded-lg p-8 text-center">
          <div className="text-5xl mb-4">🎯</div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No Goals Set Yet
          </h3>

          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Set your health goals to get motivated and track your progress toward
            better health!
          </p>

          <Button
            variant="primary"
            onClick={() => setShowEditForm(true)}
            className="inline-flex items-center gap-2"
          >
            <span>+</span>
            <span>Set Your First Goal</span>
          </Button>

          {/* Edit Form Modal */}
          {showEditForm && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">
                    Set Your Goals
                  </h3>
                  <button
                    onClick={() => setShowEditForm(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                  >
                    ✕
                  </button>
                </div>

                {/* Modal Content */}
                <div>
                  <GoalsForm
                    onSuccess={handleGoalsSuccess}
                    onError={() => {
                      showAlert('error', 'Error', 'Failed to set goals');
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GoalsSection;
