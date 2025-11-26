/**
 * Analytics System Test Script
 * Run this to verify the reliability layer works correctly
 * 
 * Usage: Add this component temporarily to your page and check console
 */

"use client";

import { useEffect, useState } from "react";
import { getAnalyticsReliability } from "@/lib/analyticsReliability";

export default function AnalyticsSystemTest() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const log = (message: string) => {
    console.log(`[Analytics Test] ${message}`);
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      const analytics = getAnalyticsReliability();
      
      // Test 1: Single event
      log("Test 1: Tracking single event...");
      await analytics.trackEvent("test_event_1", { test: true, value: 1 });
      log("✓ Single event tracked");
      
      // Wait for flush
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Test 2: Batch events
      log("Test 2: Tracking batch of events...");
      for (let i = 0; i < 5; i++) {
        await analytics.trackEvent(`test_event_${i + 2}`, { 
          test: true, 
          batch: i + 1,
          timestamp: Date.now() 
        });
      }
      log("✓ Batch events tracked");
      
      // Wait for flush
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test 3: Check health
      log("Test 3: Checking system health...");
      const health = analytics.getHealthMetrics();
      log(`✓ Health check complete:`);
      log(`  - Total Events: ${health.totalEvents}`);
      log(`  - Success Rate: ${health.successRate.toFixed(1)}%`);
      log(`  - Queue Size: ${health.queueSize}`);
      log(`  - Circuit Breaker: ${health.circuitBreakerState}`);
      
      // Test 4: Rapid fire (stress test)
      log("Test 4: Stress test - 20 rapid events...");
      const startTime = Date.now();
      for (let i = 0; i < 20; i++) {
        analytics.trackEvent("stress_test", { 
          index: i,
          timestamp: Date.now()
        });
      }
      const elapsedMs = Date.now() - startTime;
      log(`✓ 20 events queued in ${elapsedMs}ms`);
      
      // Wait for flush
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Final health check
      log("Test 5: Final health check...");
      const finalHealth = analytics.getHealthMetrics();
      log(`✓ Final status:`);
      log(`  - Total: ${finalHealth.totalEvents}`);
      log(`  - Success: ${finalHealth.successfulEvents}`);
      log(`  - Failed: ${finalHealth.failedEvents}`);
      log(`  - Queued: ${finalHealth.queueSize}`);
      log(`  - Success Rate: ${finalHealth.successRate.toFixed(1)}%`);
      
      if (finalHealth.successRate >= 95) {
        log("🎉 ALL TESTS PASSED - System is healthy!");
      } else if (finalHealth.successRate >= 80) {
        log("⚠️ Tests passed with warnings - Some events failed");
      } else {
        log("❌ TESTS FAILED - System is unhealthy");
      }
      
    } catch (error) {
      log(`❌ Test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    // Auto-run tests on mount
    runTests();
  }, []);

  return (
    <div className="fixed top-4 left-4 z-[9999] bg-white dark:bg-black border-2 border-gray-300 dark:border-gray-700 rounded-lg p-4 shadow-2xl max-w-md max-h-[500px] overflow-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-lg">Analytics System Test</h3>
        <button
          onClick={runTests}
          disabled={isRunning}
          className={`px-3 py-1 rounded text-sm font-medium ${
            isRunning 
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isRunning ? 'Running...' : 'Run Again'}
        </button>
      </div>
      
      <div className="space-y-1 font-mono text-xs">
        {testResults.length === 0 ? (
          <div className="text-gray-500 italic">No results yet...</div>
        ) : (
          testResults.map((result, i) => (
            <div 
              key={i} 
              className={`${
                result.includes('✓') ? 'text-green-600 dark:text-green-400' :
                result.includes('❌') ? 'text-red-600 dark:text-red-400' :
                result.includes('⚠️') ? 'text-yellow-600 dark:text-yellow-400' :
                result.includes('🎉') ? 'text-blue-600 dark:text-blue-400 font-bold' :
                'text-gray-700 dark:text-gray-300'
              }`}
            >
              {result}
            </div>
          ))
        )}
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-300 dark:border-gray-700 text-xs text-gray-500">
        <div>Check browser console for detailed logs</div>
        <div>Press Ctrl+Shift+A for health monitor</div>
      </div>
    </div>
  );
}
