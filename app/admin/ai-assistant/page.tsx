"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/utils/adminAuth";
import {
  showSuccessToast,
  showErrorToast,
} from "@/components/ToastSystem";
import { ThemeProvider } from "@/components/admin/ThemeProvider";
import { AIQuestion, AdminQuestionFormData } from "@/components/ai-assistant/types";
import QuestionFormModal from "@/components/admin/QuestionFormModal";
import UnifiedNavbar from "@/components/admin/UnifiedNavbar";

export default function AIAssistantPage() {
  const router = useRouter();
  const { checkAuth } = useAdminAuth();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [aiQuestions, setAiQuestions] = useState<AIQuestion[]>([]);
  const [aiQuestionsLoading, setAiQuestionsLoading] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<AIQuestion | undefined>();
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    verifyAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAIQuestions();
    }
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
      setAiQuestions(Array.isArray(data.data?.questions) ? data.data.questions : []);
    } catch (error) {
      console.error('Error fetching AI questions:', error);
      showErrorToast(`Failed to load AI questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setAiQuestions([]);
    } finally {
      setAiQuestionsLoading(false);
    }
  };

  const handleAddQuestion = () => {
    setEditingQuestion(undefined);
    setShowModal(true);
  };

  const handleEditQuestion = (question: AIQuestion) => {
    setEditingQuestion(question);
    setShowModal(true);
  };

  const handleSubmitQuestion = async (data: AdminQuestionFormData) => {
    try {
      setIsSubmitting(true);
      
      if (editingQuestion) {
        await handleEditAIQuestion(editingQuestion.id, data);
        showSuccessToast('Question updated successfully');
      } else {
        await handleAddAIQuestion(data);
        showSuccessToast('Question added successfully');
      }
      
      setShowModal(false);
      setEditingQuestion(undefined);
    } catch (error) {
      console.error('Error submitting question:', error);
      showErrorToast('Failed to save question. Please try again.');
    } finally {
      setIsSubmitting(false);
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

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/ai-assistant/questions?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete question');
      }

      showSuccessToast('Question deleted successfully');
      setSelectedQuestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      await fetchAIQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      showErrorToast('Failed to delete question. Please try again.');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedQuestions.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedQuestions.size} question(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      const deletePromises = Array.from(selectedQuestions).map(id => handleDeleteQuestion(id));
      await Promise.all(deletePromises);
      
      showSuccessToast(`${selectedQuestions.size} question(s) deleted successfully`);
      setSelectedQuestions(new Set());
    } catch (error) {
      console.error('Error deleting questions:', error);
      showErrorToast('Failed to delete some questions. Please try again.');
    }
  };

  const toggleQuestionSelection = (id: string) => {
    setSelectedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAllQuestions = () => {
    if (selectedQuestions.size === aiQuestions.length) {
      setSelectedQuestions(new Set());
    } else {
      setSelectedQuestions(new Set(aiQuestions.map(q => q.id)));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Loading AI Assistant...</p>
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
          appealStats={{ total: 0, pending: 0 }}
          aiQuestionCount={aiQuestions.length}
        />

        {/* Main Content */}
        <main className="px-6 lg:px-8 py-8">
          {/* Page Header with Add Button */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">AI Assistant Questions</h2>
              <p className="text-slate-600 mt-1">Manage questions and answers for the AI assistant</p>
            </div>
            <button
              onClick={handleAddQuestion}
              disabled={aiQuestionsLoading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 font-medium shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Question</span>
            </button>
          </div>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Total Questions</p>
                  <p className="text-3xl font-bold text-slate-900">{aiQuestions.length}</p>
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
                  <p className="text-slate-500 text-sm font-medium">With Files</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {aiQuestions.filter(q => q.fileUrl).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">With Links</p>
                  <p className="text-3xl font-bold text-emerald-600">
                    {aiQuestions.filter(q => q.anchorLink).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedQuestions.size > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-blue-700 text-sm font-medium">
                  {selectedQuestions.size} question(s) selected
                </span>
                <button
                  onClick={handleBulkDelete}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                >
                  Delete Selected
                </button>
              </div>
            </div>
          )}

          {/* Questions List */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {aiQuestionsLoading ? (
              <div className="flex items-center justify-center p-12">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-500">Loading questions...</p>
                </div>
              </div>
            ) : aiQuestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-slate-900 text-lg font-medium mb-2">No questions yet</h3>
                <p className="text-slate-500 text-sm mb-4">
                  Add your first question to get started with the AI assistant
                </p>
                <button
                  onClick={handleAddQuestion}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors font-medium"
                >
                  Add First Question
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left">
                        <input
                          type="checkbox"
                          checked={selectedQuestions.size === aiQuestions.length && aiQuestions.length > 0}
                          onChange={selectAllQuestions}
                          title="Select all questions"
                          aria-label="Select all questions"
                          className="rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Question
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Answer
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Attachments
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {aiQuestions.map((question) => (
                      <tr key={question.id} className={`hover:bg-slate-50 transition-colors ${
                        selectedQuestions.has(question.id)
                          ? 'bg-blue-50 border-l-4 border-blue-500'
                          : ''
                      }`}>
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedQuestions.has(question.id)}
                            onChange={() => toggleQuestionSelection(question.id)}
                            title={`Select question: ${question.question}`}
                            aria-label={`Select question: ${question.question}`}
                            className="rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className={`text-sm font-medium max-w-xs truncate ${
                            selectedQuestions.has(question.id)
                              ? 'text-blue-900'
                              : 'text-slate-900'
                          }`}>
                            {question.question}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`text-sm max-w-xs truncate ${
                            selectedQuestions.has(question.id)
                              ? 'text-blue-700'
                              : 'text-slate-600'
                          }`}>
                            {question.answer}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {question.anchorLink && (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                selectedQuestions.has(question.id)
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-emerald-100 text-emerald-600'
                              }`}>
                                Link
                              </span>
                            )}
                            {question.fileUrl && (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                selectedQuestions.has(question.id)
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-purple-100 text-purple-600'
                              }`}>
                                File
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`text-sm ${
                            selectedQuestions.has(question.id)
                              ? 'text-blue-600'
                              : 'text-slate-500'
                          }`}>
                            {new Date(question.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditQuestion(question)}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs transition-colors font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(question.id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs transition-colors font-medium"
                            >
                              Delete
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

        {/* Question Form Modal */}
        <QuestionFormModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingQuestion(undefined);
          }}
          onSubmit={handleSubmitQuestion}
          editingQuestion={editingQuestion}
          isLoading={isSubmitting}
        />
      </div>
    </ThemeProvider>
  );
}