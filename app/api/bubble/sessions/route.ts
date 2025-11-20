import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, query, where, getDocs, orderBy, limit, updateDoc, doc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';
import { rateLimitMiddleware } from '@/lib/rateLimit';

const COLLECTIONS = {
  SESSIONS: 'bubbleSessions',
  MESSAGES: 'bubbleMessages',
};

// GET: Fetch or create session, or list all sessions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const allSessions = searchParams.get('allSessions') === 'true';
    const fingerprint = searchParams.get('fingerprint');

    // Skip rate limiting for admin endpoints (allSessions)
    if (!allSessions) {
      // Rate limiting only for visitor endpoints
      const { response: rateLimitResponse, headers: rateLimitHeaders } = await rateLimitMiddleware(request, 'general', { 
        sessionId: sessionId || undefined, 
        fingerprint: fingerprint || undefined 
      });
      if (rateLimitResponse) return rateLimitResponse;
    }

    // Admin endpoint: List all sessions (only those with messages)
    if (allSessions) {
      const sessionsRef = collection(db, COLLECTIONS.SESSIONS);
      // Fetch sessions ordered by lastActive to get most recent first
      const q = query(
        sessionsRef,
        orderBy('lastActive', 'desc'),
        limit(100)
      );
      const querySnapshot = await getDocs(q);

      // Fetch all sessions first
      const sessionsData = querySnapshot.docs.map(docSnapshot => {
        const data = docSnapshot.data();
        return {
          firestoreId: docSnapshot.id,
          sessionId: data.id,
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

      // Fetch visitor profiles to get the central UUID
      const visitorProfilesRef = collection(db, 'visitorProfiles');
      const visitorIds = [...new Set(sessionsData.map(s => s.sessionId))];
      
      // Fetch all visitor profiles in parallel
      const visitorProfilesPromises = visitorIds.map(async (visitorId) => {
        try {
          const visitorDoc = await getDoc(doc(db, 'visitorProfiles', visitorId));
          if (visitorDoc.exists()) {
            return { id: visitorId, data: visitorDoc.data() };
          }
        } catch (e) {
          console.log(`[Sessions] No visitor profile for ${visitorId}`);
        }
        return null;
      });
      
      const visitorProfiles = (await Promise.all(visitorProfilesPromises)).filter(Boolean);
      const visitorMap = new Map(visitorProfiles.map(v => [v!.id, v!.data]));

      // Map sessions with visitor profile data
      const sessions = sessionsData.map(data => {
        const visitorProfile = visitorMap.get(data.sessionId);
        // Use the visitor profile ID (which is device_xxx) or fall back to session ID
        const visitorId = visitorProfile ? data.sessionId : (data.deviceFingerprint || data.sessionId);
        
        return {
          id: data.sessionId,
          visitorId: visitorId, // This is the central visitor UUID from visitor analytics
          deviceFingerprint: data.deviceFingerprint || null,
          visitorEmail: data.visitorEmail || null,
          startedAt: data.startedAt,
          lastActive: data.lastActive,
          messageCount: data.messageCount,
          unreadAdminReplies: data.unreadAdminReplies,
          unreadVisitorMessages: data.unreadVisitorMessages,
          hasUnreadTooltip: data.hasUnreadTooltip,
          visitorOnline: data.visitorOnline,
          adminOnline: data.adminOnline,
          visitorLastSeen: data.visitorLastSeen,
          adminLastSeen: data.adminLastSeen,
          status: data.status,
          deletedAt: data.deletedAt,
        };
      }).filter(session => !session.deletedAt && session.messageCount > 0); // Filter soft-deleted and empty sessions

      // Check for unread visitor messages in each session
      const messagesRef = collection(db, COLLECTIONS.MESSAGES);
      const sessionsWithUnreadStatus = await Promise.all(
        sessions.map(async (session) => {
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

      // Sort by lastActive after fetching
      sessionsWithUnreadStatus.sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime());

      return NextResponse.json({ sessions: sessionsWithUnreadStatus, success: true });
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required for GET' }, { status: 400 });
    }

    // Fetch existing session
    console.log('[Sessions API] Fetching session:', sessionId);
    const sessionsRef = collection(db, COLLECTIONS.SESSIONS);
    const q = query(sessionsRef, where('id', '==', sessionId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('[Sessions API] Session not found:', sessionId);
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const sessionDoc = querySnapshot.docs[0];
    const sessionData = sessionDoc.data();

    // Return 404 if session is soft-deleted (in recycle bin)
    if (sessionData.deletedAt) {
      console.log('[Sessions API] Session is deleted:', sessionId);
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    console.log('[Sessions API] Session retrieved successfully:', sessionId);
    return NextResponse.json({
      id: sessionData.id,
      sessionId: sessionData.id,
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
    });
  } catch (error) {
    console.error('Error in sessions GET:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

// POST: Create new session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceFingerprint, visitorId, role } = body;

    // Require either visitorId or deviceFingerprint - no fallback to random UUID
    if (!visitorId && !deviceFingerprint) {
      return NextResponse.json(
        { error: 'Either visitorId or deviceFingerprint is required' },
        { status: 400 }
      );
    }

    // Use visitorId (device_*) as the session ID, or create from fingerprint
    const sessionId = visitorId || `device_${deviceFingerprint}`;
    
    console.log('[Sessions API] Creating new session with device ID:', sessionId);

    // Check if session already exists
    const sessionsRef = collection(db, COLLECTIONS.SESSIONS);
    const existingQuery = query(sessionsRef, where('id', '==', sessionId));
    const existingSnapshot = await getDocs(existingQuery);

    if (!existingSnapshot.empty) {
      // Session exists, return it
      const existingDoc = existingSnapshot.docs[0];
      const data = existingDoc.data();
      console.log('[Sessions API] Session already exists:', sessionId);
      return NextResponse.json({
        sessionId,
        id: sessionId,
        ...data,
        startedAt: data.startedAt?.toDate(),
        lastActive: data.lastActive?.toDate(),
      });
    }

    const sessionData = {
      id: sessionId,
      role: role || 'visitor',
      status: 'pending',
      deviceFingerprint: sessionId,
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

    const docRef = await addDoc(sessionsRef, sessionData);
    console.log('[Sessions API] ✓ Session created successfully:', sessionId);
    
    return NextResponse.json({
      sessionId,
      id: sessionId,
      role: sessionData.role,
      status: sessionData.status,
      deviceFingerprint: sessionData.deviceFingerprint,
      startedAt: new Date(),
      lastActive: new Date(),
      messageCount: 0,
      unreadAdminReplies: 0,
      unreadVisitorMessages: 0,
      hasUnreadTooltip: false,
    });
  } catch (error) {
    console.error('[Sessions API] ✗ Error creating session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

// PUT: Update session (email, last active, etc.)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, visitorEmail, markTooltipRead } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const sessionsRef = collection(db, COLLECTIONS.SESSIONS);
    const q = query(sessionsRef, where('id', '==', sessionId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const sessionDoc = querySnapshot.docs[0];
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

    await updateDoc(doc(db, COLLECTIONS.SESSIONS, sessionDoc.id), updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in sessions PUT:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}

// PATCH: Update session status and other fields
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, status, visitorOnline, adminOnline } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const sessionsRef = collection(db, COLLECTIONS.SESSIONS);
    const q = query(sessionsRef, where('id', '==', sessionId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const sessionDoc = querySnapshot.docs[0];
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

    await updateDoc(doc(db, COLLECTIONS.SESSIONS, sessionDoc.id), updateData);

    return NextResponse.json({ success: true, sessionId });
  } catch (error) {
    console.error('Error in sessions PATCH:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}

// DELETE: Remove session (soft delete + add to recycle bin)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Fetch the session
    const sessionsRef = collection(db, COLLECTIONS.SESSIONS);
    const q = query(sessionsRef, where('id', '==', sessionId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const sessionDoc = querySnapshot.docs[0];
    const sessionData = sessionDoc.data();

    // Fetch all messages for this session
    const messagesRef = collection(db, COLLECTIONS.MESSAGES);
    const messagesQuery = query(messagesRef, where('sessionId', '==', sessionId));
    const messagesSnapshot = await getDocs(messagesQuery);
    
    console.log(`[DELETE] Found ${messagesSnapshot.docs.length} messages for session ${sessionId}`);
    
    const messages = messagesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      };
    });

    console.log(`[DELETE] Prepared ${messages.length} messages for recycle bin`);

    // Prepare data for recycle bin
    const recycleBinData = {
      source: 'bubbleSession',
      originalId: sessionDoc.id,
      data: {
        ...sessionData,
        id: sessionData.id,
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
      console.error('Failed to add session to recycle bin');
      // Continue with soft delete even if recycle bin fails
    }

    // Soft delete the session
    await updateDoc(doc(db, COLLECTIONS.SESSIONS, sessionDoc.id), {
      deletedAt: serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in sessions DELETE:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
