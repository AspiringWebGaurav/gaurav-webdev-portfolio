// app/api/session/invalidate/route.ts
// API endpoint for session invalidation and security management

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { ratelimit } from '../../../../lib/rateLimit';
import { 
  extractUuidFromToken,
  createSecurityAuditLog,
  SESSION_CONFIG,
  SessionErrorCode,
  type SecurityAuditLog 
} from '@/lib/secureSession';
import { requireFirebaseAdmin } from "@/lib/firebase-admin";
import { smartLogger } from '@/utils/smartLogger';

// Rate limiting for invalidation requests
const invalidationRateLimit = ratelimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 10, // 10 invalidation attempts per minute per IP
});

interface InvalidateSessionRequest {
  sessionToken?: string;
  uuid?: string;
  reason?: string;
  invalidateAll?: boolean; // Invalidate all sessions for this client
}

interface InvalidateSessionResponse {
  success: boolean;
  message?: string;
  invalidatedCount?: number;
  error?: string;
  retryAfter?: number;
}

export async function POST(req: NextRequest): Promise<NextResponse<InvalidateSessionResponse>> {
  const startTime = Date.now();
  let auditLog: SecurityAuditLog | null = null;
  
  try {
    // Get client information
    const headersList = await headers();
    const clientIp = getClientIp(headersList);
    const userAgent = headersList.get('user-agent') || 'Unknown';
    
    smartLogger.api.request('[SessionInvalidation] Invalidation request', {
      ip: clientIp,
      userAgent: userAgent.slice(0, 100),
    });

    // Rate limiting check
    const rateLimitResult = await invalidationRateLimit.check(10, clientIp);
    if (!rateLimitResult.success) {
      auditLog = {
        event: 'session_failed',
        ip: clientIp,
        userAgent,
        timestamp: Math.floor(Date.now() / 1000),
        errorCode: SessionErrorCode.RATE_LIMITED,
        metadata: {
          rateLimitHit: true,
          retryAfter: rateLimitResult.reset,
        },
      };

      smartLogger.api.warn('[SessionInvalidation] Rate limit exceeded', auditLog);

      return NextResponse.json<InvalidateSessionResponse>(
        { 
          success: false, 
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
            ...SESSION_CONFIG.SECURITY_HEADERS,
          },
        }
      );
    }

    // Parse request body
    let body: InvalidateSessionRequest;
    try {
      body = await req.json();
    } catch (error) {
      auditLog = {
        event: 'session_failed',
        ip: clientIp,
        userAgent,
        timestamp: Math.floor(Date.now() / 1000),
        errorCode: SessionErrorCode.INVALID_FORMAT,
        metadata: { parseError: true },
      };

      smartLogger.api.warn('[SessionInvalidation] Invalid request body', { error });

      return NextResponse.json<InvalidateSessionResponse>(
        { success: false, error: 'Invalid request format' },
        { status: 400, headers: SESSION_CONFIG.SECURITY_HEADERS }
      );
    }

    // Extract UUID from session token if provided
    let targetUUID = body.uuid;
    if (body.sessionToken && !targetUUID) {
      targetUUID = extractUuidFromToken(body.sessionToken) || undefined;
    }

    if (!targetUUID) {
      auditLog = {
        event: 'session_failed',
        ip: clientIp,
        userAgent,
        timestamp: Math.floor(Date.now() / 1000),
        errorCode: SessionErrorCode.INVALID_FORMAT,
        metadata: { 
          missingToken: !body.sessionToken,
          missingUUID: !body.uuid 
        },
      };

      smartLogger.api.warn('[SessionInvalidation] No UUID or session token provided', auditLog);

      return NextResponse.json<InvalidateSessionResponse>(
        { success: false, error: 'Session token or UUID required' },
        { status: 400, headers: SESSION_CONFIG.SECURITY_HEADERS }
      );
    }

    // Initialize Firebase Admin for session storage cleanup
    const db = requireFirebaseAdmin();
    let invalidatedCount = 0;

    try {
      // Create session invalidation record
      const invalidationRecord = {
        uuid: targetUUID,
        invalidatedAt: new Date().toISOString(),
        invalidatedBy: clientIp,
        reason: body.reason || 'User requested',
        userAgent,
        invalidateAll: body.invalidateAll || false,
        sessionToken: body.sessionToken ? 'provided' : 'not_provided',
      };

      // Store invalidation record
      await db.collection('session_invalidations').add(invalidationRecord);
      invalidatedCount++;

      // If invalidateAll is true, mark all sessions for this user as invalid
      if (body.invalidateAll) {
        const userSessions = await db
          .collection('active_sessions')
          .where('uuid', '==', targetUUID)
          .get();
        
        const batch = db.batch();
        userSessions.docs.forEach(doc => {
          batch.update(doc.ref, { 
            invalidated: true, 
            invalidatedAt: new Date().toISOString(),
            invalidationReason: body.reason || 'User requested invalidation of all sessions'
          });
        });
        
        await batch.commit();
        invalidatedCount += userSessions.size;
      }

      // Create success audit log
      auditLog = {
        event: 'session_failed', // Using 'failed' to indicate session was terminated
        uuid: targetUUID,
        ip: clientIp,
        userAgent,
        timestamp: Math.floor(Date.now() / 1000),
        metadata: {
          invalidatedCount,
          reason: body.reason || 'User requested',
          invalidateAll: body.invalidateAll || false,
          processingTimeMs: Date.now() - startTime,
        },
      };

      smartLogger.api.request('[SessionInvalidation] Session invalidated successfully', auditLog);

      const response: InvalidateSessionResponse = {
        success: true,
        message: 'Session invalidated successfully',
        invalidatedCount,
      };

      return NextResponse.json(response, {
        status: 200,
        headers: {
          ...SESSION_CONFIG.SECURITY_HEADERS,
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        },
      });

    } catch (dbError) {
      // Database error - still log the invalidation attempt
      auditLog = {
        event: 'session_failed',
        uuid: targetUUID,
        ip: clientIp,
        userAgent,
        timestamp: Math.floor(Date.now() / 1000),
        metadata: {
          error: 'Database error during invalidation',
          dbError: dbError instanceof Error ? dbError.message : 'Unknown DB error',
          processingTimeMs: Date.now() - startTime,
        },
      };

      smartLogger.api.warn('[SessionInvalidation] Database error during invalidation', auditLog);

      return NextResponse.json<InvalidateSessionResponse>(
        { success: false, error: 'Failed to invalidate session' },
        { status: 500, headers: SESSION_CONFIG.SECURITY_HEADERS }
      );
    }

  } catch (error) {
    // Create error audit log
    auditLog = {
      event: 'session_failed',
      ip: getClientIp(await headers()),
      userAgent: (await headers()).get('user-agent') || 'Unknown',
      timestamp: Math.floor(Date.now() / 1000),
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTimeMs: Date.now() - startTime,
      },
    };

    smartLogger.api.error('[SessionInvalidation] Session invalidation failed', { error, auditLog });

    return NextResponse.json<InvalidateSessionResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: SESSION_CONFIG.SECURITY_HEADERS }
    );
  }
}

// GET method to check invalidation status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uuid = searchParams.get('uuid');
    const sessionToken = searchParams.get('token');

    if (!uuid && !sessionToken) {
      return NextResponse.json(
        { error: 'UUID or session token required' },
        { status: 400, headers: SESSION_CONFIG.SECURITY_HEADERS }
      );
    }

    const targetUUID = uuid || extractUuidFromToken(sessionToken!);
    if (!targetUUID) {
      return NextResponse.json(
        { error: 'Invalid session token' },
        { status: 400, headers: SESSION_CONFIG.SECURITY_HEADERS }
      );
    }

    const db = requireFirebaseAdmin();
    
    // Check for recent invalidations
    const recentInvalidations = await db
      .collection('session_invalidations')
      .where('uuid', '==', targetUUID)
      .orderBy('invalidatedAt', 'desc')
      .limit(5)
      .get();

    const invalidations = recentInvalidations.docs.map(doc => ({
      invalidatedAt: doc.data().invalidatedAt,
      reason: doc.data().reason,
      invalidateAll: doc.data().invalidateAll,
    }));

    return NextResponse.json(
      { 
        uuid: targetUUID,
        invalidations,
        hasRecentInvalidation: invalidations.length > 0,
      },
      { 
        status: 200,
        headers: SESSION_CONFIG.SECURITY_HEADERS 
      }
    );

  } catch (error) {
    smartLogger.api.error('[SessionInvalidation] Error checking invalidation status', { error });
    
    return NextResponse.json(
      { error: 'Failed to check invalidation status' },
      { status: 500, headers: SESSION_CONFIG.SECURITY_HEADERS }
    );
  }
}

// Utility functions

function getClientIp(headersList: Headers): string {
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  const remoteAddr = headersList.get('x-vercel-forwarded-for'); // Vercel specific
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  return realIp || remoteAddr || '127.0.0.1';
}