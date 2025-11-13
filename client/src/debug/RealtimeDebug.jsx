/**
 * ============================================
 * REALTIME DEBUG COMPONENT
 * ============================================
 * 
 * Displays real-time connection status and event logs
 * Use this to diagnose SSE connection issues
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const RealtimeDebug = () => {
  const { connectionStatus, addEventListener, removeEventListener } = useAuth();
  const [events, setEvents] = useState([]);
  const [maxEvents] = useState(10);

  useEffect(() => {
    const handleMetricsChange = (data) => {
      setEvents(prev => [{
        type: 'metrics:change',
        data,
        timestamp: new Date().toISOString()
      }, ...prev].slice(0, maxEvents));
    };

    const handleSyncUpdate = (data) => {
      setEvents(prev => [{
        type: 'sync:update',
        data,
        timestamp: new Date().toISOString()
      }, ...prev].slice(0, maxEvents));
    };

    addEventListener('metrics:change', handleMetricsChange);
    addEventListener('sync:update', handleSyncUpdate);

    return () => {
      removeEventListener('metrics:change', handleMetricsChange);
      removeEventListener('sync:update', handleSyncUpdate);
    };
  }, [addEventListener, removeEventListener, maxEvents]);

  const clearEvents = () => setEvents([]);

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-white border-2 border-gray-300 rounded-lg shadow-xl p-4 max-w-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900">🔍 Real-Time Debug</h3>
        <button
          onClick={clearEvents}
          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
        >
          Clear
        </button>
      </div>

      {/* Connection Status */}
      <div className="mb-3 p-2 bg-gray-50 rounded">
        <div className="text-xs font-semibold text-gray-700 mb-1">Connection Status</div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            connectionStatus?.connected ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="text-xs">
            {connectionStatus?.connected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
        </div>
        {connectionStatus?.reason && (
          <div className="text-xs text-gray-600 mt-1">
            Reason: {connectionStatus.reason}
          </div>
        )}
        {connectionStatus?.retryCount > 0 && (
          <div className="text-xs text-orange-600 mt-1">
            Retry attempts: {connectionStatus.retryCount}
          </div>
        )}
      </div>

      {/* Event Log */}
      <div className="mb-2">
        <div className="text-xs font-semibold text-gray-700 mb-1">
          Recent Events ({events.length})
        </div>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {events.length === 0 ? (
          <div className="text-xs text-gray-500 italic p-2 bg-gray-50 rounded">
            No events received yet. Try adding metrics in another tab.
          </div>
        ) : (
          events.map((event, index) => (
            <div key={index} className="text-xs p-2 bg-gray-50 rounded border border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <span className={`font-semibold ${
                  event.type === 'metrics:change' ? 'text-blue-600' : 'text-green-600'
                }`}>
                  {event.type === 'metrics:change' ? '📊' : '🔄'} {event.type}
                </span>
                <span className="text-gray-500">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <pre className="text-xs bg-white p-1 rounded overflow-x-auto">
                {JSON.stringify(event.data, null, 2)}
              </pre>
            </div>
          ))
        )}
      </div>

      {/* Helper Text */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-600">
          💡 <strong>Tip:</strong> Open DevTools Console (F12) to see detailed logs
        </div>
      </div>
    </div>
  );
};

export default RealtimeDebug;
