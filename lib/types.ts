// lib/types.ts
// TypeScript interfaces for the "Ask Me Directly" Q&A system

import { Timestamp } from "firebase/firestore";

/**
 * Question status type union
 */
export type QuestionStatus = 'unanswered' | 'answered' | 'archived';

/**
 * Visitor metadata for question context
 */
export interface VisitorMetadata {
  /** Current page path when question was asked */
  pagePath: string;
  /** Referrer URL (can be null for direct visits) */
  referrer: string | null;
  /** Hashed IP address for privacy */
  ipHash: string | null;
  /** User agent for device context */
  userAgent?: string;
  /** Browser language */
  language?: string;
  /** Screen resolution */
  screenResolution?: string;
  /** Timezone */
  timezone?: string;
}

/**
 * Direct Question interface matching Firestore data model
 */
export interface DirectQuestion {
  /** Unique question ID (Firestore document ID) */
  id: string;
  /** UUID of the visitor who asked the question */
  visitorUuid: string;
  /** The question text (max 500 characters) */
  question: string;
  /** Current status of the question */
  status: QuestionStatus;
  /** When the question was created */
  createdAt: Timestamp;
  /** When the question was last updated */
  updatedAt: Timestamp;
  /** When the question was answered (null if not answered) */
  answeredAt: Timestamp | null;
  /** Admin's reply to the question (null if not answered) */
  adminReply: string | null;
  /** Whether the visitor has unread updates */
  unreadForVisitor: boolean;
  /** Additional context about when/where the question was asked */
  metadata: VisitorMetadata;
}

/**
 * Partial interface for creating new questions
 */
export interface CreateDirectQuestionData {
  /** The question text */
  question: string;
  /** Visitor metadata */
  metadata: VisitorMetadata;
}

/**
 * Partial interface for updating question status
 */
export interface UpdateQuestionData {
  status?: QuestionStatus;
  adminReply?: string;
  unreadForVisitor?: boolean;
}

/**
 * Interface for question submission validation
 */
export interface QuestionValidationResult {
  /** Whether the question is valid */
  isValid: boolean;
  /** Error message if invalid */
  error?: string;
  /** Cleaned/processed question text */
  cleanedQuestion?: string;
}

/**
 * Interface for rate limiting check
 */
export interface RateLimitResult {
  /** Whether the user can send a question */
  canSend: boolean;
  /** Remaining cooldown time in seconds (0 if can send) */
  remainingCooldown: number;
  /** When the user can next send a question */
  nextAllowedTime?: Date;
}

/**
 * Interface for real-time question listener
 */
export interface QuestionListener {
  /** Unsubscribe function */
  unsubscribe: () => void;
  /** Whether the listener is active */
  isActive: boolean;
}

/**
 * Interface for visitor question statistics
 */
export interface VisitorQuestionStats {
  /** Total questions asked by visitor */
  totalQuestions: number;
  /** Number of unanswered questions */
  unanswered: number;
  /** Number of answered questions */
  answered: number;
  /** Number of archived questions */
  archived: number;
  /** Number of unread questions for visitor */
  unread: number;
  /** Last question timestamp */
  lastQuestionAt: Timestamp | null;
}

/**
 * Interface for page visibility state
 */
export interface PageVisibilityState {
  /** Whether the page is currently visible */
  isVisible: boolean;
  /** Whether the page has focus */
  hasFocus: boolean;
  /** Last visibility change timestamp */
  lastChangeTime: Date;
}

/**
 * Interface for toast notification options
 */
export interface QuestionToastOptions {
  /** Toast message */
  message: string;
  /** Toast type */
  type: 'success' | 'error' | 'warning' | 'info';
  /** Auto close duration in ms */
  duration?: number;
  /** Whether to show only when page is visible */
  onlyWhenVisible?: boolean;
  /** Custom action callback */
  onAction?: () => void;
}