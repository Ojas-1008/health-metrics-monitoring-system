/**
 * ============================================
 * ALERT COMPONENT (ENHANCED)
 * ============================================
 * 
 * Reusable alert/notification component with Modern Glassmorphism styling
 * 
 * Features:
 * - Premium glassmorphism aesthetics
 * - Smooth entrance/exit animations
 * - Gradient backgrounds and glows
 * - Interactive close button with hover effects
 * - Auto-dismiss with timer
 * - Accessible (ARIA attributes)
 */

import { useState, useEffect, forwardRef } from 'react';

/**
 * Icon Components for Each Alert Type
 */
const AlertIcons = {
  success: (
    <div className="relative">
      <div className="absolute inset-0 bg-green-400 rounded-full blur opacity-20 animate-pulse"></div>
      <svg className="w-6 h-6 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  ),
  error: (
    <div className="relative">
      <div className="absolute inset-0 bg-red-400 rounded-full blur opacity-20 animate-pulse"></div>
      <svg className="w-6 h-6 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  ),
  warning: (
    <div className="relative">
      <div className="absolute inset-0 bg-yellow-400 rounded-full blur opacity-20 animate-pulse"></div>
      <svg className="w-6 h-6 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
  ),
  info: (
    <div className="relative">
      <div className="absolute inset-0 bg-blue-400 rounded-full blur opacity-20 animate-pulse"></div>
      <svg className="w-6 h-6 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  ),
};

/**
 * Close Icon Component
 */
const CloseIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

/**
 * Alert Component
 * 
 * @param {Object} props - Component props
 * @param {string|React.ReactNode} props.message - Alert message content
 * @param {string} [props.title] - Alert title (optional)
 * @param {string} [props.type='info'] - Alert type (success, error, warning, info)
 * @param {boolean} [props.dismissible=true] - Show close button
 * @param {Function} [props.onClose] - Callback when alert is dismissed
 * @param {number} [props.autoHideDuration] - Auto-hide after ms (0 = no auto-hide)
 * @param {boolean} [props.showIcon=true] - Show type-specific icon
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.Ref} ref - Forward ref for direct DOM access
 */
const Alert = forwardRef(({
  message,
  title = '',
  type = 'info',
  dismissible = true,
  onClose,
  autoHideDuration = 0,
  showIcon = true,
  className = '',
  ...rest
}, ref) => {
  // ===== STATE MANAGEMENT =====

  const [visible, setVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  // ===== EVENT HANDLERS =====

  const handleClose = () => {
    setIsExiting(true);

    // Wait for exit animation to complete
    setTimeout(() => {
      setVisible(false);
      if (onClose) {
        onClose();
      }
    }, 300);
  };

  // ===== AUTO-HIDE LOGIC =====

  useEffect(() => {
    if (autoHideDuration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [autoHideDuration]);

  // ===== TYPE CONFIGURATIONS =====

  const typeStyles = {
    success: {
      container: 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-green-100',
      icon: 'text-green-500',
      title: 'text-green-800',
      message: 'text-green-700',
      closeButton: 'text-green-400 hover:text-green-600 hover:bg-green-100',
      progress: 'bg-green-500',
    },
    error: {
      container: 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200 shadow-red-100',
      icon: 'text-red-500',
      title: 'text-red-800',
      message: 'text-red-700',
      closeButton: 'text-red-400 hover:text-red-600 hover:bg-red-100',
      progress: 'bg-red-500',
    },
    warning: {
      container: 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 shadow-amber-100',
      icon: 'text-amber-500',
      title: 'text-amber-800',
      message: 'text-amber-700',
      closeButton: 'text-amber-400 hover:text-amber-600 hover:bg-amber-100',
      progress: 'bg-amber-500',
    },
    info: {
      container: 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-blue-100',
      icon: 'text-blue-500',
      title: 'text-blue-800',
      message: 'text-blue-700',
      closeButton: 'text-blue-400 hover:text-blue-600 hover:bg-blue-100',
      progress: 'bg-blue-500',
    },
  };

  const styles = typeStyles[type] || typeStyles.info;

  // ===== BASE CLASSES =====

  const baseClasses = `
    relative
    overflow-hidden
    border
    rounded-xl
    p-4
    shadow-lg
    backdrop-blur-sm
    transition-all
    duration-300
    ease-out
    transform
    ${isExiting ? 'opacity-0 -translate-y-2 scale-95' : 'opacity-100 translate-y-0 scale-100 animate-slideDown'}
    ${styles.container}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && dismissible) {
      handleClose();
    }
  };

  // ===== RENDER =====

  if (!visible) {
    return null;
  }

  return (
    <div
      ref={ref}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      className={baseClasses}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      {/* Auto-hide Progress Bar */}
      {autoHideDuration > 0 && (
        <div className="absolute bottom-0 left-0 h-1 w-full bg-gray-100/30">
          <div
            className={`h-full ${styles.progress} transition-all ease-linear`}
            style={{
              width: isExiting ? '0%' : '100%',
              transitionDuration: `${autoHideDuration}ms`
            }}
          />
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Icon */}
        {showIcon && (
          <div className={`flex-shrink-0 mt-0.5 ${styles.icon}`}>
            {AlertIcons[type]}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          {title && (
            <h3 className={`text-sm font-bold mb-1 tracking-wide ${styles.title}`}>
              {title}
            </h3>
          )}
          <div className={`text-sm leading-relaxed font-medium ${styles.message}`}>
            {typeof message === 'string' ? <p>{message}</p> : message}
          </div>
        </div>

        {/* Close Button */}
        {dismissible && (
          <button
            type="button"
            onClick={handleClose}
            className={`
              flex-shrink-0
              -mr-1
              -mt-1
              p-1.5
              rounded-lg
              transition-all
              duration-200
              focus:outline-none
              focus:ring-2
              focus:ring-offset-1
              focus:ring-current
              opacity-70
              hover:opacity-100
              ${styles.closeButton}
            `.trim().replace(/\s+/g, ' ')}
            aria-label="Close alert"
          >
            <CloseIcon />
          </button>
        )}
      </div>
    </div>
  );
});

Alert.displayName = 'Alert';

export default Alert;
