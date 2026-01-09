/**
 * useCrashReporting Hook
 * Convenience hook for manual crash reporting
 */

import { useCallback } from "react";
import { CrashReporter } from "../lib/crashReporter";

export function useCrashReporting() {
  /**
   * Manually report an error
   */
  const reportError = useCallback(async (error: Error, context?: any) => {
    try {
      await CrashReporter.reportCrash(error, context);
      console.log("[useCrashReporting] Error reported successfully");
      return { success: true };
    } catch (err) {
      console.error("[useCrashReporting] Failed to report error:", err);
      return { success: false, error: err };
    }
  }, []);

  /**
   * Report custom error with message
   */
  const reportMessage = useCallback(
    async (message: string, details?: Record<string, any>) => {
      try {
        await CrashReporter.reportManual(message, details);
        console.log("[useCrashReporting] Message reported successfully");
        return { success: true };
      } catch (err) {
        console.error("[useCrashReporting] Failed to report message:", err);
        return { success: false, error: err };
      }
    },
    []
  );

  /**
   * Get crash reporter stats
   */
  const getStats = useCallback(() => {
    return CrashReporter.getStats();
  }, []);

  return {
    reportError,
    reportMessage,
    getStats,
  };
}
