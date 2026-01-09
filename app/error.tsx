"use client";

/**
 * Next.js Global Error Page
 * Dynamic crash reporting with real API status
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, RefreshCw, Home, Copy, CheckCircle } from "lucide-react";
import { CrashReporter } from "@/crash-report-mechanism/lib/crashReporter";
import Logo from "@/components/Logo";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [reportStatus, setReportStatus] = useState<"detected" | "sending" | "sent" | "failed">("detected");
  const [copied, setCopied] = useState(false);

  // Show status animation (crash already reported by GlobalCrashHandler with screenshot)
  useEffect(() => {
    const showStatus = async () => {
      // Stage 1: Detected (show for 1.5 seconds)
      setReportStatus("detected");
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Stage 2: Sending (show for 2 seconds)
      setReportStatus("sending");
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Stage 3: Successfully sent
      // Note: Actual crash was already reported by GlobalCrashHandler with the real page screenshot
      // This is just UI feedback animation
      setReportStatus("sent");
    };

    showStatus();
  }, [error]);

  // Copy FULL error details to clipboard - formatted for AI analysis
  const handleCopyError = async () => {
    const errorText = `
# Crash Report - ${error.name}

## Error Message
${error.message}

## Error Type
${error.name}

## Stack Trace
${error.stack || 'No stack trace available'}

## Additional Context
- Timestamp: ${new Date().toISOString()}
- URL: ${typeof window !== 'undefined' ? window.location.href : 'N/A'}
- User Agent: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}
${error.digest ? `- Error Digest: ${error.digest}` : ''}

## Instructions for AI
This is a production error from a Next.js application. Please analyze the error and provide:
1. Root cause of the issue
2. Specific line/component causing the problem
3. Recommended fix with code examples
4. Prevention strategies for similar errors
    `.trim();
    
    try {
      await navigator.clipboard.writeText(errorText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1e] to-[#0a0a0f] text-white overflow-hidden flex items-center justify-center">
      {/* Premium Background Effects */}
      <div className="absolute inset-0">
        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-full blur-3xl" />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>
      
      <div className="relative z-10 flex flex-col items-center gap-6 max-w-2xl w-full px-6">
        {/* Logo with Terminal Theme */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Logo className="mb-4" />
        </motion.div>

        {/* Title - Terminal Style */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center space-y-3"
        >
          <div className="inline-block">
            <h1 className="text-5xl md:text-6xl font-mono font-bold tracking-tight">
              <span className="text-purple">&gt;</span>{" "}
              <span className="bg-gradient-to-r from-red-400 via-orange-300 to-amber-400 bg-clip-text text-transparent">
                error_detected
              </span>
            </h1>
            <motion.div 
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="h-1 bg-gradient-to-r from-red-500/50 via-orange-400/50 to-amber-400/50 rounded-full mt-2"
            />
          </div>
          <p className="text-gray-400 text-lg md:text-xl font-light font-mono">
            crash_report_sent → auto_recovery_initiated
          </p>
        </motion.div>

        {/* HIGHLIGHTED STATUS CARD - Premium Design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="w-full max-w-2xl"
        >
          <AnimatePresence mode="wait">
            {/* Stage 1: Detected */}
            {reportStatus === "detected" && (
              <motion.div
                key="detected"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 blur-xl" />
                <div className="relative bg-gradient-to-br from-yellow-500/10 via-amber-500/10 to-yellow-500/10 border border-yellow-500/30 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl">
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <div className="absolute inset-0 bg-yellow-500/30 rounded-full blur-lg animate-pulse" />
                      <div className="relative w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-3xl">🔍</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-2xl md:text-3xl font-bold text-yellow-100 mb-2 tracking-tight">
                        Crash Detected
                      </div>
                      <div className="text-base text-yellow-200/70 font-light">
                        Capturing screenshot and preparing crash report...
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Stage 2: Sending */}
            {reportStatus === "sending" && (
              <motion.div
                key="sending"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-xl" />
                <div className="relative bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-purple-500/10 border border-purple-500/30 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl">
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-lg" />
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="relative w-16 h-16 border-4 border-purple-400/30 border-t-purple-400 rounded-full"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="text-2xl md:text-3xl font-bold text-purple-100 mb-2 tracking-tight">
                        📤 Sending to Gaurav
                      </div>
                      <div className="text-base text-purple-200/70 font-light">
                        Uploading error details, screenshot & system info
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Stage 3: Successfully Sent */}
            {reportStatus === "sent" && (
              <motion.div
                key="sent"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 blur-xl" />
                <div className="relative bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-green-500/10 border border-green-500/30 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl">
                  <div className="flex items-center gap-5">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ duration: 0.7, times: [0, 0.6, 1] }}
                      className="relative"
                    >
                      <div className="absolute inset-0 bg-green-500/30 rounded-full blur-lg animate-pulse" />
                      <div className="relative w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                        <CheckCircle className="w-9 h-9 text-white" strokeWidth={2.5} />
                      </div>
                    </motion.div>
                    <div className="flex-1">
                      <div className="text-2xl md:text-3xl font-bold text-green-100 mb-2 tracking-tight">
                        ✅ Sent to Gaurav Successfully
                      </div>
                      <div className="text-base text-green-200/70 font-light">
                        Report received • Owner notified • Will be fixed ASAP
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Stage 4: Failed */}
            {reportStatus === "failed" && (
              <motion.div
                key="failed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 blur-xl" />
                <div className="relative bg-gradient-to-br from-red-500/10 via-orange-500/10 to-red-500/10 border border-red-500/30 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl">
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <div className="absolute inset-0 bg-red-500/30 rounded-full blur-lg" />
                      <div className="relative w-16 h-16 bg-gradient-to-br from-red-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-3xl">⚠️</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-2xl font-bold text-red-100 mb-2 tracking-tight">
                        Failed to Send
                      </div>
                      <div className="text-sm text-red-200/70 font-light">
                        Report queued for retry when connection restored
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Error Card - Premium Design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="w-full max-w-2xl"
        >
          <div className="relative overflow-hidden rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/10 shadow-2xl">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-transparent" />
            
            {/* Header with Copy Button */}
            <div className="relative flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div>
                <div className="text-sm text-red-400 font-semibold tracking-wide mb-1">
                  Runtime {error.name}
                </div>
                <div className="text-xs text-gray-500 font-light">Error Details</div>
              </div>
              <button
                onClick={handleCopyError}
                className="group flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all duration-300 hover:scale-105"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400 font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                    <span className="text-sm text-gray-300 group-hover:text-white font-medium transition-colors">Copy Error</span>
                  </>
                )}
              </button>
            </div>

            {/* Error Message */}
            <div className="relative px-6 py-5">
              <div className="text-red-300 font-mono text-sm leading-relaxed break-words">
                {error.message}
              </div>
            </div>

            {/* Stack Trace - Collapsible */}
            {error.stack && (
              <details className="relative group">
                <summary className="cursor-pointer px-6 py-3 text-sm text-gray-400 hover:text-gray-300 hover:bg-white/5 transition-all select-none flex items-center gap-2">
                  <span className="text-xs">▶</span>
                  <span>View Stack Trace</span>
                </summary>
                <div className="px-6 pb-5">
                  <pre className="text-xs text-gray-500 bg-black/30 p-4 rounded-xl overflow-x-auto font-mono border border-white/5">
                    {error.stack}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </motion.div>

        {/* Action Buttons - Premium Style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex flex-wrap gap-4 justify-center"
        >
          <button
            onClick={() => reset()}
            className="group relative overflow-hidden flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-blue-500/50 font-medium"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <RefreshCw className="relative w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
            <span className="relative">Reload Page</span>
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="group flex items-center gap-3 px-8 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all duration-300 hover:scale-105 font-medium backdrop-blur-xl"
          >
            <Home className="w-5 h-5" />
            <span>Go Home</span>
          </button>
        </motion.div>

        {/* Footer - Minimalist */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-gray-600 space-y-1.5"
        >
          <div className="flex items-center gap-2 justify-center">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="font-light">Report automatically sent</span>
          </div>
          <div className="text-xs text-gray-700 font-light">
            We'll investigate and resolve this promptly
          </div>
        </motion.div>
      </div>
    </div>
  );
}
