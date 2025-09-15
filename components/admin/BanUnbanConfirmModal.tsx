"use client";

import { useState, useEffect } from 'react';
import { showSuccessToast, showErrorToast } from '@/components/ToastSystem';
import { generatePolicyReference } from '@/utils/policyReference';
import { PolicyReferenceSync } from '@/utils/policyReferenceSync';
import { BanCategory, BanCategoryOption } from '@/types/banSystem';
import { BanCategoryMapper } from '@/utils/banCategoryMapper';

interface BanUnbanConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: 'ban' | 'unban';
  visitor: {
    uuid: string;
    status: string;
    banReason?: string;
    policyReference?: string;
  };
  onActionComplete: () => void;
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

export default function BanUnbanConfirmModal({
  isOpen,
  onClose,
  action,
  visitor,
  onActionComplete
}: BanUnbanConfirmModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BanCategory>('normal');
  const [isProcessing, setIsProcessing] = useState(false);
  const [categoryOptions] = useState<BanCategoryOption[]>(BanCategoryMapper.getAllCategoryOptions());

  // Auto-suggest category based on selected reason
  useEffect(() => {
    if (selectedReason && selectedReason !== 'custom') {
      const reasonLabel = BAN_REASONS.find(r => r.value === selectedReason)?.label || '';
      const suggestedCategory = BanCategoryMapper.suggestCategoryFromReason(reasonLabel);
      setSelectedCategory(suggestedCategory);
    }
  }, [selectedReason]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation for ban action
    if (action === 'ban') {
      if (!selectedReason) {
        showErrorToast('Please select a ban reason');
        return;
      }

      if (selectedReason === 'custom' && !customReason.trim()) {
        showErrorToast('Please provide a custom reason');
        return;
      }

      if (!selectedCategory) {
        showErrorToast('Please select a ban category');
        return;
      }
    }

    setIsProcessing(true);

    try {
      if (action === 'ban') {
        await handleBanAction();
      } else {
        await handleUnbanAction();
      }

      showSuccessToast(`Visitor ${action}ned successfully`);
      
      // Reset form
      setSelectedReason('');
      setCustomReason('');
      setSelectedCategory('normal');
      onActionComplete();
      onClose();

    } catch (error) {
      console.error(`Error ${action}ning visitor:`, error);
      showErrorToast(`Failed to ${action} visitor. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBanAction = async () => {
    const finalReason = selectedReason === 'custom'
      ? customReason.trim()
      : BAN_REASONS.find(r => r.value === selectedReason)?.label || 'Policy violation';

    // Ensure policy reference is properly generated and synchronized
    const policyReference = await PolicyReferenceSync.ensurePolicyReference(visitor.uuid);

    // Update visitor status with category
    const statusResponse = await fetch('/api/visitors/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        uuid: visitor.uuid,
        status: 'banned',
        banReason: finalReason,
        banCategory: selectedCategory,
        policyReference,
        adminId: 'gaurav'
      })
    });

    if (!statusResponse.ok) {
      throw new Error(`Failed to ban ${visitor.uuid}`);
    }

    // Store in bans collection with category
    const banResponse = await fetch('/api/admin/bans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        uuid: visitor.uuid,
        reason: selectedReason,
        customReason: selectedReason === 'custom' ? customReason.trim() : null,
        banCategory: selectedCategory,
        policyReference,
        adminId: 'gaurav',
        timestamp: new Date().toISOString(),
        isActive: true
      })
    });

    if (!banResponse.ok) {
      console.warn(`Failed to store ban record for ${visitor.uuid}`);
    }

    // Ensure policy reference is synchronized across collections
    try {
      await PolicyReferenceSync.syncPolicyReference(visitor.uuid, policyReference);
    } catch (syncError) {
      console.warn(`Policy reference sync warning for ${visitor.uuid}:`, syncError);
      // Don't fail the ban operation for sync issues
    }
  };

  const handleUnbanAction = async () => {
    // Update visitor status to active
    const statusResponse = await fetch('/api/visitors/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        uuid: visitor.uuid,
        status: 'active',
        adminId: 'gaurav'
      })
    });

    if (!statusResponse.ok) {
      throw new Error(`Failed to unban ${visitor.uuid}`);
    }

    // Update ban record to inactive
    const banResponse = await fetch('/api/admin/bans', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        uuid: visitor.uuid,
        isActive: false,
        adminId: 'gaurav'
      })
    });

    if (!banResponse.ok) {
      console.warn(`Failed to update ban record for ${visitor.uuid}`);
    }
  };

  if (!isOpen) return null;

  const getActionConfig = () => {
    if (action === 'ban') {
      return {
        title: 'Ban Visitor',
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
          </svg>
        ),
        color: 'red',
        buttonText: 'Ban Visitor',
        loadingText: 'Banning...',
        warningText: 'This action will immediately restrict access for this visitor. They will be redirected to a ban page and can submit appeals.'
      };
    } else {
      return {
        title: 'Unban Visitor',
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        color: 'emerald',
        buttonText: 'Unban Visitor',
        loadingText: 'Unbanning...',
        warningText: 'This action will restore access for this visitor. They will be able to access the site normally.'
      };
    }
  };

  const config = getActionConfig();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black-100/95 border border-white/[0.2] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className={`bg-gradient-to-r from-${config.color}-500/20 to-${config.color}-600/20 p-6 border-b border-${config.color}-500/20`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 bg-${config.color}-500/20 rounded-full flex items-center justify-center`}>
                <div className={`text-${config.color}-400`}>
                  {config.icon}
                </div>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{config.title}</h2>
                <p className={`text-${config.color}-300 text-sm`}>
                  {visitor.uuid.slice(0, 8)}...
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              title={`Close ${action} modal`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[65vh]">
          {action === 'ban' ? (
            <>
              {/* Ban Reason Selection */}
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
                        disabled={isProcessing}
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
                    disabled={isProcessing}
                    maxLength={200}
                  />
                  <p className="text-gray-400 text-xs mt-1">{customReason.length}/200 characters</p>
                </div>
              )}

              {/* Ban Category Selection - Ultra Compact Design */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Select Ban Category *
                </label>
                <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto">
                  {categoryOptions.map((category) => (
                    <label
                      key={category.value}
                      className={`relative flex items-center p-1.5 border-2 rounded-md cursor-pointer transition-all duration-200 ${
                        selectedCategory === category.value
                          ? 'border-white/40 bg-white/5'
                          : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
                      }`}
                      style={{
                        borderColor: selectedCategory === category.value ? category.color + '40' : undefined,
                        backgroundColor: selectedCategory === category.value ? category.color + '10' : undefined
                      }}
                    >
                      <input
                        type="radio"
                        name="banCategory"
                        value={category.value}
                        checked={selectedCategory === category.value}
                        onChange={(e) => setSelectedCategory(e.target.value as BanCategory)}
                        className="sr-only"
                        disabled={isProcessing}
                      />
                      
                      {/* Category Icon */}
                      <div
                        className="w-5 h-5 rounded-md flex items-center justify-center mr-1.5 flex-shrink-0"
                        style={{ backgroundColor: category.color + '20' }}
                      >
                        <svg
                          className="w-2.5 h-2.5"
                          style={{ color: category.color }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d={category.icon}
                          />
                        </svg>
                      </div>

                      {/* Category Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-white font-semibold text-xs">{category.label}</h4>
                          <div className="flex items-center space-x-0.5">
                            {Array.from({ length: 3 }, (_, i) => (
                              <div
                                key={i}
                                className={`w-0.5 h-0.5 rounded-full ${
                                  i < Math.ceil(category.severity / 3)
                                    ? 'opacity-100'
                                    : 'opacity-20'
                                }`}
                                style={{ backgroundColor: category.color }}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-400 text-xs leading-tight truncate">{category.description}</p>
                      </div>

                      {/* Selection Indicator */}
                      {selectedCategory === category.value && (
                        <div
                          className="w-2.5 h-2.5 rounded-full flex items-center justify-center ml-1 flex-shrink-0"
                          style={{ backgroundColor: category.color }}
                        >
                          <svg className="w-1.5 h-1.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </label>
                  ))}
                </div>
                
                {/* Category Preview - Minimal */}
                {selectedCategory && (
                  <div className="mt-1 p-1.5 bg-black-100/30 border border-white/10 rounded-md">
                    <div className="flex items-center space-x-1.5">
                      <div
                        className="w-1 h-1 rounded-full"
                        style={{ backgroundColor: categoryOptions.find(c => c.value === selectedCategory)?.color }}
                      />
                      <span className="text-white text-xs font-medium">
                        {categoryOptions.find(c => c.value === selectedCategory)?.label} Selected
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Unban Information */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-white mb-2">Current Ban Information</h3>
                  <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Reason:</span>
                      <span className="text-white text-sm">{visitor.banReason || 'No reason provided'}</span>
                    </div>
                    {visitor.policyReference && (
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Policy Ref:</span>
                        <span className="text-white text-sm font-mono">{visitor.policyReference}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <p className="text-white text-sm">
                    Are you sure you want to unban this visitor? This will restore their access to the site.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Warning */}
          <div className={`bg-${config.color === 'red' ? 'yellow' : 'blue'}-500/10 border border-${config.color === 'red' ? 'yellow' : 'blue'}-500/20 rounded-lg p-4`}>
            <div className="flex items-start space-x-3">
              <svg className={`w-5 h-5 text-${config.color === 'red' ? 'yellow' : 'blue'}-400 mt-0.5 flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 className={`text-${config.color === 'red' ? 'yellow' : 'blue'}-300 font-medium text-sm`}>
                  {action === 'ban' ? 'Warning' : 'Confirmation'}
                </h4>
                <p className={`text-${config.color === 'red' ? 'yellow' : 'blue'}-200 text-xs mt-1`}>
                  {config.warningText}
                </p>
              </div>
            </div>
          </div>

          </div>
          
          {/* Action Buttons - Sticky Footer */}
          <div className="flex-shrink-0 p-4 pt-0">
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white py-3 px-4 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing || (action === 'ban' && (!selectedReason || !selectedCategory))}
                className={`flex-1 bg-${config.color}-500 hover:bg-${config.color}-600 disabled:bg-${config.color}-800 text-white py-3 px-4 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2`}
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>{config.loadingText}</span>
                  </>
                ) : (
                  <>
                    {config.icon}
                    <span>{config.buttonText}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}