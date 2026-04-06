/**
 * TEST UTILITY - Reset Security Stores
 * ⚠️ ONLY USE IN DEVELOPMENT
 */

import { NextResponse } from "next/server";
import { rateLimitStore } from "@/lib/challengeVerification";
import { resetSecurityMonitor, enableTestMode } from "@/lib/securityMonitor";
import { csrfStore } from "@/app/api/auth/dev-login/route";

export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  // Clear in-memory stores (challenges are in Redis with TTL, auto-expire)
  rateLimitStore.clear();
  csrfStore.clear();
  resetSecurityMonitor();
  enableTestMode(); // Enable test mode to prevent blocking localhost

  console.log("🧹 Security stores cleared for testing (challenges auto-expire in Redis)");
  console.log("🧪 Test mode enabled - Localhost won't be blocked");

  return NextResponse.json({
    success: true,
    message: "Security stores cleared (challenges in Redis auto-expire)"
  });
}
