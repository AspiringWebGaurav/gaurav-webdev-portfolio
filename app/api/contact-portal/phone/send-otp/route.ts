/**
 * POST /api/contact-portal/phone/send-otp
 * Dispatches a 6-digit OTP code to authenticated recruiter's email to unmask Gaurav's direct phone.
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getRequestContext } from "@/lib/api/context";
import { getRecruiterSessionFromCookies } from "@/lib/recruiter/services/recruiter-auth.service";
import { checkSendOtpRateLimit } from "@/lib/recruiter/services/recruiter-rate-limiter";
import { createPhoneUnmaskOtpChallenge } from "@/lib/recruiter/services/recruiter-otp.service";
import { recruiterRepository } from "@/lib/dal/repositories/recruiter.repository";
import { verifyTurnstileToken } from "@/lib/security/turnstile";

export async function POST(req: NextRequest) {
  try {
    const session = await getRecruiterSessionFromCookies();

    if (!session.isValid || !session.payload || !session.sessionRecord) {
      if (process.env.NODE_ENV !== "production") {
        return NextResponse.json({
          ok: true,
          data: {
            challengeId: "dev_challenge_preview",
            expiresInSeconds: 600,
            email: "recruiter@preview.local",
            message: "6-digit access code (123456) sent to your inbox",
          },
        });
      }
      return NextResponse.json(
        { ok: false, error: "Unauthorized. Please authenticate to request phone unmasking." },
        { status: 401 }
      );
    }

    // If phone is already unmasked on this session, inform client immediately
    if (session.sessionRecord.phoneUnmasked) {
      return NextResponse.json({
        ok: true,
        alreadyUnmasked: true,
        message: "Phone number is already unmasked for this session.",
      });
    }

    const { clientIp } = getRequestContext(req);
    const body = await req.json().catch(() => ({}));
    const turnstileToken = typeof body?.turnstileToken === "string" ? body.turnstileToken : null;

    if (turnstileToken) {
      const recruiterTurnstileSecret =
        process.env.RECRUITER_TURNSTILE_SECRET_KEY ||
        process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
      const turnstileResult = await verifyTurnstileToken(turnstileToken, clientIp, recruiterTurnstileSecret);
      if (!turnstileResult.success) {
        return NextResponse.json(
          { ok: false, error: "Bot verification failed. Please try again." },
          { status: 403 }
        );
      }
    }

    // Multi-tier rate limiting
    const rateLimit = await checkSendOtpRateLimit(clientIp, session.payload.email);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { ok: false, error: rateLimit.reason || "Rate limit reached. Please wait before retrying." },
        {
          status: 429,
          headers: rateLimit.retryAfterSeconds
            ? { "Retry-After": String(rateLimit.retryAfterSeconds) }
            : undefined,
        }
      );
    }

    // Create OTP challenge & dispatch email
    const challengeResult = await createPhoneUnmaskOtpChallenge({
      sessionId: session.payload.sessionId,
      email: session.payload.email,
      name: session.payload.name,
      company: session.payload.company,
      clientIp,
    });

    if (!challengeResult.success || !challengeResult.challengeId) {
      return NextResponse.json(
        { ok: false, error: challengeResult.error || "Failed to generate phone access code." },
        { status: 500 }
      );
    }

    // Log Activity Event
    recruiterRepository.logActivity({
      id: `act_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      recruiterId: session.payload.recruiterId,
      email: session.payload.email,
      company: session.payload.company,
      action: "REQUEST_PHONE_OTP",
      timestamp: Date.now(),
      clientIp,
    }).catch(() => {});

    return NextResponse.json({
      ok: true,
      data: {
        challengeId: challengeResult.challengeId,
        expiresInSeconds: challengeResult.expiresInSeconds,
        email: session.payload.email,
        message: `6-digit access code sent to ${session.payload.email}`,
      },
    });
  } catch (err) {
    console.error("[POST /api/contact-portal/phone/send-otp] Error:", err);
    return NextResponse.json(
      { ok: false, error: "An unexpected error occurred while requesting phone access code." },
      { status: 500 }
    );
  }
}
