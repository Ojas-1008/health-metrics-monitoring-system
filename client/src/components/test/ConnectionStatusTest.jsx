/**
 * ============================================
 * CONNECTION STATUS TEST COMPONENT
 * ============================================
 *
 * Test component for SSE connection status functionality
 * Exposes connection status to browser console for testing
 */

import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * ConnectionStatusTest Component
 *
 * Displays current SSE connection status and exposes it to browser console
 * for testing purposes.
 */
const ConnectionStatusTest = () => {
  const { connectionStatus, getConnectionStatus, isAuthenticated } = useAuth();

  // Expose connection status to browser console for testing
  useEffect(() => {
    // Make connection status available in browser console
    window.getConnectionStatus = getConnectionStatus;
    window.connectionStatus = connectionStatus;

    // Log current status
    console.log('🔗 Connection Status Test Component Mounted');
    console.log('📊 Current connection status:', connectionStatus);
    console.log('🔑 Is authenticated:', isAuthenticated);

    // Instructions for console testing
    console.log('💡 Console Testing Commands:');
    console.log('   window.getConnectionStatus() - Get current status');
    console.log('   window.connectionStatus - Direct access to status object');

    return () => {
      // Cleanup when component unmounts
      delete window.getConnectionStatus;
      delete window.connectionStatus;
      console.log('🧹 Connection Status Test Component Unmounted');
    };
  }, [connectionStatus, getConnectionStatus, isAuthenticated]);

  // Update window object when status changes
  useEffect(() => {
    window.connectionStatus = connectionStatus;
  }, [connectionStatus]);

  const getStatusColor = (status) => {
    if (status.connected) return 'text-green-600';
    if (status.reason === 'connecting') return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (status) => {
    if (status.connected) return '🟢';
    if (status.reason === 'connecting') return '🟡';
    return '🔴';
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-gray-800">
        🔗 SSE Connection Status Test
      </h2>

      <div className="space-y-4">
        {/* Authentication Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
          <span className="font-medium">Authentication:</span>
          <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
            {isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}
          </span>
        </div>

        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
          <span className="font-medium">SSE Connection:</span>
          <span className={getStatusColor(connectionStatus)}>
            {getStatusIcon(connectionStatus)} {connectionStatus.connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {/* Connection Details */}
        <div className="p-3 bg-gray-50 rounded">
          <h3 className="font-medium mb-2">Connection Details:</h3>
          <pre className="text-xs text-gray-600 whitespace-pre-wrap">
            {JSON.stringify(connectionStatus, null, 2)}
          </pre>
        </div>

        {/* Console Testing Instructions */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-medium mb-2 text-blue-800">Console Testing:</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <div><code>window.getConnectionStatus()</code> - Get current status</div>
            <div><code>window.connectionStatus</code> - Direct access to status object</div>
          </div>
        </div>

        {/* Test Actions */}
        <div className="space-y-2">
          <button
            onClick={() => {
              const status = getConnectionStatus();
              console.log('📊 Manual status check:', status);
              alert(`Connection Status: ${JSON.stringify(status, null, 2)}`);
            }}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Test getConnectionStatus()
          </button>

          <button
            onClick={() => {
              console.log('🔄 Current connectionStatus:', connectionStatus);
              console.log('🔄 Window.connectionStatus:', window.connectionStatus);
            }}
            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Log Status to Console
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectionStatusTest;
