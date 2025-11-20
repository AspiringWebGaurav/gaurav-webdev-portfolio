/**
 * Code Gate Ban Check API
 * Checks if a visitor is banned from code gate and returns hint if applicable
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import admin from 'firebase-admin';

/**
 * POST /api/code-gate/check-ban
 * Checks if visitor is banned from code gate attempts
 */
export async function POST(request: NextRequest) {
  try {
    const visitorId = request.headers.get('x-visitor-id');

    if (!visitorId) {
      return NextResponse.json({
        banned: false,
        isCodeGateBan: false
      });
    }

    // Check for active code gate ban
    const now = admin.firestore.Timestamp.now();
    
    const banQuery = await adminDb
      .collection('codeBans')
      .where('visitorId', '==', visitorId)
      .where('expiresAt', '>', now)
      .limit(1)
      .get();

    if (banQuery.empty) {
      return NextResponse.json({
        banned: false,
        isCodeGateBan: false
      });
    }

    // User is banned from code gate - fetch hint
    const hintDoc = await adminDb
      .collection('config')
      .where('label', '==', 'ban-hint')
      .where('enabled', '==', true)
      .limit(1)
      .get();

    let hint = 'Sometimes the answer is in the journey, not the destination. Think about how you got here.';
    
    if (!hintDoc.empty) {
      hint = hintDoc.docs[0].data().hint;
    }

    const banData = banQuery.docs[0].data();
    const expiresAt = banData.expiresAt.toDate();

    return NextResponse.json({
      banned: true,
      isCodeGateBan: true,
      reason: banData.reason,
      expiresAt: expiresAt.toISOString(),
      hint,
      attemptCount: banData.attemptCount
    });

  } catch (error) {
    console.error('Code gate ban check error:', error);
    return NextResponse.json({
      banned: false,
      isCodeGateBan: false
    }, { status: 500 });
  }
}
