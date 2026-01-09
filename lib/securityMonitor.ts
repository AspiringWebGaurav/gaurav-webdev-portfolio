/**
 * INTELLIGENT SECURITY MONITOR
 * Self-aware abuse detection and automated threat response
 * Similar to Cloudflare/AWS Shield protection
 */

export interface ThreatProfile {
  ip: string;
  suspicionScore: number;
  violations: string[];
  firstSeen: number;
  lastSeen: number;
  requestCount: number;
  failedAttempts: number;
  status: 'trusted' | 'suspicious' | 'blocked';
}

export interface SecurityEvent {
  type: 'failed_auth' | 'rate_limit' | 'csrf_violation' | 'replay_attack' | 'fingerprint_mismatch' | 'brute_force';
  ip: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: any;
}

// Threat intelligence store
const threatProfiles = new Map<string, ThreatProfile>();
const securityEvents = new Map<string, SecurityEvent[]>();
const autoBlockList = new Set<string>();

// Whitelist for development/testing (never block these IPs)
const WHITELIST_IPS = new Set([
  '127.0.0.1',
  '::1',
  'localhost'
]);

// Toggle for testing mode
let testMode = process.env.NODE_ENV === 'development'; // Auto-enable in development

/**
 * Enable test mode (disables blocking for whitelisted IPs)
 */
export function enableTestMode(): void {
  testMode = true;
  console.log("🧪 Test mode ENABLED - Whitelisted IPs (127.0.0.1, ::1, localhost) won't be blocked");
  console.log(`🧪 Current whitelist: ${Array.from(WHITELIST_IPS).join(', ')}`);
}

/**
 * Disable test mode
 */
export function disableTestMode(): void {
  testMode = false;
  console.log("🔒 Test mode disabled - Full blocking enabled");
}

/**
 * Reset all security monitoring data (for testing only)
 */
export function resetSecurityMonitor(): void {
  const beforeSize = {
    profiles: threatProfiles.size,
    events: securityEvents.size,
    blocked: autoBlockList.size
  };
  
  threatProfiles.clear();
  securityEvents.clear();
  autoBlockList.clear();
  
  console.log(`🧹 Security monitor reset: Cleared ${beforeSize.profiles} profiles, ${beforeSize.events} event logs, ${beforeSize.blocked} blocked IPs`);
}

// Thresholds for intelligent decisions
const THRESHOLDS = {
  SUSPICION_SCORE_WARNING: 50,
  SUSPICION_SCORE_BLOCK: 100,
  FAILED_AUTH_LIMIT: 5,
  CSRF_VIOLATIONS_LIMIT: 3,
  REPLAY_ATTEMPTS_LIMIT: 2,
  TIME_WINDOW: 300000, // 5 minutes
  AUTO_UNBLOCK_AFTER: 3600000, // 1 hour
  BRUTE_FORCE_THRESHOLD: 10 // 10 attempts in time window
};

/**
 * Track security event and update threat profile
 */
export function trackSecurityEvent(event: SecurityEvent): void {
  const { ip, type, severity, timestamp } = event;
  
  // Store event
  const events = securityEvents.get(ip) || [];
  events.push(event);
  securityEvents.set(ip, events);
  
  // Update or create threat profile
  let profile = threatProfiles.get(ip);
  if (!profile) {
    profile = {
      ip,
      suspicionScore: 0,
      violations: [],
      firstSeen: timestamp,
      lastSeen: timestamp,
      requestCount: 0,
      failedAttempts: 0,
      status: 'trusted'
    };
    threatProfiles.set(ip, profile);
  }
  
  // Update profile
  profile.lastSeen = timestamp;
  profile.requestCount++;
  
  // Calculate suspicion score based on event type and severity
  const scoreIncrease = calculateScoreIncrease(type, severity);
  profile.suspicionScore += scoreIncrease;
  
  // Track specific violations
  if (type === 'failed_auth') {
    profile.failedAttempts++;
  }
  
  if (!profile.violations.includes(type)) {
    profile.violations.push(type);
  }
  
  // Intelligent decision making
  makeSecurityDecision(profile);
  
  // Log critical events
  if (severity === 'critical' || profile.status === 'blocked') {
    console.error(`🚨 SECURITY ALERT: ${type} from ${ip} - Status: ${profile.status}`);
  }
}

/**
 * Calculate score increase based on event severity
 */
function calculateScoreIncrease(type: SecurityEvent['type'], severity: SecurityEvent['severity']): number {
  const baseScores = {
    'failed_auth': 10,
    'rate_limit': 5,
    'csrf_violation': 20,
    'replay_attack': 30,
    'fingerprint_mismatch': 15,
    'brute_force': 50
  };
  
  const severityMultiplier = {
    'low': 0.5,
    'medium': 1,
    'high': 2,
    'critical': 4
  };
  
  return (baseScores[type] || 10) * (severityMultiplier[severity] || 1);
}

/**
 * Make intelligent security decision
 */
function makeSecurityDecision(profile: ThreatProfile): void {
  const recentEvents = getRecentEvents(profile.ip, THRESHOLDS.TIME_WINDOW);
  
  // Check for brute force attack pattern
  const authFailures = recentEvents.filter(e => e.type === 'failed_auth').length;
  if (authFailures >= THRESHOLDS.BRUTE_FORCE_THRESHOLD) {
    profile.suspicionScore = Math.max(profile.suspicionScore, THRESHOLDS.SUSPICION_SCORE_BLOCK);
    console.warn(`⚠️ BRUTE FORCE DETECTED: ${profile.ip} - ${authFailures} failed attempts`);
  }
  
  // Check for replay attack pattern
  const replayAttempts = recentEvents.filter(e => e.type === 'replay_attack').length;
  if (replayAttempts >= THRESHOLDS.REPLAY_ATTEMPTS_LIMIT) {
    profile.suspicionScore += 50;
    console.warn(`⚠️ REPLAY ATTACK PATTERN: ${profile.ip}`);
  }
  
  // Check for CSRF violations
  const csrfViolations = recentEvents.filter(e => e.type === 'csrf_violation').length;
  if (csrfViolations >= THRESHOLDS.CSRF_VIOLATIONS_LIMIT) {
    profile.suspicionScore += 40;
    console.warn(`⚠️ CSRF VIOLATION PATTERN: ${profile.ip}`);
  }
  
  // Update status based on suspicion score
  if (profile.suspicionScore >= THRESHOLDS.SUSPICION_SCORE_BLOCK) {
    // In test mode, never block whitelisted IPs
    if (testMode && WHITELIST_IPS.has(profile.ip)) {
      console.log(`🧪 TEST MODE: Would block ${profile.ip} (Score: ${profile.suspicionScore}) but whitelisted`);
      profile.status = 'suspicious'; // Keep as suspicious instead of blocked
    } else {
      profile.status = 'blocked';
      autoBlockList.add(profile.ip);
      console.error(`🚫 AUTO-BLOCKED: ${profile.ip} (Score: ${profile.suspicionScore})`);
    }
  } else if (profile.suspicionScore >= THRESHOLDS.SUSPICION_SCORE_WARNING) {
    profile.status = 'suspicious';
    console.warn(`⚠️ SUSPICIOUS: ${profile.ip} (Score: ${profile.suspicionScore})`);
  }
  
  // Auto-decay suspicion score over time (forgiveness mechanism)
  const timeSinceLastEvent = Date.now() - profile.lastSeen;
  if (timeSinceLastEvent > THRESHOLDS.AUTO_UNBLOCK_AFTER && profile.status === 'blocked') {
    profile.suspicionScore = Math.max(0, profile.suspicionScore - 50);
    if (profile.suspicionScore < THRESHOLDS.SUSPICION_SCORE_BLOCK) {
      profile.status = 'suspicious';
      autoBlockList.delete(profile.ip);
      console.log(`✅ AUTO-UNBLOCKED: ${profile.ip} (Score decayed to ${profile.suspicionScore})`);
    }
  }
}

/**
 * Get recent events within time window
 */
function getRecentEvents(ip: string, windowMs: number): SecurityEvent[] {
  const events = securityEvents.get(ip) || [];
  const cutoff = Date.now() - windowMs;
  return events.filter(e => e.timestamp > cutoff);
}

/**
 * Check if IP is blocked
 */
export function isBlocked(ip: string): boolean {  
  // In test mode, never block whitelisted IPs
  if (testMode) {
    if (WHITELIST_IPS.has(ip)) {
      console.log(`🧪 TEST MODE: Bypassing block for whitelisted IP: ${ip}`);
      return false;
    }
    console.log(`⚠️ TEST MODE active but IP ${ip} not whitelisted`);
  }
  
  if (autoBlockList.has(ip)) {
    console.log(`🚫 IP in autoBlockList: ${ip}`);
    return true;
  }
  
  const profile = threatProfiles.get(ip);
  const blocked = profile?.status === 'blocked' || false;
  if (blocked) {
    console.log(`🚫 IP profile shows blocked: ${ip}`);
  }
  return blocked;
}

/**
 * Check if IP is suspicious
 */
export function isSuspicious(ip: string): boolean {
  const profile = threatProfiles.get(ip);
  return profile?.status === 'suspicious' || false;
}

/**
 * Get threat profile
 */
export function getThreatProfile(ip: string): ThreatProfile | null {
  return threatProfiles.get(ip) || null;
}

/**
 * Get or create threat profile
 */
function getOrCreateProfile(ip: string): ThreatProfile {
  let profile = threatProfiles.get(ip);
  if (!profile) {
    profile = {
      ip,
      suspicionScore: 0,
      violations: [],
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      requestCount: 0,
      failedAttempts: 0,
      status: 'trusted'
    };
    threatProfiles.set(ip, profile);
  }
  return profile;
}

/**
 * Get security analytics
 */
export function getSecurityAnalytics(): {
  totalThreats: number;
  blockedIPs: string[];
  suspiciousIPs: string[];
  trustedIPs: string[];
  recentEvents: SecurityEvent[];
  threatsByType: { [key: string]: number };
} {
  const now = Date.now();
  const recentCutoff = now - THRESHOLDS.TIME_WINDOW;
  
  let allRecentEvents: SecurityEvent[] = [];
  for (const events of securityEvents.values()) {
    allRecentEvents.push(...events.filter(e => e.timestamp > recentCutoff));
  }
  
  // Count threats by type
  const threatsByType: { [key: string]: number } = {};
  for (const event of allRecentEvents) {
    threatsByType[event.type] = (threatsByType[event.type] || 0) + 1;
  }
  
  return {
    totalThreats: threatProfiles.size,
    blockedIPs: Array.from(threatProfiles.values()).filter(p => p.status === 'blocked').map(p => p.ip),
    suspiciousIPs: Array.from(threatProfiles.values()).filter(p => p.status === 'suspicious').map(p => p.ip),
    trustedIPs: Array.from(threatProfiles.values()).filter(p => p.status === 'trusted').map(p => p.ip),
    recentEvents: allRecentEvents.slice(0, 100), // Last 100 events
    threatsByType
  };
}

/**
 * Manual block/unblock
 */
export function blockIP(ip: string, reason: string): void {
  const profile = threatProfiles.get(ip) || {
    ip,
    suspicionScore: THRESHOLDS.SUSPICION_SCORE_BLOCK,
    violations: [reason],
    firstSeen: Date.now(),
    lastSeen: Date.now(),
    requestCount: 0,
    failedAttempts: 0,
    status: 'blocked' as const
  };
  
  profile.status = 'blocked';
  profile.suspicionScore = THRESHOLDS.SUSPICION_SCORE_BLOCK;
  threatProfiles.set(ip, profile);
  autoBlockList.add(ip);
  
  console.error(`🚫 MANUALLY BLOCKED: ${ip} - Reason: ${reason}`);
}

export function unblockIP(ip: string): void {
  const profile = threatProfiles.get(ip);
  if (profile) {
    profile.status = 'trusted';
    profile.suspicionScore = 0;
    profile.violations = [];
    autoBlockList.delete(ip);
    console.log(`✅ MANUALLY UNBLOCKED: ${ip}`);
  }
}

/**
 * Check and auto-unblock IPs that have been inactive
 */
export function checkAutoUnblock(): void {
  const now = Date.now();
  let unblockedCount = 0;
  
  for (const [ip, profile] of threatProfiles.entries()) {
    if (profile.status === 'blocked') {
      const timeSinceLastSeen = now - profile.lastSeen;
      
      // Auto-unblock after 1 hour of no activity
      if (timeSinceLastSeen > THRESHOLDS.AUTO_UNBLOCK_AFTER) {
        profile.status = 'suspicious';
        profile.suspicionScore = Math.max(0, profile.suspicionScore - 50);
        autoBlockList.delete(ip);
        unblockedCount++;
        console.log(`✅ AUTO-UNBLOCKED: ${ip} (inactive for ${Math.floor(timeSinceLastSeen / 60000)} minutes)`);
      }
    }
  }
  
  if (unblockedCount > 0) {
    console.log(`🔓 Auto-unblocked ${unblockedCount} IPs due to inactivity`);
  }
}

/**
 * Cleanup old data (run periodically)
 */
export function cleanupOldData(): void {
  const now = Date.now();
  const cleanupCutoff = now - (24 * 60 * 60 * 1000); // 24 hours
  
  // Clean old profiles for trusted IPs
  for (const [ip, profile] of threatProfiles.entries()) {
    if (profile.status === 'trusted' && profile.lastSeen < cleanupCutoff) {
      threatProfiles.delete(ip);
      securityEvents.delete(ip);
    }
  }
  
  console.log(`🧹 Cleaned up old security data`);
}
/**
 * ADVANCED PATTERN ANALYSIS
 * Detect coordinated attacks and anomalous behaviors
 */

interface AttackPattern {
  type: 'distributed_brute_force' | 'time_based_pattern' | 'coordinated_attack' | 'anomalous_behavior';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-100
  ips: string[];
  description: string;
  detectedAt: number;
}

/**
 * Analyze all security events for advanced attack patterns
 */
export function detectAdvancedPatterns(): AttackPattern[] {
  const patterns: AttackPattern[] = [];
  const now = Date.now();
  const analysisWindow = 5 * 60 * 1000; // 5 minutes
  
  // Collect recent events across all IPs
  const recentEvents: SecurityEvent[] = [];
  for (const events of securityEvents.values()) {
    recentEvents.push(...events.filter(e => now - e.timestamp < analysisWindow));
  }
  
  // Pattern 1: Distributed Brute Force (multiple IPs, similar timing)
  const failedAuthsByMinute = new Map<number, Set<string>>();
  for (const event of recentEvents) {
    if (event.type === 'failed_auth') {
      const minute = Math.floor(event.timestamp / 60000);
      if (!failedAuthsByMinute.has(minute)) {
        failedAuthsByMinute.set(minute, new Set());
      }
      failedAuthsByMinute.get(minute)!.add(event.ip);
    }
  }
  
  for (const [minute, ips] of failedAuthsByMinute.entries()) {
    if (ips.size >= 3) {
      patterns.push({
        type: 'distributed_brute_force',
        severity: 'critical',
        confidence: Math.min(100, ips.size * 20),
        ips: Array.from(ips),
        description: `${ips.size} IPs attempting authentication within same minute`,
        detectedAt: minute * 60000
      });
    }
  }
  
  // Pattern 2: Time-based patterns (attacks at specific intervals)
  const eventTimestamps = recentEvents.map(e => e.timestamp).sort((a, b) => a - b);
  if (eventTimestamps.length >= 5) {
    const intervals: number[] = [];
    for (let i = 1; i < eventTimestamps.length; i++) {
      intervals.push(eventTimestamps[i] - eventTimestamps[i - 1]);
    }
    
    // Check if intervals are suspiciously regular (within 10% variance)
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.every(i => Math.abs(i - avgInterval) / avgInterval < 0.1);
    
    if (variance && avgInterval < 5000) { // Regular intervals under 5 seconds
      const affectedIPs = new Set(recentEvents.map(e => e.ip));
      patterns.push({
        type: 'time_based_pattern',
        severity: 'high',
        confidence: 85,
        ips: Array.from(affectedIPs),
        description: `Automated attack detected: Regular ${avgInterval.toFixed(0)}ms intervals`,
        detectedAt: now
      });
    }
  }
  
  // Pattern 3: Coordinated Attack (same user agents, different IPs)
  const userAgentsByIP = new Map<string, string>();
  for (const [ip, profile] of threatProfiles.entries()) {
    const events = securityEvents.get(ip) || [];
    const recentWithUA = events.filter(e => 
      now - e.timestamp < analysisWindow && e.metadata?.userAgent
    );
    if (recentWithUA.length > 0) {
      userAgentsByIP.set(ip, recentWithUA[0].metadata!.userAgent);
    }
  }
  
  const uaGroups = new Map<string, string[]>();
  for (const [ip, ua] of userAgentsByIP.entries()) {
    if (!uaGroups.has(ua)) {
      uaGroups.set(ua, []);
    }
    uaGroups.get(ua)!.push(ip);
  }
  
  for (const [ua, ips] of uaGroups.entries()) {
    if (ips.length >= 3) {
      patterns.push({
        type: 'coordinated_attack',
        severity: 'critical',
        confidence: 90,
        ips,
        description: `${ips.length} IPs using identical user agent`,
        detectedAt: now
      });
    }
  }
  
  // Pattern 4: Anomalous Behavior (rapid escalation of violation types)
  for (const [ip, events] of securityEvents.entries()) {
    const recentForIP = events.filter(e => now - e.timestamp < analysisWindow);
    const uniqueTypes = new Set(recentForIP.map(e => e.type));
    
    // If an IP triggers 4+ different violation types in 5 minutes
    if (uniqueTypes.size >= 4) {
      patterns.push({
        type: 'anomalous_behavior',
        severity: 'high',
        confidence: 80,
        ips: [ip],
        description: `${uniqueTypes.size} different attack types from single IP`,
        detectedAt: now
      });
    }
  }
  
  return patterns;
}

/**
 * Check if test mode is enabled
 */
export function isTestMode(): boolean {
  return testMode;
}

/**
 * Get threat intelligence summary
 */
export function getThreatIntelligence(): {
  activeThreats: number;
  blockedIPs: number;
  suspiciousIPs: number;
  recentPatterns: AttackPattern[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
} {
  const patterns = detectAdvancedPatterns();
  const analytics = getSecurityAnalytics();
  
  // Calculate overall risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (patterns.some(p => p.severity === 'critical')) {
    riskLevel = 'critical';
  } else if (patterns.some(p => p.severity === 'high') || analytics.blockedIPs.length > 5) {
    riskLevel = 'high';
  } else if (patterns.length > 0 || analytics.suspiciousIPs.length > 3) {
    riskLevel = 'medium';
  }
  
  return {
    activeThreats: patterns.length,
    blockedIPs: analytics.blockedIPs.length,
    suspiciousIPs: analytics.suspiciousIPs.length,
    recentPatterns: patterns,
    riskLevel
  };
}

/**
 * Auto-response to detected patterns
 */
export function respondToPatterns(): void {
  const patterns = detectAdvancedPatterns();
  
  for (const pattern of patterns) {
    if (pattern.severity === 'critical' && pattern.confidence >= 85) {
      // Auto-block all IPs involved in critical patterns
      for (const ip of pattern.ips) {
        const profile = getOrCreateProfile(ip);
        profile.suspicionScore = 100;
        profile.status = 'blocked';
        autoBlockList.add(ip);
        console.log(`🚨 AUTO-BLOCKED ${ip} - Pattern: ${pattern.type}`);
      }
    } else if (pattern.severity === 'high') {
      // Increase suspicion score for high-severity patterns
      for (const ip of pattern.ips) {
        const profile = getOrCreateProfile(ip);
        profile.suspicionScore = Math.min(100, profile.suspicionScore + 30);
        if (profile.suspicionScore >= 100) {
          profile.status = 'blocked';
          autoBlockList.add(ip);
        }
        console.log(`⚠️ INCREASED SUSPICION for ${ip} - Pattern: ${pattern.type}`);
      }
    }
  }
}
// Auto-cleanup every hour
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupOldData, 3600000);
}

// Export stores for testing/monitoring
export { threatProfiles, securityEvents, autoBlockList };
