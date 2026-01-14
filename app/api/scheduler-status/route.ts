/**
 * SCHEDULER STATUS ENDPOINT
 * 
 * Provides health check and status information for all scheduled tasks.
 * Useful for monitoring, debugging, and verifying scheduler operation.
 * 
 * GET /api/scheduler-status
 */

import { NextRequest, NextResponse } from "next/server";
import scheduler from "@/lib/scheduler";
import { getSecuritySchedulerStatus } from "@/lib/securityScheduler";
import { getThreatIntelligence } from "@/lib/securityMonitor";

// Optional authentication for production
const STATUS_SECRET = process.env.STATUS_SECRET;

/**
 * Get human-readable description of burn prevention mode
 */
function getBurnPreventionDescription(mode: string): string {
  switch (mode) {
    case 'active':
      return 'System active - running at normal frequency';
    case 'idle':
      return 'System idle - reduced frequency to save resources';
    case 'sleep':
      return 'System sleeping - minimal activity detected';
    case 'deep_sleep':
      return 'Deep sleep - no activity for 15+ minutes, heavily throttled';
    default:
      return 'Unknown mode';
  }
}

export async function GET(request: NextRequest) {
  try {
    // Optional authentication in production
    if (process.env.NODE_ENV === "production" && STATUS_SECRET) {
      const authHeader = request.headers.get("Authorization");
      const providedSecret = authHeader?.replace("Bearer ", "");
      
      if (providedSecret !== STATUS_SECRET) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    // Get all registered tasks
    const registeredTasks = scheduler.getAllTasks();
    
    // Get detailed status for each task
    const taskStatuses: Record<string, any> = {};
    
    for (const taskId of registeredTasks) {
      const status = scheduler.getTaskStatus(taskId);
      if (status) {
        const timeSinceLastRun = status.lastRun > 0 
          ? Date.now() - status.lastRun 
          : null;
        
        taskStatuses[taskId] = {
          isRunning: status.isRunning,
          lastRun: status.lastRun > 0 ? new Date(status.lastRun).toISOString() : "Never",
          timeSinceLastRun: timeSinceLastRun ? `${Math.floor(timeSinceLastRun / 1000)}s ago` : "N/A",
          healthy: timeSinceLastRun === null || timeSinceLastRun < 120000 // Healthy if run in last 2 minutes
        };
      }
    }

    // Get security monitoring intelligence
    const securityStatus = getSecuritySchedulerStatus();
    const threatIntel = getThreatIntelligence();

    // Build response
    const response: any = {
      success: true,
      timestamp: new Date().toISOString(),
      scheduler: {
        isRunning: scheduler.isRunning(),
        registeredTasks: registeredTasks.length,
        tasks: taskStatuses
      },
      security: {
        scheduler: securityStatus,
        intelligence: {
          riskLevel: threatIntel.riskLevel,
          activeThreats: threatIntel.activeThreats,
          blockedIPs: threatIntel.blockedIPs,
          suspiciousIPs: threatIntel.suspiciousIPs
        }
      },
      migration: {
        status: "complete",
        note: "Vercel Cron successfully replaced with internal scheduler",
        previousCronPath: "/api/auth/security-cron",
        previousSchedule: "* * * * * (every minute)",
        currentImplementation: "Internal scheduler with adaptive frequency"
      }
    };

    // Add burn prevention info if available
    if (securityStatus?.burnPrevention) {
      response.burnPrevention = {
        enabled: securityStatus.burnPrevention.enabled,
        mode: securityStatus.burnPrevention.mode,
        description: getBurnPreventionDescription(securityStatus.burnPrevention.mode),
        consecutiveSkips: securityStatus.burnPrevention.consecutiveSkips,
        estimatedSavings: securityStatus.burnPrevention.estimatedSavings,
        adaptiveFrequency: {
          active: "60s",
          idle: "120s",
          deepSleep: "300s",
          highThreat: "30s"
        }
      };
    }

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error("❌ Scheduler status error:", error);
    return NextResponse.json(
      { 
        error: "Failed to retrieve scheduler status",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
