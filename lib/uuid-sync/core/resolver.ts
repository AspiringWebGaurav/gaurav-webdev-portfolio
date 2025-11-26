/**
 * Identity Resolver - Resolves fingerprint to UUID
 */

import { IdentityResolutionResult } from '../types';
import { log } from '../utils';
import { createVisitorIdentity, isValidMask, isValidUUID } from './generator';
import { firestoreGetIdentity, firestoreSaveIdentity } from '../services/firestoreSync';
import { cacheGet, cacheSet } from '../services/cacheManager';
import { CACHE_TTL } from '../constants';

// In-flight resolution lock to prevent race conditions
const resolutionLocks = new Map<string, Promise<IdentityResolutionResult>>();

/**
 * Resolve visitor identity from fingerprint
 * Returns existing UUID or creates new one
 * Uses locking to prevent duplicate creation for concurrent requests
 */
export async function resolveIdentity(fingerprint: string): Promise<IdentityResolutionResult> {
  log('Resolving identity for fingerprint', { fingerprint: fingerprint.substring(0, 20) });
  
  // Check if resolution is already in progress for this fingerprint
  const inFlight = resolutionLocks.get(fingerprint);
  if (inFlight) {
    log('Resolution already in progress, waiting...', { fingerprint: fingerprint.substring(0, 20) });
    return inFlight;
  }
  
  // Create promise for this resolution
  const resolutionPromise = (async () => {
    try {
      // Check cache first
      const cached = cacheGet<IdentityResolutionResult>(`fingerprint:${fingerprint}`);
      if (cached) {
        log('Identity resolved from cache', { mask: cached.mask });
        return cached;
      }
      
      // Check database by fingerprint (SERVER SYNC - no localStorage)
      const existingIdentity = await firestoreGetIdentity(fingerprint);
      if (existingIdentity) {
        log('Identity found in database', { mask: existingIdentity.mask });
        
        const result: IdentityResolutionResult = {
          uuid: existingIdentity.uuid,
          mask: existingIdentity.mask,
          isNew: false,
        };
        
        // Cache for future requests
        cacheSet(`fingerprint:${fingerprint}`, result, CACHE_TTL.FINGERPRINT_TO_UUID);
        cacheSet(`mask:${existingIdentity.mask}`, existingIdentity.uuid, CACHE_TTL.MASK_TO_UUID);
        cacheSet(`uuid:${existingIdentity.uuid}`, existingIdentity.mask, CACHE_TTL.UUID_TO_MASK);
        
        return result;
      }
      
      // Not found - create new identity
      const newIdentity = createVisitorIdentity(fingerprint);
      
      // Save to Firestore
      await firestoreSaveIdentity(newIdentity);
      
      const result: IdentityResolutionResult = {
        uuid: newIdentity.uuid,
        mask: newIdentity.mask,
        isNew: true,
      };
      
      // Cache immediately
      cacheSet(`fingerprint:${fingerprint}`, result, CACHE_TTL.FINGERPRINT_TO_UUID);
      cacheSet(`mask:${newIdentity.mask}`, newIdentity.uuid, CACHE_TTL.MASK_TO_UUID);
      cacheSet(`uuid:${newIdentity.uuid}`, newIdentity.mask, CACHE_TTL.UUID_TO_MASK);
      
      log('New identity created and cached', { mask: newIdentity.mask });
      
      return result;
    } finally {
      // Always remove lock when done
      resolutionLocks.delete(fingerprint);
    }
  })();
  
  // Store the promise so concurrent requests can wait for it
  resolutionLocks.set(fingerprint, resolutionPromise);
  
  return resolutionPromise;
}

/**
 * Validate an identity result
 */
export function validateIdentityResult(result: IdentityResolutionResult): boolean {
  return (
    isValidUUID(result.uuid) &&
    isValidMask(result.mask) &&
    typeof result.isNew === 'boolean'
  );
}
