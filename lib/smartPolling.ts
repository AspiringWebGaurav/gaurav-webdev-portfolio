/**
 * Smart Polling Manager - Ultra-Optimized Edition
 * Enterprise-grade adaptive polling with intelligent optimizations
 * 
 * Features:
 * - Adaptive intervals with exponential backoff
 * - Page visibility detection with instant resume
 * - Activity-based acceleration
 * - Smart batching and debouncing
 * - Network-aware polling
 * - Priority-based scheduling
 */

import logger from './logger';

type PollingCallback = () => Promise<void> | void;
type IntervalMode = 'realtime' | 'active' | 'idle' | 'background' | 'paused';
type Priority = 'critical' | 'high' | 'normal' | 'low';

interface PollingOptions {
  intervals?: {
    realtime?: number;
    active?: number;
    idle?: number;
    background?: number;
  };
  priority?: Priority;
  maxIdleTime?: number;
  stopOnHidden?: boolean;
  stopOnIdle?: boolean; // NEW: Stop completely when user is idle
  enableBatching?: boolean;
  tag?: string;
}

interface PollerState {
  callback: PollingCallback;
  interval: NodeJS.Timeout | null;
  mode: IntervalMode;
  options: Required<PollingOptions>;
  lastActivity: number;
  lastPoll: number;
  isRunning: boolean;
  errorCount: number;
  priority: Priority;
}

class SmartPollingManager {
  private timers: Map<string, PollerState> = new Map();
  private documentVisible: boolean = true;
  private lastUserActivity: number = Date.now();
  private activityCheckInterval: NodeJS.Timeout | null = null;
  private isOnline: boolean = true;
  private batchQueue: Map<string, () => Promise<void>> = new Map();
  private batchTimer: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupVisibilityListeners();
      this.setupActivityListeners();
      this.setupNetworkListeners();
      this.startActivityMonitor();
    }
  }

  /**
   * Setup page visibility with instant resume
   */
  private setupVisibilityListeners() {
    document.addEventListener('visibilitychange', () => {
      const wasHidden = !this.documentVisible;
      this.documentVisible = !document.hidden;
      
      logger.debug('[SmartPolling] 👁️ Visibility:', this.documentVisible ? 'VISIBLE' : 'HIDDEN');
      
      if (wasHidden && this.documentVisible) {
        // Tab became visible - instant poll all critical pollers
        logger.debug('[SmartPolling] ⚡ Tab focused - instant poll');
        this.timers.forEach((timer, id) => {
          if (timer.priority === 'critical' || timer.priority === 'high') {
            this.trigger(id);
          }
        });
      }
      
      this.updateAllPollers();
    });

    window.addEventListener('focus', () => {
      this.lastUserActivity = Date.now();
      logger.debug('[SmartPolling] 🎯 Window focused');
      // Instant poll on focus
      this.timers.forEach((timer, id) => {
        if (timer.priority === 'critical') {
          this.trigger(id);
        }
      });
      this.updateAllPollers();
    });

    window.addEventListener('blur', () => {
      logger.debug('[SmartPolling] 💤 Window blurred');
    });
  }

  /**
   * Track user activity with debouncing
   */
  private setupActivityListeners() {
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    let activityTimeout: NodeJS.Timeout | null = null;

    const updateActivity = () => {
      this.lastUserActivity = Date.now();
      
      // Debounce activity updates
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
      
      activityTimeout = setTimeout(() => {
        // After 5s of no activity, check if we should slow down
        const timeSinceActivity = Date.now() - this.lastUserActivity;
        if (timeSinceActivity > 5000) {
          this.updateAllPollers();
        }
      }, 5000);
    };

    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });
  }

  /**
   * Network status monitoring
   */
  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      logger.debug('[SmartPolling] 🌐 Network ONLINE - resuming');
      // Instant poll all when back online
      this.timers.forEach((_, id) => this.trigger(id));
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      logger.debug('[SmartPolling] 📡 Network OFFLINE - pausing');
      this.updateAllPollers();
    });
  }

  /**
   * Activity monitor with smart adjustments
   */
  private startActivityMonitor() {
    this.activityCheckInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = now - this.lastUserActivity;

      // Auto-adjust based on prolonged inactivity
      if (timeSinceActivity > 300000) { // 5 minutes
        // Super idle - slow down everything
        this.timers.forEach((timer, id) => {
          if (timer.mode !== 'paused' && timer.mode !== 'background') {
            timer.mode = 'idle';
          }
        });
      }

      this.updateAllPollers();
    }, 15000); // Check every 15 seconds
  }

  /**
   * Register with priority support
   */
  register(
    id: string,
    callback: PollingCallback,
    options: PollingOptions = {}
  ): void {
    const priority = options.priority || 'normal';
    
    const fullOptions: Required<PollingOptions> = {
      intervals: {
        realtime: options.intervals?.realtime ?? (priority === 'critical' ? 2000 : 3000),
        active: options.intervals?.active ?? (priority === 'critical' ? 5000 : 10000),
        idle: options.intervals?.idle ?? 30000,
        background: options.intervals?.background ?? 60000,
      },
      priority,
      maxIdleTime: options.maxIdleTime ?? 45000,
      stopOnHidden: options.stopOnHidden ?? (priority === 'low'),
      stopOnIdle: options.stopOnIdle ?? false, // NEW: Default to keep polling when idle unless specified
      enableBatching: options.enableBatching ?? false,
      tag: options.tag ?? id,
    };

    if (this.timers.has(id)) {
      this.unregister(id);
    }

    this.timers.set(id, {
      callback,
      interval: null,
      mode: 'active',
      options: fullOptions,
      lastActivity: Date.now(),
      lastPoll: 0,
      isRunning: false,
      errorCount: 0,
      priority,
    });

    this.start(id);
    logger.debug(`[SmartPolling] ✅ Registered: ${fullOptions.tag} (${priority} priority)`);
  }

  /**
   * Start with immediate first poll
   */
  start(id: string): void {
    const timer = this.timers.get(id);
    if (!timer || timer.isRunning) return;

    timer.isRunning = true;
    
    // Immediate first poll for critical/high priority
    if (timer.priority === 'critical' || timer.priority === 'high') {
      this.trigger(id);
    }
    
    this.updatePoller(id);
  }

  stop(id: string): void {
    const timer = this.timers.get(id);
    if (!timer) return;

    if (timer.interval) {
      clearInterval(timer.interval);
      timer.interval = null;
    }
    timer.isRunning = false;
    timer.mode = 'paused';
    logger.debug(`[SmartPolling] ⏸️ Stopped: ${timer.options.tag}`);
  }

  unregister(id: string): void {
    this.stop(id);
    this.timers.delete(id);
    this.batchQueue.delete(id);
  }

  /**
   * Trigger immediate poll with smart deduplication
   */
  async trigger(id: string): Promise<void> {
    const timer = this.timers.get(id);
    if (!timer) return;

    const now = Date.now();
    const timeSinceLastPoll = now - timer.lastPoll;

    // Debounce rapid triggers (prevent spam)
    if (timeSinceLastPoll < 1000) {
      console.log(`[SmartPolling] ⏭️ Debounced: ${timer.options.tag}`);
      return;
    }

    timer.lastActivity = Date.now();
    timer.lastPoll = now;

    try {
      await timer.callback();
      timer.errorCount = 0; // Reset on success
    } catch (error) {
      timer.errorCount++;
      console.error(`[SmartPolling] ❌ Error in ${timer.options.tag}:`, error);
      
      // Exponential backoff on errors
      if (timer.errorCount > 3) {
        console.warn(`[SmartPolling] ⚠️ Too many errors, slowing down: ${timer.options.tag}`);
        timer.mode = 'idle';
      }
    }

    this.updatePoller(id);
  }

  /**
   * Set mode with validation
   */
  setMode(id: string, mode: IntervalMode): void {
    const timer = this.timers.get(id);
    if (!timer) return;

    // Don't override if offline
    if (!this.isOnline && mode !== 'paused') {
      return;
    }

    if (timer.mode !== mode) {
      const oldMode = timer.mode;
      timer.mode = mode;
      timer.lastActivity = Date.now();
      this.updatePoller(id);
      console.log(`[SmartPolling] 🔄 ${timer.options.tag}: ${oldMode} → ${mode}`);
    }
  }

  /**
   * Boost priority temporarily (e.g., during active chat)
   */
  boost(id: string, duration: number = 30000): void {
    const timer = this.timers.get(id);
    if (!timer) return;

    const originalMode = timer.mode;
    this.setMode(id, 'realtime');

    setTimeout(() => {
      if (timer.mode === 'realtime') {
        this.setMode(id, originalMode);
      }
    }, duration);

    console.log(`[SmartPolling] 🚀 Boosted: ${timer.options.tag} for ${duration}ms`);
  }

  /**
   * Smart poller update with priority scheduling
   */
  private updatePoller(id: string): void {
    const timer = this.timers.get(id);
    if (!timer || !timer.isRunning) return;

    if (timer.interval) {
      clearInterval(timer.interval);
      timer.interval = null;
    }

    // Offline - pause all
    if (!this.isOnline) {
      timer.mode = 'paused';
      console.log(`[SmartPolling] 📡 ${timer.options.tag} paused (offline)`);
      return;
    }

    // Determine mode based on context
    let currentMode = timer.mode;
    const timeSinceActivity = Date.now() - timer.lastActivity;
    const isUserIdle = timeSinceActivity > timer.options.maxIdleTime;

    if (currentMode !== 'realtime' && currentMode !== 'paused') {
      // Tab hidden - STOP if configured
      if (!this.documentVisible && timer.options.stopOnHidden) {
        timer.mode = 'paused';
        console.log(`[SmartPolling] 💤 ${timer.options.tag} STOPPED (tab hidden, stopOnHidden=true) - SAVING COSTS 💰`);
        return; // Don't restart interval
      }
      
      // User idle - STOP if configured
      if (isUserIdle && timer.options.stopOnIdle) {
        timer.mode = 'paused';
        console.log(`[SmartPolling] 😴 ${timer.options.tag} STOPPED (user idle ${Math.round(timeSinceActivity/1000)}s, stopOnIdle=true) - SAVING COSTS 💰`);
        return; // Don't restart interval
      }
      
      // Tab hidden but still polling
      if (!this.documentVisible) {
        currentMode = 'background';
      }
      // User idle
      else if (isUserIdle) {
        currentMode = 'idle';
      }
      // Active
      else {
        currentMode = 'active';
      }
    }

    const interval = timer.options.intervals[currentMode as keyof typeof timer.options.intervals] || timer.options.intervals.active;

    // Priority-based interval adjustment
    let adjustedInterval = interval;
    if (timer.priority === 'critical' && currentMode === 'realtime') {
      adjustedInterval = Math.max(interval * 0.8, 1000); // 20% faster for critical
    } else if (timer.priority === 'low') {
      adjustedInterval = interval * 1.5; // 50% slower for low priority
    }

    // Error-based backoff
    if (timer.errorCount > 0) {
      adjustedInterval *= Math.min(2 ** timer.errorCount, 4); // Max 4x slower
    }

    timer.interval = setInterval(async () => {
      const now = Date.now();
      timer.lastPoll = now;
      
      try {
        await timer.callback();
        timer.errorCount = 0;
      } catch (error) {
        timer.errorCount++;
        console.error(`[SmartPolling] ❌ ${timer.options.tag}:`, error);
      }
    }, adjustedInterval);

    console.log(
      `[SmartPolling] ⚙️ ${timer.options.tag}: ${currentMode} @ ${adjustedInterval}ms (${timer.priority})`
    );
  }

  private updateAllPollers(): void {
    this.timers.forEach((_, id) => this.updatePoller(id));
  }

  /**
   * Get comprehensive stats
   */
  getStats(): Record<string, any> {
    const stats: Record<string, any> = {
      documentVisible: this.documentVisible,
      isOnline: this.isOnline,
      lastUserActivity: new Date(this.lastUserActivity).toISOString(),
      timeSinceActivity: Date.now() - this.lastUserActivity,
      pollers: {},
    };

    this.timers.forEach((timer, id) => {
      stats.pollers[id] = {
        tag: timer.options.tag,
        mode: timer.mode,
        priority: timer.priority,
        running: timer.isRunning,
        errors: timer.errorCount,
        lastPoll: timer.lastPoll > 0 ? new Date(timer.lastPoll).toISOString() : 'never',
        timeSinceLastPoll: timer.lastPoll > 0 ? Date.now() - timer.lastPoll : null,
      };
    });

    return stats;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.timers.forEach((_, id) => this.unregister(id));
    
    if (this.activityCheckInterval) {
      clearInterval(this.activityCheckInterval);
    }
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }
  }
}

const smartPolling = new SmartPollingManager();

/**
 * Initialize smart polling cleanup and debug tools
 * TURBOPACK-SAFE: Call from client component, not at module-level
 */
export function initializeSmartPolling(): void {
  if (typeof window === 'undefined') return;
  
  window.addEventListener('beforeunload', () => smartPolling.destroy());
  
  // Debug helper
  (window as any).__pollStats = () => console.table(smartPolling.getStats().pollers);
}

export default smartPolling;
