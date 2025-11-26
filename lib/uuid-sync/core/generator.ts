/**
 * UUID Generator - Creates new UUID and mask pairs
 */

import crypto from 'crypto';
import { MASK_CONFIG, PATTERNS } from '../constants';
import { VisitorIdentity } from '../types';
import { log } from '../utils';

/**
 * Generate a cryptographically secure UUID
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Generate a mask from a UUID
 * Format: device_<10_chars>
 */
export function generateMaskFromUUID(uuid: string): string {
  // Extract 10 chars from the UUID (remove hyphens, lowercase)
  const cleanUUID = uuid.replace(/-/g, '').toLowerCase();
  const maskChars = cleanUUID.substring(0, MASK_CONFIG.LENGTH);
  
  return `${MASK_CONFIG.PREFIX}${maskChars}`;
}

/**
 * Create a complete visitor identity
 */
export function createVisitorIdentity(fingerprint: string): VisitorIdentity {
  const uuid = generateUUID();
  const mask = generateMaskFromUUID(uuid);
  
  log('Created new visitor identity', { mask });
  
  return {
    uuid,
    mask,
    fingerprint,
  };
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  return PATTERNS.UUID.test(uuid);
}

/**
 * Validate mask format
 */
export function isValidMask(mask: string): boolean {
  return PATTERNS.MASK.test(mask);
}
