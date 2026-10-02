import crypto from "crypto";
import { getAdminFirestore } from "@/lib/admin/firebase-admin";
import { dispatchOtpEmail } from "@/lib/email/brevo";
import {
  TALK_ADMIN_EMAIL,
  TALK_ADMIN_NAME,
  TALK_COLLECTIONS,
  TALK_OTP_MAX_ATTEMPTS,
  TALK_OTP_TTL_MS,
} from "../constants";
import { createTalkSessionPayload, signTalkSession } from "../session";
import type { TalkOtpChallenge } from "@/types/talk";

const OTP_SECRET =
  process.env.TALK_OTP_SECRET ||
  process.env.ADMIN_OTP_SECRET ||
  process.env.ADMIN_SESSION_SECRET ||
  process.env.FIREBASE_ADMIN_PRIVATE_KEY ||
  "gaurav_talk_otp_secret_key_2026";

function computeOtpHmac(otp: string, salt: string): string {
  return crypto
    .createHmac("sha256", OTP_SECRET)
    .update(`${otp.trim()}_${salt.trim()}`)
    .digest("hex");
}

function constantTimeCompare(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// In-memory fallback if Firestore is momentarily unavailable
const inMemoryChallenges = new Map<string, TalkOtpChallenge>();

export async function createTalkOtpChallenge(params: {
  email: string;
  clientIp?: string | null;
  userAgent?: string;
  requestHeaders?: Headers | null;
}): Promise<{ success: boolean; challengeId?: string; error?: string }> {
  const cleanEmail = params.email.trim().toLowerCase();

  if (cleanEmail !== TALK_ADMIN_EMAIL.toLowerCase()) {
    return {
      success: false,
      error: "Access denied.",
    };
  }

  const rawOtp = crypto.randomInt(100000, 1000000).toString();
  const salt = crypto.randomBytes(16).toString("hex");
  const otpHash = computeOtpHmac(rawOtp, salt);
  const now = Date.now();
  const expiresAt = now + TALK_OTP_TTL_MS;
  const challengeId = `talk_ch_${crypto.randomUUID()}`;

  const challengeRecord: TalkOtpChallenge = {
    id: challengeId,
    email: cleanEmail,
    otpHash,
    salt,
    attemptsCount: 0,
    isConsumed: false,
    clientIp: params.clientIp,
    userAgent: params.userAgent,
    createdAt: now,
    expiresAt,
  };

  // 1. Try to persist in Firestore
  const db = getAdminFirestore();
  if (db) {
    try {
      await db.collection(TALK_COLLECTIONS.OTP).doc(challengeId).set(challengeRecord);
    } catch {
      inMemoryChallenges.set(challengeId, challengeRecord);
    }
  } else {
    inMemoryChallenges.set(challengeId, challengeRecord);
  }

  // 2. Dispatch OTP email to Gaurav Patil
  try {
    await dispatchOtpEmail({
      email: cleanEmail,
      name: TALK_ADMIN_NAME,
      otp: rawOtp,
      expiresMinutes: 5,
      clientIp: params.clientIp,
      userAgent: params.userAgent,
      requestHeaders: params.requestHeaders,
    });
  } catch (err) {
    console.error("[TalkAuth] Failed to dispatch OTP email:", err);
    // Even if email dispatch has an edge error, log it
  }

  return {
    success: true,
    challengeId,
  };
}

export async function verifyTalkOtp(params: {
  challengeId: string;
  otp: string;
}): Promise<{
  success: boolean;
  sessionToken?: string;
  remainingAttempts?: number;
  error?: string;
}> {
  const { challengeId, otp } = params;
  if (!challengeId || !otp || otp.trim().length !== 6) {
    return { success: false, error: "Please enter a valid 6-digit verification code." };
  }

  const db = getAdminFirestore();
  let challenge: TalkOtpChallenge | null = null;
  let isFromMemory = false;

  if (db) {
    try {
      const snap = await db.collection(TALK_COLLECTIONS.OTP).doc(challengeId).get();
      if (snap.exists) {
        challenge = snap.data() as TalkOtpChallenge;
      }
    } catch {
      // Fallback to memory
    }
  }

  if (!challenge && inMemoryChallenges.has(challengeId)) {
    challenge = inMemoryChallenges.get(challengeId)!;
    isFromMemory = true;
  }

  if (!challenge) {
    return { success: false, error: "Verification session expired. Please request a new code." };
  }

  if (challenge.isConsumed) {
    return { success: false, error: "This code has already been used. Please request a new one." };
  }

  if (Date.now() > challenge.expiresAt) {
    return { success: false, error: "Verification code expired. Please request a new one." };
  }

  if (challenge.attemptsCount >= TALK_OTP_MAX_ATTEMPTS) {
    return {
      success: false,
      error: "Maximum verification attempts reached. Please request a new code.",
    };
  }

  const computedHash = computeOtpHmac(otp, challenge.salt);
  const isValid = constantTimeCompare(computedHash, challenge.otpHash);

  const updatedAttempts = challenge.attemptsCount + 1;

  if (!isValid) {
    // Record failure attempt
    if (db && !isFromMemory) {
      await db.collection(TALK_COLLECTIONS.OTP).doc(challengeId).update({
        attemptsCount: updatedAttempts,
        isConsumed: updatedAttempts >= TALK_OTP_MAX_ATTEMPTS,
      });
    } else {
      challenge.attemptsCount = updatedAttempts;
      if (updatedAttempts >= TALK_OTP_MAX_ATTEMPTS) {
        challenge.isConsumed = true;
      }
      inMemoryChallenges.set(challengeId, challenge);
    }

    const remaining = Math.max(0, TALK_OTP_MAX_ATTEMPTS - updatedAttempts);
    return {
      success: false,
      remainingAttempts: remaining,
      error: remaining > 0
        ? `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
        : "Too many incorrect attempts. Please request a new code.",
    };
  }

  // Mark consumed
  if (db && !isFromMemory) {
    await db.collection(TALK_COLLECTIONS.OTP).doc(challengeId).update({
      isConsumed: true,
      attemptsCount: updatedAttempts,
    });
  } else {
    challenge.isConsumed = true;
    inMemoryChallenges.set(challengeId, challenge);
  }

  // Create signed session token
  const sessionPayload = createTalkSessionPayload(challenge.email, TALK_ADMIN_NAME);
  const sessionToken = await signTalkSession(sessionPayload);

  return {
    success: true,
    sessionToken,
  };
}
