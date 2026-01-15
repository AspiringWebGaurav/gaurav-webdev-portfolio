/**
 * Abuse Policy Monitor Component
 * 
 * Monitors abuse policy state changes and redirects if needed.
 * Complements AbusePolicyGate for runtime state changes.
 * 
 * Follows existing monitor pattern from BanMonitor, MaintenanceMonitor, SuspensionMonitor.
 */

"use client";

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAbusePolicyStatus } from '@/contexts/AbusePolicyContext';

export default function AbusePolicyMonitor() {
  const pathname = usePathname();
  const router = useRouter();
  const { isActive } = useAbusePolicyStatus();
  const previousState = useRef<boolean>(false);

  // Skip monitoring for bypass paths
  const shouldSkipMonitoring = 
    pathname?.startsWith('/abuse-policy-active') ||
    pathname?.startsWith('/admin/abuse-policy') ||
    pathname?.startsWith('/banned') ||
    pathname?.startsWith('/maintenance') ||
    pathname?.startsWith('/suspnd_srv_temp_');

  useEffect(() => {
    if (shouldSkipMonitoring) return;

    // Detect state change from inactive to active (mid-session activation)
    if (!previousState.current && isActive) {
      console.log('[Abuse Policy Monitor] ⛔ Abuse Policy activated mid-session');
      
      // Only redirect if on protected paths
      if (pathname?.startsWith('/admin')) {
        router.replace('/abuse-policy-active');
      }
    }

    previousState.current = isActive;
  }, [isActive, pathname, router, shouldSkipMonitoring]);

  return null; // Monitor only, no UI
}
