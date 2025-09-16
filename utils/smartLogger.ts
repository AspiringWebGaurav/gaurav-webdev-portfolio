// utils/smartLogger.ts
// Smart logging system that separates terminal logs from browser console logs
// Terminal: Only errors and critical warnings
// Browser Console: Detailed debugging information

interface LogConfig {
  enableTerminalLogs?: boolean;
  enableBrowserLogs?: boolean;
  terminalLogLevel?: 'error' | 'warn' | 'info' | 'debug';
  browserLogLevel?: 'error' | 'warn' | 'info' | 'debug';
  enableProductionLogs?: boolean;
  enableSensitiveData?: boolean;
}

class SmartLogger {
  private config: LogConfig;
  private isClient: boolean;
  private isServer: boolean;
  private isDevelopment: boolean;
  private isProduction: boolean;

  private sensitiveKeys = [
    'apiKey', 'api_key', 'API_KEY',
    'password', 'PASSWORD', 'secret', 'SECRET',
    'token', 'TOKEN', 'key', 'KEY',
    'private_key', 'PRIVATE_KEY',
    'client_secret', 'CLIENT_SECRET',
    'auth_token', 'AUTH_TOKEN',
    'firebase', 'FIREBASE', 'uuid', 'UUID',
    'fingerprint', 'ipAddress', 'userAgent'
  ];

  constructor(config: LogConfig = {}) {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
    this.isClient = typeof window !== 'undefined';
    this.isServer = typeof window === 'undefined';

    this.config = {
      enableTerminalLogs: this.isDevelopment, // Only in development
      enableBrowserLogs: true, // Always enabled for debugging
      terminalLogLevel: 'warn', // Only warnings and errors in terminal
      browserLogLevel: 'debug', // Full debugging in browser
      enableProductionLogs: false, // Minimal production logging
      enableSensitiveData: false,
      ...config
    };
  }

  private shouldLogToTerminal(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    if (!this.config.enableTerminalLogs || this.isClient) return false;
    
    if (this.isProduction && !this.config.enableProductionLogs) {
      return level === 'error'; // Only errors in production terminal
    }

    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const configLevel = levels[this.config.terminalLogLevel || 'warn'];
    const messageLevel = levels[level];
    return messageLevel >= configLevel;
  }

  private shouldLogToBrowser(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    if (!this.config.enableBrowserLogs || this.isServer) return false;
    
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const configLevel = levels[this.config.browserLogLevel || 'debug'];
    const messageLevel = levels[level];
    return messageLevel >= configLevel;
  }

  private sanitizeData(data: any): any {
    if (!data) return data;

    if (typeof data === 'string') {
      if (this.containsSensitiveData(data)) {
        return this.config.enableSensitiveData ? data : '[REDACTED]';
      }
      return data;
    }

    if (typeof data === 'object') {
      const sanitized: any = Array.isArray(data) ? [] : {};
      
      for (const [key, value] of Object.entries(data)) {
        if (this.isSensitiveKey(key)) {
          sanitized[key] = this.config.enableSensitiveData ? value : '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = this.sanitizeData(value);
        } else if (typeof value === 'string' && this.containsSensitiveData(value)) {
          sanitized[key] = this.config.enableSensitiveData ? value : '[REDACTED]';
        } else {
          sanitized[key] = value;
        }
      }
      
      return sanitized;
    }

    return data;
  }

  private isSensitiveKey(key: string): boolean {
    const lowerKey = key.toLowerCase();
    return this.sensitiveKeys.some(sensitiveKey =>
      lowerKey.includes(sensitiveKey.toLowerCase())
    );
  }

  private containsSensitiveData(str: string): boolean {
    const patterns = [
      /AIza[0-9A-Za-z-_]{35}/, // Google API Key
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i, // UUID
      /sk-[a-zA-Z0-9]{48}/, // OpenAI API key
      /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/, // IP address
    ];

    return patterns.some(pattern => pattern.test(str));
  }

  private formatMessage(level: string, message: string, data?: any, context?: string): string {
    const timestamp = new Date().toISOString();
    const prefix = context ? `[${context.toUpperCase()}]` : '';
    const logLevel = `[${level.toUpperCase()}]`;
    
    if (data) {
      const sanitizedData = this.sanitizeData(data);
      return `${prefix} ${logLevel} ${message} ${JSON.stringify(sanitizedData)}`;
    }
    
    return `${prefix} ${logLevel} ${message}`;
  }

  // Terminal-only logging (server-side)
  private terminalLog(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any, context?: string) {
    if (!this.shouldLogToTerminal(level)) return;

    const formattedMessage = this.formatMessage(level, message, data, context);
    
    switch (level) {
      case 'debug':
        console.debug(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
        console.error(formattedMessage);
        break;
    }
  }

  // Browser console logging (client-side)
  private browserLog(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any, context?: string) {
    if (!this.shouldLogToBrowser(level)) return;

    const timestamp = new Date().toISOString();
    const prefix = context ? `[${context}]` : '';
    const style = this.getLogStyle(level);
    
    if (data) {
      const sanitizedData = this.sanitizeData(data);
      console.group(`%c${prefix} ${message}`, style);
      console.log('📊 Data:', sanitizedData);
      console.log('🕐 Time:', timestamp);
      console.groupEnd();
    } else {
      console.log(`%c${prefix} ${message}`, style, `(${timestamp})`);
    }
  }

  private getLogStyle(level: string): string {
    const styles = {
      debug: 'color: #888; font-size: 11px;',
      info: 'color: #0ea5e9; font-weight: bold;',
      warn: 'color: #f59e0b; font-weight: bold;',
      error: 'color: #ef4444; font-weight: bold; background: #fef2f2; padding: 2px 4px;'
    };
    return styles[level as keyof typeof styles] || styles.info;
  }

  // Public API
  debug(message: string, data?: any, context?: string) {
    this.terminalLog('debug', message, data, context);
    this.browserLog('debug', message, data, context);
  }

  info(message: string, data?: any, context?: string) {
    this.terminalLog('info', message, data, context);
    this.browserLog('info', message, data, context);
  }

  warn(message: string, data?: any, context?: string) {
    this.terminalLog('warn', message, data, context);
    this.browserLog('warn', message, data, context);
  }

  error(message: string, data?: any, context?: string) {
    this.terminalLog('error', message, data, context);
    this.browserLog('error', message, data, context);
  }

  // Browser-only logging (detailed debugging)
  browserOnly = {
    debug: (message: string, data?: any, context?: string) => {
      this.browserLog('debug', message, data, context || 'browser');
    },
    info: (message: string, data?: any, context?: string) => {
      this.browserLog('info', message, data, context || 'browser');
    },
    warn: (message: string, data?: any, context?: string) => {
      this.browserLog('warn', message, data, context || 'browser');
    },
    log: (message: string, data?: any, context?: string) => {
      this.browserLog('info', message, data, context || 'browser');
    }
  };

  // Terminal-only logging (critical messages)
  terminalOnly = {
    warn: (message: string, data?: any, context?: string) => {
      this.terminalLog('warn', message, data, context || 'server');
    },
    error: (message: string, data?: any, context?: string) => {
      this.terminalLog('error', message, data, context || 'server');
    }
  };

  // Silent in production, detailed in development browser
  devOnly = {
    debug: (message: string, data?: any, context?: string) => {
      if (this.isDevelopment) {
        this.browserLog('debug', message, data, context || 'dev');
      }
    },
    info: (message: string, data?: any, context?: string) => {
      if (this.isDevelopment) {
        this.browserLog('info', message, data, context || 'dev');
      }
    },
    log: (message: string, data?: any, context?: string) => {
      if (this.isDevelopment) {
        this.browserLog('info', message, data, context || 'dev');
      }
    }
  };

  // Firebase specific logging
  firebase = {
    init: (message: string, config?: any) => {
      // Only show in browser console for debugging
      this.browserOnly.info(message, config, 'firebase');
    },
    error: (message: string, error?: any) => {
      // Show in both terminal and browser for errors
      this.error(message, error, 'firebase');
    },
    debug: (message: string, data?: any) => {
      // Only in browser console
      this.browserOnly.debug(message, data, 'firebase');
    }
  };

  // API specific logging
  api = {
    request: (message: string, data?: any) => {
      // Only show in browser console
      this.browserOnly.info(message, data, 'api');
    },
    error: (message: string, error?: any) => {
      // Critical - show in terminal and browser
      this.error(message, error, 'api');
    },
    warn: (message: string, data?: any) => {
      // Show warning in terminal and browser
      this.warn(message, data, 'api');
    }
  };
}

// Create logger instances
export const smartLogger = new SmartLogger({
  enableTerminalLogs: true,
  enableBrowserLogs: true,
  terminalLogLevel: 'warn', // Only warnings and errors in terminal
  browserLogLevel: 'debug', // Full debugging in browser
});

// Development logger (browser-only detailed logs)
export const devLogger = new SmartLogger({
  enableTerminalLogs: false, // No terminal logs
  enableBrowserLogs: true,
  browserLogLevel: 'debug',
});

// Production logger (minimal logging)
export const prodLogger = new SmartLogger({
  enableTerminalLogs: true,
  enableBrowserLogs: false,
  terminalLogLevel: 'error', // Only errors in production
  enableProductionLogs: true,
});

export default smartLogger;