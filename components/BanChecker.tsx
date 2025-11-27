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
  
  // Don't render BanChecker on admin or banned pages at all
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/banned")) {
    return null;
  }
  
  const { visitorId: mask } = useBubbleSession(); // Get mask from context
  const checkInProgress = useRef<boolean>(false);
  const lastBanStatus = useRef<boolean>(false);
  const redirectTimer = useRef<NodeJS.Timeout | null>(null);

  /**
   * Handle ban status change from real-time listener
   * Shows toast only for MID-SESSION bans (user was browsing, then got banned)
   */
  const handleBanStatusChange = useCallback((status: { banned: boolean; banReason?: string; banCategory?: string }) => {
    // Don't check on admin or banned pages
    if (pathname?.startsWith("/admin") || pathname?.startsWith("/banned")) {
      return;
    }

    const wasBanned = lastBanStatus.current;
    const isBanned = status.banned === true;

    // Only act if status changed from not-banned to banned (MID-SESSION ban)
    if (!wasBanned && isBanned) {
      console.log("[Ban Checker] ⛔ REAL-TIME BAN DETECTED - User banned during active session", {
        reason: status.banReason,
        category: status.banCategory,
      });

      // Show toast for mid-session bans (user was actively browsing)
      showToast.error(
        status.banReason || "Security Violation",
        "Access Restricted - You have been banned",
        { autoClose: 3000 }
      );

      // Delayed redirect to show toast
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
   * Initial ban check (called once after identity is created)
   * CRITICAL: For returning banned visitors, redirect IMMEDIATELY without toast
   */
  const initialBanCheck = useCallback(async () => {
    // Don't check on admin or banned pages
    if (pathname?.startsWith("/admin") || pathname?.startsWith("/banned")) {
      return;
    }

    if (!mask) {
      console.log('[Ban Checker] Waiting for mask from context...');
      return;
    }

    try {
      console.log('[Ban Checker] 🔍 Initial ban check for mask:', mask);
      
      const response = await fetch("/api/visitor-analytics/check-ban-realtime", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mask }),
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.banned === true) {
          console.log("[Ban Checker] ⛔ BANNED VISITOR DETECTED - Immediate redirect (no toast)");
          
          // IMMEDIATE redirect without toast for returning banned visitors
          // This ensures banned users never see homepage content
          const params = new URLSearchParams({
            reason: data.banReason || "Security Violation",
            category: data.banCategory || "normal",
            timestamp: new Date().toISOString(),
          });
          
          // Immediate redirect - no delay, no toast
          window.location.replace(`/banned?${params.toString()}`);
          return; // Stop execution
        } else {
          console.log('[Ban Checker] ✅ Initial check passed - visitor allowed');
        }
        
        lastBanStatus.current = data.banned === true;
      }
    } catch (error) {
      console.error('[Ban Checker] Initial check failed:', error);
    }
  }, [mask, pathname]);

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

    // Wait for mask from BubbleSessionContext before initializing
    if (!mask) {
      console.log("[Ban Checker] Waiting for mask from BubbleSessionContext...");
      return;
    }

    console.log("[Ban Checker] Setting up real-time ban monitoring with mask:", mask);

    // Perform initial ban check immediately
    initialBanCheck();

    let unsubscribe: (() => void) | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;
    let mounted = true;

    // Async setup function
    const setupMonitoring = async () => {
      try {
        // Initialize with mask from BubbleSessionContext (prevents duplicate identity creation)
        if (!banStatusManager.isReady()) {
          await banStatusManager.initialize(mask);
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
  }, [pathname, mask, handleBanStatusChange, handleListenerError, fallbackBanCheck, initialBanCheck]);

  return null;
}
