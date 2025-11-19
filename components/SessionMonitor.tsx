"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { showToast } from "@/lib/toast";
import { signOut } from "@/lib/auth";

interface SessionMonitorProps {
  enabled?: boolean;
  checkInterval?: number; // in milliseconds
  onSessionExpired?: () => void;
}

/**
 * Client-side session monitor that validates session with server
 * Runs periodically to ensure session is still valid
 * Only active in admin routes
 */
export function SessionMonitor({
  enabled = true,
  checkInterval = 5 * 60 * 1000, // Default: 5 minutes
  onSessionExpired,
}: SessionMonitorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const lastCheckRef = useRef<number>(0);
  const warningShownRef = useRef<boolean>(false);
  const isLoggingOutRef = useRef<boolean>(false);
  const [isAdminRoute, setIsAdminRoute] = useState(false);

  // Only run on admin routes (not login page)
  useEffect(() => {
    const adminRoute =
      pathname?.startsWith("/admin") && !pathname?.includes("/login");
    setIsAdminRoute(adminRoute);
  }, [pathname]);

  const checkSession = useCallback(async () => {
    // Don't check if already logging out or not on admin route
    if (isLoggingOutRef.current || !isAdminRoute) {
      return true;
    }

    try {
      const response = await fetch("/api/auth/session", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        // Prevent multiple logout attempts
        if (isLoggingOutRef.current) return false;
        isLoggingOutRef.current = true;

        // Session is invalid or expired
        await signOut();

        if (onSessionExpired) {
          onSessionExpired();
        } else {
          showToast.error("Your session has expired. Please log in again.", "Session Expired");
          router.push("/admin/login");
        }
        return false;
      }

      const data = await response.json();

      // Check if session is about to expire (within 30 minutes)
      if (data.expiresAt) {
        const timeUntilExpiry = data.expiresAt - Date.now();
        const thirtyMinutes = 30 * 60 * 1000;

        if (timeUntilExpiry < thirtyMinutes && !warningShownRef.current) {
          const minutesLeft = Math.floor(timeUntilExpiry / 60000);
          showToast.warning(
            `Your session will expire in ${minutesLeft} minutes. Please save your work.`,
            "Session Warning",
            { autoClose: 10000 }
          );
          warningShownRef.current = true;
        }
      }

      return true;
    } catch (error) {
      console.error("Session check failed:", error);
      return false;
    }
  }, [router, onSessionExpired, isAdminRoute]);

  useEffect(() => {
    // Only run if enabled and on admin routes
    if (!enabled || !isAdminRoute) return;

    // Initial check after a small delay to avoid race conditions
    const initialCheck = setTimeout(() => {
      checkSession();
    }, 1000);

    // Set up periodic checks
    const intervalId = setInterval(() => {
      const now = Date.now();
      // Avoid duplicate checks if tab was inactive
      if (now - lastCheckRef.current >= checkInterval) {
        lastCheckRef.current = now;
        checkSession();
      }
    }, checkInterval);

    // Check when page becomes visible again (user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !isLoggingOutRef.current) {
        const now = Date.now();
        // Only check if it's been a while since last check
        if (now - lastCheckRef.current >= 60000) {
          // 1 minute
          lastCheckRef.current = now;
          checkSession();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      clearTimeout(initialCheck);
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, checkInterval, checkSession, isAdminRoute]);

  return null; // This component doesn't render anything
}
