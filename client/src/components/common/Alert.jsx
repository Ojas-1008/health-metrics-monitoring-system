/**
 * ============================================
 * ALERT COMPONENT
 * ============================================
 * 
 * Reusable alert/notification component with Tailwind CSS styling
 * 
 * Features:
 * - Multiple types (success, error, warning, info)
 * - Optional dismiss button
 * - Auto-dismiss with timer
 * - Icon support for each type
 * - Smooth enter/exit animations
 * - Accessible (ARIA attributes, focus management)
 * - Custom message and title support
 * 
 * Styling:
 * - Color-coded by type
 * - Consistent spacing and typography
 * - Responsive design
 * - Smooth transitions
 */

import { useState, useEffect, forwardRef } from 'react';

/**
 * Icon Components for Each Alert Type
 */
const AlertIcons = {
  success: (
    <svg
      className="w-6 h-6"
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  ),
  error: (
    <svg
      className="w-6 h-6"
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
        clipRule="evenodd"
      />
    </svg>
  ),
  warning: (
    <svg
      className="w-6 h-6"
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  ),
  info: (
    <svg
      className="w-6 h-6"
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    </svg>
  ),
};

/**
 * Close Icon Component
 */
const CloseIcon = () => (
  <svg
    className="w-5 h-5"
    fill="currentColor"
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
      clipRule="evenodd"
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
 * 
 * @example
 * <Alert 
 *   type="success" 
 *   message="Profile updated successfully!" 
 *   dismissible
 * />
 * 
 * @example
 * <Alert 
 *   type="error"
 *   title="Error"
 *   message="Failed to save changes. Please try again."
 *   autoHideDuration={5000}
 *   onClose={() => console.log('Alert closed')}
 * />
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
  
  /**
   * Visibility state for animations
   */
  const [visible, setVisible] = useState(true);

  /**
   * Mounting state for exit animation
   */
  const [isExiting, setIsExiting] = useState(false);

  // ===== EVENT HANDLERS =====
  
  /**
   * Handle close/dismiss action
   * Triggers exit animation then calls onClose callback
   */
  const handleClose = () => {
    setIsExiting(true);
    
    // Wait for exit animation to complete
    setTimeout(() => {
      setVisible(false);
      if (onClose) {
        onClose();
      }
    }, 300); // Match transition duration
  };

  // ===== AUTO-HIDE LOGIC =====
  
  /**
   * Auto-hide timer effect
   * Automatically dismiss alert after specified duration
   */
  useEffect(() => {
    if (autoHideDuration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoHideDuration);

      // Cleanup timer on unmount
      return () => clearTimeout(timer);
    }
  }, [autoHideDuration, onClose, handleClose]);

  // ===== TYPE CONFIGURATIONS =====
  
  /**
   * Color schemes for each alert type
   */
  const typeStyles = {
    success: {
      container: 'bg-green-50 border-green-200',
      icon: 'text-green-600',
      title: 'text-green-800',
      message: 'text-green-700',
      closeButton: 'text-green-600 hover:text-green-800 hover:bg-green-100',
    },
    error: {
      container: 'bg-red-50 border-red-200',
      icon: 'text-red-600',
      title: 'text-red-800',
      message: 'text-red-700',
      closeButton: 'text-red-600 hover:text-red-800 hover:bg-red-100',
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200',
      icon: 'text-yellow-600',
      title: 'text-yellow-800',
      message: 'text-yellow-700',
      closeButton: 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100',
    },
    info: {
      container: 'bg-blue-50 border-blue-200',
      icon: 'text-blue-600',
      title: 'text-blue-800',
      message: 'text-blue-700',
      closeButton: 'text-blue-600 hover:text-blue-800 hover:bg-blue-100',
    },
  };

  /**
   * Get styles for current alert type
   */
  const styles = typeStyles[type] || typeStyles.info;

  // ===== BASE CLASSES =====
  
  /**
   * Base container classes
   */
  const baseClasses = `
    border
    rounded-lg
    p-4
    shadow-sm
    transition-all
    duration-300
    ease-in-out
    ${isExiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
    ${styles.container}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  /**
   * Handle keyboard events for close button
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && dismissible) {
      handleClose();
    }
  };

  // ===== RENDER =====
  
  // Don't render if not visible
  if (!visible) {
    return null;
  }

  return (
    <div
      ref={ref}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={baseClasses}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        {showIcon && (
          <div className={`flex-shrink-0 ${styles.icon}`} aria-hidden="true">
            {AlertIcons[type]}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          {title && (
            <h3 className={`text-sm font-semibold mb-1 ${styles.title}`}>
              {title}
            </h3>
          )}

          {/* Message */}
          <div className={`text-sm ${styles.message}`}>
            {typeof message === 'string' ? (
              <p>{message}</p>
            ) : (
              message
            )}
          </div>
        </div>

        {/* Close Button */}
        {dismissible && (
          <button
            type="button"
            onClick={handleClose}
            className={`
              flex-shrink-0
              p-1
              rounded-md
              transition-colors
              duration-200
              focus:outline-none
              focus:ring-2
              focus:ring-offset-2
              focus:ring-primary-500
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

// Set display name for debugging
Alert.displayName = 'Alert';

export default Alert;
