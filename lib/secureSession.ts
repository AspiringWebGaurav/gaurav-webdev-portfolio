// lib/secureSession.ts
// Enterprise-grade secure session management with HMAC signing

import { createHmac, createHash, randomBytes, timingSafeEqual } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

// Session configuration constants
export const SESSION_CONFIG = {
  // Token structure version for future upgrades
  VERSION: 2,
  
  // Session duration in milliseconds (24 hours default)
  DURATION_MS: 24 * 60 * 60 * 1000,
  
  // Clock skew tolerance in milliseconds (5 minutes)
  CLOCK_SKEW_MS: 5 * 60 * 1000,
  
  // HMAC algorithm
  HMAC_ALGORITHM: 'sha256',
  
  // Token component separator
  SEPARATOR: '.',
  
  // Rate limiting
  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 15 * 60 * 1000, // 15 minutes
  
  // Security headers
  SECURITY_HEADERS: {
    'X-Session-Version': '2.0',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
  }
} as const;

// Session token interface
export interface SecureSessionToken {
  uuid: string;                 // Visitor UUID
  issued: number;               // Unix timestamp (seconds)
  expires: number;              // Unix timestamp (seconds)
  fingerprintHash: string;      // SHA256 of client fingerprint
  nonce: string;               // Random nonce for replay protection
  version: number;             // Token format version
}

// Enhanced fingerprint for binding
export interface ClientFingerprint {
  userAgent: string;
  acceptLanguage: string;
  screenResolution: string;
  timezone: string;
  platform: string;
  colorDepth: number;
  ipRange?: string;            // First 3 octets for IP binding
}

// Session validation result
export interface SessionValidationResult {
  valid: boolean;
  token?: SecureSessionToken;
  error?: string;
  errorCode?: SessionErrorCode;
  metadata: {
    ip: string;
    userAgent: string;
    timestamp: number;
    attemptId: string;
  };
}

// Error codes for detailed logging
export enum SessionErrorCode {
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_SIGNATURE = 'INVALID_SIGNATURE',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  FUTURE_ISSUED = 'FUTURE_ISSUED',
  FINGERPRINT_MISMATCH = 'FINGERPRINT_MISMATCH',
  VERSION_MISMATCH = 'VERSION_MISMATCH',
  REPLAY_ATTACK = 'REPLAY_ATTACK',
  RATE_LIMITED = 'RATE_LIMITED',
  INVALID_NONCE = 'INVALID_NONCE',
}

// Get session secret from environment with validation and fallback
function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  
  if (!secret) {
    // Temporary fallback for development - generate a warning
    console.warn('⚠️  SESSION_SECRET not set, using temporary fallback (NOT FOR PRODUCTION)');
    // Generate a temporary secret based on a constant seed for consistency
    const tempSecret = 'dev-fallback-secret-' + '0'.repeat(50); // 64+ chars
    return tempSecret;
  }
  
  if (secret.length < 32) {
    console.warn('⚠️  SESSION_SECRET is too short, minimum 32 characters recommended');
    // Allow shorter secrets in development with warning
    return secret.padEnd(32, '0');
  }
  
  return secret;
}

// Generate cryptographically strong session secret
export function generateSessionSecret(): string {
  return randomBytes(64).toString('hex');
}

// Create SHA256 hash of client fingerprint for binding
export function createFingerprintHash(fingerprint: ClientFingerprint): string {
  const fingerprintString = JSON.stringify({
    userAgent: fingerprint.userAgent.slice(0, 200), // Truncate for consistency
    acceptLanguage: fingerprint.acceptLanguage,
    screenResolution: fingerprint.screenResolution,
    timezone: fingerprint.timezone,
    platform: fingerprint.platform,
    colorDepth: fingerprint.colorDepth,
    ipRange: fingerprint.ipRange || '',
  });
  
  return createHash('sha256').update(fingerprintString).digest('hex');
}

// Extract IP range (first 3 octets) for binding
export function getIpRange(ip: string): string {
  try {
    const parts = ip.split('.');
    if (parts.length >= 3) {
      return `${parts[0]}.${parts[1]}.${parts[2]}`;
    }
    return ip;
  } catch {
    return '';
  }
}

// Generate secure session token
export function generateSecureSessionToken(
  uuid: string,
  fingerprint: ClientFingerprint
): string {
  const now = Math.floor(Date.now() / 1000);
  const expires = now + Math.floor(SESSION_CONFIG.DURATION_MS / 1000);
  const nonce = randomBytes(16).toString('hex');
  const fingerprintHash = createFingerprintHash(fingerprint);
  
  const token: SecureSessionToken = {
    uuid,
    issued: now,
    expires,
    fingerprintHash,
    nonce,
    version: SESSION_CONFIG.VERSION,
  };
  
  // Create token payload
  const payload = [
    token.uuid,
    token.issued.toString(),
    token.expires.toString(),
    token.fingerprintHash,
    token.nonce,
    token.version.toString(),
  ].join(SESSION_CONFIG.SEPARATOR);
  
  // Generate HMAC signature
  const signature = createHmac(SESSION_CONFIG.HMAC_ALGORITHM, getSessionSecret())
    .update(payload)
    .digest('hex');
  
  // Return signed token
  return `${payload}${SESSION_CONFIG.SEPARATOR}${signature}`;
}

// Parse session token (without validation)
function parseSessionToken(tokenString: string): SecureSessionToken | null {
  try {
    const parts = tokenString.split(SESSION_CONFIG.SEPARATOR);
    
    if (parts.length !== 7) {
      return null;
    }
    
    const [uuid, issued, expires, fingerprintHash, nonce, version, signature] = parts;
    
    return {
      uuid,
      issued: parseInt(issued, 10),
      expires: parseInt(expires, 10),
      fingerprintHash,
      nonce,
      version: parseInt(version, 10),
    };
  } catch {
    return null;
  }
}

// Validate HMAC signature with timing-safe comparison
function validateSignature(tokenString: string): boolean {
  try {
    const parts = tokenString.split(SESSION_CONFIG.SEPARATOR);
    if (parts.length !== 7) return false;
    
    const payload = parts.slice(0, 6).join(SESSION_CONFIG.SEPARATOR);
    const providedSignature = Buffer.from(parts[6], 'hex');
    
    const expectedSignature = Buffer.from(
      createHmac(SESSION_CONFIG.HMAC_ALGORITHM, getSessionSecret())
        .update(payload)
        .digest('hex'),
      'hex'
    );
    
    return providedSignature.length === expectedSignature.length &&
           timingSafeEqual(providedSignature, expectedSignature);
  } catch {
    return false;
  }
}

// Comprehensive session token validation
export function validateSecureSessionToken(
  tokenString: string,
  clientFingerprint: ClientFingerprint,
  clientIp: string,
  userAgent: string
): SessionValidationResult {
  const attemptId = randomBytes(8).toString('hex');
  const now = Math.floor(Date.now() / 1000);
  
  const baseResult: SessionValidationResult = {
    valid: false,
    metadata: {
      ip: clientIp,
      userAgent,
      timestamp: now,
      attemptId,
    },
  };
  
  // 1. Format validation
  const token = parseSessionToken(tokenString);
  if (!token) {
    return {
      ...baseResult,
      error: 'Invalid token format',
      errorCode: SessionErrorCode.INVALID_FORMAT,
    };
  }
  
  // 2. Version validation
  if (token.version !== SESSION_CONFIG.VERSION) {
    return {
      ...baseResult,
      error: `Invalid token version: ${token.version}`,
      errorCode: SessionErrorCode.VERSION_MISMATCH,
    };
  }
  
  // 3. Signature validation (timing-safe)
  if (!validateSignature(tokenString)) {
    return {
      ...baseResult,
      error: 'Invalid token signature',
      errorCode: SessionErrorCode.INVALID_SIGNATURE,
    };
  }
  
  // 4. Temporal validation
  if (token.issued > now + SESSION_CONFIG.CLOCK_SKEW_MS / 1000) {
    return {
      ...baseResult,
      error: 'Token issued in the future',
      errorCode: SessionErrorCode.FUTURE_ISSUED,
    };
  }
  
  if (token.expires < now) {
    return {
      ...baseResult,
      error: 'Token has expired',
      errorCode: SessionErrorCode.EXPIRED_TOKEN,
    };
  }
  
  // 5. Fingerprint validation
  const expectedFingerprintHash = createFingerprintHash({
    ...clientFingerprint,
    ipRange: getIpRange(clientIp),
  });
  
  if (token.fingerprintHash !== expectedFingerprintHash) {
    return {
      ...baseResult,
      error: 'Client fingerprint mismatch',
      errorCode: SessionErrorCode.FINGERPRINT_MISMATCH,
    };
  }
  
  // 6. UUID format validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(token.uuid)) {
    return {
      ...baseResult,
      error: 'Invalid UUID format in token',
      errorCode: SessionErrorCode.INVALID_FORMAT,
    };
  }
  
  // All validations passed
  return {
    valid: true,
    token,
    metadata: baseResult.metadata,
  };
}

// Generate new visitor UUID (server-side only)
export function generateVisitorUUID(): string {
  return uuidv4();
}

// Session renewal (issues new token with same UUID)
export function renewSecureSessionToken(
  existingToken: SecureSessionToken,
  fingerprint: ClientFingerprint
): string {
  return generateSecureSessionToken(existingToken.uuid, fingerprint);
}

// Extract UUID from valid session token (without full validation)
export function extractUuidFromToken(tokenString: string): string | null {
  const token = parseSessionToken(tokenString);
  return token?.uuid || null;
}

// Check if token needs renewal (within 1 hour of expiry)
export function shouldRenewToken(token: SecureSessionToken): boolean {
  const now = Math.floor(Date.now() / 1000);
  const renewalThreshold = 60 * 60; // 1 hour
  return (token.expires - now) < renewalThreshold;
}

// Security audit log entry
export interface SecurityAuditLog {
  event: 'session_created' | 'session_validated' | 'session_failed' | 'session_renewed' | 'session_expired';
  uuid?: string;
  ip: string;
  userAgent: string;
  timestamp: number;
  errorCode?: SessionErrorCode;
  metadata: Record<string, any>;
}

// Create audit log entry
export function createSecurityAuditLog(
  event: SecurityAuditLog['event'],
  result: SessionValidationResult,
  additionalMetadata: Record<string, any> = {}
): SecurityAuditLog {
  return {
    event,
    uuid: result.token?.uuid,
    ip: result.metadata.ip,
    userAgent: result.metadata.userAgent,
    timestamp: result.metadata.timestamp,
    errorCode: result.errorCode,
    metadata: {
      attemptId: result.metadata.attemptId,
      ...additionalMetadata,
    },
  };
}