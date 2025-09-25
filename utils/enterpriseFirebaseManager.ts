/**
 * Enterprise Firebase Connection Reliability Manager
 * Handles connection monitoring, automatic reconnection, and listener management
 * Optimized for mobile devices including Samsung S9 Plus
 */

import { db } from '@/lib/firebase';
import { doc, onSnapshot, DocumentReference, QueryDocumentSnapshot, DocumentSnapshot } from 'firebase/firestore';
import { silentLogger, prodLogger } from './secureLogger';
import { getSessionManager } from './enterpriseSessionManager';

interface ListenerConfig {
  docPath: string;
  collectionName: string;
  docId: string;
  callback: (snapshot: QueryDocumentSnapshot | DocumentSnapshot) => void | Promise<void>;
  errorCallback?: (error: Error) => void;
  maxRetries?: number;
  retryDelay?: number;
  connectionTimeout?: number;
}

interface ConnectionMetrics {
  isConnected: boolean;
  lastSuccessfulConnection: number;
  connectionAttempts: number;
  totalReconnects: number;
  avgConnectionTime: number;
  errorCount: number;
  lastError?: string;
}

interface ListenerState {
  id: string;
  config: ListenerConfig;
  unsubscribe: (() => void) | null;
  isActive: boolean;
  retryCount: number;
  lastActivity: number;
  connectionAttempts: number;
}

export class EnterpriseFirebaseManager {
  private static instance: EnterpriseFirebaseManager;
  private listeners: Map<string, ListenerState> = new Map();
  private connectionMetrics: ConnectionMetrics = {
    isConnected: false,
    lastSuccessfulConnection: 0,
    connectionAttempts: 0,
    totalReconnects: 0,
    avgConnectionTime: 0,
    errorCount: 0
  };
  private connectionCheckInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isOnline: boolean = true;

  private constructor() {
    this.setupNetworkMonitoring();
    this.setupConnectionHealthCheck();
    this.setupVisibilityChangeHandling();
    silentLogger.silent("Enterprise Firebase manager initialized");
  }

  public static getInstance(): EnterpriseFirebaseManager {
    if (!EnterpriseFirebaseManager.instance) {
      EnterpriseFirebaseManager.instance = new EnterpriseFirebaseManager();
    }
    return EnterpriseFirebaseManager.instance;
  }

  /**
   * Create a reliable Firebase listener with automatic reconnection
   */
  public createReliableListener(
    collectionName: string,
    docId: string,
    callback: (snapshot: QueryDocumentSnapshot | DocumentSnapshot) => void | Promise<void>,
    options: Partial<ListenerConfig> = {}
  ): string {
    const listenerId = `${collectionName}_${docId}_${Date.now()}`;
    const docPath = `${collectionName}/${docId}`;
    
    const config: ListenerConfig = {
      docPath,
      collectionName,
      docId,
      callback,
      maxRetries: 5,
      retryDelay: 2000,
      connectionTimeout: 10000,
      ...options
    };

    const listenerState: ListenerState = {
      id: listenerId,
      config,
      unsubscribe: null,
      isActive: false,
      retryCount: 0,
      lastActivity: Date.now(),
      connectionAttempts: 0
    };

    this.listeners.set(listenerId, listenerState);
    
    // Start the listener
    this.startListener(listenerId);
    
    silentLogger.silent("Created reliable Firebase listener", { 
      listenerId, 
      docPath: this.sanitizePath(docPath)
    });
    
    return listenerId;
  }

  /**
   * Start or restart a Firebase listener
   */
  private async startListener(listenerId: string): Promise<boolean> {
    const state = this.listeners.get(listenerId);
    if (!state) return false;

    const { config } = state;
    state.connectionAttempts++;
    this.connectionMetrics.connectionAttempts++;

    try {
      // Clean up existing listener
      if (state.unsubscribe) {
        state.unsubscribe();
        state.unsubscribe = null;
      }

      const docRef = doc(db as any, config.collectionName, config.docId);
      
      silentLogger.silent("Starting Firebase listener", { 
        listenerId,
        attempt: state.connectionAttempts,
        docPath: this.sanitizePath(config.docPath)
      });

      // Create enhanced callback with error handling
      const enhancedCallback = async (snapshot: DocumentSnapshot) => {
        try {
          state.lastActivity = Date.now();
          this.connectionMetrics.lastSuccessfulConnection = Date.now();
          this.connectionMetrics.isConnected = true;
          
          // Reset retry count on successful callback
          state.retryCount = 0;
          
          await config.callback(snapshot);
        } catch (error) {
          prodLogger.error("Error in Firebase listener callback", {
            listenerId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          
          // Don't retry callback errors, but log them
          config.errorCallback?.(error instanceof Error ? error : new Error('Unknown callback error'));
        }
      };

      // Create enhanced error handler
      const enhancedErrorHandler = (error: Error) => {
        this.connectionMetrics.errorCount++;
        this.connectionMetrics.lastError = error.message;
        this.connectionMetrics.isConnected = false;
        
        prodLogger.error("Firebase listener error", {
          listenerId,
          error: error.message,
          retryCount: state.retryCount,
          docPath: this.sanitizePath(config.docPath)
        });

        // Handle specific error types
        if (this.isRetryableError(error)) {
          this.scheduleListenerRetry(listenerId);
        } else {
          // Non-retryable error, call error callback
          config.errorCallback?.(error);
        }
      };

      // Start the Firebase listener
      const unsubscribe = onSnapshot(
        docRef,
        enhancedCallback,
        enhancedErrorHandler
      );

      // Update listener state
      state.unsubscribe = unsubscribe;
      state.isActive = true;
      
      silentLogger.silent("Firebase listener started successfully", { 
        listenerId,
        docPath: this.sanitizePath(config.docPath)
      });
      
      return true;

    } catch (error) {
      prodLogger.error("Failed to start Firebase listener", {
        listenerId,
        error: error instanceof Error ? error.message : 'Unknown error',
        attempt: state.connectionAttempts
      });

      this.scheduleListenerRetry(listenerId);
      return false;
    }
  }

  /**
   * Schedule listener retry with exponential backoff
   */
  private scheduleListenerRetry(listenerId: string): void {
    const state = this.listeners.get(listenerId);
    if (!state || state.retryCount >= state.config.maxRetries!) {
      if (state && state.retryCount >= state.config.maxRetries!) {
        prodLogger.error("Firebase listener max retries exceeded", {
          listenerId,
          maxRetries: state.config.maxRetries
        });
        state.isActive = false;
        state.config.errorCallback?.(new Error('Max retries exceeded'));
      }
      return;
    }

    state.retryCount++;
    const delay = Math.min(
      state.config.retryDelay! * Math.pow(2, state.retryCount - 1),
      30000 // Max 30 second delay
    );

    silentLogger.silent("Scheduling Firebase listener retry", {
      listenerId,
      retryCount: state.retryCount,
      delay: `${delay}ms`
    });

    setTimeout(() => {
      if (this.listeners.has(listenerId)) {
        this.startListener(listenerId);
      }
    }, delay);
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const retryableErrors = [
      'unavailable',
      'deadline-exceeded',
      'resource-exhausted',
      'aborted',
      'internal',
      'cancelled'
    ];

    const errorMessage = error.message.toLowerCase();
    return retryableErrors.some(retryableError => 
      errorMessage.includes(retryableError)
    );
  }

  /**
   * Remove a Firebase listener
   */
  public removeListener(listenerId: string): boolean {
    const state = this.listeners.get(listenerId);
    if (!state) return false;

    if (state.unsubscribe) {
      state.unsubscribe();
      state.unsubscribe = null;
    }

    state.isActive = false;
    this.listeners.delete(listenerId);

    silentLogger.silent("Firebase listener removed", { listenerId });
    return true;
  }

  /**
   * Get listener status
   */
  public getListenerStatus(listenerId: string): ListenerState | null {
    const state = this.listeners.get(listenerId);
    return state ? { ...state } : null;
  }

  /**
   * Get all active listeners
   */
  public getActiveListeners(): string[] {
    return Array.from(this.listeners.entries())
      .filter(([, state]) => state.isActive)
      .map(([id]) => id);
  }

  /**
   * Get connection metrics
   */
  public getConnectionMetrics(): ConnectionMetrics {
    return { ...this.connectionMetrics };
  }

  /**
   * Force reconnect all listeners
   */
  public async reconnectAllListeners(): Promise<void> {
    const activeListeners = this.getActiveListeners();
    
    silentLogger.silent("Force reconnecting all Firebase listeners", {
      count: activeListeners.length
    });

    for (const listenerId of activeListeners) {
      const state = this.listeners.get(listenerId);
      if (state) {
        state.retryCount = 0; // Reset retry count for force reconnect
        await this.startListener(listenerId);
      }
    }

    this.connectionMetrics.totalReconnects++;
  }

  /**
   * Setup network monitoring
   */
  private setupNetworkMonitoring(): void {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      this.isOnline = true;
      silentLogger.silent("Network online - reconnecting Firebase listeners");
      this.reconnectAllListeners();
    };

    const handleOffline = () => {
      this.isOnline = false;
      this.connectionMetrics.isConnected = false;
      silentLogger.silent("Network offline - Firebase listeners will retry when back online");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial online status
    this.isOnline = navigator.onLine;
  }

  /**
   * Setup connection health check
   */
  private setupConnectionHealthCheck(): void {
    // Check connection health every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 30000);

    // Also perform initial health check
    setTimeout(() => this.performHealthCheck(), 5000);
  }

  /**
   * Setup visibility change handling
   */
  private setupVisibilityChangeHandling(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        silentLogger.silent("Page hidden - Firebase listeners may slow down");
      } else {
        silentLogger.silent("Page visible - checking Firebase listener health");
        setTimeout(() => this.performHealthCheck(), 1000);
      }
    });
  }

  /**
   * Perform connection health check
   */
  private async performHealthCheck(): Promise<void> {
    if (!this.isOnline) return;

    const now = Date.now();
    const staleThreshold = 60000; // 1 minute
    let staleListeners = 0;

    for (const [listenerId, state] of this.listeners.entries()) {
      if (state.isActive && (now - state.lastActivity) > staleThreshold) {
        staleListeners++;
        silentLogger.silent("Detected stale Firebase listener", {
          listenerId,
          lastActivity: `${Math.floor((now - state.lastActivity) / 1000)}s ago`
        });
        
        // Restart stale listener
        this.startListener(listenerId);
      }
    }

    if (staleListeners > 0) {
      prodLogger.warn("Firebase health check found stale listeners", {
        staleCount: staleListeners,
        totalListeners: this.listeners.size
      });
    }

    // Update connection status based on recent activity
    const recentActivity = Array.from(this.listeners.values())
      .some(state => state.isActive && (now - state.lastActivity) < staleThreshold);
    
    this.connectionMetrics.isConnected = recentActivity || this.listeners.size === 0;
  }

  /**
   * Ban/Unban specific helper methods
   */
  public createBanStatusListener(
    uuid: string,
    callback: (status: string, data: any) => void | Promise<void>,
    errorCallback?: (error: Error) => void
  ): string {
    return this.createReliableListener(
      'visitors',
      uuid,
      async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const status = data.status || 'active';
          await callback(status, data);
        }
      },
      {
        errorCallback,
        maxRetries: 10, // More retries for critical ban status
        retryDelay: 1000,
        connectionTimeout: 15000
      }
    );
  }

  /**
   * Cleanup all listeners and intervals
   */
  public cleanup(): void {
    // Remove all listeners
    for (const [listenerId] of this.listeners.entries()) {
      this.removeListener(listenerId);
    }

    // Clear intervals
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    silentLogger.silent("Enterprise Firebase manager cleanup completed");
  }

  /**
   * Utility methods
   */
  private sanitizePath(path: string): string {
    // Remove UUIDs and other sensitive info from paths for logging
    return path.replace(/[a-f0-9-]{36}/gi, '[UUID]');
  }

  /**
   * Get diagnostic information
   */
  public getDiagnostics(): {
    listeners: number;
    activeListeners: number;
    totalErrors: number;
    totalReconnects: number;
    isOnline: boolean;
    connectionMetrics: ConnectionMetrics;
  } {
    return {
      listeners: this.listeners.size,
      activeListeners: this.getActiveListeners().length,
      totalErrors: this.connectionMetrics.errorCount,
      totalReconnects: this.connectionMetrics.totalReconnects,
      isOnline: this.isOnline,
      connectionMetrics: this.getConnectionMetrics()
    };
  }
}

// Convenience functions
export function getFirebaseManager(): EnterpriseFirebaseManager {
  return EnterpriseFirebaseManager.getInstance();
}

export function createBanStatusListener(
  uuid: string,
  callback: (status: string, data: any) => void | Promise<void>,
  errorCallback?: (error: Error) => void
): string {
  const manager = getFirebaseManager();
  return manager.createBanStatusListener(uuid, callback, errorCallback);
}

export function removeBanStatusListener(listenerId: string): boolean {
  const manager = getFirebaseManager();
  return manager.removeListener(listenerId);
}

// Export types
export type { ListenerConfig, ConnectionMetrics, ListenerState };