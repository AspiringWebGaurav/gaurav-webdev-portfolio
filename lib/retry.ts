/**
 * Retry utility for robust Firebase operations
 * Handles transient failures, rate limiting, and connection issues
 */

import logger from './logger';

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 100,
  maxDelay: 5000,
  backoffMultiplier: 2,
  shouldRetry: (error: any) => {
    // Retry on transient errors
    if (error?.code === 'unavailable') return true;
    if (error?.code === 'deadline-exceeded') return true;
    if (error?.code === 'resource-exhausted') return true;
    if (error?.code === 'aborted') return true;
    if (error?.message?.includes('ECONNRESET')) return true;
    if (error?.message?.includes('ETIMEDOUT')) return true;
    if (error?.message?.includes('rate limit')) return true;
    return false;
  },
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
  operationName: string = 'operation'
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;
  let delay = opts.initialDelay;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      const result = await fn();
      
      if (attempt > 1) {
        logger.debug(`[Retry] ${operationName} succeeded on attempt ${attempt}`);
      }
      
      return result;
    } catch (error: any) {
      lastError = error;
      
      const shouldRetry = opts.shouldRetry(error);
      const isLastAttempt = attempt === opts.maxAttempts;
      
      if (!shouldRetry || isLastAttempt) {
        logger.error(`[Retry] ${operationName} failed after ${attempt} attempts:`, error);
        throw error;
      }
      
      logger.debug(
        `[Retry] ${operationName} failed (attempt ${attempt}/${opts.maxAttempts}), ` +
        `retrying in ${delay}ms...`,
        error.message || error.code
      );
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Exponential backoff with jitter
      delay = Math.min(delay * opts.backoffMultiplier + Math.random() * 100, opts.maxDelay);
    }
  }

  throw lastError;
}

/**
 * Batch operations with automatic chunking and retry
 */
export async function withBatch<T, R>(
  items: T[],
  batchSize: number,
  fn: (batch: T[]) => Promise<R[]>,
  operationName: string = 'batch operation'
): Promise<R[]> {
  const results: R[] = [];
  const chunks: T[][] = [];
  
  // Split into chunks
  for (let i = 0; i < items.length; i += batchSize) {
    chunks.push(items.slice(i, i + batchSize));
  }
  
  logger.debug(`[Batch] Processing ${items.length} items in ${chunks.length} batches`);
  
  // Process chunks with retry
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const batchResults = await withRetry(
      () => fn(chunk),
      {},
      `${operationName} (batch ${i + 1}/${chunks.length})`
    );
    results.push(...batchResults);
    
    // Small delay between batches to avoid overwhelming the system
    if (i < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  
  return results;
}

/**
 * Queue for managing concurrent operations
 */
export class OperationQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = 0;
  private maxConcurrent: number;

  constructor(maxConcurrent: number = 10) {
    this.maxConcurrent = maxConcurrent;
  }

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.processing++;
    const operation = this.queue.shift();
    
    if (operation) {
      try {
        await operation();
      } finally {
        this.processing--;
        this.processQueue();
      }
    }
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  getProcessingCount(): number {
    return this.processing;
  }
}

// Global queue for Firebase operations
export const firebaseQueue = new OperationQueue(50); // Allow 50 concurrent Firebase operations

export default {
  withRetry,
  withBatch,
  OperationQueue,
  firebaseQueue,
};
