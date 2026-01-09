/**
 * BURN PREVENTION INITIALIZER
 * 
 * This component initializes the burn prevention system at app startup.
 * It runs once at the root level and makes the entire application aware of resource usage.
 */

'use client';

import { useEffect } from 'react';
import { burnPreventionCore } from '@/lib/burnPrevention';
import { integrateSmartPolling } from '@/lib/burnPrevention/adapters/smartPollingAdapter';

export default function BurnPreventionInitializer() {
  useEffect(() => {
    // Initialize the core system (happens automatically in constructor)
    // But we want to ensure it's loaded
    console.log('[BurnPrevention] Initializing system...');

    // Integrate with existing SmartPolling
    try {
      integrateSmartPolling();
    } catch (error) {
      console.error('[BurnPrevention] Failed to integrate SmartPolling:', error);
    }

    // Log initial metrics after a delay
    setTimeout(() => {
      const metrics = burnPreventionCore.getMetrics();
      console.log('[BurnPrevention] Initial metrics:', metrics);
    }, 3000);

    // Optional: Print report in development after 10 seconds
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        console.log('[BurnPrevention] Initial system report:');
        burnPreventionCore.printReport();
      }, 10000);
    }

    return () => {
      // Cleanup if needed
    };
  }, []);

  // This component doesn't render anything
  return null;
}
