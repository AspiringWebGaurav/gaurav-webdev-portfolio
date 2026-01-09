/**
 * INTERVAL ADAPTER
 * 
 * Wraps setInterval calls with burn prevention awareness.
 * This ensures all background intervals respect the burn prevention system.
 */

import { burnPreventionCore } from '../index';

interface IntervalOptions {
  id: string;
  criticality?: 'critical' | 'high' | 'normal' | 'low';
  owner?: 'admin' | 'visitor' | 'system';
  description?: string;
  canPause?: boolean;
  canThrottle?: boolean;
}

/**
 * Burn-prevention aware setInterval
 */
export function burnAwareInterval(
  callback: () => void | Promise<void>,
  intervalMs: number,
  options: IntervalOptions
): () => void {
  const executionId = `interval-${options.id}`;
  let intervalHandle: NodeJS.Timeout | null = null;
  let currentInterval = intervalMs;
  let isRunning = false;

  // Register with burn prevention
  burnPreventionCore.registerExecution({
    id: executionId,
    type: 'interval',
    name: options.description || options.id,
    frequency: intervalMs,
    lastExecution: 0,
    executionCount: 0,
    averageExecutionTime: 0,
    isRunning: true,
    criticality: options.criticality || 'normal',
    owner: options.owner || 'system',
    canPause: options.canPause ?? true,
    canThrottle: options.canThrottle ?? true,
  });

  // Wrapped callback with burn prevention checks
  const wrappedCallback = async () => {
    // Check if should execute
    if (!burnPreventionCore.shouldExecute(executionId)) {
      return;
    }

    const startTime = Date.now();
    
    try {
      await callback();
    } catch (error) {
      console.error(`[BurnAwareInterval] Error in ${options.id}:`, error);
    } finally {
      const duration = Date.now() - startTime;
      burnPreventionCore.recordExecution(executionId, duration);
    }

    // Check if interval needs adjustment
    checkAndAdjust();
  };

  // Function to start the interval
  const start = () => {
    if (isRunning) return;
    
    intervalHandle = setInterval(wrappedCallback, currentInterval);
    isRunning = true;
    console.log(`[BurnAwareInterval] ▶️ Started ${options.id} (${currentInterval}ms)`);
  };

  // Function to stop the interval
  const stop = () => {
    if (!isRunning) return;
    
    if (intervalHandle) {
      clearInterval(intervalHandle);
      intervalHandle = null;
    }
    isRunning = false;
    console.log(`[BurnAwareInterval] ⏸️ Stopped ${options.id}`);
  };

  // Function to adjust interval based on control state
  const checkAndAdjust = () => {
    const state = burnPreventionCore.getControlState(executionId);
    
    if (!state) return;

    // If paused, stop
    if (state.isPaused && isRunning) {
      stop();
      return;
    }

    // If not running and not paused, start
    if (!state.isPaused && !isRunning) {
      start();
      return;
    }

    // If interval changed, restart with new interval
    if (state.currentInterval !== currentInterval && isRunning) {
      stop();
      currentInterval = state.currentInterval;
      start();
    }
  };

  // Start initially
  start();

  // Monitor control state periodically
  const monitorInterval = setInterval(checkAndAdjust, 15000); // Check every 15 seconds

  // Return cleanup function
  return () => {
    clearInterval(monitorInterval);
    stop();
    burnPreventionCore.unregisterExecution(executionId);
  };
}

/**
 * Helper for admin intervals
 */
export function adminInterval(
  callback: () => void | Promise<void>,
  intervalMs: number,
  description: string
): () => void {
  return burnAwareInterval(callback, intervalMs, {
    id: `admin-${description.toLowerCase().replace(/\s+/g, '-')}`,
    criticality: 'high',
    owner: 'admin',
    description,
    canPause: true,
    canThrottle: true,
  });
}

/**
 * Helper for visitor intervals
 */
export function visitorInterval(
  callback: () => void | Promise<void>,
  intervalMs: number,
  description: string
): () => void {
  return burnAwareInterval(callback, intervalMs, {
    id: `visitor-${description.toLowerCase().replace(/\s+/g, '-')}`,
    criticality: 'normal',
    owner: 'visitor',
    description,
    canPause: true,
    canThrottle: true,
  });
}

/**
 * Helper for critical system intervals (never pause/throttle)
 */
export function criticalInterval(
  callback: () => void | Promise<void>,
  intervalMs: number,
  description: string
): () => void {
  return burnAwareInterval(callback, intervalMs, {
    id: `critical-${description.toLowerCase().replace(/\s+/g, '-')}`,
    criticality: 'critical',
    owner: 'system',
    description,
    canPause: false,
    canThrottle: false,
  });
}

console.log('[IntervalAdapter] ✅ Burn Prevention Interval Adapter loaded');
