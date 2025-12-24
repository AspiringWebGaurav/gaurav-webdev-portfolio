"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { showToast } from "@/lib/toast";
import smartPolling from "@/lib/smartPolling";
import {
  ContactSubmission,
  CreateContactSubmissionDTO,
  UpdateContactSubmissionDTO,
  ReplyToSubmissionDTO,
  RestoreContactSubmissionDTO,
  ContactSubmissionOperationResult,
} from "@/types/contactSubmission";

interface ContactSubmissionContextType {
  submissions: ContactSubmission[];
  loading: boolean;
  error: string | null;
  createSubmission: (
    data: CreateContactSubmissionDTO
  ) => Promise<ContactSubmissionOperationResult>;
  restoreSubmission: (
    data: RestoreContactSubmissionDTO
  ) => Promise<ContactSubmissionOperationResult>;
  updateSubmission: (
    data: UpdateContactSubmissionDTO
  ) => Promise<ContactSubmissionOperationResult>;
  deleteSubmission: (id: string, silent?: boolean) => Promise<ContactSubmissionOperationResult>;
  markAsReplied: (
    id: string,
    repliedBy: string
  ) => Promise<ContactSubmissionOperationResult>;
  markAsRead: (id: string) => Promise<ContactSubmissionOperationResult>;
  getNewSubmissionsCount: () => number;
  getUnreadSubmissionsCount: () => number;
  refreshSubmissions: () => Promise<void>;
}

const ContactSubmissionContext = createContext<
  ContactSubmissionContextType | undefined
>(undefined);

export function ContactSubmissionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previousNewCountRef = useRef<number>(0);

  /**
   * Fetch all contact submissions
   */
  const fetchSubmissions = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      const response = await fetch("/api/contact-submissions");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch contact submissions");
      }

      // Convert date strings back to Date objects
      const submissions = data.submissions.map((s: any) => ({
        ...s,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
        repliedAt: s.repliedAt ? new Date(s.repliedAt) : undefined,
      }));

      // Check for new submissions (compare with previous state)
      const previousNew = previousNewCountRef.current;
      const currentNew = submissions.filter((s: ContactSubmission) => s.status === "new").length;
      
      setSubmissions(submissions);
      
      // Update ref for next comparison
      previousNewCountRef.current = currentNew;
      
      // Log for debugging with change detection
      console.log('[ContactSubmissions] 📧 Polling Update:', {
        total: submissions.length,
        newCount: currentNew,
        previousNewCount: previousNew,
        changed: currentNew !== previousNew,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to fetch contact submissions";
      setError(errorMessage);
      console.error("Error fetching contact submissions:", err);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  /**
   * Create a new contact submission
   */
  const createSubmission = async (
    data: CreateContactSubmissionDTO
  ): Promise<ContactSubmissionOperationResult> => {
    try {
      const response = await fetch("/api/contact-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return {
          success: false,
          error: result.error || "Failed to submit contact form",
          validationErrors: result.validationErrors,
        };
      }

      // Convert dates
      const submission = {
        ...result.submission,
        createdAt: new Date(result.submission.createdAt),
        updatedAt: new Date(result.submission.updatedAt),
      };

      // Add to state
      setSubmissions((prev) => [submission, ...prev]);

      return { success: true, data: submission };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to submit contact form";
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Restore a contact submission from recycle bin with all original data
   * This preserves the original status (read/unread), timestamps, and metadata
   */
  const restoreSubmission = async (
    data: RestoreContactSubmissionDTO
  ): Promise<ContactSubmissionOperationResult> => {
    try {
      const response = await fetch("/api/contact-submissions/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        showToast.error(result.error || "Failed to restore contact submission", "Restore Failed");
        return {
          success: false,
          error: result.error || "Failed to restore contact submission",
        };
      }

      // Convert dates
      const submission = {
        ...result.submission,
        createdAt: new Date(result.submission.createdAt),
        updatedAt: new Date(result.submission.updatedAt),
        repliedAt: result.submission.repliedAt
          ? new Date(result.submission.repliedAt)
          : undefined,
      };

      // Add to state
      setSubmissions((prev) => [submission, ...prev]);

      showToast.success("Contact submission restored with original status preserved", "Restored Successfully");

      return { success: true, data: submission };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to restore contact submission";
      showToast.error(errorMessage, "Restore Error");
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Update a contact submission
   */
  const updateSubmission = async (
    data: UpdateContactSubmissionDTO
  ): Promise<ContactSubmissionOperationResult> => {
    try {
      const response = await fetch("/api/contact-submissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        showToast.error(result.error || "Failed to update submission", "Update Failed");
        return { success: false, error: result.error };
      }

      // Convert dates
      const updated = {
        ...result.submission,
        createdAt: new Date(result.submission.createdAt),
        updatedAt: new Date(result.submission.updatedAt),
        repliedAt: result.submission.repliedAt
          ? new Date(result.submission.repliedAt)
          : undefined,
      };

      // Update state
      setSubmissions((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      );

      showToast.success("Submission updated successfully", "Updated Successfully");
      return { success: true, data: updated };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update submission";
      showToast.error("errorMessage", "Update Error");
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Delete a contact submission
   */
  const deleteSubmission = async (
    id: string,
    silent: boolean = false
  ): Promise<ContactSubmissionOperationResult> => {
    try {
      const response = await fetch(`/api/contact-submissions?id=${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        if (!silent) {
          showToast.error(result.error || "Failed to delete submission", "Delete Failed");
        }
        return { success: false, error: result.error };
      }

      // Remove from state
      setSubmissions((prev) => prev.filter((s) => s.id !== id));

      if (!silent) {
        showToast.success("Submission deleted successfully", "Deleted Successfully");
      }
      return { success: true };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete submission";
      if (!silent) {
        showToast.error("errorMessage", "Delete Error");
      }
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Mark submission as replied (IMMUTABLE - cannot be undone)
   */
  const markAsReplied = async (
    id: string,
    repliedBy: string
  ): Promise<ContactSubmissionOperationResult> => {
    try {
      const response = await fetch("/api/contact-submissions/mark-replied", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, repliedBy }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        showToast.error(result.error || "Failed to mark as replied", "Mark Replied Failed");
        return { success: false, error: result.error };
      }

      // Convert dates
      const updated = {
        ...result.submission,
        createdAt: new Date(result.submission.createdAt),
        updatedAt: new Date(result.submission.updatedAt),
        repliedAt: new Date(result.submission.repliedAt),
      };

      // Update state
      setSubmissions((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      );

      showToast.success("Submission permanently marked as replied", "Marked as Replied");
      return { success: true, data: updated };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to mark as replied";
      showToast.error("errorMessage", "Mark Replied Error");
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Reply to a contact submission (DEPRECATED - use markAsReplied instead)
   */
  const replyToSubmission = async (
    data: ReplyToSubmissionDTO
  ): Promise<ContactSubmissionOperationResult> => {
    // This now just calls markAsReplied
    return markAsReplied(data.id, data.repliedBy);
  };

  /**
   * Mark submission as read
   */
  const markAsRead = async (
    id: string
  ): Promise<ContactSubmissionOperationResult> => {
    try {
      const response = await fetch("/api/contact-submissions/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        showToast.error(result.error || "Failed to mark as read", "Mark Read Failed");
        return { success: false, error: result.error };
      }

      // Convert dates
      const updated = {
        ...result.submission,
        createdAt: new Date(result.submission.createdAt),
        updatedAt: new Date(result.submission.updatedAt),
        repliedAt: result.submission.repliedAt
          ? new Date(result.submission.repliedAt)
          : undefined,
      };

      // Update state
      setSubmissions((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      );

      showToast.success("Submission marked as read", "Marked as Read");
      return { success: true, data: updated };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to mark as read";
      showToast.error("errorMessage", "Mark Read Error");
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Get count of new submissions
   */
  const getNewSubmissionsCount = () => {
    return submissions.filter((s) => s.status === "new").length;
  };

  /**
   * Get count of unread submissions
   */
  const getUnreadSubmissionsCount = () => {
    return submissions.filter((s) => s.status === "new" || s.status === "read")
      .length;
  };

  /**
   * Refresh submissions
   */
  const refreshSubmissions = async () => {
    await fetchSubmissions();
  };

  // Fetch submissions on mount (admin only)
  useEffect(() => {
    // Only fetch if we're in admin area
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      fetchSubmissions();
    }
  }, [fetchSubmissions]);

  // Setup smart polling (ONLY runs in admin routes)
  useEffect(() => {
    // Skip polling on non-admin pages to save API calls
    if (typeof window === 'undefined' || !window.location.pathname.startsWith('/admin')) {
      return;
    }

    const pollerId = smartPolling.start(
      async () => {
        await fetchSubmissions(false); // Silent refresh
      },
      {
        intervals: {
          realtime: 10000,  // 10s when admin actively managing submissions
          active: 60000,    // 1min when admin on page but idle
          idle: 180000,     // 3min when admin away
          background: 0,    // Stop when tab hidden (80% savings!)
        },
        priority: 'high',
        tag: 'contact-submissions',
      }
    );

    return () => smartPolling.stop(pollerId);
  }, [fetchSubmissions]);

  const value: ContactSubmissionContextType = {
    submissions,
    loading,
    error,
    createSubmission,
    restoreSubmission,
    updateSubmission,
    deleteSubmission,
    markAsReplied,
    markAsRead,
    getNewSubmissionsCount,
    getUnreadSubmissionsCount,
    refreshSubmissions,
  };

  return (
    <ContactSubmissionContext.Provider value={value}>
      {children}
    </ContactSubmissionContext.Provider>
  );
}

export function useContactSubmissions() {
  const context = useContext(ContactSubmissionContext);
  if (context === undefined) {
    throw new Error(
      "useContactSubmissions must be used within a ContactSubmissionProvider"
    );
  }
  return context;
}
