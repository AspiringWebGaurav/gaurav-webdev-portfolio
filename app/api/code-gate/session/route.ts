/**
 * Session Check API
 * Verifies if a visitor has passed the code gate
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import admin from 'firebase-admin';
import type { SessionCheckResponse } from '@/types/codeGate';

/**
 * GET /api/code-gate/session
 * Checks if the current visitor has a valid code gate clearance in database
 */
export async function GET(request: NextRequest) {
  try {
    const visitorId = request.headers.get('x-visitor-id');

    if (!visitorId) {
      return NextResponse.json(
        { hasAccess: false, message: 'Visitor ID required' },
        { status: 400 }
      );
    }

    // Check if visitor is banned
    const banCheck = await checkBanStatus(visitorId);
    if (banCheck.isBanned) {
      return NextResponse.json({
        hasAccess: false,
        banned: true
      });
    }

    // Check for active code gate clearance in database
    // Get all sessions for this visitor (can't use compound query without index)
    const now = admin.firestore.Timestamp.now();
    const sessionsSnapshot = await adminDb
      .collection('codeGateSessions')
      .where('visitorId', '==', visitorId)
      .get();

    console.log('[CodeGate Session] Checking for:', visitorId.substring(0, 16) + '...', 'Found:', sessionsSnapshot.size, 'total sessions');

    // Filter for active sessions (not expired)
    const activeSessions = [];
    const expiredSessions = [];
    
    sessionsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.expiresAt && data.expiresAt.toMillis() > now.toMillis()) {
        activeSessions.push(doc);
      } else {
        expiredSessions.push(doc.id);
      }
    });

    console.log('[CodeGate Session] Active sessions:', activeSessions.length, 'Expired:', expiredSessions.length);

    // Clean up expired sessions in background (don't await)
    if (expiredSessions.length > 0) {
      Promise.all(
        expiredSessions.map(id => adminDb.collection('codeGateSessions').doc(id).delete())
      ).then(() => {
        console.log('[CodeGate Session] Cleaned up', expiredSessions.length, 'expired sessions');
      }).catch(err => {
        console.error('[CodeGate Session] Cleanup error:', err);
      });
    }

    if (activeSessions.length === 0) {
      return NextResponse.json({
        hasAccess: false
      });
    }

    console.log('[CodeGate Session] Access granted');
    return NextResponse.json({
      hasAccess: true
    });

  } catch (error) {
    console.error('[CodeGate Session] ERROR:', error);
    console.error('[CodeGate Session] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { hasAccess: false, message: 'Session check failed', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Check if a visitor is banned
 */
async function checkBanStatus(visitorId: string): Promise<{
  isBanned: boolean;
}> {
  const now = admin.firestore.Timestamp.now();
  
  const bansSnapshot = await adminDb
    .collection('codeBans')
    .where('visitorId', '==', visitorId)
    .get();

  const expiredBans = [];
  let isCurrentlyBanned = false;

  for (const doc of bansSnapshot.docs) {
    const ban = doc.data();
    
    // Check permanent ban
    if (ban.isPermanent) {
      isCurrentlyBanned = true;
      break;
    }

    // Check temporary ban - handle both Timestamp and Date
    if (ban.expiresAt) {
      const expiresAt = ban.expiresAt instanceof admin.firestore.Timestamp 
        ? ban.expiresAt 
        : admin.firestore.Timestamp.fromDate(new Date(ban.expiresAt));
      
      if (expiresAt.toMillis() > now.toMillis()) {
        isCurrentlyBanned = true;
        break;
      } else {
        // Mark expired ban for cleanup
        expiredBans.push(doc.id);
      }
    }
  }

  // Clean up expired bans in background
  if (expiredBans.length > 0) {
    Promise.all(
      expiredBans.map(id => adminDb.collection('codeBans').doc(id).delete())
    ).then(() => {
      console.log('[CodeGate] 🗑️  Cleaned up', expiredBans.length, 'expired bans');
    }).catch(err => {
      console.error('[CodeGate] Ban cleanup error:', err);
    });
  }

  return { isBanned: isCurrentlyBanned };
}
