/**
 * Analytics Health Monitor
 * Real-time dashboard showing analytics system health
 * Admin-only component for monitoring the reliability layer
 */

"use client";

import { useEffect, useState } from "react";
import { usePathname } from 'next/navigation';
import { getAnalyticsReliability } from "@/lib/analyticsReliability";

interface HealthMetrics {
  totalEvents: number;
  successfulEvents: number;
  failedEvents: number;
  retriedEvents: number;
  queuedEvents: number;
  circuitBreakerState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  queueSize: number;
  successRate: number;
}

export default function AnalyticsHealthMonitor() {
  const pathname = usePathname();
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Skip monitoring on 404 pages
  if (!pathname || pathname === '/_not-found') {
    return null;
  }

  useEffect(() => {
    // Update metrics every 5 seconds
    const updateMetrics = () => {
      const analytics = getAnalyticsReliability();
      const health = analytics.getHealthMetrics();
      setMetrics(health);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);

    // Listen for keyboard shortcut (Ctrl+Shift+A) to toggle visibility
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  if (!isVisible || !metrics) return null;

  const getCircuitBreakerColor = (state: string) => {
    switch (state) {
      case 'CLOSED': return 'text-green-500';
      case 'HALF_OPEN': return 'text-yellow-500';
      case 'OPEN': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-500';
    if (rate >= 80) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] bg-black/90 backdrop-blur-md border border-white/20 rounded-lg p-4 shadow-2xl min-w-[320px] text-white font-mono text-xs">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Analytics Health
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-white/60 hover:text-white transition-colors"
          title="Close (or press Ctrl+Shift+A)"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2">
        {/* Circuit Breaker */}
        <div className="flex justify-between items-center">
          <span className="text-white/60">Circuit:</span>
          <span className={`font-bold ${getCircuitBreakerColor(metrics.circuitBreakerState)}`}>
            {metrics.circuitBreakerState}
          </span>
        </div>

        {/* Success Rate */}
        <div className="flex justify-between items-center">
          <span className="text-white/60">Success Rate:</span>
          <span className={`font-bold ${getSuccessRateColor(metrics.successRate)}`}>
            {metrics.successRate.toFixed(1)}%
          </span>
        </div>

        {/* Queue Size */}
        <div className="flex justify-between items-center">
          <span className="text-white/60">Queue:</span>
          <span className={metrics.queueSize > 50 ? 'text-yellow-500 font-bold' : ''}>
            {metrics.queueSize} events
          </span>
        </div>

        <div className="border-t border-white/10 my-2"></div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div>
            <div className="text-white/40">Total</div>
            <div className="font-bold">{metrics.totalEvents}</div>
          </div>
          <div>
            <div className="text-white/40">Success</div>
            <div className="font-bold text-green-500">{metrics.successfulEvents}</div>
          </div>
          <div>
            <div className="text-white/40">Failed</div>
            <div className="font-bold text-red-500">{metrics.failedEvents}</div>
          </div>
          <div>
            <div className="text-white/40">Retried</div>
            <div className="font-bold text-yellow-500">{metrics.retriedEvents}</div>
          </div>
        </div>

        <div className="border-t border-white/10 my-2"></div>

        {/* Status Indicator */}
        <div className="text-center">
          {metrics.circuitBreakerState === 'CLOSED' && metrics.successRate >= 95 && (
            <div className="text-green-500 text-xs">✓ System Healthy</div>
          )}
          {metrics.circuitBreakerState === 'HALF_OPEN' && (
            <div className="text-yellow-500 text-xs">⚠ Testing Recovery</div>
          )}
          {metrics.circuitBreakerState === 'OPEN' && (
            <div className="text-red-500 text-xs">✗ Circuit Open</div>
          )}
          {metrics.queueSize > 50 && (
            <div className="text-yellow-500 text-xs mt-1">⚠ Large Queue</div>
          )}
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-white/10 text-[10px] text-white/40 text-center">
        Press Ctrl+Shift+A to toggle
      </div>
    </div>
  );
}
