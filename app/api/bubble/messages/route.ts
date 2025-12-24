import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, query, where, getDocs, orderBy, limit, updateDoc, doc, setDoc, getDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';
import { rateLimitMiddleware } from '@/lib/rateLimit';
import { deduplicate } from '@/lib/requestDeduplication';
import { withRetry, firebaseQueue } from '@/lib/retry';

const COLLECTIONS = {
  SESSIONS: 'og_uuid_sessions',
  MESSAGES: 'bubbleMessages',
  TOOLTIP_EVENTS: 'bubbleTooltipEvents',
};

// GET: Fetch messages for a session with comprehensive status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const limitCount = parseInt(searchParams.get('limit') || '50');
    const role = searchParams.get('role'); // 'visitor' or 'admin'
    const fingerprint = searchParams.get('fingerprint');

    // Rate limiting - generous for polling
    const { response: rateLimitResponse, headers: rateLimitHeaders } = await rateLimitMiddleware(request, 'chatPoll', { 
      sessionId, 
      fingerprint: fingerprint || undefined 
    });
    if (rateLimitResponse) return rateLimitResponse;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Fetch messages
    const messagesRef = collection(db, COLLECTIONS.MESSAGES);
    const q = query(
      messagesRef,
      where('sessionId', '==', sessionId),
      orderBy('timestamp', 'asc'),
      limit(limitCount)
    );

    // Deduplicate frequent polling requests with retry and queue
    const querySnapshot = await deduplicate(
      `messages-${sessionId}`,
      () => firebaseQueue.add(() => withRetry(() => getDocs(q), {}, 'fetch-messages')),
      1500 // 1.5s TTL for real-time chat
    );
    const messages = querySnapshot.docs
      .map(docSnapshot => {
        const data = docSnapshot.data();
        return {
          id: data.id || docSnapshot.id, // Use custom id field or fallback to doc id
          sessionId: data.sessionId,
          role: data.role,
          content: data.content,
          timestamp: data.timestamp?.toDate() || new Date(),
          read: data.read || false,
          delivered: data.delivered !== undefined ? data.delivered : true,
          readAt: data.readAt?.toDate() || null,
          deliveredAt: data.deliveredAt?.toDate() || null,
          visitorEmail: data.visitorEmail,
          deletedAt: data.deletedAt || null,
          _docId: docSnapshot.id, // Store doc ID for updates
        };
      })
      .filter(msg => !msg.deletedAt)
      .map(msg => {
        const { deletedAt, _docId, ...rest } = msg;
        rest._docId = _docId; // Keep internal doc ID for updates
        return rest;
      });

    // Auto-mark messages as delivered if viewer is checking
    if (role) {
      const undeliveredMessages = messages.filter(
        msg => !msg.delivered && msg.role !== role
      );
      
      if (undeliveredMessages.length > 0) {
        // Batch update delivered status using doc ID
        for (const msg of undeliveredMessages) {
          try {
            const docRef = doc(db, COLLECTIONS.MESSAGES, msg._docId);
            await updateDoc(docRef, {
              delivered: true,
              deliveredAt: serverTimestamp(),
            });
            msg.delivered = true;
            msg.deliveredAt = new Date();
          } catch (err) {
            console.error(`Failed to update delivery for ${msg.id}:`, err);
          }
        }
      }
    }

    // Clean _docId from response
    messages.forEach(msg => delete msg._docId);

    // Fetch session typing status and online status using UUID as doc ID with retry
    const sessionDocRef = doc(db, COLLECTIONS.SESSIONS, sessionId);
    const sessionDoc = await withRetry(() => getDoc(sessionDocRef), {}, 'fetch-session');
    
    let typingData = {};
    let unreadCounts = { visitorUnread: 0, adminUnread: 0 };
    
    if (sessionDoc.exists()) {
      const sessionData = sessionDoc.data();
      typingData = {
        adminTyping: sessionData.adminTyping || false,
        visitorTyping: sessionData.visitorTyping || false,
        adminLastSeen: sessionData.adminLastSeen?.toDate() || null,
        visitorLastSeen: sessionData.visitorLastSeen?.toDate() || null,
        adminOnline: sessionData.adminOnline || false,
        visitorOnline: sessionData.visitorOnline || false,
      };
      
      unreadCounts = {
        visitorUnread: sessionData.unreadVisitorMessages || 0,
        adminUnread: sessionData.unreadAdminReplies || 0,
      };

      // Update last seen for current viewer
      if (role) {
        const updateData: any = {};
        if (role === 'admin') {
          updateData.adminLastSeen = serverTimestamp();
          updateData.adminOnline = true;
        } else {
          updateData.visitorLastSeen = serverTimestamp();
          updateData.visitorOnline = true;
        }
        await updateDoc(sessionDocRef, updateData);
      }
    }

    const response = NextResponse.json({
      messages,
      hasMore: messages.length === limitCount,
      totalCount: messages.length,
      ...typingData,
      ...unreadCounts,
    });
    
    // Add rate limit headers
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  } catch (error) {
    console.error('Error in messages GET:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST: Send a new message with delivery tracking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, role, content, visitorEmail, fingerprint, mask, turnstileToken } = body;

    console.log('[Bubble Messages POST] Request received:', {
      sessionId,
      role,
      contentLength: content?.length,
      hasFingerprint: !!fingerprint,
      hasMask: !!mask,
      hasTurnstileToken: !!turnstileToken
    });

    // ENHANCED: Stricter rate limiting for message sending
    const { response: rateLimitResponse, headers: rateLimitHeaders } = await rateLimitMiddleware(request, 'chatMessage', {
      sessionId,
      fingerprint: fingerprint || mask, // Use mask as fallback identifier
      turnstileToken,
    });
    if (rateLimitResponse) {
      console.log('[Bubble Messages POST] Rate limit exceeded');
      return rateLimitResponse;
    }

    if (!sessionId || !role || !content) {
      console.log('[Bubble Messages POST] Missing fields:', { sessionId: !!sessionId, role: !!role, content: !!content });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Validate sessionId format (MASK format: device_xxxxxxxxxx)
    const maskRegex = /^device_[a-z0-9]{10}$/i;
    if (!maskRegex.test(sessionId)) {
      return NextResponse.json({ error: 'Invalid session ID format (must be device mask)' }, { status: 400 });
    }

    if (role !== 'visitor' && role !== 'admin') {
      return NextResponse.json({ error: 'Invalid role. Must be "visitor" or "admin"' }, { status: 400 });
    }

    if (!content.trim()) {
      return NextResponse.json({ error: 'Content cannot be empty' }, { status: 400 });
    }
    
    // ENHANCED: Content length validation (prevent spam with huge messages)
    if (content.length > 2000) {
      return NextResponse.json({ error: 'Message too long (max 2000 characters)' }, { status: 400 });
    }

    const messageId = uuidv4();
    const messageData = {
      id: messageId,
      sessionId,
      role, // 'visitor' or 'admin'
      content,
      timestamp: serverTimestamp(),
      read: false, // Always start as unread
      delivered: false, // Start as not delivered
      readAt: null,
      deliveredAt: null,
      visitorEmail: visitorEmail || null,
      deletedAt: null,
    };

    // Queue message creation with retry for robustness
    await firebaseQueue.add(() => 
      withRetry(() => addDoc(collection(db, COLLECTIONS.MESSAGES), messageData), {}, 'create-message')
    );

    // Update session using UUID as doc ID with retry
    const sessionDocRef = doc(db, COLLECTIONS.SESSIONS, sessionId);
    const sessionDoc = await withRetry(() => getDoc(sessionDocRef), {}, 'fetch-session-for-update');

    if (sessionDoc.exists()) {
      const updateData: any = {
        lastActive: serverTimestamp(),
        messageCount: increment(1),
      };

      // Update unread count based on sender
      if (role === 'admin') {
        updateData.unreadAdminReplies = increment(1);
        updateData.hasUnreadTooltip = true;
        updateData.adminLastSeen = serverTimestamp();
        updateData.adminOnline = true;

        // Create tooltip event
        await addDoc(collection(db, COLLECTIONS.TOOLTIP_EVENTS), {
          id: uuidv4(),
          sessionId,
          messageId,
          triggeredAt: serverTimestamp(),
          readAt: null,
          isRead: false,
          visitorEmail: visitorEmail || null,
        });
      } else {
        updateData.unreadVisitorMessages = increment(1);
        updateData.visitorLastSeen = serverTimestamp();
        updateData.visitorOnline = true;
      }

      if (visitorEmail) {
        updateData.visitorEmail = visitorEmail;
      }

      await updateDoc(sessionDocRef, updateData);
    } else {
      // Create new session if it doesn't exist - use setDoc with UUID as doc ID
      const newSessionData: any = {
        id: sessionId,
        startedAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        messageCount: 1,
        unreadAdminReplies: role === 'admin' ? 1 : 0,
        unreadVisitorMessages: role === 'visitor' ? 1 : 0,
        hasUnreadTooltip: role === 'admin',
        visitorEmail: visitorEmail || null,
        adminOnline: role === 'admin',
        visitorOnline: role === 'visitor',
        adminLastSeen: role === 'admin' ? serverTimestamp() : null,
        visitorLastSeen: role === 'visitor' ? serverTimestamp() : null,
      };

      await setDoc(doc(db, COLLECTIONS.SESSIONS, sessionId), newSessionData);

      // If admin is replying to a new session, create tooltip event
      if (role === 'admin') {
        await addDoc(collection(db, COLLECTIONS.TOOLTIP_EVENTS), {
          id: uuidv4(),
          sessionId,
          messageId,
          triggeredAt: serverTimestamp(),
          readAt: null,
          isRead: false,
          visitorEmail: visitorEmail || null,
        });
      }
    }

    const response = NextResponse.json({
      id: messageId,
      sessionId,
      role,
      content,
      timestamp: new Date(),
      read: false,
      delivered: false,
    });
    
    // Add rate limit headers
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  } catch (error) {
    console.error('Error in messages POST:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

// PUT: Mark messages as read with timestamp
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, messageIds, role, fingerprint } = body;

    // Rate limiting - moderate
    const { response: rateLimitResponse, headers: rateLimitHeaders } = await rateLimitMiddleware(request, 'general', { 
      sessionId, 
      fingerprint 
    });
    if (rateLimitResponse) return rateLimitResponse;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const messagesRef = collection(db, COLLECTIONS.MESSAGES);
    
    if (messageIds && messageIds.length > 0) {
      // Mark specific messages as read
      for (const messageId of messageIds) {
        const q = query(messagesRef, where('id', '==', messageId), where('sessionId', '==', sessionId));
        const querySnapshot = await getDocs(q);
        
        for (const docSnapshot of querySnapshot.docs) {
          await updateDoc(docSnapshot.ref, {
            read: true,
            readAt: serverTimestamp(),
            delivered: true,
            deliveredAt: serverTimestamp(),
          });
        }
      }
    } else {
      // Mark all unread messages in session as read (for specific role)
      const q = query(messagesRef, where('sessionId', '==', sessionId), where('read', '==', false));
      const querySnapshot = await getDocs(q);
      
      for (const docSnapshot of querySnapshot.docs) {
        const msgData = docSnapshot.data();
        // Only mark messages sent by the opposite role
        if (role && msgData.role !== role) {
          await updateDoc(docSnapshot.ref, {
            read: true,
            readAt: serverTimestamp(),
          });
        } else if (!role) {
          // If no role specified, mark all
          await updateDoc(docSnapshot.ref, {
            read: true,
            readAt: serverTimestamp(),
          });
        }
      }
    }

    // Reset unread count for the reading party
    if (role) {
      const sessionDocRef = doc(db, COLLECTIONS.SESSIONS, sessionId);
      const sessionDoc = await getDoc(sessionDocRef);
      
      if (sessionDoc.exists()) {
        const updateData: any = {};
        if (role === 'admin') {
          updateData.unreadVisitorMessages = 0;
        } else {
          updateData.unreadAdminReplies = 0;
          updateData.hasUnreadTooltip = false;
        }
        await updateDoc(sessionDocRef, updateData);
      }
    }

    const response = NextResponse.json({ success: true });
    
    // Add rate limit headers
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  } catch (error) {
    console.error('Error in messages PUT:', error);
    return NextResponse.json({ error: 'Failed to update messages' }, { status: 500 });
  }
}

// DELETE: Soft delete messages
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID required' }, { status: 400 });
    }

    const messagesRef = collection(db, COLLECTIONS.MESSAGES);
    const q = query(messagesRef, where('id', '==', messageId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const messageDoc = querySnapshot.docs[0];
    await updateDoc(doc(db, COLLECTIONS.MESSAGES, messageDoc.id), {
      deletedAt: serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in messages DELETE:', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}

// PATCH: Update individual message (mark as read)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, sessionId, read, fingerprint } = body;

    // Rate limiting
    const { response: rateLimitResponse, headers: rateLimitHeaders } = await rateLimitMiddleware(request, 'general', { 
      sessionId, 
      fingerprint 
    });
    if (rateLimitResponse) return rateLimitResponse;

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID required' }, { status: 400 });
    }

    const messagesRef = collection(db, COLLECTIONS.MESSAGES);
    const q = query(messagesRef, where('id', '==', messageId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const messageDoc = querySnapshot.docs[0];
    const updateData: any = {};

    if (read !== undefined) {
      updateData.read = read;
      if (read) {
        updateData.readAt = serverTimestamp();
      }
    }

    await updateDoc(doc(db, COLLECTIONS.MESSAGES, messageDoc.id), updateData);

    const response = NextResponse.json({ success: true, messageId });
    
    // Add rate limit headers
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  } catch (error) {
    console.error('Error in messages PATCH:', error);
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
}
