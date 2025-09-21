/**
 * Environment Variable Validation Utility
 * Validates critical environment variables for production deployment
 */

import { aiLogger, prodLogger } from './secureLogger';

interface EnvironmentVariable {
  name: string;
  required: boolean;
  category: 'auth' | 'database' | 'ai' | 'security' | 'analytics';
  description: string;
  validationRegex?: RegExp;
  minLength?: number;
  example?: string;
}

interface ValidationResult {
  isValid: boolean;
  variable: string;
  status: 'valid' | 'missing' | 'invalid_format' | 'too_short';
  message: string;
  category: string;
}

interface EnvironmentReport {
  isHealthy: boolean;
  totalVariables: number;
  validVariables: number;
  criticalIssues: ValidationResult[];
  warnings: ValidationResult[];
  recommendations: string[];
}

// CRITICAL FIX: Define all required environment variables
const ENVIRONMENT_VARIABLES: EnvironmentVariable[] = [
  // AI & OpenRouter
  {
    name: 'NEXT_PUBLIC_OPENROUTER_API_KEY',
    required: true,
    category: 'ai',
    description: 'OpenRouter API key for AI chat functionality',
    validationRegex: /^sk-or-v1-[A-Za-z0-9_-]+$/,
    minLength: 50,
    example: 'sk-or-v1-xxxxxxxxxxxxx'
  },
  {
    name: 'OPENROUTER_API_KEY',
    required: false, // Fallback for server-side
    category: 'ai',
    description: 'Server-side OpenRouter API key (fallback)',
    validationRegex: /^sk-or-v1-[A-Za-z0-9_-]+$/,
    minLength: 50
  },

  // Turnstile Security
  {
    name: 'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
    required: true,
    category: 'security',
    description: 'Cloudflare Turnstile site key for CAPTCHA verification',
    validationRegex: /^0x[A-Fa-f0-9]{16}$|^[A-Za-z0-9_-]{40,}$/,
    minLength: 20,
    example: '0x4AAAAAAAxxxxxxxxxxxxx or 1x00000000000000000000AA'
  },
  {
    name: 'TURNSTILE_SECRET_KEY',
    required: true,
    category: 'security',
    description: 'Cloudflare Turnstile secret key for server-side verification',
    validationRegex: /^0x[A-Fa-f0-9]{40}$|^[A-Za-z0-9_-]{40,}$/,
    minLength: 40,
    example: '0x4AAAAAAABBBBBBBBCCCCCCCCDDDDDDDDEEEEEEEE'
  },

  // Firebase Configuration
  {
    name: 'NEXT_PUBLIC_FIREBASE_API_KEY',
    required: true,
    category: 'database',
    description: 'Firebase API key for authentication and database access',
    validationRegex: /^AIza[A-Za-z0-9_-]{35}$/,
    minLength: 39,
    example: 'AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
  },
  {
    name: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    required: true,
    category: 'database',
    description: 'Firebase authentication domain',
    validationRegex: /^[a-z0-9-]+\.firebaseapp\.com$/,
    minLength: 10,
    example: 'your-project.firebaseapp.com'
  },
  {
    name: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    required: true,
    category: 'database',
    description: 'Firebase project identifier',
    validationRegex: /^[a-z0-9-]+$/,
    minLength: 3,
    example: 'your-project-id'
  },
  {
    name: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    required: true,
    category: 'database',
    description: 'Firebase storage bucket URL',
    validationRegex: /^[a-z0-9-]+\.appspot\.com$/,
    minLength: 10,
    example: 'your-project.appspot.com'
  },
  {
    name: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    required: true,
    category: 'database',
    description: 'Firebase messaging sender ID',
    validationRegex: /^\d{12}$/,
    minLength: 12,
    example: '123456789012'
  },
  {
    name: 'NEXT_PUBLIC_FIREBASE_APP_ID',
    required: true,
    category: 'database',
    description: 'Firebase application ID',
    validationRegex: /^1:[0-9]+:web:[a-f0-9]+$/,
    minLength: 20,
    example: '1:123456789012:web:abcdef123456'
  },

  // Optional but recommended
  {
    name: 'NODE_ENV',
    required: true,
    category: 'auth',
    description: 'Node.js environment mode',
    validationRegex: /^(development|production|test)$/
  },
  {
    name: 'NEXT_PUBLIC_VERCEL_URL',
    required: false,
    category: 'auth',
    description: 'Vercel deployment URL for CORS and redirects'
  }
];

/**
 * Validate a single environment variable
 */
function validateVariable(envVar: EnvironmentVariable): ValidationResult {
  const value = process.env[envVar.name];
  
  if (!value) {
    return {
      isValid: false,
      variable: envVar.name,
      status: 'missing',
      message: envVar.required 
        ? `Critical: ${envVar.description} is required but not set`
        : `Optional: ${envVar.description} is not set`,
      category: envVar.category
    };
  }

  // Check minimum length
  if (envVar.minLength && value.length < envVar.minLength) {
    return {
      isValid: false,
      variable: envVar.name,
      status: 'too_short',
      message: `${envVar.description} is too short (${value.length} chars, minimum ${envVar.minLength})`,
      category: envVar.category
    };
  }

  // Check format with regex
  if (envVar.validationRegex && !envVar.validationRegex.test(value)) {
    return {
      isValid: false,
      variable: envVar.name,
      status: 'invalid_format',
      message: `${envVar.description} has invalid format. Expected format: ${envVar.example || 'see documentation'}`,
      category: envVar.category
    };
  }

  return {
    isValid: true,
    variable: envVar.name,
    status: 'valid',
    message: `${envVar.description} is properly configured`,
    category: envVar.category
  };
}

/**
 * Validate all environment variables and generate report
 */
export function validateEnvironment(): EnvironmentReport {
  const results = ENVIRONMENT_VARIABLES.map(validateVariable);
  
  const validVariables = results.filter(r => r.isValid).length;
  const criticalIssues = results.filter(r => !r.isValid && 
    ENVIRONMENT_VARIABLES.find(env => env.name === r.variable)?.required
  );
  const warnings = results.filter(r => !r.isValid && 
    !ENVIRONMENT_VARIABLES.find(env => env.name === r.variable)?.required
  );

  const recommendations: string[] = [];
  
  // Generate recommendations based on issues
  if (criticalIssues.some(issue => issue.category === 'ai')) {
    recommendations.push('Configure OpenRouter API key for AI chat functionality');
  }
  
  if (criticalIssues.some(issue => issue.category === 'security')) {
    recommendations.push('Configure Cloudflare Turnstile keys for security verification');
  }
  
  if (criticalIssues.some(issue => issue.category === 'database')) {
    recommendations.push('Configure Firebase credentials for database access');
  }

  if (process.env.NODE_ENV === 'production' && warnings.length > 0) {
    recommendations.push('Consider setting optional environment variables for production');
  }

  const isHealthy = criticalIssues.length === 0;

  return {
    isHealthy,
    totalVariables: ENVIRONMENT_VARIABLES.length,
    validVariables,
    criticalIssues,
    warnings,
    recommendations
  };
}

/**
 * Log environment validation results
 */
export function logEnvironmentStatus(): EnvironmentReport {
  const report = validateEnvironment();
  
  if (report.isHealthy) {
    aiLogger.warn('Environment validation passed', {
      validVariables: report.validVariables,
      totalVariables: report.totalVariables,
      warnings: report.warnings.length,
      timestamp: new Date().toISOString()
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Environment validation passed');
      if (report.warnings.length > 0) {
        console.warn(`⚠️  ${report.warnings.length} optional variables missing`);
      }
    }
  } else {
    aiLogger.error('Environment validation failed', {
      criticalIssues: report.criticalIssues.length,
      validVariables: report.validVariables,
      totalVariables: report.totalVariables,
      failedVariables: report.criticalIssues.map(issue => ({
        variable: issue.variable,
        status: issue.status,
        category: issue.category
      })),
      timestamp: new Date().toISOString()
    });
    
    prodLogger.error('Critical environment variables missing', {
      issueCount: report.criticalIssues.length,
      timestamp: new Date().toISOString()
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Environment validation failed');
      report.criticalIssues.forEach(issue => {
        console.error(`   ${issue.variable}: ${issue.message}`);
      });
      
      if (report.recommendations.length > 0) {
        console.log('\n📋 Recommendations:');
        report.recommendations.forEach(rec => {
          console.log(`   - ${rec}`);
        });
      }
    }
  }
  
  return report;
}

/**
 * Get environment health status for monitoring
 */
export function getEnvironmentHealth(): {
  status: 'healthy' | 'degraded' | 'critical';
  issues: number;
  message: string;
} {
  const report = validateEnvironment();
  
  if (report.isHealthy) {
    return {
      status: report.warnings.length === 0 ? 'healthy' : 'degraded',
      issues: report.warnings.length,
      message: report.warnings.length === 0 
        ? 'All environment variables properly configured'
        : `${report.warnings.length} optional variables missing`
    };
  } else {
    return {
      status: 'critical',
      issues: report.criticalIssues.length,
      message: `${report.criticalIssues.length} critical environment variables missing or invalid`
    };
  }
}

/**
 * Check specific service availability based on environment
 */
export function checkServiceAvailability(): {
  ai: boolean;
  security: boolean;
  database: boolean;
  overall: boolean;
} {
  const report = validateEnvironment();
  
  const ai = !report.criticalIssues.some(issue => issue.category === 'ai');
  const security = !report.criticalIssues.some(issue => issue.category === 'security');
  const database = !report.criticalIssues.some(issue => issue.category === 'database');
  
  return {
    ai,
    security,
    database,
    overall: ai && security && database
  };
}

export default {
  validateEnvironment,
  logEnvironmentStatus,
  getEnvironmentHealth,
  checkServiceAvailability
};