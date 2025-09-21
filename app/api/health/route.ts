/**
 * Health Monitoring API Route
 * GET /api/health
 * Comprehensive system health check for production monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateEnvironment, getEnvironmentHealth, checkServiceAvailability } from '@/utils/environmentValidator';
import { aiServiceHealthMonitor } from '@/utils/aiServiceLayer';
import { aiLogger } from '@/utils/secureLogger';

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'critical';
  timestamp: string;
  version: string;
  environment: string;
  services: {
    ai: {
      status: 'healthy' | 'degraded' | 'down';
      openrouter: 'healthy' | 'degraded' | 'down';
      firebase: 'healthy' | 'degraded' | 'down';
    };
    security: {
      turnstile: 'configured' | 'missing' | 'invalid';
      environment: 'secure' | 'exposed' | 'misconfigured';
    };
    database: {
      firebase: 'configured' | 'missing' | 'invalid';
      connection: 'unknown' | 'connected' | 'disconnected';
    };
  };
  environment_validation: {
    status: 'healthy' | 'degraded' | 'critical';
    issues: number;
    critical_missing: string[];
    warnings: string[];
  };
  uptime: number;
  memory?: {
    used: number;
    total: number;
    percentage: number;
  };
  performance: {
    response_time_ms: number;
    checks_completed: number;
  };
  recommendations: string[];
}

// Track startup time for uptime calculation
const startupTime = Date.now();

export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  let checksCompleted = 0;

  try {
    // Environment validation
    checksCompleted++;
    const envReport = validateEnvironment();
    const envHealth = getEnvironmentHealth();
    const serviceAvailability = checkServiceAvailability();

    // AI service health
    checksCompleted++;
    let aiServiceStatus = 'down';
    let firebaseStatus = 'down';
    let openrouterStatus = 'down';
    
    try {
      const aiHealth = aiServiceHealthMonitor.getOverallStatus();
      aiServiceStatus = aiHealth.overall;
      firebaseStatus = aiHealth.firebase;
      openrouterStatus = aiHealth.openrouter;
    } catch (error) {
      aiLogger.warn('Failed to get AI service health', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Security checks
    checksCompleted++;
    const turnstileConfigured = !!(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY);
    const turnstileStatus = turnstileConfigured ? 'configured' : 'missing';

    // Environment security assessment
    const environmentSecurity = process.env.NODE_ENV === 'production' ? 'secure' : 
                               process.env.NODE_ENV === 'development' ? 'exposed' : 'misconfigured';

    // Database checks
    checksCompleted++;
    const firebaseConfigured = !!(
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    );

    // Memory usage (if available)
    let memoryInfo = undefined;
    if (typeof process !== 'undefined' && process.memoryUsage) {
      try {
        const mem = process.memoryUsage();
        memoryInfo = {
          used: Math.round(mem.heapUsed / 1024 / 1024), // MB
          total: Math.round(mem.heapTotal / 1024 / 1024), // MB
          percentage: Math.round((mem.heapUsed / mem.heapTotal) * 100)
        };
      } catch (e) {
        // Memory info not available
      }
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (!serviceAvailability.ai) {
      recommendations.push('Configure OpenRouter API key for AI functionality');
    }
    if (!serviceAvailability.security) {
      recommendations.push('Configure Cloudflare Turnstile for security verification');
    }
    if (!serviceAvailability.database) {
      recommendations.push('Configure Firebase credentials for data persistence');
    }
    if (envHealth.status === 'critical') {
      recommendations.push('Fix critical environment variable configuration issues');
    }
    if (process.env.NODE_ENV !== 'production' && request.url.includes('gauravpatil.online')) {
      recommendations.push('Ensure NODE_ENV is set to "production" in deployment');
    }

    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';
    
    if (!serviceAvailability.overall || envHealth.status === 'critical') {
      overallStatus = 'critical';
    } else if (
      envHealth.status === 'degraded' || 
      aiServiceStatus === 'degraded' ||
      !turnstileConfigured
    ) {
      overallStatus = 'degraded';
    }

    const responseTime = Date.now() - startTime;
    const uptime = Date.now() - startupTime;

    const healthResponse: HealthResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'unknown',
      services: {
        ai: {
          status: serviceAvailability.ai ? (aiServiceStatus as any) : 'down',
          openrouter: openrouterStatus as any,
          firebase: firebaseStatus as any
        },
        security: {
          turnstile: turnstileStatus as any,
          environment: environmentSecurity as any
        },
        database: {
          firebase: firebaseConfigured ? 'configured' : 'missing',
          connection: 'unknown' // Would need actual connection test
        }
      },
      environment_validation: {
        status: envHealth.status,
        issues: envHealth.issues,
        critical_missing: envReport.criticalIssues.map(issue => issue.variable),
        warnings: envReport.warnings.map(warning => warning.variable)
      },
      uptime: Math.round(uptime / 1000), // seconds
      memory: memoryInfo,
      performance: {
        response_time_ms: responseTime,
        checks_completed: checksCompleted
      },
      recommendations
    };

    // Log health check results
    if (overallStatus === 'critical') {
      aiLogger.error('System health check failed', {
        status: overallStatus,
        criticalIssues: envReport.criticalIssues.length,
        recommendations: recommendations.length,
        responseTime,
        timestamp: new Date().toISOString()
      });
    } else if (overallStatus === 'degraded') {
      aiLogger.warn('System health check shows degraded performance', {
        status: overallStatus,
        warnings: envReport.warnings.length,
        recommendations: recommendations.length,
        responseTime,
        timestamp: new Date().toISOString()
      });
    }

    // Return appropriate HTTP status based on health
    const httpStatus = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;

    return NextResponse.json(healthResponse, { status: httpStatus });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    aiLogger.error('Health check endpoint error', {
      error: errorMessage,
      checksCompleted,
      timestamp: new Date().toISOString()
    });

    const errorResponse: Partial<HealthResponse> = {
      status: 'critical',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'unknown',
      performance: {
        response_time_ms: Date.now() - startTime,
        checks_completed: checksCompleted
      },
      recommendations: ['System health check failed - check server logs', 'Contact system administrator']
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Handle other HTTP methods
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}