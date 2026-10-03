import { NextRequest, NextResponse } from "next/server";
import { verifyResumeSessionToken } from "@/lib/resume/services/resume-auth.service";
import { RESUME_SESSION_COOKIE } from "@/lib/resume/constants";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const tabToken =
      req.headers.get("x-resume-tab-token") ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    const cookieToken = req.cookies.get(RESUME_SESSION_COOKIE)?.value;
    const token = tabToken || cookieToken;
    const session = verifyResumeSessionToken(token);

    if (!session) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({
      authenticated: true,
      session: {
        name: session.name,
        email: session.email,
        company: session.company,
        verifiedAt: session.verifiedAt,
        expiresAt: session.expiresAt,
        remainingSeconds: Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000)),
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
