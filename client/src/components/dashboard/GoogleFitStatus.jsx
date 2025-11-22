/**
 * ============================================
 * GOOGLE FIT CONNECTION STATUS COMPONENT (ENHANCED)
 * ============================================
 *
 * Premium status display with Modern Glassmorphism
 *
 * Features:
 * - Glassmorphism design with gradients
 * - Animated connection indicators
 * - Pulsing sync animation
 * - Enhanced status badges
 * - Beautiful sync button with animations
 * - Real-time sync updates
 */

import { useMemo } from 'react';
import PropTypes from 'prop-types';
import Button from '../common/Button';
import * as dateUtils from '../../utils/dateUtils';

const GoogleFitStatus = ({
  googleFitStatus = null,
  lastSyncAt = null,
  onSyncClick = null,
  onConnectClick = null,
  isSyncing = false,
}) => {
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

  // Show loading state while fetching status
  if (!googleFitStatus) {
    return (
      <div className="relative bg-gradient-to-br from-gray-50/90 to-slate-50/90 backdrop-blur-md rounded-2xl shadow-xl border-2 border-gray-300/40 p-6 overflow-hidden">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gray-200 animate-pulse"></div>
            <div>
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`
      relative
      bg-gradient-to-br 
      ${isConnected
        ? 'from-green-50/90 to-emerald-50/90'
        : 'from-gray-50/90 to-slate-50/90'
      }
      backdrop-blur-md 
      rounded-2xl 
      shadow-xl 
      border-2 
      ${isConnected ? 'border-green-300/40' : 'border-gray-300/40'}
      p-6
      overflow-hidden
      transition-all duration-500
      hover:shadow-2xl
    `}>
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 pointer-events-none"></div>

      <div className="relative flex items-center justify-between gap-4 flex-wrap">
        {/* Connection Status */}
        <div className="flex items-center gap-4 flex-1">
          {/* Animated Icon Container */}
          <div className="relative flex-shrink-0">
            {/* Pulsing Glow */}
            {isConnected && (
              <div className={`absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full blur opacity-40 ${isSyncing ? 'animate-pulse' : ''}`}></div>
            )}

            {/* Icon */}
            <div className={`
              relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg
              transition-all duration-300
              ${isConnected
                ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                : 'bg-gradient-to-br from-gray-400 to-slate-400'
              }
            `}>
              {isConnected ? (
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
          </div>

          {/* Status Info */}
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="text-xl">🏃</span>
                Google Fit
              </h3>
              <span className={`
                px-3 py-1 text-xs font-bold rounded-full shadow-md
                ${isConnected
                  ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-white'
                  : 'bg-gradient-to-r from-gray-300 to-slate-300 text-gray-700'
                }
              `}>
                {isConnected ? '✓ Connected' : '✗ Disconnected'}
              </span>
            </div>

            {isConnected && (
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-600 font-semibold">
                  Last synced:
                </p>
                <p className={`text-xs font-bold ${isSyncing ? 'text-blue-600' : 'text-gray-800'}`}>
                  {isSyncing ? (
                    <span className="flex items-center gap-1.5 animate-pulse">
                      <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Syncing...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <span className="text-green-500">●</span>
                      {lastSyncText}
                    </span>
                  )}
                </p>
              </div>
            )}

            {!isConnected && (
              <p className="text-xs text-gray-600 font-medium mt-1">
                Connect to sync your fitness data automatically
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {isConnected ? (
          <Button
            variant="primary"
            size="small"
            onClick={onSyncClick}
            disabled={isSyncing}
            className="shadow-lg"
          >
            {isSyncing ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Syncing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sync Now
              </span>
            )}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="small"
            onClick={onConnectClick}
            className="shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Connect Google Fit
            </span>
          </Button>
        )}
      </div>

      {/* Info Section for Disconnected State */}
      {!isConnected && (
        <div className="relative mt-4 pt-4 border-t border-gray-300/40">
          <p className="text-sm text-gray-700 mb-2 font-medium">
            ✨ <strong>Why connect Google Fit?</strong>
          </p>
          <ul className="text-xs text-gray-600 space-y-1.5 ml-4">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">●</span>
              <span>Automatically sync your steps, distance, calories, and active minutes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">●</span>
              <span>Background sync every 15 minutes keeps your data up-to-date</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">●</span>
              <span>No manual entry needed - focus on your health, not data entry</span>
            </li>
          </ul>
        </div>
      )}

      {/* Bottom Accent Line */}
      <div className={`
        absolute bottom-0 left-0 right-0 h-1 opacity-50
        ${isConnected
          ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500'
          : 'bg-gradient-to-r from-gray-400 via-slate-400 to-gray-500'
        }
      `}></div>
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
  onConnectClick: PropTypes.func,
  isSyncing: PropTypes.bool,
};

export default GoogleFitStatus;