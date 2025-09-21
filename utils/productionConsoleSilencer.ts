// utils/productionConsoleSilencer.ts
// Comprehensive console silencing for clean production environment

interface ConsoleMethods {
  log: typeof console.log;
  info: typeof console.info;
  warn: typeof console.warn;
  error: typeof console.error;
  debug: typeof console.debug;
  trace: typeof console.trace;
  table: typeof console.table;
  group: typeof console.group;
  groupCollapsed: typeof console.groupCollapsed;
  groupEnd: typeof console.groupEnd;
  time: typeof console.time;
  timeEnd: typeof console.timeEnd;
  count: typeof console.count;
  assert: typeof console.assert;
  dir: typeof console.dir;
  dirxml: typeof console.dirxml;
}

class ProductionConsoleSilencer {
  private originalMethods: ConsoleMethods;
  private isActive = false;
  private allowedPatterns: RegExp[] = [];

  constructor() {
    // Store original console methods
    this.originalMethods = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
      trace: console.trace,
      table: console.table,
      group: console.group,
      groupCollapsed: console.groupCollapsed,
      groupEnd: console.groupEnd,
      time: console.time,
      timeEnd: console.timeEnd,
      count: console.count,
      assert: console.assert,
      dir: console.dir,
      dirxml: console.dirxml,
    };

    // Define patterns for critical errors that should be allowed
    this.allowedPatterns = [
      /CRITICAL:/i,
      /FATAL:/i,
      /SECURITY:/i,
      /PAYMENT:/i,
      /AUTH.*ERROR/i,
      /DATABASE.*ERROR/i,
      /API.*FAILED/i,
    ];
  }

  /**
   * Check if a message should be allowed through the filter
   */
  private shouldAllowMessage(args: any[]): boolean {
    if (!args.length) return false;

    const firstArg = String(args[0]);
    
    // Allow messages matching critical patterns
    return this.allowedPatterns.some(pattern => pattern.test(firstArg));
  }

  /**
   * Create a filtered version of console.error that only shows critical errors
   */
  private createFilteredError() {
    const originalError = console.error;
    return (...args: any[]) => {
      if (this.shouldAllowMessage(args)) {
        originalError.apply(console, args);
      }
      // Silently ignore non-critical errors in production
    };
  }

  /**
   * Create no-op functions for silenced console methods
   */
  private createNoOpFunction() {
    return () => {
      // Completely silent - no operation
    };
  }

  /**
   * Activate console silencing for production
   */
  public activate(): void {
    if (this.isActive || process.env.NODE_ENV !== 'production') {
      return;
    }

    try {
      // Override all console methods with no-op functions
      console.log = this.createNoOpFunction();
      console.info = this.createNoOpFunction();
      console.warn = this.createNoOpFunction();
      console.debug = this.createNoOpFunction();
      console.trace = this.createNoOpFunction();
      console.table = this.createNoOpFunction();
      console.group = this.createNoOpFunction();
      console.groupCollapsed = this.createNoOpFunction();
      console.groupEnd = this.createNoOpFunction();
      console.time = this.createNoOpFunction();
      console.timeEnd = this.createNoOpFunction();
      console.count = this.createNoOpFunction();
      console.assert = this.createNoOpFunction();
      console.dir = this.createNoOpFunction();
      console.dirxml = this.createNoOpFunction();

      // Override console.error with filtered version
      console.error = this.createFilteredError();

      this.isActive = true;
    } catch (error) {
      // Fallback: if we can't override console methods, at least try to minimize output
      this.originalMethods.error('Failed to activate console silencer:', error);
    }
  }

  /**
   * Deactivate console silencing (restore original methods)
   */
  public deactivate(): void {
    if (!this.isActive) return;

    try {
      // Restore all original console methods
      Object.assign(console, this.originalMethods);
      this.isActive = false;
    } catch (error) {
      // Can't do much here without console methods
    }
  }

  /**
   * Check if silencer is currently active
   */
  public isActivated(): boolean {
    return this.isActive;
  }

  /**
   * Add a pattern for critical messages that should be allowed
   */
  public addCriticalPattern(pattern: RegExp): void {
    this.allowedPatterns.push(pattern);
  }

  /**
   * Emergency restore - use this if you need to debug in production
   */
  public emergencyRestore(): void {
    if (typeof window !== 'undefined') {
      // Create a global function for emergency restoration
      (window as any).__restoreConsole = () => {
        this.deactivate();
        console.log('Console restored for emergency debugging');
      };
    }
  }
}

// Create singleton instance
const productionConsoleSilencer = new ProductionConsoleSilencer();

/**
 * Initialize console silencing for production
 * Call this early in your app initialization
 */
export function initializeProductionConsoleSilencing(): void {
  if (process.env.NODE_ENV === 'production') {
    productionConsoleSilencer.activate();
    productionConsoleSilencer.emergencyRestore();
  }
}

/**
 * Manually activate console silencing
 */
export function activateConsoleSilencing(): void {
  productionConsoleSilencer.activate();
}

/**
 * Manually deactivate console silencing
 */
export function deactivateConsoleSilencing(): void {
  productionConsoleSilencer.deactivate();
}

/**
 * Check if console silencing is active
 */
export function isConsoleSilencingActive(): boolean {
  return productionConsoleSilencer.isActivated();
}

/**
 * Add a critical error pattern that should be allowed through
 */
export function addCriticalErrorPattern(pattern: RegExp): void {
  productionConsoleSilencer.addCriticalPattern(pattern);
}

// Auto-initialize if in production environment
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  // Initialize on client-side
  initializeProductionConsoleSilencing();
} else if (typeof globalThis !== 'undefined' && process.env.NODE_ENV === 'production') {
  // Initialize on server-side
  initializeProductionConsoleSilencing();
}

export default productionConsoleSilencer;