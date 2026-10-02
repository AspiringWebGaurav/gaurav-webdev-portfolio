import { NextRequest, NextResponse } from "next/server";
import { TALK_COOKIE_NAME } from "@/lib/talk/constants";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const isDedicatedTalk =
    host.startsWith("talk.") || req.headers.get("x-is-talk-portal") === "true";
  const redirectUrl = isDedicatedTalk ? "/login" : "/talk/login";

  const response = NextResponse.json({
    success: true,
    redirect: redirectUrl,
  });

  response.cookies.delete(TALK_COOKIE_NAME);
  return response;
}
