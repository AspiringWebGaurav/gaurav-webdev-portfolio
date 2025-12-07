"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { usePathname } from "next/navigation";
import { showToast } from "@/lib/toast";
import {
  BugReport,
  CreateBugReportDTO,
  UpdateBugReportDTO,
  AddAdminNoteDTO,
  BugReportOperationResult,
  BugSeverity,
  BugStatus,
} from "@/types/bugReport";

interface BugReportContextType {
  bugReports: BugReport[];
  loading: boolean;
  error: string | null;
  createBugReport: (data: CreateBugReportDTO) => Promise<BugReportOperationResult>;
  updateBugReport: (data: UpdateBugReportDTO) => Promise<BugReportOperationResult>;
  deleteBugReport: (id: string, silent?: boolean) => Promise<BugReportOperationResult>;
  addAdminNote: (data: AddAdminNoteDTO) => Promise<BugReportOperationResult>;
  getBugReportById: (id: string) => BugReport | undefined;
  getNewBugReportsCount: () => number;
  getCriticalBugReportsCount: () => number;
  getBugReportsBySeverity: (severity: BugSeverity) => BugReport[];
  getBugReportsByStatus: (status: BugStatus) => BugReport[];
  refreshBugReports: () => Promise<void>;
}

const BugReportContext = createContext<BugReportContextType | undefined>(
  undefined
);

export function BugReportProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previousNewCountRef = useRef<number>(0);
  const hasInitializedRef = useRef(false);

  // Only fetch bug reports on admin pages (requires authentication)
  const isAdminPage = pathname?.startsWith('/admin');

  /**
   * Fetch all bug reports (admin only)
   * 
   * IMPORTANT: Bug reports are only fetched on /admin/* pages
   * to avoid Firebase permission errors on public pages.
   * Non-admin pages can still submit bug reports via createBugReport.
   */
  const fetchBugReports = useCallback(async (showLoading = true) => {
    // Skip fetching on non-admin pages to avoid permission errors
    if (!isAdminPage) {
      setLoading(false);
      return;
    }

    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      const response = await fetch("/api/bug-reports");
      const data = await response.json();

      if (!response.ok || !data.success) {
        // Check if this is a permission error - fail silently for non-critical cases
        if (response.status === 403 || response.status === 401) {
          console.log("[BugReports] Permission denied - user may not be authenticated");
          setLoading(false);
          return;
        }
        throw new Error(data.error || "Failed to fetch bug reports");
      }

      // Convert date strings back to Date objects
      const reports = data.bugReports.map((r: any) => ({
        ...r,
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt),
        resolvedAt: r.resolvedAt ? new Date(r.resolvedAt) : undefined,
        attachments: r.attachments.map((att: any) => ({
          ...att,
          uploadedAt: new Date(att.uploadedAt),
        })),
        adminNotes: r.adminNotes.map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
        })),
      }));

      // Check for new bug reports
      const previousNew = previousNewCountRef.current;
      const currentNew = reports.filter((r: BugReport) => r.status === "new").length;

      setBugReports(reports);

      // Update ref for next comparison
      previousNewCountRef.current = currentNew;

      console.log("[BugReports] 🐛 Polling Update:", {
        total: reports.length,
        newCount: currentNew,
        previousNewCount: previousNew,
        changed: currentNew !== previousNew,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      // Silently handle permission errors on non-admin pages
      if (!isAdminPage) {
        console.log("[BugReports] Skipping error on non-admin page");
        setLoading(false);
        return;
      }
      console.error("[BugReports] Error fetching bug reports:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [isAdminPage]);

  /**
   * Initial load - only on admin pages
   * Reset initialization flag when leaving admin pages
   */
  useEffect(() => {
    if (isAdminPage) {
      // Fetch on admin pages - allow refetch when navigating back
      fetchBugReports();
    } else {
      // Reset flag when leaving admin so next admin visit fetches fresh data
      hasInitializedRef.current = false;
      setLoading(false);
    }
  }, [fetchBugReports, isAdminPage]);

  /**
   * Polling for updates (every 30 seconds) - only on admin pages
   */
  useEffect(() => {
    // Only poll on admin pages
    if (!isAdminPage) return;

    const interval = setInterval(() => {
      fetchBugReports(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchBugReports, isAdminPage]);

  /**
   * Create a new bug report with attachments
   */
  const createBugReport = useCallback(
    async (data: CreateBugReportDTO): Promise<BugReportOperationResult> => {
      try {
        const formData = new FormData();

        // Append text fields
        if (data.reporterName) formData.append("reporterName", data.reporterName);
        if (data.reporterEmail) formData.append("reporterEmail", data.reporterEmail);
        formData.append("title", data.title);
        formData.append("severity", data.severity);
        formData.append("stepsToReproduce", data.stepsToReproduce);
        formData.append("actualBehavior", data.actualBehavior);
        if (data.category) formData.append("category", data.category);
        if (data.expectedBehavior) formData.append("expectedBehavior", data.expectedBehavior);
        if (data.url) formData.append("url", data.url);
        if (data.browserInfo) formData.append("browserInfo", data.browserInfo);
        if (data.userAgent) formData.append("userAgent", data.userAgent);
        if (data.ipAddress) formData.append("ipAddress", data.ipAddress);
        if (data.fingerprint) formData.append("fingerprint", data.fingerprint);
        if (data.honeypot !== undefined) formData.append("honeypot", data.honeypot);
        if (data.timeSpent) formData.append("timeSpent", data.timeSpent.toString());
        if (data.turnstileToken) formData.append("turnstileToken", data.turnstileToken);

        // Append file attachments
        if (data.attachments && data.attachments.length > 0) {
          data.attachments.forEach((file, index) => {
            formData.append(`attachment_${index}`, file);
          });
        }

        const response = await fetch("/api/bug-reports", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to create bug report");
        }

        // Refresh bug reports
        await fetchBugReports(false);

        showToast.success("Bug report submitted successfully!");

        return {
          success: true,
          bugReportId: result.bugReportId,
          referenceId: result.referenceId,
        };
      } catch (error: any) {
        console.error("[BugReports] Error creating bug report:", error);
        showToast.error(error.message || "Failed to submit bug report");
        return {
          success: false,
          error: error.message,
        };
      }
    },
    [fetchBugReports]
  );

  /**
   * Update a bug report
   */
  const updateBugReport = useCallback(
    async (data: UpdateBugReportDTO): Promise<BugReportOperationResult> => {
      try {
        const response = await fetch("/api/bug-reports", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to update bug report");
        }

        // Refresh bug reports
        await fetchBugReports(false);

        showToast.success("Bug report updated successfully!");

        return { success: true };
      } catch (error: any) {
        console.error("[BugReports] Error updating bug report:", error);
        showToast.error(error.message || "Failed to update bug report");
        return {
          success: false,
          error: error.message,
        };
      }
    },
    [fetchBugReports]
  );

  /**
   * Delete a bug report
   */
  const deleteBugReport = useCallback(
    async (id: string, silent = false): Promise<BugReportOperationResult> => {
      try {
        const response = await fetch(`/api/bug-reports?id=${id}`, {
          method: "DELETE",
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to delete bug report");
        }

        // Refresh bug reports
        await fetchBugReports(false);

        if (!silent) {
          showToast.success("Bug report deleted successfully!");
        }

        return { success: true };
      } catch (error: any) {
        console.error("[BugReports] Error deleting bug report:", error);
        if (!silent) {
          showToast.error(error.message || "Failed to delete bug report");
        }
        return {
          success: false,
          error: error.message,
        };
      }
    },
    [fetchBugReports]
  );

  /**
   * Add an admin note to a bug report
   */
  const addAdminNote = useCallback(
    async (data: AddAdminNoteDTO): Promise<BugReportOperationResult> => {
      try {
        const response = await fetch("/api/bug-reports/admin-notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to add admin note");
        }

        // Refresh bug reports
        await fetchBugReports(false);

        showToast.success("Admin note added successfully!");

        return { success: true };
      } catch (error: any) {
        console.error("[BugReports] Error adding admin note:", error);
        showToast.error(error.message || "Failed to add admin note");
        return {
          success: false,
          error: error.message,
        };
      }
    },
    [fetchBugReports]
  );

  /**
   * Get bug report by ID
   */
  const getBugReportById = useCallback(
    (id: string): BugReport | undefined => {
      return bugReports.find((report) => report.id === id);
    },
    [bugReports]
  );

  /**
   * Get count of new bug reports
   */
  const getNewBugReportsCount = useCallback((): number => {
    return bugReports.filter((report) => report.status === "new").length;
  }, [bugReports]);

  /**
   * Get count of critical bug reports
   */
  const getCriticalBugReportsCount = useCallback((): number => {
    return bugReports.filter(
      (report) => report.severity === "critical" && report.status !== "resolved"
    ).length;
  }, [bugReports]);

  /**
   * Get bug reports by severity
   */
  const getBugReportsBySeverity = useCallback(
    (severity: BugSeverity): BugReport[] => {
      return bugReports.filter((report) => report.severity === severity);
    },
    [bugReports]
  );

  /**
   * Get bug reports by status
   */
  const getBugReportsByStatus = useCallback(
    (status: BugStatus): BugReport[] => {
      return bugReports.filter((report) => report.status === status);
    },
    [bugReports]
  );

  /**
   * Refresh bug reports manually
   */
  const refreshBugReports = useCallback(async () => {
    await fetchBugReports(true);
  }, [fetchBugReports]);

  return (
    <BugReportContext.Provider
      value={{
        bugReports,
        loading,
        error,
        createBugReport,
        updateBugReport,
        deleteBugReport,
        addAdminNote,
        getBugReportById,
        getNewBugReportsCount,
        getCriticalBugReportsCount,
        getBugReportsBySeverity,
        getBugReportsByStatus,
        refreshBugReports,
      }}
    >
      {children}
    </BugReportContext.Provider>
  );
}

/**
 * Hook to use bug report context
 */
export function useBugReports() {
  const context = useContext(BugReportContext);
  if (context === undefined) {
    throw new Error("useBugReports must be used within a BugReportProvider");
  }
  return context;
}
