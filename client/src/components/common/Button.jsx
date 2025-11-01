/**
 * ============================================
 * BUTTON COMPONENT
 * ============================================
 * 
 * Reusable button component with Tailwind CSS styling
 * 
 * Features:
 * - Multiple variants (primary, secondary, danger, success, outline)
 * - Multiple sizes (small, medium, large)
 * - Loading state with animated spinner
 * - Disabled state styling
 * - Full-width option
 * - Icon support (left/right)
 * - Accessible (ARIA attributes, focus states)
 * - Click handler support
 * - Form type support (button, submit, reset)
 * 
 * Styling:
 * - Uses custom primary colors from tailwind.config.js
 * - Smooth transitions for all states
 * - Hover and focus effects
 * - Consistent spacing and sizing
 */

import { forwardRef } from 'react';

/**
 * Loading Spinner Component
 * Animated spinner for loading state
 */
const LoadingSpinner = ({ size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6',
  };

  return (
    <svg
      className={`animate-spin ${sizeClasses[size]}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

/**
 * Button Component
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Button content/text
 * @param {Function} [props.onClick] - Click event handler
 * @param {string} [props.type='button'] - Button type (button, submit, reset)
 * @param {string} [props.variant='primary'] - Button variant (primary, secondary, danger, success, outline)
 * @param {string} [props.size='medium'] - Button size (small, medium, large)
 * @param {boolean} [props.disabled=false] - Whether button is disabled
 * @param {boolean} [props.loading=false] - Whether button is in loading state
 * @param {boolean} [props.fullWidth=false] - Whether button should take full width
 * @param {React.ReactNode} [props.leftIcon] - Icon to display on the left
 * @param {React.ReactNode} [props.rightIcon] - Icon to display on the right
 * @param {string} [props.className] - Additional CSS classes
 * @param {string} [props.ariaLabel] - Accessibility label
 * @param {React.Ref} ref - Forward ref for direct DOM access
 * 
 * @example
 * <Button variant="primary" onClick={handleClick}>
 *   Click Me
 * </Button>
 * 
 * @example
 * <Button variant="danger" loading disabled>
 *   Processing...
 * </Button>
 */
const Button = forwardRef(({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon = null,
  rightIcon = null,
  className = '',
  ariaLabel,
  ...rest
}, ref) => {
  // ===== BASE CLASSES =====
  
  /**
   * Base classes applied to all buttons
   */
  const baseClasses = `
    inline-flex
    items-center
    justify-center
    font-medium
    rounded-lg
    transition-all
    duration-200
    ease-in-out
    focus:outline-none
    focus:ring-2
    focus:ring-offset-2
    disabled:cursor-not-allowed
    disabled:opacity-60
    ${fullWidth ? 'w-full' : ''}
  `;

  // ===== SIZE CLASSES =====
  
  /**
   * Size-specific classes
   */
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm gap-1.5',
    medium: 'px-4 py-2.5 text-base gap-2',
    large: 'px-6 py-3 text-lg gap-2.5',
  };

  // ===== VARIANT CLASSES =====
  
  /**
   * Variant-specific classes (color schemes)
   * Uses custom primary colors from tailwind.config.js
   */
  const variantClasses = {
    primary: `
      bg-primary-600
      text-white
      hover:bg-primary-700
      active:bg-primary-800
      focus:ring-primary-500
      disabled:bg-primary-400
      disabled:hover:bg-primary-400
    `,
    secondary: `
      bg-gray-600
      text-white
      hover:bg-gray-700
      active:bg-gray-800
      focus:ring-gray-500
      disabled:bg-gray-400
      disabled:hover:bg-gray-400
    `,
    danger: `
      bg-red-600
      text-white
      hover:bg-red-700
      active:bg-red-800
      focus:ring-red-500
      disabled:bg-red-400
      disabled:hover:bg-red-400
    `,
    success: `
      bg-green-600
      text-white
      hover:bg-green-700
      active:bg-green-800
      focus:ring-green-500
      disabled:bg-green-400
      disabled:hover:bg-green-400
    `,
    outline: `
      bg-transparent
      text-primary-600
      border-2
      border-primary-600
      hover:bg-primary-50
      active:bg-primary-100
      focus:ring-primary-500
      disabled:text-primary-400
      disabled:border-primary-400
      disabled:hover:bg-transparent
    `,
  };

  // ===== COMBINE CLASSES =====
  
  /**
   * Combine all classes based on props
   */
  const buttonClasses = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  // ===== EVENT HANDLERS =====
  
  /**
   * Handle click event
   * Prevent click when disabled or loading
   */
  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    
    if (onClick) {
      onClick(e);
    }
  };

  // ===== COMPUTED VALUES =====
  
  /**
   * Determine if button should be disabled
   * Disabled when explicitly disabled OR when loading
   */
  const isDisabled = disabled || loading;

  /**
   * Determine ARIA label
   */
  const ariaLabelValue = ariaLabel || (typeof children === 'string' ? children : undefined);

  // ===== RENDER =====
  
  return (
    <button
      ref={ref}
      type={type}
      onClick={handleClick}
      disabled={isDisabled}
      className={buttonClasses}
      aria-label={ariaLabelValue}
      aria-busy={loading}
      aria-disabled={isDisabled}
      {...rest}
    >
      {/* Loading Spinner (left side) */}
      {loading && (
        <LoadingSpinner size={size} />
      )}

      {/* Left Icon */}
      {!loading && leftIcon && (
        <span className="flex-shrink-0" aria-hidden="true">
          {leftIcon}
        </span>
      )}

      {/* Button Text/Content */}
      <span className={loading ? 'opacity-70' : ''}>
        {children}
      </span>

      {/* Right Icon */}
      {!loading && rightIcon && (
        <span className="flex-shrink-0" aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </button>
  );
});

// Set display name for debugging
Button.displayName = 'Button';

export default Button;
