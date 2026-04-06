/**
 * In-Memory LRU Cache
 * 
 * Layer 1 of the 3-layer cache system.
 * Ultra-fast, zero cost, per-instance.
 * 
 * Features:
 * - LRU eviction when max size reached
 * - TTL-based expiration
 * - Stale data fallback for resilience
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
    
    // Periodic cleanup of expired entries (every 60s)
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }
  }

  /**
   * Get value from cache (returns null if expired or missing)
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      return null;
    }
    
    // Move to end (most recently used) for LRU
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    return entry.value as T;
  }

  /**
   * Get stale value (even if expired) - for fallback scenarios
   */
  getStale<T>(key: string): T | null {
    const entry = this.cache.get(key);
    return entry ? entry.value as T : null;
  }

  /**
   * Set value with TTL (in seconds)
   */
  set<T>(key: string, value: T, ttlSeconds: number = 60): void {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttlSeconds * 1000),
      createdAt: Date.now(),
    });
  }

  /**
   * Delete a specific key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Delete keys matching a pattern
   */
  deletePattern(pattern: string): number {
    let deleted = 0;
    const regex = new RegExp(pattern.replace('*', '.*'));
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deleted++;
      }
    }
    
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let expired = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        expired++;
      }
    }
    
    // Cleanup completed silently
  }

  /**
   * Destroy the cache (cleanup interval)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

// Singleton instance
export const memoryCache = new MemoryCache(1000);

export default memoryCache;
