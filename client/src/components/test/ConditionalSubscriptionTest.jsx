import { useState } from 'react';
import { useRealtimeMetrics } from '../../hooks/useRealtimeEvents';

function ConditionalSubscriptionTest() {
  const [enabled, setEnabled] = useState(true);

  // Only subscribe when enabled=true
  useRealtimeMetrics(
    enabled ? (data) => {
      console.log('✅ Event received (subscription active):', data);
    } : null // ← Pass null to disable subscription
  );

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-bold mb-4">Conditional Subscription Test</h3>

      <label className="flex items-center space-x-2 mb-4">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        <span>Enable real-time updates</span>
      </label>

      <p className="text-sm text-gray-600">
        {enabled
          ? 'Subscription active. Add a metric to see events.'
          : 'Subscription disabled. No events will be received.'}
      </p>
    </div>
  );
}

export default ConditionalSubscriptionTest;