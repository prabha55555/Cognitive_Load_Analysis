/**
 * Client-Side Rate Limiter
 * 
 * TODO: Implement request throttling
 * - Limit API requests per time window
 * - Queue requests during high load
 * - Prevent spam/abuse
 * 
 * Related Flaw: Module 7 - No Rate Limiting (HIGH)
 * @see docs/FLAWS_AND_ISSUES.md
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RequestRecord {
  timestamp: number;
  count: number;
}

class RateLimiter {
  private requests: Map<string, RequestRecord[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = { maxRequests: 10, windowMs: 60000 }) {
    this.config = config;
  }

  /**
   * Check if request is allowed
   */
  canMakeRequest(key: string = 'default'): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    // Get existing requests for this key
    let records = this.requests.get(key) || [];
    
    // Filter out old requests
    records = records.filter(r => r.timestamp > windowStart);
    
    // Check if under limit
    const totalRequests = records.reduce((sum, r) => sum + r.count, 0);
    
    return totalRequests < this.config.maxRequests;
  }

  /**
   * Record a request
   */
  recordRequest(key: string = 'default'): void {
    const now = Date.now();
    const records = this.requests.get(key) || [];
    
    records.push({ timestamp: now, count: 1 });
    this.requests.set(key, records);
  }

  /**
   * Get remaining requests in current window
   */
  getRemainingRequests(key: string = 'default'): number {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    const records = this.requests.get(key) || [];
    const validRecords = records.filter(r => r.timestamp > windowStart);
    const totalRequests = validRecords.reduce((sum, r) => sum + r.count, 0);
    
    return Math.max(0, this.config.maxRequests - totalRequests);
  }

  /**
   * Get time until rate limit resets
   */
  getResetTime(key: string = 'default'): number {
    const records = this.requests.get(key) || [];
    if (records.length === 0) return 0;
    
    const oldestRecord = records.reduce((oldest, r) => 
      r.timestamp < oldest.timestamp ? r : oldest
    );
    
    return Math.max(0, oldestRecord.timestamp + this.config.windowMs - Date.now());
  }

  /**
   * Clear all records for a key
   */
  reset(key: string = 'default'): void {
    this.requests.delete(key);
  }
}

// Default rate limiter instance for API calls
export const apiRateLimiter = new RateLimiter({
  maxRequests: 20,
  windowMs: 60000, // 1 minute
});

// Rate limiter for chat messages
export const chatRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 30000, // 30 seconds
});

export { RateLimiter };
export default RateLimiter;
