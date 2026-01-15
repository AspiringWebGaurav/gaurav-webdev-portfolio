/**
 * SECURITY MONITORING SCHEDULER
 * 
 * Initializes and registers all security monitoring tasks.
 * This module replaces the external Vercel Cron mechanism with
 * in-process scheduled execution.
 * 
 * Migration Note:
 * Previously executed via Vercel Cron at /api/auth/security-cron
 * Now runs internally on the same schedule (every 60 seconds)
 * 
 * TURBOPACK-SAFE: No burn prevention integration to avoid circular dependencies
 */

import scheduler from './scheduler';
import { 
  checkAutoUnblock, 
  respondToPatterns, 
  cleanupOldData,
  getThreatIntelligence 
} from './securityMonitor';

// Security monitoring interval
const BASE_INTERVAL = 60 * 1000; // 60 seconds

/**
 * Security monitoring task
 * Executes the same logic as the previous cron endpoint
 */
async function securityMonitoringTask(): Promise<void> {
  const startTime = Date.now();
  
  try {
    console.log("🕐 Security Monitor: Starting periodic analysis...");
    
    // Step 1: Check for auto-unblock candidates
    const autoUnblockStart = Date.now();
    checkAutoUnblock();
    const autoUnblockTime = Date.now() - autoUnblockStart;
    
    // Step 2: Detect and respond to attack patterns
    const patternStart = Date.now();
    respondToPatterns();
    const patternTime = Date.now() - patternStart;
    
    // Step 3: Cleanup old data periodically
    let cleanupTime = 0;
    if (Date.now() % (5 * 60 * 1000) < 60000) {
      // Run cleanup every 5 minutes
      const cleanupStart = Date.now();
      cleanupOldData();
      cleanupTime = Date.now() - cleanupStart;
    }
    
    // Step 4: Get current threat intelligence
    const intelligence = getThreatIntelligence();
    
    const totalTime = Date.now() - startTime;
    
    console.log(`✅ Security Monitor: Complete (${totalTime}ms)`);
    console.log(`   Risk Level: ${intelligence.riskLevel.toUpperCase()}`);
    console.log(`   Active Threats: ${intelligence.activeThreats}`);
    console.log(`   Blocked IPs: ${intelligence.blockedIPs}`);
    console.log(`   Suspicious IPs: ${intelligence.suspiciousIPs}`);
    
    // Log performance breakdown if slow
    if (totalTime > 100) {
      console.log(`   ⏱️ Performance: AutoUnblock=${autoUnblockTime}ms, Patterns=${patternTime}ms, Cleanup=${cleanupTime}ms`);
    }

    // Warn about excessive Firebase usage
    if (totalTime > 200) {
      console.warn(`⚠️ Security Monitor: Slow execution (${totalTime}ms) - may impact Firebase quota`);
    }

  } catch (error) {
    console.error("❌ Security monitoring task error:", error);
  }
}

/**
 * Initialize security monitoring scheduler
 * Called once at server startup
 */
export function initializeSecurityScheduler(): void {
  // Initialize the scheduler singleton
  scheduler.initialize();
  
  // Register security monitoring task
  scheduler.register(
    'security-monitor',
    BASE_INTERVAL,
    securityMonitoringTask
  );
  
  console.log("🔒 Security monitoring scheduler initialized");
  console.log("   ℹ️ Burn prevention: Not available (server-side)");
  console.log("   ⏱️ Running at fixed 60s interval");
}

/**
 * Get security scheduler status
 */
export function getSecuritySchedulerStatus(): {
  isRunning: boolean;
  lastRun: number;
} | null {
  const baseStatus = scheduler.getTaskStatus('security-monitor');
  
  if (!baseStatus) {
    return null;
  }

  return {
    isRunning: baseStatus.isRunning,
    lastRun: baseStatus.lastRun,
  };
}

/**
 * Force run security monitor
 * Use for emergency security checks
 */
export async function forceSecurityCheck(): Promise<void> {
  await securityMonitoringTask();
}
