/**
 * BURN PREVENTION DASHBOARD
 * 
 * Admin component that shows real-time burn prevention metrics.
 * Displays system mode, savings, and active controls.
 */

'use client';

import { useEffect, useState } from 'react';
import { burnPreventionCore } from '@/lib/burnPrevention';
import type { BurnPreventionMetrics } from '@/lib/burnPrevention';

export default function BurnPreventionDashboard() {
  const [metrics, setMetrics] = useState<BurnPreventionMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Update metrics every 10 seconds
    const updateMetrics = () => {
      const m = burnPreventionCore.getMetrics();
      setMetrics(m);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 10000);

    // Listen for keyboard shortcut (Ctrl+Shift+B) to toggle visibility
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'B') {
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

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'active': return 'text-green-400';
      case 'idle': return 'text-yellow-400';
      case 'sleep': return 'text-orange-400';
      case 'deep_sleep': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'active': return '⚡';
      case 'idle': return '💤';
      case 'sleep': return '😴';
      case 'deep_sleep': return '🌙';
      default: return '❓';
    }
  };

  const getBurnRateColor = (rate: string) => {
    switch (rate) {
      case 'minimal': return 'text-green-500';
      case 'low': return 'text-blue-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const savingsColor = metrics.estimatedSavings > 50 ? 'text-green-500' : 
                       metrics.estimatedSavings > 20 ? 'text-yellow-500' : 
                       'text-gray-400';

  return (
    <div className="fixed bottom-20 right-4 z-[9999] bg-black/95 backdrop-blur-md border border-white/20 rounded-lg p-4 shadow-2xl min-w-[350px] text-white font-mono text-xs">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <span className="text-purple-400">🧠</span>
          Burn Prevention
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-white/60 hover:text-white transition-colors"
          title="Close (or press Ctrl+Shift+B)"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3">
        {/* System Mode */}
        <div className="bg-white/5 rounded p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/60">System Mode:</span>
            <span className={`font-bold flex items-center gap-1 ${getModeColor(metrics.mode)}`}>
              <span>{getModeIcon(metrics.mode)}</span>
              {metrics.mode.toUpperCase().replace('_', ' ')}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-white/60">Burn Rate:</span>
            <span className={`font-bold ${getBurnRateColor(metrics.burnRate)}`}>
              {metrics.burnRate.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Savings */}
        <div className="bg-white/5 rounded p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/60">Estimated Savings:</span>
            <span className={`font-bold text-lg ${savingsColor}`}>
              {metrics.estimatedSavings}%
            </span>
          </div>
          
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                metrics.estimatedSavings > 50 ? 'bg-green-500' :
                metrics.estimatedSavings > 20 ? 'bg-yellow-500' :
                'bg-gray-500'
              }`}
              style={{ width: `${metrics.estimatedSavings}%` }}
            />
          </div>
        </div>

        {/* Execution Stats */}
        <div className="bg-white/5 rounded p-3">
          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <div>
              <div className="text-white/40">Active</div>
              <div className="font-bold text-green-400">{metrics.activeExecutions}</div>
            </div>
            <div>
              <div className="text-white/40">Throttled</div>
              <div className="font-bold text-yellow-400">{metrics.throttledExecutions}</div>
            </div>
            <div>
              <div className="text-white/40">Paused</div>
              <div className="font-bold text-blue-400">{metrics.pausedExecutions}</div>
            </div>
          </div>
        </div>

        {/* Uptime */}
        <div className="text-center text-white/40 text-[10px]">
          Uptime: {Math.floor(metrics.uptimeSeconds / 60)}m {metrics.uptimeSeconds % 60}s
        </div>

        {/* Status Messages */}
        {metrics.mode === 'deep_sleep' && (
          <div className="bg-blue-500/20 border border-blue-500/30 rounded p-2 text-blue-300 text-[10px]">
            🌙 Deep sleep active - Maximum resource conservation
          </div>
        )}

        {metrics.estimatedSavings > 60 && (
          <div className="bg-green-500/20 border border-green-500/30 rounded p-2 text-green-300 text-[10px]">
            💰 High savings mode - Protecting owner resources
          </div>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-white/10">
        <button
          onClick={() => {
            burnPreventionCore.printReport();
            alert('Full report logged to console!');
          }}
          className="w-full text-center text-[10px] text-purple-400 hover:text-purple-300 transition-colors"
        >
          📊 View Full Report (Console)
        </button>
      </div>

      <div className="mt-2 text-[10px] text-white/40 text-center">
        Press Ctrl+Shift+B to toggle
      </div>
    </div>
  );
}
