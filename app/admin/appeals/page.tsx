"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/utils/adminAuth";
import {
  showSuccessToast,
  showErrorToast,
} from "@/components/ToastSystem";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { ThemeProvider } from "@/components/admin/ThemeProvider";
import UnifiedNavbar from "@/components/admin/UnifiedNavbar";
import { formatPolicyReferenceForDisplay } from "@/utils/policyReference";

interface BanAppeal {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  uuid: string;
  banReason: string;
  policyReference?: string;
  status: "pending" | "reviewed" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

export default function AppealsPage() {
  const router = useRouter();
  const { checkAuth } = useAdminAuth();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [appeals, setAppeals] = useState<BanAppeal[]>([]);
  const [appealStats, setAppealStats] = useState({ total: 0, pending: 0 });

  // Real-time listener
  const appealsUnsubscribeRef = useRef<(() => void) | null>(null);
  const [isRealTimeActive, setIsRealTimeActive] = useState(false);

  useEffect(() => {
    verifyAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAppeals();
      startRealTimeListener();
    }

    return () => {
      if (appealsUnsubscribeRef.current) {
        appealsUnsubscribeRef.current();
      }
    };
  }, [isAuthenticated]);

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
      setAppeals(Array.isArray(data.appeals) ? data.appeals : []);
      setAppealStats(data.stats || { total: 0, pending: 0 });
    } catch (error) {
      console.error("Error fetching appeals:", error);
      showErrorToast(`Failed to load appeals: ${error instanceof Error ? error.message : "Unknown error"}`);
      setAppeals([]);
      setAppealStats({ total: 0, pending: 0 });
    }
  };

  const startRealTimeListener = () => {
    if (isRealTimeActive) return;

    try {
      const appealsQuery = query(
        collection(db as any, "ban_appeals"),
        orderBy("submittedAt", "desc")
      );

      const appealsUnsubscribe = onSnapshot(
        appealsQuery,
        (snapshot) => {
          if (!snapshot.metadata.fromCache) {
            fetchAppeals();
          }
        },
        (error) => {
          console.error("Appeals listener error:", error);
        }
      );

      appealsUnsubscribeRef.current = appealsUnsubscribe;
      setIsRealTimeActive(true);
    } catch (error) {
      console.error("Failed to start real-time listener:", error);
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
        headers: { "Content-Type": "application/json" },
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
      } else {
        throw new Error(`Failed to ${status} appeal`);
      }
    } catch (error) {
      console.error(`Error ${status}ing appeal:`, error);
      showErrorToast(`Failed to ${status} appeal`);
    }
  };

  const handleDeleteAppeals = async (appealIds: string[]) => {
    if (!confirm(`Are you sure you want to delete ${appealIds.length} appeal(s)?`)) {
      return;
    }

    try {
      const deletePromises = appealIds.map(async (appealId) => {
        const response = await fetch("/api/contact/ban-appeal", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ appealId }),
        });

        if (!response.ok) {
          throw new Error(`Failed to delete ${appealId}`);
        }
        return appealId;
      });

      await Promise.all(deletePromises);
      showSuccessToast(`Successfully deleted ${appealIds.length} appeal(s)`);
      fetchAppeals();
    } catch (error) {
      console.error("Delete operation failed:", error);
      showErrorToast("Failed to delete appeals. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Loading Appeals...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-slate-50 page-container">
        {/* Unified Navbar */}
        <UnifiedNavbar
          visitorStats={{ total: 0, active: 0, banned: 0 }}
          appealStats={appealStats}
          aiQuestionCount={0}
          isRealTimeActive={isRealTimeActive}
        />

        {/* Main Content */}
        <main className="px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Total Appeals</p>
                  <p className="text-3xl font-bold text-slate-900">{appealStats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Pending Appeals</p>
                  <p className="text-3xl font-bold text-amber-600">{appealStats.pending}</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-900">Ban Appeals</h2>
              <div className="flex space-x-2">
                <button
                  onClick={fetchAppeals}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  Refresh
                </button>
                {appeals.length > 0 && (
                  <button
                    onClick={() => handleDeleteAppeals(appeals.map((a) => a.id))}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                  >
                    Delete All
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Appeals List */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="divide-y divide-slate-200">
              {appeals.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-slate-900 text-lg font-medium mb-2">No appeals found</h3>
                  <p className="text-slate-500 text-sm">No ban appeals have been submitted yet</p>
                </div>
              ) : (
                appeals.map((appeal) => (
                  <div key={appeal.id} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-lg font-medium text-slate-900">{appeal.subject}</h4>
                        <p className="text-sm text-slate-600">
                          From: {appeal.name} ({appeal.email})
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                          <span>UUID: {appeal.uuid}</span>
                          {appeal.policyReference && (
                            <>
                              <span>•</span>
                              <span className="font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                                Policy: {formatPolicyReferenceForDisplay(appeal.policyReference)}
                              </span>
                            </>
                          )}
                          <span>•</span>
                          <span>Submitted: {new Date(appeal.submittedAt).toLocaleString()}</span>
                        </div>
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
                      <p className="text-sm text-slate-600 mb-2 font-medium">Original ban reason:</p>
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
                            onClick={() => handleAppealAction(appeal.id, "approved", "Appeal approved by admin")}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAppealAction(appeal.id, "rejected", "Appeal rejected by admin")}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteAppeals([appeal.id])}
                        className="bg-slate-500 hover:bg-slate-600 text-white px-3 py-2 rounded-lg transition-colors font-medium"
                      >
                        Delete
                      </button>
                    </div>

                    {appeal.reviewedAt && (
                      <div className="mt-4 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        Reviewed by {appeal.reviewedBy} on {new Date(appeal.reviewedAt).toLocaleString()}
                        {appeal.reviewNotes && (
                          <div className="mt-1 text-xs">Notes: {appeal.reviewNotes}</div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}