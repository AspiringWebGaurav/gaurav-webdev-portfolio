"use client";
/**
 * FlipCountdown Component
 * 
 * A countdown timer with flip animation inspired by Aceternity UI.
 * Shows days, hours, minutes, seconds with animated flip effect.
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

interface FlipCountdownProps {
  targetDate: Date;
  onComplete?: () => void;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

interface FlipCardProps {
  value: number;
  label: string;
  className?: string;
}

function FlipCard({ value, label, className }: FlipCardProps) {
  const displayValue = value.toString().padStart(2, '0');
  const [prevDisplay, setPrevDisplay] = useState(displayValue);
  const hasChanged = displayValue !== prevDisplay;

  useEffect(() => {
    if (displayValue !== prevDisplay) {
      // Small delay to ensure animation triggers
      const timer = setTimeout(() => setPrevDisplay(displayValue), 50);
      return () => clearTimeout(timer);
    }
  }, [displayValue, prevDisplay]);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative">
        {/* Card container */}
        <div className="relative w-12 h-14 sm:w-14 sm:h-16 md:w-16 md:h-20 lg:w-20 lg:h-24">
          {/* Card background */}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/50 overflow-hidden flex items-center justify-center">
            {/* Single centered number */}
            <AnimatePresence mode="popLayout">
              <motion.span
                key={displayValue}
                initial={hasChanged ? { y: 20, opacity: 0 } : false}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white font-mono tracking-wider"
              >
                {displayValue}
              </motion.span>
            </AnimatePresence>
          </div>

          {/* Shine effect */}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        </div>
      </div>
      
      {/* Label */}
      <span className="mt-1.5 text-[9px] sm:text-[10px] md:text-xs font-medium text-slate-400 uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
}

function calculateTimeLeft(target: Date): TimeLeft {
  const now = new Date().getTime();
  const difference = target.getTime() - now;

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((difference % (1000 * 60)) / 1000),
    isExpired: false,
  };
}

export function FlipCountdown({ targetDate, onComplete, className }: FlipCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(targetDate));
  const hasCompletedRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateTime = useCallback(() => {
    const newTimeLeft = calculateTimeLeft(targetDate);
    setTimeLeft(newTimeLeft);

    if (newTimeLeft.isExpired && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      onComplete?.();
    }
  }, [targetDate, onComplete]);

  useEffect(() => {
    // Initial calculation
    updateTime();

    // Set up interval
    intervalRef.current = setInterval(updateTime, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [updateTime]);

  return (
    <div className={cn("flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4", className)}>
      {timeLeft.days > 0 && (
        <>
          <FlipCard value={timeLeft.days} label="Days" />
          <div className="flex flex-col gap-1.5 py-3">
            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-purple animate-pulse" />
            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-purple animate-pulse" />
          </div>
        </>
      )}
      <FlipCard value={timeLeft.hours} label="Hours" />
      <div className="flex flex-col gap-1.5 py-3">
        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-purple animate-pulse" />
        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-purple animate-pulse" />
      </div>
      <FlipCard value={timeLeft.minutes} label="Minutes" />
      <div className="flex flex-col gap-1.5 py-3">
        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-purple animate-pulse" />
        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-purple animate-pulse" />
      </div>
      <FlipCard value={timeLeft.seconds} label="Seconds" />
    </div>
  );
}

export default FlipCountdown;
