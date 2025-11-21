/**
 * Analytics Monitor Component
 * Displays real-time analytics updates from Spark analytics processing
 * Shows both single analytics:update and batched analytics:batch_update events
 */

import { useState, useCallback } from 'react';
import { useRealtimeAnalytics } from '../../hooks/useRealtimeEvents';
import Card from '../common/Card';

const AnalyticsMonitor = () => {
  const [analyticsHistory, setAnalyticsHistory] = useState([]);
  const [totalReceived, setTotalReceived] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Subscribe to analytics events (both single and batch)
  const { isConnected } = useRealtimeAnalytics(
    useCallback((data) => {
      console.log('[AnalyticsMonitor] Received analytics:', data);
      
      // Update total count
      setTotalReceived(prev => prev + data.totalCount);
      
      // Update last update timestamp
      setLastUpdate(new Date());
      
      // Add to history (keep last 10 events)
      setAnalyticsHistory(prev => {
        const newEvent = {
          timestamp: new Date(),
          isBatch: data.isBatch,
          count: data.totalCount,
          analytics: data.analytics,
          userId: data.userId
        };
        
        return [newEvent, ...prev].slice(0, 10);
      });
    }, [])
  );

  return (
    <Card className="bg-white p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            📊 Analytics Monitor
          </h3>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-sm text-blue-600 font-medium">Total Analytics</div>
            <div className="text-2xl font-bold text-blue-900">{totalReceived}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-sm text-purple-600 font-medium">Events Received</div>
            <div className="text-2xl font-bold text-purple-900">{analyticsHistory.length}</div>
          </div>
        </div>

        {/* Last Update */}
        {lastUpdate && (
          <div className="text-sm text-gray-600">
            Last update: {lastUpdate.toLocaleTimeString()}
          </div>
        )}

        {/* Event History */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Recent Events</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {analyticsHistory.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4">
                Waiting for analytics events...
              </div>
            ) : (
              analyticsHistory.map((event, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    event.isBatch 
                      ? 'bg-purple-50 border-purple-200' 
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-medium ${
                      event.isBatch ? 'text-purple-700' : 'text-blue-700'
                    }`}>
                      {event.isBatch ? '📦 BATCH UPDATE' : '📊 SINGLE UPDATE'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {event.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-700">
                    <strong>{event.count}</strong> analytics received
                  </div>
                  
                  {/* Show sample analytics details */}
                  {event.analytics[0] && (
                    <div className="mt-2 text-xs text-gray-600 space-y-1">
                      <div>Type: {event.analytics[0].metricType || 'N/A'}</div>
                      <div>Period: {event.analytics[0].period || 'N/A'}</div>
                      {event.analytics[0].patterns && (
                        <div>Patterns: {event.analytics[0].patterns.length}</div>
                      )}
                      {event.analytics[0].insights && (
                        <div>Insights: {event.analytics[0].insights.length}</div>
                      )}
                    </div>
                  )}
                  
                  {/* Show batch info */}
                  {event.isBatch && event.count > 1 && (
                    <div className="mt-2 pt-2 border-t border-purple-200">
                      <div className="text-xs text-purple-600">
                        Batch contains {event.count} analytics items
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-500 border-t pt-3">
          <p>
            💡 This monitor shows real-time analytics updates from the Spark job.
            Batch events contain up to 50 analytics each.
          </p>
        </div>
      </div>
    </Card>
  );
};

export default AnalyticsMonitor;
