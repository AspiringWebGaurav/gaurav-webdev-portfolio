/**
 * Suspension Toggle API - ADMIN ONLY
 * POST /api/suspension/toggle
 * 
 * Enables or disables suspension mode.
 * Requires admin authentication via session cookie.
 * Writes to Firebase: siteSettings/suspension
 * Returns updated status.
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyAuth } from '@/lib/firebaseAdmin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { rateLimitMiddleware } from '@/lib/rateLimit';

const ALLOWED_EMAIL = "gauravpatil9262@gmail.com";
const COLLECTION = 'siteSettings';
const DOC_ID = 'suspension';

/**
 * Get client IP for logging
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  return forwarded?.split(',')[0] || real || 'Unknown';
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const { response: rateLimitResponse, headers: rateLimitHeaders } = await rateLimitMiddleware(
      request,
      'general',
      {}
    );

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('[Suspension Toggle] Missing authorization header');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Missing token' },
        { status: 401 }
      );
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyAuth(idToken);
    
    if (!decodedToken) {
      console.error('[Suspension Toggle] Invalid token');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }
    
    // Validate admin email
    if (decodedToken.email !== ALLOWED_EMAIL) {
      console.error('[Suspension Toggle] Forbidden - not admin:', decodedToken.email);
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const adminEmail = decodedToken.email;

    // Parse request body
    const body = await request.json();
    const { enabled, reason, estimatedDuration, autoEndEnabled } = body;

    // Validate input
    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Invalid input: enabled must be boolean' },
        { status: 400 }
      );
    }

    // Validate reason (if provided)
    if (reason && typeof reason !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid input: reason must be string' },
        { status: 400 }
      );
    }

    // Validate estimatedDuration (if provided)
    if (estimatedDuration !== null && estimatedDuration !== undefined) {
      if (typeof estimatedDuration !== 'number' || estimatedDuration < 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid input: estimatedDuration must be positive number' },
          { status: 400 }
        );
      }
    }

    // Validate autoEndEnabled (if provided)
    if (autoEndEnabled !== null && autoEndEnabled !== undefined) {
      if (typeof autoEndEnabled !== 'boolean') {
        return NextResponse.json(
          { success: false, error: 'Invalid input: autoEndEnabled must be boolean' },
          { status: 400 }
        );
      }
    }

    // Get admin details
    const clientIP = getClientIP(request);
    const now = Timestamp.now();

    // Update Firebase
    const docRef = adminDb.collection(COLLECTION).doc(DOC_ID);

    if (enabled) {
      // Enable suspension
      const updateData: any = {
        enabled: true,
        reason: reason?.trim().substring(0, 500) || '', // Max 500 chars
        enabledAt: now,
        enabledBy: adminEmail,
        enabledByIP: clientIP,
        lastUpdated: now,
      };

      // Store estimated duration in minutes (if provided)
      if (typeof estimatedDuration === 'number' && estimatedDuration > 0) {
        updateData.estimatedDuration = estimatedDuration;
      } else {
        updateData.estimatedDuration = null;
      }
      
      // Handle auto-end feature (matching maintenance pattern)
      if (autoEndEnabled === true && typeof estimatedDuration === 'number' && estimatedDuration > 0) {
        // Calculate auto-end timestamp: now + estimatedDuration (in minutes)
        const nowDate = now.toDate();
        const autoEndTime = new Date(nowDate.getTime() + (estimatedDuration * 60 * 1000));
        updateData.autoEndEnabled = true;
        updateData.autoEndAt = Timestamp.fromDate(autoEndTime);
        console.log('[Suspension Toggle] Auto-end scheduled for:', autoEndTime.toISOString());
      } else {
        updateData.autoEndEnabled = false;
        updateData.autoEndAt = null;
      }

      await docRef.set(updateData, { merge: true });

      console.log('[Suspension Toggle] ✅ Suspension ENABLED by:', adminEmail);

      return NextResponse.json({
        success: true,
        enabled: true,
        message: 'Suspension enabled successfully',
        enabledBy: adminEmail,
        timestamp: now.toDate().toISOString(),
        autoEndEnabled: updateData.autoEndEnabled,
        autoEndAt: updateData.autoEndAt?.toDate?.()?.toISOString() || null,
      });

    } else {
      // Disable suspension - clean up auto-end fields to save database costs
      await docRef.set({
        enabled: false,
        disabledAt: now,
        disabledBy: adminEmail,
        disabledByIP: clientIP,
        lastUpdated: now,
        // PERMANENTLY DELETE auto-end fields from database
        autoEndEnabled: FieldValue.delete(),
        autoEndAt: FieldValue.delete(),
      }, { merge: true });

      console.log('[Suspension Toggle] ✅ Suspension DISABLED by:', adminEmail);

      return NextResponse.json({
        success: true,
        enabled: false,
        message: 'Suspension disabled successfully',
        disabledBy: adminEmail,
        timestamp: now.toDate().toISOString(),
      });
    }

  } catch (error: any) {
    console.error('[Suspension Toggle] Error:', error?.message);

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update suspension status',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined 
      },
      { status: 500 }
    );
  }
}
