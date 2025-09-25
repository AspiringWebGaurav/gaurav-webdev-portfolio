/**
 * Enterprise Ban/Unban Monitoring System
 * Comprehensive logging, metrics collection, and monitoring for ban/unban operations
 * Optimized for mobile reliability and Samsung S9 Plus compatibility
 */

import { silentLogger, prodLogger } from './secureLogger';
import { getSessionManager } from './enterpriseSessionManager';
import { getFirebaseManager } from './enterpriseFirebaseManager';

interface BanEvent {
  type: 'ban' | 'unban' | 'redirect_attempt' | 'redirect_success' | 'redirect_failure';
  uuid: string;
  timestamp: number;
  source: 'DynamicBanPage' | 'EnhancedBanPage' | 'VisitorStatusWatcher' | 'Admin' | 'System';
  details: BanEventDetails;
  deviceInfo: DeviceInfo;
  sessionId: string;
}

interface BanEventDetails {
  reason?: string;
  policyReference?: string;
  category?: string;
  targetUrl?: string;
  redirectMethod?: string;
  attempts?: number;
  duration?: number;
  error?: string;
  userAgent?: string;
  networkStatus?: 'online' | 'offline';
  viewportSize?: string;
}

interface DeviceInfo {
  isMobile: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  isSamsung: boolean;
  browserName: string;
  browserVersion: string;
  screenResolution: string;
  connectionType?: string;
}

interface BanMetrics {
  totalBans: number;
  totalUnbans: number;
  redirectAttempts: number;
  redirectSuccesses: number;
  redirectFailures: number;
  averageRedirectTime: number;
  mobileFailureRate: number;
  samsungSpecificIssues: number;
  lastUpdated: number;
}

interface MonitoringConfig {
  enableMetrics: boolean;
  enableEventLogging: boolean;
  enablePerformanceTracking: boolean;
  enableMobileSpecificTracking: boolean;
  maxEventsInMemory: number;
  metricsUpdateInterval: number;
  enableErrorReporting: boolean;
}

interface SamsungAnalysis {
  totalSamsungEvents: number;
  failureRate: number;
  commonFailureReasons: string[];
  recommendedStrategies: string[];
}

export class EnterpriseBanMonitor {
  private static instance: EnterpriseBanMonitor;
  private events: BanEvent[] = [];
  private metrics: BanMetrics = {
    totalBans: 0,
    totalUnbans: 0,
    redirectAttempts: 0,
    redirectSuccesses: 0,
    redirectFailures: 0,
    averageRedirectTime: 0,
    mobileFailureRate: 0,
    samsungSpecificIssues: 0,
    lastUpdated: Date.now()
  };
  
  private config: MonitoringConfig = {
    enableMetrics: true,
    enableEventLogging: true,
    enablePerformanceTracking: true,
    enableMobileSpecificTracking: true,
    maxEventsInMemory: 1000,
    metricsUpdateInterval: 60000, // 1 minute
    enableErrorReporting: true
  };

  private sessionId: string = '';
  private deviceInfo: DeviceInfo;
  private metricsInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.deviceInfo = this.detectDeviceInfo();
    this.setupPeriodicMetricsUpdate();
    this.setupEventListeners();
    
    silentLogger.silent("Enterprise ban monitor initialized", {
      sessionId: this.sessionId,
      deviceInfo: this.deviceInfo
    });
  }

  public static getInstance(): EnterpriseBanMonitor {
    if (!EnterpriseBanMonitor.instance) {
      EnterpriseBanMonitor.instance = new EnterpriseBanMonitor();
    }
    return EnterpriseBanMonitor.instance;
  }

  /**
   * Log a ban event
   */
  public logBanEvent(
    uuid: string, 
    reason: string = 'Policy violation', 
    source: BanEvent['source'] = 'System',
    additionalDetails: Partial<BanEventDetails> = {}
  ): void {
    if (!this.config.enableEventLogging) return;

    const event: BanEvent = {
      type: 'ban',
      uuid,
      timestamp: Date.now(),
      source,
      details: {
        reason,
        userAgent: navigator?.userAgent,
        networkStatus: navigator?.onLine ? 'online' : 'offline',
        viewportSize: this.getViewportSize(),
        ...additionalDetails
      },
      deviceInfo: this.deviceInfo,
      sessionId: this.sessionId
    };

    this.addEvent(event);
    this.updateMetrics('ban');
    
    prodLogger.info("Ban event logged", {
      uuid: this.sanitizeUuid(uuid),
      reason,
      source,
      isMobile: this.deviceInfo.isMobile,
      isSamsung: this.deviceInfo.isSamsung
    });
  }

  /**
   * Log an unban event
   */
  public logUnbanEvent(
    uuid: string, 
    source: BanEvent['source'] = 'System',
    additionalDetails: Partial<BanEventDetails> = {}
  ): void {
    if (!this.config.enableEventLogging) return;

    const event: BanEvent = {
      type: 'unban',
      uuid,
      timestamp: Date.now(),
      source,
      details: {
        userAgent: navigator?.userAgent,
        networkStatus: navigator?.onLine ? 'online' : 'offline',
        viewportSize: this.getViewportSize(),
        ...additionalDetails
      },
      deviceInfo: this.deviceInfo,
      sessionId: this.sessionId
    };

    this.addEvent(event);
    this.updateMetrics('unban');
    
    prodLogger.info("Unban event logged", {
      uuid: this.sanitizeUuid(uuid),
      source,
      isMobile: this.deviceInfo.isMobile,
      isSamsung: this.deviceInfo.isSamsung
    });
  }

  /**
   * Log a redirect attempt
   */
  public logRedirectAttempt(
    uuid: string,
    targetUrl: string,
    method: string,
    source: BanEvent['source'] = 'System'
  ): string {
    const attemptId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (this.config.enableEventLogging) {
      const event: BanEvent = {
        type: 'redirect_attempt',
        uuid,
        timestamp: Date.now(),
        source,
        details: {
          targetUrl: this.sanitizeUrl(targetUrl),
          redirectMethod: method,
          attempts: 1,
          userAgent: navigator?.userAgent,
          networkStatus: navigator?.onLine ? 'online' : 'offline',
          viewportSize: this.getViewportSize()
        },
        deviceInfo: this.deviceInfo,
        sessionId: this.sessionId
      };

      this.addEvent(event);
    }

    this.updateMetrics('redirect_attempt');
    
    silentLogger.silent("Redirect attempt logged", {
      uuid: this.sanitizeUuid(uuid),
      method,
      targetUrl: this.sanitizeUrl(targetUrl),
      attemptId
    });

    return attemptId;
  }

  /**
   * Log a redirect success
   */
  public logRedirectSuccess(
    uuid: string,
    targetUrl: string,
    method: string,
    duration: number,
    attempts: number = 1,
    source: BanEvent['source'] = 'System'
  ): void {
    if (this.config.enableEventLogging) {
      const event: BanEvent = {
        type: 'redirect_success',
        uuid,
        timestamp: Date.now(),
        source,
        details: {
          targetUrl: this.sanitizeUrl(targetUrl),
          redirectMethod: method,
          duration,
          attempts,
          userAgent: navigator?.userAgent,
          networkStatus: navigator?.onLine ? 'online' : 'offline',
          viewportSize: this.getViewportSize()
        },
        deviceInfo: this.deviceInfo,
        sessionId: this.sessionId
      };

      this.addEvent(event);
    }

    this.updateMetrics('redirect_success', { duration, attempts });
    
    prodLogger.info("Redirect success logged", {
      uuid: this.sanitizeUuid(uuid),
      method,
      duration: `${duration}ms`,
      attempts,
      isMobile: this.deviceInfo.isMobile,
      isSamsung: this.deviceInfo.isSamsung
    });
  }

  /**
   * Log a redirect failure
   */
  public logRedirectFailure(
    uuid: string,
    targetUrl: string,
    method: string,
    error: string,
    attempts: number = 1,
    source: BanEvent['source'] = 'System'
  ): void {
    if (this.config.enableEventLogging) {
      const event: BanEvent = {
        type: 'redirect_failure',
        uuid,
        timestamp: Date.now(),
        source,
        details: {
          targetUrl: this.sanitizeUrl(targetUrl),
          redirectMethod: method,
          error,
          attempts,
          userAgent: navigator?.userAgent,
          networkStatus: navigator?.onLine ? 'online' : 'offline',
          viewportSize: this.getViewportSize()
        },
        deviceInfo: this.deviceInfo,
        sessionId: this.sessionId
      };

      this.addEvent(event);
    }

    this.updateMetrics('redirect_failure');
    
    // Track Samsung-specific issues
    if (this.deviceInfo.isSamsung) {
      this.metrics.samsungSpecificIssues++;
    }

    prodLogger.error("Redirect failure logged", {
      uuid: this.sanitizeUuid(uuid),
      method,
      error,
      attempts,
      isMobile: this.deviceInfo.isMobile,
      isSamsung: this.deviceInfo.isSamsung,
      targetUrl: this.sanitizeUrl(targetUrl)
    });
  }

  /**
   * Get comprehensive metrics
   */
  public getMetrics(): BanMetrics & {
    recentEvents: number;
    sessionDuration: number;
    mobileEvents: number;
    samsungEvents: number;
  } {
    const now = Date.now();
    const sessionStart = parseInt(this.sessionId.split('_')[1]) || now;
    const recentEvents = this.events.filter(e => (now - e.timestamp) < 300000).length; // Last 5 minutes
    const mobileEvents = this.events.filter(e => e.deviceInfo.isMobile).length;
    const samsungEvents = this.events.filter(e => e.deviceInfo.isSamsung).length;

    return {
      ...this.metrics,
      recentEvents,
      sessionDuration: now - sessionStart,
      mobileEvents,
      samsungEvents
    };
  }

  /**
   * Get events filtered by criteria
   */
  public getEvents(filter: {
    type?: BanEvent['type'];
    uuid?: string;
    source?: BanEvent['source'];
    since?: number;
    isMobile?: boolean;
    isSamsung?: boolean;
  } = {}): BanEvent[] {
    return this.events.filter(event => {
      if (filter.type && event.type !== filter.type) return false;
      if (filter.uuid && event.uuid !== filter.uuid) return false;
      if (filter.source && event.source !== filter.source) return false;
      if (filter.since && event.timestamp < filter.since) return false;
      if (filter.isMobile !== undefined && event.deviceInfo.isMobile !== filter.isMobile) return false;
      if (filter.isSamsung !== undefined && event.deviceInfo.isSamsung !== filter.isSamsung) return false;
      return true;
    });
  }

  /**
   * Get Samsung S9 Plus specific analysis
   */
  public getSamsungAnalysis(): SamsungAnalysis {
    const samsungEvents = this.events.filter(e => e.deviceInfo.isSamsung);
    const samsungFailures = samsungEvents.filter(e => e.type === 'redirect_failure');
    
    const failureReasons = samsungFailures.map(e => e.details.error || 'Unknown').filter(Boolean);
    const uniqueReasons = [...new Set(failureReasons)];
    
    const failureRate = samsungEvents.length > 0 ? (samsungFailures.length / samsungEvents.length) * 100 : 0;

    const recommendations = [];
    if (failureRate > 30) {
      recommendations.push('Use window.location.href as primary redirect method');
      recommendations.push('Implement meta refresh fallback');
      recommendations.push('Add form submit as secondary fallback');
    }
    if (failureRate > 50) {
      recommendations.push('Force page reload after redirect attempts');
      recommendations.push('Show manual navigation instructions');
    }

    return {
      totalSamsungEvents: samsungEvents.length,
      failureRate: Math.round(failureRate * 100) / 100,
      commonFailureReasons: uniqueReasons.slice(0, 5),
      recommendedStrategies: recommendations
    };
  }

  /**
   * Generate diagnostic report
   */
  public generateDiagnosticReport(): {
    overview: BanMetrics;
    deviceBreakdown: { [key: string]: number };
    redirectMethodAnalysis: { [key: string]: { attempts: number; successes: number; failures: number } };
    recentIssues: BanEvent[];
    samsungAnalysis: SamsungAnalysis;
  } {
    const overview = this.getMetrics();
    
    // Device breakdown
    const deviceBreakdown: { [key: string]: number } = {};
    this.events.forEach(event => {
      const key = `${event.deviceInfo.browserName}_${event.deviceInfo.isMobile ? 'Mobile' : 'Desktop'}`;
      deviceBreakdown[key] = (deviceBreakdown[key] || 0) + 1;
    });

    // Redirect method analysis
    const methodAnalysis: { [key: string]: { attempts: number; successes: number; failures: number } } = {};
    this.events.filter(e => e.type.startsWith('redirect')).forEach(event => {
      const method = event.details.redirectMethod || 'unknown';
      if (!methodAnalysis[method]) {
        methodAnalysis[method] = { attempts: 0, successes: 0, failures: 0 };
      }
      
      if (event.type === 'redirect_attempt') methodAnalysis[method].attempts++;
      else if (event.type === 'redirect_success') methodAnalysis[method].successes++;
      else if (event.type === 'redirect_failure') methodAnalysis[method].failures++;
    });

    // Recent issues (last hour)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const recentIssues = this.events.filter(e => 
      e.type === 'redirect_failure' && e.timestamp > oneHourAgo
    ).slice(-10);

    return {
      overview,
      deviceBreakdown,
      redirectMethodAnalysis: methodAnalysis,
      recentIssues,
      samsungAnalysis: this.getSamsungAnalysis()
    };
  }

  /**
   * Export events for external analysis
   */
  public exportEvents(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['timestamp', 'type', 'uuid', 'source', 'device', 'method', 'duration', 'error'];
      const rows = this.events.map(event => [
        new Date(event.timestamp).toISOString(),
        event.type,
        this.sanitizeUuid(event.uuid),
        event.source,
        `${event.deviceInfo.browserName}_${event.deviceInfo.isMobile ? 'Mobile' : 'Desktop'}`,
        event.details.redirectMethod || '',
        event.details.duration || '',
        event.details.error || ''
      ]);
      
      return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }

    return JSON.stringify(this.events.map(event => ({
      ...event,
      uuid: this.sanitizeUuid(event.uuid),
      details: {
        ...event.details,
        targetUrl: event.details.targetUrl ? this.sanitizeUrl(event.details.targetUrl) : undefined
      }
    })), null, 2);
  }

  /**
   * Clear old events to manage memory
   */
  public clearOldEvents(olderThan: number = 24 * 60 * 60 * 1000): number {
    const cutoff = Date.now() - olderThan;
    const initialLength = this.events.length;
    this.events = this.events.filter(event => event.timestamp > cutoff);
    const cleared = initialLength - this.events.length;
    
    if (cleared > 0) {
      silentLogger.silent("Cleared old monitoring events", { count: cleared });
    }
    
    return cleared;
  }

  /**
   * Private helper methods
   */
  private addEvent(event: BanEvent): void {
    this.events.push(event);
    
    // Limit memory usage
    if (this.events.length > this.config.maxEventsInMemory) {
      this.events = this.events.slice(-this.config.maxEventsInMemory);
    }
  }

  private updateMetrics(type: string, additionalData?: { duration?: number; attempts?: number }): void {
    if (!this.config.enableMetrics) return;

    switch (type) {
      case 'ban':
        this.metrics.totalBans++;
        break;
      case 'unban':
        this.metrics.totalUnbans++;
        break;
      case 'redirect_attempt':
        this.metrics.redirectAttempts++;
        break;
      case 'redirect_success':
        this.metrics.redirectSuccesses++;
        if (additionalData?.duration) {
          // Update rolling average
          const totalRedirects = this.metrics.redirectSuccesses;
          const currentAvg = this.metrics.averageRedirectTime;
          this.metrics.averageRedirectTime = ((currentAvg * (totalRedirects - 1)) + additionalData.duration) / totalRedirects;
        }
        break;
      case 'redirect_failure':
        this.metrics.redirectFailures++;
        break;
    }

    // Calculate mobile failure rate
    const mobileEvents = this.events.filter(e => e.deviceInfo.isMobile && e.type.startsWith('redirect'));
    const mobileFailures = mobileEvents.filter(e => e.type === 'redirect_failure');
    this.metrics.mobileFailureRate = mobileEvents.length > 0 ? (mobileFailures.length / mobileEvents.length) * 100 : 0;

    this.metrics.lastUpdated = Date.now();
  }

  private generateSessionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `session_${timestamp}_${random}`;
  }

  private detectDeviceInfo(): DeviceInfo {
    if (typeof navigator === 'undefined') {
      return {
        isMobile: false,
        isAndroid: false,
        isIOS: false,
        isSamsung: false,
        browserName: 'Unknown',
        browserVersion: 'Unknown',
        screenResolution: 'Unknown'
      };
    }

    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isSamsung = /samsung/.test(userAgent) || /sm-/.test(userAgent);
    
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';

    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
      browserName = 'Chrome';
      const match = userAgent.match(/chrome\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('firefox')) {
      browserName = 'Firefox';
      const match = userAgent.match(/firefox\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      browserName = 'Safari';
      const match = userAgent.match(/version\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    }

    const screenResolution = typeof screen !== 'undefined' 
      ? `${screen.width}x${screen.height}` 
      : 'Unknown';

    return {
      isMobile,
      isAndroid,
      isIOS,
      isSamsung,
      browserName,
      browserVersion,
      screenResolution,
      connectionType: this.getConnectionType()
    };
  }

  private getConnectionType(): string {
    const nav = navigator as any;
    if (nav.connection) {
      return nav.connection.effectiveType || nav.connection.type || 'unknown';
    }
    return 'unknown';
  }

  private getViewportSize(): string {
    if (typeof window === 'undefined') return 'unknown';
    return `${window.innerWidth}x${window.innerHeight}`;
  }

  private setupPeriodicMetricsUpdate(): void {
    this.metricsInterval = setInterval(() => {
      this.clearOldEvents();
      // Additional periodic maintenance can be added here
    }, this.config.metricsUpdateInterval);
  }

  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    // Monitor network status changes
    window.addEventListener('online', () => {
      silentLogger.silent("Network online - updating monitoring metrics");
    });

    window.addEventListener('offline', () => {
      silentLogger.silent("Network offline - monitoring will continue");
    });
  }

  private sanitizeUuid(uuid: string): string {
    return uuid.replace(/[a-f0-9-]{36}/gi, '[UUID]');
  }

  private sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url, window?.location?.origin);
      return urlObj.pathname;
    } catch {
      return url.replace(/[?#].*$/, '');
    }
  }

  /**
   * Cleanup method
   */
  public cleanup(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    
    silentLogger.silent("Enterprise ban monitor cleanup completed");
  }
}

// Convenience functions for easy usage
export function getBanMonitor(): EnterpriseBanMonitor {
  return EnterpriseBanMonitor.getInstance();
}

export function logBan(uuid: string, reason?: string, source?: BanEvent['source']): void {
  getBanMonitor().logBanEvent(uuid, reason, source);
}

export function logUnban(uuid: string, source?: BanEvent['source']): void {
  getBanMonitor().logUnbanEvent(uuid, source);
}

export function logRedirectAttempt(uuid: string, targetUrl: string, method: string, source?: BanEvent['source']): string {
  return getBanMonitor().logRedirectAttempt(uuid, targetUrl, method, source);
}

export function logRedirectSuccess(
  uuid: string, 
  targetUrl: string, 
  method: string, 
  duration: number, 
  attempts?: number, 
  source?: BanEvent['source']
): void {
  getBanMonitor().logRedirectSuccess(uuid, targetUrl, method, duration, attempts, source);
}

export function logRedirectFailure(
  uuid: string, 
  targetUrl: string, 
  method: string, 
  error: string, 
  attempts?: number, 
  source?: BanEvent['source']
): void {
  getBanMonitor().logRedirectFailure(uuid, targetUrl, method, error, attempts, source);
}

// Export types
export type { BanEvent, BanEventDetails, DeviceInfo, BanMetrics, MonitoringConfig };