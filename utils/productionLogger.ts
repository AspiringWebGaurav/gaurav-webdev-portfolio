// utils/productionLogger.ts
// Production-only logging configuration that completely disables logs in production

class ProductionLogger {
  private isProduction = process.env.NODE_ENV === 'production';

  // In production, all these methods do nothing
  log(...args: any[]): void {
    if (!this.isProduction) {
      console.log(...args);
    }
  }

  info(...args: any[]): void {
    if (!this.isProduction) {
      console.info(...args);
    }
  }

  warn(...args: any[]): void {
    if (!this.isProduction) {
      console.warn(...args);
    }
  }

  error(...args: any[]): void {
    // Only log errors in production, but without sensitive data
    if (this.isProduction) {
      // Log only generic error messages in production
      console.error('[ERROR] Application error occurred');
    } else {
      console.error(...args);
    }
  }

  debug(...args: any[]): void {
    if (!this.isProduction) {
      console.debug(...args);
    }
  }

  // Completely silent method - never logs anything
  silent(...args: any[]): void {
    // Intentionally empty - no logging at all
  }

  // Group methods for development
  group(label?: string): void {
    if (!this.isProduction && console.group) {
      console.group(label);
    }
  }

  groupEnd(): void {
    if (!this.isProduction && console.groupEnd) {
      console.groupEnd();
    }
  }

  // Table method for development
  table(data: any): void {
    if (!this.isProduction && console.table) {
      console.table(data);
    }
  }

  // Time methods for development
  time(label?: string): void {
    if (!this.isProduction && console.time) {
      console.time(label);
    }
  }

  timeEnd(label?: string): void {
    if (!this.isProduction && console.timeEnd) {
      console.timeEnd(label);
    }
  }
}

// Export singleton instance
export const productionLogger = new ProductionLogger();

// Override console methods in production
if (process.env.NODE_ENV === 'production') {
  // Completely disable console methods in production
  const noop = () => {};
  
  // Override all console methods except error (for critical issues)
  console.log = noop;
  console.info = noop;
  console.warn = noop;
  console.debug = noop;
  console.trace = noop;
  console.group = noop;
  console.groupEnd = noop;
  console.table = noop;
  console.time = noop;
  console.timeEnd = noop;
  
  // Keep error but sanitize it
  const originalError = console.error;
  console.error = (...args: any[]) => {
    // Only log generic error message in production
    originalError('[ERROR] Application error occurred');
  };
}

export default productionLogger;