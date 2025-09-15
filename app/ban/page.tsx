"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import EnhancedVisitorStatusWatcher from "@/components/EnhancedVisitorStatusWatcher";
import { showSuccessToast, showErrorToast } from "@/components/ToastSystem";
import { generatePolicyReference } from "@/utils/policyReference";

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  uuid: string;
}

function BanPageContent() {
  const searchParams = useSearchParams();
  const [uuid, setUuid] = useState<string>("");
  const [banReason, setBanReason] = useState<string>("");
  const [policyReference, setPolicyReference] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ContactFormData>();

  useEffect(() => {
    const uuidParam = searchParams.get("uuid") || "";
    const reasonParam = searchParams.get("reason") || "Policy violation";
    const policyRefParam = searchParams.get("policyRef") || "";
    
    setUuid(uuidParam);
    setBanReason(decodeURIComponent(reasonParam));
    
    // If no policy reference in URL, generate one for display purposes
    if (policyRefParam) {
      setPolicyReference(policyRefParam);
    } else {
      // For existing bans without policy references, generate a display reference
      const displayRef = generatePolicyReference();
      setPolicyReference(displayRef);
    }
  }, [searchParams]);

  const onSubmitContact = async (data: ContactFormData) => {
    setIsSubmitting(true);
    
    try {
      // Add UUID to form data
      const formData = {
        ...data,
        uuid,
        banReason,
        timestamp: new Date().toISOString()
      };

      // Send contact form (you can integrate with EmailJS or your preferred service)
      const response = await fetch('/api/contact/ban-appeal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showSuccessToast("Your appeal has been submitted successfully. We'll review it shortly.");
        reset();
        setShowContactForm(false);
      } else {
        throw new Error('Failed to submit appeal');
      }
    } catch (error) {
      console.error("Error submitting contact form:", error);
      showErrorToast("Failed to submit your appeal. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center p-2 sm:p-4 relative overflow-hidden">
      <EnhancedVisitorStatusWatcher />
      
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px] sm:bg-[size:50px_50px]"></div>
      
      <div className="w-full max-w-7xl h-full flex items-center relative z-10">
        {/* Main ban notice - Mobile optimized */}
        <div className="w-full bg-gradient-to-br from-slate-900/90 to-gray-900/90 backdrop-blur-xl border border-red-500/20 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden">
          
          {/* Mobile-optimized Header */}
          <div className="relative bg-gradient-to-r from-red-500/20 via-red-600/20 to-red-700/20 p-3 sm:p-6 border-b border-red-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-red-500/30 to-red-600/30 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-sm border border-red-500/20">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold text-white">Access Restricted</h1>
                  <p className="text-red-300 text-sm sm:text-base hidden sm:block">Portfolio access temporarily suspended</p>
                  <p className="text-red-300 text-xs sm:hidden">Access suspended</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-400 rounded-full animate-pulse"></div>
                  <span className="text-red-300 font-medium text-xs sm:text-sm">Suspended</span>
                </div>
                <p className="text-slate-400 text-xs">24-48h review</p>
              </div>
            </div>
          </div>

          {/* Mobile-first Content Layout */}
          <div className="p-3 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 h-full">
              
              {/* Ban Details - Mobile optimized */}
              <div className="space-y-3 sm:space-y-4">
                {/* Ban Reason - Mobile compact */}
                <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-lg sm:rounded-xl p-3 sm:p-4 backdrop-blur-sm">
                  <h3 className="text-sm sm:text-lg font-bold text-white mb-2 sm:mb-3 flex items-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="hidden sm:inline">Restriction Reason</span>
                    <span className="sm:hidden">Reason</span>
                  </h3>
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 sm:p-3">
                    <p className="text-red-200 font-medium text-sm sm:text-base">{banReason}</p>
                  </div>
                </div>

                {/* Policy Reference - Mobile compact */}
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg sm:rounded-xl p-3 sm:p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <h3 className="text-sm sm:text-lg font-bold text-white flex items-center">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="hidden sm:inline">Policy Reference</span>
                      <span className="sm:hidden">Policy ID</span>
                    </h3>
                    <div className="px-2 py-1 bg-blue-500/20 rounded-full">
                      <span className="text-blue-300 text-xs font-medium">ID</span>
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-2 sm:p-3 border border-slate-700/50">
                    <div className="font-mono text-sm sm:text-lg text-blue-300 font-bold tracking-wider text-center break-all">
                      {policyReference}
                    </div>
                    <p className="text-slate-400 text-xs text-center mt-1">
                      <span className="hidden sm:inline">Use for support communications</span>
                      <span className="sm:hidden">For support</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Information - Mobile optimized */}
              <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg sm:rounded-xl p-3 sm:p-4 backdrop-blur-sm">
                <h4 className="text-white font-bold mb-3 sm:mb-4 flex items-center text-sm sm:text-base">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="hidden sm:inline">What happens next?</span>
                  <span className="sm:hidden">Next Steps</span>
                </h4>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                    <p className="text-blue-200 text-xs sm:text-sm">
                      <span className="hidden sm:inline">Appeal reviewed within 24-48 hours</span>
                      <span className="sm:hidden">Review: 24-48 hours</span>
                    </p>
                  </div>
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                    <p className="text-blue-200 text-xs sm:text-sm">
                      <span className="hidden sm:inline">Email response if contact provided</span>
                      <span className="sm:hidden">Email response sent</span>
                    </p>
                  </div>
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                    <p className="text-blue-200 text-xs sm:text-sm">
                      <span className="hidden sm:inline">Automatic access restoration if approved</span>
                      <span className="sm:hidden">Auto-restore if approved</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions - Mobile optimized */}
              <div className="flex flex-col justify-center items-center space-y-3 sm:space-y-4 sm:col-span-2 lg:col-span-1">
                <div className="text-center mb-2 sm:mb-4">
                  <h3 className="text-white font-bold text-base sm:text-lg mb-1 sm:mb-2">Need Help?</h3>
                  <p className="text-slate-300 text-xs sm:text-sm">
                    <span className="hidden sm:inline">Submit an appeal or check your status</span>
                    <span className="sm:hidden">Submit appeal or check status</span>
                  </p>
                </div>
                
                <div className="space-y-2 sm:space-y-3 w-full max-w-xs">
                  <button
                    onClick={() => setShowContactForm(!showContactForm)}
                    className="group bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl transition-all duration-300 font-semibold flex items-center justify-center space-x-2 w-full text-sm sm:text-base"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>{showContactForm ? 'Hide Form' : 'Submit Appeal'}</span>
                  </button>
                  
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-slate-600 hover:bg-slate-700 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl transition-colors font-medium flex items-center justify-center space-x-2 w-full text-sm sm:text-base"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Check Status</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact form - Mobile optimized modal */}
        {showContactForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/[0.2] rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-white">Submit an Appeal</h3>
                <button
                  onClick={() => setShowContactForm(false)}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                  title="Close appeal form"
                  aria-label="Close appeal form"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmit(onSubmitContact)} className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                    <input
                      {...register("name", { required: "Name is required" })}
                      className="w-full px-3 sm:px-4 py-2 bg-black-100/50 border border-white/[0.2] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm sm:text-base"
                      placeholder="Your full name"
                    />
                    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                    <input
                      type="email"
                      {...register("email", { 
                        required: "Email is required",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email address"
                        }
                      })}
                      className="w-full px-3 sm:px-4 py-2 bg-black-100/50 border border-white/[0.2] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm sm:text-base"
                      placeholder="your.email@example.com"
                    />
                    {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Subject *</label>
                  <input
                    {...register("subject", { required: "Subject is required" })}
                    className="w-full px-3 sm:px-4 py-2 bg-black-100/50 border border-white/[0.2] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm sm:text-base"
                    placeholder="Appeal for access restriction"
                  />
                  {errors.subject && <p className="text-red-400 text-xs mt-1">{errors.subject.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Message *</label>
                  <textarea
                    {...register("message", { 
                      required: "Message is required",
                      minLength: { value: 20, message: "Message must be at least 20 characters" }
                    })}
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2 bg-black-100/50 border border-white/[0.2] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none text-sm sm:text-base"
                    placeholder="Please explain why you believe this restriction was applied in error..."
                  />
                  {errors.message && <p className="text-red-400 text-xs mt-1">{errors.message.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      <span>Submit Appeal</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black-100 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    }>
      <BanPageContent />
    </Suspense>
  );
}