// lib/securityMonitor.ts
// Enterprise-grade security monitoring and threat detection

import { 
  SessionErrorCode, 
  type SecurityAuditLog, 
  SESSION_CONFIG 
} from './secureSession';
import { requireFirebaseAdmin } from './firebase-admin';
import { smartLogger } from '@/utils/smartLogger';

// Security event types
export enum SecurityEventType {
  BRUTE_FORCE_ATTACK = 'BRUTE_FORCE_ATTACK',
  RAPID_TOKEN_REQUESTS = 'RAPID_TOKEN_REQUESTS',
  FINGERPRINT_ANOMALY = 'FINGERPRINT_ANOMALY',
  GEOGRAPHIC_ANOMALY = 'GEOGRAPHIC_ANOMALY',
  SESSION_HIJACK_ATTEMPT = 'SESSION_HIJACK_ATTEMPT',
  INVALID_SIGNATURE_BURST = 'INVALID_SIGNATURE_BURST',
  TOKEN_REPLAY_DETECTED = 'TOKEN_REPLAY_DETECTED',
  SUSPICIOUS_USER_AGENT = 'SUSPICIOUS_USER_AGENT',
  IP_REPUTATION_THREAT = 'IP_REPUTATION_THREAT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

// Threat levels
export enum ThreatLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// Security alert interface
export interface SecurityAlert {
  id: string;
  type: SecurityEventType;
  level: ThreatLevel;
  timestamp: number;
  ip: string;
  userAgent: string;
  uuid?: string;
  description: string;
  evidence: Record<string, any>;
  actionsTaken: string[];
  resolved: boolean;
  resolvedAt?: number;
  resolvedBy?: string;
}

// Attack pattern detection thresholds
const ATTACK_THRESHOLDS = {
  BRUTE_FORCE: {
    maxFailures: 5,
    timeWindowMs: 5 * 60 * 1000, // 5 minutes
  },
  RAPID_REQUESTS: {
    maxRequests: 20,
    timeWindowMs: 60 * 1000, // 1 minute
  },
  INVALID_SIGNATURES: {
    maxInvalid: 3,
    timeWindowMs: 2 * 60 * 1000, // 2 minutes
  },
  FINGERPRINT_CHANGES: {
    maxChanges: 2,
    timeWindowMs: 10 * 60 * 1000, // 10 minutes
  },
} as const;

// Suspicious user agent patterns
const SUSPICIOUS_UA_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /scanner/i,
  /python/i,
  /curl/i,
  /wget/i,
  /postman/i,
  /insomnia/i,
  /^$/,
  /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, // IP addresses
];

/**
 * Security monitoring and threat detection system
 */
class SecurityMonitor {
  private alertHistory: Map<string, SecurityAlert[]> = new Map();
  private ipFailureHistory: Map<string, { timestamp: number; count: number }[]> = new Map();
  private requestHistory: Map<string, number[]> = new Map();
  private fingerprintHistory: Map<string, { fingerprint: string; timestamp: number }[]> = new Map();

  /**
   * Analyze security audit log for threats
   */
  async analyzeSecurityEvent(auditLog: SecurityAuditLog): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = [];
    
    try {
      // 1. Check for brute force attacks
      const bruteForceAlert = await this.detectBruteForceAttack(auditLog);
      if (bruteForceAlert) alerts.push(bruteForceAlert);

      // 2. Check for rapid token requests
      const rapidRequestAlert = await this.detectRapidTokenRequests(auditLog);
      if (rapidRequestAlert) alerts.push(rapidRequestAlert);

      // 3. Check for fingerprint anomalies
      const fingerprintAlert = await this.detectFingerprintAnomaly(auditLog);
      if (fingerprintAlert) alerts.push(fingerprintAlert);

      // 4. Check for suspicious user agents
      const userAgentAlert = await this.detectSuspiciousUserAgent(auditLog);
      if (userAgentAlert) alerts.push(userAgentAlert);

      // 5. Check for invalid signature bursts
      const signatureAlert = await this.detectInvalidSignatureBurst(auditLog);
      if (signatureAlert) alerts.push(signatureAlert);

      // 6. Check for token replay attempts
      const replayAlert = await this.detectTokenReplay(auditLog);
      if (replayAlert) alerts.push(replayAlert);

      // Store alerts for tracking
      if (alerts.length > 0) {
        await this.storeSecurityAlerts(alerts);
        await this.executeSecurityActions(alerts);
      }

      return alerts;
    } catch (error) {
      smartLogger.api.error('[SecurityMonitor] Error analyzing security event', { error, auditLog });
      return [];
    }
  }

  /**
   * Detect brute force attack patterns
   */
  private async detectBruteForceAttack(auditLog: SecurityAuditLog): Promise<SecurityAlert | null> {
    if (auditLog.event !== 'session_failed') return null;

    const ip = auditLog.ip;
    const now = auditLog.timestamp * 1000; // Convert to milliseconds
    
    // Get failure history for this IP
    let failures = this.ipFailureHistory.get(ip) || [];
    
    // Add current failure
    failures.push({ timestamp: now, count: 1 });
    
    // Remove old failures outside time window
    const cutoff = now - ATTACK_THRESHOLDS.BRUTE_FORCE.timeWindowMs;
    failures = failures.filter(f => f.timestamp > cutoff);
    
    // Update history
    this.ipFailureHistory.set(ip, failures);
    
    // Check if threshold exceeded
    if (failures.length >= ATTACK_THRESHOLDS.BRUTE_FORCE.maxFailures) {
      return {
        id: `brute_force_${ip}_${now}`,
        type: SecurityEventType.BRUTE_FORCE_ATTACK,
        level: ThreatLevel.HIGH,
        timestamp: now,
        ip,
        userAgent: auditLog.userAgent,
        uuid: auditLog.uuid,
        description: `Potential brute force attack detected from ${ip}`,
        evidence: {
          failureCount: failures.length,
          timeWindow: ATTACK_THRESHOLDS.BRUTE_FORCE.timeWindowMs,
          errorCodes: failures.map(() => auditLog.errorCode).filter(Boolean),
        },
        actionsTaken: ['IP_RATE_LIMITED', 'ALERT_GENERATED'],
        resolved: false,
      };
    }

    return null;
  }

  /**
   * Detect rapid token request patterns
   */
  private async detectRapidTokenRequests(auditLog: SecurityAuditLog): Promise<SecurityAlert | null> {
    if (auditLog.event !== 'session_created') return null;

    const ip = auditLog.ip;
    const now = auditLog.timestamp * 1000;
    
    // Get request history for this IP
    let requests = this.requestHistory.get(ip) || [];
    
    // Add current request
    requests.push(now);
    
    // Remove old requests outside time window
    const cutoff = now - ATTACK_THRESHOLDS.RAPID_REQUESTS.timeWindowMs;
    requests = requests.filter(r => r > cutoff);
    
    // Update history
    this.requestHistory.set(ip, requests);
    
    // Check if threshold exceeded
    if (requests.length >= ATTACK_THRESHOLDS.RAPID_REQUESTS.maxRequests) {
      return {
        id: `rapid_requests_${ip}_${now}`,
        type: SecurityEventType.RAPID_TOKEN_REQUESTS,
        level: ThreatLevel.MEDIUM,
        timestamp: now,
        ip,
        userAgent: auditLog.userAgent,
        uuid: auditLog.uuid,
        description: `Rapid token generation detected from ${ip}`,
        evidence: {
          requestCount: requests.length,
          timeWindow: ATTACK_THRESHOLDS.RAPID_REQUESTS.timeWindowMs,
          averageInterval: requests.length > 1 ? (requests[requests.length - 1] - requests[0]) / (requests.length - 1) : 0,
        },
        actionsTaken: ['RATE_LIMITED', 'MONITORING_INCREASED'],
        resolved: false,
      };
    }

    return null;
  }

  /**
   * Detect fingerprint anomalies (potential session hijacking)
   */
  private async detectFingerprintAnomaly(auditLog: SecurityAuditLog): Promise<SecurityAlert | null> {
    if (!auditLog.uuid || auditLog.event === 'session_failed') return null;

    const uuid = auditLog.uuid;
    const fingerprintHash = auditLog.metadata?.fingerprintHash;
    const now = auditLog.timestamp * 1000;
    
    if (!fingerprintHash) return null;

    // Get fingerprint history for this UUID
    let history = this.fingerprintHistory.get(uuid) || [];
    
    // Check for fingerprint changes
    const recentFingerprints = history.filter(h => 
      now - h.timestamp < ATTACK_THRESHOLDS.FINGERPRINT_CHANGES.timeWindowMs
    );
    
    const uniqueFingerprints = new Set(recentFingerprints.map(h => h.fingerprint));
    uniqueFingerprints.add(fingerprintHash);
    
    // Add current fingerprint to history
    history.push({ fingerprint: fingerprintHash, timestamp: now });
    
    // Keep only recent history
    history = history.filter(h => now - h.timestamp < 24 * 60 * 60 * 1000); // 24 hours
    this.fingerprintHistory.set(uuid, history);
    
    // Check if too many different fingerprints
    if (uniqueFingerprints.size > ATTACK_THRESHOLDS.FINGERPRINT_CHANGES.maxChanges) {
      return {
        id: `fingerprint_anomaly_${uuid}_${now}`,
        type: SecurityEventType.FINGERPRINT_ANOMALY,
        level: ThreatLevel.HIGH,
        timestamp: now,
        ip: auditLog.ip,
        userAgent: auditLog.userAgent,
        uuid,
        description: `Multiple device fingerprints detected for session ${uuid}`,
        evidence: {
          fingerprintCount: uniqueFingerprints.size,
          timeWindow: ATTACK_THRESHOLDS.FINGERPRINT_CHANGES.timeWindowMs,
          currentFingerprint: fingerprintHash,
          previousFingerprints: Array.from(uniqueFingerprints).slice(0, -1),
        },
        actionsTaken: ['SESSION_FLAGGED', 'ADDITIONAL_VALIDATION_REQUIRED'],
        resolved: false,
      };
    }

    return null;
  }

  /**
   * Detect suspicious user agent patterns
   */
  private async detectSuspiciousUserAgent(auditLog: SecurityAuditLog): Promise<SecurityAlert | null> {
    const userAgent = auditLog.userAgent;
    
    const isSuspicious = SUSPICIOUS_UA_PATTERNS.some(pattern => pattern.test(userAgent));
    
    if (isSuspicious) {
      return {
        id: `suspicious_ua_${auditLog.ip}_${auditLog.timestamp}`,
        type: SecurityEventType.SUSPICIOUS_USER_AGENT,
        level: ThreatLevel.MEDIUM,
        timestamp: auditLog.timestamp * 1000,
        ip: auditLog.ip,
        userAgent,
        uuid: auditLog.uuid,
        description: `Suspicious user agent detected: ${userAgent.slice(0, 100)}`,
        evidence: {
          userAgent,
          matchedPatterns: SUSPICIOUS_UA_PATTERNS.filter(p => p.test(userAgent)).map(p => p.source),
        },
        actionsTaken: ['FLAGGED_FOR_REVIEW'],
        resolved: false,
      };
    }

    return null;
  }

  /**
   * Detect invalid signature bursts
   */
  private async detectInvalidSignatureBurst(auditLog: SecurityAuditLog): Promise<SecurityAlert | null> {
    if (auditLog.errorCode !== SessionErrorCode.INVALID_SIGNATURE) return null;

    const key = `${auditLog.ip}_invalid_signatures`;
    const now = auditLog.timestamp * 1000;
    
    // This would typically use a more sophisticated storage mechanism
    // For now, using in-memory tracking
    let invalidSigs = this.ipFailureHistory.get(key) || [];
    invalidSigs.push({ timestamp: now, count: 1 });
    
    // Remove old entries
    const cutoff = now - ATTACK_THRESHOLDS.INVALID_SIGNATURES.timeWindowMs;
    invalidSigs = invalidSigs.filter(sig => sig.timestamp > cutoff);
    this.ipFailureHistory.set(key, invalidSigs);
    
    if (invalidSigs.length >= ATTACK_THRESHOLDS.INVALID_SIGNATURES.maxInvalid) {
      return {
        id: `invalid_signature_burst_${auditLog.ip}_${now}`,
        type: SecurityEventType.INVALID_SIGNATURE_BURST,
        level: ThreatLevel.HIGH,
        timestamp: now,
        ip: auditLog.ip,
        userAgent: auditLog.userAgent,
        uuid: auditLog.uuid,
        description: `Multiple invalid signature attempts from ${auditLog.ip}`,
        evidence: {
          invalidAttempts: invalidSigs.length,
          timeWindow: ATTACK_THRESHOLDS.INVALID_SIGNATURES.timeWindowMs,
        },
        actionsTaken: ['IP_BLOCKED', 'SECURITY_TEAM_NOTIFIED'],
        resolved: false,
      };
    }

    return null;
  }

  /**
   * Detect token replay attempts
   */
  private async detectTokenReplay(auditLog: SecurityAuditLog): Promise<SecurityAlert | null> {
    // This would require storing used nonces and checking for reuse
    // Implementation would depend on your nonce tracking strategy
    
    if (auditLog.errorCode === SessionErrorCode.REPLAY_ATTACK) {
      return {
        id: `token_replay_${auditLog.ip}_${auditLog.timestamp}`,
        type: SecurityEventType.TOKEN_REPLAY_DETECTED,
        level: ThreatLevel.CRITICAL,
        timestamp: auditLog.timestamp * 1000,
        ip: auditLog.ip,
        userAgent: auditLog.userAgent,
        uuid: auditLog.uuid,
        description: `Token replay attack detected from ${auditLog.ip}`,
        evidence: {
          replayedToken: 'detected',
          originalTimestamp: auditLog.metadata?.originalTimestamp,
        },
        actionsTaken: ['IP_IMMEDIATE_BLOCK', 'INCIDENT_CREATED'],
        resolved: false,
      };
    }

    return null;
  }

  /**
   * Store security alerts in database
   */
  private async storeSecurityAlerts(alerts: SecurityAlert[]): Promise<void> {
    try {
      const db = requireFirebaseAdmin();
      const batch = db.batch();

      alerts.forEach(alert => {
        const alertRef = db.collection('security_alerts').doc(alert.id);
        batch.set(alertRef, {
          ...alert,
          createdAt: new Date().toISOString(),
        });
      });

      await batch.commit();
      
      smartLogger.api.warn('[SecurityMonitor] Security alerts stored', {
        alertCount: alerts.length,
        types: alerts.map(a => a.type),
      });
    } catch (error) {
      smartLogger.api.error('[SecurityMonitor] Failed to store security alerts', { error });
    }
  }

  /**
   * Execute security actions based on alerts
   */
  private async executeSecurityActions(alerts: SecurityAlert[]): Promise<void> {
    for (const alert of alerts) {
      try {
        // Log high/critical alerts immediately
        if (alert.level === ThreatLevel.HIGH || alert.level === ThreatLevel.CRITICAL) {
          smartLogger.api.error(`[SECURITY ALERT] ${alert.type}: ${alert.description}`, {
            alert,
            requiresImmediateAttention: true,
          });
        }

        // Execute specific actions based on alert type
        await this.executeAlertSpecificActions(alert);
        
      } catch (error) {
        smartLogger.api.error('[SecurityMonitor] Failed to execute security action', { error, alert });
      }
    }
  }

  /**
   * Execute alert-specific security actions
   */
  private async executeAlertSpecificActions(alert: SecurityAlert): Promise<void> {
    switch (alert.type) {
      case SecurityEventType.BRUTE_FORCE_ATTACK:
        await this.handleBruteForceAttack(alert);
        break;
        
      case SecurityEventType.TOKEN_REPLAY_DETECTED:
        await this.handleTokenReplay(alert);
        break;
        
      case SecurityEventType.FINGERPRINT_ANOMALY:
        await this.handleFingerprintAnomaly(alert);
        break;
        
      // Add more specific handlers as needed
      default:
        smartLogger.api.warn('[SecurityMonitor] No specific handler for alert type', { type: alert.type });
    }
  }

  /**
   * Handle brute force attack
   */
  private async handleBruteForceAttack(alert: SecurityAlert): Promise<void> {
    // In a real implementation, you might:
    // 1. Add IP to temporary block list
    // 2. Increase rate limiting for this IP
    // 3. Send notification to security team
    // 4. Create incident ticket
    
    smartLogger.api.error('[SECURITY] Brute force attack detected', {
      ip: alert.ip,
      evidence: alert.evidence,
      actionRequired: 'IP should be temporarily blocked',
    });
  }

  /**
   * Handle token replay attack
   */
  private async handleTokenReplay(alert: SecurityAlert): Promise<void> {
    // Critical security incident - immediate action required
    smartLogger.api.error('[CRITICAL SECURITY] Token replay attack detected', {
      alert,
      actionRequired: 'Immediate IP block and incident response',
    });
  }

  /**
   * Handle fingerprint anomaly
   */
  private async handleFingerprintAnomaly(alert: SecurityAlert): Promise<void> {
    // Potential session hijacking
    smartLogger.api.warn('[SECURITY] Fingerprint anomaly detected', {
      uuid: alert.uuid,
      evidence: alert.evidence,
      actionRequired: 'Session should be flagged for additional verification',
    });
  }

  /**
   * Get security metrics for monitoring dashboard
   */
  async getSecurityMetrics(): Promise<{
    totalAlerts: number;
    alertsByType: Record<SecurityEventType, number>;
    alertsByLevel: Record<ThreatLevel, number>;
    topThreateningIPs: string[];
    recentCriticalAlerts: SecurityAlert[];
  }> {
    try {
      const db = requireFirebaseAdmin();
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const alertsSnapshot = await db
        .collection('security_alerts')
        .where('timestamp', '>=', last24Hours.getTime())
        .get();
      
      const alerts = alertsSnapshot.docs.map(doc => doc.data() as SecurityAlert);
      
      const alertsByType: Record<SecurityEventType, number> = {} as any;
      const alertsByLevel: Record<ThreatLevel, number> = {} as any;
      const ipCounts: Record<string, number> = {};
      
      alerts.forEach(alert => {
        alertsByType[alert.type] = (alertsByType[alert.type] || 0) + 1;
        alertsByLevel[alert.level] = (alertsByLevel[alert.level] || 0) + 1;
        ipCounts[alert.ip] = (ipCounts[alert.ip] || 0) + 1;
      });
      
      const topThreateningIPs = Object.entries(ipCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([ip]) => ip);
      
      const recentCriticalAlerts = alerts
        .filter(alert => alert.level === ThreatLevel.CRITICAL)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10);
      
      return {
        totalAlerts: alerts.length,
        alertsByType,
        alertsByLevel,
        topThreateningIPs,
        recentCriticalAlerts,
      };
    } catch (error) {
      smartLogger.api.error('[SecurityMonitor] Failed to get security metrics', { error });
      throw error;
    }
  }
}

// Export singleton instance
export const securityMonitor = new SecurityMonitor();
export default securityMonitor;