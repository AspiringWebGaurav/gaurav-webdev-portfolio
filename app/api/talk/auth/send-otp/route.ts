import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequestContext } from "@/lib/api/context";
import { createTalkOtpChallenge } from "@/lib/talk/services/talk-auth.service";
import { TALK_ADMIN_EMAIL } from "@/lib/talk/constants";

export const dynamic = "force-dynamic";

const sendOtpSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
});

export async function POST(req: NextRequest) {
  const { clientIp, userAgent } = getRequestContext(req);

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, error: "Invalid JSON payload" }, { status: 400 });
    }

    const parsed = sendOtpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid input data" },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    // Strict validation
    if (email.toLowerCase() !== TALK_ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json(
        {
          success: false,
          error: "Access denied.",
        },
        { status: 403 }
      );
    }

    const result = await createTalkOtpChallenge({
      email,
      clientIp,
      userAgent,
      requestHeaders: req.headers,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to send code." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      challengeId: result.challengeId,
      message: "Code sent.",
    });
  } catch (err) {
    console.error("[TalkSendOtpAPI] Internal error:", err);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred while sending the code." },
      { status: 500 }
    );
  }
}
