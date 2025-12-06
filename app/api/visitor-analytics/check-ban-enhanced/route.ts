/**
 * Enhanced Ban Check API
 * 
 * Simple ban verification via fingerprint lookup.
 * Returns banned=true if fingerprint matches a banned identity.
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

const COLLECTION = 'og_uuid';
const FINGERPRINTS_COLLECTION = 'og_uuid_fingerprints';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fingerprint, uuid } = body;
    
    // Quick check: if UUID provided, check directly first
    if (uuid) {
      const visitorDoc = await adminDb.collection(COLLECTION).doc(uuid).get();
      if (visitorDoc.exists && visitorDoc.data()?.banned === true) {
        const data = visitorDoc.data();
        return NextResponse.json({
          banned: true,
          reason: data?.banReason || 'Account banned',
          category: data?.banCategory || 'unknown',
          matchedSignal: 'uuid',
          uuid,
          mask: data?.mask,
        });
      }
    }
    
    // Check via fingerprint lookup
    if (fingerprint) {
      const fpHash = hashFingerprint(fingerprint);
      const fpDoc = await adminDb.collection(FINGERPRINTS_COLLECTION).doc(fpHash).get();
      
      if (fpDoc.exists) {
        const fpData = fpDoc.data();
        const visitorDoc = await adminDb.collection(COLLECTION).doc(fpData?.uuid).get();
        
        if (visitorDoc.exists && visitorDoc.data()?.banned === true) {
          const data = visitorDoc.data();
          console.log('[BanCheckEnhanced] Ban detected via fingerprint', { 
            mask: data?.mask?.substring(0, 15) 
          });
          
          return NextResponse.json({
            banned: true,
            reason: data?.banReason || 'Account banned',
            category: data?.banCategory || 'unknown',
            matchedSignal: 'fingerprint',
            uuid: fpData?.uuid,
            mask: data?.mask,
          });
        }
      }
    }
    
    // Not banned
    return NextResponse.json({ banned: false });
    
  } catch (error: any) {
    console.error('[BanCheckEnhanced] Error:', error);
    return NextResponse.json({ banned: false, error: 'Error checking ban status' });
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const uuid = searchParams.get('uuid');
  const fingerprint = searchParams.get('fingerprint');
  
  try {
    // Quick UUID check
    if (uuid) {
      const visitorDoc = await adminDb.collection(COLLECTION).doc(uuid).get();
      if (visitorDoc.exists && visitorDoc.data()?.banned === true) {
        const data = visitorDoc.data();
        return NextResponse.json({
          banned: true,
          reason: data?.banReason || 'Account banned',
          category: data?.banCategory || 'unknown',
        });
      }
    }
    
    // Fingerprint check
    if (fingerprint) {
      const fpHash = hashFingerprint(fingerprint);
      const fpDoc = await adminDb.collection(FINGERPRINTS_COLLECTION).doc(fpHash).get();
      
      if (fpDoc.exists) {
        const fpData = fpDoc.data();
        const visitorDoc = await adminDb.collection(COLLECTION).doc(fpData?.uuid).get();
        
        if (visitorDoc.exists && visitorDoc.data()?.banned === true) {
          const data = visitorDoc.data();
          return NextResponse.json({
            banned: true,
            reason: data?.banReason || 'Account banned',
            category: data?.banCategory || 'unknown',
          });
        }
      }
    }
    
    return NextResponse.json({ banned: false });
    
  } catch (error: any) {
    console.error('[BanCheckEnhanced] GET Error:', error);
    return NextResponse.json({ banned: false });
  }
}
