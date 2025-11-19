import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const COLLECTIONS = {
  BUBBLE_SESSIONS: 'bubbleSessions',
};

/**
 * UUID-Only Session Management API
 * 
 * Simple, stateless session handling:
 * - No cookies, no tokens, no authentication
 * - Pure device_ UUID based identification
 * - All state stored server-side in Firebase
 * - Client sends UUID with every request
 */

/**
 * GET: Fetch session by UUID
 * Query param: visitorId (device_xxx)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const visitorId = searchParams.get('visitorId');

    if (!visitorId) {
      return NextResponse.json(
        { error: 'visitorId required' },
        { status: 400 }
      );
    }

    if (!visitorId.startsWith('device_')) {
      return NextResponse.json(
        { error: 'Invalid visitorId format. Must start with device_' },
        { status: 400 }
      );
    }

    console.log('[Session API] Fetching session for:', visitorId);

    // Fetch session from Firebase
    const sessionsRef = collection(db, COLLECTIONS.BUBBLE_SESSIONS);
    const q = query(sessionsRef, where('id', '==', visitorId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json(
        { error: 'Session not found', exists: false },
        { status: 404 }
      );
    }

    const sessionDoc = snapshot.docs[0];
    const sessionData = sessionDoc.data();

    // Don't return deleted sessions
    if (sessionData.deletedAt) {
      return NextResponse.json(
        { error: 'Session not found', exists: false },
        { status: 404 }
      );
    }

    console.log('[Session API] ✓ Session found:', visitorId);

    const response = NextResponse.json({
      success: true,
      exists: true,
      session: {
        id: sessionData.id,
        deviceFingerprint: sessionData.deviceFingerprint,
        visitorEmail: sessionData.visitorEmail,
        startedAt: sessionData.startedAt?.toDate() || new Date(),
        lastActive: sessionData.lastActive?.toDate() || new Date(),
        messageCount: sessionData.messageCount || 0,
        unreadAdminReplies: sessionData.unreadAdminReplies || 0,
        hasUnreadTooltip: sessionData.hasUnreadTooltip || false,
        visitorOnline: sessionData.visitorOnline || false,
      },
    });
    
    // Add headers for faster polling - allow quick revalidation
    response.headers.set('Cache-Control', 'no-cache, must-revalidate');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    
    return response;
  } catch (error) {
    console.error('[Session API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

/**
 * POST: Create or reactivate session
 * Body: { visitorId: "device_xxx" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { visitorId } = body;

    if (!visitorId) {
      return NextResponse.json(
        { error: 'visitorId required' },
        { status: 400 }
      );
    }

    if (!visitorId.startsWith('device_')) {
      return NextResponse.json(
        { error: 'Invalid visitorId format. Must start with device_' },
        { status: 400 }
      );
    }

    console.log('[Session API] Creating/reactivating session:', visitorId);

    // Check if session already exists
    const sessionsRef = collection(db, COLLECTIONS.BUBBLE_SESSIONS);
    const existingQuery = query(sessionsRef, where('id', '==', visitorId));
    const existingSnapshot = await getDocs(existingQuery);

    if (existingSnapshot.empty) {
      // Create new session
      const sessionData = {
        id: visitorId,
        deviceFingerprint: visitorId,
        startedAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        messageCount: 0,
        unreadAdminReplies: 0,
        hasUnreadTooltip: false,
        visitorEmail: null,
        visitorOnline: true,
        adminOnline: false,
        deletedAt: null,
      };

      await addDoc(sessionsRef, sessionData);
      console.log('[Session API] ✓ Created new session:', visitorId);

      return NextResponse.json({
        success: true,
        sessionId: visitorId,
        message: 'Session created',
        created: true,
      });
    } else {
      // Reactivate existing session
      const sessionDoc = existingSnapshot.docs[0];
      await updateDoc(sessionDoc.ref, {
        lastActive: serverTimestamp(),
        visitorOnline: true,
      });

      console.log('[Session API] ✓ Reactivated session:', visitorId);

      return NextResponse.json({
        success: true,
        sessionId: visitorId,
        message: 'Session reactivated',
        created: false,
      });
    }
  } catch (error) {
    console.error('[Session API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

/**
 * PUT: Update session (email, online status, etc.)
 * Body: { visitorId: "device_xxx", updates: {...} }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { visitorId, updates } = body;

    if (!visitorId) {
      return NextResponse.json(
        { error: 'visitorId required' },
        { status: 400 }
      );
    }

    console.log('[Session API] Updating session:', visitorId, updates);

    const sessionsRef = collection(db, COLLECTIONS.BUBBLE_SESSIONS);
    const q = query(sessionsRef, where('id', '==', visitorId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const sessionDoc = snapshot.docs[0];
    await updateDoc(sessionDoc.ref, {
      ...updates,
      lastActive: serverTimestamp(),
    });

    console.log('[Session API] ✓ Session updated:', visitorId);

    return NextResponse.json({
      success: true,
      message: 'Session updated',
    });
  } catch (error) {
    console.error('[Session API] PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Mark session as deleted (soft delete)
 * Body: { visitorId: "device_xxx" }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { visitorId } = body;

    if (!visitorId) {
      return NextResponse.json(
        { error: 'visitorId required' },
        { status: 400 }
      );
    }

    console.log('[Session API] Deleting session:', visitorId);

    const sessionsRef = collection(db, COLLECTIONS.BUBBLE_SESSIONS);
    const q = query(sessionsRef, where('id', '==', visitorId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const sessionDoc = snapshot.docs[0];
    await updateDoc(sessionDoc.ref, {
      deletedAt: serverTimestamp(),
      visitorOnline: false,
    });

    console.log('[Session API] ✓ Session deleted:', visitorId);

    return NextResponse.json({
      success: true,
      message: 'Session deleted',
    });
  } catch (error) {
    console.error('[Session API] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}
