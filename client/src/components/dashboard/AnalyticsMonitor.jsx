/**
 * ============================================
 * ANALYTICS MONITOR COMPONENT (ENHANCED)
 * ============================================
 *
 * Premium real-time analytics display with Modern Glassmorphism
 *
 * Features:
 * - Glassmorphism design with gradients
 * - Live connection indicator with pulse
 * - Animated event cards
 * - Real-time update animations
 * - Beautiful stats cards with gradients
 * - Enhanced visual feedback
 * - Batch vs single event styling
 */

import { useState, useCallback } from 'react';
import { useRealtimeAnalytics } from '../../hooks/useRealtimeEvents';
import Card from '../common/Card';

const AnalyticsMonitor = () => {
  const [analyticsHistory, setAnalyticsHistory] = useState([]);
  const [totalReceived, setTotalReceived] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Subscribe to analytics events
  const { isConnected } = useRealtimeAnalytics(
    useCallback((data) => {
      console.log('[AnalyticsMonitor] Received analytics:', data);

      setTotalReceived(prev => prev + data.totalCount);
      setLastUpdate(new Date());

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
    <div className="relative bg-gradient-to-br from-white/90 to-purple-50/90 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-gray-300/40 p-8 overflow-hidden">
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 pointer-events-none"></div>

      <div className="relative space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
            <span className="text-3xl">⚡</span>
            Analytics Monitor
          </h3>

          {/* Live Status */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg">
            <div className="relative">
              {isConnected && (
                <div className="absolute inset-0 bg-green-400 rounded-full blur opacity-60 animate-pulse"></div>
              )}
              <div className={`relative h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </div>
            <span className={`text-sm font-bold ${isConnected ? 'text-green-700' : 'text-red-700'}`}>
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-6">
          {/* Total Analytics */}
          <div className="relative bg-gradient-to-br from-blue-50/90 to-indigo-50/90 backdrop-blur-md border-2 border-blue-300/40 rounded-xl p-6 shadow-lg overflow-hidden group hover:shadow-xl transition-shadow duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 pointer-events-none"></div>
            <div className="relative">
              <div className="text-sm text-blue-700 font-bold mb-2 flex items-center gap-2">
                <span className="text-xl">📊</span>
                Total Analytics
              </div>
              <div className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {totalReceived}
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-50"></div>
          </div>

          {/* Events Received */}
          <div className="relative bg-gradient-to-br from-purple-50/90 to-pink-50/90 backdrop-blur-md border-2 border-purple-300/40 rounded-xl p-6 shadow-lg overflow-hidden group hover:shadow-xl transition-shadow duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 pointer-events-none"></div>
            <div className="relative">
              <div className="text-sm text-purple-700 font-bold mb-2 flex items-center gap-2">
                <span className="text-xl">📦</span>
                Events Received
              </div>
              <div className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {analyticsHistory.length}
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 opacity-50"></div>
          </div>
        </div>

        {/* Last Update */}
        {lastUpdate && (
          <div className="px-4 py-2 bg-gradient-to-r from-green-50/90 to-emerald-50/90 backdrop-blur-sm border-2 border-green-300/40 rounded-xl text-sm text-green-800 font-semibold shadow-md">
            🕒 Last update: {lastUpdate.toLocaleTimeString()}
          </div>
        )}

        {/* Event History */}
        <div className="space-y-4">
          <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-xl">📋</span>
            Recent Events
          </h4>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin">
            {analyticsHistory.length === 0 ? (
              <div className="text-center py-12 bg-gradient-to-br from-gray-50/90 to-blue-50/90 backdrop-blur-md rounded-xl border-2 border-dashed border-gray-400/60 shadow-lg">
                <div className="text-5xl mb-4 animate-pulse">⏳</div>
                <p className="text-sm font-semibold text-gray-700">
                  Waiting for analytics events...
                </p>
              </div>
            ) : (
              analyticsHistory.map((event, index) => (
                <div
                  key={index}
                  className={`
                    relative p-5 rounded-xl border-2 shadow-lg
                    backdrop-blur-md overflow-hidden
                    transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5
                    animate-slideDown
                    ${event.isBatch
                      ? 'bg-gradient-to-br from-purple-50/90 to-pink-50/90 border-purple-300/40'
                      : 'bg-gradient-to-br from-blue-50/90 to-indigo-50/90 border-blue-300/40'
                    }
                  `}
                >
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 pointer-events-none"></div>

                  <div className="relative">
                    {/* Event Header */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`
                        px-3 py-1.5 rounded-full text-xs font-bold shadow-md
                        ${event.isBatch
                          ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white'
                          : 'bg-gradient-to-r from-blue-400 to-indigo-400 text-white'
                        }
                      `}>
                        {event.isBatch ? '📦 BATCH UPDATE' : '📊 SINGLE UPDATE'}
                      </span>
                      <span className="text-xs text-gray-700 font-semibold bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-md">
                        {event.timestamp.toLocaleTimeString()}
                      </span>
                    </div>

                    {/* Count Display */}
                    <div className={`
                      text-lg font-bold mb-3
                      ${event.isBatch ? 'text-purple-900' : 'text-blue-900'}
                    `}>
                      <span className="text-3xl font-extrabold">{event.count}</span> analytics received
                    </div>

                    {/* Analytics Details */}
                    {event.analytics[0] && (
                      <div className="p-3 bg-white/60 backdrop-blur-sm rounded-lg text-xs text-gray-800 space-y-1.5 font-medium shadow-md">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">Type:</span>
                          <span className="px-2 py-0.5 bg-gray-200 rounded-full">{event.analytics[0].metricType || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">Period:</span>
                          <span className="px-2 py-0.5 bg-gray-200 rounded-full">{event.analytics[0].period || 'N/A'}</span>
                        </div>
                        {event.analytics[0].patterns && (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">Patterns:</span>
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold">{event.analytics[0].patterns.length}</span>
                          </div>
                        )}
                        {event.analytics[0].insights && (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">Insights:</span>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold">{event.analytics[0].insights.length}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Batch Info */}
                    {event.isBatch && event.count > 1 && (
                      <div className="mt-3 pt-3 border-t-2 border-purple-300/40">
                        <div className="text-sm text-purple-800 font-bold flex items-center gap-2">
                          <span className="text-lg">📦</span>
                          Batch contains {event.count} analytics items
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Accent */}
                  <div className={`
                    absolute bottom-0 left-0 right-0 h-1 opacity-50
                    ${event.isBatch
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                    }
                  `}></div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="p-6 bg-gradient-to-br from-blue-50/90 to-indigo-50/90 backdrop-blur-md border-2 border-blue-300/40 rounded-xl shadow-lg">
          <p className="text-sm text-blue-900 font-medium flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <span>
              <strong className="font-bold">Info:</strong> This monitor shows real-time analytics updates from the Spark job. Batch events contain up to 50 analytics each.
            </span>
          </p>
        </div>
      </div>

      {/* Bottom Accent Line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 opacity-50"></div>
    </div>
  );
};

export default AnalyticsMonitor;
