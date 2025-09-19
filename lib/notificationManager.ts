// lib/notificationManager.ts
// Comprehensive notification manager that coordinates all notification functionality

import { getNotificationStore, initializeNotifications } from './notificationStore';
import { getNotificationListener, initializeNotificationListener } from './notificationListener';
import { getVisitorUuidWithFallbacks } from './visitor';
import { showSuccessToast, showInfoToast } from '@/components/ToastSystem';
import type {
  DirectQuestionNotification,
  NotificationState,
  NotificationManager,
  NotificationEvent,
  NotificationPreferences
} from '@/types/notifications';

/**
 * Global notification manager implementation
 */
class GlobalNotificationManager implements NotificationManager {
  private isInitialized = false;
  private visitorUuid: string | null = null;
  private eventListeners: Array<(event: NotificationEvent) => void> = [];

  /**
   * Initialize the notification system
   */
  async initialize(visitorUuid?: string): Promise<void> {
    try {
      this.visitorUuid = visitorUuid || getVisitorUuidWithFallbacks();
      
      console.log('🔄 Initializing global notification manager for visitor:', this.visitorUuid);

      // Initialize store first
      const store = await initializeNotifications(this.visitorUuid);
      
      // Then initialize real-time listener
      const listener = await initializeNotificationListener(this.visitorUuid);

      // Subscribe to store events to forward them
      store.subscribe((event: NotificationEvent) => {
        this.emitEvent(event);
        
        // Handle specific events
        this.handleStoreEvent(event);
      });

      this.isInitialized = true;
      console.log('✅ Global notification manager initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize notification manager:', error);
      throw error;
    }
  }

  /**
   * Get current notification state
   */
  getState(): NotificationState {
    const store = getNotificationStore();
    const state = store.getState();
    
    if (!state) {
      throw new Error('Notification system not initialized');
    }
    
    return state;
  }

  /**
   * Show a new notification
   */
  showNotification(notification: DirectQuestionNotification): void {
    const store = getNotificationStore();
    store.addNotification(notification);
    
    console.log('📬 New notification added:', notification.type, notification.questionPreview);
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(notificationIds: string[]): Promise<void> {
    try {
      const store = getNotificationStore();
      await store.markAsRead(notificationIds);
      
      // Sync with server
      await this.syncReadStatusWithServer(notificationIds);
      
      console.log('✅ Notifications marked as read:', notificationIds.length);
    } catch (error) {
      console.error('❌ Failed to mark notifications as read:', error);
      throw error;
    }
  }

  /**
   * Mark notifications as shown
   */
  markAsShown(notificationIds: string[]): void {
    const store = getNotificationStore();
    store.markAsShown(notificationIds);
    
    console.log('👁️ Notifications marked as shown:', notificationIds.length);
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    const store = getNotificationStore();
    store.clearAll();
    
    console.log('🧹 All notifications cleared');
  }

  /**
   * Update notification preferences
   */
  updatePreferences(preferences: Partial<NotificationPreferences>): void {
    const store = getNotificationStore();
    store.updatePreferences(preferences);
    
    console.log('⚙️ Notification preferences updated:', preferences);
  }

  /**
   * Setup real-time listener (called automatically during initialization)
   */
  setupRealTimeListener(): () => void {
    if (!this.isInitialized) {
      throw new Error('Manager must be initialized before setting up listener');
    }

    const listener = getNotificationListener();
    return () => listener.cleanup();
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    const store = getNotificationStore();
    const listener = getNotificationListener();
    
    store.cleanup();
    listener.cleanup();
    
    this.eventListeners = [];
    this.isInitialized = false;
    this.visitorUuid = null;
    
    console.log('🧹 Global notification manager cleaned up');
  }

  /**
   * Subscribe to notification events
   */
  subscribe(callback: (event: NotificationEvent) => void): () => void {
    this.eventListeners.push(callback);
    
    return () => {
      const index = this.eventListeners.indexOf(callback);
      if (index >= 0) {
        this.eventListeners.splice(index, 1);
      }
    };
  }

  /**
   * Get notification counts for display
   */
  getCounts() {
    const state = this.getState();
    
    return {
      total: state.unreadNotifications.length,
      unread: state.unreadCount,
      unshown: state.unreadNotifications.filter(n => !n.isShown).length,
      displayable: this.getDisplayableCount()
    };
  }

  /**
   * Get count of displayable notifications
   */
  private getDisplayableCount(): number {
    const store = getNotificationStore();
    return store.getDisplayableNotifications().length;
  }

  /**
   * Handle events from the store
   */
  private handleStoreEvent(event: NotificationEvent): void {
    switch (event.type) {
      case 'notification_received':
        // Show toast notification
        showInfoToast('New answer from Gaurav! Click to view.');
        break;
      
      case 'notification_read':
        // Optional: Show confirmation
        if (event.payload.notificationIds.length > 1) {
          showSuccessToast(`${event.payload.notificationIds.length} notifications marked as read`);
        }
        break;
    }
  }

  /**
   * Sync read status with server
   */
  private async syncReadStatusWithServer(questionIds: string[]): Promise<void> {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'mark_read',
          questionIds
        })
      });

      if (!response.ok) {
        console.warn('⚠️ Failed to sync read status with server:', response.statusText);
      }
    } catch (error) {
      console.warn('⚠️ Failed to sync with server:', error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Emit event to all listeners
   */
  private emitEvent(event: NotificationEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('❌ Error in notification event listener:', error);
      }
    });
  }
}

// Global manager instance
let globalNotificationManager: GlobalNotificationManager | null = null;

/**
 * Get or create the global notification manager
 */
export function getGlobalNotificationManager(): GlobalNotificationManager {
  if (!globalNotificationManager) {
    globalNotificationManager = new GlobalNotificationManager();
  }
  return globalNotificationManager;
}

/**
 * Initialize the global notification system
 */
export async function initializeGlobalNotifications(visitorUuid?: string): Promise<GlobalNotificationManager> {
  const manager = getGlobalNotificationManager();
  await manager.initialize(visitorUuid);
  return manager;
}

/**
 * Cleanup the global notification system
 */
export function cleanupGlobalNotifications(): void {
  if (globalNotificationManager) {
    globalNotificationManager.cleanup();
    globalNotificationManager = null;
  }
}

/**
 * Quick utility functions for common operations
 */
export const notificationUtils = {
  /**
   * Get current unread count
   */
  getUnreadCount(): number {
    try {
      const manager = getGlobalNotificationManager();
      return manager.getCounts().unread;
    } catch {
      return 0;
    }
  },

  /**
   * Mark all current notifications as read
   */
  async markAllAsRead(): Promise<void> {
    try {
      const manager = getGlobalNotificationManager();
      const state = manager.getState();
      const unreadIds = state.unreadNotifications
        .filter(n => !n.isRead)
        .map(n => n.questionId);
      
      if (unreadIds.length > 0) {
        await manager.markAsRead(unreadIds);
      }
    } catch (error) {
      console.error('❌ Failed to mark all as read:', error);
    }
  },

  /**
   * Check if there are any unread notifications
   */
  hasUnreadNotifications(): boolean {
    return this.getUnreadCount() > 0;
  },

  /**
   * Force refresh notifications
   */
  async refreshNotifications(): Promise<void> {
    try {
      const listener = getNotificationListener();
      await listener.refresh();
    } catch (error) {
      console.error('❌ Failed to refresh notifications:', error);
    }
  }
};