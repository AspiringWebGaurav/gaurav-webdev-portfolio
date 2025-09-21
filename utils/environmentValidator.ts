// utils/environmentValidator.ts
// Comprehensive environment variable validation with graceful fallbacks

interface EnvironmentValidationResult {
  isValid: boolean;
  missing: string[];
  warnings: string[];
  config: Record<string, string | null>;
}

interface ValidationConfig {
  required?: string[];
  optional?: string[];
  validateInProduction?: boolean;
  logLevel?: 'none' | 'warn' | 'error';
}

/**
 * Validate environment variables with detailed reporting
 */
export function validateEnvironment(config: ValidationConfig = {}): EnvironmentValidationResult {
  const {
    required = [],
    optional = [],
    validateInProduction = true,
    logLevel = 'warn'
  } = config;

  const result: EnvironmentValidationResult = {
    isValid: true,
    missing: [],
    warnings: [],
    config: {}
  };

  // Check required variables
  for (const varName of required) {
    const value = process.env[varName];
    result.config[varName] = value || null;
    
    if (!value) {
      result.missing.push(varName);
      result.isValid = false;
    }
  }

  // Check optional variables
  for (const varName of optional) {
    const value = process.env[varName];
    result.config[varName] = value || null;
    
    if (!value) {
      result.warnings.push(`Optional variable ${varName} is not set`);
    }
  }

  // Logging based on configuration
  if (logLevel !== 'none') {
    if (result.missing.length > 0) {
      const message = `❌ [Environment] Missing required variables: ${result.missing.join(', ')}`;
      if (logLevel === 'error') {
        console.error(message);
      } else {
        console.warn(message);
      }
    }

    if (result.warnings.length > 0 && logLevel === 'warn') {
      console.warn(`⚠️  [Environment] Warnings: ${result.warnings.join(', ')}`);
    }

    if (result.isValid) {
      console.log(`✅ [Environment] All required variables validated`);
    }
  }

  return result;
}

/**
 * Firebase-specific environment validation
 */
export function validateFirebaseEnvironment(): EnvironmentValidationResult {
  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
  ];

  const optionalVars = [
    'FIREBASE_SERVICE_ACCOUNT_KEY',
    'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID'
  ];

  return validateEnvironment({
    required: requiredVars,
    optional: optionalVars,
    validateInProduction: true,
    logLevel: 'warn'
  });
}

/**
 * Check if we're in a serverless environment where some features might be limited
 */
export function getEnvironmentInfo() {
  const info = {
    isServerless: !!(process.env.VERCEL || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME),
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    platform: process.env.VERCEL ? 'vercel' : process.env.NETLIFY ? 'netlify' : 'other',
    hasFirebaseAdmin: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
    hasFirebaseClient: !!(
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    )
  };

  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [Environment] Info:', info);
  }

  return info;
}

/**
 * Create fallback configuration when environment variables are missing
 */
export function createFallbackConfig(validationResult: EnvironmentValidationResult) {
  const fallbacks = {
    useAPIFallbacks: !validationResult.isValid,
    clientSideFirebase: false,
    serverSideFirebase: false,
    features: {
      realTimeQuestions: false,
      clientSideQuestions: false,
      notificationsEnabled: false,
      adminPanelEnabled: false
    },
    degradedExperience: true
  };

  // Determine what features can work with current config
  if (validationResult.config['NEXT_PUBLIC_FIREBASE_API_KEY'] && 
      validationResult.config['NEXT_PUBLIC_FIREBASE_PROJECT_ID']) {
    fallbacks.clientSideFirebase = true;
    fallbacks.features.clientSideQuestions = true;
    fallbacks.features.realTimeQuestions = true;
  }

  if (validationResult.config['FIREBASE_SERVICE_ACCOUNT_KEY']) {
    fallbacks.serverSideFirebase = true;
    fallbacks.features.adminPanelEnabled = true;
  }

  if (fallbacks.clientSideFirebase) {
    fallbacks.degradedExperience = false;
    fallbacks.features.notificationsEnabled = true;
  }

  return fallbacks;
}

/**
 * Throw environment error with helpful debugging information
 */
export function throwEnvironmentError(
  validationResult: EnvironmentValidationResult, 
  context: string = 'application'
) {
  const missing = validationResult.missing;
  const platform = getEnvironmentInfo().platform;
  
  let errorMessage = `🔥 ${context} initialization failed: Missing environment variables -> ${missing.join(', ')}\n\n`;
  
  errorMessage += `📋 Required Environment Variables:\n`;
  missing.forEach(varName => {
    errorMessage += `  - ${varName}\n`;
  });
  
  errorMessage += `\n🔧 How to fix this:\n`;
  errorMessage += `  1. Add missing variables to your .env.local file (development)\n`;
  
  if (platform === 'vercel') {
    errorMessage += `  2. Add variables in Vercel dashboard: Settings > Environment Variables\n`;
  } else if (platform === 'netlify') {
    errorMessage += `  2. Add variables in Netlify dashboard: Site Settings > Environment Variables\n`;
  } else {
    errorMessage += `  2. Set variables in your deployment platform\n`;
  }
  
  errorMessage += `  3. Ensure variables are prefixed with NEXT_PUBLIC_ for client-side access\n`;
  errorMessage += `  4. Restart your development server after adding variables\n\n`;
  
  errorMessage += `🌐 Current Environment: ${process.env.NODE_ENV} on ${platform}\n`;
  errorMessage += `📱 Platform: ${platform}\n`;

  throw new Error(errorMessage);
}

/**
 * Log environment status for debugging
 */
export function logEnvironmentStatus() {
  const firebaseValidation = validateFirebaseEnvironment();
  const envInfo = getEnvironmentInfo();
  const fallbackConfig = createFallbackConfig(firebaseValidation);

  console.group('🔍 Environment Status Report');
  console.log('Platform:', envInfo.platform);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Firebase Client Available:', envInfo.hasFirebaseClient);
  console.log('Firebase Admin Available:', envInfo.hasFirebaseAdmin);
  console.log('Using API Fallbacks:', fallbackConfig.useAPIFallbacks);
  console.log('Degraded Experience:', fallbackConfig.degradedExperience);
  console.log('Available Features:', fallbackConfig.features);
  
  if (firebaseValidation.missing.length > 0) {
    console.warn('Missing Variables:', firebaseValidation.missing);
  }
  
  if (firebaseValidation.warnings.length > 0) {
    console.warn('Warnings:', firebaseValidation.warnings);
  }
  
  console.groupEnd();
}

export default {
  validateEnvironment,
  validateFirebaseEnvironment,
  getEnvironmentInfo,
  createFallbackConfig,
  throwEnvironmentError,
  logEnvironmentStatus
};