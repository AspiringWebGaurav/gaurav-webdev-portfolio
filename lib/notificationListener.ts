// lib/notificationListener.ts
// Real-time listener for direct question notifications

import {
  onSnapshot,
  query,
  where,
  collection,
  orderBy,
  Timestamp,
  DocumentData,
  QuerySnapshot
} from "firebase/firestore";
import { db } from "./firebase";
import { getVisitorUuidWithFallbacks } from "./visitor";
import { getNotificationStore, createNotificationFromQuestion } from "./notificationStore";
import { showSuccessToast, showInfoToast } from "@/components/ToastSystem";
import type { DirectQuestion } from "./types";
import type { DirectQuestionNotification, NotificationType } from "@/types/notifications";

/**
 * Real-time notification listener manager
 */
class NotificationListener {
  private unsubscribe: (() => void) | null = null;
  private visitorUuid: string | null = null;
  private lastKnownQuestions: Map<string, DirectQuestion> = new Map();
  private isInitialized = false;

  /**
   * Initialize the listener for the current visitor
   */
  async initialize(visitorUuid?: string): Promise<void> {
    try {
      this.visitorUuid = visitorUuid || getVisitorUuidWithFallbacks();
      
      // Initialize notification store
      const store = getNotificationStore();
      await store.initialize(this.visitorUuid);

      // Load existing questions first to establish baseline
      await this.loadInitialQuestions();

      // Setup real-time listener after baseline is established
      this.setupRealtimeListener();
      
      this.isInitialized = true;
      console.log('✅ Notification listener initialized for visitor:', this.visitorUuid);
    } catch (error) {
      console.error('❌ Failed to initialize notification listener:', error);
    }
  }

  /**
   * Load initial questions to establish baseline
   */
  private async loadInitialQuestions(): Promise<void> {
    try {
      const response = await fetch('/api/direct-questions', {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.questions) {
          data.data.questions.forEach((question: DirectQuestion) => {
            this.lastKnownQuestions.set(question.id, question);
          });
          console.log(`📋 Loaded ${data.data.questions.length} existing questions as baseline`);
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to load initial questions:', error);
    }
  }

  /**
   * Setup real-time listener for visitor's questions
   */
  private setupRealtimeListener(): void {
    if (!this.visitorUuid) {
      console.error('Cannot setup listener: visitor UUID is null');
      return;
    }

    // Check if Firebase is available
    if (!db) {
      console.warn('❌ Firebase not available, using polling fallback');
      this.setupPollingFallback();
      return;
    }

    try {
      // Import collection function dynamically to prevent null reference errors
      const { collection } = require('firebase/firestore');
      
      // Create query for visitor's questions (without orderBy to avoid index requirement)
      const questionsQuery = query(
        collection(db, 'directQuestions'),
        where('visitorUuid', '==', this.visitorUuid)
      );

      console.log('🔄 Setting up real-time listener for direct questions');

      // Setup the listener with proper callback functions
      this.unsubscribe = onSnapshot(
        questionsQuery,
        (snapshot) => this.handleQuestionsUpdate(snapshot as QuerySnapshot<DocumentData>),
        (error) => this.handleError(error)
      );
    } catch (error) {
      console.error('❌ Failed to setup Firebase listener, using polling fallback:', error);
      this.setupPollingFallback();
    }
  }

  /**
   * Setup polling fallback when Firebase real-time listeners fail
   */
  private setupPollingFallback(): void {
    console.log('📡 Setting up polling fallback for direct questions');
    
    const pollInterval = setInterval(async () => {
      try {
        await this.loadInitialQuestions();
      } catch (error) {
        console.warn('⚠️ Polling fallback error:', error);
      }
    }, 10000); // Poll every 10 seconds

    // Store cleanup function
    this.unsubscribe = () => {
      clearInterval(pollInterval);
      console.log('🧹 Polling fallback cleaned up');
    };
  }

  /**
   * Handle questions update from Firebase
   */
  private handleQuestionsUpdate(snapshot: QuerySnapshot<DocumentData>): void {
    try {
      const questions: DirectQuestion[] = [];
      const newNotifications: DirectQuestionNotification[] = [];

      // Process each question document and sort manually
      const docs = snapshot.docs.sort((a, b) => {
        const aTime = a.data().updatedAt?.toMillis() || a.data().createdAt?.toMillis() || 0;
        const bTime = b.data().updatedAt?.toMillis() || b.data().createdAt?.toMillis() || 0;
        return bTime - aTime; // Descending order
      });

      docs.forEach(doc => {
        const questionData = {
          id: doc.id,
          ...doc.data()
        } as DirectQuestion;
        
        questions.push(questionData);

        // Check for new or updated answers
        const notification = this.checkForNotificationTrigger(questionData);
        if (notification) {
          newNotifications.push(notification);
        }

        // Update our known questions
        this.lastKnownQuestions.set(questionData.id, questionData);
      });

      // Process new notifications
      if (newNotifications.length > 0) {
        console.log(`📬 Processing ${newNotifications.length} new notifications`);
        this.processNotifications(newNotifications);
      }

      console.log(`🔄 Updated questions: ${questions.length} total, ${newNotifications.length} new notifications`);
    } catch (error) {
      console.error('❌ Error processing questions update:', error);
    }
  }

  /**
   * Check if a question triggers a notification
   */
  private checkForNotificationTrigger(question: DirectQuestion): DirectQuestionNotification | null {
    const lastKnown = this.lastKnownQuestions.get(question.id);
    
    // Skip initial load notifications to prevent spam
    if (!lastKnown && !this.isInitialized) {
      return null;
    }

    // Check for new answer
    if (question.status === 'answered' && question.adminReply && question.unreadForVisitor) {
      // New answer scenario
      if (!lastKnown || !lastKnown.adminReply) {
        console.log('🆕 New answer detected for question:', question.id);
        return createNotificationFromQuestion(
          question.id,
          question.question,
          question.adminReply,
          'new_answer'
        );
      }
      
      // Updated answer scenario
      if (lastKnown && lastKnown.adminReply && lastKnown.adminReply !== question.adminReply) {
        console.log('📝 Updated answer detected for question:', question.id);
        return createNotificationFromQuestion(
          question.id,
          question.question,
          question.adminReply,
          'updated_answer'
        );
      }
    }

    return null;
  }

  /**
   * Process new notifications
   */
  private processNotifications(notifications: DirectQuestionNotification[]): void {
    const store = getNotificationStore();
    
    notifications.forEach(notification => {
      store.addNotification(notification);
    });

    // Force immediate UI update
    if (typeof window !== 'undefined') {
      // Emit custom event for instant UI updates
      const event = new CustomEvent('directQuestionNotifications', {
        detail: {
          count: notifications.length,
          notifications,
          action: 'new_notifications'
        }
      });
      window.dispatchEvent(event);

      // Force React state updates by triggering storage events
      const storageEvent = new StorageEvent('storage', {
        key: 'direct_questions_notifications_update',
        newValue: JSON.stringify({
          timestamp: Date.now(),
          count: notifications.length
        })
      });
      window.dispatchEvent(storageEvent);
    }

    console.log(`🚀 Processed ${notifications.length} notifications with instant UI update triggers`);
  }

  /**
   * Handle listener errors
   */
  private handleError(error: any): void {
    console.error('❌ Real-time listener error:', error);
    
    // Try to reconnect after a delay
    setTimeout(() => {
      if (this.isInitialized) {
        console.log('🔄 Attempting to reconnect notification listener...');
        this.setupRealtimeListener();
      }
    }, 5000);
  }

  /**
   * Get current visitor UUID
   */
  getVisitorUuid(): string | null {
    return this.visitorUuid;
  }

  /**
   * Check if listener is active
   */
  isActive(): boolean {
    return this.unsubscribe !== null;
  }

  /**
   * Cleanup the listener
   */
  cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    
    this.lastKnownQuestions.clear();
    this.isInitialized = false;
    this.visitorUuid = null;
    
    console.log('🧹 Notification listener cleaned up');
  }

  /**
   * Force refresh notifications
   */
  async refresh(): Promise<void> {
    if (!this.isInitialized || !this.visitorUuid) {
      return;
    }

    // Cleanup and reinitialize
    this.cleanup();
    await this.initialize(this.visitorUuid);
  }
}

// Global listener instance
let notificationListener: NotificationListener | null = null;

/**
 * Get or create the global notification listener
 */
export function getNotificationListener(): NotificationListener {
  if (!notificationListener) {
    notificationListener = new NotificationListener();
  }
  return notificationListener;
}

/**
 * Initialize the notification listener system
 */
export async function initializeNotificationListener(visitorUuid?: string): Promise<NotificationListener> {
  const listener = getNotificationListener();
  await listener.initialize(visitorUuid);
  return listener;
}

/**
 * Cleanup notification listener
 */
export function cleanupNotificationListener(): void {
  if (notificationListener) {
    notificationListener.cleanup();
    notificationListener = null;
  }
}


/**
 * Utility to manually trigger notification check
 */
export async function triggerNotificationCheck(): Promise<void> {
  const listener = getNotificationListener();
  await listener.refresh();
}