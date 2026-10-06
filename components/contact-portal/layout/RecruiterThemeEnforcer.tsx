"use client";

import { useEffect, useLayoutEffect } from "react";
import { readThemeCookieSync } from "@/lib/theme/cookie";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Enforces pure light theme on html/body while inside recruiter portal (/contact-portal or contact.*),
 * completely isolating HR from theme synchronization.
 * When navigating back to main portfolio, restores user's prior theme preference cleanly.
 */
export function RecruiterThemeEnforcer() {
  useIsomorphicLayoutEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains("dark");

    // Tag root for CSS and JS isolation checks
    root.setAttribute("data-theme-isolated", "recruiter");
    root.classList.remove("dark");
    root.classList.add("light");
    root.style.backgroundColor = "#FAFAFA";
    root.style.colorScheme = "light";

    if (document.body) {
      document.body.style.backgroundColor = "#FAFAFA";
      document.body.style.color = "#000000";
    }

    return () => {
      root.removeAttribute("data-theme-isolated");
      // Restore user's saved theme when navigating away
      const savedTheme = readThemeCookieSync();
      const shouldRestoreDark = hadDark || savedTheme === "dark";
      if (shouldRestoreDark) {
        root.classList.remove("light");
        root.classList.add("dark");
        root.style.backgroundColor = "";
        root.style.colorScheme = "dark";
        if (document.body) {
          document.body.style.backgroundColor = "";
          document.body.style.color = "";
        }
      }
    };
  }, []);

  return null;
}
