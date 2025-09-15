// utils/secureLogger.ts
// Production-safe logging utility that prevents sensitive data exposure

interface LogConfig {
  enableInProduction?: boolean;
  enableSensitiveData?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  enableUUIDLogging?: boolean;
}

class SecureLogger {
  private config: LogConfig;
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
    this.config = {
      enableInProduction: false,
      enableSensitiveData: false,
      enableUUIDLogging: false,
      logLevel: 'error', // Only errors in production by default
      ...config
    };
  }

  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error' = 'info'): boolean {
    // In production, only log errors and warnings unless explicitly enabled
    if (process.env.NODE_ENV === 'production') {
      if (!this.config.enableInProduction) {
        return level === 'error' || level === 'warn';
      }
      // If enabled in production, respect log level
      const levels = { debug: 0, info: 1, warn: 2, error: 3 };
      const configLevel = levels[this.config.logLevel || 'error'];
      const messageLevel = levels[level];
      return messageLevel >= configLevel;
    }
    return true;
  }

  private hashSensitiveValue(value: string): string {
    // Create a simple hash for logging purposes (not cryptographically secure)
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `#${Math.abs(hash).toString(16).substring(0, 8)}`;
  }

  private sanitizeData(data: any): any {
    if (!data) return data;

    if (typeof data === 'string') {
      // Hash UUIDs and other sensitive patterns instead of showing them
      if (this.containsSensitiveData(data)) {
        return this.config.enableUUIDLogging ? this.hashSensitiveValue(data) : '[REDACTED]';
      }
      return data;
    }

    if (typeof data === 'object') {
      const sanitized: any = Array.isArray(data) ? [] : {};
      
      for (const [key, value] of Object.entries(data)) {
        if (this.isSensitiveKey(key)) {
          if (typeof value === 'string' && this.config.enableUUIDLogging) {
            sanitized[key] = this.hashSensitiveValue(value);
          } else {
            sanitized[key] = '[REDACTED]';
          }
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = this.sanitizeData(value);
        } else if (typeof value === 'string' && this.containsSensitiveData(value)) {
          sanitized[key] = this.config.enableUUIDLogging ? this.hashSensitiveValue(value) : '[REDACTED]';
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
    // Check for patterns that look like API keys, tokens, UUIDs, etc.
    const patterns = [
      /AIza[0-9A-Za-z-_]{35}/, // Google API Key pattern
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i, // UUID pattern
      /sk-[a-zA-Z0-9]{48}/, // OpenAI API key pattern
      /xoxb-[0-9]{11}-[0-9]{12}-[a-zA-Z0-9]{24}/, // Slack bot token
      /ghp_[a-zA-Z0-9]{36}/, // GitHub personal access token
      /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/, // IP address pattern
    ];

    return patterns.some(pattern => pattern.test(str));
  }

  private formatMessage(level: string, message: string, data?: any): string {
    // In production, use minimal formatting to reduce log size
    if (process.env.NODE_ENV === 'production') {
      const prefix = `[${level.toUpperCase()}]`;
      if (data) {
        const sanitizedData = this.sanitizeData(data);
        return `${prefix} ${message} ${JSON.stringify(sanitizedData)}`;
      }
      return `${prefix} ${message}`;
    }

    // Development formatting with timestamp
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (data) {
      const sanitizedData = this.config.enableSensitiveData ? data : this.sanitizeData(data);
      return `${prefix} ${message} ${JSON.stringify(sanitizedData, null, 2)}`;
    }
    
    return `${prefix} ${message}`;
  }

  debug(message: string, data?: any): void {
    if (!this.shouldLog('debug')) return;
    console.debug(this.formatMessage('debug', message, data));
  }

  info(message: string, data?: any): void {
    if (!this.shouldLog('info')) return;
    console.info(this.formatMessage('info', message, data));
  }

  warn(message: string, data?: any): void {
    if (!this.shouldLog('warn')) return;
    console.warn(this.formatMessage('warn', message, data));
  }

  error(message: string, data?: any): void {
    if (!this.shouldLog('error')) return;
    console.error(this.formatMessage('error', message, data));
  }

  // Production-safe Firebase logging
  firebaseInfo(message: string, config?: any): void {
    if (!this.shouldLog('info')) return;
    
    if (config && process.env.NODE_ENV === 'development') {
      const safeConfig = {
        projectId: config.projectId || '[NOT_SET]',
        authDomain: config.authDomain ? '[SET]' : '[NOT_SET]',
        storageBucket: config.storageBucket ? '[SET]' : '[NOT_SET]',
        apiKey: config.apiKey ? '[REDACTED]' : '[NOT_SET]',
        messagingSenderId: config.messagingSenderId ? '[SET]' : '[NOT_SET]',
        appId: config.appId ? '[SET]' : '[NOT_SET]'
      };
      this.info(message, safeConfig);
    } else {
      // In production, only log the message without config details
      this.info(message);
    }
  }

  // Development-only logging
  devOnly(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    if (process.env.NODE_ENV !== 'development') return;
    this[level](message, data);
  }

  // Silent method - does nothing in production, logs in development
  silent(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] ${message}`, data || '');
    }
  }
}

// Create logger instances with different security levels
export const logger = new SecureLogger({
  enableInProduction: false,
  enableSensitiveData: false,
  enableUUIDLogging: false,
  logLevel: 'error'
});

// Development-only logger
export const devLogger = new SecureLogger({
  enableInProduction: false,
  enableSensitiveData: false,
  enableUUIDLogging: true, // Allow hashed UUIDs in dev
  logLevel: 'debug'
});

// Production-safe logger (only critical errors)
export const prodLogger = new SecureLogger({
  enableInProduction: true,
  enableSensitiveData: false,
  enableUUIDLogging: false,
  logLevel: 'error'
});

// Silent logger for production (no logs at all)
export const silentLogger = new SecureLogger({
  enableInProduction: false,
  enableSensitiveData: false,
  enableUUIDLogging: false,
  logLevel: 'error'
});

export default logger;