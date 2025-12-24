/**
 * Ban Appeals Context - SIMPLIFIED
 * Manages ban appeals state and operations
 * No automatic recycle bin moves - appeals stay after review
 */

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { showToast } from "@/lib/toast";
import smartPolling from "@/lib/smartPolling";

import { useRecycleBin } from "./RecycleBinContext";
import {
  BanAppeal,
  CreateBanAppealDTO,
  ReviewBanAppealDTO,
  BanAppealOperationResult,
} from "@/types/banAppeal";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

interface BanAppealsContextType {
  appeals: BanAppeal[];
  loading: boolean;
  createAppeal: (data: CreateBanAppealDTO) => Promise<BanAppealOperationResult>;
  reviewAppeal: (data: ReviewBanAppealDTO) => Promise<BanAppealOperationResult>;
  deleteAppeal: (id: string) => Promise<BanAppealOperationResult>;
  refreshAppeals: () => Promise<void>;
  getPendingCount: () => number;
  getAppealsByStatus: (status: "pending" | "accepted" | "rejected") => BanAppeal[];
}

const BanAppealsContext = createContext<BanAppealsContextType | undefined>(
  undefined
);

export const useBanAppeals = () => {
  const context = useContext(BanAppealsContext);
  if (!context) {
    throw new Error("useBanAppeals must be used within BanAppealsProvider");
  }
  return context;
};

interface BanAppealsProviderProps {
  children: ReactNode;
}

export const BanAppealsProvider: React.FC<BanAppealsProviderProps> = ({
  children,
}) => {
  const { moveToRecycleBin } = useRecycleBin();
  const [appeals, setAppeals] = useState<BanAppeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  /**
   * Monitor auth state changes
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthReady(true);
      if (user) {
        console.log("[Ban Appeals Context] Auth ready - user logged in:", user.email);
      } else {
        console.log("[Ban Appeals Context] Auth ready - no user logged in");
      }
    });

    return () => unsubscribe();
  }, []);

  /**
   * Get auth token for API requests - waits for auth to be ready
   */
  const getAuthToken = useCallback(async (): Promise<string | null> => {
    try {
      // Wait for auth state to be determined
      if (!isAuthReady) {
        await new Promise<void>((resolve) => {
          const checkInterval = setInterval(() => {
            if (isAuthReady) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 100);
          
          // Timeout after 5 seconds
          setTimeout(() => {
            clearInterval(checkInterval);
            resolve();
          }, 5000);
        });
      }

      const user = auth.currentUser;
      
      if (!user) {
        showToast.error("Please log in to perform this action", "Authentication Required");
        return null;
      }
      
      return await user.getIdToken();
    } catch (error) {
      console.error("[Ban Appeals Context] Error getting auth token:", error);
      showToast.error("Failed to get authentication token", "Authentication Error");
      return null;
    }
  }, [isAuthReady]);

  /**
   * Load all ban appeals from Firebase
   */
  const loadAppeals = useCallback(async (showLoading = true) => {
    try {
      // Only show loading on initial fetch, not on background refreshes
      if (showLoading) {
        setLoading(true);
      }
      
      const response = await fetch("/api/ban-appeals");
      const result = await response.json();

      if (result.success) {
        // Convert date strings to Date objects
        const appealsData = (result.data || []).map((appeal: any) => ({
          ...appeal,
          createdAt: appeal.createdAt ? new Date(appeal.createdAt) : new Date(),
          updatedAt: appeal.updatedAt ? new Date(appeal.updatedAt) : new Date(),
          reviewedAt: appeal.reviewedAt ? new Date(appeal.reviewedAt) : undefined,
        }));

        setAppeals(appealsData);
        console.log(`[Ban Appeals Context] Loaded ${appealsData.length} appeals, ${appealsData.filter((a: any) => a.status === 'pending').length} pending`);
      } else {
        console.error("[Ban Appeals Context] Failed to load appeals:", result.error);
        showToast.error(result.error || "Failed to load ban appeals", "Load Failed");
      }
    } catch (error: any) {
      console.error("[Ban Appeals Context] Error loading appeals:", error);
      showToast.error("An unexpected error occurred while loading ban appeals", "Load Failed");
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  /**
   * Load appeals on mount and setup smart polling
   */
  useEffect(() => {
    // Fetch immediately on mount
    loadAppeals();

    // Smart polling - only poll when admin is viewing dashboard
    const pollerId = smartPolling.start(
      async () => {
        await loadAppeals(false); // Silent background refresh
      },
      {
        intervals: {
          realtime: 10000,  // 10s when admin actively managing appeals
          active: 60000,    // 1min when admin on page but idle
          idle: 180000,     // 3min when admin away from page
          background: 0,    // Stop when tab hidden (80% cost savings!)
        },
        priority: 'high',
        tag: 'ban-appeals',
      }
    );

    return () => smartPolling.stop(pollerId);
  }, [loadAppeals]);

  /**
   * Create a new ban appeal
   */
  const createAppeal = useCallback(
    async (data: CreateBanAppealDTO): Promise<BanAppealOperationResult> => {
      try {
        const response = await fetch("/api/ban-appeals", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.success) {
          // Convert dates
          const newAppeal = {
            ...result.data,
            createdAt: result.data.createdAt ? new Date(result.data.createdAt) : new Date(),
            updatedAt: result.data.updatedAt ? new Date(result.data.updatedAt) : new Date(),
          };

          setAppeals((prev) => [newAppeal, ...prev]);

          showToast.success("Your ban appeal has been submitted for review", "Appeal Submitted");

          return { success: true, data: newAppeal };
        }

        return {
          success: false,
          error: result.error || "Failed to create ban appeal",
          validationErrors: result.validationErrors,
        };
      } catch (error: any) {
        console.error("[Ban Appeals Context] Error creating appeal:", error);
        return {
          success: false,
          error: error.message || "An unexpected error occurred",
        };
      }
    },
    []
  );

  /**
   * Review a ban appeal (accept or reject)
   */
  const reviewAppeal = useCallback(
    async (data: ReviewBanAppealDTO): Promise<BanAppealOperationResult> => {
      try {
        const token = await getAuthToken();
        if (!token) {
          return { success: false, error: "Authentication required" };
        }

        const response = await fetch("/api/ban-appeals/review", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.success) {
          // Convert dates
          const updatedAppeal = {
            ...result.data,
            createdAt: result.data.createdAt ? new Date(result.data.createdAt) : new Date(),
            updatedAt: result.data.updatedAt ? new Date(result.data.updatedAt) : new Date(),
            reviewedAt: result.data.reviewedAt ? new Date(result.data.reviewedAt) : undefined,
          };

          // Update appeal in local state (stays in list with new status)
          setAppeals((prev) => 
            prev.map((appeal) => appeal.id === updatedAppeal.id ? updatedAppeal : appeal)
          );

          const actionText = data.action === "accept" ? "accepted" : "rejected";
          showToast.success(
            `Ban appeal has been ${actionText}${
              data.action === "accept" ? " and visitor unbanned" : ""
            }`,
            `Appeal ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`
          );

          return { success: true, data: updatedAppeal };
        }

        showToast.error(result.error || "Failed to review ban appeal", "Review Failed");

        return {
          success: false,
          error: result.error || "Failed to review ban appeal",
        };
      } catch (error: any) {
        console.error("[Ban Appeals Context] Error reviewing appeal:", error);
        showToast.error("An unexpected error occurred", "Review Failed");

        return {
          success: false,
          error: error.message || "An unexpected error occurred",
        };
      }
    },
    [ getAuthToken]
  );

  /**
   * Delete a ban appeal (moves to recycle bin)
   */
  const deleteAppeal = useCallback(
    async (id: string): Promise<BanAppealOperationResult> => {
      try {
        const appeal = appeals.find((a) => a.id === id);
        if (!appeal) {
          return { success: false, error: "Ban appeal not found" };
        }

        const token = await getAuthToken();
        if (!token) {
          return { success: false, error: "Authentication required" };
        }

        // Move to recycle bin first
        await moveToRecycleBin("banAppeal", appeal, id);

        // Then delete from Firebase
        const response = await fetch(`/api/ban-appeals?id=${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (result.success) {
          // Remove from local state
          setAppeals((prev) => prev.filter((a) => a.id !== id));

          // Note: Success toast is shown by moveToRecycleBin
          return { success: true };
        }

        return {
          success: false,
          error: result.error || "Failed to delete ban appeal",
        };
      } catch (error: any) {
        console.error("[Ban Appeals Context] Error deleting appeal:", error);
        return {
          success: false,
          error: error.message || "An unexpected error occurred",
        };
      }
    },
    [appeals, moveToRecycleBin, getAuthToken]
  );

  /**
   * Refresh appeals from server
   */
  const refreshAppeals = useCallback(async () => {
    await loadAppeals();
  }, [loadAppeals]);

  /**
   * Get count of pending appeals
   */
  const getPendingCount = useCallback((): number => {
    return appeals.filter((appeal) => appeal.status === "pending").length;
  }, [appeals]);

  /**
   * Get appeals by status
   */
  const getAppealsByStatus = useCallback(
    (status: "pending" | "accepted" | "rejected"): BanAppeal[] => {
      return appeals.filter((appeal) => appeal.status === status);
    },
    [appeals]
  );

  const value: BanAppealsContextType = {
    appeals,
    loading,
    createAppeal,
    reviewAppeal,
    deleteAppeal,
    refreshAppeals,
    getPendingCount,
    getAppealsByStatus,
  };

  return (
    <BanAppealsContext.Provider value={value}>
      {children}
    </BanAppealsContext.Provider>
  );
};
