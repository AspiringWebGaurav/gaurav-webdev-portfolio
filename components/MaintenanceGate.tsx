/**
 * Maintenance Gate Component - Pure API-Sync Blocking
 * BLOCKS portfolio rendering until maintenance check completes
 * If maintenance ON: redirect to /maintenance
 * If maintenance OFF: allow portfolio to render
 * NO cookies, NO localStorage - pure API sync
 * Shows skeleton loader during check
 * 
 * Pattern: Mirrors BanGate.tsx exactly
 */

"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import MaintenanceGateSkeleton from "./skeletons/sections/MaintenanceGateSkeleton";
import { isProduction } from "@/lib/environmentUtils";

export default function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
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
      setIsChecking(false);
      return;
    }
    
    // Skip blocking on localhost (banner will show status instead)
    if (isLocalhostEnv) {
      console.log('[Maintenance Gate] Localhost detected - skipping maintenance check');
      setIsChecking(false);
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
          setIsChecking(false);
          return;
        }

        const data = await response.json();

        if (data.enabled === true) {
          console.log('[Maintenance Gate] 🔧 MAINTENANCE MODE ON - Redirecting to /maintenance');
          router.replace('/maintenance');
          // Keep showing loading state during redirect
          return;
        } else {
          console.log('[Maintenance Gate] ✅ MAINTENANCE OFF - Allowing access');
          setIsChecking(false);
        }

      } catch (error) {
        console.error('[Maintenance Gate] Error during check:', error);
        // Fail open - allow access on errors
        setIsChecking(false);
      }
    }

    checkMaintenanceStatus();
  }, [pathname, router, shouldSkipGate, isLocalhostEnv]);

  // While checking, show skeleton loader (prevents flash)
  if (isChecking && !shouldSkipGate) {
    return <MaintenanceGateSkeleton />;
  }

  // Maintenance check passed - render children
  return <>{children}</>;
}
