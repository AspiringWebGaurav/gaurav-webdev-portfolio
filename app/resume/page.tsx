"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { IoDocumentTextOutline } from "react-icons/io5";
import { ResumeGateModal } from "@/components/resume/ResumeGateModal";
import { ResumePaperView } from "@/components/resume/ResumePaperView";
import { ResumeSuspendedView } from "@/components/resume/ResumeSuspendedView";
import { DEFAULT_RESUME_DATA, RESUME_SESSION_TTL_MINUTES } from "@/lib/resume/constants";
import type { ResumeData } from "@/types/resume";

const AUTO_LOGOUT_MS = RESUME_SESSION_TTL_MINUTES * 60 * 1000; // 30 minutes

export default function ResumePage() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoadingTransition, setIsLoadingTransition] = useState(false);
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

    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("resume_tab_token");
        sessionStorage.removeItem("resume_tab_lifecycle_state");
        sessionStorage.removeItem("resume_tab_unloaded_at");
      } catch {}
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
  const loadVerifiedResumeData = useCallback(async (unlockImmediately = true): Promise<boolean> => {
    try {
      const tabToken = typeof window !== "undefined" ? sessionStorage.getItem("resume_tab_token") : null;
      const res = await fetch("/api/resume/data", {
        headers: tabToken ? { "x-resume-tab-token": tabToken } : {},
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setResumeData(json.data);
          if (unlockImmediately) {
            setIsUnlocked(true);
          }
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

    // Track tab unload lifecycle
    const handleBeforeUnload = () => {
      try {
        sessionStorage.setItem("resume_tab_lifecycle_state", "unloaded");
        sessionStorage.setItem("resume_tab_unloaded_at", Date.now().toString());
      } catch {}
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handleBeforeUnload);

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

        // 2. Strict Tab Lifecycle & Privacy Policy:
        // A resume session is isolated strictly to the active tab lifecycle.
        // If the tab was closed and newly opened, or if no valid tab token exists in this tab,
        // we REQUIRE an OTP challenge again to guarantee candidate privacy.
        let hasValidTabSession = false;
        let tabToken: string | null = null;
        try {
          tabToken = sessionStorage.getItem("resume_tab_token");
          const lifecycleState = sessionStorage.getItem("resume_tab_lifecycle_state");

          let isReload = false;
          if (typeof performance !== "undefined") {
            const navEntries = performance.getEntriesByType("navigation");
            if (navEntries.length > 0) {
              isReload = (navEntries[0] as PerformanceNavigationTiming).type === "reload";
            } else if ((performance as unknown as { navigation?: { type: number } }).navigation) {
              isReload = (performance as unknown as { navigation: { type: number } }).navigation.type === 1;
            }
          }

          if (tabToken && (!lifecycleState || lifecycleState !== "unloaded" || isReload)) {
            hasValidTabSession = true;
            sessionStorage.setItem("resume_tab_lifecycle_state", "active");
          } else {
            // Tab was closed, restored, or no tab token exists -> Purge immediately
            sessionStorage.removeItem("resume_tab_token");
            sessionStorage.removeItem("resume_tab_lifecycle_state");
          }
        } catch {
          hasValidTabSession = false;
        }

        if (!hasValidTabSession || !tabToken) {
          // Tab was closed or not authenticated in this tab.
          // Invalidate any lingering cookie in background to ensure zero cross-tab leakage
          fetch("/api/resume/auth/logout", { method: "POST" }).catch(() => {});
          if (isMounted) {
            setIsCheckingAuth(false);
          }
          return;
        }

        // 3. Tab session is present (page reload within active session)
        // Verify with server using tab token header
        const res = await fetch("/api/resume/auth/session", {
          headers: { "x-resume-tab-token": tabToken },
        });

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
          } else {
            handleLogout(false);
          }
        } else {
          handleLogout(false);
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
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handleBeforeUnload);
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

  // Handle successful OTP verification from modal with smooth 1.5s transition flow
  const handleVerified = async () => {
    setIsLoadingTransition(true);
    setSessionExpired(false);
    try {
      // Parallel execution: fetch the verified data while displaying the 1.5s central loader
      const [loaded] = await Promise.all([
        loadVerifiedResumeData(false),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);
      if (loaded) {
        setIsUnlocked(true);
        const newExpiresAt = Date.now() + AUTO_LOGOUT_MS;
        scheduleLogoutTimer(newExpiresAt);
      }
    } finally {
      setIsLoadingTransition(false);
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

      {/* Central 1.5s Resume Loading Transition Overlay (All Screen Sizes) */}
      {isLoadingTransition && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          role="status"
          aria-live="polite"
          aria-label="Loading verified resume"
        >
          {/* Ambient radial glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-80 sm:h-80 bg-gradient-to-tr from-indigo-500/25 via-purple-500/25 to-transparent rounded-full blur-3xl pointer-events-none" />

          {/* Central Glassmorphic Loader Card */}
          <div className="relative w-full max-w-[320px] xs:max-w-[340px] sm:max-w-sm rounded-2xl bg-white/95 dark:bg-[#12111E]/95 border border-slate-200/90 dark:border-indigo-500/20 shadow-2xl p-6 sm:p-7 flex flex-col items-center text-center backdrop-blur-xl animate-in zoom-in-95 duration-200">
            {/* Multi-ring illuminated icon spinner */}
            <div className="relative w-14 h-14 mb-4 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 opacity-20 blur-sm animate-pulse" />
              <div className="absolute inset-0 rounded-full border-2 border-indigo-200 dark:border-indigo-950 border-t-indigo-600 dark:border-t-indigo-400 animate-spin" />
              <div className="absolute inset-1.5 rounded-full border-2 border-purple-200 dark:border-purple-950 border-b-purple-600 dark:border-b-purple-400 animate-[spin_1.5s_linear_infinite_reverse]" />
              <IoDocumentTextOutline className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            </div>

            {/* Central typography */}
            <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
              Loading Resume...
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 font-mono">
              Decrypting verified candidate profile
            </p>

            {/* Smooth 1.5s Progress Bar */}
            <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full mt-5 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 rounded-full animate-resume-progress" />
            </div>
          </div>
        </div>
      )}

      {/* Middle Gatekeeper Modal (Opens when unauthenticated, not transitioning, and not checking auth) */}
      <ResumeGateModal
        isOpen={!isUnlocked && !isCheckingAuth && !isLoadingTransition}
        onVerified={handleVerified}
        sessionExpired={sessionExpired}
      />
    </main>
  );
}
