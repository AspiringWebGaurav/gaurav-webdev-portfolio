/**
 * Ban Checker Component - Enterprise Level
 * Real-time ban status monitoring with Firebase listeners
 * Features:
 * - Real-time updates via Firebase listeners
 * - Automatic reconnection
 * - Fallback polling for redundancy
 * - Memory leak prevention
 */

"use client";

import { useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { banStatusManager } from "@/lib/banStatusManager";
import { showToast } from "@/lib/toast";
import { useBubbleSession } from "@/contexts/BubbleSessionContext";

const FALLBACK_CHECK_INTERVAL = 60000; // Fallback polling every 60 seconds
const REDIRECT_DELAY = 1000; // 1 second delay before redirect

export default function BanChecker() {
  const pathname = usePathname();
  const { visitorId: mask } = useBubbleSession();
  const checkInProgress = useRef<boolean>(false);
  const lastBanStatus = useRef<boolean>(false);
  const redirectTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Check if we should skip monitoring (admin or banned pages)
  const shouldSkip = pathname?.startsWith("/admin") || pathname?.startsWith("/banned");

  /**
   * Handle ban status change from real-time listener
   * Shows toast only for MID-SESSION bans (user was browsing, then got banned)
   */
  const handleBanStatusChange = useCallback((status: { banned: boolean; banReason?: string; banCategory?: string; banType?: string }) => {
    if (shouldSkip) return;

    const wasBanned = lastBanStatus.current;
    const isBanned = status.banned === true;

    if (!wasBanned && isBanned) {
      console.log("[Ban Checker] ⛔ REAL-TIME BAN DETECTED - User banned during active session", {
        reason: status.banReason,
        category: status.banCategory,
      });

      showToast.error(
        status.banReason || "Security Violation",
        "Access Restricted - You have been banned",
        { autoClose: 3000 }
      );

      redirectTimer.current = setTimeout(() => {
        const params = new URLSearchParams({
          reason: status.banReason || "Security Violation",
          category: status.banCategory || "normal",
          banType: status.banType || "permanent",
          timestamp: new Date().toISOString(),
        });
        window.location.href = `/banned?${params.toString()}`;
      }, REDIRECT_DELAY);
    }

    lastBanStatus.current = isBanned;
  }, [shouldSkip]);

  /**
   * Handle real-time listener errors
   */
  const handleListenerError = useCallback((error: Error) => {
    console.error("[Ban Checker] Real-time listener error:", error);
  }, []);

  /**
   * Initial ban check (called once after identity is created)
   * CRITICAL: For returning banned visitors, redirect IMMEDIATELY without toast
   */
  const initialBanCheck = useCallback(async () => {
    if (shouldSkip || !mask) return;

    try {
      console.log('[Ban Checker] 🔍 Initial ban check for mask:', mask);
      
      const response = await fetch("/api/visitor-analytics/check-ban-realtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mask }),
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.banned === true) {
          console.log("[Ban Checker] ⛔ BANNED VISITOR DETECTED - Immediate redirect");
          
          const params = new URLSearchParams({
            reason: data.banReason || "Security Violation",
            category: data.banCategory || "normal",
            banType: data.banType || "permanent",
            timestamp: new Date().toISOString(),
          });
          
          window.location.replace(`/banned?${params.toString()}`);
          return;
        } else {
          console.log('[Ban Checker] ✅ Initial check passed - visitor allowed');
        }
        
        lastBanStatus.current = data.banned === true;
      }
    } catch (error) {
      console.error('[Ban Checker] Initial check failed:', error);
    }
  }, [mask, shouldSkip]);

  /**
   * Fallback polling check (in case real-time fails)
   */
  const fallbackBanCheck = useCallback(async () => {
    if (shouldSkip || checkInProgress.current) return;

    checkInProgress.current = true;
    
    try {
      const currentMask = banStatusManager.getMask();
      if (!currentMask) {
        console.warn('[Ban Checker] No mask available for fallback check');
        return;
      }
      
      const response = await fetch("/api/visitor-analytics/check-ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mask: currentMask }),
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.banned === true && !lastBanStatus.current) {
          console.log("[Ban Checker] ⛔ Fallback check detected ban - redirecting");
          
          const reason = data.banInfo?.reason || "Security Violation";
          const category = data.banInfo?.category || "normal";
          
          showToast.error(reason, "Access Restricted", { autoClose: 3000 });

          setTimeout(() => {
            const params = new URLSearchParams({
              reason,
              category,
              banType: data.banType || "permanent",
              timestamp: data.banInfo?.timestamp || new Date().toISOString(),
            });
            window.location.href = `/banned?${params.toString()}`;
          }, REDIRECT_DELAY);
        }

        lastBanStatus.current = data.banned === true;
      }
    } catch (error) {
      console.error("[Ban Checker] Fallback check error:", error);
    } finally {
      checkInProgress.current = false;
    }
  }, [shouldSkip]);

  /**
   * Setup real-time listener and fallback polling
   */
  useEffect(() => {
    if (shouldSkip || !mask) {
      if (!mask && !shouldSkip) {
        console.log("[Ban Checker] Waiting for mask from BubbleSessionContext...");
      }
      return;
    }

    console.log("[Ban Checker] Setting up real-time ban monitoring with mask:", mask);
    initialBanCheck();

    let unsubscribe: (() => void) | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;
    let mounted = true;

    const setupMonitoring = async () => {
      try {
        if (!banStatusManager.isReady()) {
          await banStatusManager.initialize(mask);
        }

        if (!mounted) return;

        unsubscribe = await banStatusManager.subscribe(
          "ban-checker",
          handleBanStatusChange,
          handleListenerError
        );

        fallbackInterval = setInterval(fallbackBanCheck, FALLBACK_CHECK_INTERVAL);
      } catch (error) {
        console.error("[Ban Checker] Setup error:", error);
        if (!mounted) return;
        fallbackInterval = setInterval(fallbackBanCheck, FALLBACK_CHECK_INTERVAL);
      }
    };

    setupMonitoring();

    return () => {
      mounted = false;
      console.log("[Ban Checker] Cleaning up ban monitoring");
      if (unsubscribe) unsubscribe();
      if (fallbackInterval) clearInterval(fallbackInterval);
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, [shouldSkip, mask, handleBanStatusChange, handleListenerError, fallbackBanCheck, initialBanCheck]);

  // Don't render anything on admin or banned pages
  if (shouldSkip) return null;

  return null;
}
