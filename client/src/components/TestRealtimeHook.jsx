/**
 * ============================================
 * TEST REALTIME HOOK COMPONENT
 * ============================================
 *
 * Test component for the useRealtimeEvents hook
 *
 * Purpose: Demonstrate the new useRealtimeEvents hook functionality
 * with automatic cleanup and connection status tracking
 *
 * Features:
 * - Uses useRealtimeEvents hook for metrics:change events
 * - Displays real-time connection status
 * - Shows event log with timestamps
 * - Proper cleanup handled by the hook
 */

import { useState, useEffect } from 'react';
import { useRealtimeEvents } from '../hooks/useRealtimeEvents';
import { getAuthToken } from '../api/axiosConfig';

function TestRealtimeHook() {
  const [events, setEvents] = useState([]);
  const [isTesting, setIsTesting] = useState(false);

  // Log component lifecycle
  useEffect(() => {
    console.log('🟢 [TestRealtimeHook] Component MOUNTED');
    return () => {
      console.log('🔴 [TestRealtimeHook] Component UNMOUNTED');
    };
  }, []);

  // Subscribe to metrics:change events using the new hook
  const { isConnected } = useRealtimeEvents('metrics:change', (data) => {
    console.log('📊 [TestRealtimeHook] Received metrics:change:', data);
    
    setEvents(prevEvents => [
      ...prevEvents,
      {
        id: Date.now(),
        type: 'metrics:change',
        data,
        timestamp: new Date().toISOString()
      }
    ]);
  });

  // Manual test function
  const triggerTestEvent = async () => {
    setIsTesting(true);
    try {
      const token = getAuthToken();
      if (!token) {
        alert('Please log in first to test the realtime hook');
        return;
      }

      const response = await fetch('http://localhost:5000/api/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          metrics: {
            steps: Math.floor(Math.random() * 10000) + 1000,
            calories: Math.floor(Math.random() * 500) + 1500,
            sleepHours: Math.floor(Math.random() * 4) + 6,
            weight: 70 + Math.random() * 10
          },
          source: 'manual'
        })
      });

      const result = await response.json();
      if (result.success) {
        console.log('✅ Test event triggered successfully');
      } else {
        console.error('❌ Failed to trigger test event:', result.message);
      }
    } catch (error) {
      console.error('❌ Error triggering test event:', error);
    } finally {
      setIsTesting(false);
    }
  };  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-l-4 border-green-500">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <span className="mr-2">⚡</span>
        Real-time Events Hook Test
        <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
          🟢 MOUNTED
        </span>
      </h3>

      {/* Connection status indicator */}
      <div className={`mb-4 px-3 py-2 rounded inline-block text-sm font-medium ${
        isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {isConnected ? '🟢 Connected (Hook)' : '🔴 Disconnected (Hook)'}
      </div>

      {/* Test button */}
      <div className="mb-4">
        <button
          onClick={triggerTestEvent}
          disabled={isTesting}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium"
        >
          {isTesting ? '🔄 Testing...' : '🧪 Trigger Test Event'}
        </button>
        <span className="ml-2 text-xs text-gray-600">
          Click to add random metrics and test real-time updates
        </span>
      </div>

      {/* Event log */}
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-700">Events Log ({events.length}):</h4>
        {events.length === 0 ? (
          <p className="text-gray-500 text-sm italic">
            No events received yet. Add a metric via API to see real-time updates.
          </p>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-2">
            {events.map(event => (
              <div key={event.id} className="p-3 bg-gray-50 rounded text-sm border">
                <div className="font-mono text-xs text-gray-600 mb-1">
                  {new Date(event.timestamp).toLocaleString()}
                </div>
                <div className="font-semibold text-blue-600">{event.type}</div>
                <div className="text-xs text-gray-600 mt-1">
                  <span className="font-medium">Operation:</span> {event.data.operation} •
                  <span className="font-medium">Date:</span> {event.data.date} •
                  <span className="font-medium">Source:</span> {event.data.source}
                </div>
                {event.data.metrics && (
                  <div className="mt-2 text-xs">
                    <span className="font-medium text-gray-700">Metrics:</span>
                    <div className="mt-1 grid grid-cols-2 gap-1">
                      {Object.entries(event.data.metrics).map(([key, value]) => (
                        <div key={key} className="bg-white px-2 py-1 rounded text-xs">
                          <span className="font-medium capitalize">{key}:</span>{' '}
                          {typeof value === 'object' && value !== null
                            ? JSON.stringify(value)
                            : value ?? 'N/A'}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
        <p className="font-medium text-blue-900 mb-1">How to test:</p>
        <ol className="text-blue-800 space-y-1 text-xs">
          <li>1. Make sure you&apos;re logged in to see the SSE connection</li>
          <li>2. Click &quot;🧪 Trigger Test Event&quot; above to add random metrics</li>
          <li>3. Watch for real-time updates in the event log below!</li>
          <li>4. Click &quot;🙈 Hide Test Component&quot; to unmount and test cleanup</li>
          <li>5. Check browser console for mount/unmount logs</li>
          <li>6. Or run: <code className="bg-blue-100 px-1 rounded">node test-realtime-hook.js</code> in server terminal</li>
        </ol>
      </div>
    </div>
  );
}

export default TestRealtimeHook;