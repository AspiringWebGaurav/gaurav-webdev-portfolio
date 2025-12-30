/**
 * Check Unban API Route - On-Demand Ban Expiry Check
 * 
 * Hybrid approach for near-instant unbanning:
 * - Client calls this when countdown reaches 0:00
 * - Server validates ban has actually expired
 * - Unbans immediately if valid
 * - Cloud Function scheduler acts as failsafe backup
 * 
 * Security:
 * - Rate limited to 1 call per visitor per minute
 * - Server-side validation of expiration time
 * - Cannot be abused to bypass ban duration
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

const VISITORS_COLLECTION = 'og_uuid';
const BAN_LOGS_COLLECTION = 'banLogs';

// Rate limiting cache (in-memory, per instance)
const rateLimitCache = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute

/**
 * POST /api/visitor-analytics/check-unban
 * Body: { visitorId: string, fingerprint: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { visitorId, fingerprint } = body;

    // Validate required fields
    if (!visitorId || typeof visitorId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid visitorId' },
        { status: 400 }
      );
    }

    // Rate limiting check
    const rateLimitKey = `${visitorId}-${fingerprint}`;
    const lastCallTime = rateLimitCache.get(rateLimitKey);
    const now = Date.now();

    if (lastCallTime && (now - lastCallTime) < RATE_LIMIT_WINDOW) {
      const remainingTime = Math.ceil((RATE_LIMIT_WINDOW - (now - lastCallTime)) / 1000);
      console.log(`[Check-Unban] Rate limited: ${visitorId.substring(0, 13)} (${remainingTime}s remaining)`);
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rate limited',
          rateLimited: true,
          retryAfter: remainingTime,
          message: `Please wait ${remainingTime} seconds before trying again`
        },
        { status: 429 }
      );
    }

    // Update rate limit cache
    rateLimitCache.set(rateLimitKey, now);

    // Clean up old rate limit entries (prevent memory leak)
    if (rateLimitCache.size > 10000) {
      const cutoffTime = now - RATE_LIMIT_WINDOW;
      for (const [key, time] of rateLimitCache.entries()) {
        if (time < cutoffTime) {
          rateLimitCache.delete(key);
        }
      }
    }

    console.log(`[Check-Unban] Checking ban status for: ${visitorId.substring(0, 13)}`);

    // Fetch visitor document
    const visitorRef = adminDb.collection(VISITORS_COLLECTION).doc(visitorId);
    const visitorDoc = await visitorRef.get();

    if (!visitorDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Visitor not found', notFound: true },
        { status: 404 }
      );
    }

    const visitorData = visitorDoc.data();

    // Check if visitor is actually banned
    if (!visitorData?.banned) {
      console.log(`[Check-Unban] Visitor not banned: ${visitorId.substring(0, 13)}`);
      return NextResponse.json({
        success: true,
        unbanned: true,
        alreadyUnbanned: true,
        message: 'Visitor is not currently banned'
      });
    }

    // Verify it's a temporary ban with auto-unban enabled
    if (visitorData.banType !== 'temporary' || !visitorData.autoUnbanEnabled) {
      console.log(`[Check-Unban] Not eligible for auto-unban: ${visitorId.substring(0, 13)}`);
      return NextResponse.json({
        success: false,
        unbanned: false,
        eligible: false,
        message: 'Ban is not eligible for automatic unban',
        banType: visitorData.banType
      });
    }

    // Check if ban has actually expired
    const banExpiresAt = visitorData.banExpiresAt;
    if (!banExpiresAt) {
      console.log(`[Check-Unban] No expiration time set: ${visitorId.substring(0, 13)}`);
      return NextResponse.json({
        success: false,
        unbanned: false,
        error: 'Ban expiration time not set'
      }, { status: 400 });
    }

    const serverNow = Timestamp.now();
    const expirationTime = banExpiresAt.toDate ? banExpiresAt.toDate() : new Date(banExpiresAt);
    const hasExpired = serverNow.toMillis() >= expirationTime.getTime();

    if (!hasExpired) {
      const remainingMs = expirationTime.getTime() - serverNow.toMillis();
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      
      console.log(`[Check-Unban] Ban not expired yet: ${visitorId.substring(0, 13)} (${remainingSeconds}s remaining)`);
      
      return NextResponse.json({
        success: false,
        unbanned: false,
        expired: false,
        remainingSeconds,
        message: `Ban expires in ${remainingSeconds} seconds`
      });
    }

    // Ban HAS expired - proceed with unban
    console.log(`[Check-Unban] ✅ Ban expired, unbanning: ${visitorId.substring(0, 13)}`);

    // Store ban info for audit log
    const previousBanInfo = {
      reason: visitorData.banReason || 'Unknown',
      category: visitorData.banCategory || 'Unknown',
      bannedBy: visitorData.bannedBy || 'Unknown',
      banTimestamp: visitorData.banTimestamp || serverNow,
      banDuration: visitorData.banDuration || null,
      banExpiresAt: visitorData.banExpiresAt || null,
    };

    // Unban the visitor
    await visitorRef.update({
      banned: false,
      banReason: FieldValue.delete(),
      banCategory: FieldValue.delete(),
      banTimestamp: FieldValue.delete(),
      bannedBy: FieldValue.delete(),
      bannedByUid: FieldValue.delete(),
      banType: FieldValue.delete(),
      banDuration: FieldValue.delete(),
      banExpiresAt: FieldValue.delete(),
      autoUnbanEnabled: FieldValue.delete(),
      updatedAt: serverNow,
    });

    // Create unban log
    const unbanLogRef = adminDb.collection(BAN_LOGS_COLLECTION).doc();
    await unbanLogRef.set({
      visitorId,
      mask: visitorData.mask || null,
      action: 'auto-unban-immediate',
      timestamp: serverNow,
      performedBy: 'system',
      performedByEmail: 'auto-unban-api',
      reason: 'Temporary ban expired (immediate check)',
      previousBanInfo,
      method: 'on-demand-api',
      triggeredBy: 'client-countdown',
    });

    console.log(`[Check-Unban] ✅ Successfully unbanned: ${visitorId.substring(0, 13)}`);

    return NextResponse.json({
      success: true,
      unbanned: true,
      immediate: true,
      message: 'Ban has been lifted - you can now access the portfolio',
      redirectTo: '/'
    });

  } catch (error) {
    console.error('[Check-Unban] Error:', error);
    
    // Graceful error response
    return NextResponse.json(
      {
        success: false,
        unbanned: false,
        error: 'Failed to check ban status',
        details: error instanceof Error ? error.message : 'Unknown error',
        fallback: true,
        message: 'Automated unban will occur within 60 seconds'
      },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, { status: 200 });
}
