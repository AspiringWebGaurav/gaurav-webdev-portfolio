/**
 * POST /api/contact-portal/phone/resend-otp
 * Resends a fresh 6-digit OTP code for an active phone unmasking challenge.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequestContext } from "@/lib/api/context";
import { getRecruiterSessionFromCookies } from "@/lib/recruiter/services/recruiter-auth.service";
import { resendPhoneUnmaskOtpChallenge } from "@/lib/recruiter/services/recruiter-otp.service";

const resendSchema = z.object({
  challengeId: z.string().trim().min(5, "Invalid challenge ID"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getRecruiterSessionFromCookies();

    if (!session.isValid || !session.payload) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized. Please authenticate to resend access code." },
        { status: 401 }
      );
    }

    const { clientIp } = getRequestContext(req);
    const body = await req.json();
    const parseResult = resendSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid input data";
      return NextResponse.json({ ok: false, error: firstError }, { status: 400 });
    }

    const { challengeId } = parseResult.data;

    const result = await resendPhoneUnmaskOtpChallenge({
      challengeId,
      clientIp,
    });

    if (!result.success) {
      const statusCode = result.errorCode === "COOLDOWN_ACTIVE" ? 429 : 400;
      return NextResponse.json(
        {
          ok: false,
          error: result.error || "Failed to resend access code.",
          errorCode: result.errorCode,
        },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        resendCount: result.resendCount,
        expiresInSeconds: result.expiresInSeconds,
        message: "A fresh access code has been sent to your email.",
      },
    });
  } catch (err) {
    console.error("[POST /api/contact-portal/phone/resend-otp] Error:", err);
    return NextResponse.json(
      { ok: false, error: "An unexpected error occurred while resending access code." },
      { status: 500 }
    );
  }
}
