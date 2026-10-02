import {
  TALK_ADMIN_EMAIL,
  TALK_ADMIN_NAME,
  TALK_SESSION_TTL_MS,
} from "./constants";
import type { TalkSession } from "@/types/talk";

const SESSION_SECRET =
  process.env.TALK_SESSION_SECRET ||
  process.env.ADMIN_SESSION_SECRET ||
  process.env.ADMIN_OTP_SECRET ||
  process.env.FIREBASE_ADMIN_PRIVATE_KEY ||
  "gaurav_talk_portal_secure_session_secret_2026";

function toB64Url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromB64Url(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function createTalkSessionPayload(
  email: string,
  name?: string
): TalkSession {
  const now = Date.now();
  return {
    id: "usr_talk_gaurav",
    email: email.trim().toLowerCase(),
    name: name?.trim() || TALK_ADMIN_NAME,
    role: "owner",
    loggedInAt: now,
    expiresAt: now + TALK_SESSION_TTL_MS,
  };
}

/**
 * Signs a TalkSession payload using Web Crypto HMAC-SHA256 (Edge and Node.js compatible).
 */
export async function signTalkSession(session: TalkSession): Promise<string> {
  const enc = new TextEncoder();
  const payloadJson = JSON.stringify(session);
  const payloadB64 = toB64Url(enc.encode(payloadJson));

  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(SESSION_SECRET) as unknown as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sigBuf = await crypto.subtle.sign(
    "HMAC",
    key,
    enc.encode(payloadB64) as unknown as BufferSource
  );
  const sigB64 = toB64Url(sigBuf);

  return `${payloadB64}.${sigB64}`;
}

/**
 * Verifies a TalkSession signed token.
 */
export async function verifyTalkSession(token?: string | null): Promise<TalkSession | null> {
  if (!token || typeof token !== "string") return null;

  let cleanToken = token.trim();
  try {
    cleanToken = decodeURIComponent(cleanToken);
  } catch {
    // Keep as is
  }

  const dotIndex = cleanToken.lastIndexOf(".");
  if (dotIndex === -1) return null;

  const payloadB64 = cleanToken.slice(0, dotIndex);
  const sigB64 = cleanToken.slice(dotIndex + 1);

  if (!payloadB64 || !sigB64) return null;

  try {
    const enc = new TextEncoder();
    const dec = new TextDecoder();

    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(SESSION_SECRET) as unknown as BufferSource,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const sigBytes = fromB64Url(sigB64);
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes as unknown as BufferSource,
      enc.encode(payloadB64) as unknown as BufferSource
    );

    if (!isValid) return null;

    const payloadJson = dec.decode(fromB64Url(payloadB64));
    const session = JSON.parse(payloadJson) as TalkSession;

    if (!session || typeof session !== "object") return null;
    if (typeof session.expiresAt !== "number" || Date.now() > session.expiresAt) {
      return null;
    }

    if (session.email.toLowerCase() !== TALK_ADMIN_EMAIL.toLowerCase()) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}
