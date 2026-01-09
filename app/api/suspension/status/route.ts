/**
 * Suspension Status API - PUBLIC
 * GET /api/suspension/status
 * 
 * Returns current suspension mode status.
 * No authentication required (public endpoint).
 * Fail-open: returns { enabled: false } on any error.
 * Includes reason, estimatedDuration, and enabledAt for UI display.
 * 
 * CACHE STRATEGY:
 * - Enabled state: 10s cache - allows quick updates
 * - Disabled state: 5s cache - prevents stale suspension pages
 * - Localhost: 0s cache (no cache) - immediate testing
 * - All responses: must-revalidate - forces revalidation on stale cache
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

/**
 * Detect if request is from localhost
 */
function isLocalhostRequest(request: NextRequest): boolean {
  const host = request.headers.get('host') || '';
  return (
    host.includes('localhost') ||
    host.includes('127.0.0.1') ||
    host.startsWith('192.168.') ||
    host.startsWith('10.')
  );
}

const COLLECTION = 'siteSettings';
const DOC_ID = 'suspension';

/**
 * Helper function to auto-disable suspension mode
 * Called when autoEndAt time has passed
 * Uses FieldValue.delete() to clean up fields and save database costs
 */
async function autoDisableSuspension(docRef: FirebaseFirestore.DocumentReference): Promise<boolean> {
  try {
    const now = Timestamp.now();
    await docRef.update({
      enabled: false,
      disabledAt: now,
      disabledBy: 'System (Auto-End)',
      lastUpdated: now,
      
      // PERMANENTLY DELETE these fields from database to save costs
      autoEndEnabled: FieldValue.delete(),
      autoEndAt: FieldValue.delete(),
      estimatedDuration: FieldValue.delete(),
      enabledAt: FieldValue.delete(),
      enabledBy: FieldValue.delete(),
    });
    console.log('[Suspension Status] ✅ Auto-disabled suspension & cleaned up database fields');
    return true;
  } catch (error: any) {
    console.error('[Suspension Status] Failed to auto-disable suspension:', error?.message);
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const isLocalhost = isLocalhostRequest(request);
    const docRef = adminDb.collection(COLLECTION).doc(DOC_ID);
    const snapshot = await docRef.get();
    
    // Document doesn't exist - suspension is OFF
    if (!snapshot.exists) {
      console.log('[Suspension Status] Document does not exist - returning disabled');
      const response = NextResponse.json({
        enabled: false,
        localDevelopment: isLocalhost,
        reason: '',
        estimatedDuration: null,
        enabledAt: null,
        enabledBy: null,
      });
      
      // Cache for 5 seconds when disabled
      if (!isLocalhost) {
        response.headers.set(
          'Cache-Control',
          'public, s-maxage=5, stale-while-revalidate=10, must-revalidate'
        );
      } else {
        response.headers.set('Cache-Control', 'no-store');
      }
      
      return response;
    }
    
    const data = snapshot.data();
    
    // Check for auto-end condition (matching maintenance pattern)
    // If suspension is enabled AND auto-end is enabled AND autoEndAt has passed
    if (data?.enabled === true && data?.autoEndEnabled === true && data?.autoEndAt) {
      try {
        const autoEndTime = data.autoEndAt.toDate();
        const now = new Date();
        
        if (now >= autoEndTime) {
          console.log('[Suspension Status] 🕐 Auto-end time reached, disabling suspension automatically');
          
          // Attempt to auto-disable suspension
          const success = await autoDisableSuspension(docRef);
          
          if (success) {
            // Return disabled status - suspension has ended
            const response = NextResponse.json({
              enabled: false,
              localDevelopment: isLocalhost,
              reason: data?.reason || '',
              estimatedDuration: null,
              enabledAt: null,
              enabledBy: null,
              disabledAt: Timestamp.now().toDate().toISOString(),
              disabledBy: 'System (Auto-End)',
              lastUpdated: Timestamp.now().toDate().toISOString(),
              autoEndEnabled: false,
              autoEndAt: null,
              autoEndTriggered: true, // Flag to indicate auto-end was triggered
            });
            
            // NO CACHE for suspension end to prevent stale data
            response.headers.set('Cache-Control', 'no-store, must-revalidate');
            
            return response;
          }
          // If auto-disable failed, continue with normal flow (fail-safe)
          console.warn('[Suspension Status] Auto-disable failed, continuing with suspension enabled');
        }
      } catch (autoEndError: any) {
        console.error('[Suspension Status] Auto-end check error:', autoEndError?.message);
      }
    }
    
    const enabled = data?.enabled === true;
    
    // Parse timestamps
    let enabledAt: string | null = null;
    if (data?.enabledAt) {
      try {
        const timestamp = data.enabledAt as Timestamp;
        enabledAt = timestamp.toDate().toISOString();
      } catch (e) {
        console.warn('[Suspension Status] Failed to parse enabledAt timestamp');
      }
    }

    let autoEndAt: string | null = null;
    if (data?.autoEndAt) {
      try {
        const timestamp = data.autoEndAt as Timestamp;
        autoEndAt = timestamp.toDate().toISOString();
      } catch (e) {
        console.warn('[Suspension Status] Failed to parse autoEndAt timestamp');
      }
    }

    let disabledAt: string | null = null;
    if (data?.disabledAt) {
      try {
        const timestamp = data.disabledAt as Timestamp;
        disabledAt = timestamp.toDate().toISOString();
      } catch (e) {
        console.warn('[Suspension Status] Failed to parse disabledAt timestamp');
      }
    }
    
    const responseData = {
      enabled,
      localDevelopment: isLocalhost,
      reason: data?.reason || '',
      estimatedDuration: data?.estimatedDuration || null,
      enabledAt,
      enabledBy: data?.enabledBy || null,
      disabledAt,
      disabledBy: data?.disabledBy || null,
      lastUpdated: data?.lastUpdated?.toDate?.()?.toISOString() || null,
      autoEndEnabled: data?.autoEndEnabled || false,
      autoEndAt,
    };
    
    const response = NextResponse.json(responseData);
    
    // Cache strategy - matching maintenance pattern
    // NO CACHE when disabled to prevent stale "suspension active" pages
    if (!isLocalhost) {
      if (enabled) {
        // Suspension enabled: 10s cache
        response.headers.set(
          'Cache-Control',
          'public, s-maxage=10, stale-while-revalidate=10, must-revalidate'
        );
      } else {
        // Suspension disabled: NO CACHE to prevent stale pages
        response.headers.set('Cache-Control', 'no-store, must-revalidate');
      }
    } else {
      // Localhost: no cache
      response.headers.set('Cache-Control', 'no-store');
    }
    
    console.log('[Suspension Status] Returned:', { enabled, reason: data?.reason });
    return response;
    
  } catch (error: any) {
    // Fail-open: return disabled state on error
    console.error('[Suspension Status] Error checking status:', error?.message);
    
    const response = NextResponse.json({
      enabled: false,
      localDevelopment: false,
      reason: '',
      estimatedDuration: null,
      enabledAt: null,
      enabledBy: null,
      error: 'Failed to check suspension status',
    });
    
    // Short cache on error to allow quick recovery
    response.headers.set('Cache-Control', 'public, s-maxage=5, must-revalidate');
    
    return response;
  }
}
