/**
 * In-Memory Sliding-Window Rate Limiter
 * Enforces request rate limits per client identifier to prevent abuse and denial-of-wallet.
 */

interface RateLimitRecord {
  timestamps: number[];
}

export class SlidingWindowRateLimiter {
  private records = new Map<string, RateLimitRecord>();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests = 10, windowMs = 60 * 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if a request from the given key is allowed.
   * If allowed, records the request timestamp.
   */
  checkLimit(key: string): {
    allowed: boolean;
    remaining: number;
    resetMs: number;
  } {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    let record = this.records.get(key);
    if (!record) {
      record = { timestamps: [] };
      this.records.set(key, record);
    }

    // Clean up timestamps older than window
    record.timestamps = record.timestamps.filter((t) => t > windowStart);

    if (record.timestamps.length >= this.maxRequests) {
      const oldest = record.timestamps[0];
      const resetMs = Math.max(0, oldest + this.windowMs - now);
      return {
        allowed: false,
        remaining: 0,
        resetMs,
      };
    }

    record.timestamps.push(now);
    return {
      allowed: true,
      remaining: this.maxRequests - record.timestamps.length,
      resetMs: this.windowMs,
    };
  }

  /**
   * Clear all records (useful for testing)
   */
  reset() {
    this.records.clear();
  }
}

export const aiRateLimiter = new SlidingWindowRateLimiter(10, 60 * 1000); // 10 requests / minute

