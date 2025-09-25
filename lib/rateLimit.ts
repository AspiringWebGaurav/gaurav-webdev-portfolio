// lib/rateLimit.ts
// Simple in-memory rate limiting for session security

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

interface RateLimitOptions {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max requests per interval
  timeoutMs?: number; // Optional timeout for cleanup
}

// In-memory storage for rate limiting
// In production, use Redis or similar distributed cache
const rateLimitStore = new Map<string, { count: number; reset: number }>();

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.reset < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Cleanup every minute

export function ratelimit(options: RateLimitOptions) {
  const { interval, uniqueTokenPerInterval } = options;

  return {
    async check(limit: number, identifier: string): Promise<RateLimitResult> {
      const now = Date.now();
      const key = `${identifier}:${Math.floor(now / interval)}`;
      
      const current = rateLimitStore.get(key);
      
      if (!current) {
        // First request in this window
        rateLimitStore.set(key, { count: 1, reset: now + interval });
        return {
          success: true,
          limit,
          remaining: limit - 1,
          reset: now + interval,
        };
      }
      
      if (current.count >= limit) {
        // Rate limit exceeded
        return {
          success: false,
          limit,
          remaining: 0,
          reset: current.reset,
        };
      }
      
      // Increment count
      current.count++;
      rateLimitStore.set(key, current);
      
      return {
        success: true,
        limit,
        remaining: limit - current.count,
        reset: current.reset,
      };
    }
  };
}

// Create enhanced rate limiter with progressive delays
export function createEnhancedRateLimit(options: RateLimitOptions & { 
  progressiveDelay?: boolean;
  maxDelayMs?: number;
}) {
  const baseRateLimit = ratelimit(options);
  const failureStore = new Map<string, { failures: number; lastFailure: number }>();
  
  return {
    async check(limit: number, identifier: string): Promise<RateLimitResult & { delayMs?: number }> {
      const result = await baseRateLimit.check(limit, identifier);
      
      if (!options.progressiveDelay) {
        return result;
      }
      
      // Track failures for progressive delays
      const failures = failureStore.get(identifier);
      const now = Date.now();
      
      if (!result.success) {
        const currentFailures = failures ? failures.failures + 1 : 1;
        failureStore.set(identifier, { failures: currentFailures, lastFailure: now });
        
        // Calculate progressive delay: 2^failures seconds, max 5 minutes
        const delayMs = Math.min(
          Math.pow(2, currentFailures) * 1000,
          options.maxDelayMs || 300000
        );
        
        return { ...result, delayMs };
      }
      
      // Success - reset failure count
      if (failures) {
        failureStore.delete(identifier);
      }
      
      return result;
    }
  };
}