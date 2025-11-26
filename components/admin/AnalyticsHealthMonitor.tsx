'use client';

/**
 * Analytics Health Monitor
 * Real-time monitoring dashboard for analytics reliability layer
 * Shows queue status, success rates, priority events, and circuit breaker state
 */

import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle, AlertCircle, Clock, Zap, Shield, TrendingUp } from 'lucide-react';
import { getAnalyticsReliability } from '@/lib/analyticsReliability';

export default function AnalyticsHealthMonitor() {
  const [metrics, setMetrics] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Update metrics every 2 seconds
    const updateMetrics = () => {
      const analytics = getAnalyticsReliability();
      const health = analytics.getHealthMetrics();
      setMetrics(health);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 2000);

    return () => clearInterval(interval);
  }, []);

  if (!metrics) {
    return null;
  }

  const getCircuitBreakerColor = (state: string) => {
    switch (state) {
      case 'CLOSED': return 'text-green-600 bg-green-50';
      case 'HALF_OPEN': return 'text-yellow-600 bg-yellow-50';
      case 'OPEN': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCircuitBreakerIcon = (state: string) => {
    switch (state) {
      case 'CLOSED': return <CheckCircle className="w-4 h-4" />;
      case 'HALF_OPEN': return <Clock className="w-4 h-4" />;
      case 'OPEN': return <AlertCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const successRate = metrics.successRate.toFixed(1);
  const isHealthy = metrics.successRate >= 95 && metrics.circuitBreakerState === 'CLOSED';

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      {/* Header */}
      <div
        className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 cursor-pointer hover:from-blue-100 hover:to-purple-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isHealthy ? 'bg-green-100' : 'bg-yellow-100'}`}>
              {isHealthy ? (
                <Activity className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Analytics Health Monitor</h3>
              <p className="text-sm text-gray-600">
                {isHealthy ? 'System Operating Normally' : 'System Under Stress'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Quick Stats */}
            <div className="text-right hidden sm:block">
              <div className="text-2xl font-bold text-gray-800">{successRate}%</div>
              <div className="text-xs text-gray-500">Success Rate</div>
            </div>
            
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getCircuitBreakerColor(metrics.circuitBreakerState)}`}>
              <div className="flex items-center gap-1">
                {getCircuitBreakerIcon(metrics.circuitBreakerState)}
                <span>{metrics.circuitBreakerState}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Events */}
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-900">Total Events</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">{metrics.totalEvents}</div>
            </div>

            {/* Successful */}
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium text-green-900">Successful</span>
              </div>
              <div className="text-2xl font-bold text-green-900">{metrics.successfulEvents}</div>
              <div className="text-xs text-green-600">{successRate}%</div>
            </div>

            {/* Failed */}
            <div className="bg-red-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-xs font-medium text-red-900">Failed</span>
              </div>
              <div className="text-2xl font-bold text-red-900">{metrics.failedEvents}</div>
            </div>

            {/* Queue Size */}
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-medium text-purple-900">In Queue</span>
              </div>
              <div className="text-2xl font-bold text-purple-900">{metrics.queueSize}</div>
            </div>
          </div>

          {/* Priority Events */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-yellow-600" />
              <h4 className="font-semibold text-gray-800">Priority Queue Status</h4>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {/* High Priority Events */}
              <div className="bg-yellow-50 rounded-lg p-3">
                <div className="text-xs font-medium text-yellow-900 mb-1">High Priority Total</div>
                <div className="text-xl font-bold text-yellow-900">{metrics.highPriorityEvents}</div>
                <div className="text-xs text-yellow-600 mt-1">
                  Success: {metrics.highPrioritySuccessRate.toFixed(1)}%
                </div>
              </div>

              {/* High Priority in Queue */}
              <div className="bg-orange-50 rounded-lg p-3">
                <div className="text-xs font-medium text-orange-900 mb-1">High Priority Queued</div>
                <div className="text-xl font-bold text-orange-900">{metrics.highPriorityInQueue}</div>
                <div className="text-xs text-orange-600 mt-1">
                  {metrics.queueSize > 0 
                    ? `${((metrics.highPriorityInQueue / metrics.queueSize) * 100).toFixed(0)}% of queue`
                    : 'Queue empty'}
                </div>
              </div>

              {/* Normal Priority in Queue */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs font-medium text-gray-900 mb-1">Normal Priority Queued</div>
                <div className="text-xl font-bold text-gray-900">{metrics.normalPriorityInQueue}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {metrics.queueSize > 0 
                    ? `${((metrics.normalPriorityInQueue / metrics.queueSize) * 100).toFixed(0)}% of queue`
                    : 'Queue empty'}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <h4 className="font-semibold text-gray-800">System Performance</h4>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs font-medium text-gray-600 mb-1">Retried Events</div>
                <div className="text-lg font-bold text-gray-900">{metrics.retriedEvents}</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs font-medium text-gray-600 mb-1">Validation Errors</div>
                <div className="text-lg font-bold text-gray-900">{metrics.validationErrors}</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs font-medium text-gray-600 mb-1">Duplicates Blocked</div>
                <div className="text-lg font-bold text-gray-900">{metrics.duplicatesBlocked}</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs font-medium text-gray-600 mb-1">Validation Rate</div>
                <div className="text-lg font-bold text-gray-900">{metrics.validationRate.toFixed(1)}%</div>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          <div className="border-t pt-4">
            <div className="space-y-2">
              {/* Circuit Breaker Status */}
              <div className={`flex items-center gap-2 p-3 rounded-lg ${getCircuitBreakerColor(metrics.circuitBreakerState)}`}>
                <Shield className="w-4 h-4" />
                <div className="flex-1">
                  <div className="font-medium">Circuit Breaker: {metrics.circuitBreakerState}</div>
                  <div className="text-xs opacity-75">
                    {metrics.circuitBreakerState === 'CLOSED' && 'System accepting all requests'}
                    {metrics.circuitBreakerState === 'HALF_OPEN' && 'Testing system recovery'}
                    {metrics.circuitBreakerState === 'OPEN' && 'System protecting against failures'}
                  </div>
                </div>
              </div>

              {/* High Priority Alert */}
              {metrics.highPriorityInQueue > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <Zap className="w-4 h-4 text-yellow-600" />
                  <div className="flex-1">
                    <div className="font-medium text-yellow-900">
                      {metrics.highPriorityInQueue} high priority event{metrics.highPriorityInQueue > 1 ? 's' : ''} pending
                    </div>
                    <div className="text-xs text-yellow-700">
                      These events will be sent first (resume downloads & form submissions)
                    </div>
                  </div>
                </div>
              )}

              {/* Success Rate Warning */}
              {metrics.successRate < 95 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-50 border border-orange-200">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <div className="flex-1">
                    <div className="font-medium text-orange-900">Success rate below 95%</div>
                    <div className="text-xs text-orange-700">
                      System is retrying failed events automatically
                    </div>
                  </div>
                </div>
              )}

              {/* All Good */}
              {isHealthy && metrics.queueSize === 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <div className="flex-1">
                    <div className="font-medium text-green-900">All systems operational</div>
                    <div className="text-xs text-green-700">
                      Analytics tracking is working perfectly
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
