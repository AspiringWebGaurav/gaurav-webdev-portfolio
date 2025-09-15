"use client";

import { useState } from 'react';
import { showSuccessToast, showErrorToast } from '@/components/ToastSystem';
import { generatePolicyReference } from '@/utils/policyReference';

interface EnhancedBanModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUUIDs: string[];
  onBanComplete: () => void;
}

const BAN_REASONS = [
  { value: 'spam', label: 'Spam/Unwanted Content' },
  { value: 'abuse', label: 'Abusive Behavior' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'inappropriate', label: 'Inappropriate Content' },
  { value: 'security', label: 'Security Violation' },
  { value: 'terms', label: 'Terms of Service Violation' },
  { value: 'custom', label: 'Custom Reason' }
];

export default function EnhancedBanModal({ isOpen, onClose, selectedUUIDs, onBanComplete }: EnhancedBanModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedReason) {
      showErrorToast('Please select a ban reason');
      return;
    }

    if (selectedReason === 'custom' && !customReason.trim()) {
      showErrorToast('Please provide a custom reason');
      return;
    }

    setIsSubmitting(true);

    try {
      const finalReason = selectedReason === 'custom'
        ? customReason.trim()
        : BAN_REASONS.find(r => r.value === selectedReason)?.label || 'Policy violation';

      // Ban each UUID and store in /bans/{uuid} collection
      const banPromises = selectedUUIDs.map(async (uuid) => {
        // Generate unique policy reference for this ban
        const policyReference = generatePolicyReference();

        // Update visitor status
        const statusResponse = await fetch('/api/visitors/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            uuid,
            status: 'banned',
            banReason: finalReason,
            policyReference,
            adminId: 'gaurav'
          })
        });

        if (!statusResponse.ok) {
          throw new Error(`Failed to ban ${uuid}`);
        }

        // Store in bans collection
        const banResponse = await fetch('/api/admin/bans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            uuid,
            reason: selectedReason,
            customReason: selectedReason === 'custom' ? customReason.trim() : null,
            policyReference,
            adminId: 'gaurav',
            timestamp: new Date().toISOString(),
            isActive: true
          })
        });

        if (!banResponse.ok) {
          console.warn(`Failed to store ban record for ${uuid}`);
        }

        return uuid;
      });

      await Promise.all(banPromises);

      showSuccessToast(`Successfully banned ${selectedUUIDs.length} visitor${selectedUUIDs.length > 1 ? 's' : ''}`);
      
      // Reset form
      setSelectedReason('');
      setCustomReason('');
      onBanComplete();
      onClose();

    } catch (error) {
      console.error('Error banning visitors:', error);
      showErrorToast('Failed to ban visitors. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black-100/95 border border-red-500/20 rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 p-6 border-b border-red-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Ban Visitors</h2>
                <p className="text-red-300 text-sm">{selectedUUIDs.length} visitor{selectedUUIDs.length > 1 ? 's' : ''} selected</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              title="Close ban modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Reason Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Select Ban Reason *
            </label>
            <div className="space-y-2">
              {BAN_REASONS.map((reason) => (
                <label key={reason.value} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="banReason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="w-4 h-4 text-red-500 bg-black-100 border-gray-600 focus:ring-red-500"
                    disabled={isSubmitting}
                  />
                  <span className="text-white text-sm">{reason.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Custom Reason Input */}
          {selectedReason === 'custom' && (
            <div>
              <label htmlFor="customReason" className="block text-sm font-medium text-white mb-2">
                Custom Reason *
              </label>
              <textarea
                id="customReason"
                rows={3}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full px-3 py-2 bg-black-100/50 border border-white/[0.2] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                placeholder="Enter custom ban reason..."
                disabled={isSubmitting}
                maxLength={200}
              />
              <p className="text-gray-400 text-xs mt-1">{customReason.length}/200 characters</p>
            </div>
          )}

          {/* Warning */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 className="text-yellow-300 font-medium text-sm">Warning</h4>
                <p className="text-yellow-200 text-xs mt-1">
                  This action will immediately restrict access for the selected visitor{selectedUUIDs.length > 1 ? 's' : ''}. 
                  They will be redirected to a ban page and can submit appeals.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white py-2 px-4 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedReason}
              className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-800 text-white py-2 px-4 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Banning...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                  </svg>
                  <span>Ban {selectedUUIDs.length > 1 ? 'Visitors' : 'Visitor'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}