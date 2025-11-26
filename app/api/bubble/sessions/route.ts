import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, orderBy, limit, updateDoc, doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { rateLimitMiddleware } from '@/lib/rateLimit';
import { translateMaskToUUID, firestoreGetVisitorDocument } from '@/lib/uuid-sync/server';
import { MaskNotFoundError, UUIDValidationError } from '@/lib/uuid-sync/errors';
import { headers } from 'next/headers';

const COLLECTIONS = {
  SESSIONS: 'og_uuid_sessions',
  MESSAGES: 'bubbleMessages',
};

// GET: Fetch session by mask, or list all sessions (admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mask = searchParams.get('mask');  // Changed from sessionId
    const allSessions = searchParams.get('allSessions') === 'true';
    const fingerprint = searchParams.get('fingerprint');

    // Skip rate limiting for admin endpoints (allSessions)
    if (!allSessions) {
      // Rate limiting only for visitor endpoints
      const { response: rateLimitResponse, headers: rateLimitHeaders } = await rateLimitMiddleware(request, 'general', { 
        sessionId: mask || undefined, 
        fingerprint: fingerprint || undefined 
      });
      if (rateLimitResponse) return rateLimitResponse;
    }

    // Admin endpoint: List all sessions
    if (allSessions) {
      // Require admin authentication
      const authHeader = request.headers.get('authorization');
      const isTestMode = request.headers.get('x-test-mode') === 'true';
      
      // Only bypass auth in test mode
      if (!isTestMode) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        // Verify the token
        try {
          const admin = (await import('firebase-admin')).default;
          const token = authHeader.split('Bearer ')[1];
          await admin.auth().verifyIdToken(token);
        } catch (error) {
          return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
      }
      
      const sessionsRef = collection(db, COLLECTIONS.SESSIONS);
      const q = query(
        sessionsRef,
        orderBy('lastActive', 'desc'),
        limit(100)
      );
      const querySnapshot = await getDocs(q);

      // Map sessions with UUID as id
      const sessionsData = querySnapshot.docs.map(docSnapshot => {
        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,  // UUID from doc ID
          mask: data.mask,     // Mask from document
          deviceFingerprint: data.deviceFingerprint,
          visitorEmail: data.visitorEmail,
          startedAt: data.startedAt?.toDate() || new Date(),
          lastActive: data.lastActive?.toDate() || new Date(),
          messageCount: data.messageCount || 0,
          unreadAdminReplies: data.unreadAdminReplies || 0,
          unreadVisitorMessages: data.unreadVisitorMessages || 0,
          hasUnreadTooltip: data.hasUnreadTooltip || false,
          visitorOnline: data.visitorOnline || false,
          adminOnline: data.adminOnline || false,
          visitorLastSeen: data.visitorLastSeen?.toDate() || null,
          adminLastSeen: data.adminLastSeen?.toDate() || null,
          status: data.status || 'pending',
          deletedAt: data.deletedAt || null,
        };
      });

      // Filter out soft-deleted sessions and empty sessions
      const activeSessions = sessionsData.filter(session => 
        !session.deletedAt && session.messageCount > 0
      );

      // Check for unread visitor messages in each session
      const messagesRef = collection(db, COLLECTIONS.MESSAGES);
      const sessionsWithUnreadStatus = await Promise.all(
        activeSessions.map(async (session) => {
          // Query for unread visitor messages (role: visitor, read: false)
          const unreadQuery = query(
            messagesRef,
            where('sessionId', '==', session.id),
            where('role', '==', 'visitor'),
            where('read', '==', false),
            limit(1)
          );
          const unreadSnapshot = await getDocs(unreadQuery);
          
          return {
            ...session,
            hasUnreadMessages: !unreadSnapshot.empty,
          };
        })
      );

      return NextResponse.json({ sessions: sessionsWithUnreadStatus, success: true });
    }

    // Visitor endpoint: Fetch specific session by mask
    if (!mask) {
      return NextResponse.json({ error: 'Mask required for GET' }, { status: 400 });
    }
    
    // Translate mask to UUID with robust error handling
    let uuid: string;
    try {
      uuid = await translateMaskToUUID(mask);
    } catch (error: any) {
      if (error instanceof MaskNotFoundError) {
        return NextResponse.json({ error: 'Mask not found' }, { status: 404 });
      }
      if (error instanceof UUIDValidationError) {
        return NextResponse.json({ error: `Invalid mask format: ${error.message}` }, { status: 400 });
      }
      throw error;
    }
    
    // Fetch session by UUID (document ID)
    const sessionDocRef = doc(db, COLLECTIONS.SESSIONS, uuid);
    const sessionDoc = await getDoc(sessionDocRef);

    if (!sessionDoc.exists()) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const sessionData = sessionDoc.data();

    // Return 404 if session is soft-deleted
    if (sessionData.deletedAt) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({
      session: {
        id: uuid,
        mask: sessionData.mask,
        role: sessionData.role || 'visitor',
        status: sessionData.status || 'pending',
        visitorEmail: sessionData.visitorEmail,
        deviceFingerprint: sessionData.deviceFingerprint,
        startedAt: sessionData.startedAt?.toDate() || new Date(),
        lastActive: sessionData.lastActive?.toDate() || new Date(),
        messageCount: sessionData.messageCount || 0,
        unreadAdminReplies: sessionData.unreadAdminReplies || 0,
        unreadVisitorMessages: sessionData.unreadVisitorMessages || 0,
        hasUnreadTooltip: sessionData.hasUnreadTooltip || false,
        visitorOnline: sessionData.visitorOnline || false,
        adminOnline: sessionData.adminOnline || false,
      },
    });
  } catch (error) {
    console.error('[Bubble Sessions API] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

// POST: Create new session using UUID-sync
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mask, role, fingerprint, turnstileToken } = body;

    if (!mask) {
      return NextResponse.json(
        { error: 'mask required' },
        { status: 400 }
      );
    }

    // ENHANCED: Strict rate limiting for session creation (prevent bot spam)
    const { response: rateLimitResponse, headers: rateLimitHeaders } = await rateLimitMiddleware(
      request, 
      'sessionCreate', 
      { 
        fingerprint: fingerprint || mask,
        turnstileToken 
      }
    );
    if (rateLimitResponse) return rateLimitResponse;

    // Translate mask to UUID with robust error handling
    let uuid: string;
    try {
      uuid = await translateMaskToUUID(mask);
    } catch (error: any) {
      if (error instanceof MaskNotFoundError) {
        return NextResponse.json(
          { error: `Mask not found: ${mask}`, success: false },
          { status: 404 }
        );
      }
      if (error instanceof UUIDValidationError) {
        return NextResponse.json(
          { error: `Invalid mask format: ${error.message}`, success: false },
          { status: 400 }
        );
      }
      throw error;
    }

    // Get fingerprint from headers for logging/tracking
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "";
    const ipAddress = headersList.get("x-forwarded-for") || 
                     headersList.get("x-real-ip") || 
                     "unknown";
    const deviceFingerprint = fingerprint || `${ipAddress}_${userAgent}`;

    // Use UUID as document ID (same as visitor profiles)
    const sessionDocRef = doc(db, COLLECTIONS.SESSIONS, uuid);
    
    // Check if session already exists
    const existingDoc = await getDoc(sessionDocRef);

    if (existingDoc.exists()) {
      const data = existingDoc.data();
      const response = NextResponse.json({
        success: true,
        session: {
          id: uuid,
          mask: mask,
          ...data,
          startedAt: data.startedAt?.toDate(),
          lastActive: data.lastActive?.toDate(),
        },
      });
      
      // Add rate limit headers
      Object.entries(rateLimitHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      return response;
    }

    // Create new session document with UUID as ID
    const sessionData = {
      mask: mask,  // Use the mask provided by client
      role: role || 'visitor',
      status: 'pending',
      deviceFingerprint: deviceFingerprint,
      startedAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      messageCount: 0,
      unreadAdminReplies: 0,
      unreadVisitorMessages: 0,
      hasUnreadTooltip: false,
      visitorOnline: true,
      adminOnline: false,
      deletedAt: null,
    };

    await setDoc(sessionDocRef, sessionData);
    
    return NextResponse.json({
      success: true,
      session: {
        id: uuid,
        mask: mask,
        role: sessionData.role,
        status: sessionData.status,
        deviceFingerprint: sessionData.deviceFingerprint,
        startedAt: new Date(),
        lastActive: new Date(),
        messageCount: 0,
        unreadAdminReplies: 0,
        unreadVisitorMessages: 0,
        hasUnreadTooltip: false,
      },
    });
  } catch (error) {
    console.error('[Bubble Sessions API] POST error:', error);
    return NextResponse.json({ error: 'Failed to create session', success: false }, { status: 500 });
  }
}

// PUT: Update session using UUID-sync
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { mask, visitorEmail, markTooltipRead } = body;

    if (!mask) {
      return NextResponse.json({ error: 'Mask required' }, { status: 400 });
    }

    // Translate mask to UUID with robust error handling
    let uuid: string;
    try {
      uuid = await translateMaskToUUID(mask);
    } catch (error: any) {
      if (error instanceof MaskNotFoundError) {
        return NextResponse.json(
          { error: `Mask not found: ${mask}`, success: false },
          { status: 404 }
        );
      }
      if (error instanceof UUIDValidationError) {
        return NextResponse.json(
          { error: `Invalid mask format: ${error.message}`, success: false },
          { status: 400 }
        );
      }
      throw error;
    }
    const sessionDocRef = doc(db, COLLECTIONS.SESSIONS, uuid);

    // Check if session exists
    const sessionDoc = await getDoc(sessionDocRef);
    if (!sessionDoc.exists()) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const updateData: any = {
      lastActive: serverTimestamp(),
    };

    if (visitorEmail) {
      updateData.visitorEmail = visitorEmail;
    }

    if (markTooltipRead) {
      updateData.hasUnreadTooltip = false;
      updateData.unreadAdminReplies = 0;
    }

    await updateDoc(sessionDocRef, updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Bubble Sessions API] PUT error:', error);
    return NextResponse.json({ error: 'Failed to update session', success: false }, { status: 500 });
  }
}

// PATCH: Update session status and other fields using UUID-sync
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { mask, status, visitorOnline, adminOnline } = body;

    if (!mask) {
      return NextResponse.json({ error: 'Mask required' }, { status: 400 });
    }

    // Translate mask to UUID with robust error handling
    let uuid: string;
    try {
      uuid = await translateMaskToUUID(mask);
    } catch (error: any) {
      if (error instanceof MaskNotFoundError) {
        return NextResponse.json(
          { error: `Mask not found: ${mask}`, success: false },
          { status: 404 }
        );
      }
      if (error instanceof UUIDValidationError) {
        return NextResponse.json(
          { error: `Invalid mask format: ${error.message}`, success: false },
          { status: 400 }
        );
      }
      throw error;
    }
    const sessionDocRef = doc(db, COLLECTIONS.SESSIONS, uuid);

    // Check if session exists
    const sessionDoc = await getDoc(sessionDocRef);
    if (!sessionDoc.exists()) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const updateData: any = {
      lastActive: serverTimestamp(),
    };

    if (status) {
      updateData.status = status;
    }

    if (visitorOnline !== undefined) {
      updateData.visitorOnline = visitorOnline;
      if (visitorOnline) {
        updateData.visitorLastSeen = serverTimestamp();
      }
    }

    if (adminOnline !== undefined) {
      updateData.adminOnline = adminOnline;
      if (adminOnline) {
        updateData.adminLastSeen = serverTimestamp();
      }
    }

    await updateDoc(sessionDocRef, updateData);

    return NextResponse.json({ success: true, mask });
  } catch (error) {
    console.error('[Bubble Sessions API] PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update session', success: false }, { status: 500 });
  }
}

// DELETE: Remove session using UUID-sync (soft delete + recycle bin)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mask = searchParams.get('mask');

    if (!mask) {
      return NextResponse.json({ error: 'Mask required' }, { status: 400 });
    }

    // Translate mask to UUID with robust error handling
    let uuid: string;
    try {
      uuid = await translateMaskToUUID(mask);
    } catch (error: any) {
      if (error instanceof MaskNotFoundError) {
        return NextResponse.json(
          { error: `Mask not found: ${mask}`, success: false },
          { status: 404 }
        );
      }
      if (error instanceof UUIDValidationError) {
        return NextResponse.json(
          { error: `Invalid mask format: ${error.message}`, success: false },
          { status: 400 }
        );
      }
      throw error;
    }

    // Fetch the session by UUID (doc ID)
    const sessionDocRef = doc(db, COLLECTIONS.SESSIONS, uuid);
    const sessionDoc = await getDoc(sessionDocRef);

    if (!sessionDoc.exists()) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const sessionData = sessionDoc.data();

    // Fetch all messages for this session (use UUID as sessionId in messages)
    const messagesRef = collection(db, COLLECTIONS.MESSAGES);
    const messagesQuery = query(messagesRef, where('sessionId', '==', uuid));
    const messagesSnapshot = await getDocs(messagesQuery);
    
    const messages = messagesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      };
    });

    // Prepare data for recycle bin
    const recycleBinData = {
      source: 'bubbleSession',
      originalId: uuid,  // Use UUID
      data: {
        ...sessionData,
        id: uuid,  // Use UUID
        mask: sessionData.mask,  // Keep mask
        visitorEmail: sessionData.visitorEmail || null,
        startedAt: sessionData.startedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        lastActive: sessionData.lastActive?.toDate?.()?.toISOString() || new Date().toISOString(),
        messageCount: sessionData.messageCount || 0,
        unreadAdminReplies: sessionData.unreadAdminReplies || 0,
        hasUnreadTooltip: sessionData.hasUnreadTooltip || false,
        messages, // Include all messages
      },
    };

    // Add to recycle bin
    const baseUrl = request.url.split('/api/')[0];
    const recycleBinResponse = await fetch(`${baseUrl}/api/recycle-bin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recycleBinData),
    });

    if (!recycleBinResponse.ok) {
      // Continue with soft delete even if recycle bin fails
    }

    // Soft delete the session using UUID as doc ID
    await updateDoc(sessionDocRef, {
      deletedAt: serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Bubble Sessions API] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete session', success: false }, { status: 500 });
  }
}
