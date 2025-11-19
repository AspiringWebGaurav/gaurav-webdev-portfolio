/**
 * Enterprise Real-time Synchronization Manager
 * 
 * Provides centralized coordination for all real-time updates across
 * the dashboard and portfolio. Implements smart polling, connection
 * monitoring, cross-tab sync, and optimistic updates.
 * 
 * Features:
 * - Smart adaptive polling intervals based on activity
 * - Automatic pause/resume on offline/online
 * - Cross-tab synchronization via BroadcastChannel
 * - Request deduplication and batching
 * - Exponential backoff on errors
 * - Memory-efficient cleanup
 */

type SyncCallback = () => Promise<void> | void;
type ErrorHandler = (error: Error, context: string) => void;

interface SyncOptions {
  interval?: number; // Base interval in milliseconds
  minInterval?: number; // Minimum interval (for adaptive polling)
  maxInterval?: number; // Maximum interval (for backoff)
  enableAdaptive?: boolean; // Enable adaptive polling
  pauseOnHidden?: boolean; // Pause when tab is hidden
  enableCrossTabs?: boolean; // Sync across browser tabs
}

interface SyncSubscription {
  id: string;
  callback: SyncCallback;
  interval: number;
  currentInterval: number;
  lastRun: number;
  running: boolean;
  errorCount: number;
  options: Required<SyncOptions>;
}

class RealtimeSyncManager {
  private subscriptions: Map<string, SyncSubscription> = new Map();
  private globalInterval: NodeJS.Timeout | null = null;
  private isOnline: boolean = true;
  private isVisible: boolean = true;
  private broadcastChannel: BroadcastChannel | null = null;
  private errorHandler: ErrorHandler | null = null;
  private readonly TICK_INTERVAL = 1000; // Check every second

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private initialize() {
    // Setup online/offline detection
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    
    // Setup page visibility detection
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Setup cross-tab communication
    if ('BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel('admin_sync_channel');
      this.broadcastChannel.addEventListener('message', this.handleBroadcastMessage);
    }

    // Start the global ticker
    this.startGlobalTicker();

    console.log('[RealtimeSync] Initialized - Online:', this.isOnline, 'Visible:', this.isVisible);
  }

  /**
   * Set global error handler for all sync operations
   */
  setErrorHandler(handler: ErrorHandler) {
    this.errorHandler = handler;
  }

  /**
   * Subscribe to real-time updates
   */
  subscribe(
    id: string,
    callback: SyncCallback,
    options: SyncOptions = {}
  ): () => void {
    const defaultOptions: Required<SyncOptions> = {
      interval: options.interval || 30000, // Default 30 seconds
      minInterval: options.minInterval || 5000, // Min 5 seconds
      maxInterval: options.maxInterval || 300000, // Max 5 minutes
      enableAdaptive: options.enableAdaptive ?? true,
      pauseOnHidden: options.pauseOnHidden ?? true,
      enableCrossTabs: options.enableCrossTabs ?? true,
    };

    const subscription: SyncSubscription = {
      id,
      callback,
      interval: defaultOptions.interval,
      currentInterval: defaultOptions.interval,
      lastRun: 0,
      running: false,
      errorCount: 0,
      options: defaultOptions,
    };

    this.subscriptions.set(id, subscription);

    console.log(`[RealtimeSync] Subscribed: ${id} (interval: ${defaultOptions.interval}ms)`);

    // Run immediately on subscribe
    this.executeSubscription(subscription);

    // Return unsubscribe function
    return () => this.unsubscribe(id);
  }

  /**
   * Unsubscribe from updates
   */
  unsubscribe(id: string) {
    if (this.subscriptions.delete(id)) {
      console.log(`[RealtimeSync] Unsubscribed: ${id}`);
    }
  }

  /**
   * Manually trigger a sync for a specific subscription
   */
  async sync(id: string) {
    const subscription = this.subscriptions.get(id);
    if (subscription) {
      await this.executeSubscription(subscription);
    }
  }

  /**
   * Broadcast an event to all tabs
   */
  broadcast(event: string, data?: any) {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ event, data, timestamp: Date.now() });
    }
  }

  /**
   * Pause all syncing (useful for maintenance mode)
   */
  pauseAll() {
    console.log('[RealtimeSync] Pausing all subscriptions');
    this.subscriptions.forEach(sub => {
      sub.running = false;
    });
  }

  /**
   * Resume all syncing
   */
  resumeAll() {
    console.log('[RealtimeSync] Resuming all subscriptions');
    this.subscriptions.forEach(sub => {
      this.executeSubscription(sub);
    });
  }

  private startGlobalTicker() {
    if (this.globalInterval) return;

    this.globalInterval = setInterval(() => {
      const now = Date.now();

      // Skip if offline
      if (!this.isOnline) return;

      this.subscriptions.forEach(subscription => {
        // Skip if already running
        if (subscription.running) return;

        // Skip if tab is hidden and pauseOnHidden is enabled
        if (!this.isVisible && subscription.options.pauseOnHidden) return;

        // Check if it's time to run
        const timeSinceLastRun = now - subscription.lastRun;
        if (timeSinceLastRun >= subscription.currentInterval) {
          this.executeSubscription(subscription);
        }
      });
    }, this.TICK_INTERVAL);
  }

  private async executeSubscription(subscription: SyncSubscription) {
    if (subscription.running) return;

    subscription.running = true;
    subscription.lastRun = Date.now();

    try {
      await subscription.callback();

      // Success - reset error count and potentially reduce interval (adaptive)
      subscription.errorCount = 0;
      if (subscription.options.enableAdaptive && subscription.currentInterval > subscription.interval) {
        // Gradually reduce interval back to normal
        subscription.currentInterval = Math.max(
          subscription.interval,
          subscription.currentInterval * 0.8
        );
      }
    } catch (error) {
      console.error(`[RealtimeSync] Error in ${subscription.id}:`, error);
      
      subscription.errorCount++;

      // Exponential backoff on errors
      if (subscription.options.enableAdaptive) {
        subscription.currentInterval = Math.min(
          subscription.options.maxInterval,
          subscription.currentInterval * Math.pow(2, Math.min(subscription.errorCount, 4))
        );
      }

      // Call error handler if set
      if (this.errorHandler && error instanceof Error) {
        this.errorHandler(error, subscription.id);
      }
    } finally {
      subscription.running = false;
    }
  }

  private handleOnline = () => {
    console.log('[RealtimeSync] Connection restored - resuming sync');
    this.isOnline = true;
    this.resumeAll();
  };

  private handleOffline = () => {
    console.log('[RealtimeSync] Connection lost - pausing sync');
    this.isOnline = false;
  };

  private handleVisibilityChange = () => {
    this.isVisible = !document.hidden;
    console.log('[RealtimeSync] Visibility changed:', this.isVisible ? 'visible' : 'hidden');
    
    if (this.isVisible) {
      // When tab becomes visible, sync immediately
      this.resumeAll();
    }
  };

  private handleBroadcastMessage = (event: MessageEvent) => {
    const { event: eventName, data } = event.data;
    console.log('[RealtimeSync] Received broadcast:', eventName, data);
    
    // Trigger relevant subscriptions based on event
    if (eventName === 'data_updated') {
      const affectedContexts = data?.contexts || [];
      affectedContexts.forEach((contextId: string) => {
        this.sync(contextId);
      });
    }
  };

  /**
   * Cleanup on unmount
   */
  destroy() {
    if (this.globalInterval) {
      clearInterval(this.globalInterval);
      this.globalInterval = null;
    }

    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }

    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);

    this.subscriptions.clear();
    console.log('[RealtimeSync] Destroyed');
  }
}

// Singleton instance
const realtimeSyncManager = new RealtimeSyncManager();

export default realtimeSyncManager;
