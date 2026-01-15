/**
 * Crash Reporting Initializer
 * 
 * Client component that safely initializes crash reporting system
 * during the React lifecycle (useEffect), not at module-level.
 * 
 * This component initializes:
 * - Crash delivery system
 * - Crash reporter debug tools (dev only)
 * 
 * TURBOPACK-SAFE: Proper client boundary with no build-time side effects
 */

'use client';

import { useEffect } from 'react';
import { initializeCrashDelivery } from '@/crash-report-mechanism/lib/crashDelivery';
import { initializeCrashReporterDebugTools } from '@/crash-report-mechanism/lib/crashReporter';

export default function CrashReportingInitializer() {
  useEffect(() => {
    // Initialize crash delivery system
    initializeCrashDelivery();
    
    // Initialize debug tools (dev only)
    initializeCrashReporterDebugTools();
  }, []);

  // This component renders nothing
  return null;
}
