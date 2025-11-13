/**
 * ============================================
 * CUSTOM HOOK: useRealtimeEvents
 * ============================================
 *
 * Simplified hook for subscribing to Server-Sent Events (SSE)
 * in React components with automatic cleanup.
 *
 * Features:
 * - Automatic subscription on mount
 * - Automatic unsubscription on unmount
 * - Dependency array support for callback memoization
 * - Connection status tracking
 * - TypeScript-ready (JSDoc types provided)
 * - Prevents memory leaks with proper cleanup
 *
 * Usage Examples:
 *
 * // Basic usage - subscribe to metrics changes
 * const { isConnected } = useRealtimeEvents('metrics:change', (data) => {
 *   console.log('Metrics updated:', data);
 *   setMetrics(prevMetrics => [...prevMetrics, data]);
 * });
 *
 * // Multiple event subscriptions in one component
 * useRealtimeEvents('metrics:change', handleMetricsChange);
 * useRealtimeEvents('sync:update', handleSyncUpdate);
 * useRealtimeEvents('goals:updated', handleGoalsUpdate);
 *
 * // Conditional subscription
 * const shouldSubscribe = user?.preferences?.realtimeUpdates;
 * useRealtimeEvents(
 *   shouldSubscribe ? 'metrics:change' : null,
 *   handleMetricsChange
 * );
 */

import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * ============================================
 * HOOK: useRealtimeEvents
 * ============================================
 *
 * Subscribe to real-time SSE events with automatic cleanup
 *
 * @param {string|null} eventType - Event type to subscribe to (e.g., 'metrics:change', 'sync:update')
 *                                   Pass null to disable subscription
 * @param {Function|null} callback - Callback function invoked when event is received
 *                                   Pass null to disable subscription
 *
 * @returns {Object} Hook state
 * @returns {boolean} isConnected - Whether SSE connection is active
 * @returns {Object} connectionStatus - Full connection status object
 * @returns {Function} unsubscribe - Manual unsubscribe function (useful for conditional logic)
 *
 * @example
 * // Basic usage
 * const { isConnected } = useRealtimeEvents('metrics:change', (data) => {
 *   console.log('Received:', data);
 * });
 *
 * @example
 * // Conditional subscription
 * const { isConnected } = useRealtimeEvents(
 *   user?.isAdmin ? 'admin:events' : null,
 *   user?.isAdmin ? handleAdminEvent : null
 * );
 *
 * @example
 * // Manual unsubscribe
 * const { isConnected, unsubscribe } = useRealtimeEvents('metrics:change', callback);
 *
 * // Later, unsubscribe programmatically
 * if (someCondition) {
 *   unsubscribe();
 * }
 */
export const useRealtimeEvents = (
  eventType,
  callback
) => {
  // Get AuthContext methods and connection status
  const {
    addEventListener,
    removeEventListener,
    connectionStatus
  } = useAuth();

  // Store current subscription state
  const subscriptionRef = useRef(null);

  // Subscribe/unsubscribe effect
  useEffect(() => {
    // Skip if callback is null (conditional subscription)
    if (!callback) {
      if (subscriptionRef.current) {
        if (import.meta.env.DEV) {
          console.log(`[useRealtimeEvents] Unsubscribing from ${subscriptionRef.current.eventType} (callback disabled)`);
        }
        removeEventListener(subscriptionRef.current.eventType, subscriptionRef.current.callback);
        subscriptionRef.current = null;
      }
      return;
    }

    // Skip if eventType is null (conditional subscription)
    if (!eventType) {
      if (subscriptionRef.current) {
        if (import.meta.env.DEV) {
          console.log(`[useRealtimeEvents] Unsubscribing from ${subscriptionRef.current.eventType} (eventType disabled)`);
        }
        removeEventListener(subscriptionRef.current.eventType, subscriptionRef.current.callback);
        subscriptionRef.current = null;
      }
      return;
    }

    // Validate inputs (only when callback is provided)
    if (typeof eventType !== 'string') {
      console.error('[useRealtimeEvents] eventType must be a string, got:', typeof eventType);
      return;
    }

    if (callback && typeof callback !== 'function') {
      console.error('[useRealtimeEvents] callback must be a function or null, got:', typeof callback);
      return;
    }

    // If already subscribed to the same event, do nothing
    if (subscriptionRef.current?.eventType === eventType) {
      return;
    }

    // Unsubscribe from previous event if different
    if (subscriptionRef.current) {
      if (import.meta.env.DEV) {
        console.log(`[useRealtimeEvents] Unsubscribing from ${subscriptionRef.current.eventType}`);
      }
      removeEventListener(subscriptionRef.current.eventType, subscriptionRef.current.callback);
    }

    // Subscribe to new event
    if (import.meta.env.DEV) {
      console.log(`[useRealtimeEvents] Subscribing to ${eventType}`);
    }

    addEventListener(eventType, callback);
    subscriptionRef.current = { eventType, callback };

    // Cleanup function
    return () => {
      if (subscriptionRef.current) {
        if (import.meta.env.DEV) {
          console.log(`[useRealtimeEvents] Cleaning up subscription to ${subscriptionRef.current.eventType}`);
        }
        removeEventListener(subscriptionRef.current.eventType, subscriptionRef.current.callback);
        subscriptionRef.current = null;
      }
    };
  }, [eventType, callback, addEventListener, removeEventListener]);

  // Manual unsubscribe function
  const unsubscribe = useCallback(() => {
    if (subscriptionRef.current) {
      if (import.meta.env.DEV) {
        console.log(`[useRealtimeEvents] Manually unsubscribed from ${subscriptionRef.current.eventType}`);
      }
      removeEventListener(subscriptionRef.current.eventType, subscriptionRef.current.callback);
      subscriptionRef.current = null;
    }
  }, [removeEventListener]);

  // Return connection status and manual unsubscribe function
  return {
    isConnected: connectionStatus?.connected || false,
    connectionStatus,
    unsubscribe
  };
};/**
 * ============================================
 * HOOK: useRealtimeMetrics
 * ============================================
 *
 * Specialized hook for subscribing to metrics:change events
 * Convenience wrapper around useRealtimeEvents
 *
 * @param {Function|null} callback - Callback function for metrics changes (pass null to disable)
 *
 * @returns {Object} Hook state (same as useRealtimeEvents)
 *
 * @example
 * // Basic usage
 * const { isConnected } = useRealtimeMetrics((data) => {
 *   console.log('Metrics changed:', data);
 *   setMetrics(prevMetrics => [...prevMetrics, data]);
 * });
 *
 * @example
 * // Conditional subscription
 * const enabled = useState(true);
 * const { isConnected } = useRealtimeMetrics(
 *   enabled ? (data) => console.log('Event:', data) : null
 * );
 *
 * @example
 * // With useCallback for performance
 * const callback = useCallback((data) => {
 *   if (filter === 'steps') {
 *     console.log('Steps updated:', data.metrics.steps);
 *   }
 * }, [filter]);
 * const { isConnected } = useRealtimeMetrics(callback);
 */
export const useRealtimeMetrics = (callback) => {
  return useRealtimeEvents('metrics:change', callback);
};

/**
 * ============================================
 * HOOK: useRealtimeSync
 * ============================================
 *
 * Specialized hook for subscribing to sync:update events
 * Convenience wrapper around useRealtimeEvents
 *
 * @param {Function} callback - Callback function for sync updates
 *
 * @returns {Object} Hook state (same as useRealtimeEvents)
 *
 * @example
 * const { isConnected } = useRealtimeSync((data) => {
 *   console.log('Google Fit synced:', data.totalDays, 'days');
 *   showToast(`Synced ${data.totalDays} days from Google Fit`);
 *   refreshMetrics();
 * });
 */
export const useRealtimeSync = (callback) => {
  return useRealtimeEvents('sync:update', callback);
};

/**
 * ============================================
 * HOOK: useRealtimeGoals
 * ============================================
 *
 * Specialized hook for subscribing to goals:updated events
 * Convenience wrapper around useRealtimeEvents
 *
 * @param {Function} callback - Callback function for goals updates
 *
 * @returns {Object} Hook state (same as useRealtimeEvents)
 *
 * @example
 * const { isConnected } = useRealtimeGoals((data) => {
 *   console.log('Goals updated:', data);
 *   setGoals(data);
 * });
 */
export const useRealtimeGoals = (callback) => {
  return useRealtimeEvents('goals:updated', callback);
};

/**
 * ============================================
 * HOOK: useConnectionStatus
 * ============================================
 *
 * Hook to track SSE connection status without subscribing to events
 * Useful for displaying connection indicators
 *
 * @returns {Object} Connection status
 * @returns {boolean} isConnected - Whether SSE connection is active
 * @returns {Object} connectionStatus - Full connection status object
 *
 * @example
 * const { isConnected, connectionStatus } = useConnectionStatus();
 *
 * return (
 *   <div>
 *     {isConnected ? '🟢 Live' : '🔴 Offline'}
 *     {connectionStatus.retryCount > 0 && (
 *       <span>Reconnecting... ({connectionStatus.retryCount})</span>
 *     )}
 *   </div>
 * );
 */
export const useConnectionStatus = () => {
  const { connectionStatus } = useAuth();

  return {
    isConnected: connectionStatus?.connected || false,
    connectionStatus
  };
};

/**
 * ============================================
 * DEFAULT EXPORT
 * ============================================
 */
export default useRealtimeEvents;