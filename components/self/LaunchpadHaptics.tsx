"use client";

import { useEffect } from "react";

/**
 * Mobile-only tactile haptic vibration feedback.
 * Triggers a crisp, silent 15ms physical vibration pulse on mobile touch devices when opening any card or link.
 * Strictly 0 audio / sound effects. Safely no-ops on desktop or unsupported browsers.
 */
export function LaunchpadHaptics() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if the Web Vibration API is supported
    const hasVibrate = "vibrate" in navigator && typeof navigator.vibrate === "function";
    if (!hasVibrate) return;

    // Ensure we are strictly on a mobile/touch environment
    const isTouchMobile =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (!isTouchMobile) return;

    let lastVibrateTime = 0;
    const triggerHaptic = (e: Event) => {
      const target = (e.target as HTMLElement | null)?.closest?.("a, button");
      if (!target) return;

      const now = Date.now();
      // 180ms debounce window prevents duplicate pulses between pointerdown and click
      if (now - lastVibrateTime < 180) return;
      lastVibrateTime = now;

      try {
        // 15ms subtle native haptic pulse — 100% silent physical vibration
        navigator.vibrate(15);
      } catch {
        // Graceful no-op if vibration permission is restricted
      }
    };

    window.addEventListener("pointerdown", triggerHaptic, { passive: true });
    window.addEventListener("click", triggerHaptic, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", triggerHaptic);
      window.removeEventListener("click", triggerHaptic);
    };
  }, []);

  return null;
}
