import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  createAdminSessionPayload,
  signAdminSession,
} from "@/lib/admin/auth";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  DOWNEX_ADMIN_COOKIE_NAME,
  DOWNEX_SESSION_MAX_AGE_SECONDS,
} from "@/lib/admin/constants";
import { rtdbDataSource } from "@/lib/admin/datasource/rtdb";

export const dynamic = "force-dynamic";

const OTP_SECRET =
  process.env.ADMIN_OTP_SECRET ||
  process.env.ADMIN_SESSION_SECRET ||
  process.env.FIREBASE_ADMIN_PRIVATE_KEY ||
  "downex_admin_otp_secret_key_2026";

function computeHmac(otp: string, salt: string): string {
  return crypto
    .createHmac("sha256", OTP_SECRET)
    .update(`${otp.trim()}_${salt.trim()}`)
    .digest("hex");
}

function constantTimeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "hex");
    const bufB = Buffer.from(b, "hex");
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const challengeId = (body.challengeId || "").trim();
    const suppliedOtp = (body.otp || "").trim();

    if (!challengeId || !suppliedOtp || suppliedOtp.length !== 6) {
      return NextResponse.json(
        { success: false, error: "Please enter the complete 6-digit code." },
        { status: 400 }
      );
    }

    const challengePath = `ecosystem/apps/downex/auth_challenges/${challengeId}`;
    const challenge = await rtdbDataSource.getValue<Record<string, unknown>>(challengePath);

    if (!challenge) {
      return NextResponse.json(
        { success: false, error: "Verification session not found or expired. Please request a new code." },
        { status: 404 }
      );
    }

    if (challenge.isConsumed === true) {
      return NextResponse.json(
        { success: false, error: "This verification code has already been used. Please request a new one." },
        { status: 400 }
      );
    }

    if (Date.now() > Number(challenge.expiresAt || 0)) {
      return NextResponse.json(
        { success: false, error: "Verification code has expired. Please request a new code." },
        { status: 400 }
      );
    }

    const salt = String(challenge.salt || "");
    const expectedHash = String(challenge.otpHash || "");
    const computedHash = computeHmac(suppliedOtp, salt);

    const isMatch = constantTimeCompare(computedHash, expectedHash);

    if (!isMatch) {
      const currentAttempts = Number(challenge.attempts || 0) + 1;
      const isExhausted = currentAttempts >= 3;

      await rtdbDataSource.setValue(challengePath, {
        ...challenge,
        attempts: currentAttempts,
        isConsumed: isExhausted,
      });

      return NextResponse.json(
        {
          success: false,
          error: isExhausted
            ? "Too many incorrect attempts. This code has been invalidated for security."
            : `Incorrect code. ${3 - currentAttempts} attempts remaining.`,
        },
        { status: 400 }
      );
    }

    // Successfully verified: Consume challenge
    await rtdbDataSource.setValue(challengePath, {
      ...challenge,
      isConsumed: true,
      verifiedAt: Date.now(),
    });

    const email = String(challenge.email || "gauravpatil9262@gmail.com");
    const session = createAdminSessionPayload(email, undefined, "Gaurav Patil");
    const signedSessionToken = await signAdminSession(session);

    const response = NextResponse.json({
      success: true,
      session,
      token: signedSessionToken,
    });

    // Set secure Downex admin session cookie (30-day persistent window)
    response.cookies.set({
      name: DOWNEX_ADMIN_COOKIE_NAME,
      value: signedSessionToken,
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: DOWNEX_SESSION_MAX_AGE_SECONDS,
    });

    // Also set root admin session cookie for portfolio cross-panel compatibility
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: signedSessionToken,
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Verification failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
