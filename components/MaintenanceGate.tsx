/**
 * Maintenance Gate Component - Pure API-Sync Blocking
 * BLOCKS portfolio rendering until maintenance check completes
 * If maintenance ON: redirect to /maintenance
 * If maintenance OFF: allow portfolio to render
 * NO cookies, NO localStorage - pure API sync
 * 
 * Pattern: Mirrors BanGate.tsx exactly
 */

"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const hasChecked = useRef(false);

  // Skip maintenance check for these paths
  const shouldSkipGate = 
    pathname?.startsWith("/admin") || 
    pathname?.startsWith("/banned") ||
    pathname?.startsWith("/maintenance");

  useEffect(() => {
    // Skip check for admin/banned/maintenance pages
    if (shouldSkipGate) {
      setIsChecking(false);
      return;
    }

    // Prevent duplicate checks
    if (hasChecked.current) return;
    hasChecked.current = true;

    async function checkMaintenanceStatus() {
      try {
        const response = await fetch('/api/maintenance/status', {
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
  }, [pathname, router, shouldSkipGate]);

  // While checking, show loading state (prevents flash)
  if (isChecking && !shouldSkipGate) {
    return (
      <div className="fixed inset-0 bg-black-100 flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white text-sm opacity-70">Loading...</p>
        </div>
      </div>
    );
  }

  // Maintenance check passed - render children
  return <>{children}</>;
}
