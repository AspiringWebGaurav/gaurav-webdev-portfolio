/**
 * Maintenance Toggle API - ADMIN ONLY
 * POST /api/maintenance/toggle
 * 
 * Enables or disables maintenance mode.
 * Requires Firebase ID token authentication.
 * Only allowed admin can toggle.
 * Supports estimated duration (in minutes) for countdown timer.
 * Supports bubble settings during maintenance mode.
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyAuth } from '@/lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

const ALLOWED_EMAIL = "gauravpatil9262@gmail.com";
const COLLECTION = 'siteSettings';
const DOC_ID = 'maintenance';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 1. Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('[Maintenance Toggle] Missing authorization header');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Missing token' },
        { status: 401 }
      );
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyAuth(idToken);
    
    if (!decodedToken) {
      console.error('[Maintenance Toggle] Invalid token');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }
    
    // 2. Validate admin email
    if (decodedToken.email !== ALLOWED_EMAIL) {
      console.error('[Maintenance Toggle] Forbidden - not admin:', decodedToken.email);
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }
    
    // 3. Parse request body
    const body = await request.json();
    const { enabled, message, title, estimatedDuration, bubbleSettings } = body;
    
    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'enabled must be a boolean' },
        { status: 400 }
      );
    }
    
    // 4. Update Firestore document
    const docRef = adminDb.collection(COLLECTION).doc(DOC_ID);
    const now = Timestamp.now();
    
    const updateData: Record<string, any> = {
      enabled,
      lastUpdated: now,
    };
    
    if (enabled) {
      updateData.enabledAt = now;
      updateData.enabledBy = decodedToken.email;
      if (message) updateData.message = message;
      if (title) updateData.title = title;
      // Store estimated duration in minutes
      if (typeof estimatedDuration === 'number' && estimatedDuration > 0) {
        updateData.estimatedDuration = estimatedDuration;
      }
      // Store bubble settings for maintenance mode
      if (bubbleSettings) {
        updateData.bubbleSettings = {
          hideBubbleCompletely: bubbleSettings.hideBubbleCompletely ?? false,
          allowResumeView: bubbleSettings.allowResumeView ?? true,
          allowResumeDownload: bubbleSettings.allowResumeDownload ?? true,
          allowAskDirect: bubbleSettings.allowAskDirect ?? false,
          allowPredefinedQuestions: bubbleSettings.allowPredefinedQuestions ?? true,
          disabledMessage: bubbleSettings.disabledMessage || 'Disabled by admin due to maintenance',
        };
      } else {
        // Default bubble settings during maintenance
        updateData.bubbleSettings = {
          hideBubbleCompletely: false,
          allowResumeView: true,
          allowResumeDownload: true,
          allowAskDirect: false,
          allowPredefinedQuestions: true,
          disabledMessage: 'Disabled by admin due to maintenance',
        };
      }
    } else {
      updateData.disabledAt = now;
      updateData.disabledBy = decodedToken.email;
      // Clear estimated duration when disabling
      updateData.estimatedDuration = null;
      // Clear bubble settings when disabling (back to normal)
      updateData.bubbleSettings = null;
    }
    
    // Check if document exists, create or update accordingly
    const docSnapshot = await docRef.get();
    
    if (!docSnapshot.exists) {
      // Create document with defaults
      await docRef.set({
        enabled,
        title: title || 'Under Maintenance',
        message: message || 'We\'re performing scheduled maintenance. Please check back soon!',
        showContactForm: true,
        enabledAt: enabled ? now : null,
        enabledBy: enabled ? decodedToken.email : null,
        disabledAt: enabled ? null : now,
        disabledBy: enabled ? null : decodedToken.email,
        estimatedDuration: enabled && typeof estimatedDuration === 'number' ? estimatedDuration : null,
        bubbleSettings: enabled ? {
          hideBubbleCompletely: bubbleSettings?.hideBubbleCompletely ?? false,
          allowResumeView: bubbleSettings?.allowResumeView ?? true,
          allowResumeDownload: bubbleSettings?.allowResumeDownload ?? true,
          allowAskDirect: bubbleSettings?.allowAskDirect ?? false,
          allowPredefinedQuestions: bubbleSettings?.allowPredefinedQuestions ?? true,
          disabledMessage: bubbleSettings?.disabledMessage || 'Disabled by admin due to maintenance',
        } : null,
        lastUpdated: now,
      });
    } else {
      await docRef.update(updateData);
    }
    
    const duration = Date.now() - startTime;
    console.log(`[Maintenance Toggle] ${enabled ? '🔧 ENABLED' : '✅ DISABLED'} by ${decodedToken.email} (${duration}ms)`);
    
    return NextResponse.json({
      success: true,
      enabled,
      message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`,
      toggledBy: decodedToken.email,
      timestamp: now.toDate().toISOString(),
    });
    
  } catch (error: any) {
    console.error('[Maintenance Toggle] Error:', error?.message);
    return NextResponse.json(
      { success: false, error: 'Failed to toggle maintenance mode' },
      { status: 500 }
    );
  }
}

// GET - Fetch current settings (admin only)
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyAuth(idToken);
    
    if (!decodedToken || decodedToken.email !== ALLOWED_EMAIL) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    const docRef = adminDb.collection(COLLECTION).doc(DOC_ID);
    const snapshot = await docRef.get();
    
    if (!snapshot.exists) {
      return NextResponse.json({
        success: true,
        enabled: false,
        title: 'Under Maintenance',
        message: 'We\'re performing scheduled maintenance. Please check back soon!',
        showContactForm: true,
        enabledAt: null,
        enabledBy: null,
        estimatedDuration: null,
        bubbleSettings: null,
      });
    }
    
    const data = snapshot.data();
    
    return NextResponse.json({
      success: true,
      enabled: data?.enabled ?? false,
      title: data?.title || 'Under Maintenance',
      message: data?.message || 'We\'re performing scheduled maintenance. Please check back soon!',
      showContactForm: data?.showContactForm ?? true,
      enabledAt: data?.enabledAt?.toDate?.()?.toISOString() || null,
      enabledBy: data?.enabledBy || null,
      disabledAt: data?.disabledAt?.toDate?.()?.toISOString() || null,
      disabledBy: data?.disabledBy || null,
      estimatedDuration: data?.estimatedDuration || null,
      bubbleSettings: data?.bubbleSettings || null,
    });
    
  } catch (error: any) {
    console.error('[Maintenance Settings] Error:', error?.message);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}
