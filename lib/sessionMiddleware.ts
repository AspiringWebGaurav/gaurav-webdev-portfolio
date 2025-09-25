// lib/sessionMiddleware.ts
// Strict session validation middleware for enterprise-grade security

import { NextRequest, NextResponse } from 'next/server';
import { 
  validateSecureSessionToken, 
  createSecurityAuditLog,
  SESSION_CONFIG,
  SessionErrorCode,
  type ClientFingerprint,
  type SessionValidationResult 
} from './secureSession';
import { smartLogger } from '@/utils/smartLogger';

export interface SessionMiddlewareConfig {
  // Paths that require session validation
  protectedPaths: string[];
  // Paths that are exempt from session validation
  exemptPaths: string[];
  // Whether to use strict mode (reject any invalid session)
  strictMode: boolean;
  // Whether to log all attempts
  auditAll: boolean;
  // Custom error responses
  customErrors?: {
    invalidSession?: string;
    noSession?: string;
    fingerprintMismatch?: string;
  };
}

export interface SessionMiddlewareResult {
  valid: boolean;
  uuid?: string;
  response?: NextResponse;
  error?: string;
  errorCode?: SessionErrorCode;
}

// Default configuration
const DEFAULT_CONFIG: SessionMiddlewareConfig = {
  protectedPaths: ['/', '/api/visitors', '/api/direct-questions'],
  exemptPaths: ['/api/session', '/api/turnstile', '/_next', '/favicon.ico'],
  strictMode: true,
  auditAll: true,
  customErrors: {
    invalidSession: 'Invalid or expired session',
    noSession: 'Session required',
    fingerprintMismatch: 'Session binding mismatch',
  },
};

/**
 * Extract session token from request headers or cookies
 */
function extractSessionToken(request: NextRequest): string | null {
  // Try Authorization header first (Bearer token)
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Try custom session header
  const sessionHeader = request.headers.get('x-session-token');
  if (sessionHeader) {
    return sessionHeader;
  }
  
  // Try cookie as fallback
  const sessionCookie = request.cookies.get('session-token');
  if (sessionCookie) {
    return sessionCookie.value;
  }
  
  return null;
}

/**
 * Extract client fingerprint from request headers
 */
function extractClientFingerprint(request: NextRequest): ClientFingerprint | null {
  try {
    const fingerprintHeader = request.headers.get('x-client-fingerprint');
    if (!fingerprintHeader) {
      return null;
    }
    
    const fingerprint = JSON.parse(fingerprintHeader);
    
    // Validate required fields
    if (!fingerprint.userAgent || !fingerprint.acceptLanguage || 
        !fingerprint.screenResolution || !fingerprint.timezone || 
        !fingerprint.platform || typeof fingerprint.colorDepth !== 'number') {
      return null;
    }
    
    return fingerprint as ClientFingerprint;
  } catch {
    return null;
  }
}

/**
 * Get client IP address from request
 */
function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const vercelIp = request.headers.get('x-vercel-forwarded-for');
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  return realIp || vercelIp || '127.0.0.1';
}

/**
 * Check if path should be protected by session validation
 */
function shouldValidatePath(path: string, config: SessionMiddlewareConfig): boolean {
  // Check exempt paths first
  for (const exemptPath of config.exemptPaths) {
    if (path.startsWith(exemptPath)) {
      return false;
    }
  }
  
  // Check protected paths
  for (const protectedPath of config.protectedPaths) {
    if (path.startsWith(protectedPath)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Create error response for session validation failures
 */
function createErrorResponse(
  error: string, 
  errorCode: SessionErrorCode, 
  status: number = 401
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error,
      errorCode,
      timestamp: new Date().toISOString(),
    },
    {
      status,
      headers: {
        ...SESSION_CONFIG.SECURITY_HEADERS,
        'WWW-Authenticate': 'Bearer realm="session"',
        'Cache-Control': 'no-store',
      },
    }
  );
}

/**
 * Main session validation middleware function
 */
export async function validateSessionMiddleware(
  request: NextRequest,
  config: SessionMiddlewareConfig = DEFAULT_CONFIG
): Promise<SessionMiddlewareResult> {
  const startTime = Date.now();
  const path = request.nextUrl.pathname;
  const clientIp = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || 'Unknown';
  
  try {
    // Check if path needs session validation
    if (!shouldValidatePath(path, config)) {
      return { valid: true };
    }
    
    smartLogger.api.request('[SessionMiddleware] Validating session for protected path', {
      path,
      ip: clientIp,
      userAgent: userAgent.slice(0, 100),
    });
    
    // Extract session token
    const sessionToken = extractSessionToken(request);
    if (!sessionToken) {
      const auditLog = createSecurityAuditLog('session_failed', {
        valid: false,
        error: config.customErrors?.noSession || 'No session token provided',
        errorCode: SessionErrorCode.INVALID_FORMAT,
        metadata: {
          ip: clientIp,
          userAgent,
          timestamp: Math.floor(Date.now() / 1000),
          attemptId: Math.random().toString(36).substring(2, 15),
        },
      }, {
        path,
        processingTimeMs: Date.now() - startTime,
      });
      
      if (config.auditAll) {
        smartLogger.api.warn('[SessionMiddleware] No session token provided', auditLog);
      }
      
      return {
        valid: false,
        error: config.customErrors?.noSession || 'Session required',
        errorCode: SessionErrorCode.INVALID_FORMAT,
        response: createErrorResponse(
          config.customErrors?.noSession || 'Session required',
          SessionErrorCode.INVALID_FORMAT,
          401
        ),
      };
    }
    
    // Extract client fingerprint
    const clientFingerprint = extractClientFingerprint(request);
    if (!clientFingerprint) {
      const auditLog = createSecurityAuditLog('session_failed', {
        valid: false,
        error: 'No client fingerprint provided',
        errorCode: SessionErrorCode.FINGERPRINT_MISMATCH,
        metadata: {
          ip: clientIp,
          userAgent,
          timestamp: Math.floor(Date.now() / 1000),
          attemptId: Math.random().toString(36).substring(2, 15),
        },
      }, {
        path,
        processingTimeMs: Date.now() - startTime,
      });
      
      if (config.auditAll) {
        smartLogger.api.warn('[SessionMiddleware] No client fingerprint provided', auditLog);
      }
      
      return {
        valid: false,
        error: 'Client fingerprint required',
        errorCode: SessionErrorCode.FINGERPRINT_MISMATCH,
        response: createErrorResponse(
          'Client fingerprint required',
          SessionErrorCode.FINGERPRINT_MISMATCH,
          401
        ),
      };
    }
    
    // Validate session token
    const validationResult: SessionValidationResult = validateSecureSessionToken(
      sessionToken,
      clientFingerprint,
      clientIp,
      userAgent
    );
    
    // Create audit log
    const auditLog = createSecurityAuditLog(
      validationResult.valid ? 'session_validated' : 'session_failed',
      validationResult,
      {
        path,
        processingTimeMs: Date.now() - startTime,
        strictMode: config.strictMode,
      }
    );
    
    if (config.auditAll || !validationResult.valid) {
      const logLevel = validationResult.valid ? 'request' : 'warn';
      smartLogger.api[logLevel](`[SessionMiddleware] Session validation ${validationResult.valid ? 'success' : 'failure'}`, auditLog);
    }
    
    if (!validationResult.valid) {
      // Determine appropriate error message
      let errorMessage = config.customErrors?.invalidSession || 'Invalid session';
      if (validationResult.errorCode === SessionErrorCode.FINGERPRINT_MISMATCH) {
        errorMessage = config.customErrors?.fingerprintMismatch || 'Session binding mismatch';
      }
      
      return {
        valid: false,
        error: validationResult.error,
        errorCode: validationResult.errorCode,
        response: createErrorResponse(
          errorMessage,
          validationResult.errorCode!,
          401
        ),
      };
    }
    
    // Session is valid
    return {
      valid: true,
      uuid: validationResult.token?.uuid,
    };
    
  } catch (error) {
    smartLogger.api.error('[SessionMiddleware] Middleware error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path,
      ip: clientIp,
      processingTimeMs: Date.now() - startTime,
    });
    
    return {
      valid: false,
      error: 'Internal server error',
      response: createErrorResponse(
        'Internal server error',
        SessionErrorCode.INVALID_FORMAT,
        500
      ),
    };
  }
}

/**
 * Next.js middleware wrapper for session validation
 */
export function createSessionMiddleware(config: Partial<SessionMiddlewareConfig> = {}) {
  const finalConfig: SessionMiddlewareConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  };
  
  return async function sessionMiddleware(request: NextRequest) {
    const result = await validateSessionMiddleware(request, finalConfig);
    
    if (!result.valid && result.response) {
      return result.response;
    }
    
    // Add session info to request headers for downstream use
    const response = NextResponse.next();
    
    if (result.uuid) {
      response.headers.set('x-session-uuid', result.uuid);
      response.headers.set('x-session-valid', 'true');
    } else {
      response.headers.set('x-session-valid', 'false');
    }
    
    // Add security headers
    Object.entries(SESSION_CONFIG.SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  };
}

/**
 * Express-style middleware for API routes
 */
export async function requireValidSession(
  request: NextRequest,
  config: Partial<SessionMiddlewareConfig> = {}
): Promise<{ uuid: string } | NextResponse> {
  const finalConfig: SessionMiddlewareConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    protectedPaths: ['/'], // Treat all paths as protected in API context
  };
  
  const result = await validateSessionMiddleware(request, finalConfig);
  
  if (!result.valid) {
    return result.response || createErrorResponse(
      result.error || 'Invalid session',
      result.errorCode || SessionErrorCode.INVALID_FORMAT
    );
  }
  
  if (!result.uuid) {
    return createErrorResponse(
      'Session UUID not found',
      SessionErrorCode.INVALID_FORMAT
    );
  }
  
  return { uuid: result.uuid };
}