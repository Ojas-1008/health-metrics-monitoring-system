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
};

/**
 * Monitor SSE event payloads
 */
export function monitorEventPayload(userId, eventType, payload) {
  const size = payloadOptimizer.calculatePayloadSize(payload);

  stats.totalEvents++;
  stats.totalBytes += size;
  stats.averageSize = Math.round(stats.totalBytes / stats.totalEvents);

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
  return {
    ...stats,
    totalKB: (stats.totalBytes / 1024).toFixed(2),
    largePayloadRate: ((stats.largePayloads / stats.totalEvents) * 100).toFixed(2) + '%',
  };
}

export default {
  monitorEventPayload,
  getPayloadStats,
};