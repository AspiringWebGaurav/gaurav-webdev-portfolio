import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyTalkOtp } from "@/lib/talk/services/talk-auth.service";
import {
  TALK_COOKIE_NAME,
  TALK_SESSION_MAX_AGE_SECONDS,
} from "@/lib/talk/constants";

export const dynamic = "force-dynamic";

const verifyOtpSchema = z.object({
  challengeId: z.string().trim().min(5, "Invalid challenge ID"),
  otp: z.string().trim().regex(/^\d{6}$/, "Verification code must be exactly 6 digits"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, error: "Invalid JSON payload" }, { status: 400 });
    }

    const parsed = verifyOtpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid input data" },
        { status: 400 }
      );
    }

    const { challengeId, otp } = parsed.data;

    const result = await verifyTalkOtp({
      challengeId,
      otp,
    });

    if (!result.success || !result.sessionToken) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Verification failed.",
          remainingAttempts: result.remainingAttempts,
        },
        { status: 400 }
      );
    }

    // Set signed HttpOnly session cookie
    const isProd = process.env.NODE_ENV === "production";
    const response = NextResponse.json({
      success: true,
      redirect: "/talk",
    });

    response.cookies.set({
      name: TALK_COOKIE_NAME,
      value: result.sessionToken,
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: TALK_SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (err) {
    console.error("[TalkVerifyOtpAPI] Internal error:", err);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred during verification." },
      { status: 500 }
    );
  }
}
