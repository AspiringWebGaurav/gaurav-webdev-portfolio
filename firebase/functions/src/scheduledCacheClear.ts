import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const rtdb = admin.database();

/**
 * Scheduled function to auto-clear caches every 12 hours
 * Runs at 00:00 and 12:00 UTC daily
 */
export const scheduledCacheClear = functions.pubsub
  .schedule('0 */12 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    const timestamp = Date.now();
    console.log(`[ScheduledCacheClear] Starting scheduled cache clear at ${new Date(timestamp).toISOString()}`);

    try {
      // Broadcast cache clear signal to all connected clients
      await rtdb.ref('cache-clear-signals').push({
        type: 'scheduled',
        timestamp,
        source: 'firebase-function',
        reason: 'Auto-clear every 12 hours',
      });

      console.log('[ScheduledCacheClear] Cache clear signal broadcasted successfully');

      // Log the operation to Firestore for audit trail
      await db.collection('admin_audit_logs').add({
        action: 'scheduled-cache-clear',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        timestampMillis: timestamp,
        type: 'auto',
        source: 'firebase-function',
        metadata: {
          cronSchedule: '0 */12 * * *',
          timezone: 'UTC',
        },
      });

      console.log('[ScheduledCacheClear] Audit log created');

      // Clean up old cache clear signals (keep only last 100)
      const oldSignals = await rtdb
        .ref('cache-clear-signals')
        .orderByChild('timestamp')
        .limitToFirst(1000)
        .once('value');

      if (oldSignals.exists()) {
        const signals = oldSignals.val();
        const signalKeys = Object.keys(signals);
        
        if (signalKeys.length > 100) {
          const toDelete = signalKeys.slice(0, signalKeys.length - 100);
          console.log(`[ScheduledCacheClear] Cleaning up ${toDelete.length} old signals`);
          
          const updates: Record<string, null> = {};
          toDelete.forEach((key) => {
            updates[`cache-clear-signals/${key}`] = null;
          });
          
          await rtdb.ref().update(updates);
        }
      }

      console.log('[ScheduledCacheClear] Cache clear completed successfully');
      return { success: true, timestamp };
    } catch (error: any) {
      console.error('[ScheduledCacheClear] Failed to clear cache:', error);
      
      // Log error to Firestore
      await db.collection('admin_audit_logs').add({
        action: 'scheduled-cache-clear-error',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        timestampMillis: timestamp,
        type: 'error',
        error: {
          message: error.message,
          code: error.code || 'UNKNOWN_ERROR',
          stack: error.stack,
        },
      });

      throw error;
    }
  });

/**
 * Callable function for manual cache clear from admin dashboard
 * Provides more control and immediate feedback
 */
export const clearCacheManual = functions.https.onCall(async (data, context) => {
  const timestamp = Date.now();
  
  // Verify admin authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to clear cache'
    );
  }

  // TODO: Add proper admin role verification
  // const adminRecord = await admin.auth().getUser(context.auth.uid);
  // if (!adminRecord.customClaims?.admin) {
  //   throw new functions.https.HttpsError(
  //     'permission-denied',
  //     'User must be an admin to clear cache'
  //   );
  // }

  console.log(`[ManualCacheClear] Admin ${context.auth.uid} triggered cache clear`);

  try {
    // Broadcast cache clear signal
    await rtdb.ref('cache-clear-signals').push({
      type: 'manual',
      timestamp,
      source: 'admin-dashboard',
      adminUid: context.auth.uid,
      reason: data.reason || 'Manual cache clear',
    });

    // Log the operation
    await db.collection('admin_audit_logs').add({
      action: 'manual-cache-clear',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      timestampMillis: timestamp,
      adminUid: context.auth.uid,
      type: 'manual',
      source: 'admin-dashboard',
      metadata: {
        reason: data.reason || 'Manual cache clear',
        ipAddress: context.rawRequest?.ip,
        userAgent: context.rawRequest?.headers['user-agent'],
      },
    });

    console.log('[ManualCacheClear] Cache clear completed successfully');

    return {
      success: true,
      timestamp,
      message: 'Cache clear signal broadcasted successfully',
    };
  } catch (error: any) {
    console.error('[ManualCacheClear] Failed to clear cache:', error);

    // Log error
    await db.collection('admin_audit_logs').add({
      action: 'manual-cache-clear-error',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      timestampMillis: timestamp,
      adminUid: context.auth.uid,
      type: 'error',
      error: {
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR',
      },
    });

    throw new functions.https.HttpsError(
      'internal',
      `Failed to clear cache: ${error.message}`,
      error
    );
  }
});
