/**
 * ============================================
 * HEADER COMPONENT (ENHANCED)
 * ============================================
 * 
 * Premium navigation header with Modern Glassmorphism
 * 
 * Features:
 * - Glassmorphism with backdrop blur
 * - Smooth scroll-based transparency
 * - Animated logo with gradient
 * - Enhanced user menu with animations
 * - Premium mobile menu with slide animation
 * - Active route highlighting with glow
 * - Responsive design with modern aesthetics
 */

import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';

/**
 * Get user initials from name
 */
const getInitials = (name) => {
  if (!name) return 'U';

  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Header Component
 */
function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // ===== STATE MANAGEMENT =====

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef(null);

  // ===== SCROLL EFFECT =====

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ===== CLOSE MENUS ON ROUTE CHANGE =====

  useEffect(() => {
    queueMicrotask(() => {
      setMobileMenuOpen(false);
      setUserMenuOpen(false);
    });
  }, [location.pathname]);

  // ===== CLOSE USER MENU ON CLICK OUTSIDE =====

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  // ===== EVENT HANDLERS =====

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    navigate('/login');
  };

  // ===== HELPER FUNCTIONS =====

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const getNavLinkClasses = (path) => {
    const baseClasses = 'relative px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105';
    const activeClasses = 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30';
    const inactiveClasses = 'text-gray-700 hover:bg-white/50 hover:backdrop-blur-sm hover:shadow-md';

    return `${baseClasses} ${isActiveRoute(path) ? activeClasses : inactiveClasses}`;
  };

  const getMobileNavLinkClasses = (path) => {
    const baseClasses = 'block px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300';
    const activeClasses = 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg';
    const inactiveClasses = 'text-gray-700 hover:bg-white/70 hover:backdrop-blur-sm';

    return `${baseClasses} ${isActiveRoute(path) ? activeClasses : inactiveClasses}`;
  };

  // ===== RENDER =====

  return (
    <header
      className={`
        sticky top-0 z-50 
        transition-all duration-500 ease-out
        ${scrolled
          ? 'bg-white/80 backdrop-blur-xl shadow-xl border-b border-white/20'
          : 'bg-white/95 backdrop-blur-lg shadow-md'
        }
      `}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* ===== LOGO / BRAND ===== */}
          <div className="flex items-center">
            <Link
              to="/"
              className="flex items-center gap-3 group"
            >
              {/* Animated Health Icon */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-xl blur opacity-40 group-hover:opacity-70 transition-opacity"></div>
                <div className="relative w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                  </svg>
                </div>
              </div>

              {/* Brand Name */}
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hidden sm:block group-hover:from-blue-700 group-hover:to-indigo-700 transition-all">
                  Health Metrics
                </span>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent sm:hidden">
                  HM
                </span>
              </div>
            </Link>
          </div>

          {/* ===== DESKTOP NAVIGATION ===== */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Navigation Links */}
            <div className="flex items-center space-x-2">
              <Link to="/" className={getNavLinkClasses('/')}>
                Home
              </Link>

              {isAuthenticated && (
                <Link to="/dashboard" className={getNavLinkClasses('/dashboard')}>
                  Dashboard
                </Link>
              )}
            </div>

            {/* ===== AUTHENTICATED USER MENU ===== */}
            {isAuthenticated && user ? (
              <div className="relative ml-4" ref={userMenuRef}>
                {/* User Menu Button */}
                <button
                  onClick={toggleUserMenu}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-xl
                    hover:bg-white/50 hover:backdrop-blur-sm
                    transition-all duration-300
                    focus:outline-none focus:ring-2 focus:ring-blue-500/50
                    ${userMenuOpen ? 'bg-white/70 backdrop-blur-sm shadow-md' : ''}
                  `}
                  aria-label="User menu"
                  aria-expanded={userMenuOpen}
                >
                  {/* User Avatar */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-lg transform hover:scale-110 transition-transform">
                      {user.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          alt={user.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        getInitials(user.name)
                      )}
                    </div>
                  </div>

                  {/* User Name */}
                  <span className="text-sm font-semibold text-gray-700 hidden lg:block">
                    {user.name}
                  </span>

                  {/* Dropdown Arrow */}
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${userMenuOpen ? 'rotate-180' : ''
                      }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl py-2 border border-gray-200/50 animate-slideDown overflow-hidden">
                    {/* User Info */}
                    <div className="px-4 py-4 border-b border-gray-200/50 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-600 truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <Link
                        to="/dashboard"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Dashboard
                      </Link>

                      <Link
                        to="/profile"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile
                      </Link>

                      <Link
                        to="/settings"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                      </Link>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-200/50 pt-2 pb-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ===== GUEST USER BUTTONS ===== */
              <div className="flex items-center gap-3 ml-4">
                <Link to="/login">
                  <Button variant="outline" size="small">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="small">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* ===== MOBILE MENU BUTTON ===== */}
          <div className="flex md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-xl text-gray-700 hover:bg-white/50 hover:backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              aria-label="Toggle mobile menu"
              aria-expanded={mobileMenuOpen}
            >
              <div className="relative w-6 h-6">
                <span className={`absolute h-0.5 w-6 bg-current transform transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 top-3' : 'top-1'}`}></span>
                <span className={`absolute h-0.5 w-6 bg-current top-3 transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                <span className={`absolute h-0.5 w-6 bg-current transform transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 top-3' : 'top-5'}`}></span>
              </div>
            </button>
          </div>
        </div>

        {/* ===== MOBILE MENU ===== */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200/50 py-4 animate-slideDown bg-white/50 backdrop-blur-lg rounded-b-2xl -mx-4 px-4">
            {/* Navigation Links */}
            <div className="space-y-2">
              <Link to="/" className={getMobileNavLinkClasses('/')}>
                Home
              </Link>

              {isAuthenticated && (
                <Link to="/dashboard" className={getMobileNavLinkClasses('/dashboard')}>
                  Dashboard
                </Link>
              )}
            </div>

            {/* User Menu or Auth Buttons */}
            {isAuthenticated && user ? (
              <div className="mt-4 pt-4 border-t border-gray-200/50">
                {/* User Info */}
                <div className="flex items-center gap-4 px-4 py-3 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-xl mb-3">
                  <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-lg">
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={user.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      getInitials(user.name)
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-600">{user.email}</p>
                  </div>
                </div>

                {/* Mobile User Menu Links */}
                <div className="space-y-1">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-base font-semibold text-gray-700 hover:bg-white/70 hover:backdrop-blur-sm transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-base font-semibold text-gray-700 hover:bg-white/70 hover:backdrop-blur-sm transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-base font-semibold text-red-600 hover:bg-red-50 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 pt-4 border-t border-gray-200/50 space-y-3">
                <Link to="/login" className="block">
                  <Button variant="outline" fullWidth>
                    Login
                  </Button>
                </Link>
                <Link to="/register" className="block">
                  <Button variant="primary" fullWidth>
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}

export default Header;
