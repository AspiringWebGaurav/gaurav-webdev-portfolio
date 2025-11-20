/**
 * Direct Access Logging API
 * Logs attempts to directly access admin pages without code gate clearance
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import type { AbuseLogEntry } from '@/types/codeGate';

/**
 * POST /api/code-gate/log-direct-access
 * Logs unauthorized direct access attempts
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { visitorId, attemptedPath } = body;

    if (!visitorId || !attemptedPath) {
      return NextResponse.json(
        { error: 'Visitor ID and path required' },
        { status: 400 }
      );
    }

    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                      request.headers.get('x-real-ip') || 
                      null;
    const userAgent = request.headers.get('user-agent') || null;

    const logEntry: Omit<AbuseLogEntry, 'id'> = {
      visitorId,
      ipAddress,
      eventType: 'direct_access_blocked',
      attemptedPath,
      attemptedCode: null,
      timestamp: new Date(),
      userAgent,
      metadata: {
        message: 'Attempted to access admin page without code gate clearance'
      }
    };

    await adminDb.collection('abuseLog').add(logEntry);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Log direct access error:', error);
    return NextResponse.json(
      { error: 'Failed to log access attempt' },
      { status: 500 }
    );
  }
}
