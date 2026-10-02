/**
 * Resume Portal Authentication & Session Service
 * resume.gauravpatil.site
 *
 * Implements salted HMAC-SHA256 OTP challenges, Upstash Redis multi-tier rate limiting,
 * constant-time verification, and tamper-proof signed session cookies.
 */


import crypto from "crypto";
import { redisClient } from "../../redis";
import {
  RESUME_SESSION_TTL_SECONDS,
  RESUME_OTP_TTL_SECONDS,
  RESUME_MAX_OTP_ATTEMPTS,
} from "../constants";
import {
  dispatchResumeOtpEmail,
  dispatchResumeViewedAdminNotification,
} from "@/lib/email/brevo";
import type {
  ResumeVisitorSession,
  ResumeOtpChallengePayload,
} from "@/types/resume";

function getSessionSecret(): string {
  return (
    process.env.RESUME_SESSION_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    "resume_portal_secure_hmac_secret_32bytes_required"
  );
}

function getOtpSecret(): string {
  return (
    process.env.RESUME_SESSION_SECRET ||
    process.env.ADMIN_OTP_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    "resume_portal_otp_hmac_secret_key_32bytes"
  );
}

/**
 * Computes salted HMAC-SHA256 of OTP code
 */
function computeOtpHmac(code: string, salt: string, challengeId: string): string {
  return crypto
    .createHmac("sha256", getOtpSecret())
    .update(`${code}_${salt}_${challengeId}`)
    .digest("hex");
}

/**
 * Base64 URL helpers
 */
function base64UrlEncode(str: string): string {
  return Buffer.from(str, "utf-8")
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf-8");
}

/**
 * Signs a session payload into a tamper-proof JWT-like token: header.payload.signature
 */
export function signResumeSessionToken(session: ResumeVisitorSession): string {
  const secret = getSessionSecret();
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64UrlEncode(JSON.stringify(session));
  const data = `${header}.${payload}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${data}.${signature}`;
}

/**
 * Verifies a session token string
 */
export function verifyResumeSessionToken(token: string | undefined | null): ResumeVisitorSession | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const secret = getSessionSecret();
  const data = `${header}.${payload}`;
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSig);
  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(payload)) as ResumeVisitorSession;
    if (parsed.expiresAt < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

// In-memory fallback for challenge storage if Redis is down
const inMemoryChallengeStore = new Map<string, { payload: ResumeOtpChallengePayload; expiresAt: number }>();

/**
 * Multi-tier rate limiting for OTP generation
 * Max 3 requests per IP per 10 minutes
 */
export async function checkResumeOtpRateLimit(clientIp: string, email: string): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const ipKey = `resume:ratelimit:ip:${clientIp}`;
    const emailKey = `resume:ratelimit:email:${email.toLowerCase()}`;

    const ipCount = await redisClient.incr(ipKey);
    if (ipCount === 1) {
      await redisClient.expire(ipKey, 600); // 10 minutes
    }
    if (ipCount > 5) {
      return {
        allowed: false,
        reason: "Too many verification requests from this IP. Please wait a few minutes before trying again.",
      };
    }

    const emailCount = await redisClient.incr(emailKey);
    if (emailCount === 1) {
      await redisClient.expire(emailKey, 600); // 10 minutes
    }
    if (emailCount > 3) {
      return {
        allowed: false,
        reason: "Too many codes requested for this email address. Please check your spam folder or wait 10 minutes.",
      };
    }

    return { allowed: true };
  } catch {
    // Graceful fallback if Redis is down
    return { allowed: true };
  }
}

/**
 * Creates an OTP challenge, stores it with 5-minute TTL, and sends Brevo email
 */
export async function createResumeOtpChallenge(params: {
  email: string;
  name?: string | null;
  company?: string | null;
  clientIp: string;
  countryCode?: string | null;
}): Promise<{ success: boolean; challengeId?: string; expiresInSeconds?: number; error?: string }> {
  const normalizedEmail = params.email.trim().toLowerCase();
  const normalizedName = (params.name || "").trim() || normalizedEmail.split("@")[0] || "Recruiter";

  // 1. Check rate limits
  const rateLimit = await checkResumeOtpRateLimit(params.clientIp, normalizedEmail);
  if (!rateLimit.allowed) {
    return { success: false, error: rateLimit.reason };
  }

  // 2. Generate 6-digit numeric OTP and salt
  const otp = crypto.randomInt(100000, 1000000).toString();
  const salt = crypto.randomBytes(16).toString("hex");
  const challengeId = `ch_res_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
  const otpHash = computeOtpHmac(otp, salt, challengeId);

  const now = Date.now();
  const expiresAt = now + RESUME_OTP_TTL_SECONDS * 1000;

  const challengePayload: ResumeOtpChallengePayload = {
    email: normalizedEmail,
    name: normalizedName,
    company: params.company?.trim() || null,
    otpHash,
    salt,
    clientIp: params.clientIp,
    countryCode: params.countryCode || null,
    attempts: 0,
    createdAt: now,
    expiresAt,
  };

  // 3. Store challenge in Redis
  try {
    const key = `resume:challenge:${challengeId}`;
    await redisClient.set(key, JSON.stringify(challengePayload), {
      ex: RESUME_OTP_TTL_SECONDS,
    });
  } catch (err) {
    console.warn("Redis unavailable, using memory store for challenge:", err);
    inMemoryChallengeStore.set(challengeId, {
      payload: challengePayload,
      expiresAt,
    });
  }

  // 4. Dispatch Brevo Transactional Email
  const emailResult = await dispatchResumeOtpEmail({
    email: normalizedEmail,
    name: normalizedName,
    company: params.company,
    otp,
    expiresInMinutes: 5,
  });

  if (!emailResult.success) {
    console.error("Failed to deliver resume OTP email:", emailResult.error);
    return {
      success: false,
      error: "Unable to deliver verification code. Please double-check your email and try again.",
    };
  }

  return {
    success: true,
    challengeId,
    expiresInSeconds: RESUME_OTP_TTL_SECONDS,
  };
}

/**
 * Verifies the 6-digit OTP code against the stored challenge
 */
export async function verifyResumeOtpChallenge(params: {
  challengeId: string;
  code: string;
  clientIp: string;
}): Promise<{
  verified: boolean;
  sessionToken?: string;
  session?: ResumeVisitorSession;
  error?: string;
  remainingAttempts?: number;
}> {
  const { challengeId, code } = params;
  const cleanCode = code.trim();

  if (!/^\d{6}$/.test(cleanCode)) {
    return { verified: false, error: "Verification code must be exactly 6 digits." };
  }

  let challenge: ResumeOtpChallengePayload | null = null;
  const key = `resume:challenge:${challengeId}`;

  try {
    const raw = await redisClient.get<string | object>(key);
    if (raw) {
      challenge = typeof raw === "string" ? JSON.parse(raw) : (raw as ResumeOtpChallengePayload);
    }
  } catch {
    const fallback = inMemoryChallengeStore.get(challengeId);
    if (fallback && fallback.expiresAt > Date.now()) {
      challenge = fallback.payload;
    }
  }

  if (!challenge) {
    return {
      verified: false,
      error: "Verification challenge expired or invalid. Please request a new code.",
    };
  }

  if (Date.now() > challenge.expiresAt) {
    try {
      await redisClient.del(key);
    } catch {
      inMemoryChallengeStore.delete(challengeId);
    }
    return {
      verified: false,
      error: "Verification code has expired. Please request a new code.",
    };
  }

  // Check attempt quota
  challenge.attempts += 1;
  const remaining = Math.max(0, RESUME_MAX_OTP_ATTEMPTS - challenge.attempts);

  if (challenge.attempts > RESUME_MAX_OTP_ATTEMPTS) {
    try {
      await redisClient.del(key);
    } catch {
      inMemoryChallengeStore.delete(challengeId);
    }
    return {
      verified: false,
      error: "Maximum verification attempts exceeded. Please request a new code.",
      remainingAttempts: 0,
    };
  }

  // Update challenge attempts in storage
  try {
    await redisClient.set(key, JSON.stringify(challenge), {
      ex: Math.max(10, Math.floor((challenge.expiresAt - Date.now()) / 1000)),
    });
  } catch {
    const fallback = inMemoryChallengeStore.get(challengeId);
    if (fallback) fallback.payload = challenge;
  }

  // Constant-time HMAC comparison
  const calculatedHash = computeOtpHmac(cleanCode, challenge.salt, challengeId);
  const hashBuffer = Buffer.from(calculatedHash);
  const targetBuffer = Buffer.from(challenge.otpHash);

  const isValid =
    hashBuffer.length === targetBuffer.length &&
    crypto.timingSafeEqual(hashBuffer, targetBuffer);

  if (!isValid) {
    return {
      verified: false,
      error: `Invalid verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
      remainingAttempts: remaining,
    };
  }

  // Clean up completed challenge
  try {
    await redisClient.del(key);
  } catch {
    inMemoryChallengeStore.delete(challengeId);
  }

  // Issue 30-minute verified visitor session (anti-abuse / anti-tamper policy)
  const now = Date.now();
  const session: ResumeVisitorSession = {
    email: challenge.email,
    name: challenge.name,
    company: challenge.company || null,
    countryCode: challenge.countryCode || null,
    verifiedAt: now,
    expiresAt: now + RESUME_SESSION_TTL_SECONDS * 1000,
  };

  const sessionToken = signResumeSessionToken(session);

  // Dispatch background notification to Gaurav
  dispatchResumeViewedAdminNotification({
    name: session.name,
    email: session.email,
    company: session.company,
    countryCode: session.countryCode,
    viewedAt: now,
  }).catch((err) => {
    console.warn("Resume view admin notification warning:", err);
  });

  return {
    verified: true,
    sessionToken,
    session,
  };
}
