"use client";

import { useEffect } from "react";

/**
 * DownexUninstalledLifecycle
 * Client-side lifecycle handler for the uninstalled landing route:
 * - Unlocks scrolling and resets any transient page overlays
 * - Sets data-portal="downex" attribute for styling consistency
 * - Dispatches a window lifecycle event for observability
 */
export function DownexUninstalledLifecycle() {
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
      document.documentElement.setAttribute("data-portal", "downex");
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("downex-uninstalled-lifecycle", {
          detail: {
            timestamp: Date.now(),
            app: "downex",
            status: "uninstalled",
          },
        })
      );
    }
  }, []);

  return null;
}
