/**
 * Real-Time Ban Check API with Auto-Unban Support
 * POST /api/visitor-analytics/check-ban-realtime
 * 
 * Checks if a visitor is banned based on their client-generated mask
 * Auto-unbans expired temporary bans (similar to maintenance auto-end)
 * This replaces the proxy.ts ban check to avoid duplicate identity creation
 */

import { NextRequest, NextResponse } from 'next/server';
import { translateMaskToUUID, firestoreGetVisitorDocument } from '@/lib/uuid-sync/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Helper function to auto-unban visitor when temporary ban expires
 * Mirrors maintenance auto-end logic
 */
async function autoUnbanVisitor(uuid: string): Promise<boolean> {
  try {
    const visitorRef = adminDb.collection('og_uuid').doc(uuid);
    
    await visitorRef.update({
      // Unban the visitor
      banned: false,
      
      // Keep ban history for audit
      lastUnbanTimestamp: FieldValue.serverTimestamp(),
      lastUnbanReason: 'System (Auto-Unban - Duration Expired)',
      
      // PERMANENTLY DELETE temp ban fields to save Firestore costs
      banType: FieldValue.delete(),
      banDuration: FieldValue.delete(),
      autoUnbanEnabled: FieldValue.delete(),
      banExpiresAt: FieldValue.delete(),
      
      // Keep permanent ban history fields
      // banReason, banCategory, banTimestamp, bannedBy stay for audit trail
      
      updatedAt: FieldValue.serverTimestamp(),
    });
    
    console.log('[Ban Check] ✅ Auto-unbanned visitor:', uuid.substring(0, 13));
    return true;
  } catch (error: any) {
    console.error('[Ban Check] Failed to auto-unban visitor:', error?.message);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: Use 'banCheck' type with permissive limits
    const rateLimitResult = await checkRateLimit(
      request,
      'banCheck'
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many requests',
          banned: false, // Fail open - don't block on rate limit
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { mask } = body;

    if (!mask || typeof mask !== 'string') {
      return NextResponse.json(
        { error: 'Mask is required' },
        { status: 400 }
      );
    }

    try {
      // Translate mask to UUID
      const uuid = await translateMaskToUUID(mask);
      
      // Get visitor document to check ban status
      const visitorDoc = await firestoreGetVisitorDocument(uuid);
      
      if (visitorDoc && visitorDoc.banned === true) {
        // Check if this is a temporary ban that has expired
        if (visitorDoc.banType === 'temporary' && visitorDoc.autoUnbanEnabled && visitorDoc.banExpiresAt) {
          try {
            // Convert Firestore timestamp to Date
            const expirationTime = visitorDoc.banExpiresAt.toDate ? visitorDoc.banExpiresAt.toDate() : new Date(visitorDoc.banExpiresAt);
            const now = new Date();
            
            if (now >= expirationTime) {
              console.log('[Real-Time Ban Check] ⏱️ Temporary ban expired, auto-unbanning:', mask);
              
              // Attempt to auto-unban
              const success = await autoUnbanVisitor(uuid);
              
              if (success) {
                // Return unbanned status
                return NextResponse.json({
                  banned: false,
                  autoUnbanned: true,  // Flag to indicate auto-unban occurred
                  mask,
                  uuid,
                });
              }
              
              // If auto-unban failed, continue with banned status (fail-safe)
              console.warn('[Real-Time Ban Check] Auto-unban failed, visitor still banned');
            }
          } catch (autoUnbanError: any) {
            // If auto-unban check fails, continue with normal banned flow
            console.error('[Real-Time Ban Check] Auto-unban check error:', autoUnbanError?.message);
          }
        }
        
        // Still banned (permanent or temp not expired or auto-unban failed)
        console.log('[Real-Time Ban Check] Banned visitor detected:', mask);
        return NextResponse.json({
          banned: true,
          banReason: visitorDoc.banReason || 'Security Violation',
          banCategory: visitorDoc.banCategory || 'normal',
          banType: visitorDoc.banType || 'permanent',  // NEW: Include ban type
          banDuration: visitorDoc.banDuration,  // NEW: Include duration
          banExpiresAt: visitorDoc.banExpiresAt?.toDate?.()?.toISOString(),  // NEW: Include expiration
          uuid,
          mask,
        });
      }
      
      // Not banned
      return NextResponse.json({
        banned: false,
        mask,
        uuid,
      });
    } catch (error: any) {
      // Mask not found or error
      console.error('[Real-Time Ban Check] Error:', error.message);
      return NextResponse.json(
        { error: 'Failed to check ban status', details: error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[Real-Time Ban Check] Request error:', error);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
