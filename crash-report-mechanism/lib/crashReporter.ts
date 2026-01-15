/**
 * Main Crash Reporter
 * Orchestrates crash capture, classification, and delivery
 * This is the entry point for all crash reporting
 */

import { CreateCrashReportDTO } from "../types/crashReport";
import { captureScreenshotWithTimeout } from "./crashScreenshot";
import { classifyCrash, shouldReportError, determinePriority } from "./crashClassifier";
import { generateErrorHash } from "./crashDeduplicator";
import { CrashDelivery } from "./crashDelivery";
import { getBrowserInfo, getSessionId, getVisitorId } from "../types/crashReport";

/**
 * Main Crash Reporter Class
 * Handles all crash reporting logic
 */
export class CrashReporter {
  private static isReporting = false;
  private static reportCount = 0;
  private static readonly MAX_REPORTS_PER_SESSION = 50; // Circuit breaker
  private static lastReportTime = 0;
  private static readonly MIN_REPORT_INTERVAL = 1000; // 1 second between reports

  /**
   * Report a crash with full context capture
   * Main entry point for crash reporting
   */
  static async reportCrash(error: Error, errorInfo?: any): Promise<void> {
    try {
      // ======================================================================
      // DEFENSIVE CHECKS - Prevent crash reporter from crashing
      // ======================================================================

      // Check if already reporting (prevent recursion)
      if (this.isReporting) {
        console.warn("[CrashReporter] Already reporting, skipping to prevent recursion");
        return;
      }

      // Circuit breaker - stop after too many reports
      if (this.reportCount >= this.MAX_REPORTS_PER_SESSION) {
        console.warn("[CrashReporter] Circuit breaker: Too many reports this session");
        return;
      }

      // Rate limiting - don't spam reports
      const now = Date.now();
      if (now - this.lastReportTime < this.MIN_REPORT_INTERVAL) {
        console.warn("[CrashReporter] Rate limited, skipping");
        return;
      }

      // Filter out errors that shouldn't be reported
      if (!shouldReportError(error)) {
        console.log("[CrashReporter] Error filtered out, not reporting");
        return;
      }

      // ======================================================================
      // START CRASH REPORTING
      // ======================================================================

      this.isReporting = true;
      this.reportCount++;
      this.lastReportTime = now;

      console.error("[CrashReporter] 🔴 Crash detected:", error);
      console.log("[CrashReporter] Starting crash report capture...");

      // Extract component stack if available (React errors)
      const componentStack = errorInfo?.componentStack;

      // Step 1: Classify the crash
      const classification = classifyCrash(error, componentStack);
      console.log(`[CrashReporter] Classification: ${classification.severity} / ${classification.category}`);

      // Step 2: Generate error hash for deduplication
      const errorHash = generateErrorHash(error);
      console.log(`[CrashReporter] Error hash: ${errorHash}`);

      // Step 3: Build crash report
      const report: CreateCrashReportDTO = {
        // Error details
        errorMessage: error.message || "Unknown error",
        errorStack: error.stack || "No stack trace available",
        errorName: error.name || "Error",
        errorHash,
        componentStack,

        // Classification
        severity: classification.severity,
        category: classification.category,

        // Context
        url: typeof window !== "undefined" ? window.location.href : "unknown",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
        browserInfo: typeof navigator !== "undefined" ? getBrowserInfo() : "unknown",
        sessionId: getSessionId(),
        visitorId: getVisitorId(),
        timestamp: new Date(),

        // Runtime info
        reactVersion: this.getReactVersion(),
        nextVersion: this.getNextVersion(),
      };

      console.log("[CrashReporter] Crash report built:", {
        severity: report.severity,
        category: report.category,
        hasScreenshot: !!report.screenshot,
        errorHash: report.errorHash,
      });

      // Step 5: Deliver with 3-layer system
      console.log("[CrashReporter] Sending crash report...");
      await CrashDelivery.send(report);
      console.log("[CrashReporter] ✅ Crash report sent successfully");

    } catch (reporterError) {
      // NEVER let crash reporting crash the app
      // Fall back to console logging only
      console.error("[CrashReporter] ❌ Failed to report crash:", reporterError);
      console.error("[CrashReporter] Original error:", error);

      // Try one last-ditch effort: console + beacon
      try {
        this.emergencyReport(error);
      } catch {
        // Give up silently
      }
    } finally {
      this.isReporting = false;
    }
  }

  /**
   * Emergency fallback reporting (bare minimum)
   * Used when main crash reporter fails
   */
  private static emergencyReport(error: Error): void {
    console.error("[CrashReporter] 🆘 Emergency report:", {
      message: error.message,
      stack: error.stack,
      url: window.location.href,
    });

    // Try beacon with minimal data
    if (navigator.sendBeacon) {
      const minimalReport = {
        errorMessage: error.message,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        emergency: true,
      };

      navigator.sendBeacon(
        "/api/crash-reports/beacon",
        new Blob([JSON.stringify(minimalReport)], { type: "application/json" })
      );
    }
  }

  /**
   * Get React version from global
   */
  private static getReactVersion(): string {
    try {
      // Try to get React version from window
      if (typeof window !== "undefined" && (window as any).React) {
        return (window as any).React.version || "unknown";
      }
      return "unknown";
    } catch {
      return "unknown";
    }
  }

  /**
   * Get Next.js version from build
   */
  private static getNextVersion(): string {
    try {
      // Next.js version is in __NEXT_DATA__
      if (typeof window !== "undefined" && (window as any).__NEXT_DATA__) {
        return (window as any).__NEXT_DATA__.buildId || "unknown";
      }
      return "unknown";
    } catch {
      return "unknown";
    }
  }

  /**
   * Manual crash reporting (for testing or explicit error handling)
   */
  static async reportManual(
    message: string,
    details?: Record<string, any>
  ): Promise<void> {
    const error = new Error(message);
    error.name = "ManualReport";
    
    // Add details to stack if provided
    if (details) {
      error.stack = `${error.stack}\n\nDetails:\n${JSON.stringify(details, null, 2)}`;
    }

    await this.reportCrash(error);
  }

  /**
   * Get reporter stats (for debugging)
   */
  static getStats(): {
    reportCount: number;
    isReporting: boolean;
    queueSize: Promise<number>;
  } {
    return {
      reportCount: this.reportCount,
      isReporting: this.isReporting,
      queueSize: CrashDelivery.getQueueSize(),
    };
  }

  /**
   * Reset reporter state (for testing)
   */
  static reset(): void {
    this.reportCount = 0;
    this.isReporting = false;
    this.lastReportTime = 0;
  }
}

/**
 * Convenience function for quick crash reporting
 */
export async function reportCrash(error: Error, errorInfo?: any): Promise<void> {
  return CrashReporter.reportCrash(error, errorInfo);
}

/**
 * Test crash reporting (development only)
 */
export function testCrashReporting(): void {
  if (process.env.NODE_ENV !== "development") {
    console.warn("Test crash reporting only available in development");
    return;
  }

  console.log("🧪 Testing crash reporting...");

  // Simulate different types of crashes
  const testErrors = [
    new TypeError("Cannot read properties of undefined (reading 'test')"),
    new ReferenceError("testVariable is not defined"),
    new Error("Network request failed"),
  ];

  const randomError = testErrors[Math.floor(Math.random() * testErrors.length)];
  CrashReporter.reportCrash(randomError);
}

/**
 * Initialize crash reporter debug tools (development only)
 * TURBOPACK-SAFE: Call from client component, not at module-level
 */
export function initializeCrashReporterDebugTools(): void {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    return;
  }

  (window as any).__testCrashReporting = testCrashReporting;
  console.log("💡 Crash reporting test available: window.__testCrashReporting()");
}
