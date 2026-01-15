/**
 * BURN PREVENTION CORE - The System's Nervous System
 * 
 * This is the main entry point that connects all the burn prevention components.
 * It acts as the central nervous system, coordinating observation, intelligence,
 * and control.
 * 
 * This is what makes the system self-aware.
 */

import { runtimeObserver, SystemState, ExecutionObservation, ActivitySignal } from './core/RuntimeObserver';
import { activityIntelligence, ActivityContext } from './core/ActivityIntelligence';
import { executionController, ControlledExecution } from './core/ExecutionController';

export interface BurnPreventionConfig {
  enabled: boolean;
  aggressiveness: 'conservative' | 'balanced' | 'aggressive';
  idleThresholdMs: number;
  deepSleepThresholdMs: number;
  enableNightMode: boolean;
  enableWeekendMode: boolean;
}

export interface BurnPreventionMetrics {
  mode: 'active' | 'idle' | 'sleep' | 'deep_sleep';
  burnRate: 'high' | 'medium' | 'low' | 'minimal';
  activeExecutions: number;
  throttledExecutions: number;
  pausedExecutions: number;
  estimatedSavings: number; // Percentage
  uptimeSeconds: number;
}

class BurnPreventionCore {
  private config: BurnPreventionConfig = {
    enabled: true,
    aggressiveness: 'balanced',
    idleThresholdMs: 2 * 60 * 1000, // 2 minutes
    deepSleepThresholdMs: 15 * 60 * 1000, // 15 minutes
    enableNightMode: true,
    enableWeekendMode: true,
  };

  private startTime = Date.now();
  private isInitialized = false;

  constructor() {
    // TURBOPACK-SAFE: Do NOT auto-initialize at construction
    // Must be explicitly initialized from a client component
  }

  /**
   * Initialize the burn prevention system
   * TURBOPACK-SAFE: Should be called from useEffect or client component
   */
  public initialize(): void {
    if (typeof window === 'undefined') {
      console.warn('[BurnPrevention] Cannot initialize in server environment');
      return;
    }
    
    if (this.isInitialized) return;
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('🧠 BURN PREVENTION SYSTEM INITIALIZING');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('This system will:');
    console.log('  • Observe all runtime execution');
    console.log('  • Detect idle and inactive periods');
    console.log('  • Intelligently reduce unnecessary polling');
    console.log('  • Prevent resource waste during inactivity');
    console.log('  • Wake up instantly when activity resumes');
    console.log('');
    console.log('Owner-aware. Cost-protective. Self-regulating.');
    console.log('');
    console.log('═══════════════════════════════════════════════════════');

    this.isInitialized = true;

    // Set up global activity listeners
    this.setupGlobalListeners();

    // Periodic health check
    setInterval(() => this.healthCheck(), 60000); // Every minute

    setTimeout(() => {
      console.log('[BurnPrevention] ✅ System online and monitoring');
    }, 2000);
  }

  /**
   * Set up global activity listeners
   */
  private setupGlobalListeners(): void {
    // User interaction tracking
    const interactionEvents = ['mousedown', 'keydown', 'touchstart', 'click', 'scroll'];
    
    interactionEvents.forEach(event => {
      document.addEventListener(event, () => {
        this.recordActivity({
          type: 'user_interaction',
          timestamp: Date.now(),
          significance: 'medium',
          metadata: { event },
        });
      }, { passive: true, capture: true });
    });

    // Page visibility
    document.addEventListener('visibilitychange', () => {
      this.recordActivity({
        type: 'page_view',
        timestamp: Date.now(),
        significance: document.hidden ? 'low' : 'high',
        metadata: { visible: !document.hidden },
      });
    });

    // Network events
    window.addEventListener('online', () => {
      this.recordActivity({
        type: 'network_event',
        timestamp: Date.now(),
        significance: 'high',
        metadata: { status: 'online' },
      });
    });

    window.addEventListener('offline', () => {
      this.recordActivity({
        type: 'network_event',
        timestamp: Date.now(),
        significance: 'high',
        metadata: { status: 'offline' },
      });
    });

    // Admin detection (check for admin routes)
    const checkAdmin = () => {
      if (window.location.pathname.startsWith('/admin')) {
        this.recordActivity({
          type: 'admin_action',
          timestamp: Date.now(),
          significance: 'critical',
          metadata: { route: window.location.pathname },
        });
      }
    };

    // Check on navigation
    window.addEventListener('popstate', checkAdmin);
    checkAdmin(); // Initial check
  }

  /**
   * Record an activity signal
   */
  recordActivity(signal: ActivitySignal): void {
    if (!this.config.enabled) return;
    runtimeObserver.recordActivity(signal);
  }

  /**
   * Register an execution for observation and control
   */
  registerExecution(observation: ExecutionObservation): void {
    if (!this.config.enabled) return;
    
    runtimeObserver.registerExecution(observation);
    
    // If execution can be controlled, register with controller
    if (observation.canThrottle || observation.canPause) {
      executionController.register(
        observation.id,
        observation.frequency,
        () => {
          // Callback when control state changes
          // The execution itself will query getControlState() to adjust
        }
      );
    }
  }

  /**
   * Unregister an execution
   */
  unregisterExecution(id: string): void {
    runtimeObserver.unregisterExecution(id);
    executionController.unregister(id);
  }

  /**
   * Record that an execution happened
   */
  recordExecution(id: string, duration: number): void {
    if (!this.config.enabled) return;
    runtimeObserver.recordExecution(id, duration);
  }

  /**
   * Get control state for an execution (to determine if it should run)
   */
  getControlState(id: string): ControlledExecution | undefined {
    return executionController.getState(id);
  }

  /**
   * Check if an execution should run based on current state
   */
  shouldExecute(id: string): boolean {
    if (!this.config.enabled) return true;

    const state = executionController.getState(id);
    if (!state) return true; // Not controlled, always run

    return !state.isPaused;
  }

  /**
   * Get recommended interval for an execution
   */
  getRecommendedInterval(id: string, defaultInterval: number): number {
    if (!this.config.enabled) return defaultInterval;

    const state = executionController.getState(id);
    if (!state) return defaultInterval;

    return state.currentInterval;
  }

  /**
   * Get current metrics
   */
  getMetrics(): BurnPreventionMetrics {
    const systemState = runtimeObserver.getSystemState();
    const controlStats = executionController.getStatistics();

    return {
      mode: systemState.mode,
      burnRate: systemState.burnRate,
      activeExecutions: systemState.activeExecutions,
      throttledExecutions: controlStats.throttled,
      pausedExecutions: controlStats.paused,
      estimatedSavings: this.calculateSavings(controlStats),
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  /**
   * Calculate estimated savings percentage
   */
  private calculateSavings(stats: {
    total: number;
    throttled: number;
    paused: number;
    averageThrottleRatio: number;
  }): number {
    if (stats.total === 0) return 0;

    const pausedSavings = (stats.paused / stats.total) * 100;
    const throttledSavings = (stats.throttled / stats.total) * ((stats.averageThrottleRatio - 1) / stats.averageThrottleRatio) * 100;

    return Math.round(pausedSavings + throttledSavings);
  }

  /**
   * Get current activity context
   */
  getActivityContext(): ActivityContext {
    return activityIntelligence.getContext();
  }

  /**
   * Update configuration
   */
  configure(config: Partial<BurnPreventionConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[BurnPrevention] Configuration updated:', this.config);
  }

  /**
   * Enable/disable the system
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    console.log(`[BurnPrevention] System ${enabled ? 'enabled' : 'disabled'}`);
    
    if (!enabled) {
      // Restore all executions
      executionController.forceRestoreAll('System disabled');
    }
  }

  /**
   * Perform health check
   */
  private healthCheck(): void {
    const metrics = this.getMetrics();
    
    if (metrics.mode === 'deep_sleep' && metrics.pausedExecutions === 0) {
      console.warn('[BurnPrevention] ⚠️ Health Check: In deep sleep but no executions paused!');
      console.warn('[BurnPrevention] 💸 Potential resource waste detected');
    }

    // Log status in deep sleep or if significant savings
    if (metrics.mode === 'deep_sleep' || metrics.estimatedSavings > 50) {
      console.log(`[BurnPrevention] 💤 Status: ${metrics.mode}, Savings: ${metrics.estimatedSavings}%, Paused: ${metrics.pausedExecutions}/${metrics.activeExecutions}`);
    }
  }

  /**
   * Generate comprehensive system report
   */
  generateReport(): string {
    const metrics = this.getMetrics();
    const context = this.getActivityContext();
    const observerReport = runtimeObserver.generateReport();
    const controllerReport = executionController.generateReport();

    const lines = [
      '',
      '═══════════════════════════════════════════════════════',
      '🧠 BURN PREVENTION SYSTEM - FULL REPORT',
      '═══════════════════════════════════════════════════════',
      '',
      '📊 CURRENT METRICS:',
      `  Mode: ${metrics.mode.toUpperCase()}`,
      `  Burn Rate: ${metrics.burnRate.toUpperCase()}`,
      `  Active Executions: ${metrics.activeExecutions}`,
      `  Throttled: ${metrics.throttledExecutions}`,
      `  Paused: ${metrics.pausedExecutions}`,
      `  Estimated Savings: ${metrics.estimatedSavings}%`,
      `  Uptime: ${Math.floor(metrics.uptimeSeconds / 60)}m ${metrics.uptimeSeconds % 60}s`,
      '',
      '🌍 CONTEXT:',
      `  User Activity: ${context.hasRecentUserInteraction ? 'ACTIVE' : 'IDLE'}`,
      `  Admin Present: ${context.hasAdminPresence ? 'YES' : 'NO'}`,
      `  Page Visibility: ${context.pageVisibility.toUpperCase()}`,
      `  Network: ${context.networkStatus.toUpperCase()}`,
      `  Time Context: ${context.isDaytime ? 'Daytime' : 'Night'} ${context.isBusinessHours ? '(Business Hours)' : ''}`,
      '',
      observerReport,
      '',
      controllerReport,
      '',
      '═══════════════════════════════════════════════════════',
      '',
    ];

    return lines.join('\n');
  }

  /**
   * Expose report to console (for debugging)
   */
  printReport(): void {
    console.log(this.generateReport());
  }
}

// Singleton instance - TURBOPACK-SAFE
export const burnPreventionCore = new BurnPreventionCore();

/**
 * Initialize burn prevention system
 * TURBOPACK-SAFE: Call this from a client component's useEffect
 */
export function initializeBurnPrevention(): void {
  burnPreventionCore.initialize();
}

/**
 * Initialize debug tools (development only)
 * TURBOPACK-SAFE: Call from client component
 */
export function initializeBurnPreventionDebugTools(): void {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    return;
  }

  (window as any).__burnPrevention = {
    core: burnPreventionCore,
    observer: runtimeObserver,
    intelligence: activityIntelligence,
    controller: executionController,
    printReport: () => burnPreventionCore.printReport(),
    getMetrics: () => burnPreventionCore.getMetrics(),
  };
  
  console.log('');
  console.log('💡 Burn Prevention Debug Tools Available:');
  console.log('  • __burnPrevention.printReport()  - Full system report');
  console.log('  • __burnPrevention.getMetrics()   - Current metrics');
  console.log('  • __burnPrevention.core           - Core system');
  console.log('  • __burnPrevention.observer       - Runtime observer');
  console.log('  • __burnPrevention.intelligence   - Activity intelligence');
  console.log('  • __burnPrevention.controller     - Execution controller');
  console.log('');
}

// Export all components
export { runtimeObserver } from './core/RuntimeObserver';
export { activityIntelligence } from './core/ActivityIntelligence';
export { executionController } from './core/ExecutionController';
export type { ActivitySignal, ExecutionObservation, SystemState } from './core/RuntimeObserver';
export type { ActivityContext, ExecutionRecommendation, SystemRecommendation } from './core/ActivityIntelligence';
export type { ControlledExecution } from './core/ExecutionController';
