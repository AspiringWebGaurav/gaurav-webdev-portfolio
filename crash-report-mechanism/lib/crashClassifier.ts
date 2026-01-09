/**
 * Crash Classification Engine
 * Automatically determines severity and category of crashes
 */

import { CrashClassification, CrashSeverity, CrashCategory, generateCrashTitle } from "../types/crashReport";

/**
 * Classify crash based on error details
 * Uses pattern matching to determine severity and category
 */
export function classifyCrash(
  error: Error,
  componentStack?: string
): CrashClassification {
  const message = error.message.toLowerCase();
  const stack = error.stack?.toLowerCase() || "";
  const errorName = error.name.toLowerCase();

  // Generate human-readable title
  const title = generateCrashTitle(error, componentStack);

  // ========================================================================
  // CRITICAL ERRORS - App-breaking
  // ========================================================================

  // Null/undefined reference errors
  if (
    message.includes("cannot read properties of undefined") ||
    message.includes("cannot read property") ||
    message.includes("null is not an object") ||
    message.includes("undefined is not an object") ||
    message.includes("is not a function")
  ) {
    return {
      severity: "critical",
      category: "runtime",
      title,
    };
  }

  // Firebase/Auth failures
  if (
    stack.includes("firebase") ||
    stack.includes("auth") ||
    message.includes("firebase") ||
    message.includes("authentication")
  ) {
    return {
      severity: "critical",
      category: "framework",
      title,
    };
  }

  // React rendering errors
  if (
    errorName.includes("invariant") ||
    message.includes("minified react error") ||
    componentStack
  ) {
    return {
      severity: "critical",
      category: "render",
      title,
    };
  }

  // ========================================================================
  // HIGH PRIORITY ERRORS - Significant functionality impact
  // ========================================================================

  // Network/chunk loading failures
  if (
    error.name === "ChunkLoadError" ||
    message.includes("failed to fetch") ||
    message.includes("network error") ||
    message.includes("failed to load chunk") ||
    message.includes("loading chunk")
  ) {
    return {
      severity: "high",
      category: "network",
      title,
    };
  }

  // Promise rejections
  if (
    errorName.includes("unhandledrejection") ||
    message.includes("promise") ||
    stack.includes("promise")
  ) {
    return {
      severity: "high",
      category: "promise",
      title,
    };
  }

  // Syntax or reference errors
  if (
    errorName === "syntaxerror" ||
    errorName === "referenceerror"
  ) {
    return {
      severity: "high",
      category: "runtime",
      title,
    };
  }

  // ========================================================================
  // MEDIUM PRIORITY ERRORS - User experience impact
  // ========================================================================

  // Type errors
  if (errorName === "typeerror") {
    return {
      severity: "medium",
      category: "runtime",
      title,
    };
  }

  // Range errors
  if (errorName === "rangeerror") {
    return {
      severity: "medium",
      category: "runtime",
      title,
    };
  }

  // ========================================================================
  // UNKNOWN ERRORS - Treat as high priority to be safe
  // ========================================================================

  return {
    severity: "high", // Be cautious with unknowns
    category: "unknown",
    title,
  };
}

/**
 * Determine priority based on severity and other factors
 */
export function determinePriority(
  severity: CrashSeverity,
  occurenceCount: number = 1
): "urgent" | "high" | "normal" | "low" {
  // Critical severity = always urgent
  if (severity === "critical") return "urgent";

  // High severity with multiple occurrences = urgent
  if (severity === "high" && occurenceCount > 3) return "urgent";

  // High severity = high priority
  if (severity === "high") return "high";

  // Medium severity with many occurrences = high
  if (severity === "medium" && occurenceCount > 10) return "high";

  // Medium severity = normal priority
  if (severity === "medium") return "normal";

  // Low severity = low priority
  return "low";
}

/**
 * Check if error should be reported (filter out noise)
 */
export function shouldReportError(error: Error): boolean {
  const message = error.message.toLowerCase();

  // Filter out known false positives
  const ignoredPatterns = [
    "resizeobserver loop",
    "non-error promise rejection",
    "script error", // Cross-origin errors we can't debug
    "request queued for retry", // Network manager queuing offline requests
  ];

  for (const pattern of ignoredPatterns) {
    if (message.includes(pattern)) {
      console.log(`[CrashClassifier] Ignoring known false positive: ${pattern}`);
      return false;
    }
  }

  return true;
}

/**
 * Extract component name from React component stack
 */
export function extractComponentName(componentStack?: string): string | null {
  if (!componentStack) return null;

  // React component stack format: "at ComponentName (path)"
  const match = componentStack.match(/at (\w+)/);
  return match ? match[1] : null;
}

/**
 * Get stack trace signature (for deduplication)
 * Removes line numbers and column numbers to group similar errors
 */
export function getStackSignature(stack?: string): string {
  if (!stack) return "no-stack";

  // Extract first 3 lines of stack trace
  const lines = stack.split("\n").slice(0, 3);

  // Remove line:column numbers (e.g., :123:45)
  const normalized = lines
    .map((line) => line.replace(/:\d+:\d+/g, ""))
    .join("|");

  return normalized;
}
