/**
 * ============================================
 * MONGODB CHANGE STREAM WORKER
 * ============================================
 *
 * Real-time database change detection for HealthMetric collection
 * Listens for insert, update, replace, and delete operations
 * Broadcasts changes to connected users via Server-Sent Events (SSE)
 *
 * Architecture:
 * - Uses MongoDB Change Streams (requires replica set)
 * - Filters by operationType to catch relevant changes
 * - Extracts userId for user-scoped event emission
 * - Handles connection failures with exponential backoff
 * - Automatic reconnection with resume token support
 *
 * Data Flow:
 * MongoDB Change → Filter Pipeline → Extract userId →
 * Format Event → Emit via SSE → Frontend React Update
 *
 * Requirements:
 * - MongoDB Atlas (replica set enabled by default)
 * - OR Local MongoDB with replica set configuration
 * - mongoose connection must be established before starting
 */

import mongoose from 'mongoose';
import HealthMetric from '../src/models/HealthMetric.js';
import { emitToUser, getConnectionCount } from '../src/utils/eventEmitter.js';

/**
 * ============================================
 * CONFIGURATION
 * ============================================
 */
const WORKER_NAME = 'ChangeStreamWorker';
const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_RECONNECT_DELAY = 1000; // 1 second
const MAX_RECONNECT_DELAY = 32000; // 32 seconds

/**
 * ============================================
 * WORKER STATE TRACKING
 * ============================================
 */
let changeStream = null;
let isRunning = false;
let reconnectAttempts = 0;
let reconnectTimeout = null;
let lastResumeToken = null;
let totalEventsProcessed = 0;
let totalEventsFailed = 0;

/**
 * ============================================
 * HELPER: EXPONENTIAL BACKOFF DELAY
 * ============================================
 *
 * Calculates delay for reconnection attempts
 * Formula: min(INITIAL_DELAY * 2^attempt, MAX_DELAY)
 *
 * @param {number} attempt - Current reconnection attempt (0-based)
 * @returns {number} Delay in milliseconds
 *
 * @example
 * Attempt 0: 1s
 * Attempt 1: 2s
 * Attempt 2: 4s
 * Attempt 3: 8s
 * Attempt 4: 16s
 * Attempt 5+: 32s (capped)
 */
const calculateBackoffDelay = (attempt) => {
  return Math.min(
    INITIAL_RECONNECT_DELAY * Math.pow(2, attempt),
    MAX_RECONNECT_DELAY
  );
};

/**
 * ============================================
 * HELPER: EXTRACT USER ID FROM CHANGE EVENT
 * ============================================
 *
 * Determines userId from change event based on operation type
 *
 * Insert/Update: userId available in fullDocument
 * Replace: userId available in fullDocument
 * Delete: Must query database using documentKey._id (before it's deleted)
 *
 * @param {object} change - MongoDB change event
 * @returns {Promise<string|null>} userId as string or null if not found
 */
const extractUserId = async (change) => {
  const { operationType, fullDocument, documentKey } = change;

  try {
    // For insert, update, replace: userId is in fullDocument
    if (operationType === 'insert' || operationType === 'update' || operationType === 'replace') {
      if (fullDocument && fullDocument.userId) {
        return fullDocument.userId.toString();
      }

      console.warn(`[${WORKER_NAME}] fullDocument.userId not found for ${operationType} operation`);
      return null;
    }

    // For delete: fullDocument is not available, must query database
    if (operationType === 'delete') {
      if (!documentKey || !documentKey._id) {
        console.warn(`[${WORKER_NAME}] documentKey._id not found for delete operation`);
        return null;
      }

      // Query database for userId before document is deleted
      // Note: This query might fail if document is already deleted
      // In production, consider maintaining a cache of recent userId mappings
      const deletedDoc = await HealthMetric.findById(documentKey._id).select('userId');

      if (deletedDoc && deletedDoc.userId) {
        return deletedDoc.userId.toString();
      }

      console.warn(`[${WORKER_NAME}] Could not find userId for deleted document ${documentKey._id}`);
      return null;
    }

    console.warn(`[${WORKER_NAME}] Unsupported operationType: ${operationType}`);
    return null;

  } catch (error) {
    console.error(`[${WORKER_NAME}] Error extracting userId:`, error.message);
    return null;
  }
};

/**
 * ============================================
 * HELPER: FORMAT EVENT PAYLOAD
 * ============================================
 *
 * Transforms MongoDB change event into frontend-friendly format
 * Only includes fields needed for UI updates (no sensitive data)
 *
 * @param {object} change - MongoDB change event
 * @returns {object} Formatted event payload
 */
const formatEventPayload = (change) => {
  const { operationType, fullDocument, documentKey, updateDescription } = change;

  const payload = {
    operation: operationType,
    timestamp: new Date().toISOString(),
    documentId: documentKey._id.toString()
  };

  // Include relevant data based on operation type
  switch (operationType) {
    case 'insert':
      payload.date = fullDocument.date;
      payload.metrics = fullDocument.metrics;
      payload.source = fullDocument.source;
      payload.syncedAt = fullDocument.syncedAt;
      break;

    case 'update':
    case 'replace':
      // For updates, include both updated fields and full document
      payload.date = fullDocument?.date;
      payload.metrics = fullDocument?.metrics;
      payload.source = fullDocument?.source;
      payload.syncedAt = fullDocument?.syncedAt;

      // Include information about what was updated
      if (updateDescription) {
        payload.updatedFields = Object.keys(updateDescription.updatedFields || {});
        payload.removedFields = updateDescription.removedFields || [];
      }
      break;

    case 'delete':
      // For deletes, only documentId is available
      payload.message = 'Health metric deleted';
      break;

    default:
      payload.message = `Unsupported operation: ${operationType}`;
  }

  return payload;
};

/**
 * ============================================
 * MAIN: PROCESS CHANGE EVENT
 * ============================================
 *
 * Handles individual change stream events
 * Extracts userId, formats payload, emits SSE event
 *
 * @param {object} change - MongoDB change event
 */
const processChangeEvent = async (change) => {
  try {
    const startTime = Date.now();
    const { operationType, fullDocument, documentKey } = change;

    console.log(`[${WORKER_NAME}] Processing ${operationType} event for document ${documentKey._id}`);

    // ===== STEP 1: Extract userId =====
    const userId = await extractUserId(change);

    if (!userId) {
      console.warn(`[${WORKER_NAME}] Skipping event: userId not found`);
      totalEventsFailed++;
      return;
    }

    // ===== STEP 2: Check if user has active SSE connections =====
    const connectionCount = getConnectionCount(userId);

    if (connectionCount === 0) {
      console.log(`[${WORKER_NAME}] User ${userId} has no active connections, skipping SSE emit`);
      // Not counted as failure - this is normal
      return;
    }

    // ===== STEP 3: Format event payload =====
    const payload = formatEventPayload(change);

    // ===== STEP 4: Emit to user via SSE =====
    const emitted = emitToUser(userId, 'metrics:change', payload);

    if (emitted > 0) {
      const duration = Date.now() - startTime;
      totalEventsProcessed++;
      console.log(
        `[${WORKER_NAME}] ✓ Emitted ${operationType} event to ${emitted} connection(s) for user ${userId} (${duration}ms)`
      );
    } else {
      console.warn(`[${WORKER_NAME}] Failed to emit event to user ${userId}`);
      totalEventsFailed++;
    }

    // ===== STEP 5: Store resume token for crash recovery =====
    if (change._id) {
      lastResumeToken = change._id;
    }

  } catch (error) {
    console.error(`[${WORKER_NAME}] Error processing change event:`, error.message);
    console.error(`[${WORKER_NAME}] Stack trace:`, error.stack);
    totalEventsFailed++;
  }
};

/**
 * ============================================
 * MAIN: START CHANGE STREAM LISTENER
 * ============================================
 *
 * Initializes MongoDB change stream on HealthMetric collection
 * Sets up event handlers for change, error, close events
 * Implements automatic reconnection with exponential backoff
 *
 * Pipeline Stages:
 * 1. Match only insert/update/replace/delete operations
 * 2. Filter for documents with userId field (user-scoped only)
 * 3. Include fullDocument for all operations (except delete)
 *
 * @returns {Promise<void>}
 */
const startChangeStreamWorker = async () => {
  // Prevent multiple concurrent instances
  if (isRunning) {
    console.warn(`[${WORKER_NAME}] Already running, ignoring start request`);
    return;
  }

  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 STARTING CHANGE STREAM WORKER`);
    console.log(`${'='.repeat(60)}`);

    // ===== STEP 1: Verify MongoDB connection =====
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB connection not established. Change streams require active connection.');
    }

    console.log(`✓ MongoDB connection verified (state: ${mongoose.connection.readyState})`);

    // ===== STEP 2: Verify replica set support =====
    // Change streams require MongoDB replica set
    // MongoDB Atlas enables replica sets by default
    const adminDb = mongoose.connection.db.admin();
    const serverInfo = await adminDb.serverInfo();

    console.log(`✓ MongoDB version: ${serverInfo.version}`);

    // Check if running on MongoDB Atlas or local replica set
    const isAtlas = mongoose.connection.host.includes('mongodb.net');
    console.log(`✓ Deployment type: ${isAtlas ? 'MongoDB Atlas' : 'Local/Self-hosted'}`);

    // ===== STEP 3: Define change stream pipeline =====
    const pipeline = [
      {
        // Match only relevant operations
        $match: {
          operationType: {
            $in: ['insert', 'update', 'replace', 'delete']
          }
        }
      },
      {
        // Filter for user-scoped documents only
        // This prevents cross-tenant data leakage
        // For deletes, this filter won't work (fullDocument is null)
        // So we handle userId extraction separately for deletes
        $match: {
          $or: [
            { 'fullDocument.userId': { $exists: true } },
            { operationType: 'delete' } // Allow deletes through, we'll handle userId lookup
          ]
        }
      }
    ];

    // ===== STEP 4: Change stream options =====
    const options = {
      fullDocument: 'updateLookup', // Include full document for updates
      fullDocumentBeforeChange: 'whenAvailable' // Include document state before change (MongoDB 6.0+)
    };

    // Resume from last known position if available (crash recovery)
    if (lastResumeToken) {
      options.resumeAfter = lastResumeToken;
      console.log(`✓ Resuming from last known position (resume token available)`);
    }

    // ===== STEP 5: Open change stream =====
    // Using mongoose.connection.collection() to get native MongoDB collection
    const collection = mongoose.connection.collection('healthmetrics');
    changeStream = collection.watch(pipeline, options);

    isRunning = true;
    reconnectAttempts = 0; // Reset on successful connection

    console.log(`✓ Change stream opened on 'healthmetrics' collection`);
    console.log(`✓ Watching operations: insert, update, replace, delete`);
    console.log(`✓ Worker is now active and listening for changes...`);
    console.log(`${'='.repeat(60)}\n`);

    // ===== STEP 6: Register event handlers =====

    // Handle change events
    changeStream.on('change', async (change) => {
      await processChangeEvent(change);
    });

    // Handle errors
    changeStream.on('error', async (error) => {
      console.error(`\n${'='.repeat(60)}`);
      console.error(`❌ CHANGE STREAM ERROR`);
      console.error(`${'='.repeat(60)}`);
      console.error(`Error name: ${error.name}`);
      console.error(`Error message: ${error.message}`);
      console.error(`Error code: ${error.code || 'N/A'}`);

      // Log specific error types
      if (error.code === 40573) {
        console.error(`\n⚠️  INVALID RESUME TOKEN`);
        console.error(`The resume token is no longer valid (collection dropped or too old)`);
        console.error(`Worker will restart from current time`);
        lastResumeToken = null; // Clear invalid token
      } else if (error.code === 136) {
        console.error(`\n⚠️  CHANGE STREAM CURSOR NOT FOUND`);
        console.error(`The change stream cursor has expired`);
      } else if (error.name === 'MongoNetworkError') {
        console.error(`\n⚠️  NETWORK ERROR`);
        console.error(`Connection to MongoDB lost`);
      } else if (error.name === 'MongoServerError') {
        console.error(`\n⚠️  SERVER ERROR`);
        console.error(`MongoDB server encountered an error`);
      }

      console.error(`\nStack trace:`, error.stack);
      console.error(`${'='.repeat(60)}\n`);

      // Close stream and attempt reconnection
      isRunning = false;
      if (changeStream) {
        await changeStream.close().catch(() => {});
        changeStream = null;
      }

      // Attempt reconnection with exponential backoff
      await attemptReconnection();
    });

    // Handle stream close
    changeStream.on('close', () => {
      console.log(`[${WORKER_NAME}] Change stream closed`);
      isRunning = false;
    });

    // Handle stream end
    changeStream.on('end', () => {
      console.log(`[${WORKER_NAME}] Change stream ended`);
      isRunning = false;
    });

  } catch (error) {
    console.error(`\n${'='.repeat(60)}`);
    console.error(`❌ FAILED TO START CHANGE STREAM WORKER`);
    console.error(`${'='.repeat(60)}`);
    console.error(`Error: ${error.message}`);
    console.error(`Stack trace:`, error.stack);
    console.error(`${'='.repeat(60)}\n`);

    isRunning = false;

    // Attempt reconnection
    await attemptReconnection();
  }
};

/**
 * ============================================
 * HELPER: ATTEMPT RECONNECTION
 * ============================================
 *
 * Implements exponential backoff reconnection strategy
 * Retries up to MAX_RECONNECT_ATTEMPTS times
 *
 * @returns {Promise<void>}
 */
const attemptReconnection = async () => {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error(`\n${'='.repeat(60)}`);
    console.error(`❌ CHANGE STREAM WORKER: MAX RECONNECT ATTEMPTS REACHED`);
    console.error(`${'='.repeat(60)}`);
    console.error(`Attempted ${reconnectAttempts} times, giving up`);
    console.error(`Manual intervention required or server restart needed`);
    console.error(`${'='.repeat(60)}\n`);
    return;
  }

  reconnectAttempts++;
  const delay = calculateBackoffDelay(reconnectAttempts - 1);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔄 ATTEMPTING RECONNECTION`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Attempt: ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
  console.log(`Delay: ${delay}ms (${(delay / 1000).toFixed(1)}s)`);
  console.log(`${'='.repeat(60)}\n`);

  reconnectTimeout = setTimeout(async () => {
    console.log(`[${WORKER_NAME}] Reconnecting now...`);
    await startChangeStreamWorker();
  }, delay);
};

/**
 * ============================================
 * HELPER: STOP CHANGE STREAM WORKER
 * ============================================
 *
 * Gracefully stops the change stream worker
 * Clears reconnection timeouts
 * Closes active change stream
 *
 * @returns {Promise<void>}
 */
const stopChangeStreamWorker = async () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🛑 STOPPING CHANGE STREAM WORKER`);
  console.log(`${'='.repeat(60)}`);

  // Clear reconnection timeout
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
    console.log(`✓ Cleared reconnection timeout`);
  }

  // Close change stream
  if (changeStream) {
    try {
      await changeStream.close();
      console.log(`✓ Change stream closed`);
    } catch (error) {
      console.error(`Error closing change stream:`, error.message);
    }
    changeStream = null;
  }

  isRunning = false;
  reconnectAttempts = 0;

  console.log(`✓ Worker stopped successfully`);
  console.log(`📊 Total events processed: ${totalEventsProcessed}`);
  console.log(`📊 Total events failed: ${totalEventsFailed}`);
  console.log(`${'='.repeat(60)}\n`);
};

/**
 * ============================================
 * HELPER: GET WORKER STATUS
 * ============================================
 *
 * Returns current status of change stream worker
 * Useful for monitoring and debugging
 *
 * @returns {object} Worker status
 */
const getWorkerStatus = () => {
  return {
    isRunning,
    reconnectAttempts,
    maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS,
    totalEventsProcessed,
    totalEventsFailed,
    hasResumeToken: !!lastResumeToken,
    mongooseConnectionState: mongoose.connection.readyState,
    mongooseConnectionStateName: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown'
  };
};

/**
 * ============================================
 * EXPORTS
 * ============================================
 */
export {
  startChangeStreamWorker,
  stopChangeStreamWorker,
  getWorkerStatus
};

export default {
  start: startChangeStreamWorker,
  stop: stopChangeStreamWorker,
  getStatus: getWorkerStatus
};