/**
 * SMART POLLING ADAPTER
 * 
 * Integrates burn prevention into the existing SmartPolling system.
 * This makes SmartPolling burn-prevention aware without breaking existing code.
 */

import { burnPreventionCore } from '../index';
import smartPolling from '@/lib/smartPolling';

/**
 * Wrap SmartPolling's register method to make it burn-prevention aware
 */
export function integrateSmartPolling() {
  const originalRegister = smartPolling.register.bind(smartPolling);
  const originalSetMode = smartPolling.setMode.bind(smartPolling);

  // Track registered pollers
  const registeredPollers = new Map<string, {
    callback: () => Promise<void> | void;
    priority: 'critical' | 'high' | 'normal' | 'low';
  }>();

  // Override register to add burn prevention awareness
  smartPolling.register = function(id: string, callback: any, options: any = {}) {
    const priority = options.priority || 'normal';
    const intervals = options.intervals || {};
    const baseInterval = intervals.active || intervals.realtime || 10000;

    // Store for reference
    registeredPollers.set(id, { callback, priority });

    // Register with burn prevention
    burnPreventionCore.registerExecution({
      id: `smartpoll-${id}`,
      type: 'poll',
      name: `SmartPoll: ${options.tag || id}`,
      frequency: baseInterval,
      lastExecution: 0,
      executionCount: 0,
      averageExecutionTime: 0,
      isRunning: true,
      criticality: priority,
      owner: options.tag?.includes('admin') || id.includes('admin') ? 'admin' : 'visitor',
      canPause: true,
      canThrottle: true,
    });

    // Wrap the callback to integrate with burn prevention
    const wrappedCallback = async () => {
      const executionId = `smartpoll-${id}`;
      
      // Check if should execute
      if (!burnPreventionCore.shouldExecute(executionId)) {
        console.log(`[SmartPolling] ⏸️ Skipping ${id} - paused by burn prevention`);
        return;
      }

      const startTime = Date.now();
      
      try {
        await callback();
      } finally {
        const duration = Date.now() - startTime;
        burnPreventionCore.recordExecution(executionId, duration);
      }
    };

    // Call original register with wrapped callback
    originalRegister(id, wrappedCallback, options);
  };

  // Monitor mode changes
  const checkAndApplyControl = () => {
    const metrics = burnPreventionCore.getMetrics();
    
    registeredPollers.forEach((poller, id) => {
      const executionId = `smartpoll-${id}`;
      const state = burnPreventionCore.getControlState(executionId);
      
      if (state?.isPaused && poller.priority !== 'critical') {
        // Pause in SmartPolling
        smartPolling.stop(id);
      } else if (state?.isThrottled) {
        // Adjust mode based on throttle ratio
        if (state.throttleRatio > 5) {
          originalSetMode(id, 'background');
        } else if (state.throttleRatio > 2) {
          originalSetMode(id, 'idle');
        }
      } else if (metrics.mode === 'active') {
        // Ensure active pollers are running
        smartPolling.start(id);
      }
    });
  };

  // Check periodically
  setInterval(checkAndApplyControl, 15000); // Every 15 seconds

  console.log('[SmartPolling] ✅ Integrated with Burn Prevention System');
}
