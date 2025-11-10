import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  addConnection,
  removeConnection,
  getConnectionCount,
  getConnectionStats,
  emitToUser,
  emitHeartbeat
} from '../utils/eventEmitter.js';

const router = express.Router();

/**
 * ============================================
 * SSE ENDPOINT: /api/events/stream
 * ============================================
 *
 * @route   GET /api/events/stream
 * @desc    Establish Server-Sent Events connection for real-time updates
 * @access  Private (requires valid JWT token)
 *
 * FEATURES:
 * - Multi-tab support: Users can have multiple connections simultaneously
 * - Automatic heartbeat: Ping every 30 seconds to keep connection alive
 * - Smart cleanup: Dead connections automatically removed
 * - Real-time events: Instant updates for metrics, goals, and syncs
 *
 * AUTHENTICATION:
 * - Uses protect middleware which validates JWT from Authorization header
 * - Connection is user-specific (isolated per userId)
 *
 * EVENT TYPES RECEIVED:
 * - connected: Initial confirmation when connection established
 * - ping: Heartbeat every 30 seconds to keep connection alive
 * - metrics:updated: Health metrics changed (from controllers)
 * - metrics:deleted: Health metrics deleted (from controllers)
 * - goals:updated: Goals changed (from controllers)
 * - googlefit:synced: New data synced from Google Fit (from workers)
 * - test:event: Test event from debug endpoint
 *
 * TESTING (curl):
 * curl -N -H "Authorization: Bearer <your-jwt-token>" \
 *   http://localhost:5000/api/events/stream
 */
router.get('/stream', protect, (req, res) => {
  const userId = req.user._id.toString();

  console.log(`[SSE Route] New connection request from user: ${userId}`);

  // ===== STEP 1: Configure SSE Response Headers =====
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setTimeout(0);

  // ===== STEP 2: Send Initial Connection Confirmation =====
  const connectedEvent = JSON.stringify({
    type: 'connected',
    userId: userId,
    timestamp: Date.now(),
    message: 'Real-time event stream established'
  });

  res.write(`data: ${connectedEvent}\n\n`);
  console.log(`[SSE Route] Connection confirmed for user: ${userId}`);

  // ===== STEP 3: Store Connection Using Event Emitter =====
  const connectionCount = addConnection(userId, res);
  console.log(`[SSE Route] User ${userId} now has ${connectionCount} active connection(s)`);

  // ===== STEP 4: Setup Heartbeat Mechanism =====
  const heartbeatInterval = setInterval(() => {
    try {
      const sent = emitHeartbeat(userId);
      if (sent === 0) {
        // Connection was cleaned up, stop heartbeat
        clearInterval(heartbeatInterval);
      }
    } catch (error) {
      console.error(`[SSE Route] Heartbeat error for user ${userId}:`, error.message);
      clearInterval(heartbeatInterval);
      cleanupConnection();
    }
  }, 30000); // 30 seconds

  // ===== STEP 5: Define Cleanup Function =====
  const cleanupConnection = () => {
    console.log(`[SSE Route] Cleaning up connection for user: ${userId}`);
    clearInterval(heartbeatInterval);
    removeConnection(userId, res);
  };

  // ===== STEP 6: Register Cleanup Event Listeners =====
  res.on('close', () => {
    console.log(`[SSE Route] Client disconnected: ${userId}`);
    cleanupConnection();
  });

  res.on('error', (error) => {
    console.error(`[SSE Route] Connection error for user ${userId}:`, error.message);
    cleanupConnection();
  });

  res.on('finish', () => {
    console.log(`[SSE Route] Response finished for user ${userId}`);
    cleanupConnection();
  });
});

/**
 * ============================================
 * DEBUG ENDPOINT: GET ACTIVE CONNECTIONS
 * ============================================
 *
 * @route   GET /api/events/debug/connections
 * @desc    Get list of all active SSE connections (for monitoring)
 * @access  Private
 *
 * Returns:
 * {
 *   success: true,
 *   totalUsers: 5,
 *   totalConnections: 7,
 *   users: [
 *     { userId: '507f1f77bcf86cd799439011', connections: 2 },
 *     { userId: '507f1f77bcf86cd799439012', connections: 1 }
 *   ]
 * }
 */
router.get('/debug/connections', protect, (req, res) => {
  const stats = getConnectionStats();

  res.status(200).json({
    success: true,
    totalUsers: stats.totalUsers,
    totalConnections: stats.totalConnections,
    users: stats.users,
    requestedBy: req.user._id.toString()
  });
});

/**
 * ============================================
 * DEBUG ENDPOINT: TEST EVENT BROADCAST
 * ============================================
 *
 * @route   POST /api/events/debug/test
 * @desc    Send a test event to your own SSE connection
 * @access  Private
 *
 * Usage:
 * POST /api/events/debug/test
 * Body: {
 *   "message": "Hello from test endpoint!"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Test event sent",
 *   "sentToConnections": 2,
 *   "userId": "507f1f77bcf86cd799439011",
 *   "hasActiveConnections": true
 * }
 */
router.post('/debug/test', protect, (req, res) => {
  const userId = req.user._id.toString();
  const testMessage = req.body.message || 'Test event from debug endpoint';

  const sentCount = emitToUser(userId, 'test:event', {
    message: testMessage,
    from: 'debug endpoint',
    receivedAt: new Date().toISOString()
  });

  res.status(200).json({
    success: true,
    message: 'Test event sent',
    sentToConnections: sentCount,
    userId,
    hasActiveConnections: sentCount > 0
  });
});

/**
 * ============================================
 * DEBUG ENDPOINT: CHECK CONNECTION COUNT
 * ============================================
 *
 * @route   GET /api/events/debug/count/:userId?
 * @desc    Get connection count for a specific user (or yourself if not specified)
 * @access  Private
 *
 * Examples:
 * GET /api/events/debug/count - Your connection count
 * GET /api/events/debug/count/507f1f77bcf86cd799439011 - Check another user's count
 *
 * Response:
 * {
 *   "success": true,
 *   "userId": "507f1f77bcf86cd799439011",
 *   "connectionCount": 2,
 *   "isConnected": true
 * }
 */
router.get('/debug/count/:userId?', protect, (req, res) => {
  const targetUserId = req.params.userId || req.user._id.toString();
  const count = getConnectionCount(targetUserId);

  res.status(200).json({
    success: true,
    userId: targetUserId,
    connectionCount: count,
    isConnected: count > 0
  });
});

export default router;