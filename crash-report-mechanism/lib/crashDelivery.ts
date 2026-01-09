/**
 * Crash Delivery System
 * 3-layer fault-tolerant delivery pipeline:
 * 1. Primary: Immediate API call
 * 2. Secondary: IndexedDB queue + retry with backoff
 * 3. Tertiary: Beacon API (last resort)
 */

import { CreateCrashReportDTO } from "../types/crashReport";
import { getCrashStorageQueue } from "./crashStorage";

/**
 * Delay utility for backoff
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 3-Layer Crash Delivery System
 */
export class CrashDelivery {
  private static isProcessing = false;
  private static processingPromise: Promise<void> | null = null;

  /**
   * MAIN ENTRY POINT
   * Send crash report with 3-layer fallback
   */
  static async send(report: CreateCrashReportDTO): Promise<void> {
    try {
      // LAYER 1: Immediate transmission
      console.log("[CrashDelivery] Attempting immediate delivery...");
      console.log("[CrashDelivery] Report details:", {
        errorName: report.errorName,
        severity: report.severity,
        hasScreenshot: !!report.screenshot,
        screenshotSize: report.screenshot?.url ? `${Math.round(report.screenshot.url.length / 1024)}KB` : 'N/A'
      });
      
      await this.sendImmediate(report);
      console.log("[CrashDelivery] ✅ Sent immediately - DATA SAVED TO FIRESTORE");

    } catch (primaryError: any) {
      console.error("[CrashDelivery] ❌ Primary delivery failed:", primaryError.message);
      console.error("[CrashDelivery] Full error:", primaryError);

      try {
        // LAYER 2: Queue in IndexedDB + retry
        console.log("[CrashDelivery] Attempting Layer 2: IndexedDB queue...");
        const queue = getCrashStorageQueue();
        await queue.enqueue(report);
        console.log("[CrashDelivery] ✅ Queued in IndexedDB for retry - DATA PRESERVED");

        // Start retry processor in background
        this.startRetryProcessor();

      } catch (queueError: any) {
        console.error("[CrashDelivery] ❌ Queue failed:", queueError.message);

        try {
          // LAYER 3: Last resort - Beacon API
          console.log("[CrashDelivery] Attempting Layer 3: Beacon API...");
          await this.sendBeacon(report);
          console.log("[CrashDelivery] ✅ Sent via beacon - DATA SAVED");

        } catch (beaconError: any) {
          console.error("[CrashDelivery] ❌ ALL LAYERS FAILED - DATA LOSS OCCURRED");
          console.error("[CrashDelivery] Layer 1 (Immediate):", primaryError.message);
          console.error("[CrashDelivery] Layer 2 (Queue):", queueError.message);
          console.error("[CrashDelivery] Layer 3 (Beacon):", beaconError.message);
          
          // Last ditch: Store in localStorage as emergency backup
          try {
            const emergencyKey = `crash_emergency_${Date.now()}`;
            localStorage.setItem(emergencyKey, JSON.stringify({
              report: {
                ...report,
                screenshot: report.screenshot ? 'TRUNCATED' : null // Remove large data
              },
              timestamp: new Date().toISOString(),
              failedLayers: ['immediate', 'queue', 'beacon']
            }));
            console.log("[CrashDelivery] 🆘 Emergency backup saved to localStorage:", emergencyKey);
          } catch (localStorageError) {
            console.error("[CrashDelivery] ❌ Emergency backup also failed - TOTAL DATA LOSS");
          }
        }
      }
    }
  }

  /**
   * LAYER 1: Immediate API call
   */
  private static async sendImmediate(report: CreateCrashReportDTO): Promise<void> {
    console.log("[CrashDelivery] Sending POST to /api/crash-reports...");
    
    const response = await fetch("/api/crash-reports", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(report),
      // Timeout after 10 seconds
      signal: AbortSignal.timeout(10000),
    });

    console.log("[CrashDelivery] Response status:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error("[CrashDelivery] API error response:", errorText);
      throw new Error(`API rejected: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("[CrashDelivery] API response:", result);
    
    if (!result.success) {
      throw new Error(result.error || "API reported failure");
    }
    
    console.log("[CrashDelivery] ✅ Crash report saved:", result.crashReportId || result.message);
    
    // Notify admin panel immediately for instant update
    this.notifyAdminPanel();
  }

  /**
   * Notify admin panel immediately when crash is sent
   * Uses BroadcastChannel for cross-tab communication
   */
  private static notifyAdminPanel(): void {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('crash-reports');
        channel.postMessage({ type: 'NEW_CRASH', timestamp: Date.now() });
        channel.close();
        console.log("[CrashDelivery] 📡 Notified admin panel of new crash");
      }
    } catch (error) {
      // BroadcastChannel not supported, admin will poll normally
      console.log("[CrashDelivery] BroadcastChannel not available, using polling");
    }
  }

  /**
   * LAYER 2: Retry processor with exponential backoff
   * Processes queued reports in background
   */
  static async startRetryProcessor(): Promise<void> {
    // Prevent multiple processors running simultaneously
    if (this.isProcessing) {
      return this.processingPromise || Promise.resolve();
    }

    this.isProcessing = true;

    this.processingPromise = (async () => {
      try {
        console.log("[CrashDelivery] Starting retry processor...");
        const queue = getCrashStorageQueue();
        const queuedReports = await queue.dequeue();

        console.log(`[CrashDelivery] Processing ${queuedReports.length} queued reports`);

        for (const item of queuedReports) {
          try {
            // Check if max retries exceeded
            if (item.retryCount >= item.maxRetries) {
              console.log(`[CrashDelivery] Max retries exceeded for ${item.id}, removing`);
              await queue.remove(item.id);
              continue;
            }

            // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s
            const backoffDelay = Math.min(
              1000 * Math.pow(2, item.retryCount),
              32000
            );

            console.log(
              `[CrashDelivery] Retrying ${item.id} (attempt ${item.retryCount + 1}/${item.maxRetries})`
            );

            // Wait for backoff delay
            await delay(backoffDelay);

            // Attempt to send
            await this.sendImmediate(item.report);

            // Success! Remove from queue
            await queue.remove(item.id);
            console.log(`[CrashDelivery] ✅ Retry successful for ${item.id}`);

          } catch (error) {
            console.warn(`[CrashDelivery] Retry failed for ${item.id}:`, error);

            // Increment retry count
            await queue.incrementRetryCount(item.id);
          }
        }

        console.log("[CrashDelivery] Retry processor completed");

      } catch (error) {
        console.error("[CrashDelivery] Retry processor error:", error);
      } finally {
        this.isProcessing = false;
        this.processingPromise = null;
      }
    })();

    return this.processingPromise;
  }

  /**
   * LAYER 3: Beacon API (guaranteed delivery even if page closes)
   */
  private static async sendBeacon(report: CreateCrashReportDTO): Promise<void> {
    if (typeof navigator === "undefined" || !navigator.sendBeacon) {
      throw new Error("Beacon API not supported");
    }

    // Beacon only accepts FormData or Blob
    const blob = new Blob([JSON.stringify(report)], {
      type: "application/json",
    });

    const success = navigator.sendBeacon("/api/crash-reports/beacon", blob);

    if (!success) {
      throw new Error("Beacon send failed");
    }
  }

  /**
   * Manual trigger for retry processor
   * Can be called when app comes back online
   */
  static async processQueue(): Promise<void> {
    return this.startRetryProcessor();
  }

  /**
   * Get queue size (for debugging)
   */
  static async getQueueSize(): Promise<number> {
    const queue = getCrashStorageQueue();
    return queue.size();
  }

  /**
   * Clear queue (use with caution)
   */
  static async clearQueue(): Promise<void> {
    const queue = getCrashStorageQueue();
    await queue.clear();
  }
}

// ============================================================================
// AUTO-START RETRY PROCESSOR ON PAGE LOAD
// ============================================================================

if (typeof window !== "undefined") {
  // Process queued reports when page loads
  window.addEventListener("load", () => {
    console.log("[CrashDelivery] Page loaded, processing queue...");
    CrashDelivery.startRetryProcessor();
  });

  // Process queued reports when network comes back online
  window.addEventListener("online", () => {
    console.log("[CrashDelivery] Network online, processing queue...");
    CrashDelivery.startRetryProcessor();
  });

  // Try to send queued reports before page unloads
  window.addEventListener("beforeunload", () => {
    // Trigger immediate processing (beacon will be used if needed)
    CrashDelivery.processQueue();
  });
}
