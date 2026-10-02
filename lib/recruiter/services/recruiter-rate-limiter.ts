/**
 * Recruiter Portal Rate Limiting Engine
 * contact.gauravpatil.site
 * 
 * Multi-tiered rate limiting under ratelimit:recruiter:* namespace.
 * Uses Upstash Redis REST API with low latency and resilient in-memory fallback.
 */

import { fetchWithTimeout } from "@/lib/api/fetcher";
import crypto from "crypto";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-Memory Fallback Caches
const memGlobalBurst: { count: number; resetAt: number } = { count: 0, resetAt: 0 };
const memIpHourly = new Map<string, RateLimitEntry>();
const memEmailHourly = new Map<string, RateLimitEntry>();
const memVerifyLimit = new Map<string, RateLimitEntry>();

// Configuration Thresholds
const GLOBAL_BURST_MAX = process.env.NODE_ENV === "development" ? 200 : 20;
const GLOBAL_BURST_WINDOW_SEC = 60;

const IP_HOURLY_MAX = 5;
const IP_HOURLY_WINDOW_SEC = 3600;

const EMAIL_HOURLY_MAX = 3;
const EMAIL_HOURLY_WINDOW_SEC = 3600;

const VERIFY_MAX = 10;
const VERIFY_WINDOW_SEC = 900; // 15 minutes

export interface RateLimitCheckResult {
  allowed: boolean;
  reason?: string;
  retryAfterSeconds?: number;
}

function sanitizeIp(ip: string): string {
  return ip.trim().replace(/[^a-zA-Z0-9_]/g, "_");
}

function getEmailHash(email: string): string {
  return crypto.createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 16);
}

/**
 * Executes an atomic INCR + EXPIRE via Upstash Redis REST pipeline or simple endpoints.
 */
async function redisIncr(key: string, ttlSeconds: number): Promise<number | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    // Pipeline INCR + EXPIRE
    const res = await fetchWithTimeout(
      `${url}/pipeline`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", key],
          ["EXPIRE", key, ttlSeconds],
        ]),
      },
      1500
    );

    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ result?: number }>;
    if (Array.isArray(data) && data[0] && typeof data[0].result === "number") {
      return data[0].result;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Checks rate limits for sending an OTP.
 * Evaluates: Global Surge -> IP Hourly Budget -> Email Hourly Budget.
 */
export async function checkSendOtpRateLimit(
  clientIp: string,
  email: string
): Promise<RateLimitCheckResult> {
  const now = Date.now();
  const safeIp = sanitizeIp(clientIp);
  const emailHash = getEmailHash(email);

  // 1. Global Surge Check
  const globalKey = "ratelimit:recruiter:burst:global";
  const globalRedisCount = await redisIncr(globalKey, GLOBAL_BURST_WINDOW_SEC);

  if (globalRedisCount !== null) {
    if (globalRedisCount > GLOBAL_BURST_MAX) {
      return {
        allowed: false,
        reason: "The service is experiencing unusually high traffic. Please wait a moment.",
        retryAfterSeconds: 30,
      };
    }
  } else {
    // Memory fallback
    if (now > memGlobalBurst.resetAt) {
      memGlobalBurst.count = 1;
      memGlobalBurst.resetAt = now + GLOBAL_BURST_WINDOW_SEC * 1000;
    } else {
      memGlobalBurst.count++;
      if (memGlobalBurst.count > GLOBAL_BURST_MAX) {
        return {
          allowed: false,
          reason: "High system load. Please wait a moment before retrying.",
          retryAfterSeconds: 30,
        };
      }
    }
  }

  // 2. IP Hourly Budget Check
  const ipKey = `ratelimit:recruiter:otp:ip:${safeIp}`;
  const ipRedisCount = await redisIncr(ipKey, IP_HOURLY_WINDOW_SEC);

  if (ipRedisCount !== null) {
    if (ipRedisCount > IP_HOURLY_MAX) {
      return {
        allowed: false,
        reason: "Too many access code requests from this network. Please try again in an hour.",
        retryAfterSeconds: 3600,
      };
    }
  } else {
    // Memory fallback
    const ipEntry = memIpHourly.get(safeIp);
    if (!ipEntry || now > ipEntry.resetAt) {
      memIpHourly.set(safeIp, { count: 1, resetAt: now + IP_HOURLY_WINDOW_SEC * 1000 });
    } else {
      ipEntry.count++;
      if (ipEntry.count > IP_HOURLY_MAX) {
        return {
          allowed: false,
          reason: "Too many requests from this network. Please try again later.",
          retryAfterSeconds: Math.ceil((ipEntry.resetAt - now) / 1000),
        };
      }
    }
  }

  // 3. Email Hourly Budget Check
  const emailKey = `ratelimit:recruiter:otp:email:${emailHash}`;
  const emailRedisCount = await redisIncr(emailKey, EMAIL_HOURLY_WINDOW_SEC);

  if (emailRedisCount !== null) {
    if (emailRedisCount > EMAIL_HOURLY_MAX) {
      return {
        allowed: false,
        reason: "Maximum access requests for this email reached. Please try again in an hour.",
        retryAfterSeconds: 3600,
      };
    }
  } else {
    // Memory fallback
    const emailEntry = memEmailHourly.get(emailHash);
    if (!emailEntry || now > emailEntry.resetAt) {
      memEmailHourly.set(emailHash, { count: 1, resetAt: now + EMAIL_HOURLY_WINDOW_SEC * 1000 });
    } else {
      emailEntry.count++;
      if (emailEntry.count > EMAIL_HOURLY_MAX) {
        return {
          allowed: false,
          reason: "Maximum access requests for this email reached.",
          retryAfterSeconds: Math.ceil((emailEntry.resetAt - now) / 1000),
        };
      }
    }
  }

  return { allowed: true };
}

/**
 * Checks rate limits for OTP verification attempts (brute force protection).
 */
export async function checkVerifyRateLimit(clientIp: string): Promise<RateLimitCheckResult> {
  const safeIp = sanitizeIp(clientIp);
  const verifyKey = `ratelimit:recruiter:verify:ip:${safeIp}`;
  const redisCount = await redisIncr(verifyKey, VERIFY_WINDOW_SEC);

  if (redisCount !== null) {
    if (redisCount > VERIFY_MAX) {
      return {
        allowed: false,
        reason: "Too many verification attempts from this IP. Please wait 15 minutes before retrying.",
        retryAfterSeconds: VERIFY_WINDOW_SEC,
      };
    }
  } else {
    const now = Date.now();
    const entry = memVerifyLimit.get(safeIp);
    if (!entry || now > entry.resetAt) {
      memVerifyLimit.set(safeIp, { count: 1, resetAt: now + VERIFY_WINDOW_SEC * 1000 });
    } else {
      entry.count++;
      if (entry.count > VERIFY_MAX) {
        return {
          allowed: false,
          reason: "Too many verification attempts. Please wait before retrying.",
          retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
        };
      }
    }
  }

  return { allowed: true };
}
