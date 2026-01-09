/**
 * Crash Report Type Definitions
 * Comprehensive types for production-grade crash reporting and incident management
 */

import { Timestamp } from "firebase/firestore";

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export type CrashSeverity = "critical" | "high" | "medium" | "low";
export type CrashCategory = "render" | "runtime" | "promise" | "network" | "framework" | "unknown";
export type CrashStatus = "new" | "unread" | "acknowledged" | "in-progress" | "resolved" | "ignored" | "critical";
export type CrashPriority = "urgent" | "high" | "normal" | "low";

// ============================================================================
// SCREENSHOT DATA
// ============================================================================

export interface ScreenshotData {
  url: string; // Firebase Storage URL or base64
  capturedAt: Date;
  viewport: {
    width: number;
    height: number;
  };
  pageUrl: string;
}

// ============================================================================
// ADMIN NOTE
// ============================================================================

export interface AdminNote {
  id: string;
  content: string;
  createdBy: string; // admin email
  createdAt: Date;
}

// ============================================================================
// MAIN CRASH REPORT INTERFACE
// ============================================================================

export interface CrashReport {
  id: string;

  // Auto-generated classification
  title: string; // e.g., "TypeError in ChatBubble component"
  severity: CrashSeverity;
  category: CrashCategory;

  // Error details (verbatim for debugging)
  errorMessage: string; // Exact error message
  errorStack: string; // Full stack trace
  errorName: string; // TypeError, ReferenceError, etc.
  componentStack?: string; // React component tree (if available)

  // Visual context - THE SCREENSHOT
  screenshot: ScreenshotData | null;

  // Environment context
  url: string; // Page where crash happened
  userAgent: string;
  browserInfo: string;
  timestamp: Date;
  sessionId: string;
  visitorId?: string;

  // Runtime metadata
  reactVersion?: string;
  nextVersion?: string;
  environment: "production" | "development";

  // Admin workflow (status lifecycle)
  status: CrashStatus;
  priority: CrashPriority;

  // Admin management
  assignedTo?: string; // admin email
  adminNotes: AdminNote[];
  resolvedAt?: Date;
  resolvedBy?: string; // admin email
  duplicateOf?: string; // Link to parent crash report ID

  // Deduplication tracking
  errorHash: string; // Hash of error signature for dedup
  occurenceCount: number; // How many times this exact crash happened
  firstSeen: Date;
  lastSeen: Date;
  affectedUsers: string[]; // List of visitor IDs who experienced this

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// DTO - CREATE CRASH REPORT
// ============================================================================

export interface CreateCrashReportDTO {
  // Error details
  errorMessage: string;
  errorStack: string;
  errorName: string;
  errorHash: string;
  componentStack?: string;

  // Classification
  severity: CrashSeverity;
  category: CrashCategory;

  // Screenshot
  screenshot?: ScreenshotData | null;

  // Context
  url: string;
  userAgent: string;
  browserInfo: string;
  sessionId: string;
  visitorId?: string;
  timestamp: Date;

  // Runtime
  reactVersion?: string;
  nextVersion?: string;
}

// ============================================================================
// DTO - UPDATE CRASH REPORT
// ============================================================================

export interface UpdateCrashReportDTO {
  id: string;
  status?: CrashStatus;
  priority?: CrashPriority;
  severity?: CrashSeverity;
  category?: CrashCategory;
  assignedTo?: string;
  resolvedBy?: string;
  duplicateOf?: string;
}

// ============================================================================
// DTO - ADD ADMIN NOTE
// ============================================================================

export interface AddAdminNoteDTO {
  crashReportId: string;
  content: string;
  createdBy: string;
}

// ============================================================================
// CRASH CLASSIFICATION
// ============================================================================

export interface CrashClassification {
  severity: CrashSeverity;
  category: CrashCategory;
  title?: string;
}

// ============================================================================
// QUEUED REPORT (for IndexedDB)
// ============================================================================

export interface QueuedReport {
  id: string;
  report: CreateCrashReportDTO;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

// ============================================================================
// OPERATION RESULT
// ============================================================================

export interface CrashReportOperationResult {
  success: boolean;
  error?: string;
  crashReportId?: string;
  deduped?: boolean;
}

// ============================================================================
// BROWSER INFO
// ============================================================================

export interface BrowserInfo {
  browser: string;
  version: string;
  os: string;
  device: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a human-readable crash title from error
 */
export function generateCrashTitle(error: Error, componentStack?: string): string {
  const errorType = error.name || "Error";
  
  // Try to extract component name from React stack
  if (componentStack) {
    const componentMatch = componentStack.match(/at (\w+)/);
    if (componentMatch) {
      return `${errorType} in ${componentMatch[1]} component`;
    }
  }

  // Try to extract from regular stack
  if (error.stack) {
    const stackMatch = error.stack.match(/at (\w+)/);
    if (stackMatch) {
      return `${errorType} in ${stackMatch[1]}`;
    }
  }

  // Fallback to error message
  const shortMessage = error.message.slice(0, 50);
  return `${errorType}: ${shortMessage}`;
}

/**
 * Parse browser information from user agent
 */
export function getBrowserInfo(userAgent: string = navigator.userAgent): string {
  const ua = userAgent;
  
  let browser = "Unknown";
  let version = "Unknown";
  
  if (ua.indexOf("Firefox") > -1) {
    browser = "Firefox";
    version = ua.match(/Firefox\/(\d+)/)?.[1] || "";
  } else if (ua.indexOf("Edg") > -1) {
    browser = "Edge";
    version = ua.match(/Edg\/(\d+)/)?.[1] || "";
  } else if (ua.indexOf("Chrome") > -1) {
    browser = "Chrome";
    version = ua.match(/Chrome\/(\d+)/)?.[1] || "";
  } else if (ua.indexOf("Safari") > -1) {
    browser = "Safari";
    version = ua.match(/Version\/(\d+)/)?.[1] || "";
  }

  return `${browser} ${version}`;
}

/**
 * Get session ID from storage or generate new one
 */
export function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  
  try {
    let sessionId = sessionStorage.getItem("crash_session_id");
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem("crash_session_id", sessionId);
    }
    return sessionId;
  } catch {
    return `session_${Date.now()}`;
  }
}

/**
 * Get visitor ID (reuse existing visitor tracking)
 * NEVER return undefined - Firestore rejects undefined values
 */
export function getVisitorId(): string {
  if (typeof window === "undefined") return "server-side";
  
  try {
    // Try to get from your existing visitor tracking
    let visitorId = localStorage.getItem("visitor_uuid") || 
                     localStorage.getItem("visitorId");
    
    // If no visitor ID exists, create one
    if (!visitorId) {
      visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("crash_visitor_id", visitorId);
    }
    
    return visitorId;
  } catch {
    // Fallback if localStorage fails
    return `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Severity descriptions for UI
 */
export const SEVERITY_DESCRIPTIONS: Record<CrashSeverity, string> = {
  critical: "App-breaking error that prevents normal operation",
  high: "Significant error affecting core functionality",
  medium: "Error that impacts user experience but has workarounds",
  low: "Minor error with minimal user impact",
};

/**
 * Category descriptions for UI
 */
export const CATEGORY_DESCRIPTIONS: Record<CrashCategory, string> = {
  render: "Error during React component rendering",
  runtime: "Runtime error during code execution",
  promise: "Unhandled promise rejection",
  network: "Network or API request failure",
  framework: "Next.js or framework-level error",
  unknown: "Unknown error type",
};

/**
 * Status badge colors for UI - Enterprise white background style
 */
export function getStatusColor(status: CrashStatus): string {
  const colors: Record<CrashStatus, string> = {
    new: "bg-purple-50 text-purple-700 border-purple-200",
    unread: "bg-blue-50 text-blue-700 border-blue-200",
    acknowledged: "bg-yellow-50 text-yellow-700 border-yellow-200",
    "in-progress": "bg-orange-50 text-orange-700 border-orange-200",
    resolved: "bg-green-50 text-green-700 border-green-200",
    ignored: "bg-gray-100 text-gray-600 border-gray-300",
    critical: "bg-red-50 text-red-700 border-red-200",
  };
  return colors[status] || colors.unread;
}

/**
 * Severity badge colors for UI - Enterprise white background style
 */
export function getSeverityColor(severity: CrashSeverity): string {
  const colors: Record<CrashSeverity, string> = {
    critical: "bg-red-50 text-red-700 border-red-300",
    high: "bg-orange-50 text-orange-700 border-orange-200",
    medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
    low: "bg-blue-50 text-blue-700 border-blue-200",
  };
  return colors[severity];
}
