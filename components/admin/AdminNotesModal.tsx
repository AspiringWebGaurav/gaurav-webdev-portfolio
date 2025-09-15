"use client";

import { useState } from 'react';
import { showSuccessToast, showErrorToast } from '@/components/ToastSystem';

interface AdminNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  visitorUuid: string;
  currentNotes?: string;
  onNotesUpdated: () => void;
}

export default function AdminNotesModal({ 
  isOpen, 
  onClose, 
  visitorUuid, 
  currentNotes = '', 
  onNotesUpdated 
}: AdminNotesModalProps) {
  const [notes, setNotes] = useState(currentNotes);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/visitor-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          uuid: visitorUuid,
          notes: notes.trim(),
          adminId: 'gaurav'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update notes');
      }

      showSuccessToast('Admin notes updated successfully');
      onNotesUpdated();
      onClose();

    } catch (error) {
      console.error('Error updating admin notes:', error);
      showErrorToast('Failed to update admin notes');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black-100/95 border border-white/[0.2] rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 p-6 border-b border-white/[0.1]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Admin Notes</h2>
                <p className="text-blue-300 text-sm">Visitor: {visitorUuid.slice(0, 8)}...</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              title="Close notes modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-white mb-2">
              Private Admin Notes
            </label>
            <textarea
              id="notes"
              rows={6}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-black-100/50 border border-white/[0.2] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Add private notes about this visitor (only visible to admins)..."
              disabled={isSubmitting}
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-400">
                These notes are private and only visible to administrators
              </p>
              <p className="text-xs text-gray-400">
                {notes.length}/500 characters
              </p>
            </div>
          </div>

          {/* Info box */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-blue-300 font-medium text-sm">Admin Notes Usage</h4>
                <ul className="text-blue-200 text-xs mt-1 space-y-1">
                  <li>• Track visitor behavior patterns</li>
                  <li>• Record reasons for actions taken</li>
                  <li>• Note any special circumstances</li>
                  <li>• Coordinate with other administrators</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white py-3 px-4 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-800 text-white py-3 px-4 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Save Notes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}