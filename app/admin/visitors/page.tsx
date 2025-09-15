"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/utils/adminAuth";
import {
  showSuccessToast,
  showErrorToast,
  showAdminActionToast,
  showInfoToast,
} from "@/components/ToastSystem";
import { useVisitorData } from "@/hooks/useVisitorData";
import { useEnhancedLoading } from "@/hooks/useEnhancedLoading";
import { useSmartEmptyState } from "@/hooks/useSmartEmptyState";
import { useDebounce } from "@/hooks/usePerformanceOptimization";
import EnhancedBanModal from "@/components/admin/EnhancedBanModal";
import BanUnbanConfirmModal from "@/components/admin/BanUnbanConfirmModal";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";
import AdminNotesModal from "@/components/admin/AdminNotesModal";
import EditBanCategoryModal from "@/components/admin/EditBanCategoryModal";
import { ThemeProvider } from "@/components/admin/ThemeProvider";
import UnifiedNavbar from "@/components/admin/UnifiedNavbar";
import { VisitorTableSkeleton } from "@/components/admin/skeletons/VisitorTableSkeleton";
import { AnalyticsCardsSkeleton } from "@/components/admin/skeletons/AnalyticsCardsSkeleton";
import { EmptyState } from "@/components/admin/EmptyState";
import { formatTimeIST, formatDuration } from "@/utils/timeFormat";

interface Visitor {
  id: string;
  uuid: string;
  status: "active" | "banned";
  firstVisit: string;
  lastVisit: string;
  visitCount: number;
  os: string;
  browser: string;
  device: string;
  ipAddress: string;
  timezone: string;
  language: string;
  screenResolution: string;
  banReason?: string;
  banTimestamp?: string;
  unbanTimestamp?: string;
  policyReference?: string;
  banCategory?: string;
  isOnline?: boolean;
  lastSeen?: string;
  sessionStart?: string;
  sessionDuration?: number;
  location?: {
    city?: string;
    country?: string;
    countryCode?: string;
    flag?: string;
  };
  deviceInfo?: {
    type: "mobile" | "tablet" | "desktop";
    browser: string;
    os: string;
    icon?: string;
  };
  referralInfo?: {
    source: string;
    firstPage: string;
    referrer?: string;
  };
  adminNotes?: string;
}

interface VisitorStats {
  total: number;
  active: number;
  banned: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}

export default function VisitorsPage() {
  const router = useRouter();
  const { checkAuth } = useAdminAuth();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedVisitors, setSelectedVisitors] = useState<Set<string>>(new Set());
  const [visitorFilter, setVisitorFilter] = useState<"all" | "active" | "banned">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Enhanced loading states
  const {
    loadingStates,
    setLoadingState,
    shouldShowSkeleton,
    shouldShowSpinner,
    isAnyLoading
  } = useEnhancedLoading();

  // Robust visitor data with Firebase + API fallback
  const {
    visitors,
    visitorStats,
    isLoading: isDataLoading,
    isLiveSync,
    error: dataError,
    refresh: refreshVisitors,
    isUsingFallback
  } = useVisitorData();

  // Modals
  const [showBanModal, setShowBanModal] = useState(false);
  const [showBanUnbanModal, setShowBanUnbanModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [deleteConfig, setDeleteConfig] = useState<{
    type: "visitor";
    items: string[];
    title: string;
    message: string;
  } | null>(null);
  const [notesModalData, setNotesModalData] = useState<{
    uuid: string;
    currentNotes?: string;
  } | null>(null);
  const [banUnbanModalData, setBanUnbanModalData] = useState<{
    action: 'ban' | 'unban';
    visitor: {
      uuid: string;
      status: string;
      banReason?: string;
      policyReference?: string;
    };
  } | null>(null);
  const [editCategoryModalData, setEditCategoryModalData] = useState<{
    uuid: string;
    currentCategory?: string;
  } | null>(null);

  // Client-side filtering (much faster than API calls)
  const filteredVisitors = useMemo(() => {
    let filtered = visitors || [];
    
    // Apply status filter
    if (visitorFilter !== 'all') {
      filtered = filtered.filter(visitor => visitor.status === visitorFilter);
    }
    
    // Apply search filter
    const safeSearchQuery = searchQuery || '';
    if (safeSearchQuery.trim()) {
      const query = safeSearchQuery.toLowerCase();
      filtered = filtered.filter(visitor =>
        visitor.uuid?.toLowerCase().includes(query) ||
        visitor.ipAddress?.toLowerCase().includes(query) ||
        visitor.location?.city?.toLowerCase().includes(query) ||
        visitor.location?.country?.toLowerCase().includes(query) ||
        visitor.browser?.toLowerCase().includes(query) ||
        visitor.os?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [visitors, visitorFilter, searchQuery]);

  // Smart empty state logic
  const emptyState = useSmartEmptyState({
    data: filteredVisitors,
    isLoading: isDataLoading,
    isSearching: loadingStates.isSearching,
    isFiltering: loadingStates.isFiltering,
    searchQuery,
    activeFilters: { status: visitorFilter },
    error: dataError
  });

  useEffect(() => {
    verifyAuth();
  }, []);

  const verifyAuth = async () => {
    try {
      const admin = await checkAuth();
      if (admin) {
        setIsAuthenticated(true);
      } else {
        showErrorToast("Authentication required. Redirecting to login...");
        router.push("/admin/login");
      }
    } catch (error) {
      console.error("Auth verification failed:", error);
      showErrorToast("Authentication failed. Please login again.");
      router.push("/admin/login");
    } finally {
      setLoadingState('isAuthLoading', false);
    }
  };

  // Enhanced search with loading state
  const handleSearch = useCallback((query: string | undefined) => {
    const safeQuery = query || '';
    setSearchQuery(safeQuery);
    if (safeQuery.trim()) {
      setLoadingState('isSearching', true);
      // Simulate search processing time
      setTimeout(() => setLoadingState('isSearching', false), 200);
    } else {
      setLoadingState('isSearching', false);
    }
  }, [setLoadingState]);

  // Debounced version of handleSearch
  const debouncedHandleSearch = useDebounce(handleSearch, 300);

  // Enhanced filter with loading state
  const handleFilterChange = (filter: "all" | "active" | "banned") => {
    setLoadingState('isFiltering', true);
    setVisitorFilter(filter);
    setTimeout(() => setLoadingState('isFiltering', false), 150);
  };

  const handleBulkAction = async (action: "ban" | "unban", reason?: string) => {
    if (selectedVisitors.size === 0) {
      showErrorToast("Please select visitors first");
      return;
    }

    if (action === "ban") {
      setShowBanModal(true);
      return;
    }

    setIsProcessing(true);

    showAdminActionToast(action, selectedVisitors.size, async () => {
      try {
        const response = await fetch("/api/visitors/list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            action,
            uuids: Array.from(selectedVisitors),
            banReason: reason || `Bulk ${action} by admin`,
            adminId: "gaurav",
          }),
        });

        if (response.ok) {
          const data = await response.json();
          showSuccessToast(`Successfully ${action}ned ${data.processedCount} visitors`);
          setSelectedVisitors(new Set());
          // No need to call fetchVisitors() - Firebase listener will update automatically
        } else {
          throw new Error(`Failed to ${action} visitors`);
        }
      } catch (error) {
        console.error(`Error ${action}ning visitors:`, error);
        showErrorToast(`Failed to ${action} visitors`);
      } finally {
        setIsProcessing(false);
      }
    });
  };

  const handleSingleAction = (uuid: string, action: "ban" | "unban") => {
    // Find the visitor data for the modal
    const visitor = filteredVisitors.find(v => v.uuid === uuid);
    if (!visitor) {
      showErrorToast("Visitor not found");
      return;
    }

    setBanUnbanModalData({
      action,
      visitor: {
        uuid: visitor.uuid,
        status: visitor.status,
        banReason: visitor.banReason,
        policyReference: visitor.policyReference
      }
    });
    setShowBanUnbanModal(true);
  };

  const handleDeleteVisitors = (uuids: string[]) => {
    setDeleteConfig({
      type: "visitor",
      items: uuids,
      title: "Delete Visitors",
      message: `Are you sure you want to permanently delete ${uuids.length} visitor${
        uuids.length > 1 ? "s" : ""
      }? This will remove all visitor data including tracking history.`,
    });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfig) return;

    try {
      const deletePromises = deleteConfig.items.map(async (visitorUuid) => {
        const response = await fetch("/api/visitors/list", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            uuid: visitorUuid,
            adminId: "gaurav",
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to delete ${visitorUuid}`);
        }
        return visitorUuid;
      });

      await Promise.all(deletePromises);
      showSuccessToast(`Successfully deleted ${deleteConfig.items.length} visitor${deleteConfig.items.length > 1 ? "s" : ""}`);
      setSelectedVisitors(new Set());
      // No need to call fetchVisitors() - Firebase listener will update automatically
    } catch (error) {
      console.error("Delete operation failed:", error);
      showErrorToast("Failed to delete visitors. Please try again.");
    }
  };

  const handleEditNotes = (uuid: string, currentNotes?: string) => {
    setNotesModalData({ uuid, currentNotes });
    setShowNotesModal(true);
  };

  const handleNotesUpdated = () => {
    // No need to call fetchVisitors() - Firebase listener will update automatically
    setShowNotesModal(false);
    setNotesModalData(null);
  };

  const handleBanComplete = () => {
    setSelectedVisitors(new Set());
    // No need to call fetchVisitors() - Firebase listener will update automatically
  };

  const handleBanUnbanComplete = () => {
    // No need to call fetchVisitors() - Firebase listener will update automatically
    setShowBanUnbanModal(false);
    setBanUnbanModalData(null);
  };

  const handleEditCategory = (uuid: string) => {
    // Find the visitor to get current category
    const visitor = filteredVisitors.find(v => v.uuid === uuid);
    if (!visitor) {
      showErrorToast("Visitor not found");
      return;
    }

    setEditCategoryModalData({
      uuid: visitor.uuid,
      currentCategory: visitor.banCategory || 'normal'
    });
    setShowEditCategoryModal(true);
  };

  const handleEditCategoryComplete = () => {
    // No need to call fetchVisitors() - Firebase listener will update automatically
    setShowEditCategoryModal(false);
    setEditCategoryModalData(null);
  };

  const toggleVisitorSelection = (uuid: string) => {
    const newSelected = new Set(selectedVisitors);
    if (newSelected.has(uuid)) {
      newSelected.delete(uuid);
    } else {
      newSelected.add(uuid);
    }
    setSelectedVisitors(newSelected);
  };

  const selectAll = () => {
    if (selectedVisitors.size === filteredVisitors.length) {
      setSelectedVisitors(new Set());
    } else {
      setSelectedVisitors(new Set(filteredVisitors.map((v) => v.uuid)));
    }
  };

  // Show auth loading
  if (loadingStates.isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleLiveSyncToggle = (enabled: boolean) => {
    if (enabled) {
      refreshVisitors();
      showSuccessToast("Live sync enabled");
    } else {
      showInfoToast("Live sync paused");
    }
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-slate-50 page-container">
        {/* Unified Navbar */}
        <UnifiedNavbar
          visitorStats={visitorStats}
          appealStats={{ total: 0, pending: 0 }}
          aiQuestionCount={0}
          isRealTimeActive={!dataError}
          onLiveSyncToggle={handleLiveSyncToggle}
        />

        {/* Main Content */}
        <main className="px-6 lg:px-8 py-8">
          {/* Live sync indicator */}
          {isLiveSync && !isUsingFallback && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-blue-700 text-sm font-medium">Live sync updating...</span>
            </div>
          )}
          
          {/* Fallback mode indicator */}
          {isUsingFallback && (
            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center space-x-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span className="text-amber-700 text-sm font-medium">Using API fallback mode</span>
            </div>
          )}

          {/* Stats Cards with skeleton loading */}
          {shouldShowSkeleton ? (
            <AnalyticsCardsSkeleton count={3} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card-light p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Total Visitors</p>
                  <p className="text-3xl font-bold text-slate-900">{visitorStats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="card-light p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Active Visitors</p>
                  <p className="text-3xl font-bold text-emerald-600">{visitorStats.active}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="card-light p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Banned Visitors</p>
                  <p className="text-3xl font-bold text-red-600">{visitorStats.banned}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                  </svg>
                </div>
              </div>
            </div>
            </div>
          )}

          {/* Controls */}
          <div className="card-light p-6 mb-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="relative">
                  <select
                    value={visitorFilter}
                    onChange={(e) => handleFilterChange(e.target.value as any)}
                    disabled={loadingStates.isFiltering}
                    className="bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    title="Filter visitors by status"
                    aria-label="Filter visitors by status"
                  >
                    <option value="all">All Visitors</option>
                    <option value="active">Active Only</option>
                    <option value="banned">Banned Only</option>
                  </select>
                  {loadingStates.isFiltering && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search visitors..."
                    value={searchQuery}
                    onChange={(e) => debouncedHandleSearch(e.target.value)}
                    disabled={loadingStates.isSearching}
                    className="bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 disabled:opacity-50"
                  />
                  <svg className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {loadingStates.isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    console.log('🔄 Refresh button clicked');
                    setLoadingState('isRefreshing', true);
                    refreshVisitors();
                    
                    // Set a timeout to ensure loading state is visible and provide feedback
                    setTimeout(() => {
                      setLoadingState('isRefreshing', false);
                      showSuccessToast('Visitor data refreshed successfully');
                      console.log('✅ Refresh completed with user feedback');
                    }, 1200); // Slightly longer to ensure user sees the loading state
                  }}
                  disabled={loadingStates.isRefreshing}
                  className={`btn-secondary flex items-center space-x-2 ${
                    loadingStates.isRefreshing ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                  title={loadingStates.isRefreshing ? 'Refreshing data...' : 'Refresh visitor data'}
                >
                  {loadingStates.isRefreshing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
                      <span>Refreshing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Refresh</span>
                    </>
                  )}
                </button>
              </div>

              {selectedVisitors.size > 0 && (
                <div className="flex items-center space-x-3">
                  <span className="text-slate-600 text-sm font-medium">
                    {selectedVisitors.size} selected
                  </span>
                  <button
                    onClick={() => handleBulkAction("ban")}
                    disabled={isProcessing}
                    className="btn-danger"
                  >
                    Ban Selected
                  </button>
                  <button
                    onClick={() => handleBulkAction("unban")}
                    disabled={isProcessing}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Unban Selected
                  </button>
                  <button
                    onClick={() => handleDeleteVisitors(Array.from(selectedVisitors))}
                    disabled={isProcessing}
                    className="bg-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Delete Selected
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Visitors Table with smart loading */}
          <div className="card-light overflow-hidden">
            {shouldShowSkeleton ? (
              <VisitorTableSkeleton rows={10} />
            ) : emptyState.shouldShow ? (
              <EmptyState
                type={emptyState.type}
                title={emptyState.title}
                message={emptyState.message}
                action={emptyState.action as 'retry' | 'clear-filters' | 'refresh' | 'custom' | undefined}
                onAction={() => {
                  if (emptyState.action === 'clear-filters') {
                    setVisitorFilter('all');
                    setSearchQuery('');
                  } else if (emptyState.action === 'refresh') {
                    refreshVisitors();
                  } else if (emptyState.action === 'retry') {
                    refreshVisitors();
                  }
                }}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left">
                        <input
                          type="checkbox"
                          checked={selectedVisitors.size === filteredVisitors.length && filteredVisitors.length > 0}
                          onChange={selectAll}
                          className="rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                          title="Select all visitors"
                          aria-label="Select all visitors"
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Visitor
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Device Info
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Session
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Source
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredVisitors.map((visitor) => (
                      <tr key={visitor.uuid} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedVisitors.has(visitor.uuid)}
                            onChange={() => toggleVisitorSelection(visitor.uuid)}
                            className="rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                            title={`Select visitor ${visitor.uuid.slice(0, 8)}`}
                            aria-label={`Select visitor ${visitor.uuid.slice(0, 8)}`}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                visitor.isOnline ? "bg-emerald-400 animate-pulse" : "bg-slate-400"
                              }`}
                            />
                            <div>
                              <div className="text-sm font-medium text-slate-900">
                                {visitor.uuid.slice(0, 8)}...
                              </div>
                              <div className="text-sm text-slate-500">{visitor.ipAddress}</div>
                              {visitor.adminNotes && (
                                <div className="text-xs text-blue-600 mt-1">📝 Has notes</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                visitor.status === "active"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {visitor.status}
                            </span>
                            {visitor.isOnline && <span className="text-xs text-emerald-500">●</span>}
                          </div>
                          {visitor.banReason && (
                            <div className="text-xs text-slate-500 mt-1">{visitor.banReason}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {visitor.location?.flag && (
                              <img
                                src={visitor.location.flag}
                                alt={visitor.location.countryCode}
                                className="w-4 h-3"
                              />
                            )}
                            <div>
                              <div className="text-sm text-slate-900">
                                {visitor.location?.city || "Unknown"}
                              </div>
                              <div className="text-xs text-slate-500">
                                {visitor.location?.country || "Unknown"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">
                              {visitor.deviceInfo?.icon ||
                                (visitor.device === "Mobile" ? "📱" : visitor.device === "Tablet" ? "📱" : "💻")}
                            </span>
                            <div>
                              <div className="text-sm text-slate-900">
                                {visitor.deviceInfo?.browser || visitor.browser}
                              </div>
                              <div className="text-xs text-slate-500">
                                {visitor.deviceInfo?.os || visitor.os} • {visitor.deviceInfo?.type || visitor.device}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm text-slate-900">{visitor.visitCount} visits</div>
                            <div className="text-xs text-slate-500">
                              {visitor.isOnline
                                ? `Online for ${formatDuration(Math.floor((visitor.sessionDuration || 0) / 60))}`
                                : visitor.lastSeen
                                ? `Last seen ${formatTimeIST(visitor.lastSeen)}`
                                : `Last: ${formatTimeIST(visitor.lastVisit)}`}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm text-slate-900">
                              {visitor.referralInfo?.source || "Direct"}
                            </div>
                            <div className="text-xs text-slate-500">
                              {visitor.referralInfo?.firstPage || "/"}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 min-w-[200px]">
                          <div className="flex flex-col space-y-1">
                            <div className="flex space-x-1">
                              {visitor.status === "active" ? (
                                <button
                                  onClick={() => handleSingleAction(visitor.uuid, "ban")}
                                  className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs transition-colors"
                                >
                                  Ban
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleSingleAction(visitor.uuid, "unban")}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-1 rounded text-xs transition-colors"
                                  >
                                    Unban
                                  </button>
                                  <button
                                    onClick={() => handleEditCategory(visitor.uuid)}
                                    className="bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded text-xs transition-colors"
                                  >
                                    Edit Category
                                  </button>
                                </>
                              )}
                            </div>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleEditNotes(visitor.uuid, visitor.adminNotes)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs transition-colors"
                              >
                                Notes
                              </button>
                              <button
                                onClick={() => handleDeleteVisitors([visitor.uuid])}
                                className="bg-slate-500 hover:bg-slate-600 text-white px-2 py-1 rounded text-xs transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>

        {/* Modals */}
        <EnhancedBanModal
          isOpen={showBanModal}
          onClose={() => setShowBanModal(false)}
          selectedUUIDs={Array.from(selectedVisitors)}
          onBanComplete={handleBanComplete}
        />

        {deleteConfig && (
          <DeleteConfirmModal
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false);
              setDeleteConfig(null);
            }}
            onConfirm={handleConfirmDelete}
            title={deleteConfig.title}
            message={deleteConfig.message}
            itemCount={deleteConfig.items.length}
            type={deleteConfig.type}
          />
        )}

        {notesModalData && (
          <AdminNotesModal
            isOpen={showNotesModal}
            onClose={() => {
              setShowNotesModal(false);
              setNotesModalData(null);
            }}
            visitorUuid={notesModalData.uuid}
            currentNotes={notesModalData.currentNotes}
            onNotesUpdated={handleNotesUpdated}
          />
        )}

        {banUnbanModalData && (
          <BanUnbanConfirmModal
            isOpen={showBanUnbanModal}
            onClose={() => {
              setShowBanUnbanModal(false);
              setBanUnbanModalData(null);
            }}
            action={banUnbanModalData.action}
            visitor={banUnbanModalData.visitor}
            onActionComplete={handleBanUnbanComplete}
          />
        )}

        {editCategoryModalData && (
          <EditBanCategoryModal
            isOpen={showEditCategoryModal}
            onClose={() => {
              setShowEditCategoryModal(false);
              setEditCategoryModalData(null);
            }}
            uuid={editCategoryModalData.uuid}
            currentCategory={editCategoryModalData.currentCategory as any}
            onCategoryUpdated={handleEditCategoryComplete}
          />
        )}
      </div>
    </ThemeProvider>
  );
}
                  