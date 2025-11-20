/**
 * Abuse Logs API
 * Provides admin access to view all failed attempts, bans, and suspicious activity
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import type { AbuseLogsResponse, AbuseLogEntry, CodeBan, CodeAttempt } from '@/types/codeGate';

const ALLOWED_UID = 'cgwqNNfMfPNmsAHJfgWGcRSsIRG2';

/**
 * GET /api/code-gate/abuse-logs
 * Returns comprehensive abuse logs for admin review
 * Requires authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    if (decodedToken.uid !== ALLOWED_UID) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const eventType = url.searchParams.get('eventType');

    // Build query
    let query = adminDb.collection('abuseLog').orderBy('timestamp', 'desc');

    if (eventType) {
      query = query.where('eventType', '==', eventType) as any;
    }

    // Get logs
    const logsSnapshot = await query.limit(limit).offset(offset).get();
    
    const logs: AbuseLogEntry[] = logsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AbuseLogEntry));

    // Get total count
    const totalSnapshot = await adminDb.collection('abuseLog').count().get();
    const totalCount = totalSnapshot.data().count;

    // Get banned count
    const now = new Date();
    const bannedSnapshot = await adminDb
      .collection('codeBans')
      .get();
    
    const activeBans = bannedSnapshot.docs.filter(doc => {
      const ban = doc.data() as CodeBan;
      const expiresAt = ban.expiresAt instanceof Date 
        ? ban.expiresAt 
        : (ban.expiresAt as any)?.toDate?.() || null;
      return ban.isPermanent || (expiresAt && expiresAt > now);
    });

    // Get recent attempts (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentAttemptsSnapshot = await adminDb
      .collection('codeAttempts')
      .where('timestamp', '>=', oneDayAgo)
      .where('successful', '==', false)
      .get();

    const response: AbuseLogsResponse = {
      logs,
      totalCount,
      bannedCount: activeBans.length,
      recentAttempts: recentAttemptsSnapshot.size
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Abuse logs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch abuse logs' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/code-gate/abuse-logs/:id
 * Removes a specific ban (admin can unban users)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    if (decodedToken.uid !== ALLOWED_UID) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const banId = url.searchParams.get('banId');

    if (!banId) {
      return NextResponse.json(
        { error: 'Ban ID required' },
        { status: 400 }
      );
    }

    await adminDb.collection('codeBans').doc(banId).delete();

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete ban error:', error);
    return NextResponse.json(
      { error: 'Failed to remove ban' },
      { status: 500 }
    );
  }
}
