/**
 * Bug Report type definitions
 * Handles user bug report submissions with attachment support
 */

export type BugSeverity = "low" | "medium" | "high" | "critical";
export type BugCategory = "ui" | "performance" | "functional" | "visual" | "other";
export type BugStatus = "new" | "in-progress" | "resolved" | "duplicate" | "wont-fix";

export interface BugAttachment {
  id: string;
  fileName: string;
  fileSize: number; // in bytes
  fileType: string; // MIME type
  url: string; // Firebase Storage URL
  uploadedAt: Date;
}

export interface AdminNote {
  id: string;
  content: string;
  createdBy: string; // admin email
  createdAt: Date;
}

export interface BugReport {
  id: string;
  
  // Reporter information (optional - can be anonymous)
  reporterName?: string;
  reporterEmail?: string;
  
  // Required fields
  title: string;
  severity: BugSeverity;
  stepsToReproduce: string;
  actualBehavior: string;
  
  // Optional fields
  category?: BugCategory;
  expectedBehavior?: string;
  url?: string; // Page where bug was found
  browserInfo?: string; // Browser/Device info
  
  // Attachments
  attachments: BugAttachment[];
  
  // Admin fields
  status: BugStatus;
  adminNotes: AdminNote[];
  assignedTo?: string; // admin email
  resolvedAt?: Date;
  resolvedBy?: string; // admin email
  duplicateOf?: string; // reference to another bug report ID
  
  // Abuse protection
  userAgent?: string;
  ipAddress?: string;
  fingerprint?: string;
  spamScore?: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBugReportDTO {
  // Reporter info (optional)
  reporterName?: string;
  reporterEmail?: string;
  
  // Required fields
  title: string;
  severity: BugSeverity;
  stepsToReproduce: string;
  actualBehavior: string;
  
  // Optional fields
  category?: BugCategory;
  expectedBehavior?: string;
  url?: string;
  browserInfo?: string;
  
  // Attachments (file objects, will be uploaded)
  attachments?: File[];
  
  // Abuse protection
  userAgent?: string;
  ipAddress?: string;
  fingerprint?: string;
  honeypot?: string;
  timeSpent?: number;
  turnstileToken?: string;
}

export interface UpdateBugReportDTO {
  id: string;
  status?: BugStatus;
  severity?: BugSeverity;
  category?: BugCategory;
  assignedTo?: string;
  duplicateOf?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
}

export interface AddAdminNoteDTO {
  bugReportId: string;
  content: string;
  createdBy: string; // admin email
}

export interface DeleteAttachmentDTO {
  bugReportId: string;
  attachmentId: string;
}

export interface BugReportOperationResult {
  success: boolean;
  error?: string;
  bugReportId?: string;
  referenceId?: string; // User-friendly reference (e.g., BH-12345)
}

// Validation constants
export const MIN_TITLE_LENGTH = 5;
export const MAX_TITLE_LENGTH = 100;
export const MIN_STEPS_LENGTH = 10;
export const MAX_STEPS_LENGTH = 2000;
export const MIN_BEHAVIOR_LENGTH = 10;
export const MAX_BEHAVIOR_LENGTH = 2000;
export const MAX_ATTACHMENTS = 5;
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

// Rate limiting
export const MAX_BUG_REPORTS_PER_IP_PER_HOUR = 3;
export const MAX_BUG_REPORTS_PER_EMAIL_PER_DAY = 5;

/**
 * Severity descriptions for user guidance
 */
export const SEVERITY_DESCRIPTIONS: Record<BugSeverity, string> = {
  low: "Minor issue, cosmetic problems, or suggestions",
  medium: "Noticeable issue that doesn't block core functionality",
  high: "Significant issue affecting important features",
  critical: "Site is broken, data loss, or security issue",
};

/**
 * Category descriptions
 */
export const CATEGORY_DESCRIPTIONS: Record<BugCategory, string> = {
  ui: "User interface layout or design issues",
  performance: "Slow loading, lag, or performance problems",
  functional: "Features not working as expected",
  visual: "Display, styling, or rendering problems",
  other: "Other issues not covered above",
};

/**
 * Generate a user-friendly reference ID from Firebase document ID
 */
export function generateReferenceId(firebaseId: string): string {
  // Take first 8 chars of Firebase ID and make uppercase
  const shortId = firebaseId.substring(0, 8).toUpperCase();
  return `BH-${shortId}`;
}

/**
 * Validate bug report submission
 */
export function validateBugReport(data: CreateBugReportDTO): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Title validation
  if (!data.title || data.title.trim().length < MIN_TITLE_LENGTH) {
    errors.push(`Title must be at least ${MIN_TITLE_LENGTH} characters`);
  }
  if (data.title && data.title.length > MAX_TITLE_LENGTH) {
    errors.push(`Title must not exceed ${MAX_TITLE_LENGTH} characters`);
  }

  // Severity validation
  if (!data.severity || !["low", "medium", "high", "critical"].includes(data.severity)) {
    errors.push("Please select a severity level");
  }

  // Steps to reproduce validation
  if (!data.stepsToReproduce || data.stepsToReproduce.trim().length < MIN_STEPS_LENGTH) {
    errors.push(`Steps to reproduce must be at least ${MIN_STEPS_LENGTH} characters`);
  }
  if (data.stepsToReproduce && data.stepsToReproduce.length > MAX_STEPS_LENGTH) {
    errors.push(`Steps to reproduce must not exceed ${MAX_STEPS_LENGTH} characters`);
  }

  // Actual behavior validation
  if (!data.actualBehavior || data.actualBehavior.trim().length < MIN_BEHAVIOR_LENGTH) {
    errors.push(`Actual behavior must be at least ${MIN_BEHAVIOR_LENGTH} characters`);
  }
  if (data.actualBehavior && data.actualBehavior.length > MAX_BEHAVIOR_LENGTH) {
    errors.push(`Actual behavior must not exceed ${MAX_BEHAVIOR_LENGTH} characters`);
  }

  // Attachments validation
  if (data.attachments && data.attachments.length > MAX_ATTACHMENTS) {
    errors.push(`Maximum ${MAX_ATTACHMENTS} attachments allowed`);
  }

  // File size and type validation
  if (data.attachments) {
    data.attachments.forEach((file, index) => {
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`File ${index + 1} exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
      }
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        errors.push(`File ${index + 1} must be an image (JPEG, PNG, GIF, or WebP)`);
      }
    });
  }

  // Email validation (if provided)
  if (data.reporterEmail && data.reporterEmail.trim().length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.reporterEmail)) {
      errors.push("Please provide a valid email address");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize bug report data before storage
 */
export function sanitizeBugReport(data: CreateBugReportDTO): CreateBugReportDTO {
  return {
    ...data,
    title: data.title?.trim().substring(0, MAX_TITLE_LENGTH),
    stepsToReproduce: data.stepsToReproduce?.trim().substring(0, MAX_STEPS_LENGTH),
    actualBehavior: data.actualBehavior?.trim().substring(0, MAX_BEHAVIOR_LENGTH),
    expectedBehavior: data.expectedBehavior?.trim().substring(0, MAX_BEHAVIOR_LENGTH),
    reporterName: data.reporterName?.trim(),
    reporterEmail: data.reporterEmail?.trim().toLowerCase(),
    url: data.url?.trim(),
    browserInfo: data.browserInfo?.trim(),
  };
}

/**
 * Get browser and device information
 */
export function getBrowserInfo(): string {
  if (typeof window === "undefined") return "Unknown";
  
  const ua = navigator.userAgent;
  let browser = "Unknown";
  let os = "Unknown";
  
  // Detect browser
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";
  else if (ua.includes("Edge")) browser = "Edge";
  else if (ua.includes("Opera")) browser = "Opera";
  
  // Detect OS
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  
  return `${browser} on ${os}`;
}

/**
 * Calculate spam score for bug report
 */
export function calculateBugReportSpamScore(data: CreateBugReportDTO): number {
  let score = 0;
  
  // Check for suspicious patterns
  const allText = `${data.title} ${data.stepsToReproduce} ${data.actualBehavior} ${data.expectedBehavior || ""}`.toLowerCase();
  
  // Spam keywords
  const spamKeywords = ["viagra", "casino", "lottery", "click here", "buy now", "limited time"];
  spamKeywords.forEach(keyword => {
    if (allText.includes(keyword)) score += 30;
  });
  
  // Excessive URLs
  const urlMatches = allText.match(/https?:\/\//g);
  if (urlMatches && urlMatches.length > 3) score += 20;
  
  // All caps title
  if (data.title === data.title.toUpperCase() && data.title.length > 10) score += 15;
  
  // Very short or generic descriptions
  if (data.stepsToReproduce.split(" ").length < 5) score += 10;
  if (data.actualBehavior.split(" ").length < 5) score += 10;
  
  // Excessive special characters
  const specialChars = allText.match(/[!@#$%^&*()]/g);
  if (specialChars && specialChars.length > 10) score += 15;
  
  return Math.min(score, 100);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}
