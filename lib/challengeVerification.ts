/**
 * Challenge Verification Utility
 * Shared between challenge generation and verification routes
 */

import crypto from "crypto";

// In-memory challenge store (use Redis in production for multi-instance)
export const challengeStore = new Map<string, {
  nonce: string;
  timestamp: number;
  ip: string;
  used: boolean;
}>();

// Rate limiting store (IP → attempts)
export const rateLimitStore = new Map<string, {
  attempts: number;
  resetTime: number;
}>();

// Cleanup old challenges every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of challengeStore.entries()) {
      if (now - value.timestamp > 60000 || value.used) {
        challengeStore.delete(key);
      }
    }
  }, 300000);
}

/**
 * Verify challenge signature
 */
export function verifyChallenge(
  challengeId: string,
  providedSignature: string,
  password: string
): { valid: boolean; error?: string } {
  const challenge = challengeStore.get(challengeId);

  if (!challenge) {
    return { valid: false, error: "Invalid or expired challenge" };
  }

  if (challenge.used) {
    return { valid: false, error: "Challenge already used" };
  }

  const now = Date.now();
  if (now - challenge.timestamp > 60000) {
    challengeStore.delete(challengeId);
    return { valid: false, error: "Challenge expired" };
  }

  // Create expected signature: HMAC-SHA256(nonce + timestamp + password)
  const expectedSignature = crypto
    .createHmac("sha256", password)
    .update(`${challenge.nonce}:${challenge.timestamp}`)
    .digest("hex");

  if (providedSignature !== expectedSignature) {
    return { valid: false, error: "Invalid signature" };
  }

  // Mark challenge as used (prevent replay attacks)
  challenge.used = true;

  return { valid: true };
}

/**
 * Get client IP from request
 */
export function getClientIP(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Check rate limiting
 */
export function checkRateLimit(ip: string, maxAttempts: number = 50, windowMs: number = 60000): boolean {
  // In development, allow much higher rate limits for localhost to enable testing
  if (process.env.NODE_ENV === 'development' && (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost')) {
    maxAttempts = 200; // 4x normal rate for testing
  }
  
  const now = Date.now();
  const limit = rateLimitStore.get(ip);

  if (!limit || now > limit.resetTime) {
    rateLimitStore.set(ip, {
      attempts: 1,
      resetTime: now + windowMs
    });
    return true;
  }

  if (limit.attempts >= maxAttempts) {
    return false;
  }

  limit.attempts++;
  return true;
}
