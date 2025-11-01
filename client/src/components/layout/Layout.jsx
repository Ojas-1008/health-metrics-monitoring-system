import { Link } from 'react-router-dom';
import Header from './Header';

/**
 * ============================================
 * LAYOUT COMPONENT
 * ============================================
 * 
 * Wrapper component providing consistent page structure
 * 
 * Features:
 * - Includes Header component
 * - Main content area with consistent padding
 * - Footer with app info and links
 * - Responsive design
 * - Full-height layout
 * - Optional custom styling
 * - SEO-friendly structure
 */

/**
 * Layout Component
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Page content to render
 * @param {boolean} [props.showHeader=true] - Whether to show header
 * @param {boolean} [props.showFooter=true] - Whether to show footer
 * @param {string} [props.className] - Additional CSS classes for main content
 * @param {string} [props.maxWidth='max-w-7xl'] - Max width constraint
 * @param {string} [props.bgColor='bg-gray-50'] - Background color
 * 
 * @example
 * <Layout>
 *   <h1>Page Content</h1>
 * </Layout>
 * 
 * @example
 * <Layout showFooter={false} bgColor="bg-white">
 *   <Dashboard />
 * </Layout>
 */
function Layout({
  children,
  showHeader = true,
  showFooter = true,
  className = '',
  maxWidth = 'max-w-7xl',
  bgColor = 'bg-gray-50',
}) {
  // ===== COMPUTED VALUES =====
  
  /**
   * Main content classes
   */
  const mainClasses = `
    flex-1
    ${bgColor}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  /**
   * Container classes (for content width constraint)
   */
  const containerClasses = `
    ${maxWidth}
    mx-auto
    px-4
    sm:px-6
    lg:px-8
    py-8
  `.trim().replace(/\s+/g, ' ');

  // ===== RENDER =====
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* ===== HEADER ===== */}
      {showHeader && <Header />}

      {/* ===== MAIN CONTENT ===== */}
      <main className={mainClasses}>
        <div className={containerClasses}>
          {children}
        </div>
      </main>

      {/* ===== FOOTER ===== */}
      {showFooter && <Footer />}
    </div>
  );
}

/**
 * ============================================
 * FOOTER COMPONENT
 * ============================================
 * 
 * App footer with links and information
 */
function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* ===== BRAND SECTION ===== */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              {/* Health Icon */}
              <svg
                className="w-8 h-8 text-primary-600"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
              <span className="text-xl font-bold text-gray-900">
                Health Metrics
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Track your wellness journey with precision. Monitor your health metrics,
              set goals, and achieve your fitness targets.
            </p>
            <p className="text-xs text-gray-500">
              © {currentYear} Health Metrics. All rights reserved.
            </p>
          </div>

          {/* ===== PRODUCT LINKS ===== */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Product
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/features"
                  className="text-sm text-gray-600 hover:text-primary-600 transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  to="/pricing"
                  className="text-sm text-gray-600 hover:text-primary-600 transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  to="/integrations"
                  className="text-sm text-gray-600 hover:text-primary-600 transition-colors"
                >
                  Integrations
                </Link>
              </li>
              <li>
                <Link
                  to="/changelog"
                  className="text-sm text-gray-600 hover:text-primary-600 transition-colors"
                >
                  Changelog
                </Link>
              </li>
            </ul>
          </div>

          {/* ===== SUPPORT LINKS ===== */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Support
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/help"
                  className="text-sm text-gray-600 hover:text-primary-600 transition-colors"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-sm text-gray-600 hover:text-primary-600 transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-sm text-gray-600 hover:text-primary-600 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-sm text-gray-600 hover:text-primary-600 transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* ===== SOCIAL LINKS & DIVIDER ===== */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Social Media Links */}
            <div className="flex items-center gap-4">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary-600 transition-colors"
                aria-label="Twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>

              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary-600 transition-colors"
                aria-label="GitHub"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
              </a>

              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary-600 transition-colors"
                aria-label="LinkedIn"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
            </div>

            {/* Made with love text */}
            <p className="text-sm text-gray-500">
              Made with <span className="text-red-500">❤</span> for your health
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Layout;
