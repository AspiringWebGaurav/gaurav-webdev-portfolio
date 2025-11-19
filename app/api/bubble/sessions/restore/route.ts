import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const COLLECTIONS = {
  SESSIONS: 'bubbleSessions',
  MESSAGES: 'bubbleMessages',
};

/**
 * POST /api/bubble/sessions/restore
 * Restores a soft-deleted session by removing the deletedAt timestamp
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Find the session by its original ID (not Firestore doc ID)
    const sessionsRef = collection(db, COLLECTIONS.SESSIONS);
    const q = query(sessionsRef, where('id', '==', sessionId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const sessionDoc = querySnapshot.docs[0];
    const sessionData = sessionDoc.data();

    // Check if it's actually deleted
    if (!sessionData.deletedAt) {
      return NextResponse.json({ error: 'Session is not deleted' }, { status: 400 });
    }

    // Remove the deletedAt timestamp to restore
    await updateDoc(doc(db, COLLECTIONS.SESSIONS, sessionDoc.id), {
      deletedAt: null,
    });

    return NextResponse.json({
      success: true,
      session: {
        id: sessionData.id,
        visitorEmail: sessionData.visitorEmail,
        startedAt: sessionData.startedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        lastActive: sessionData.lastActive?.toDate?.()?.toISOString() || new Date().toISOString(),
        messageCount: sessionData.messageCount || 0,
        unreadAdminReplies: sessionData.unreadAdminReplies || 0,
        hasUnreadTooltip: sessionData.hasUnreadTooltip || false,
      },
    });
  } catch (error) {
    console.error('Error restoring session:', error);
    return NextResponse.json({ error: 'Failed to restore session' }, { status: 500 });
  }
}
