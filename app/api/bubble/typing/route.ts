import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { rateLimitMiddleware } from '@/lib/rateLimit';

const COLLECTIONS = {
  SESSIONS: 'bubbleSessions',
};

// POST: Set typing indicator
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, role, typing, fingerprint } = body;

    // Rate limiting - very generous for typing indicators
    const { response: rateLimitResponse, headers: rateLimitHeaders } = await rateLimitMiddleware(request, 'chatPoll', { 
      sessionId, 
      fingerprint 
    });
    if (rateLimitResponse) return rateLimitResponse;

    if (!sessionId || !role) {
      return NextResponse.json({ error: 'Session ID and role required' }, { status: 400 });
    }

    if (role !== 'visitor' && role !== 'admin') {
      return NextResponse.json({ error: 'Invalid role. Must be "visitor" or "admin"' }, { status: 400 });
    }

    // Find the session
    const sessionsRef = collection(db, COLLECTIONS.SESSIONS);
    const q = query(sessionsRef, where('id', '==', sessionId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const sessionDoc = querySnapshot.docs[0];
    const updateData: any = {};

    // Update typing indicator based on role
    if (role === 'visitor') {
      updateData.visitorTyping = typing || false;
      updateData.visitorTypingAt = typing ? serverTimestamp() : null;
    } else {
      updateData.adminTyping = typing || false;
      updateData.adminTypingAt = typing ? serverTimestamp() : null;
    }

    await updateDoc(doc(db, COLLECTIONS.SESSIONS, sessionDoc.id), updateData);

    const response = NextResponse.json({ 
      success: true, 
      sessionId,
      role,
      typing: typing || false,
    });
    
    // Add rate limit headers
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  } catch (error) {
    console.error('Error in typing POST:', error);
    return NextResponse.json({ error: 'Failed to set typing indicator' }, { status: 500 });
  }
}

// GET: Get typing status for a session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const fingerprint = searchParams.get('fingerprint');

    // Rate limiting
    const { response: rateLimitResponse, headers: rateLimitHeaders } = await rateLimitMiddleware(request, 'chatPoll', { 
      sessionId: sessionId || undefined, 
      fingerprint: fingerprint || undefined 
    });
    if (rateLimitResponse) return rateLimitResponse;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const sessionsRef = collection(db, COLLECTIONS.SESSIONS);
    const q = query(sessionsRef, where('id', '==', sessionId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const sessionData = querySnapshot.docs[0].data();

    const response = NextResponse.json({
      sessionId,
      visitorTyping: sessionData.visitorTyping || false,
      adminTyping: sessionData.adminTyping || false,
      visitorTypingAt: sessionData.visitorTypingAt?.toDate() || null,
      adminTypingAt: sessionData.adminTypingAt?.toDate() || null,
    });
    
    // Add rate limit headers
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  } catch (error) {
    console.error('Error in typing GET:', error);
    return NextResponse.json({ error: 'Failed to get typing status' }, { status: 500 });
  }
}
