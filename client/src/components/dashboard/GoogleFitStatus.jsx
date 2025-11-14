/**
 * ============================================
 * GOOGLE FIT CONNECTION STATUS COMPONENT
 * ============================================
 *
 * Purpose: Display Google Fit connection status and last sync time
 *
 * Features:
 * - Connection status indicator (Connected/Disconnected)
 * - Last sync timestamp (relative time)
 * - Manual sync trigger button
 * - Sync in progress indicator
 * - Error handling
 * - Real-time updates via SSE
 *
 * Props:
 * - googleFitStatus: Google Fit connection data from API
 * - lastSyncAt: Last sync timestamp (from sync:update event)
 * - onSyncClick: Callback when manual sync is triggered
 * - isSyncing: Boolean indicating if sync is in progress
 */

import { useMemo } from 'react';
import PropTypes from 'prop-types';
import Button from '../common/Button';
import * as dateUtils from '../../utils/dateUtils';

const GoogleFitStatus = ({
  googleFitStatus = null,
  lastSyncAt = null,
  onSyncClick = null,
  isSyncing = false,
}) => {
  // Determine connection status
  const isConnected = googleFitStatus?.connected || false;

  // Calculate relative time for last sync
  const lastSyncText = useMemo(() => {
    if (!lastSyncAt) return 'Never';

    const syncDate = new Date(lastSyncAt);
    const now = new Date();
    const diffMs = now - syncDate;
    const diffMinutes = Math.floor(diffMs / 1000 / 60);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return dateUtils.formatDateShort(lastSyncAt);
  }, [lastSyncAt]);

  if (!googleFitStatus) {
    return null; // Don't show if status not loaded
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        {/* Connection Status */}
        <div className="flex items-center space-x-3">
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center
            ${isConnected ? 'bg-green-100' : 'bg-gray-100'}
          `}>
            <svg
              className={`w-6 h-6 ${isConnected ? 'text-green-600' : 'text-gray-400'}`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-gray-900">
                Google Fit
              </h3>
              <span className={`
                px-2 py-0.5 text-xs font-medium rounded-full
                ${isConnected
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
                }
              `}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {isConnected && (
              <div className="flex items-center space-x-2 mt-1">
                <p className="text-xs text-gray-500">
                  Last synced:
                </p>
                <p className="text-xs font-medium text-gray-700">
                  {isSyncing ? (
                    <span className="flex items-center space-x-1">
                      <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Syncing...</span>
                    </span>
                  ) : (
                    lastSyncText
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sync Button */}
        {isConnected && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onSyncClick}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Syncing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sync Now
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

GoogleFitStatus.propTypes = {
  googleFitStatus: PropTypes.shape({
    connected: PropTypes.bool,
    lastSyncAt: PropTypes.string,
  }),
  lastSyncAt: PropTypes.string,
  onSyncClick: PropTypes.func,
  isSyncing: PropTypes.bool,
};

export default GoogleFitStatus;