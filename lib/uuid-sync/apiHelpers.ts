/**
 * UUID-Sync Helper - Common functions for API routes
 * Use these helpers in API routes for consistent mask/UUID handling
 */

import { translateMaskToUUID, translateUUIDToMask } from './services/maskTranslator';
import { isValidMask } from './core/generator';
import logger from '../logger';

/**
 * Extract visitor identifier from request body
 * Supports: mask, uuid
 */
export function extractVisitorIdentifier(body: any): string | null {
  return body.mask || body.uuid || null;
}

/**
 * Resolve visitor identifier to UUID
 * If it's a mask, translate it. If it's already a UUID, return as-is.
 */
export async function resolveToUUID(identifier: string): Promise<string> {
  if (isValidMask(identifier)) {
    return await translateMaskToUUID(identifier);
  }
  return identifier; // Assume it's already a UUID
}

/**
 * Resolve UUID to mask for response
 */
export async function resolveToMask(uuid: string): Promise<string> {
  try {
    return await translateUUIDToMask(uuid);
  } catch (error) {
    logger.error('Failed to resolve mask for UUID:', uuid.substring(0, 13));
    return `device_unknown`;
  }
}

/**
 * Create response with mask
 */
export function createVisitorResponse(mask: string, additionalData: any = {}) {
  return {
    mask,
    ...additionalData,
  };
}

/**
 * Batch translate UUIDs to masks for list responses
 */
export async function batchResolveToMasks(uuids: string[]): Promise<Map<string, string>> {
  const { batchTranslateUUIDsToMasks } = await import('@/lib/uuid-sync');
  return await batchTranslateUUIDsToMasks(uuids);
}
