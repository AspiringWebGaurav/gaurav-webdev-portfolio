"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "next-themes";
import { IoSunnyOutline, IoMoonOutline } from "react-icons/io5";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  variant?: "floating" | "inline";
}

export function ThemeToggle({
  className,
  variant = "floating",
}: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [targetTheme, setTargetTheme] = useState<"light" | "dark" | null>(null);

  const phase1TimerRef = useRef<NodeJS.Timeout | null>(null);
  const phase2TimerRef = useRef<NodeJS.Timeout | null>(null);
  const doneTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (phase1TimerRef.current) clearTimeout(phase1TimerRef.current);
      if (phase2TimerRef.current) clearTimeout(phase2TimerRef.current);
      if (doneTimerRef.current) clearTimeout(doneTimerRef.current);
      if (typeof document !== "undefined") {
        document.documentElement.classList.remove("theme-transitioning");
      }
    };
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  const toggleTheme = () => {
    if (isTransitioning) return;

    const next = isDark ? "light" : "dark";
    setTargetTheme(next);
    setIsTransitioning(true);

    if (typeof document !== "undefined") {
      document.documentElement.classList.add("theme-transitioning");
    }

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setTheme(next);
      setIsTransitioning(false);
      setTargetTheme(null);
      if (typeof document !== "undefined") {
        document.documentElement.classList.remove("theme-transitioning");
      }
      return;
    }

    // Phase 1: Give luxury transition curtain 180ms to envelop screen
    if (phase1TimerRef.current) clearTimeout(phase1TimerRef.current);
    phase1TimerRef.current = setTimeout(() => {
      // Switch theme behind the veiled screen
      setTheme(next);

      // Phase 2: Allow DOM and Three.js canvas to settle smoothly off-screen
      if (phase2TimerRef.current) clearTimeout(phase2TimerRef.current);
      phase2TimerRef.current = setTimeout(() => {
        setIsTransitioning(false);

        // Phase 3: Clean up class once curtain exit animation completes
        if (doneTimerRef.current) clearTimeout(doneTimerRef.current);
        doneTimerRef.current = setTimeout(() => {
          setTargetTheme(null);
          if (typeof document !== "undefined") {
            document.documentElement.classList.remove("theme-transitioning");
          }
        }, 250);
      }, 220);
    }, 180);
  };

  if (!mounted) {
    return (
      <div
        className={cn(
          variant === "floating"
            ? "fixed top-4 right-4 sm:top-6 sm:right-8 z-[9999]"
            : "relative",
          "w-10 h-10 sm:w-11 sm:h-11 rounded-full opacity-0 pointer-events-none",
          className
        )}
        style={{
          top: variant === "floating" ? "calc(1rem + env(safe-area-inset-top, 0px))" : undefined,
          right: variant === "floating" ? "calc(1rem + env(safe-area-inset-right, 0px))" : undefined,
        }}
        aria-hidden="true"
      />
    );
  }

  const renderTransitionCurtain = () => {
    if (!mounted || typeof document === "undefined" || !document.body) {
      return null;
    }

    return createPortal(
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            key="theme-transition-curtain"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className={cn(
              "fixed inset-0 z-[9998] flex items-center justify-center select-none pointer-events-auto backdrop-blur-2xl transition-colors duration-200",
              targetTheme === "dark"
                ? "bg-[#000319]/85"
                : "bg-[#FAFAFA]/85"
            )}
            role="status"
            aria-live="polite"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "flex flex-col items-center gap-4 px-7 py-6 rounded-2xl shadow-2xl border select-none max-w-xs sm:max-w-sm text-center mx-4",
                targetTheme === "dark"
                  ? "bg-[#0A0D24]/95 border-white/15 text-white shadow-[0_25px_60px_rgba(0,0,0,0.85)]"
                  : "bg-white/95 border-slate-200 text-slate-900 shadow-[0_25px_60px_rgba(124,58,237,0.18)]"
              )}
            >
              {/* Dynamic Animated Spinner / Icon Ring */}
              <div className="relative w-14 h-14 flex items-center justify-center">
                {/* Ambient Glow */}
                <div
                  className={cn(
                    "absolute inset-0 rounded-full blur-md opacity-60 animate-pulse",
                    targetTheme === "dark" ? "bg-amber-500/30" : "bg-violet-500/30"
                  )}
                />
                {/* Spinning luxury gradient ring */}
                <div
                  className={cn(
                    "w-12 h-12 rounded-full border-2 border-transparent animate-spin",
                    targetTheme === "dark"
                      ? "border-t-amber-400 border-r-amber-400/50"
                      : "border-t-violet-600 border-r-violet-600/50"
                  )}
                  style={{ animationDuration: "0.85s" }}
                />
                {/* Center Theme Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {targetTheme === "dark" ? (
                    <IoMoonOutline className="w-5 h-5 text-amber-400 animate-pulse" />
                  ) : (
                    <IoSunnyOutline className="w-6 h-6 text-violet-600 animate-pulse" />
                  )}
                </div>
              </div>

              {/* Mode Labels */}
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold tracking-wide">
                  {targetTheme === "dark" ? "Switching to Dark Mode" : "Switching to Light Mode"}
                </p>
                <p
                  className={cn(
                    "text-xs font-normal tracking-normal",
                    targetTheme === "dark" ? "text-slate-400" : "text-slate-500"
                  )}
                >
                  Applying visual aesthetics...
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    );
  };

  return (
    <>
      <motion.button
        type="button"
        onClick={toggleTheme}
        disabled={isTransitioning}
        whileHover={!isTransitioning ? { scale: 1.08 } : undefined}
        whileTap={!isTransitioning ? { scale: 0.92 } : undefined}
        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
        title={isDark ? "Switch to light theme" : "Switch to dark theme"}
        className={cn(
          "group relative flex items-center justify-center rounded-full select-none touch-manipulation focus:outline-none transition-all duration-300",
          variant === "floating"
            ? "fixed top-4 right-4 sm:top-6 sm:right-8 z-[9999] w-10 h-10 sm:w-11 sm:h-11 backdrop-blur-2xl"
            : "w-9 h-9 sm:w-10 sm:h-10 backdrop-blur-2xl",
          isDark
            ? "bg-[#0A0D24]/90 hover:bg-[#12163A] border border-white/20 text-amber-400 shadow-[0_4px_20px_rgba(0,0,0,0.5),0_0_12px_rgba(251,191,36,0.15)] ring-1 ring-white/10"
            : "bg-white/95 hover:bg-white border border-slate-300/90 text-violet-600 shadow-[0_4px_20px_rgba(124,58,237,0.16),0_1px_3px_rgba(0,0,0,0.08)] ring-1 ring-violet-500/10",
          isTransitioning ? "cursor-wait opacity-90" : "cursor-pointer",
          className
        )}
        style={{
          top: variant === "floating" ? "calc(1rem + env(safe-area-inset-top, 0px))" : undefined,
          right: variant === "floating" ? "calc(1rem + env(safe-area-inset-right, 0px))" : undefined,
        }}
      >
        <div className="relative w-5 h-5 flex items-center justify-center pointer-events-none">
          {/* Sun icon: active in dark mode (click to turn on light) */}
          <motion.div
            initial={false}
            animate={{
              rotate: isDark ? 0 : 90,
              scale: isDark ? 1 : 0,
              opacity: isDark ? 1 : 0,
            }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <IoSunnyOutline className="w-5 h-5 text-amber-400 group-hover:rotate-12 transition-transform duration-300" />
          </motion.div>

          {/* Moon icon: active in light mode (click to turn on dark) */}
          <motion.div
            initial={false}
            animate={{
              rotate: isDark ? -90 : 0,
              scale: isDark ? 0 : 1,
              opacity: isDark ? 0 : 1,
            }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <IoMoonOutline className="w-4.5 h-4.5 text-[#7C3AED] group-hover:-rotate-12 transition-transform duration-300" />
          </motion.div>
        </div>
      </motion.button>

      {renderTransitionCurtain()}
    </>
  );
}
