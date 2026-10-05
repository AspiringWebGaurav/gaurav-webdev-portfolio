"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

/**
 * PortfolioPreloader
 * Fullscreen dynamic concentric dual-ring center loader displayed on initial portfolio load.
 * 
 * Enterprise Lifecycle & Reliability Architecture:
 * 1. Reversible Body Scroll Lock: Prevents background touch/wheel scrolling during preload.
 * 2. Multi-tier Watchdog Fail-Safe: Hard cap timeout ensures the user is NEVER trapped on slow/offline networks.
 * 3. Tab Visibility Handler: Fast-forwards completion if user switches tabs to avoid frozen throttled timers.
 * 4. User Escape Hatch: Tap-to-dismiss and Escape-key support available after minimum threshold.
 * 5. Reduced Motion Compliance: Respects prefers-reduced-motion media query.
 * 6. Leak-Free Timer Garbage Collection: All refs and listeners reliably flushed on unmount.
 */
export function PortfolioPreloader() {
  const [mounted, setMounted] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(25);
  const [statusText, setStatusText] = useState("Initializing experience...");
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const hasFinishedRef = useRef(false);
  const originalOverflowRef = useRef<string>("");

  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const statusTimer1Ref = useRef<NodeJS.Timeout | null>(null);
  const statusTimer2Ref = useRef<NodeJS.Timeout | null>(null);
  const finishTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const unmountTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const watchdogTimerRef = useRef<NodeJS.Timeout | null>(null);

  const restoreScroll = useCallback(() => {
    if (typeof document !== "undefined" && document.body) {
      document.body.style.overflow = originalOverflowRef.current || "";
      document.body.style.touchAction = "";
    }
  }, []);

  const finishLoading = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;

    // Flush any pending incremental timers
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (statusTimer1Ref.current) clearTimeout(statusTimer1Ref.current);
    if (statusTimer2Ref.current) clearTimeout(statusTimer2Ref.current);
    if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);

    setProgress(100);
    setStatusText("Ready");
    restoreScroll();

    finishTimeoutRef.current = setTimeout(() => {
      setIsExiting(true);
      unmountTimeoutRef.current = setTimeout(() => {
        setMounted(false);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("portfolio-preloader-complete"));
        }
      }, 400); // Wait for fadeout animation
    }, 180);
  }, [restoreScroll]);

  useEffect(() => {
    // Check reduced motion preference
    if (typeof window !== "undefined" && window.matchMedia) {
      const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(motionQuery.matches);
    }

    // 1. Reversible Scroll Lock during initial boot
    if (typeof document !== "undefined" && document.body) {
      originalOverflowRef.current = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    }

    // 2. Incremental progress bar ticks
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return 92;
        return prev + Math.floor(Math.random() * 15 + 10);
      });
    }, 110);

    // 3. Narrative stage transitions
    statusTimer1Ref.current = setTimeout(() => {
      setStatusText("Loading architecture & systems...");
    }, 320);

    statusTimer2Ref.current = setTimeout(() => {
      setStatusText("Preparing interface...");
    }, 600);

    // 4. Document readiness detection
    let readyTimer: NodeJS.Timeout | null = null;
    if (typeof document !== "undefined" && document.readyState === "complete") {
      readyTimer = setTimeout(finishLoading, 650);
    } else if (typeof window !== "undefined") {
      const handleLoad = () => {
        readyTimer = setTimeout(finishLoading, 350);
      };
      window.addEventListener("load", handleLoad, { once: true });
    }

    // 5. Fail-Safe Watchdog: Under NO circumstances can preloader block user longer than 2.0s
    watchdogTimerRef.current = setTimeout(finishLoading, 2000);

    // 6. Tab Visibility Handler: Fast-forward if user switches away
    const handleVisibilityChange = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        finishLoading();
      }
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    // 7. Global error fail-safe: dismiss immediately if runtime hydration fails
    const handleWindowError = () => {
      finishLoading();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("error", handleWindowError, { once: true });
    }

    // 8. Keyboard escape hatch: allow Escape key dismissal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        finishLoading();
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", handleKeyDown);
    }

    // Comprehensive unmount cleanup
    return () => {
      restoreScroll();
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (statusTimer1Ref.current) clearTimeout(statusTimer1Ref.current);
      if (statusTimer2Ref.current) clearTimeout(statusTimer2Ref.current);
      if (readyTimer) clearTimeout(readyTimer);
      if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
      if (unmountTimeoutRef.current) clearTimeout(unmountTimeoutRef.current);
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
      if (typeof window !== "undefined") {
        window.removeEventListener("error", handleWindowError);
        window.removeEventListener("keydown", handleKeyDown);
      }
    };
  }, [finishLoading, restoreScroll]);

  if (!mounted) return null;

  return (
    <div
      id="portfolio-preloader"
      aria-label="Loading portfolio"
      role="status"
      aria-busy={!isExiting}
      onClick={finishLoading}
      className={cn(
        "fixed inset-0 z-[99999] flex flex-col items-center justify-center select-none bg-[#FAFAFA] dark:bg-[#000319] transition-all duration-400 ease-out cursor-pointer",
        isExiting && "opacity-0 pointer-events-none scale-105"
      )}
    >
      <div className="flex flex-col items-center justify-center p-6 max-w-xs text-center">
        {/* Dynamic Concentric Dual-Ring Center Spinner */}
        <div className="relative w-14 h-14 flex items-center justify-center">
          {/* Outer Track Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-slate-200/90 dark:border-white/10" />

          {/* Outer High-Speed Primary Arc */}
          <svg
            className={cn(
              "absolute inset-0 w-full h-full text-[#7C3AED] dark:text-[#CBACF9]",
              prefersReducedMotion ? "opacity-75" : "animate-spin"
            )}
            viewBox="0 0 56 56"
            fill="none"
            style={{
              animationDuration: prefersReducedMotion ? undefined : "0.95s",
              filter: "drop-shadow(0 0 10px rgba(124, 58, 237, 0.45))",
            }}
          >
            <circle
              cx="28"
              cy="28"
              r="24"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="36 115"
            />
          </svg>

          {/* Inner Counter-Rotating Precision Arc */}
          <svg
            className={cn(
              "w-8 h-8 text-slate-800 dark:text-purple",
              prefersReducedMotion ? "opacity-60" : ""
            )}
            viewBox="0 0 32 32"
            fill="none"
            style={{
              animation: prefersReducedMotion ? undefined : "spin 1.5s linear infinite reverse",
            }}
          >
            <circle
              cx="16"
              cy="16"
              r="12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="18 57"
            />
          </svg>

          {/* Center Pulsing Micro-Core */}
          <div className="absolute w-2 h-2 rounded-full bg-[#7C3AED] dark:bg-[#CBACF9] shadow-[0_0_8px_rgba(124,58,237,0.8)] animate-pulse" />
        </div>

        {/* Dynamic Status Typography & Micro-Progress */}
        <div className="mt-5 flex flex-col items-center space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold tracking-[0.25em] text-slate-800 dark:text-slate-200 uppercase">
              Gaurav Patil
            </span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </div>

          {/* Glowing Micro Progress Bar */}
          <div className="w-32 h-1 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-[#7C3AED] via-purple-400 to-cyan-400 transition-all duration-150 ease-out rounded-full shadow-[0_0_8px_rgba(124,58,237,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tracking-wide transition-opacity duration-200">
            {statusText}
          </p>
        </div>
      </div>
    </div>
  );
}
