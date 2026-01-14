/**
 * SECURITY MONITOR CRON ENDPOINT (DEPRECATED)
 * 
 * This endpoint is maintained for backward compatibility and manual testing only.
 * 
 * MIGRATION NOTE:
 * Security monitoring is now handled by the internal server-side scheduler.
 * This eliminates dependency on external cron services (Vercel Cron).
 * 
 * The scheduled task runs automatically every 60 seconds within the server process.
 * See: /lib/securityScheduler.ts for implementation.
 * 
 * Legacy behavior: Previously triggered by Vercel Cron at "* * * * *" schedule.
 * New behavior: Internal scheduler executes identical logic on the same interval.
 * 
 * This endpoint remains functional for:
 * - Manual testing during development
 * - Debugging security monitoring logic
 * - Emergency manual execution if needed
 */

import { NextRequest, NextResponse } from "next/server";
import { 
  cleanupOldData, 
  respondToPatterns, 
  getThreatIntelligence,
  checkAutoUnblock 
} from "@/lib/securityMonitor";
import { getSecuritySchedulerStatus } from "@/lib/securityScheduler";

const CRON_SECRET = process.env.CRON_SECRET || "cron_dev_key_2024";

export async function GET(request: NextRequest) {
  try {
    // Authentication: Require secret key for manual execution
    const authHeader = request.headers.get("Authorization");
    const providedSecret = authHeader?.replace("Bearer ", "");
    
    if (providedSecret !== CRON_SECRET) {
      return NextResponse.json(
        { 
          error: "Unauthorized access",
          code: "UNAUTHORIZED",
          note: "This endpoint is deprecated. Security monitoring runs automatically via internal scheduler."
        },
        { status: 401 }
      );
    }

    // Get scheduler status
    const schedulerStatus = getSecuritySchedulerStatus();
    
    // If scheduler is running, return status instead of executing
    if (schedulerStatus && schedulerStatus.lastRun > 0) {
      const timeSinceLastRun = Date.now() - schedulerStatus.lastRun;
      
      return NextResponse.json({
        success: true,
        mode: "scheduler",
        message: "Security monitoring is handled by internal scheduler",
        scheduler: {
          isRunning: schedulerStatus.isRunning,
          lastRun: schedulerStatus.lastRun,
          timeSinceLastRun: `${Math.floor(timeSinceLastRun / 1000)}s ago`,
          nextRun: `~${Math.max(0, 60 - Math.floor(timeSinceLastRun / 1000))}s`
        },
        note: "This endpoint is deprecated. Use internal scheduler status instead."
      }, { status: 200 });
    }

    // Fallback: Execute manually if scheduler hasn't run yet (startup edge case)
    console.log("🕐 Security Monitor Manual: Starting analysis...");
    
    // Step 1: Check for auto-unblock candidates
    checkAutoUnblock();
    
    // Step 2: Detect and respond to attack patterns
    respondToPatterns();
    
    // Step 3: Cleanup old data
    cleanupOldData();
    
    // Step 4: Get current threat intelligence
    const intelligence = getThreatIntelligence();
    
    console.log(`✅ Security Monitor Manual: Complete`);
    console.log(`   Risk Level: ${intelligence.riskLevel.toUpperCase()}`);
    console.log(`   Active Threats: ${intelligence.activeThreats}`);
    console.log(`   Blocked IPs: ${intelligence.blockedIPs}`);
    console.log(`   Suspicious IPs: ${intelligence.suspiciousIPs}`);

    return NextResponse.json({
      success: true,
      mode: "manual",
      intelligence,
      executedAt: Date.now(),
      message: "Manual security monitoring cycle completed",
      warning: "This endpoint is deprecated. Security monitoring now runs automatically."
    }, { status: 200 });

  } catch (error) {
    console.error("❌ Security monitoring error:", error);
    return NextResponse.json(
      { 
        error: "Failed to execute security monitoring",
        code: "ERROR"
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
      { 
        error: "Manual trigger only available in development",
        note: "Use internal scheduler in production"
      },
      { status: 403 }
    );
  }
  
  // Same logic as GET
  return GET(request);
}
