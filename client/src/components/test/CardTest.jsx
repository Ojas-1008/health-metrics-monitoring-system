/**
 * ============================================
 * CARD COMPONENT TEST SUITE
 * ============================================
 * 
 * Comprehensive testing for Card component
 * Tests all variants, props, interactions, and features
 */

import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import Card from '../common/Card';
import Button from '../common/Button';

/**
 * Test Section Component
 */
function TestSection({ title, children }) {
  return (
    <div className="mb-12 p-6 bg-gray-50 rounded-lg border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}

TestSection.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

/**
 * Main CardTest Component
 */
export default function CardTest() {
  // State for testing
  const [clickCount, setClickCount] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState('default');
  const [isHovering, setIsHovering] = useState(false);
  const cardRef = useRef(null);

  const variants = ['default', 'bordered', 'elevated', 'glass', 'gradient'];

  const handleCardClick = () => {
    setClickCount(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Card Component Test Suite</h1>
          <p className="text-lg text-gray-600">Comprehensive testing of Card variants, props, and interactions</p>
        </div>

        {/* ===== TEST 1: BASIC CARD ===== */}
        <TestSection title="1. Basic Card (Default Variant)">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <p className="text-gray-700">This is a basic card with default styling</p>
            </Card>
            <Card className="bg-blue-50">
              <p className="text-gray-700">This card has a custom className applied</p>
            </Card>
          </div>
        </TestSection>

        {/* ===== TEST 2: CARD WITH TITLE AND SUBTITLE ===== */}
        <TestSection title="2. Card with Title & Subtitle">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Card Title">
              <p className="text-gray-700">This card has only a title</p>
            </Card>
            <Card title="Complete Header" subtitle="With subtitle beneath">
              <p className="text-gray-700">This card has both title and subtitle</p>
            </Card>
          </div>
        </TestSection>

        {/* ===== TEST 3: CARD WITH FOOTER ===== */}
        <TestSection title="3. Card with Footer">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card
              title="Card with Footer"
              footer={
                <div className="flex gap-2">
                  <Button variant="secondary" size="small">Cancel</Button>
                  <Button variant="primary" size="small">Confirm</Button>
                </div>
              }
            >
              <p className="text-gray-700">This card has a footer with action buttons</p>
            </Card>
            <Card
              title="Custom Footer Text"
              footer={<p className="text-sm text-gray-500">Last updated: Just now</p>}
            >
              <p className="text-gray-700">Footer can contain any content</p>
            </Card>
          </div>
        </TestSection>

        {/* ===== TEST 4: ALL VARIANTS ===== */}
        <TestSection title="4. All Variants">
          <div className="space-y-4">
            {variants.map(variant => (
              <Card key={variant} variant={variant} title={`Variant: ${variant}`}>
                <p className="text-gray-700">This card uses the <strong>{variant}</strong> variant</p>
              </Card>
            ))}
          </div>
        </TestSection>

        {/* ===== TEST 5: HOVERABLE CARD ===== */}
        <TestSection title="5. Hoverable Card (hoverable=true)">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card hoverable title="Hover me!" variant="elevated">
              <p className="text-gray-700">This card has hoverable=true prop. Try hovering over it to see the lift effect</p>
            </Card>
            <Card hoverable variant="gradient" title="Also Hoverable">
              <p className="text-gray-700">Different variant with hover effect enabled</p>
            </Card>
          </div>
        </TestSection>

        {/* ===== TEST 6: CLICKABLE CARD ===== */}
        <TestSection title="6. Clickable Card (clickable=true)">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card 
              clickable 
              title="Click me!" 
              onClick={handleCardClick}
              className="cursor-pointer"
            >
              <p className="text-gray-700">This card is clickable</p>
              <p className="mt-2 text-sm text-blue-600 font-medium">Click count: {clickCount}</p>
            </Card>
            <Card 
              clickable 
              variant="glass"
              title="Also Clickable"
              onClick={() => alert('Card was clicked!')}
            >
              <p className="text-gray-700">This card shows an alert when clicked</p>
            </Card>
          </div>
        </TestSection>

        {/* ===== TEST 7: HEADER ACTION ===== */}
        <TestSection title="7. Card with Header Action">
          <div className="grid grid-cols-1 gap-6">
            <Card 
              title="Card with Header Action"
              headerAction={
                <Button 
                  variant="ghost" 
                  size="small"
                  onClick={() => alert('Action triggered!')}
                >
                  ⚙️
                </Button>
              }
            >
              <p className="text-gray-700">This card has an action button in the header</p>
            </Card>
          </div>
        </TestSection>

        {/* ===== TEST 8: NO PADDING ===== */}
        <TestSection title="8. Card with noPadding=true">
          <div className="grid grid-cols-1 gap-6">
            <Card noPadding title="Custom Padding" subtitle="noPadding=true">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-40 rounded-lg"></div>
            </Card>
          </div>
        </TestSection>

        {/* ===== TEST 9: KEYBOARD ACCESSIBILITY ===== */}
        <TestSection title="9. Keyboard Accessibility (clickable + keyboard events)">
          <div className="grid grid-cols-1 gap-6">
            <Card 
              clickable
              title="Press Enter or Space"
              onClick={() => alert('Card activated via keyboard!')}
            >
              <p className="text-gray-700">
                Click this card or focus and press Enter/Space to test keyboard accessibility
              </p>
            </Card>
          </div>
        </TestSection>

        {/* ===== TEST 10: COMPLEX NESTED CONTENT ===== */}
        <TestSection title="10. Complex Nested Content">
          <div className="grid grid-cols-1 gap-6">
            <Card 
              title="Complex Card"
              subtitle="With nested components"
              variant="gradient"
              footer={
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Last updated: 2 mins ago</span>
                  <Button variant="ghost" size="small">View More</Button>
                </div>
              }
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-100 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-900">24</div>
                    <div className="text-sm text-blue-700">Items</div>
                  </div>
                  <div className="bg-green-100 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-900">92%</div>
                    <div className="text-sm text-green-700">Progress</div>
                  </div>
                </div>
                <p className="text-gray-700">Complex nested content with multiple elements</p>
              </div>
            </Card>
          </div>
        </TestSection>

        {/* ===== TEST 11: COMBINED PROPS ===== */}
        <TestSection title="11. Combined Props (hoverable + clickable + onClick)">
          <div className="grid grid-cols-1 gap-6">
            <Card 
              hoverable
              clickable
              variant="elevated"
              title="Interactive Card"
              subtitle="Hover and click enabled"
              onClick={handleCardClick}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <p className="text-gray-700">
                This card combines hoverable, clickable, and custom onClick handler
              </p>
              <p className="mt-2 text-sm text-gray-600">
                Hovering: {isHovering ? '✓' : '✗'} | Clicks: {clickCount}
              </p>
            </Card>
          </div>
        </TestSection>

        {/* ===== TEST 12: VARIANT SELECTOR ===== */}
        <TestSection title="12. Dynamic Variant Selector">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select a variant:
            </label>
            <div className="flex flex-wrap gap-2">
              {variants.map(v => (
                <Button
                  key={v}
                  variant={selectedVariant === v ? 'primary' : 'secondary'}
                  size="small"
                  onClick={() => setSelectedVariant(v)}
                >
                  {v}
                </Button>
              ))}
            </div>
          </div>
          <Card 
            ref={cardRef}
            variant={selectedVariant}
            title={`Variant: ${selectedVariant}`}
            hoverable
            clickable
            onClick={handleCardClick}
          >
            <p className="text-gray-700">
              This card&apos;s variant can be changed using the buttons above
            </p>
            <p className="mt-2 text-sm text-blue-600">Clicks: {clickCount}</p>
          </Card>
        </TestSection>

        {/* ===== TEST 13: REF FORWARDING ===== */}
        <TestSection title="13. Ref Forwarding Test">
          <div className="grid grid-cols-1 gap-6">
            <Card 
              ref={cardRef}
              title="Card with Ref"
              footer={
                <Button 
                  size="small"
                  onClick={() => {
                    if (cardRef.current) {
                      cardRef.current.style.opacity = '0.5';
                      setTimeout(() => {
                        if (cardRef.current) cardRef.current.style.opacity = '1';
                      }, 500);
                    }
                  }}
                >
                  Fade Effect
                </Button>
              }
            >
              <p className="text-gray-700">This card is wrapped with a ref. Click the button to see the fade effect</p>
            </Card>
          </div>
        </TestSection>

        {/* ===== TEST 14: EDGE CASES ===== */}
        <TestSection title="14. Edge Cases">
          <div className="space-y-6">
            {/* Empty Card */}
            <Card title="Empty Card">
              {/* No content */}
            </Card>

            {/* Title only */}
            <Card title="Only Title" />

            {/* Long Title */}
            <Card title="This is a very long title that should be truncated when it exceeds the available space in the card component">
              <p className="text-gray-700">Notice how the long title is truncated</p>
            </Card>

            {/* Multiple Class Names */}
            <Card 
              className="border-2 border-red-500 shadow-2xl"
              title="Custom Classes Applied"
            >
              <p className="text-gray-700">Custom className prop has been applied</p>
            </Card>
          </div>
        </TestSection>

        {/* ===== TEST 15: REAL-WORLD USAGE EXAMPLES ===== */}
        <TestSection title="15. Real-World Usage Examples">
          <div className="space-y-6">
            {/* Metric Card Example */}
            <Card 
              title="Daily Steps"
              subtitle="Today's Progress"
              variant="gradient"
              hoverable
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-3xl font-bold text-blue-600">8,245</div>
                  <p className="text-sm text-gray-600 mt-1">Steps taken</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">82%</div>
                  <p className="text-sm text-gray-600 mt-1">Goal progress</p>
                </div>
              </div>
            </Card>

            {/* Settings Card Example */}
            <Card 
              title="Account Settings"
              footer={<Button size="small" variant="primary">Save Changes</Button>}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Email Notifications</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                </div>
                <div className="flex items-center justify-between">
                  <span>Dark Mode</span>
                  <input type="checkbox" className="w-4 h-4" />
                </div>
              </div>
            </Card>

            {/* Stats Card Example */}
            <Card 
              title="Monthly Statistics"
              variant="elevated"
              hoverable
            >
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">245K</div>
                  <p className="text-xs text-gray-600">Total Steps</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">68h</div>
                  <p className="text-xs text-gray-600">Sleep</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">15K</div>
                  <p className="text-xs text-gray-600">Calories</p>
                </div>
              </div>
            </Card>
          </div>
        </TestSection>

        {/* Summary */}
        <div className="mt-16 p-8 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
          <h2 className="text-xl font-bold text-blue-900 mb-2">Test Coverage Summary</h2>
          <ul className="text-blue-800 space-y-1">
            <li>✓ 15 test sections covering all component features</li>
            <li>✓ All 5 variants tested (default, bordered, elevated, glass, gradient)</li>
            <li>✓ Title, subtitle, footer, and headerAction props</li>
            <li>✓ hoverable and clickable props with interactions</li>
            <li>✓ noPadding prop functionality</li>
            <li>✓ Keyboard accessibility (Enter/Space key handling)</li>
            <li>✓ Ref forwarding for DOM access</li>
            <li>✓ Custom className prop merging</li>
            <li>✓ Real-world usage examples</li>
            <li>✓ Edge cases and complex nested content</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
