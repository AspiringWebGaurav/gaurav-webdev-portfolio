// lib/sessionConfig.ts
// Enterprise-grade session configuration and security policies

import { SessionErrorCode } from './secureSession';

// Environment types
export type Environment = 'development' | 'staging' | 'production' | 'enterprise';

// Security policy levels
export enum SecurityLevel {
  BASIC = 'BASIC',
  STANDARD = 'STANDARD', 
  HIGH = 'HIGH',
  MAXIMUM = 'MAXIMUM',
}

// Session configuration interface
export interface SessionConfig {
  // Core session settings
  tokenVersion: number;
  tokenDurationMs: number;
  renewalThresholdMs: number;
  clockSkewToleranceMs: number;
  
  // Cryptographic settings
  hmacAlgorithm: 'sha256' | 'sha512';
  secretMinLength: number;
  nonceLength: number;
  
  // Security policies
  securityLevel: SecurityLevel;
  enforceFingerprinting: boolean;
  allowFingerprintChanges: boolean;
  maxFingerprintChanges: number;
  fingerprintChangeWindowMs: number;
  
  // Rate limiting
  rateLimiting: {
    enabled: boolean;
    generateTokens: {
      maxRequests: number;
      windowMs: number;
      burstAllowance: number;
    };
    validateTokens: {
      maxRequests: number;
      windowMs: number;
    };
    bruteForceProtection: {
      maxFailures: number;
      windowMs: number;
      lockoutDurationMs: number;
    };
  };
  
  // Monitoring and alerting
  monitoring: {
    enabled: boolean;
    realTimeAlerts: boolean;
    threatDetection: {
      bruteForceThreshold: number;
      rapidRequestThreshold: number;
      suspiciousPatterns: boolean;
    };
    auditLogging: {
      logLevel: 'minimal' | 'standard' | 'verbose' | 'forensic';
      retentionDays: number;
      includeFingerprints: boolean;
    };
  };
  
  // IP and geographic restrictions
  ipRestrictions: {
    enabled: boolean;
    allowlist: string[];
    blocklist: string[];
    allowPrivateIPs: boolean;
    geoBlocking: {
      enabled: boolean;
      allowedCountries: string[];
      blockedCountries: string[];
    };
  };
  
  // Session binding policies
  binding: {
    ipBinding: 'strict' | 'subnet' | 'disabled';
    userAgentBinding: boolean;
    fingerprintBinding: 'strict' | 'loose' | 'disabled';
    timezoneBinding: boolean;
  };
  
  // Error handling and recovery
  errorHandling: {
    maxRetryAttempts: number;
    retryDelayMs: number;
    gracefulDegradation: boolean;
    fallbackToInsecure: boolean;
  };
  
  // Compliance and governance
  compliance: {
    gdprCompliant: boolean;
    dataRetentionDays: number;
    auditTrail: boolean;
    encryptSensitiveData: boolean;
  };
}

// Default configurations for different security levels
const SECURITY_LEVEL_CONFIGS: Record<SecurityLevel, Partial<SessionConfig>> = {
  [SecurityLevel.BASIC]: {
    tokenDurationMs: 24 * 60 * 60 * 1000, // 24 hours
    renewalThresholdMs: 2 * 60 * 60 * 1000, // 2 hours
    enforceFingerprinting: false,
    allowFingerprintChanges: true,
    maxFingerprintChanges: 10,
    rateLimiting: {
      enabled: true,
      generateTokens: {
        maxRequests: 50,
        windowMs: 60 * 1000,
        burstAllowance: 5,
      },
      validateTokens: {
        maxRequests: 200,
        windowMs: 60 * 1000,
      },
      bruteForceProtection: {
        maxFailures: 10,
        windowMs: 15 * 60 * 1000,
        lockoutDurationMs: 5 * 60 * 1000,
      },
    },
    binding: {
      ipBinding: 'disabled',
      userAgentBinding: false,
      fingerprintBinding: 'disabled',
      timezoneBinding: false,
    },
  },
  
  [SecurityLevel.STANDARD]: {
    tokenDurationMs: 12 * 60 * 60 * 1000, // 12 hours
    renewalThresholdMs: 60 * 60 * 1000, // 1 hour
    enforceFingerprinting: true,
    allowFingerprintChanges: true,
    maxFingerprintChanges: 3,
    rateLimiting: {
      enabled: true,
      generateTokens: {
        maxRequests: 20,
        windowMs: 60 * 1000,
        burstAllowance: 3,
      },
      validateTokens: {
        maxRequests: 100,
        windowMs: 60 * 1000,
      },
      bruteForceProtection: {
        maxFailures: 5,
        windowMs: 10 * 60 * 1000,
        lockoutDurationMs: 15 * 60 * 1000,
      },
    },
    binding: {
      ipBinding: 'subnet',
      userAgentBinding: true,
      fingerprintBinding: 'loose',
      timezoneBinding: false,
    },
  },
  
  [SecurityLevel.HIGH]: {
    tokenDurationMs: 4 * 60 * 60 * 1000, // 4 hours
    renewalThresholdMs: 30 * 60 * 1000, // 30 minutes
    enforceFingerprinting: true,
    allowFingerprintChanges: false,
    maxFingerprintChanges: 1,
    rateLimiting: {
      enabled: true,
      generateTokens: {
        maxRequests: 10,
        windowMs: 60 * 1000,
        burstAllowance: 2,
      },
      validateTokens: {
        maxRequests: 50,
        windowMs: 60 * 1000,
      },
      bruteForceProtection: {
        maxFailures: 3,
        windowMs: 5 * 60 * 1000,
        lockoutDurationMs: 30 * 60 * 1000,
      },
    },
    binding: {
      ipBinding: 'strict',
      userAgentBinding: true,
      fingerprintBinding: 'strict',
      timezoneBinding: true,
    },
  },
  
  [SecurityLevel.MAXIMUM]: {
    tokenDurationMs: 60 * 60 * 1000, // 1 hour
    renewalThresholdMs: 15 * 60 * 1000, // 15 minutes
    enforceFingerprinting: true,
    allowFingerprintChanges: false,
    maxFingerprintChanges: 0,
    rateLimiting: {
      enabled: true,
      generateTokens: {
        maxRequests: 5,
        windowMs: 60 * 1000,
        burstAllowance: 1,
      },
      validateTokens: {
        maxRequests: 20,
        windowMs: 60 * 1000,
      },
      bruteForceProtection: {
        maxFailures: 2,
        windowMs: 2 * 60 * 1000,
        lockoutDurationMs: 60 * 60 * 1000,
      },
    },
    binding: {
      ipBinding: 'strict',
      userAgentBinding: true,
      fingerprintBinding: 'strict',
      timezoneBinding: true,
    },
  },
};

// Environment-specific configurations
const ENVIRONMENT_CONFIGS: Record<Environment, Partial<SessionConfig>> = {
  development: {
    tokenDurationMs: 7 * 24 * 60 * 60 * 1000, // 7 days for dev convenience
    clockSkewToleranceMs: 30 * 60 * 1000, // 30 minutes tolerance
    errorHandling: {
      maxRetryAttempts: 5,
      retryDelayMs: 1000,
      gracefulDegradation: true,
      fallbackToInsecure: false, // Never fallback even in dev
    },
    monitoring: {
      enabled: true,
      realTimeAlerts: false,
      threatDetection: {
        bruteForceThreshold: 10,
        rapidRequestThreshold: 50,
        suspiciousPatterns: true,
      },
      auditLogging: {
        logLevel: 'verbose',
        retentionDays: 30,
        includeFingerprints: true,
      },
    },
    compliance: {
      gdprCompliant: false,
      dataRetentionDays: 30,
      auditTrail: true,
      encryptSensitiveData: false,
    },
  },
  
  staging: {
    tokenDurationMs: 24 * 60 * 60 * 1000, // 24 hours
    clockSkewToleranceMs: 10 * 60 * 1000, // 10 minutes tolerance
    errorHandling: {
      maxRetryAttempts: 3,
      retryDelayMs: 2000,
      gracefulDegradation: false,
      fallbackToInsecure: false,
    },
    monitoring: {
      enabled: true,
      realTimeAlerts: true,
      threatDetection: {
        bruteForceThreshold: 5,
        rapidRequestThreshold: 30,
        suspiciousPatterns: true,
      },
      auditLogging: {
        logLevel: 'standard',
        retentionDays: 90,
        includeFingerprints: true,
      },
    },
    compliance: {
      gdprCompliant: true,
      dataRetentionDays: 90,
      auditTrail: true,
      encryptSensitiveData: true,
    },
  },
  
  production: {
    tokenDurationMs: 8 * 60 * 60 * 1000, // 8 hours
    clockSkewToleranceMs: 5 * 60 * 1000, // 5 minutes tolerance
    errorHandling: {
      maxRetryAttempts: 2,
      retryDelayMs: 5000,
      gracefulDegradation: false,
      fallbackToInsecure: false,
    },
    monitoring: {
      enabled: true,
      realTimeAlerts: true,
      threatDetection: {
        bruteForceThreshold: 3,
        rapidRequestThreshold: 20,
        suspiciousPatterns: true,
      },
      auditLogging: {
        logLevel: 'standard',
        retentionDays: 180,
        includeFingerprints: false, // Privacy protection
      },
    },
    compliance: {
      gdprCompliant: true,
      dataRetentionDays: 180,
      auditTrail: true,
      encryptSensitiveData: true,
    },
  },
  
  enterprise: {
    tokenDurationMs: 4 * 60 * 60 * 1000, // 4 hours
    clockSkewToleranceMs: 2 * 60 * 1000, // 2 minutes tolerance
    errorHandling: {
      maxRetryAttempts: 1,
      retryDelayMs: 10000,
      gracefulDegradation: false,
      fallbackToInsecure: false,
    },
    monitoring: {
      enabled: true,
      realTimeAlerts: true,
      threatDetection: {
        bruteForceThreshold: 2,
        rapidRequestThreshold: 10,
        suspiciousPatterns: true,
      },
      auditLogging: {
        logLevel: 'forensic',
        retentionDays: 365,
        includeFingerprints: true, // For forensic analysis
      },
    },
    compliance: {
      gdprCompliant: true,
      dataRetentionDays: 365,
      auditTrail: true,
      encryptSensitiveData: true,
    },
  },
};

// Base configuration with secure defaults
const BASE_CONFIG: SessionConfig = {
  // Core settings
  tokenVersion: 2,
  tokenDurationMs: 8 * 60 * 60 * 1000, // 8 hours
  renewalThresholdMs: 60 * 60 * 1000, // 1 hour
  clockSkewToleranceMs: 5 * 60 * 1000, // 5 minutes
  
  // Cryptographic settings
  hmacAlgorithm: 'sha256',
  secretMinLength: 64,
  nonceLength: 32,
  
  // Security policies
  securityLevel: SecurityLevel.STANDARD,
  enforceFingerprinting: true,
  allowFingerprintChanges: true,
  maxFingerprintChanges: 3,
  fingerprintChangeWindowMs: 10 * 60 * 1000, // 10 minutes
  
  // Rate limiting
  rateLimiting: {
    enabled: true,
    generateTokens: {
      maxRequests: 10,
      windowMs: 60 * 1000,
      burstAllowance: 2,
    },
    validateTokens: {
      maxRequests: 60,
      windowMs: 60 * 1000,
    },
    bruteForceProtection: {
      maxFailures: 5,
      windowMs: 5 * 60 * 1000,
      lockoutDurationMs: 15 * 60 * 1000,
    },
  },
  
  // Monitoring
  monitoring: {
    enabled: true,
    realTimeAlerts: true,
    threatDetection: {
      bruteForceThreshold: 5,
      rapidRequestThreshold: 20,
      suspiciousPatterns: true,
    },
    auditLogging: {
      logLevel: 'standard',
      retentionDays: 90,
      includeFingerprints: false,
    },
  },
  
  // IP restrictions
  ipRestrictions: {
    enabled: false,
    allowlist: [],
    blocklist: [],
    allowPrivateIPs: true,
    geoBlocking: {
      enabled: false,
      allowedCountries: [],
      blockedCountries: [],
    },
  },
  
  // Session binding
  binding: {
    ipBinding: 'subnet',
    userAgentBinding: true,
    fingerprintBinding: 'loose',
    timezoneBinding: false,
  },
  
  // Error handling
  errorHandling: {
    maxRetryAttempts: 3,
    retryDelayMs: 2000,
    gracefulDegradation: false,
    fallbackToInsecure: false,
  },
  
  // Compliance
  compliance: {
    gdprCompliant: true,
    dataRetentionDays: 90,
    auditTrail: true,
    encryptSensitiveData: true,
  },
};

/**
 * Session configuration manager
 */
class SessionConfigManager {
  private config: SessionConfig;
  private environment: Environment;
  private customOverrides: Partial<SessionConfig> = {};

  constructor(
    environment: Environment = 'production',
    securityLevel: SecurityLevel = SecurityLevel.STANDARD,
    customOverrides: Partial<SessionConfig> = {}
  ) {
    this.environment = environment;
    this.customOverrides = customOverrides;
    this.config = this.buildConfiguration(securityLevel);
  }

  /**
   * Build configuration from base + environment + security level + overrides
   */
  private buildConfiguration(securityLevel: SecurityLevel): SessionConfig {
    const envConfig = ENVIRONMENT_CONFIGS[this.environment] || {};
    const securityConfig = SECURITY_LEVEL_CONFIGS[securityLevel] || {};
    
    return {
      ...BASE_CONFIG,
      ...envConfig,
      ...securityConfig,
      ...this.customOverrides,
      securityLevel, // Ensure security level is set
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): SessionConfig {
    return { ...this.config };
  }

  /**
   * Update security level and rebuild configuration
   */
  setSecurityLevel(level: SecurityLevel): void {
    this.config = this.buildConfiguration(level);
  }

  /**
   * Apply custom configuration overrides
   */
  applyOverrides(overrides: Partial<SessionConfig>): void {
    this.customOverrides = { ...this.customOverrides, ...overrides };
    this.config = { ...this.config, ...overrides };
  }

  /**
   * Validate current configuration
   */
  validateConfiguration(): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate token duration
    if (this.config.tokenDurationMs < 60 * 1000) { // Less than 1 minute
      errors.push('Token duration too short (minimum 1 minute)');
    }
    if (this.config.tokenDurationMs > 7 * 24 * 60 * 60 * 1000) { // More than 7 days
      warnings.push('Token duration very long (more than 7 days)');
    }

    // Validate renewal threshold
    if (this.config.renewalThresholdMs >= this.config.tokenDurationMs) {
      errors.push('Renewal threshold must be less than token duration');
    }

    // Validate rate limiting
    if (this.config.rateLimiting.enabled) {
      if (this.config.rateLimiting.generateTokens.maxRequests < 1) {
        errors.push('Generate tokens rate limit too restrictive');
      }
      if (this.config.rateLimiting.bruteForceProtection.maxFailures < 1) {
        errors.push('Brute force protection too restrictive');
      }
    }

    // Validate security level consistency
    if (this.config.securityLevel === SecurityLevel.MAXIMUM) {
      if (this.config.allowFingerprintChanges) {
        warnings.push('Maximum security should not allow fingerprint changes');
      }
      if (this.config.binding.ipBinding === 'disabled') {
        errors.push('Maximum security requires strict IP binding');
      }
    }

    // Validate compliance settings
    if (this.config.compliance.gdprCompliant && this.config.compliance.dataRetentionDays > 365) {
      warnings.push('GDPR compliance may require shorter data retention');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get configuration for specific use case
   */
  getConfigForUseCase(useCase: 'api_validation' | 'token_generation' | 'monitoring'): Partial<SessionConfig> {
    switch (useCase) {
      case 'api_validation':
        return {
          clockSkewToleranceMs: this.config.clockSkewToleranceMs,
          binding: this.config.binding,
          enforceFingerprinting: this.config.enforceFingerprinting,
          allowFingerprintChanges: this.config.allowFingerprintChanges,
          maxFingerprintChanges: this.config.maxFingerprintChanges,
        };
        
      case 'token_generation':
        return {
          tokenVersion: this.config.tokenVersion,
          tokenDurationMs: this.config.tokenDurationMs,
          hmacAlgorithm: this.config.hmacAlgorithm,
          nonceLength: this.config.nonceLength,
          rateLimiting: this.config.rateLimiting,
        };
        
      case 'monitoring':
        return {
          monitoring: this.config.monitoring,
          compliance: this.config.compliance,
        };
        
      default:
        return this.config;
    }
  }

  /**
   * Export configuration for external systems
   */
  exportConfiguration(): {
    environment: Environment;
    securityLevel: SecurityLevel;
    config: SessionConfig;
    exportedAt: string;
    version: string;
  } {
    return {
      environment: this.environment,
      securityLevel: this.config.securityLevel,
      config: this.getConfig(),
      exportedAt: new Date().toISOString(),
      version: '2.0',
    };
  }
}

// Environment detection and configuration factory
function createSessionConfig(): SessionConfigManager {
  const env = (process.env.NODE_ENV as Environment) || 'production';
  const securityLevel = (process.env.SESSION_SECURITY_LEVEL as SecurityLevel) || SecurityLevel.STANDARD;
  
  // Custom overrides from environment variables
  const customOverrides: Partial<SessionConfig> = {};
  
  if (process.env.SESSION_DURATION_HOURS) {
    customOverrides.tokenDurationMs = parseInt(process.env.SESSION_DURATION_HOURS) * 60 * 60 * 1000;
  }
  
  if (process.env.SESSION_ENFORCE_FINGERPRINTING === 'false') {
    customOverrides.enforceFingerprinting = false;
  }
  
  if (process.env.SESSION_RATE_LIMIT_DISABLED === 'true') {
    customOverrides.rateLimiting = { ...BASE_CONFIG.rateLimiting, enabled: false };
  }
  
  return new SessionConfigManager(env, securityLevel, customOverrides);
}

// Export singleton instance and classes
export const sessionConfig = createSessionConfig();
export { SessionConfigManager };
export default sessionConfig;