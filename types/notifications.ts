// types/notifications.ts
// TypeScript interfaces for the notification system

import { Timestamp } from "firebase/firestore";

/**
 * Notification types
 */
export type NotificationType = 'new_answer' | 'updated_answer' | 'question_archived';

/**
 * Individual notification interface
 */
export interface DirectQuestionNotification {
  /** Unique notification ID */
  id: string;
  /** Question ID this notification is for */
  questionId: string;
  /** Type of notification */
  type: NotificationType;
  /** When the notification was created */
  timestamp: Timestamp;
  /** Preview of the question (truncated) */
  questionPreview: string;
  /** Preview of the admin's answer (truncated) */
  answerPreview: string;
  /** Whether the notification has been read */
  isRead: boolean;
  /** Whether the notification has been shown to the user */
  isShown: boolean;
  /** Whether this notification is currently displayed */
  isDisplayed: boolean;
  /** Full question text (for display when clicked) */
  fullQuestion?: string;
  /** Full answer text (for display when clicked) */
  fullAnswer?: string;
}

/**
 * Notification state for a visitor
 */
export interface NotificationState {
  /** Visitor UUID */
  visitorUuid: string;
  /** Array of unread notifications */
  unreadNotifications: DirectQuestionNotification[];
  /** Total count of unread notifications */
  unreadCount: number;
  /** When notifications were last checked */
  lastCheckedTime: Timestamp;
  /** When the last notification was shown */
  lastShownTime: Timestamp | null;
  /** User notification preferences */
  preferences: NotificationPreferences;
}

/**
 * User notification preferences
 */
export interface NotificationPreferences {
  /** Whether sound notifications are enabled */
  soundEnabled: boolean;
  /** Whether persistent overlay is enabled */
  persistentOverlay: boolean;
  /** Whether to show answer previews */
  showPreviews: boolean;
  /** Whether to show notifications only when page is active */
  onlyWhenActive: boolean;
  /** Notification sound volume (0-1) */
  soundVolume: number;
  /** Auto-hide timeout for non-persistent notifications (milliseconds) */
  autoHideTimeout: number;
}

/**
 * Notification display options
 */
export interface NotificationDisplayOptions {
  /** Position of the notification */
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
  /** Animation type */
  animation: 'slide' | 'fade' | 'bounce' | 'none';
  /** Whether to show close button */
  showCloseButton: boolean;
  /** Whether to show action buttons */
  showActionButtons: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Z-index for the notification */
  zIndex: number;
}

/**
 * Notification manager interface
 */
export interface NotificationManager {
  /** Initialize the notification system */
  initialize(visitorUuid: string): Promise<void>;
  /** Get current notification state */
  getState(): NotificationState;
  /** Show a new notification */
  showNotification(notification: DirectQuestionNotification): void;
  /** Mark notifications as read */
  markAsRead(notificationIds: string[]): Promise<void>;
  /** Mark notifications as shown */
  markAsShown(notificationIds: string[]): void;
  /** Clear all notifications */
  clearAll(): void;
  /** Update notification preferences */
  updatePreferences(preferences: Partial<NotificationPreferences>): void;
  /** Setup real-time listener */
  setupRealTimeListener(): () => void;
  /** Cleanup resources */
  cleanup(): void;
}

/**
 * Notification event types
 */
export type NotificationEvent = 
  | { type: 'notification_received'; payload: DirectQuestionNotification }
  | { type: 'notification_shown'; payload: { notificationId: string } }
  | { type: 'notification_read'; payload: { notificationIds: string[] } }
  | { type: 'notification_cleared'; payload: { notificationId: string } }
  | { type: 'preferences_updated'; payload: NotificationPreferences }
  | { type: 'error'; payload: { message: string; error: Error } };

/**
 * Notification context interface
 */
export interface NotificationContext {
  /** Current notification state */
  state: NotificationState;
  /** Show notification overlay */
  showOverlay: boolean;
  /** Currently displayed notifications */
  displayedNotifications: DirectQuestionNotification[];
  /** Functions to manage notifications */
  actions: {
    markAsRead: (notificationIds: string[]) => Promise<void>;
    clearNotification: (notificationId: string) => void;
    clearAll: () => void;
    updatePreferences: (preferences: Partial<NotificationPreferences>) => void;
    toggleOverlay: (show?: boolean) => void;
  };
}

/**
 * Sound notification options
 */
export interface SoundNotificationOptions {
  /** Sound type to play */
  type: 'new_answer' | 'updated_answer' | 'multiple_answers';
  /** Volume level (0-1) */
  volume: number;
  /** Whether to respect user preferences */
  respectPreferences: boolean;
  /** Fallback to system sound if custom sound fails */
  fallbackToSystem: boolean;
}

/**
 * Notification persistence interface
 */
export interface NotificationPersistence {
  /** Save notification state to persistent storage */
  saveState(state: NotificationState): Promise<void>;
  /** Load notification state from persistent storage */
  loadState(visitorUuid: string): Promise<NotificationState | null>;
  /** Clear persisted state */
  clearState(visitorUuid: string): Promise<void>;
}

/**
 * Default notification preferences
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  soundEnabled: true,
  persistentOverlay: true,
  showPreviews: true,
  onlyWhenActive: true,
  soundVolume: 0.7,
  autoHideTimeout: 10000, // 10 seconds
};

/**
 * Default notification display options
 */
export const DEFAULT_DISPLAY_OPTIONS: NotificationDisplayOptions = {
  position: 'top-right',
  animation: 'slide',
  showCloseButton: true,
  showActionButtons: true,
  zIndex: 9999,
};

/**
 * Notification constants
 */
export const NOTIFICATION_CONSTANTS = {
  MAX_PREVIEW_LENGTH: 100,
  MAX_NOTIFICATIONS_DISPLAYED: 3,
  NOTIFICATION_TIMEOUT: 10000,
  SOUND_TIMEOUT: 5000,
  LOCAL_STORAGE_KEY: 'direct_questions_notifications',
} as const;