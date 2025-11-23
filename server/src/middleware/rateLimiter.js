/**
 * ============================================
 * CUSTOM RATE LIMITING MIDDLEWARE
 * ============================================
 * 
 * Purpose: Protect auth endpoints from brute force attacks
 * 
 * Implementation:
 * - Tracks requests per IP address
 * - Stores attempts in memory (suitable for single server)
 * - Clears old entries to prevent memory leaks
 * - Configurable window and max attempts
 * 
 * For production multi-server deployment, use Redis or express-rate-limit
 */

class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
    this.maxAttempts = options.maxAttempts || 5;
    this.message = options.message || 'Too many attempts. Please try again later.';
    this.keyGenerator = options.keyGenerator || ((req) => req.ip);
    this.store = new Map(); // In-memory store: IP -> { count, resetTime }
    
    // Cleanup old entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  /**
   * Middleware function for Express
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  middleware = (req, res, next) => {
    // Generate key from IP - check X-Forwarded-For first (for proxied requests)
    let key = req.ip;
    if (req.headers['x-forwarded-for']) {
      key = req.headers['x-forwarded-for'].split(',')[0].trim();
    }
    
    const now = Date.now();

    // Get or create entry for this IP
    let entry = this.store.get(key);

    if (!entry) {
      // First request from this IP
      this.store.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return next();
    }

    // Check if window has expired
    if (now > entry.resetTime) {
      // Reset counter
      entry.count = 1;
      entry.resetTime = now + this.windowMs;
      return next();
    }

    // Increment counter
    entry.count++;

    // Check if limit exceeded
    if (entry.count > this.maxAttempts) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      
      res.set('Retry-After', retryAfter);
      return res.status(429).json({
        success: false,
        message: this.message,
        retryAfter: retryAfter,
        error: 'RATE_LIMIT_EXCEEDED'
      });
    }

    // Add rate limit info to response header
    res.set(
      'X-RateLimit-Limit',
      this.maxAttempts.toString()
    );
    res.set(
      'X-RateLimit-Remaining',
      (this.maxAttempts - entry.count).toString()
    );
    res.set(
      'X-RateLimit-Reset',
      entry.resetTime.toString()
    );

    next();
  };

  /**
   * Clean up expired entries from store
   */
  cleanup() {
    const now = Date.now();
    const entriesToDelete = [];

    this.store.forEach((entry, key) => {
      if (now > entry.resetTime) {
        entriesToDelete.push(key);
      }
    });

    entriesToDelete.forEach(key => {
      this.store.delete(key);
    });

    // Log cleanup if entries were removed
    if (entriesToDelete.length > 0) {
      console.log(`🧹 Rate limiter cleanup: removed ${entriesToDelete.length} expired entries`);
    }
  }

  /**
   * Destroy the rate limiter and cleanup interval
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }

  /**
   * Reset all limits (useful for testing)
   */
  reset() {
    this.store.clear();
  }

  /**
   * Get stats for debugging
   */
  getStats() {
    return {
      windowMs: this.windowMs,
      maxAttempts: this.maxAttempts,
      activeIPs: this.store.size,
      entries: Array.from(this.store.entries()).map(([ip, entry]) => ({
        ip,
        attempts: entry.count,
        resetTime: new Date(entry.resetTime).toISOString()
      }))
    };
  }
}

/**
 * Create rate limiters for different endpoints
 */

// Strict limit for login attempts (5 per 15 minutes)
export const loginLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxAttempts: 5,
  message: 'Too many login attempts. Please try again in 15 minutes.'
});

// Moderate limit for registration (3 per hour per IP)
export const registerLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000,
  maxAttempts: 3,
  message: 'Too many registration attempts. Please try again in 1 hour.'
});

// Moderate limit for general auth operations (10 per 15 minutes)
export const authLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxAttempts: 10,
  message: 'Too many requests. Please try again later.'
});

export default RateLimiter;
