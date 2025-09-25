// app/api/session/generate/route.ts
// API endpoint for generating secure HMAC-signed session tokens

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { ratelimit } from '../../../../lib/rateLimit';
import { 
  generateSecureSessionToken, 
  generateVisitorUUID, 
  createFingerprintHash, 
  getIpRange,
  createSecurityAuditLog,
  SESSION_CONFIG,
  type ClientFingerprint,
  type SecurityAuditLog 
} from '@/lib/secureSession';
import { smartLogger } from '@/utils/smartLogger';

// Rate limiting for session generation - More lenient for normal users
const sessionRateLimit = ratelimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 30, // 30 requests per minute per IP (allows page refreshes)
});

interface GenerateSessionRequest {
  fingerprint: ClientFingerprint;
  preferredUUID?: string; // For ban system compatibility
  turnstileToken?: string; // Optional Turnstile verification
}

interface GenerateSessionResponse {
  success: boolean;
  sessionToken?: string;
  uuid?: string;
  expiresIn?: number;
  error?: string;
  retryAfter?: number;
}

export async function POST(req: NextRequest): Promise<NextResponse<GenerateSessionResponse>> {
  const startTime = Date.now();
  let auditLog: SecurityAuditLog | null = null;
  
  try {
    // Get client information
    const headersList = await headers();
    const clientIp = getClientIp(headersList);
    const userAgent = headersList.get('user-agent') || 'Unknown';
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    
    smartLogger.api.request('[SecureSession] Session generation request', {
      ip: clientIp,
      userAgent: userAgent.slice(0, 100),
      forwardedFor,
      realIp
    });

    // Rate limiting check - More generous for legitimate users
    const rateLimitResult = await sessionRateLimit.check(30, clientIp);
    if (!rateLimitResult.success) {
      auditLog = {
        event: 'session_failed',
        ip: clientIp,
        userAgent,
        timestamp: Math.floor(Date.now() / 1000),
        errorCode: 'RATE_LIMITED' as any,
        metadata: {
          rateLimitHit: true,
          retryAfter: rateLimitResult.reset,
        },
      };

      smartLogger.api.warn('[SecureSession] Rate limit exceeded', auditLog);

      return NextResponse.json<GenerateSessionResponse>(
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
    let body: GenerateSessionRequest;
    try {
      body = await req.json();
    } catch (error) {
      auditLog = {
        event: 'session_failed',
        ip: clientIp,
        userAgent,
        timestamp: Math.floor(Date.now() / 1000),
        errorCode: 'INVALID_FORMAT' as any,
        metadata: { parseError: true },
      };

      smartLogger.api.warn('[SecureSession] Invalid request body', { error });

      return NextResponse.json<GenerateSessionResponse>(
        { success: false, error: 'Invalid request format' },
        { status: 400, headers: SESSION_CONFIG.SECURITY_HEADERS }
      );
    }

    // Validate fingerprint
    if (!body.fingerprint || !validateFingerprint(body.fingerprint)) {
      auditLog = {
        event: 'session_failed',
        ip: clientIp,
        userAgent,
        timestamp: Math.floor(Date.now() / 1000),
        errorCode: 'INVALID_FORMAT' as any,
        metadata: { invalidFingerprint: true },
      };

      smartLogger.api.warn('[SecureSession] Invalid fingerprint', auditLog);

      return NextResponse.json<GenerateSessionResponse>(
        { success: false, error: 'Invalid client fingerprint' },
        { status: 400, headers: SESSION_CONFIG.SECURITY_HEADERS }
      );
    }

    // Optional: Verify Turnstile token if provided
    if (body.turnstileToken) {
      const turnstileValid = await verifyTurnstileToken(body.turnstileToken, clientIp);
      if (!turnstileValid) {
        auditLog = {
          event: 'session_failed',
          ip: clientIp,
          userAgent,
          timestamp: Math.floor(Date.now() / 1000),
          errorCode: 'INVALID_FORMAT' as any,
          metadata: { turnstileVerificationFailed: true },
        };

        smartLogger.api.warn('[SecureSession] Turnstile verification failed', auditLog);

        return NextResponse.json<GenerateSessionResponse>(
          { success: false, error: 'Human verification failed' },
          { status: 400, headers: SESSION_CONFIG.SECURITY_HEADERS }
        );
      }
    }

    // Generate or validate UUID for ban system compatibility
    let uuid = body.preferredUUID;
    
    // Validate preferred UUID format if provided
    if (uuid) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(uuid)) {
        smartLogger.api.warn('[SecureSession] Invalid preferred UUID format, generating new one', {
          preferredUUID: uuid,
          ip: clientIp
        });
        uuid = generateVisitorUUID();
      } else {
        smartLogger.api.request('[SecureSession] Using preferred UUID for session', {
          uuid,
          ip: clientIp
        });
      }
    } else {
      // Generate new UUID
      uuid = generateVisitorUUID();
    }

    // Enhance fingerprint with IP range for binding
    const enhancedFingerprint: ClientFingerprint = {
      ...body.fingerprint,
      ipRange: getIpRange(clientIp),
    };

    // Generate secure session token with error handling
    let sessionToken: string;
    try {
      sessionToken = generateSecureSessionToken(uuid, enhancedFingerprint);
    } catch (tokenError) {
      smartLogger.api.error('[SecureSession] Token generation failed', {
        error: tokenError,
        uuid,
        hasFingerprint: !!enhancedFingerprint
      });
      
      return NextResponse.json<GenerateSessionResponse>(
        { success: false, error: 'Token generation failed' },
        { status: 500, headers: SESSION_CONFIG.SECURITY_HEADERS }
      );
    }

    // Create success audit log
    auditLog = {
      event: 'session_created',
      uuid,
      ip: clientIp,
      userAgent,
      timestamp: Math.floor(Date.now() / 1000),
      metadata: {
        fingerprintHash: createFingerprintHash(enhancedFingerprint),
        ipRange: getIpRange(clientIp),
        processingTimeMs: Date.now() - startTime,
        turnstileUsed: !!body.turnstileToken,
      },
    };

    smartLogger.api.request('[SecureSession] Session token generated successfully', auditLog);

    const response: GenerateSessionResponse = {
      success: true,
      sessionToken,
      uuid,
      expiresIn: (SESSION_CONFIG.DURATION_MS || 24 * 60 * 60 * 1000) / 1000, // Fallback to 24 hours
    };

    return NextResponse.json(response, {
      status: 201,
      headers: {
        ...SESSION_CONFIG.SECURITY_HEADERS,
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
      },
    });

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

    smartLogger.api.error('[SecureSession] Session generation failed', { error, auditLog });

    return NextResponse.json<GenerateSessionResponse>(
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
    fingerprint.userAgent.length < 1000
  );
}

async function verifyTurnstileToken(token: string, ip: string): Promise<boolean> {
  try {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
      smartLogger.api.warn('[SecureSession] Turnstile secret key not configured');
      return false;
    }

    const formData = new FormData();
    formData.append('secret', secret);
    formData.append('response', token);
    formData.append('remoteip', ip);

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    smartLogger.api.error('[SecureSession] Turnstile verification error', { error });
    return false;
  }
}