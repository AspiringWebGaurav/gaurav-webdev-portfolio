/**
 * ABUSE POLICY MANAGER
 * 
 * Enforces temporary 2-minute ban after 3 consecutive failed login attempts.
 * 
 * Architecture:
 * - Client-side state management (sessionStorage for persistence)
 * - Deterministic timestamp-based expiration
 * - Zero Firebase/API calls (pure client-side)
 * - Survives page reloads, navigation, tab switches
 * - Self-correcting countdown logic
 * 
 * Design Philosophy:
 * - Matches existing gate pattern (BanGate, SuspensionGate, MaintenanceGate)
 * - Zero overhead when not active
 * - Instant unlock when ban expires
 * - No race conditions or stale state
 */

const STORAGE_KEY = 'abuse_policy_state';
const MAX_ATTEMPTS = 3;
const BAN_DURATION_MS = 2 * 60 * 1000; // 2 minutes

export interface AbusePolicyState {
  failedAttempts: number;
  isBanned: boolean;
  banStartTime: number | null;
  banExpiresAt: number | null;
}

class AbusePolicyManager {
  private listeners: Set<(state: AbusePolicyState) => void> = new Set();
  private cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * Get current abuse policy state
   * Always checks expiration to prevent stale bans
   */
  getState(): AbusePolicyState {
    if (typeof window === 'undefined') {
      return this.getDefaultState();
    }

    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return this.getDefaultState();
      }

      const state: AbusePolicyState = JSON.parse(stored);
      
      // Auto-expire check: If ban expired, reset state
      if (state.isBanned && state.banExpiresAt && Date.now() >= state.banExpiresAt) {
        console.log('[Abuse Policy] Ban expired, auto-resetting state');
        const resetState = this.getDefaultState();
        this.saveState(resetState);
        return resetState;
      }

      return state;
    } catch (error) {
      console.error('[Abuse Policy] Failed to load state:', error);
      return this.getDefaultState();
    }
  }

  /**
   * Record a failed login attempt
   * Returns true if abuse policy activated (ban triggered)
   */
  recordFailedAttempt(): boolean {
    const state = this.getState();
    
    console.log('[Abuse Policy Manager] Recording failed attempt. Current state:', {
      failedAttempts: state.failedAttempts,
      isBanned: state.isBanned,
    });
    
    // If already banned, ignore additional failures
    if (state.isBanned) {
      console.log('[Abuse Policy] Already banned, ignoring failed attempt');
      return true;
    }

    state.failedAttempts += 1;
    console.log(`[Abuse Policy] Failed attempt #${state.failedAttempts}/${MAX_ATTEMPTS}`);

    // Check if threshold reached
    if (state.failedAttempts >= MAX_ATTEMPTS) {
      const now = Date.now();
      state.isBanned = true;
      state.banStartTime = now;
      state.banExpiresAt = now + BAN_DURATION_MS;
      
      console.log(`[Abuse Policy] ⛔ ABUSE POLICY ACTIVATED - Ban until ${new Date(state.banExpiresAt).toLocaleTimeString()}`);
      console.log('[Abuse Policy] Ban state:', {
        banStartTime: new Date(state.banStartTime).toISOString(),
        banExpiresAt: new Date(state.banExpiresAt).toISOString(),
        durationMs: BAN_DURATION_MS,
        durationSeconds: BAN_DURATION_MS / 1000,
      });
      
      this.saveState(state);
      this.notifyListeners(state);
      this.startCleanupTimer();
      return true;
    }

    this.saveState(state);
    this.notifyListeners(state);
    return false;
  }

  /**
   * Record a successful login
   * Resets failed attempt counter
   */
  recordSuccessfulLogin(): void {
    const state = this.getState();
    
    // Only reset if not banned
    if (!state.isBanned) {
      console.log('[Abuse Policy] Login successful, resetting attempt counter');
      const resetState = this.getDefaultState();
      this.saveState(resetState);
      this.notifyListeners(resetState);
    }
  }

  /**
   * Check if currently banned
   * Includes real-time expiration check
   */
  isBanned(): boolean {
    const state = this.getState();
    return state.isBanned && state.banExpiresAt !== null && Date.now() < state.banExpiresAt;
  }

  /**
   * Get remaining ban time in milliseconds
   * Returns 0 if not banned or ban expired
   */
  getRemainingTime(): number {
    const state = this.getState();
    
    if (!state.isBanned || !state.banExpiresAt) {
      return 0;
    }

    const remaining = state.banExpiresAt - Date.now();
    return Math.max(0, remaining);
  }

  /**
   * Force reset (admin override or testing)
   */
  reset(): void {
    console.log('[Abuse Policy] Manual reset triggered');
    const resetState = this.getDefaultState();
    this.saveState(resetState);
    this.notifyListeners(resetState);
    this.stopCleanupTimer();
  }

  /**
   * Subscribe to state changes
   * Returns unsubscribe function
   */
  subscribe(callback: (state: AbusePolicyState) => void): () => void {
    this.listeners.add(callback);
    
    // Immediately call with current state
    callback(this.getState());
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Start cleanup timer to auto-reset when ban expires
   */
  private startCleanupTimer(): void {
    if (this.cleanupInterval) {
      return; // Already running
    }

    const remaining = this.getRemainingTime();
    if (remaining <= 0) {
      return;
    }

    // Schedule cleanup slightly after expiration
    this.cleanupInterval = setTimeout(() => {
      console.log('[Abuse Policy] Cleanup timer fired - checking expiration');
      const state = this.getState(); // This will auto-reset if expired
      this.notifyListeners(state);
      this.cleanupInterval = null;
    }, remaining + 100); // +100ms buffer
  }

  /**
   * Stop cleanup timer
   */
  private stopCleanupTimer(): void {
    if (this.cleanupInterval) {
      clearTimeout(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Notify all subscribers of state change
   */
  private notifyListeners(state: AbusePolicyState): void {
    this.listeners.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('[Abuse Policy] Listener error:', error);
      }
    });
  }

  /**
   * Save state to sessionStorage
   */
  private saveState(state: AbusePolicyState): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('[Abuse Policy] Failed to save state:', error);
    }
  }

  /**
   * Get default/reset state
   */
  private getDefaultState(): AbusePolicyState {
    return {
      failedAttempts: 0,
      isBanned: false,
      banStartTime: null,
      banExpiresAt: null,
    };
  }
}

// Singleton instance
export const abusePolicyManager = new AbusePolicyManager();
