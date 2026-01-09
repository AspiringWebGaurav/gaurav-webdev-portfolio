/**
 * ACTIVITY INTELLIGENCE - The Brain's Decision Engine
 * 
 * This layer analyzes observations from RuntimeObserver and makes intelligent
 * decisions about what should happen. It understands context, intent, and priority.
 * 
 * This is where the system becomes aware of what's wasteful and what's critical.
 */

import { runtimeObserver, SystemState, ExecutionObservation } from './RuntimeObserver';

export interface ActivityContext {
  hasRecentUserInteraction: boolean;
  hasAdminPresence: boolean;
  hasActiveVisitors: boolean;
  isBusinessHours: boolean;
  isDaytime: boolean;
  isWeekend: boolean;
  pageVisibility: 'visible' | 'hidden';
  networkStatus: 'online' | 'offline';
}

export interface ExecutionRecommendation {
  executionId: string;
  action: 'continue' | 'throttle' | 'pause' | 'stop';
  reason: string;
  targetInterval?: number; // For throttle action
  priority: number; // 0-100, higher = more important to execute
}

export interface SystemRecommendation {
  shouldEnterIdleMode: boolean;
  shouldEnterDeepSleep: boolean;
  recommendedActions: ExecutionRecommendation[];
  explanation: string;
  estimatedBurnReduction: number; // Percentage
}

class ActivityIntelligence {
  private context: ActivityContext = {
    hasRecentUserInteraction: true,
    hasAdminPresence: false,
    hasActiveVisitors: false,
    isBusinessHours: false,
    isDaytime: true,
    isWeekend: false,
    pageVisibility: 'visible',
    networkStatus: 'online',
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private initialize() {
    console.log('[ActivityIntelligence] 🧠 Intelligence engine starting...');
    
    // Monitor page visibility
    document.addEventListener('visibilitychange', () => {
      this.context.pageVisibility = document.hidden ? 'hidden' : 'visible';
      this.analyzeAndRecommend();
    });

    // Monitor network status
    window.addEventListener('online', () => {
      this.context.networkStatus = 'online';
      this.analyzeAndRecommend();
    });
    
    window.addEventListener('offline', () => {
      this.context.networkStatus = 'offline';
      this.analyzeAndRecommend();
    });

    // Subscribe to RuntimeObserver state changes
    runtimeObserver.subscribe((state) => {
      this.updateContext(state);
      this.analyzeAndRecommend();
    });

    // Periodic analysis
    setInterval(() => {
      this.analyzeAndRecommend();
    }, 30000); // Every 30 seconds
  }

  /**
   * Update context based on system state
   */
  private updateContext(state: SystemState): void {
    this.context.hasRecentUserInteraction = Date.now() - state.lastUserActivity < 60000; // 1 min
    this.context.hasAdminPresence = state.isAdminPresent;
    this.context.hasActiveVisitors = state.currentVisitors > 0;

    // Determine time context
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    this.context.isBusinessHours = hour >= 9 && hour < 18; // 9 AM - 6 PM
    this.context.isDaytime = hour >= 6 && hour < 22; // 6 AM - 10 PM
    this.context.isWeekend = day === 0 || day === 6;
  }

  /**
   * Get current activity context
   */
  getContext(): ActivityContext {
    return { ...this.context };
  }

  /**
   * Analyze current situation and generate recommendations
   */
  analyzeAndRecommend(): SystemRecommendation {
    const state = runtimeObserver.getSystemState();
    const executions = runtimeObserver.getAllExecutions();
    const context = this.context;

    console.log('[ActivityIntelligence] 🤔 Analyzing system state...');

    // Determine if idle/sleep mode is appropriate
    const shouldEnterIdleMode = this.shouldEnterIdleMode(state, context);
    const shouldEnterDeepSleep = this.shouldEnterDeepSleep(state, context);

    // Generate execution recommendations
    const recommendedActions = this.generateExecutionRecommendations(
      executions,
      state,
      context,
      shouldEnterIdleMode,
      shouldEnterDeepSleep
    );

    // Calculate estimated burn reduction
    const estimatedBurnReduction = this.calculateBurnReduction(recommendedActions);

    const recommendation: SystemRecommendation = {
      shouldEnterIdleMode,
      shouldEnterDeepSleep,
      recommendedActions,
      explanation: this.generateExplanation(state, context, shouldEnterIdleMode, shouldEnterDeepSleep),
      estimatedBurnReduction,
    };

    // Log significant recommendations
    if (shouldEnterIdleMode || shouldEnterDeepSleep || recommendedActions.length > 0) {
      console.log('[ActivityIntelligence] 💡 Recommendations:', {
        idleMode: shouldEnterIdleMode,
        deepSleep: shouldEnterDeepSleep,
        actions: recommendedActions.length,
        burnReduction: `${estimatedBurnReduction}%`,
      });
    }

    return recommendation;
  }

  /**
   * Determine if system should enter idle mode
   */
  private shouldEnterIdleMode(state: SystemState, context: ActivityContext): boolean {
    // Don't enter idle if admin is present
    if (context.hasAdminPresence) {
      return false;
    }

    // Don't enter idle if there's recent user interaction
    if (context.hasRecentUserInteraction) {
      return false;
    }

    // Don't enter idle if page is visible (user might be reading)
    if (context.pageVisibility === 'visible') {
      return false;
    }

    // Enter idle if system has been inactive for a while
    const timeSinceActivity = Date.now() - state.lastUserActivity;
    return timeSinceActivity > 2 * 60 * 1000; // 2 minutes
  }

  /**
   * Determine if system should enter deep sleep
   */
  private shouldEnterDeepSleep(state: SystemState, context: ActivityContext): boolean {
    // Don't deep sleep if admin is present
    if (context.hasAdminPresence) {
      return false;
    }

    // Don't deep sleep if page is visible
    if (context.pageVisibility === 'visible') {
      return false;
    }

    // Enter deep sleep if system has been inactive for extended period
    const timeSinceActivity = Date.now() - state.lastUserActivity;
    const deepSleepThreshold = context.isDaytime ? 15 * 60 * 1000 : 5 * 60 * 1000; // 15min day, 5min night

    return timeSinceActivity > deepSleepThreshold;
  }

  /**
   * Generate recommendations for each execution
   */
  private generateExecutionRecommendations(
    executions: ExecutionObservation[],
    state: SystemState,
    context: ActivityContext,
    idleMode: boolean,
    deepSleep: boolean
  ): ExecutionRecommendation[] {
    const recommendations: ExecutionRecommendation[] = [];

    for (const execution of executions) {
      const recommendation = this.recommendActionForExecution(
        execution,
        state,
        context,
        idleMode,
        deepSleep
      );

      if (recommendation.action !== 'continue') {
        recommendations.push(recommendation);
      }
    }

    return recommendations;
  }

  /**
   * Recommend action for a specific execution
   */
  private recommendActionForExecution(
    execution: ExecutionObservation,
    state: SystemState,
    context: ActivityContext,
    idleMode: boolean,
    deepSleep: boolean
  ): ExecutionRecommendation {
    // Critical executions always continue
    if (execution.criticality === 'critical') {
      return {
        executionId: execution.id,
        action: 'continue',
        reason: 'Critical execution must remain active',
        priority: 100,
      };
    }

    // Offline - pause non-critical network operations
    if (context.networkStatus === 'offline' && execution.type === 'poll') {
      return {
        executionId: execution.id,
        action: 'pause',
        reason: 'Network offline - pausing to prevent failed requests',
        priority: 0,
      };
    }

    // Deep sleep mode - aggressive reduction
    if (deepSleep) {
      if (execution.criticality === 'high') {
        return {
          executionId: execution.id,
          action: 'throttle',
          reason: 'Deep sleep - reducing high priority execution',
          targetInterval: execution.frequency * 10, // 10x slower
          priority: 30,
        };
      } else {
        return {
          executionId: execution.id,
          action: 'pause',
          reason: 'Deep sleep - no user activity detected',
          priority: 0,
        };
      }
    }

    // Idle mode - moderate reduction
    if (idleMode) {
      if (execution.criticality === 'high') {
        return {
          executionId: execution.id,
          action: 'throttle',
          reason: 'Idle mode - reducing non-critical execution',
          targetInterval: execution.frequency * 3, // 3x slower
          priority: 50,
        };
      } else if (execution.criticality === 'normal') {
        return {
          executionId: execution.id,
          action: 'throttle',
          reason: 'Idle mode - slowing normal priority execution',
          targetInterval: execution.frequency * 5, // 5x slower
          priority: 30,
        };
      } else {
        return {
          executionId: execution.id,
          action: 'pause',
          reason: 'Idle mode - pausing low priority execution',
          priority: 10,
        };
      }
    }

    // Admin-specific executions when admin not present
    if (execution.owner === 'admin' && !context.hasAdminPresence) {
      return {
        executionId: execution.id,
        action: 'pause',
        reason: 'Admin not present - pausing admin-specific execution',
        priority: 5,
      };
    }

    // Page hidden - reduce visitor-facing polling
    if (context.pageVisibility === 'hidden' && execution.owner === 'visitor') {
      if (execution.criticality === 'normal' || execution.criticality === 'low') {
        return {
          executionId: execution.id,
          action: 'throttle',
          reason: 'Page hidden - reducing visitor execution',
          targetInterval: execution.frequency * 4, // 4x slower
          priority: 20,
        };
      }
    }

    // Default - continue as normal
    return {
      executionId: execution.id,
      action: 'continue',
      reason: 'Normal operation',
      priority: 50,
    };
  }

  /**
   * Calculate estimated burn reduction percentage
   */
  private calculateBurnReduction(recommendations: ExecutionRecommendation[]): number {
    if (recommendations.length === 0) return 0;

    let totalReduction = 0;

    for (const rec of recommendations) {
      if (rec.action === 'pause' || rec.action === 'stop') {
        totalReduction += 100; // 100% reduction for this execution
      } else if (rec.action === 'throttle' && rec.targetInterval) {
        const execution = runtimeObserver.getAllExecutions().find(e => e.id === rec.executionId);
        if (execution) {
          const ratio = rec.targetInterval / execution.frequency;
          totalReduction += ((ratio - 1) / ratio) * 100;
        }
      }
    }

    return Math.round(totalReduction / recommendations.length);
  }

  /**
   * Generate human-readable explanation
   */
  private generateExplanation(
    state: SystemState,
    context: ActivityContext,
    idleMode: boolean,
    deepSleep: boolean
  ): string {
    const parts: string[] = [];

    if (deepSleep) {
      parts.push('System has been inactive for extended period.');
      parts.push('Entering deep sleep to minimize resource usage.');
      if (!context.isDaytime) {
        parts.push('Night-time hours detected - aggressive conservation.');
      }
    } else if (idleMode) {
      parts.push('No recent user activity detected.');
      parts.push('Entering idle mode to reduce unnecessary execution.');
    } else if (context.hasAdminPresence) {
      parts.push('Admin is present - maintaining full responsiveness.');
    } else if (context.hasRecentUserInteraction) {
      parts.push('Recent user activity detected - maintaining active mode.');
    } else {
      parts.push('System operating normally.');
    }

    if (context.pageVisibility === 'hidden') {
      parts.push('Page is hidden - reducing visitor-facing operations.');
    }

    if (context.networkStatus === 'offline') {
      parts.push('Network offline - pausing network operations.');
    }

    return parts.join(' ');
  }
}

// Singleton instance
export const activityIntelligence = new ActivityIntelligence();
