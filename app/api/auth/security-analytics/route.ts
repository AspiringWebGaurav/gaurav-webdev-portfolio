/**
 * SECURITY ANALYTICS ENDPOINT
 * Provides real-time threat intelligence and security metrics
 * 
 * GET /api/auth/security-analytics
 * Returns comprehensive security data for monitoring dashboard
 */

import { NextRequest, NextResponse } from "next/server";
import { getSecurityAnalytics, getThreatProfile } from "@/lib/securityMonitor";

const ANALYTICS_SECRET = process.env.ANALYTICS_SECRET || "analytics_dev_key_2024";

export async function GET(request: NextRequest) {
  try {
    // Authentication: Require secret key for analytics access
    const authHeader = request.headers.get("Authorization");
    const providedSecret = authHeader?.replace("Bearer ", "");
    
    if (providedSecret !== ANALYTICS_SECRET) {
      return NextResponse.json(
        { 
          error: "Unauthorized access to analytics",
          code: "UNAUTHORIZED" 
        },
        { status: 401 }
      );
    }

    // Get comprehensive security analytics
    const analytics = getSecurityAnalytics();
    
    // Get requesting IP's threat profile (if any)
    const ip = request.headers.get("x-forwarded-for") || 
               request.headers.get("x-real-ip") || 
               "127.0.0.1";
    
    const requestorProfile = getThreatProfile(ip);

    return NextResponse.json({
      success: true,
      analytics,
      requestor: {
        ip,
        profile: requestorProfile || { status: "clean", suspicionScore: 0 }
      },
      timestamp: Date.now()
    }, { status: 200 });

  } catch (error) {
    console.error("❌ Security analytics error:", error);
    return NextResponse.json(
      { 
        error: "Failed to retrieve analytics",
        code: "ANALYTICS_ERROR"
      },
      { status: 500 }
    );
  }
}

// OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type"
    }
  });
}
