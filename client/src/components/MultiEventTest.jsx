/**
 * ============================================
 * MULTI-EVENT SUBSCRIPTION TEST COMPONENT
 * ============================================
 *
 * Test component for multiple simultaneous event subscriptions
 * using the specialized hooks from useRealtimeEvents
 *
 * Purpose: Demonstrate that multiple hooks can subscribe to different
 * event types simultaneously without interference
 *
 * Features:
 * - Uses useRealtimeMetrics for metrics:change events
 * - Uses useRealtimeSync for sync:update events
 * - Uses useConnectionStatus for connection monitoring
 * - Independent counters for each event type
 * - Console logging for debugging
 */

import { useState } from 'react';
import { useRealtimeMetrics, useRealtimeSync, useConnectionStatus } from '../hooks/useRealtimeEvents';

function MultiEventTest() {
  const [metricsCount, setMetricsCount] = useState(0);
  const [syncCount, setSyncCount] = useState(0);

  const { isConnected } = useConnectionStatus();

  // Subscribe to metrics:change events
  useRealtimeMetrics((data) => {
    console.log('📊 [MultiEventTest] Metrics event:', data.operation, 'on', data.date);
    setMetricsCount(prev => prev + 1);
  });

  // Subscribe to sync:update events
  useRealtimeSync((data) => {
    console.log('🔄 [MultiEventTest] Sync event:', data.totalDays, 'days synced');
    setSyncCount(prev => prev + 1);
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-l-4 border-purple-500">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <span className="mr-2">🎯</span>
        Multi-Event Subscription Test
      </h3>

      {/* Connection status indicator */}
      <div className={`mb-4 px-3 py-2 rounded inline-block text-sm font-medium ${
        isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {isConnected ? '🟢 Connected (Multi)' : '🔴 Disconnected (Multi)'}
      </div>

      {/* Event counters */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
          <span className="font-medium text-blue-900">📊 Metrics Events:</span>
          <span className="text-2xl font-bold text-blue-600">{metricsCount}</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-green-50 rounded">
          <span className="font-medium text-green-900">🔄 Sync Events:</span>
          <span className="text-2xl font-bold text-green-600">{syncCount}</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded text-sm">
        <p className="font-medium text-purple-900 mb-1">How to test:</p>
        <ol className="text-purple-800 space-y-1 text-xs">
          <li>1. Add metrics via API → 📊 counter increments</li>
          <li>2. Trigger Google Fit sync → 🔄 counter increments</li>
          <li>3. Both subscriptions work independently</li>
          <li>4. Check console for detailed event logs</li>
        </ol>
      </div>
    </div>
  );
}

export default MultiEventTest;