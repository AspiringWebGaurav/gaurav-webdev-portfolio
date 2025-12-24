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
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

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

  // Retry configuration constants
  const RETRY_CONFIG = {
    MAX_RETRIES: 3,
    BASE_DELAY: 1000, // 1 second
    MAX_DELAY: 10000, // 10 seconds
    TIMEOUT: 15000, // 15 seconds
  };

  /**
   * Retry helper with exponential backoff
   */
  const retryWithBackoff = useCallback(async <T,>(
    fn: () => Promise<T>,
    options: {
      maxRetries?: number;
      baseDelay?: number;
      shouldRetry?: (error: any) => boolean;
      onRetry?: (attempt: number, error: any) => void;
    } = {}
  ): Promise<T> => {
    const maxRetries = options.maxRetries ?? RETRY_CONFIG.MAX_RETRIES;
    const baseDelay = options.baseDelay ?? RETRY_CONFIG.BASE_DELAY;
    const shouldRetry = options.shouldRetry ?? ((error: any) => {
      // Retry on network errors, 5xx errors, and timeouts
      return (
        error instanceof TypeError ||
        error?.name === 'TimeoutError' ||
        error?.status >= 500
      );
    });

    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries && shouldRetry(error)) {
          const delay = Math.min(
            baseDelay * Math.pow(2, attempt),
            RETRY_CONFIG.MAX_DELAY
          );
          
          options.onRetry?.(attempt + 1, error);
          console.log(`🔄 Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          break;
        }
      }
    }
    
    throw lastError;
  }, []);

  /**
   * Get auth token for API requests
   */
  const getAuthToken = useCallback(async (): Promise<string | null> => {
    try {
      const user = auth.currentUser;
      console.log('🔑 getAuthToken called. User:', user?.email || 'Not logged in');
      
      if (!user) {
        console.log('❌ No user found');
        return null;
      }
      
      const token = await user.getIdToken();
      console.log('✅ Token obtained, length:', token.length);
      return token;
    } catch (err) {
      console.error("❌ Failed to get auth token:", err);
      return null;
    }
  }, []);

  /**
   * Fetch visitor profiles with filters and pagination
   * Includes automatic retry logic for production resilience
   */
  const fetchVisitors = useCallback(
    async (params?: VisitorListParams, retryCount = 0) => {
      const MAX_RETRIES = 3;
      const RETRY_DELAY = 1000; // 1 second base delay
      
      console.log('📊 fetchVisitors called with params:', params, 'retry:', retryCount);
      
      // Only in admin panel
      const isAdminPanel = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
      console.log('📍 Location check - isAdminPanel:', isAdminPanel, 'pathname:', window?.location?.pathname);
      
      if (!isAdminPanel) {
        console.log('❌ Not in admin panel, skipping fetch');
        return;
      }

      // Get auth token with retry
      let token: string | null = null;
      try {
        token = await getAuthToken();
      } catch (err) {
        console.error('❌ Failed to get auth token:', err);
        if (retryCount < MAX_RETRIES) {
          console.log(`🔄 Retrying auth token fetch (${retryCount + 1}/${MAX_RETRIES})...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
          return fetchVisitors(params, retryCount + 1);
        }
        return;
      }
      
      if (!token) {
        console.log('❌ No auth token available, cannot fetch');
        if (retryCount < MAX_RETRIES) {
          console.log(`🔄 Retrying due to null token (${retryCount + 1}/${MAX_RETRIES})...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
          return fetchVisitors(params, retryCount + 1);
        }
        return;
      }
      
      console.log('✅ Auth token obtained, proceeding with fetch');
      
      if (!visitors || visitors.length === 0) {
        console.log('🔄 Setting loading state (no existing data)');
        setLoading(true);
      }
      setError(null);

      const queryParams = { ...filters, ...params };
      console.log('🔍 Query params:', queryParams);

      try {
        const searchParams = new URLSearchParams();
        Object.entries(queryParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "all") {
            searchParams.append(key, String(value));
          }
        });

        const apiUrl = `/api/visitor-analytics/visitors?${searchParams}`;
        console.log('🌐 Fetching from:', apiUrl);

        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          signal: AbortSignal.timeout(15000), // 15s timeout
        });

        console.log('📡 Response status:', response.status, response.statusText);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('❌ API error response:', errorData);
          
          // Retry on 5xx errors or network issues
          if (response.status >= 500 && retryCount < MAX_RETRIES) {
            console.log(`🔄 Retrying due to server error (${retryCount + 1}/${MAX_RETRIES})...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, retryCount))); // Exponential backoff
            return fetchVisitors(params, retryCount + 1);
          }
          
          throw new Error(errorData.error || `Failed to fetch visitors (${response.status})`);
        }

        const apiResponse = await response.json();
        console.log('✅ Raw API response:', apiResponse);
        
        // Safety check - ensure we have a valid response object
        if (!apiResponse || typeof apiResponse !== 'object') {
          console.error('❌ Invalid API response:', apiResponse);
          
          // Retry on malformed response
          if (retryCount < MAX_RETRIES) {
            console.log(`🔄 Retrying due to invalid response (${retryCount + 1}/${MAX_RETRIES})...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
            return fetchVisitors(params, retryCount + 1);
          }
          
          throw new Error('Invalid response from server');
        }
        
        // Handle nested data structure: { success: true, data: { visitors, total, ... } }
        const responseData = apiResponse.data || apiResponse;
        const visitorsList = Array.isArray(responseData.visitors) ? responseData.visitors : [];
        const totalCount = typeof responseData.total === 'number' ? responseData.total : visitorsList.length;
        const hasMorePages = typeof responseData.hasMore === 'boolean' ? responseData.hasMore : false;
        const currentPageNum = typeof responseData.page === 'number' ? responseData.page : (params?.page ?? 1);
        
        console.log('📊 Parsed data:', {
          visitorsCount: visitorsList.length,
          total: totalCount,
          hasMore: hasMorePages,
          page: currentPageNum
        });

        setVisitors(visitorsList);
        setTotalVisitors(totalCount);
        setHasMore(hasMorePages);
        setCurrentPage(currentPageNum);
        
        // Update active count
        const activeCount = visitorsList.filter(v => v?.currentStatus === "active").length;
        setActiveVisitorCount(activeCount);
        console.log('📊 Active visitors:', activeCount);
        
        // Show informative message based on data state
        if (visitorsList.length === 0) {
          console.log('ℹ️ No visitors found matching current filters');
          console.log('📋 Current filters:', queryParams);
          console.log('💡 Tip: Visitors will appear here once someone visits your portfolio');
        } else {
          console.log(`✅ Successfully loaded ${visitorsList.length} visitors`);
        }
        
        // Clear retry flag on success
        if (retryCount > 0) {
          console.log(`✅ Fetch succeeded after ${retryCount} retries`);
        }
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        
        // Handle timeout errors
        if (err instanceof Error && err.name === 'TimeoutError') {
          console.error('⏱️ Request timeout');
          if (retryCount < MAX_RETRIES) {
            console.log(`🔄 Retrying due to timeout (${retryCount + 1}/${MAX_RETRIES})...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
            return fetchVisitors(params, retryCount + 1);
          }
        }
        
        // Handle network errors
        if (err instanceof TypeError && err.message.includes('fetch')) {
          console.error('🌐 Network error');
          if (retryCount < MAX_RETRIES) {
            console.log(`🔄 Retrying due to network error (${retryCount + 1}/${MAX_RETRIES})...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
            return fetchVisitors(params, retryCount + 1);
          }
        }
        
        setError(errorMessage);
        console.error("❌ Error fetching visitors:", err);
        
        // Only show toast on final failure
        if (retryCount >= MAX_RETRIES - 1 && (!visitors || visitors.length === 0)) {
          showToast.error(`${errorMessage} (after ${retryCount + 1} attempts)`);
        }
      } finally {
        setLoading(false);
        console.log('✅ Fetch complete');
      }
    },
    [getAuthToken, filters, visitors?.length ?? 0]
  );

  /**
   * Fetch detailed visitor data with retry logic
   */
  const fetchVisitorDetail = useCallback(
    async (id: string): Promise<VisitorDetailData | null> => {
      try {
        const token = await getAuthToken();
        if (!token) {
          console.warn('[VisitorAnalytics] No auth token, skipping detail fetch');
          return null;
        }

        console.log(`[VisitorAnalytics] Fetching detail for visitor: ${id}`);
        
        const result = await retryWithBackoff(
          async () => {
            const response = await fetch(`/api/visitor-analytics/visitors/${id}`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              signal: AbortSignal.timeout(RETRY_CONFIG.TIMEOUT),
            });

            console.log(`[VisitorAnalytics] Detail response status: ${response.status}`);

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
              const error: any = new Error(errorData.error || "Failed to fetch visitor detail");
              error.status = response.status;
              error.details = errorData.details;
              throw error;
            }

            const responseData: VisitorDetailResponse = await response.json();
            
            if (!responseData || !responseData.data) {
              throw new Error('Invalid response structure');
            }
            
            return responseData.data;
          },
          {
            onRetry: (attempt, error) => {
              console.log(`[VisitorAnalytics] Retrying visitor detail fetch (${attempt}/${RETRY_CONFIG.MAX_RETRIES}):`, error?.message);
            }
          }
        );
        
        console.log(`[VisitorAnalytics] ✅ Successfully fetched detail for visitor ${id}`);
        return result;
        
      } catch (err: any) {
        const errorMessage = err?.message || "Unknown error occurred";
        console.error("[VisitorAnalytics] ❌ Error fetching visitor detail after retries:", err);
        
        // Only show toast for non-404 errors (404 means visitor not found, which is expected)
        if (err?.status !== 404) {
          showToast.error(`Failed to load visitor details: ${errorMessage}`);
        }
        
        return null;
      }
    },
    [getAuthToken, retryWithBackoff]
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
        if (data.aggregates?.activeVisitors !== undefined) {
          setActiveVisitorCount(data.aggregates.activeVisitors);
        }
        
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
        if (data.aggregates?.activeVisitors !== undefined) {
          setActiveVisitorCount(data.aggregates.activeVisitors);
        }
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

  // Network status monitoring with auto-reconnect
  const handleNetworkReconnect = useCallback(() => {
    console.log('🔄 Network reconnected, refreshing data...');
    if (auth.currentUser) {
      fetchVisitors();
      fetchAggregatesWithTracking();
    }
  }, [fetchVisitors, fetchAggregatesWithTracking]);

  const networkStatus = useNetworkStatus(handleNetworkReconnect);

  // Auth state listener - fetch data when user is authenticated
  useEffect(() => {
    const isAdminPanel = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
    
    if (!isAdminPanel) return;

    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log('✅ User authenticated, fetching data...');
        // User is logged in, fetch data
        await fetchVisitors();
        await fetchAggregatesWithTracking();
      } else {
        console.log('❌ No user authenticated');
      }
    });

    return () => unsubscribe();
  }, [fetchVisitors, fetchAggregatesWithTracking]);

  // Refetch when filters change (only if we already have data)
  useEffect(() => {
    const isAdminPanel = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
    
    if (isAdminPanel && auth.currentUser && (visitors?.length ?? 0) > 0) {
      fetchVisitors(filters);
    }
  }, [filters, fetchVisitors, visitors?.length]);

  // Smart polling for analytics updates (only when admin viewing analytics page)
  useEffect(() => {
    const isAdminPanel = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
    if (!isAdminPanel) return;

    const pollerId = smartPolling.start(
      async () => {
        if (auth.currentUser) {
          await fetchVisitors();
          await fetchAggregatesWithTracking();
        }
      },
      {
        intervals: {
          realtime: 30000,  // 30s when admin actively viewing analytics
          active: 120000,   // 2min when admin on page but idle
          idle: 300000,     // 5min when admin away from analytics
          background: 0,    // Stop when tab hidden (85% savings!)
        },
        priority: 'high',
        tag: 'visitor-analytics',
      }
    );

    return () => smartPolling.stop(pollerId);
  }, [fetchVisitors, fetchAggregatesWithTracking]);

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
