// lib/notificationStore.ts
// Notification state management and persistence

import { Timestamp } from "firebase/firestore";
import { getVisitorUuidWithFallbacks } from "./visitor";
import {
  DirectQuestionNotification,
  NotificationState,
  NotificationPreferences,
  NotificationEvent,
  NotificationPersistence,
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_CONSTANTS
} from "@/types/notifications";

/**
 * Local storage implementation of notification persistence
 */
class LocalStorageNotificationPersistence implements NotificationPersistence {
  private getStorageKey(visitorUuid: string): string {
    return `${NOTIFICATION_CONSTANTS.LOCAL_STORAGE_KEY}_${visitorUuid}`;
  }

  async saveState(state: NotificationState): Promise<void> {
    try {
      const storageKey = this.getStorageKey(state.visitorUuid);
      const serializedState = {
        ...state,
        lastCheckedTime: state.lastCheckedTime.toMillis(),
        lastShownTime: state.lastShownTime?.toMillis() || null,
        unreadNotifications: state.unreadNotifications.map(notification => ({
          ...notification,
          timestamp: notification.timestamp.toMillis()
        }))
      };
      localStorage.setItem(storageKey, JSON.stringify(serializedState));
    } catch (error) {
      console.error('Failed to save notification state:', error);
    }
  }

  async loadState(visitorUuid: string): Promise<NotificationState | null> {
    try {
      const storageKey = this.getStorageKey(visitorUuid);
      const serializedState = localStorage.getItem(storageKey);
      
      if (!serializedState) return null;

      const parsed = JSON.parse(serializedState);
      
      return {
        ...parsed,
        lastCheckedTime: Timestamp.fromMillis(parsed.lastCheckedTime),
        lastShownTime: parsed.lastShownTime ? Timestamp.fromMillis(parsed.lastShownTime) : null,
        unreadNotifications: parsed.unreadNotifications.map((notification: any) => ({
          ...notification,
          timestamp: Timestamp.fromMillis(notification.timestamp)
        }))
      };
    } catch (error) {
      console.error('Failed to load notification state:', error);
      return null;
    }
  }

  async clearState(visitorUuid: string): Promise<void> {
    try {
      const storageKey = this.getStorageKey(visitorUuid);
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Failed to clear notification state:', error);
    }
  }
}

/**
 * Notification store class for managing notification state
 */
class NotificationStore {
  private state: NotificationState | null = null;
  private persistence: NotificationPersistence;
  private eventListeners: Array<(event: NotificationEvent) => void> = [];
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.persistence = new LocalStorageNotificationPersistence();
  }

  /**
   * Initialize the store for a specific visitor
   */
  async initialize(visitorUuid?: string): Promise<void> {
    try {
      const uuid = visitorUuid || getVisitorUuidWithFallbacks();
      
      // Try to load existing state
      const existingState = await this.persistence.loadState(uuid);
      
      if (existingState) {
        this.state = existingState;
      } else {
        // Create new state
        this.state = {
          visitorUuid: uuid,
          unreadNotifications: [],
          unreadCount: 0,
          lastCheckedTime: Timestamp.now(),
          lastShownTime: null,
          preferences: { ...DEFAULT_NOTIFICATION_PREFERENCES }
        };
      }

      // Clean up old notifications (older than 30 days)
      this.cleanupOldNotifications();
      
      // Save the initial/cleaned state
      await this.saveState();
    } catch (error) {
      console.error('Failed to initialize notification store:', error);
      this.emitEvent({ 
        type: 'error', 
        payload: { 
          message: 'Failed to initialize notifications', 
          error: error instanceof Error ? error : new Error('Unknown error')
        } 
      });
    }
  }

  /**
   * Get current state
   */
  getState(): NotificationState | null {
    return this.state;
  }

  /**
   * Add a new notification
   */
  addNotification(notification: DirectQuestionNotification): void {
    if (!this.state) {
      console.warn('Notification store not initialized');
      return;
    }

    // Check if notification already exists
    const existingIndex = this.state.unreadNotifications.findIndex(n => n.id === notification.id);
    
    if (existingIndex >= 0) {
      // Update existing notification
      this.state.unreadNotifications[existingIndex] = notification;
    } else {
      // Add new notification
      this.state.unreadNotifications.push(notification);
    }

    // Update counters
    this.updateCounters();
    
    // Save state
    this.debouncedSave();
    
    // Emit event
    this.emitEvent({ type: 'notification_received', payload: notification });
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(notificationIds: string[]): Promise<void> {
    if (!this.state) return;

    let changed = false;

    this.state.unreadNotifications.forEach(notification => {
      if (notificationIds.includes(notification.id) && !notification.isRead) {
        notification.isRead = true;
        changed = true;
      }
    });

    if (changed) {
      this.updateCounters();
      await this.saveState();
      this.emitEvent({ type: 'notification_read', payload: { notificationIds } });
    }
  }

  /**
   * Mark notifications as shown
   */
  markAsShown(notificationIds: string[]): void {
    if (!this.state) return;

    let changed = false;

    this.state.unreadNotifications.forEach(notification => {
      if (notificationIds.includes(notification.id) && !notification.isShown) {
        notification.isShown = true;
        changed = true;
      }
    });

    if (changed) {
      this.state.lastShownTime = Timestamp.now();
      this.debouncedSave();
      
      notificationIds.forEach(id => {
        this.emitEvent({ type: 'notification_shown', payload: { notificationId: id } });
      });
    }
  }

  /**
   * Remove a specific notification
   */
  removeNotification(notificationId: string): void {
    if (!this.state) return;

    const initialLength = this.state.unreadNotifications.length;
    this.state.unreadNotifications = this.state.unreadNotifications.filter(n => n.id !== notificationId);
    
    if (this.state.unreadNotifications.length !== initialLength) {
      this.updateCounters();
      this.debouncedSave();
      this.emitEvent({ type: 'notification_cleared', payload: { notificationId } });
    }
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    if (!this.state) return;

    this.state.unreadNotifications = [];
    this.updateCounters();
    this.debouncedSave();
  }

  /**
   * Update notification preferences
   */
  updatePreferences(preferences: Partial<NotificationPreferences>): void {
    if (!this.state) return;

    this.state.preferences = {
      ...this.state.preferences,
      ...preferences
    };

    this.debouncedSave();
    this.emitEvent({ type: 'preferences_updated', payload: this.state.preferences });
  }

  /**
   * Get unread notifications
   */
  getUnreadNotifications(): DirectQuestionNotification[] {
    return this.state?.unreadNotifications.filter(n => !n.isRead) || [];
  }

  /**
   * Get unshown notifications
   */
  getUnshownNotifications(): DirectQuestionNotification[] {
    return this.state?.unreadNotifications.filter(n => !n.isShown) || [];
  }

  /**
   * Get notifications that should be displayed
   */
  getDisplayableNotifications(): DirectQuestionNotification[] {
    if (!this.state?.preferences.persistentOverlay) {
      return this.getUnshownNotifications();
    }
    return this.getUnreadNotifications();
  }

  /**
   * Subscribe to events
   */
  subscribe(listener: (event: NotificationEvent) => void): () => void {
    this.eventListeners.push(listener);
    
    return () => {
      const index = this.eventListeners.indexOf(listener);
      if (index >= 0) {
        this.eventListeners.splice(index, 1);
      }
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    this.eventListeners = [];
  }

  /**
   * Private methods
   */

  private updateCounters(): void {
    if (!this.state) return;
    
    this.state.unreadCount = this.state.unreadNotifications.filter(n => !n.isRead).length;
    this.state.lastCheckedTime = Timestamp.now();
  }

  private cleanupOldNotifications(): void {
    if (!this.state) return;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffTimestamp = Timestamp.fromDate(thirtyDaysAgo);

    const initialLength = this.state.unreadNotifications.length;
    this.state.unreadNotifications = this.state.unreadNotifications.filter(
      notification => notification.timestamp.toMillis() > cutoffTimestamp.toMillis()
    );

    if (this.state.unreadNotifications.length !== initialLength) {
      this.updateCounters();
    }
  }

  private async saveState(): Promise<void> {
    if (!this.state) return;
    
    try {
      await this.persistence.saveState(this.state);
    } catch (error) {
      console.error('Failed to save notification state:', error);
    }
  }

  private debouncedSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    this.saveTimeout = setTimeout(() => {
      this.saveState();
    }, 1000);
  }

  private emitEvent(event: NotificationEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in notification event listener:', error);
      }
    });
  }
}

// Global store instance
let notificationStore: NotificationStore | null = null;

/**
 * Get or create the global notification store
 */
export function getNotificationStore(): NotificationStore {
  if (!notificationStore) {
    notificationStore = new NotificationStore();
  }
  return notificationStore;
}

/**
 * Initialize the notification system
 */
export async function initializeNotifications(visitorUuid?: string): Promise<NotificationStore> {
  const store = getNotificationStore();
  await store.initialize(visitorUuid);
  return store;
}

/**
 * Cleanup notification system
 */
export function cleanupNotifications(): void {
  if (notificationStore) {
    notificationStore.cleanup();
    notificationStore = null;
  }
}

/**
 * Utility function to create notification from question data
 */
export function createNotificationFromQuestion(
  questionId: string,
  question: string,
  answer: string,
  type: 'new_answer' | 'updated_answer' = 'new_answer'
): DirectQuestionNotification {
  return {
    id: `${questionId}_${type}_${Date.now()}`,
    questionId,
    type,
    timestamp: Timestamp.now(),
    questionPreview: question.length > NOTIFICATION_CONSTANTS.MAX_PREVIEW_LENGTH 
      ? question.substring(0, NOTIFICATION_CONSTANTS.MAX_PREVIEW_LENGTH) + '...'
      : question,
    answerPreview: answer.length > NOTIFICATION_CONSTANTS.MAX_PREVIEW_LENGTH
      ? answer.substring(0, NOTIFICATION_CONSTANTS.MAX_PREVIEW_LENGTH) + '...'
      : answer,
    isRead: false,
    isShown: false,
    isDisplayed: false,
    fullQuestion: question,
    fullAnswer: answer
  };
}