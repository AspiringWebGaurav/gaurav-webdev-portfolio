/**
 * Cache Manager - In-memory caching with TTL
 */

import { CacheEntry, CacheStats } from '../types';
import { isExpired, log } from '../utils';

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private stats = {
    hits: 0,
    misses: 0,
  };

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    if (isExpired(entry.expiresAt)) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }
    
    this.stats.hits++;
    return entry.value as T;
  }

  /**
   * Set value in cache with TTL
   */
  set<T>(key: string, value: T, ttl: number): void {
    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + ttl,
      createdAt: Date.now(),
    };
    
    this.cache.set(key, entry);
  }

  /**
   * Delete from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    log('Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total : 0;
    
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      size: this.cache.size,
    };
  }

  /**
   * Clean expired entries
   */
  cleanExpired(): number {
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (isExpired(entry.expiresAt)) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      log(`Cleaned ${cleaned} expired cache entries`);
    }
    
    return cleaned;
  }
}

// Singleton instance
const cacheManager = new CacheManager();

// Auto-clean every 5 minutes
setInterval(() => {
  cacheManager.cleanExpired();
}, 5 * 60 * 1000);

// Export convenience functions
export function cacheGet<T>(key: string): T | null {
  return cacheManager.get<T>(key);
}

export function cacheSet<T>(key: string, value: T, ttl: number): void {
  cacheManager.set(key, value, ttl);
}

export function cacheDelete(key: string): boolean {
  return cacheManager.delete(key);
}

export function cacheClear(): void {
  cacheManager.clear();
}

export function cacheStats(): CacheStats {
  return cacheManager.getStats();
}

export function cacheCleanExpired(): number {
  return cacheManager.cleanExpired();
}

export default cacheManager;
