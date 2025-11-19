import { NextResponse } from "next/server";
import { getSession, extendSession } from "@/lib/sessionManager";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    // Extend session on activity
    await extendSession();

    return NextResponse.json({
      valid: true,
      userId: session.userId,
      email: session.email,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    console.error("Session validation error:", error);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
