/**
 * Ban Checker Component
 * Server-synced real-time monitoring for mid-session bans
 * NO client storage - pure API calls
 * NO initial check - proxy.ts handles first load
 */

"use client";

import { useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";

const BAN_CHECK_INTERVAL = 30000; // Check every 30 seconds

export default function BanChecker() {
  const pathname = usePathname();
  const checkInProgress = useRef<boolean>(false);

  const checkBanStatus = useCallback(async () => {
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
      const response = await fetch("/api/visitor-analytics/check-ban", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.banned === true) {
          console.log("[Ban Check] ⛔ Banned during session - redirecting");
          
          // Silent redirect - proxy will handle display
          window.location.href = "/";
          return;
        }
      }
    } catch (error) {
      console.error("[Ban Check] Error:", error);
    } finally {
      checkInProgress.current = false;
    }
  }, [pathname]);

  // Periodic polling ONLY - no initial check, no toast, no storage
  useEffect(() => {
    // Don't poll on admin or banned pages
    if (pathname?.startsWith("/admin") || pathname?.startsWith("/banned")) {
      return;
    }

    const interval = setInterval(() => {
      checkBanStatus();
    }, BAN_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [pathname, checkBanStatus]);

  return null;
}
