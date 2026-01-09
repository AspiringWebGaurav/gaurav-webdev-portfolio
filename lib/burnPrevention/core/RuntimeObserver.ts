/**
 * RUNTIME OBSERVER - The Eyes of the System
 * 
 * This is the observation layer that watches everything happening in the application.
 * It doesn't control execution yet - it just watches, learns, and reports.
 * 
 * Think of this as the system's consciousness awakening.
 */

export interface ActivitySignal {
  type: 'user_interaction' | 'api_request' | 'admin_action' | 'page_view' | 'network_event';
  timestamp: number;
  metadata?: Record<string, any>;
  significance: 'critical' | 'high' | 'medium' | 'low';
}

export interface ExecutionObservation {
  id: string;
  type: 'poll' | 'timer' | 'listener' | 'interval' | 'background_task';
  name: string;
  frequency: number; // ms between executions
  lastExecution: number;
  executionCount: number;
  averageExecutionTime: number;
  isRunning: boolean;
  criticality: 'critical' | 'high' | 'normal' | 'low';
  owner: 'admin' | 'visitor' | 'system';
  canPause: boolean;
  canThrottle: boolean;
}

export interface SystemState {
  mode: 'active' | 'idle' | 'sleep' | 'deep_sleep';
  lastUserActivity: number;
  lastAdminActivity: number;
  lastApiRequest: number;
  currentVisitors: number;
  isAdminPresent: boolean;
  activeExecutions: number;
  burnRate: 'high' | 'medium' | 'low' | 'minimal';
}

class RuntimeObserver {
  private activitySignals: ActivitySignal[] = [];
  private executions: Map<string, ExecutionObservation> = new Map();
  private systemState: SystemState = {
    mode: 'active',
    lastUserActivity: Date.now(),
    lastAdminActivity: 0,
    lastApiRequest: Date.now(),
    currentVisitors: 0,
    isAdminPresent: false,
    activeExecutions: 0,
    burnRate: 'medium',
  };
  
  private observers: Set<(state: SystemState) => void> = new Set();
  private activityWindow = 5 * 60 * 1000; // 5 minutes
  private maxActivitySignals = 1000; // Prevent memory overflow

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private initialize() {
    console.log('[RuntimeObserver] 👁️ System consciousness awakening...');
    
    // Start observation loop
    setInterval(() => this.analyzeState(), 10000); // Analyze every 10 seconds
  }

  /**
   * Record an activity signal
   */
  recordActivity(signal: ActivitySignal): void {
    this.activitySignals.push(signal);
    
    // Prevent memory overflow
    if (this.activitySignals.length > this.maxActivitySignals) {
      this.activitySignals = this.activitySignals.slice(-this.maxActivitySignals);
    }

    // Update system state based on signal
    const now = Date.now();
    
    switch (signal.type) {
      case 'user_interaction':
        this.systemState.lastUserActivity = now;
        break;
      case 'admin_action':
        this.systemState.lastAdminActivity = now;
        this.systemState.isAdminPresent = true;
        break;
      case 'api_request':
        this.systemState.lastApiRequest = now;
        break;
      case 'page_view':
        this.systemState.lastUserActivity = now;
        break;
    }

    // Notify observers of state change
    this.notifyObservers();
  }

  /**
   * Register an execution for observation
   */
  registerExecution(observation: ExecutionObservation): void {
    this.executions.set(observation.id, observation);
    this.systemState.activeExecutions = this.executions.size;
    
    console.log(`[RuntimeObserver] 📊 Registered: ${observation.name} (${observation.type}, ${observation.criticality})`);
  }

  /**
   * Record that an execution happened
   */
  recordExecution(id: string, duration: number): void {
    const execution = this.executions.get(id);
    if (!execution) return;

    const now = Date.now();
    execution.lastExecution = now;
    execution.executionCount++;
    
    // Calculate rolling average execution time
    execution.averageExecutionTime = 
      (execution.averageExecutionTime * (execution.executionCount - 1) + duration) / execution.executionCount;
  }

  /**
   * Unregister an execution (it stopped)
   */
  unregisterExecution(id: string): void {
    const execution = this.executions.get(id);
    if (execution) {
      console.log(`[RuntimeObserver] 🛑 Unregistered: ${execution.name}`);
      this.executions.delete(id);
      this.systemState.activeExecutions = this.executions.size;
    }
  }

  /**
   * Mark an execution as paused
   */
  markPaused(id: string, paused: boolean): void {
    const execution = this.executions.get(id);
    if (execution) {
      execution.isRunning = !paused;
    }
  }

  /**
   * Analyze current system state and determine mode
   */
  private analyzeState(): void {
    const now = Date.now();
    const timeSinceUserActivity = now - this.systemState.lastUserActivity;
    const timeSinceAdminActivity = now - this.systemState.lastAdminActivity;
    const timeSinceApiRequest = now - this.systemState.lastApiRequest;

    // Determine mode based on activity patterns
    let newMode: SystemState['mode'] = 'active';
    
    if (timeSinceUserActivity < 30000) { // < 30 seconds
      newMode = 'active';
    } else if (timeSinceUserActivity < 5 * 60 * 1000) { // < 5 minutes
      newMode = 'idle';
    } else if (timeSinceUserActivity < 15 * 60 * 1000) { // < 15 minutes
      newMode = 'sleep';
    } else {
      newMode = 'deep_sleep';
    }

    // Admin presence overrides - system stays active
    if (timeSinceAdminActivity < 60000) { // Admin active in last minute
      newMode = 'active';
    }

    // Check if mode changed
    if (newMode !== this.systemState.mode) {
      const oldMode = this.systemState.mode;
      this.systemState.mode = newMode;
      
      console.log(`[RuntimeObserver] 🔄 Mode transition: ${oldMode} → ${newMode}`);
      console.log(`[RuntimeObserver] 📊 Stats:`, {
        userActivity: `${Math.round(timeSinceUserActivity / 1000)}s ago`,
        adminActivity: timeSinceAdminActivity > 0 ? `${Math.round(timeSinceAdminActivity / 1000)}s ago` : 'never',
        activeExecutions: this.systemState.activeExecutions,
      });
      
      this.notifyObservers();
    }

    // Calculate burn rate based on active executions and mode
    this.calculateBurnRate();
  }

  /**
   * Calculate current burn rate
   */
  private calculateBurnRate(): void {
    const activePolls = Array.from(this.executions.values()).filter(
      e => e.isRunning && (e.type === 'poll' || e.type === 'interval' || e.type === 'listener')
    );

    let burnRate: SystemState['burnRate'] = 'minimal';
    
    if (activePolls.length === 0) {
      burnRate = 'minimal';
    } else if (activePolls.length < 3) {
      burnRate = 'low';
    } else if (activePolls.length < 7) {
      burnRate = 'medium';
    } else {
      burnRate = 'high';
    }

    if (this.systemState.mode === 'deep_sleep' && burnRate !== 'minimal') {
      console.warn(`[RuntimeObserver] ⚠️ WASTE DETECTED: ${burnRate} burn in deep_sleep mode!`);
      console.warn(`[RuntimeObserver] 💸 Active: ${activePolls.length} executions during no activity`);
    }

    this.systemState.burnRate = burnRate;
  }

  /**
   * Get recent activity in a time window
   */
  getRecentActivity(windowMs: number = this.activityWindow): ActivitySignal[] {
    const cutoff = Date.now() - windowMs;
    return this.activitySignals.filter(s => s.timestamp >= cutoff);
  }

  /**
   * Get all registered executions
   */
  getAllExecutions(): ExecutionObservation[] {
    return Array.from(this.executions.values());
  }

  /**
   * Get executions by criticality
   */
  getExecutionsByCriticality(criticality: ExecutionObservation['criticality']): ExecutionObservation[] {
    return Array.from(this.executions.values()).filter(e => e.criticality === criticality);
  }

  /**
   * Get current system state
   */
  getSystemState(): SystemState {
    return { ...this.systemState };
  }

  /**
   * Check if system is truly idle (no real activity)
   */
  isSystemIdle(): boolean {
    const now = Date.now();
    const timeSinceUserActivity = now - this.systemState.lastUserActivity;
    const timeSinceAdminActivity = now - this.systemState.lastAdminActivity;
    
    // Consider idle if no user activity for 5 minutes AND no admin activity
    return timeSinceUserActivity > 5 * 60 * 1000 && 
           (this.systemState.lastAdminActivity === 0 || timeSinceAdminActivity > 5 * 60 * 1000);
  }

  /**
   * Check if system is in deep idle (extended inactivity)
   */
  isSystemDeepIdle(): boolean {
    const now = Date.now();
    const timeSinceUserActivity = now - this.systemState.lastUserActivity;
    return timeSinceUserActivity > 15 * 60 * 1000; // 15 minutes
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback: (state: SystemState) => void): () => void {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  /**
   * Notify all observers of state change
   */
  private notifyObservers(): void {
    this.observers.forEach(callback => callback(this.systemState));
  }

  /**
   * Generate a report of current observations
   */
  generateReport(): string {
    const state = this.systemState;
    const executions = Array.from(this.executions.values());
    const recentActivity = this.getRecentActivity(5 * 60 * 1000);

    const lines = [
      '═══════════════════════════════════════════════════════',
      '🧠 RUNTIME OBSERVER REPORT',
      '═══════════════════════════════════════════════════════',
      '',
      `📊 System Mode: ${state.mode.toUpperCase()}`,
      `🔥 Burn Rate: ${state.burnRate.toUpperCase()}`,
      `⚡ Active Executions: ${state.activeExecutions}`,
      `👥 Current Visitors: ${state.currentVisitors}`,
      `👨‍💼 Admin Present: ${state.isAdminPresent ? 'YES' : 'NO'}`,
      '',
      '📅 Activity Timeline:',
      `  User Activity: ${this.formatTimeSince(state.lastUserActivity)}`,
      `  Admin Activity: ${state.lastAdminActivity > 0 ? this.formatTimeSince(state.lastAdminActivity) : 'Never'}`,
      `  API Request: ${this.formatTimeSince(state.lastApiRequest)}`,
      '',
      `🔔 Recent Signals (5min): ${recentActivity.length}`,
      '',
      '⚙️ Active Executions:',
    ];

    // Group executions by type
    const byType = new Map<string, ExecutionObservation[]>();
    executions.forEach(exec => {
      const list = byType.get(exec.type) || [];
      list.push(exec);
      byType.set(exec.type, list);
    });

    byType.forEach((list, type) => {
      lines.push(`  ${type}: ${list.length}`);
      list.forEach(exec => {
        const status = exec.isRunning ? '🟢' : '⏸️';
        lines.push(`    ${status} ${exec.name} (${exec.criticality}) - ${this.formatTimeSince(exec.lastExecution)}`);
      });
    });

    lines.push('');
    lines.push('═══════════════════════════════════════════════════════');

    return lines.join('\n');
  }

  private formatTimeSince(timestamp: number): string {
    if (timestamp === 0) return 'Never';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  }
}

// Singleton instance
export const runtimeObserver = new RuntimeObserver();
