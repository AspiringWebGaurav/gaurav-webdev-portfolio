import { NextRequest, NextResponse } from "next/server";
import { TALK_COOKIE_NAME } from "@/lib/talk/constants";
import { verifyTalkSession } from "@/lib/talk/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(TALK_COOKIE_NAME)?.value;
  const session = await verifyTalkSession(token);

  if (!session) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      email: session.email,
      name: session.name,
      role: session.role,
      expiresAt: session.expiresAt,
    },
  });
}
