/**
 * SECURITY MONITOR CRON JOB
 * Runs periodic security analysis and automated responses
 * 
 * GET /api/auth/security-cron
 * Should be triggered by Vercel Cron or external scheduler every minute
 */

import { NextRequest, NextResponse } from "next/server";
import { 
  cleanupOldData, 
  respondToPatterns, 
  getThreatIntelligence,
  checkAutoUnblock 
} from "@/lib/securityMonitor";

const CRON_SECRET = process.env.CRON_SECRET || "cron_dev_key_2024";

export async function GET(request: NextRequest) {
  try {
    // Authentication: Require secret key for cron access
    const authHeader = request.headers.get("Authorization");
    const providedSecret = authHeader?.replace("Bearer ", "");
    
    if (providedSecret !== CRON_SECRET) {
      return NextResponse.json(
        { 
          error: "Unauthorized access to cron",
          code: "UNAUTHORIZED" 
        },
        { status: 401 }
      );
    }

    console.log("🕐 Security Monitor Cron: Starting periodic analysis...");
    
    // Step 1: Check for auto-unblock candidates
    checkAutoUnblock();
    
    // Step 2: Detect and respond to attack patterns
    respondToPatterns();
    
    // Step 3: Cleanup old data
    cleanupOldData();
    
    // Step 4: Get current threat intelligence
    const intelligence = getThreatIntelligence();
    
    console.log(`✅ Security Monitor Cron: Complete`);
    console.log(`   Risk Level: ${intelligence.riskLevel.toUpperCase()}`);
    console.log(`   Active Threats: ${intelligence.activeThreats}`);
    console.log(`   Blocked IPs: ${intelligence.blockedIPs}`);
    console.log(`   Suspicious IPs: ${intelligence.suspiciousIPs}`);

    return NextResponse.json({
      success: true,
      intelligence,
      executedAt: Date.now(),
      message: "Security monitoring cycle completed"
    }, { status: 200 });

  } catch (error) {
    console.error("❌ Security cron error:", error);
    return NextResponse.json(
      { 
        error: "Failed to execute security monitoring",
        code: "CRON_ERROR"
      },
      { status: 500 }
    );
  }
}

// POST for manual triggering (dev only)
export async function POST(request: NextRequest) {
  const isDevelopment = process.env.NODE_ENV === "development";
  
  if (!isDevelopment) {
    return NextResponse.json(
      { error: "Manual trigger only available in development" },
      { status: 403 }
    );
  }
  
  // Same logic as GET
  return GET(request);
}
