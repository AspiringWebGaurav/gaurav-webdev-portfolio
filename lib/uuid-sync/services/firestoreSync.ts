/**
 * Firestore Sync - Database operations for visitor identities
 */

import { adminDb } from '../../firebaseAdmin';
import admin from 'firebase-admin';
import { COLLECTIONS } from '../constants';
import { VisitorIdentity, VisitorDocument } from '../types';
import { FirestoreTransactionError, UUIDNotFoundError } from '../errors';
import { log, logError, retry } from '../utils';

const FieldValue = admin.firestore.FieldValue;
const db = adminDb;

/**
 * Get visitor identity by fingerprint from separate lookup collection
 * Returns existing identity or null if not found
 */
export async function firestoreGetIdentity(fingerprint: string): Promise<VisitorIdentity | null> {
  try {
    // Hash fingerprint to create valid Firestore document ID (no slashes, special chars)
    const fingerprintHash = hashFingerprint(fingerprint);
    
    // Query fingerprint lookup collection (faster than querying main collection)
    const fpDoc = await db
      .collection(COLLECTIONS.FINGERPRINT_MAP)
      .doc(fingerprintHash)
      .get();

    if (!fpDoc.exists) {
      return null;
    }

    const fpData = fpDoc.data() as { uuid: string; mask: string };
    
    log('Found existing identity by fingerprint', { mask: fpData.mask });
    
    return {
      uuid: fpData.uuid,
      mask: fpData.mask,
      fingerprint: fingerprint,
    };
  } catch (error) {
    logError('Failed to get identity by fingerprint', error);
    return null;
  }
}

/**
 * Hash fingerprint to create valid Firestore document ID
 * Removes slashes, special chars that break Firestore paths
 */
function hashFingerprint(fingerprint: string): string {
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return 'fp_' + Math.abs(hash).toString(36);
}

/**
 * Save new visitor identity to Firestore in SEPARATE collections
 * 1. og_uuid - Main visitor profile
 * 2. og_uuid_fingerprints - Fingerprint to UUID lookup
 * 3. og_uuid_masks - Mask to UUID lookup
 */
export async function firestoreSaveIdentity(identity: VisitorIdentity): Promise<void> {
  try {
    const now = FieldValue.serverTimestamp();
    
    // Hash fingerprint to create valid Firestore document ID
    const fingerprintHash = hashFingerprint(identity.fingerprint);
    
    // Use batch write for atomic operation across collections
    const batch = db.batch();
    
    // 1. Save to main visitor profiles collection (UUID as doc ID)
    const profileRef = db.collection(COLLECTIONS.VISITOR_PROFILES).doc(identity.uuid);
    batch.set(profileRef, {
      mask: identity.mask,
      fingerprint: identity.fingerprint,
      banned: false,
      firstVisit: now,
      lastVisit: now,
      createdAt: now,
      updatedAt: now,
    }, { merge: false });
    
    // 2. Save to fingerprint lookup collection (hashed fingerprint as doc ID)
    const fingerprintRef = db.collection(COLLECTIONS.FINGERPRINT_MAP).doc(fingerprintHash);
    batch.set(fingerprintRef, {
      uuid: identity.uuid,
      mask: identity.mask,
      fingerprint: identity.fingerprint, // Store original for reference
      createdAt: now,
    }, { merge: false });
    
    // 3. Save to mask lookup collection (mask as doc ID)
    const maskRef = db.collection(COLLECTIONS.MASK_MAP).doc(identity.mask);
    batch.set(maskRef, {
      uuid: identity.uuid,
      fingerprint: identity.fingerprint,
      createdAt: now,
    }, { merge: false });
    
    // Commit all writes atomically
    await batch.commit();
    
    log('Saved identity to all collections', { mask: identity.mask });
  } catch (error) {
    logError('Failed to save identity', error);
    throw new FirestoreTransactionError('Failed to save visitor identity', { error });
  }
}

/**
 * Get UUID by mask from separate lookup collection
 */
export async function firestoreGetUUIDByMask(mask: string): Promise<string> {
  try {
    // Query mask lookup collection (faster than querying main collection)  
    const maskDoc = await db
      .collection(COLLECTIONS.MASK_MAP)
      .doc(mask)
      .get();

    if (!maskDoc.exists) {
      throw new UUIDNotFoundError(`No UUID found for mask: ${mask}`, { mask });
    }

    const maskData = maskDoc.data() as { uuid: string };
    return maskData.uuid;
  } catch (error) {
    if (error instanceof UUIDNotFoundError) {
      throw error;
    }
    logError('Failed to get UUID by mask', error);
    throw error;
  }
}

/**
 * Get mask by UUID
 */
export async function firestoreGetMaskByUUID(uuid: string): Promise<string> {
  try {
    const docRef = db.collection(COLLECTIONS.VISITOR_PROFILES).doc(uuid);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new UUIDNotFoundError(`No mask found for UUID: ${uuid}`, { uuid });
    }

    const data = doc.data() as VisitorDocument;
    return data.mask;
  } catch (error) {
    if (error instanceof UUIDNotFoundError) {
      throw error;
    }
    logError('Failed to get mask by UUID', error);
    throw error;
  }
}

/**
 * Update visitor's last visit timestamp
 */
export async function firestoreUpdateLastVisit(uuid: string): Promise<void> {
  try {
    const docRef = db.collection(COLLECTIONS.VISITOR_PROFILES).doc(uuid);
    await docRef.update({
      lastVisit: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    logError('Failed to update last visit', error);
    // Don't throw - this is non-critical
  }
}

/**
 * Check if visitor is banned (with cache support)
 */
export async function firestoreCheckBanStatus(uuid: string): Promise<boolean> {
  try {
    
    const docRef = db.collection(COLLECTIONS.VISITOR_PROFILES).doc(uuid);
    const doc = await docRef.get();

    if (!doc.exists) {
      return false;
    }

    const data = doc.data() as VisitorDocument;
    const banned = data.banned === true;
    
    return banned;
  } catch (error) {
    logError('Failed to check ban status', error);
    return false; // Fail open - don't block on errors
  }
}

/**
 * Get full visitor document
 */
export async function firestoreGetVisitorDocument(uuid: string): Promise<VisitorDocument | null> {
  try {
    const docRef = db.collection(COLLECTIONS.VISITOR_PROFILES).doc(uuid);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    return doc.data() as VisitorDocument;
  } catch (error) {
    logError('Failed to get visitor document', error);
    return null;
  }
}
