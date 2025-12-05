/**
 * Maintenance Status API - PUBLIC
 * GET /api/maintenance/status
 * 
 * Returns current maintenance mode status.
 * No authentication required (public endpoint).
 * Fail-open: returns { enabled: false } on any error.
 * Includes estimatedDuration (in minutes) and enabledAt for countdown timer.
 * Includes bubbleSettings for chat bubble behavior during maintenance.
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

const COLLECTION = 'siteSettings';
const DOC_ID = 'maintenance';

export async function GET(request: NextRequest) {
  try {
    const docRef = adminDb.collection(COLLECTION).doc(DOC_ID);
    const snapshot = await docRef.get();
    
    // Document doesn't exist - maintenance is OFF
    if (!snapshot.exists) {
      console.log('[Maintenance Status] Document does not exist - returning disabled');
      return NextResponse.json({
        enabled: false,
        title: 'Under Maintenance',
        message: 'We\'ll be back soon!',
        showContactForm: true,
        estimatedDuration: null,
        enabledAt: null,
        bubbleSettings: null,
      });
    }
    
    const data = snapshot.data();
    
    console.log('[Maintenance Status] Current status:', data?.enabled ? 'ENABLED' : 'DISABLED');
    
    return NextResponse.json({
      enabled: data?.enabled === true,
      title: data?.title || 'Under Maintenance',
      message: data?.message || 'We\'re performing scheduled maintenance. Please check back soon!',
      showContactForm: data?.showContactForm ?? true,
      estimatedDuration: data?.estimatedDuration || null,
      enabledAt: data?.enabledAt?.toDate?.()?.toISOString() || null,
      bubbleSettings: data?.enabled ? (data?.bubbleSettings || {
        hideBubbleCompletely: false,
        allowResumeView: true,
        allowResumeDownload: true,
        allowAskDirect: false,
        allowPredefinedQuestions: true,
        disabledMessage: 'Disabled by admin due to maintenance',
      }) : null,
    });
    
  } catch (error: any) {
    // FAIL-OPEN: Return maintenance OFF on any error
    console.error('[Maintenance Status] Error - failing open:', error?.message);
    return NextResponse.json({
      enabled: false,
      error: 'Failed to check maintenance status',
    });
  }
}
