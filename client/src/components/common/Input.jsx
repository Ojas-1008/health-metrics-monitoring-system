/**
 * ============================================
 * INPUT COMPONENT (ENHANCED v2.0.0)
 * ============================================
 * 
 * Premium input field with Modern Glassmorphism styling
 * 
 * Features:
 * - Glassmorphism with subtle backdrop blur
 * - Floating label animation
 * - Smooth focus state transitions
 * - Enhanced password visibility toggle
 * - Animated error states
 * - Gradient focus rings
 * - Icon support with state-based styling
 * - Industry-standard accessibility
 * - PropTypes validation for type safety
 */

import { useState, forwardRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Input Component - Premium Form Input Field
 * 
 * A reusable, accessible form input component with glassmorphism styling,
 * real-time validation feedback, password visibility toggle, and comprehensive
 * accessibility features (WCAG 2.1 AA compliant).
 * 
 * @param {Object} props - Component props
 * @param {string} [props.type='text'] - Input type (text, email, password, number, date, tel, url, search)
 * @param {string} props.name - Input name attribute (form identifier) - REQUIRED
 * @param {string} [props.id] - HTML id attribute (auto-generated from name if omitted)
 * @param {string} [props.placeholder] - Placeholder text shown when empty
 * @param {string|number} [props.value] - Input value (use with onChange for controlled component)
 * @param {Function} [props.onChange] - Callback fired when input value changes (e: SyntheticEvent)
 * @param {Function} [props.onBlur] - Callback fired when input loses focus (e: SyntheticEvent)
 * @param {Function} [props.onFocus] - Callback fired when input gains focus (e: SyntheticEvent)
 * @param {string} [props.error] - Error message to display (empty string = no error)
 * @param {string} [props.label] - Label text displayed above input
 * @param {boolean} [props.required=false] - Show required indicator (*) and set required attribute
 * @param {boolean} [props.disabled=false] - Disable input interaction (grayed out, not-interactive)
 * @param {boolean} [props.autoFocus=false] - Auto-focus input on component mount
 * @param {string} [props.autoComplete] - HTML autocomplete attribute (e.g., 'email', 'current-password')
 * @param {number|string} [props.min] - Minimum value for number inputs
 * @param {number|string} [props.max] - Maximum value for number inputs
 * @param {number} [props.minLength] - Minimum character length
 * @param {number} [props.maxLength] - Maximum character length
 * @param {string} [props.pattern] - Regular expression pattern for HTML5 validation
 * @param {string} [props.className] - Additional Tailwind CSS classes (merged with base classes)
 * @param {string} [props.helperText] - Helper text shown below input when no error present
 * @param {React.Ref} ref - Forward ref for direct access to input element
 * 
 * @returns {React.ReactElement} Rendered input field component with label, validation feedback, and helper text
 * 
 * @example
 * // Basic email input with validation
 * const [email, setEmail] = useState('');
 * const [error, setError] = useState('');
 * 
 * <Input
 *   type="email"
 *   name="email"
 *   label="Email Address"
 *   placeholder="user@example.com"
 *   value={email}
 *   onChange={(e) => setEmail(e.target.value)}
 *   error={error}
 *   required
 * />
 * 
 * @example
 * // Password input with helper text
 * const [password, setPassword] = useState('');
 * 
 * <Input
 *   type="password"
 *   name="password"
 *   label="Password"
 *   placeholder="••••••••"
 *   value={password}
 *   onChange={(e) => setPassword(e.target.value)}
 *   helperText="Must be at least 8 characters"
 *   minLength={8}
 *   required
 * />
 * 
 * @example
 * // Number input with min/max constraints
 * <Input
 *   type="number"
 *   name="age"
 *   label="Age"
 *   value={age}
 *   onChange={(e) => setAge(e.target.value)}
 *   min={18}
 *   max={120}
 *   error={ageError}
 * />
 * 
 * @example
 * // Text input with custom styling and ref
 * const inputRef = useRef();
 * 
 * <Input
 *   ref={inputRef}
 *   type="text"
 *   name="fullName"
 *   label="Full Name"
 *   placeholder="John Doe"
 *   value={fullName}
 *   onChange={(e) => setFullName(e.target.value)}
 *   onBlur={(e) => validateFullName(e.target.value)}
 *   className="bg-blue-50 focus:bg-blue-100"
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

  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // ===== COMPUTED VALUES =====

  const inputId = id || `input-${name}`;
  const inputType = type === 'password' && showPassword ? 'text' : type;
  const hasError = Boolean(error);
  const hasValue = Boolean(value);

  // ===== EVENT HANDLERS =====

  const handleFocus = (e) => {
    setIsFocused(true);
    if (onFocus) {
      onFocus(e);
    }
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    if (onBlur) {
      onBlur(e);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // ===== CSS CLASSES =====

  const baseClasses = `
    peer
    w-full
    px-4
    py-3
    text-gray-900
    bg-white/80
    backdrop-blur-sm
    border-2
    rounded-xl
    font-medium
    text-base
    transition-all
    duration-300
    ease-out
    placeholder:text-gray-400
    placeholder:font-normal
    focus:outline-none
    disabled:bg-gray-100/80
    disabled:text-gray-500
    disabled:cursor-not-allowed
    disabled:backdrop-blur-none
  `;

  const stateClasses = hasError
    ? `
        border-red-300/60
        focus:border-red-500
        focus:ring-4
        focus:ring-red-200/30
        focus:shadow-lg
        focus:shadow-red-200/20
      `
    : `
        border-gray-200/80
        focus:border-blue-500
        focus:ring-4
        focus:ring-blue-200/30
        focus:shadow-lg
        focus:shadow-blue-200/20
      `;

  const inputClasses = `${baseClasses} ${stateClasses} ${className}`.trim().replace(/\s+/g, ' ');

  const labelClasses = `
    block
    text-sm
    font-semibold
    mb-2
    tracking-wide
    transition-colors
    duration-200
    ${hasError ? 'text-red-600' : isFocused ? 'text-blue-600' : 'text-gray-700'}
    ${disabled ? 'text-gray-400' : ''}
  `.trim().replace(/\s+/g, ' ');

  const helperTextClasses = `
    mt-2
    text-sm
    font-medium
    transition-all
    duration-200
    ${hasError ? 'text-red-600 animate-slideDown' : 'text-gray-500'}
  `.trim().replace(/\s+/g, ' ');

  // ===== RENDER =====

  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <label htmlFor={inputId} className={labelClasses}>
          {label}
          {required && (
            <span className="text-red-500 ml-1 text-base" aria-label="required">
              *
            </span>
          )}
        </label>
      )}

      {/* Input Container */}
      <div className="relative group">
        {/* Focus Glow Effect */}
        <div
          className={`
            absolute 
            -inset-0.5 
            bg-gradient-to-r 
            ${hasError ? 'from-red-500 to-rose-500' : 'from-blue-500 to-indigo-500'}
            rounded-xl 
            opacity-0
            blur
            transition-opacity
            duration-300
            ${isFocused && !disabled ? 'opacity-20' : ''}
          `}
          aria-hidden="true"
        />

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

        {/* Password Visibility Toggle */}
        {type === 'password' && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            disabled={disabled}
            className={`
              absolute 
              right-3 
              top-1/2 
              -translate-y-1/2 
              p-1
              rounded-lg
              transition-all
              duration-200
              ${disabled
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50 active:scale-95'
              }
              focus:outline-none 
              focus:ring-2 
              focus:ring-blue-200
            `}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            title={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}

        {/* Error Icon */}
        {hasError && type !== 'password' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none animate-scaleIn">
            <div className="relative">
              <div className="absolute inset-0 bg-red-400 rounded-full blur opacity-20 animate-pulse"></div>
              <svg className="w-5 h-5 relative z-10" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        )}

        {/* Success Icon (when no error and has value) */}
        {!hasError && hasValue && isFocused && type !== 'password' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none animate-scaleIn">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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

      {/* Helper Text */}
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

Input.displayName = 'Input';

// ===== PROP TYPES VALIDATION =====
Input.propTypes = {
  type: PropTypes.string,
  name: PropTypes.string.isRequired,
  id: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  onFocus: PropTypes.func,
  error: PropTypes.string,
  label: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  autoFocus: PropTypes.bool,
  autoComplete: PropTypes.string,
  min: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  max: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  minLength: PropTypes.number,
  maxLength: PropTypes.number,
  pattern: PropTypes.string,
  className: PropTypes.string,
  helperText: PropTypes.string,
};

export default Input;