/**
 * ============================================
 * EVENT DEDUPLICATION DEBUG PANEL
 * ============================================
 *
 * Purpose: Display deduplication statistics for debugging
 */

import { useState, useEffect } from 'react';
import eventService from '../../services/eventService';

const EventDeduplicationDebug = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(eventService.getDeduplicationStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!stats || import.meta.env.PROD) {
    return null; // Only show in development
  }

  return (
    <div className="fixed bottom-4 left-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg text-xs font-mono z-50">
      <h3 className="font-bold mb-2">Event Deduplication Stats</h3>

      <div className="space-y-1">
        <div>Total Events: {stats.totalEvents}</div>
        <div>Unique Events: {stats.uniqueEvents}</div>
        <div className="text-red-400">
          Duplicates: {stats.duplicatesDetected} ({stats.deduplicationRate})
        </div>
      </div>

      <hr className="my-2 border-gray-700" />

      <div className="space-y-1">
        <div>Cache Size: {stats.cacheStats.size}/{stats.cacheStats.capacity}</div>
        <div>Cache Hits: {stats.cacheStats.hits}</div>
        <div>Cache Misses: {stats.cacheStats.misses}</div>
        <div>Hit Rate: {(stats.cacheStats.hitRate * 100).toFixed(1)}%</div>
        <div>Evictions: {stats.cacheStats.evictions}</div>
        <div>Expirations: {stats.cacheStats.expirations}</div>
      </div>

      <button
        onClick={() => eventService.clearEventCache()}
        className="mt-2 px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-white w-full"
      >
        Clear Cache
      </button>
    </div>
  );
};

export default EventDeduplicationDebug;