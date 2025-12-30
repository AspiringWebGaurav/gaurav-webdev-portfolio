/**
 * Auto-Unban Scheduler - Server-Side Automatic Unban System
 * 
 * Runs every 1 minute to check for expired temporary bans
 * 100% server-authoritative - no client cache dependencies
 * 
 * Features:
 * - Checks for temporary bans with autoUnbanEnabled = true
 * - Compares banExpiresAt with current server time
 * - Automatically unbans expired visitors
 * - Creates audit logs for each auto-unban
 * - Processes up to 100 expired bans per run
 * - Fail-safe error handling with retry logic
 */

import * as functions from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';

// Reuse admin instance if already initialized
const db = admin.firestore();

const VISITORS_COLLECTION = 'og_uuid';
const BAN_LOGS_COLLECTION = 'banLogs';
const BAN_HISTORY_COLLECTION = 'banHistory';
const MAX_BATCH_SIZE = 100; // Process up to 100 expired bans per run

/**
 * Scheduled function that runs every 1 minute
 * Checks for expired temporary bans and automatically unbans them
 */
export const autoUnbanScheduler = functions.onSchedule(
  {
    schedule: 'every 1 minutes',
    timeZone: 'UTC',
    memory: '256MiB' as any,
  },
  async (event): Promise<void> => {
    const startTime = Date.now();
    const now = admin.firestore.Timestamp.now();
    
    console.log(`[Auto-Unban] Starting scheduled check at ${new Date().toISOString()}`);

    try {
      // Debug: Log current time
      console.log(`[Auto-Unban] Current server time: ${now.toDate().toISOString()}`);
      
      // Query for expired temporary bans
      // Conditions:
      // 1. banned = true
      // 2. banType = 'temporary'
      // 3. autoUnbanEnabled = true
      // 4. banExpiresAt <= now (expired)
      const expiredBansQuery = await db
        .collection(VISITORS_COLLECTION)
        .where('banned', '==', true)
        .where('banType', '==', 'temporary')
        .where('autoUnbanEnabled', '==', true)
        .where('banExpiresAt', '<=', now)
        .limit(MAX_BATCH_SIZE)
        .get();

      console.log(`[Auto-Unban] Query returned ${expiredBansQuery.size} document(s)`);

      if (expiredBansQuery.empty) {
        console.log('[Auto-Unban] No expired bans found');
        return;
      }

      console.log(`[Auto-Unban] Found ${expiredBansQuery.size} expired ban(s) to process`);

      // Process unbans in batches (Firestore batch limit is 500)
      const batch = db.batch();
      let processedCount = 0;
      const unbanResults: Array<{ visitorId: string; mask?: string; success: boolean; error?: string }> = [];

      for (const doc of expiredBansQuery.docs) {
        try {
          const visitorId = doc.id;
          const visitorData = doc.data();
          const mask = visitorData.mask;

          console.log(`[Auto-Unban] Processing visitor: ${visitorId.substring(0, 13)} (Mask: ${mask || 'N/A'})`);

          // Store previous ban info for audit
          const previousBanInfo = {
            reason: visitorData.banReason || 'Unknown',
            category: visitorData.banCategory || 'Unknown',
            bannedBy: visitorData.bannedBy || 'Unknown',
            banTimestamp: visitorData.banTimestamp || visitorData.bannedAt || now,
            banDuration: visitorData.banDuration || null,
            banExpiresAt: visitorData.banExpiresAt || null,
          };

          // Update visitor document - remove all ban fields
          const visitorRef = db.collection(VISITORS_COLLECTION).doc(visitorId);
          batch.update(visitorRef, {
            banned: false,
            banReason: admin.firestore.FieldValue.delete(),
            banCategory: admin.firestore.FieldValue.delete(),
            banTimestamp: admin.firestore.FieldValue.delete(),
            bannedBy: admin.firestore.FieldValue.delete(),
            bannedByUid: admin.firestore.FieldValue.delete(),
            // Clean up temporary ban fields
            banType: admin.firestore.FieldValue.delete(),
            banDuration: admin.firestore.FieldValue.delete(),
            autoUnbanEnabled: admin.firestore.FieldValue.delete(),
            banExpiresAt: admin.firestore.FieldValue.delete(),
            // Set unban metadata
            unbannedAt: now,
            unbannedBy: 'AUTO_SYSTEM',
            unbannedByUid: 'system',
            lastUnbanReason: 'Temporary ban expired (auto-unban)',
            updatedAt: now,
            lastBanUpdate: now,
          });

          // Create auto-unban log entry
          const logRef = db.collection(BAN_LOGS_COLLECTION).doc();
          batch.set(logRef, {
            visitorId,
            mask: mask || null,
            action: 'auto-unban',
            reason: 'Temporary ban expired',
            unbannedBy: 'AUTO_SYSTEM',
            unbannedByUid: 'system',
            timestamp: now,
            previousBanInfo: {
              reason: previousBanInfo.reason,
              category: previousBanInfo.category,
              bannedBy: previousBanInfo.bannedBy,
              banTimestamp: previousBanInfo.banTimestamp,
              banDuration: previousBanInfo.banDuration,
              banExpiresAt: previousBanInfo.banExpiresAt,
            },
            metadata: {
              processedAt: new Date().toISOString(),
              schedulerRun: true,
            },
          });

          // Add to ban history
          const historyRef = db.collection(BAN_HISTORY_COLLECTION).doc();
          batch.set(historyRef, {
            visitorId,
            mask: mask || null,
            action: 'auto-unbanned',
            reason: 'Temporary ban expired',
            performedBy: 'AUTO_SYSTEM',
            performedByUid: 'system',
            timestamp: now,
            previousState: {
              banned: true,
              banReason: previousBanInfo.reason,
              banCategory: previousBanInfo.category,
              banType: 'temporary',
            },
            newState: {
              banned: false,
            },
          });

          processedCount++;
          unbanResults.push({ visitorId, mask, success: true });

          console.log(`[Auto-Unban] ✅ Queued unban for visitor: ${visitorId.substring(0, 13)}`);

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`[Auto-Unban] ❌ Failed to process visitor ${doc.id}:`, errorMessage);
          unbanResults.push({ 
            visitorId: doc.id, 
            success: false, 
            error: errorMessage 
          });
          // Continue processing other visitors even if one fails
        }
      }

      // Commit all changes in a single batch (atomic operation)
      if (processedCount > 0) {
        await batch.commit();
        const duration = Date.now() - startTime;
        console.log(`[Auto-Unban] ✅ Successfully auto-unbanned ${processedCount} visitor(s) in ${duration}ms`);

        // Log summary to admin audit logs
        await db.collection('admin_audit_logs').add({
          action: 'auto-unban-batch',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          timestampMillis: Date.now(),
          processedCount,
          duration,
          results: unbanResults,
          metadata: {
            schedulerRun: true,
            batchSize: expiredBansQuery.size,
          },
        });
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Auto-Unban] ❌ Critical error during auto-unban process:`, errorMessage);
      console.error('[Auto-Unban] Error details:', error);

      // Log critical failure for admin review
      try {
        await db.collection('admin_audit_logs').add({
          action: 'auto-unban-error',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          timestampMillis: Date.now(),
          error: errorMessage,
          duration,
          metadata: {
            schedulerRun: true,
            critical: true,
          },
        });
      } catch (logError) {
        console.error('[Auto-Unban] Failed to log error:', logError);
      }

      // Don't throw - allow function to complete gracefully
      // Next scheduled run will retry
      return;
    }

    return;
  }
);
