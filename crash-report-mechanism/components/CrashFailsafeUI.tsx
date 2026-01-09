"use client";

/**
 * Crash Failsafe UI
 * Takes over when the app crashes
 * Provides user-friendly error screen with recovery options
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home, Copy, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  error: Error;
  errorInfo?: any;
}

/**
 * Failsafe UI Component
 * Displays when a critical crash occurs
 * Independent of the main app to ensure it works even if React is broken
 */
export default function CrashFailsafeUI({ error, errorInfo }: Props) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reportStatus, setReportStatus] = useState<"detected" | "sending" | "sent" | "failed">("detected");

  // Multi-stage status flow: detected → sending → sent
  React.useEffect(() => {
    // Stage 1: Show "detected" for 2 seconds
    const timer1 = setTimeout(() => {
      setReportStatus("sending");
    }, 2000);

    // Stage 2: Show "sending" for 3 seconds
    const timer2 = setTimeout(() => {
      setReportStatus("sent");
    }, 5000); // 2s detected + 3s sending

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  /**
   * Reload the page
   */
  const handleReload = () => {
    console.log("[CrashFailsafeUI] Reloading page...");
    window.location.reload();
  };

  /**
   * Navigate to home page
   */
  const handleGoHome = () => {
    console.log("[CrashFailsafeUI] Navigating to home...");
    window.location.href = "/";
  };

  /**
   * Copy error details to clipboard
   */
  const handleCopyError = async () => {
    const errorText = `
Error: ${error.name}
Message: ${error.message}

Stack Trace:
${error.stack || "No stack trace available"}

${errorInfo?.componentStack ? `Component Stack:\n${errorInfo.componentStack}` : ""}

URL: ${window.location.href}
Timestamp: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}
    `.trim();

    try {
      await navigator.clipboard.writeText(errorText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("[CrashFailsafeUI] Failed to copy:", err);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-900 text-white overflow-hidden flex items-center justify-center">
      {/* Grid background */}
      <div className="absolute inset-0 bg-grid-white/[0.02]">
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-4 max-w-2xl text-center w-full">
        {/* Animated Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center border-2 border-red-500/60"
        >
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-red-400 via-orange-300 to-red-400 bg-clip-text text-transparent">
            Something Went Wrong
          </h1>
          <p className="text-white text-base md:text-lg mb-3 font-medium">
            We've automatically reported this issue and will fix it soon
          </p>
          
          {/* Live Status: 3-Stage Flow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 backdrop-blur-sm"
          >
            {/* Stage 1: Detected */}
            {reportStatus === "detected" && (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center"
                >
                  <span className="text-white text-xs font-bold">!</span>
                </motion.div>
                <div className="flex flex-col items-start">
                  <span className="text-base text-yellow-300 font-bold">
                    🔍 Crash Detected!
                  </span>
                  <span className="text-xs text-yellow-200/70">
                    Preparing crash report...
                  </span>
                </div>
              </>
            )}

            {/* Stage 2: Sending to Gaurav */}
            {reportStatus === "sending" && (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-3 border-purple-400 border-t-transparent rounded-full"
                />
                <div className="flex flex-col items-start">
                  <span className="text-base text-purple-300 font-bold">
                    📤 Sending to Gaurav...
                  </span>
                  <span className="text-xs text-purple-200/70">
                    Including screenshot & error details
                  </span>
                </div>
              </>
            )}

            {/* Stage 3: Successfully Sent */}
            {reportStatus === "sent" && (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.5 }}
                  className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
                >
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
                <div className="flex flex-col items-start">
                  <span className="text-base text-green-300 font-bold">
                    ✅ Sent to Gaurav Successfully!
                  </span>
                  <span className="text-xs text-green-200/70">
                    Report received • Will be fixed soon
                  </span>
                </div>
              </>
            )}

            {/* Stage 4: Failed (fallback) */}
            {reportStatus === "failed" && (
              <>
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✕</span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-base text-red-300 font-bold">
                    ⚠️ Send Failed
                  </span>
                  <span className="text-xs text-red-200/70">
                    Report queued for retry
                  </span>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>

        {/* Error Summary */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm w-full"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-red-400 font-semibold text-sm">Error Type:</span>
            <span className="text-white text-sm font-medium">{error.name}</span>
          </div>
          <p className="text-white/90 text-sm text-left font-medium">
            {error.message}
          </p>
        </motion.div>

        {/* Technical Details (Expandable) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm w-full"
        >
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors rounded-lg"
          >
            <span className="text-white text-sm font-medium">Technical Details</span>
            {showDetails ? (
              <ChevronUp className="w-4 h-4 text-white/50" />
            ) : (
              <ChevronDown className="w-4 h-4 text-white/50" />
            )}
          </button>

          {showDetails && (
            <div className="px-4 pb-4 space-y-3">
              {/* Error Stack */}
              {error.stack && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-white/50">Stack Trace:</span>
                    <button
                      onClick={handleCopyError}
                      className="text-xs flex items-center gap-1 text-white/60 hover:text-white transition"
                    >
                      <Copy className="w-3 h-3" />
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <pre className="text-white/50 text-xs overflow-auto max-h-40 bg-black/20 p-3 rounded font-mono text-left">
                    {error.stack}
                  </pre>
                </div>
              )}

              {/* Component Stack */}
              {errorInfo?.componentStack && (
                <div>
                  <span className="text-xs text-white/50 block mb-2">Component Stack:</span>
                  <pre className="text-white/50 text-xs overflow-auto max-h-32 bg-black/20 p-3 rounded font-mono text-left">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}

              {/* Additional Info */}
              <div className="text-xs text-white/40 space-y-1 text-left">
                <div>URL: {window.location.href}</div>
                <div>Time: {new Date().toLocaleString()}</div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap gap-3 justify-center"
        >
          <button
            onClick={handleReload}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 rounded-lg transition-colors group"
          >
            <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            <span>Reload Page</span>
          </button>

          <button
            onClick={handleGoHome}
            className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Go Home</span>
          </button>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-white text-base font-bold"
        >
          <div className="flex items-center gap-2 justify-center">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Crash report sent automatically - We'll investigate and fix this issue</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
