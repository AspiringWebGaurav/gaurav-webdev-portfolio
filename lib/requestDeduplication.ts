/**
 * Request Deduplication Utility
 * 
 * Prevents duplicate identical requests within a time window.
 * Critical for reducing Firebase reads when multiple components
 * trigger the same fetch simultaneously.
 * 
 * Usage:
 * const data = await deduplicate('unique-key', () => fetchData());
 */

import logger from './logger';

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

const pendingRequests = new Map<string, PendingRequest<any>>();

/**
 * Deduplicate requests with the same key
 * @param key - Unique identifier for the request
 * @param fetcher - Function that performs the actual fetch
 * @param ttl - Time to live for deduplication window (ms)
 */
export async function deduplicate<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 2000 // 2 second window
): Promise<T> {
  const now = Date.now();
  const existing = pendingRequests.get(key);

  // If there's a pending request and it's still fresh, return it
  if (existing && (now - existing.timestamp) < ttl) {
    return existing.promise;
  }

  // Create new request
  const promise = fetcher();
  
  pendingRequests.set(key, {
    promise,
    timestamp: now
  });

  // Clean up after promise resolves/rejects
  promise
    .finally(() => {
      setTimeout(() => {
        const current = pendingRequests.get(key);
        if (current && current.timestamp === now) {
          pendingRequests.delete(key);
        }
      }, ttl);
    });

  return promise;
}

/**
 * Clear all pending requests (useful for testing/cleanup)
 */
export function clearDeduplicationCache(): void {
  pendingRequests.clear();
}

/**
 * Get current cache size (for monitoring)
 */
export function getDeduplicationCacheSize(): number {
  return pendingRequests.size;
}
