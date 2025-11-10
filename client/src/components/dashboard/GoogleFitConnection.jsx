/**
 * ============================================
 * GOOGLE FIT CONNECTION COMPONENT
 * ============================================
 *
 * Purpose: Manage Google Fit OAuth connection from dashboard
 *
 * Features:
 * - Connect/Disconnect Google Fit
 * - Display connection status
 * - Show last sync timestamp
 * - Feature flag controlled
 * - Auto-refresh status after OAuth
 *
 * Integration:
 * - Uses googleFitService for API calls
 * - Uses dateUtils for relative time formatting
 * - Matches existing dashboard component styles
 */

import { useState, useEffect } from 'react';
import * as googleFitService from '../../services/googleFitService';
import { getRelativeTimeAgo } from '../../utils/dateUtils';

/**
 * ============================================
 * GOOGLE FIT CONNECTION COMPONENT
 * ============================================
 */
const GoogleFitConnection = () => {
  // ===== FEATURE FLAG CHECK =====
  const isEnabled = import.meta.env.VITE_ENABLE_GOOGLE_FIT === 'true';

  // ===== STATE MANAGEMENT =====
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

  // ===== FETCH CONNECTION STATUS =====
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

  // ===== INITIAL LOAD =====
  useEffect(() => {
    if (isEnabled) {
      fetchStatus();
    } else {
      setLoading(false);
    }
  }, [isEnabled]);

  // ⚠️ Don't render if feature is disabled
  if (!isEnabled) {
    return null;
  }

  // ===== HANDLE CONNECT =====
  const handleConnect = async () => {
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Get OAuth URL from backend
      const authUrl = await googleFitService.initiateConnect();

      // Open OAuth window
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const oauthWindow = window.open(
        authUrl,
        'GoogleFitOAuth',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
      );

      // ⭐ POLL FOR WINDOW CLOSE (to detect OAuth completion)
      const pollTimer = setInterval(() => {
        if (oauthWindow && oauthWindow.closed) {
          clearInterval(pollTimer);

          // Give backend time to process callback
          setTimeout(async () => {
            await fetchStatus();
            setSuccess('Google Fit connected successfully! 🎉');
          }, 2000);
        }
      }, 500);

      // Clean up after 5 minutes
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

  // ===== HANDLE DISCONNECT =====
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

      // Refresh status
      await fetchStatus();
    } catch (err) {
      console.error('Error disconnecting Google Fit:', err);
      setError(err.message || 'Failed to disconnect Google Fit');
    } finally {
      setActionLoading(false);
    }
  };

  // ===== HANDLE REFRESH STATUS =====
  const handleRefresh = async () => {
    setError(null);
    setSuccess(null);
    await fetchStatus();
  };

  // ===== RENDER LOADING STATE =====
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  // ===== RENDER MAIN UI =====
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center text-white text-2xl">
            📊
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              Google Fit Integration
            </h3>
            <p className="text-sm text-gray-600">
              Automatic health data sync
            </p>
          </div>
        </div>

        {/* ===== REFRESH BUTTON ===== */}
        <button
          onClick={handleRefresh}
          disabled={actionLoading}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
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
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* ===== ERROR ALERT ===== */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-start gap-2">
          <svg
            className="w-5 h-5 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* ===== SUCCESS ALERT ===== */}
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-start gap-2">
          <svg
            className="w-5 h-5 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm">{success}</span>
        </div>
      )}

      {/* ===== CONNECTION STATUS ===== */}
      <div className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                connectionStatus.connected && connectionStatus.isActive
                  ? 'bg-green-500 animate-pulse'
                  : 'bg-gray-300'
              }`}
            ></div>
            <div>
              <p className="font-semibold text-gray-800">
                {connectionStatus.connected && connectionStatus.isActive
                  ? '✅ Connected'
                  : connectionStatus.connected
                  ? '⚠️ Connection Expired'
                  : '❌ Not Connected'}
              </p>
              {connectionStatus.connected &&
                connectionStatus.isActive &&
                connectionStatus.lastSync && (
                  <p className="text-sm text-gray-600">
                    Last synced:{' '}
                    {getRelativeTimeAgo(connectionStatus.lastSync)}
                  </p>
                )}
              {connectionStatus.connected &&
                !connectionStatus.isActive && (
                  <p className="text-sm text-red-600">
                    Please reconnect to continue syncing
                  </p>
                )}
            </div>
          </div>

          {/* Connection Badge */}
          {connectionStatus.connected && connectionStatus.daysUntilExpiry && (
            <div className="text-right">
              <p className="text-xs text-gray-500">Expires in</p>
              <p className="text-sm font-semibold text-gray-700">
                {connectionStatus.daysUntilExpiry} days
              </p>
            </div>
          )}
        </div>

        {/* Info Text */}
        {!connectionStatus.connected && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">
              📱 Why Connect Google Fit?
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>✓ Automatic daily health data sync</li>
              <li>✓ Track steps, calories, distance, sleep</li>
              <li>✓ No manual entry required</li>
              <li>✓ Secure OAuth 2.0 authentication</li>
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!connectionStatus.connected ||
          !connectionStatus.isActive ? (
            <button
              onClick={handleConnect}
              disabled={actionLoading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-lg hover:from-red-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Connecting...
                </span>
              ) : (
                <>🔗 Connect Google Fit</>
              )}
            </button>
          ) : (
            <>
              <button
                onClick={handleRefresh}
                disabled={actionLoading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                🔄 Sync Now
              </button>
              <button
                onClick={handleDisconnect}
                disabled={actionLoading}
                className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                🔌 Disconnect
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleFitConnection;