"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  IoArrowForward,
  IoSunnyOutline,
  IoMoonOutline,
} from "react-icons/io5";
import { CgSpinner } from "react-icons/cg";

export const TalkLoginForm: React.FC = () => {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted
    ? resolvedTheme === "dark" ||
      (typeof document !== "undefined" && document.documentElement.classList.contains("dark"))
    : false;

  const toggleTheme = () => {
    const nextTheme = isDark ? "light" : "dark";
    setTheme(nextTheme);
    if (typeof document !== "undefined") {
      if (nextTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
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

      router.push(data.redirect || "/talk");
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
    <div className="w-full max-w-[380px] mx-auto animate-in fade-in duration-150">
      <div
        className={`relative w-full rounded-2xl bg-white dark:bg-[#0E0D17] border border-[#E2E8F0] dark:border-[rgba(255,255,255,0.08)] p-6 sm:p-7 shadow-xs transition-all ${
          isShaking ? "animate-shake" : ""
        }`}
      >
        {/* Minimal Theme Switcher */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="absolute top-5 right-5 w-7 h-7 rounded-md border border-[#E2E8F0] dark:border-[#1E293B] bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-all hover:text-slate-900 dark:hover:text-white cursor-pointer"
        >
          {isDark ? <IoSunnyOutline className="w-3.5 h-3.5" /> : <IoMoonOutline className="w-3.5 h-3.5" />}
        </button>

        {/* Clean Header */}
        <div className="mb-5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            talk<span className="text-[#7C3AED]">.</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {step === "EMAIL" ? "Sign in to continue." : `Code sent to ${email}`}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs">
            {error}
          </div>
        )}

        {step === "EMAIL" ? (
          <form onSubmit={handleSendOtp} noValidate className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="name@example.com"
                className="w-full h-10 px-3 rounded-lg bg-white dark:bg-[#0B0F19] border border-[#CBD5E1] dark:border-[#334155] text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white transition shadow-2xs font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full h-10 px-4 rounded-lg bg-[#0F172A] hover:bg-black dark:bg-[#7C3AED] dark:hover:bg-[#6D28D9] text-white font-medium text-sm transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <CgSpinner className="w-4 h-4 animate-spin" />
                  <span>Sending code...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <IoArrowForward className="w-3.5 h-3.5" />
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
              <div className="grid grid-cols-6 gap-1.5">
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
                    className="w-full h-11 text-center text-lg font-bold font-mono rounded-lg bg-white dark:bg-[#0B0F19] border border-[#CBD5E1] dark:border-[#334155] text-slate-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white transition shadow-2xs disabled:opacity-50"
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
                  className="w-full h-10 px-4 rounded-lg bg-[#0F172A] hover:bg-black dark:bg-[#7C3AED] dark:hover:bg-[#6D28D9] text-white font-medium text-sm transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
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
                  className="w-full h-10 px-4 rounded-lg bg-[#0F172A] hover:bg-black dark:bg-[#7C3AED] dark:hover:bg-[#6D28D9] text-white font-medium text-sm transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
