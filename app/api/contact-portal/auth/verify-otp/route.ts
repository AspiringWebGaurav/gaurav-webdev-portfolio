/**
 * POST /api/contact-portal/auth/verify-otp
 * Verifies 6-digit OTP code atomically, issues signed recruiter_session browser cookie, and notifies admin.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequestContext } from "@/lib/api/context";
import { checkVerifyRateLimit } from "@/lib/recruiter/services/recruiter-rate-limiter";
import { verifyOtpChallenge } from "@/lib/recruiter/services/recruiter-otp.service";
import { createRecruiterSessionCookieHeader } from "@/lib/recruiter/services/recruiter-auth.service";

const verifyOtpSchema = z.object({
  challengeId: z.string().trim().min(5, "Invalid challenge ID"),
  code: z.string().trim().regex(/^\d{6}$/, "Access code must be exactly 6 digits"),
});

export async function POST(req: NextRequest) {
  try {
    const { clientIp, userAgent } = getRequestContext(req);
    const body = await req.json();
    const parseResult = verifyOtpSchema.safeParse(body);

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

    // 2. Atomic verification and profile/session provisioning
    const result = await verifyOtpChallenge({
      challengeId,
      code,
      clientIp,
      userAgent,
    });

    if (!result.verified || !result.sessionToken) {
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

    // 3. Issue Set-Cookie header for true browser-session cookie (no Max-Age, no Expires)
    const cookieHeader = createRecruiterSessionCookieHeader(result.sessionToken);

    const response = NextResponse.json({
      ok: true,
      data: {
        recruiter: result.recruiter,
      },
    });

    response.headers.set("Set-Cookie", cookieHeader);
    return response;
  } catch (err) {
    console.error("[POST /api/contact-portal/auth/verify-otp] Error:", err);
    return NextResponse.json(
      { ok: false, error: "An unexpected error occurred during verification." },
      { status: 500 }
    );
  }
}
