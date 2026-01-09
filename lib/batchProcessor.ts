/**
 * Enterprise-Grade Batch Processor
 * Handles intelligent batching for mass user operations
 */

import { BatchConfig, BatchCalculation } from '@/types/batchUpdate';

// Batch size configuration based on user count
const BATCH_SIZE_CONFIG: Record<string, BatchConfig> = {
  small: { users: 50, batchSize: 25, interval: 2 },      // <50 users: 25 per batch, 2s interval
  medium: { users: 200, batchSize: 30, interval: 3 },    // 50-200 users: 30 per batch, 3s interval
  large: { users: 500, batchSize: 40, interval: 4 },     // 200-500 users: 40 per batch, 4s interval
  massive: { users: Infinity, batchSize: 50, interval: 5 } // 500+ users: 50 per batch, 5s interval
};

/**
 * Calculate optimal batch configuration based on total user count
 */
export function calculateBatchConfig(totalUsers: number): BatchCalculation {
  // Safety check
  if (totalUsers <= 0) {
    return {
      totalBatches: 0,
      batchSize: 0,
      interval: 0,
      estimatedTimeSeconds: 0,
    };
  }

  // For very small numbers, use single batch
  if (totalUsers <= 10) {
    return {
      totalBatches: 1,
      batchSize: totalUsers,
      interval: 0,
      estimatedTimeSeconds: 2, // Just the reload time
    };
  }

  // Select appropriate config based on user count
  let config = BATCH_SIZE_CONFIG.small;
  
  if (totalUsers > 500) {
    config = BATCH_SIZE_CONFIG.massive;
  } else if (totalUsers > 200) {
    config = BATCH_SIZE_CONFIG.large;
  } else if (totalUsers > 50) {
    config = BATCH_SIZE_CONFIG.medium;
  }

  const totalBatches = Math.ceil(totalUsers / config.batchSize);
  
  // Cap at 20 batches maximum (safety limit)
  const cappedBatches = Math.min(totalBatches, 20);
  
  // Calculate estimated time
  // Formula: (batches - 1) * interval + 2 seconds (reload time for last batch)
  const estimatedTimeSeconds = (cappedBatches - 1) * config.interval + 2;

  return {
    totalBatches: cappedBatches,
    batchSize: config.batchSize,
    interval: config.interval,
    estimatedTimeSeconds,
  };
}

/**
 * Split array of user IDs into batches
 */
export function createBatches<T>(items: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  
  return batches;
}

/**
 * Calculate delay for specific batch number
 */
export function calculateBatchDelay(batchNumber: number, interval: number): number {
  // Batch 1 has 0 delay, Batch 2 has interval delay, etc.
  return (batchNumber - 1) * interval;
}

/**
 * Get user-friendly batch description
 */
export function getBatchDescription(batchNumber: number, totalBatches: number): string {
  if (totalBatches === 1) {
    return 'Single update wave';
  }
  
  if (batchNumber === 1) {
    return `Priority wave (1/${totalBatches})`;
  }
  
  if (batchNumber === totalBatches) {
    return `Final wave (${batchNumber}/${totalBatches})`;
  }
  
  return `Wave ${batchNumber} of ${totalBatches}`;
}

/**
 * Get emoji for batch wave
 */
export function getBatchEmoji(batchNumber: number, totalBatches: number): string {
  if (batchNumber === 1) return '🚀'; // Priority
  if (batchNumber === totalBatches) return '🎉'; // Final
  if (batchNumber <= totalBatches / 2) return '⚡'; // Early
  return '✨'; // Late
}

/**
 * Validate batch configuration
 */
export function validateBatchConfig(config: BatchCalculation): { valid: boolean; error?: string } {
  if (config.totalBatches > 20) {
    return { valid: false, error: 'Too many batches. Maximum 20 batches allowed.' };
  }
  
  if (config.batchSize < 1) {
    return { valid: false, error: 'Batch size must be at least 1.' };
  }
  
  if (config.interval < 0) {
    return { valid: false, error: 'Interval cannot be negative.' };
  }
  
  if (config.estimatedTimeSeconds > 300) {
    return { valid: false, error: 'Estimated time exceeds 5 minutes. Too many users.' };
  }
  
  return { valid: true };
}
