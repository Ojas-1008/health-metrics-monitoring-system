/**
 * ============================================
 * TOAST NOTIFICATION COMPONENT
 * ============================================
 *
 * Purpose: Display temporary auto-dismissing notifications
 *
 * Features:
 * - Auto-dismiss after configurable duration
 * - Multiple variants (success, error, info, warning)
 * - Slide-in animation
 * - Close button
 * - Icon support
 * - Progress bar
 *
 * Usage:
 * <Toast
 *   message="Google Fit synced successfully"
 *   variant="success"
 *   duration={5000}
 *   onClose={() => setShowToast(false)}
 * />
 */

import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const Toast = ({
  message = '',
  description = null,
  variant = 'info',
  duration = 5000,
  onClose = null,
  showProgress = true,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  // Auto-dismiss timer
  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300); // Wait for exit animation
  }, [onClose]);

  useEffect(() => {
    if (duration === 0) return; // Never auto-dismiss if duration is 0

    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    // Progress bar animation
    if (showProgress) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev - (100 / (duration / 100));
          return newProgress > 0 ? newProgress : 0;
        });
      }, 100);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }

    return () => clearTimeout(timer);
  }, [duration, showProgress, handleClose]);

  const variantConfig = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-900',
      icon: '✓',
      iconBg: 'bg-green-500',
      progressBg: 'bg-green-500',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-900',
      icon: '✕',
      iconBg: 'bg-red-500',
      progressBg: 'bg-red-500',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-900',
      icon: '⚠',
      iconBg: 'bg-yellow-500',
      progressBg: 'bg-yellow-500',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-900',
      icon: 'ℹ',
      iconBg: 'bg-blue-500',
      progressBg: 'bg-blue-500',
    },
  };

  const config = variantConfig[variant] || variantConfig.info;

  if (!isVisible) return null;

  return (
    <div
      className={`
        fixed bottom-4 right-4 z-50 max-w-md w-full mx-4
        transform transition-all duration-300 ease-out
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}
      `}
    >
      <div
        className={`
          ${config.bg} ${config.border} ${config.text}
          border-2 rounded-lg shadow-lg overflow-hidden
        `}
      >
        {/* Toast Content */}
        <div className="p-4 flex items-start space-x-3">
          {/* Icon */}
          <div className={`flex-shrink-0 w-6 h-6 ${config.iconBg} text-white rounded-full flex items-center justify-center text-sm font-bold`}>
            {config.icon}
          </div>

          {/* Message */}
          <div className="flex-1 min-w-0">
            <p className="font-medium">{message}</p>
            {description && (
              <p className="text-sm opacity-75 mt-1">{description}</p>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        {showProgress && duration > 0 && (
          <div className="h-1 bg-gray-200">
            <div
              className={`h-full transition-all duration-100 ease-linear ${config.progressBg}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

Toast.propTypes = {
  message: PropTypes.string.isRequired,
  description: PropTypes.string,
  variant: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  duration: PropTypes.number,
  onClose: PropTypes.func,
  showProgress: PropTypes.bool,
};

export default Toast;