"use client";

/**
 * Crash Report Context Provider (MVC Model Layer)
 * Manages crash report state and provides actions to admin dashboard
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { usePathname } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import smartPolling from "@/lib/smartPolling";
import { showToast } from "@/lib/toast";
import {
  CrashReport,
  UpdateCrashReportDTO,
  CrashSeverity,
  CrashStatus,
} from "../types/crashReport";

// ============================================================================
// CONTEXT INTERFACE
// ============================================================================

interface CrashReportContextType {
  // State
  crashReports: CrashReport[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Counts (for dashboard badges)
  getNewCount: () => number;
  getCriticalCount: () => number;
  getUnreadCount: () => number;
  getUrgentCount: () => number; // NEW: Critical + unread
  getImmediateActionCount: () => number; // NEW: Critical + new (< 1 hour)
  getByStatus: (status: CrashStatus) => CrashReport[];
  getBySeverity: (severity: CrashSeverity) => CrashReport[];

  // Actions
  refreshCrashReports: (showLoading?: boolean) => Promise<void>;
  updateCrashReport: (id: string, updates: Partial<UpdateCrashReportDTO>) => Promise<void>;
  addAdminNote: (id: string, note: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAsUnread: (id: string) => Promise<void>;
  acknowledgeReport: (id: string) => Promise<void>;
  resolveReport: (id: string, resolution?: string) => Promise<void>;
  assignReport: (id: string, adminEmail: string) => Promise<void>;
  deleteCrashReport: (id: string) => Promise<void>;
}

// ============================================================================
// CONTEXT
// ============================================================================

const CrashReportContext = createContext<CrashReportContextType | undefined>(
  undefined
);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export function CrashReportProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [crashReports, setCrashReports] = useState<CrashReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const lastFetchRef = useRef<number>(0);
  const hasInitializedRef = useRef(false);

  // Only fetch on admin pages
  const isAdminPage = pathname?.startsWith("/admin");

  /**
   * Fetch all crash reports from server
   */
  const fetchCrashReports = useCallback(
    async (showLoading = true, force = false, retryCount = 0) => {
      // Skip if not on admin page
      if (!isAdminPage) {
        setLoading(false);
        return;
      }

      // Cache check (30 seconds) - SKIP cache check on force or initial load
      const cacheAge = Date.now() - lastFetchRef.current;
      if (!force && cacheAge < 30000 && crashReports.length > 0 && hasInitializedRef.current) {
        return;
      }

      try {
        if (showLoading) {
          setLoading(true);
        }
        setError(null);

        // Wait for auth to be ready
        let user = auth.currentUser;
        if (!user) {
          
          // Wait up to 5 seconds for auth
          const authReady = await new Promise<boolean>((resolve) => {
            let attempts = 0;
            const maxAttempts = 10; // 5 seconds total
            
            const checkAuth = setInterval(() => {
              attempts++;
              if (auth.currentUser) {
                clearInterval(checkAuth);
                resolve(true);
              } else if (attempts >= maxAttempts) {
                clearInterval(checkAuth);
                resolve(false);
              }
            }, 500);
          });

          if (!authReady) {
            setLoading(false);
            return;
          }
          
          user = auth.currentUser;
        }
        
        const token = await user!.getIdToken();

        // Fetch from API
        const response = await fetch("/api/crash-reports", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            setLoading(false);
            return;
          }
          throw new Error("Failed to fetch crash reports");
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "API reported failure");
        }

        // Convert date strings to Date objects
        const reports: CrashReport[] = data.reports.map((r: any) => ({
          ...r,
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt),
          firstSeen: new Date(r.firstSeen),
          lastSeen: new Date(r.lastSeen),
          timestamp: new Date(r.timestamp),
          resolvedAt: r.resolvedAt ? new Date(r.resolvedAt) : undefined,
          screenshot: r.screenshot ? {
            ...r.screenshot,
            capturedAt: new Date(r.screenshot.capturedAt),
          } : null,
          adminNotes: (r.adminNotes || []).map((note: any) => ({
            ...note,
            createdAt: new Date(note.createdAt),
          })),
        }));

        setCrashReports(reports);
        lastFetchRef.current = Date.now();
        setLastUpdated(new Date());

        // Show notification for new critical crashes (first load only)
        if (!hasInitializedRef.current) {
          const criticalCount = reports.filter(
            (r) => r.severity === "critical" && r.status === "new"
          ).length;
          if (criticalCount > 0) {
            showToast.warning(
              `${criticalCount} critical crash${criticalCount > 1 ? "es" : ""} detected`,
              "Crash Reports"
            );
          }
          hasInitializedRef.current = true;
        }
      } catch (err: any) {
        // Check if it's a network error and retry
        const isNetworkError =
          err.message?.includes('network') ||
          err.message?.includes('fetch') ||
          err.code === 'auth/network-request-failed';
        
        if (isNetworkError && retryCount < 3) {
          
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, retryCount) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          
          return fetchCrashReports(showLoading, force, retryCount + 1);
        }
        
        setError(err.message || "Failed to fetch crash reports");
        if (!crashReports.length) {
          setCrashReports([]);
        }
      } finally {
        setLoading(false);
      }
    },
    [isAdminPage, crashReports.length]
  );

  /**
   * Smart polling setup
   */
  useEffect(() => {
    if (!isAdminPage) return;

    smartPolling.register(
      "crash-reports",
      () => fetchCrashReports(false),
      {
        priority: 'high',
        intervals: {
          active: 30000,  // 30s (cache handles freshness)
          idle: 90000,    // 90s when idle
          background: 0,  // Stop when hidden
        },
        stopOnHidden: true,  // Stop polling when tab hidden (100% savings)
        stopOnIdle: true,    // Stop polling after 2min idle
        maxIdleTime: 120000, // 2 minutes before considered idle
      }
    );

    return () => smartPolling.unregister("crash-reports");
  }, [isAdminPage, fetchCrashReports]);

  /**
   * Initial fetch on mount - MORE AGGRESSIVE with multiple retries
   */
  useEffect(() => {
    if (isAdminPage && !hasInitializedRef.current) {
      
      // Immediate attempt
      fetchCrashReports(true, true);
      
      // Retry every second for up to 5 seconds if not initialized
      let retryCount = 0;
      const retryInterval = setInterval(() => {
        if (hasInitializedRef.current) {
          clearInterval(retryInterval);
          return;
        }
        
        retryCount++;
        fetchCrashReports(true, true);
        
        if (retryCount >= 5) {
          clearInterval(retryInterval);
        }
      }, 1000);
      
      return () => clearInterval(retryInterval);
    }
  }, [isAdminPage, fetchCrashReports]);

  /**
   * Auto-refresh on page visibility change (when user returns to tab)
   * Same behavior as visitor analytics for consistency
   */
  useEffect(() => {
    if (!isAdminPage) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && hasInitializedRef.current) {
        fetchCrashReports(false, true); // Force refresh when page becomes visible
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAdminPage, fetchCrashReports]);

  /**
   * Instant notification system - Listen for new crashes via BroadcastChannel
   * When crash is sent from any tab, immediately fetch new data
   */
  useEffect(() => {
    if (!isAdminPage || typeof BroadcastChannel === 'undefined') {
      return;
    }

    const channel = new BroadcastChannel('crash-reports');

    channel.onmessage = (event) => {
      if (event.data.type === 'NEW_CRASH') {
        fetchCrashReports(false, true); // Immediate fetch, bypass cache, no loading spinner
      }
    };

    return () => {
      channel.close();
    };
  }, [isAdminPage, fetchCrashReports]);

  // ========================================================================
  // COUNT HELPERS
  // ========================================================================

  const getNewCount = () =>
    crashReports.filter((r) => r.status === "new").length;

  const getCriticalCount = () =>
    crashReports.filter((r) => r.severity === "critical").length;

  const getUnreadCount = () =>
    crashReports.filter((r) => r.status === "new" || r.status === "unread").length;
  // NEW: Urgent = Critical + Unread (needs immediate attention)
  const getUrgentCount = () =>
    crashReports.filter(
      (r) => r.severity === "critical" && (r.status === "new" || r.status === "unread")
    ).length;

  // NEW: Immediate Action = Critical + New (< 1 hour old)
  const getImmediateActionCount = () => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    return crashReports.filter(
      (r) =>
        r.severity === "critical" &&
        r.status === "new" &&
        new Date(r.createdAt).getTime() > oneHourAgo
    ).length;
  };
  const getByStatus = (status: CrashStatus) =>
    crashReports.filter((r) => r.status === status);

  const getBySeverity = (severity: CrashSeverity) =>
    crashReports.filter((r) => r.severity === severity);

  // ========================================================================
  // ACTIONS
  // ========================================================================

  /**
   * Update crash report
   */
  const updateCrashReport = async (
    id: string,
    updates: Partial<UpdateCrashReportDTO>
  ): Promise<void> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");

      const token = await user.getIdToken();

      const response = await fetch("/api/crash-reports", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, updates }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to update");
      }

      // Refresh to get latest data
      await fetchCrashReports(false, true);

      showToast.success("Crash report updated");
    } catch (err: any) {
      console.error("[CrashReports] Update error:", err);
      showToast.error(err.message || "Failed to update crash report");
      throw err;
    }
  };

  /**
   * Add admin note
   */
  const addAdminNote = async (id: string, note: string): Promise<void> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");

      const report = crashReports.find((r) => r.id === id);
      if (!report) throw new Error("Report not found");

      const newNote = {
        id: `note_${Date.now()}`,
        content: note,
        createdBy: user.email || "Unknown",
        createdAt: new Date(),
      };

      // Update via direct API call since adminNotes isn't in UpdateCrashReportDTO
      const response = await fetch(`/api/crash-reports`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          adminNotes: [...report.adminNotes, newNote],
        }),
      });

      if (!response.ok) throw new Error("Failed to add note");
      await fetchCrashReports(false);

      showToast.success("Note added");
    } catch (err: any) {
      console.error("[CrashReports] Add note error:", err);
      showToast.error(err.message || "Failed to add note");
      throw err;
    }
  };

  /**
   * Mark as read
   */
  const markAsRead = async (id: string): Promise<void> => {
    await updateCrashReport(id, { status: "acknowledged" });
  };

  /**
   * Mark as unread
   */
  const markAsUnread = async (id: string): Promise<void> => {
    await updateCrashReport(id, { status: "unread" });
  };

  /**
   * Acknowledge report
   */
  const acknowledgeReport = async (id: string): Promise<void> => {
    await updateCrashReport(id, { status: "acknowledged" });
  };

  /**
   * Resolve report
   */
  const resolveReport = async (id: string, resolution?: string): Promise<void> => {
    const updates: any = { status: "resolved" };

    if (resolution) {
      await addAdminNote(id, `Resolution: ${resolution}`);
    }

    await updateCrashReport(id, updates);
  };

  /**
   * Assign report
   */
  const assignReport = async (id: string, adminEmail: string): Promise<void> => {
    await updateCrashReport(id, { assignedTo: adminEmail });
    showToast.success(`Assigned to ${adminEmail}`);
  };

  /**
   * Delete crash report with 3-layer fallback
   */
  const deleteCrashReport = async (id: string): Promise<void> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");

      // Find the report to get screenshot URL
      const report = crashReports.find(r => r.id === id);
      const screenshotUrl = report?.screenshot?.url;

      const token = await user.getIdToken();

      // Layer 1: Immediate deletion
      const response = await fetch(`/api/crash-reports?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: AbortSignal.timeout(10000),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to delete");
      }

      // Remove from local state immediately
      setCrashReports((prev) => prev.filter((r) => r.id !== id));

      // Show appropriate toast based on deletion results
      if (data.deletedFromStorage || !data.hadScreenshot) {
        showToast.success("Crash report and all data deleted");
      } else if (data.deletedFromFirestore) {
        showToast.warning("Crash report deleted, but screenshot cleanup may be pending");
      } else {
        showToast.success("Crash report deleted");
      }

    } catch (err: any) {
      
      // Check if it's a timeout or network error
      if (err.name === 'AbortError' || err.message.includes('timeout')) {
        showToast.warning("Deletion may be pending - refresh to verify");
      } else {
        showToast.error(err.message || "Failed to delete crash report");
      }
      
      throw err;
    }
  };

  // ========================================================================
  // PROVIDER VALUE
  // ========================================================================

  const value: CrashReportContextType = {
    crashReports,
    loading,
    error,
    lastUpdated,
    getNewCount,
    getCriticalCount,
    getUnreadCount,
    getUrgentCount,
    getImmediateActionCount,
    getByStatus,
    getBySeverity,
    refreshCrashReports: fetchCrashReports,
    updateCrashReport,
    addAdminNote,
    markAsRead,
    markAsUnread,
    acknowledgeReport,
    resolveReport,
    assignReport,
    deleteCrashReport,
  };

  return (
    <CrashReportContext.Provider value={value}>
      {children}
    </CrashReportContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useCrashReports() {
  const context = useContext(CrashReportContext);
  if (!context) {
    throw new Error("useCrashReports must be used within CrashReportProvider");
  }
  return context;
}
