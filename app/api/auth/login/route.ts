import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/sessionManager";
import { adminAuth } from "@/lib/firebaseAdmin";

const ALLOWED_EMAIL = "gauravpatil9262@gmail.com";
const ALLOWED_UID = "cgwqNNfMfPNmsAHJfgWGcRSsIRG2";

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: "ID token is required" },
        { status: 400 }
      );
    }

    // Verify Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // Validate user
    if (
      decodedToken.email?.toLowerCase() !== ALLOWED_EMAIL ||
      decodedToken.uid !== ALLOWED_UID
    ) {
      return NextResponse.json({ error: "Unauthorized user" }, { status: 403 });
    }

    // Get user agent and IP for security
    const userAgent = request.headers.get("user-agent") || undefined;
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      undefined;

    // Create server-side session
    const sessionId = await createSession(
      decodedToken.uid,
      decodedToken.email!,
      { userAgent, ipAddress }
    );

    return NextResponse.json({
      success: true,
      sessionId,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 }
    );
  }
}
