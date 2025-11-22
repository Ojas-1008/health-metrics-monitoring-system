/**
 * ============================================
 * CARD COMPONENT (ENHANCED)
 * ============================================
 * 
 * Premium card container with Modern Glassmorphism styling
 * 
 * Features:
 * - Glassmorphism with backdrop blur
 * - Subtle gradient overlays
 * - Smooth hover animations with lift effect
 * - Enhanced shadows with color tints
 * - Premium border styling
 * - Interactive states with scale transform
 * - Optimized for accessibility
 * - Industry-standard code structure
 */

import { forwardRef } from 'react';

/**
 * Card Component
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Card content
 * @param {string|React.ReactNode} [props.title] - Card title/header
 * @param {string} [props.subtitle] - Card subtitle
 * @param {React.ReactNode} [props.footer] - Card footer content
 * @param {React.ReactNode} [props.headerAction] - Action element in header
 * @param {string} [props.variant='default'] - Card variant
 * @param {boolean} [props.hoverable=false] - Enable hover effect
 * @param {boolean} [props.clickable=false] - Make card clickable
 * @param {Function} [props.onClick] - Click handler
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.noPadding=false] - Remove default padding
 * @param {React.Ref} ref - Forward ref
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

  const baseClasses = `
    relative
    bg-white/90
    backdrop-blur-sm
    rounded-2xl
    transition-all
    duration-300
    ease-out
    transform
    overflow-hidden
    ${clickable || onClick ? 'cursor-pointer' : ''}
  `;

  // ===== VARIANT CLASSES =====

  const variantClasses = {
    default: `
      border
      border-gray-200/80
      shadow-md
      shadow-gray-200/50
    `,
    bordered: `
      border-2
      border-gray-300/60
      shadow-sm
    `,
    elevated: `
      shadow-xl
      shadow-gray-300/30
      border
      border-gray-100/50
    `,
    glass: `
      bg-white/70
      backdrop-blur-md
      border
      border-white/20
      shadow-lg
      shadow-gray-400/20
    `,
    gradient: `
      bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30
      border
      border-blue-100/50
      shadow-lg
      shadow-blue-200/30
    `,
  };

  // ===== HOVER EFFECT CLASSES =====

  const hoverClasses = (hoverable || clickable || onClick) ? `
    hover:shadow-2xl
    hover:shadow-gray-300/40
    hover:-translate-y-1
    hover:scale-[1.01]
    hover:border-blue-200/80
    active:scale-[0.99]
    active:shadow-lg
  ` : '';

  // ===== COMBINE CLASSES =====

  const cardClasses = `
    ${baseClasses}
    ${variantClasses[variant] || variantClasses.default}
    ${hoverClasses}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  // ===== PADDING CLASSES =====

  const contentPadding = noPadding ? '' : 'p-6';

  // ===== HEADER CLASSES =====

  const headerClasses = `
    ${noPadding ? 'px-6 pt-6 pb-4' : 'pb-4 mb-4'}
    border-b
    border-gray-200/60
  `.trim().replace(/\s+/g, ' ');

  const footerClasses = `
    ${noPadding ? 'px-6 pb-6 pt-4' : 'pt-4 mt-4'}
    border-t
    border-gray-200/60
    bg-gray-50/50
  `.trim().replace(/\s+/g, ' ');

  // ===== EVENT HANDLERS =====

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }
  };

  const handleKeyDown = (e) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(e);
    }
  };

  // ===== COMPUTED VALUES =====

  const hasHeader = Boolean(title || subtitle || headerAction);
  const hasFooter = Boolean(footer);
  const isInteractive = Boolean(onClick);

  // ===== RENDER =====

  return (
    <div
      ref={ref}
      className={cardClasses}
      onClick={isInteractive ? handleClick : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      {...rest}
    >
      {/* Subtle Gradient Overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] via-transparent to-purple-500/[0.02] pointer-events-none"
        aria-hidden="true"
      />

      {/* Header Section */}
      {hasHeader && (
        <div className={headerClasses}>
          <div className="flex items-start justify-between relative z-10">
            {/* Title and Subtitle */}
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className="text-lg font-bold text-gray-900 truncate tracking-tight">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-gray-600 font-medium">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Header Action */}
            {headerAction && (
              <div className="ml-4 flex-shrink-0">
                {headerAction}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content Section */}
      <div className={`${contentPadding} relative z-10`}>
        {children}
      </div>

      {/* Footer Section */}
      {hasFooter && (
        <div className={footerClasses}>
          <div className="relative z-10">
            {footer}
          </div>
        </div>
      )}
    </div>
  );
});

Card.displayName = 'Card';

export default Card;
