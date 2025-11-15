/**
 * ============================================
 * EVENTSERVICE TEST COMPONENT
 * ============================================
 *
 * React component for testing EventService functionality
 * Can be used for debugging or demo purposes
 *
 * Usage in App.jsx:
 * import EventServiceTest from './components/test/EventServiceTest';
 *
 * Then add route:
 * <Route path="/test/events" element={<EventServiceTest />} />
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import eventService from '../../services/eventService';
import './EventServiceTest.css';

function EventServiceTest() {
  const { user, token } = useAuth();

  // State
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState(null);
  const [listeningTo, setListeningTo] = useState([]);

  // Event log utilities
  const addEvent = useCallback((type, data) => {
    const timestamp = new Date().toLocaleTimeString();
    setEvents(prev => [{
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp,
      expanded: false
    }, ...prev.slice(0, 99)]); // Keep last 100 events
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  const updateStatus = useCallback(() => {
    setStatus(eventService.getStatus());
  }, []);

  // Setup effect
  useEffect(() => {
    if (!user || !token) return;

    const setupConnection = async () => {
      try {
        // Subscribe to all event types
        const eventTypes = [
          'connected',
          'ping',
          'metrics:change',
          'sync:update',
          'goals:updated',
          'connectionStatus'
        ];

        eventTypes.forEach(type => {
          eventService.on(type, (data) => {
            addEvent(type, data);
          });
        });

        setListeningTo(eventTypes);

        // Connect
        await eventService.connect(token);
        setIsConnected(true);

        // Update status periodically
        const statusInterval = setInterval(() => {
          updateStatus();
        }, 1000);

        return () => {
          clearInterval(statusInterval);
          eventTypes.forEach(type => {
            eventService.off(type, null);
          });
        };
      } catch (error) {
        console.error('Setup error:', error);
        setIsConnected(false);
      }
    };

    setupConnection();
  }, [user, token, addEvent, updateStatus]);

  const handleDisconnect = () => {
    eventService.disconnect();
    setIsConnected(false);
    clearEvents();
  };

  const handleReconnect = async () => {
    try {
      await eventService.connect(token);
      setIsConnected(true);
    } catch (error) {
      console.error('Reconnect error:', error);
    }
  };

  const handleSimulateLoss = () => {
    if (eventService.eventSource) {
      eventService.eventSource.close();
      addEvent('test', { message: 'Connection loss simulated' });
    }
  };

  const handleTestEvent = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/events/debug/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: 'Test event from React component' })
      });

      const data = await response.json();
      addEvent('test', { message: 'Test event triggered', result: data });
    } catch (error) {
      addEvent('error', { message: error.message });
    }
  };

  if (!user) {
    return (
      <div className="event-test-container">
        <div className="error-box">
          Please log in first
        </div>
      </div>
    );
  }

  return (
    <div className="event-test-container">
      <div className="event-test-header">
        <h1>🔌 EventService Testing</h1>
        <p>Real-time SSE connection monitor</p>
      </div>

      {/* Status Panel */}
      <div className="status-panel">
        <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
          <div className="status-dot"></div>
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>

        {status && (
          <div className="status-grid">
            <div className="status-item">
              <label>Ready State:</label>
              <span>{status.readyStateName}</span>
            </div>
            <div className="status-item">
              <label>Retry Count:</label>
              <span>{status.retryCount}/{status.maxRetries}</span>
            </div>
            <div className="status-item">
              <label>Attempts:</label>
              <span>{status.connectionAttempt}</span>
            </div>
            <div className="status-item">
              <label>Last Heartbeat:</label>
              <span>
                {status.lastHeartbeat ? 
                  new Date(status.lastHeartbeat).toLocaleTimeString() :
                  'N/A'
                }
              </span>
            </div>
            <div className="status-item">
              <label>Time Since:</label>
              <span>
                {status.timeSinceHeartbeat ?
                  `${Math.round(status.timeSinceHeartbeat / 1000)}s ago` :
                  'N/A'
                }
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Control Panel */}
      <div className="control-panel">
        <h2>Controls</h2>
        <div className="control-buttons">
          <button 
            onClick={handleDisconnect} 
            disabled={!isConnected}
            className="btn-danger"
          >
            Disconnect
          </button>
          <button 
            onClick={handleReconnect} 
            disabled={isConnected}
            className="btn-primary"
          >
            Reconnect
          </button>
          <button 
            onClick={handleSimulateLoss}
            disabled={!isConnected}
            className="btn-warning"
          >
            Simulate Loss
          </button>
          <button 
            onClick={handleTestEvent}
            disabled={!isConnected}
            className="btn-info"
          >
            Send Test Event
          </button>
          <button 
            onClick={clearEvents}
            className="btn-secondary"
          >
            Clear Events
          </button>
        </div>
      </div>

      {/* Listeners Panel */}
      <div className="listeners-panel">
        <h2>📡 Listening To ({listeningTo.length})</h2>
        <div className="listeners-list">
          {listeningTo.map(type => (
            <span key={type} className="listener-tag">{type}</span>
          ))}
        </div>
      </div>

      {/* Events Log */}
      <div className="events-panel">
        <h2>📋 Event Log ({events.length})</h2>
        <div className="events-list">
          {events.length === 0 ? (
            <div className="empty-state">
              Waiting for events...
            </div>
          ) : (
            events.map(event => (
              <EventLogItem 
                key={event.id} 
                event={event} 
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Single event log item
 */
function EventLogItem({ event }) {
  const [expanded, setExpanded] = useState(false);

  const getEventColor = (type) => {
    const colors = {
      'connected': '#10b981',
      'ping': '#f59e0b',
      'metrics:change': '#3b82f6',
      'sync:update': '#8b5cf6',
      'goals:updated': '#ec4899',
      'connectionStatus': '#6366f1',
      'error': '#ef4444',
      'test': '#06b6d4'
    };
    return colors[type] || '#6b7280';
  };

  return (
    <div 
      className="event-item"
      style={{ borderLeftColor: getEventColor(event.type) }}
    >
      <div 
        className="event-header"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="event-type">{event.type}</span>
        <span className="event-time">{event.timestamp}</span>
        <span className="event-expand">
          {expanded ? '▼' : '▶'}
        </span>
      </div>

      {expanded && (
        <div className="event-body">
          <pre>{JSON.stringify(event.data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default EventServiceTest;
