"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import {
  IoMailOutline,
  IoArrowForward,
  IoRefreshOutline,
  IoSunnyOutline,
  IoMoonOutline,
  IoArrowBackOutline,
  IoOpenOutline,
  IoAlertCircleOutline,
} from "react-icons/io5";
import { getAutocorrectedEmail, checkEmailAbuse } from "@/lib/recruiter/validation";

const RESUME_TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_RESUME_TURNSTILE_SITE_KEY ||
  process.env.NEXT_PUBLIC_RESUME_GAURAVPATIL_SITE_KEY ||
  "0x4AAAAAAFL4V3sqf-IIM6LV";

interface ResumeGateModalProps {
  isOpen: boolean;
  onVerified: () => void;
  sessionExpired?: boolean;
}

export const ResumeGateModal: React.FC<ResumeGateModalProps> = ({
  isOpen,
  onVerified,
  sessionExpired = false,
}) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Robust dark mode check: tracks resolvedTheme dynamically
  const isDark = mounted ? resolvedTheme === "dark" : true;

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

  // Step state: "details" -> "otp"
  const [step, setStep] = useState<"details" | "otp">("details");
  const [isSuccessDismissing, setIsSuccessDismissing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsSuccessDismissing(false);
    }
  }, [isOpen]);

  // Single email input state
  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [isShaking, setIsShaking] = useState(false);

  // Turnstile state
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isTurnstileReady, setIsTurnstileReady] = useState(false);
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);

  // Status & Challenge state
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(300);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Helper: check both React state and DOM for Cloudflare Turnstile token
  const getEffectiveTurnstileToken = useCallback((): string | null => {
    if (turnstileToken) return turnstileToken;
    if (typeof document !== "undefined") {
      const inputEl = document.querySelector<HTMLInputElement>(
        'input[name="cf-turnstile-response"]'
      );
      if (inputEl?.value) return inputEl.value;
    }
    return null;
  }, [turnstileToken]);

  // Keep turnstileToken synced with DOM in case Cloudflare auto-verified
  useEffect(() => {
    if (turnstileToken || step !== "details" || !isOpen) return;
    const interval = setInterval(() => {
      const domToken =
        typeof document !== "undefined"
          ? document.querySelector<HTMLInputElement>(
              'input[name="cf-turnstile-response"]'
            )?.value
          : null;
      if (domToken && domToken !== turnstileToken) {
        setTurnstileToken(domToken);
        setIsTurnstileReady(true);
      }
    }, 350);
    return () => clearInterval(interval);
  }, [turnstileToken, step, isOpen]);

  // 1. Mount Turnstile script and widget
  const renderTurnstile = useCallback(() => {
    if (
      !turnstileContainerRef.current ||
      typeof window === "undefined" ||
      !window.turnstile
    ) {
      return;
    }

    try {
      if (turnstileWidgetIdRef.current) {
        try {
          window.turnstile.remove(turnstileWidgetIdRef.current);
        } catch {
          // ignore
        }
        turnstileWidgetIdRef.current = null;
      }

      turnstileContainerRef.current.innerHTML = "";

      const id = window.turnstile.render(turnstileContainerRef.current, {
        sitekey: RESUME_TURNSTILE_SITE_KEY,
        theme: isDark ? "dark" : "light",
        size: "normal",
        action: "resume_gate",
        callback: (token: string) => {
          setTurnstileToken(token);
          setIsTurnstileReady(true);
        },
        "error-callback": () => {
          setTurnstileToken(null);
          setIsTurnstileReady(false);
        },
        "expired-callback": () => {
          setTurnstileToken(null);
          setIsTurnstileReady(false);
          if (turnstileWidgetIdRef.current && window.turnstile) {
            try {
              window.turnstile.reset(turnstileWidgetIdRef.current);
            } catch {
              // ignore
            }
          }
        },
      });

      turnstileWidgetIdRef.current = id;
      setIsTurnstileReady(true);
    } catch (err) {
      console.warn("Turnstile initialization note:", err);
    }
  }, [isDark]);

  useEffect(() => {
    if (!isOpen || step !== "details") return;

    if (
      typeof window !== "undefined" &&
      !document.getElementById("cf-turnstile-script")
    ) {
      const script = document.createElement("script");
      script.id = "cf-turnstile-script";
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    let interval: ReturnType<typeof setInterval> | null = null;
    const tryInit = () => {
      if (
        typeof window !== "undefined" &&
        window.turnstile &&
        turnstileContainerRef.current
      ) {
        renderTurnstile();
        if (interval) clearInterval(interval);
      }
    };

    if (typeof window !== "undefined") {
      if (window.turnstile) {
        tryInit();
      } else {
        interval = setInterval(tryInit, 200);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, step, renderTurnstile]);

  // Re-render Turnstile on theme switch
  useEffect(() => {
    if (!isOpen || step !== "details" || !mounted) return;
    if (turnstileContainerRef.current && window?.turnstile) {
      renderTurnstile();
    }
  }, [isDark, isOpen, step, mounted, renderTurnstile]);

  // 2. Email Autocorrect & Anti-Abuse detection
  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (errorMsg) setErrorMsg(null);

    // Live Anti-Abuse Check
    const abuse = checkEmailAbuse(val);
    if (abuse.isAbusive) {
      setErrorMsg(abuse.error || "Abusive or inappropriate email addresses are not accepted.");
      return;
    }

    // Domain typo suggestion (e.g. gmal.com -> gmail.com)
    const corrected = getAutocorrectedEmail(val);
    if (corrected !== val.trim().toLowerCase() && val.includes("@")) {
      setEmailSuggestion(corrected);
    } else {
      setEmailSuggestion(null);
    }
  };

  // Automatic domain autocorrect & abuse verification on blur
  const handleEmailBlur = () => {
    const trimmed = email.trim();
    if (!trimmed) return;

    // Check abuse on blur
    const abuse = checkEmailAbuse(trimmed);
    if (abuse.isAbusive) {
      setErrorMsg(abuse.error || "Abusive or inappropriate email addresses are not accepted.");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 450);
      return;
    }

    // Automatically correct gmal.com -> gmail.com or any known typo
    const corrected = getAutocorrectedEmail(trimmed);
    if (corrected !== trimmed) {
      setEmail(corrected);
      setEmailSuggestion(null);
    }
  };

  // 3. Request OTP Code with anti-abuse enforcement & automatic typo correction
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    let trimmedEmail = email.trim();

    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 450);
      return;
    }

    // 1. Anti-Abuse Check: Reject abusive, vulgar, or troll email addresses
    const abuse = checkEmailAbuse(trimmedEmail);
    if (abuse.isAbusive) {
      setErrorMsg(abuse.error || "Abusive or inappropriate email addresses are not accepted.");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 450);
      return;
    }

    // 2. Automatic typo correction before submission (e.g. name@gmal.com -> name@gmail.com)
    const corrected = getAutocorrectedEmail(trimmedEmail);
    if (corrected !== trimmedEmail) {
      trimmedEmail = corrected;
      setEmail(corrected);
      setEmailSuggestion(null);
    }

    const effectiveToken = getEffectiveTurnstileToken();
    if (!effectiveToken) {
      setErrorMsg("Please complete the verification check.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/resume/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          turnstileToken: effectiveToken,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(
          data.error || "Unable to send verification code. Please try again."
        );
      }

      setChallengeId(data.data.challengeId);
      setCountdown(data.data.expiresInSeconds || 300);
      setStep("otp");

      // Auto-focus first box immediately
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send code.";
      setErrorMsg(msg);
      if (turnstileWidgetIdRef.current && window?.turnstile) {
        try {
          window.turnstile.reset(turnstileWidgetIdRef.current);
          setTurnstileToken(null);
        } catch {
          // ignore
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Handle OTP Digit Changes & Keyboard Navigation
  const handleOtpDigitChange = (index: number, val: string) => {
    if (errorMsg) setErrorMsg(null);
    const cleaned = val.replace(/\D/g, "");
    if (!cleaned) {
      const updated = [...otpDigits];
      updated[index] = "";
      setOtpDigits(updated);
      return;
    }

    if (cleaned.length === 1) {
      const updated = [...otpDigits];
      updated[index] = cleaned;
      setOtpDigits(updated);
      if (index < 5) {
        otpInputRefs.current[index + 1]?.focus();
      }
    } else {
      // Pasting full 6-digit code
      const digits = cleaned.slice(0, 6).split("");
      const updated = [...otpDigits];
      digits.forEach((d, i) => {
        if (i < 6) updated[i] = d;
      });
      setOtpDigits(updated);
      const nextIndex = Math.min(digits.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
    }

    const completeCode =
      cleaned.length === 1
        ? otpDigits.map((d, i) => (i === index ? cleaned : d)).join("")
        : cleaned.slice(0, 6);

    if (completeCode.length === 6) {
      submitOtpCode(completeCode);
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // 5. Submit OTP Verification (with auto-focus on error & shake animation)
  const submitOtpCode = async (codeToVerify?: string) => {
    const code = codeToVerify || otpDigits.join("");
    if (code.length !== 6 || !challengeId) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/resume/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId,
          code,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Invalid code. Please try again.");
      }

      // Secure Tab-Isolated Lifecycle: Store session token in sessionStorage for this tab only
      if (typeof window !== "undefined" && data.data?.sessionToken) {
        try {
          sessionStorage.setItem("resume_tab_token", data.data.sessionToken);
          sessionStorage.setItem("resume_tab_lifecycle_state", "active");
        } catch {
          // Fallback if sessionStorage is disabled/restricted
        }
      }

      // Immediately dismiss modal to eliminate any visual flash or lingering inputs
      setIsSuccessDismissing(true);
      onVerified();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed.";
      setErrorMsg(msg);
      // Trigger shake animation and reset inputs
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 450);
      setOtpDigits(["", "", "", "", "", ""]);
      // Automatically refocus first input box
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 60);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (step !== "otp" || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, countdown]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (!isOpen || isSuccessDismissing) return null;

  const hasToken = !!getEffectiveTurnstileToken();
  const isAbusive = email.trim() ? checkEmailAbuse(email).isAbusive : false;
  const isDetailsSubmitReady = hasToken && !isLoading && !isAbusive && !errorMsg;
  const isOtpSubmitReady = otpDigits.join("").length === 6 && !isLoading;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 dark:bg-black/85 backdrop-blur-xl animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
    >
      {/* Ambient subtle radial glow behind the card for luxurious depth */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-gradient-to-tr from-purple-500/10 via-indigo-500/10 to-transparent rounded-full blur-[110px] pointer-events-none" />

      {/* 
        High-End Engineered Card:
        Precision border reflections, layered specular shadows, and smooth 24px radius.
        Desktop: clamped strictly to 420px max width.
        Mobile: fluid width fitting 100dvh in ONE single view.
      */}
      <div
        style={{
          maxWidth: "432px",
          width: "100%",
          backgroundColor: isDark ? "#0E0D17" : "#FFFFFF",
          borderColor: isDark ? "rgba(255, 255, 255, 0.09)" : "rgba(226, 232, 240, 0.9)",
          color: isDark ? "#FFFFFF" : "#0F172A",
          boxShadow: isDark
            ? "0 0 0 1px rgba(255, 255, 255, 0.08), 0 1px 0 0 rgba(255, 255, 255, 0.12) inset, 0 24px 64px -12px rgba(0, 0, 0, 0.9)"
            : "0 0 0 1px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.02), 0 12px 32px -4px rgba(15, 23, 42, 0.08), 0 24px 64px -12px rgba(15, 23, 42, 0.14)",
        }}
        className={`relative w-full border rounded-2xl xs:rounded-3xl p-4.5 xs:p-6 sm:p-7 transition-all duration-200 ${
          isShaking ? "animate-shake" : ""
        }`}
      >
        {/* Minimal Tactile Theme Switcher */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title={isDark ? "Switch to light theme" : "Switch to dark theme"}
          style={{
            backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(241, 245, 249, 0.8)",
            borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(226, 232, 240, 0.8)",
            color: isDark ? "#FBBF24" : "#64748B",
          }}
          className="absolute top-4 right-4 w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
        >
          {isDark ? (
            <IoSunnyOutline className="w-4 h-4 text-amber-400" />
          ) : (
            <IoMoonOutline className="w-4 h-4" />
          )}
        </button>

        {/* Clean Header: Prominent Big Name + Subtitle Heading Below + Anti-Spam Notice */}
        <div className="text-center mb-5 pt-1 px-1">
          {step === "details" ? (
            <>
              <h2
                style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                className="text-3xl sm:text-[36px] font-black tracking-tight leading-none"
              >
                Gaurav Patil
              </h2>
              <p
                style={{ color: isDark ? "#C084FC" : "#7C3AED" }}
                className="text-xs sm:text-sm font-semibold tracking-wide mt-2"
              >
                Full Stack Software Engineer
              </p>
              <p
                style={{ color: isDark ? "#94A3B8" : "#64748B" }}
                className="text-[11px] sm:text-xs mt-2 leading-relaxed max-w-[290px] sm:max-w-[310px] mx-auto text-balance"
              >
                To prevent bot spam, please enter your email to view the resume.
              </p>
            </>
          ) : (
            <>
              <h2
                style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                className="text-3xl sm:text-[34px] font-black tracking-tight leading-none"
              >
                Verification Code
              </h2>
              <p
                style={{ color: isDark ? "#94A3B8" : "#64748B" }}
                className="text-xs sm:text-sm mt-2 leading-relaxed max-w-[300px] mx-auto"
              >
                Enter the 6-digit verification code sent to {email}
              </p>
            </>
          )}
        </div>

        {sessionExpired && !errorMsg && (
          <div
            style={{
              backgroundColor: isDark ? "rgba(180, 83, 9, 0.2)" : "#FFFBEB",
              borderColor: isDark ? "rgba(217, 119, 6, 0.4)" : "#FDE68A",
              color: isDark ? "#FCD34D" : "#B45309",
            }}
            className="mb-4 p-3 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in duration-150"
          >
            <IoAlertCircleOutline className="w-4 h-4 shrink-0 text-amber-500" />
            <span>Session expired after 30 minutes for security protection. Please re-enter your email to view.</span>
          </div>
        )}

        {errorMsg && (
          <div
            style={{
              backgroundColor: isDark ? "rgba(127, 29, 29, 0.25)" : "#FEF2F2",
              borderColor: isDark ? "rgba(185, 28, 28, 0.45)" : "#FECACA",
              color: isDark ? "#FCA5A5" : "#B91C1C",
            }}
            className="mb-4 p-3 rounded-xl border text-xs flex items-center justify-between gap-2 animate-in fade-in duration-150"
          >
            <div className="flex items-center gap-2">
              <IoAlertCircleOutline className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {/* Step 1: Email Form */}
        {step === "details" && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  style={{ color: isDark ? "#E2E8F0" : "#334155" }}
                  className="text-xs font-semibold tracking-wide"
                >
                  Email Address
                </label>
                {emailSuggestion && (
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(emailSuggestion);
                      setEmailSuggestion(null);
                    }}
                    style={{ color: isDark ? "#C084FC" : "#7C3AED" }}
                    className="text-[11px] font-medium hover:underline cursor-pointer transition-colors"
                  >
                    Did you mean {emailSuggestion}?
                  </button>
                )}
              </div>
              <div className="relative group">
                <IoMailOutline
                  style={{
                    color: errorMsg
                      ? isDark
                        ? "#F87171"
                        : "#EF4444"
                      : isDark
                      ? "#64748B"
                      : "#94A3B8",
                  }}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors group-focus-within:text-purple-500"
                />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onBlur={handleEmailBlur}
                  placeholder="recruiter@company.com or personal email"
                  style={{
                    backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#F8FAFC",
                    borderColor: errorMsg
                      ? isDark
                        ? "rgba(239, 68, 68, 0.7)"
                        : "#FCA5A5"
                      : isDark
                      ? "rgba(255, 255, 255, 0.12)"
                      : "#CBD5E1",
                    color: isDark ? "#FFFFFF" : "#0F172A",
                  }}
                  className={`w-full h-11 pl-10 pr-3.5 rounded-xl border text-sm placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none transition-all duration-150 ${
                    errorMsg
                      ? "border-red-500/80 focus:border-red-500 focus:ring-4 focus:ring-red-500/15"
                      : "focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
                  }`}
                />
              </div>
            </div>

            {/* Cloudflare Turnstile Widget (Clean dynamic space, no outer border) */}
            <div className="py-1 flex flex-col items-center justify-center min-h-[65px]">
              <div
                ref={turnstileContainerRef}
                className="w-full max-w-[300px] flex items-center justify-center min-h-[65px]"
                style={{ minHeight: "65px", width: "300px" }}
              />
              {!isTurnstileReady && (
                <div className="text-[11px] text-slate-400 py-0.5">
                  Cloudflare Protected
                </div>
              )}
            </div>

            {/* Submit Action: Confident, Specular Depth */}
            <button
              type="submit"
              disabled={!isDetailsSubmitReady}
              style={{
                backgroundColor: isDetailsSubmitReady
                  ? isDark
                    ? "#FFFFFF"
                    : "#0F172A"
                  : isDark
                  ? "#1E1D2A"
                  : "#F1F5F9",
                color: isDetailsSubmitReady
                  ? isDark
                    ? "#0F172A"
                    : "#FFFFFF"
                  : isDark
                  ? "#71717A"
                  : "#94A3B8",
                boxShadow: isDetailsSubmitReady
                  ? isDark
                    ? "0 4px 16px -2px rgba(255, 255, 255, 0.2), 0 2px 6px -1px rgba(255, 255, 255, 0.1)"
                    : "0 4px 16px -2px rgba(15, 23, 42, 0.25), 0 2px 6px -1px rgba(15, 23, 42, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.15)"
                  : "none",
                border: isDetailsSubmitReady
                  ? "none"
                  : isDark
                  ? "1px solid rgba(255, 255, 255, 0.06)"
                  : "1px solid #E2E8F0",
              }}
              className="w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer active:scale-[0.98] disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span style={{ color: "inherit", fontWeight: 600 }}>Sending code...</span>
                </>
              ) : (
                <>
                  <span style={{ color: "inherit", fontWeight: 600 }}>Continue</span>
                  <IoArrowForward
                    className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5"
                    style={{ color: "inherit" }}
                  />
                </>
              )}
            </button>
          </form>
        )}

        {/* Step 2: 6-Digit OTP */}
        {step === "otp" && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-1 xs:gap-1.5 sm:gap-2.5">
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    otpInputRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  disabled={isLoading}
                  style={{
                    backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#F8FAFC",
                    borderColor: errorMsg
                      ? "#EF4444"
                      : isDark
                      ? "rgba(255, 255, 255, 0.12)"
                      : "#CBD5E1",
                    color: errorMsg
                      ? "#EF4444"
                      : isDark
                      ? "#FFFFFF"
                      : "#0F172A",
                    boxShadow: isDark
                      ? "inset 0 1px 2px rgba(0,0,0,0.4)"
                      : "inset 0 1px 2px rgba(0,0,0,0.03)",
                  }}
                  className="w-8.5 xs:w-9.5 sm:w-11 h-10 xs:h-11 sm:h-12 text-center font-mono text-lg xs:text-xl sm:text-2xl font-bold rounded-lg sm:rounded-xl border transition-all duration-150 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
                />
              ))}
            </div>

            <div className="flex items-center justify-between text-xs px-1">
              <span
                style={{ color: isDark ? "#94A3B8" : "#64748B" }}
                className="flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Expires in{" "}
                <strong
                  style={{ color: isDark ? "#F1F5F9" : "#0F172A" }}
                  className="font-mono font-semibold"
                >
                  {formatCountdown(countdown)}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setStep("details");
                  setOtpDigits(["", "", "", "", "", ""]);
                  setErrorMsg(null);
                }}
                style={{ color: isDark ? "#C084FC" : "#7C3AED" }}
                className="hover:underline flex items-center gap-1 cursor-pointer font-medium transition-colors"
              >
                <IoRefreshOutline className="w-3.5 h-3.5" />
                Resend code
              </button>
            </div>

            <button
              type="button"
              onClick={() => submitOtpCode()}
              disabled={!isOtpSubmitReady}
              style={{
                backgroundColor: isOtpSubmitReady
                  ? isDark
                    ? "#FFFFFF"
                    : "#0F172A"
                  : isDark
                  ? "#1E1D2A"
                  : "#F1F5F9",
                color: isOtpSubmitReady
                  ? isDark
                    ? "#0F172A"
                    : "#FFFFFF"
                  : isDark
                  ? "#71717A"
                  : "#94A3B8",
                boxShadow: isOtpSubmitReady
                  ? isDark
                    ? "0 4px 16px -2px rgba(255, 255, 255, 0.2), 0 2px 6px -1px rgba(255, 255, 255, 0.1)"
                    : "0 4px 16px -2px rgba(15, 23, 42, 0.25), 0 2px 6px -1px rgba(15, 23, 42, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.15)"
                  : "none",
                border: isOtpSubmitReady
                  ? "none"
                  : isDark
                  ? "1px solid rgba(255, 255, 255, 0.06)"
                  : "1px solid #E2E8F0",
              }}
              className="w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer active:scale-[0.98] disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span style={{ color: "inherit", fontWeight: 600 }}>Verifying...</span>
                </>
              ) : (
                <span style={{ color: "inherit", fontWeight: 600 }}>View Resume</span>
              )}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setStep("details");
                  setErrorMsg(null);
                }}
                style={{ color: isDark ? "#94A3B8" : "#64748B" }}
                className="inline-flex items-center gap-1 text-xs hover:underline transition-colors cursor-pointer"
              >
                <IoArrowBackOutline className="w-3 h-3" />
                <span>Change email</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Navigation Dock */}
        <div
          style={{
            borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(226, 232, 240, 0.8)",
            borderTopWidth: "1px",
            borderTopStyle: "solid",
          }}
          className="mt-5 pt-3.5"
        >
          <div
            style={{
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#F8FAFC",
              borderColor: isDark ? "rgba(255, 255, 255, 0.07)" : "#E2E8F0",
            }}
            className="grid grid-cols-3 gap-1 p-1 rounded-xl border text-[11px] font-medium"
          >
            <a
              href="https://gauravpatil.site"
              target="_blank"
              rel="noopener noreferrer"
              title="Portfolio — Gaurav Patil"
              style={{ color: isDark ? "#A1A1AA" : "#64748B" }}
              className="py-1.5 px-2 rounded-lg text-center flex items-center justify-center gap-1 transition-all duration-150 group cursor-pointer hover:bg-white dark:hover:bg-white/10 hover:text-slate-950 dark:hover:text-white hover:shadow-xs active:scale-[0.98]"
            >
              <span>Portfolio</span>
              <IoOpenOutline className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100 transition-opacity" />
            </a>

            <a
              href="https://contact.gauravpatil.site"
              target="_blank"
              rel="noopener noreferrer"
              title="Recruiter Portal — Direct Messaging"
              style={{ color: isDark ? "#A1A1AA" : "#64748B" }}
              className="py-1.5 px-2 rounded-lg text-center flex items-center justify-center gap-1 transition-all duration-150 group cursor-pointer hover:bg-white dark:hover:bg-white/10 hover:text-purple-600 dark:hover:text-purple-400 hover:shadow-xs active:scale-[0.98]"
            >
              <span className="truncate">Recruiter Portal</span>
              <IoOpenOutline className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100 transition-opacity" />
            </a>

            <a
              href="https://gauravpatil.site/#contact"
              target="_blank"
              rel="noopener noreferrer"
              title="Gaurav Patil — Full Stack Software Engineer Building Production-Ready Digital Systems"
              style={{ color: isDark ? "#A1A1AA" : "#64748B" }}
              className="py-1.5 px-2 rounded-lg text-center flex items-center justify-center gap-1 transition-all duration-150 group cursor-pointer hover:bg-white dark:hover:bg-white/10 hover:text-slate-950 dark:hover:text-white hover:shadow-xs active:scale-[0.98]"
            >
              <span>Submit Form</span>
              <IoOpenOutline className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
