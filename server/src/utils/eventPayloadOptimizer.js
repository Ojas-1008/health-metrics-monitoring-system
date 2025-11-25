/**
 * ============================================
 * EVENT PAYLOAD OPTIMIZER
 * ============================================
 * 
 * Purpose: Minimize event payload sizes for SSE transmission
 * 
 * Features:
 * - Strip unnecessary MongoDB metadata
 * - Include only changed fields for updates
 * - Date range filtering for relevance
 * - Payload size calculation and monitoring
 * - Batch aggregation for large syncs
 */

/**
 * ============================================
 * CONFIGURATION
 * ============================================
 */
const CONFIG = {
  // Maximum individual event payload size (bytes)
  maxPayloadSize: 500,

  // Date range for filtering (days from now)
  relevantDateRange: 30,

  // Batch size threshold for aggregation
  batchAggregationThreshold: 50,

  // Essential fields to include
  essentialFields: ['date', 'metrics', 'source', 'syncedAt', 'lastUpdated'],
};

/**
 * ============================================
 * OPTIMIZE METRIC PAYLOAD
 * ============================================
 * 
 * Strips unnecessary fields and includes only essentials
 * 
 * @param {object} metric - Full metric document from MongoDB
 * @param {string} operation - Operation type (insert, update, upsert, delete)
 * @param {object} changedFields - Only changed fields (for updates)
 * @returns {object} Optimized payload
 */
export function optimizeMetricPayload(metric, operation = 'upsert', changedFields = null) {
  // Base payload structure
  const payload = {
    operation,
    date: metric.date,
    source: metric.source || 'manual',
  };

  // For updates, include only changed metrics fields
  if (operation === 'update' && changedFields) {
    payload.metrics = changedFields;
  } else {
    // For insert/upsert, include all metrics
    payload.metrics = metric.metrics || {};
  }

  // Optional timestamp fields
  if (metric.syncedAt) {
    payload.syncedAt = metric.syncedAt;
  }

  // Add last updated timestamp for client-side freshness checks
  payload.lastUpdated = metric.lastUpdated || metric.updatedAt || new Date().toISOString();

  return payload;
}

/**
 * ============================================
 * IS DATE IN RELEVANT RANGE
 * ============================================
 * 
 * Checks if date is within the relevant range for dashboard display
 * Reduces unnecessary event emissions for old data
 * 
 * @param {string} date - Date string (YYYY-MM-DD)
 * @param {number} rangeDays - Number of days to consider relevant (default: 30)
 * @returns {boolean} True if date is within range
 */
export function isDateInRelevantRange(date, rangeDays = CONFIG.relevantDateRange) {
  try {
    const dateObj = new Date(date);

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn('[EventPayloadOptimizer] Invalid date format:', date);
      return false; // Skip invalid dates
    }

    const now = new Date();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - rangeDays);

    // Check if date is within range (not too old, not future)
    return dateObj >= cutoffDate && dateObj <= now;
  } catch (error) {
    console.error('[EventPayloadOptimizer] Date parsing error:', date, error);
    return false; // Skip on error
  }
}

/**
 * ============================================
 * SHOULD EMIT EVENT
 * ============================================
 * 
 * Determines if event should be emitted based on date relevance
 * 
 * @param {object} payload - Event payload
 * @param {object} options - Options { skipDateFilter: boolean }
 * @returns {boolean} True if event should be emitted
 */
export function shouldEmitEvent(payload, options = {}) {
  // Allow skipping date filter for specific operations
  if (options.skipDateFilter) {
    return true;
  }

  // Check date relevance
  if (payload.date && !isDateInRelevantRange(payload.date)) {
    console.log(
      `[EventPayloadOptimizer] Skipping event for old date: ${payload.date} (outside ${CONFIG.relevantDateRange}-day range)`
    );
    return false;
  }

  return true;
}

/**
 * ============================================
 * CALCULATE PAYLOAD SIZE
 * ============================================
 * 
 * Calculates approximate payload size in bytes
 * 
 * @param {object} payload - Event payload
 * @returns {number} Size in bytes
 */
export function calculatePayloadSize(payload) {
  try {
    const jsonString = JSON.stringify(payload);
    // Use Buffer for better Node.js compatibility and accurate UTF-8 byte counting
    return Buffer.byteLength(jsonString, 'utf8');
  } catch (error) {
    console.error('[EventPayloadOptimizer] Failed to calculate payload size:', error);
    return 0;
  }
}

/**
 * ============================================
 * VALIDATE PAYLOAD SIZE
 * ============================================
 * 
 * Checks if payload exceeds maximum size and logs warning
 * 
 * @param {object} payload - Event payload
 * @param {string} eventType - Event type for logging
 * @returns {boolean} True if size is acceptable
 */
export function validatePayloadSize(payload, eventType = 'unknown') {
  const size = calculatePayloadSize(payload);

  if (size > CONFIG.maxPayloadSize) {
    console.warn(
      `[EventPayloadOptimizer] Large payload detected for ${eventType}: ${size} bytes (max: ${CONFIG.maxPayloadSize})`
    );
    console.warn('[EventPayloadOptimizer] Payload:', JSON.stringify(payload).substring(0, 200) + '...');
    return false;
  }

  return true;
}

/**
 * ============================================
 * AGGREGATE SYNC EVENTS
 * ============================================
 * 
 * Aggregates multiple sync events into a single summary
 * Used when syncing 50+ dates to prevent overwhelming client
 * 
 * @param {array} syncedMetrics - Array of synced metric objects
 * @returns {object} Aggregated sync summary
 */
export function aggregateSyncEvents(syncedMetrics) {
  if (syncedMetrics.length === 0) {
    return null;
  }

  // Extract dates
  const syncedDates = syncedMetrics.map(m => m.date).sort();

  // Calculate aggregate statistics
  const summary = {
    totalSteps: 0,
    totalCalories: 0,
    totalDistance: 0,
    totalActiveMinutes: 0,
    avgSleepHours: 0,
    sleepCount: 0,
  };

  syncedMetrics.forEach(metric => {
    const m = metric.metrics || {};
    summary.totalSteps += m.steps || 0;
    summary.totalCalories += m.calories || 0;
    summary.totalDistance += m.distance || 0;
    summary.totalActiveMinutes += m.activeMinutes || 0;

    if (m.sleepHours) {
      summary.avgSleepHours += m.sleepHours;
      summary.sleepCount++;
    }
  });

  // Calculate average sleep
  if (summary.sleepCount > 0) {
    summary.avgSleepHours = parseFloat((summary.avgSleepHours / summary.sleepCount).toFixed(1));
  }
  delete summary.sleepCount; // Remove temp field

  // Build optimized payload
  const payload = {
    operation: 'bulk_sync',
    totalDays: syncedMetrics.length,
    syncedDates: syncedDates,
    summary,
    syncedAt: new Date().toISOString(),
  };

  // Only include dates in relevant range
  const relevantDates = syncedDates.filter(date => isDateInRelevantRange(date));
  if (relevantDates.length < syncedDates.length) {
    payload.relevantDates = relevantDates;
    payload.relevantDays = relevantDates.length;
  }

  return payload;
}

/**
 * ============================================
 * SHOULD USE BATCH AGGREGATION
 * ============================================
 * 
 * Determines if sync should use batch aggregation
 * 
 * @param {number} itemCount - Number of items to sync
 * @returns {boolean} True if should aggregate
 */
export function shouldUseBatchAggregation(itemCount) {
  return itemCount >= CONFIG.batchAggregationThreshold;
}

/**
 * ============================================
 * LOG PAYLOAD STATS
 * ============================================
 * 
 * Logs payload statistics for monitoring
 * 
 * @param {object} payload - Event payload
 * @param {string} eventType - Event type
 */
export function logPayloadStats(payload, eventType) {
  const size = calculatePayloadSize(payload);
  console.log(`[EventPayloadOptimizer] ${eventType} payload: ${size} bytes`);

  if (process.env.NODE_ENV === 'development') {
    console.log(`[EventPayloadOptimizer] Payload preview:`, JSON.stringify(payload).substring(0, 150) + '...');
  }
}

export default {
  optimizeMetricPayload,
  isDateInRelevantRange,
  shouldEmitEvent,
  calculatePayloadSize,
  validatePayloadSize,
  aggregateSyncEvents,
  shouldUseBatchAggregation,
  logPayloadStats,
  CONFIG,
};