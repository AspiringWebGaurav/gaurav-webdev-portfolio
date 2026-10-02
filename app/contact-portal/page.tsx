"use client";

import React, { useState, useEffect, useCallback } from "react";
import { RecruiterAccessGate } from "@/components/contact-portal/RecruiterAccessGate";
import { DesktopRecruiterPortalView } from "@/components/contact-portal/DesktopRecruiterPortalView";
import { MobileRecruiterPortalView } from "@/components/contact-portal/MobileRecruiterPortalView";

import { CloudflareVerificationLoader } from "@/components/contact-portal/CloudflareVerificationLoader";

interface RecruiterState {
  name: string;
  company: string;
  email: string;
}

// Module-level persistent cache: survives React StrictMode, Fast Refresh, and re-renders
// Guarantees the loader runs strictly ONCE per hard refresh and never shows 2 times
let moduleInitialCheckDone = false;
let moduleCachedSession: { authenticated: boolean; recruiter: RecruiterState | null } | null = null;
let moduleSessionPromise: Promise<{ authenticated: boolean; recruiter: RecruiterState | null }> | null = null;

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
  if (typeof window === "undefined") return "overview";
  try {
    const hash = window.location.hash.replace("#", "").toLowerCase();
    if (VALID_SECTIONS.includes(hash)) return hash;
    const stored = localStorage.getItem("recruiter_portal_tab")?.toLowerCase();
    if (stored && VALID_SECTIONS.includes(stored)) return stored;
  } catch {
    // ignore
  }
  return "overview";
}

export default function ContactPortalPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(() =>
    moduleInitialCheckDone ? (moduleCachedSession?.authenticated ?? false) : null
  );
  const [recruiter, setRecruiter] = useState<RecruiterState | null>(() =>
    moduleInitialCheckDone ? moduleCachedSession?.recruiter ?? null : null
  );
  const [activeSection, setActiveSection] = useState<string>(() => getInitialSection());

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

  // Track recruiter actions asynchronously
  const trackAction = useCallback((action: string, metadata?: Record<string, unknown>) => {
    try {
      fetch("/api/contact-portal/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, metadata }),
      }).catch(() => {});
    } catch {
      // ignore
    }
  }, []);

  // Enforce light theme cleanly on the client without SSR hydration conflicts
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.backgroundColor = "#FAFAFA";
      document.documentElement.style.colorScheme = "light";
    }
  }, []);

  // Check existing session cookie on initial load with unified persistent lifecycle
  useEffect(() => {
    let isMounted = true;

    // Parallel preload Turnstile script while verification loader is active
    if (typeof window !== "undefined") {
      const scriptId = "cf-turnstile-script";
      if (!document.getElementById(scriptId)) {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
    }

    // If initial check was already completed in this page session, do not re-run
    if (moduleInitialCheckDone) {
      if (moduleCachedSession?.authenticated && moduleCachedSession.recruiter) {
        setRecruiter(moduleCachedSession.recruiter);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      return;
    }

    if (!moduleSessionPromise) {
      moduleSessionPromise = (async () => {
        const startTime = Date.now();
        let authResult = { authenticated: false, recruiter: null as RecruiterState | null };
        try {
          const res = await fetch("/api/contact-portal/auth/session");
          const json = await res.json();
          if (json.ok && json.data?.authenticated && json.data?.recruiter) {
            authResult = { authenticated: true, recruiter: json.data.recruiter };
          }
        } catch {
          // fallback to unauthenticated gate
        }

        // Single persistent duration: 750ms ensures authentic security check animation without flickering or double-loading
        const elapsed = Date.now() - startTime;
        const MIN_PERSISTENCE_MS = 750;
        if (elapsed < MIN_PERSISTENCE_MS) {
          await new Promise((r) => setTimeout(r, MIN_PERSISTENCE_MS - elapsed));
        }

        moduleInitialCheckDone = true;
        moduleCachedSession = authResult;
        return authResult;
      })();
    }

    moduleSessionPromise.then((result) => {
      if (isMounted) {
        if (result.authenticated && result.recruiter) {
          setRecruiter(result.recruiter);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle successful OTP verification from Access Gate
  const handleAuthSuccess = (recruiterData: RecruiterState) => {
    moduleInitialCheckDone = true;
    moduleCachedSession = { authenticated: true, recruiter: recruiterData };
    setRecruiter(recruiterData);
    setIsAuthenticated(true);
    const target = getInitialSection();
    handleNavigate(target);
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      await fetch("/api/contact-portal/auth/session", { method: "DELETE" });
    } catch {
      // ignore
    }
    moduleInitialCheckDone = true;
    moduleCachedSession = { authenticated: false, recruiter: null };
    setRecruiter(null);
    setIsAuthenticated(false);
    handleNavigate("overview");
  };

  // Loading state while checking session
  if (isAuthenticated === null) {
    return <CloudflareVerificationLoader />;
  }

  // Unauthenticated Gate
  if (!isAuthenticated || !recruiter) {
    return <RecruiterAccessGate onSuccess={handleAuthSuccess} />;
  }

  // Authenticated Hub View (100dvh Zero-Scroll)
  return (
    <>
      <DesktopRecruiterPortalView
        recruiter={recruiter}
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onSignOut={handleSignOut}
        onTrackAction={trackAction}
      />
      <MobileRecruiterPortalView
        recruiter={recruiter}
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onSignOut={handleSignOut}
        onTrackAction={trackAction}
      />
    </>
  );
}
