"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useRef, useCallback } from "react";
import { writeThemeCookieSync, readThemeCookieSync } from "./cookie";

export type Theme = "light" | "dark";

export interface UseThemeProps {
  theme: Theme;
  resolvedTheme: Theme;
  setTheme: (theme: Theme | string) => void;
  themes: string[];
}

export interface ThemeSyncMessage {
  type: "THEME_CHANGED";
  theme: Theme;
  timestamp: number;
  version: number;
}

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

const BROADCAST_CHANNEL_NAME = "gaurav_theme_sync";

const ThemeContext = createContext<UseThemeProps>({
  theme: "dark",
  resolvedTheme: "dark",
  setTheme: () => {},
  themes: ["light", "dark"],
});

export function isRecruiterPortalEnvironment(): boolean {
  if (typeof window !== "undefined") {
    const host = window.location.hostname.toLowerCase();
    if (host.startsWith("contact.")) return true;
    const path = window.location.pathname;
    if (path.startsWith("/contact-portal") || path.startsWith("/contact")) return true;
    if (typeof document !== "undefined") {
      if (
        document.documentElement.getAttribute("data-theme-isolated") === "recruiter" ||
        document.querySelector('[data-portal-type="recruiter"]') ||
        document.querySelector('[data-portal="recruiter"]')
      ) {
        return true;
      }
    }
  }
  return false;
}

export function ThemeProvider({
  children,
  defaultTheme = "dark",
}: ThemeProviderProps) {
  const versionRef = useRef(0);
  const lastTimestampRef = useRef(Date.now());
  const broadcastRef = useRef<BroadcastChannel | null>(null);

  // Initialize state from URL param, shared cookie, or established DOM class
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined" && isRecruiterPortalEnvironment()) {
      return "light";
    }
    if (typeof window !== "undefined") {
      try {
        const urlParam = new URLSearchParams(window.location.search).get("theme");
        if (urlParam === "light" || urlParam === "dark") {
          return urlParam;
        }
      } catch {}
    }
    if (typeof document !== "undefined") {
      const fromCookie = readThemeCookieSync();
      if (fromCookie) return fromCookie;
      return document.documentElement.classList.contains("light") ? "light" : "dark";
    }
    return defaultTheme;
  });

  const applyThemeToDOM = useCallback((newTheme: Theme) => {
    if (typeof document === "undefined") return;
    const d = document.documentElement;
    if (isRecruiterPortalEnvironment()) {
      d.classList.remove("dark");
      d.classList.add("light");
      d.style.colorScheme = "light";
      return;
    }
    d.classList.remove("light", "dark");
    d.classList.add(newTheme);
    d.style.colorScheme = newTheme;
  }, []);

  const setTheme = useCallback((next: Theme | string) => {
    if (isRecruiterPortalEnvironment()) return;
    const validTheme: Theme = next === "light" ? "light" : "dark";
    const now = Date.now();
    versionRef.current += 1;
    lastTimestampRef.current = now;

    // 1. Optimistic immediate DOM mutation (< 1ms)
    applyThemeToDOM(validTheme);

    // 2. Synchronous shared cookie write (< 1ms) - eliminates navigation race condition
    writeThemeCookieSync(validTheme);

    // 3. Update React context state
    setThemeState(validTheme);

    // 4. Same-origin fast-path broadcast (< 16ms)
    if (broadcastRef.current) {
      try {
        broadcastRef.current.postMessage({
          type: "THEME_CHANGED",
          theme: validTheme,
          timestamp: now,
          version: versionRef.current,
        } satisfies ThemeSyncMessage);
      } catch {}
    }

    // 5. Cross-tab storage event bridge
    try {
      localStorage.setItem(
        "gaurav_theme_sync_storage",
        JSON.stringify({ theme: validTheme, timestamp: now })
      );
    } catch {}

    // 6. Asynchronous server confirmation (fire-and-forget, non-blocking)
    fetch("/api/theme", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: validTheme }),
    }).catch(() => {
      // API failure resilience: UI and synchronous cookie are authoritative and never reverted
    });
  }, [applyThemeToDOM]);

  // Synchronize on mount from URL param or established DOM class
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (isRecruiterPortalEnvironment()) {
        applyThemeToDOM("light");
        setThemeState("light");
        return;
      }
      try {
        const params = new URLSearchParams(window.location.search);
        const urlTheme = params.get("theme");
        if (urlTheme === "light" || urlTheme === "dark") {
          applyThemeToDOM(urlTheme);
          writeThemeCookieSync(urlTheme);
          setThemeState(urlTheme);

          // Clean URL parameter without reload
          params.delete("theme");
          const remaining = params.toString();
          const cleanUrl =
            window.location.pathname +
            (remaining ? `?${remaining}` : "") +
            window.location.hash;
          window.history.replaceState(null, "", cleanUrl);
          return;
        }
      } catch {}

      const isLight = document.documentElement.classList.contains("light");
      const current: Theme = isLight ? "light" : "dark";
      setThemeState((prev) => (prev !== current ? current : prev));
    }
  }, [applyThemeToDOM]);

  // Multi-Channel Sync: BroadcastChannel + Storage Events + Focus/Visibility Reconciliation
  useEffect(() => {
    // 1. Same-Origin Fast Path via BroadcastChannel
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      broadcastRef.current = channel;

      channel.onmessage = (event: MessageEvent<ThemeSyncMessage>) => {
        if (isRecruiterPortalEnvironment()) return;
        if (event.data?.type === "THEME_CHANGED" && (event.data.theme === "light" || event.data.theme === "dark")) {
          // Staleness guard: ignore older or out-of-order events
          if (event.data.timestamp > lastTimestampRef.current) {
            lastTimestampRef.current = event.data.timestamp;
            applyThemeToDOM(event.data.theme);
            setThemeState(event.data.theme);
          }
        }
      };
    }

    // 2. Storage event listener for cross-tab sync
    const handleStorage = (event: StorageEvent) => {
      if (isRecruiterPortalEnvironment()) return;
      if (event.key === "gaurav_theme_sync_storage" && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          if ((parsed.theme === "light" || parsed.theme === "dark") && parsed.timestamp > lastTimestampRef.current) {
            lastTimestampRef.current = parsed.timestamp;
            applyThemeToDOM(parsed.theme);
            setThemeState(parsed.theme);
          }
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);

    // 3. Cross-Subdomain Open Tab Reconciliation (Focus & Visibility Events)
    const reconcileFromSharedCookie = () => {
      if (isRecruiterPortalEnvironment()) return;
      const cookieTheme = readThemeCookieSync();
      if (cookieTheme && (cookieTheme === "light" || cookieTheme === "dark")) {
        setThemeState((current) => {
          if (current !== cookieTheme) {
            applyThemeToDOM(cookieTheme);
            return cookieTheme;
          }
          return current;
        });
      }
    };

    window.addEventListener("focus", reconcileFromSharedCookie);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        reconcileFromSharedCookie();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (broadcastRef.current) {
        broadcastRef.current.close();
        broadcastRef.current = null;
      }
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", reconcileFromSharedCookie);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [applyThemeToDOM]);

  const value = useMemo<UseThemeProps>(
    () => ({
      theme,
      resolvedTheme: theme,
      setTheme,
      themes: ["light", "dark"],
    }),
    [theme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): UseThemeProps {
  return useContext(ThemeContext);
}
