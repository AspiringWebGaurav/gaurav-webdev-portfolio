import { NextRequest, NextResponse } from 'next/server';
import { updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const COLLECTIONS = {
  SESSIONS: 'og_uuid_sessions',
  MESSAGES: 'bubbleMessages',
};

/**
 * POST /api/bubble/sessions/restore (UUID-sync compatible)
 * Restores a soft-deleted session by removing the deletedAt timestamp
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    console.log('[RESTORE SESSION] Restoring UUID:', sessionId);

    // Get session using UUID as document ID
    const sessionDocRef = doc(db, COLLECTIONS.SESSIONS, sessionId);
    const sessionDoc = await getDoc(sessionDocRef);

    if (!sessionDoc.exists()) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const sessionData = sessionDoc.data();

    // Check if it's actually deleted
    if (!sessionData.deletedAt) {
      return NextResponse.json({ error: 'Session is not deleted' }, { status: 400 });
    }

    // Remove the deletedAt timestamp to restore
    await updateDoc(sessionDocRef, {
      deletedAt: null,
    });

    console.log('[RESTORE SESSION] ✓ Restored UUID:', sessionId);

    return NextResponse.json({
      success: true,
      session: {
        id: sessionId,  // UUID
        mask: sessionData.mask,  // Public mask
        visitorEmail: sessionData.visitorEmail,
        startedAt: sessionData.startedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        lastActive: sessionData.lastActive?.toDate?.()?.toISOString() || new Date().toISOString(),
        messageCount: sessionData.messageCount || 0,
        unreadAdminReplies: sessionData.unreadAdminReplies || 0,
        hasUnreadTooltip: sessionData.hasUnreadTooltip || false,
      },
    });
  } catch (error) {
    console.error('[RESTORE SESSION] Error:', error);
    return NextResponse.json({ error: 'Failed to restore session' }, { status: 500 });
  }
}
