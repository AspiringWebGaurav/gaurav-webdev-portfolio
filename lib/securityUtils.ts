/**
 * Shared Security Utilities for Challenge-Response Authentication
 * Enterprise-grade security helpers
 */

import crypto from "crypto";

// Challenge store interface
export interface ChallengeData {
  nonce: string;
  timestamp: number;
  ip: string;
  used: boolean;
}

// In-memory stores (use Redis in production for multi-instance)
export const challengeStore = new Map<string, ChallengeData>();
export const rateLimitStore = new Map<string, { attempts: number; resetTime: number }>();

/**
 * Verify challenge-response signature
 * @param challengeId - Challenge identifier
 * @param providedSignature - Client-generated signature
 * @param password - Server password to verify against
 * @returns Verification result
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
 * Check rate limiting for IP address
 * @param ip - Client IP address
 * @returns True if within rate limit, false if exceeded
 */
export function checkRateLimit(ip: string): boolean {
  const RATE_LIMIT_WINDOW = 60000; // 1 minute
  const MAX_ATTEMPTS_PER_WINDOW = 10;
  
  const now = Date.now();
  const limit = rateLimitStore.get(ip);

  if (!limit || now > limit.resetTime) {
    rateLimitStore.set(ip, {
      attempts: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return true;
  }

  if (limit.attempts >= MAX_ATTEMPTS_PER_WINDOW) {
    return false;
  }

  limit.attempts++;
  return true;
}

/**
 * Get client IP from request headers
 */
export function getClientIP(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Cleanup old challenges (call periodically)
 */
export function cleanupChallenges(): void {
  const now = Date.now();
  for (const [key, value] of challengeStore.entries()) {
    if (now - value.timestamp > 60000 || value.used) {
      challengeStore.delete(key);
    }
  }
}

// Cleanup old challenges every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupChallenges, 300000);
}
