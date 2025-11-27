/**
 * Ban Status Manager - Enterprise Level Real-Time Updates
 * 
 * Manages real-time ban status monitoring with:
 * - Firebase real-time listeners
 * - Automatic reconnection
 * - Connection state management
 * - Event-driven architecture
 * - Memory leak prevention
 */

import { onSnapshot, doc, getDoc, Unsubscribe } from 'firebase/firestore';
import { db } from './firebase';

export interface BanStatusData {
  banned: boolean;
  banReason?: string;
  banCategory?: string;
  banTimestamp?: Date;
  bannedBy?: string;
}

export type BanStatusListener = (status: BanStatusData) => void;
export type BanErrorListener = (error: Error) => void;

interface ListenerRegistration {
  onStatusChange: BanStatusListener;
  onError?: BanErrorListener;
  unsubscribe: Unsubscribe | null;
}

class BanStatusManager {
  private listeners: Map<string, ListenerRegistration> = new Map();
  private currentVisitorId: string | null = null; // UUID for Firestore queries
  private currentMask: string | null = null; // Mask for API calls
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  /**
   * Initialize the manager with visitor mask from BubbleSessionContext
   * Accepts mask parameter to avoid redundant identity creation
   * Returns a promise that resolves when initialization is complete
   */
  async initialize(mask?: string): Promise<void> {
    // Return existing initialization promise if already in progress
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Already initialized, return immediately
    if (this.isInitialized) {
      console.log('[Ban Status Manager] Already initialized');
      return Promise.resolve();
    }

    // Create new initialization promise
    this.initializationPromise = (async () => {
      try {
        // Mask must be provided from BubbleSessionContext to avoid duplicate identity creation
        if (!mask) {
          throw new Error('Mask is required for initialization. Wait for BubbleSessionContext.');
        }
        
        console.log('[Ban Status Manager] Initializing with provided mask:', mask);
        
        // Translate mask to UUID using client-side Firestore query
        const maskDocRef = doc(db, 'og_uuid_masks', mask);
        const maskDoc = await getDoc(maskDocRef);
        
        if (!maskDoc.exists()) {
          throw new Error(`No UUID found for mask: ${mask}`);
        }
        
        const { uuid } = maskDoc.data() as { uuid: string };
        this.currentVisitorId = uuid;
        this.currentMask = mask;
        
        this.isInitialized = true;
        console.log('[Ban Status Manager] Initialized with UUID:', this.currentVisitorId, 'Mask:', this.currentMask);
      } catch (error) {
        console.error('[Ban Status Manager] Initialization error:', error);
        this.initializationPromise = null; // Allow retry
        throw error;
      }
    })();

    return this.initializationPromise;
  }

  /**
   * Set the visitor mask (called by BubbleSessionContext after it initializes)
   * This allows ban monitoring to start once the mask is available
   */
  setMask(mask: string): void {
    if (!this.isInitialized && mask) {
      // Initialize with the provided mask
      this.initialize(mask).catch(err => {
        console.error('[Ban Status Manager] Failed to initialize with mask:', err);
      });
    }
  }

  /**
   * Subscribe to ban status changes for current visitor
   * Handles async initialization automatically
   */
  async subscribe(
    listenerId: string,
    onStatusChange: BanStatusListener,
    onError?: BanErrorListener
  ): Promise<() => void> {
    // Ensure initialized
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.currentVisitorId) {
      console.error('[Ban Status Manager] No visitor ID available');
      return () => {};
    }

    // Unsubscribe existing listener if any
    if (this.listeners.has(listenerId)) {
      this.unsubscribe(listenerId);
    }

    console.log(`[Ban Status Manager] Subscribing listener: ${listenerId}`);

    // Create Firestore listener
    const visitorRef = doc(db, 'og_uuid', this.currentVisitorId);
    
    const unsubscribe = onSnapshot(
      visitorRef,
      (snapshot) => {
        this.reconnectAttempts = 0; // Reset on successful connection
        
        if (snapshot.exists()) {
          const data = snapshot.data();
          const status: BanStatusData = {
            banned: data.banned === true,
            banReason: data.banReason,
            banCategory: data.banCategory,
            banTimestamp: data.banTimestamp?.toDate(),
            bannedBy: data.bannedBy,
          };

          console.log(`[Ban Status Manager] Status update for ${listenerId}:`, status);
          onStatusChange(status);
        } else {
          // Visitor doesn't exist yet - not banned
          console.log(`[Ban Status Manager] Visitor not found - not banned`);
          onStatusChange({ banned: false });
        }
      },
      (error) => {
        console.error(`[Ban Status Manager] Error in listener ${listenerId}:`, error);
        
        if (onError) {
          onError(error);
        }

        // Attempt to reconnect with exponential backoff
        this.handleReconnect(listenerId, onStatusChange, onError);
      }
    );

    // Store listener registration
    this.listeners.set(listenerId, {
      onStatusChange,
      onError,
      unsubscribe,
    });

    // Return unsubscribe function
    return () => this.unsubscribe(listenerId);
  }

  /**
   * Handle reconnection with exponential backoff
   */
  private handleReconnect(
    listenerId: string,
    onStatusChange: BanStatusListener,
    onError?: BanErrorListener
  ): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`[Ban Status Manager] Max reconnect attempts reached for ${listenerId}`);
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`[Ban Status Manager] Reconnecting ${listenerId} in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(async () => {
      console.log(`[Ban Status Manager] Reconnecting ${listenerId}...`);
      await this.subscribe(listenerId, onStatusChange, onError);
    }, delay);
  }

  /**
   * Unsubscribe a specific listener
   */
  unsubscribe(listenerId: string): void {
    const listener = this.listeners.get(listenerId);
    
    if (listener) {
      console.log(`[Ban Status Manager] Unsubscribing listener: ${listenerId}`);
      
      if (listener.unsubscribe) {
        listener.unsubscribe();
      }
      
      this.listeners.delete(listenerId);
    }
  }

  /**
   * Unsubscribe all listeners
   */
  unsubscribeAll(): void {
    console.log(`[Ban Status Manager] Unsubscribing all ${this.listeners.size} listeners`);
    
    this.listeners.forEach((listener, listenerId) => {
      if (listener.unsubscribe) {
        listener.unsubscribe();
      }
    });
    
    this.listeners.clear();
  }

  /**
   * Get current visitor mask (for API calls)
   */
  getMask(): string | null {
    return this.currentMask;
  }

  /**
   * Get current visitor UUID (for internal use)
   */
  getVisitorId(): string | null {
    return this.currentVisitorId;
  }

  /**
   * Check if manager is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.currentVisitorId !== null;
  }

  /**
   * Get active listener count
   */
  getListenerCount(): number {
    return this.listeners.size;
  }

  /**
   * Reset the manager (for testing)
   */
  reset(): void {
    console.log('[Ban Status Manager] Resetting...');
    this.unsubscribeAll();
    this.currentVisitorId = null;
    this.currentMask = null;
    this.isInitialized = false;
    this.reconnectAttempts = 0;
  }
}

// Export singleton instance
export const banStatusManager = new BanStatusManager();

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    banStatusManager.unsubscribeAll();
  });
}
