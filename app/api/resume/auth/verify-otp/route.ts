import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequestContext } from "@/lib/api/context";
import { verifyResumeOtpChallenge } from "@/lib/resume/services/resume-auth.service";
import { RESUME_SESSION_COOKIE } from "@/lib/resume/constants";

export const dynamic = "force-dynamic";

const verifyOtpSchema = z.object({
  challengeId: z.string().trim().min(5, "Invalid challenge ID"),
  code: z.string().trim().regex(/^\d{6}$/, "Access code must be exactly 6 digits"),
});

export async function POST(req: NextRequest) {
  const { clientIp } = getRequestContext(req);

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ ok: false, error: "Invalid JSON payload" }, { status: 400 });
    }

    const parsed = verifyOtpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message || "Invalid input data" },
        { status: 400 }
      );
    }

    const { challengeId, code } = parsed.data;

    // Verify OTP challenge
    const result = await verifyResumeOtpChallenge({
      challengeId,
      code,
      clientIp,
    });

    if (!result.verified || !result.sessionToken) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error || "Verification failed.",
          remainingAttempts: result.remainingAttempts,
        },
        { status: 400 }
      );
    }

    // Set signed HttpOnly session cookie (session lifetime: destroyed when browser session ends)
    const isProd = process.env.NODE_ENV === "production";

    const response = NextResponse.json({
      ok: true,
      data: {
        verified: true,
        session: result.session,
        sessionToken: result.sessionToken,
      },
    });

    response.cookies.set({
      name: RESUME_SESSION_COOKIE,
      value: result.sessionToken,
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Resume verify-otp error:", err);
    return NextResponse.json(
      { ok: false, error: "An unexpected verification error occurred." },
      { status: 500 }
    );
  }
}
