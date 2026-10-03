/**
 * POST /api/contact-portal/auth/send-otp
 * Validates Turnstile, checks rate limits, creates salted HMAC OTP challenge, and dispatches email.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequestContext } from "@/lib/api/context";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import { checkSendOtpRateLimit } from "@/lib/recruiter/services/recruiter-rate-limiter";
import { createOtpChallenge } from "@/lib/recruiter/services/recruiter-otp.service";
import { validateWorkEmail, getAutocorrectedEmail } from "@/lib/recruiter/validation";

const sendOtpSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  company: z.string().trim().min(2, "Company must be at least 2 characters").max(100, "Company too long"),
  email: z.string().trim().toLowerCase().email("Please provide a valid email address"),
  phone: z.string().trim().max(30).optional().nullable(),
  turnstileToken: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const { clientIp } = getRequestContext(req);
    const body = await req.json();
    const parseResult = sendOtpSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid input data";
      return NextResponse.json({ ok: false, error: firstError }, { status: 400 });
    }

    const { name, company, email, phone, turnstileToken } = parseResult.data;

    // Autocorrect domain typos (e.g. gmal.com -> gmail.com) & validate
    const normalizedEmail = getAutocorrectedEmail(email);
    const emailValidationError = validateWorkEmail(normalizedEmail);
    if (emailValidationError) {
      return NextResponse.json({ ok: false, error: emailValidationError }, { status: 400 });
    }

    // 1. Turnstile bot challenge verification
    const recruiterTurnstileSecret =
      process.env.RECRUITER_TURNSTILE_SECRET_KEY ||
      process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
    const turnstileResult = await verifyTurnstileToken(turnstileToken, clientIp, {
      secretKeyOverride: recruiterTurnstileSecret,
      expectedAction: ["contact_portal", "recruiter", "contact"],
    });
    if (!turnstileResult.success) {
      return NextResponse.json(
        { ok: false, error: "Bot verification failed. Please refresh and try again." },
        { status: 403 }
      );
    }

    // 2. Multi-tier rate limiting
    const rateLimit = await checkSendOtpRateLimit(clientIp, normalizedEmail);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { ok: false, error: rateLimit.reason || "Rate limit exceeded. Please try again later." },
        {
          status: 429,
          headers: rateLimit.retryAfterSeconds
            ? { "Retry-After": String(rateLimit.retryAfterSeconds) }
            : undefined,
        }
      );
    }

    // 3. Authoritative Country Code from Cloudflare
    const rawCountry = req.headers.get("cf-ipcountry");
    const countryCode =
      rawCountry && /^[A-Z]{2}$/.test(rawCountry.trim().toUpperCase()) && rawCountry.trim().toUpperCase() !== "XX"
        ? rawCountry.trim().toUpperCase()
        : null;

    // 4. Create OTP Challenge & dispatch email
    const challengeResult = await createOtpChallenge({
      name,
      company,
      email: normalizedEmail,
      phone: phone || null,
      clientIp,
      countryCode,
    });

    if (!challengeResult.success || !challengeResult.challengeId) {
      return NextResponse.json(
        { ok: false, error: challengeResult.error || "Failed to create verification challenge." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        challengeId: challengeResult.challengeId,
        expiresInSeconds: challengeResult.expiresInSeconds,
        message: `Verification code sent to ${normalizedEmail}`,
      },
    });
  } catch (err) {
    console.error("[POST /api/contact-portal/auth/send-otp] Error:", err);
    return NextResponse.json(
      { ok: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
