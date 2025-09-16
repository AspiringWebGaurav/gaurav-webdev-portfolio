// utils/devTerminalSilencer.ts
// Development terminal silencer - keeps VS Code terminal clean while preserving browser debugging

/**
 * Silences console output in development mode terminal
 * while preserving browser console functionality
 */
class DevTerminalSilencer {
  private originalConsole: {
    log: typeof console.log;
    info: typeof console.info;
    warn: typeof console.warn;
    debug: typeof console.debug;
  };

  private isClient: boolean;
  private isDevelopment: boolean;
  private isEnabled: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isClient = typeof window !== 'undefined';
    this.isEnabled = this.isDevelopment && !this.isClient;

    // Store original console methods
    this.originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      debug: console.debug,
    };

    this.init();
  }

  private init() {
    if (!this.isEnabled) return;

    // Only silence server-side console in development
    this.silenceServerConsole();
    
    // Allow emergency restoration
    this.setupEmergencyRestore();
  }

  private silenceServerConsole() {
    // Completely silent noop function
    const noop = () => {};

    // Override console methods on server-side only
    if (!this.isClient && this.isDevelopment) {
      // Keep error logging but make it minimal
      const originalError = console.error;
      console.error = (...args: any[]) => {
        // Only log critical errors with minimal formatting
        if (args.some(arg => 
          typeof arg === 'string' && (
            arg.includes('ECONNREFUSED') ||
            arg.includes('Firebase Admin') ||
            arg.includes('Database') ||
            arg.includes('Failed to') ||
            arg.includes('Error:')
          )
        )) {
          originalError('[ERROR]', ...args);
        }
      };

      // Silence all other console methods
      console.log = noop;
      console.info = noop;
      console.warn = noop;
      console.debug = noop;
    }
  }

  private setupEmergencyRestore() {
    // Allow restoration via environment variable
    if (process.env.RESTORE_CONSOLE_LOGS === 'true') {
      this.restoreConsole();
    }

    // Global function to restore console (for debugging)
    if (!this.isClient && this.isDevelopment) {
      (global as any).__restoreConsole = () => {
        this.restoreConsole();
        console.log('🔧 Console logging restored for debugging');
      };
    }
  }

  public restoreConsole() {
    console.log = this.originalConsole.log;
    console.info = this.originalConsole.info;
    console.warn = this.originalConsole.warn;
    console.debug = this.originalConsole.debug;
  }

  public isSilenced(): boolean {
    return this.isEnabled;
  }
}

// Auto-initialize on import (server-side only)
let silencer: DevTerminalSilencer | null = null;

if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
  // Only initialize on server-side in development
  silencer = new DevTerminalSilencer();
}

export { DevTerminalSilencer, silencer };

// Export utility functions
export const restoreConsoleForDebugging = () => {
  if (silencer) {
    silencer.restoreConsole();
  } else if (typeof window === 'undefined') {
    console.log('🔧 Console silencer not active or already restored');
  }
};

export const isConsoleSilenced = () => {
  return silencer?.isSilenced() ?? false;
};

export default silencer;