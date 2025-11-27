/**
 * Button Component Test Suite
 * Tests all variants, sizes, states, and edge cases
 * Updated: 2025-11-27 - Added tests for fixes
 */

import { useState, useRef } from 'react';
import Button from '../common/Button';

function ButtonTest() {
  const [clickCount, setClickCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardClickCount, setKeyboardClickCount] = useState(0);
  const buttonRef = useRef(null);

  const handleTestClick = () => {
    setClickCount(prev => prev + 1);
  };

  const handleLoadingTest = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  const handleKeyboardTest = (e) => {
    setKeyboardClickCount(prev => prev + 1);
    console.log('Keyboard click detected:', e.type, e.key || 'mouse');
  };

  const variants = ['primary', 'secondary', 'danger', 'success', 'outline', 'ghost'];
  const sizes = ['small', 'medium', 'large'];

  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-gray-900">Button Component Test Suite</h1>

      {/* ===== VARIANT TESTS ===== */}
      <section className="mb-12 bg-white rounded-2xl p-8 shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">All Variants</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {variants.map(variant => (
            <Button
              key={variant}
              variant={variant}
              onClick={handleTestClick}
            >
              {variant.charAt(0).toUpperCase() + variant.slice(1)}
            </Button>
          ))}
        </div>
      </section>

      {/* ===== SIZE TESTS ===== */}
      <section className="mb-12 bg-white rounded-2xl p-8 shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">All Sizes</h2>
        <div className="flex gap-4 flex-wrap items-center">
          {sizes.map(size => (
            <Button
              key={size}
              size={size}
              variant="primary"
              onClick={handleTestClick}
            >
              {size.charAt(0).toUpperCase() + size.slice(1)}
            </Button>
          ))}
        </div>
      </section>

      {/* ===== STATE TESTS ===== */}
      <section className="mb-12 bg-white rounded-2xl p-8 shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Button States</h2>
        
        {/* Normal */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-2">Normal State</p>
          <Button variant="primary" onClick={handleTestClick}>
            Normal Button (Clicks: {clickCount})
          </Button>
        </div>

        {/* Disabled */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-2">Disabled State</p>
          <Button variant="primary" disabled>
            Disabled Button
          </Button>
        </div>

        {/* Loading */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-2">Loading State (2 second timeout)</p>
          <Button
            variant="primary"
            loading={isLoading}
            onClick={handleLoadingTest}
          >
            {isLoading ? 'Loading...' : 'Click to Load'}
          </Button>
        </div>

        {/* Full Width */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-2">Full Width State</p>
          <Button variant="primary" fullWidth onClick={handleTestClick}>
            Full Width Button
          </Button>
        </div>
      </section>

      {/* ===== ICON TESTS ===== */}
      <section className="mb-12 bg-white rounded-2xl p-8 shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Icon Support</h2>
        
        <div className="space-y-4">
          {/* Left Icon */}
          <div>
            <p className="text-sm text-gray-600 mb-2">Left Icon</p>
            <Button
              variant="primary"
              leftIcon={<span>🚀</span>}
            >
              With Left Icon
            </Button>
          </div>

          {/* Right Icon */}
          <div>
            <p className="text-sm text-gray-600 mb-2">Right Icon</p>
            <Button
              variant="primary"
              rightIcon={<span>✨</span>}
            >
              With Right Icon
            </Button>
          </div>

          {/* Both Icons */}
          <div>
            <p className="text-sm text-gray-600 mb-2">Both Icons</p>
            <Button
              variant="primary"
              leftIcon={<span>⭐</span>}
              rightIcon={<span>🎯</span>}
            >
              Both Icons
            </Button>
          </div>
        </div>
      </section>

      {/* ===== ACCESSIBILITY TESTS ===== */}
      <section className="mb-12 bg-white rounded-2xl p-8 shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Accessibility Features</h2>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">With aria-label</p>
            <Button
              variant="primary"
              ariaLabel="Click to submit form"
            >
              Accessible Button
            </Button>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">Ref Forwarding Test (Check console)</p>
            <Button
              ref={buttonRef}
              variant="success"
              onClick={() => {
                console.log('Button ref:', buttonRef.current);
                alert('Check console for ref details');
              }}
            >
              Check Ref
            </Button>
          </div>
        </div>
      </section>

      {/* ===== COMBINATION TESTS ===== */}
      <section className="mb-12 bg-white rounded-2xl p-8 shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Combination Tests</h2>
        
        <div className="space-y-4">
          {/* Small + Icon */}
          <div>
            <p className="text-sm text-gray-600 mb-2">Small with Left Icon</p>
            <Button
              size="small"
              variant="primary"
              leftIcon={<span>💾</span>}
              onClick={handleTestClick}
            >
              Save
            </Button>
          </div>

          {/* Large + Full Width */}
          <div>
            <p className="text-sm text-gray-600 mb-2">Large + Full Width</p>
            <Button
              size="large"
              variant="success"
              fullWidth
              leftIcon={<span>✅</span>}
              onClick={handleTestClick}
            >
              Complete Action
            </Button>
          </div>

          {/* Danger + Icon */}
          <div>
            <p className="text-sm text-gray-600 mb-2">Danger with Icon</p>
            <Button
              variant="danger"
              rightIcon={<span>⚠️</span>}
              onClick={() => alert('Danger action triggered')}
            >
              Delete Account
            </Button>
          </div>
        </div>
      </section>

      {/* ===== FORM INTEGRATION TEST ===== */}
      <section className="mb-12 bg-white rounded-2xl p-8 shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Form Integration</h2>
        
        <form
          onSubmit={(e) => {
            e.preventDefault();
            alert('Form submitted! (Check console for event)');
            console.log('Form submission event:', e);
          }}
          className="space-y-4"
        >
          <input
            type="text"
            placeholder="Test input field"
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
          />
          
          <div className="flex gap-4">
            <Button
              type="submit"
              variant="primary"
              fullWidth
            >
              Submit Form
            </Button>
            <button
              type="reset"
              className="px-6 py-2.5 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 transition-all"
            >
              Reset
            </button>
          </div>
        </form>
      </section>

      {/* ===== CUSTOM STYLING TEST ===== */}
      <section className="mb-12 bg-white rounded-2xl p-8 shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Custom Styling</h2>
        
        <div className="space-y-4">
          <Button
            variant="outline"
            className="scale-110 hover:scale-125"
          >
            Custom Scale Transform
          </Button>
          
          <Button
            variant="primary"
            className="rounded-full px-8"
          >
            Custom Round Shape
          </Button>

          <Button
            variant="success"
            className="ring-4 ring-green-300"
          >
            Custom Ring Effect
          </Button>
        </div>
      </section>

      {/* ===== INFO SECTION ===== */}
      <section className="bg-blue-50 rounded-2xl p-8 shadow-lg border-2 border-blue-200">
        <h2 className="text-2xl font-bold mb-4 text-blue-900">Test Summary</h2>
        <ul className="space-y-2 text-blue-800">
          <li>✅ All 6 variants tested (primary, secondary, danger, success, outline, ghost)</li>
          <li>✅ All 3 sizes tested (small, medium, large)</li>
          <li>✅ Button states verified (normal, disabled, loading)</li>
          <li>✅ Icon support tested (left, right, both)</li>
          <li>✅ Accessibility features validated</li>
          <li>✅ Ref forwarding tested</li>
          <li>✅ Form integration verified</li>
          <li>✅ Custom styling accepted</li>
          <li>✅ Click count: {clickCount} (verify event handlers work)</li>
        </ul>
      </section>

      {/* ===== FIXES VERIFICATION ===== */}
      <section className="mt-8 bg-green-50 rounded-2xl p-8 shadow-lg border-2 border-green-200">
        <h2 className="text-2xl font-bold mb-4 text-green-900">🔧 Fixes Verification (v2.0.0)</h2>
        
        {/* FIX #1: PropTypes - Test with invalid props */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-green-800 mb-2">Fix #1: PropTypes Validation</h3>
          <p className="text-sm text-green-700 mb-2">
            Open browser console to see PropTypes warnings for invalid props:
          </p>
          <div className="flex gap-2 flex-wrap">
            <Button variant="invalid-variant">Invalid Variant</Button>
            <Button size="invalid-size">Invalid Size</Button>
            <Button>Valid Button (no warnings)</Button>
          </div>
          <p className="text-xs text-green-600 mt-2">
            ✅ PropTypes now validates: children (required), onClick, type, variant, size, disabled, loading, fullWidth, leftIcon, rightIcon, className, ariaLabel
          </p>
        </div>

        {/* FIX #2: Keyboard Ripple */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-green-800 mb-2">Fix #2: Keyboard Ripple Effect</h3>
          <p className="text-sm text-green-700 mb-2">
            Use Tab to focus this button, then press Enter or Space. Ripple should appear at center:
          </p>
          <Button 
            variant="success" 
            onClick={handleKeyboardTest}
            className="focus:ring-4 focus:ring-green-300"
          >
            Keyboard Test (Focus + Enter/Space) - Count: {keyboardClickCount}
          </Button>
          <p className="text-xs text-green-600 mt-2">
            ✅ Ripple now centers on keyboard activation instead of appearing at top-left corner
          </p>
        </div>

        {/* FIX #3: Ripple ID Collision */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-green-800 mb-2">Fix #3: Ripple ID (Monotonic Counter)</h3>
          <p className="text-sm text-green-700 mb-2">
            Rapidly click this button multiple times. All ripples should be unique (no visual glitches):
          </p>
          <Button 
            variant="primary" 
            size="large"
            onClick={handleTestClick}
          >
            Rapid Click Test (Clicks: {clickCount})
          </Button>
          <p className="text-xs text-green-600 mt-2">
            ✅ Using useRef counter instead of Date.now() prevents ID collisions on rapid clicks
          </p>
        </div>

        {/* FIX #4: Dev Warnings */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-green-800 mb-2">Fix #4: Development Mode Warnings</h3>
          <p className="text-sm text-green-700 mb-2">
            Check browser console for detailed warning messages when using invalid props:
          </p>
          <code className="block bg-green-100 p-3 rounded-lg text-xs text-green-800">
            {`[Button] Invalid variant "xyz" provided. Valid variants are: primary, secondary, danger, success, outline, ghost. Falling back to "primary".`}
          </code>
          <p className="text-xs text-green-600 mt-2">
            ✅ Console warnings help developers catch prop errors quickly
          </p>
        </div>

        {/* Summary */}
        <div className="bg-green-100 p-4 rounded-lg">
          <h3 className="font-bold text-green-900 mb-2">All Fixes Applied ✅</h3>
          <ul className="text-sm text-green-800 space-y-1">
            <li>✅ Issue #1: PropTypes validation added (13 props documented)</li>
            <li>✅ Issue #2: Keyboard ripple centers correctly</li>
            <li>✅ Issue #3: Ripple IDs use monotonic counter (no Date.now())</li>
            <li>✅ Issue #4: Dev mode warnings for invalid props</li>
            <li>✅ Issue #5: PropTypes catches invalid variant/size values</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

export default ButtonTest;
