// components/admin/DeleteQuestionModal.tsx
// Confirmation modal for deleting direct questions

"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface DeleteQuestionModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Function to close the modal */
  onClose: () => void;
  /** Function called when delete is confirmed */
  onConfirm: (permanent: boolean) => Promise<void>;
  /** Number of questions to delete */
  questionCount: number;
  /** Whether it's a single question or bulk operation */
  isBulk?: boolean;
  /** Question preview for single deletions */
  questionPreview?: string;
}

const DeleteQuestionModal: React.FC<DeleteQuestionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  questionCount,
  isBulk = false,
  questionPreview
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionType, setDeletionType] = useState<'soft' | 'hard'>('soft');

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      await onConfirm(deletionType === 'hard');
      onClose();
    } catch (error) {
      console.error('Delete operation failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all w-full max-w-md">
          {/* Header */}
          <div className="bg-red-50 px-6 py-4 border-b border-red-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-900">
                  {isBulk ? `Delete ${questionCount} Questions` : 'Delete Question'}
                </h3>
                <p className="text-sm text-red-700">
                  This action cannot be easily undone
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {!isBulk && questionPreview && (
              <div className="mb-4 p-3 bg-slate-50 rounded-lg border">
                <p className="text-sm text-slate-600 font-medium mb-1">Question to delete:</p>
                <p className="text-sm text-slate-900 leading-relaxed">
                  {questionPreview.length > 150 
                    ? questionPreview.substring(0, 150) + '...' 
                    : questionPreview
                  }
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div className="text-sm text-slate-700">
                {isBulk ? (
                  <>
                    You are about to delete <strong>{questionCount} questions</strong>. 
                    This will remove them from the database and clear all related notifications.
                  </>
                ) : (
                  <>
                    You are about to delete this question. This will remove it from the database 
                    and clear all related notifications for the visitor.
                  </>
                )}
              </div>

              {/* Deletion Type Selection */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-900">Deletion Type:</p>
                
                <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="radio"
                    value="soft"
                    checked={deletionType === 'soft'}
                    onChange={(e) => setDeletionType(e.target.value as 'soft')}
                    className="mt-0.5 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-slate-900 text-sm">Archive (Recommended)</div>
                    <div className="text-xs text-slate-600">
                      Mark as archived. Can be restored later if needed.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 border border-red-200 rounded-lg cursor-pointer hover:bg-red-50 transition-colors">
                  <input
                    type="radio"
                    value="hard"
                    checked={deletionType === 'hard'}
                    onChange={(e) => setDeletionType(e.target.value as 'hard')}
                    className="mt-0.5 text-red-600 focus:ring-red-500"
                  />
                  <div>
                    <div className="font-medium text-red-900 text-sm">Permanent Delete</div>
                    <div className="text-xs text-red-600">
                      Completely remove from database. This cannot be undone.
                    </div>
                  </div>
                </label>
              </div>

              {/* Warning for permanent delete */}
              {deletionType === 'hard' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-xs text-red-700 font-medium">
                      This will permanently delete the {isBulk ? 'questions' : 'question'} and remove all traces!
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3">
            <button
              onClick={handleClose}
              disabled={isDeleting}
              className="px-4 py-2 text-slate-700 hover:text-slate-900 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            
            <button
              onClick={handleConfirm}
              disabled={isDeleting}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2",
                deletionType === 'hard'
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-orange-500 hover:bg-orange-600 text-white",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isDeleting && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <span>
                {isDeleting 
                  ? 'Deleting...' 
                  : deletionType === 'hard' 
                    ? 'Permanently Delete' 
                    : 'Archive'
                }
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteQuestionModal;