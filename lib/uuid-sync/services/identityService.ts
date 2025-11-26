/**
 * Identity Service - High-level identity resolution service
 */

import { resolveIdentity } from '../core/resolver';
import { validateFingerprint } from '../core/validator';
import { IdentityResolutionResult } from '../types';
import { firestoreUpdateLastVisit } from './firestoreSync';
import { log, logError } from '../utils';

/**
 * Identify visitor - main entry point
 * Returns mask for public display
 */
export async function identifyVisitor(fingerprint: string): Promise<string> {
  validateFingerprint(fingerprint);
  
  log('Identifying visitor', { fingerprint: fingerprint.substring(0, 20) });
  
  try {
    const result = await resolveIdentity(fingerprint);
    
    // Update last visit timestamp (non-blocking)
    firestoreUpdateLastVisit(result.uuid).catch((error) => {
      logError('Failed to update last visit (non-critical)', error);
    });
    
    return result.mask;
  } catch (error) {
    logError('Failed to identify visitor', error);
    throw error;
  }
}

/**
 * Get full identity resolution result
 */
export async function getIdentityResult(fingerprint: string): Promise<IdentityResolutionResult> {
  validateFingerprint(fingerprint);
  
  try {
    return await resolveIdentity(fingerprint);
  } catch (error) {
    logError('Failed to get identity result', error);
    throw error;
  }
}

/**
 * Check if this is a new visitor
 */
export async function isNewVisitor(fingerprint: string): Promise<boolean> {
  try {
    const result = await resolveIdentity(fingerprint);
    return result.isNew;
  } catch (error) {
    logError('Failed to check if new visitor', error);
    return false; // Fail gracefully
  }
}
