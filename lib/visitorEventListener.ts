// lib/visitorEventListener.ts
// Listener for admin actions that affect visitors (like question deletions)

import { 
  onSnapshot,
  query,
  where,
  collection,
  orderBy,
  deleteDoc,
  doc,
  Timestamp
} from "firebase/firestore";
import { db } from "./firebase";
import { getVisitorUuidWithFallbacks } from "./visitor";
import { getNotificationStore } from "./notificationStore";
import { showInfoToast, showWarningToast } from "@/components/ToastSystem";

interface VisitorEvent {
  id: string;
  type: 'question_deleted' | 'questions_deleted';
  visitorUuid: string;
  questionId?: string;
  questionIds?: string[];
  permanent: boolean;
  deletedAt: Timestamp;
  adminAction: boolean;
  questionText?: string;
}

/**
 * Visitor event listener for handling admin actions
 */
class VisitorEventListener {
  private unsubscribe: (() => void) | null = null;
  private visitorUuid: string | null = null;
  private isActive = false;

  /**
   * Initialize the listener for the current visitor
   */
  async initialize(visitorUuid?: string): Promise<void> {
    try {
      this.visitorUuid = visitorUuid || getVisitorUuidWithFallbacks();
      
      this.setupEventListener();
      this.isActive = true;
      
      console.log('✅ Visitor event listener initialized for:', this.visitorUuid);
    } catch (error) {
      console.error('❌ Failed to initialize visitor event listener:', error);
    }
  }

  /**
   * Setup real-time listener for visitor events
   */
  private setupEventListener(): void {
    if (!this.visitorUuid) {
      console.error('Cannot setup event listener: visitor UUID is null');
      return;
    }

    // Listen for events targeted at this visitor
    const eventsQuery = query(
      collection(db, 'visitorEvents'),
      where('visitorUuid', '==', this.visitorUuid),
      orderBy('deletedAt', 'desc')
    );

    console.log('🔄 Setting up visitor event listener');

    this.unsubscribe = onSnapshot(
      eventsQuery,
      this.handleEventsUpdate.bind(this),
      this.handleError.bind(this)
    );
  }

  /**
   * Handle events update from Firebase
   */
  private async handleEventsUpdate(snapshot: any): Promise<void> {
    try {
      const events: VisitorEvent[] = [];

      snapshot.forEach((doc: any) => {
        const eventData = {
          id: doc.id,
          ...doc.data()
        } as VisitorEvent;
        events.push(eventData);
      });

      // Process each event
      for (const event of events) {
        await this.processEvent(event);
        
        // Clean up the event after processing
        await this.cleanupEvent(event.id);
      }

      if (events.length > 0) {
        console.log(`🧹 Processed ${events.length} visitor events`);
      }
    } catch (error) {
      console.error('❌ Error processing visitor events:', error);
    }
  }

  /**
   * Process a specific event
   */
  private async processEvent(event: VisitorEvent): Promise<void> {
    try {
      switch (event.type) {
        case 'question_deleted':
        case 'questions_deleted':
          await this.handleQuestionDeletion(event);
          break;
        
        default:
          console.warn('⚠️ Unknown event type:', event.type);
      }
    } catch (error) {
      console.error('❌ Error processing event:', error);
    }
  }

  /**
   * Handle question deletion events
   */
  private async handleQuestionDeletion(event: VisitorEvent): Promise<void> {
    const questionIds = event.questionIds || (event.questionId ? [event.questionId] : []);
    
    if (questionIds.length === 0) {
      console.warn('⚠️ No question IDs in deletion event');
      return;
    }

    console.log(`🗑️ Processing deletion of ${questionIds.length} questions`);

    // Clear notifications for deleted questions
    const notificationStore = getNotificationStore();
    if (notificationStore.getState()) {
      questionIds.forEach(questionId => {
        // Remove notifications related to this question
        const notifications = notificationStore.getState()?.unreadNotifications || [];
        const toRemove = notifications
          .filter(n => n.questionId === questionId)
          .map(n => n.id);
        
        toRemove.forEach(notificationId => {
          notificationStore.removeNotification(notificationId);
        });
      });
    }

    // Clear from local storage caches
    this.clearLocalStorageFootprints(questionIds);

    // Force refresh of question lists
    this.triggerQuestionListRefresh();

    // Show user notification
    const message = questionIds.length === 1 
      ? 'A question was removed by admin'
      : `${questionIds.length} questions were removed by admin`;
    
    if (event.permanent) {
      showWarningToast(message + ' (permanently deleted)');
    } else {
      showInfoToast(message + ' (archived)');
    }
  }

  /**
   * Clear local storage footprints
   */
  private clearLocalStorageFootprints(questionIds: string[]): void {
    try {
      // Clear any cached question data
      questionIds.forEach(questionId => {
        localStorage.removeItem(`question_${questionId}`);
        localStorage.removeItem(`question_cache_${questionId}`);
      });

      // Clear notification cache entries
      const notificationKey = `direct_questions_notifications_${this.visitorUuid}`;
      const storedNotifications = localStorage.getItem(notificationKey);
      
      if (storedNotifications) {
        try {
          const notifications = JSON.parse(storedNotifications);
          if (notifications.unreadNotifications) {
            notifications.unreadNotifications = notifications.unreadNotifications.filter(
              (n: any) => !questionIds.includes(n.questionId)
            );
            localStorage.setItem(notificationKey, JSON.stringify(notifications));
          }
        } catch (error) {
          console.warn('⚠️ Failed to clean notification storage:', error);
        }
      }

      console.log('🧹 Cleared local storage footprints for deleted questions');
    } catch (error) {
      console.error('❌ Failed to clear local storage:', error);
    }
  }

  /**
   * Trigger refresh of question lists
   */
  private triggerQuestionListRefresh(): void {
    // Emit custom event to force refresh
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('questionsDeleted', {
        detail: { 
          timestamp: Date.now(),
          visitorUuid: this.visitorUuid
        }
      });
      window.dispatchEvent(event);

      // Also trigger storage event for broader refresh
      const storageEvent = new StorageEvent('storage', {
        key: 'questions_deleted_refresh',
        newValue: JSON.stringify({ 
          timestamp: Date.now(),
          visitorUuid: this.visitorUuid
        })
      });
      window.dispatchEvent(storageEvent);
    }
  }

  /**
   * Clean up processed event
   */
  private async cleanupEvent(eventId: string): Promise<void> {
    try {
      const eventRef = doc(db, 'visitorEvents', eventId);
      await deleteDoc(eventRef);
    } catch (error) {
      console.warn('⚠️ Failed to cleanup event:', error);
      // Don't throw - this is cleanup, not critical
    }
  }

  /**
   * Handle listener errors
   */
  private handleError(error: any): void {
    console.error('❌ Visitor event listener error:', error);
    
    // Try to reconnect after a delay
    setTimeout(() => {
      if (this.isActive) {
        console.log('🔄 Attempting to reconnect visitor event listener...');
        this.setupEventListener();
      }
    }, 5000);
  }

  /**
   * Check if listener is active
   */
  isListenerActive(): boolean {
    return this.unsubscribe !== null && this.isActive;
  }

  /**
   * Cleanup the listener
   */
  cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    
    this.isActive = false;
    this.visitorUuid = null;
    
    console.log('🧹 Visitor event listener cleaned up');
  }
}

// Global listener instance
let visitorEventListener: VisitorEventListener | null = null;

/**
 * Get or create the global visitor event listener
 */
export function getVisitorEventListener(): VisitorEventListener {
  if (!visitorEventListener) {
    visitorEventListener = new VisitorEventListener();
  }
  return visitorEventListener;
}

/**
 * Initialize the visitor event listener
 */
export async function initializeVisitorEventListener(visitorUuid?: string): Promise<VisitorEventListener> {
  const listener = getVisitorEventListener();
  await listener.initialize(visitorUuid);
  return listener;
}

/**
 * Cleanup visitor event listener
 */
export function cleanupVisitorEventListener(): void {
  if (visitorEventListener) {
    visitorEventListener.cleanup();
    visitorEventListener = null;
  }
}