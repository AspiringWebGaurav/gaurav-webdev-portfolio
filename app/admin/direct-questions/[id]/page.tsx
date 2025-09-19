"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdminAuth } from "@/utils/adminAuth";
import {
  showSuccessToast,
  showErrorToast,
} from "@/components/ToastSystem";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
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

export default function AdminDirectQuestionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { checkAuth } = useAdminAuth();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [question, setQuestion] = useState<DirectQuestion | null>(null);
  const [adminReply, setAdminReply] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const questionId = params.id as string;

  // Verify authentication
  useEffect(() => {
    verifyAuth();
  }, []);

  // Setup real-time listener for the question
  useEffect(() => {
    if (isAuthenticated && questionId) {
      setupQuestionListener();
    }
  }, [isAuthenticated, questionId]);

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

  const setupQuestionListener = () => {
    const questionRef = doc(db, "directQuestions", questionId);

    const unsubscribe = onSnapshot(
      questionRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const questionData = {
            id: docSnapshot.id,
            ...docSnapshot.data(),
          } as DirectQuestion;
          
          setQuestion(questionData);
          setAdminReply(questionData.adminReply || '');
        } else {
          showErrorToast("Question not found");
          router.push("/admin/direct-questions");
        }
      },
      (error) => {
        console.error("Question listener error:", error);
        showErrorToast("Failed to load question details");
      }
    );

    return unsubscribe;
  };

  const handleSubmitReply = async () => {
    if (!question || !adminReply.trim()) {
      showErrorToast("Please enter a reply");
      return;
    }

    setIsSubmitting(true);

    try {
      const questionRef = doc(db, "directQuestions", question.id);
      
      await updateDoc(questionRef, {
        adminReply: adminReply.trim(),
        status: 'answered',
        answeredAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        unreadForVisitor: true,
      });

      showSuccessToast("Reply sent successfully!");
    } catch (error) {
      console.error("Error submitting reply:", error);
      showErrorToast("Failed to send reply. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (newStatus: 'unanswered' | 'answered' | 'archived') => {
    if (!question) return;

    setIsProcessing(true);

    try {
      const response = await fetch(`/api/admin/direct-questions/${question.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: newStatus,
          reviewNotes: `Status updated to ${newStatus} by admin`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to update status: ${response.statusText}`);
      }

      const data = await response.json();
      showSuccessToast(data.data?.message || `Question ${newStatus} successfully!`);
    } catch (error) {
      console.error("Error updating status:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update status. Please try again.";
      showErrorToast(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async (permanent: boolean) => {
    if (!question) return;

    setIsProcessing(true);
    
    try {
      const response = await fetch(`/api/admin/direct-questions/${question.id}${permanent ? '?hard=true' : ''}`, {
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
      
      // Redirect back to questions list
      router.push('/admin/direct-questions');
    } catch (error) {
      console.error("Error deleting question:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete question";
      showErrorToast(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      unanswered: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Pending', icon: '⏳' },
      answered: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Answered', icon: '✅' },
      archived: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Archived', icon: '📁' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.unanswered;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full border ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Loading Question Details...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !question) {
    return null;
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-slate-50">
        <UnifiedNavbar
          visitorStats={{ total: 0, active: 0, banned: 0 }}
          appealStats={{ total: 0, pending: 0 }}
          aiQuestionCount={0}
          isRealTimeActive={true}
        />

        <main className="px-6 lg:px-8 py-8">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center space-x-2 text-sm text-slate-600 mb-6">
            <button
              onClick={() => router.push("/admin/direct-questions")}
              className="hover:text-blue-600 transition-colors"
            >
              Direct Questions
            </button>
            <span>/</span>
            <span className="text-slate-900">Question Details</span>
          </nav>

          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Question Details</h1>
              <p className="text-slate-600 mt-2">Manage and respond to visitor question</p>
            </div>
            
            <div className="flex items-center space-x-3">
              {getStatusBadge(question.status)}
              
              {question.unreadForVisitor && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-1 animate-pulse"></div>
                  Unread by visitor
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Question Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-xl font-semibold text-slate-900">Question</h2>
                  <div className="text-sm text-slate-500">
                    {question.createdAt && question.createdAt.toDate
                      ? formatTimeIST(question.createdAt.toDate())
                      : 'Just now'
                    }
                  </div>
                </div>
                
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
                  <p className="text-slate-900 leading-relaxed whitespace-pre-wrap">
                    {question.question}
                  </p>
                </div>

                {/* Visitor Info */}
                <div className="flex items-center text-sm text-slate-500 space-x-4">
                  <span>From: {question.visitorUuid.substring(0, 8)}...</span>
                  <span>Page: {question.metadata.pagePath}</span>
                  {question.metadata.ipHash && <span>IP: {question.metadata.ipHash}</span>}
                </div>
              </div>

              {/* Admin Reply Section */}
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  {question.adminReply ? 'Your Reply' : 'Send Reply'}
                </h2>

                {question.adminReply && question.status === 'answered' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-800">Current Reply:</span>
                      {question.answeredAt && question.answeredAt.toDate && (
                        <span className="text-sm text-green-600">
                          {formatTimeIST(question.answeredAt.toDate())}
                        </span>
                      )}
                    </div>
                    <p className="text-green-900 leading-relaxed whitespace-pre-wrap">
                      {question.adminReply}
                    </p>
                  </div>
                )}

                <textarea
                  value={adminReply}
                  onChange={(e) => setAdminReply(e.target.value)}
                  placeholder="Enter your reply to the visitor..."
                  rows={6}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSubmitting}
                />

                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-slate-500">
                    {adminReply.length}/2000 characters
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setAdminReply('')}
                      disabled={isSubmitting || !adminReply}
                      className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors disabled:opacity-50"
                    >
                      Clear
                    </button>
                    
                    <button
                      onClick={handleSubmitReply}
                      disabled={isSubmitting || !adminReply.trim()}
                      className="bg-blue-500 hover:bg-blue-600 disabled:bg-slate-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                    >
                      {isSubmitting && (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      )}
                      <span>{question.adminReply ? 'Update Reply' : 'Send Reply'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status Management */}
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Status Management</h3>
                
                <div className="space-y-3">
                  <button
                    onClick={() => handleStatusUpdate('answered')}
                    disabled={isProcessing || question.status === 'answered'}
                    className="w-full flex items-center justify-center px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-slate-400 text-white rounded-lg font-medium transition-colors"
                  >
                    ✅ Mark as Answered
                  </button>
                  
                  <button
                    onClick={() => handleStatusUpdate('unanswered')}
                    disabled={isProcessing || question.status === 'unanswered'}
                    className="w-full flex items-center justify-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-slate-400 text-white rounded-lg font-medium transition-colors"
                  >
                    ⏳ Mark as Pending
                  </button>
                  
                  <button
                    onClick={() => handleStatusUpdate('archived')}
                    disabled={isProcessing || question.status === 'archived'}
                    className="w-full flex items-center justify-center px-4 py-2 bg-slate-500 hover:bg-slate-600 disabled:bg-slate-400 text-white rounded-lg font-medium transition-colors"
                  >
                    📁 Archive Question
                  </button>
                  
                  <button
                    onClick={handleDeleteClick}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-slate-400 text-white rounded-lg font-medium transition-colors"
                  >
                    🗑️ Delete Question
                  </button>
                </div>
              </div>

              {/* Question Metadata */}
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Question Details</h3>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-slate-700">Visitor ID:</span>
                    <p className="text-slate-600 break-all">{question.visitorUuid}</p>
                  </div>
                  
                  <div>
                    <span className="font-medium text-slate-700">Page Context:</span>
                    <p className="text-slate-600">{question.metadata.pagePath}</p>
                  </div>

                  {question.metadata.referrer && (
                    <div>
                      <span className="font-medium text-slate-700">Referrer:</span>
                      <p className="text-slate-600 break-all">{question.metadata.referrer}</p>
                    </div>
                  )}

                  <div>
                    <span className="font-medium text-slate-700">User Agent:</span>
                    <p className="text-slate-600 text-xs break-all">{question.metadata.userAgent}</p>
                  </div>

                  {question.metadata.language && (
                    <div>
                      <span className="font-medium text-slate-700">Language:</span>
                      <p className="text-slate-600">{question.metadata.language}</p>
                    </div>
                  )}

                  {question.metadata.timezone && (
                    <div>
                      <span className="font-medium text-slate-700">Timezone:</span>
                      <p className="text-slate-600">{question.metadata.timezone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
                
                <div className="space-y-2">
                  <button
                    onClick={() => router.push(`/admin/direct-questions`)}
                    className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    ← Back to Questions List
                  </button>
                  
                  <button
                    onClick={() => window.open(`/${question.visitorUuid}`, '_blank')}
                    className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    🔗 View Visitor's Portfolio
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Delete Confirmation Modal */}
        <DeleteQuestionModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
          questionCount={1}
          isBulk={false}
          questionPreview={question?.question}
        />
      </div>
    </ThemeProvider>
  );
}