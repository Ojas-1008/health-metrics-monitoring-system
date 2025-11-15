/**
 * ============================================
 * LRU CACHE WITH TIME-BASED EXPIRY
 * ============================================
 * 
 * Purpose: Least Recently Used cache for event deduplication
 * 
 * Features:
 * - O(1) get and set operations using Map
 * - Automatic eviction of least recently used items when capacity reached
 * - Time-based expiry for all entries
 * - Efficient cleanup of expired entries
 * - Debug logging
 * 
 * Usage:
 * const cache = new LRUCache(50, 60000); // 50 items, 60s expiry
 * cache.set('key1', { data: 'value' });
 * const value = cache.get('key1'); // Returns { data: 'value' } or null if expired
 * const exists = cache.has('key1'); // Returns true/false
 */

class LRUCache {
  /**
   * Initialize LRU Cache
   * 
   * @param {number} capacity - Maximum number of items to store
   * @param {number} maxAge - Maximum age of items in milliseconds (default: 60000ms = 60s)
   */
  constructor(capacity = 50, maxAge = 60000) {
    this.capacity = capacity;
    this.maxAge = maxAge;
    
    // Use Map for O(1) operations and insertion order preservation
    this.cache = new Map();
    
    // Track expiry times: Map<key, expiryTimestamp>
    this.expiryTimes = new Map();
    
    // Debug mode
    this.debug = import.meta.env?.DEV || false;
    
    // Statistics
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      expirations: 0,
      sets: 0,
    };
    
    // Periodic cleanup of expired entries
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 10000); // Cleanup every 10 seconds
    
    this.log(`LRUCache initialized: capacity=${capacity}, maxAge=${maxAge}ms`);
  }

  /**
   * ============================================
   * GET: Retrieve value by key
   * ============================================
   * 
   * @param {string} key - Cache key
   * @returns {*} Cached value or null if not found/expired
   */
  get(key) {
    // Check if key exists
    if (!this.cache.has(key)) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    const expiryTime = this.expiryTimes.get(key);
    if (expiryTime && Date.now() > expiryTime) {
      this.log(`Key expired: ${key}`);
      this.delete(key);
      this.stats.expirations++;
      this.stats.misses++;
      return null;
    }

    // Move to end (most recently used) by deleting and re-inserting
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);

    this.stats.hits++;
    return value;
  }

  /**
   * ============================================
   * SET: Add or update cache entry
   * ============================================
   * 
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @returns {LRUCache} This instance for chaining
   */
  set(key, value) {
    this.stats.sets++;

    // If key exists, delete it first (will be re-added at end)
    if (this.cache.has(key)) {
      this.cache.delete(key);
      this.expiryTimes.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Cache is full, evict least recently used (first item)
      const lruKey = this.cache.keys().next().value;
      this.log(`Evicting LRU key: ${lruKey}`);
      this.delete(lruKey);
      this.stats.evictions++;
    }

    // Add new entry at end (most recently used)
    this.cache.set(key, value);
    this.expiryTimes.set(key, Date.now() + this.maxAge);

    this.log(`Set key: ${key} (size: ${this.cache.size}/${this.capacity})`);

    return this;
  }

  /**
   * ============================================
   * HAS: Check if key exists and is not expired
   * ============================================
   * 
   * @param {string} key - Cache key
   * @returns {boolean} True if key exists and is not expired
   */
  has(key) {
    if (!this.cache.has(key)) {
      return false;
    }

    // Check if expired
    const expiryTime = this.expiryTimes.get(key);
    if (expiryTime && Date.now() > expiryTime) {
      this.delete(key);
      this.stats.expirations++;
      return false;
    }

    return true;
  }

  /**
   * ============================================
   * DELETE: Remove entry from cache
   * ============================================
   * 
   * @param {string} key - Cache key
   * @returns {boolean} True if key was deleted
   */
  delete(key) {
    const deleted = this.cache.delete(key);
    this.expiryTimes.delete(key);
    
    if (deleted) {
      this.log(`Deleted key: ${key}`);
    }
    
    return deleted;
  }

  /**
   * ============================================
   * CLEAR: Remove all entries
   * ============================================
   */
  clear() {
    this.cache.clear();
    this.expiryTimes.clear();
    this.log('Cache cleared');
  }

  /**
   * ============================================
   * CLEANUP EXPIRED: Remove all expired entries
   * ============================================
   * 
   * Runs periodically to prevent memory leaks from expired entries
   */
  cleanupExpired() {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, expiryTime] of this.expiryTimes.entries()) {
      if (now > expiryTime) {
        this.delete(key);
        expiredCount++;
        this.stats.expirations++;
      }
    }

    if (expiredCount > 0) {
      this.log(`Cleaned up ${expiredCount} expired entries`);
    }
  }

  /**
   * ============================================
   * SIZE: Get current cache size
   * ============================================
   * 
   * @returns {number} Number of entries in cache
   */
  size() {
    return this.cache.size;
  }

  /**
   * ============================================
   * GET STATS: Get cache statistics
   * ============================================
   * 
   * @returns {object} Statistics object
   */
  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      capacity: this.capacity,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
    };
  }

  /**
   * ============================================
   * DESTROY: Cleanup resources
   * ============================================
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
    this.log('Cache destroyed');
  }

  /**
   * ============================================
   * DEBUG LOGGING
   * ============================================
   */
  log(...args) {
    if (this.debug) {
      console.log('[LRUCache]', ...args);
    }
  }
}

export default LRUCache;