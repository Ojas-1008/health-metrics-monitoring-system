import { Link } from 'react-router-dom';
import Header from './Header';

/**
 * ============================================
 * LAYOUT COMPONENT (ENHANCED)
 * ============================================
 * 
 * Premium layout with Modern Glassmorphism and Animations
 * 
 * Features:
 * - Glassmorphism effects throughout
 * - Animated background with floating shapes
 * - Enhanced footer with gradient elements
 * - Smooth transitions and animations
 * - Responsive design with modern aesthetics
 * - Consistent page structure
 */

/**
 * Layout Component
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Page content
 * @param {boolean} [props.showHeader=true] - Show header
 * @param {boolean} [props.showFooter=true] - Show footer
 * @param {string} [props.className] - Additional CSS classes
 * @param {string} [props.maxWidth='max-w-7xl'] - Max width constraint
 * @param {string} [props.bgColor] - Background color (override)
 */
function Layout({
  children,
  showHeader = true,
  showFooter = true,
  className = '',
  maxWidth = 'max-w-7xl',
  bgColor = null,
}) {
  const mainClasses = `
    flex-1
    relative
    ${bgColor || 'bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30'}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const containerClasses = `
    ${maxWidth}
    mx-auto
    px-4
    sm:px-6
    lg:px-8
    py-8
    relative
    z-10
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        {/* Floating Gradient Orbs */}
        <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-float"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-float" style={{ animationDelay: '2s', animationDuration: '4s' }}></div>
        <div className="absolute top-[40%] right-[30%] w-64 h-64 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-float" style={{ animationDelay: '4s', animationDuration: '5s' }}></div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `
            linear-gradient(to right, rgb(59 130 246) 1px, transparent 1px),
            linear-gradient(to bottom, rgb(59 130 246) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Header */}
      {showHeader && <Header />}

      {/* Main Content */}
      <main className={mainClasses}>
        <div className={containerClasses}>
          {children}
        </div>
      </main>

      {/* Footer */}
      {showFooter && <Footer />}
    </div>
  );
}

/**
 * ============================================
 * FOOTER COMPONENT (ENHANCED)
 * ============================================
 * 
 * Premium footer with glassmorphism and animations
 */
function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-white/80 backdrop-blur-xl border-t border-gray-200/50 mt-auto">
      {/* Subtle Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30 pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4 group">
              {/* Animated Health Icon */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <div className="relative w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                  </svg>
                </div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Health Metrics
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed max-w-md">
              Track your wellness journey with precision. Monitor your health metrics,
              set goals, and achieve your fitness targets with our comprehensive platform.
            </p>
            <p className="text-xs text-gray-500 font-medium">
              © {currentYear} Health Metrics. All rights reserved.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-4 tracking-wide">
              Product
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/features"
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors hover:translate-x-1 inline-block duration-200 font-medium"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  to="/pricing"
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors hover:translate-x-1 inline-block duration-200 font-medium"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  to="/integrations"
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors hover:translate-x-1 inline-block duration-200 font-medium"
                >
                  Integrations
                </Link>
              </li>
              <li>
                <Link
                  to="/changelog"
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors hover:translate-x-1 inline-block duration-200 font-medium"
                >
                  Changelog
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-4 tracking-wide">
              Support
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/help"
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors hover:translate-x-1 inline-block duration-200 font-medium"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors hover:translate-x-1 inline-block duration-200 font-medium"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors hover:translate-x-1 inline-block duration-200 font-medium"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors hover:translate-x-1 inline-block duration-200 font-medium"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Links & Bottom Bar */}
        <div className="mt-10 pt-8 border-t border-gray-200/50">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            {/* Social Media Links */}
            <div className="flex items-center gap-4">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative"
                aria-label="Twitter"
              >
                <div className="absolute inset-0 bg-blue-400 rounded-lg blur opacity-0 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 text-gray-400 hover:bg-blue-500 hover:text-white transition-all duration-300 transform hover:scale-110">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </div>
              </a>

              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative"
                aria-label="GitHub"
              >
                <div className="absolute inset-0 bg-gray-600 rounded-lg blur opacity-0 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 text-gray-400 hover:bg-gray-800 hover:text-white transition-all duration-300 transform hover:scale-110">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                </div>
              </a>

              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative"
                aria-label="LinkedIn"
              >
                <div className="absolute inset-0 bg-blue-600 rounded-lg blur opacity-0 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 text-gray-400 hover:bg-blue-600 hover:text-white transition-all duration-300 transform hover:scale-110">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </div>
              </a>
            </div>

            {/* Made with love */}
            <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
              <span>Made with</span>
              <span className="text-red-500 animate-pulse text-lg">❤</span>
              <span>for your health</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Layout;
