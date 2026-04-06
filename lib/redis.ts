/**
 * Upstash Redis Connection
 * 
 * Serverless Redis client with automatic connection management.
 * Uses REST API - no persistent connections needed.
 * 
 * FAIL-SAFE: All operations wrapped in try-catch with graceful fallback.
 */

import { Redis } from '@upstash/redis';

// Feature flag - disable Redis entirely if needed
const REDIS_ENABLED = process.env.ENABLE_REDIS_CACHE !== 'false';

// Singleton instance
let redisInstance: Redis | null = null;
let redisInitLogged = false;

/**
 * Get Redis client instance (singleton)
 * Returns null if Redis is disabled or misconfigured
 */
export function getRedis(): Redis | null {
  if (!REDIS_ENABLED) {
    return null;
  }

  if (redisInstance) {
    return redisInstance;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  try {
    redisInstance = new Redis({
      url,
      token,
    });
    if (!redisInitLogged) {
      redisInitLogged = true;
    }
    return redisInstance;
  } catch (error) {
    return null;
  }
}

/**
 * Check if Redis is available
 */
export function isRedisEnabled(): boolean {
  return REDIS_ENABLED && !!getRedis();
}

/**
 * Safe Redis GET with timeout and fallback
 */
export async function safeGet<T>(key: string, timeoutMs: number = 3000): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const result = await Promise.race([
      redis.get<T>(key),
      new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Redis timeout')), timeoutMs)
      )
    ]);

    clearTimeout(timeout);
    return result;
  } catch (error) {
    // Silent failure - Redis errors should never break the app
    return null;
  }
}

/**
 * Safe Redis SET with TTL and fallback
 */
export async function safeSet(
  key: string, 
  value: any, 
  ttlSeconds: number = 300,
  timeoutMs: number = 3000
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  try {
    await Promise.race([
      redis.setex(key, ttlSeconds, value),
      new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Redis timeout')), timeoutMs)
      )
    ]);
    return true;
  } catch (error) {
    // Silent failure
    return false;
  }
}

/**
 * Safe Redis DELETE
 */
export async function safeDel(key: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  try {
    await redis.del(key);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Safe Redis DELETE by pattern (for cache invalidation)
 */
export async function safeDelPattern(pattern: string): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;

  try {
    const keys = await redis.keys(pattern);
    if (keys.length === 0) return 0;
    
    await redis.del(...keys);
    return keys.length;
  } catch (error) {
    return 0;
  }
}

export default getRedis;
