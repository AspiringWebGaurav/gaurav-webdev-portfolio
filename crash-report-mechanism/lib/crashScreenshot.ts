/**
 * Crash Screenshot Capture
 * Captures visual context at the time of crash using html2canvas
 */

import html2canvas from "html2canvas";
import { ScreenshotData } from "../types/crashReport";

/**
 * Capture screenshot of current page state
 * Returns base64 data URL or null if capture fails
 * 
 * Non-blocking and defensive - never throws errors
 */
export async function captureScreenshot(): Promise<ScreenshotData | null> {
  try {
    // Check if html2canvas is available
    if (typeof html2canvas !== "function") {
      console.warn("[CrashScreenshot] html2canvas not available");
      return null;
    }

    console.log("[CrashScreenshot] Capturing screenshot...");

    // Capture with optimized settings
    const canvas = await html2canvas(document.body, {
      allowTaint: true,
      useCORS: true,
      logging: false,
      scale: 0.5, // Reduce size for faster upload (50% of original)
      width: window.innerWidth,
      height: window.innerHeight,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      backgroundColor: null, // Transparent background
    });

    // Convert to JPEG with compression
    const base64 = canvas.toDataURL("image/jpeg", 0.7);

    // Check size (limit to 2MB to avoid storage issues)
    const sizeInMB = (base64.length * 0.75) / (1024 * 1024);
    if (sizeInMB > 2) {
      console.warn(`[CrashScreenshot] Screenshot too large (${sizeInMB.toFixed(2)}MB), skipping`);
      return null;
    }

    const screenshotData: ScreenshotData = {
      url: base64, // Store as base64 for now (can upload to Firebase Storage later)
      capturedAt: new Date(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      pageUrl: window.location.href,
    };

    console.log(`[CrashScreenshot] ✅ Captured (${sizeInMB.toFixed(2)}MB)`);
    return screenshotData;

  } catch (error) {
    // Never fail crash reporting due to screenshot issues
    console.error("[CrashScreenshot] Failed to capture:", error);
    return null;
  }
}

/**
 * Capture screenshot with timeout
 * Ensures screenshot capture doesn't hang indefinitely
 */
export async function captureScreenshotWithTimeout(
  timeoutMs: number = 3000
): Promise<ScreenshotData | null> {
  try {
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), timeoutMs);
    });

    const result = await Promise.race([
      captureScreenshot(),
      timeoutPromise,
    ]);

    return result;
  } catch (error) {
    console.error("[CrashScreenshot] Timeout or error:", error);
    return null;
  }
}

/**
 * Check if screenshot capture is supported
 */
export function isScreenshotSupported(): boolean {
  return typeof window !== "undefined" && 
         typeof html2canvas === "function" &&
         typeof document !== "undefined";
}
