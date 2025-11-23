import express from 'express';
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect, serviceAuth } from '../middleware/auth.js';
import {
  addConnection,
  removeConnection,
  getConnectionCount,
  getConnectionStats,
  emitToUser,
  emitHeartbeat
} from '../utils/eventEmitter.js';
import { getPayloadStats } from '../middleware/payloadMonitor.js';

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
 * - Supports token via Authorization header (for testing with curl)
 * - Supports token via query parameter (for browser EventSource)
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
 *
 * BROWSER (EventSource):
 * const eventSource = new EventSource('/api/events/stream?token=<jwt-token>');
 */
router.get('/stream', async (req, res, next) => {
  try {
    // ===== AUTHENTICATION: Query Parameter OR Header =====
    let token = null;

    // Try Authorization header first (for testing with curl)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Fallback to query parameter (for browser EventSource)
    if (!token && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided',
        error: 'MISSING_TOKEN'
      });
    }

    // Verify JWT token manually (since protect middleware expects header)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    // Attach user to request (mimics protect middleware)
    req.user = user;

    // ===== Continue with existing SSE setup =====
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

    // ===== SEND IMMEDIATE HEARTBEAT (TEST) =====
    setTimeout(() => {
      console.log(`[SSE Route] Sending immediate test heartbeat to user ${userId}...`);
      const sent = emitHeartbeat(userId);
      console.log(`[SSE Route] Immediate heartbeat sent to ${sent} connection(s)`);
    }, 2000); // 2 seconds after connection

    // ===== STEP 4: Setup Heartbeat Mechanism =====
    const heartbeatInterval = setInterval(() => {
      try {
        console.log(`[SSE Route] Sending heartbeat to user ${userId}...`);
        const sent = emitHeartbeat(userId);
        console.log(`[SSE Route] Heartbeat sent to ${sent} connection(s)`);
        if (sent === 0) {
          // Connection was cleaned up, stop heartbeat
          console.log(`[SSE Route] No connections remaining, stopping heartbeat for user ${userId}`);
          clearInterval(heartbeatInterval);
        }
      } catch (error) {
        console.error(`[SSE Route] Heartbeat error for user ${userId}:`, error.message);
        clearInterval(heartbeatInterval);
      }
    }, 15000); // Changed from 30s to 15s for faster testing

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
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired',
        error: 'TOKEN_EXPIRED'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token is invalid',
        error: 'INVALID_TOKEN'
      });
    }

    next(error);
  }
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
 * SERVICE ENDPOINT: /api/events/emit
 * ============================================
 *
 * @route   POST /api/events/emit
 * @desc    Emit events to specific user's active SSE connections (service-to-service)
 * @access  Service (requires valid SERVICE_TOKEN)
 *
 * PURPOSE:
 * Allows backend services (e.g., Spark analytics) to emit real-time events
 * to users' active SSE connections without requiring user JWT authentication.
 *
 * AUTHENTICATION:
 * - Uses serviceAuth middleware (validates SERVICE_TOKEN)
 * - Shared secret between backend and Spark analytics
 * - More secure than exposing user JWT to external services
 *
 * REQUEST BODY:
 * {
 *   userId: string (required),        // MongoDB ObjectId as string
 *   eventType: string (required),     // e.g., 'analytics:update', 'analytics:batch_update'
 *   data: object (required)           // Event payload data
 * }
 *
 * EVENT TYPES:
 * - analytics:update: Single analytics calculated by Spark
 *   data: { metricType, timeRange, analytics, operationType }
 * 
 * - analytics:batch_update: Batched analytics for optimization (NEW)
 *   data: { analytics: [...], count, batchIndex, totalBatches }
 *   Used during large batch processing to send up to 50 analytics per event
 * 
 * - analytics:error: Analytics processing error
 * - sync:complete: Data sync completed
 * - Any custom event type as needed
 *
 * RESPONSE:
 * {
 *   success: true,
 *   message: 'Event emitted successfully',
 *   userId: '507f1f77bcf86cd799439011',
 *   eventType: 'analytics:batch_update',
 *   connectionsNotified: 2,
 *   hasActiveConnections: true,
 *   batchSize: 25  // Only for batch events
 * }
 *
 * EXAMPLE FROM SPARK (Single):
 * payload = {
 *   'userId': '507f1f77bcf86cd799439011',
 *   'eventType': 'analytics:update',
 *   'data': {
 *     'metricType': 'steps',
 *     'timeRange': '7day',
 *     'analytics': { ... }
 *   }
 * }
 *
 * EXAMPLE FROM SPARK (Batch):
 * payload = {
 *   'userId': '507f1f77bcf86cd799439011',
 *   'eventType': 'analytics:batch_update',
 *   'data': {
 *     'analytics': [
 *       { metricType: 'steps', timeRange: '7day', analytics: {...} },
 *       { metricType: 'calories', timeRange: '7day', analytics: {...} },
 *       ...up to 50 items
 *     ],
 *     'count': 25,
 *     'batchIndex': 1,
 *     'totalBatches': 2
 *   }
 * }
 *
 * SECURITY NOTES:
 * - SERVICE_TOKEN must be kept secret and never exposed to clients
 * - Should only be called by trusted backend services
 * - Validates userId format but doesn't verify user exists (performance)
 * - Rate limiting recommended for production
 */
router.post('/emit', serviceAuth, (req, res) => {
  try {
    // ===== STEP 1: Extract and Validate Request Body =====
    
    const { userId, eventType, data } = req.body;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required',
        error: 'MISSING_USER_ID'
      });
    }

    if (!eventType) {
      return res.status(400).json({
        success: false,
        message: 'eventType is required',
        error: 'MISSING_EVENT_TYPE'
      });
    }

    if (!data || typeof data !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'data must be a valid object',
        error: 'INVALID_DATA'
      });
    }

    // Validate userId format (MongoDB ObjectId: 24 hex characters)
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(userId)) {
      return res.status(400).json({
        success: false,
        message: 'userId must be a valid MongoDB ObjectId',
        error: 'INVALID_USER_ID_FORMAT'
      });
    }

    // ===== STEP 2: Emit Event to User's Active Connections =====

    console.log(`[Events API] Emitting event: ${eventType} to user: ${userId}`);
    
    // Log batch size for batch events
    if (eventType === 'analytics:batch_update' && data.analytics && Array.isArray(data.analytics)) {
      console.log(`[Events API] Batch event with ${data.analytics.length} analytics (batch ${data.batchIndex}/${data.totalBatches})`);
    } else {
      console.log(`[Events API] Event data:`, JSON.stringify(data, null, 2));
    }

    const connectionsNotified = emitToUser(userId, eventType, data);

    // ===== STEP 3: Log Result =====

    if (connectionsNotified === 0) {
      console.log(`[Events API] No active connections for user ${userId}, event queued`);
    } else {
      const batchInfo = eventType === 'analytics:batch_update' && data.analytics 
        ? ` (${data.analytics.length} analytics)` 
        : '';
      console.log(`[Events API] Event sent to ${connectionsNotified} connection(s)${batchInfo}`);
    }

    // ===== STEP 4: Return Success Response =====

    const response = {
      success: true,
      message: 'Event emitted successfully',
      userId,
      eventType,
      connectionsNotified,
      hasActiveConnections: connectionsNotified > 0
    };
    
    // Add batch info for batch events
    if (eventType === 'analytics:batch_update' && data.analytics) {
      response.batchSize = data.analytics.length;
      response.batchIndex = data.batchIndex;
      response.totalBatches = data.totalBatches;
    }

    return res.status(200).json(response);

  } catch (error) {
    // ===== ERROR HANDLING =====

    console.error('[Events API] Error emitting event:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to emit event',
      error: 'EVENT_EMISSION_ERROR',
      details: error.message
    });
  }
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

/**
 * ============================================
 * DEBUG ENDPOINT: PAYLOAD STATISTICS
 * ============================================
 *
 * @route   GET /api/events/debug/payload-stats
 * @desc    Get SSE payload monitoring statistics
 * @access  Private
 *
 * PURPOSE:
 * Monitor SSE payload sizes for optimization opportunities.
 * Shows total events sent, average payload size, large payload rate, etc.
 *
 * Response:
 * {
 *   "success": true,
 *   "stats": {
 *     "totalEvents": 245,
 *     "totalBytes": 61250,
 *     "totalKB": "59.81",
 *     "largePayloads": 5,
 *     "averageSize": 250,
 *     "largePayloadRate": "2.04%",
 *     "startTime": "2025-01-23T10:30:00.000Z",
 *     "uptime": "2025-01-23T12:45:00.000Z",
 *     "byEventType": {
 *       "metrics:updated": { "count": 150, "totalBytes": 37500, "averageSize": 250 },
 *       "goals:updated": { "count": 50, "totalBytes": 10000, "averageSize": 200 },
 *       "heartbeat": { "count": 45, "totalBytes": 1350, "averageSize": 30 }
 *     }
 *   }
 * }
 */
router.get('/debug/payload-stats', protect, (req, res) => {
  try {
    const stats = getPayloadStats();
    
    res.status(200).json({
      success: true,
      stats,
      message: 'Payload statistics retrieved successfully'
    });
  } catch (error) {
    console.error('[Events API] Error getting payload stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payload statistics',
      error: error.message
    });
  }
});

export default router;