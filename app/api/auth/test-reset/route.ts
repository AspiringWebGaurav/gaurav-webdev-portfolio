/**
 * TEST UTILITY - Reset Security Stores
 * ⚠️ ONLY USE IN DEVELOPMENT
 */

import { NextResponse } from "next/server";
import { challengeStore, rateLimitStore } from "@/lib/challengeVerification";
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

  // Clear all stores
  challengeStore.clear();
  rateLimitStore.clear();
  csrfStore.clear();
  resetSecurityMonitor();
  enableTestMode(); // Enable test mode to prevent blocking localhost

  console.log("🧹 All security stores cleared for testing (including CSRF, threat profiles)");
  console.log("🧪 Test mode enabled - Localhost won't be blocked");

  return NextResponse.json({
    success: true,
    message: "All security stores cleared"
  });
}
