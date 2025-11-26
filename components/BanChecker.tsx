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

const FALLBACK_CHECK_INTERVAL = 60000; // Fallback polling every 60 seconds
const REDIRECT_DELAY = 1000; // 1 second delay before redirect

export default function BanChecker() {
  const pathname = usePathname();
  const checkInProgress = useRef<boolean>(false);
  const lastBanStatus = useRef<boolean>(false);
  const redirectTimer = useRef<NodeJS.Timeout | null>(null);

  /**
   * Handle ban status change from real-time listener
   */
  const handleBanStatusChange = useCallback((status: { banned: boolean; banReason?: string; banCategory?: string }) => {
    // Don't check on admin or banned pages
    if (pathname?.startsWith("/admin") || pathname?.startsWith("/banned")) {
      return;
    }

    const wasBanned = lastBanStatus.current;
    const isBanned = status.banned === true;

    // Only act if status changed from not-banned to banned
    if (!wasBanned && isBanned) {
      console.log("[Ban Checker] ⛔ User banned during session - redirecting", {
        reason: status.banReason,
        category: status.banCategory,
      });

      // Show toast notification
      showToast.error(
        status.banReason || "Security Violation",
        "Access Restricted",
        { autoClose: 3000 }
      );

      // Delayed redirect to banned page with query params
      redirectTimer.current = setTimeout(() => {
        const params = new URLSearchParams({
          reason: status.banReason || "Security Violation",
          category: status.banCategory || "normal",
          timestamp: new Date().toISOString(),
        });
        window.location.href = `/banned?${params.toString()}`;
      }, REDIRECT_DELAY);
    }

    lastBanStatus.current = isBanned;
  }, [pathname]);

  /**
   * Handle real-time listener errors
   */
  const handleListenerError = useCallback((error: Error) => {
    console.error("[Ban Checker] Real-time listener error:", error);
    // Fall back to polling if real-time fails
  }, []);

  /**
   * Fallback polling check (in case real-time fails)
   */
  const fallbackBanCheck = useCallback(async () => {
    // Don't check on admin or banned pages
    if (pathname?.startsWith("/admin") || pathname?.startsWith("/banned")) {
      return;
    }

    // Prevent duplicate simultaneous checks
    if (checkInProgress.current) {
      return;
    }

    checkInProgress.current = true;
    
    try {
      // Get visitor mask from ban status manager
      const mask = banStatusManager.getMask();
      
      if (!mask) {
        console.warn('[Ban Checker] No mask available for fallback check');
        return;
      }
      
      const response = await fetch("/api/visitor-analytics/check-ban", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mask }), // Send mask to avoid dual identity
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.banned === true && !lastBanStatus.current) {
          console.log("[Ban Checker] ⛔ Fallback check detected ban - redirecting");
          
          showToast.error(
            data.banInfo?.reason || "Security Violation",
            "Access Restricted",
            { autoClose: 3000 }
          );

          setTimeout(() => {
            const params = new URLSearchParams({
              reason: data.banInfo?.reason || "Security Violation",
              category: data.banInfo?.category || "normal",
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
  }, [pathname]);

  /**
   * Setup real-time listener and fallback polling
   */
  useEffect(() => {
    // Don't monitor on admin or banned pages
    if (pathname?.startsWith("/admin") || pathname?.startsWith("/banned")) {
      return;
    }

    console.log("[Ban Checker] Setting up real-time ban monitoring");

    let unsubscribe: (() => void) | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;
    let mounted = true;

    // Async setup function
    const setupMonitoring = async () => {
      try {
        // Initialize and subscribe (both async now)
        if (!banStatusManager.isReady()) {
          await banStatusManager.initialize();
        }

        if (!mounted) return; // Component unmounted during init

        // Subscribe to real-time updates
        unsubscribe = await banStatusManager.subscribe(
          "ban-checker",
          handleBanStatusChange,
          handleListenerError
        );

        // Setup fallback polling as backup
        fallbackInterval = setInterval(fallbackBanCheck, FALLBACK_CHECK_INTERVAL);
      } catch (error) {
        console.error("[Ban Checker] Setup error:", error);
        
        if (!mounted) return;

        // Fall back to polling only if real-time setup fails
        fallbackInterval = setInterval(fallbackBanCheck, FALLBACK_CHECK_INTERVAL);
      }
    };

    // Start setup
    setupMonitoring();

    // Cleanup function
    return () => {
      mounted = false;
      console.log("[Ban Checker] Cleaning up ban monitoring");
      
      if (unsubscribe) {
        unsubscribe();
      }
      
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
      
      if (redirectTimer.current) {
        clearTimeout(redirectTimer.current);
      }
    };
  }, [pathname, handleBanStatusChange, handleListenerError, fallbackBanCheck]);

  return null;
}
