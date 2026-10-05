"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme";
import {
  IoArrowForward,
  IoSunnyOutline,
  IoMoonOutline,
  IoMailOutline,
} from "react-icons/io5";
import { CgSpinner } from "react-icons/cg";
import { cn } from "@/lib/utils";

export const TalkLoginForm: React.FC = () => {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    setMounted(true);
    if (typeof document !== "undefined" && document.body) {
      document.body.style.removeProperty("background-color");
    }
    try {
      const saved = localStorage.getItem("talk_theme");
      if (saved === "dark") {
        setThemeMode("dark");
        setTheme("dark");
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      } else {
        setThemeMode("light");
        setTheme("light");
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
      }
    } catch {
      setThemeMode("light");
      setTheme("light");
    }
  }, [setTheme]);

  const isDark = mounted ? themeMode === "dark" : false;

  const toggleTheme = () => {
    const nextTheme = themeMode === "dark" ? "light" : "dark";
    setThemeMode(nextTheme);
    setTheme(nextTheme);
    try {
      localStorage.setItem("talk_theme", nextTheme);
    } catch {}
    if (typeof document !== "undefined") {
      if (nextTheme === "dark") {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
      }
    }
  };

  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"EMAIL" | "OTP">("EMAIL");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [challengeId, setChallengeId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [isExhausted, setIsExhausted] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Focus email input safely after hydration
  useEffect(() => {
    if (step === "EMAIL") {
      emailInputRef.current?.focus();
    }
  }, [step]);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    setError(null);
    setIsLoading(true);
    setIsExhausted(false);

    try {
      const res = await fetch("/api/talk/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Access denied.");
      }

      setChallengeId(data.challengeId);
      setStep("OTP");
      setCooldown(60);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 80);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Access denied.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (error) setError(null);

    // Handle full paste
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      if (digits.length > 0) {
        const newOtp = [...otp];
        digits.forEach((d, i) => {
          if (index + i < 6) newOtp[index + i] = d;
        });
        setOtp(newOtp);
        const nextIndex = Math.min(5, index + digits.length);
        inputRefs.current[nextIndex]?.focus();
        if (newOtp.every((d) => d !== "")) {
          handleVerifyOtp(newOtp.join(""));
        }
      }
      return;
    }

    const cleanChar = value.replace(/\D/g, "");
    const newOtp = [...otp];
    newOtp[index] = cleanChar;
    setOtp(newOtp);

    // Auto-advance to next box
    if (cleanChar && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit once all 6 boxes are filled
    if (cleanChar && newOtp.every((d) => d !== "")) {
      handleVerifyOtp(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        // Current box is already empty -> move to previous box, clear it, and focus
        e.preventDefault();
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else if (otp[index]) {
        // Current box has digit -> clear it
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerifyOtp = async (codeToVerify?: string) => {
    if (isExhausted) return;

    const fullCode = codeToVerify || otp.join("");
    if (fullCode.length !== 6 || !challengeId) {
      setError("Please enter the 6-digit code.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/talk/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId,
          otp: fullCode,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        const errorMsg = data.error || "Incorrect code. Please try again.";
        const remaining = data.remainingAttempts;

        if (remaining === 0 || errorMsg.toLowerCase().includes("maximum") || errorMsg.toLowerCase().includes("exhausted")) {
          setIsExhausted(true);
        }

        throw new Error(errorMsg);
      }

      router.push(data.redirect || "/");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Verification failed.";
      setError(message);
      setIsLoading(false);

      // Trigger tactile shake
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 450);

      // Instantly clear the 6 boxes and refocus the first box
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 50);
    }
  };

  return (
    <div className="relative w-full max-w-[480px] sm:max-w-[500px] mx-auto animate-in fade-in zoom-in-95 duration-200">
      {/* Ambient Backlight Aura */}
      <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-b from-violet-600/15 via-purple-600/5 to-transparent blur-xl pointer-events-none opacity-80 dark:opacity-40" />

      <div
        className={cn(
          "relative w-full rounded-2xl sm:rounded-3xl bg-white/95 dark:bg-[#0E0D17]/95 backdrop-blur-2xl border border-slate-200/90 dark:border-white/10 p-6 sm:p-7 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.08),0_1px_3px_rgba(15,23,42,0.03)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85),0_0_35px_rgba(124,58,237,0.12)] transition-all overflow-hidden",
          isShaking && "animate-shake"
        )}
        suppressHydrationWarning
      >
        {/* Top Specular Gradient Highlight */}
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent pointer-events-none" />

        {/* Header Row: Title & Theme Switcher */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-0.5">
              talk<span className="text-[#7C3AED]">.</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {step === "EMAIL" ? "Sign in to continue." : `Code sent to ${email}`}
            </p>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-8 h-8 rounded-full border border-slate-200/80 dark:border-white/10 bg-slate-100/70 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 transition-all flex items-center justify-center cursor-pointer shadow-2xs hover:scale-105 active:scale-95 shrink-0"
          >
            {isDark ? <IoSunnyOutline className="w-4 h-4 text-amber-400" /> : <IoMoonOutline className="w-4 h-4 text-slate-600" />}
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
            <span className="flex-1 font-medium">{error}</span>
          </div>
        )}

        {step === "EMAIL" ? (
          <form onSubmit={handleSendOtp} noValidate className="space-y-4">
            <div>
              <label htmlFor="talk-email" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Email
              </label>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-[#7C3AED] transition-colors duration-200">
                  <IoMailOutline className="w-4 h-4" />
                </div>
                <input
                  id="talk-email"
                  ref={emailInputRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                  suppressHydrationWarning
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50/70 hover:bg-slate-50/90 focus:bg-white dark:bg-[#07090E]/60 dark:hover:bg-[#07090E]/80 dark:focus:bg-[#07090E] border border-slate-200/90 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-sm font-normal tracking-normal focus:outline-none focus:border-[#7C3AED] dark:focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C3AED]/10 dark:focus:ring-[#7C3AED]/20 transition-all duration-200 shadow-2xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className={cn(
                "w-full h-11 px-5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer",
                email.trim() && !isLoading
                  ? "bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:via-purple-500 hover:to-indigo-500 text-white shadow-md shadow-violet-500/25 hover:shadow-lg hover:shadow-violet-500/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]"
                  : "bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-600 border border-slate-200/80 dark:border-white/5 cursor-not-allowed shadow-none"
              )}
            >
              {isLoading ? (
                <>
                  <CgSpinner className="w-4 h-4 animate-spin text-white" />
                  <span>Sending code...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <IoArrowForward className={cn(
                    "w-3.5 h-3.5 transition-transform duration-200",
                    email.trim() && "group-hover:translate-x-1"
                  )} />
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Code
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setStep("EMAIL");
                    setError(null);
                    setIsExhausted(false);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  Change email
                </button>
              </div>

              {/* 6-box OTP Input Grid with Auto-Focus */}
              <div className="grid grid-cols-6 gap-2 sm:gap-2.5">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    disabled={isExhausted}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    suppressHydrationWarning
                    className={cn(
                      "w-full h-12 text-center text-lg sm:text-xl font-bold font-mono rounded-xl transition-all duration-150 focus:outline-none",
                      digit
                        ? "border-[#7C3AED] dark:border-[#7C3AED] bg-violet-50/40 dark:bg-violet-950/20 text-slate-900 dark:text-white shadow-2xs"
                        : "border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-[#07090E]/60 text-slate-900 dark:text-white",
                      "focus:border-[#7C3AED] dark:focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C3AED]/15 dark:focus:ring-[#7C3AED]/25 focus:bg-white dark:focus:bg-[#07090E] disabled:opacity-50"
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {isExhausted ? (
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={isLoading}
                  className="w-full h-11 px-5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium text-sm transition-all shadow-md shadow-violet-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  {isLoading ? (
                    <>
                      <CgSpinner className="w-4 h-4 animate-spin" />
                      <span>Sending new code...</span>
                    </>
                  ) : (
                    <span>Request new code</span>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleVerifyOtp()}
                  disabled={isLoading || otp.some((d) => d === "")}
                  className={cn(
                    "w-full h-11 px-5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer",
                    !otp.some((d) => d === "") && !isLoading
                      ? "bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:via-purple-500 hover:to-indigo-500 text-white shadow-md shadow-violet-500/25 hover:shadow-lg hover:shadow-violet-500/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]"
                      : "bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-600 border border-slate-200/80 dark:border-white/5 cursor-not-allowed shadow-none"
                  )}
                >
                  {isLoading ? (
                    <>
                      <CgSpinner className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Continue</span>
                  )}
                </button>
              )}

              {!isExhausted && (
                <button
                  type="button"
                  disabled={cooldown > 0 || isLoading}
                  onClick={() => handleSendOtp()}
                  className="w-full py-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
                >
                  <span>{cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
