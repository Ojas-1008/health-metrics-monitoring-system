import { useState } from 'react';
import { useRealtimeMetrics } from '../../hooks/useRealtimeEvents';

function FilteredMetricsTest() {
  const [filter, setFilter] = useState('steps');
  const [filteredEvents, setFilteredEvents] = useState([]);

  // Callback depends on 'filter' state
  useRealtimeMetrics((data) => {
    if (data.metrics && data.metrics[filter] !== undefined) {
      console.log(`${filter} updated:`, data.metrics[filter]);
      setFilteredEvents(prev => [
        ...prev,
        { metric: filter, value: data.metrics[filter], date: data.date }
      ]);
    }
  }, [filter]); // ← Recreate callback when filter changes

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-bold mb-4">Filtered Events Test</h3>

      {/* Filter selector */}
      <div className="mb-4 space-x-2">
        {['steps', 'calories', 'distance', 'activeMinutes'].map(metric => (
          <button
            key={metric}
            onClick={() => setFilter(metric)}
            className={`px-3 py-1 rounded ${
              filter === metric
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200'
            }`}
          >
            {metric}
          </button>
        ))}
      </div>

      {/* Filtered events log */}
      <div className="space-y-2">
        <h4 className="font-semibold">
          Watching: {filter} ({filteredEvents.length} events)
        </h4>
        {filteredEvents.map((event, i) => (
          <div key={i} className="p-2 bg-gray-50 rounded text-sm">
            {event.date}: {event.metric} = {event.value}
          </div>
        ))}
      </div>
    </div>
  );
}

export default FilteredMetricsTest;