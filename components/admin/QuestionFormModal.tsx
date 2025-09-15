"use client";

import React, { useState, useEffect } from 'react';
import { QuestionFormModalProps, AdminQuestionFormData } from '@/components/ai-assistant/types';

interface FileUploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  success: boolean;
}

const QuestionFormModal: React.FC<QuestionFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingQuestion,
  isLoading
}) => {
  const [formData, setFormData] = useState<AdminQuestionFormData>({
    question: '',
    answer: '',
    anchorLink: '',
    file: undefined
  });
  const [removeFile, setRemoveFile] = useState(false);
  const [fileUploadState, setFileUploadState] = useState<FileUploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    success: false
  });

  useEffect(() => {
    if (editingQuestion) {
      setFormData({
        question: editingQuestion.question,
        answer: editingQuestion.answer,
        anchorLink: editingQuestion.anchorLink || '',
        file: undefined
      });
      setRemoveFile(false);
    } else {
      setFormData({
        question: '',
        answer: '',
        anchorLink: '',
        file: undefined
      });
      setRemoveFile(false);
    }
  }, [editingQuestion, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.question.trim() || !formData.answer.trim()) {
      return;
    }

    try {
      await onSubmit({
        ...formData,
        question: formData.question.trim(),
        answer: formData.answer.trim(),
        anchorLink: formData.anchorLink?.trim() || undefined
      });
      
      // Reset form
      setFormData({
        question: '',
        answer: '',
        anchorLink: '',
        file: undefined
      });
      setRemoveFile(false);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset upload state
    setFileUploadState({
      isUploading: true,
      progress: 0,
      error: null,
      success: false
    });

    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      setFileUploadState({
        isUploading: false,
        progress: 0,
        error: 'File size must be less than 10MB',
        success: false
      });
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];

    if (!allowedTypes.includes(file.type)) {
      setFileUploadState({
        isUploading: false,
        progress: 0,
        error: 'File type not supported. Please upload PDF, DOC, DOCX, TXT, JPG, JPEG, or PNG files.',
        success: false
      });
      return;
    }

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setFileUploadState(prev => ({
        ...prev,
        progress: Math.min(prev.progress + Math.random() * 30, 90)
      }));
    }, 200);

    try {
      // Set file data
      setFormData(prev => ({
        ...prev,
        file: {
          file,
          name: file.name,
          size: file.size,
          type: file.type
        }
      }));
      setRemoveFile(false);

      // Complete upload
      clearInterval(progressInterval);
      setFileUploadState({
        isUploading: false,
        progress: 100,
        error: null,
        success: true
      });

      // Reset success state after 3 seconds
      setTimeout(() => {
        setFileUploadState(prev => ({ ...prev, success: false, progress: 0 }));
      }, 3000);

    } catch (error) {
      clearInterval(progressInterval);
      setFileUploadState({
        isUploading: false,
        progress: 0,
        error: 'Failed to process file. Please try again.',
        success: false
      });
    }
  };

  const handleRemoveFile = () => {
    setFormData(prev => ({ ...prev, file: undefined }));
    setFileUploadState({
      isUploading: false,
      progress: 0,
      error: null,
      success: false
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-black-100/95 backdrop-blur-md border border-white/[0.2] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.1]">
          <h2 className="text-xl font-semibold text-white">
            {editingQuestion ? 'Edit Question' : 'Add New Question'}
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            title="Close modal"
            aria-label="Close modal"
            className="w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 flex items-center justify-center transition-all duration-200 disabled:opacity-50"
          >
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Question */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Question *
            </label>
            <input
              type="text"
              value={formData.question}
              onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
              placeholder="Enter the question users will see..."
              required
              disabled={isLoading}
              className="w-full bg-black-100/50 border border-white/[0.2] rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all duration-200 disabled:opacity-50"
            />
          </div>

          {/* Answer */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Answer *
            </label>
            <textarea
              value={formData.answer}
              onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
              placeholder="Enter the answer that will be displayed..."
              required
              disabled={isLoading}
              rows={4}
              className="w-full bg-black-100/50 border border-white/[0.2] rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all duration-200 disabled:opacity-50 resize-vertical"
            />
          </div>

          {/* Anchor Link */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Anchor Link (Optional)
            </label>
            <input
              type="text"
              value={formData.anchorLink}
              onChange={(e) => setFormData(prev => ({ ...prev, anchorLink: e.target.value }))}
              placeholder="e.g., #projects, #about, #contact"
              disabled={isLoading}
              className="w-full bg-black-100/50 border border-white/[0.2] rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all duration-200 disabled:opacity-50"
            />
            <p className="text-xs text-gray-400 mt-1">
              Link to scroll to a specific section when this question is clicked
            </p>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-lg font-semibold text-white mb-3">
              📎 File Attachment
              <span className="text-sm font-normal text-gray-400 ml-2">(High Priority Feature)</span>
            </label>
            
            {editingQuestion?.fileUrl && !removeFile && !formData.file && (
              <div className="mb-4 p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-2 border-blue-500/40 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500/30 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-blue-400 font-semibold">
                        📄 {editingQuestion.fileName || 'Current file'}
                      </p>
                      <p className="text-blue-300 text-sm">Ready for download</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRemoveFile(true)}
                    disabled={isLoading}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-400 hover:text-red-300 text-sm font-medium transition-all duration-200 disabled:opacity-50 hover:scale-105"
                  >
                    Remove File
                  </button>
                </div>
              </div>
            )}

            {/* Enhanced File Upload Area */}
            <div className="relative">
              <div className="border-2 border-dashed border-white/[0.3] hover:border-blue-500/50 rounded-xl p-6 bg-gradient-to-br from-black-100/30 to-black-100/50 hover:from-blue-500/5 hover:to-purple-500/5 transition-all duration-200">
                <input
                  type="file"
                  onChange={handleFileChange}
                  disabled={isLoading || fileUploadState.isUploading}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  title="Upload file attachment"
                  aria-label="Upload file attachment"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">Upload File for Download</h3>
                  <p className="text-gray-400 text-sm mb-3">
                    Drag and drop your file here, or click to browse
                  </p>
                  <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg text-white font-semibold transition-all duration-200 hover:scale-105 shadow-lg">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Choose File
                  </div>
                </div>
              </div>
              
              {/* Upload Progress */}
              {fileUploadState.isUploading && (
                <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-blue-400 text-sm">Uploading...</span>
                        <span className="text-blue-400 text-sm">{Math.round(fileUploadState.progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${fileUploadState.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Success */}
              {fileUploadState.success && formData.file && (
                <div className="mt-4 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/40 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-500/30 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-green-400 font-semibold">
                          ✅ {formData.file.name}
                        </p>
                        <p className="text-green-300 text-sm">
                          {(formData.file.size / 1024 / 1024).toFixed(2)} MB • Ready for download
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      disabled={isLoading}
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-400 hover:text-red-300 text-sm font-medium transition-all duration-200 disabled:opacity-50 hover:scale-105"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {/* Upload Error */}
              {fileUploadState.error && (
                <div className="mt-4 p-4 bg-gradient-to-r from-red-500/20 to-pink-500/20 border-2 border-red-500/40 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-500/30 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-red-400 font-semibold">Upload Failed</p>
                      <p className="text-red-300 text-sm">{fileUploadState.error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Current File Display */}
              {!fileUploadState.success && formData.file && !fileUploadState.isUploading && (
                <div className="mt-4 p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-2 border-purple-500/40 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-500/30 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-purple-400 font-semibold">
                          📄 {formData.file.name}
                        </p>
                        <p className="text-purple-300 text-sm">
                          {(formData.file.size / 1024 / 1024).toFixed(2)} MB • Processing...
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      disabled={isLoading}
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-400 hover:text-red-300 text-sm font-medium transition-all duration-200 disabled:opacity-50 hover:scale-105"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-blue-400 text-sm font-medium mb-1">
                💡 Download Priority Feature
              </p>
              <p className="text-gray-400 text-xs">
                Supported: PDF, DOC, DOCX, TXT, JPG, JPEG, PNG (Max 10MB) • Files will be prominently displayed with download buttons
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-white/[0.1]">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.question.trim() || !formData.answer.trim()}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{editingQuestion ? 'Update Question' : 'Add Question'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestionFormModal;