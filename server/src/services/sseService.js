/**
 * ============================================
 * SSE SERVICE
 * ============================================
 *
 * Service layer for Server-Sent Events with payload monitoring
 */

import { emitToUser as emitToUserInternal, getConnectionCount as getConnectionCountInternal } from '../utils/eventEmitter.js';
import { monitorEventPayload } from '../middleware/payloadMonitor.js';

/**
 * Emit event to user with optional payload monitoring
 */
export function emitToUser(userId, eventType, data) {
  // Monitor payload size in development
  if (process.env.NODE_ENV === 'development') {
    monitorEventPayload(userId, eventType, { type: eventType, data });
  }

  // Delegate to internal emitter
  return emitToUserInternal(userId, eventType, data);
}

/**
 * Get connection count for user
 */
export function getConnectionCount(userId) {
  return getConnectionCountInternal(userId);
}

export default {
  emitToUser,
  getConnectionCount,
};