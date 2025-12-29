import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/sessionManager";
import { serverDecryptDevAuth, validateDevAuthChallenge } from "@/lib/devAuthCrypto";
import { adminAuth } from "@/lib/firebaseAdmin";

const ALLOWED_EMAIL = "gauravpatil9262@gmail.com";
const ALLOWED_UID = "cgwqNNfMfPNmsAHJfgWGcRSsIRG2";
const DEV_PASSWORD = process.env.DEV_LOGIN_PASSWORD;

/**
 * Development one-click login endpoint
 * HIGH PRIORITY: Encrypted authentication for fast dev access
 * Only works if DEV_LOGIN_PASSWORD is set in environment
 */
export async function POST(request: NextRequest) {
  try {
    // Check if dev login is enabled
    if (!DEV_PASSWORD) {
      console.error("DEV_LOGIN_PASSWORD environment variable is not set!");
      return NextResponse.json(
        { error: "Development login not available" },
        { status: 503 }
      );
    }

    console.log("DEV_LOGIN_PASSWORD is set:", !!DEV_PASSWORD);

    // Only allow in development/local environments
    const host = request.headers.get("host") || "";
    const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
    
    if (!isLocal && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Development login only available locally" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { encryptedPayload } = body;

    if (!encryptedPayload) {
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }

    // Decrypt the payload
    let decryptedData: string;
    try {
      decryptedData = await serverDecryptDevAuth(encryptedPayload);
      console.log("✅ Decryption successful");
      console.log("Decrypted data format check:", decryptedData.includes(':'));
    } catch (error) {
      console.error("❌ Decryption error:", error);
      return NextResponse.json(
        { error: "Invalid encrypted payload" },
        { status: 400 }
      );
    }

    // Parse decrypted data: "password:timestamp:random"
    // Split only on first colon to get password, then rest is challenge
    const colonIndex = decryptedData.indexOf(":");
    if (colonIndex === -1) {
      console.error("❌ Invalid payload format - no colon found");
      return NextResponse.json(
        { error: "Invalid payload format" },
        { status: 400 }
      );
    }

    const password = decryptedData.substring(0, colonIndex);
    const challenge = decryptedData.substring(colonIndex + 1);

    // Debug logging
    console.log("📊 Password Validation Debug:");
    console.log("  Received password:", `"${password}"`);
    console.log("  Expected password:", `"${DEV_PASSWORD}"`);
    console.log("  Received length:", password.length);
    console.log("  Expected length:", DEV_PASSWORD?.length);
    console.log("  Match:", password === DEV_PASSWORD);
    console.log("  Challenge:", challenge.substring(0, 20) + "...");

    // Validate password
    if (password !== DEV_PASSWORD) {
      console.error("❌ Password mismatch!");
      // Add small delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 1000));
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    console.log("✅ Password validated successfully");

    // Validate challenge (timestamp check)
    if (!challenge || !validateDevAuthChallenge(challenge)) {
      return NextResponse.json(
        { error: "Challenge expired or invalid" },
        { status: 401 }
      );
    }

    console.log("✅ Challenge validated successfully");

    // Get user agent and IP for security
    const userAgent = request.headers.get("user-agent") || undefined;
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      undefined;

    // Check if Firebase user exists, if not create it (this ensures email is set)
    try {
      await adminAuth.getUser(ALLOWED_UID);
      console.log("✅ Firebase user exists");
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        console.log("Creating Firebase user...");
        await adminAuth.createUser({
          uid: ALLOWED_UID,
          email: ALLOWED_EMAIL,
          emailVerified: true,
        });
        console.log("✅ Firebase user created");
      }
    }

    // Create Firebase custom token for client authentication
    const customToken = await adminAuth.createCustomToken(ALLOWED_UID, {
      email: ALLOWED_EMAIL,
      devLogin: true,
    });

    console.log("✅ Custom token created");

    // Create server-side session
    const sessionId = await createSession(
      ALLOWED_UID,
      ALLOWED_EMAIL,
      { userAgent, ipAddress }
    );

    // Return encrypted response with custom token
    const response = {
      success: true,
      sessionId,
      customToken,
      user: {
        uid: ALLOWED_UID,
        email: ALLOWED_EMAIL,
      },
    };

    console.log("✅ Dev login successful");

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "X-Dev-Login": "true",
      },
    });
  } catch (error) {
    console.error("Dev login error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
