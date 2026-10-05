"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  FaPhone,
  FaWhatsapp,
  FaEnvelope,
  FaLinkedin,
  FaGithub,
  FaLock,
  FaCheckCircle,
  FaSpinner,
  FaArrowLeft,
  FaCopy,
  FaCheck,
  FaExternalLinkAlt,
} from "react-icons/fa";
import type { ProtectedContactPayload } from "@/types/recruiter";
import { useTheme } from "@/lib/theme";

interface ContactScreenProps {
  recruiter: { name: string; company: string; email: string };
  onTrackAction: (action: string, metadata?: Record<string, unknown>) => void;
}

export function ContactScreen({ recruiter, onTrackAction }: ContactScreenProps) {
  const [contactData, setContactData] = useState<ProtectedContactPayload | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("recruiter_contact_payload");
        if (stored) {
          const parsed = JSON.parse(stored) as ProtectedContactPayload;
          const isUnmasked = sessionStorage.getItem("recruiter_phone_unmasked") === "true";
          if (isUnmasked) {
            return {
              ...parsed,
              isMasked: false,
              phone: parsed.phone,
              phoneDisplay:
                parsed.phoneDisplay && parsed.phoneDisplay !== "•• ••••• •••••"
                  ? parsed.phoneDisplay
                  : "•• ••••• •••••",
              whatsappUrl: parsed.whatsappUrl,
              secondaryPhone: parsed.secondaryPhone,
              secondaryPhoneDisplay:
                parsed.secondaryPhoneDisplay && parsed.secondaryPhoneDisplay !== "•• ••••• •••••"
                  ? parsed.secondaryPhoneDisplay
                  : "•• ••••• •••••",
            };
          }
          return parsed;
        }
      } catch {
        // ignore
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return !sessionStorage.getItem("recruiter_contact_payload");
      } catch {
        // ignore
      }
    }
    return true;
  });
  const [error, setError] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Cloudflare Turnstile Verification State
  const [isTurnstileVerified, setIsTurnstileVerified] = useState<boolean>(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);

  const { resolvedTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);
  useEffect(() => {
    setThemeMounted(true);
  }, []);
  const isDark = themeMounted ? resolvedTheme === "dark" : false;

  const turnstileSiteKey =
    process.env.NEXT_PUBLIC_RECRUITER_TURNSTILE_SITE_KEY ||
    "0x4AAAAAAFK5EIqLbibzxLzf";

  // Check if session already verified Turnstile
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("contact_turnstile_verified");
      if (stored === "true") {
        setIsTurnstileVerified(true);
      }
    }
  }, []);

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
        theme: isDark ? "dark" : "light",
        callback: (token: string) => {
          setTurnstileToken(token);
          try {
            sessionStorage.setItem("contact_turnstile_verified", "true");
          } catch {
            // ignore
          }
          setTimeout(() => {
            setIsTurnstileVerified(true);
          }, 350);
        },
        "expired-callback": () => {
          setTurnstileToken(null);
          setIsTurnstileVerified(false);
          try {
            sessionStorage.removeItem("contact_turnstile_verified");
          } catch {
            // ignore
          }
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
          setIsTurnstileVerified(false);
          try {
            sessionStorage.removeItem("contact_turnstile_verified");
          } catch {
            // ignore
          }
        },
      });
      turnstileWidgetIdRef.current = id;
    } catch (err) {
      console.warn("Turnstile render error in ContactScreen:", err);
    }
  }, [turnstileSiteKey, isDark]);

  // Re-render Turnstile dynamically when theme toggles
  useEffect(() => {
    if (isTurnstileVerified || !themeMounted) return;
    const win = window as unknown as { turnstile?: unknown };
    if (win.turnstile && turnstileContainerRef.current) {
      renderTurnstile();
    }
  }, [isDark, isTurnstileVerified, themeMounted, renderTurnstile]);

  useEffect(() => {
    if (isTurnstileVerified) return;

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
      } else {
        const existingScript = document.getElementById(scriptId) as HTMLScriptElement;
        const prevOnload = existingScript.onload;
        existingScript.onload = (ev) => {
          if (typeof prevOnload === "function") {
            (prevOnload as (this: GlobalEventHandlers, ev: Event) => unknown).call(existingScript, ev);
          }
          renderTurnstile();
        };
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
  }, [isTurnstileVerified, renderTurnstile]);

  // OTP Unmask State
  const [isEnteringOtp, setIsEnteringOtp] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Email Copy State
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const handleCopyEmail = (email: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(email);
    }
    setCopiedEmail(email);
    setTimeout(() => {
      setCopiedEmail((curr) => (curr === email ? null : curr));
    }, 2000);
  };

  const handleCopyPhone = (number: string, lineKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(number);
    }
    setCopiedPhone(lineKey);
    setTimeout(() => {
      setCopiedPhone((curr) => (curr === lineKey ? null : curr));
    }, 2000);
  };

  const contactDataRef = useRef(contactData);
  contactDataRef.current = contactData;

  // Fetch initial protected contact payload
  useEffect(() => {
    let isMounted = true;
    async function fetchContact() {
      try {
        const res = await fetch("/api/contact-portal/protected-contact");
        const json = await res.json();
        if (isMounted) {
          if (res.ok && json.ok) {
            let freshData = json.data as ProtectedContactPayload;
            // Session persistence: if previously unmasked in this session, keep unmasked!
            const currentData = contactDataRef.current;
            const isSessionUnmasked =
              typeof window !== "undefined" &&
              (sessionStorage.getItem("recruiter_phone_unmasked") === "true" ||
                Boolean(currentData && !currentData.isMasked));

            if (isSessionUnmasked && freshData.isMasked && currentData && !currentData.isMasked) {
              freshData = {
                ...freshData,
                isMasked: false,
                phone: currentData.phone,
                phoneDisplay: currentData.phoneDisplay,
                whatsappUrl: currentData.whatsappUrl,
                secondaryPhone: currentData.secondaryPhone,
                secondaryPhoneDisplay: currentData.secondaryPhoneDisplay,
              };
            }

            setContactData(freshData);
            if (typeof window !== "undefined") {
              try {
                sessionStorage.setItem("recruiter_contact_payload", JSON.stringify(freshData));
                if (!freshData.isMasked) {
                  sessionStorage.setItem("recruiter_phone_unmasked", "true");
                }
              } catch {
                // ignore
              }
            }
          } else {
            if (!contactDataRef.current) {
              setError(json.error || "Failed to load protected contact data.");
            }
          }
          setIsLoading(false);
        }
      } catch {
        if (isMounted) {
          if (!contactDataRef.current) {
            setError("Network error fetching direct contact info.");
          }
          setIsLoading(false);
        }
      }
    }
    fetchContact();
    return () => {
      isMounted = false;
    };
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus first OTP input when entering OTP mode
  useEffect(() => {
    if (isEnteringOtp && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [isEnteringOtp]);

  // Request Phone Unmask OTP
  const handleRequestOtp = async () => {
    setIsSendingOtp(true);
    setOtpError(null);
    try {
      onTrackAction("REQUEST_PHONE_OTP");
      const res = await fetch("/api/contact-portal/phone/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turnstileToken }),
      });
      const json = await res.json();

      if (res.ok && json.ok) {
        if (json.alreadyUnmasked) {
          // If already unmasked on session, refresh contact data
          const refetchRes = await fetch("/api/contact-portal/protected-contact");
          const refetchJson = await refetchRes.json();
          if (refetchRes.ok && refetchJson.ok) {
            setContactData(refetchJson.data);
            if (typeof window !== "undefined") {
              sessionStorage.setItem("recruiter_phone_unmasked", "true");
              sessionStorage.setItem("recruiter_contact_payload", JSON.stringify(refetchJson.data));
            }
          }
          setIsSendingOtp(false);
          return;
        }

        setChallengeId(json.data.challengeId);
        setIsEnteringOtp(true);
        setOtpDigits(["", "", "", "", "", ""]);
        setResendCooldown(60);
      } else {
        setOtpError(json.error || "Failed to send access code. Please try again.");
      }
    } catch {
      setOtpError("Network error requesting verification code.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify Phone Unmask OTP
  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otpDigits.join("");
    if (code.length !== 6 || !challengeId) return;

    setIsVerifyingOtp(true);
    setOtpError(null);

    try {
      const res = await fetch("/api/contact-portal/phone/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, code }),
      });
      const json = await res.json();

      if (res.ok && json.ok) {
        onTrackAction("UNMASK_PHONE");
        const unmasked: ProtectedContactPayload = {
          ...(contactData || {
            email: "gaurav.patil@gauravpatil.site",
            emails: [
              { email: "gaurav.patil@gauravpatil.site", label: "Direct Recruiter & Personal", badge: "Primary" },
              { email: "work@gauravpatil.site", label: "Consulting & Contract Proposals", badge: "Work" },
              { email: "hello@gauravpatil.site", label: "General & Auto-Reply Gateway", badge: "Hello" },
              { email: "gaurav@gauravpatil.site", label: "Core Engineering Inbox", badge: "Direct" },
            ],
            linkedin: "https://linkedin.com/in/gaurav-patil-site",
            github: "https://github.com/AspiringWebGaurav",
          }),
          isMasked: false,
          phone: json.data.phone || null,
          phoneDisplay: json.data.phoneDisplay || "",
          whatsappUrl: json.data.whatsappUrl || null,
          secondaryPhone: json.data.secondaryPhone || null,
          secondaryPhoneDisplay: json.data.secondaryPhoneDisplay || "",
        };

        setContactData(unmasked);
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem("recruiter_phone_unmasked", "true");
            sessionStorage.setItem("recruiter_contact_payload", JSON.stringify(unmasked));
          } catch {
            // ignore
          }
        }
        setIsEnteringOtp(false);
      } else {
        setOtpError(json.error || "Verification failed. Please check the code.");
        setOtpDigits(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setOtpError("Network error verifying code. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || !challengeId || isResending) return;
    setIsResending(true);
    setOtpError(null);

    try {
      const res = await fetch("/api/contact-portal/phone/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId }),
      });
      const json = await res.json();

      if (res.ok && json.ok) {
        setResendCooldown(60);
        setOtpDigits(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        setOtpError(json.error || "Failed to resend code.");
      }
    } catch {
      setOtpError("Network error resending verification code.");
    } finally {
      setIsResending(false);
    }
  };

  // OTP Input event handlers
  const handleDigitChange = (index: number, val: string) => {
    const char = val.replace(/\D/g, "").slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = char;
    setOtpDigits(newDigits);

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newDigits.every((d) => d !== "")) {
      handleVerifyOtp(newDigits.join(""));
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleDigitPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || "";
    }
    setOtpDigits(newDigits);

    if (pasted.length === 6) {
      handleVerifyOtp(pasted);
    } else {
      const nextFocus = Math.min(pasted.length, 5);
      inputRefs.current[nextFocus]?.focus();
    }
  };

  const handleCancelOtp = () => {
    setIsEnteringOtp(false);
    setOtpError(null);
    setOtpDigits(["", "", "", "", "", ""]);
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-5 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full min-h-full text-black">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-3xl font-extrabold font-admin-sans tracking-tight text-black mb-1.5">
          Direct Line & Contact Channels<span className="text-[#7C3AED]">.</span>
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
          Gaurav Patil&apos;s direct phone number, WhatsApp connection, and official email addresses for{" "}
          <strong className="text-black font-semibold">{recruiter.company}</strong>.
        </p>
      </div>

      {/* Main Contact Content: OG Polished Cloudflare Gate */}
      {!isTurnstileVerified ? (
        <div className="my-auto flex flex-col items-center justify-center w-full py-2">
          {/* OG Polished Cloudflare Verification Box */}
          <div className="p-3 sm:p-3.5 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-xl shadow-xs transition-all flex flex-col items-center">
            {/* Minimal Header Status */}
            <div className="w-[300px] flex items-center justify-between text-[11px] font-admin-mono text-gray-500 mb-2 px-0.5">
              <span className="flex items-center gap-1.5 font-semibold text-gray-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Verification</span>
              </span>
              <span className="text-[10px] text-gray-400">Direct Channel</span>
            </div>

            {/* Turnstile Container - Unclipped 300x65 iframe with complete borders */}
            <div
              ref={turnstileContainerRef}
              className="w-[300px] min-h-[66px] flex items-center justify-center p-0.5"
            />
          </div>
        </div>
      ) : (
        <div className="my-auto">
          {isLoading ? (
            <div className="p-8 rounded-lg bg-white border border-[#E2E8F0] shadow-2xs text-center text-sm font-admin-mono text-gray-500">
              Loading contact details...
            </div>
          ) : error ? (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-admin-mono">
              {error}
            </div>
          ) : contactData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Direct Phone Channels Card (2 Numbers Vertically Stacked) */}
            <div className="p-5 sm:p-6 rounded-lg bg-white border border-[#E2E8F0] shadow-2xs flex flex-col justify-between transition-all duration-200">
              <div>
                {/* Header with Title and Private / Active Badge */}
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-md bg-[#F5F3FF] border border-[#DDD6FE] flex items-center justify-center text-[#7C3AED]">
                      <FaPhone className="text-sm" />
                    </div>
                    <div>
                      <div className="text-xs font-bold font-admin-sans tracking-tight text-black">
                        Direct Phone Channels
                      </div>
                      <div className="text-[10.5px] font-admin-mono text-gray-500">
                        2 Dedicated Lines &bull; Direct to Gaurav
                      </div>
                    </div>
                  </div>

                  {contactData.isMasked ? (
                    <span className="text-[11px] font-admin-mono px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200 flex items-center gap-1 font-medium">
                      <FaLock className="text-[10px] text-gray-500" /> Private
                    </span>
                  ) : (
                    <span className="text-[11px] font-admin-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 font-medium">
                      <FaCheckCircle className="text-[10px] text-emerald-600" /> 2 Lines Active
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-500 mb-3.5 leading-relaxed">
                  {contactData.isMasked
                    ? "Private candidate numbers are protected against automated scrapers. Click below to verify and reveal both contact lines."
                    : "Direct mobile lines for scheduling calls and immediate candidate communication:"}
                </p>

                {/* 2 Phone Numbers Stacked Vertically */}
                <div className="space-y-2.5 mb-3.5">
                  {/* Number 1: Primary Line & WhatsApp */}
                  <div className="p-3 sm:p-3.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]/80 hover:bg-white transition-all shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        {!contactData.isMasked ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        ) : (
                          <FaLock className="text-[9px] text-gray-400 shrink-0" />
                        )}
                        <span className="text-[10px] font-admin-mono font-bold uppercase tracking-wider text-gray-600">
                          Primary Mobile &amp; WhatsApp
                        </span>
                      </div>
                      <span className="text-[9px] font-admin-mono font-semibold px-1.5 py-0.2 rounded bg-purple-50 text-[#7C3AED] border border-purple-200 uppercase">
                        Primary
                      </span>
                    </div>

                    <div className="text-lg sm:text-xl font-bold font-mono text-black tracking-wide">
                      {contactData.isMasked ? "•• ••••• •••••" : (contactData.phoneDisplay || "•• ••••• •••••")}
                    </div>

                    {!contactData.isMasked && contactData.phone && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#E2E8F0]">
                        <a
                          href={`tel:${contactData.phone}`}
                          onClick={() => onTrackAction("CLICK_CALL", { line: "primary" })}
                          className="flex-1 py-1.5 px-2 bg-black hover:bg-neutral-800 text-white font-medium text-xs rounded text-center transition flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          <FaPhone className="text-[10px]" />
                          <span>Call Primary</span>
                        </a>

                        {contactData.whatsappUrl && (
                          <a
                            href={contactData.whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => onTrackAction("CLICK_WHATSAPP")}
                            className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded text-center transition flex items-center justify-center gap-1.5 shadow-2xs"
                          >
                            <FaWhatsapp className="text-xs" />
                            <span>WhatsApp</span>
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={(e) => handleCopyPhone(contactData.phone!, "primary", e)}
                          className="px-2.5 py-1.5 bg-white hover:bg-gray-50 border border-[#CBD5E1] text-gray-700 text-xs rounded transition flex items-center gap-1 cursor-pointer"
                          title="Copy primary number"
                        >
                          {copiedPhone === "primary" ? (
                            <FaCheck className="text-emerald-600 text-[10px]" />
                          ) : (
                            <FaCopy className="text-[10px]" />
                          )}
                          <span className="text-[10.5px] font-admin-mono">{copiedPhone === "primary" ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Number 2: Secondary / Direct Calling Line */}
                  <div className="p-3 sm:p-3.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]/80 hover:bg-white transition-all shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        {!contactData.isMasked ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        ) : (
                          <FaLock className="text-[9px] text-gray-400 shrink-0" />
                        )}
                        <span className="text-[10px] font-admin-mono font-bold uppercase tracking-wider text-gray-600">
                          Secondary Line &bull; Direct Calling
                        </span>
                      </div>
                      <span className="text-[9px] font-admin-mono font-semibold px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 border border-gray-200 uppercase">
                        Direct Line
                      </span>
                    </div>

                    <div className="text-lg sm:text-xl font-bold font-mono text-black tracking-wide">
                      {contactData.isMasked ? "•• ••••• •••••" : (contactData.secondaryPhoneDisplay || "•• ••••• •••••")}
                    </div>

                    {!contactData.isMasked && contactData.secondaryPhone && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#E2E8F0]">
                        <a
                          href={`tel:${contactData.secondaryPhone}`}
                          onClick={() => onTrackAction("CLICK_CALL", { line: "secondary" })}
                          className="flex-1 py-1.5 px-2 bg-black hover:bg-neutral-800 text-white font-medium text-xs rounded text-center transition flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          <FaPhone className="text-[10px]" />
                          <span>Call Secondary</span>
                        </a>

                        <button
                          type="button"
                          onClick={(e) => handleCopyPhone(contactData.secondaryPhone!, "secondary", e)}
                          className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-[#CBD5E1] text-gray-700 text-xs rounded transition flex items-center gap-1 cursor-pointer"
                          title="Copy secondary number"
                        >
                          {copiedPhone === "secondary" ? (
                            <FaCheck className="text-emerald-600 text-[10px]" />
                          ) : (
                            <FaCopy className="text-[10px]" />
                          )}
                          <span className="text-[10.5px] font-admin-mono">{copiedPhone === "secondary" ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Inline OTP Verification Box */}
                {isEnteringOtp && (
                  <div className="mt-2 mb-2 p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                    <p className="text-xs text-gray-600 mb-2">
                      Enter the 6-digit access code sent to <strong className="text-black font-semibold">{recruiter.email}</strong> to unlock both numbers:
                    </p>

                    <div className="flex items-center justify-between gap-1.5 sm:gap-2 mb-2.5">
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => {
                            inputRefs.current[idx] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                          onPaste={handleDigitPaste}
                          disabled={isVerifyingOtp}
                          className="w-9 sm:w-10 h-10 text-center text-lg font-bold font-mono bg-white border border-[#CBD5E1] rounded text-black focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition"
                        />
                      ))}
                    </div>

                    {otpError && (
                      <div className="text-[11px] font-admin-mono text-red-600 bg-red-50 border border-red-200 rounded p-1.5 mb-2.5 text-center">
                        {otpError}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleVerifyOtp()}
                      disabled={isVerifyingOtp || otpDigits.join("").length !== 6}
                      className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded text-center transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50 mb-2"
                    >
                      {isVerifyingOtp ? (
                        <>
                          <FaSpinner className="text-xs animate-spin" />
                          <span>Verifying code...</span>
                        </>
                      ) : (
                        <>
                          <FaCheckCircle className="text-xs" />
                          <span>Verify &amp; Unlock Both Numbers</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={resendCooldown > 0 || isResending}
                        className="font-admin-mono text-[11px] text-[#7C3AED] hover:underline disabled:text-gray-400 disabled:no-underline cursor-pointer"
                      >
                        {resendCooldown > 0
                          ? `Resend code in ${resendCooldown}s`
                          : isResending
                          ? "Resending..."
                          : "Resend code"}
                      </button>

                      <button
                        type="button"
                        onClick={handleCancelOtp}
                        className="font-admin-mono text-[11px] text-gray-500 hover:text-black flex items-center gap-1 cursor-pointer"
                      >
                        <FaArrowLeft className="text-[9px]" /> Back
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons Section */}
              <div className="pt-3 border-t border-[#E2E8F0]">
                {contactData.isMasked ? (
                  !isEnteringOtp ? (
                    <div>
                      {otpError && (
                        <div className="text-[11px] font-admin-mono text-red-600 bg-red-50 border border-red-200 rounded p-1.5 mb-2 text-center">
                          {otpError}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={handleRequestOtp}
                        disabled={isSendingOtp}
                        className="w-full py-2.5 px-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-medium text-xs rounded-md text-center transition flex items-center justify-center gap-2 shadow-2xs cursor-pointer disabled:opacity-50"
                      >
                        {isSendingOtp ? (
                          <>
                            <FaSpinner className="text-xs animate-spin" />
                            <span>Sending code...</span>
                          </>
                        ) : (
                          <>
                            <FaPhone className="text-xs" />
                            <span>View Both Numbers &amp; WhatsApp</span>
                          </>
                        )}
                      </button>
                      <div className="text-[10px] font-admin-mono text-gray-400 text-center mt-2">
                        Sends a 6-digit access code to {recruiter.email}
                      </div>
                    </div>
                  ) : null
                ) : (
                  <div className="text-[10.5px] font-admin-mono text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-2.5 py-1.5 text-center flex items-center justify-center gap-1.5 font-medium">
                    <FaCheckCircle className="text-emerald-600 text-xs shrink-0" />
                    <span>Both phone numbers &amp; WhatsApp line unlocked for this session</span>
                  </div>
                )}
              </div>
            </div>

            {/* Email & Digital Channels Card */}
            <div className="p-6 rounded-lg bg-white border border-[#E2E8F0] shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                    <FaEnvelope className="text-sm" />
                  </div>
                  <span className="text-[11px] font-admin-mono px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200 flex items-center gap-1 font-medium">
                    <FaEnvelope className="text-[10px] text-gray-500" /> Inboxes
                  </span>
                </div>

                <div className="text-xs font-admin-mono text-gray-500 mb-1 uppercase tracking-wider">
                  Email Addresses
                </div>

                <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                  Click any inbox to compose directly or copy address to your clipboard:
                </p>

                {/* Email Channels List */}
                <div className="space-y-2 mb-4">
                  {(contactData.emails && contactData.emails.length > 0
                    ? contactData.emails
                    : [
                        { email: "gaurav.patil@gauravpatil.site", label: "Personal & Hiring", badge: "Primary" },
                        { email: "work@gauravpatil.site", label: "Work & Contracting", badge: "Work" },
                        { email: "hello@gauravpatil.site", label: "General Inquiries", badge: "General" },
                        { email: "gaurav@gauravpatil.site", label: "Engineering", badge: "Direct" },
                      ]
                  ).map((item) => {
                    const isCopied = copiedEmail === item.email;
                    return (
                      <div
                        key={item.email}
                        className="group flex items-center justify-between p-2 sm:p-2.5 rounded-lg border border-[#E2E8F0] hover:border-[#CBD5E1] bg-[#F8FAFC]/70 hover:bg-white transition-all shadow-2xs"
                      >
                        <a
                          href={`mailto:${item.email}?subject=Connecting%20via%20Recruiter%20Portal&body=Hi%20Gaurav,%0D%0A%0D%0A`}
                          onClick={() => onTrackAction("CLICK_EMAIL", { email: item.email })}
                          className="flex-1 min-w-0 pr-2 flex flex-col cursor-pointer text-left"
                          title={`Click to open mail client for ${item.email}`}
                        >
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-xs sm:text-sm font-bold font-mono text-black group-hover:text-[#7C3AED] transition-colors truncate">
                              {item.email}
                            </span>
                            {item.badge && (
                              <span className="text-[9px] font-admin-mono font-semibold px-1.5 py-0.5 rounded bg-purple-50 text-[#7C3AED] border border-[#DDD6FE] uppercase">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-500 font-admin-sans truncate">
                            {item.label} &bull; <span className="text-[#7C3AED] group-hover:underline">Click to send &rarr;</span>
                          </span>
                        </a>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => handleCopyEmail(item.email, e)}
                            title="Copy email to clipboard"
                            className={`px-2 py-1 rounded text-[11px] font-admin-mono font-medium flex items-center gap-1 border transition-all cursor-pointer ${
                              isCopied
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold"
                                : "bg-white text-gray-700 hover:text-black hover:bg-gray-100 border-[#CBD5E1]"
                            }`}
                          >
                            {isCopied ? (
                              <>
                                <FaCheck className="text-[10px] text-emerald-600" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <FaCopy className="text-[10px] text-gray-500 group-hover:text-black" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          <a
                            href={`mailto:${item.email}?subject=Connecting%20via%20Recruiter%20Portal&body=Hi%20Gaurav,%0D%0A%0D%0A`}
                            onClick={() => onTrackAction("CLICK_EMAIL", { email: item.email })}
                            title={`Open email client for ${item.email}`}
                            className="w-7 h-7 rounded flex items-center justify-center bg-white border border-[#CBD5E1] text-gray-600 hover:text-[#7C3AED] hover:border-[#7C3AED] hover:bg-purple-50 transition cursor-pointer"
                          >
                            <FaExternalLinkAlt className="text-[10px]" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Digital Profiles (LinkedIn & GitHub) */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#E2E8F0]">
                <a
                  href={contactData.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onTrackAction("CLICK_LINKEDIN")}
                  className="py-2 px-3 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] rounded-md text-xs font-medium text-gray-800 text-center transition flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <FaLinkedin className="text-blue-600 text-xs" />
                  <span>LinkedIn Profile</span>
                </a>

                <a
                  href={contactData.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onTrackAction("CLICK_GITHUB")}
                  className="py-2 px-3 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] rounded-md text-xs font-medium text-gray-800 text-center transition flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <FaGithub className="text-gray-800 text-xs" />
                  <span>GitHub Profile</span>
                </a>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      )}

      {/* Footer Callout */}
      <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg shadow-2xs flex items-center justify-between text-xs font-admin-mono text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-gray-700">Direct Candidate Channels</span>
        </span>
        <span className="text-gray-500">Immediate Availability &bull; Global Remote / Relocation</span>
      </div>
    </div>
  );
}
