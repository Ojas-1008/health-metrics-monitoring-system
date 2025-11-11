/**
 * SSE Service for Real-Time Updates
 */

let eventSource = null;
let reconnectTimeout = null;
const RECONNECT_DELAY = 3000; // 3 seconds

/**
 * Connect to SSE stream
 */
export const connectSSE = (token, callbacks = {}) => {
  if (eventSource) {
    console.warn('[SSE] Connection already exists');
    return;
  }

  // SECURITY NOTE: Passing JWT in query parameter
  // The server accepts tokens via query param for EventSource compatibility
  // Token is validated server-side before establishing SSE connection
  const url = `${import.meta.env.VITE_API_URL}/events/stream?token=${encodeURIComponent(token)}`;

  eventSource = new EventSource(url);

  eventSource.onopen = () => {
    console.log('[SSE] Connection established');
    callbacks.onConnect?.();
  };

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('[SSE] Received event:', data.type, data);

      // Route to specific callbacks
      switch (data.type) {
        case 'connected':
          callbacks.onConnected?.(data);
          break;
        case 'ping':
          // Heartbeat - no action needed
          break;
        case 'metrics:updated':
          callbacks.onMetricsUpdate?.(data.data);
          break;
        case 'goals:updated':
          callbacks.onGoalsUpdate?.(data.data);
          break;
        case 'googlefit:synced':
          callbacks.onGoogleFitSync?.(data.data);
          break;
        default:
          callbacks.onUnknownEvent?.(data);
      }
    } catch (error) {
      console.error('[SSE] Failed to parse event:', error);
    }
  };

  eventSource.onerror = (error) => {
    console.error('[SSE] Connection error:', error);
    callbacks.onError?.(error);

    // Auto-reconnect after delay
    disconnectSSE();
    reconnectTimeout = setTimeout(() => {
      console.log('[SSE] Attempting to reconnect...');
      connectSSE(token, callbacks);
    }, RECONNECT_DELAY);
  };

  return eventSource;
};

/**
 * Disconnect from SSE stream
 */
export const disconnectSSE = () => {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  if (eventSource) {
    eventSource.close();
    eventSource = null;
    console.log('[SSE] Connection closed');
  }
};

/**
 * Check if SSE is connected
 */
export const isSSEConnected = () => {
  return eventSource !== null && eventSource.readyState === EventSource.OPEN;
};