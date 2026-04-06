/**
 * Challenge Verification Utility
 * Shared between challenge generation and verification routes
 * 
 * SERVERLESS-SAFE: Uses Redis for challenge storage (works across instances)
 */

import crypto from "crypto";
import { safeGet, safeSet, safeDel } from "./redis";

// Challenge data structure
interface ChallengeData {
  nonce: string;
  timestamp: number;
  ip: string;
  used: boolean;
}

// Rate limiting store (IP → attempts) - in-memory is OK for rate limiting
export const rateLimitStore = new Map<string, {
  attempts: number;
  resetTime: number;
}>();

// Redis key prefix for challenges
const CHALLENGE_PREFIX = "auth:challenge:";
const CHALLENGE_TTL = 120; // 2 minutes TTL

/**
 * Store a challenge in Redis
 */
export async function storeChallenge(
  challengeId: string,
  data: ChallengeData
): Promise<boolean> {
  const key = `${CHALLENGE_PREFIX}${challengeId}`;
  return await safeSet(key, data, CHALLENGE_TTL);
}

/**
 * Get a challenge from Redis
 */
export async function getChallenge(challengeId: string): Promise<ChallengeData | null> {
  const key = `${CHALLENGE_PREFIX}${challengeId}`;
  return await safeGet<ChallengeData>(key);
}

/**
 * Delete a challenge from Redis
 */
export async function deleteChallenge(challengeId: string): Promise<boolean> {
  const key = `${CHALLENGE_PREFIX}${challengeId}`;
  return await safeDel(key);
}

/**
 * Verify challenge signature (async for Redis)
 */
export async function verifyChallengeAsync(
  challengeId: string,
  providedSignature: string,
  password: string
): Promise<{ valid: boolean; error?: string }> {
  const challenge = await getChallenge(challengeId);

  if (!challenge) {
    return { valid: false, error: "Invalid or expired challenge" };
  }

  if (challenge.used) {
    return { valid: false, error: "Challenge already used" };
  }

  const now = Date.now();
  if (now - challenge.timestamp > 60000) {
    await deleteChallenge(challengeId);
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
  await safeSet(`${CHALLENGE_PREFIX}${challengeId}`, challenge, 60); // Keep for 1 min after use

  return { valid: true };
}

/**
 * Sync version for backward compatibility (uses in-memory fallback)
 * @deprecated Use verifyChallengeAsync instead
 */
export function verifyChallenge(
  challengeId: string,
  providedSignature: string,
  password: string
): { valid: boolean; error?: string } {
  // This is kept for backward compatibility but won't work in serverless
  // The async version should be used instead
  console.warn("⚠️ Using sync verifyChallenge - may not work in serverless");
  return { valid: false, error: "Use async verification" };
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
