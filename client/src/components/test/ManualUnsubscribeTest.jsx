import { useState } from 'react';
import { useRealtimeMetrics } from '../../hooks/useRealtimeEvents';

function ManualUnsubscribeTest() {
  const [eventCount, setEventCount] = useState(0);

  const { isConnected, unsubscribe } = useRealtimeMetrics((data) => {
    console.log('📊 Event received:', data);
    setEventCount(prev => prev + 1);
  });

  const handleManualUnsubscribe = () => {
    unsubscribe();
    console.log('🛑 Manually unsubscribed');
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-bold mb-4">Manual Unsubscribe Test</h3>

      <div className="mb-4">
        Connection: {isConnected ? '🟢' : '🔴'}
      </div>

      <div className="mb-4">
        Events received: {eventCount}
      </div>

      <button
        onClick={handleManualUnsubscribe}
        className="px-4 py-2 bg-red-500 text-white rounded"
      >
        Stop Listening
      </button>
    </div>
  );
}

export default ManualUnsubscribeTest;