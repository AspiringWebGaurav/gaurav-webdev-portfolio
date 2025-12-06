/**
 * Restore Visitor API
 * 
 * Restores a visitor from the recycle bin:
 * 1. Verify admin authentication
 * 2. Retrieve saved visitor data from recycleBin
 * 3. Restore to og_uuid collection
 * 4. Restore identity graph (fingerprints, signals)
 * 5. Delete from recycle bin
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyAuth } from '@/lib/firebaseAdmin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

const COLLECTIONS = {
  RECYCLE_BIN: 'recycleBin',
  VISITOR_PROFILES: 'og_uuid',
  FINGERPRINTS: 'og_uuid_fingerprints',
  MASKS: 'og_uuid_masks',
  SESSIONS: 'og_uuid_sessions',
};

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Missing token" },
        { status: 401 }
      );
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await verifyAuth(idToken);
    
    if (!decodedToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    console.log(`[Restore API] Authenticated as: ${decodedToken.email || decodedToken.uid}`);

    const body = await request.json();
    const { recycleBinItemId, originalId, source } = body;
    
    // Find the recycle bin item
    let recycleBinDoc;
    
    if (recycleBinItemId) {
      recycleBinDoc = await adminDb.collection(COLLECTIONS.RECYCLE_BIN).doc(recycleBinItemId).get();
    } else if (originalId && source) {
      // Find by original ID and source
      const query = await adminDb.collection(COLLECTIONS.RECYCLE_BIN)
        .where('originalId', '==', originalId)
        .where('source', '==', source)
        .limit(1)
        .get();
      
      if (!query.empty) {
        recycleBinDoc = query.docs[0];
      }
    }
    
    if (!recycleBinDoc || !recycleBinDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Recycle bin item not found',
      }, { status: 404 });
    }
    
    const recycleBinData = recycleBinDoc.data();
    const originalData = recycleBinData?.data;
    const uuid = recycleBinData?.originalId;
    
    if (!uuid || !originalData) {
      return NextResponse.json({
        success: false,
        error: 'Invalid recycle bin item data',
      }, { status: 400 });
    }
    
    // Check source type
    if (recycleBinData?.source !== 'visitor-analytics' && recycleBinData?.source !== 'og_uuid') {
      return NextResponse.json({
        success: false,
        error: 'Cannot restore: not a visitor-analytics item',
      }, { status: 400 });
    }
    
    const now = Timestamp.now();
    const batch = adminDb.batch();
    
    // Step 1: Restore visitor profile
    const visitorRef = adminDb.collection(COLLECTIONS.VISITOR_PROFILES).doc(uuid);
    
    // Clean up the data - remove recycleBin metadata
    const restoredVisitorData = {
      ...originalData,
      // Ensure required fields
      uuid,
      banned: originalData.banned ?? false,
      // Update timestamps
      updatedAt: now,
      restoredAt: now,
      restoredFrom: 'recycleBin',
      // Remove delete markers
      deleted: FieldValue.delete(),
      deletedAt: FieldValue.delete(),
    };
    
    // Handle mask - might be stored in different places
    const mask = originalData.mask 
      || originalData.deviceId 
      || recycleBinData?.mask 
      || `device_${uuid.substring(0, 10)}`;
    
    restoredVisitorData.mask = mask;
    
    batch.set(visitorRef, restoredVisitorData);
    
    // Step 2: Restore fingerprint lookup (if fingerprint exists)
    const fingerprint = originalData.fingerprint || originalData.primaryFingerprint;
    if (fingerprint) {
      const fpHash = hashFingerprint(fingerprint);
      const fpRef = adminDb.collection(COLLECTIONS.FINGERPRINTS).doc(fpHash);
      batch.set(fpRef, {
        fingerprint,
        uuid,
        mask,
        createdAt: originalData.createdAt || now,
        restoredAt: now,
      });
    }
    
    // Step 3: Restore mask lookup
    if (mask) {
      const maskRef = adminDb.collection(COLLECTIONS.MASKS).doc(mask);
      batch.set(maskRef, {
        mask,
        uuid,
        createdAt: originalData.createdAt || now,
        restoredAt: now,
      });
    }
    
    // Step 4: Delete from recycle bin
    batch.delete(recycleBinDoc.ref);
    
    // Commit the batch
    await batch.commit();
    
    console.log('[Restore] Successfully restored visitor', { 
      uuid: uuid.substring(0, 13), 
      mask: mask.substring(0, 15),
      hadFingerprint: !!fingerprint,
      restoredBy: decodedToken.email || decodedToken.uid,
    });
    
    // Audit log
    console.log('[AUDIT] Admin restored visitor:', {
      adminId: decodedToken.uid,
      adminEmail: decodedToken.email,
      visitorUUID: uuid,
      visitorMask: mask,
      timestamp: new Date(),
    });
    
    return NextResponse.json({
      success: true,
      uuid,
      mask,
      message: 'Visitor restored successfully',
      restoredData: {
        uuid,
        mask,
        fingerprint: fingerprint ? `${fingerprint.substring(0, 20)}...` : null,
        banned: restoredVisitorData.banned,
      },
    });
    
  } catch (error: any) {
    console.error('[Restore] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to restore visitor',
    }, { status: 500 });
  }
}

// Hash fingerprint for document ID
function hashFingerprint(fingerprint: string): string {
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'fp_' + Math.abs(hash).toString(36);
}
