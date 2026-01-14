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
 * Burn Prevention Integration:
 * - Monitors Firebase usage during security checks
 * - Adapts frequency based on system activity
 * - Pauses during deep sleep to prevent waste
 * - Resumes instantly when threats detected
 */

import scheduler from './scheduler';
import { 
  checkAutoUnblock, 
  respondToPatterns, 
  cleanupOldData,
  getThreatIntelligence 
} from './securityMonitor';

// Burn Prevention Integration (server-side compatible)
let burnPreventionCore: any = null;
let lastBurnCheck = 0;
let consecutiveSkips = 0;

// Try to load burn prevention if available (client-side only)
if (typeof window !== 'undefined') {
  try {
    const burnModule = require('./burnPrevention');
    burnPreventionCore = burnModule.burnPreventionCore;
  } catch (e) {
    // Burn prevention not available (normal for server-side)
  }
}

// Security monitoring intervals
const BASE_INTERVAL = 60 * 1000; // 60 seconds (base frequency)
const IDLE_INTERVAL = 120 * 1000; // 2 minutes (when system idle)
const DEEP_SLEEP_INTERVAL = 300 * 1000; // 5 minutes (when deep sleep)
const HIGH_THREAT_INTERVAL = 30 * 1000; // 30 seconds (when threats detected)

/**
 * Check if we should skip this execution based on burn prevention
 */
function shouldSkipForBurnPrevention(): { skip: boolean; reason?: string; nextCheck?: number } {
  // Always run on server-side (no burn prevention there)
  if (typeof window === 'undefined') {
    return { skip: false };
  }

  // If burn prevention not available, always run
  if (!burnPreventionCore) {
    return { skip: false };
  }

  const now = Date.now();
  
  // Check burn prevention metrics every 10 seconds (not every execution)
  if (now - lastBurnCheck < 10000) {
    // Use cached decision
    if (consecutiveSkips > 0) {
      return { skip: true, reason: 'Cached: System inactive', nextCheck: lastBurnCheck + 10000 };
    }
    return { skip: false };
  }

  lastBurnCheck = now;

  try {
    const metrics = burnPreventionCore.getMetrics();
    const context = burnPreventionCore.getActivityContext();

    // NEVER skip if high threat level
    const intelligence = getThreatIntelligence();
    if (intelligence.riskLevel === 'high' || intelligence.riskLevel === 'critical') {
      consecutiveSkips = 0;
      console.log('🔥 Security Monitor: High threat detected - running at increased frequency');
      return { skip: false };
    }

    // NEVER skip if admin is present
    if (context.hasAdminPresence) {
      consecutiveSkips = 0;
      return { skip: false };
    }

    // Skip during deep sleep (no activity for 15+ minutes)
    if (metrics.mode === 'deep_sleep' && intelligence.riskLevel === 'low') {
      consecutiveSkips++;
      if (consecutiveSkips === 1) {
        console.log('💤 Security Monitor: Entering low-frequency mode (deep sleep detected)');
      }
      return { 
        skip: true, 
        reason: 'Deep sleep mode - no activity detected',
        nextCheck: DEEP_SLEEP_INTERVAL
      };
    }

    // Reduce frequency during idle (2-15 minutes of inactivity)
    if (metrics.mode === 'idle' && intelligence.riskLevel === 'low') {
      consecutiveSkips++;
      if (consecutiveSkips === 1) {
        console.log('😴 Security Monitor: Reducing frequency (idle mode)');
      }
      return { 
        skip: true, 
        reason: 'Idle mode - reduced frequency',
        nextCheck: IDLE_INTERVAL
      };
    }

    // Run normally when active
    if (consecutiveSkips > 0) {
      console.log('👁️ Security Monitor: Resuming normal frequency (activity detected)');
    }
    consecutiveSkips = 0;
    return { skip: false };

  } catch (error) {
    // If burn prevention errors, always run (fail safe)
    console.warn('⚠️ Burn prevention check failed, running security monitor:', error);
    consecutiveSkips = 0;
    return { skip: false };
  }
}

/**
 * Security monitoring task with burn prevention awareness
 * Executes the same logic as the previous cron endpoint but adapts to system activity
 */
async function securityMonitoringTask(): Promise<void> {
  const startTime = Date.now();
  
  try {
    // Check if we should skip based on burn prevention
    const burnCheck = shouldSkipForBurnPrevention();
    
    if (burnCheck.skip) {
      console.log(`⏭️ Security Monitor: Skipped (${burnCheck.reason})`);
      if (burnCheck.nextCheck) {
        const nextIn = Math.round((burnCheck.nextCheck - Date.now()) / 1000);
        console.log(`   Next check in ~${nextIn}s`);
      }
      return;
    }

    console.log("🕐 Security Monitor: Starting periodic analysis...");
    
    // Step 1: Check for auto-unblock candidates
    const autoUnblockStart = Date.now();
    checkAutoUnblock();
    const autoUnblockTime = Date.now() - autoUnblockStart;
    
    // Step 2: Detect and respond to attack patterns
    const patternStart = Date.now();
    respondToPatterns();
    const patternTime = Date.now() - patternStart;
    
    // Step 3: Cleanup old data (only if not in burn-saving mode)
    let cleanupTime = 0;
    if (consecutiveSkips === 0 || Date.now() % (5 * 60 * 1000) < 60000) {
      // Run cleanup every 5 minutes or when active
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

    // Register execution with burn prevention (if available)
    if (burnPreventionCore && typeof window !== 'undefined') {
      try {
        burnPreventionCore.recordExecution('security-monitor', totalTime);
      } catch (e) {
        // Ignore burn prevention registration errors
      }
    }

  } catch (error) {
    console.error("❌ Security monitoring task error:", error);
    // Non-fatal: allow scheduler to continue
    consecutiveSkips = 0; // Reset on error to ensure next run
  }
}

/**
 * Initialize security monitoring scheduler with burn prevention
 * Called once at server startup
 */
export function initializeSecurityScheduler(): void {
  // Initialize the scheduler singleton
  scheduler.initialize();
  
  // Determine initial interval based on environment
  let initialInterval = BASE_INTERVAL;
  
  // Register security monitoring task
  scheduler.register(
    'security-monitor',
    initialInterval,
    securityMonitoringTask
  );
  
  // Register with burn prevention if available (client-side only)
  if (burnPreventionCore && typeof window !== 'undefined') {
    try {
      burnPreventionCore.registerExecution({
        id: 'security-monitor',
        type: 'background_task',
        name: 'Security Monitoring',
        frequency: BASE_INTERVAL,
        lastExecution: Date.now(),
        executionCount: 0,
        averageExecutionTime: 50,
        isRunning: false,
        criticality: 'high', // High priority - security matters
        owner: 'system',
        canPause: true, // Can pause during deep sleep
        canThrottle: true, // Can reduce frequency when idle
      });
      
      console.log("🔒 Security monitoring scheduler initialized with burn prevention");
    } catch (e) {
      console.log("🔒 Security monitoring scheduler initialized (burn prevention unavailable)");
    }
  } else {
    console.log("🔒 Security monitoring scheduler initialized");
  }
  
  // Log burn prevention status
  if (typeof window !== 'undefined' && burnPreventionCore) {
    console.log("   ✅ Burn prevention: ENABLED");
    console.log("   📊 Will adapt frequency based on system activity");
    console.log("   💤 Will pause during deep sleep (15min+ inactivity)");
    console.log("   🔥 Will increase frequency during high threats");
  } else {
    console.log("   ℹ️ Burn prevention: Not available (server-side)");
    console.log("   ⏱️ Running at fixed 60s interval");
  }
}

/**
 * Get security scheduler status with burn prevention info
 */
export function getSecuritySchedulerStatus(): {
  isRunning: boolean;
  lastRun: number;
  burnPrevention?: {
    enabled: boolean;
    mode: string;
    consecutiveSkips: number;
    estimatedSavings: string;
  };
} | null {
  const baseStatus = scheduler.getTaskStatus('security-monitor');
  
  if (!baseStatus) {
    return null;
  }

  const status: any = {
    isRunning: baseStatus.isRunning,
    lastRun: baseStatus.lastRun,
  };

  // Add burn prevention info if available
  if (burnPreventionCore && typeof window !== 'undefined') {
    try {
      const metrics = burnPreventionCore.getMetrics();
      status.burnPrevention = {
        enabled: true,
        mode: metrics.mode,
        consecutiveSkips,
        estimatedSavings: `${metrics.estimatedSavings}%`,
      };
    } catch (e) {
      status.burnPrevention = {
        enabled: false,
        mode: 'unknown',
        consecutiveSkips: 0,
        estimatedSavings: '0%',
      };
    }
  }

  return status;
}

/**
 * Force run security monitor (bypasses burn prevention)
 * Use for emergency security checks
 */
export async function forceSecurityCheck(): Promise<void> {
  const previousSkips = consecutiveSkips;
  consecutiveSkips = 0; // Temporarily reset
  
  try {
    await securityMonitoringTask();
  } finally {
    consecutiveSkips = previousSkips;
  }
}
