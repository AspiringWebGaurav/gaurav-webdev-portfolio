/**
 * UUID Sync System - Utility Functions
 */

import { LOG_PREFIX, RETRY_CONFIG } from './constants';
import logger from '../logger';

/**
 * Log with consistent prefix
 */
export function log(message: string, data?: any) {
  // Silent in production, minimal logging
}

export function logError(message: string, error: any) {
  logger.error(LOG_PREFIX, message, error);
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  context: string,
  maxAttempts = RETRY_CONFIG.MAX_ATTEMPTS
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts) {
        logError(`${context} failed after ${maxAttempts} attempts`, error);
        throw error;
      }
      
      const delay = Math.min(
        RETRY_CONFIG.INITIAL_DELAY * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, attempt - 1),
        RETRY_CONFIG.MAX_DELAY
      );
      
      log(`${context} attempt ${attempt} failed, retrying in ${delay}ms`);
      await sleep(delay);
    }
  }
  
  throw lastError;
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate timestamp for cache expiry
 */
export function generateExpiryTimestamp(ttl: number): number {
  return Date.now() + ttl;
}

/**
 * Check if cache entry is expired
 */
export function isExpired(expiresAt: number): boolean {
  return Date.now() > expiresAt;
}

/**
 * Safe JSON stringify
 */
export function safeStringify(obj: any): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return String(obj);
  }
}

/**
 * Truncate string for logging
 */
export function truncate(str: string, length = 50): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
}
