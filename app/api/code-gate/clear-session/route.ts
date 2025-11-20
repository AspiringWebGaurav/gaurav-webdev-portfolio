/**
 * Clear Code Gate Session API
 * Removes code gate clearance when user logs out
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * POST /api/code-gate/clear-session
 * Clears code gate clearance for a visitor (called on logout)
 */
export async function POST(request: NextRequest) {
  try {
    const visitorId = request.headers.get('x-visitor-id');

    if (!visitorId) {
      return NextResponse.json(
        { success: false, message: 'Visitor ID required' },
        { status: 400 }
      );
    }

    // Delete all code gate sessions for this visitor
    const sessionsSnapshot = await adminDb
      .collection('codeGateSessions')
      .where('visitorId', '==', visitorId)
      .get();

    const batch = adminDb.batch();
    sessionsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    console.log('[CodeGate] 🗑️  Cleared', sessionsSnapshot.size, 'sessions for:', visitorId.substring(0, 16) + '...');

    return NextResponse.json({ 
      success: true,
      cleared: sessionsSnapshot.size 
    });

  } catch (error) {
    console.error('Clear session error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to clear session' },
      { status: 500 }
    );
  }
}
