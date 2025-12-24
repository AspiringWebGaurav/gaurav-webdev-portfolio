/**
 * Centralized Logging Utility
 * Controls debug logs based on NODE_ENV and DEBUG flag
 * 
 * Usage:
 * - logger.debug('[Component]', 'message') - only in dev mode or when DEBUG=true
 * - logger.info('[Component]', 'message') - always shown
 * - logger.warn('[Component]', 'message') - always shown
 * - logger.error('[Component]', 'message') - always shown
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDevelopment: boolean;
  private isDebugEnabled: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isDebugEnabled = process.env.NEXT_PUBLIC_DEBUG === 'true';
  }

  /**
   * Debug logs - only shown in development or when DEBUG flag is enabled
   * Use for verbose logging that helps during development
   */
  debug(...args: any[]): void {
    if (this.isDevelopment || this.isDebugEnabled) {
      console.log(...args);
    }
  }

  /**
   * Info logs - always shown
   * Use for important information that should always be visible
   */
  info(...args: any[]): void {
    console.log(...args);
  }

  /**
   * Warning logs - always shown
   * Use for non-critical issues
   */
  warn(...args: any[]): void {
    console.warn(...args);
  }

  /**
   * Error logs - always shown
   * Use for errors and critical issues
   */
  error(...args: any[]): void {
    console.error(...args);
  }

  /**
   * Conditional log based on flag
   */
  conditional(condition: boolean, ...args: any[]): void {
    if (condition) {
      this.debug(...args);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export default for convenience
export default logger;
