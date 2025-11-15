/**
 * ============================================
 * CONNECTION STATUS BANNER
 * ============================================
 *
 * Purpose: Display connection status with user-friendly messages
 *
 * Features:
 * - Color-coded status indicators
 * - User-friendly error messages
 * - Retry count display
 * - Auto-hide when connected
 * - Manual retry button
 * - Slide-in/out animations
 */

import { useConnectionStatus } from '../../hooks/useRealtimeEvents';
import Button from './Button';

const ConnectionStatusBanner = () => {
  const { connectionStatus } = useConnectionStatus();

  // Determine if banner should be visible based on connection state
  const shouldShowBanner = () => {
    if (connectionStatus.state === 'not_initialized') return false;
    if (connectionStatus.state === 'connected') return false; // Will be hidden by timeout
    return true;
  };

  const handleRetry = () => {
    // Trigger manual reconnection via AuthContext or directly
    window.location.reload();
  };  const getStatusConfig = () => {
    switch (connectionStatus.state) {
      case 'connecting':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-900',
          icon: '🔄',
          title: 'Connecting...',
          message: 'Establishing real-time connection',
          showRetry: false,
        };

      case 'connected':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-900',
          icon: '✓',
          title: 'Connected',
          message: 'Real-time updates active',
          showRetry: false,
        };

      case 'disconnected':
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-900',
          icon: '✕',
          title: 'Connection Lost',
          message: connectionStatus.error || 'Unable to connect to server',
          showRetry: true,
        };

      case 'reconnecting':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-900',
          icon: '🔄',
          title: 'Reconnecting...',
          message: connectionStatus.error
            ? `${connectionStatus.error} (Attempt ${connectionStatus.retryCount}/${connectionStatus.maxRetries})`
            : `Retrying... (${connectionStatus.retryCount}/${connectionStatus.maxRetries})`,
          showRetry: false,
        };

      case 'max_retries_exceeded':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-900',
          icon: '⚠',
          title: 'Connection Failed',
          message: connectionStatus.error || 'Unable to establish connection after multiple attempts',
          showRetry: true,
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
    <div className="fixed top-0 left-0 right-0 z-40 animate-slideDown">
      <div className={`${config.bg} ${config.border} ${config.text} border-b-2`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            {/* Status Message */}
            <div className="flex items-center space-x-3">
              <span className="text-2xl" role="img" aria-label="Status">
                {config.icon}
              </span>
              <div>
                <p className="font-semibold">{config.title}</p>
                <p className="text-sm opacity-75">{config.message}</p>
              </div>
            </div>

            {/* Retry Button */}
            {config.showRetry && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRetry}
              >
                Retry Connection
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionStatusBanner;