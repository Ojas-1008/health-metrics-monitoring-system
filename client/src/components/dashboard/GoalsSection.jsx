/**
 * ============================================
 * GOALS SECTION COMPONENT (ENHANCED)
 * ============================================
 *
 * Premium goals display with Modern Glassmorphism
 *
 * Features:
 * - Glassmorphism goal cards with gradients
 * - Animated progress bars with shimmer
 * - Achievement celebration effects
 * - Enhanced modal with backdrop blur
 * - Beautiful empty state with animations
 * - Real-time progress tracking
 */

import { useState, useEffect, useCallback } from 'react';
import * as goalsService from '../../services/goalsService';
import GoalsForm from './GoalsForm';
import Button from '../common/Button';
import Alert from '../common/Alert';

/**
 * ============================================
 * ENHANCED GOAL PROGRESS CARD
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

  const colorSchemes = {
    blue: {
      gradient: 'from-blue-500 via-indigo-500 to-purple-500',
      bg: 'from-blue-50/90 to-indigo-50/90',
      border: 'border-blue-300/40',
      text: 'text-blue-900',
      iconBg: 'from-blue-500 to-indigo-500',
    },
    green: {
      gradient: 'from-green-500 via-emerald-500 to-teal-500',
      bg: 'from-green-50/90 to-emerald-50/90',
      border: 'border-green-300/40',
      text: 'text-green-900',
      iconBg: 'from-green-500 to-emerald-500',
    },
    purple: {
      gradient: 'from-purple-500 via-pink-500 to-rose-500',
      bg: 'from-purple-50/90 to-pink-50/90',
      border: 'border-purple-300/40',
      text: 'text-purple-900',
      iconBg: 'from-purple-500 to-pink-500',
    },
  };

  const colors = colorSchemes[color] || colorSchemes.blue;

  return (
    <div className={`group relative bg-gradient-to-br ${colors.bg} backdrop-blur-md border-2 ${colors.border} rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden`}>
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 pointer-events-none"></div>

      {/* Header */}
      <div className="relative flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Animated Icon */}
          <div className="relative">
            <div className={`absolute inset-0 bg-gradient-to-r ${colors.iconBg} rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity`}></div>
            <div className={`relative w-12 h-12 bg-gradient-to-br ${colors.iconBg} rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
              <span className="text-2xl">{icon}</span>
            </div>
          </div>

          <div>
            <h4 className={`${colors.text} font-bold text-base mb-0.5`}>{title}</h4>
            <p className={`${colors.text} text-xs opacity-75 font-medium`}>
              Goal: {goal} {unit}
            </p>
          </div>
        </div>

        {/* Achievement Badge */}
        {achieved && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-400 to-emerald-400 text-white rounded-full shadow-md animate-bounce">
            <span className="text-base font-bold">✓</span>
            <span className="text-xs font-bold">Achieved!</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative mb-4">
        <div className="w-full h-4 bg-gray-200/60 backdrop-blur-sm rounded-full overflow-hidden shadow-inner">
          {/* Progress Fill */}
          <div
            className={`h-full bg-gradient-to-r ${colors.gradient} transition-all duration-700 ease-out relative overflow-hidden`}
            style={{ width: `${percentage}%` }}
          >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
          </div>

          {/* Achievement Glow */}
          {achieved && (
            <div className="absolute inset-0 bg-green-400/20 animate-pulse rounded-full"></div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="relative flex justify-between items-center">
        <div className={`text-2xl font-extrabold bg-gradient-to-r ${colors.gradient} bg-clip-text text-transparent`}>
          {current.toLocaleString()} {unit}
        </div>
        <div className={`${colors.text} text-lg font-bold opacity-75`}>
          {Math.round(percentage)}%
        </div>
      </div>

      {/* Bottom Accent */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${colors.gradient} opacity-50`}></div>
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
  const [goals, setGoals] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [alert, setAlert] = useState({ visible: false, type: 'info', title: '', message: '' });

  // Show alert
  const showAlert = useCallback((type, title, message, duration = 4000) => {
    setAlert({ visible: true, type, title, message });

    if (duration > 0) {
      setTimeout(() => {
        setAlert((prev) => ({ ...prev, visible: false }));
      }, duration);
    }
  }, []);

  // Hide alert
  const hideAlert = useCallback(() => {
    setAlert((prev) => ({ ...prev, visible: false }));
  }, []);

  // Load goals
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

  // Handle goals success
  const handleGoalsSuccess = useCallback((updatedGoals) => {
    setGoals(updatedGoals);
    setShowEditForm(false);
    showAlert('success', 'Success! 🎉', 'Your goals have been updated');

    if (onGoalsUpdate && typeof onGoalsUpdate === 'function') {
      onGoalsUpdate(updatedGoals);
    }
  }, [showAlert, onGoalsUpdate]);

  // Load on mount
  useEffect(() => {
    setIsLoading(true);
    loadGoals().finally(() => setIsLoading(false));
  }, [loadGoals]);

  return (
    <div className="w-full">
      {/* Alert */}
      {alert.visible && (
        <div className="mb-6 animate-slideDown">
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
        <div className="bg-gradient-to-br from-white/90 to-blue-50/90 backdrop-blur-md rounded-2xl border-2 border-gray-300/40 p-8 shadow-xl">
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-6 bg-gray-300 rounded-lg w-32 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded-full w-full"></div>
              </div>
            ))}
          </div>
        </div>
      ) : goals && Object.keys(goals).some(key => goals[key]) ? (
        <>
          {/* Goals Section */}
          <div className="relative bg-gradient-to-br from-white/90 to-blue-50/90 backdrop-blur-md rounded-2xl border-2 border-gray-300/40 p-8 shadow-2xl overflow-hidden">
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 pointer-events-none"></div>

            {/* Header */}
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 pb-6 border-b-2 border-gray-300/40">
              <div>
                <h2 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  🎯 Your Goals
                </h2>
                <p className="text-sm text-gray-700 font-medium">
                  Track your progress toward your health targets
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  size="small"
                  onClick={loadGoals}
                  disabled={isRefreshing}
                  className="flex items-center gap-2"
                >
                  <span className={isRefreshing ? 'animate-spin' : ''}>🔄</span>
                  <span className="hidden sm:inline">Refresh</span>
                </Button>

                <Button
                  variant="primary"
                  size="small"
                  onClick={() => setShowEditForm(true)}
                  className="flex items-center gap-2"
                >
                  <span>✎</span>
                  <span className="hidden sm:inline">Edit Goals</span>
                </Button>
              </div>
            </div>

            {/* Goals Grid */}
            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

            {/* Pro Tip */}
            <div className="relative p-6 bg-gradient-to-br from-blue-50/90 to-indigo-50/90 backdrop-blur-md border-2 border-blue-300/40 rounded-xl shadow-lg">
              <p className="text-sm text-blue-900 font-medium flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <span>
                  <strong className="font-bold">Pro Tip:</strong> Keep your goals realistic and adjust them as you progress. Small, consistent steps lead to big changes!
                </span>
              </p>
            </div>

            {/* Bottom Accent */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50"></div>
          </div>

          {/* Edit Form Modal */}
          {showEditForm && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
              <div className="bg-gradient-to-br from-white/95 to-gray-50/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full p-8 max-h-[90vh] overflow-y-auto border-2 border-gray-300/40 animate-scaleIn">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6 pb-6 border-b-2 border-gray-300/40">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Edit Your Goals
                  </h3>
                  <button
                    onClick={() => setShowEditForm(false)}
                    className="p-2 text-gray-500 hover:text-gray-900 bg-white/80 backdrop-blur-sm hover:bg-white rounded-xl transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-110"
                  >
                    <span className="text-2xl leading-none">✕</span>
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
        <div className="relative bg-gradient-to-br from-blue-50/90 to-indigo-50/90 backdrop-blur-md border-2 border-dashed border-blue-400/60 rounded-2xl p-12 text-center shadow-xl overflow-hidden">
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 pointer-events-none"></div>

          <div className="relative">
            <div className="text-7xl mb-6 animate-float">🎯</div>

            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              No Goals Set Yet
            </h3>

            <p className="text-gray-700 font-medium mb-8 max-w-md mx-auto">
              Set your health goals to get motivated and track your progress toward better health!
            </p>

            <Button
              variant="primary"
              onClick={() => setShowEditForm(true)}
              className="inline-flex items-center gap-2 shadow-xl"
            >
              <span className="text-xl">+</span>
              <span>Set Your First Goal</span>
            </Button>

            {/* Edit Form Modal */}
            {showEditForm && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                <div className="bg-gradient-to-br from-white/95 to-gray-50/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full p-8 max-h-[90vh] overflow-y-auto border-2 border-gray-300/40 animate-scaleIn">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between mb-6 pb-6 border-b-2 border-gray-300/40">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Set Your Goals
                    </h3>
                    <button
                      onClick={() => setShowEditForm(false)}
                      className="p-2 text-gray-500 hover:text-gray-900 bg-white/80 backdrop-blur-sm hover:bg-white rounded-xl transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-110"
                    >
                      <span className="text-2xl leading-none">✕</span>
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
        </div>
      )}
    </div>
  );
};

export default GoalsSection;
