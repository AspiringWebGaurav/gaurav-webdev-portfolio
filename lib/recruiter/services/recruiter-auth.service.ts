/**
 * Recruiter Portal Authentication Service
 * contact.gauravpatil.site
 * 
 * Cryptographic token signing & verification strictly via Web Crypto API.
 * Uses RECRUITER_SESSION_SECRET ONLY. Zero fallback to admin secrets or hardcoded strings.
 */

import { recruiterRepository } from "@/lib/dal/repositories/recruiter.repository";
import type {
  RecruiterSessionRecord,
  RecruiterSessionTokenPayload,
} from "@/types/recruiter";
import { cookies } from "next/headers";

export const RECRUITER_SESSION_COOKIE_NAME = "recruiter_session";
export const RECRUITER_INACTIVITY_MAX_MS = 24 * 60 * 60 * 1000; // 24 hours
const ACTIVITY_TOUCH_THROTTLE_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Asserts and retrieves RECRUITER_SESSION_SECRET.
 * Strict fail-fast behavior: Fails immediately if unset, empty, or < 32 characters.
 * No silent fallback to admin secrets or default strings.
 */
export function getRecruiterSessionSecret(): string {
  const secret = process.env.RECRUITER_SESSION_SECRET;
  if (!secret || secret.trim().length < 32) {
    throw new Error(
      "[Configuration Error] RECRUITER_SESSION_SECRET is missing or invalid (< 32 characters). " +
      "It must be explicitly defined in environment variables (.env.local in development, Vercel in production). " +
      "Silent fallbacks to admin secrets or hardcoded defaults are strictly disabled."
    );
  }
  return secret.trim();
}

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

function base64UrlEncodeBuffer(buf: ArrayBuffer): string {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Cryptographically signs a session payload using RECRUITER_SESSION_SECRET.
 */
export async function signRecruiterSessionToken(payload: RecruiterSessionTokenPayload): Promise<string> {
  const secret = getRecruiterSessionSecret();
  const key = await getCryptoKey(secret);
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = base64UrlEncode(payloadJson);

  const enc = new TextEncoder();
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(payloadB64));
  const signatureB64 = base64UrlEncodeBuffer(signatureBuffer);

  return `${payloadB64}.${signatureB64}`;
}

/**
 * Validates a session token using Web Crypto HMAC-SHA256.
 * Returns null if invalid or tampered with.
 */
export async function verifyRecruiterSessionToken(token: string): Promise<RecruiterSessionTokenPayload | null> {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, signatureB64] = parts;
  if (!payloadB64 || !signatureB64) return null;

  try {
    const secret = getRecruiterSessionSecret();
    const key = await getCryptoKey(secret);
    const enc = new TextEncoder();

    let sigStr = signatureB64.replace(/-/g, "+").replace(/_/g, "/");
    while (sigStr.length % 4) {
      sigStr += "=";
    }
    const signatureBytes = Buffer.from(sigStr, "base64");

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      enc.encode(payloadB64)
    );

    if (!isValid) return null;

    const payloadJson = base64UrlDecode(payloadB64);
    const payload = JSON.parse(payloadJson) as RecruiterSessionTokenPayload;

    if (!payload.sessionId || !payload.recruiterId || !payload.email) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Server-side full session validation against Firestore.
 * Verifies:
 * 1. Cryptographic token validity
 * 2. Session record in Firestore exists and has status === "ACTIVE"
 * 3. 24-hour inactivity timeout
 * 4. Slides lastActiveAt forward (throttled)
 */
export async function validateRecruiterSession(token: string): Promise<{
  isValid: boolean;
  payload: RecruiterSessionTokenPayload | null;
  sessionRecord: RecruiterSessionRecord | null;
  error?: "INVALID_TOKEN" | "SESSION_NOT_FOUND" | "SESSION_REVOKED" | "SESSION_INACTIVE_EXPIRED";
}> {
  const payload = await verifyRecruiterSessionToken(token);
  if (!payload) {
    return { isValid: false, payload: null, sessionRecord: null, error: "INVALID_TOKEN" };
  }

  const sessionRes = await recruiterRepository.getSession(payload.sessionId);
  if (!sessionRes.success || !sessionRes.data) {
    return { isValid: false, payload, sessionRecord: null, error: "SESSION_NOT_FOUND" };
  }

  const sessionRecord = sessionRes.data;
  if (sessionRecord.status !== "ACTIVE") {
    return { isValid: false, payload, sessionRecord, error: "SESSION_REVOKED" };
  }

  const now = Date.now();
  const idleMs = now - sessionRecord.lastActiveAt;
  if (idleMs > RECRUITER_INACTIVITY_MAX_MS) {
    // Mark session revoked due to inactivity
    await recruiterRepository.revokeSession(payload.sessionId);
    return { isValid: false, payload, sessionRecord, error: "SESSION_INACTIVE_EXPIRED" };
  }

  // Slide lastActiveAt forward if throttle window passed
  if (idleMs > ACTIVITY_TOUCH_THROTTLE_MS) {
    // Non-blocking fire-and-forget touch
    recruiterRepository.touchSessionActivity(payload.sessionId).catch(() => {});
    recruiterRepository.touchProfileActivity(payload.recruiterId).catch(() => {});
  }

  return { isValid: true, payload, sessionRecord };
}

/**
 * Reads the recruiter session cookie from Next.js headers/cookies.
 */
export async function getRecruiterSessionFromCookies(): Promise<{
  isValid: boolean;
  payload: RecruiterSessionTokenPayload | null;
  sessionRecord: RecruiterSessionRecord | null;
  error?: string;
}> {
  const cookieStore = await cookies();
  const token = cookieStore.get(RECRUITER_SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return { isValid: false, payload: null, sessionRecord: null };
  }
  return await validateRecruiterSession(token);
}

/**
 * Creates the true browser-session Set-Cookie header string.
 * Omits Max-Age and Expires so the cookie lives strictly for the browser session.
 */
export function createRecruiterSessionCookieHeader(token: string): string {
  const isProd = process.env.NODE_ENV === "production";
  const parts = [
    `${RECRUITER_SESSION_COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (isProd) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

/**
 * Creates a Set-Cookie header string to clear/revoke the session cookie.
 */
export function createClearRecruiterSessionCookieHeader(): string {
  const isProd = process.env.NODE_ENV === "production";
  const parts = [
    `${RECRUITER_SESSION_COOKIE_NAME}=`,
    "Path=/",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (isProd) {
    parts.push("Secure");
  }
  return parts.join("; ");
}
