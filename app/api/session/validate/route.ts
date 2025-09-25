// app/api/session/validate/route.ts
// API endpoint for validating secure HMAC-signed session tokens

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { ratelimit } from '../../../../lib/rateLimit';
import { 
  validateSecureSessionToken, 
  createSecurityAuditLog,
  shouldRenewToken,
  renewSecureSessionToken,
  SESSION_CONFIG,
  SessionErrorCode,
  type ClientFingerprint,
  type SessionValidationResult,
  type SecurityAuditLog 
} from '@/lib/secureSession';
import { smartLogger } from '@/utils/smartLogger';

// Rate limiting for validation attempts
const validationRateLimit = ratelimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 60, // 60 validation attempts per minute per IP
});

interface ValidateSessionRequest {
  sessionToken: string;
  fingerprint: ClientFingerprint;
}

interface ValidateSessionResponse {
  success: boolean;
  valid?: boolean;
  uuid?: string;
  needsRenewal?: boolean;
  newToken?: string;
  error?: string;
  errorCode?: string;
  retryAfter?: number;
}

export async function POST(req: NextRequest): Promise<NextResponse<ValidateSessionResponse>> {
  const startTime = Date.now();
  let auditLog: SecurityAuditLog | null = null;
  
  try {
    // Get client information
    const headersList = await headers();
    const clientIp = getClientIp(headersList);
    const userAgent = headersList.get('user-agent') || 'Unknown';
    
    smartLogger.api.request('[SecureSession] Validation request', {
      ip: clientIp,
      userAgent: userAgent.slice(0, 100),
    });

    // Rate limiting check
    const rateLimitResult = await validationRateLimit.check(60, clientIp);
    if (!rateLimitResult.success) {
      auditLog = {
        event: 'session_failed',
        ip: clientIp,
        userAgent,
        timestamp: Math.floor(Date.now() / 1000),
        errorCode: SessionErrorCode.RATE_LIMITED,
        metadata: {
          rateLimitHit: true,
          retryAfter: rateLimitResult.reset,
        },
      };

      smartLogger.api.warn('[SecureSession] Validation rate limit exceeded', auditLog);

      return NextResponse.json<ValidateSessionResponse>(
        { 
          success: false, 
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
            ...SESSION_CONFIG.SECURITY_HEADERS,
          },
        }
      );
    }

    // Parse request body
    let body: ValidateSessionRequest;
    try {
      body = await req.json();
    } catch (error) {
      auditLog = {
        event: 'session_failed',
        ip: clientIp,
        userAgent,
        timestamp: Math.floor(Date.now() / 1000),
        errorCode: SessionErrorCode.INVALID_FORMAT,
        metadata: { parseError: true },
      };

      smartLogger.api.warn('[SecureSession] Invalid validation request body', { error });

      return NextResponse.json<ValidateSessionResponse>(
        { success: false, error: 'Invalid request format' },
        { status: 400, headers: SESSION_CONFIG.SECURITY_HEADERS }
      );
    }

    // Validate required fields
    if (!body.sessionToken || !body.fingerprint) {
      auditLog = {
        event: 'session_failed',
        ip: clientIp,
        userAgent,
        timestamp: Math.floor(Date.now() / 1000),
        errorCode: SessionErrorCode.INVALID_FORMAT,
        metadata: { 
          missingToken: !body.sessionToken,
          missingFingerprint: !body.fingerprint 
        },
      };

      smartLogger.api.warn('[SecureSession] Missing session token or fingerprint', auditLog);

      return NextResponse.json<ValidateSessionResponse>(
        { success: false, error: 'Session token and fingerprint are required' },
        { status: 400, headers: SESSION_CONFIG.SECURITY_HEADERS }
      );
    }

    // Validate fingerprint format
    if (!validateFingerprint(body.fingerprint)) {
      auditLog = {
        event: 'session_failed',
        ip: clientIp,
        userAgent,
        timestamp: Math.floor(Date.now() / 1000),
        errorCode: SessionErrorCode.INVALID_FORMAT,
        metadata: { invalidFingerprint: true },
      };

      smartLogger.api.warn('[SecureSession] Invalid fingerprint format', auditLog);

      return NextResponse.json<ValidateSessionResponse>(
        { success: false, error: 'Invalid client fingerprint' },
        { status: 400, headers: SESSION_CONFIG.SECURITY_HEADERS }
      );
    }

    // Validate session token
    const validationResult: SessionValidationResult = validateSecureSessionToken(
      body.sessionToken,
      body.fingerprint,
      clientIp,
      userAgent
    );

    // Create audit log based on validation result
    if (validationResult.valid) {
      // Check if token needs renewal
      const needsRenewal = validationResult.token && shouldRenewToken(validationResult.token);
      let newToken: string | undefined;

      if (needsRenewal && validationResult.token) {
        try {
          newToken = renewSecureSessionToken(validationResult.token, body.fingerprint);
        } catch (error) {
          smartLogger.api.warn('[SecureSession] Token renewal failed', { error });
        }
      }

      auditLog = createSecurityAuditLog('session_validated', validationResult, {
        needsRenewal,
        tokenRenewed: !!newToken,
        processingTimeMs: Date.now() - startTime,
      });

      smartLogger.api.request('[SecureSession] Session validated successfully', {
        uuid: validationResult.token?.uuid,
        needsRenewal,
        tokenRenewed: !!newToken,
      });

      const response: ValidateSessionResponse = {
        success: true,
        valid: true,
        uuid: validationResult.token?.uuid,
        needsRenewal,
        newToken,
      };

      return NextResponse.json(response, {
        status: 200,
        headers: {
          ...SESSION_CONFIG.SECURITY_HEADERS,
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        },
      });
    } else {
      // Validation failed
      auditLog = createSecurityAuditLog('session_failed', validationResult, {
        processingTimeMs: Date.now() - startTime,
      });

      smartLogger.api.warn('[SecureSession] Session validation failed', {
        error: validationResult.error,
        errorCode: validationResult.errorCode,
        ip: clientIp,
      });

      return NextResponse.json<ValidateSessionResponse>(
        { 
          success: true,
          valid: false,
          error: validationResult.error,
          errorCode: validationResult.errorCode,
        },
        { 
          status: 200, // Return 200 for validation failure to distinguish from system errors
          headers: SESSION_CONFIG.SECURITY_HEADERS 
        }
      );
    }

  } catch (error) {
    // Create error audit log
    auditLog = {
      event: 'session_failed',
      ip: getClientIp(await headers()),
      userAgent: (await headers()).get('user-agent') || 'Unknown',
      timestamp: Math.floor(Date.now() / 1000),
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTimeMs: Date.now() - startTime,
      },
    };

    smartLogger.api.error('[SecureSession] Session validation error', { error, auditLog });

    return NextResponse.json<ValidateSessionResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: SESSION_CONFIG.SECURITY_HEADERS }
    );
  }
}

// GET method not allowed
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405, headers: SESSION_CONFIG.SECURITY_HEADERS }
  );
}

// Utility functions

function getClientIp(headersList: Headers): string {
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  const remoteAddr = headersList.get('x-vercel-forwarded-for'); // Vercel specific
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  return realIp || remoteAddr || '127.0.0.1';
}

function validateFingerprint(fingerprint: ClientFingerprint): boolean {
  return !!(
    fingerprint.userAgent &&
    fingerprint.acceptLanguage &&
    fingerprint.screenResolution &&
    fingerprint.timezone &&
    fingerprint.platform &&
    typeof fingerprint.colorDepth === 'number' &&
    fingerprint.userAgent.length > 10 &&
    fingerprint.userAgent.length < 1000 &&
    fingerprint.screenResolution.match(/^\d+x\d+$/) &&
    fingerprint.colorDepth > 0 &&
    fingerprint.colorDepth <= 48
  );
}