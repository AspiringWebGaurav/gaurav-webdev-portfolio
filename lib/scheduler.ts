/**
 * PLATFORM-INDEPENDENT JOB SCHEDULER
 * 
 * Replaces external cron mechanisms with in-process scheduling.
 * Ensures periodic tasks execute within the server lifecycle without
 * dependency on platform-specific cron services.
 * 
 * Design:
 * - Single scheduler instance per process
 * - Idempotent task execution
 * - No overlapping runs
 * - Graceful shutdown handling
 */

type ScheduledTask = {
  id: string;
  interval: number; // milliseconds
  handler: () => void | Promise<void>;
  isRunning: boolean;
  lastRun: number;
  timerId?: NodeJS.Timeout;
};

class JobScheduler {
  private tasks: Map<string, ScheduledTask> = new Map();
  private isShuttingDown: boolean = false;
  private initialized: boolean = false;

  /**
   * Initialize the scheduler (called once at server startup)
   */
  initialize(): void {
    if (this.initialized) {
      console.log("⏰ Scheduler already initialized");
      return;
    }

    this.initialized = true;
    console.log("⏰ Job Scheduler initialized");

    // Setup graceful shutdown
    if (typeof process !== 'undefined') {
      const shutdownHandler = () => this.shutdown();
      process.on('SIGTERM', shutdownHandler);
      process.on('SIGINT', shutdownHandler);
      process.on('beforeExit', shutdownHandler);
    }
  }

  /**
   * Register a periodic task
   * @param id Unique task identifier
   * @param intervalMs Execution interval in milliseconds
   * @param handler Task function to execute
   */
  register(id: string, intervalMs: number, handler: () => void | Promise<void>): void {
    if (this.tasks.has(id)) {
      console.warn(`⚠️ Task ${id} already registered, skipping`);
      return;
    }

    const task: ScheduledTask = {
      id,
      interval: intervalMs,
      handler,
      isRunning: false,
      lastRun: 0,
    };

    this.tasks.set(id, task);
    this.scheduleTask(task);
    
    console.log(`✅ Registered task: ${id} (every ${intervalMs / 1000}s)`);
  }

  /**
   * Schedule a task to run at its interval
   */
  private scheduleTask(task: ScheduledTask): void {
    if (this.isShuttingDown) {
      return;
    }

    // Clear any existing timer
    if (task.timerId) {
      clearTimeout(task.timerId);
    }

    task.timerId = setTimeout(() => {
      this.executeTask(task);
    }, task.interval);
  }

  /**
   * Execute a task with overlap prevention
   */
  private async executeTask(task: ScheduledTask): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    // Prevent overlapping executions
    if (task.isRunning) {
      console.warn(`⚠️ Task ${task.id} still running, skipping this cycle`);
      this.scheduleTask(task); // Reschedule for next interval
      return;
    }

    task.isRunning = true;
    const startTime = Date.now();

    try {
      await task.handler();
      task.lastRun = Date.now();
      
      const duration = Date.now() - startTime;
      if (duration > 1000) {
        console.log(`⏱️ Task ${task.id} completed in ${duration}ms`);
      }
    } catch (error) {
      console.error(`❌ Task ${task.id} failed:`, error);
    } finally {
      task.isRunning = false;
      // Schedule next execution
      this.scheduleTask(task);
    }
  }

  /**
   * Unregister a task
   */
  unregister(id: string): void {
    const task = this.tasks.get(id);
    if (task) {
      if (task.timerId) {
        clearTimeout(task.timerId);
      }
      this.tasks.delete(id);
      console.log(`🗑️ Unregistered task: ${id}`);
    }
  }

  /**
   * Get task status
   */
  getTaskStatus(id: string): { isRunning: boolean; lastRun: number } | null {
    const task = this.tasks.get(id);
    if (!task) {
      return null;
    }
    return {
      isRunning: task.isRunning,
      lastRun: task.lastRun,
    };
  }

  /**
   * Get all registered tasks
   */
  getAllTasks(): string[] {
    return Array.from(this.tasks.keys());
  }

  /**
   * Graceful shutdown - wait for running tasks
   */
  async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    console.log("🛑 Scheduler shutting down...");

    // Cancel all pending timers
    for (const task of this.tasks.values()) {
      if (task.timerId) {
        clearTimeout(task.timerId);
      }
    }

    // Wait for running tasks to complete (with timeout)
    const maxWaitTime = 10000; // 10 seconds
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const runningTasks = Array.from(this.tasks.values()).filter(t => t.isRunning);
      if (runningTasks.length === 0) {
        break;
      }
      
      console.log(`⏳ Waiting for ${runningTasks.length} tasks to complete...`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log("✅ Scheduler shutdown complete");
  }

  /**
   * Check if scheduler is running
   */
  isRunning(): boolean {
    return this.initialized && !this.isShuttingDown;
  }
}

// Singleton instance
const scheduler = new JobScheduler();

export default scheduler;
