/**
 * Ban Gate Component - Fingerprint-Based Blocking
 * BLOCKS portfolio rendering until ban check completes
 * If banned: redirect to /banned ONLY ONCE
 * If not banned: allow portfolio to render
 * 
 * Uses fingerprint-based identification for ban detection.
 * NO cookies, NO localStorage - pure API-based identity resolution
 * 
 * ROBUST: Uses session-level tracking to prevent infinite loops
 */

"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { generateDeviceFingerprint } from "@/lib/deviceFingerprint";
import { clientIdentifyVisitorEnhanced, clientCheckBanEnhanced } from "@/lib/uuid-sync/adapters/clientAdapter";

// Session-level flag to prevent re-checking across remounts
// This survives component remounts but resets on page refresh
let sessionBanCheckComplete = false;
let sessionBanCheckResult: { banned: boolean; reason?: string; category?: string } | null = null;

export default function BanGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  // CRITICAL: Compute shouldSkipGate FIRST, before any state
  const shouldSkipGate = useMemo(() => {
    return pathname?.startsWith("/admin") || 
           pathname?.startsWith("/banned") || 
           pathname?.startsWith("/maintenance");
  }, [pathname]);
  
  // Initialize state based on skip condition or session cache
  const [isChecking, setIsChecking] = useState(() => {
    // If we should skip, don't show loading
    if (shouldSkipGate) return false;
    // If session check already completed, don't show loading
    if (sessionBanCheckComplete && !sessionBanCheckResult?.banned) return false;
    return true;
  });
  
  const hasChecked = useRef(false);
  const isRedirecting = useRef(false);

  useEffect(() => {
    // IMMEDIATE SKIP: Admin, banned, and maintenance pages bypass completely
    if (shouldSkipGate) {
      setIsChecking(false);
      return;
    }

    // SESSION CACHE CHECK: If we already checked this session, use cached result
    if (sessionBanCheckComplete) {
      if (sessionBanCheckResult?.banned && !isRedirecting.current) {
        // Session says banned but somehow we're not on banned page - redirect
        console.log('[Ban Gate] Session cache indicates banned - redirecting...');
        isRedirecting.current = true;
        const params = new URLSearchParams({
          reason: sessionBanCheckResult.reason || 'Security Violation',
          category: sessionBanCheckResult.category || 'normal',
          timestamp: new Date().toISOString(),
        });
        router.replace(`/banned?${params.toString()}`);
        return;
      }
      // Already checked and not banned - allow through
      setIsChecking(false);
      return;
    }

    // COMPONENT LEVEL DUPLICATE CHECK
    if (hasChecked.current) {
      return;
    }
    hasChecked.current = true;

    async function checkBanStatus() {
      try {
        // STEP 1: Get device fingerprint (primary)
        const fingerprint = generateDeviceFingerprint();
        
        if (!fingerprint || fingerprint === 'server-side') {
          console.warn('[Ban Gate] No fingerprint - allowing access (fail-open)');
          sessionBanCheckComplete = true;
          sessionBanCheckResult = { banned: false };
          setIsChecking(false);
          return;
        }

        // STEP 2: Enhanced identification with multi-signal fingerprinting
        console.log('[Ban Gate] 🔐 Starting enhanced identification...');
        const identity = await clientIdentifyVisitorEnhanced(fingerprint);
        
        // Check if banned during identification
        if (identity.banned) {
          console.log('[Ban Gate] ⛔ BANNED (during identification) - Signal:', identity.matchedSignal);
          sessionBanCheckComplete = true;
          sessionBanCheckResult = { 
            banned: true, 
            reason: identity.banReason, 
            category: identity.banCategory 
          };
          redirectToBanned(identity.banReason, identity.banCategory);
          return;
        }

        console.log('[Ban Gate] 📍 Identity resolved:', { 
          mask: identity.mask?.substring(0, 15), 
          matchedSignal: identity.matchedSignal,
          isNew: identity.isNewIdentity 
        });

        // STEP 3: Double-check ban status with fresh multi-signal check
        const banResult = await clientCheckBanEnhanced(fingerprint, identity.mask);
        
        if (banResult.banned) {
          console.log('[Ban Gate] ⛔ BANNED (double-check) - Signal:', banResult.matchedSignal);
          sessionBanCheckComplete = true;
          sessionBanCheckResult = { 
            banned: true, 
            reason: banResult.reason, 
            category: banResult.category 
          };
          redirectToBanned(banResult.reason, banResult.category);
          return;
        }

        console.log('[Ban Gate] ✅ NOT BANNED - Allowing portfolio access');
        sessionBanCheckComplete = true;
        sessionBanCheckResult = { banned: false };
        setIsChecking(false);

      } catch (error) {
        console.error('[Ban Gate] Error during ban check:', error);
        // Fail open - allow access on errors
        sessionBanCheckComplete = true;
        sessionBanCheckResult = { banned: false };
        setIsChecking(false);
      }
    }

    function redirectToBanned(reason?: string, category?: string) {
      if (isRedirecting.current) return; // Prevent duplicate redirects
      isRedirecting.current = true;
      
      const params = new URLSearchParams({
        reason: reason || 'Security Violation',
        category: category || 'normal',
        timestamp: new Date().toISOString(),
      });
      
      // Use window.location for hard redirect to ensure clean state
      window.location.replace(`/banned?${params.toString()}`);
    }

    checkBanStatus();
  }, [pathname, router, shouldSkipGate]);

  // RENDER LOGIC:
  // 1. Skip gate routes - render children immediately
  if (shouldSkipGate) {
    return <>{children}</>;
  }
  
  // 2. While checking - show loading state
  if (isChecking) {
    return (
      <div className="fixed inset-0 bg-black-100 flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white text-sm opacity-70">Verifying access...</p>
        </div>
      </div>
    );
  }

  // 3. Ban check passed - render portfolio
  return <>{children}</>;
}

// Export function to reset ban check (useful for testing/logout)
export function resetBanGateSession() {
  sessionBanCheckComplete = false;
  sessionBanCheckResult = null;
}
