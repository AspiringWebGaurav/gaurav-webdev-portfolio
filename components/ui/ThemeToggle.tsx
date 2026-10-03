"use client";

import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  const toggleTheme = () => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.add("theme-transitioning");
      setTimeout(() => {
        document.documentElement.classList.remove("theme-transitioning");
      }, 700);
    }
    const next = isDark ? "light" : "dark";
    setTheme(next);
  };

  if (!mounted) {
    return (
      <div
        className={cn(
          variant === "floating"
            ? "fixed top-4 right-4 sm:top-6 sm:right-8 z-[5050]"
            : "relative",
          "w-10 h-10 sm:w-11 sm:h-11 rounded-full opacity-0 pointer-events-none",
          className
        )}
        aria-hidden="true"
      />
    );
  }

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn(
        "group relative flex items-center justify-center rounded-full select-none cursor-pointer touch-manipulation focus:outline-none border-0 transition-colors duration-500",
        variant === "floating"
          ? "fixed top-4 right-4 sm:top-6 sm:right-8 z-[5050] w-10 h-10 sm:w-11 sm:h-11 backdrop-blur-2xl"
          : "w-9 h-9 sm:w-10 sm:h-10 backdrop-blur-2xl",
        isDark
          ? "bg-white/[0.08] hover:bg-white/[0.14] text-amber-300 shadow-[0_4px_24px_rgba(0,0,0,0.35)]"
          : "bg-white/60 hover:bg-white/85 text-[#7C3AED] shadow-[0_4px_20px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)]",
        className
      )}
      style={{
        top: variant === "floating" ? "calc(1rem + env(safe-area-inset-top, 0px))" : undefined,
        right: variant === "floating" ? "calc(1rem + env(safe-area-inset-right, 0px))" : undefined,
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="sun-icon"
            initial={{ rotate: -90, scale: 0.5, opacity: 0, y: -4 }}
            animate={{ rotate: 0, scale: 1, opacity: 1, y: 0 }}
            exit={{ rotate: 90, scale: 0.5, opacity: 0, y: 4 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center justify-center"
          >
            <IoSunnyOutline className="w-5 h-5 text-amber-400 group-hover:rotate-12 transition-transform duration-500" />
          </motion.div>
        ) : (
          <motion.div
            key="moon-icon"
            initial={{ rotate: 90, scale: 0.5, opacity: 0, y: 4 }}
            animate={{ rotate: 0, scale: 1, opacity: 1, y: 0 }}
            exit={{ rotate: -90, scale: 0.5, opacity: 0, y: -4 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center justify-center"
          >
            <IoMoonOutline className="w-4.5 h-4.5 text-[#7C3AED] group-hover:-rotate-12 transition-transform duration-500" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
