/**
 * ============================================
 * GOOGLE FIT SERVICE TEST COMPONENT
 * ============================================
 *
 * Purpose: Test googleFitService functions
 */

import { useState, useEffect } from 'react';
import * as googleFitService from '../../services/googleFitService';

const GoogleFitTest = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);

  // Helper to add log entry
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [
      ...prev,
      { timestamp, message, type },
    ]);
    console.log(`[${timestamp}] ${message}`);
  };

  // Test 1: Get connection status on mount
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        addLog('Fetching Google Fit status...', 'info');
        const result = await googleFitService.getConnectionStatus();
        setStatus(result);
        addLog(`Status fetched: ${JSON.stringify(result)}`, 'success');
      } catch (err) {
        addLog(`Error: ${err.message}`, 'error');
        setError(err.message);
      }
    };

    fetchStatus();
  }, []);

  // Test 2: Initiate connection
  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      addLog('Initiating Google Fit connection...', 'info');
      const authUrl = await googleFitService.initiateConnect();

      addLog(`Auth URL received: ${authUrl}`, 'success');
      addLog('Opening OAuth window...', 'info');

      // Open in new window
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      window.open(
        authUrl,
        'GoogleFitOAuth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      addLog('OAuth window opened successfully!', 'success');
    } catch (err) {
      addLog(`Error: ${err.message}`, 'error');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Test 3: Disconnect
  const handleDisconnect = async () => {
    setLoading(true);
    setError(null);

    try {
      addLog('Disconnecting Google Fit...', 'info');
      const result = await googleFitService.disconnectGoogleFit();
      addLog(`Disconnected: ${result.message}`, 'success');

      // Refresh status
      const newStatus = await googleFitService.getConnectionStatus();
      setStatus(newStatus);
    } catch (err) {
      addLog(`Error: ${err.message}`, 'error');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Test 4: Get user profile
  const handleGetProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      addLog('Fetching user profile...', 'info');
      const profile = await googleFitService.getUserProfile();
      addLog(`Profile: ${JSON.stringify(profile)}`, 'success');
    } catch (err) {
      addLog(`Error: ${err.message}`, 'error');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        🧪 Google Fit Service Test
      </h1>

      {/* Current Status */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Current Status</h2>
        {status ? (
          <div>
            <p>
              <strong>Connected:</strong>{' '}
              {status.connected ? '✅ Yes' : '❌ No'}
            </p>
            <p>
              <strong>Active:</strong>{' '}
              {status.isActive ? '✅ Yes' : '❌ No'}
            </p>
            <p>
              <strong>Days Until Expiry:</strong>{' '}
              {status.daysUntilExpiry || 'N/A'}
            </p>
            <p>
              <strong>Last Sync:</strong> {status.lastSync || 'Never'}
            </p>
          </div>
        ) : (
          <p>Loading status...</p>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Test Buttons */}
      <div className="mb-6 space-y-4">
        <button
          onClick={handleConnect}
          disabled={loading}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : '🔗 Test: Initiate Connect'}
        </button>

        <button
          onClick={handleDisconnect}
          disabled={loading || !status?.connected}
          className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : '🔌 Test: Disconnect'}
        </button>

        <button
          onClick={handleGetProfile}
          disabled={loading}
          className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : '👤 Test: Get User Profile'}
        </button>
      </div>

      {/* Logs */}
      <div className="p-4 bg-black text-green-400 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
        <h3 className="text-white font-bold mb-2">Console Logs:</h3>
        {logs.map((log, index) => (
          <div key={index} className={`mb-1 ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : 'text-gray-300'}`}>
            <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GoogleFitTest;