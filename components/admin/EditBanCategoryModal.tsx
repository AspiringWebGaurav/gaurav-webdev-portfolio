"use client";

import { useState, useEffect } from 'react';
import { showSuccessToast, showErrorToast } from '@/components/ToastSystem';
import { BanCategory, BanCategoryOption } from '@/types/banSystem';
import { BanCategoryMapper } from '@/utils/banCategoryMapper';

interface EditBanCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  uuid: string;
  currentCategory: BanCategory;
  onCategoryUpdated: () => void;
}

export default function EditBanCategoryModal({
  isOpen,
  onClose,
  uuid,
  currentCategory,
  onCategoryUpdated
}: EditBanCategoryModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<BanCategory>(currentCategory);
  const [actualCurrentCategory, setActualCurrentCategory] = useState<BanCategory>(currentCategory);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingCategory, setIsLoadingCategory] = useState(false);
  const [categoryOptions] = useState<BanCategoryOption[]>(BanCategoryMapper.getAllCategoryOptions());

  useEffect(() => {
    setSelectedCategory(currentCategory);
    setActualCurrentCategory(currentCategory);
    
    // Fetch actual category from API to ensure accuracy
    fetchActualCategory();
  }, [currentCategory, uuid]);

  const fetchActualCategory = async () => {
    if (!uuid) return;
    
    setIsLoadingCategory(true);
    try {
      // Try to get the actual category from visitor status API
      const response = await fetch(`/api/visitors/status?uuid=${uuid}`);
      if (response.ok) {
        const data = await response.json();
        const apiCategory = data.banCategory as BanCategory;
        
        if (apiCategory && apiCategory !== currentCategory) {
          console.log(`Category mismatch detected for ${uuid}: UI shows ${currentCategory}, API shows ${apiCategory}`);
          setActualCurrentCategory(apiCategory);
          setSelectedCategory(apiCategory);
        }
      }
    } catch (error) {
      console.error('Error fetching actual category:', error);
    } finally {
      setIsLoadingCategory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedCategory === actualCurrentCategory) {
      showErrorToast('Please select a different category');
      return;
    }

    setIsProcessing(true);

    try {
      // Update visitor status with new category
      const statusResponse = await fetch('/api/visitors/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          uuid: uuid,
          status: 'banned', // Keep banned status
          banCategory: selectedCategory,
          adminId: 'gaurav'
        })
      });

      if (!statusResponse.ok) {
        throw new Error(`Failed to update ban category for ${uuid}`);
      }

      // Update ban record with new category
      const banResponse = await fetch('/api/admin/bans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          uuid: uuid,
          banCategory: selectedCategory,
          adminId: 'gaurav'
        })
      });

      if (!banResponse.ok) {
        console.warn(`Failed to update ban record for ${uuid}`);
      }

      showSuccessToast(`Ban category updated to ${categoryOptions.find(c => c.value === selectedCategory)?.label}`);
      onCategoryUpdated();
      onClose();

    } catch (error) {
      console.error(`Error updating ban category:`, error);
      showErrorToast(`Failed to update ban category. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const currentCategoryInfo = categoryOptions.find(c => c.value === actualCurrentCategory);
  const selectedCategoryInfo = categoryOptions.find(c => c.value === selectedCategory);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black-100/95 border border-white/[0.2] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 p-6 border-b border-orange-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Edit Ban Category</h2>
                <p className="text-orange-300 text-sm">
                  {uuid.slice(0, 8)}...
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              title="Close edit category modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[65vh]">
            
            {/* Current Category Info */}
            <div className="bg-black-100/30 border border-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-white">Current Category</h3>
                {isLoadingCategory && (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-blue-400 text-xs">Verifying...</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: currentCategoryInfo?.color + '20' }}
                >
                  <svg
                    className="w-4 h-4"
                    style={{ color: currentCategoryInfo?.color }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={currentCategoryInfo?.icon}
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm">{currentCategoryInfo?.label}</h4>
                  <p className="text-gray-400 text-xs">{currentCategoryInfo?.description}</p>
                  {actualCurrentCategory !== currentCategory && (
                    <p className="text-yellow-400 text-xs mt-1">
                      ⚠️ Updated from system data
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* New Category Selection */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Select New Category *
              </label>
              <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto">
                {categoryOptions.map((category) => (
                  <label
                    key={category.value}
                    className={`relative flex items-center p-1.5 border-2 rounded-md cursor-pointer transition-all duration-200 ${
                      selectedCategory === category.value
                        ? 'border-white/40 bg-white/5'
                        : category.value === actualCurrentCategory
                        ? 'border-gray-500/40 bg-gray-500/10 opacity-50 cursor-not-allowed'
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
                      disabled={isProcessing || category.value === actualCurrentCategory}
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

                    {/* Current Category Indicator */}
                    {category.value === actualCurrentCategory && (
                      <div className="absolute top-1 right-1">
                        <span className="text-xs text-gray-400 bg-gray-600/50 px-1 rounded">Current</span>
                      </div>
                    )}
                  </label>
                ))}
              </div>
              
              {/* Category Change Preview */}
              {selectedCategory && selectedCategory !== actualCurrentCategory && (
                <div className="mt-2 p-2 bg-black-100/30 border border-white/10 rounded-md">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: selectedCategoryInfo?.color }}
                    />
                    <span className="text-white text-xs font-medium">
                      Will change to: {selectedCategoryInfo?.label} Category
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">
                    The ban page will update instantly with the new category design and messaging.
                  </p>
                </div>
              )}
            </div>

            {/* Warning */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h4 className="text-yellow-300 font-medium text-sm">Real-time Update</h4>
                  <p className="text-yellow-200 text-xs mt-1">
                    Changing the ban category will instantly update the user's ban page design and messaging. This action is logged for audit purposes.
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
                disabled={isProcessing || selectedCategory === actualCurrentCategory || isLoadingCategory}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-800 text-white py-3 px-4 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Update Category</span>
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