/**
 * Ban Gate Component - Pure Server-Sync Blocking
 * BLOCKS portfolio rendering until ban check completes
 * If banned: redirect to /banned ONLY ONCE
 * If not banned: allow portfolio to render
 * NO cookies, NO localStorage - pure API sync
 */

"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { generateDeviceFingerprint } from "@/lib/deviceFingerprint";

export default function BanGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const hasChecked = useRef(false);

  // Check if we should skip ban gate
  const shouldSkipGate = pathname?.startsWith("/admin") || pathname?.startsWith("/banned");

  useEffect(() => {
    // Skip ban check for admin/banned pages
    if (shouldSkipGate) {
      setIsChecking(false);
      return;
    }

    // Prevent duplicate checks
    if (hasChecked.current) return;
    hasChecked.current = true;

    async function checkBanStatus() {
      try {
        // STEP 1: Get device fingerprint
        const fingerprint = generateDeviceFingerprint();
        
        if (!fingerprint || fingerprint === 'server-side') {
          console.warn('[Ban Gate] No fingerprint - allowing access (fail-open)');
          setIsChecking(false);
          return;
        }

        // STEP 2: Get or create visitor identity
        const identifyResponse = await fetch('/api/visitor-analytics/identify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fingerprint }),
          cache: 'no-store',
        });

        if (!identifyResponse.ok) {
          console.error('[Ban Gate] Identity check failed - allowing access (fail-open)');
          setIsChecking(false);
          return;
        }

        const { mask } = await identifyResponse.json();

        // STEP 3: Check ban status
        const banResponse = await fetch('/api/visitor-analytics/check-ban-realtime', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mask }),
          cache: 'no-store',
        });

        if (!banResponse.ok) {
          console.error('[Ban Gate] Ban check failed - allowing access (fail-open)');
          setIsChecking(false);
          return;
        }

        const banData = await banResponse.json();

        if (banData.banned === true) {
          console.log('[Ban Gate] ⛔ BANNED - Redirecting to /banned');
          
          const params = new URLSearchParams({
            reason: banData.banReason || 'Security Violation',
            category: banData.banCategory || 'normal',
            timestamp: new Date().toISOString(),
          });
          
          // Use router.replace to prevent back navigation
          router.replace(`/banned?${params.toString()}`);
          // Keep showing loading state during redirect
          return;
        } else {
          console.log('[Ban Gate] ✅ NOT BANNED - Allowing portfolio access');
          setIsChecking(false);
        }

      } catch (error) {
        console.error('[Ban Gate] Error during ban check:', error);
        // Fail open - allow access on errors
        setIsChecking(false);
      }
    }

    checkBanStatus();
  }, [pathname, router, shouldSkipGate]);

  // While checking, show loading state (prevents flash)
  if (isChecking && !shouldSkipGate) {
    return (
      <div className="fixed inset-0 bg-black-100 flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white text-sm opacity-70">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Ban check passed - render portfolio
  return <>{children}</>;
}
