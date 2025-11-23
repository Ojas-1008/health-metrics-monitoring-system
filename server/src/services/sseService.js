/**
 * ============================================
 * SSE SERVICE
 * ============================================
 *
 * Service layer for Server-Sent Events
 * Note: Payload monitoring is handled by eventEmitter to avoid double counting
 */

import { emitToUser as emitToUserInternal, getConnectionCount as getConnectionCountInternal } from '../utils/eventEmitter.js';

/**
 * Emit event to user
 * Payload monitoring is handled by eventEmitter layer
 */
export function emitToUser(userId, eventType, data) {
  // Delegate to internal emitter (monitoring handled there)
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