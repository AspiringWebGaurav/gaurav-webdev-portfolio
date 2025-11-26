/**
 * Validator - Validates UUIDs, masks, and fingerprints
 */

import { PATTERNS } from '../constants';
import { UUIDValidationError } from '../errors';
import { log } from '../utils';

/**
 * Validate UUID format
 */
export function validateUUID(uuid: string): void {
  if (!uuid || typeof uuid !== 'string') {
    throw new UUIDValidationError('UUID must be a non-empty string', { uuid });
  }
  
  if (!PATTERNS.UUID.test(uuid)) {
    throw new UUIDValidationError('Invalid UUID format', { uuid });
  }
}

/**
 * Validate mask format
 */
export function validateMask(mask: string): void {
  if (!mask || typeof mask !== 'string') {
    throw new UUIDValidationError('Mask must be a non-empty string', { mask });
  }
  
  if (!PATTERNS.MASK.test(mask)) {
    throw new UUIDValidationError('Invalid mask format (expected device_xxxxxxxxxx)', { mask });
  }
}

/**
 * Validate fingerprint
 */
export function validateFingerprint(fingerprint: string): void {
  if (!fingerprint || typeof fingerprint !== 'string') {
    throw new UUIDValidationError('Fingerprint must be a non-empty string', { fingerprint });
  }
  
  if (fingerprint.length < 10) {
    throw new UUIDValidationError('Fingerprint too short (minimum 10 chars)', { fingerprint });
  }
}

/**
 * Safe validation that returns boolean
 */
export function isValidUUID(uuid: string): boolean {
  try {
    validateUUID(uuid);
    return true;
  } catch {
    return false;
  }
}

export function isValidMask(mask: string): boolean {
  try {
    validateMask(mask);
    return true;
  } catch {
    return false;
  }
}

export function isValidFingerprint(fingerprint: string): boolean {
  try {
    validateFingerprint(fingerprint);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate and sanitize input
 */
export function sanitizeMask(mask: string): string {
  validateMask(mask);
  return mask.toLowerCase().trim();
}

export function sanitizeUUID(uuid: string): string {
  validateUUID(uuid);
  return uuid.toLowerCase().trim();
}

export function sanitizeFingerprint(fingerprint: string): string {
  validateFingerprint(fingerprint);
  return fingerprint.trim();
}
