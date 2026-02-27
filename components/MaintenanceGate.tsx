/**
 * Maintenance Gate Component - NON-BLOCKING
 * Checks maintenance status in background while portfolio renders.
 * If maintenance ON: atomic redirect to /maintenance
 * If maintenance OFF: do nothing (portfolio already visible)
 * NO cookies, NO localStorage - pure API sync
 * 
 * Pattern: Non-blocking background check
 */

"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isProduction } from "@/lib/environmentUtils";

export default function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const hasChecked = useRef(false);

  // Skip maintenance check for these paths
  const shouldSkipGate =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/banned") ||
    pathname?.startsWith("/maintenance") ||
    !pathname || // 404 - no pathname
    pathname === "/_not-found"; // Next.js internal 404 route

  // Skip maintenance blocking on localhost (banner will show status instead)
  const isLocalhostEnv = !isProduction();

  useEffect(() => {
    // Skip check for admin/banned/maintenance pages
    if (shouldSkipGate) {
      return;
    }

    // Skip blocking on localhost (banner will show status instead)
    if (isLocalhostEnv) {
      console.log('[Maintenance Gate] Localhost detected - skipping maintenance check');
      return;
    }

    // Prevent duplicate checks
    if (hasChecked.current) return;
    hasChecked.current = true;

    async function checkMaintenanceStatus() {
      try {
        // Add cache-busting timestamp to ensure fresh response
        const response = await fetch(`/api/maintenance/status?_t=${Date.now()}`, {
          method: 'GET',
          cache: 'no-store',
        });

        if (!response.ok) {
          console.error('[Maintenance Gate] API error - allowing access (fail-open)');
          return;
        }

        const data = await response.json();

        if (data.enabled === true) {
          console.log('[Maintenance Gate] 🔧 MAINTENANCE MODE ON - Redirecting to /maintenance');
          router.replace('/maintenance');
        } else {
          console.log('[Maintenance Gate] ✅ MAINTENANCE OFF - Allowing access');
        }

      } catch (error) {
        console.error('[Maintenance Gate] Error during check:', error);
        // Fail open - allow access on errors
      }
    }

    checkMaintenanceStatus();
  }, [pathname, router, shouldSkipGate, isLocalhostEnv]);

  // NON-BLOCKING: Always render children immediately.
  // Maintenance check runs in background. If enabled, atomic redirect fires.
  return <>{children}</>;
}
