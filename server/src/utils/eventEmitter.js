/**
 * ============================================
 * SSE EVENT EMITTER UTILITY
 * ============================================
 *
 * Purpose: Centralized management of Server-Sent Events connections
 *
 * This module provides a singleton for managing real-time SSE connections
 * and broadcasting events to connected clients. It abstracts away the
 * complexity of connection management, error handling, and cleanup.
 *
 * Architecture:
 * - Singleton pattern: One shared connection Map across the application
 * - Connection storage: Map<userId, Response[]> for multi-tab support
 * - Auto-cleanup: Dead connections automatically removed on write failures
 * - Type-safe: Consistent event format with timestamps
 *
 * Usage:
 *
 * // In controllers, workers, or any service
 * import { emitToUser, emitToAll, getConnectionCount } from '../utils/eventEmitter.js';
 *
 * // Emit to specific user
 * emitToUser(userId, 'metrics:updated', { steps: 10000 });
 *
 * // Emit to all connected users
 * emitToAll('system:maintenance', { message: 'Server restart in 5 min' });
 *
 * // Check if user has active connections
 * const count = getConnectionCount(userId);
 * if (count > 0) {
 *   console.log(`User ${userId} has ${count} active tab(s)`);
 * }
 */

/**
 * ============================================
 * ACTIVE CONNECTIONS MAP
 * ============================================
 *
 * Structure: Map<string, Response[]>
 * - Key: userId (MongoDB ObjectId converted to string)
 * - Value: Array of Express Response objects (one per browser tab/device)
 *
 * Why an array?
 * - Users can have multiple tabs open simultaneously
 * - Each tab needs its own SSE connection
 * - Events must be sent to ALL tabs for that user
 *
 * Memory Management:
 * - Connections added when client connects (via eventsRoutes.js)
 * - Connections removed when client disconnects or write fails
 * - Map entry deleted when last connection for a user is removed
 */
const activeConnections = new Map();

/**
 * ============================================
 * ADD CONNECTION
 * ============================================
 *
 * Called by eventsRoutes.js when new SSE connection is established
 *
 * @param {string} userId - User ID (MongoDB ObjectId as string)
 * @param {Response} res - Express Response object for SSE stream
 * @returns {number} Total number of connections for this user after adding
 */
export const addConnection = (userId, res) => {
  const userIdString = userId.toString();

  if (!activeConnections.has(userIdString)) {
    activeConnections.set(userIdString, []);
  }

  activeConnections.get(userIdString).push(res);
  const count = activeConnections.get(userIdString).length;

  console.log(`[EventEmitter] Connection added for user ${userIdString} (total: ${count})`);
  console.log(`[EventEmitter] Total active users: ${activeConnections.size}`);

  return count;
};

/**
 * ============================================
 * REMOVE CONNECTION
 * ============================================
 *
 * Called when client disconnects or connection errors occur
 *
 * @param {string} userId - User ID (MongoDB ObjectId as string)
 * @param {Response} res - Express Response object to remove
 * @returns {number} Remaining connections for this user after removal
 */
export const removeConnection = (userId, res) => {
  const userIdString = userId.toString();
  const userConnections = activeConnections.get(userIdString);

  if (!userConnections) {
    console.warn(`[EventEmitter] Attempted to remove connection for user ${userIdString}, but none exist`);
    return 0;
  }

  // Filter out the specific response object
  const remainingConnections = userConnections.filter(conn => conn !== res);

  if (remainingConnections.length > 0) {
    activeConnections.set(userIdString, remainingConnections);
    console.log(`[EventEmitter] Connection removed for user ${userIdString} (remaining: ${remainingConnections.length})`);
  } else {
    activeConnections.delete(userIdString);
    console.log(`[EventEmitter] All connections closed for user ${userIdString}`);
  }

  console.log(`[EventEmitter] Total active users: ${activeConnections.size}`);

  return remainingConnections.length;
};

/**
 * ============================================
 * GET CONNECTION COUNT
 * ============================================
 *
 * Returns the number of active SSE connections for a specific user
 *
 * Use cases:
 * - Conditional event emission (skip if no connections)
 * - Debugging and monitoring
 * - Logging sync events only for connected users
 * - Connection health checks
 *
 * @param {string} userId - User ID (MongoDB ObjectId as string)
 * @returns {number} Number of active connections (0 if none)
 *
 * @example
 * const count = getConnectionCount(userId);
 * if (count === 0) {
 *   console.log('User is offline, skipping real-time update');
 * } else {
 *   console.log(`User has ${count} active tab(s)`);
 * }
 */
export const getConnectionCount = (userId) => {
  const userIdString = userId.toString();
  const connections = activeConnections.get(userIdString);
  return connections ? connections.length : 0;
};

/**
 * ============================================
 * GET ALL ACTIVE USER IDs
 * ============================================
 *
 * Returns array of all user IDs with active SSE connections
 *
 * Use cases:
 * - System-wide monitoring
 * - Admin dashboards showing online users
 * - Selective broadcasting (e.g., only to premium users)
 *
 * @returns {string[]} Array of user IDs
 *
 * @example
 * const activeUsers = getAllActiveUserIds();
 * console.log(`${activeUsers.length} users currently online`);
 */
export const getAllActiveUserIds = () => {
  return Array.from(activeConnections.keys());
};

/**
 * ============================================
 * GET CONNECTION STATS
 * ============================================
 *
 * Returns comprehensive statistics about active connections
 *
 * @returns {object} Statistics object
 *
 * @example
 * const stats = getConnectionStats();
 * // {
 * //   totalUsers: 5,
 * //   totalConnections: 8,
 * //   users: [
 * //     { userId: '507f...', connections: 2 },
 * //     { userId: '507f...', connections: 1 }
 * //   ]
 * // }
 */
export const getConnectionStats = () => {
  const users = [];
  let totalConnections = 0;

  activeConnections.forEach((connections, userId) => {
    users.push({
      userId,
      connections: connections.length
    });
    totalConnections += connections.length;
  });

  return {
    totalUsers: activeConnections.size,
    totalConnections,
    users
  };
};

/**
 * ============================================
 * EMIT TO USER
 * ============================================
 *
 * Send an SSE event to all active connections for a specific user
 *
 * This is the PRIMARY function for real-time updates. Call this from:
 * - Controllers (after database writes)
 * - Workers (after background processing)
 * - Services (after external API calls)
 *
 * SSE Message Format:
 * data: {"type":"EVENT_TYPE","data":{...payload...},"timestamp":1699622400000}\n\n
 *
 * Error Handling:
 * - Catches write errors (broken pipes, disconnected clients)
 * - Automatically removes dead connections
 * - Logs warnings for failed writes
 * - Never throws exceptions (safe to call without try/catch)
 *
 * @param {string|ObjectId} userId - User ID (automatically converted to string)
 * @param {string} eventType - Event identifier (e.g., 'metrics:updated', 'goals:updated')
 * @param {object} data - Event payload (must be JSON-serializable)
 * @returns {number} Number of connections successfully sent to (0 if none)
 *
 * @example
 * // In healthMetricsController.js after saving metrics
 * emitToUser(req.user.id, 'metrics:updated', {
 *   date: '2025-11-10',
 *   metrics: { steps: 10000, calories: 2500 }
 * });
 *
 * @example
 * // In googleFitSyncWorker.js after sync
 * emitToUser(userId, 'googlefit:synced', {
 *   syncedAt: new Date(),
 *   metricsCount: 7
 * });
 */
export const emitToUser = (userId, eventType, data) => {
  const userIdString = userId.toString();
  const connections = activeConnections.get(userIdString);

  // Early return if user has no active connections
  if (!connections || connections.length === 0) {
    console.log(`[EventEmitter] No active connections for user ${userIdString}, skipping event: ${eventType}`);
    return 0;
  }

  // Construct SSE-compliant event payload
  const payload = {
    type: eventType,
    data: data,
    timestamp: Date.now()
  };

  // Serialize to JSON for SSE transmission
  const eventData = JSON.stringify(payload);
  const sseMessage = `data: ${eventData}\n\n`;

  let successCount = 0;
  const deadConnections = [];

  // Attempt to write to all connections for this user
  connections.forEach((res, index) => {
    try {
      // SSE format: "data: {...}\n\n"
      res.write(sseMessage);
      successCount++;
    } catch (error) {
      // Connection is dead (broken pipe, closed socket, etc.)
      console.error(
        `[EventEmitter] Failed to emit ${eventType} to connection ${index} for user ${userIdString}:`,
        error.message
      );
      console.error(`[EventEmitter] Error type: ${error.code || error.name}`);

      // Mark for removal
      deadConnections.push(res);
    }
  });

  // Clean up dead connections
  if (deadConnections.length > 0) {
    console.warn(
      `[EventEmitter] Cleaning up ${deadConnections.length} dead connection(s) for user ${userIdString}`
    );

    const aliveConnections = connections.filter(conn => !deadConnections.includes(conn));

    if (aliveConnections.length > 0) {
      activeConnections.set(userIdString, aliveConnections);
      console.log(`[EventEmitter] ${aliveConnections.length} connection(s) remaining for user ${userIdString}`);
    } else {
      activeConnections.delete(userIdString);
      console.log(`[EventEmitter] All connections dead for user ${userIdString}, removed from Map`);
    }
  }

  // Log successful emission
  if (successCount > 0) {
    console.log(
      `[EventEmitter] ✓ Emitted ${eventType} to ${successCount} connection(s) for user ${userIdString}`
    );
  }

  return successCount;
};

/**
 * ============================================
 * EMIT TO ALL
 * ============================================
 *
 * Broadcast an SSE event to ALL connected users
 *
 * Use cases:
 * - System-wide announcements (maintenance, updates)
 * - Emergency alerts
 * - Feature flags or config changes
 * - Global notifications
 *
 * Performance Note:
 * - Iterates through all users in activeConnections Map
 * - For large user bases, consider rate limiting or batching
 * - Each user's connections are written to in parallel
 *
 * @param {string} eventType - Event identifier (e.g., 'system:announcement')
 * @param {object} data - Event payload (must be JSON-serializable)
 * @returns {number} Total number of connections successfully sent to
 *
 * @example
 * // System maintenance warning
 * emitToAll('system:maintenance', {
 *   message: 'Server will restart in 5 minutes',
 *   severity: 'warning',
 *   countdown: 300
 * });
 *
 * @example
 * // New feature announcement
 * emitToAll('system:feature', {
 *   feature: 'Dark Mode',
 *   description: 'Toggle in settings',
 *   enabled: true
 * });
 */
export const emitToAll = (eventType, data) => {
  let totalSent = 0;
  let totalUsers = activeConnections.size;

  console.log(`[EventEmitter] Broadcasting ${eventType} to ${totalUsers} user(s)`);

  activeConnections.forEach((connections, userId) => {
    const sentCount = emitToUser(userId, eventType, data);
    totalSent += sentCount;
  });

  console.log(
    `[EventEmitter] ✓ Broadcast complete: ${eventType} sent to ${totalSent} total connection(s)`
  );

  return totalSent;
};

/**
 * ============================================
 * EMIT HEARTBEAT
 * ============================================
 *
 * Send a ping event to specific user to keep connection alive
 *
 * Note: This is typically called automatically by eventsRoutes.js
 * every 30 seconds. You don't need to call this manually unless
 * implementing custom heartbeat logic.
 *
 * @param {string} userId - User ID (MongoDB ObjectId as string)
 * @returns {number} Number of connections successfully pinged
 */
export const emitHeartbeat = (userId) => {
  return emitToUser(userId, 'ping', { keepalive: true });
};

/**
 * ============================================
 * CLEAR ALL CONNECTIONS (FOR TESTING)
 * ============================================
 *
 * WARNING: Only use this for testing or graceful server shutdown
 *
 * Removes all connections from the Map without closing them
 * (actual connection closure is handled by Express)
 *
 * @returns {number} Number of users cleared
 */
export const clearAllConnections = () => {
  const userCount = activeConnections.size;
  activeConnections.clear();
  console.warn(`[EventEmitter] Cleared all connections (${userCount} users)`);
  return userCount;
};

/**
 * ============================================
 * EXPORTS
 * ============================================
 */
export default {
  // Connection Management
  addConnection,
  removeConnection,
  getConnectionCount,
  getAllActiveUserIds,
  getConnectionStats,

  // Event Emission
  emitToUser,
  emitToAll,
  emitHeartbeat,

  // Utilities
  clearAllConnections
};