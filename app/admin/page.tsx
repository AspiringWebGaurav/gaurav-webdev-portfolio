"use client";

import { useEffect, useState, useRef, useMemo, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/utils/adminAuth";
import {
  showSuccessToast,
  showErrorToast,
  showAdminActionToast,
  showInfoToast,
} from "@/components/ToastSystem";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import AnalyticsCards from "@/components/admin/AnalyticsCards";
import {
  ThemeProvider,
  ThemeToggle,
  LiveSyncToggle,
} from "@/components/admin/ThemeProvider";
import UnifiedNavbar from "@/components/admin/UnifiedNavbar";
import { usePerformanceOptimization, useDebounce } from "@/hooks/usePerformanceOptimization";
import { useAdminSwipeNavigation } from "@/hooks/useSwipeGestures";
import { AIQuestion, AdminQuestionFormData } from "@/components/ai-assistant/types";
import { formatTimeIST, formatDuration } from "@/utils/timeFormat";

// Lazy load heavy components
const EnhancedBanModal = lazy(() => import("@/components/admin/EnhancedBanModal"));
const DeleteConfirmModal = lazy(() => import("@/components/admin/DeleteConfirmModal"));
const AdminNotesModal = lazy(() => import("@/components/admin/AdminNotesModal"));
const AdminAITab = lazy(() => import("@/components/admin/AdminAITab"));

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
  // Enhanced fields
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

interface BanAppeal {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  uuid: string;
  banReason: string;
  status: "pending" | "reviewed" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

interface VisitorsTabProps {
  visitors: Visitor[];
  stats: VisitorStats;
  selectedVisitors: Set<string>;
  setSelectedVisitors: (visitors: Set<string>) => void;
  filter: "all" | "active" | "banned";
  setFilter: (filter: "all" | "active" | "banned") => void;
  onBulkAction: (action: "ban" | "unban", reason?: string) => void;
  onSingleAction: (
    uuid: string,
    action: "ban" | "unban",
    reason?: string
  ) => void;
  onDeleteVisitors: (uuids: string[]) => void;
  onEditNotes: (uuid: string, currentNotes?: string) => void;
  onRefresh: () => void;
  isProcessing: boolean;
}

interface AppealsTabProps {
  appeals: BanAppeal[];
  stats: { total: number; pending: number };
  onAppealAction: (
    appealId: string,
    status: "approved" | "rejected",
    notes?: string
  ) => void;
  onDeleteAppeals: (appealIds: string[]) => void;
  onRefresh: () => void;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { checkAuth, logout } = useAdminAuth();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"visitors" | "appeals" | "ai-assistant">(
    "visitors"
  );

  // Performance optimizations - Always call hooks unconditionally
  const performanceData = usePerformanceOptimization();
  const swipeData = useAdminSwipeNavigation();
  
  const { loadTime } = performanceData;
  const { isSwipeActive, swipeDirection } = swipeData;

  // Visitors state
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [visitorStats, setVisitorStats] = useState<VisitorStats>({
    total: 0,
    active: 0,
    banned: 0,
    currentPage: 1,
    totalPages: 1,
    hasMore: false,
  });
  const [selectedVisitors, setSelectedVisitors] = useState<Set<string>>(
    new Set()
  );
  const [visitorFilter, setVisitorFilter] = useState<
    "all" | "active" | "banned"
  >("all");
  const [isProcessing, setIsProcessing] = useState(false);

  // Appeals state
  const [appeals, setAppeals] = useState<BanAppeal[]>([]);
  const [appealStats, setAppealStats] = useState({ total: 0, pending: 0 });

  // AI Assistant state
  const [aiQuestions, setAiQuestions] = useState<AIQuestion[]>([]);
  const [aiQuestionsLoading, setAiQuestionsLoading] = useState(false);

  // Real-time listeners
  const visitorsUnsubscribeRef = useRef<(() => void) | null>(null);
  const appealsUnsubscribeRef = useRef<(() => void) | null>(null);
  const [isRealTimeActive, setIsRealTimeActive] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfig, setDeleteConfig] = useState<{
    type: "visitor" | "ban" | "appeal";
    items: string[];
    title: string;
    message: string;
  } | null>(null);
  const [analyticsData, setAnalyticsData] = useState({
    totalVisitors: 0,
    activeVisitors: 0,
    bannedVisitors: 0,
    pendingAppeals: 0,
    todayVisitors: 0,
    onlineVisitors: 0,
    totalBans: 0,
    recentActivity: 0,
  });
  const [newVisitorCount, setNewVisitorCount] = useState(0);

  // Admin Notes Modal state
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notesModalData, setNotesModalData] = useState<{
    uuid: string;
    currentNotes?: string;
  } | null>(null);

  useEffect(() => {
    verifyAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      // Start real-time listeners
      startRealTimeListeners();

      // Initial fetch
      if (activeTab === "visitors") {
        fetchVisitors();
      } else if (activeTab === "appeals") {
        fetchAppeals();
      } else if (activeTab === "ai-assistant") {
        fetchAIQuestions();
      }
    }

    // Cleanup listeners on unmount
    return () => {
      if (visitorsUnsubscribeRef.current) {
        console.log("🧹 Cleaning up visitors listener");
        visitorsUnsubscribeRef.current();
      }
      if (appealsUnsubscribeRef.current) {
        console.log("🧹 Cleaning up appeals listener");
        appealsUnsubscribeRef.current();
      }
    };
  }, [isAuthenticated, activeTab, visitorFilter]);

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
      setIsLoading(false);
    }
  };

  const fetchVisitors = async (page = 1) => {
    try {
      const params = new URLSearchParams({
        limit: "20",
        offset: ((page - 1) * 20).toString(),
        sortBy: "lastVisit",
        sortOrder: "desc",
      });

      if (visitorFilter !== "all") {
        params.append("status", visitorFilter);
      }

      const response = await fetch(`/api/visitors/list?${params}`, {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          showErrorToast("Session expired. Please login again.");
          router.push("/admin/login");
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data || typeof data !== "object") {
        throw new Error("Invalid response format");
      }

      setVisitors(Array.isArray(data.visitors) ? data.visitors : []);
      setVisitorStats(
        data.stats || {
          total: 0,
          active: 0,
          banned: 0,
          currentPage: 1,
          totalPages: 1,
          hasMore: false,
        }
      );
    } catch (error) {
      console.error("Error fetching visitors:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      showErrorToast(`Failed to load visitors: ${errorMessage}`);

      // Set empty state on error
      setVisitors([]);
      setVisitorStats({
        total: 0,
        active: 0,
        banned: 0,
        currentPage: 1,
        totalPages: 1,
        hasMore: false,
      });
    }
  };

  const fetchAppeals = async () => {
    try {
      const response = await fetch("/api/contact/ban-appeal", {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          showErrorToast("Session expired. Please login again.");
          router.push("/admin/login");
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data || typeof data !== "object") {
        throw new Error("Invalid response format");
      }

      setAppeals(Array.isArray(data.appeals) ? data.appeals : []);
      setAppealStats(data.stats || { total: 0, pending: 0 });
    } catch (error) {
      console.error("Error fetching appeals:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      showErrorToast(`Failed to load appeals: ${errorMessage}`);

      // Set empty state on error
      setAppeals([]);
      setAppealStats({ total: 0, pending: 0 });
    }
  };

  const fetchAIQuestions = async () => {
    try {
      setAiQuestionsLoading(true);
      const response = await fetch('/api/ai-assistant/questions', {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          showErrorToast('Session expired. Please login again.');
          router.push('/admin/login');
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format');
      }

      setAiQuestions(Array.isArray(data.data?.questions) ? data.data.questions : []);
    } catch (error) {
      console.error('Error fetching AI questions:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      showErrorToast(`Failed to load AI questions: ${errorMessage}`);

      // Set empty state on error
      setAiQuestions([]);
    } finally {
      setAiQuestionsLoading(false);
    }
  };

  const handleAddAIQuestion = async (data: AdminQuestionFormData) => {
    try {
      const formData = new FormData();
      formData.append('question', data.question);
      formData.append('answer', data.answer);
      if (data.anchorLink) {
        formData.append('anchorLink', data.anchorLink);
      }
      if (data.file?.file) {
        formData.append('file', data.file.file);
      }

      const response = await fetch('/api/ai-assistant/questions', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add question');
      }

      await fetchAIQuestions();
    } catch (error) {
      console.error('Error adding AI question:', error);
      throw error;
    }
  };

  const handleEditAIQuestion = async (id: string, data: AdminQuestionFormData) => {
    try {
      const formData = new FormData();
      formData.append('id', id);
      formData.append('question', data.question);
      formData.append('answer', data.answer);
      if (data.anchorLink) {
        formData.append('anchorLink', data.anchorLink);
      }
      if (data.file?.file) {
        formData.append('file', data.file.file);
      }

      const response = await fetch('/api/ai-assistant/questions', {
        method: 'PUT',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update question');
      }

      await fetchAIQuestions();
    } catch (error) {
      console.error('Error updating AI question:', error);
      throw error;
    }
  };

  const handleDeleteAIQuestion = async (id: string) => {
    try {
      const response = await fetch(`/api/ai-assistant/questions?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete question');
      }

      await fetchAIQuestions();
    } catch (error) {
      console.error('Error deleting AI question:', error);
      throw error;
    }
  };

  const startRealTimeListeners = () => {
    if (isRealTimeActive) return;

    try {
      console.log(
        "🔥 Starting real-time Firebase listeners for admin dashboard"
      );

      // Visitors real-time listener with new visitor detection
      const visitorsQuery = query(
        collection(db as any, "visitors"),
        orderBy("lastVisit", "desc")
      );

      const visitorsUnsubscribe = onSnapshot(
        visitorsQuery,
        (snapshot) => {
          console.log("📡 ADMIN: Visitors data updated in real-time");

          // Check for new visitors
          if (!snapshot.metadata.fromCache) {
            const currentVisitorCount = visitors.length;
            const newVisitorCount = snapshot.docs.length;

            // If we have more visitors than before, show notification
            if (
              currentVisitorCount > 0 &&
              newVisitorCount > currentVisitorCount
            ) {
              const newVisitorsAdded = newVisitorCount - currentVisitorCount;
              showSuccessToast(
                `🎉 ${newVisitorsAdded} new visitor${
                  newVisitorsAdded > 1 ? "s" : ""
                } detected!`
              );

              // Update new visitor count for analytics
              setNewVisitorCount((prev) => prev + newVisitorsAdded);
            }

            // Check for visitors coming online
            snapshot.docChanges().forEach((change) => {
              if (change.type === "modified") {
                const visitorData = change.doc.data();
                const visitorId = change.doc.id;

                // Find the previous state of this visitor
                const previousVisitor = visitors.find(
                  (v) => v.uuid === visitorId
                );

                // If visitor just came online
                if (
                  previousVisitor &&
                  !previousVisitor.isOnline &&
                  visitorData.isOnline
                ) {
                  showInfoToast(
                    `👋 Visitor ${visitorId.slice(0, 8)}... is now online`
                  );
                }

                // If visitor just went offline
                if (
                  previousVisitor &&
                  previousVisitor.isOnline &&
                  !visitorData.isOnline
                ) {
                  showInfoToast(
                    `👋 Visitor ${visitorId.slice(0, 8)}... went offline`
                  );
                }
              }
            });
          }

          // Silently refresh visitors data in background
          fetchVisitors();
        },
        (error) => {
          console.error("❌ Visitors listener error:", error);
        }
      );

      // Appeals real-time listener
      const appealsQuery = query(
        collection(db as any, "ban_appeals"),
        orderBy("submittedAt", "desc")
      );

      const appealsUnsubscribe = onSnapshot(
        appealsQuery,
        (snapshot) => {
          try {
            console.log("📡 ADMIN: Appeals data updated in real-time");

            // Check for new pending appeals
            const newAppeals = snapshot.docs
              .map((doc) => {
                const data = doc.data();
                return {
                  id: doc.id,
                  ...data,
                };
              })
              .filter(
                (appeal) => appeal && typeof appeal === "object"
              ) as BanAppeal[];

            const newPendingCount = newAppeals.filter(
              (appeal) => appeal.status === "pending"
            ).length;
            const currentPendingCount = appealStats.pending;

            // Show notification for new appeals
            if (
              newPendingCount > currentPendingCount &&
              currentPendingCount >= 0
            ) {
              const newAppealsCount = newPendingCount - currentPendingCount;
              showSuccessToast(
                `📧 ${newAppealsCount} new ban appeal${
                  newAppealsCount > 1 ? "s" : ""
                } received! (${newPendingCount} pending)`
              );
            }

            // Silently refresh appeals data in background
            fetchAppeals().catch((error) => {
              console.warn("⚠️ Background appeals refresh failed:", error);
            });
          } catch (snapshotError) {
            console.error(
              "❌ Error processing appeals snapshot:",
              snapshotError
            );
            showErrorToast("Error processing appeal updates");
          }
        },
        (error) => {
          console.error("❌ Appeals listener error:", error);
          showErrorToast("Real-time appeal updates disconnected");

          // Attempt to restart listener after delay
          setTimeout(() => {
            if (isRealTimeActive) {
              console.log("🔄 Attempting to restart appeals listener...");
              startRealTimeListeners();
            }
          }, 5000);
        }
      );

      visitorsUnsubscribeRef.current = visitorsUnsubscribe;
      appealsUnsubscribeRef.current = appealsUnsubscribe;
      setIsRealTimeActive(true);

      console.log("✅ Real-time listeners started successfully");
    } catch (error) {
      console.error("❌ Failed to start real-time listeners:", error);
    }
  };

  const handleBulkAction = async (action: "ban" | "unban", reason?: string) => {
    if (selectedVisitors.size === 0) {
      showErrorToast("Please select visitors first");
      return;
    }

    if (action === "ban") {
      // Open enhanced ban modal for ban action
      setShowBanModal(true);
      return;
    }

    setIsProcessing(true);

    showAdminActionToast(action, selectedVisitors.size, async () => {
      try {
        const response = await fetch("/api/visitors/list", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
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
          showSuccessToast(
            `Successfully ${action}ned ${data.processedCount} visitors`
          );
          setSelectedVisitors(new Set());
          fetchVisitors();
          updateAnalytics();
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

  const handleSingleAction = async (
    uuid: string,
    action: "ban" | "unban",
    reason?: string
  ) => {
    try {
      const response = await fetch("/api/visitors/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          uuid,
          status: action === "ban" ? "banned" : "active",
          banReason: reason || `${action} by admin`,
          adminId: "gaurav",
        }),
      });

      if (response.ok) {
        showSuccessToast(`Visitor ${action}ned successfully`);
        fetchVisitors();
      } else {
        throw new Error(`Failed to ${action} visitor`);
      }
    } catch (error) {
      console.error(`Error ${action}ning visitor:`, error);
      showErrorToast(`Failed to ${action} visitor`);
    }
  };

  const handleAppealAction = async (
    appealId: string,
    status: "approved" | "rejected",
    notes?: string
  ) => {
    try {
      const response = await fetch("/api/contact/ban-appeal", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          appealId,
          status,
          reviewNotes: notes,
          reviewedBy: "gaurav",
        }),
      });

      if (response.ok) {
        showSuccessToast(`Appeal ${status} successfully`);
        fetchAppeals();
        if (status === "approved") {
          fetchVisitors(); // Refresh visitors list as user might be unbanned
        }
      } else {
        throw new Error(`Failed to ${status} appeal`);
      }
    } catch (error) {
      console.error(`Error ${status}ing appeal:`, error);
      showErrorToast(`Failed to ${status} appeal`);
    }
  };

  const updateAnalytics = async () => {
    try {
      // Calculate analytics from current data
      const totalVisitors = visitors.length;
      const activeVisitors = visitors.filter(
        (v) => v.status === "active"
      ).length;
      const bannedVisitors = visitors.filter(
        (v) => v.status === "banned"
      ).length;
      const pendingAppeals = appeals.filter(
        (a) => a.status === "pending"
      ).length;

      // Mock data for additional metrics (can be enhanced with real data)
      const todayVisitors = Math.floor(totalVisitors * 0.3);
      const onlineVisitors = Math.floor(activeVisitors * 0.1);
      const totalBans = bannedVisitors;
      const recentActivity = Math.floor(totalVisitors * 0.05);

      setAnalyticsData({
        totalVisitors,
        activeVisitors,
        bannedVisitors,
        pendingAppeals,
        todayVisitors,
        onlineVisitors,
        totalBans,
        recentActivity,
      });
    } catch (error) {
      console.error("Error updating analytics:", error);
    }
  };

  const handleNewVisitorNotification = () => {
    setNewVisitorCount((prev) => prev + 1);
    showInfoToast(`New visitor detected! (${newVisitorCount + 1} new today)`);
  };

  const handleLiveSyncToggle = (enabled: boolean) => {
    setIsRealTimeActive(enabled);
    if (enabled) {
      startRealTimeListeners();
      showSuccessToast("Live sync enabled");
    } else {
      // Stop listeners
      if (visitorsUnsubscribeRef.current) {
        visitorsUnsubscribeRef.current();
        visitorsUnsubscribeRef.current = null;
      }
      if (appealsUnsubscribeRef.current) {
        appealsUnsubscribeRef.current();
        appealsUnsubscribeRef.current = null;
      }
      showInfoToast("Live sync paused");
    }
  };

  const handleDeleteVisitors = (uuids: string[]) => {
    setDeleteConfig({
      type: "visitor",
      items: uuids,
      title: "Delete Visitors",
      message: `Are you sure you want to permanently delete ${
        uuids.length
      } visitor${
        uuids.length > 1 ? "s" : ""
      }? This will remove all visitor data including tracking history.`,
    });
    setShowDeleteModal(true);
  };

  const handleDeleteAppeals = (appealIds: string[]) => {
    setDeleteConfig({
      type: "appeal",
      items: appealIds,
      title: "Delete Appeals",
      message: `Are you sure you want to permanently delete ${
        appealIds.length
      } appeal${
        appealIds.length > 1 ? "s" : ""
      }? This action cannot be undone.`,
    });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfig) return;

    try {
      if (deleteConfig.type === "visitor") {
        // Delete visitors
        const deletePromises = deleteConfig.items.map(async (visitorUuid) => {
          try {
            const response = await fetch("/api/visitors/list", {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify({
                uuid: visitorUuid,
                adminId: "gaurav",
              }),
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error(
                `Delete visitor ${visitorUuid} failed:`,
                response.status,
                errorText
              );
              throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            return visitorUuid;
          } catch (error) {
            console.error(`Error deleting visitor ${visitorUuid}:`, error);
            throw error;
          }
        });

        await Promise.all(deletePromises);
        showSuccessToast(
          `Successfully deleted ${deleteConfig.items.length} visitor${
            deleteConfig.items.length > 1 ? "s" : ""
          }`
        );
        setSelectedVisitors(new Set());
        fetchVisitors();
        updateAnalytics();
      } else if (deleteConfig.type === "appeal") {
        // Delete appeals
        const deletePromises = deleteConfig.items.map(async (appealId) => {
          try {
            const response = await fetch("/api/contact/ban-appeal", {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify({
                appealId: appealId, // Send in request body
              }),
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error(
                `Delete appeal ${appealId} failed:`,
                response.status,
                errorText
              );
              throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            return appealId;
          } catch (error) {
            console.error(`Error deleting appeal ${appealId}:`, error);
            throw error;
          }
        });

        await Promise.all(deletePromises);
        showSuccessToast(
          `Successfully deleted ${deleteConfig.items.length} appeal${
            deleteConfig.items.length > 1 ? "s" : ""
          }`
        );
        fetchAppeals();
        updateAnalytics();
      }
    } catch (error) {
      console.error("Delete operation failed:", error);
      showErrorToast(
        `Failed to delete ${deleteConfig.type}s. Please try again.`
      );
    }
  };

  const handleBanComplete = () => {
    setSelectedVisitors(new Set());
    fetchVisitors();
    updateAnalytics();
  };

  const handleLogout = async () => {
    await logout();
    router.push("/admin/login");
  };

  const handleEditNotes = (uuid: string, currentNotes?: string) => {
    setNotesModalData({ uuid, currentNotes });
    setShowNotesModal(true);
  };

  const handleNotesUpdated = () => {
    fetchVisitors(); // Refresh to show updated notes
    setShowNotesModal(false);
    setNotesModalData(null);
  };

  // Memoize analytics data to prevent unnecessary recalculations - MUST be before early returns
  const memoizedAnalyticsData = useMemo(() => analyticsData, [analyticsData]);

  // Update analytics when data changes
  useEffect(() => {
    if (visitors.length > 0 || appeals.length > 0) {
      updateAnalytics();
    }
  }, [visitors, appeals]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-slate-50 gpu-accelerated page-container">
        {/* Unified Navbar with Performance Optimizations */}
        <UnifiedNavbar
          visitorStats={visitorStats}
          appealStats={appealStats}
          aiQuestionCount={aiQuestions.length}
          isRealTimeActive={isRealTimeActive}
          onLiveSyncToggle={handleLiveSyncToggle}
        />

        {/* Performance Debug Info (Development Only) */}
        {process.env.NODE_ENV === 'development' && loadTime > 0 && (
          <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs px-3 py-2 rounded-lg z-50">
            Load Time: {loadTime.toFixed(2)}ms
          </div>
        )}

        {/* Swipe Gesture Indicators */}
        {isSwipeActive && (
          <>
            <div className={`swipe-indicator left ${swipeDirection === 'right' ? 'active' : ''}`} />
            <div className={`swipe-indicator right ${swipeDirection === 'left' ? 'active' : ''}`} />
          </>
        )}

        {/* Main Content - Light Theme */}
        <main className="px-6 lg:px-8 py-8 preload-hint">
          {/* Analytics Cards with Performance Optimization */}
          <Suspense fallback={<div className="skeleton h-32 rounded-xl mb-8"></div>}>
            <AnalyticsCards data={memoizedAnalyticsData} isLoading={isLoading} />
          </Suspense>

          {/* Dashboard Overview Content */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => router.push("/admin/visitors")}
                  className="flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
                >
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-slate-900">Manage Visitors</p>
                    <p className="text-sm text-slate-500">View and manage all visitors</p>
                  </div>
                </button>

                <button
                  onClick={() => router.push("/admin/appeals")}
                  className="flex items-center space-x-3 p-4 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors group"
                >
                  <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-slate-900">Review Appeals</p>
                    <p className="text-sm text-slate-500">{appealStats.pending} pending appeals</p>
                  </div>
                </button>

                <button
                  onClick={() => router.push("/admin/ai-assistant")}
                  className="flex items-center space-x-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
                >
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-slate-900">AI Assistant</p>
                    <p className="text-sm text-slate-500">Manage AI questions</p>
                  </div>
                </button>

                <button
                  onClick={() => fetchVisitors()}
                  className="flex items-center space-x-3 p-4 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors group"
                >
                  <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-slate-900">Refresh Data</p>
                    <p className="text-sm text-slate-500">Update all statistics</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Recent Activity</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">New visitors detected</p>
                    <p className="text-xs text-slate-500">Live tracking active</p>
                  </div>
                  <span className="text-xs text-slate-400">Live</span>
                </div>
                
                {appealStats.pending > 0 && (
                  <div className="flex items-center space-x-3 p-3 bg-amber-50 rounded-lg">
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">Pending appeals require attention</p>
                      <p className="text-xs text-slate-500">{appealStats.pending} appeals waiting for review</p>
                    </div>
                    <button
                      onClick={() => router.push("/admin/appeals")}
                      className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                    >
                      Review
                    </button>
                  </div>
                )}
                
                <div className="flex items-center space-x-3 p-3 bg-emerald-50 rounded-lg">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">System running smoothly</p>
                    <p className="text-xs text-slate-500">All services operational</p>
                  </div>
                  <span className="text-xs text-emerald-600">●</span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Enhanced Ban Modal with Lazy Loading */}
        <Suspense fallback={null}>
          <EnhancedBanModal
            isOpen={showBanModal}
            onClose={() => setShowBanModal(false)}
            selectedUUIDs={Array.from(selectedVisitors)}
            onBanComplete={handleBanComplete}
          />
        </Suspense>

        {/* Delete Confirmation Modal with Lazy Loading */}
        {deleteConfig && (
          <Suspense fallback={null}>
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
          </Suspense>
        )}

        {/* Admin Notes Modal with Lazy Loading */}
        {notesModalData && (
          <Suspense fallback={null}>
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
          </Suspense>
        )}
      </div>
    </ThemeProvider>
  );
}

// Loading screen component
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600 text-lg">Loading Admin Dashboard...</p>
      </div>
    </div>
  );
}

// Visitors tab component
function VisitorsTab({
  visitors,
  stats,
  selectedVisitors,
  setSelectedVisitors,
  filter,
  setFilter,
  onBulkAction,
  onSingleAction,
  onDeleteVisitors,
  onEditNotes,
  onRefresh,
  isProcessing,
}: VisitorsTabProps) {
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
    if (selectedVisitors.size === visitors.length) {
      setSelectedVisitors(new Set());
    } else {
      setSelectedVisitors(new Set(visitors.map((v: Visitor) => v.uuid)));
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-black-100/50 border border-white/[0.2] rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Visitors</p>
              <p className="text-3xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-black-100/50 border border-white/[0.2] rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Visitors</p>
              <p className="text-3xl font-bold text-green-400">
                {stats.active}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-black-100/50 border border-white/[0.2] rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Banned Visitors</p>
              <p className="text-3xl font-bold text-red-400">{stats.banned}</p>
            </div>
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="bg-black-100/50 border border-white/[0.2] rounded-lg px-4 py-2 text-white"
            title="Filter visitors by status"
            aria-label="Filter visitors by status"
          >
            <option value="all">All Visitors</option>
            <option value="active">Active Only</option>
            <option value="banned">Banned Only</option>
          </select>

          <button
            onClick={onRefresh}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>

        {selectedVisitors.size > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-gray-300 text-sm">
              {selectedVisitors.size} selected
            </span>
            <button
              onClick={() => onBulkAction("ban", "Bulk ban by admin")}
              disabled={isProcessing}
              className="bg-red-500 hover:bg-red-600 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Ban Selected
            </button>
            <button
              onClick={() => onBulkAction("unban")}
              disabled={isProcessing}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Unban Selected
            </button>
            <button
              onClick={() => onDeleteVisitors(Array.from(selectedVisitors))}
              disabled={isProcessing}
              className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              <span>Delete Selected</span>
            </button>
          </div>
        )}
      </div>

      {/* Visitors table */}
      <div className="bg-black-100/50 border border-white/[0.2] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-black-100/80 border-b border-white/[0.1]">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedVisitors.size === visitors.length &&
                      visitors.length > 0
                    }
                    onChange={selectAll}
                    className="rounded border-gray-600 bg-black-100 text-blue-500 focus:ring-blue-500"
                    title="Select all visitors"
                    aria-label="Select all visitors"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Visitor
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Device Info
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Session
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.1]">
              {visitors.map((visitor: Visitor) => (
                <tr key={visitor.uuid} className="hover:bg-white/[0.02]">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedVisitors.has(visitor.uuid)}
                      onChange={() => toggleVisitorSelection(visitor.uuid)}
                      className="rounded border-gray-600 bg-black-100 text-blue-500 focus:ring-blue-500"
                      title={`Select visitor ${visitor.uuid.slice(0, 8)}`}
                      aria-label={`Select visitor ${visitor.uuid.slice(0, 8)}`}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      {/* Online/Offline Status */}
                      <div
                        className={`w-3 h-3 rounded-full ${
                          visitor.isOnline
                            ? "bg-green-400 animate-pulse"
                            : "bg-gray-500"
                        }`}
                        title={visitor.isOnline ? "Online" : "Offline"}
                      />

                      <div>
                        <div className="text-sm font-medium text-white">
                          {visitor.uuid.slice(0, 8)}...
                        </div>
                        <div className="text-sm text-gray-400">
                          {visitor.ipAddress}
                        </div>
                        {visitor.adminNotes && (
                          <div
                            className="text-xs text-blue-300 mt-1"
                            title={visitor.adminNotes}
                          >
                            📝 Has notes
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          visitor.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {visitor.status}
                      </span>
                      {visitor.isOnline && (
                        <span className="text-xs text-green-400">●</span>
                      )}
                    </div>
                    {visitor.banReason && (
                      <div className="text-xs text-gray-400 mt-1">
                        {visitor.banReason}
                      </div>
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
                        <div className="text-sm text-white">
                          {visitor.location?.city || "Unknown"}
                        </div>
                        <div className="text-xs text-gray-400">
                          {visitor.location?.country || "Unknown"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">
                        {visitor.deviceInfo?.icon ||
                          (visitor.device === "Mobile"
                            ? "📱"
                            : visitor.device === "Tablet"
                            ? "📱"
                            : "💻")}
                      </span>
                      <div>
                        <div className="text-sm text-white">
                          {visitor.deviceInfo?.browser || visitor.browser}
                        </div>
                        <div className="text-xs text-gray-400">
                          {visitor.deviceInfo?.os || visitor.os} •{" "}
                          {visitor.deviceInfo?.type || visitor.device}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm text-white">
                        {visitor.visitCount} visits
                      </div>
                      <div className="text-xs text-gray-400">
                        {visitor.isOnline
                          ? `Online for ${formatDuration(Math.floor(
                              (visitor.sessionDuration || 0) / 60
                            ))}`
                          : visitor.lastSeen
                          ? `Last seen ${formatTimeIST(visitor.lastSeen)}`
                          : `Last: ${formatTimeIST(visitor.lastVisit)}`}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm text-white">
                        {visitor.referralInfo?.source || "Direct"}
                      </div>
                      <div className="text-xs text-gray-400">
                        {visitor.referralInfo?.firstPage || "/"}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      {visitor.status === "active" ? (
                        <button
                          onClick={() =>
                            onSingleAction(
                              visitor.uuid,
                              "ban",
                              "Banned by admin"
                            )
                          }
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs transition-colors"
                        >
                          Ban
                        </button>
                      ) : (
                        <button
                          onClick={() => onSingleAction(visitor.uuid, "unban")}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs transition-colors"
                        >
                          Unban
                        </button>
                      )}
                      <button
                        onClick={() =>
                          onEditNotes(visitor.uuid, visitor.adminNotes)
                        }
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs transition-colors flex items-center space-x-1"
                        title="Edit admin notes"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        <span>Notes</span>
                      </button>
                      <button
                        onClick={() => onDeleteVisitors([visitor.uuid])}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs transition-colors flex items-center space-x-1"
                        title="Delete visitor"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Appeals tab component
function AppealsTab({
  appeals,
  stats,
  onAppealAction,
  onDeleteAppeals,
  onRefresh,
}: AppealsTabProps) {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Total Appeals</p>
              <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Pending Appeals</p>
              <p className="text-3xl font-bold text-amber-600">
                {stats.pending}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Appeals list */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-900">Ban Appeals</h3>
          <div className="flex space-x-2">
            <button
              onClick={onRefresh}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg transition-colors font-medium"
            >
              Refresh
            </button>
            {appeals.length > 0 && (
              <button
                onClick={() => onDeleteAppeals(appeals.map((a) => a.id))}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 font-medium"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <span>Delete All</span>
              </button>
            )}
          </div>
        </div>

        <div className="divide-y divide-slate-200">
          {appeals.map((appeal: BanAppeal) => (
            <div key={appeal.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-medium text-slate-900">
                    {appeal.subject}
                  </h4>
                  <p className="text-sm text-slate-600">
                    From: {appeal.name} ({appeal.email})
                  </p>
                  <p className="text-sm text-slate-500">
                    UUID: {appeal.uuid} • Submitted:{" "}
                    {new Date(appeal.submittedAt).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    appeal.status === "pending"
                      ? "bg-amber-100 text-amber-800"
                      : appeal.status === "approved"
                      ? "bg-emerald-100 text-emerald-800"
                      : appeal.status === "rejected"
                      ? "bg-red-100 text-red-800"
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {appeal.status}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-sm text-slate-600 mb-2 font-medium">
                  Original ban reason:
                </p>
                <p className="text-sm text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
                  {appeal.banReason}
                </p>
              </div>

              <div className="mb-4">
                <p className="text-sm text-slate-600 mb-2 font-medium">Appeal message:</p>
                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {appeal.message}
                </p>
              </div>

              <div className="flex space-x-2">
                {appeal.status === "pending" && (
                  <>
                    <button
                      onClick={() =>
                        onAppealAction(
                          appeal.id,
                          "approved",
                          "Appeal approved by admin"
                        )
                      }
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() =>
                        onAppealAction(
                          appeal.id,
                          "rejected",
                          "Appeal rejected by admin"
                        )
                      }
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                    >
                      Reject
                    </button>
                  </>
                )}
                <button
                  onClick={() => onDeleteAppeals([appeal.id])}
                  className="bg-slate-500 hover:bg-slate-600 text-white px-3 py-2 rounded-lg transition-colors flex items-center space-x-1 font-medium"
                  title="Delete appeal"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <span>Delete</span>
                </button>
              </div>

              {appeal.reviewedAt && (
                <div className="mt-4 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  Reviewed by {appeal.reviewedBy} on{" "}
                  {new Date(appeal.reviewedAt).toLocaleString()}
                  {appeal.reviewNotes && (
                    <div className="mt-1 text-xs">
                      Notes: {appeal.reviewNotes}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
