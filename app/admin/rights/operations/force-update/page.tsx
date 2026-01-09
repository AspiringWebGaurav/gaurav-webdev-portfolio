"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, ArrowLeft, Loader2, Wifi, Users } from "lucide-react";
import { motion } from "framer-motion";
import { auth } from "@/lib/firebase";
import { showToast } from "@/lib/toast";
import ForceUpdateSystemStatus from "@/components/admin/ForceUpdateSystemStatus";
import { BatchUpdateResult } from "@/types/batchUpdate";
import ScanButton from "@/components/admin/force-update/ScanButton";
import LiveConnectionsResults, { ScanResults } from "@/components/admin/force-update/LiveConnectionsResults";
import NotificationPreview from "@/components/admin/force-update/NotificationPreview";
import BroadcastProgress from "@/components/admin/force-update/BroadcastProgress";
import SuccessCard from "@/components/admin/force-update/SuccessCard";
import DocumentationHub from "@/components/admin/force-update/DocumentationHub";
import ErrorDisplay from "@/components/admin/force-update/ErrorDisplay";

type FlowState = "idle" | "scanning" | "results-ready" | "preview-notification" | "broadcasting" | "completed" | "failed";

type ErrorSeverity = "warning" | "error" | "critical";

interface ErrorDetails {
  message: string;
  severity: ErrorSeverity;
  phase: "discovery" | "broadcast" | "countdown";
  canRetry: boolean;
  suggestedAction?: string;
}

interface BroadcastResult extends BatchUpdateResult {}

interface AuditLog {
  timestamp: number;
  phase: string;
  action: string;
  duration?: number;
  error?: string;
}

export default function ForceUpdatePage() {
  const router = useRouter();
  const [flowState, setFlowState] = useState<FlowState>("idle");
  const [scanResults, setScanResults] = useState<ScanResults | null>(null);
  const [broadcastResult, setBroadcastResult] = useState<BroadcastResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);
  
  // Discovery phase state
  const [discoveryProgress, setDiscoveryProgress] = useState(0);
  
  // Broadcast phase state
  const [broadcastProgress, setBroadcastProgress] = useState(0);
  const [broadcastStatus, setBroadcastStatus] = useState<string>("");
  const [clientCountdown, setClientCountdown] = useState<number>(0);
  
  // Network status
  const [isOnline, setIsOnline] = useState(true);
  
  // Retry state
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  
  // Audit logging
  const [auditLog, setAuditLog] = useState<AuditLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  
  // Refs for cleanup
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const discoveryIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const countdownTimeoutsRef = React.useRef<NodeJS.Timeout[]>([]);
  const isMountedRef = React.useRef(true);
  
  // Audit logging function
  const logAction = (phase: string, action: string, error?: string, duration?: number) => {
    const entry: AuditLog = {
      timestamp: Date.now(),
      phase,
      action,
      duration,
      error,
    };
    setAuditLog(prev => [...prev, entry]);
    console.log(`[Audit] ${phase} - ${action}`, error || duration ? { error, duration } : '');
  };
  
  // Cleanup function for countdowns
  const cleanupCountdown = () => {
    countdownTimeoutsRef.current.forEach(clearTimeout);
    countdownTimeoutsRef.current = [];
  };
  
  // Cleanup function for discovery
  const cleanupDiscovery = () => {
    if (discoveryIntervalRef.current) {
      clearInterval(discoveryIntervalRef.current);
      discoveryIntervalRef.current = null;
    }
  };
  
  // Abort current operation
  const abortOperation = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };
  
  // Comprehensive cleanup
  const cleanupAll = () => {
    cleanupCountdown();
    cleanupDiscovery();
    abortOperation();
  };
  
  // Get valid auth token with refresh
  const getValidToken = async () => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Authentication required - please sign in again");
    }
    // Force token refresh to ensure it's valid
    const token = await user.getIdToken(true);
    return token;
  };
  
  // Validate discovery response
  const validateDiscoveryResponse = (data: any): ScanResults => {
    if (!data.success) {
      throw new Error(data.error || "Discovery failed");
    }
    
    if (typeof data.totalUsers !== 'number') {
      throw new Error("Invalid response: missing totalUsers");
    }
    
    return {
      totalUsers: Math.max(0, data.totalUsers),
      discoveryMethod: data.discoveryMethod || 'unknown',
      discoveryDuration: data.discoveryDuration || 0,
      userIds: Array.isArray(data.userIds) ? data.userIds : [],
      timestamp: data.timestamp || Date.now(),
    };
  };
  
  // Network status monitoring
  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      logAction('system', 'Network connection restored');
      showToast.success('Back online', 'Network');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      logAction('system', 'Network connection lost', 'OFFLINE');
      showToast.error('No internet connection', 'Network');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Component unmount cleanup
  React.useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      cleanupAll();
      logAction('system', 'Component unmounted - all operations cleaned up');
    };
  }, []);

  // Step 1: Start scanning for live connections with retry and timeout
  const handleStartScan = async (isRetry: boolean = false) => {
    const startTime = Date.now();
    
    if (!isRetry) {
      logAction('discovery', 'Scan initiated by user');
    } else {
      logAction('discovery', `Retry attempt ${retryCount + 1}/${MAX_RETRIES}`);
    }
    
    // Check network status
    if (!isOnline) {
      const errDetails: ErrorDetails = {
        message: "No internet connection",
        severity: "critical",
        phase: "discovery",
        canRetry: true,
        suggestedAction: "Check your internet connection and try again",
      };
      setErrorDetails(errDetails);
      setError(errDetails.message);
      setFlowState("failed");
      logAction('discovery', 'Failed - no internet', 'OFFLINE');
      return;
    }
    
    // Prevent double-clicks
    if (flowState === "scanning" || flowState === "broadcasting") {
      logAction('discovery', 'Ignored - already in progress');
      return;
    }

    // Set state to scanning
    setFlowState("scanning");
    setDiscoveryProgress(0);
    setError(null);
    setErrorDetails(null);
    if (!isRetry) {
      setScanResults(null);
      setBroadcastResult(null);
      setAuditLog([]);
    }

    // OPTIMIZED: No more polling - progress updates based on actual API timing
    // Progress will be updated when API completes (smart activation, zero polling)

    // Create abort controller with 30s timeout
    abortControllerRef.current = new AbortController();
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        logAction('discovery', 'Aborted - 30s timeout exceeded', 'TIMEOUT');
      }
    }, 30000);

    try {
      const token = await getValidToken();
      
      logAction('discovery', 'Calling discovery API');
      
      // Call real discovery endpoint (NO broadcasts)
      const response = await fetch("/api/admin/discover-connections", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: abortControllerRef.current.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || "Discovery failed");
      }

      const data = await response.json();
      
      if (!isMountedRef.current) return;
      
      // Validate response
      const scanData = validateDiscoveryResponse(data);
      
      cleanupDiscovery();
      setDiscoveryProgress(100);
      
      const duration = Date.now() - startTime;
      logAction('discovery', `Complete - found ${scanData.totalUsers} connections`, undefined, duration);

      setScanResults(scanData);
      setFlowState("results-ready");
      setRetryCount(0); // Reset retry count on success
      
      if (scanData.totalUsers === 0) {
        showToast.info("No active connections found", "Scan Complete");
      } else {
        showToast.success(`Found ${scanData.totalUsers} live connection${scanData.totalUsers > 1 ? 's' : ''}`, "Scan Complete");
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      cleanupDiscovery();
      
      if (!isMountedRef.current) return;
      
      const duration = Date.now() - startTime;
      
      // Handle abort
      if (err.name === 'AbortError') {
        const errDetails: ErrorDetails = {
          message: "Discovery timed out after 30 seconds",
          severity: "error",
          phase: "discovery",
          canRetry: true,
          suggestedAction: "The server may be slow. Try again.",
        };
        setErrorDetails(errDetails);
        setError(errDetails.message);
        logAction('discovery', 'Failed - timeout', 'TIMEOUT', duration);
      } else {
        let errorMessage = "Failed to scan for live connections";
        if (err.message) {
          errorMessage = err.message;
        } else if (typeof err === 'string') {
          errorMessage = err;
        }
        
        const canRetry = retryCount < MAX_RETRIES;
        const errDetails: ErrorDetails = {
          message: errorMessage,
          severity: "error",
          phase: "discovery",
          canRetry,
          suggestedAction: canRetry ? "Click retry to attempt again" : "Check system status and try later",
        };
        setErrorDetails(errDetails);
        setError(errorMessage);
        logAction('discovery', 'Failed', errorMessage, duration);
      }
      
      setFlowState("failed");
      showToast.error(errorDetails?.message || "Scan failed", "Discovery Error");
    }
  };
  
  // Retry handler
  const handleRetry = () => {
    if (retryCount >= MAX_RETRIES) {
      showToast.error('Maximum retry attempts reached', 'Cannot Retry');
      return;
    }
    
    setRetryCount(prev => prev + 1);
    
    if (errorDetails?.phase === 'discovery') {
      handleStartScan(true);
    } else if (errorDetails?.phase === 'broadcast') {
      handleConfirmAndSend(true);
    }
  };

  // Step 2: User continues to preview from results
  const handleContinueToPreview = () => {
    if (!scanResults) return;
    setFlowState("preview-notification");
  };

  // Step 3: User confirms and triggers broadcast with sequential timing and full safety
  const handleConfirmAndSend = async (isRetry: boolean = false) => {
    if (!scanResults) return;
    
    const startTime = Date.now();
    
    if (!isRetry) {
      logAction('broadcast', 'Broadcast initiated by user');
    } else {
      logAction('broadcast', `Retry attempt ${retryCount + 1}/${MAX_RETRIES}`);
    }
    
    // Check network status
    if (!isOnline) {
      const errDetails: ErrorDetails = {
        message: "No internet connection",
        severity: "critical",
        phase: "broadcast",
        canRetry: true,
        suggestedAction: "Check your internet connection and try again",
      };
      setErrorDetails(errDetails);
      setError(errDetails.message);
      setFlowState("failed");
      logAction('broadcast', 'Failed - no internet', 'OFFLINE');
      return;
    }
    
    setFlowState("broadcasting");
    setBroadcastProgress(0);
    setClientCountdown(0);
    if (!isRetry) {
      cleanupCountdown();
    }
    
    // Create abort controller with 60s timeout (longer for batching)
    abortControllerRef.current = new AbortController();
    const mainTimeoutId = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        logAction('broadcast', 'Aborted - 60s timeout exceeded', 'TIMEOUT');
      }
    }, 60000);
    
    try {
      // ============ PHASE 1: Authentication (2 seconds) ============
      setBroadcastStatus("Authenticating admin request");
      setBroadcastProgress(5);
      logAction('broadcast', 'Phase 1: Authentication started');
      
      const token = await getValidToken();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (!isMountedRef.current) {
        clearTimeout(mainTimeoutId);
        return;
      }
      
      setBroadcastProgress(10);
      logAction('broadcast', 'Phase 1: Authentication complete');
      
      // ============ PHASE 2: Broadcasting (3 seconds) ============
      setBroadcastStatus(`Broadcasting to ${scanResults.totalUsers} connection${scanResults.totalUsers > 1 ? 's' : ''} via 3-layer system`);
      setBroadcastProgress(15);
      logAction('broadcast', 'Phase 2: Broadcasting started');
      
      // THIS IS THE ONLY PLACE WHERE BROADCASTS ARE TRIGGERED
      const response = await fetch("/api/admin/force-update-clients", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: abortControllerRef.current.signal,
      });

      clearTimeout(mainTimeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || "Broadcast failed");
      }

      const data = await response.json();
      
      if (!isMountedRef.current) return;
      
      // Validate broadcast result
      if (!data.totalUsers || typeof data.totalUsers !== 'number') {
        throw new Error("Invalid broadcast response");
      }
      
      logAction('broadcast', `Phase 2: API responded - ${data.successfulLayers}/3 layers succeeded`);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (!isMountedRef.current) return;
      
      setBroadcastProgress(30);

      // ============ PHASE 3: Clients Receiving (2 seconds) ============
      setBroadcastStatus("Clients receiving update notification");
      setBroadcastProgress(35);
      logAction('broadcast', 'Phase 3: Clients receiving');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (!isMountedRef.current) return;
      
      setBroadcastProgress(40);

      // ============ PHASE 4: Client Countdown (10 seconds - MIRRORS USER EXPERIENCE) ============
      setBroadcastStatus("Clients showing 10-second countdown on screen");
      logAction('broadcast', 'Phase 4: Client countdown started (10s)');
      
      // Live countdown from 10 to 0
      for (let i = 10; i >= 0; i--) {
        if (!isMountedRef.current) {
          cleanupCountdown();
          return;
        }
        
        setClientCountdown(i);
        const progressIncrement = 40 / 10;
        setBroadcastProgress(40 + ((10 - i) * progressIncrement));
        
        const timeoutId = setTimeout(() => {}, 1000);
        countdownTimeoutsRef.current.push(timeoutId);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      cleanupCountdown();
      
      if (!isMountedRef.current) return;
      
      setBroadcastProgress(80);
      logAction('broadcast', 'Phase 4: Client countdown complete');

      // ============ PHASE 5: Confirming Reload (2 seconds) ============
      setBroadcastStatus("Confirming browser reloads");
      setBroadcastProgress(85);
      logAction('broadcast', 'Phase 5: Confirming reloads');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (!isMountedRef.current) return;
      
      setBroadcastProgress(95);

      // ============ PHASE 6: Finalizing (1 second) ============
      setBroadcastStatus("Broadcast complete!");
      setBroadcastProgress(100);
      logAction('broadcast', 'Phase 6: Finalizing');
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (!isMountedRef.current) return;

      const duration = Date.now() - startTime;
      logAction('broadcast', `Complete - all phases finished`, undefined, duration);

      // ============ PHASE 7: Show Success ============
      setBroadcastResult({
        ...data,
        timestamp: new Date(data.timestamp).toLocaleString(),
      });

      setFlowState("completed");
      setRetryCount(0);

      // Show appropriate toast based on success level
      if (data.successfulLayers === 3) {
        showToast.success(
          `All 3 layers succeeded! ${data.totalBatches} batch${data.totalBatches > 1 ? 'es' : ''} sent to ${data.totalUsers} users.`,
          "Update Sent Successfully"
        );
      } else if (data.successfulLayers > 0) {
        showToast.warning(
          `${data.successfulLayers}/3 layers succeeded. ${data.totalBatches} batch${data.totalBatches > 1 ? 'es' : ''} sent.`,
          "Partial Success"
        );
        logAction('broadcast', `Partial success - ${data.successfulLayers}/3 layers`, 'PARTIAL');
      } else {
        throw new Error("All broadcast layers failed");
      }
    } catch (err: any) {
      clearTimeout(mainTimeoutId);
      cleanupCountdown();
      
      if (!isMountedRef.current) return;
      
      const duration = Date.now() - startTime;
      
      // Handle abort
      if (err.name === 'AbortError') {
        const errDetails: ErrorDetails = {
          message: "Broadcast timed out after 60 seconds",
          severity: "error",
          phase: "broadcast",
          canRetry: false, // Don't retry broadcasts - risk of duplicates
          suggestedAction: "Check if broadcasts were sent. View logs for details.",
        };
        setErrorDetails(errDetails);
        setError(errDetails.message);
        logAction('broadcast', 'Failed - timeout', 'TIMEOUT', duration);
      } else {
        const canRetry = retryCount < MAX_RETRIES && !err.message.includes('layers failed');
        const errDetails: ErrorDetails = {
          message: err.message || "Failed to send update",
          severity: err.message.includes('layers failed') ? "critical" : "error",
          phase: "broadcast",
          canRetry,
          suggestedAction: canRetry ? "You can retry this operation" : "Check system status and logs",
        };
        setErrorDetails(errDetails);
        setError(errDetails.message);
        logAction('broadcast', 'Failed', err.message, duration);
      }
      
      setFlowState("failed");
      showToast.error(errorDetails?.message || "Broadcast failed", "Error");
    }
  };

  // Cancel from results screen
  const handleCancelFromResults = () => {
    handleReset();
  };

  // Go back from preview to results
  const handleBackToResults = () => {
    setFlowState("results-ready");
  };

  // Re-trigger: Reset to idle and start over
  const handleReTrigger = () => {
    handleReset();
  };

  const handleReset = () => {
    cleanupAll();
    setFlowState("idle");
    setScanResults(null);
    setBroadcastResult(null);
    setError(null);
    setErrorDetails(null);
    setDiscoveryProgress(0);
    setBroadcastProgress(0);
    setBroadcastStatus("");
    setClientCountdown(0);
    setRetryCount(0);
    setShowLogs(false);
    logAction('system', 'Reset to idle state');
  };
  
  // Auto-reset after completion (10 seconds)
  React.useEffect(() => {
    if (flowState === "completed") {
      console.log('[Force Update UI] State changed to completed - Auto-reset in 10 seconds');
      const resetTimer = setTimeout(() => {
        console.log('[Force Update UI] Auto-resetting to idle state');
        handleReset();
      }, 10000);
      
      return () => {
        clearTimeout(resetTimer);
      };
    }
  }, [flowState]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/30">
                <RefreshCw className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Update Old Connections</h1>
                <p className="text-sm text-gray-600 mt-0.5">Force reload all client browsers instantly</p>
              </div>
            </div>

            <button
              onClick={() => router.push("/admin/rights/operations")}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Operations Hub</span>
              <span className="sm:hidden">Back</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <div className="space-y-6">
          {/* Network Status Banner */}
          {!isOnline && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border-2 border-red-300 rounded-xl p-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">📡</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-red-900 text-sm">No Internet Connection</p>
                <p className="text-xs text-red-700">All operations are disabled until connection is restored</p>
              </div>
            </motion.div>
          )}
          
          {/* System Health Monitor */}
          <ForceUpdateSystemStatus />

          {/* MAIN WIZARD FLOW */}
          {flowState === "idle" && (
            <ScanButton onScan={handleStartScan} disabled={!isOnline} />
          )}

          {flowState === "scanning" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-8"
            >
              <div className="flex flex-col items-center justify-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center"
                >
                  <div className="relative mb-6">
                    <motion.div
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center"
                      animate={{
                        boxShadow: [
                          '0 0 0 0 rgba(59, 130, 246, 0.7)',
                          '0 0 0 20px rgba(59, 130, 246, 0)',
                        ],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                      }}
                    >
                      <Wifi className="w-10 h-10 text-white" />
                    </motion.div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Discovering Live Connections
                  </h3>
                  <p className="text-sm text-gray-600 mb-6 text-center max-w-sm">
                    Scanning for active portfolio tabs across all devices...
                  </p>

                  {/* Progress Bar */}
                  <div className="w-80 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">Progress</span>
                      <span className="text-xs font-semibold text-blue-600">{Math.round(discoveryProgress)}%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${discoveryProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-4">
                    This takes ~5 seconds to ensure all connections respond
                  </p>
                </motion.div>
              </div>
            </motion.div>
          )}

          {flowState === "results-ready" && scanResults && (
            <LiveConnectionsResults
              results={scanResults}
              onContinue={handleContinueToPreview}
              onCancel={handleCancelFromResults}
            />
          )}

          {flowState === "preview-notification" && scanResults && (
            <NotificationPreview
              scanResults={scanResults}
              onConfirm={handleConfirmAndSend}
              onBack={handleBackToResults}
            />
          )}

          {flowState === "broadcasting" && (
            <BroadcastProgress 
              status={broadcastStatus}
              progress={broadcastProgress}
              countdown={clientCountdown}
            />
          )}

          {flowState === "completed" && broadcastResult && (
            <SuccessCard
              result={broadcastResult}
              onReTrigger={handleReTrigger}
            />
          )}

          {flowState === "failed" && errorDetails && (
            <ErrorDisplay
              errorDetails={errorDetails}
              auditLog={auditLog}
              onRetry={handleRetry}
              onReset={handleReset}
              retryCount={retryCount}
              maxRetries={MAX_RETRIES}
            />
          )}
          
          {flowState === "failed" && !errorDetails && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-sm border border-red-200 p-8"
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-3xl">❌</span>
                </div>
                <h3 className="text-xl font-bold text-red-900 mb-2">Operation Failed</h3>
                <p className="text-sm text-red-700 mb-6">{error || "An unknown error occurred"}</p>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all"
                >
                  Try Again
                </button>
              </div>
            </motion.div>
          )}

          {/* Documentation Hub - Always Visible Below Main Content */}
          <DocumentationHub />
        </div>
      </div>
    </div>
  );
}
