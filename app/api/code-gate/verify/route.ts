/**
 * Code Gate Verification API
 * Handles secret code verification, attempt tracking, and ban enforcement
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import admin from 'firebase-admin';
import type { 
  CodeVerificationRequest, 
  CodeVerificationResponse,
  CodeAttempt,
  CodeBan,
  CodeGateSession,
  AbuseLogEntry
} from '@/types/codeGate';

const MAX_ATTEMPTS = 3;
const BAN_DURATION_HOURS = 24; // 24-hour temporary ban

/**
 * POST /api/code-gate/verify
 * Verifies the secret code and manages access control
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CodeVerificationRequest;
    const { code, visitorId } = body;

    if (!code || !visitorId) {
      return NextResponse.json(
        { success: false, message: 'Code and visitor ID required' },
        { status: 400 }
      );
    }

    // Get IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                      request.headers.get('x-real-ip') || 
                      null;
    const userAgent = request.headers.get('user-agent') || null;

    // Check if visitor is already banned
    const banCheck = await checkBanStatus(visitorId);
    if (banCheck.isBanned) {
      // Log blocked attempt
      await logAbuseEvent({
        visitorId,
        ipAddress,
        eventType: 'failed_attempt',
        attemptedCode: code,
        timestamp: new Date(),
        userAgent,
        attemptedPath: '/admin/code-gate',
        metadata: { reason: 'banned_user_attempt' }
      });

      return NextResponse.json({
        success: false,
        banned: true,
        message: banCheck.isPermanent 
          ? 'Access permanently denied due to multiple failed attempts.'
          : `Access temporarily denied. Try again after ${banCheck.expiresAt?.toLocaleString()}.`
      }, { status: 403 });
    }

    // Get the secret code from database
    const secretCodeDoc = await adminDb
      .collection('config')
      .where('label', '==', 'gaurav-here')
      .where('enabled', '==', true)
      .limit(1)
      .get();

    if (secretCodeDoc.empty) {
      console.error('Secret code not found in database');
      return NextResponse.json(
        { success: false, message: 'System configuration error' },
        { status: 500 }
      );
    }

    const secretCode = secretCodeDoc.docs[0].data().code;

    // Verify the code
    const isCorrect = code.trim() === secretCode.trim();

    // Log the attempt
    const attemptData: Omit<CodeAttempt, 'id'> = {
      visitorId,
      ipAddress,
      attemptedCode: code,
      timestamp: new Date(),
      userAgent,
      successful: isCorrect
    };

    await adminDb.collection('codeAttempts').add(attemptData);

    if (isCorrect) {
      // Success - create temporary clearance record
      console.log('[CodeGate Verify] Code correct, creating clearance for:', visitorId.substring(0, 16) + '...');
      
      // This record expires when user logs out or after Firebase session ends
      const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      const clearanceData = {
        visitorId,
        unlockedAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: admin.firestore.Timestamp.fromDate(expiryDate),
        ipAddress,
        userAgent
      };

      const docRef = await adminDb.collection('codeGateSessions').add(clearanceData);
      console.log('[CodeGate Verify] Clearance created with ID:', docRef.id);

      // Log success event
      await logAbuseEvent({
        visitorId,
        ipAddress,
        eventType: 'code_success',
        attemptedCode: code,
        timestamp: new Date(),
        userAgent,
        attemptedPath: '/admin/code-gate'
      });

      return NextResponse.json({
        success: true,
        message: 'Access granted',
        visitorId // Return visitorId for client to send in subsequent requests
      });
    }

    // Failed attempt - check if we need to ban
    const recentAttempts = await getRecentFailedAttempts(visitorId);
    const attemptsRemaining = MAX_ATTEMPTS - recentAttempts;

    // Log failed attempt
    await logAbuseEvent({
      visitorId,
      ipAddress,
      eventType: 'failed_attempt',
      attemptedCode: code,
      timestamp: new Date(),
      userAgent,
      attemptedPath: '/admin/code-gate',
      metadata: { attemptsRemaining }
    });

    if (attemptsRemaining <= 0) {
      // Ban the user
      const banData: Omit<CodeBan, 'id'> = {
        visitorId,
        ipAddress,
        reason: `Exceeded maximum attempts (${MAX_ATTEMPTS})`,
        bannedAt: new Date(),
        expiresAt: new Date(Date.now() + BAN_DURATION_HOURS * 60 * 60 * 1000),
        attemptCount: recentAttempts,
        isPermanent: false,
        lastAttemptAt: new Date()
      };

      await adminDb.collection('codeBans').add(banData);

      // Log ban event
      await logAbuseEvent({
        visitorId,
        ipAddress,
        eventType: 'banned',
        attemptedCode: null,
        timestamp: new Date(),
        userAgent,
        attemptedPath: '/admin/code-gate',
        metadata: { banDurationHours: BAN_DURATION_HOURS, attemptCount: recentAttempts }
      });

      return NextResponse.json({
        success: false,
        banned: true,
        message: 'Maximum attempts exceeded. Access denied.'
      }, { status: 403 });
    }

    return NextResponse.json({
      success: false,
      attemptsRemaining,
      message: `Incorrect code. ${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} remaining.`
    }, { status: 401 });

  } catch (error) {
    console.error('Code verification error:', error);
    return NextResponse.json(
      { success: false, message: 'Verification failed' },
      { status: 500 }
    );
  }
}

/**
 * Check if a visitor is banned
 */
async function checkBanStatus(visitorId: string): Promise<{
  isBanned: boolean;
  isPermanent: boolean;
  expiresAt?: Date;
}> {
  const now = new Date();
  
  const bansSnapshot = await adminDb
    .collection('codeBans')
    .where('visitorId', '==', visitorId)
    .get();

  for (const doc of bansSnapshot.docs) {
    const ban = doc.data() as CodeBan;
    
    // Check permanent ban
    if (ban.isPermanent) {
      return { isBanned: true, isPermanent: true };
    }

    // Check temporary ban
    const expiresAt = ban.expiresAt instanceof Date 
      ? ban.expiresAt 
      : (ban.expiresAt as any)?.toDate?.() || null;
    
    if (expiresAt && expiresAt > now) {
      return { 
        isBanned: true, 
        isPermanent: false,
        expiresAt: expiresAt
      };
    }
  }

  return { isBanned: false, isPermanent: false };
}

/**
 * Get count of recent failed attempts (last 24 hours)
 */
async function getRecentFailedAttempts(visitorId: string): Promise<number> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const attemptsSnapshot = await adminDb
    .collection('codeAttempts')
    .where('visitorId', '==', visitorId)
    .where('successful', '==', false)
    .where('timestamp', '>=', oneDayAgo)
    .get();

  return attemptsSnapshot.size;
}

/**
 * Log an abuse event
 */
async function logAbuseEvent(event: Omit<AbuseLogEntry, 'id'>): Promise<void> {
  await adminDb.collection('abuseLog').add(event);
}
