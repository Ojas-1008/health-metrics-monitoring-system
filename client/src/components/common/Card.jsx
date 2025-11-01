/**
 * ============================================
 * CARD COMPONENT
 * ============================================
 * 
 * Reusable card container component with Tailwind CSS styling
 * 
 * Features:
 * - Consistent padding, shadows, and borders
 * - Optional title/header section
 * - Optional footer section
 * - Hover effect option
 * - Clickable option (for navigation cards)
 * - Responsive design
 * - Customizable styling via className
 * - Multiple variants (default, bordered, elevated)
 * 
 * Styling:
 * - Uses consistent spacing and shadows
 * - Matches Health Metrics app design system
 * - Responsive padding and layout
 * - Smooth transitions
 */

import { forwardRef } from 'react';

/**
 * Card Component
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Card content
 * @param {string|React.ReactNode} [props.title] - Card title/header
 * @param {string} [props.subtitle] - Card subtitle (shown below title)
 * @param {React.ReactNode} [props.footer] - Card footer content
 * @param {React.ReactNode} [props.headerAction] - Action element in header (e.g., button, icon)
 * @param {string} [props.variant='default'] - Card variant (default, bordered, elevated)
 * @param {boolean} [props.hoverable=false] - Enable hover effect
 * @param {boolean} [props.clickable=false] - Make card clickable (shows pointer cursor)
 * @param {Function} [props.onClick] - Click handler (makes card interactive)
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.noPadding=false] - Remove default padding (useful for custom layouts)
 * @param {React.Ref} ref - Forward ref for direct DOM access
 * 
 * @example
 * <Card title="User Profile">
 *   <p>Card content goes here</p>
 * </Card>
 * 
 * @example
 * <Card 
 *   title="Settings"
 *   subtitle="Manage your account"
 *   footer={<Button>Save Changes</Button>}
 *   variant="elevated"
 * >
 *   <form>...</form>
 * </Card>
 */
const Card = forwardRef(({
  children,
  title = null,
  subtitle = null,
  footer = null,
  headerAction = null,
  variant = 'default',
  hoverable = false,
  clickable = false,
  onClick,
  className = '',
  noPadding = false,
  ...rest
}, ref) => {
  // ===== BASE CLASSES =====
  
  /**
   * Base classes applied to all cards
   */
  const baseClasses = `
    bg-white
    rounded-lg
    transition-all
    duration-200
    ease-in-out
    ${clickable || onClick ? 'cursor-pointer' : ''}
  `;

  // ===== VARIANT CLASSES =====
  
  /**
   * Variant-specific styling
   */
  const variantClasses = {
    default: `
      border
      border-gray-200
      shadow-sm
    `,
    bordered: `
      border-2
      border-gray-300
    `,
    elevated: `
      shadow-md
      border
      border-gray-100
    `,
  };

  /**
   * Hover effect classes (if hoverable or clickable)
   */
  const hoverClasses = (hoverable || clickable || onClick) ? `
    hover:shadow-lg
    hover:border-primary-200
    hover:-translate-y-0.5
  ` : '';

  /**
   * Combine all card classes
   */
  const cardClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${hoverClasses}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  // ===== PADDING CLASSES =====
  
  /**
   * Content padding (can be disabled with noPadding prop)
   */
  const contentPadding = noPadding ? '' : 'p-6';

  // ===== HEADER CLASSES =====
  
  /**
   * Header section classes
   */
  const headerClasses = `
    ${noPadding ? 'px-6 pt-6 pb-4' : 'pb-4 mb-4'}
    border-b
    border-gray-200
  `.trim().replace(/\s+/g, ' ');

  /**
   * Footer section classes
   */
  const footerClasses = `
    ${noPadding ? 'px-6 pb-6 pt-4' : 'pt-4 mt-4'}
    border-t
    border-gray-200
  `.trim().replace(/\s+/g, ' ');

  // ===== EVENT HANDLERS =====
  
  /**
   * Handle click event
   */
  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }
  };

  /**
   * Handle keyboard events (for accessibility)
   */
  const handleKeyDown = (e) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(e);
    }
  };

  // ===== COMPUTED VALUES =====
  
  /**
   * Determine if card has header
   */
  const hasHeader = Boolean(title || subtitle || headerAction);

  /**
   * Determine if card has footer
   */
  const hasFooter = Boolean(footer);

  /**
   * Make card interactive if it has onClick handler
   */
  const isInteractive = Boolean(onClick);

  // ===== RENDER =====
  
  const CardElement = (
    <div
      ref={ref}
      className={cardClasses}
      onClick={isInteractive ? handleClick : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      {...rest}
    >
      {/* Header Section */}
      {hasHeader && (
        <div className={headerClasses}>
          <div className="flex items-start justify-between">
            {/* Title and Subtitle */}
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-gray-600">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Header Action (e.g., button, icon) */}
            {headerAction && (
              <div className="ml-4 flex-shrink-0">
                {headerAction}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content Section */}
      <div className={contentPadding}>
        {children}
      </div>

      {/* Footer Section */}
      {hasFooter && (
        <div className={footerClasses}>
          {footer}
        </div>
      )}
    </div>
  );

  return CardElement;
});

// Set display name for debugging
Card.displayName = 'Card';

export default Card;
