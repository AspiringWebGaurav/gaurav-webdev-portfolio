// utils/silentEnvironmentValidator.ts
// Silent environment validation for production - no console output

interface EnvironmentStatus {
  isValid: boolean;
  hasFirebaseClient: boolean;
  hasFirebaseAdmin: boolean;
  hasTurnstile: boolean;
  hasOpenRouter: boolean;
  hasMinimalSetup: boolean;
  missing: string[];
  warnings: string[];
  mode: 'development' | 'production' | 'test';
}

interface ValidationResult {
  status: EnvironmentStatus;
  canProceed: boolean;
  fallbackMode: boolean;
  criticalErrors: string[];
}

/**
 * Silent environment validator that doesn't produce console output in production
 */
class SilentEnvironmentValidator {
  private static instance: SilentEnvironmentValidator;
  private lastValidation: ValidationResult | null = null;
  private validationTimestamp: number = 0;
  private cacheTimeMs = 30000; // Cache validation for 30 seconds

  static getInstance(): SilentEnvironmentValidator {
    if (!SilentEnvironmentValidator.instance) {
      SilentEnvironmentValidator.instance = new SilentEnvironmentValidator();
    }
    return SilentEnvironmentValidator.instance;
  }

  /**
   * Validate environment configuration silently
   */
  public validateEnvironment(forceRefresh = false): ValidationResult {
    const now = Date.now();
    
    // Return cached result if not expired and not forced
    if (!forceRefresh && this.lastValidation && (now - this.validationTimestamp) < this.cacheTimeMs) {
      return this.lastValidation;
    }

    const mode = (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test';
    const missing: string[] = [];
    const warnings: string[] = [];
    const criticalErrors: string[] = [];

    // Check Firebase Client variables
    const firebaseClientVars = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID'
    ];

    const missingFirebaseClient = firebaseClientVars.filter(varName => !this.getEnvVar(varName));
    if (missingFirebaseClient.length > 0) {
      missing.push(...missingFirebaseClient);
    }

    // Check Firebase Admin (server-side)
    const hasFirebaseAdmin = !!this.getEnvVar('FIREBASE_SERVICE_ACCOUNT_KEY');
    if (!hasFirebaseAdmin && typeof window === 'undefined') {
      missing.push('FIREBASE_SERVICE_ACCOUNT_KEY');
    }

    // Check Turnstile
    const hasTurnstile = !!this.getEnvVar('NEXT_PUBLIC_TURNSTILE_SITE_KEY') && !!this.getEnvVar('TURNSTILE_SECRET_KEY');
    if (!hasTurnstile) {
      if (!this.getEnvVar('NEXT_PUBLIC_TURNSTILE_SITE_KEY')) missing.push('NEXT_PUBLIC_TURNSTILE_SITE_KEY');
      if (!this.getEnvVar('TURNSTILE_SECRET_KEY')) missing.push('TURNSTILE_SECRET_KEY');
    }

    // Check OpenRouter API
    const hasOpenRouter = !!this.getEnvVar('NEXT_PUBLIC_OPENROUTER_API_KEY');
    if (!hasOpenRouter) {
      missing.push('NEXT_PUBLIC_OPENROUTER_API_KEY');
    }

    // Determine critical requirements
    const hasFirebaseClient = missingFirebaseClient.length === 0;
    const hasMinimalFirebase = !!(this.getEnvVar('NEXT_PUBLIC_FIREBASE_API_KEY') && this.getEnvVar('NEXT_PUBLIC_FIREBASE_PROJECT_ID'));
    const hasMinimalSetup = hasMinimalFirebase && hasTurnstile;

    // Check for critical errors that would break the app
    if (mode === 'production') {
      if (!hasMinimalFirebase) {
        criticalErrors.push('Firebase configuration incomplete - API/Real-time features will be disabled');
      }
      if (!hasTurnstile) {
        criticalErrors.push('Turnstile configuration missing - Security features will be disabled');
      }
    }

    // Determine validation status
    const isValid = missing.length === 0;
    const canProceed = hasMinimalSetup || mode === 'development';
    const fallbackMode = !hasFirebaseClient || !hasOpenRouter;

    const status: EnvironmentStatus = {
      isValid,
      hasFirebaseClient,
      hasFirebaseAdmin,
      hasTurnstile,
      hasOpenRouter,
      hasMinimalSetup,
      missing,
      warnings,
      mode
    };

    const result: ValidationResult = {
      status,
      canProceed,
      fallbackMode,
      criticalErrors
    };

    // Cache the result
    this.lastValidation = result;
    this.validationTimestamp = now;

    // Only log in development mode
    if (mode === 'development') {
      this.logValidationResult(result);
    }

    return result;
  }

  /**
   * Get environment variable safely
   */
  private getEnvVar(name: string): string | undefined {
    // Server-side
    if (typeof process !== 'undefined' && process.env) {
      return process.env[name];
    }
    
    // Client-side (for public variables)
    if (typeof window !== 'undefined' && name.startsWith('NEXT_PUBLIC_')) {
      // In client-side builds, these should be available
      return (process.env as any)?.[name];
    }

    return undefined;
  }

  /**
   * Log validation result (only in development)
   */
  private logValidationResult(result: ValidationResult): void {
    if (result.status.mode !== 'development') return;

    console.group('🔍 Environment Validation');
    console.log('Mode:', result.status.mode);
    console.log('Valid:', result.status.isValid ? '✅' : '❌');
    console.log('Can Proceed:', result.canProceed ? '✅' : '❌');
    console.log('Fallback Mode:', result.fallbackMode ? '⚠️ Yes' : '✅ No');
    
    console.log('\n📊 Service Status:');
    console.log('  Firebase Client:', result.status.hasFirebaseClient ? '✅' : '❌');
    console.log('  Firebase Admin:', result.status.hasFirebaseAdmin ? '✅' : '❌');
    console.log('  Turnstile:', result.status.hasTurnstile ? '✅' : '❌');
    console.log('  OpenRouter AI:', result.status.hasOpenRouter ? '✅' : '❌');

    if (result.status.missing.length > 0) {
      console.log('\n❌ Missing Variables:', result.status.missing);
    }

    if (result.criticalErrors.length > 0) {
      console.log('\n🚨 Critical Issues:', result.criticalErrors);
    }

    if (result.status.warnings.length > 0) {
      console.log('\n⚠️ Warnings:', result.status.warnings);
    }

    console.groupEnd();
  }

  /**
   * Get a summary string for monitoring (safe for production)
   */
  public getStatusSummary(): string {
    const result = this.validateEnvironment();
    const services = [
      result.status.hasFirebaseClient ? 'FB' : null,
      result.status.hasTurnstile ? 'TS' : null,
      result.status.hasOpenRouter ? 'AI' : null
    ].filter(Boolean).join('+');

    return `${result.status.mode}:${services || 'minimal'}:${result.canProceed ? 'ok' : 'degraded'}`;
  }

  /**
   * Check if a specific service is available
   */
  public hasService(service: 'firebase' | 'turnstile' | 'openrouter' | 'firebase-admin'): boolean {
    const result = this.validateEnvironment();
    
    switch (service) {
      case 'firebase':
        return result.status.hasFirebaseClient;
      case 'firebase-admin':
        return result.status.hasFirebaseAdmin;
      case 'turnstile':
        return result.status.hasTurnstile;
      case 'openrouter':
        return result.status.hasOpenRouter;
      default:
        return false;
    }
  }

  /**
   * Check if app can proceed with current configuration
   */
  public canProceed(): boolean {
    const result = this.validateEnvironment();
    return result.canProceed;
  }

  /**
   * Check if we should use fallback mode
   */
  public shouldUseFallbacks(): boolean {
    const result = this.validateEnvironment();
    return result.fallbackMode;
  }

  /**
   * Get critical errors (safe to expose)
   */
  public getCriticalErrors(): string[] {
    const result = this.validateEnvironment();
    return result.criticalErrors;
  }
}

// Export singleton instance
export const silentEnvValidator = SilentEnvironmentValidator.getInstance();

// Export specific functions for common use cases
export function validateEnvironmentSilently(): ValidationResult {
  return silentEnvValidator.validateEnvironment();
}

export function hasService(service: 'firebase' | 'turnstile' | 'openrouter' | 'firebase-admin'): boolean {
  return silentEnvValidator.hasService(service);
}

export function canAppProceed(): boolean {
  return silentEnvValidator.canProceed();
}

export function shouldUseFallbackMode(): boolean {
  return silentEnvValidator.shouldUseFallbacks();
}

export function getEnvironmentStatusSummary(): string {
  return silentEnvValidator.getStatusSummary();
}

export function getCriticalEnvironmentErrors(): string[] {
  return silentEnvValidator.getCriticalErrors();
}

// Types for external use
export type { EnvironmentStatus, ValidationResult };

export default silentEnvValidator;