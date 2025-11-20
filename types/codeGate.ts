/**
 * Code Gate Types
 * Type definitions for the secret code verification system
 * that protects admin area access
 */

/**
 * Secret code record stored in database
 * Label: "gaurav-here"
 */
export interface SecretCode {
  id: string;
  label: string; // "gaurav-here"
  code: string; // The actual secret code
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Failed attempt record for tracking unauthorized access attempts
 */
export interface CodeAttempt {
  id: string;
  visitorId: string; // Device fingerprint
  ipAddress: string | null;
  attemptedCode: string;
  timestamp: Date;
  userAgent: string | null;
  successful: boolean;
}

/**
 * Ban record for blocking abusive users
 */
export interface CodeBan {
  id: string;
  visitorId: string; // Device fingerprint
  ipAddress: string | null;
  reason: string;
  bannedAt: Date;
  expiresAt: Date | null; // null = permanent ban
  attemptCount: number;
  isPermanent: boolean;
  lastAttemptAt: Date;
}

/**
 * Session unlock record - tracks who has passed the code gate
 */
export interface CodeGateSession {
  id: string;
  visitorId: string;
  unlockedAt: Date;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
}

/**
 * Abuse log entry - comprehensive view for admin
 */
export interface AbuseLogEntry {
  id: string;
  visitorId: string;
  ipAddress: string | null;
  eventType: 'failed_attempt' | 'banned' | 'direct_access_blocked' | 'code_success';
  attemptedPath: string | null;
  attemptedCode: string | null;
  timestamp: Date;
  userAgent: string | null;
  metadata?: Record<string, any>;
}

/**
 * API Response Types
 */
export interface CodeVerificationRequest {
  code: string;
  visitorId: string;
}

export interface CodeVerificationResponse {
  success: boolean;
  message: string;
  banned?: boolean;
  attemptsRemaining?: number;
}

export interface SessionCheckResponse {
  hasAccess: boolean;
  expiresAt?: string;
  banned?: boolean;
}

export interface AbuseLogsResponse {
  logs: AbuseLogEntry[];
  totalCount: number;
  bannedCount: number;
  recentAttempts: number;
}

/**
 * Ban hint configuration
 * Stores the subtle hint shown to banned users
 */
export interface BanHint {
  id: string;
  label: string; // "ban-hint"
  hint: string; // The actual hint text
  enabled: boolean;
  updatedAt: Date;
}
