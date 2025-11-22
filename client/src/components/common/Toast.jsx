/**
 * ============================================
 * TOAST NOTIFICATION COMPONENT (ENHANCED)
 * ============================================
 *
 * Premium toast notifications with Modern Glassmorphism
 *
 * Features:
 * - Glassmorphism with backdrop blur
 * - Smooth slide and scale animations
 * - Animated icons with glow effects
 * - Gradient backgrounds and progress bars
 * - Enhanced visual feedback
 * - Auto-dismiss with timer
 * - Industry-standard code structure
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
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  // Entrance animation trigger
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Auto-dismiss timer
  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 400); // Wait for exit animation
  }, [onClose]);

  useEffect(() => {
    if (duration === 0) return;

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
      bg: 'bg-gradient-to-br from-green-50/95 via-emerald-50/95 to-green-50/95',
      border: 'border-green-300/40',
      text: 'text-green-900',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: 'from-green-500 to-emerald-500',
      progressBg: 'from-green-500 to-emerald-500',
      glowColor: 'green',
    },
    error: {
      bg: 'bg-gradient-to-br from-red-50/95 via-rose-50/95 to-red-50/95',
      border: 'border-red-300/40',
      text: 'text-red-900',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      iconBg: 'from-red-500 to-rose-500',
      progressBg: 'from-red-500 to-rose-500',
      glowColor: 'red',
    },
    warning: {
      bg: 'bg-gradient-to-br from-amber-50/95 via-yellow-50/95 to-amber-50/95',
      border: 'border-amber-300/40',
      text: 'text-amber-900',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      iconBg: 'from-amber-500 to-yellow-500',
      progressBg: 'from-amber-500 to-yellow-500',
      glowColor: 'amber',
    },
    info: {
      bg: 'bg-gradient-to-br from-blue-50/95 via-indigo-50/95 to-blue-50/95',
      border: 'border-blue-300/40',
      text: 'text-blue-900',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: 'from-blue-500 to-indigo-500',
      progressBg: 'from-blue-500 to-indigo-500',
      glowColor: 'blue',
    },
  };

  const config = variantConfig[variant] || variantConfig.info;

  return (
    <div
      className={`
        fixed bottom-6 right-6 z-50 max-w-md w-full sm:w-auto min-w-[350px] mx-4 sm:mx-0
        transition-all duration-400 ease-out
        ${isVisible
          ? 'translate-y-0 opacity-100 scale-100'
          : 'translate-y-4 opacity-0 scale-95'
        }
      `}
      role="alert"
      aria-live="assertive"
    >
      <div
        className={`
          ${config.bg}
          ${config.border}
          ${config.text}
          backdrop-blur-xl
          border-2
          rounded-2xl
          shadow-2xl
          overflow-hidden
          relative
        `}
      >
        {/* Subtle Gradient Overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none"
          aria-hidden="true"
        />

        {/* Toast Content */}
        <div className="p-4 flex items-start gap-3 relative z-10">
          {/* Icon with Glow */}
          <div className="flex-shrink-0 relative">
            <div className={`absolute inset-0 bg-${config.glowColor}-400 rounded-full blur opacity-30 animate-pulse`}></div>
            <div className={`relative w-8 h-8 bg-gradient-to-br ${config.iconBg} text-white rounded-xl flex items-center justify-center shadow-lg transform rotate-3`}>
              {config.icon}
            </div>
          </div>

          {/* Message */}
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="font-bold text-sm tracking-wide leading-relaxed">
              {message}
            </p>
            {description && (
              <p className="text-xs opacity-80 mt-1.5 leading-relaxed font-medium">
                {description}
              </p>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className={`
              flex-shrink-0
              p-1.5
              rounded-lg
              transition-all
              duration-200
              hover:bg-black/5
              active:scale-95
              ${config.text}
              opacity-60
              hover:opacity-100
            `}
            aria-label="Close notification"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        {showProgress && duration > 0 && (
          <div className="h-1 bg-black/5 relative overflow-hidden">
            <div
              className={`
                h-full 
                bg-gradient-to-r 
                ${config.progressBg}
                transition-all 
                duration-100 
                ease-linear
                relative
              `}
              style={{ width: `${progress}%` }}
            >
              {/* Progress Bar Shimmer */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
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