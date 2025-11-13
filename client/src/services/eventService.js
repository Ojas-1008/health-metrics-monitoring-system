/**
 * ============================================
 * SSE EVENT SERVICE
 * ============================================
 *
 * Real-time event streaming service using Server-Sent Events (SSE)
 *
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Event type routing (metrics:change, sync:update, etc.)
 * - Connection state tracking
 * - Authentication via query parameter (EventSource limitation)
 * - Manual disconnect support
 * - Debug logging
 *
 * Usage:
 *
 * import eventService from './services/eventService';
 *
 * // Connect
 * eventService.connect(token);
 *
 * // Subscribe to events
 * eventService.on('metrics:change', (data) => {
 *   console.log('Metrics updated:', data);
 * });
 *
 * eventService.on('sync:update', (data) => {
 *   console.log('Google Fit synced:', data);
 * });
 *
 * eventService.on('connectionStatus', (status) => {
 *   console.log('Connection:', status.connected ? 'online' : 'offline');
 * });
 *
 * // Unsubscribe
 * eventService.off('metrics:change', callback);
 *
 * // Disconnect
 * eventService.disconnect();
 */

/**
 * ============================================
 * CONFIGURATION
 * ============================================
 */
const CONFIG = {
  // SSE endpoint URL
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  endpoint: '/events/stream',

  // Reconnection settings
  maxRetries: 10,
  initialRetryDelay: 1000, // 1 second
  maxRetryDelay: 30000, // 30 seconds

  // Connection health check
  heartbeatTimeout: 60000, // 60 seconds (expect ping every 30s)

  // Debug logging
  debug: import.meta.env.DEV, // Enable in development
};

/**
 * ============================================
 * EVENT SERVICE CLASS
 * ============================================
 */
class EventService {
  constructor() {
    // EventSource instance
    this.eventSource = null;

    // Connection state
    this.isConnected = false;
    this.isManualDisconnect = false;
    this.connectionAttempt = 0;

    // Authentication
    this.token = null;

    // Event listeners Map: eventType -> Set of callbacks
    this.listeners = new Map();

    // Reconnection
    this.reconnectTimeout = null;
    this.retryCount = 0;

    // Heartbeat monitoring
    this.lastHeartbeat = null;
    this.heartbeatCheckInterval = null;

    // Bind methods
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.on = this.on.bind(this);
    this.off = this.off.bind(this);
  }

  /**
   * ============================================
   * CONNECT TO SSE STREAM
   * ============================================
   *
   * Establishes SSE connection with authentication
   *
   * @param {string} token - JWT authentication token
   * @returns {Promise<void>}
   */
  async connect(token) {
    console.log('[EventService] connect() called with token:', token ? 'EXISTS' : 'MISSING');
    
    // Prevent multiple connections
    if (this.eventSource && this.isConnected) {
      this.log('Already connected, ignoring connect request');
      console.log('[EventService] Already connected, ignoring connect request');
      return;
    }

    // Store token for reconnection
    this.token = token;
    this.isManualDisconnect = false;
    this.connectionAttempt++;

    try {
      console.log(`[EventService] Connection attempt ${this.connectionAttempt}...`);
      this.log(`Connection attempt ${this.connectionAttempt}...`);

      // ===== AUTHENTICATION VIA QUERY PARAMETER =====
      // Native EventSource doesn't support custom headers
      // We pass the token as a query parameter (over HTTPS in production)
      const url = `${CONFIG.baseUrl}${CONFIG.endpoint}?token=${encodeURIComponent(token)}`;
      console.log('[EventService] Connecting to SSE endpoint:', url.replace(/token=[^&]+/, 'token=***'));

      // Create EventSource instance
      this.eventSource = new EventSource(url);
      console.log('[EventService] EventSource created, readyState:', this.eventSource.readyState);

      // ===== EVENT HANDLERS =====

      // Connection opened
      this.eventSource.addEventListener('open', (event) => {
        console.log('[EventService] ✓ Connection established (open event fired)');
        this.log('✓ Connection established');
        this.isConnected = true;
        this.retryCount = 0; // Reset retry counter on success
        this.lastHeartbeat = Date.now();

        // Start heartbeat monitoring
        this.startHeartbeatMonitoring();

        // Emit connection status event
        this.emit('connectionStatus', {
          connected: true,
          attempt: this.connectionAttempt,
          timestamp: new Date().toISOString()
        });
      });

      // Generic message handler (for messages without event type)
      this.eventSource.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          this.log('Received message:', data);

          // Route to appropriate handler
          if (data.type) {
            this.emit(data.type, data.data || data);
          }
        } catch (error) {
          this.logError('Failed to parse message:', error);
        }
      });

      // ===== CUSTOM EVENT TYPES =====

      // Connection confirmed
      this.eventSource.addEventListener('connected', (event) => {
        try {
          const data = JSON.parse(event.data);
          this.log('Connection confirmed:', data);
          this.emit('connected', data);
        } catch (error) {
          this.logError('Failed to parse connected event:', error);
        }
      });

      // Heartbeat/ping
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

      // Metrics changed
      this.eventSource.addEventListener('metrics:change', (event) => {
        try {
          const data = JSON.parse(event.data);
          this.log('Metrics changed:', data.data?.operation);
          this.emit('metrics:change', data.data);
        } catch (error) {
          this.logError('Failed to parse metrics:change event:', error);
        }
      });

      // Google Fit sync update
      this.eventSource.addEventListener('sync:update', (event) => {
        try {
          const data = JSON.parse(event.data);
          this.log('Sync update received:', data.data?.totalDays, 'days');
          this.emit('sync:update', data.data);
        } catch (error) {
          this.logError('Failed to parse sync:update event:', error);
        }
      });

      // Goals updated
      this.eventSource.addEventListener('goals:updated', (event) => {
        try {
          const data = JSON.parse(event.data);
          this.log('Goals updated');
          this.emit('goals:updated', data.data);
        } catch (error) {
          this.logError('Failed to parse goals:updated event:', error);
        }
      });

      // Test event (for debugging)
      this.eventSource.addEventListener('test:event', (event) => {
        try {
          const data = JSON.parse(event.data);
          this.log('Test event received:', data);
          this.emit('test:event', data.data);
        } catch (error) {
          this.logError('Failed to parse test:event event:', error);
        }
      });

      // Error handler
      this.eventSource.addEventListener('error', (event) => {
        console.error('[EventService] EventSource error event fired:', event);
        console.error('[EventService] ReadyState:', this.eventSource.readyState, '(CONNECTING=0, OPEN=1, CLOSED=2)');
        this.logError('EventSource error:', event);

        // Check if it's a connection error or HTTP error
        if (this.eventSource.readyState === EventSource.CLOSED) {
          this.log('Connection closed by server');
          this.isConnected = false;

          // Stop heartbeat monitoring
          this.stopHeartbeatMonitoring();

          // Emit connection status event
          this.emit('connectionStatus', {
            connected: false,
            reason: 'closed',
            timestamp: new Date().toISOString()
          });

          // Attempt reconnection if not manually disconnected
          if (!this.isManualDisconnect) {
            this.scheduleReconnection();
          }
        } else if (this.eventSource.readyState === EventSource.CONNECTING) {
          this.log('Attempting to reconnect...');
        }
      });

    } catch (error) {
      this.logError('Failed to connect:', error);

      // Emit connection status event
      this.emit('connectionStatus', {
        connected: false,
        reason: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      });

      // Attempt reconnection
      if (!this.isManualDisconnect) {
        this.scheduleReconnection();
      }
    }
  }

  /**
   * ============================================
   * DISCONNECT FROM SSE STREAM
   * ============================================
   *
   * Manually closes the SSE connection
   * Prevents automatic reconnection
   */
  disconnect() {
    this.log('Disconnecting...');

    // Mark as manual disconnect to prevent reconnection
    this.isManualDisconnect = true;

    // Clear reconnection timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Stop heartbeat monitoring
    this.stopHeartbeatMonitoring();

    // Close EventSource
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.isConnected = false;
    this.retryCount = 0;

    this.log('✓ Disconnected');

    // Emit connection status event
    this.emit('connectionStatus', {
      connected: false,
      reason: 'manual',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * ============================================
   * SCHEDULE RECONNECTION (EXPONENTIAL BACKOFF)
   * ============================================
   *
   * Implements exponential backoff reconnection strategy
   * Delay formula: min(initialDelay * 2^retryCount, maxDelay)
   */
  scheduleReconnection() {
    // Check if max retries exceeded
    if (this.retryCount >= CONFIG.maxRetries) {
      this.logError(`Max reconnection attempts (${CONFIG.maxRetries}) reached`);
      this.emit('connectionStatus', {
        connected: false,
        reason: 'max_retries',
        retryCount: this.retryCount,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Calculate backoff delay
    const delay = Math.min(
      CONFIG.initialRetryDelay * Math.pow(2, this.retryCount),
      CONFIG.maxRetryDelay
    );

    this.retryCount++;

    this.log(
      `Scheduling reconnection attempt ${this.retryCount}/${CONFIG.maxRetries} in ${delay}ms (${(delay / 1000).toFixed(1)}s)`
    );

    // Emit connection status event
    this.emit('connectionStatus', {
      connected: false,
      reason: 'reconnecting',
      retryCount: this.retryCount,
      maxRetries: CONFIG.maxRetries,
      delay,
      timestamp: new Date().toISOString()
    });

    // Schedule reconnection
    this.reconnectTimeout = setTimeout(() => {
      if (!this.isManualDisconnect && this.token) {
        this.log(`Reconnecting now (attempt ${this.retryCount})...`);
        this.connect(this.token);
      }
    }, delay);
  }

  /**
   * ============================================
   * START HEARTBEAT MONITORING
   * ============================================
   *
   * Monitors for missing heartbeats and triggers reconnection
   */
  startHeartbeatMonitoring() {
    this.stopHeartbeatMonitoring(); // Clear any existing interval

    this.heartbeatCheckInterval = setInterval(() => {
      const timeSinceLastHeartbeat = Date.now() - (this.lastHeartbeat || 0);

      if (timeSinceLastHeartbeat > CONFIG.heartbeatTimeout) {
        this.logError(
          `No heartbeat received for ${(timeSinceLastHeartbeat / 1000).toFixed(0)}s, connection may be dead`
        );

        // Force reconnection
        this.disconnect();
        if (this.token) {
          this.connect(this.token);
        }
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * ============================================
   * STOP HEARTBEAT MONITORING
   * ============================================
   */
  stopHeartbeatMonitoring() {
    if (this.heartbeatCheckInterval) {
      clearInterval(this.heartbeatCheckInterval);
      this.heartbeatCheckInterval = null;
    }
  }

  /**
   * ============================================
   * SUBSCRIBE TO EVENT TYPE
   * ============================================
   *
   * @param {string} eventType - Event type to listen for
   * @param {Function} callback - Callback function to invoke
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

  /**
   * ============================================
   * UNSUBSCRIBE FROM EVENT TYPE
   * ============================================
   *
   * @param {string} eventType - Event type to stop listening for
   * @param {Function} callback - Callback function to remove
   */
  off(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      return;
    }

    this.listeners.get(eventType).delete(callback);
    this.log(
      `Unsubscribed from ${eventType} (${this.listeners.get(eventType).size} listener(s) remaining)`
    );

    // Clean up empty listener sets
    if (this.listeners.get(eventType).size === 0) {
      this.listeners.delete(eventType);
    }
  }

  /**
   * ============================================
   * EMIT EVENT TO SUBSCRIBERS
   * ============================================
   *
   * @param {string} eventType - Event type to emit
   * @param {*} data - Event data
   */
  emit(eventType, data) {
    if (!this.listeners.has(eventType)) {
      return;
    }

    const listeners = this.listeners.get(eventType);
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
   * GET CONNECTION STATUS
   * ============================================
   *
   * @returns {object} Connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      readyState: this.eventSource ? this.eventSource.readyState : null,
      readyStateName: this.getReadyStateName(),
      retryCount: this.retryCount,
      maxRetries: CONFIG.maxRetries,
      lastHeartbeat: this.lastHeartbeat,
      timeSinceHeartbeat: this.lastHeartbeat ? Date.now() - this.lastHeartbeat : null,
      connectionAttempt: this.connectionAttempt
    };
  }

  /**
   * ============================================
   * GET READY STATE NAME
   * ============================================
   *
   * @returns {string} Human-readable ready state
   */
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
   * DEBUG LOGGING
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
 * SINGLETON INSTANCE
 * ============================================
 *
 * Export a singleton instance to ensure single connection
 */
const eventService = new EventService();

export default eventService;

/**
 * ============================================
 * NAMED EXPORTS (for testing)
 * ============================================
 */
export { EventService, CONFIG };