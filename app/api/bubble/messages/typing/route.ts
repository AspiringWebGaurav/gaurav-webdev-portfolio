/**
 * Typing Indicator API
 * Manages typing status for real-time chat experience
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { rateLimitMiddleware } from '@/lib/rateLimit';

const SESSIONS_COLLECTION = 'og_uuid_sessions';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, isTyping, role = 'visitor', fingerprint } = await request.json();

    // Rate limiting - moderate for typing indicators
    const { response: rateLimitResponse, headers: rateLimitHeaders } = await rateLimitMiddleware(request, 'typing', { 
      sessionId, 
      fingerprint 
    });
    if (rateLimitResponse) return rateLimitResponse;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    const fieldName = role === 'visitor' ? 'visitorTyping' : 'adminTyping';
    const timestampField = role === 'visitor' ? 'visitorLastSeen' : 'adminLastSeen';

    // Get session using UUID as doc ID
    const sessionDocRef = adminDb.collection(SESSIONS_COLLECTION).doc(sessionId);
    const sessionDoc = await sessionDocRef.get();

    if (!sessionDoc.exists) {
      // Session not found
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    } else {
      // Update existing session
      await sessionDocRef.update({
        [fieldName]: isTyping,
        [timestampField]: new Date(),
        lastActive: new Date(),
      });
    }

    const response = NextResponse.json({
      success: true,
      sessionId,
      [fieldName]: isTyping,
    });
    
    // Add rate limit headers
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  } catch (error) {
    console.error('[Typing API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update typing status' },
      { status: 500 }
    );
  }
}
