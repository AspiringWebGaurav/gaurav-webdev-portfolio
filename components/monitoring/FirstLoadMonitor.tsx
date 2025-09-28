"use client";

import { useEffect, useRef } from 'react';

interface FirstLoadMonitorProps {
  enabled?: boolean;
}

interface MetricData {
  type: string;
  timestamp: number;
  userAgent?: string;
  loadTime?: number;
  errors?: any[];
  url?: string;
  chunkLoadTime?: number;
  serviceWorkerStatus?: string | null;
  errorCount?: number;
  chunkLoadAverage?: number;
  errorRate?: number;
  criticalAssetsReady?: boolean;
}

class FirstLoadMonitorService {
  private metrics: {
    chunkLoadTime: Array<{ url: string; duration: number; timestamp: number }>;
    chunkErrors: Array<{ url: string; message: string; timestamp: number }>;
    serviceWorkerStatus: string | null;
    criticalAssetsReady: boolean;
    firstLoadSuccess: boolean;
  };
  
  private thresholds = {
    maxChunkLoadTime: 3000,
    maxChunkErrors: 2,
    maxServiceWorkerDelay: 5000,
    criticalErrorThreshold: 5
  };
  
  private rollbackTrigger = false;
  private startTime: number;
  private isDev: boolean;

  constructor() {
    this.metrics = {
      chunkLoadTime: [],
      chunkErrors: [],
      serviceWorkerStatus: null,
      criticalAssetsReady: false,
      firstLoadSuccess: false
    };
    
    this.startTime = performance.now();
    this.isDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  }
  
  startMonitoring() {
    this.monitorChunkLoading();
    this.monitorServiceWorker();
    this.setupErrorTracking();
    this.monitorFirstLoad();
    this.scheduleHealthCheck();
  }
  
  private monitorChunkLoading() {
    if (!('PerformanceObserver' in window)) return;
    
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (entry.name.includes('/_next/static/chunks/')) {
          this.metrics.chunkLoadTime.push({
            url: entry.name,
            duration: entry.duration,
            timestamp: Date.now()
          });
          
          if (entry.duration > this.thresholds.maxChunkLoadTime) {
            this.reportSlowChunk(entry);
          }
        }
      });
    });
    
    try {
      observer.observe({ entryTypes: ['resource'] });
    } catch (error) {
      // PerformanceObserver not supported
      if (this.isDev) console.warn('[Monitor] PerformanceObserver not supported');
    }
  }
  
  private monitorServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        this.metrics.serviceWorkerStatus = 'ready';
        this.checkCriticalAssets(registration);
      }).catch(error => {
        this.metrics.serviceWorkerStatus = 'error';
        this.reportServiceWorkerError(error);
      });
    }
  }
  
  private async checkCriticalAssets(registration: ServiceWorkerRegistration) {
    if (registration.active) {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        const { criticalReady } = event.data || {};
        this.metrics.criticalAssetsReady = criticalReady;
        
        if (!criticalReady) {
          this.reportCriticalAssetFailure();
        }
      };
      
      registration.active.postMessage(
        { type: 'GET_CACHE_STATUS' },
        [messageChannel.port2]
      );
    }
  }
  
  private monitorFirstLoad() {
    let criticalChunksLoaded = 0;
    const expectedCriticalChunks = 3;
    
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (this.isCriticalChunk(entry.name)) {
          criticalChunksLoaded++;
          
          if (criticalChunksLoaded >= expectedCriticalChunks) {
            const loadTime = performance.now() - this.startTime;
            this.metrics.firstLoadSuccess = true;
            this.reportFirstLoadSuccess(loadTime);
          }
        }
      });
    });
    
    try {
      observer.observe({ entryTypes: ['resource'] });
    } catch (error) {
      // Fallback for browsers without PerformanceObserver
    }
    
    // Safety timeout
    setTimeout(() => {
      if (!this.metrics.firstLoadSuccess) {
        this.reportFirstLoadFailure();
        this.considerRollback();
      }
    }, 10000);
  }
  
  private setupErrorTracking() {
    window.addEventListener('error', (event) => {
      if (event.filename && event.filename.includes('/_next/static/chunks/')) {
        this.metrics.chunkErrors.push({
          url: event.filename,
          message: event.message,
          timestamp: Date.now()
        });
        
        if (this.metrics.chunkErrors.length > this.thresholds.maxChunkErrors) {
          this.triggerEmergencyRollback();
        }
      }
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && event.reason.message?.includes('ChunkLoadError')) {
        this.reportChunkLoadError(event.reason);
      }
    });
  }
  
  private scheduleHealthCheck() {
    // Run health check every 30 seconds
    setInterval(() => {
      this.performHealthCheck();
    }, 30000);
  }
  
  private isCriticalChunk(url: string) {
    return url.includes('/critical-') || 
           url.includes('/main-') || 
           url.includes('/webpack-');
  }
  
  private reportFirstLoadSuccess(loadTime: number) {
    this.sendMetric({
      type: 'first_load_success',
      loadTime,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    });
  }
  
  private reportFirstLoadFailure() {
    this.sendMetric({
      type: 'first_load_failure',
      errors: this.metrics.chunkErrors,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    });
  }
  
  private reportSlowChunk(entry: PerformanceEntry) {
    this.sendMetric({
      type: 'slow_chunk_load',
      url: entry.name,
      chunkLoadTime: entry.duration,
      timestamp: Date.now()
    });
  }
  
  private reportServiceWorkerError(error: any) {
    this.sendMetric({
      type: 'service_worker_error',
      errors: [{ message: error.message, stack: error.stack }],
      timestamp: Date.now(),
      serviceWorkerStatus: 'error'
    });
  }
  
  private reportCriticalAssetFailure() {
    this.sendMetric({
      type: 'critical_asset_failure',
      timestamp: Date.now(),
      serviceWorkerStatus: this.metrics.serviceWorkerStatus
    });
  }
  
  private reportChunkLoadError(error: any) {
    this.sendMetric({
      type: 'chunk_load_error',
      errors: [{ message: error.message, stack: error.stack }],
      timestamp: Date.now()
    });
  }
  
  private considerRollback() {
    const errorCount = this.metrics.chunkErrors.length;
    if (errorCount >= this.thresholds.criticalErrorThreshold) {
      this.triggerEmergencyRollback();
    }
  }
  
  private triggerEmergencyRollback() {
    if (this.rollbackTrigger) return;
    this.rollbackTrigger = true;
    
    // Clear all caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    
    // Clear service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
      });
    }
    
    // Report rollback
    this.sendMetric({
      type: 'emergency_rollback',
      timestamp: Date.now(),
      errorCount: this.metrics.chunkErrors.length
    });
    
    // Reload with cache bypass
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
  
  private performHealthCheck() {
    const health = {
      timestamp: Date.now(),
      chunkLoadAverage: this.calculateAverageChunkTime(),
      errorRate: this.calculateErrorRate(),
      serviceWorkerStatus: this.metrics.serviceWorkerStatus,
      criticalAssetsReady: this.metrics.criticalAssetsReady
    };
    
    this.sendMetric({
      type: 'health_check',
      timestamp: health.timestamp,
      chunkLoadAverage: health.chunkLoadAverage,
      errorRate: health.errorRate,
      serviceWorkerStatus: health.serviceWorkerStatus,
      criticalAssetsReady: health.criticalAssetsReady
    });
  }
  
  private calculateAverageChunkTime(): number {
    const recent = this.metrics.chunkLoadTime.slice(-10);
    if (recent.length === 0) return 0;
    return recent.reduce((sum, entry) => sum + entry.duration, 0) / recent.length;
  }
  
  private calculateErrorRate(): number {
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    const recentErrors = this.metrics.chunkErrors.filter(
      error => error.timestamp > fiveMinutesAgo
    );
    return recentErrors.length;
  }
  
  private sendMetric(data: MetricData) {
    // Send to monitoring service
    fetch('/api/monitoring/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(() => {
      // Silent failure for monitoring
    });
  }
  
  // Public methods for debugging
  getMetrics() {
    return this.metrics;
  }
  
  getStats() {
    return {
      ...this.metrics,
      averageChunkTime: this.calculateAverageChunkTime(),
      errorRate: this.calculateErrorRate()
    };
  }
}

function FirstLoadMonitor({ enabled = true }: FirstLoadMonitorProps) {
  const monitorRef = useRef<FirstLoadMonitorService | null>(null);
  
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    
    // Initialize monitor
    monitorRef.current = new FirstLoadMonitorService();
    monitorRef.current.startMonitoring();
    
    // Expose globally for debugging (development only)
    if (process.env.NODE_ENV === 'development') {
      (window as any).firstLoadMonitor = monitorRef.current;
    }
    
    return () => {
      // Cleanup if needed
    };
  }, [enabled]);
  
  // This component renders nothing - it's purely for monitoring
  return null;
}

export default FirstLoadMonitor;