/**
 * ============================================
 * TEST SSE COMPONENT
 * ============================================
 *
 * Test component for SSE event subscription via AuthContext proxy methods
 *
 * Purpose: Demonstrate real-time event listening through the AuthContext
 * without directly importing eventService
 *
 * Features:
 * - Subscribes to metrics:change and sync:update events
 * - Displays current SSE connection status
 * - Logs events to console for testing
 * - Proper cleanup on unmount
 */

import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

function TestSSEComponent() {
  const { connectionStatus, addEventListener, removeEventListener } = useAuth();

  useEffect(() => {
    // Subscribe to metrics changes
    const handleMetricsChange = (data) => {
      console.log('📊 Metrics changed (via AuthContext):', data);
    };

    // Subscribe to sync updates
    const handleSyncUpdate = (data) => {
      console.log('🔄 Sync update (via AuthContext):', data);
    };

    // Subscribe via AuthContext proxy methods
    addEventListener('metrics:change', handleMetricsChange);
    addEventListener('sync:update', handleSyncUpdate);

    // Cleanup on unmount
    return () => {
      removeEventListener('metrics:change', handleMetricsChange);
      removeEventListener('sync:update', handleSyncUpdate);
    };
  }, [addEventListener, removeEventListener]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-l-4 border-blue-500">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <span className="mr-2">🔔</span>
        SSE Connection Status (AuthContext Test)
      </h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Connected:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            connectionStatus.connected
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {connectionStatus.connected ? '🟢 Yes' : '🔴 No'}
          </span>
        </div>

        {connectionStatus.reason && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Reason:</span>
            <span className="text-sm text-gray-800">{connectionStatus.reason}</span>
          </div>
        )}

        {connectionStatus.retryCount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Retry Count:</span>
            <span className="text-sm text-gray-800">{connectionStatus.retryCount}</span>
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            <strong>Testing:</strong> Check browser console for event logs when metrics are updated or sync occurs.
          </p>
        </div>
      </div>
    </div>
  );
}

export default TestSSEComponent;