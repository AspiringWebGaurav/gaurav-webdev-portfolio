/**
 * Visitor Analytics Context
 * Manages visitor analytics state and API interactions for admin panel
 */

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { showToast } from "@/lib/toast";
import {
  VisitorProfile,
  VisitorDetailData,
  AnalyticsAggregates,
  VisitorListParams,
  VisitorListResponse,
  VisitorDetailResponse,
  AggregatesResponse,
  AnalyticsOperationResult,
  ACTIVE_VISITOR_THRESHOLD_MINUTES,
} from "@/types/visitorAnalytics";
import { auth } from "@/lib/firebase";
import { useRecycleBin } from "./RecycleBinContext";
import smartPolling from "@/lib/smartPolling";

interface VisitorAnalyticsContextType {
  visitors: VisitorProfile[];
  aggregates: AnalyticsAggregates | null;
  loading: boolean;
  error: string | null;
  totalVisitors: number;
  hasMore: boolean;
  currentPage: number;
  activeVisitorCount: number;
  
  // Data fetching
  fetchVisitors: (params?: VisitorListParams) => Promise<void>;
  fetchVisitorDetail: (id: string) => Promise<VisitorDetailData | null>;
  fetchAggregates: (timeRange?: string) => Promise<void>;
  refreshActiveCount: () => Promise<void>;
  
  // Filters and pagination
  setFilters: (filters: Partial<VisitorListParams>) => void;
  setPage: (page: number) => void;
  resetFilters: () => void;
  
  // Future ban/unban (placeholder)
  banVisitor: (id: string, reason: string) => Promise<AnalyticsOperationResult>;
  unbanVisitor: (id: string) => Promise<AnalyticsOperationResult>;
  
  // Delete operations
  deleteVisitor: (id: string) => Promise<AnalyticsOperationResult>;
  batchDeleteVisitors: (ids: string[]) => Promise<AnalyticsOperationResult>;
  deleteAllData: () => Promise<AnalyticsOperationResult>;
}

const VisitorAnalyticsContext = createContext<VisitorAnalyticsContextType | undefined>(
  undefined
);

const DEFAULT_FILTERS: VisitorListParams = {
  page: 1,
  limit: 50,
  sortBy: "lastVisit",
  sortOrder: "desc",
  status: "all",
  deviceClass: "all",
  banned: "all",
};

// 🔥 GLOBAL CACHE - Prevents duplicate API calls across component re-renders
const aggregatesCache = new Map<string, { data: AnalyticsAggregates; timestamp: number }>();
const CACHE_TTL = 60000; // 60 seconds
const pendingRequests = new Map<string, Promise<any>>();

export function VisitorAnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [visitors, setVisitors] = useState<VisitorProfile[]>([]);
  const [aggregates, setAggregates] = useState<AnalyticsAggregates | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeVisitorCount, setActiveVisitorCount] = useState(0);
  const [filters, setFiltersState] = useState<VisitorListParams>(DEFAULT_FILTERS);
  
  // Get recycle bin context for delete operations
  const { moveToRecycleBin } = useRecycleBin();

  /**
   * Get auth token for API requests
   */
  const getAuthToken = useCallback(async (): Promise<string | null> => {
    try {
      const user = auth.currentUser;
      if (!user) return null;
      const token = await user.getIdToken();
      return token;
    } catch (err) {
      console.error("Failed to get auth token:", err);
      return null;
    }
  }, []);

  /**
   * Fetch visitor profiles with filters and pagination
   */
  const fetchVisitors = useCallback(
    async (params?: VisitorListParams) => {
      // Only show loading spinner if we don't have any data yet
      // This prevents UI flashing during background refreshes
      if (visitors.length === 0) {
        setLoading(true);
      }
      setError(null);

      const queryParams = { ...filters, ...params };

      try {
        const token = await getAuthToken();
        if (!token) {
          // Silently fail if not authenticated (not in admin panel)
          setLoading(false);
          return;
        }

        const searchParams = new URLSearchParams();
        Object.entries(queryParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "all") {
            searchParams.append(key, String(value));
          }
        });

        const response = await fetch(`/api/visitor-analytics/visitors?${searchParams}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch visitors");
        }

        const data: VisitorListResponse = await response.json();

        setVisitors(data.visitors);
        setTotalVisitors(data.total);
        setHasMore(data.hasMore);
        setCurrentPage(data.page);
        
        // Update active count from current visitors
        const activeCount = data.visitors.filter(v => v.currentStatus === "active").length;
        setActiveVisitorCount(activeCount);
        
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        console.error("Error fetching visitors:", err);
        // Only show toast on initial load errors, not on background refresh failures
        if (visitors.length === 0) {
          showToast.error(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    },
    [filters, getAuthToken, visitors.length]
  );

  /**
   * Fetch detailed visitor data
   */
  const fetchVisitorDetail = useCallback(
    async (id: string): Promise<VisitorDetailData | null> => {
      try {
        const token = await getAuthToken();
        if (!token) {
          // Silently return null if not authenticated
          return null;
        }

        console.log(`[VisitorAnalytics] Fetching detail for visitor: ${id}`);
        
        const response = await fetch(`/api/visitor-analytics/visitors/${id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        console.log(`[VisitorAnalytics] Detail response status: ${response.status}`);

        if (!response.ok) {
          const errorData = await response.json();
          const errorMsg = errorData.error || "Failed to fetch visitor detail";
          console.error("[VisitorAnalytics] Visitor detail fetch error:", {
            status: response.status,
            error: errorMsg,
            details: errorData.details,
            visitorId: id,
          });
          showToast.error(`${errorMsg}${errorData.details ? `: ${errorData.details}` : ''}`);
          return null;
        }

        const result: VisitorDetailResponse = await response.json();
        console.log(`[VisitorAnalytics] Successfully fetched detail for visitor ${id}`);
        return result.data;
        
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        console.error("Error fetching visitor detail:", err);
        showToast.error(errorMessage);
        return null;
      }
    },
    [getAuthToken]
  );

  /**
   * Fetch analytics aggregates (WITH SMART CACHING)
   */
  const fetchAggregates = useCallback(
    async (timeRange: string = "30d") => {
      const cacheKey = `aggregates_${timeRange}`;
      
      // Check cache first
      const cached = aggregatesCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setAggregates(cached.data);
        setLoading(false);
        return;
      }
      
      // Check if request already in flight
      if (pendingRequests.has(cacheKey)) {
        await pendingRequests.get(cacheKey);
        return;
      }
      
      // Only show loading if we don't have aggregates yet
      if (!aggregates) {
        setLoading(true);
      }
      setError(null);
      
      try {
        const token = await getAuthToken();
        if (!token) {
          // Silently fail if not authenticated
          setLoading(false);
          return;
        }

        const response = await fetch(
          `/api/visitor-analytics/aggregates?timeRange=${timeRange}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch aggregates");
        }

        const data: AggregatesResponse = await response.json();
        
        // Store in cache
        aggregatesCache.set(cacheKey, {
          data: data.aggregates,
          timestamp: Date.now()
        });
        
        setAggregates(data.aggregates);
        setActiveVisitorCount(data.aggregates.activeVisitors);
        
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        console.error("Error fetching aggregates:", err);
        // Don't show toast for silent background refreshes
      } finally {
        setLoading(false);
        // ✅ REMOVE FROM PENDING REQUESTS
        pendingRequests.delete(cacheKey);
      }
    },
    [getAuthToken, aggregates]
  );
  
  // Wrap fetchAggregates to track pending requests
  const fetchAggregatesWithTracking = useCallback(
    async (timeRange: string = "30d") => {
      const cacheKey = `aggregates_${timeRange}`;
      const promise = fetchAggregates(timeRange);
      pendingRequests.set(cacheKey, promise);
      await promise;
    },
    [fetchAggregates]
  );

  /**
   * Refresh active visitor count (for badge)
   */
  const refreshActiveCount = useCallback(async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch(`/api/visitor-analytics/aggregates?timeRange=24h`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data: AggregatesResponse = await response.json();
        setActiveVisitorCount(data.aggregates.activeVisitors);
      }
    } catch (err) {
      console.error("Error refreshing active count:", err);
    }
  }, [getAuthToken, activeVisitorCount]);

  /**
   * Update filters
   */
  const setFilters = useCallback((newFilters: Partial<VisitorListParams>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  /**
   * Set page
   */
  const setPage = useCallback((page: number) => {
    setFiltersState((prev) => ({ ...prev, page }));
  }, []);

  /**
   * Reset filters to default
   */
  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  /**
   * Ban visitor (placeholder - will be implemented later)
   */
  const banVisitor = useCallback(
    async (id: string, reason: string): Promise<AnalyticsOperationResult> => {
      // TODO: Implement ban endpoint
      console.warn("Ban functionality not yet implemented");
      showToast.info("Ban/unban functionality will be available in a future update", "Info");
      return {
        success: false,
        error: "Ban functionality not yet implemented",
      };
    },
    []
  );

  /**
   * Unban visitor (placeholder - will be implemented later)
   */
  const unbanVisitor = useCallback(
    async (id: string): Promise<AnalyticsOperationResult> => {
      // TODO: Implement unban endpoint
      console.warn("Unban functionality not yet implemented");
      showToast.info("Ban/unban functionality will be available in a future update", "Info");
      return {
        success: false,
        error: "Unban functionality not yet implemented",
      };
    },
    []
  );

  /**
   * Delete a single visitor (moves to recycle bin first)
   */
  const deleteVisitor = useCallback(
    async (id: string): Promise<AnalyticsOperationResult> => {
      setLoading(true);
      setError(null);

      try {
        // Find the visitor to delete
        const visitor = visitors.find((v) => v.id === id);
        if (!visitor) {
          throw new Error("Visitor not found");
        }

        // Move to recycle bin first
        await moveToRecycleBin("visitor-analytics", visitor, id);

        // Then delete from Firestore via API
        const token = await getAuthToken();
        if (!token) {
          throw new Error("Authentication required");
        }

        const response = await fetch(`/api/visitor-analytics/visitors/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to delete visitor");
        }

        // Remove from local state
        setVisitors((prev) => prev.filter((v) => v.id !== id));
        setTotalVisitors((prev) => Math.max(0, prev - 1));

        // Note: Success toast is shown by moveToRecycleBin
        return { success: true };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        console.error("Error deleting visitor:", err);
        showToast.error(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [visitors, moveToRecycleBin, getAuthToken]
  );

  /**
   * Batch delete multiple visitors (moves to recycle bin first)
   */
  const batchDeleteVisitors = useCallback(
    async (ids: string[]): Promise<AnalyticsOperationResult> => {
      if (ids.length === 0) {
        return { success: false, error: "No visitors selected" };
      }

      setLoading(true);
      setError(null);

      try {
        const token = await getAuthToken();
        if (!token) {
          throw new Error("Authentication required");
        }

        // Move all visitors to recycle bin first (silently)
        const visitorsToDelete = visitors.filter((v) => ids.includes(v.id));
        for (const visitor of visitorsToDelete) {
          await moveToRecycleBin("visitor-analytics", visitor, visitor.id, true);
        }

        // Then batch delete from Firestore via API
        const response = await fetch(`/api/visitor-analytics/visitors/batch-delete`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ids }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to batch delete visitors");
        }

        const result = await response.json();

        // Remove from local state
        setVisitors((prev) => prev.filter((v) => !ids.includes(v.id)));
        setTotalVisitors((prev) => Math.max(0, prev - ids.length));

        showToast.success(`Moved ${ids.length} visitor${ids.length > 1 ? 's' : ''} to recycle bin`);
        
        return { success: true, data: result };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        console.error("Error batch deleting visitors:", err);
        showToast.error(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [visitors, moveToRecycleBin, getAuthToken]
  );

  /**
   * Delete all visitor analytics data
   */
  const deleteAllData = useCallback(async (): Promise<AnalyticsOperationResult> => {
    try {
      const token = await getAuthToken();
      if (!token) {
        return {
          success: false,
          error: "Authentication required",
        };
      }

      const response = await fetch(`/api/visitor-analytics/delete-all`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete data");
      }

      const result = await response.json();
      
      // Clear local state
      setVisitors([]);
      setAggregates({
        totalUniqueVisitors: 0,
        activeVisitors: 0,
        newVisitors: 0,
        returningVisitors: 0,
        totalSessions: 0,
        totalPageViews: 0,
        totalInteractions: 0,
        averageSessionDuration: 0,
        totalResumeViews: 0,
        totalResumeDownloads: 0,
        visitorsWhoDownloaded: 0,
        topRegions: [],
        topDevices: [],
        topBrowsers: [],
      });
      setActiveVisitorCount(0);
      setTotalVisitors(0);
      
      showToast.success(`Deleted ${result.deleted.total} records successfully`);
      
      return {
        success: true,
        data: result.deleted,
      };
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      console.error("Error deleting all data:", err);
      showToast.error(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }, [getAuthToken]);

  // Setup smart polling for visitor analytics (ONLY in admin panel)
  useEffect(() => {
    // ⚠️ CRITICAL: Only run in admin panel to prevent API spam on portfolio
    const isAdminPanel = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
    
    if (!isAdminPanel) {
      return;
    }

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        // Initial fetch
        refreshActiveCount();
        fetchAggregatesWithTracking();
        
        // Register smart polling for active count (lightweight check)
        smartPolling.register(
          'visitor-active-count',
          refreshActiveCount,
          {
            intervals: {
              realtime: 10000,  // 10s when viewing analytics
              active: 30000,    // 30s when admin panel open
              idle: 60000,      // 60s when idle
              background: 120000, // 120s when tab hidden
            },
            tag: 'VisitorActiveCount (Admin)',
            stopOnHidden: false,
          }
        );
      } else {
        smartPolling.unregister('visitor-active-count');
      }
    });

    return () => {
      unsubscribeAuth();
      smartPolling.unregister('visitor-active-count');
    };
  }, [refreshActiveCount, fetchAggregatesWithTracking]);

  // Fetch data when filters change (only if authenticated AND in admin panel)
  useEffect(() => {
    const isAdminPanel = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
    const user = auth.currentUser;
    if (user && isAdminPanel) {
      fetchVisitors(filters);
    }
  }, [filters, fetchVisitors]);

  const value: VisitorAnalyticsContextType = {
    visitors,
    aggregates,
    loading,
    error,
    totalVisitors,
    hasMore,
    currentPage,
    activeVisitorCount,
    fetchVisitors,
    fetchVisitorDetail,
    fetchAggregates: fetchAggregatesWithTracking,
    refreshActiveCount,
    setFilters,
    setPage,
    resetFilters,
    banVisitor,
    unbanVisitor,
    deleteVisitor,
    batchDeleteVisitors,
    deleteAllData,
  };

  return (
    <VisitorAnalyticsContext.Provider value={value}>
      {children}
    </VisitorAnalyticsContext.Provider>
  );
}

export function useVisitorAnalytics() {
  const context = useContext(VisitorAnalyticsContext);
  if (context === undefined) {
    throw new Error(
      "useVisitorAnalytics must be used within a VisitorAnalyticsProvider"
    );
  }
  return context;
}
