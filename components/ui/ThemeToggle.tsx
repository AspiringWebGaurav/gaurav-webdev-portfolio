"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "@/lib/theme";
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
  const [isModalOpen, setIsModalOpen] = useState(false);

  const phase1TimerRef = useRef<NodeJS.Timeout | null>(null);
  const phase2TimerRef = useRef<NodeJS.Timeout | null>(null);
  const doneTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);

    const handleModalState = (e?: Event) => {
      const customEvent = e as CustomEvent<{ isOpen?: boolean }> | undefined;
      if (customEvent?.detail?.isOpen !== undefined) {
        if (customEvent.detail.isOpen) {
          setIsModalOpen(true);
          return;
        }
      }

      if (typeof document !== "undefined") {
        setIsModalOpen(
          document.documentElement.hasAttribute("data-assistant-open") ||
          document.documentElement.hasAttribute("data-contact-modal-open")
        );
      }
    };

    handleModalState();

    if (typeof window !== "undefined") {
      window.addEventListener("assistant-modal-state", handleModalState);
      window.addEventListener("contact-modal-state", handleModalState);
    }

    return () => {
      if (phase1TimerRef.current) clearTimeout(phase1TimerRef.current);
      if (phase2TimerRef.current) clearTimeout(phase2TimerRef.current);
      if (doneTimerRef.current) clearTimeout(doneTimerRef.current);
      if (typeof window !== "undefined") {
        window.removeEventListener("assistant-modal-state", handleModalState);
        window.removeEventListener("contact-modal-state", handleModalState);
      }
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

    // Fire exactly ONE background request to persist preference on the server
    fetch("/api/theme", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: next }),
    }).catch(() => {
      // Graceful offline fallback: active session continues smoothly
    });

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
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex items-center justify-center select-none"
            >
              {/* Ambient Radial Glow */}
              <div
                className={cn(
                  "absolute w-28 h-28 rounded-full blur-2xl opacity-60 animate-pulse pointer-events-none",
                  targetTheme === "dark" ? "bg-amber-400/35" : "bg-violet-600/35"
                )}
              />

              {/* Minimal Glass Ring */}
              <div
                className={cn(
                  "relative w-20 h-20 rounded-full flex items-center justify-center backdrop-blur-xl border shadow-2xl transition-colors duration-300",
                  targetTheme === "dark"
                    ? "bg-white/[0.06] border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]"
                    : "bg-white/60 border-slate-200/80 shadow-[0_8px_32px_0_rgba(124,58,237,0.18)]"
                )}
              >
                {/* Subtle Orbiting Accent Arc */}
                <div
                  className={cn(
                    "absolute inset-0 rounded-full border-2 border-transparent animate-spin",
                    targetTheme === "dark"
                      ? "border-t-amber-400/90 border-r-amber-400/40"
                      : "border-t-violet-600/90 border-r-violet-600/40"
                  )}
                  style={{ animationDuration: "0.95s" }}
                />

                {/* Centered Glowing Icon */}
                <div className="relative flex items-center justify-center">
                  {targetTheme === "dark" ? (
                    <IoMoonOutline className="w-9 h-9 text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)] animate-pulse" />
                  ) : (
                    <IoSunnyOutline className="w-9 h-9 text-violet-600 drop-shadow-[0_0_12px_rgba(124,58,237,0.5)] animate-pulse" />
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    );
  };

  const isHidden = variant === "floating" && isModalOpen;

  return (
    <>
      <motion.button
        type="button"
        onClick={toggleTheme}
        disabled={isTransitioning || isHidden}
        whileHover={!isTransitioning && !isHidden ? { scale: 1.08 } : undefined}
        whileTap={!isTransitioning && !isHidden ? { scale: 0.92 } : undefined}
        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
        title={isDark ? "Switch to light theme" : "Switch to dark theme"}
        aria-hidden={isHidden}
        className={cn(
          "group relative flex items-center justify-center rounded-full select-none touch-manipulation focus:outline-none transition-all duration-300",
          variant === "floating"
            ? "fixed top-4 right-4 sm:top-6 sm:right-8 z-[9999] w-10 h-10 sm:w-11 sm:h-11 backdrop-blur-2xl"
            : "w-9 h-9 sm:w-10 sm:h-10 backdrop-blur-2xl",
          isDark
            ? "bg-[#0A0D24]/90 hover:bg-[#12163A] border border-white/20 text-amber-400 shadow-[0_4px_20px_rgba(0,0,0,0.5),0_0_12px_rgba(251,191,36,0.15)] ring-1 ring-white/10"
            : "bg-white/95 hover:bg-white border border-slate-300/90 text-violet-600 shadow-[0_4px_20px_rgba(124,58,237,0.16),0_1px_3px_rgba(0,0,0,0.08)] ring-1 ring-violet-500/10",
          isTransitioning ? "cursor-wait opacity-90" : "cursor-pointer",
          isHidden && "opacity-0 pointer-events-none scale-75 -translate-y-2 invisible",
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
