"use client";

import React, { useState, useEffect } from 'react';
import { AdminAITabProps, AIQuestion, AdminQuestionFormData } from '@/components/ai-assistant/types';
import QuestionFormModal from './QuestionFormModal';
import { showSuccessToast, showErrorToast } from '@/components/ToastSystem';

const AdminAITab: React.FC<AdminAITabProps> = ({
  questions,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onRefresh,
  isLoading
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<AIQuestion | undefined>();
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        await onEditQuestion(editingQuestion.id, data);
        showSuccessToast('Question updated successfully');
      } else {
        await onAddQuestion(data);
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

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      return;
    }

    try {
      await onDeleteQuestion(id);
      showSuccessToast('Question deleted successfully');
      setSelectedQuestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
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
      const deletePromises = Array.from(selectedQuestions).map(id => onDeleteQuestion(id));
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
    if (selectedQuestions.size === questions.length) {
      setSelectedQuestions(new Set());
    } else {
      setSelectedQuestions(new Set(questions.map(q => q.id)));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-white">AI Assistant Management</h2>
          <p className="text-gray-400 text-sm mt-1">
            Manage predefined questions and answers for the AI assistant
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
          
          <button
            onClick={handleAddQuestion}
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Question</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Total Questions</p>
              <p className="text-3xl font-bold text-slate-900">{questions.length}</p>
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
                {questions.filter(q => q.fileUrl).length}
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
                {questions.filter(q => q.anchorLink).length}
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
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
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-500">Loading questions...</p>
            </div>
          </div>
        ) : questions.length === 0 ? (
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
                      checked={selectedQuestions.size === questions.length && questions.length > 0}
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
                {questions.map((question) => (
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
  );
};

export default AdminAITab;