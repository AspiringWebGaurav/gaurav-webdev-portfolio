/**
 * Cloudflare Turnstile Server-side Utilities
 * Handles verification of Turnstile tokens with Cloudflare
 */

import { 
  TurnstileServerResponse, 
  TurnstileVerificationRequest, 
  TurnstileVerificationResponse 
} from './types/turnstile';

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Verify Turnstile token with Cloudflare's servers
 * @param token - The Turnstile token to verify
 * @param remoteip - Optional client IP address
 * @returns Promise<TurnstileVerificationResponse>
 */
export async function verifyTurnstileToken(
  token: string, 
  remoteip?: string
): Promise<TurnstileVerificationResponse> {
  try {
    // Validate inputs
    if (!token || typeof token !== 'string') {
      return {
        success: false,
        message: 'Invalid token provided',
        errors: ['INVALID_TOKEN']
      };
    }

    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) {
      console.error('[Turnstile] TURNSTILE_SECRET_KEY environment variable not set');
      return {
        success: false,
        message: 'Server configuration error',
        errors: ['MISSING_SECRET_KEY']
      };
    }

    // Prepare form data for Cloudflare API
    const formData = new URLSearchParams({
      secret: secretKey,
      response: token
    });

    // Add remote IP if provided (optional but recommended)
    if (remoteip) {
      formData.append('remoteip', remoteip);
    }

    console.log('[Turnstile] Verifying token with Cloudflare...');

    // Make request to Cloudflare verification endpoint
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });

    if (!response.ok) {
      console.error('[Turnstile] HTTP error from Cloudflare:', response.status, response.statusText);
      return {
        success: false,
        message: 'Failed to verify with Cloudflare',
        errors: [`HTTP_${response.status}`]
      };
    }

    const result: TurnstileServerResponse = await response.json();

    // Log verification result (without sensitive data)
    console.log('[Turnstile] Verification result:', {
      success: result.success,
      hostname: result.hostname,
      challenge_ts: result.challenge_ts,
      hasErrors: !!result['error-codes']?.length
    });

    // Handle success case
    if (result.success) {
      return {
        success: true,
        message: 'Verification successful',
        challenge_ts: result.challenge_ts,
        hostname: result.hostname
      };
    }

    // Handle failure case
    const errorCodes = result['error-codes'] || ['UNKNOWN_ERROR'];
    return {
      success: false,
      message: getErrorMessage(errorCodes),
      errors: errorCodes
    };

  } catch (error) {
    console.error('[Turnstile] Verification error:', error);
    return {
      success: false,
      message: 'Network error during verification',
      errors: ['NETWORK_ERROR']
    };
  }
}

/**
 * Convert Cloudflare error codes to human-readable messages
 * @param errorCodes - Array of error codes from Cloudflare
 * @returns User-friendly error message
 */
function getErrorMessage(errorCodes: string[]): string {
  const errorMap: Record<string, string> = {
    'missing-input-secret': 'Server configuration error',
    'invalid-input-secret': 'Server configuration error',
    'missing-input-response': 'Verification token required',
    'invalid-input-response': 'Invalid verification token',
    'bad-request': 'Invalid request format',
    'timeout-or-duplicate': 'Token expired or already used',
    'internal-error': 'Verification service temporarily unavailable'
  };

  // Find the first known error code
  for (const code of errorCodes) {
    if (errorMap[code]) {
      return errorMap[code];
    }
  }

  // Default message for unknown errors
  return 'Verification failed. Please try again.';
}

/**
 * Extract client IP address from request headers
 * Useful for rate limiting and security
 * @param headers - Request headers
 * @returns Client IP address or undefined
 */
export function getClientIP(headers: Headers): string | undefined {
  // Check various headers in order of preference
  const possibleHeaders = [
    'cf-connecting-ip',      // Cloudflare
    'x-forwarded-for',       // Standard proxy header
    'x-real-ip',             // Nginx
    'x-client-ip',           // Apache
    'x-forwarded',           // General
    'forwarded-for',         // General
    'forwarded'              // RFC 7239
  ];

  for (const header of possibleHeaders) {
    const value = headers.get(header);
    if (value) {
      // Handle comma-separated IPs (take first one)
      const ip = value.split(',')[0].trim();
      if (ip && isValidIP(ip)) {
        return ip;
      }
    }
  }

  return undefined;
}

/**
 * Basic IP address validation
 * @param ip - IP address to validate
 * @returns true if valid IP format
 */
function isValidIP(ip: string): boolean {
  // IPv4 regex
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  
  // IPv6 regex (simplified)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Rate limiting helper - track verification attempts
 * Simple in-memory rate limiting (consider Redis for production)
 */
const verificationAttempts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string, maxAttempts = 5, windowMs = 300000): boolean {
  const now = Date.now();
  const key = identifier;
  
  const attempt = verificationAttempts.get(key);
  
  if (!attempt || now > attempt.resetTime) {
    // First attempt or window expired
    verificationAttempts.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    return true;
  }
  
  if (attempt.count >= maxAttempts) {
    return false; // Rate limit exceeded
  }
  
  // Increment attempt count
  attempt.count++;
  return true;
}

/**
 * Clean up expired rate limit entries
 * Call this periodically to prevent memory leaks
 */
export function cleanupRateLimit(): void {
  const now = Date.now();
  for (const [key, attempt] of verificationAttempts.entries()) {
    if (now > attempt.resetTime) {
      verificationAttempts.delete(key);
    }
  }
}

// Auto-cleanup every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimit, 600000);
}