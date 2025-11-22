/**
 * ============================================
 * CONNECTION STATUS BANNER (ENHANCED)
 * ============================================
 *
 * Premium connection status indicator with Modern Glassmorphism
 *
 * Features:
 * - Glassmorphism with backdrop blur
 * - Animated status transitions
 * - Pulsing indicators for active states
 * - Gradient backgrounds
 * - Smooth slide animations
 * - Enhanced visual feedback
 * - Auto-hide when connected
 * - Industry-standard code structure
 */

import { useConnectionStatus } from '../../hooks/useRealtimeEvents';
import Button from './Button';

const ConnectionStatusBanner = () => {
  const { connectionStatus } = useConnectionStatus();

  // Determine if banner should be visible
  const shouldShowBanner = () => {
    if (connectionStatus.state === 'not_initialized') return false;
    if (connectionStatus.state === 'connected') return false;
    return true;
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const getStatusConfig = () => {
    switch (connectionStatus.state) {
      case 'connecting':
        return {
          bg: 'bg-gradient-to-r from-blue-50/95 via-indigo-50/95 to-blue-50/95',
          border: 'border-blue-300/40',
          text: 'text-blue-900',
          icon: (
            <div className="relative">
              <div className="absolute inset-0 bg-blue-400 rounded-full blur opacity-30 animate-pulse"></div>
              <svg className="w-5 h-5 animate-spin relative z-10" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ),
          title: 'Connecting',
          message: 'Establishing real-time connection...',
          showRetry: false,
          pulse: true,
        };

      case 'connected':
        return {
          bg: 'bg-gradient-to-r from-green-50/95 via-emerald-50/95 to-green-50/95',
          border: 'border-green-300/40',
          text: 'text-green-900',
          icon: (
            <div className="relative">
              <div className="absolute inset-0 bg-green-400 rounded-full blur opacity-20 animate-pulse"></div>
              <svg className="w-5 h-5 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          ),
          title: 'Connected',
          message: 'Real-time updates active',
          showRetry: false,
          pulse: false,
        };

      case 'disconnected':
      case 'error':
        return {
          bg: 'bg-gradient-to-r from-red-50/95 via-rose-50/95 to-red-50/95',
          border: 'border-red-300/40',
          text: 'text-red-900',
          icon: (
            <div className="relative">
              <div className="absolute inset-0 bg-red-400 rounded-full blur opacity-20"></div>
              <svg className="w-5 h-5 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          ),
          title: 'Connection Lost',
          message: connectionStatus.error || 'Unable to connect to server',
          showRetry: true,
          pulse: false,
        };

      case 'reconnecting':
        return {
          bg: 'bg-gradient-to-r from-amber-50/95 via-yellow-50/95 to-amber-50/95',
          border: 'border-amber-300/40',
          text: 'text-amber-900',
          icon: (
            <div className="relative">
              <div className="absolute inset-0 bg-amber-400 rounded-full blur opacity-30 animate-pulse"></div>
              <svg className="w-5 h-5 animate-spin relative z-10" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ),
          title: 'Reconnecting',
          message: connectionStatus.error
            ? `${connectionStatus.error} (Attempt ${connectionStatus.retryCount}/${connectionStatus.maxRetries})`
            : `Retrying connection (${connectionStatus.retryCount}/${connectionStatus.maxRetries})`,
          showRetry: false,
          pulse: true,
        };

      case 'max_retries_exceeded':
        return {
          bg: 'bg-gradient-to-r from-red-50/95 via-rose-50/95 to-red-50/95',
          border: 'border-red-300/40',
          text: 'text-red-900',
          icon: (
            <div className="relative">
              <div className="absolute inset-0 bg-red-400 rounded-full blur opacity-20 animate-pulse"></div>
              <svg className="w-5 h-5 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          ),
          title: 'Connection Failed',
          message: connectionStatus.error || 'Unable to establish connection after multiple attempts',
          showRetry: true,
          pulse: false,
        };

      default:
        return null;
    }
  };

  const config = getStatusConfig();

  if (!shouldShowBanner() || !config) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-slideDown">
      <div
        className={`
          ${config.bg} 
          ${config.border} 
          ${config.text}
          backdrop-blur-md
          border-b-2
          shadow-lg
          ${config.pulse ? 'animate-pulse-highlight' : ''}
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Status Message */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Icon */}
              <div className="flex-shrink-0">
                {config.icon}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm tracking-wide">
                  {config.title}
                </p>
                <p className="text-xs opacity-80 truncate">
                  {config.message}
                </p>
              </div>
            </div>

            {/* Retry Button */}
            {config.showRetry && (
              <div className="flex-shrink-0">
                <Button
                  variant="secondary"
                  size="small"
                  onClick={handleRetry}
                  className="shadow-md hover:shadow-lg"
                >
                  Retry
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar for Reconnecting State */}
        {connectionStatus.state === 'reconnecting' && (
          <div className="absolute bottom-0 left-0 w-full h-1 bg-black/5">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-yellow-400 animate-pulse"
              style={{
                width: `${(connectionStatus.retryCount / connectionStatus.maxRetries) * 100}%`,
                transition: 'width 0.3s ease-out'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatusBanner;