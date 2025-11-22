/**
 * ============================================
 * GOOGLE FIT CONNECTION COMPONENT (ENHANCED)
 * ============================================
 *
 * Premium connection manager with Modern Glassmorphism
 *
 * Features:
 * - Glassmorphism design with gradients
 * - Animated connection states
 * - Enhanced OAuth flow with visual feedback
 * - Beautiful status indicators
 * - Secure connection management
 * - Feature flag controlled
 */

import { useState, useEffect } from 'react';
import * as googleFitService from '../../services/googleFitService';
import { getRelativeTimeAgo } from '../../utils/dateUtils';

const GoogleFitConnection = () => {
  // Feature flag check
  const isEnabled = import.meta.env.VITE_ENABLE_GOOGLE_FIT === 'true';

  // State management
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    isActive: false,
    lastSync: null,
    daysUntilExpiry: null,
  });

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch connection status
  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const status = await googleFitService.getConnectionStatus();
      setConnectionStatus(status);
    } catch (err) {
      console.error('Error fetching Google Fit status:', err);
      setError(err.message || 'Failed to fetch connection status');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (isEnabled) {
      fetchStatus();
    } else {
      setLoading(false);
    }
  }, [isEnabled]);

  // Don't render if feature disabled
  if (!isEnabled) {
    return null;
  }

  // Handle connect
  const handleConnect = async () => {
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const authUrl = await googleFitService.initiateConnect();

      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const oauthWindow = window.open(
        authUrl,
        'GoogleFitOAuth',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
      );

      const pollTimer = setInterval(() => {
        if (oauthWindow && oauthWindow.closed) {
          clearInterval(pollTimer);
          setTimeout(async () => {
            await fetchStatus();
            setSuccess('Google Fit connected successfully! 🎉');
          }, 2000);
        }
      }, 500);

      setTimeout(() => {
        clearInterval(pollTimer);
      }, 5 * 60 * 1000);
    } catch (err) {
      console.error('Error connecting Google Fit:', err);
      setError(err.message || 'Failed to connect Google Fit');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle disconnect
  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect Google Fit?')) {
      return;
    }

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await googleFitService.disconnectGoogleFit();
      setSuccess('Google Fit disconnected successfully');
      await fetchStatus();
    } catch (err) {
      console.error('Error disconnecting Google Fit:', err);
      setError(err.message || 'Failed to disconnect Google Fit');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setError(null);
    setSuccess(null);
    await fetchStatus();
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-white/90 to-red-50/90 backdrop-blur-md rounded-2xl shadow-xl border-2 border-gray-300/40 p-8 animate-pulse">
        <div className="h-8 bg-gray-300 rounded-lg w-1/3 mb-6"></div>
        <div className="h-6 bg-gray-300 rounded-lg w-2/3"></div>
      </div>
    );
  }

  // Main UI
  return (
    <div className="relative bg-gradient-to-br from-white/90 to-red-50/90 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-gray-300/40 p-8 overflow-hidden">
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 pointer-events-none"></div>

      {/* Header */}
      <div className="relative flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* Animated Icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-400 rounded-xl blur opacity-40"></div>
            <div className="relative w-14 h-14 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-110 hover:rotate-3 transition-all duration-300">
              <span className="text-3xl">🏃</span>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-extrabold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
              Google Fit Integration
            </h3>
            <p className="text-sm text-gray-700 font-medium">
              Automatic health data sync
            </p>
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={actionLoading}
          className="p-3 text-gray-600 hover:text-gray-900 bg-white/80 backdrop-blur-sm hover:bg-white rounded-xl transition-all duration-300 disabled:opacity-50 shadow-md hover:shadow-lg transform hover:scale-110"
          title="Refresh status"
        >
          <svg
            className={`w-5 h-5 ${actionLoading ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="relative mb-6 p-4 bg-gradient-to-br from-red-50/90 to-rose-50/90 backdrop-blur-sm border-2 border-red-300/40 rounded-xl shadow-lg flex items-start gap-3 animate-slideDown">
          <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-semibold text-red-800">{error}</span>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="relative mb-6 p-4 bg-gradient-to-br from-green-50/90 to-emerald-50/90 backdrop-blur-sm border-2 border-green-300/40 rounded-xl shadow-lg flex items-start gap-3 animate-slideDown">
          <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-semibold text-green-800">{success}</span>
        </div>
      )}

      {/* Connection Status */}
      <div className="relative space-y-6">
        {/* Status Badge */}
        <div className={`
          p-6 rounded-xl border-2 backdrop-blur-sm
          ${connectionStatus.connected && connectionStatus.isActive
            ? 'bg-gradient-to-br from-green-50/90 to-emerald-50/90 border-green-300/40'
            : connectionStatus.connected
              ? 'bg-gradient-to-br from-yellow-50/90 to-orange-50/90 border-yellow-300/40'
              : 'bg-gradient-to-br from-gray-50/90 to-slate-50/90 border-gray-300/40'
          }
          shadow-lg
        `}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {/* Status Indicator */}
              <div className="relative">
                {connectionStatus.connected && connectionStatus.isActive && (
                  <div className="absolute inset-0 bg-green-400 rounded-full blur opacity-60 animate-pulse"></div>
                )}
                <div className={`
                  relative w-4 h-4 rounded-full
                  ${connectionStatus.connected && connectionStatus.isActive
                    ? 'bg-green-500 animate-pulse'
                    : 'bg-gray-400'
                  }
                `}></div>
              </div>

              <div>
                <p className="font-bold text-lg text-gray-900 mb-1">
                  {connectionStatus.connected && connectionStatus.isActive
                    ? '✅ Connected'
                    : connectionStatus.connected
                      ? '⚠️ Connection Expired'
                      : '❌ Not Connected'}
                </p>
                {connectionStatus.connected && connectionStatus.isActive && connectionStatus.lastSync && (
                  <p className="text-sm text-gray-700 font-medium">
                    Last synced: <span className="text-green-600 font-bold">{getRelativeTimeAgo(connectionStatus.lastSync)}</span>
                  </p>
                )}
                {connectionStatus.connected && !connectionStatus.isActive && (
                  <p className="text-sm text-red-600 font-semibold">
                    Please reconnect to continue syncing
                  </p>
                )}
              </div>
            </div>

            {/* Expiry Badge */}
            {connectionStatus.connected && connectionStatus.daysUntilExpiry && (
              <div className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-md">
                <p className="text-xs text-gray-600 font-semibold">Expires in</p>
                <p className="text-lg font-bold text-gray-900">{connectionStatus.daysUntilExpiry} days</p>
              </div>
            )}
          </div>
        </div>

        {/* Info Card */}
        {!connectionStatus.connected && (
          <div className="p-6 bg-gradient-to-br from-blue-50/90 to-indigo-50/90 backdrop-blur-sm border-2 border-blue-300/40 rounded-xl shadow-lg">
            <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
              <span className="text-xl">📱</span>
              Why Connect Google Fit?
            </h4>
            <ul className="text-sm text-blue-800 space-y-2 font-medium">
              <li className="flex items-center gap-2">
                <span className="text-green-500 font-bold">✓</span>
                Automatic daily health data sync
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500 font-bold">✓</span>
                Track steps, calories, distance, sleep
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500 font-bold">✓</span>
                No manual entry required
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500 font-bold">✓</span>
                Secure OAuth 2.0 authentication
              </li>
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          {!connectionStatus.connected || !connectionStatus.isActive ? (
            <button
              onClick={handleConnect}
              disabled={actionLoading}
              className="flex-1 px-8 py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
            >
              {actionLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting...
                </span>
              ) : (
                '🔗 Connect Google Fit'
              )}
            </button>
          ) : (
            <>
              <button
                onClick={handleRefresh}
                disabled={actionLoading}
                className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-xl hover:shadow-2xl disabled:opacity-50 transform hover:scale-105"
              >
                🔄 Sync Now
              </button>
              <button
                onClick={handleDisconnect}
                disabled={actionLoading}
                className="px-8 py-4 bg-white/80 backdrop-blur-sm border-2 border-gray-300 text-gray-800 font-bold rounded-xl hover:bg-gray-100 hover:border-gray-400 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 transform hover:scale-105"
              >
                🔌 Disconnect
              </button>
            </>
          )}
        </div>
      </div>

      {/* Bottom Accent Line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 opacity-50"></div>
    </div>
  );
};

export default GoogleFitConnection;