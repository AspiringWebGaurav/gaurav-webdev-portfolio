"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DesktopRecruiterPortalView } from "@/components/contact-portal/DesktopRecruiterPortalView";
import { MobileRecruiterPortalView } from "@/components/contact-portal/MobileRecruiterPortalView";
import { FaRedo, FaCheck } from "react-icons/fa";

const mockRecruiter = {
  name: "Sarah Jenkins",
  company: "Stripe",
  email: "s.jenkins@stripe.com",
};

const VALID_SECTIONS = [
  "overview",
  "contact",
  "chat",
  "resume",
  "experience",
  "projects",
  "skills",
  "about",
];

function getInitialSection(): string {
  if (typeof window === "undefined") return "contact";
  try {
    const hash = window.location.hash.replace("#", "").toLowerCase();
    if (VALID_SECTIONS.includes(hash)) return hash;
    const stored = localStorage.getItem("recruiter_portal_tab")?.toLowerCase();
    if (stored && VALID_SECTIONS.includes(stored)) return stored;
  } catch {
    // ignore
  }
  return "contact";
}

export default function TempContactPreviewPage() {
  const [activeSection, setActiveSection] = useState<string>(() => getInitialSection());
  const [viewKey, setViewKey] = useState<number>(1);
  const [, setIsVerified] = useState<boolean>(false);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.backgroundColor = "#FAFAFA";
      document.documentElement.style.colorScheme = "light";
    }
  }, []);

  const handleNavigate = useCallback((section: string) => {
    setActiveSection(section);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("recruiter_portal_tab", section);
        const currentHash = window.location.hash.replace("#", "");
        if (currentHash !== section) {
          window.history.replaceState(null, "", `#${section}`);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  // Sync tab with URL hash on popstate/hashchange
  useEffect(() => {
    if (typeof window === "undefined") return;
    const initial = getInitialSection();
    if (initial !== activeSection) {
      setActiveSection(initial);
    }

    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "").toLowerCase();
      if (VALID_SECTIONS.includes(hash)) {
        setActiveSection(hash);
        try {
          localStorage.setItem("recruiter_portal_tab", hash);
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [activeSection]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsVerified(sessionStorage.getItem("contact_turnstile_verified") === "true");
    }
  }, [viewKey]);

  const handleResetCloudflare = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("contact_turnstile_verified");
      setIsVerified(false);
      setViewKey((prev) => prev + 1);
    }
  };

  const handleBypassCloudflare = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("contact_turnstile_verified", "true");
      setIsVerified(true);
      setViewKey((prev) => prev + 1);
    }
  };

  const handleResetPhoneUnmask = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("recruiter_phone_unmasked");
      sessionStorage.removeItem("recruiter_contact_payload");
      setViewKey((prev) => prev + 1);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[100dvh] w-full overflow-hidden select-none bg-[#FAFAFA] text-black">
      {/* Dev Preview Helper Ribbon */}
      <div className="bg-[#18181B] text-white px-4 py-1.5 flex items-center justify-between text-xs font-admin-mono shrink-0 z-50 border-b border-neutral-700">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-amber-300">TEMP PREVIEW ROUTE</span>
          <span className="text-gray-400">/temp-contact#{activeSection}</span>
          <span className="hidden sm:inline text-gray-500">· Active Tab:</span>
          <span className="text-emerald-400 uppercase font-semibold hidden sm:inline">{activeSection}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetPhoneUnmask}
            className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-gray-300 border border-neutral-600 text-[11px] font-medium flex items-center gap-1.5 transition cursor-pointer"
            title="Clear unmasked phone cache to test the OTP flow again"
          >
            <FaRedo className="text-[10px]" />
            <span>Reset Phone OTP</span>
          </button>

          <button
            onClick={handleResetCloudflare}
            className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-medium flex items-center gap-1.5 transition cursor-pointer"
            title="Clear Turnstile session storage and show the centered Cloudflare gate again"
          >
            <FaRedo className="text-[10px]" />
            <span>Show Cloudflare Gate</span>
          </button>

          <button
            onClick={handleBypassCloudflare}
            className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-medium flex items-center gap-1.5 transition cursor-pointer"
            title="Mark verified to show the unmasked/contact channels view"
          >
            <FaCheck className="text-[10px]" />
            <span>Bypass to Contact Channels</span>
          </button>
        </div>
      </div>

      {/* Main Portal View with key to force fresh mount on reset */}
      <div key={viewKey} className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Desktop View */}
        <DesktopRecruiterPortalView
          recruiter={mockRecruiter}
          activeSection={activeSection}
          onNavigate={handleNavigate}
          onSignOut={() => handleNavigate("overview")}
          onTrackAction={() => {}}
        />

        {/* Mobile View */}
        <MobileRecruiterPortalView
          recruiter={mockRecruiter}
          activeSection={activeSection}
          onNavigate={handleNavigate}
          onSignOut={() => handleNavigate("overview")}
          onTrackAction={() => {}}
        />
      </div>
    </div>
  );
}
