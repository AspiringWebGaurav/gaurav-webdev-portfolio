"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { ResumeGateModal } from "@/components/resume/ResumeGateModal";
import { ResumePaperView } from "@/components/resume/ResumePaperView";
import { ResumeSuspendedView } from "@/components/resume/ResumeSuspendedView";
import { DEFAULT_RESUME_DATA, RESUME_SESSION_TTL_MINUTES } from "@/lib/resume/constants";
import type { ResumeData } from "@/types/resume";

const AUTO_LOGOUT_MS = RESUME_SESSION_TTL_MINUTES * 60 * 1000; // 30 minutes

export default function ResumePage() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [portalStatus, setPortalStatus] = useState<"active" | "suspended" | "hired">("active");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [resumeData, setResumeData] = useState<ResumeData>(DEFAULT_RESUME_DATA);

  const expiresAtRef = useRef<number | null>(null);
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Invalidate session, purge verified data from memory, and re-lock
  const handleLogout = useCallback(async (isExpired = true) => {
    // 1. Purge data from local memory immediately (Anti-Tamper & Anti-Abuse)
    setResumeData(DEFAULT_RESUME_DATA);
    setIsUnlocked(false);
    if (isExpired) {
      setSessionExpired(true);
    }
    expiresAtRef.current = null;

    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }

    console.warn(
      `%c[Security Policy] Resume session expired (${RESUME_SESSION_TTL_MINUTES}-minute anti-abuse / anti-tamper window). In-memory verified data purged.`,
      "color: #DC2626; font-size: 12px; font-weight: bold; background: #FEF2F2; padding: 4px 8px; border-radius: 4px;"
    );

    // 2. Invalidate server cookie
    try {
      await fetch("/api/resume/auth/logout", { method: "POST" });
    } catch {
      // Best-effort network cleanup
    }
  }, []);

  // Schedule automatic logout when session expires
  const scheduleLogoutTimer = useCallback((expiresAtTimestamp: number) => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    expiresAtRef.current = expiresAtTimestamp;

    const msUntilExpiry = Math.max(0, expiresAtTimestamp - Date.now());
    if (msUntilExpiry <= 0) {
      handleLogout(true);
      return;
    }

    logoutTimerRef.current = setTimeout(() => {
      handleLogout(true);
    }, msUntilExpiry);
  }, [handleLogout]);

  // Fetch verified resume data from server only AFTER successful session verification
  const loadVerifiedResumeData = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/resume/data");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setResumeData(json.data);
          setIsUnlocked(true);
          setSessionExpired(false);
          return true;
        }
      } else if (res.status === 403) {
        // Portal has been suspended or candidate marked as hired
        const json = await res.json().catch(() => ({}));
        if (json.status === "suspended" || json.status === "hired") {
          setPortalStatus(json.status);
          setStatusMessage(json.statusMessage || "");
          handleLogout(false);
          return false;
        }
      } else if (res.status === 401) {
        // Server rejected session token (expired or invalid)
        handleLogout(true);
        return false;
      }
    } catch (err) {
      console.warn("Failed to load verified resume data:", err);
    }
    return false;
  }, [handleLogout]);

  // 1. Check portal availability status & existing session on mount
  useEffect(() => {
    let isMounted = true;

    async function checkPortalAndSession() {
      try {
        // 1. Fast availability check (Cache-optimized for Vercel free quota)
        const statusRes = await fetch("/api/resume/status");
        if (statusRes.ok) {
          const statusJson = await statusRes.json().catch(() => ({ status: "active" }));
          if (statusJson.status === "suspended" || statusJson.status === "hired") {
            if (isMounted) {
              setPortalStatus(statusJson.status);
              setStatusMessage(statusJson.statusMessage || "");
              setIsCheckingAuth(false);
              return; // Do not check session or show gatekeeper if portal is suspended/hired
            }
          }
        }

        // 2. Check existing session
        const res = await fetch("/api/resume/auth/session");
        if (res.ok) {
          const json = await res.json().catch(() => ({}));
          if (json.authenticated && isMounted) {
            const expiresAt = json.session?.expiresAt || (Date.now() + AUTO_LOGOUT_MS);
            if (Date.now() >= expiresAt) {
              handleLogout(true);
            } else {
              const loaded = await loadVerifiedResumeData();
              if (loaded && isMounted) {
                scheduleLogoutTimer(expiresAt);
              }
            }
          }
        }
      } catch {
        // Not authenticated
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    }

    checkPortalAndSession();

    // DevTools console notice for developers inspecting the page
    console.log(
      "%c👀 Nice try, get a life noob 😂",
      "color: #7C3AED; font-size: 20px; font-weight: bold; background: #F5F3FF; padding: 6px 12px; border: 2px solid #7C3AED; border-radius: 6px;"
    );
    console.log(
      "%cLooking for unblurred resume data in DevTools? The verified data is secured via server session authentication. Enter your email to view the resume! 🚀",
      "font-size: 12px; color: #64748B;"
    );

    return () => {
      isMounted = false;
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
    };
  }, [loadVerifiedResumeData, scheduleLogoutTimer, handleLogout]);

  // 2. Anti-tamper & Inactivity Watchdog: Detects tab refocus, clock changes, or inactivity
  useEffect(() => {
    if (!isUnlocked || portalStatus !== "active") return;

    // Track user interaction for 30-min idle timeout
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const activityEvents = ["mousemove", "keydown", "scroll", "touchstart", "click"];
    activityEvents.forEach((ev) => window.addEventListener(ev, updateActivity, { passive: true }));

    // Periodic heartbeat every 15 seconds to verify session expiry & inactivity
    const interval = setInterval(() => {
      const now = Date.now();
      const isPastExpiresAt = expiresAtRef.current !== null && now >= expiresAtRef.current;
      const isInactive = now - lastActivityRef.current >= AUTO_LOGOUT_MS;

      if (isPastExpiresAt || isInactive) {
        handleLogout(true);
      }
    }, 15000);

    // Anti-tamper: Immediately verify when user switches back to this tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const now = Date.now();
        if (expiresAtRef.current !== null && now >= expiresAtRef.current) {
          handleLogout(true);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      activityEvents.forEach((ev) => window.removeEventListener(ev, updateActivity));
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isUnlocked, portalStatus, handleLogout]);

  // Handle successful OTP verification from modal
  const handleVerified = async () => {
    setSessionExpired(false);
    const loaded = await loadVerifiedResumeData();
    if (loaded) {
      const newExpiresAt = Date.now() + AUTO_LOGOUT_MS;
      scheduleLogoutTimer(newExpiresAt);
    }
  };

  // If candidate is hired or portal is suspended
  if (portalStatus === "suspended" || portalStatus === "hired") {
    return (
      <main className="relative w-full min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] dark:bg-[#0A0A0C] text-slate-900 dark:text-zinc-100">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] bg-indigo-500/10 dark:bg-purple-950/20 blur-[100px] rounded-full pointer-events-none" />
        <ResumeSuspendedView status={portalStatus} statusMessage={statusMessage} />
      </main>
    );
  }

  return (
    <main className="relative w-full min-h-screen flex flex-col items-center justify-start overflow-x-hidden bg-[#FAFAFA] dark:bg-[#0A0A0C] text-slate-900 dark:text-zinc-100 transition-colors duration-200">
      {/* 
        ========================================================================
        [DEV SECURITY NOTICE]
        Nice try, get a life noob 😂
        Looking for resume data in DevTools CSS or inspecting DOM elements?
        Session authentication is strictly enforced on the server.
        Just enter your email to view the resume properly!
        ========================================================================
      */}

      {/* Background subtle ambient warmth */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-slate-200/50 dark:bg-purple-950/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Real-Life Paper View: Shows authentic resume blurred behind gate */}
      <div className="w-full flex-1 flex flex-col items-center z-10">
        <ResumePaperView data={resumeData} isUnlocked={isUnlocked} />
      </div>

      {/* Middle Gatekeeper Modal (Opens when unauthenticated or session expired) */}
      <ResumeGateModal
        isOpen={!isUnlocked && !isCheckingAuth}
        onVerified={handleVerified}
        sessionExpired={sessionExpired}
      />
    </main>
  );
}
