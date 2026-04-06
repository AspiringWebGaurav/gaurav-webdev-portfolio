/**
 * Enhanced Identification API
 * 
 * Transaction-safe identity resolution:
 * 1. Check primary fingerprint
 * 2. Create new identity if no match (using transaction to prevent race conditions)
 * 3. Return visitor data
 * 
 * IMPORTANT: Uses Firestore transactions to prevent duplicate UUIDs
 * when multiple concurrent requests arrive with the same fingerprint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { deduplicate } from '@/lib/requestDeduplication';
import logger from '@/lib/logger';

const COLLECTIONS = {
  VISITOR_PROFILES: 'og_uuid',
  FINGERPRINTS: 'og_uuid_fingerprints',
  MASKS: 'og_uuid_masks',
};

export async function POST(request: NextRequest) {
  try {
    // Handle empty body (OPTIONS requests, etc.)
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON body',
      }, { status: 400 });
    }
    
    const {
      fingerprint,
      userAgent,
      language,
      screenResolution,
      timezone,
    } = body;
    
    if (!fingerprint) {
      return NextResponse.json({
        success: false,
        error: 'Fingerprint is required',
      }, { status: 400 });
    }
    
    // Get client IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || request.headers.get('x-real-ip') 
      || 'unknown';
    
    const now = Timestamp.now();
    const fpHash = hashFingerprint(fingerprint);
    
    // Process fingerprint silently
    
    // CRITICAL: Deduplicate by fingerprint to prevent multiple identities
    // from being created when client makes concurrent requests
    const result = await deduplicate(
      `identify-${fpHash}`,
      async () => {
        // OPTIMIZATION: Pre-transaction check for existing fingerprint
        // This prevents expensive transactions for 99% of requests (returning visitors)
        const fpRef = adminDb.collection(COLLECTIONS.FINGERPRINTS).doc(fpHash);
        const preCheckDoc = await fpRef.get();
        
        if (preCheckDoc.exists) {
          // Fingerprint exists, skip transaction
          const fpData = preCheckDoc.data()!;
          const visitorRef = adminDb.collection(COLLECTIONS.VISITOR_PROFILES).doc(fpData.uuid);
          const visitorSnap = await visitorRef.get();
          const visitorData = visitorSnap.data();
          
          // Update last seen without transaction (faster)
          await visitorRef.update({
            lastSeenAt: now,
            updatedAt: now,
            visitCount: FieldValue.increment(1),
            ipAddress: ip,
          });
          
          return {
            uuid: fpData.uuid,
            mask: fpData.mask,
            isNewIdentity: false,
            matchedSignal: 'fingerprint',
            banned: visitorData?.banned || false,
            banReason: visitorData?.banReason || null,
            banCategory: visitorData?.banCategory || null,
            visitCount: (visitorData?.visitCount || 0) + 1,
            firstSeenAt: visitorData?.firstSeenAt,
            lastSeenAt: now,
          };
        }
        
        // New fingerprint, starting transaction
        
        // Use transaction to prevent race conditions for NEW visitors only
        return await adminDb.runTransaction(async (transaction) => {
          // Step 1: Double-check if fingerprint exists (another request might have created it)
          const fpDoc = await transaction.get(fpRef);
          
          if (fpDoc.exists) {
            // Identity was created by another concurrent request - return it
            // Fingerprint now exists (concurrent creation)
            const fpData = fpDoc.data()!;
            const visitorRef = adminDb.collection(COLLECTIONS.VISITOR_PROFILES).doc(fpData.uuid);
            const visitorDoc = await transaction.get(visitorRef);
            const visitorData = visitorDoc.data();
            
            // Update last seen
            transaction.update(visitorRef, {
              lastSeenAt: now,
              updatedAt: now,
              visitCount: FieldValue.increment(1),
              ipAddress: ip,
            });
            
            return {
              uuid: fpData.uuid,
              mask: fpData.mask,
              isNewIdentity: false,
              matchedSignal: 'fingerprint',
              banned: visitorData?.banned || false,
              banReason: visitorData?.banReason || null,
              banCategory: visitorData?.banCategory || null,
              visitCount: (visitorData?.visitCount || 0) + 1,
              firstSeenAt: visitorData?.firstSeenAt,
              lastSeenAt: now,
            };
          }
      
      // Step 2: Create new identity (inside transaction to prevent duplicates)
      const uuid = crypto.randomUUID();
      const mask = `device_${Math.random().toString(36).substring(2, 12)}`;
      
      // Creating new identity
      
      const visitorRef = adminDb.collection(COLLECTIONS.VISITOR_PROFILES).doc(uuid);
      const maskRef = adminDb.collection(COLLECTIONS.MASKS).doc(mask);
      
      // Create visitor profile
      transaction.set(visitorRef, {
        uuid,
        mask,
        fingerprint,
        createdAt: now,
        updatedAt: now,
        firstSeenAt: now,
        lastSeenAt: now,
        visitCount: 1,
        banned: false,
        ipAddress: ip,
        userAgent: userAgent || null,
        language: language || null,
        screenResolution: screenResolution || null,
        timezone: timezone || null,
        identityMethod: 'enhanced',
      });
      
      // Create fingerprint index
      transaction.set(fpRef, {
        fingerprint,
        uuid,
        mask,
        createdAt: now,
      });
      
      // Create mask lookup
      transaction.set(maskRef, {
        mask,
        uuid,
        createdAt: now,
      });
      
      // New identity created successfully
      
      return {
        uuid,
        mask,
        isNewIdentity: true,
        matchedSignal: 'new',
        banned: false,
        banReason: null,
        banCategory: null,
        visitCount: 1,
        firstSeenAt: now,
        lastSeenAt: now,
      };
    });
  },
  2000 // 2s TTL - prevent concurrent identity creation
);

    // Identity resolved
    
    return NextResponse.json({
      success: true,
      uuid: result.uuid,
      mask: result.mask,
      isNewIdentity: result.isNewIdentity,
      matchedSignal: result.matchedSignal,
      banned: result.banned,
      banReason: result.banReason,
      banCategory: result.banCategory,
      visitor: {
        uuid: result.uuid,
        mask: result.mask,
        firstSeenAt: result.firstSeenAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        lastSeenAt: result.lastSeenAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        visitCount: result.visitCount,
      },
    });
    
  } catch (error: any) {
    console.error('[IdentifyEnhanced] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to identify visitor',
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
