import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp, getDoc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { deduplicate } from '@/lib/requestDeduplication';

const COLLECTIONS = {
  TOOLTIP_EVENTS: 'bubbleTooltipEvents',
  SESSIONS: 'og_uuid_sessions',
};

// GET: Fetch tooltip events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    const eventsRef = collection(db, COLLECTIONS.TOOLTIP_EVENTS);
    let q;

    if (sessionId) {
      // Remove orderBy to avoid composite index requirement
      q = query(eventsRef, where('sessionId', '==', sessionId));
    } else {
      q = query(eventsRef, orderBy('triggeredAt', 'desc'));
    }

    // Use deduplication to prevent rapid polling reads
    const deduplicationKey = sessionId ? `tooltip-session-${sessionId}` : 'tooltip-all';
    const querySnapshot = await deduplicate(
      deduplicationKey,
      () => getDocs(q),
      2000 // 2s TTL
    );
    let events = querySnapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data() as any;
      return {
        id: data.id || docSnapshot.id,
        sessionId: data.sessionId,
        triggeredAt: data.triggeredAt?.toDate() || new Date(),
        readAt: data.readAt?.toDate() || null,
        isRead: !!data.readAt, // Add isRead flag
        messageId: data.messageId,
        visitorEmail: data.visitorEmail,
      };
    });

    // Sort by triggeredAt after fetching if filtered by sessionId
    if (sessionId) {
      events.sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());
    }

    return NextResponse.json({ tooltips: events }); // Return as 'tooltips' for consistency
  } catch (error) {
    console.error('Error in tooltip GET:', error);
    return NextResponse.json({ error: 'Failed to fetch tooltip events' }, { status: 500 });
  }
}

// PUT: Mark tooltip as read
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const eventsRef = collection(db, COLLECTIONS.TOOLTIP_EVENTS);
    // Remove readAt filter to avoid null query issues
    const q = query(eventsRef, where('sessionId', '==', sessionId));

    // Use deduplication even for PUT to avoid race conditions
    const querySnapshot = await deduplicate(
      `tooltip-update-${sessionId}`,
      () => getDocs(q),
      1000 // 1s TTL for updates
    );
    let updateCount = 0;

    for (const eventDoc of querySnapshot.docs) {
      const data = eventDoc.data();
      // Only update if not already read
      if (!data.readAt) {
        await updateDoc(doc(db, COLLECTIONS.TOOLTIP_EVENTS, eventDoc.id), {
          readAt: serverTimestamp(),
          isRead: true,
        });
        updateCount++;
      }
    }

    // Also update the session to clear the hasUnreadTooltip flag
    if (updateCount > 0) {
      const sessionDocRef = doc(db, COLLECTIONS.SESSIONS, sessionId);
      const sessionDoc = await getDoc(sessionDocRef);
      
      if (sessionDoc.exists()) {
        await updateDoc(sessionDocRef, {
          hasUnreadTooltip: false,
        });
      }
    }

    return NextResponse.json({ success: true, updatedCount: updateCount });
  } catch (error) {
    console.error('Error in tooltip PUT:', error);
    return NextResponse.json({ error: 'Failed to mark tooltip as read' }, { status: 500 });
  }
}
