import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequestContext } from "@/lib/api/context";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import { createResumeOtpChallenge } from "@/lib/resume/services/resume-auth.service";
import { getAutocorrectedEmail, checkEmailAbuse } from "@/lib/recruiter/validation";
import { isLifecycleLockActive } from "@/lib/dal/lifecycle/lock";

export const dynamic = "force-dynamic";

const sendOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email address"),
  name: z.string().trim().max(80).optional().nullable(),
  company: z.string().trim().max(100).optional().nullable(),
  turnstileToken: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const { clientIp } = getRequestContext(req);

  try {
    // 1. Maintenance Gate
    if (await isLifecycleLockActive()) {
      return NextResponse.json(
        {
          ok: false,
          error: "Database maintenance in progress. Please retry in a few moments.",
        },
        { status: 503, headers: { "Retry-After": "5" } }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ ok: false, error: "Invalid JSON payload" }, { status: 400 });
    }

    const parsed = sendOtpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message || "Invalid input data" },
        { status: 400 }
      );
    }

    const { name, email, company, turnstileToken } = parsed.data;
    const normalizedEmail = getAutocorrectedEmail(email);

    // Anti-Abuse Shield: Reject abusive, vulgar, or spam email addresses
    const abuseCheck = checkEmailAbuse(normalizedEmail);
    if (abuseCheck.isAbusive) {
      return NextResponse.json(
        { ok: false, error: abuseCheck.error || "Abusive or inappropriate email addresses are not accepted." },
        { status: 400 }
      );
    }

    const resolvedName = name?.trim() || normalizedEmail.split("@")[0] || "Recruiter";

    // 2. Cloudflare Turnstile Bot Verification
    const activeResumeSecret =
      process.env.RESUME_TURNSTILE_SECRET_KEY ||
      process.env.RESUME_GAURAVPATIL_SECRET_KEY ||
      process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;

    const turnstileResult = await verifyTurnstileToken(turnstileToken, clientIp, {
      secretKeyOverride: activeResumeSecret,
      expectedAction: ["resume_gate", "resume", "contact"],
    });

    if (!turnstileResult.success) {
      return NextResponse.json(
        {
          ok: false,
          error: turnstileResult.error || "Security verification check failed. Please refresh.",
        },
        { status: 403 }
      );
    }

    // 3. Country extraction
    const rawCountry = req.headers.get("cf-ipcountry");
    const countryCode =
      rawCountry && /^[A-Z]{2}$/.test(rawCountry.trim().toUpperCase()) && rawCountry.trim().toUpperCase() !== "XX"
        ? rawCountry.trim().toUpperCase()
        : null;

    // 4. Create OTP Challenge & Send Email
    const result = await createResumeOtpChallenge({
      name: resolvedName,
      email: normalizedEmail,
      company: company || null,
      clientIp,
      countryCode,
    });

    if (!result.success || !result.challengeId) {
      return NextResponse.json(
        { ok: false, error: result.error || "Unable to send verification code." },
        { status: 429 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        challengeId: result.challengeId,
        expiresInSeconds: result.expiresInSeconds,
        normalizedEmail,
        message: `Verification code sent to ${normalizedEmail}`,
      },
    });
  } catch (err) {
    console.error("Resume send-otp error:", err);
    return NextResponse.json(
      { ok: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
