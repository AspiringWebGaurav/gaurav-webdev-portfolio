/**
 * Recruiter Portal OTP Challenge Service
 * contact.gauravpatil.site
 * 
 * Strict Salted HMAC-SHA256 OTP Generation & Constant-Time Verification.
 * Uses RECRUITER_OTP_SECRET ONLY. Zero fallback to session secrets, admin secrets, or defaults.
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { getAdminFirestore } from "@/lib/admin/firebase-admin";
import {
  recruiterRepository,
  RECRUITER_COLLECTIONS,
} from "@/lib/dal/repositories/recruiter.repository";
import {
  signRecruiterSessionToken,
} from "./recruiter-auth.service";
import {
  dispatchRecruiterOtpEmail,
  dispatchRecruiterVerifiedAdminNotification,
  dispatchPhoneUnmaskOtpEmail,
  dispatchRecruiterPhoneUnmaskedAdminNotification,
} from "@/lib/email/brevo";
import type {
  RecruiterChallenge,
  RecruiterProfile,
  RecruiterSessionRecord,
  RecruiterActivityEvent,
} from "@/types/recruiter";

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_ATTEMPTS = 3;
const MAX_RESENDS = 3;

/**
 * Asserts and retrieves RECRUITER_OTP_SECRET.
 * Strict fail-fast behavior: Fails immediately if unset, empty, or < 32 characters.
 * No silent fallback to session secrets, admin secrets, or default strings.
 */
export function getRecruiterOtpSecret(): string {
  const secret = process.env.RECRUITER_OTP_SECRET;
  if (!secret || secret.trim().length < 32) {
    throw new Error(
      "[Configuration Error] RECRUITER_OTP_SECRET is missing or invalid (< 32 characters). " +
      "It must be explicitly defined in environment variables (.env.local in development, Vercel in production). " +
      "Silent fallbacks to admin secrets or hardcoded defaults are strictly disabled."
    );
  }
  return secret.trim();
}

/**
 * Computes salted HMAC-SHA256 hash of an OTP code.
 */
export function computeOtpHmac(code: string, salt: string, challengeId: string): string {
  const secret = getRecruiterOtpSecret();
  return crypto
    .createHmac("sha256", secret)
    .update(`${code}_${salt}_${challengeId}`)
    .digest("hex");
}

export interface CreateOtpChallengeParams {
  email: string;
  name: string;
  company: string;
  phone?: string | null;
  clientIp: string;
  countryCode?: string | null;
}

export interface CreateOtpChallengeResult {
  success: boolean;
  challengeId?: string;
  expiresInSeconds?: number;
  error?: string;
}

/**
 * Generates an OTP challenge, stores it in Firestore, and sends the code via Brevo email.
 */
export async function createOtpChallenge(
  params: CreateOtpChallengeParams
): Promise<CreateOtpChallengeResult> {
  const rawEmail = params.email.trim().toLowerCase();
  const rawName = params.name.trim();
  const rawCompany = params.company.trim();
  const rawPhone = params.phone ? params.phone.trim() : null;

  // 1. Generate 6-digit numeric OTP and 16-byte cryptographic salt
  const otpCode = crypto.randomInt(100000, 1000000).toString();
  const otpSalt = crypto.randomBytes(16).toString("hex");
  const challengeId = `ch_rec_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;

  // 2. Compute salted HMAC
  const otpHash = computeOtpHmac(otpCode, otpSalt, challengeId);
  const now = Date.now();

  const challenge: RecruiterChallenge = {
    id: challengeId,
    email: rawEmail,
    name: rawName,
    company: rawCompany,
    phone: rawPhone,
    otpHash,
    otpSalt,
    attemptsCount: 0,
    resendCount: 0,
    status: "ACTIVE",
    isConsumed: false,
    createdAt: now,
    expiresAt: now + OTP_TTL_MS,
    lastResentAt: now,
    clientIp: params.clientIp,
    countryCode: params.countryCode,
  };

  // 3. Persist in Firestore
  const saveRes = await recruiterRepository.createChallenge(challenge);
  if (!saveRes.success) {
    return { success: false, error: "Failed to persist verification challenge." };
  }

  // Local QA Test Support: In non-production, record generated OTP for local test runner
  if (process.env.NODE_ENV !== "production") {
    try {
      const testOtpPath = path.join(process.cwd(), ".local-test-otp.json");
      let testStore: Record<string, string> = {};
      if (fs.existsSync(testOtpPath)) {
        try {
          testStore = JSON.parse(fs.readFileSync(testOtpPath, "utf-8"));
        } catch {
          testStore = {};
        }
      }
      testStore[challengeId] = otpCode;
      testStore[rawEmail] = otpCode;
      testStore["latest"] = otpCode;
      fs.writeFileSync(testOtpPath, JSON.stringify(testStore, null, 2), "utf-8");
    } catch {
      // ignore
    }
  }

  // 4. Dispatch Email via Brevo / Resend failover
  const emailRes = await dispatchRecruiterOtpEmail({
    email: rawEmail,
    name: rawName,
    company: rawCompany,
    otp: otpCode,
    expiresInMinutes: 5,
  });

  if (!emailRes.success) {
    console.error("[Recruiter OTP Service] Brevo dispatch error:", emailRes.error);
    return { success: false, error: "Failed to deliver access code. Please try again." };
  }

  return {
    success: true,
    challengeId,
    expiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
  };
}

export interface VerifyOtpParams {
  challengeId: string;
  code: string;
  clientIp: string;
  userAgent?: string;
}

export interface VerifyOtpResult {
  verified: boolean;
  sessionToken?: string;
  recruiter?: {
    id: string;
    email: string;
    name: string;
    company: string;
    phone?: string | null;
  };
  remainingAttempts?: number;
  error?: string;
  errorCode?:
    | "INVALID_CHALLENGE"
    | "CHALLENGE_EXPIRED"
    | "MAX_ATTEMPTS_EXCEEDED"
    | "INVALID_CODE";
}

/**
 * Atomically verifies an OTP challenge using Firestore transaction and constant-time comparison.
 */
export async function verifyOtpChallenge(
  params: VerifyOtpParams
): Promise<VerifyOtpResult> {
  const db = getAdminFirestore();
  if (!db) {
    return { verified: false, error: "Database unavailable", errorCode: "INVALID_CHALLENGE" };
  }

  const challengeRef = db.collection(RECRUITER_COLLECTIONS.CHALLENGES).doc(params.challengeId);
  const now = Date.now();

  try {
    const txResult = await db.runTransaction(async (tx) => {
      const snap = await tx.get(challengeRef);
      if (!snap.exists) {
        return { success: false, error: "Challenge not found.", errorCode: "INVALID_CHALLENGE" as const };
      }

      const challenge = snap.data() as RecruiterChallenge;

      if (challenge.isConsumed || challenge.status === "VERIFIED") {
        return { success: false, error: "This code has already been consumed.", errorCode: "INVALID_CHALLENGE" as const };
      }

      if (challenge.status === "INVALIDATED" || challenge.attemptsCount >= MAX_ATTEMPTS) {
        return {
          success: false,
          error: "Maximum verification attempts exceeded. Please request a new code.",
          errorCode: "MAX_ATTEMPTS_EXCEEDED" as const,
        };
      }

      if (now > challenge.expiresAt) {
        tx.update(challengeRef, { status: "EXPIRED", isConsumed: true });
        return { success: false, error: "This access code has expired. Please request a new one.", errorCode: "CHALLENGE_EXPIRED" as const };
      }

      // Compute expected HMAC with RECRUITER_OTP_SECRET
      const expectedHmac = computeOtpHmac(params.code.trim(), challenge.otpSalt, challenge.id);
      const expectedBuf = Buffer.from(expectedHmac, "hex");
      const actualBuf = Buffer.from(challenge.otpHash, "hex");

      const isMatch =
        expectedBuf.length === actualBuf.length &&
        crypto.timingSafeEqual(expectedBuf, actualBuf);

      if (!isMatch) {
        const newAttempts = challenge.attemptsCount + 1;
        const isLocked = newAttempts >= MAX_ATTEMPTS;

        tx.update(challengeRef, {
          attemptsCount: newAttempts,
          status: isLocked ? "INVALIDATED" : "ACTIVE",
          isConsumed: isLocked,
        });

        const remaining = Math.max(0, MAX_ATTEMPTS - newAttempts);
        return {
          success: false,
          isMatch: false,
          remainingAttempts: remaining,
          error: remaining > 0
            ? `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
            : "Maximum attempts exceeded. Please request a new code.",
          errorCode: isLocked ? ("MAX_ATTEMPTS_EXCEEDED" as const) : ("INVALID_CODE" as const),
        };
      }

      // OTP is valid! Mark challenge consumed and verified
      tx.update(challengeRef, {
        status: "VERIFIED",
        isConsumed: true,
        verifiedAt: now,
      });

      return {
        success: true,
        isMatch: true,
        challenge,
      };
    });

    if (!txResult.success || !txResult.isMatch || !txResult.challenge) {
      return {
        verified: false,
        error: txResult.error,
        errorCode: txResult.errorCode,
        remainingAttempts: txResult.remainingAttempts,
      };
    }

    const { challenge } = txResult;
    const recruiterDocId = recruiterRepository.getEmailDocId(challenge.email);

    // 1. Upsert Recruiter Profile in Firestore
    const existingProfileRes = await recruiterRepository.getProfileById(recruiterDocId);
    const existingProfile = existingProfileRes.data;

    const profileData: RecruiterProfile = {
      id: recruiterDocId,
      email: challenge.email,
      name: challenge.name,
      company: challenge.company,
      phone: challenge.phone || existingProfile?.phone || null,
      verified: true,
      firstVerifiedAt: existingProfile?.firstVerifiedAt || now,
      lastActiveAt: now,
      totalVisits: (existingProfile?.totalVisits || 0) + 1,
      lastAction: "AUTH_SUCCESS",
      countryCode: challenge.countryCode || existingProfile?.countryCode || null,
    };
    await recruiterRepository.upsertProfile(profileData);

    // 2. Register Active Recruiter Session in Firestore
    const sessionId = `ses_rec_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
    const tokenPayload = {
      sessionId,
      recruiterId: recruiterDocId,
      email: challenge.email,
      name: challenge.name,
      company: challenge.company,
      issuedAt: now,
    };

    const sessionToken = await signRecruiterSessionToken(tokenPayload);
    const tokenSignature = sessionToken.split(".")[1] || "";
    const tokenHash = crypto.createHash("sha256").update(tokenSignature).digest("hex");

    const sessionRecord: RecruiterSessionRecord = {
      id: sessionId,
      recruiterId: recruiterDocId,
      email: challenge.email,
      name: challenge.name,
      company: challenge.company,
      tokenHash,
      createdAt: now,
      lastActiveAt: now,
      status: "ACTIVE",
      clientIp: params.clientIp,
      userAgent: params.userAgent,
    };
    await recruiterRepository.createSession(sessionRecord);

    // 3. Log Activity Event
    const activityEvent: RecruiterActivityEvent = {
      id: `act_${now}_${crypto.randomBytes(4).toString("hex")}`,
      recruiterId: recruiterDocId,
      email: challenge.email,
      company: challenge.company,
      action: "AUTH_SUCCESS",
      timestamp: now,
      clientIp: params.clientIp,
    };
    recruiterRepository.logActivity(activityEvent).catch((err) => {
      console.warn("[Recruiter OTP Service] Failed to log auth activity:", err);
    });

    // 4. Send Admin Notification Email (Asynchronous fire-and-forget)
    dispatchRecruiterVerifiedAdminNotification({
      name: challenge.name,
      company: challenge.company,
      email: challenge.email,
      phone: challenge.phone,
      countryCode: challenge.countryCode,
      verifiedAt: now,
    }).catch((err) => {
      console.error("[Recruiter OTP Service] Failed to send admin alert email:", err);
    });

    return {
      verified: true,
      sessionToken,
      recruiter: {
        id: recruiterDocId,
        email: challenge.email,
        name: challenge.name,
        company: challenge.company,
        phone: challenge.phone,
      },
    };
  } catch (err) {
    console.error("[Recruiter OTP Service] Verify error:", err);
    return { verified: false, error: "Internal verification error. Please retry.", errorCode: "INVALID_CHALLENGE" };
  }
}

export interface ResendOtpParams {
  challengeId: string;
  clientIp: string;
}

export interface ResendOtpResult {
  success: boolean;
  resendCount?: number;
  expiresInSeconds?: number;
  error?: string;
  errorCode?: "COOLDOWN_ACTIVE" | "MAX_RESENDS_EXCEEDED" | "INVALID_CHALLENGE";
}

/**
 * Resends a fresh OTP code for an active challenge, respecting cooldown and resend caps.
 */
export async function resendOtpChallenge(params: ResendOtpParams): Promise<ResendOtpResult> {
  const challengeRes = await recruiterRepository.getChallenge(params.challengeId);
  if (!challengeRes.success || !challengeRes.data) {
    return { success: false, error: "Challenge not found.", errorCode: "INVALID_CHALLENGE" };
  }

  const challenge = challengeRes.data;
  if (challenge.isConsumed || challenge.status !== "ACTIVE") {
    return { success: false, error: "This challenge is no longer active.", errorCode: "INVALID_CHALLENGE" };
  }

  if (challenge.resendCount >= MAX_RESENDS) {
    return {
      success: false,
      error: "Maximum code resend limit reached. Please restart access request.",
      errorCode: "MAX_RESENDS_EXCEEDED",
    };
  }

  const now = Date.now();
  const timeSinceLastResend = now - challenge.lastResentAt;
  if (timeSinceLastResend < RESEND_COOLDOWN_MS) {
    const waitSec = Math.ceil((RESEND_COOLDOWN_MS - timeSinceLastResend) / 1000);
    return {
      success: false,
      error: `Please wait ${waitSec}s before requesting another code.`,
      errorCode: "COOLDOWN_ACTIVE",
    };
  }

  // Generate fresh code and salt
  const newOtpCode = crypto.randomInt(100000, 1000000).toString();
  const newOtpSalt = crypto.randomBytes(16).toString("hex");
  const newOtpHash = computeOtpHmac(newOtpCode, newOtpSalt, challenge.id);
  const newResendCount = challenge.resendCount + 1;

  await recruiterRepository.updateChallenge(challenge.id, {
    otpHash: newOtpHash,
    otpSalt: newOtpSalt,
    attemptsCount: 0,
    resendCount: newResendCount,
    lastResentAt: now,
    expiresAt: now + OTP_TTL_MS,
  });

  // Local QA Test Support: In non-production, record generated OTP for local test runner
  if (process.env.NODE_ENV !== "production") {
    try {
      const testOtpPath = path.join(process.cwd(), ".local-test-otp.json");
      let testStore: Record<string, string> = {};
      if (fs.existsSync(testOtpPath)) {
        try {
          testStore = JSON.parse(fs.readFileSync(testOtpPath, "utf-8"));
        } catch {
          testStore = {};
        }
      }
      testStore[challenge.id] = newOtpCode;
      testStore[challenge.email.toLowerCase()] = newOtpCode;
      testStore["latest"] = newOtpCode;
      fs.writeFileSync(testOtpPath, JSON.stringify(testStore, null, 2), "utf-8");
    } catch {
      // ignore
    }
  }

  // Dispatch Email
  const emailRes = await dispatchRecruiterOtpEmail({
    email: challenge.email,
    name: challenge.name,
    company: challenge.company,
    otp: newOtpCode,
    expiresInMinutes: 5,
  });

  if (!emailRes.success) {
    return { success: false, error: "Failed to dispatch email. Please retry." };
  }

  return {
    success: true,
    resendCount: newResendCount,
    expiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
  };
}

// =========================================================================
// Phone Number Anti-Spam Unmask OTP Challenge & Verification
// =========================================================================

export interface CreatePhoneUnmaskOtpParams {
  sessionId: string;
  email: string;
  name: string;
  company: string;
  clientIp: string;
}

export interface CreatePhoneUnmaskOtpResult {
  success: boolean;
  challengeId?: string;
  expiresInSeconds?: number;
  error?: string;
}

/**
 * Creates an OTP challenge specifically for unmasking Gaurav's direct phone number.
 */
export async function createPhoneUnmaskOtpChallenge(
  params: CreatePhoneUnmaskOtpParams
): Promise<CreatePhoneUnmaskOtpResult> {
  const rawEmail = params.email.trim().toLowerCase();
  const rawName = params.name.trim();
  const rawCompany = params.company.trim();

  // 1. Generate 6-digit numeric OTP and 16-byte cryptographic salt
  const otpCode = crypto.randomInt(100000, 1000000).toString();
  const otpSalt = crypto.randomBytes(16).toString("hex");
  const challengeId = `ch_phone_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;

  // 2. Compute salted HMAC
  const otpHash = computeOtpHmac(otpCode, otpSalt, challengeId);
  const now = Date.now();

  const challenge: RecruiterChallenge = {
    id: challengeId,
    email: rawEmail,
    name: rawName,
    company: rawCompany,
    phone: null,
    otpHash,
    otpSalt,
    attemptsCount: 0,
    resendCount: 0,
    status: "ACTIVE",
    isConsumed: false,
    createdAt: now,
    expiresAt: now + OTP_TTL_MS,
    lastResentAt: now,
    clientIp: params.clientIp,
  };

  // 3. Persist in Firestore
  const saveRes = await recruiterRepository.createChallenge(challenge);
  if (!saveRes.success) {
    return { success: false, error: "Failed to persist verification challenge." };
  }

  // Local QA Test Support
  if (process.env.NODE_ENV !== "production") {
    try {
      const testOtpPath = path.join(process.cwd(), ".local-test-otp.json");
      let testStore: Record<string, string> = {};
      if (fs.existsSync(testOtpPath)) {
        try {
          testStore = JSON.parse(fs.readFileSync(testOtpPath, "utf-8"));
        } catch {
          testStore = {};
        }
      }
      testStore[challengeId] = otpCode;
      testStore[rawEmail] = otpCode;
      testStore["phone_unmask_latest"] = otpCode;
      testStore["latest"] = otpCode;
      fs.writeFileSync(testOtpPath, JSON.stringify(testStore, null, 2), "utf-8");
    } catch {
      // ignore
    }
  }

  // 4. Dispatch Email
  const emailRes = await dispatchPhoneUnmaskOtpEmail({
    email: rawEmail,
    name: rawName,
    company: rawCompany,
    otp: otpCode,
    expiresInMinutes: 5,
  });

  if (!emailRes.success) {
    console.error("[Recruiter OTP Service] Phone unmask email dispatch error:", emailRes.error);
    return { success: false, error: "Failed to deliver access code. Please try again." };
  }

  return {
    success: true,
    challengeId,
    expiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
  };
}

export interface VerifyPhoneUnmaskOtpParams {
  sessionId: string;
  challengeId: string;
  code: string;
  clientIp: string;
}

export interface VerifyPhoneUnmaskOtpResult {
  verified: boolean;
  phone?: string;
  phoneDisplay?: string;
  whatsappUrl?: string;
  secondaryPhone?: string;
  secondaryPhoneDisplay?: string;
  remainingAttempts?: number;
  error?: string;
  errorCode?:
    | "INVALID_CHALLENGE"
    | "CHALLENGE_EXPIRED"
    | "MAX_ATTEMPTS_EXCEEDED"
    | "INVALID_CODE";
}

/**
 * Atomically verifies an OTP challenge for phone unmasking, updates session in Firestore,
 * and returns unmasked phone and WhatsApp URL.
 */
export async function verifyPhoneUnmaskOtpChallenge(
  params: VerifyPhoneUnmaskOtpParams
): Promise<VerifyPhoneUnmaskOtpResult> {
  const db = getAdminFirestore();
  if (!db) {
    return { verified: false, error: "Database unavailable", errorCode: "INVALID_CHALLENGE" };
  }

  const challengeRef = db.collection(RECRUITER_COLLECTIONS.CHALLENGES).doc(params.challengeId);
  const now = Date.now();

  try {
    const txResult = await db.runTransaction(async (tx) => {
      const snap = await tx.get(challengeRef);
      if (!snap.exists) {
        return { success: false, error: "Challenge not found.", errorCode: "INVALID_CHALLENGE" as const };
      }

      const challenge = snap.data() as RecruiterChallenge;

      if (challenge.isConsumed || challenge.status === "VERIFIED") {
        return { success: false, error: "This code has already been consumed.", errorCode: "INVALID_CHALLENGE" as const };
      }

      if (challenge.status === "INVALIDATED" || challenge.attemptsCount >= MAX_ATTEMPTS) {
        return {
          success: false,
          error: "Maximum verification attempts exceeded. Please request a new code.",
          errorCode: "MAX_ATTEMPTS_EXCEEDED" as const,
        };
      }

      if (now > challenge.expiresAt) {
        tx.update(challengeRef, { status: "EXPIRED", isConsumed: true });
        return { success: false, error: "This access code has expired. Please request a new one.", errorCode: "CHALLENGE_EXPIRED" as const };
      }

      const expectedHmac = computeOtpHmac(params.code.trim(), challenge.otpSalt, challenge.id);
      const expectedBuf = Buffer.from(expectedHmac, "hex");
      const actualBuf = Buffer.from(challenge.otpHash, "hex");

      const isMatch =
        expectedBuf.length === actualBuf.length &&
        crypto.timingSafeEqual(expectedBuf, actualBuf);

      if (!isMatch) {
        const newAttempts = challenge.attemptsCount + 1;
        const isLocked = newAttempts >= MAX_ATTEMPTS;

        tx.update(challengeRef, {
          attemptsCount: newAttempts,
          status: isLocked ? "INVALIDATED" : "ACTIVE",
          isConsumed: isLocked,
        });

        const remaining = Math.max(0, MAX_ATTEMPTS - newAttempts);
        return {
          success: false,
          isMatch: false,
          remainingAttempts: remaining,
          error: remaining > 0
            ? `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
            : "Maximum attempts exceeded. Please request a new code.",
          errorCode: isLocked ? ("MAX_ATTEMPTS_EXCEEDED" as const) : ("INVALID_CODE" as const),
        };
      }

      // Consumed & verified
      tx.update(challengeRef, {
        status: "VERIFIED",
        isConsumed: true,
        verifiedAt: now,
      });

      return {
        success: true,
        isMatch: true,
        challenge,
      };
    });

    if (!txResult.success || !txResult.isMatch || !txResult.challenge) {
      return {
        verified: false,
        error: txResult.error,
        errorCode: txResult.errorCode,
        remainingAttempts: txResult.remainingAttempts,
      };
    }

    const { challenge } = txResult;
    const recruiterDocId = recruiterRepository.getEmailDocId(challenge.email);

    // 1. Mark session phone as unmasked in Firestore
    await recruiterRepository.unmaskSessionPhone(params.sessionId);

    // 2. Log Recruiter Activity
    const activityEvent: RecruiterActivityEvent = {
      id: `act_${now}_${crypto.randomBytes(4).toString("hex")}`,
      recruiterId: recruiterDocId,
      email: challenge.email,
      company: challenge.company,
      action: "UNMASK_PHONE",
      timestamp: now,
      clientIp: params.clientIp,
    };
    recruiterRepository.logActivity(activityEvent).catch((err) => {
      console.warn("[Recruiter OTP Service] Failed to log unmask activity:", err);
    });

    // 3. Send Admin Security Alert (Non-blocking)
    dispatchRecruiterPhoneUnmaskedAdminNotification({
      name: challenge.name,
      company: challenge.company,
      email: challenge.email,
      clientIp: params.clientIp,
      unmaskedAt: now,
    }).catch((err) => {
      console.error("[Recruiter OTP Service] Failed to send admin unmasked notification:", err);
    });

    // 4. Return unmasked contact data
    const rawPhone = process.env.RECRUITER_PHONE_NUMBER || "+918788883087";
    const rawWaNumber = process.env.RECRUITER_WHATSAPP_NUMBER || "918788883087";
    const rawSecondaryPhone = process.env.RECRUITER_SECONDARY_PHONE || "+919767783087";
    const defaultWaMessage = encodeURIComponent(
      `Hi Gaurav, I'm ${challenge.name} from ${challenge.company}. I reviewed your Recruiter Portal and would like to discuss engineering opportunities.`
    );
    const whatsappUrl = `https://wa.me/${rawWaNumber.replace(/[^0-9]/g, "")}?text=${defaultWaMessage}`;

    return {
      verified: true,
      phone: rawPhone,
      phoneDisplay: "+91 87888 83087",
      whatsappUrl,
      secondaryPhone: rawSecondaryPhone,
      secondaryPhoneDisplay: "+91 97677 83087",
    };
  } catch (err) {
    console.error("[Recruiter OTP Service] Verify phone unmask error:", err);
    return { verified: false, error: "Internal verification error. Please retry.", errorCode: "INVALID_CHALLENGE" };
  }
}

/**
 * Resends a fresh OTP code for an active phone unmask challenge.
 */
export async function resendPhoneUnmaskOtpChallenge(params: ResendOtpParams): Promise<ResendOtpResult> {
  const challengeRes = await recruiterRepository.getChallenge(params.challengeId);
  if (!challengeRes.success || !challengeRes.data) {
    return { success: false, error: "Challenge not found.", errorCode: "INVALID_CHALLENGE" };
  }

  const challenge = challengeRes.data;
  if (challenge.isConsumed || challenge.status !== "ACTIVE") {
    return { success: false, error: "This challenge is no longer active.", errorCode: "INVALID_CHALLENGE" };
  }

  if (challenge.resendCount >= MAX_RESENDS) {
    return {
      success: false,
      error: "Maximum code resend limit reached. Please restart access request.",
      errorCode: "MAX_RESENDS_EXCEEDED",
    };
  }

  const now = Date.now();
  const timeSinceLastResend = now - challenge.lastResentAt;
  if (timeSinceLastResend < RESEND_COOLDOWN_MS) {
    const waitSec = Math.ceil((RESEND_COOLDOWN_MS - timeSinceLastResend) / 1000);
    return {
      success: false,
      error: `Please wait ${waitSec}s before requesting another code.`,
      errorCode: "COOLDOWN_ACTIVE",
    };
  }

  // Generate fresh code and salt
  const newOtpCode = crypto.randomInt(100000, 1000000).toString();
  const newOtpSalt = crypto.randomBytes(16).toString("hex");
  const newOtpHash = computeOtpHmac(newOtpCode, newOtpSalt, challenge.id);
  const newResendCount = challenge.resendCount + 1;

  await recruiterRepository.updateChallenge(challenge.id, {
    otpHash: newOtpHash,
    otpSalt: newOtpSalt,
    attemptsCount: 0,
    resendCount: newResendCount,
    lastResentAt: now,
    expiresAt: now + OTP_TTL_MS,
  });

  // Local QA Test Support
  if (process.env.NODE_ENV !== "production") {
    try {
      const testOtpPath = path.join(process.cwd(), ".local-test-otp.json");
      let testStore: Record<string, string> = {};
      if (fs.existsSync(testOtpPath)) {
        try {
          testStore = JSON.parse(fs.readFileSync(testOtpPath, "utf-8"));
        } catch {
          testStore = {};
        }
      }
      testStore[challenge.id] = newOtpCode;
      testStore[challenge.email.toLowerCase()] = newOtpCode;
      testStore["phone_unmask_latest"] = newOtpCode;
      testStore["latest"] = newOtpCode;
      fs.writeFileSync(testOtpPath, JSON.stringify(testStore, null, 2), "utf-8");
    } catch {
      // ignore
    }
  }

  // Dispatch Email
  const emailRes = await dispatchPhoneUnmaskOtpEmail({
    email: challenge.email,
    name: challenge.name,
    company: challenge.company,
    otp: newOtpCode,
    expiresInMinutes: 5,
  });

  if (!emailRes.success) {
    return { success: false, error: "Failed to dispatch email. Please retry." };
  }

  return {
    success: true,
    resendCount: newResendCount,
    expiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
  };
}

