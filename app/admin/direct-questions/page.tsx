"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/utils/adminAuth";
import {
  showSuccessToast,
  showErrorToast,
  showAdminActionToast,
} from "@/components/ToastSystem";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { ThemeProvider } from "@/components/admin/ThemeProvider";
import UnifiedNavbar from "@/components/admin/UnifiedNavbar";
import DeleteQuestionModal from "@/components/admin/DeleteQuestionModal";
import { formatTimeIST } from "@/utils/timeFormat";

interface DirectQuestion {
  id: string;
  visitorUuid: string;
  question: string;
  status: 'unanswered' | 'answered' | 'archived';
  createdAt: any;
  updatedAt: any;
  answeredAt: any;
  adminReply: string | null;
  unreadForVisitor: boolean;
  metadata: {
    pagePath: string;
    referrer: string | null;
    ipHash: string | null;
    userAgent?: string;
    language?: string;
    screenResolution?: string;
    timezone?: string;
  };
}

interface DirectQuestionStats {
  total: number;
  unanswered: number;
  answered: number;
  archived: number;
}

export default function AdminDirectQuestionsPage() {
  const router = useRouter();
  const { checkAuth, logout } = useAdminAuth();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState<DirectQuestion[]>([]);
  const [stats, setStats] = useState<DirectQuestionStats>({
    total: 0,
    unanswered: 0,
    answered: 0,
    archived: 0,
  });
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<'all' | 'unanswered' | 'answered' | 'archived'>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRealTimeActive, setIsRealTimeActive] = useState(true);
  
  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'single' | 'bulk';
    questionIds: string[];
    questionPreview?: string;
  } | null>(null);

  // Verify authentication
  useEffect(() => {
    verifyAuth();
  }, []);

  // Setup real-time listener
  useEffect(() => {
    if (isAuthenticated && isRealTimeActive) {
      setupRealTimeListener();
    }
  }, [isAuthenticated, isRealTimeActive, statusFilter]);

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

  const setupRealTimeListener = () => {
    let questionsQuery = query(
      collection(db, "directQuestions")
    );

    // Apply status filter
    if (statusFilter !== 'all') {
      questionsQuery = query(questionsQuery, where("status", "==", statusFilter));
    }

    const unsubscribe = onSnapshot(
      questionsQuery,
      (querySnapshot) => {
        const questionsData: DirectQuestion[] = [];
        querySnapshot.forEach((doc) => {
          questionsData.push({
            id: doc.id,
            ...doc.data(),
          } as DirectQuestion);
        });

        // Sort manually by creation date (newest first)
        questionsData.sort((a, b) => {
          const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return bTime - aTime;
        });

        setQuestions(questionsData);
        calculateStats(questionsData);
        
        console.log(`📊 Loaded ${questionsData.length} questions from Firebase`);
      },
      (error) => {
        console.error("Real-time listener error:", error);
        showErrorToast("Real-time updates disconnected. Retrying...");
        
        // Retry with a simpler query
        setTimeout(() => {
          if (isRealTimeActive) {
            setupRealTimeListener();
          }
        }, 3000);
      }
    );

    return unsubscribe;
  };

  const calculateStats = (questionsData: DirectQuestion[]) => {
    // Filter out deleted questions for stats
    const activeQuestions = questionsData.filter(q => !(q as any).isDeleted);
    
    const stats = {
      total: activeQuestions.length,
      unanswered: activeQuestions.filter(q => q.status === 'unanswered').length,
      answered: activeQuestions.filter(q => q.status === 'answered').length,
      archived: activeQuestions.filter(q => q.status === 'archived').length,
    };
    setStats(stats);
  };

  const handleQuestionClick = (question: DirectQuestion) => {
    router.push(`/admin/direct-questions/${question.id}`);
  };

  const handleBulkAction = async (action: string) => {
    if (selectedQuestions.size === 0) {
      showErrorToast("Please select questions first");
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/admin/direct-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action,
          questionIds: Array.from(selectedQuestions),
          data: action === 'bulk_archive' ? {} : { status: action.replace('bulk_', '') }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        showSuccessToast(data.data.message);
        setSelectedQuestions(new Set());
      } else {
        throw new Error(`Failed to ${action}`);
      }
    } catch (error) {
      console.error(`Error ${action}:`, error);
      showErrorToast(`Failed to ${action} questions`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle delete operations
  const handleDeleteClick = (type: 'single' | 'bulk', questionId?: string, questionPreview?: string) => {
    if (type === 'single' && questionId) {
      setDeleteTarget({
        type: 'single',
        questionIds: [questionId],
        questionPreview
      });
    } else if (type === 'bulk' && selectedQuestions.size > 0) {
      setDeleteTarget({
        type: 'bulk',
        questionIds: Array.from(selectedQuestions)
      });
    } else {
      showErrorToast("Please select questions to delete");
      return;
    }
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async (permanent: boolean) => {
    if (!deleteTarget) return;

    setIsProcessing(true);
    
    try {
      if (deleteTarget.type === 'bulk') {
        // Bulk delete
        const response = await fetch('/api/admin/direct-questions', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            questionIds: deleteTarget.questionIds,
            permanent
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || 'Failed to delete questions');
        }

        const data = await response.json();
        showSuccessToast(data.data?.message || `${deleteTarget.questionIds.length} questions deleted`);
        setSelectedQuestions(new Set());
      } else {
        // Single delete
        const questionId = deleteTarget.questionIds[0];
        const response = await fetch(`/api/admin/direct-questions/${questionId}${permanent ? '?hard=true' : ''}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || 'Failed to delete question');
        }

        const data = await response.json();
        showSuccessToast(data.data?.message || 'Question deleted successfully');
      }
    } catch (error) {
      console.error("Error deleting questions:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete questions";
      showErrorToast(errorMessage);
    } finally {
      setIsProcessing(false);
      setDeleteTarget(null);
    }
  };

  const toggleQuestionSelection = (questionId: string) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
  };

  const selectAll = () => {
    if (selectedQuestions.size === questions.length) {
      setSelectedQuestions(new Set());
    } else {
      setSelectedQuestions(new Set(questions.map(q => q.id)));
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      unanswered: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      answered: { color: 'bg-green-100 text-green-800', label: 'Answered' },
      archived: { color: 'bg-gray-100 text-gray-800', label: 'Archived' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.unanswered;
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const filteredQuestions = useMemo(() => {
    // Filter out deleted questions and apply status filter
    const activeQuestions = questions.filter(q => !(q as any).isDeleted);
    return statusFilter === 'all' ? activeQuestions : activeQuestions.filter(q => q.status === statusFilter);
  }, [questions, statusFilter]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Loading Direct Questions...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-slate-50">
        <UnifiedNavbar
          visitorStats={{ total: 0, active: 0, banned: 0 }}
          appealStats={{ total: 0, pending: 0 }}
          aiQuestionCount={0}
          isRealTimeActive={isRealTimeActive}
          onLiveSyncToggle={setIsRealTimeActive}
        />

        <main className="px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Direct Questions</h1>
            <p className="text-slate-600 mt-2">Manage visitor questions and provide direct answers</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Total Questions</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.unanswered}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Answered</p>
                  <p className="text-3xl font-bold text-green-600">{stats.answered}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Archived</p>
                  <p className="text-3xl font-bold text-slate-600">{stats.archived}</p>
                </div>
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="Filter questions by status"
                  title="Filter questions by status"
                >
                  <option value="all">All Questions ({stats.total})</option>
                  <option value="unanswered">Pending ({stats.unanswered})</option>
                  <option value="answered">Answered ({stats.answered})</option>
                  <option value="archived">Archived ({stats.archived})</option>
                </select>

                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${isRealTimeActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="text-sm text-slate-600">
                    {isRealTimeActive ? 'Live updates' : 'Static view'}
                  </span>
                </div>
              </div>

              {selectedQuestions.size > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-slate-600">
                    {selectedQuestions.size} selected
                  </span>
                  <button
                    onClick={() => handleBulkAction('bulk_update_status')}
                    disabled={isProcessing}
                    className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                  >
                    Mark Answered
                  </button>
                  <button
                    onClick={() => handleBulkAction('bulk_archive')}
                    disabled={isProcessing}
                    className="bg-slate-500 hover:bg-slate-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                  >
                    Archive
                  </button>
                  <button
                    onClick={() => handleDeleteClick('bulk')}
                    disabled={isProcessing}
                    className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Questions List */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {filteredQuestions.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No questions found</h3>
                <p className="text-slate-500">
                  {statusFilter === 'all' 
                    ? 'No questions have been submitted yet.' 
                    : `No ${statusFilter} questions found.`
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left">
                        <input
                          type="checkbox"
                          checked={selectedQuestions.size === filteredQuestions.length && filteredQuestions.length > 0}
                          onChange={selectAll}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          aria-label="Select all questions"
                          title="Select all questions"
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Question
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Visitor
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {filteredQuestions.map((question) => (
                      <tr 
                        key={question.id} 
                        className="hover:bg-slate-50 cursor-pointer"
                        onClick={() => handleQuestionClick(question)}
                      >
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedQuestions.has(question.id)}
                            onChange={() => toggleQuestionSelection(question.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            aria-label={`Select question from ${question.visitorUuid.substring(0, 8)}`}
                            title={`Select question from ${question.visitorUuid.substring(0, 8)}`}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-900 font-medium line-clamp-2">
                            {question.question}
                          </div>
                          {question.unreadForVisitor && (
                            <div className="flex items-center mt-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                              <span className="text-xs text-green-600 font-medium">New reply pending</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(question.status)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-900">
                            {question.visitorUuid.substring(0, 8)}...
                          </div>
                          <div className="text-sm text-slate-500">
                            {question.metadata?.ipHash}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-900">
                            {question.createdAt && question.createdAt.toDate
                              ? formatTimeIST(question.createdAt.toDate())
                              : 'Just now'
                            }
                          </div>
                          <div className="text-sm text-slate-500">
                            {question.metadata?.pagePath}
                          </div>
                        </td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleQuestionClick(question)}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                            >
                              {question.status === 'unanswered' ? 'Reply' : 'View'}
                            </button>
                            <button
                              onClick={() => handleDeleteClick('single', question.id, question.question)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                              title="Delete question"
                            >
                              🗑️
                            </button>
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

        {/* Delete Confirmation Modal */}
        <DeleteQuestionModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setDeleteTarget(null);
          }}
          onConfirm={handleConfirmDelete}
          questionCount={deleteTarget?.questionIds.length || 0}
          isBulk={deleteTarget?.type === 'bulk'}
          questionPreview={deleteTarget?.questionPreview}
        />
      </div>
    </ThemeProvider>
  );
}