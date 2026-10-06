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

export function ThemeProvider({
  children,
  defaultTheme = "dark",
}: ThemeProviderProps) {
  const versionRef = useRef(0);
  const lastTimestampRef = useRef(Date.now());
  const broadcastRef = useRef<BroadcastChannel | null>(null);

  // Initialize state from shared cookie or established DOM class
  const [theme, setThemeState] = useState<Theme>(() => {
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
    d.classList.remove("light", "dark");
    d.classList.add(newTheme);
    d.style.colorScheme = newTheme;
  }, []);

  const setTheme = useCallback((next: Theme | string) => {
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

    // 5. Asynchronous server confirmation (fire-and-forget, non-blocking)
    fetch("/api/theme", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: validTheme }),
    }).catch(() => {
      // API failure resilience: UI and synchronous cookie are authoritative and never reverted
    });
  }, [applyThemeToDOM]);

  // Synchronize on mount if client DOM already had class from synchronous head script
  useEffect(() => {
    if (typeof document !== "undefined") {
      const isLight = document.documentElement.classList.contains("light");
      const current: Theme = isLight ? "light" : "dark";
      setThemeState((prev) => (prev !== current ? current : prev));
    }
  }, []);

  // Dual-Channel Sync: Same-Origin BroadcastChannel + Cross-Subdomain Focus/Visibility Reconciliation
  useEffect(() => {
    // 1. Same-Origin Fast Path via BroadcastChannel
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      broadcastRef.current = channel;

      channel.onmessage = (event: MessageEvent<ThemeSyncMessage>) => {
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

    // 2. Cross-Subdomain Open Tab Reconciliation (Focus & Visibility Events)
    const reconcileFromSharedCookie = () => {
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
