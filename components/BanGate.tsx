/**
 * Ban Gate Component - NON-BLOCKING
 * Uses cached identity from BubbleSessionContext (0 duplicate API calls)
 * 
 * Portfolio renders IMMEDIATELY while verification runs in background.
 * If banned → atomic redirect to /banned page.
 * Server-side middleware (proxy.ts) handles first-layer IP ban check.
 * 
 * Security maintained:
 * - Server-side IP ban check in middleware (blocks before render)
 * - Real-time ban monitoring via BanMonitor
 * - Background identity check via BubbleSessionContext
 * - Fail-safe redirect logic
 */

"use client";

import { useEffect, useRef, useMemo, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useBubbleSession } from "@/contexts/BubbleSessionContext";

function BanGateInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { identity, loading } = useBubbleSession();
  
  const isRedirecting = useRef(false);
  const hasClearedCache = useRef(false);
  
  // CRITICAL: Compute shouldSkipGate FIRST, before any checks
  const shouldSkipGate = useMemo(() => {
    // Skip for admin, banned, maintenance, policy pages, and 404 pages
    return pathname?.startsWith("/admin") || 
           pathname?.startsWith("/banned") || 
           pathname?.startsWith("/maintenance") ||
           pathname?.startsWith("/abuse-policy") ||
           pathname?.startsWith("/privacy") ||
           pathname?.startsWith("/terms") ||
           pathname?.startsWith("/cookies") ||
           !pathname || // 404 - no pathname
           pathname === "/_not-found"; // Next.js internal 404 route
  }, [pathname]);

  useEffect(() => {
    // Check for unban redirect parameter first
    const unbanRedirect = searchParams?.get('unbanRedirect');
    if (unbanRedirect === 'true' && !hasClearedCache.current) {
      console.log('[Ban Gate] 🔄 Unban detected - Firestore real-time listener will sync automatically');
      hasClearedCache.current = true;
      
      // Clean URL by removing unbanRedirect and _t parameters
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('unbanRedirect');
        url.searchParams.delete('_t');
        window.history.replaceState({}, '', url.pathname + url.search);
        console.log('[Ban Gate] ✨ Cleaned URL parameters');
      }
      // No cache clearing needed - BubbleSessionContext uses real-time Firestore listeners
      // and will automatically update when ban status changes on the server
    }

    // IMMEDIATE SKIP: Admin, banned, and maintenance pages bypass completely
    if (shouldSkipGate) {
      return;
    }

    // Wait for BubbleSessionContext to finish loading
    if (loading) {
      return;
    }

    // Check if banned (from BubbleSessionContext - already fetched)
    if (identity?.banned && !isRedirecting.current) {
      console.log('[Ban Gate] ⛔ BANNED VISITOR DETECTED (from context cache)');
      isRedirecting.current = true;
      
      const params = new URLSearchParams({
        reason: identity.banReason || 'Security Violation',
        category: identity.banCategory || 'normal',
        banType: identity.banType || 'permanent',
        timestamp: new Date().toISOString(),
      });
      
      router.replace(`/banned?${params.toString()}`);
      return;
    }

    // Not banned - allow through
    if (!loading) {
      console.log('[Ban Gate] ✅ NOT BANNED - Allowing access (0 duplicate Firebase reads!)');
    }
  }, [pathname, router, shouldSkipGate, loading, identity, searchParams]);

  // NON-BLOCKING: Always render children immediately.
  // Verification runs in background via useEffect above.
  // If banned, useEffect triggers atomic redirect to /banned.
  return <>{children}</>;
}

// Wrapper component with Suspense boundary for useSearchParams()
export default function BanGate({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<>{children}</>}>
      <BanGateInner>{children}</BanGateInner>
    </Suspense>
  );
}
