import { NextResponse } from "next/server";
import { RESUME_SESSION_COOKIE } from "@/lib/resume/constants";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });

  // Expire and clear session cookie immediately
  response.cookies.set({
    name: RESUME_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
