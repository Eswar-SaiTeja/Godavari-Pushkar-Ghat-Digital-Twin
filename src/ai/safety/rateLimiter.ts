/**
 * AI Rate Limiter
 * Enforces sliding window request rate limiting and burst control for AI endpoints.
 */

export interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
  retryAfterMs?: number;
}

export class SlidingWindowRateLimiter {
  private timestamps: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowSeconds: number;

  constructor(maxRequests: number = 30, windowSeconds: number = 60) {
    this.maxRequests = maxRequests;
    this.windowSeconds = windowSeconds;
  }

  /**
   * Check if a request for given client identifier is within rate limits
   */
  public checkLimit(clientId: string): RateLimitStatus {
    const now = Date.now();
    const windowStart = now - (this.windowSeconds * 1000);

    let clientTimestamps = this.timestamps.get(clientId) || [];
    // Filter out expired timestamps
    clientTimestamps = clientTimestamps.filter(t => t > windowStart);

    if (clientTimestamps.length >= this.maxRequests) {
      const oldestInWindow = clientTimestamps[0];
      const resetMs = (oldestInWindow + (this.windowSeconds * 1000)) - now;
      const resetSeconds = Math.max(1, Math.ceil(resetMs / 1000));

      this.timestamps.set(clientId, clientTimestamps);
      return {
        allowed: false,
        remaining: 0,
        resetSeconds,
        retryAfterMs: Math.max(100, resetMs),
      };
    }

    // Add current timestamp
    clientTimestamps.push(now);
    this.timestamps.set(clientId, clientTimestamps);

    return {
      allowed: true,
      remaining: this.maxRequests - clientTimestamps.length,
      resetSeconds: this.windowSeconds,
    };
  }

  /**
   * Reset rate limiter for testing
   */
  public reset(clientId?: string): void {
    if (clientId) {
      this.timestamps.delete(clientId);
    } else {
      this.timestamps.clear();
    }
  }
}

export const defaultRateLimiter = new SlidingWindowRateLimiter(30, 60);
