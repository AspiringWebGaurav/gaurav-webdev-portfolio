/**
 * Ban Hint API
 * Returns the subtle hint for banned users
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * GET /api/code-gate/ban-hint
 * Returns the configured ban hint
 */
export async function GET(request: NextRequest) {
  try {
    const hintDoc = await adminDb
      .collection('config')
      .where('label', '==', 'ban-hint')
      .where('enabled', '==', true)
      .limit(1)
      .get();

    if (hintDoc.empty) {
      // Default hint if not configured
      return NextResponse.json({
        hint: 'Sometimes the answer is in the journey, not the destination. Think about how you got here.'
      });
    }

    const hintData = hintDoc.docs[0].data();

    return NextResponse.json({
      hint: hintData.hint
    });

  } catch (error) {
    console.error('Ban hint error:', error);
    return NextResponse.json(
      { hint: 'Access denied.' },
      { status: 500 }
    );
  }
}
