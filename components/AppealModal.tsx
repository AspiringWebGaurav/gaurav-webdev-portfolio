"use client";

import { useState } from 'react';
import { showSuccessToast, showErrorToast, showProcessingToast } from '@/components/ToastSystem';

interface AppealModalProps {
  isOpen: boolean;
  onClose: () => void;
  uuid: string;
  banReason: string;
  policyReference?: string;
}

interface AppealFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function AppealModal({ isOpen, onClose, uuid, banReason, policyReference }: AppealModalProps) {
  const [formData, setFormData] = useState<AppealFormData>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<AppealFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<AppealFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 20) {
      newErrors.message = 'Message must be at least 20 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showErrorToast('Please fix the form errors before submitting');
      return;
    }

    setIsSubmitting(true);
    showProcessingToast('Submitting your appeal...', 2000);

    try {
      const response = await fetch('/api/contact/ban-appeal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          uuid,
          banReason,
          policyReference,
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit appeal');
      }

      const result = await response.json();
      console.log('✅ Appeal submitted successfully:', result);

      showSuccessToast('Appeal submitted successfully! You will receive a response within 24-48 hours.');
      
      // Reset form and close modal
      setFormData({ name: '', email: '', subject: '', message: '' });
      setErrors({});
      onClose();

    } catch (error) {
      console.error('❌ Error submitting appeal:', error);
      showErrorToast(error instanceof Error ? error.message : 'Failed to submit appeal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof AppealFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black-100/95 border border-white/[0.2] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 p-6 border-b border-white/[0.1]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Submit Ban Appeal</h2>
                <p className="text-blue-300 text-sm">Request a review of your restriction</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              title="Close appeal form"
              aria-label="Close appeal form"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Ban reason display */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <h3 className="text-sm font-medium text-white mb-2">Current Restriction Reason:</h3>
            <p className="text-red-300 text-sm">{banReason}</p>
          </div>

          {/* Name field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-4 py-3 bg-black-100/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                errors.name 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-white/[0.2] focus:ring-blue-500'
              }`}
              placeholder="Enter your full name"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-red-400 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Email field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full px-4 py-3 bg-black-100/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                errors.email 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-white/[0.2] focus:ring-blue-500'
              }`}
              placeholder="Enter your email address"
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-red-400 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Subject field */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-white mb-2">
              Subject *
            </label>
            <input
              type="text"
              id="subject"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              className={`w-full px-4 py-3 bg-black-100/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                errors.subject 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-white/[0.2] focus:ring-blue-500'
              }`}
              placeholder="Brief description of your appeal"
              disabled={isSubmitting}
            />
            {errors.subject && (
              <p className="text-red-400 text-sm mt-1">{errors.subject}</p>
            )}
          </div>

          {/* Message field */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-white mb-2">
              Appeal Message *
            </label>
            <textarea
              id="message"
              rows={6}
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              className={`w-full px-4 py-3 bg-black-100/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors resize-none ${
                errors.message 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-white/[0.2] focus:ring-blue-500'
              }`}
              placeholder="Please explain why you believe this restriction should be lifted. Include any relevant details or context that might help with the review process."
              disabled={isSubmitting}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.message && (
                <p className="text-red-400 text-sm">{errors.message}</p>
              )}
              <p className="text-gray-400 text-xs ml-auto">
                {formData.message.length}/500 characters
              </p>
            </div>
          </div>

          {/* Info box */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2 flex items-center">
              <svg className="w-4 h-4 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              What happens next?
            </h4>
            <ul className="text-sm text-blue-300 space-y-1">
              <li>• Your appeal will be reviewed within 24-48 hours</li>
              <li>• You'll receive an email response at the provided address</li>
              <li>• If approved, access will be restored automatically</li>
              <li>• Please be patient and avoid submitting multiple appeals</li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white py-3 px-6 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-800 text-white py-3 px-6 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span>Submit Appeal</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}