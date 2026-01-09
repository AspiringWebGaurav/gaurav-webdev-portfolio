/**
 * Suspension Check Utility (Server-Side)
 * 
 * Reusable function for checking suspension status.
 * Used by middleware and server components.
 * Fail-open on errors (returns suspended: false).
 */

import { adminDb } from './firebaseAdmin';

export interface SuspensionStatus {
  suspended: boolean;
  reason?: string;
  estimatedDuration?: number | null;
  enabledAt?: Date | null;
  enabledBy?: string;
}

const COLLECTION = 'siteSettings';
const DOC_ID = 'suspension';

/**
 * Check if suspension mode is enabled
 * Server-side only (uses Firebase Admin SDK)
 */
export async function checkSuspensionStatus(): Promise<SuspensionStatus> {
  try {
    const docRef = adminDb.collection(COLLECTION).doc(DOC_ID);
    const snapshot = await docRef.get();

    // Document doesn't exist - suspension is OFF
    if (!snapshot.exists) {
      return { suspended: false };
    }

    const data = snapshot.data();
    const enabled = data?.enabled === true;

    if (!enabled) {
      return { suspended: false };
    }

    // Parse enabledAt timestamp
    let enabledAt: Date | null = null;
    if (data?.enabledAt) {
      try {
        enabledAt = data.enabledAt.toDate();
      } catch (e) {
        console.warn('[Suspension Check] Failed to parse enabledAt timestamp');
      }
    }

    return {
      suspended: true,
      reason: data?.reason || '',
      estimatedDuration: data?.estimatedDuration || null,
      enabledAt,
      enabledBy: data?.enabledBy || 'Admin',
    };

  } catch (error: any) {
    // Fail-open: if check fails, allow access
    console.error('[Suspension Check] Error checking status - failing open:', error?.message);
    return { suspended: false };
  }
}

/**
 * Quick suspension check (just boolean)
 * Optimized for middleware performance
 */
export async function isSuspended(): Promise<boolean> {
  try {
    const docRef = adminDb.collection(COLLECTION).doc(DOC_ID);
    const snapshot = await docRef.get();

    if (!snapshot.exists) return false;

    const data = snapshot.data();
    return data?.enabled === true;

  } catch (error: any) {
    // Fail-open on error
    console.error('[Suspension Check] Quick check error - failing open:', error?.message);
    return false;
  }
}
