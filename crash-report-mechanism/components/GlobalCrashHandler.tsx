"use client";

/**
 * Global Crash Handler
 * Top-level React Error Boundary that catches all crashes
 * + Browser-level error listeners for non-React errors
 */

import React, { Component, ReactNode, useEffect } from "react";
import { CrashReporter } from "../lib/crashReporter";
import { shouldReportError } from "../lib/crashClassifier";
import CrashFailsafeUI from "./CrashFailsafeUI";

// ============================================================================
// REACT ERROR BOUNDARY
// ============================================================================

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

/**
 * Global Error Boundary Component
 * Catches all React rendering and lifecycle errors
 */
export class GlobalCrashHandler extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Update state when error occurs
   */
  static getDerivedStateFromError(error: Error): Partial<State> {
    console.error("[GlobalCrashHandler] Caught error in getDerivedStateFromError:", error);
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Log error details and report crash
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[GlobalCrashHandler] ═══════════════════════════════════");
    console.error("[GlobalCrashHandler] 🔴 CRASH DETECTED - STARTING REPORT");
    console.error("[GlobalCrashHandler] Error:", error);
    console.error("[GlobalCrashHandler] Error Info:", errorInfo);
    console.error("[GlobalCrashHandler] ═══════════════════════════════════");

    // Store error info in state
    this.setState({ errorInfo });

    // Report crash automatically - DO NOT SWALLOW ERRORS
    console.log("[GlobalCrashHandler] Calling CrashReporter.reportCrash()...");
    CrashReporter.reportCrash(error, errorInfo)
      .then(() => {
        console.log("[GlobalCrashHandler] ✅ Crash report completed successfully");
      })
      .catch((reportError) => {
        console.error("[GlobalCrashHandler] ❌ CRITICAL: Failed to report crash:", reportError);
        console.error("[GlobalCrashHandler] Original error:", error.message);
        console.error("[GlobalCrashHandler] Reporting error:", reportError.message);
      });
  }

  /**
   * Render failsafe UI or children
   */
  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <CrashFailsafeUI
          error={this.state.error}
          errorInfo={this.state.errorInfo}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// BROWSER-LEVEL ERROR LISTENERS
// ============================================================================

/**
 * Browser Crash Listeners Component
 * Captures errors outside React's boundaries:
 * - Global JavaScript errors
 * - Unhandled promise rejections
 * - Resource loading failures
 */
export function BrowserCrashListeners() {
  useEffect(() => {
    console.log("[BrowserCrashListeners] Initializing global error listeners...");

    // ========================================================================
    // Handler: Unhandled Errors
    // ========================================================================
    const handleError = (event: ErrorEvent) => {
      // Extract error object
      const error = event.error || new Error(event.message || "Unknown error");

      // Add context to error
      if (!error.stack && event.filename) {
        error.stack = `at ${event.filename}:${event.lineno}:${event.colno}`;
      }

      // Filter out errors that shouldn't be reported (e.g., script errors, resize observer)
      if (!shouldReportError(error)) {
        return; // Silently ignore
      }

      // Only log in development for legitimate errors
      if (process.env.NODE_ENV === 'development') {
        console.error("[BrowserCrashListeners] 🔴 Uncaught Error:", error.message);
      }

      // Report the crash
      CrashReporter.reportCrash(error).catch((reportError) => {
        console.error("[BrowserCrashListeners] Failed to report error:", reportError);
      });

      // Prevent default error handling (we're handling it)
      // event.preventDefault(); // Commented out to allow console errors to show
    };

    // ========================================================================
    // Handler: Unhandled Promise Rejections
    // ========================================================================
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Extract error from rejection
      let error: Error;

      if (event.reason instanceof Error) {
        error = event.reason;
      } else if (typeof event.reason === "string") {
        error = new Error(event.reason);
      } else {
        error = new Error("Unhandled Promise Rejection: " + String(event.reason));
      }

      // Mark as promise rejection
      error.name = "UnhandledPromiseRejection";

      // Filter out errors that shouldn't be reported
      if (!shouldReportError(error)) {
        return; // Silently ignore
      }

      // Only log in development for legitimate errors
      if (process.env.NODE_ENV === 'development') {
        console.error("[BrowserCrashListeners] 🔴 Unhandled Promise Rejection:", error.message);
      }

      // Report the crash
      CrashReporter.reportCrash(error).catch((reportError) => {
        console.error("[BrowserCrashListeners] Failed to report rejection:", reportError);
      });

      // Prevent default handling
      // event.preventDefault(); // Commented out to allow console warnings
    };

    // ========================================================================
    // Handler: Handled Rejections (for completeness)
    // ========================================================================
    const handleRejectionHandled = (event: PromiseRejectionEvent) => {
      console.log("[BrowserCrashListeners] Promise rejection was handled:", event);
      // Don't report these - they were handled
    };

    // ========================================================================
    // Register Event Listeners
    // ========================================================================

    window.addEventListener("error", handleError, true); // Capture phase
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("rejectionhandled", handleRejectionHandled);

    console.log("[BrowserCrashListeners] ✅ Global error listeners registered");

    // ========================================================================
    // Cleanup
    // ========================================================================
    return () => {
      window.removeEventListener("error", handleError, true);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("rejectionhandled", handleRejectionHandled);
      console.log("[BrowserCrashListeners] Global error listeners removed");
    };
  }, []);

  // This component renders nothing (it just sets up listeners)
  return null;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default GlobalCrashHandler;
