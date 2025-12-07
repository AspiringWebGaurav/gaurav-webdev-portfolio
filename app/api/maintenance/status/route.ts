/**
 * Maintenance Status API - PUBLIC
 * GET /api/maintenance/status
 * 
 * Returns current maintenance mode status.
 * No authentication required (public endpoint).
 * Fail-open: returns { enabled: false } on any error.
 * Includes estimatedDuration (in minutes) and enabledAt for countdown timer.
 * Includes bubbleSettings for chat bubble behavior during maintenance.
 * 
 * AUTO-END FEATURE:
 * If autoEndEnabled is true and autoEndAt timestamp has passed,
 * automatically disables maintenance mode in Firestore and returns enabled: false.
 * This allows maintenance to end automatically without a cron job.
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

const COLLECTION = 'siteSettings';
const DOC_ID = 'maintenance';

/**
 * Helper function to auto-disable maintenance mode
 * Called when autoEndAt time has passed
 * 
 * IMPORTANT: Uses FieldValue.delete() to PERMANENTLY remove auto-end fields
 * from Firestore to save database costs. Only keeps essential fields.
 */
async function autoDisableMaintenance(docRef: FirebaseFirestore.DocumentReference): Promise<boolean> {
  try {
    const now = Timestamp.now();
    await docRef.update({
      // Keep only essential fields
      enabled: false,
      disabledAt: now,
      disabledBy: 'System (Auto-End)',
      lastUpdated: now,
      
      // PERMANENTLY DELETE these fields from database to save costs
      // Using FieldValue.delete() removes the field entirely, not just sets to null
      autoEndEnabled: FieldValue.delete(),
      autoEndAt: FieldValue.delete(),
      estimatedDuration: FieldValue.delete(),
      enabledAt: FieldValue.delete(),
      enabledBy: FieldValue.delete(),
      bubbleSettings: FieldValue.delete(),
      message: FieldValue.delete(),
      title: FieldValue.delete(),
    });
    console.log('[Maintenance Status] ✅ Auto-disabled maintenance & cleaned up database fields');
    return true;
  } catch (error: any) {
    // Fail gracefully - don't break the status check
    console.error('[Maintenance Status] Failed to auto-disable maintenance:', error?.message);
    return false;
  }
}

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
        autoEndEnabled: false,
        autoEndAt: null,
        bubbleSettings: null,
      });
    }
    
    const data = snapshot.data();
    
    // Check for auto-end condition
    // If maintenance is enabled AND auto-end is enabled AND autoEndAt has passed
    if (data?.enabled === true && data?.autoEndEnabled === true && data?.autoEndAt) {
      try {
        const autoEndTime = data.autoEndAt.toDate();
        const now = new Date();
        
        if (now >= autoEndTime) {
          console.log('[Maintenance Status] 🕐 Auto-end time reached, disabling maintenance automatically');
          
          // Attempt to auto-disable maintenance
          const success = await autoDisableMaintenance(docRef);
          
          if (success) {
            // Return disabled status - maintenance has ended
            return NextResponse.json({
              enabled: false,
              title: data?.title || 'Under Maintenance',
              message: data?.message || 'We\'re performing scheduled maintenance. Please check back soon!',
              showContactForm: data?.showContactForm ?? true,
              estimatedDuration: null,
              enabledAt: null,
              autoEndEnabled: false,
              autoEndAt: null,
              autoEndTriggered: true, // Flag to indicate auto-end was triggered
              bubbleSettings: null,
            });
          }
          // If auto-disable failed, continue with normal flow (fail-safe: still show maintenance)
          // This prevents a broken state but maintenance won't auto-end
          console.warn('[Maintenance Status] Auto-disable failed, continuing with maintenance enabled');
        }
      } catch (autoEndError: any) {
        // If auto-end check fails, continue with normal flow
        console.error('[Maintenance Status] Auto-end check error:', autoEndError?.message);
      }
    }
    
    console.log('[Maintenance Status] Current status:', data?.enabled ? 'ENABLED' : 'DISABLED');
    
    return NextResponse.json({
      enabled: data?.enabled === true,
      title: data?.title || 'Under Maintenance',
      message: data?.message || 'We\'re performing scheduled maintenance. Please check back soon!',
      showContactForm: data?.showContactForm ?? true,
      estimatedDuration: data?.estimatedDuration || null,
      enabledAt: data?.enabledAt?.toDate?.()?.toISOString() || null,
      autoEndEnabled: data?.autoEndEnabled ?? false,
      autoEndAt: data?.autoEndAt?.toDate?.()?.toISOString() || null,
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
