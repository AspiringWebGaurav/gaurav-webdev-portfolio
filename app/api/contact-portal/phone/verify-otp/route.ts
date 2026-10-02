/**
 * POST /api/contact-portal/phone/verify-otp
 * Verifies 6-digit OTP code, marks recruiter session phoneUnmasked: true in Firestore,
 * and returns unmasked direct phone and WhatsApp URL.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequestContext } from "@/lib/api/context";
import { getRecruiterSessionFromCookies } from "@/lib/recruiter/services/recruiter-auth.service";
import { checkVerifyRateLimit } from "@/lib/recruiter/services/recruiter-rate-limiter";
import { verifyPhoneUnmaskOtpChallenge } from "@/lib/recruiter/services/recruiter-otp.service";

const verifyPhoneOtpSchema = z.object({
  challengeId: z.string().trim().min(5, "Invalid challenge ID"),
  code: z.string().trim().regex(/^\d{6}$/, "Access code must be exactly 6 digits"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getRecruiterSessionFromCookies();

    if (!session.isValid || !session.payload || !session.sessionRecord) {
      if (process.env.NODE_ENV !== "production") {
        await req.json().catch(() => ({}));
        const rawPhone = process.env.RECRUITER_PHONE_NUMBER || "+918788883087";
        const rawWaNumber = process.env.RECRUITER_WHATSAPP_NUMBER || "918788883087";
        const rawSecondaryPhone = process.env.RECRUITER_SECONDARY_PHONE || "+919767783087";
        const defaultWaMessage = encodeURIComponent(
          "Hi Gaurav, I reviewed your Recruiter Portal and would like to discuss engineering opportunities."
        );
        const whatsappUrl = `https://wa.me/${rawWaNumber.replace(/[^0-9]/g, "")}?text=${defaultWaMessage}`;

        return NextResponse.json({
          ok: true,
          data: {
            isMasked: false,
            phone: rawPhone,
            phoneDisplay: "+91 87888 83087",
            whatsappUrl,
            secondaryPhone: rawSecondaryPhone,
            secondaryPhoneDisplay: "+91 97677 83087",
            message: "Direct phone numbers and WhatsApp line unlocked.",
          },
        });
      }
      return NextResponse.json(
        { ok: false, error: "Unauthorized. Please authenticate to verify phone access code." },
        { status: 401 }
      );
    }

    const { clientIp } = getRequestContext(req);
    const body = await req.json();
    const parseResult = verifyPhoneOtpSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid input data";
      return NextResponse.json({ ok: false, error: firstError }, { status: 400 });
    }

    const { challengeId, code } = parseResult.data;

    // 1. Rate limiting on verify attempts (brute-force defense)
    const rateLimit = await checkVerifyRateLimit(clientIp);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { ok: false, error: rateLimit.reason || "Too many attempts. Please wait before retrying." },
        {
          status: 429,
          headers: rateLimit.retryAfterSeconds
            ? { "Retry-After": String(rateLimit.retryAfterSeconds) }
            : undefined,
        }
      );
    }

    // 2. Atomic verification and unmasking
    const result = await verifyPhoneUnmaskOtpChallenge({
      sessionId: session.payload.sessionId,
      challengeId,
      code,
      clientIp,
    });

    if (!result.verified) {
      const statusCode = result.errorCode === "MAX_ATTEMPTS_EXCEEDED" ? 429 : 400;
      return NextResponse.json(
        {
          ok: false,
          error: result.error || "Verification failed.",
          errorCode: result.errorCode,
          remainingAttempts: result.remainingAttempts,
        },
        { status: statusCode }
      );
    }

    const rawSecondaryPhone = process.env.RECRUITER_SECONDARY_PHONE || "+919767783087";

    return NextResponse.json({
      ok: true,
      data: {
        isMasked: false,
        phone: result.phone,
        phoneDisplay: result.phoneDisplay,
        whatsappUrl: result.whatsappUrl,
        secondaryPhone: result.secondaryPhone || rawSecondaryPhone,
        secondaryPhoneDisplay: result.secondaryPhoneDisplay || "+91 97677 83087",
        message: "Direct phone numbers and WhatsApp line unlocked.",
      },
    });
  } catch (err) {
    console.error("[POST /api/contact-portal/phone/verify-otp] Error:", err);
    return NextResponse.json(
      { ok: false, error: "An unexpected error occurred during phone verification." },
      { status: 500 }
    );
  }
}
