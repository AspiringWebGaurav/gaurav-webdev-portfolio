"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FaArrowRight,
  FaShieldAlt,
  FaCheck,
  FaPhone,
  FaCode,
  FaFilePdf,
  FaExclamationTriangle,
  FaRedo,
  FaBriefcase,
  FaSearch,
  FaChevronDown,
} from "react-icons/fa";
import { validateEmailWithTypo, getAutocorrectedEmail } from "@/lib/recruiter/validation";
import { getSubdomainUrl } from "@/lib/theme/navigation";

interface CountryOption {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  placeholder: string;
}

const GLOBAL_COUNTRIES: CountryOption[] = [
  { code: "IN", name: "India", dialCode: "+91", flag: "🇮🇳", placeholder: "98765 43210" },
  { code: "US", name: "United States", dialCode: "+1", flag: "🇺🇸", placeholder: "(555) 000-0000" },
  { code: "GB", name: "United Kingdom", dialCode: "+44", flag: "🇬🇧", placeholder: "7911 123456" },
  { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦", placeholder: "(555) 000-0000" },
  { code: "DE", name: "Germany", dialCode: "+49", flag: "🇩🇪", placeholder: "151 12345678" },
  { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷", placeholder: "6 12 34 56 78" },
  { code: "AU", name: "Australia", dialCode: "+61", flag: "🇦🇺", placeholder: "412 345 678" },
  { code: "SG", name: "Singapore", dialCode: "+65", flag: "🇸🇬", placeholder: "8123 4567" },
  { code: "AE", name: "UAE", dialCode: "+971", flag: "🇦🇪", placeholder: "50 123 4567" },
  { code: "NL", name: "Netherlands", dialCode: "+31", flag: "🇳🇱", placeholder: "6 12345678" },
  { code: "CH", name: "Switzerland", dialCode: "+41", flag: "🇨🇭", placeholder: "79 123 45 67" },
  { code: "SE", name: "Sweden", dialCode: "+46", flag: "🇸🇪", placeholder: "70 123 45 67" },
  { code: "IE", name: "Ireland", dialCode: "+353", flag: "🇮🇪", placeholder: "87 123 4567" },
  { code: "JP", name: "Japan", dialCode: "+81", flag: "🇯🇵", placeholder: "90 1234 5678" },
  { code: "ES", name: "Spain", dialCode: "+34", flag: "🇪🇸", placeholder: "612 34 56 78" },
  { code: "IT", name: "Italy", dialCode: "+39", flag: "🇮🇹", placeholder: "312 345 6789" },
  { code: "BR", name: "Brazil", dialCode: "+55", flag: "🇧🇷", placeholder: "11 91234-5678" },
  { code: "ZA", name: "South Africa", dialCode: "+27", flag: "🇿🇦", placeholder: "71 123 4567" },
  { code: "NZ", name: "New Zealand", dialCode: "+64", flag: "🇳🇿", placeholder: "21 123 456" },
  { code: "IL", name: "Israel", dialCode: "+972", flag: "🇮🇱", placeholder: "50 123 4567" },
  { code: "PL", name: "Poland", dialCode: "+48", flag: "🇵🇱", placeholder: "512 345 678" },
];

interface RecruiterAccessGateProps {
  onSuccess: (recruiter: { name: string; company: string; email: string }) => void;
}

// Field Validators for HR / Recruiter Intake
const validateName = (val: string): string | null => {
  const trimmed = val.trim();
  if (!trimmed) return "Please enter your full name.";
  if (trimmed.length < 2) return "Name must be at least 2 characters.";
  if (trimmed.length > 80) return "Name cannot exceed 80 characters.";
  if (!/^[a-zA-ZÀ-ÿ\s'.-]+$/.test(trimmed)) {
    return "Please enter a valid name using letters only.";
  }
  return null;
};

const validateCompany = (val: string): string | null => {
  const trimmed = val.trim();
  if (!trimmed) return "Please enter your company or organization.";
  if (trimmed.length < 2) return "Company name must be at least 2 characters.";
  if (trimmed.length > 100) return "Company name cannot exceed 100 characters.";
  if (!/[a-zA-Z0-9]{2,}/.test(trimmed)) {
    return "Please enter a valid company name.";
  }
  return null;
};


const validatePhone = (val: string): string | null => {
  const trimmed = val.trim();
  if (!trimmed) return null; // Phone is optional
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 7) {
    return "Phone number is too short (min 7 digits).";
  }
  if (digits.length > 15) {
    return "Phone number is too long (max 15 digits).";
  }
  if (/^(\d)\1+$/.test(digits)) {
    return "Please enter a valid phone number.";
  }
  return null;
};

export function RecruiterAccessGate({ onSuccess }: RecruiterAccessGateProps) {
  // Step 1: Info Form, Step 2: OTP Verification
  const [step, setStep] = useState<"FORM" | "OTP">("FORM");

  // Form State
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(GLOBAL_COUNTRIES[0]);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const countryDropdownRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // Field validation and touched tracking
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const emailValidation = validateEmailWithTypo(email);

  const fieldErrors = {
    name: validateName(name),
    company: validateCompany(company),
    email: emailValidation.isValid ? null : (emailValidation.error || "Please enter a valid email."),
    phone: validatePhone(phoneNumber),
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Close searchable country dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
    };
    if (isCountryDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 40);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCountryDropdownOpen]);

  const filteredCountries = GLOBAL_COUNTRIES.filter((c) => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.dialCode.includes(q)
    );
  });

  // OTP State
  const [challengeId, setChallengeId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);

  // Setup Turnstile Script
  const turnstileSiteKey =
    process.env.NEXT_PUBLIC_RECRUITER_TURNSTILE_SITE_KEY ||
    "0x4AAAAAAFK5EIqLbibzxLzf";

  const renderTurnstile = useCallback(() => {
    if (typeof window === "undefined" || !turnstileContainerRef.current) return;
    const win = window as unknown as {
      turnstile?: {
        render: (
          el: HTMLElement,
          opts: {
            sitekey: string;
            action?: string;
            callback: (token: string) => void;
            "error-callback"?: () => void;
            "expired-callback"?: () => void;
            theme?: "dark" | "light" | "auto";
          }
        ) => string;
        reset: (id: string) => void;
        remove: (id: string) => void;
      };
    };

    if (!win.turnstile) return;

    if (turnstileWidgetIdRef.current) {
      try {
        win.turnstile.remove(turnstileWidgetIdRef.current);
      } catch {
        // ignore
      }
      turnstileWidgetIdRef.current = null;
    }

    try {
      const id = win.turnstile.render(turnstileContainerRef.current, {
        sitekey: turnstileSiteKey,
        action: "contact_portal",
        theme: "light",
        callback: (token: string) => {
          setTurnstileToken(token);
        },
        "expired-callback": () => {
          setTurnstileToken(null);
          if (turnstileWidgetIdRef.current && win.turnstile) {
            try {
              win.turnstile.reset(turnstileWidgetIdRef.current);
            } catch {
              // ignore
            }
          }
        },
        "error-callback": () => {
          setTurnstileToken(null);
        },
      });
      turnstileWidgetIdRef.current = id;
    } catch (err) {
      console.warn("Turnstile render error:", err);
    }
  }, [turnstileSiteKey]);

  useEffect(() => {
    if (step !== "FORM") return;
    const win = window as unknown as { turnstile?: unknown };
    if (win.turnstile && turnstileContainerRef.current) {
      renderTurnstile();
    }
  }, [step, renderTurnstile]);

  useEffect(() => {
    if (step !== "FORM") return;

    const win = window as unknown as { turnstile?: unknown };
    if (!win.turnstile) {
      const scriptId = "cf-turnstile-script";
      if (!document.getElementById(scriptId)) {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.onload = () => {
          renderTurnstile();
        };
        document.head.appendChild(script);
      }
    } else {
      renderTurnstile();
    }

    return () => {
      if (
        turnstileWidgetIdRef.current &&
        (window as unknown as { turnstile?: { remove: (id: string) => void } }).turnstile
      ) {
        try {
          (window as unknown as { turnstile: { remove: (id: string) => void } }).turnstile.remove(
            turnstileWidgetIdRef.current
          );
        } catch {
          // ignore
        }
        turnstileWidgetIdRef.current = null;
      }
    };
  }, [step, renderTurnstile]);

  // Resend Cooldown Countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // 1. Submit Access Request -> Validates Inputs & Sends OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, company: true, email: true, phone: true });

    // Autocorrect common domain typos like gmal.com -> gmail.com
    const finalEmail = getAutocorrectedEmail(email.trim());
    if (finalEmail !== email) {
      setEmail(finalEmail);
    }

    const currentEmailValidation = validateEmailWithTypo(finalEmail);
    if (fieldErrors.name || fieldErrors.company || !currentEmailValidation.isValid || fieldErrors.phone) {
      setErrorMessage(currentEmailValidation.error || "Please correct the highlighted fields before proceeding.");
      return;
    }

    if (!turnstileToken) {
      setErrorMessage("Please complete the Cloudflare security verification below.");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const cleanPhone = phoneNumber.trim();
      const fullPhone = cleanPhone ? `${selectedCountry.dialCode} ${cleanPhone}` : undefined;

      const res = await fetch("/api/contact-portal/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          company: company.trim(),
          email: finalEmail,
          phone: fullPhone,
          turnstileToken,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (
          turnstileWidgetIdRef.current &&
          (window as unknown as { turnstile?: { reset: (id: string) => void } }).turnstile
        ) {
          try {
            (window as unknown as { turnstile: { reset: (id: string) => void } }).turnstile.reset(
              turnstileWidgetIdRef.current
            );
          } catch {
            // ignore
          }
        }
        setTurnstileToken(null);
        setErrorMessage(data.error || "Failed to send verification code. Please try again.");
        setIsLoading(false);
        return;
      }

      setChallengeId(data.data.challengeId);
      setStep("OTP");
      setResendCooldown(60);
      setSuccessNotice(`Verification code sent to ${email}`);
    } catch {
      setErrorMessage("Network error. Please check your connection and retry.");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Submit 6-Digit Code -> Verifies OTP & Issues Session Cookie
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.trim().length !== 6) {
      setErrorMessage("Please enter the 6-digit access code.");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/contact-portal/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId,
          code: otpCode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMessage(data.error || "Verification failed.");
        if (typeof data.remainingAttempts === "number") {
          setRemainingAttempts(data.remainingAttempts);
        }
        setIsLoading(false);
        return;
      }

      // Success! Recruiter verified
      onSuccess(data.data.recruiter);
    } catch {
      setErrorMessage("Verification request failed. Please try again.");
      setIsLoading(false);
    }
  };

  // 3. Resend OTP
  const handleResend = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const cleanPhone = phoneNumber.trim();
      const fullPhone = cleanPhone ? `${selectedCountry.dialCode} ${cleanPhone}` : undefined;

      const finalEmail = getAutocorrectedEmail(email.trim());

      const res = await fetch("/api/contact-portal/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          company: company.trim(),
          email: finalEmail,
          phone: fullPhone,
          turnstileToken: turnstileToken || "client_direct_token",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMessage(data.error || "Failed to resend code.");
        setIsLoading(false);
        return;
      }

      setChallengeId(data.data.challengeId);
      setResendCooldown(60);
      setSuccessNotice("New 6-digit code sent!");
      setOtpCode("");
    } catch {
      setErrorMessage("Failed to resend. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full flex flex-col justify-between bg-[#FFFFFF] text-black relative overflow-hidden select-none animate-in fade-in duration-150">
      {/* 1. Edge-to-Edge Top Navigation Bar */}
      <header className="w-full h-12 sm:h-[57px] bg-[#FFFFFF] px-4 sm:px-10 lg:px-16 flex items-center justify-between z-20 relative shrink-0 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="font-admin-sans text-[18px] sm:text-[24px] font-extrabold tracking-tight text-black">
            recruiter portal<span className="text-[#7C3AED]">.</span>
          </span>
          <span className="hidden sm:inline text-[#CBD5E1] text-sm">/</span>
          <span className="hidden sm:inline text-xs uppercase tracking-wider text-[#64748B] font-semibold">
            Candidate Info & Live Chat
          </span>
        </div>
      </header>

      {/* 2. Main Edge-to-Edge Workspace */}
      <main className="flex-1 min-h-0 w-full bg-[#FFFFFF] flex flex-col justify-center relative z-10 overflow-hidden">
        {/* Two-Column Edge-to-Edge Terminal on Desktop / Single View on Mobile */}
        <div className="flex-1 min-h-0 w-full flex flex-col md:flex-row relative z-10 px-4 sm:px-10 lg:px-16 py-2 sm:py-6 md:py-8 justify-center md:justify-between items-center gap-4 lg:gap-16 overflow-hidden">
          {/* Left Column: Briefing for Recruiters (Visible on md+ desktop, hidden on mobile for 100dvh single-screen view) */}
          <div className="hidden md:flex flex-1 max-w-xl lg:max-w-2xl flex-col justify-between py-2">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#F5F3FF] border border-[#DDD6FE] text-[#7C3AED] text-xs font-semibold tracking-wide uppercase mb-4">
                <FaBriefcase className="text-[11px]" />
                <span>For Recruiters & Hiring Teams</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-admin-sans tracking-tight text-black mb-4 leading-tight">
                Candidate Info & Contact<span className="text-[#7C3AED]">.</span>
              </h1>

              <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-xl mb-8">
                Instant access to Gaurav Patil&apos;s verified resume, direct phone number, live WhatsApp chat, and technical background for hiring and interview scheduling.
              </p>

              {/* Feature Rows */}
              <div className="space-y-4 max-w-xl">
                <div className="pb-3 border-b border-[#F1F5F9] flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#7C3AED] text-xs shrink-0 mt-0.5">
                    <FaPhone className="text-[11px]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Direct Phone & Live Chat
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Connect directly via phone or WhatsApp for quick candidate screening and interview scheduling.
                    </p>
                  </div>
                </div>

                <div className="pb-3 border-b border-[#F1F5F9] flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#7C3AED] text-xs shrink-0 mt-0.5">
                    <FaCode className="text-[11px]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Technical Skills & Projects
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Review live production applications, architecture breakdowns, and full engineering background.
                    </p>
                  </div>
                </div>

                <div className="pb-3 border-b border-[#F1F5F9] flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#7C3AED] text-xs shrink-0 mt-0.5">
                    <FaFilePdf className="text-[11px]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Instant Resume Download
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Download the updated 1-page PDF resume or send a direct copy to your hiring inbox.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 text-xs text-gray-500 flex items-center gap-2">
              <FaShieldAlt className="text-emerald-600 text-xs" />
              <span>Quick 1-step email verification • No signup or password needed</span>
            </div>
          </div>

          {/* Right Column: Clean Architectural Form */}
          <div className="w-full max-w-[420px] md:max-w-none md:w-[420px] lg:w-[460px] flex flex-col justify-center shrink-0">
            {/* Mobile Header Hero */}
            <div className="md:hidden text-center mb-2 sm:mb-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F5F3FF] border border-[#DDD6FE] text-[#7C3AED] text-[10px] font-semibold tracking-wide uppercase mb-1">
                <FaBriefcase className="text-[9px]" />
                <span>For Recruiters & Hiring Teams</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-black leading-tight">
                Candidate Info & Direct Chat<span className="text-[#7C3AED]">.</span>
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Verified resume, direct phone, and live WhatsApp chat
              </p>
            </div>

            {errorMessage && (
              <div className="mb-2 sm:mb-4 p-2 sm:p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-[11px] sm:text-xs flex items-center gap-2 animate-in fade-in">
                <FaExclamationTriangle className="text-red-500 shrink-0 text-[10px] sm:text-xs" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successNotice && (
              <div className="mb-2 sm:mb-4 p-2 sm:p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] sm:text-xs flex items-center gap-2 animate-in fade-in">
                <FaCheck className="text-emerald-600 shrink-0 text-[10px] sm:text-xs" />
                <span>{successNotice}</span>
              </div>
            )}

            {step === "FORM" ? (
              <form onSubmit={handleSendOtp} noValidate className="space-y-2.5 sm:space-y-3">
                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 uppercase font-admin-mono tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => handleBlur("name")}
                    placeholder="e.g. John Doe"
                    className={`w-full h-10 sm:h-10.5 px-3 rounded-lg bg-[#FFFFFF] border text-black placeholder:text-gray-400 text-sm focus:outline-none transition shadow-2xs ${
                      touched.name && fieldErrors.name
                        ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50/10"
                        : "border-[#CBD5E1] focus:border-black focus:ring-1 focus:ring-black"
                    }`}
                  />
                  {touched.name && fieldErrors.name && (
                    <p className="text-[10px] text-red-600 mt-0.5 flex items-center gap-1 animate-in fade-in duration-150">
                      <FaExclamationTriangle className="text-[9px] shrink-0" />
                      <span>{fieldErrors.name}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 uppercase font-admin-mono tracking-wider mb-1">
                    Company / Organization *
                  </label>
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    onBlur={() => handleBlur("company")}
                    placeholder="e.g. Acme Corp / Company"
                    className={`w-full h-10 sm:h-10.5 px-3 rounded-lg bg-[#FFFFFF] border text-black placeholder:text-gray-400 text-sm focus:outline-none transition shadow-2xs ${
                      touched.company && fieldErrors.company
                        ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50/10"
                        : "border-[#CBD5E1] focus:border-black focus:ring-1 focus:ring-black"
                    }`}
                  />
                  {touched.company && fieldErrors.company && (
                    <p className="text-[10px] text-red-600 mt-0.5 flex items-center gap-1 animate-in fade-in duration-150">
                      <FaExclamationTriangle className="text-[9px] shrink-0" />
                      <span>{fieldErrors.company}</span>
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 uppercase font-admin-mono tracking-wider">
                      Email or Work Email *
                    </label>
                    {email.trim().length > 4 && !emailValidation.isValid && emailValidation.suggestion && (
                      <button
                        type="button"
                        onClick={() => {
                          setEmail(emailValidation.suggestion!);
                          setTouched((prev) => ({ ...prev, email: false }));
                        }}
                        className="text-[10px] sm:text-xs font-semibold text-[#7C3AED] hover:underline cursor-pointer flex items-center gap-1 animate-pulse"
                      >
                        Use {emailValidation.suggestion}?
                      </button>
                    )}
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => {
                      handleBlur("email");
                      const corrected = getAutocorrectedEmail(email);
                      if (corrected !== email) {
                        setEmail(corrected);
                      }
                    }}
                    placeholder="john.doe@company.com or personal email"
                    className={`w-full h-10 sm:h-10.5 px-3 rounded-lg bg-[#FFFFFF] border text-black placeholder:text-gray-400 text-sm focus:outline-none transition shadow-2xs ${
                      (touched.email || (email.trim().length > 3 && (email.includes("@") || email.includes(".")))) && fieldErrors.email
                        ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50/10"
                        : "border-[#CBD5E1] focus:border-black focus:ring-1 focus:ring-black"
                    }`}
                  />
                  {(touched.email || (email.trim().length > 3 && (email.includes("@") || email.includes(".")))) && fieldErrors.email && (
                    <div className="mt-1 flex items-start justify-between gap-1 text-[10px] leading-tight">
                      <p className="text-red-600 flex items-start gap-1">
                        <FaExclamationTriangle className="text-[9px] shrink-0 mt-0.5" />
                        <span>{fieldErrors.email}</span>
                      </p>
                      {emailValidation.suggestion && (
                        <button
                          type="button"
                          onClick={() => {
                            setEmail(emailValidation.suggestion!);
                            setTouched((prev) => ({ ...prev, email: false }));
                          }}
                          className="text-[#7C3AED] font-semibold underline shrink-0 hover:text-[#6D28D9] cursor-pointer ml-1"
                        >
                          Use {emailValidation.suggestion}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 uppercase font-admin-mono tracking-wider mb-1">
                    Phone / Mobile (Optional)
                  </label>
                  <div className="relative" ref={countryDropdownRef}>
                    <div
                      className={`w-full h-10 sm:h-10.5 rounded-lg bg-[#FFFFFF] border flex items-center shadow-2xs transition overflow-hidden ${
                        touched.phone && fieldErrors.phone
                          ? "border-red-500 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500 bg-red-50/10"
                          : "border-[#CBD5E1] focus-within:border-black focus-within:ring-1 focus-within:ring-black"
                      }`}
                    >
                      {/* Custom Searchable Country Trigger */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsCountryDropdownOpen((prev) => !prev);
                          setCountrySearch("");
                        }}
                        className="h-full px-2.5 sm:px-3 bg-[#F8FAFC] border-r border-[#CBD5E1] flex items-center gap-1.5 text-xs sm:text-sm font-medium text-black hover:bg-[#F1F5F9] transition focus:outline-none shrink-0"
                        title="Select Country Code"
                      >
                        <span className="text-sm sm:text-base leading-none">{selectedCountry.flag}</span>
                        <span className="font-admin-mono text-xs font-semibold">{selectedCountry.dialCode}</span>
                        <FaChevronDown
                          className={`text-[8px] text-gray-500 transition-transform ${
                            isCountryDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        onBlur={() => handleBlur("phone")}
                        placeholder={selectedCountry.placeholder}
                        className="flex-1 h-full px-3 bg-transparent text-black placeholder:text-gray-400 text-sm focus:outline-none"
                      />
                    </div>

                    {/* Popover Dropdown (Opens downwards with search box, unclipped) */}
                    {isCountryDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1.5 w-64 max-w-[90vw] bg-white border border-[#CBD5E1] rounded-md shadow-2xl z-50 overflow-hidden animate-in fade-in duration-100 flex flex-col">
                        {/* Search Input Header */}
                        <div className="p-2 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center gap-2">
                          <FaSearch className="text-gray-400 text-xs shrink-0 ml-1" />
                          <input
                            ref={searchInputRef}
                            type="text"
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            placeholder="Search country or code..."
                            className="w-full bg-transparent text-xs text-black placeholder:text-gray-400 focus:outline-none"
                          />
                          {countrySearch && (
                            <button
                              type="button"
                              onClick={() => setCountrySearch("")}
                              className="text-gray-400 hover:text-black text-xs px-1"
                            >
                              ×
                            </button>
                          )}
                        </div>

                        {/* Scrollable Country List */}
                        <div className="max-h-48 overflow-y-auto py-1">
                          {filteredCountries.length > 0 ? (
                            filteredCountries.map((c) => (
                              <button
                                key={c.code}
                                type="button"
                                onClick={() => {
                                  setSelectedCountry(c);
                                  setIsCountryDropdownOpen(false);
                                  setCountrySearch("");
                                }}
                                className={`w-full px-3 py-1.5 text-left flex items-center justify-between text-xs transition ${
                                  selectedCountry.code === c.code
                                    ? "bg-[#F5F3FF] text-[#7C3AED] font-semibold"
                                    : "text-gray-700 hover:bg-[#F8FAFC] hover:text-black"
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate pr-2">
                                  <span className="text-sm shrink-0">{c.flag}</span>
                                  <span className="truncate">{c.name}</span>
                                </div>
                                <span className="font-admin-mono text-[11px] text-gray-500 shrink-0">
                                  {c.dialCode}
                                </span>
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-4 text-center text-xs text-gray-400 font-admin-sans">
                              No matching country
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {touched.phone && fieldErrors.phone && (
                    <p className="text-[10px] text-red-600 mt-0.5 flex items-center gap-1 animate-in fade-in duration-150">
                      <FaExclamationTriangle className="text-[9px] shrink-0" />
                      <span>{fieldErrors.phone}</span>
                    </p>
                  )}
                </div>

                {/* Turnstile Container - Exactly 65px pre-allocated fixed space so nothing flexes or shifts */}
                <div
                  ref={turnstileContainerRef}
                  className="w-full h-[65px] min-h-[65px] max-h-[65px] flex items-center justify-center my-1 shrink-0 overflow-hidden"
                />

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-black hover:bg-neutral-800 text-white font-semibold text-xs sm:text-sm rounded-lg transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Sending Code...</span>
                    </div>
                  ) : (
                    <>
                      <span>Get Verification Code</span>
                      <FaArrowRight className="text-xs" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3 sm:space-y-4 my-auto">
                <div className="md:hidden text-center mb-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F5F3FF] border border-[#DDD6FE] text-[#7C3AED] text-[10px] font-semibold tracking-wide uppercase mb-1">
                    <FaShieldAlt className="text-[9px]" />
                    <span>Security Verification</span>
                  </div>
                  <h1 className="text-xl font-bold tracking-tight text-black leading-tight">
                    Enter Verification Code<span className="text-[#7C3AED]">.</span>
                  </h1>
                </div>

                <div className="p-3 sm:p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-center">
                  <div className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">
                    Enter 6-Digit Code
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    We sent a verification code to{" "}
                    <strong className="text-black font-semibold">{email}</strong>.
                  </p>
                </div>

                <div>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full h-12 sm:h-13 text-center text-xl sm:text-2xl font-mono tracking-[0.4em] font-bold bg-[#FFFFFF] border border-[#CBD5E1] text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black rounded-lg shadow-2xs"
                  />
                  {remainingAttempts !== null && (
                    <div className="text-[11px] font-admin-mono text-red-600 mt-1 text-center">
                      {remainingAttempts} attempt(s) remaining before lockout.
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otpCode.length !== 6}
                  className="w-full h-11 bg-black hover:bg-neutral-800 text-white font-semibold text-xs sm:text-sm rounded-lg transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Verifying Code...</span>
                    </div>
                  ) : (
                    <>
                      <span>View Candidate Info & Chat</span>
                      <FaArrowRight className="text-xs" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between pt-1 text-xs font-admin-mono text-gray-500">
                  <button
                    type="button"
                    onClick={() => setStep("FORM")}
                    className="hover:text-black underline underline-offset-2 transition"
                  >
                    ← Edit Details
                  </button>

                  <button
                    type="button"
                    disabled={resendCooldown > 0 || isLoading}
                    onClick={handleResend}
                    className="hover:text-black transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <FaRedo className={`text-[10px] ${resendCooldown > 0 ? "animate-spin" : ""}`} />
                    <span>
                      {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : "Resend Code"}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* 3. Edge-to-Edge Footer */}
      <footer className="w-full h-10 sm:h-[45px] bg-[#FFFFFF] px-4 sm:px-10 lg:px-16 flex items-center justify-between text-[11px] sm:text-xs text-[#64748B] z-20 relative shrink-0 border-t border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <span>recruiter portal · Gaurav Patil</span>
          <span>·</span>
          <a
            href={getSubdomainUrl("https://resume.gauravpatil.site")}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#7C3AED] hover:underline font-medium"
          >
            resume.gauravpatil.site
          </a>
        </div>
        <span className="hidden sm:inline">Direct hiring & candidate contact</span>
      </footer>
    </div>
  );
}
