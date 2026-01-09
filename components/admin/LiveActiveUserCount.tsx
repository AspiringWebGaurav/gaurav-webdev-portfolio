/**
 * Live Active User Count Component - Real-Time Ping-Pong System
 * 
 * Admin triggers ping → Server broadcasts → Clients respond → Show results
 * 
 * Features:
 * - Real-time ping-pong (not database polling)
 * - Active/Minimized/Offline detection
 * - Total tabs count
 * - Dynamic wait window (5 sec max, early exit)
 * - Manual cleanup button
 * - Auto-cleanup on unmount
 */

"use client";

import React, { useState, useEffect } from "react";
import { Users, Activity, Minimize2, Moon, AlertCircle, CheckCircle, Loader2, Clock, Trash2, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { auth } from "@/lib/firebase";
import { showToast } from "@/lib/toast";
import { motion, AnimatePresence } from "framer-motion";

type CheckState = "idle" | "running" | "completed" | "failed";

interface LiveUserData {
  active: number;
  minimized: number;
  offline: number;
  totalTabs: number;
  uniqueUsers: number;
  pingId: string;
  timestamp: string;
  waitTime: number;
}

export default function LiveActiveUserCount(): JSX.Element {
  const [state, setState] = useState<CheckState>("idle");
  const [data, setData] = useState<LiveUserData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  /**
   * Silent cleanup (for unmount)
   */
  const handleCleanupSilent = async (pingId: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      await fetch(`/api/admin/live-user-check?pingId=${pingId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
      console.log("[Live User Count] Silent cleanup complete");
    } catch (err) {
      console.error("[Live User Count] Silent cleanup error:", err);
    }
  };

  // Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      if (data?.pingId) {
        handleCleanupSilent(data.pingId);
      }
      console.log("[Live User Count] Component unmounted - cleanup triggered");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.pingId]);

  /**
   * Trigger live user check
   */
  const handleTriggerCheck = async () => {
    // Reset previous state
    setState("running");
    setData(null);
    setError(null);

    try {
      // Get auth token
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Not authenticated");
      }

      const token = await user.getIdToken();

      // Call API with timeout (Layer 1: Network Timeout)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout (API max 5s + buffer)

      try {
        const response = await fetch("/api/admin/live-user-check", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Layer 2: API Error Response
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(errorData.error || `API error: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success || !result.data) {
          throw new Error(result.error || "Invalid response from server");
        }

        // Calculate totals
        const totalTabs = result.data.totalTabs || 0;
        const totalUsers = result.data.active + result.data.minimized + result.data.offline;
        
        if (totalTabs === 0 && totalUsers === 0) {
          setData(result.data);
          setState("completed");
          setLastChecked(new Date().toLocaleTimeString());
          showToast.info("No active users detected at this moment", "Live Check Complete");
          return;
        }

        // Success with data
        setData(result.data);
        setState("completed");
        setLastChecked(new Date().toLocaleTimeString());
        showToast.success(
          `Found ${totalTabs} tab${totalTabs !== 1 ? 's' : ''} open from ${result.data.uniqueUsers} user${result.data.uniqueUsers !== 1 ? 's' : ''}`,
          "Live Check Complete"
        );

      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        // Handle timeout specifically
        if (fetchError.name === "AbortError") {
          throw new Error("Request timed out after 10 seconds");
        }
        throw fetchError;
      }

    } catch (err: any) {
      console.error("[Live User Count] Error:", err);
      setState("failed");
      setError(err.message || "Failed to perform live check");
      showToast.error(err.message || "Failed to perform live check", "Check Failed");
    }
  };

  /**
   * Retry after failure
   */
  const handleRetry = () => {
    setState("idle");
    setError(null);
  };

  /**Manual cleanup - Delete ping data
   */
  const handleCleanup = async () => {
    if (!data?.pingId) return;

    setIsCleaningUp(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");

      const token = await user.getIdToken();

      const response = await fetch(`/api/admin/live-user-check?pingId=${data.pingId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Cleanup failed");
      }

      setData(null);
      setState("idle");
      setLastChecked(null);
      showToast.success("Check data cleared successfully", "Cleanup Complete");
    } catch (err: any) {
      console.error("[Live User Count] Cleanup error:", err);
      showToast.error(err.message || "Failed to clear data", "Cleanup Failed");
    } finally {
      setIsCleaningUp(false);
    }
  };

  /**
   * Format time ago
   */
  const getTimeAgo = () => {
    if (!lastChecked) return null;
    return `Last checked: ${lastChecked}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
          <Activity className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Live Active User Count</h3>
          <p className="text-sm text-gray-600">
            Check real-time user activity status
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>How it works:</strong> Triggers a real-time ping to all connected clients. Browsers respond with their state. Shows accurate live data including total tabs open.
        </p>
      </div>

      {/* Trigger Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleTriggerCheck}
          disabled={state === "running"}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            state === "running"
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 active:scale-95"
          } text-white shadow-md hover:shadow-lg`}
        >
          {state === "running" ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Checking...</span>
            </>
          ) : (
            <>
              <Activity className="w-5 h-5" />
              <span>Trigger Live Check</span>
            </>
          )}
        </button>

        {/* Retry button for failed state */}
        {state === "failed" && (
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 px-4 py-3 rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        )}
      </div>

      {/* Status Indicator */}
      <AnimatePresence mode="wait">
        {state !== "idle" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2"
          >
            {state === "running" && (
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">Running live check...</span>
              </div>
            )}
            {state === "completed" && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Check completed successfully</span>
              </div>
            )}
            {state === "failed" && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Check failed</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Results - Count Cards */}
      <AnimatePresence mode="wait">
        {data && state === "completed" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Active Tabs Card */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                    <Wifi className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-green-700 bg-green-200 px-2 py-1 rounded-full">
                    Active
                  </span>
                </div>
                <p className="text-3xl font-bold text-green-900">{data.active}</p>
                <p className="text-sm text-green-700 mt-1">{data.active} tab{data.active !== 1 ? 's' : ''} visible</p>
                <p className="text-xs text-green-600 mt-2">
                  Responded & visible
                </p>
              </div>

              {/* Minimized Tabs Card */}
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center">
                    <Minimize2 className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-yellow-700 bg-yellow-200 px-2 py-1 rounded-full">
                    Minimized
                  </span>
                </div>
                <p className="text-3xl font-bold text-yellow-900">{data.minimized}</p>
                <p className="text-sm text-yellow-700 mt-1">{data.minimized} tab{data.minimized !== 1 ? 's' : ''} hidden</p>
                <p className="text-xs text-yellow-600 mt-2">
                  Responded & hidden
                </p>
              </div>

              {/* Offline Users Card */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center">
                    <WifiOff className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-700 bg-gray-200 px-2 py-1 rounded-full">
                    Offline
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{data.offline}</p>
                <p className="text-sm text-gray-700 mt-1">Didn't respond</p>
                <p className="text-xs text-gray-600 mt-2">
                  In database but offline
                </p>
              </div>
            </div>

            {/* Summary Footer */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500">Checked at</p>
                    <p className="font-medium">{lastChecked}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Users className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500">Total tabs open</p>
                    <p className="font-bold text-blue-900">{data.totalTabs}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500">Unique users</p>
                    <p className="font-bold text-blue-900">{data.uniqueUsers}</p>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-blue-200 text-xs text-gray-600">
                Response time: <span className="font-medium text-blue-700">{data.waitTime}ms</span>
              </div>
            </div>

            {/* Cleanup Button */}
            <div className="flex justify-center">
              <button
                onClick={handleCleanup}
                disabled={isCleaningUp}
                className="flex items-center gap-2 px-6 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-medium transition-all border border-red-200 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCleaningUp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Clearing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Clear Check Data</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Notice */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-xs text-gray-600">
          <strong>How it works:</strong> Admin triggers ping → All open tabs respond in real-time → Accurate counts displayed. Click "Clear Check Data" or navigate away to cleanup. Auto-cleanup on page close.
        </p>
      </div>
    </div>
  );
}
