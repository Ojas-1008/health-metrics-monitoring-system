/**
 * ============================================
 * SSE EVENT SERVICE (WITH STATE MANAGEMENT)
 * ============================================
 * 
 * Real-time event streaming service using Server-Sent Events (SSE)
 * ENHANCED: Comprehensive connection state management + Event deduplication
 * 
 * Features:
 * - State machine: connecting → connected → disconnected → reconnecting → error
 * - Error message tracking and user-friendly descriptions
 * - sessionStorage persistence for retry count
 * - Detailed connection status events
 * - Automatic reconnection with exponential backoff
 * - Event type routing
 * - Event deduplication with LRU cache
 * - Debug logging
 */

import LRUCache from '../utils/LRUCache.js';

/**
 * ============================================
 * CONFIGURATION
 * ============================================
 */
const CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  endpoint: '/events/stream',
  maxRetries: 10,
  initialRetryDelay: 1000,
  maxRetryDelay: 30000,
  heartbeatTimeout: 60000,
  debug: import.meta.env.DEV,
  
  // NEW: Deduplication cache config
  deduplication: {
    enabled: true,
    cacheSize: 50, // Last 50 events
    maxAge: 60000, // 60 seconds
  },
  
  // NEW: sessionStorage keys
  storageKeys: {
    retryCount: 'sse_retry_count',
    lastDisconnect: 'sse_last_disconnect',
  },
};

/**
 * ============================================
 * CONNECTION STATES (State Machine)
 * ============================================
 */
const ConnectionState = {
  NOT_INITIALIZED: 'not_initialized',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error',
  MAX_RETRIES_EXCEEDED: 'max_retries_exceeded',
};

/**
 * ============================================
 * USER-FRIENDLY ERROR MESSAGES
 * ============================================
 */
const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: 'Network connection lost. Please check your internet connection.',
  TIMEOUT: 'Connection timed out. Retrying...',
  REFUSED: 'Unable to connect to server. Please try again later.',
  
  // Server errors
  SERVER_ERROR: 'Server error occurred. Our team has been notified.',
  UNAUTHORIZED: 'Authentication failed. Please log in again.',
  FORBIDDEN: 'Access denied. Please check your permissions.',
  NOT_FOUND: 'Service endpoint not found. Please contact support.',
  
  // Client errors
  TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  INVALID_TOKEN: 'Invalid authentication token. Please log in again.',
  
  // Retry errors
  MAX_RETRIES: 'Unable to establish connection after multiple attempts. Please refresh the page.',
  MANUAL_DISCONNECT: 'Disconnected manually.',
  
  // Generic
  UNKNOWN: 'An unexpected error occurred. Please try again.',
};

/**
 * ============================================
 * EVENT SERVICE CLASS
 * ============================================
 */
class EventService {
  constructor() {
    this.eventSource = null;
    
    // NEW: Connection state machine
    this.state = ConnectionState.NOT_INITIALIZED;
    this.previousState = null;
    
    // Connection metadata
    this.isConnected = false;
    this.isManualDisconnect = false;
    this.connectionAttempt = 0;
    
    // Authentication
    this.token = null;
    
    // Event listeners
    this.listeners = new Map();
    
    // Reconnection
    this.reconnectTimeout = null;
    
    // NEW: Enhanced error tracking
    this.lastError = null;
    this.lastErrorMessage = null;
    this.lastDisconnectReason = null;
    
    // NEW: Persistent retry count (survives page refresh)
    this.retryCount = this.loadRetryCount();
    
    // Heartbeat monitoring
    this.lastHeartbeat = null;
    this.heartbeatCheckInterval = null;
    
    // NEW: LRU cache for event deduplication
    this.eventCache = new LRUCache(
      CONFIG.deduplication.cacheSize,
      CONFIG.deduplication.maxAge
    );
    
    // Statistics
    this.deduplicationStats = {
      totalEvents: 0,
      duplicatesDetected: 0,
      uniqueEvents: 0,
    };
    
    // Bind methods
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.on = this.on.bind(this);
    this.off = this.off.bind(this);
  }

  /**
   * ============================================
   * STATE MANAGEMENT
   * ============================================
   */

  /**
   * Set connection state and emit status event
   */
  setState(newState, reason = null, error = null) {
    if (this.state === newState && !reason && !error) {
      return; // No change
    }

    this.previousState = this.state;
    this.state = newState;

    console.log(
      `[EventService] State transition: ${this.previousState} → ${newState}`,
      reason ? `(${reason})` : ''
    );

    // Update error tracking
    if (error) {
      this.lastError = error;
      this.lastErrorMessage = this.getUserFriendlyErrorMessage(error, reason);
    } else if (newState === ConnectionState.CONNECTED) {
      // Clear errors on successful connection
      this.lastError = null;
      this.lastErrorMessage = null;
      this.lastDisconnectReason = null;
    }

    // Update isConnected flag
    this.isConnected = newState === ConnectionState.CONNECTED;

    // Emit connectionStatus event
    this.emit('connectionStatus', {
      state: newState,
      previousState: this.previousState,
      connected: this.isConnected,
      reason: reason || undefined,
      error: this.lastErrorMessage || undefined,
      retryCount: this.retryCount,
      maxRetries: CONFIG.maxRetries,
      timestamp: new Date().toISOString(),
      readyState: this.eventSource?.readyState,
      readyStateName: this.getReadyStateName(),
    });
  }

  /**
   * Get user-friendly error message
   */
  getUserFriendlyErrorMessage(error, reason) {
    // Check for specific error types
    if (reason === 'token_expired') return ERROR_MESSAGES.TOKEN_EXPIRED;
    if (reason === 'invalid_token') return ERROR_MESSAGES.INVALID_TOKEN;
    if (reason === 'unauthorized') return ERROR_MESSAGES.UNAUTHORIZED;
    if (reason === 'forbidden') return ERROR_MESSAGES.FORBIDDEN;
    if (reason === 'not_found') return ERROR_MESSAGES.NOT_FOUND;
    if (reason === 'max_retries') return ERROR_MESSAGES.MAX_RETRIES;
    if (reason === 'manual') return ERROR_MESSAGES.MANUAL_DISCONNECT;

    // Check error object
    if (error) {
      if (error.name === 'NetworkError' || error.message?.includes('network')) {
        return ERROR_MESSAGES.NETWORK_ERROR;
      }
      if (error.message?.includes('timeout')) {
        return ERROR_MESSAGES.TIMEOUT;
      }
      if (error.message?.includes('refused') || error.message?.includes('ECONNREFUSED')) {
        return ERROR_MESSAGES.REFUSED;
      }
      if (error.status === 401) {
        return ERROR_MESSAGES.UNAUTHORIZED;
      }
      if (error.status === 403) {
        return ERROR_MESSAGES.FORBIDDEN;
      }
      if (error.status === 404) {
        return ERROR_MESSAGES.NOT_FOUND;
      }
      if (error.status >= 500) {
        return ERROR_MESSAGES.SERVER_ERROR;
      }
    }

    return ERROR_MESSAGES.UNKNOWN;
  }

  /**
   * ============================================
   * SESSIONSTORAGE PERSISTENCE
   * ============================================
   */

  /**
   * Load retry count from sessionStorage
   */
  loadRetryCount() {
    try {
      const stored = sessionStorage.getItem(CONFIG.storageKeys.retryCount);
      return stored ? parseInt(stored, 10) : 0;
    } catch (error) {
      console.warn('[EventService] Failed to load retry count from sessionStorage:', error);
      return 0;
    }
  }

  /**
   * Save retry count to sessionStorage
   */
  saveRetryCount() {
    try {
      sessionStorage.setItem(CONFIG.storageKeys.retryCount, this.retryCount.toString());
    } catch (error) {
      console.warn('[EventService] Failed to save retry count to sessionStorage:', error);
    }
  }

  /**
   * Reset retry count (on successful connection)
   */
  resetRetryCount() {
    this.retryCount = 0;
    try {
      sessionStorage.removeItem(CONFIG.storageKeys.retryCount);
    } catch (error) {
      console.warn('[EventService] Failed to clear retry count from sessionStorage:', error);
    }
  }

  /**
   * Save last disconnect timestamp
   */
  saveLastDisconnect(reason) {
    try {
      sessionStorage.setItem(CONFIG.storageKeys.lastDisconnect, JSON.stringify({
        timestamp: Date.now(),
        reason,
      }));
    } catch (error) {
      console.warn('[EventService] Failed to save last disconnect:', error);
    }
  }

  /**
   * ============================================
   * CONNECT TO SSE STREAM
   * ============================================
   */
  async connect(token) {
    if (this.eventSource && this.isConnected) {
      this.log('Already connected, ignoring connect request');
      return;
    }

    this.token = token;
    this.isManualDisconnect = false;
    this.connectionAttempt++;

    // Set connecting state
    this.setState(
      this.retryCount > 0 ? ConnectionState.RECONNECTING : ConnectionState.CONNECTING,
      this.retryCount > 0 ? `Attempt ${this.retryCount + 1}/${CONFIG.maxRetries}` : 'Initial connection'
    );

    try {
      this.log(`Connection attempt ${this.connectionAttempt}...`);

      const url = `${CONFIG.baseUrl}${CONFIG.endpoint}?token=${encodeURIComponent(token)}`;
      this.eventSource = new EventSource(url);

      // ===== EVENT HANDLERS =====

      this.eventSource.addEventListener('open', () => {
        this.log('✓ Connection established');
        
        // Set connected state
        this.setState(ConnectionState.CONNECTED, 'Connection opened');
        
        // Reset retry count on successful connection
        this.resetRetryCount();
        
        this.lastHeartbeat = Date.now();
        this.startHeartbeatMonitoring();
      });

      this.eventSource.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          this.log('Received message:', data);
          
          if (data.type) {
            this.emit(data.type, data.data || data);
          }
        } catch (error) {
          this.logError('Failed to parse message:', error);
        }
      });

      // Custom event types
      this.eventSource.addEventListener('connected', (event) => {
        try {
          const data = JSON.parse(event.data);
          this.log('Connection confirmed:', data);
          this.emit('connected', data);
        } catch (error) {
          this.logError('Failed to parse connected event:', error);
        }
      });

      this.eventSource.addEventListener('ping', (event) => {
        try {
          const data = JSON.parse(event.data);
          this.log('Heartbeat received');
          this.lastHeartbeat = Date.now();
          this.emit('ping', data);
        } catch (error) {
          this.logError('Failed to parse ping event:', error);
        }
      });

      this.eventSource.addEventListener('metrics:change', (event) => {
        try {
          const data = JSON.parse(event.data);
          this.log('Metrics changed:', data.data?.operation);
          this.emit('metrics:change', data.data);
        } catch (error) {
          this.logError('Failed to parse metrics:change event:', error);
        }
      });

      this.eventSource.addEventListener('sync:update', (event) => {
        try {
          const data = JSON.parse(event.data);
          this.log('Sync update received:', data.data?.totalDays, 'days');
          this.emit('sync:update', data.data);
        } catch (error) {
          this.logError('Failed to parse sync:update event:', error);
        }
      });

      this.eventSource.addEventListener('goals:updated', (event) => {
        try {
          const data = JSON.parse(event.data);
          this.log('Goals updated');
          this.emit('goals:updated', data.data);
        } catch (error) {
          this.logError('Failed to parse goals:updated event:', error);
        }
      });

      this.eventSource.addEventListener('error', (event) => {
        this.logError('EventSource error:', event);
        
        // Set error state
        this.setState(ConnectionState.ERROR, 'Connection error', event);
        
        if (this.eventSource.readyState === EventSource.CLOSED) {
          this.log('Connection closed by server');
          
          // Set disconnected state
          this.setState(ConnectionState.DISCONNECTED, 'closed');
          
          this.stopHeartbeatMonitoring();
          this.saveLastDisconnect('closed');
          
          if (!this.isManualDisconnect) {
            this.scheduleReconnection();
          }
        } else if (this.eventSource.readyState === EventSource.CONNECTING) {
          this.log('Attempting to reconnect...');
          this.setState(ConnectionState.RECONNECTING, 'Auto-reconnecting');
        }
      });

    } catch (error) {
      this.logError('Failed to connect:', error);
      
      // Set error state
      this.setState(ConnectionState.ERROR, 'Connection failed', error);
      
      if (!this.isManualDisconnect) {
        this.scheduleReconnection();
      }
    }
  }

  /**
   * ============================================
   * DISCONNECT
   * ============================================
   */
  disconnect() {
    this.log('Disconnecting...');
    
    this.isManualDisconnect = true;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.stopHeartbeatMonitoring();
    
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    // Set disconnected state
    this.setState(ConnectionState.DISCONNECTED, 'manual');
    
    this.saveLastDisconnect('manual');
    this.resetRetryCount();
    
    // NEW: Clear event cache on disconnect
    this.eventCache.clear();
    
    this.log('✓ Disconnected');
  }

  /**
   * ============================================
   * SCHEDULE RECONNECTION
   * ============================================
   */
  scheduleReconnection() {
    if (this.retryCount >= CONFIG.maxRetries) {
      this.logError(`Max reconnection attempts (${CONFIG.maxRetries}) reached`);
      
      // Set max retries exceeded state
      this.setState(ConnectionState.MAX_RETRIES_EXCEEDED, 'max_retries');
      
      return;
    }

    const delay = Math.min(
      CONFIG.initialRetryDelay * Math.pow(2, this.retryCount),
      CONFIG.maxRetryDelay
    );

    this.retryCount++;
    this.saveRetryCount();

    this.log(
      `Scheduling reconnection attempt ${this.retryCount}/${CONFIG.maxRetries} in ${delay}ms (${(delay / 1000).toFixed(1)}s)`
    );

    // Set reconnecting state
    this.setState(
      ConnectionState.RECONNECTING,
      `Retrying in ${(delay / 1000).toFixed(0)}s`
    );

    this.reconnectTimeout = setTimeout(() => {
      if (!this.isManualDisconnect && this.token) {
        this.log(`Reconnecting now (attempt ${this.retryCount})...`);
        this.connect(this.token);
      }
    }, delay);
  }

  /**
   * ============================================
   * HEARTBEAT MONITORING
   * ============================================
   */
  startHeartbeatMonitoring() {
    this.stopHeartbeatMonitoring();

    this.heartbeatCheckInterval = setInterval(() => {
      const timeSinceLastHeartbeat = Date.now() - (this.lastHeartbeat || 0);
      
      if (timeSinceLastHeartbeat > CONFIG.heartbeatTimeout) {
        this.logError(
          `No heartbeat received for ${(timeSinceLastHeartbeat / 1000).toFixed(0)}s, connection may be dead`
        );
        
        // Force reconnection
        this.setState(ConnectionState.DISCONNECTED, 'heartbeat_timeout');
        this.saveLastDisconnect('heartbeat_timeout');
        
        this.disconnect();
        if (this.token) {
          this.connect(this.token);
        }
      }
    }, 10000);
  }

  stopHeartbeatMonitoring() {
    if (this.heartbeatCheckInterval) {
      clearInterval(this.heartbeatCheckInterval);
      this.heartbeatCheckInterval = null;
    }
  }

  /**
   * ============================================
   * EVENT SUBSCRIPTION
   * ============================================
   */
  on(eventType, callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType).add(callback);
    this.log(`Subscribed to ${eventType} (${this.listeners.get(eventType).size} listener(s))`);
  }

  off(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      return;
    }

    this.listeners.get(eventType).delete(callback);
    this.log(
      `Unsubscribed from ${eventType} (${this.listeners.get(eventType).size} listener(s) remaining)`
    );

    if (this.listeners.get(eventType).size === 0) {
      this.listeners.delete(eventType);
    }
  }

  /**
   * ============================================
   * GENERATE EVENT ID
   * ============================================
   * 
   * Creates a unique identifier for each event to detect duplicates
   * Format: {eventType}:{date}:{documentId}:{keyMetrics}:{timestamp}
   * 
   * For metrics:change events, focuses on actual data rather than operation type
   * to properly deduplicate controller emissions vs change stream emissions
   * 
   * @param {string} eventType - Type of event (e.g., 'metrics:change')
   * @param {object} eventData - Event data payload
   * @returns {string} Unique event ID
   */
  generateEventId(eventType, eventData) {
    // Build ID from event characteristics
    const parts = [eventType];

    // Special handling for metrics:change events
    if (eventType === 'metrics:change') {
      // Focus on the actual data that changed, not the operation type
      if (eventData.date) {
        parts.push(eventData.date);
      }
      
      // Include document ID if available
      if (eventData.documentId) {
        parts.push(eventData.documentId);
      }
      
      // Include key metrics to detect same data changes
      if (eventData.metrics) {
        const keyMetrics = ['steps', 'calories', 'distance', 'activeMinutes'].map(key => 
          eventData.metrics[key] != null ? `${key}:${eventData.metrics[key]}` : ''
        ).filter(Boolean).sort().join('|');
        if (keyMetrics) {
          parts.push(keyMetrics);
        }
      }
    } else {
      // For other events, use the original logic
      if (eventData.date) {
        parts.push(eventData.date);
      }
      if (eventData.operation) {
        parts.push(eventData.operation);
      }
      if (eventData.documentId) {
        parts.push(eventData.documentId);
      }
    }

    // Add timestamp for truly unique ID (but allows deduplication within time window)
    // We truncate to seconds to allow deduplication of events within same second
    if (eventData.timestamp) {
      const secondTimestamp = Math.floor(new Date(eventData.timestamp).getTime() / 1000);
      parts.push(secondTimestamp.toString());
    }

    return parts.join(':');
  }

  /**
   * ============================================
   * CHECK AND CACHE EVENT (DEDUPLICATION)
   * ============================================
   * 
   * Checks if event was already processed, caches it if new
   * 
   * @param {string} eventType - Type of event
   * @param {object} eventData - Event data payload
   * @returns {boolean} True if event is new (should be processed)
   */
  checkAndCacheEvent(eventType, eventData) {
    if (!CONFIG.deduplication.enabled) {
      return true; // Deduplication disabled, process all events
    }

    this.deduplicationStats.totalEvents++;

    // Generate unique event ID
    const eventId = this.generateEventId(eventType, eventData);

    // Check if event already processed
    if (this.eventCache.has(eventId)) {
      this.deduplicationStats.duplicatesDetected++;
      
      this.log(`[Deduplication] Duplicate event detected and ignored: ${eventId}`);
      
      if (CONFIG.debug) {
        console.log('[EventService] Duplicate event details:', {
          eventType,
          eventId,
          eventData: JSON.stringify(eventData).substring(0, 100) + '...',
          cacheStats: this.eventCache.getStats(),
        });
      }

      return false; // Duplicate, skip processing
    }

    // New event - cache it
    this.eventCache.set(eventId, {
      eventType,
      timestamp: Date.now(),
      processed: true,
    });

    this.deduplicationStats.uniqueEvents++;

    return true; // New event, process it
  }

  /**
   * ============================================
   * GET DEDUPLICATION STATS
   * ============================================
   * 
   * @returns {object} Deduplication statistics
   */
  getDeduplicationStats() {
    return {
      ...this.deduplicationStats,
      deduplicationRate: this.deduplicationStats.totalEvents > 0
        ? (this.deduplicationStats.duplicatesDetected / this.deduplicationStats.totalEvents * 100).toFixed(2) + '%'
        : '0%',
      cacheStats: this.eventCache.getStats(),
    };
  }

  /**
   * ============================================
   * CLEAR DEDUPLICATION CACHE
   * ============================================
   * 
   * Manually clear the event cache (useful for testing)
   */
  clearEventCache() {
    this.eventCache.clear();
    this.log('Event cache cleared');
  }

  /**
   * ============================================
   * EMIT EVENT TO SUBSCRIBERS (WITH DEDUPLICATION)
   * ============================================
   * 
   * Enhanced emit method that checks for duplicates before dispatching
   */
  emit(eventType, data) {
    // Check for duplicate before emitting
    if (!this.checkAndCacheEvent(eventType, data)) {
      // Duplicate detected, don't emit
      return;
    }

    // Not a duplicate, proceed with normal emission
    if (!this.listeners.has(eventType)) {
      return;
    }

    const listeners = this.listeners.get(eventType);
    
    this.log(`Emitting ${eventType} to ${listeners.size} listener(s)`);

    listeners.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        this.logError(`Error in ${eventType} listener:`, error);
      }
    });
  }

  /**
   * ============================================
   * GET STATUS
   * ============================================
   */
  getStatus() {
    return {
      // State machine
      state: this.state,
      previousState: this.previousState,
      
      // Connection
      connected: this.isConnected,
      readyState: this.eventSource ? this.eventSource.readyState : null,
      readyStateName: this.getReadyStateName(),
      
      // Retry tracking
      retryCount: this.retryCount,
      maxRetries: CONFIG.maxRetries,
      
      // Error tracking
      lastError: this.lastError,
      lastErrorMessage: this.lastErrorMessage,
      lastDisconnectReason: this.lastDisconnectReason,
      
      // Heartbeat
      lastHeartbeat: this.lastHeartbeat,
      timeSinceHeartbeat: this.lastHeartbeat ? Date.now() - this.lastHeartbeat : null,
      
      // NEW: Deduplication stats
      deduplication: this.getDeduplicationStats(),
      
      // Metadata
      connectionAttempt: this.connectionAttempt,
    };
  }

  /**
   * ============================================
   * CLEANUP (NEW)
   * ============================================
   * 
   * Destroy cache and cleanup resources
   */
  destroy() {
    this.disconnect();
    this.eventCache.destroy();
    this.log('EventService destroyed');
  }

  getReadyStateName() {
    if (!this.eventSource) return 'not_initialized';
    
    switch (this.eventSource.readyState) {
      case EventSource.CONNECTING:
        return 'connecting';
      case EventSource.OPEN:
        return 'open';
      case EventSource.CLOSED:
        return 'closed';
      default:
        return 'unknown';
    }
  }

  /**
   * ============================================
   * LOGGING
   * ============================================
   */
  log(...args) {
    if (CONFIG.debug) {
      console.log('[EventService]', ...args);
    }
  }

  logError(...args) {
    console.error('[EventService]', ...args);
  }
}

/**
 * ============================================
 * SINGLETON EXPORT
 * ============================================
 */
const eventService = new EventService();

export default eventService;
export { EventService, CONFIG, ConnectionState };