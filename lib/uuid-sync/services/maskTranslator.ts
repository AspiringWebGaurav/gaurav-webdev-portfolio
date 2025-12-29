/**
 * Mask Translator - Bidirectional mask ↔ UUID translation
 */

import { validateMask, validateUUID } from '../core/validator';
import { cacheGet, cacheSet } from './cacheManager';
import { firestoreGetMaskByUUID, firestoreGetUUIDByMask } from './firestoreSync';
import { CACHE_TTL } from '../constants';
import { log } from '../utils';
import { MaskNotFoundError, UUIDNotFoundError } from '../errors';

/**
 * Translate mask to UUID (NO CACHE)
 * Use for security-critical ban checks that must always read fresh data
 */
export async function translateMaskToUUIDNoCache(mask: string): Promise<string> {
  validateMask(mask);
  
  log('Translating mask to UUID (NO CACHE)', { mask });
  
  // Query Firestore directly - skip cache
  try {
    const uuid = await firestoreGetUUIDByMask(mask);
    log('UUID translated from Firestore (fresh read)', { mask, uuid: uuid.substring(0, 13) });
    return uuid;
  } catch (error) {
    log('UUID not found for mask', { mask });
    throw new MaskNotFoundError(mask);
  }
}

/**
 * Translate mask to UUID
 */
export async function translateMaskToUUID(mask: string): Promise<string> {
  validateMask(mask);
  
  log('Translating mask to UUID', { mask });
  
  // Check cache
  const cached = cacheGet<string>(`mask:${mask}`);
  if (cached) {
    log('UUID found in cache', { mask });
    return cached;
  }
  
  // Query Firestore
  try {
    const uuid = await firestoreGetUUIDByMask(mask);
    
    // Cache both directions
    cacheSet(`mask:${mask}`, uuid, CACHE_TTL.MASK_TO_UUID);
    cacheSet(`uuid:${uuid}`, mask, CACHE_TTL.UUID_TO_MASK);
    
    log('UUID translated from Firestore', { mask, uuid: uuid.substring(0, 13) });
    return uuid;
  } catch (error) {
    if (error instanceof UUIDNotFoundError) {
      throw new MaskNotFoundError(`Mask not found: ${mask}`, { mask });
    }
    throw error;
  }
}

/**
 * Translate UUID to mask
 */
export async function translateUUIDToMask(uuid: string): Promise<string> {
  validateUUID(uuid);
  
  log('Translating UUID to mask', { uuid: uuid.substring(0, 13) });
  
  // Check cache
  const cached = cacheGet<string>(`uuid:${uuid}`);
  if (cached) {
    log('Mask found in cache', { uuid: uuid.substring(0, 13) });
    return cached;
  }
  
  // Query Firestore
  try {
    const mask = await firestoreGetMaskByUUID(uuid);
    
    // Cache both directions
    cacheSet(`uuid:${uuid}`, mask, CACHE_TTL.UUID_TO_MASK);
    cacheSet(`mask:${mask}`, uuid, CACHE_TTL.MASK_TO_UUID);
    
    log('Mask translated from Firestore', { uuid: uuid.substring(0, 13), mask });
    return mask;
  } catch (error) {
    if (error instanceof UUIDNotFoundError) {
      throw new UUIDNotFoundError(`UUID not found: ${uuid}`, { uuid });
    }
    throw error;
  }
}

/**
 * Batch translate masks to UUIDs
 */
export async function batchTranslateMasksToUUIDs(masks: string[]): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  
  await Promise.all(
    masks.map(async (mask) => {
      try {
        const uuid = await translateMaskToUUID(mask);
        results.set(mask, uuid);
      } catch (error) {
        log(`Failed to translate mask: ${mask}`, error);
      }
    })
  );
  
  return results;
}

/**
 * Batch translate UUIDs to masks
 */
export async function batchTranslateUUIDsToMasks(uuids: string[]): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  
  await Promise.all(
    uuids.map(async (uuid) => {
      try {
        const mask = await translateUUIDToMask(uuid);
        results.set(uuid, mask);
      } catch (error) {
        log(`Failed to translate UUID: ${uuid}`, error);
      }
    })
  );
  
  return results;
}
