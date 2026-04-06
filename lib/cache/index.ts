/**
 * 3-Layer Cache System
 * 
 * Architecture: Memory → Redis → Firebase
 * 
 * Goals:
 * - 85-95% cache hit rate
 * - Firebase reads reduced by 90%+
 * - Zero failures (graceful fallback)
 * 
 * FAIL-SAFE: System works perfectly even if Redis is down
 */

import { safeGet, safeSet, isRedisEnabled } from '../redis';
import { memoryCache } from './memoryCache';
import { cacheStats } from './stats';

export interface CacheOptions {
  /** Memory cache TTL in seconds (default: 60) */
  memoryTTL?: number;
  /** Redis cache TTL in seconds (default: 300) */
  redisTTL?: number;
  /** Cache key prefix */
  prefix?: string;
  /** Skip cache entirely (for ?nocache=true) */
  bypass?: boolean;
  /** Enable stale-while-revalidate (return stale, fetch in background) */
  swr?: boolean;
  /** SWR stale threshold in seconds (default: same as memoryTTL) */
  swrStaleTime?: number;
}

const DEFAULT_OPTIONS: Required<CacheOptions> = {
  memoryTTL: 60,      // 1 minute in-memory
  redisTTL: 300,      // 5 minutes in Redis
  prefix: 'cache',
  bypass: false,
  swr: false,
  swrStaleTime: 60,
};

// Track in-flight SWR revalidations to prevent duplicate fetches
const swrInFlight = new Set<string>();

/**
 * 3-Layer Cache Fetch
 * 
 * 1. Check Memory Cache (fastest, free)
 * 2. Check Redis Cache (fast, shared)
 * 3. Fetch from source (Firebase) - only on miss
 * 4. Populate both caches after fetch
 * 
 * @param key - Unique cache key
 * @param fetcher - Function to fetch from source (Firebase)
 * @param options - Cache configuration
 */
export async function cacheGet<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const fullKey = `${opts.prefix}:${key}`;

  // Bypass cache if requested
  if (opts.bypass) {
    cacheStats.recordMiss('bypass');
    return fetcher();
  }

  // LAYER 1: Memory Cache (fastest)
  const memoryResult = memoryCache.get<T>(fullKey);
  if (memoryResult !== null) {
    cacheStats.recordHit('memory');
    return memoryResult;
  }

  // LAYER 2: Redis Cache (shared across instances)
  if (isRedisEnabled()) {
    try {
      const redisResult = await safeGet<T>(fullKey);
      if (redisResult !== null) {
        // Populate memory cache for next request
        memoryCache.set(fullKey, redisResult, opts.memoryTTL);
        cacheStats.recordHit('redis');
        return redisResult;
      }
    } catch {
      // Redis failed - continue to Firebase
      cacheStats.recordError('redis');
    }
  }

  // LAYER 3: Firebase (source of truth) - only on cache miss
  cacheStats.recordMiss('firebase');
  
  try {
    const result = await fetcher();
    
    // Populate BOTH caches
    memoryCache.set(fullKey, result, opts.memoryTTL);
    
    if (isRedisEnabled()) {
      // Fire and forget - don't wait for Redis
      safeSet(fullKey, result, opts.redisTTL).catch(() => {});
    }
    
    return result;
  } catch (error) {
    // Firebase failed - try to return stale cached data
    const staleData = memoryCache.getStale<T>(fullKey);
    if (staleData !== null) {
      cacheStats.recordStaleHit();
      console.warn(`[Cache] Using stale data for ${key} due to Firebase error`);
      return staleData;
    }
    
    // No cached data - rethrow error
    throw error;
  }
}

/**
 * Invalidate cache for a key
 */
export async function cacheInvalidate(key: string, prefix: string = 'cache'): Promise<void> {
  const fullKey = `${prefix}:${key}`;
  
  // Clear memory cache
  memoryCache.delete(fullKey);
  
  // Clear Redis cache (fire and forget)
  if (isRedisEnabled()) {
    const { safeDel } = await import('../redis');
    safeDel(fullKey).catch(() => {});
  }
}

/**
 * Invalidate all cache for a prefix pattern
 */
export async function cacheInvalidatePattern(pattern: string): Promise<void> {
  // Clear matching memory cache entries
  memoryCache.deletePattern(pattern);
  
  // Clear Redis cache (fire and forget)
  if (isRedisEnabled()) {
    const { safeDelPattern } = await import('../redis');
    safeDelPattern(`${pattern}*`).catch(() => {});
  }
}

/**
 * Stale-While-Revalidate Cache Fetch
 * 
 * Returns cached data INSTANTLY, then revalidates in background.
 * Perfect for admin dashboards where slight staleness is acceptable.
 * 
 * Flow:
 * 1. Return cached data immediately (even if stale)
 * 2. Trigger background revalidation
 * 3. Update cache silently
 * 4. Next request gets fresh data
 */
export async function cacheGetSWR<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options, swr: true };
  const fullKey = `${opts.prefix}:${key}`;

  // Bypass cache if requested
  if (opts.bypass) {
    cacheStats.recordMiss('bypass');
    return fetcher();
  }

  // LAYER 1: Check Memory Cache (return immediately if found)
  const memoryResult = memoryCache.get<T>(fullKey);
  if (memoryResult !== null) {
    cacheStats.recordHit('memory');
    // Trigger background revalidation (non-blocking)
    triggerBackgroundRevalidation(fullKey, fetcher, opts);
    return memoryResult;
  }

  // LAYER 2: Check Redis Cache
  if (isRedisEnabled()) {
    try {
      const redisResult = await safeGet<T>(fullKey);
      if (redisResult !== null) {
        // Populate memory cache
        memoryCache.set(fullKey, redisResult, opts.memoryTTL);
        cacheStats.recordHit('redis');
        // Trigger background revalidation (non-blocking)
        triggerBackgroundRevalidation(fullKey, fetcher, opts);
        return redisResult;
      }
    } catch {
      cacheStats.recordError('redis');
    }
  }

  // LAYER 3: Check for stale data before hitting Firebase
  const staleData = memoryCache.getStale<T>(fullKey);
  if (staleData !== null) {
    cacheStats.recordStaleHit();
    // Trigger background revalidation (non-blocking)
    triggerBackgroundRevalidation(fullKey, fetcher, opts);
    return staleData;
  }

  // LAYER 4: Firebase (cold start - no cached data)
  cacheStats.recordMiss('firebase');
  return fetchAndCache(fullKey, fetcher, opts);
}

/**
 * Trigger background revalidation (non-blocking)
 * Prevents duplicate in-flight requests
 */
function triggerBackgroundRevalidation<T>(
  fullKey: string,
  fetcher: () => Promise<T>,
  opts: Required<CacheOptions>
): void {
  // Skip if already revalidating
  if (swrInFlight.has(fullKey)) {
    return;
  }

  swrInFlight.add(fullKey);

  // Fire and forget - don't await
  fetchAndCache(fullKey, fetcher, opts)
    .catch(() => {
      // Silent failure - keep using cached data
    })
    .finally(() => {
      swrInFlight.delete(fullKey);
    });
}

/**
 * Fetch from source and populate both caches
 */
async function fetchAndCache<T>(
  fullKey: string,
  fetcher: () => Promise<T>,
  opts: Required<CacheOptions>
): Promise<T> {
  const result = await fetcher();
  
  // Populate BOTH caches
  memoryCache.set(fullKey, result, opts.memoryTTL);
  
  if (isRedisEnabled()) {
    safeSet(fullKey, result, opts.redisTTL).catch(() => {});
  }
  
  return result;
}

// Re-export for convenience
export { memoryCache } from './memoryCache';
export { cacheStats } from './stats';
export { CACHE_KEYS, CACHE_TTL, ADMIN_CACHE_KEYS, ADMIN_CACHE_TTL } from './keys';
