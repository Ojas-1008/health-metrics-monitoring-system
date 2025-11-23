/**
 * ============================================
 * PAYLOAD SIZE MONITORING MIDDLEWARE
 * ============================================
 * 
 * Logs large payloads for optimization opportunities
 */

import * as payloadOptimizer from '../utils/eventPayloadOptimizer.js';

// Track payload statistics
const stats = {
  totalEvents: 0,
  totalBytes: 0,
  largePayloads: 0,
  averageSize: 0,
  startTime: new Date().toISOString(),
  byEventType: {}, // Track per event type
};

/**
 * Monitor SSE event payloads
 */
export function monitorEventPayload(userId, eventType, payload) {
  const size = payloadOptimizer.calculatePayloadSize(payload);

  stats.totalEvents++;
  stats.totalBytes += size;
  stats.averageSize = Math.round(stats.totalBytes / stats.totalEvents);

  // Track per event type
  if (!stats.byEventType[eventType]) {
    stats.byEventType[eventType] = {
      count: 0,
      totalBytes: 0,
      averageSize: 0,
    };
  }
  stats.byEventType[eventType].count++;
  stats.byEventType[eventType].totalBytes += size;
  stats.byEventType[eventType].averageSize = Math.round(
    stats.byEventType[eventType].totalBytes / stats.byEventType[eventType].count
  );

  // Safe access to CONFIG with fallback value
  const maxPayloadSize = payloadOptimizer.CONFIG?.maxPayloadSize || 500;
  if (size > maxPayloadSize) {
    stats.largePayloads++;
    console.warn(
      `[PayloadMonitor] Large payload detected: ${eventType} to user ${userId} = ${size} bytes`
    );
  }

  // Log stats every 100 events
  if (stats.totalEvents % 100 === 0) {
    console.log('[PayloadMonitor] Stats:', {
      totalEvents: stats.totalEvents,
      averageSize: `${stats.averageSize} bytes`,
      totalData: `${(stats.totalBytes / 1024).toFixed(2)} KB`,
      largePayloadRate: `${((stats.largePayloads / stats.totalEvents) * 100).toFixed(2)}%`,
    });
  }
}

/**
 * Get payload statistics
 */
export function getPayloadStats() {
  // Prevent division by zero
  const totalEvents = stats.totalEvents || 1;
  const largePayloads = stats.largePayloads || 0;
  
  return {
    ...stats,
    totalKB: (stats.totalBytes / 1024).toFixed(2),
    largePayloadRate: ((largePayloads / totalEvents) * 100).toFixed(2) + '%',
    uptime: stats.startTime ? new Date().toISOString() : null,
  };
}

export default {
  monitorEventPayload,
  getPayloadStats,
};