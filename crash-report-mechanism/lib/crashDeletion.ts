/**
 * Crash Report Deletion Service
 * 3-layer fault-tolerant deletion with Storage cleanup
 * Ensures no stale data remains in Firestore or Storage
 */

export interface DeleteCrashReportOptions {
  id: string;
  screenshotUrl?: string | null;
  retryCount?: number;
}

export interface DeleteResult {
  success: boolean;
  deletedFromFirestore: boolean;
  deletedFromStorage: boolean;
  method: 'immediate' | 'queued' | 'beacon' | 'partial';
  error?: string;
}

/**
 * 3-Layer Crash Report Deletion System
 */
export class CrashDeletionService {
  private static isDeleting = false;
  private static deletionQueue: DeleteCrashReportOptions[] = [];
  
  /**
   * MAIN ENTRY POINT
   * Delete crash report with 3-layer fallback
   */
  static async delete(options: DeleteCrashReportOptions): Promise<DeleteResult> {
    const { id, screenshotUrl } = options;
    
    console.log(`[CrashDeletion] Starting deletion for crash report: ${id}`);
    console.log(`[CrashDeletion] Screenshot URL:`, screenshotUrl ? 'Present' : 'None');

    try {
      // LAYER 1: Immediate deletion via API
      console.log("[CrashDeletion] Layer 1: Attempting immediate deletion...");
      const result = await this.deleteImmediate(id);
      
      console.log("[CrashDeletion] ✅ Layer 1 successful - All data deleted");
      return {
        success: true,
        deletedFromFirestore: true,
        deletedFromStorage: result.deletedScreenshot || false,
        method: 'immediate',
      };

    } catch (primaryError: any) {
      console.error("[CrashDeletion] ❌ Layer 1 failed:", primaryError.message);

      try {
        // LAYER 2: Queue for retry
        console.log("[CrashDeletion] Layer 2: Queueing for retry...");
        await this.queueDeletion(options);
        
        console.log("[CrashDeletion] ✅ Layer 2: Queued for background deletion");
        return {
          success: true,
          deletedFromFirestore: false,
          deletedFromStorage: false,
          method: 'queued',
        };

      } catch (queueError: any) {
        console.error("[CrashDeletion] ❌ Layer 2 failed:", queueError.message);

        try {
          // LAYER 3: Beacon API (last resort)
          console.log("[CrashDeletion] Layer 3: Using beacon...");
          await this.deleteViaBeacon(id);
          
          console.log("[CrashDeletion] ✅ Layer 3: Deletion request sent via beacon");
          return {
            success: true,
            deletedFromFirestore: false, // Unknown
            deletedFromStorage: false, // Unknown
            method: 'beacon',
          };

        } catch (beaconError: any) {
          console.error("[CrashDeletion] ❌ All 3 layers failed");
          console.error("[CrashDeletion] Layer 1:", primaryError.message);
          console.error("[CrashDeletion] Layer 2:", queueError.message);
          console.error("[CrashDeletion] Layer 3:", beaconError.message);

          // Mark for manual cleanup
          this.markForManualCleanup(id, screenshotUrl);

          return {
            success: false,
            deletedFromFirestore: false,
            deletedFromStorage: false,
            method: 'partial',
            error: 'All deletion methods failed - marked for manual cleanup',
          };
        }
      }
    }
  }

  /**
   * LAYER 1: Immediate deletion via API
   */
  private static async deleteImmediate(id: string): Promise<any> {
    // Get auth token
    const auth = (await import('firebase/auth')).getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('Not authenticated');
    }

    const token = await user.getIdToken();

    const response = await fetch(`/api/crash-reports?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`API deletion failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'API reported deletion failure');
    }

    return result;
  }

  /**
   * LAYER 2: Queue deletion for retry
   */
  private static async queueDeletion(options: DeleteCrashReportOptions): Promise<void> {
    try {
      // Store in localStorage for persistence
      const queueKey = 'crash_deletion_queue';
      const existingQueue = JSON.parse(localStorage.getItem(queueKey) || '[]');
      
      existingQueue.push({
        ...options,
        queuedAt: new Date().toISOString(),
        retryCount: options.retryCount || 0,
      });
      
      localStorage.setItem(queueKey, JSON.stringify(existingQueue));
      
      // Start background processor
      this.startRetryProcessor();
    } catch (error: any) {
      throw new Error(`Failed to queue deletion: ${error.message}`);
    }
  }

  /**
   * LAYER 3: Beacon API (works even after page closes)
   */
  private static async deleteViaBeacon(id: string): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.sendBeacon) {
      throw new Error('Beacon API not supported');
    }

    const auth = (await import('firebase/auth')).getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('Not authenticated');
    }

    const token = await user.getIdToken();

    const data = {
      action: 'delete',
      id,
      token,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const success = navigator.sendBeacon('/api/crash-reports/beacon-delete', blob);

    if (!success) {
      throw new Error('Beacon send failed');
    }
  }

  /**
   * Background retry processor
   */
  private static async startRetryProcessor(): Promise<void> {
    if (this.isDeleting) return;
    
    this.isDeleting = true;

    try {
      const queueKey = 'crash_deletion_queue';
      const queue: DeleteCrashReportOptions[] = JSON.parse(
        localStorage.getItem(queueKey) || '[]'
      );

      console.log(`[CrashDeletion] Processing ${queue.length} queued deletions`);

      for (const item of queue) {
        try {
          const retryCount = item.retryCount || 0;
          
          if (retryCount >= 5) {
            console.log(`[CrashDeletion] Max retries exceeded for ${item.id}`);
            this.markForManualCleanup(item.id, item.screenshotUrl);
            continue;
          }

          // Exponential backoff
          const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 32000);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));

          // Retry deletion
          await this.deleteImmediate(item.id);
          console.log(`[CrashDeletion] ✅ Retry successful for ${item.id}`);

          // Remove from queue
          const updatedQueue = queue.filter(q => q.id !== item.id);
          localStorage.setItem(queueKey, JSON.stringify(updatedQueue));

        } catch (error: any) {
          console.error(`[CrashDeletion] Retry failed for ${item.id}:`, error.message);
          
          // Increment retry count
          item.retryCount = (item.retryCount || 0) + 1;
          const updatedQueue = queue.map(q => q.id === item.id ? item : q);
          localStorage.setItem(queueKey, JSON.stringify(updatedQueue));
        }
      }
    } catch (error) {
      console.error('[CrashDeletion] Retry processor error:', error);
    } finally {
      this.isDeleting = false;
    }
  }

  /**
   * Mark crash for manual cleanup
   */
  private static markForManualCleanup(id: string, screenshotUrl?: string | null): void {
    try {
      const cleanupKey = 'crash_manual_cleanup';
      const existing = JSON.parse(localStorage.getItem(cleanupKey) || '[]');
      
      existing.push({
        id,
        screenshotUrl,
        markedAt: new Date().toISOString(),
        reason: 'All automatic deletion methods failed',
      });
      
      localStorage.setItem(cleanupKey, JSON.stringify(existing));
      console.log(`[CrashDeletion] 🆘 Marked ${id} for manual cleanup`);
    } catch (error) {
      console.error('[CrashDeletion] Failed to mark for manual cleanup:', error);
    }
  }

  /**
   * Get items pending manual cleanup
   */
  static getPendingCleanup(): any[] {
    try {
      return JSON.parse(localStorage.getItem('crash_manual_cleanup') || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Get queued deletions
   */
  static getQueueSize(): number {
    try {
      const queue = JSON.parse(localStorage.getItem('crash_deletion_queue') || '[]');
      return queue.length;
    } catch {
      return 0;
    }
  }

  /**
   * Clear all queues (use with caution)
   */
  static clearQueues(): void {
    localStorage.removeItem('crash_deletion_queue');
    localStorage.removeItem('crash_manual_cleanup');
    console.log('[CrashDeletion] All queues cleared');
  }
}

/**
 * Helper function for easy deletion
 */
export async function deleteCrashReport(
  id: string, 
  screenshotUrl?: string | null
): Promise<DeleteResult> {
  return CrashDeletionService.delete({ id, screenshotUrl });
}

/**
 * Check for pending deletions on app start
 */
export function initializeDeletionProcessor(): void {
  if (typeof window === 'undefined') return;
  
  const queueSize = CrashDeletionService.getQueueSize();
  const pendingCleanup = CrashDeletionService.getPendingCleanup();
  
  if (queueSize > 0) {
    console.log(`[CrashDeletion] Found ${queueSize} pending deletions, starting processor...`);
    CrashDeletionService['startRetryProcessor']();
  }
  
  if (pendingCleanup.length > 0) {
    console.warn(`[CrashDeletion] ⚠️  ${pendingCleanup.length} items need manual cleanup`);
  }
}
