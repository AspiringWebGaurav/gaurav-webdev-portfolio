/**
 * EXECUTION CONTROLLER - The Hands That Shape Behavior
 * 
 * This is the enforcement layer. It takes recommendations from ActivityIntelligence
 * and actually reshapes execution in the running system.
 * 
 * This is where decisions become actions.
 */

import { runtimeObserver, ExecutionObservation } from './RuntimeObserver';
import { activityIntelligence, ExecutionRecommendation } from './ActivityIntelligence';

export interface ControlledExecution {
  id: string;
  originalInterval: number;
  currentInterval: number;
  isThrottled: boolean;
  isPaused: boolean;
  throttleRatio: number;
  lastAdjustment: number;
  adjustmentHistory: Array<{
    timestamp: number;
    action: 'throttle' | 'pause' | 'resume' | 'reset';
    from: number;
    to: number;
    reason: string;
  }>;
}

type ControlCallback = () => void;

class ExecutionController {
  private controlled: Map<string, ControlledExecution> = new Map();
  private callbacks: Map<string, ControlCallback> = new Map();
  private isActive = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private initialize() {
    console.log('[ExecutionController] 🎮 Controller initializing...');
    this.isActive = true;

    // Apply recommendations periodically
    setInterval(() => {
      this.applyRecommendations();
    }, 30000); // Every 30 seconds

    // Initial application
    setTimeout(() => this.applyRecommendations(), 5000); // After 5 seconds
  }

  /**
   * Register an execution for control
   */
  register(id: string, originalInterval: number, callback: ControlCallback): void {
    if (!this.controlled.has(id)) {
      this.controlled.set(id, {
        id,
        originalInterval,
        currentInterval: originalInterval,
        isThrottled: false,
        isPaused: false,
        throttleRatio: 1.0,
        lastAdjustment: Date.now(),
        adjustmentHistory: [],
      });

      this.callbacks.set(id, callback);
      
      console.log(`[ExecutionController] 📝 Registered for control: ${id} (${originalInterval}ms)`);
    }
  }

  /**
   * Unregister an execution
   */
  unregister(id: string): void {
    this.controlled.delete(id);
    this.callbacks.delete(id);
    console.log(`[ExecutionController] 🗑️ Unregistered: ${id}`);
  }

  /**
   * Get current state of a controlled execution
   */
  getState(id: string): ControlledExecution | undefined {
    return this.controlled.get(id);
  }

  /**
   * Apply current recommendations from ActivityIntelligence
   */
  private applyRecommendations(): void {
    if (!this.isActive) return;

    const recommendation = activityIntelligence.analyzeAndRecommend();
    
    if (recommendation.recommendedActions.length === 0) {
      // No actions needed - possibly restore defaults if in recovery
      this.considerRestoration();
      return;
    }

    console.log('[ExecutionController] 🎯 Applying recommendations:', recommendation.recommendedActions.length);

    for (const action of recommendation.recommendedActions) {
      this.applyAction(action);
    }
  }

  /**
   * Apply a single recommended action
   */
  private applyAction(recommendation: ExecutionRecommendation): void {
    const controlled = this.controlled.get(recommendation.executionId);
    if (!controlled) return;

    const now = Date.now();
    const timeSinceLastAdjustment = now - controlled.lastAdjustment;
    
    // Don't adjust too frequently (minimum 10 seconds between adjustments)
    if (timeSinceLastAdjustment < 10000) {
      return;
    }

    switch (recommendation.action) {
      case 'throttle':
        this.throttle(controlled, recommendation.targetInterval!, recommendation.reason);
        break;
      case 'pause':
        this.pause(controlled, recommendation.reason);
        break;
      case 'stop':
        this.stop(controlled, recommendation.reason);
        break;
      case 'continue':
        // Check if we need to restore
        if (controlled.isThrottled || controlled.isPaused) {
          this.restore(controlled, 'Activity resumed');
        }
        break;
    }
  }

  /**
   * Throttle an execution (slow it down)
   */
  private throttle(controlled: ControlledExecution, targetInterval: number, reason: string): void {
    const oldInterval = controlled.currentInterval;
    
    // Gradual throttling - don't jump immediately to target
    const maxJump = controlled.originalInterval * 2; // Max 2x at once
    const newInterval = Math.min(targetInterval, controlled.currentInterval + maxJump);

    if (newInterval === controlled.currentInterval) {
      return; // No change needed
    }

    controlled.currentInterval = newInterval;
    controlled.isThrottled = true;
    controlled.throttleRatio = newInterval / controlled.originalInterval;
    controlled.lastAdjustment = Date.now();

    controlled.adjustmentHistory.push({
      timestamp: Date.now(),
      action: 'throttle',
      from: oldInterval,
      to: newInterval,
      reason,
    });

    // Notify via callback
    const callback = this.callbacks.get(controlled.id);
    if (callback) {
      callback();
    }

    console.log(`[ExecutionController] 🐌 Throttled ${controlled.id}: ${oldInterval}ms → ${newInterval}ms (${controlled.throttleRatio.toFixed(1)}x)`);
    console.log(`[ExecutionController]    Reason: ${reason}`);
  }

  /**
   * Pause an execution
   */
  private pause(controlled: ControlledExecution, reason: string): void {
    if (controlled.isPaused) return;

    const oldInterval = controlled.currentInterval;
    
    controlled.isPaused = true;
    controlled.lastAdjustment = Date.now();

    controlled.adjustmentHistory.push({
      timestamp: Date.now(),
      action: 'pause',
      from: oldInterval,
      to: 0,
      reason,
    });

    // Notify via callback
    const callback = this.callbacks.get(controlled.id);
    if (callback) {
      callback();
    }

    console.log(`[ExecutionController] ⏸️ Paused ${controlled.id}`);
    console.log(`[ExecutionController]    Reason: ${reason}`);
  }

  /**
   * Stop an execution permanently
   */
  private stop(controlled: ControlledExecution, reason: string): void {
    this.pause(controlled, reason);
    console.log(`[ExecutionController] 🛑 Stopped ${controlled.id} (permanent)`);
  }

  /**
   * Restore an execution to normal
   */
  private restore(controlled: ControlledExecution, reason: string): void {
    if (!controlled.isThrottled && !controlled.isPaused) return;

    const oldInterval = controlled.currentInterval;
    
    // Gradual restoration - don't jump immediately to original
    let newInterval = controlled.currentInterval;
    
    if (controlled.isPaused) {
      // Resume from pause - start at 2x original
      newInterval = controlled.originalInterval * 2;
    } else {
      // Gradually speed up - reduce by 30%
      newInterval = Math.max(controlled.originalInterval, controlled.currentInterval * 0.7);
    }

    controlled.currentInterval = newInterval;
    controlled.isPaused = false;
    controlled.isThrottled = newInterval !== controlled.originalInterval;
    controlled.throttleRatio = newInterval / controlled.originalInterval;
    controlled.lastAdjustment = Date.now();

    controlled.adjustmentHistory.push({
      timestamp: Date.now(),
      action: 'resume',
      from: oldInterval,
      to: newInterval,
      reason,
    });

    // Notify via callback
    const callback = this.callbacks.get(controlled.id);
    if (callback) {
      callback();
    }

    console.log(`[ExecutionController] ▶️ Restored ${controlled.id}: ${oldInterval}ms → ${newInterval}ms`);
    console.log(`[ExecutionController]    Reason: ${reason}`);
  }

  /**
   * Consider restoration for all controlled executions
   */
  private considerRestoration(): void {
    const systemState = runtimeObserver.getSystemState();
    
    // If system is active, restore everything
    if (systemState.mode === 'active') {
      let restoredCount = 0;
      
      this.controlled.forEach((controlled) => {
        if (controlled.isThrottled || controlled.isPaused) {
          this.restore(controlled, 'System returned to active mode');
          restoredCount++;
        }
      });

      if (restoredCount > 0) {
        console.log(`[ExecutionController] 🔄 Restored ${restoredCount} executions`);
      }
    }
  }

  /**
   * Force restore all executions to original state
   */
  forceRestoreAll(reason: string = 'Manual restoration'): void {
    console.log(`[ExecutionController] 🔄 Force restoring all executions: ${reason}`);
    
    this.controlled.forEach((controlled) => {
      controlled.currentInterval = controlled.originalInterval;
      controlled.isThrottled = false;
      controlled.isPaused = false;
      controlled.throttleRatio = 1.0;
      controlled.lastAdjustment = Date.now();

      controlled.adjustmentHistory.push({
        timestamp: Date.now(),
        action: 'reset',
        from: controlled.currentInterval,
        to: controlled.originalInterval,
        reason,
      });

      // Notify via callback
      const callback = this.callbacks.get(controlled.id);
      if (callback) {
        callback();
      }
    });
  }

  /**
   * Get statistics about current control state
   */
  getStatistics(): {
    total: number;
    throttled: number;
    paused: number;
    normal: number;
    averageThrottleRatio: number;
  } {
    let throttled = 0;
    let paused = 0;
    let normal = 0;
    let totalRatio = 0;

    this.controlled.forEach((controlled) => {
      if (controlled.isPaused) {
        paused++;
      } else if (controlled.isThrottled) {
        throttled++;
        totalRatio += controlled.throttleRatio;
      } else {
        normal++;
        totalRatio += 1.0;
      }
    });

    return {
      total: this.controlled.size,
      throttled,
      paused,
      normal,
      averageThrottleRatio: this.controlled.size > 0 ? totalRatio / this.controlled.size : 1.0,
    };
  }

  /**
   * Generate a control report
   */
  generateReport(): string {
    const stats = this.getStatistics();
    const controlled = Array.from(this.controlled.values());

    const lines = [
      '═══════════════════════════════════════════════════════',
      '🎮 EXECUTION CONTROLLER REPORT',
      '═══════════════════════════════════════════════════════',
      '',
      `📊 Total Controlled: ${stats.total}`,
      `🐌 Throttled: ${stats.throttled}`,
      `⏸️ Paused: ${stats.paused}`,
      `▶️ Normal: ${stats.normal}`,
      `📉 Avg Throttle: ${stats.averageThrottleRatio.toFixed(2)}x`,
      '',
      '⚙️ Controlled Executions:',
    ];

    controlled.forEach((c) => {
      let status = '▶️';
      if (c.isPaused) status = '⏸️';
      else if (c.isThrottled) status = '🐌';

      lines.push(`  ${status} ${c.id}`);
      lines.push(`     Original: ${c.originalInterval}ms | Current: ${c.currentInterval}ms (${c.throttleRatio.toFixed(2)}x)`);
      
      if (c.adjustmentHistory.length > 0) {
        const lastAdjustment = c.adjustmentHistory[c.adjustmentHistory.length - 1];
        lines.push(`     Last: ${lastAdjustment.action} - ${lastAdjustment.reason}`);
      }
    });

    lines.push('');
    lines.push('═══════════════════════════════════════════════════════');

    return lines.join('\n');
  }
}

// Singleton instance
export const executionController = new ExecutionController();
