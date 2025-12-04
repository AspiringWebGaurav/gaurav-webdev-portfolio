'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface BanInfo {
  reason: string;
  category?: string;
  timestamp: string;
  reviewTime: string;
}

interface MobileScreenProps {
  banInfo: BanInfo;
}

export default function MobileScreen({ banInfo }: MobileScreenProps) {
  const router = useRouter();
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [appealText, setAppealText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAppealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (appealText.trim().length < 20) {
      setSubmitError('Appeal reason must be at least 20 characters');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Get visitor mask for proper identity linking
      const visitorMask = banStatusManager.getMask();
      
      const response = await fetch('/api/ban-appeals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mask: visitorMask, // Send mask to link appeal to correct visitor
          appealReason: appealText.trim(),
          banReason: banInfo.reason,
          banCategory: banInfo.category,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setIsSubmitted(true);
        setAppealText('');
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          setIsSubmitted(false);
          setShowAppealForm(false);
        }, 5000);
      } else {
        setSubmitError(result.error || 'Failed to submit appeal. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting appeal:', error);
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-black via-slate-900 to-black text-white overflow-hidden flex flex-col">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-red-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative flex-1 flex flex-col px-4 py-3 min-h-0">
        
        {/* Header */}
        <div className="flex flex-col gap-2 pb-2 border-b border-slate-700/30 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-red-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">G</span>
              </div>
              <div>
                <h2 className="text-white font-semibold text-xs">Gaurav Portfolio</h2>
                <p className="text-slate-400 text-[10px]">Security Active</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-red-500/20 px-2 py-1 rounded-md border border-red-500/30">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
              <span className="text-[10px] font-medium text-red-300">Review</span>
            </div>
          </div>
          
          {/* Clock and Date - Centered */}
          <div className="flex items-center justify-center gap-3 py-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-200">
              <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-mono font-medium" suppressHydrationWarning>{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="h-3 w-px bg-slate-600"></div>
            <div className="text-xs text-slate-300 font-medium" suppressHydrationWarning>
              {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          </div>
        </div>
        
        {/* Ban Alert */}
        <div className="bg-gradient-to-r from-red-900/40 to-red-800/40 border border-red-700/30 rounded-lg p-3 mt-2 flex-shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center border border-red-500/30">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <div className="flex-1">
              <h1 className="text-sm font-bold text-white">Access Restricted</h1>
              <p className="text-red-300 text-[10px]">Security violation</p>
            </div>
          </div>
        </div>

        {/* Content Area - Scrollable if needed but fits in one view */}
        <div className="flex-1 flex flex-col gap-2 mt-2 min-h-0 overflow-y-auto">
          
          {/* Reason */}
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 flex-shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-xs font-medium text-slate-300">Reason</h3>
            </div>
            <div className="bg-gradient-to-r from-red-900/30 to-red-800/30 rounded-md p-2.5 border border-red-700/40">
              <p className="text-sm font-semibold text-white">{banInfo.reason}</p>
              <p className="text-[10px] text-red-200/70 mt-1">Restricted for service integrity</p>
            </div>
          </div>

          {/* What happens next */}
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 flex-shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xs font-semibold text-white">What happens next?</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2 p-2 bg-slate-900/30 rounded-md">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 flex-shrink-0"></div>
                <div>
                  <p className="text-xs text-slate-200 font-medium">Admin reviews appeal</p>
                  <p className="text-[10px] text-slate-400">Within {banInfo.reviewTime}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2 bg-slate-900/30 rounded-md">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-1.5 flex-shrink-0"></div>
                <div>
                  <p className="text-xs text-slate-200 font-medium">Auto unban if accepted</p>
                  <p className="text-[10px] text-slate-400">Instant restoration</p>
                </div>
              </div>
            </div>
          </div>

          {/* Appeal Section */}
          {!isSubmitted ? (
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-lg p-3 border border-slate-700/50 flex-shrink-0">
              <h3 className="text-xs font-semibold text-white mb-2">Need Help?</h3>
              {!showAppealForm ? (
                <div className="text-center py-3">
                  <p className="text-xs text-slate-300 mb-3">Think this is a mistake?</p>
                  <button
                    onClick={() => setShowAppealForm(true)}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-medium py-2.5 px-4 rounded-lg transition-all text-xs flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Submit Appeal
                  </button>
                  <div className="mt-2 text-[10px] text-slate-400">Review: {banInfo.reviewTime}</div>
                </div>
              ) : (
                <form onSubmit={handleAppealSubmit} className="space-y-2">
                  <textarea
                    value={appealText}
                    onChange={(e) => setAppealText(e.target.value)}
                    placeholder="Explain why this should be reviewed... (min 20 characters)"
                    className="w-full h-20 bg-slate-900/50 border border-slate-700 rounded-md p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500/50 resize-none"
                    required
                    minLength={20}
                  />
                  {submitError && (
                    <p className="text-xs text-red-400">{submitError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-slate-700 disabled:to-slate-800 text-white font-medium py-2 px-3 rounded-md transition-all text-xs flex items-center justify-center gap-1.5"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          Submit
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAppealForm(false);
                        setSubmitError(null);
                      }}
                      className="px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-md transition-all text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="bg-gradient-to-br from-green-900/20 to-green-800/20 rounded-lg p-4 border border-green-700/30 text-center flex-shrink-0 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">Appeal Submitted!</h3>
              <p className="text-[10px] text-green-300 mb-2">Review within {banInfo.reviewTime}</p>
              <p className="text-[9px] text-green-400/70">This message will disappear in 5 seconds</p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-slate-800/40 via-slate-800/50 to-slate-800/40 border-t border-slate-700/50 rounded-lg px-3 py-2 mt-2 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-slate-400">Active</span>
            </div>
            <div className="text-slate-400 font-medium">© 2025 Gaurav</div>
            <div className="flex items-center gap-1 text-slate-400">
              <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Restricted</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
