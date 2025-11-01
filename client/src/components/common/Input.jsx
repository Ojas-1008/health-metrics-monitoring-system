/**
 * ============================================
 * INPUT COMPONENT
 * ============================================
 * 
 * Reusable input field component with Tailwind CSS styling
 * 
 * Features:
 * - Multiple input types (text, email, password, number, tel, url, date, etc.)
 * - Label support with optional required indicator
 * - Error state with error message display
 * - Disabled state styling
 * - Accessible (ARIA labels, proper IDs)
 * - Password visibility toggle (for password type)
 * - Custom placeholder support
 * - Auto-focus capability
 * - Full keyboard accessibility
 * 
 * Styling:
 * - Uses custom primary colors from tailwind.config.js
 * - Focus ring with primary-600 color
 * - Error state with red-600 color
 * - Smooth transitions for all states
 */

import { useState, forwardRef } from 'react';

/**
 * Input Component
 * 
 * @param {Object} props - Component props
 * @param {string} props.type - Input type (text, email, password, number, tel, url, date, etc.)
 * @param {string} props.name - Input name attribute
 * @param {string} [props.id] - Input ID (auto-generated from name if not provided)
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string|number} [props.value] - Input value (controlled)
 * @param {Function} [props.onChange] - Change handler function
 * @param {Function} [props.onBlur] - Blur handler function
 * @param {Function} [props.onFocus] - Focus handler function
 * @param {string} [props.error] - Error message to display
 * @param {string} [props.label] - Label text
 * @param {boolean} [props.required=false] - Whether field is required
 * @param {boolean} [props.disabled=false] - Whether input is disabled
 * @param {boolean} [props.autoFocus=false] - Whether to auto-focus on mount
 * @param {string} [props.autoComplete] - Autocomplete attribute
 * @param {number} [props.min] - Minimum value (for number/date inputs)
 * @param {number} [props.max] - Maximum value (for number/date inputs)
 * @param {number} [props.minLength] - Minimum length
 * @param {number} [props.maxLength] - Maximum length
 * @param {string} [props.pattern] - Validation pattern (regex)
 * @param {string} [props.className] - Additional CSS classes
 * @param {string} [props.helperText] - Helper text below input
 * @param {React.Ref} ref - Forward ref for direct DOM access
 * 
 * @example
 * <Input
 *   type="email"
 *   name="email"
 *   label="Email Address"
 *   placeholder="Enter your email"
 *   value={email}
 *   onChange={(e) => setEmail(e.target.value)}
 *   error={emailError}
 *   required
 * />
 */
const Input = forwardRef(({
  type = 'text',
  name,
  id,
  placeholder = '',
  value = '',
  onChange,
  onBlur,
  onFocus,
  error = '',
  label = '',
  required = false,
  disabled = false,
  autoFocus = false,
  autoComplete,
  min,
  max,
  minLength,
  maxLength,
  pattern,
  className = '',
  helperText = '',
  ...rest
}, ref) => {
  // ===== STATE MANAGEMENT =====
  
  /**
   * Password visibility toggle state (only for password inputs)
   */
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Focus state for styling
   */
  const [isFocused, setIsFocused] = useState(false);

  // ===== COMPUTED VALUES =====
  
  /**
   * Generate unique ID from name if not provided
   */
  const inputId = id || `input-${name}`;

  /**
   * Determine actual input type (handle password visibility toggle)
   */
  const inputType = type === 'password' && showPassword ? 'text' : type;

  /**
   * Check if input has error
   */
  const hasError = Boolean(error);

  // ===== EVENT HANDLERS =====
  
  /**
   * Handle focus event
   */
  const handleFocus = (e) => {
    setIsFocused(true);
    if (onFocus) {
      onFocus(e);
    }
  };

  /**
   * Handle blur event
   */
  const handleBlur = (e) => {
    setIsFocused(false);
    if (onBlur) {
      onBlur(e);
    }
  };

  /**
   * Toggle password visibility
   */
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // ===== CSS CLASSES =====
  
  /**
   * Base input classes (always applied)
   */
  const baseClasses = `
    w-full
    px-4
    py-2.5
    text-gray-900
    bg-white
    border
    rounded-lg
    font-sans
    text-base
    transition-all
    duration-200
    ease-in-out
    placeholder:text-gray-400
    focus:outline-none
    disabled:bg-gray-50
    disabled:text-gray-500
    disabled:cursor-not-allowed
  `;

  /**
   * Dynamic border and focus classes based on state
   */
  const stateClasses = hasError
    ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
    : 'border-gray-300 focus:border-primary-600 focus:ring-2 focus:ring-primary-200';

  /**
   * Combine all classes
   */
  const inputClasses = `${baseClasses} ${stateClasses} ${className}`.trim().replace(/\s+/g, ' ');

  /**
   * Label classes
   */
  const labelClasses = `
    block
    text-sm
    font-medium
    mb-1.5
    ${hasError ? 'text-red-600' : 'text-gray-700'}
    ${disabled ? 'text-gray-400' : ''}
  `.trim().replace(/\s+/g, ' ');

  /**
   * Helper text classes
   */
  const helperTextClasses = `
    mt-1.5
    text-sm
    ${hasError ? 'text-red-600' : 'text-gray-500'}
  `.trim().replace(/\s+/g, ' ');

  // ===== RENDER =====
  
  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <label htmlFor={inputId} className={labelClasses}>
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="required">
              *
            </span>
          )}
        </label>
      )}

      {/* Input Container (for password toggle button) */}
      <div className="relative">
        {/* Input Field */}
        <input
          ref={ref}
          id={inputId}
          type={inputType}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          min={min}
          max={max}
          minLength={minLength}
          maxLength={maxLength}
          pattern={pattern}
          className={inputClasses}
          aria-invalid={hasError}
          aria-describedby={
            hasError 
              ? `${inputId}-error` 
              : helperText 
              ? `${inputId}-helper` 
              : undefined
          }
          {...rest}
        />

        {/* Password Visibility Toggle Button */}
        {type === 'password' && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            disabled={disabled}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:text-primary-600 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? (
              // Eye Slash Icon (Hide)
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            ) : (
              // Eye Icon (Show)
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        )}

        {/* Error Icon */}
        {hasError && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none">
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Error Message */}
      {hasError && (
        <p
          id={`${inputId}-error`}
          className={helperTextClasses}
          role="alert"
        >
          {error}
        </p>
      )}

      {/* Helper Text (only show if no error) */}
      {!hasError && helperText && (
        <p
          id={`${inputId}-helper`}
          className={helperTextClasses}
        >
          {helperText}
        </p>
      )}
    </div>
  );
});

// Set display name for debugging
Input.displayName = 'Input';

export default Input;