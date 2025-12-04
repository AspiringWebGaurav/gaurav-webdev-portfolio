'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface BanInfo {
  reason: string;
  category?: string;
  timestamp: string;
  reviewTime: string;
}

interface TabletScreenProps {
  banInfo: BanInfo;
}

export default function TabletScreen({ banInfo }: TabletScreenProps) {
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
        <div className="absolute top-0 left-1/4 w-80 h-80 bg-red-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative flex-1 flex flex-col px-6 py-3 min-h-0">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-700/30 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm">Gaurav Portfolio</h2>
              <p className="text-slate-400 text-xs">Security Services Active</p>
            </div>
          </div>
          
          {/* Clock and Date - Centered */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-mono font-medium" suppressHydrationWarning>{currentTime.toLocaleTimeString()}</span>
            </div>
            <div className="h-3.5 w-px bg-slate-600"></div>
            <div className="flex items-center gap-1.5 text-sm text-slate-300">
              <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium" suppressHydrationWarning>
                {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 bg-red-500/20 px-3 py-1.5 rounded-lg border border-red-500/30">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
            <span className="text-xs font-medium text-red-300">Executive Review</span>
          </div>
        </div>
        
        {/* Ban Alert */}
        <div className="bg-gradient-to-r from-red-900/40 to-red-800/40 border border-red-700/30 rounded-xl p-4 mt-2.5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center border border-red-500/30">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Access Permanently Restricted</h1>
              <p className="text-red-300 text-sm">Critical security violation</p>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="flex-1 grid grid-cols-2 gap-2.5 mt-2.5 min-h-0">
          
          {/* Left column */}
          <div className="flex flex-col gap-2.5 min-h-0">
            
            {/* Reason */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 flex-shrink-0">
              <div className="flex items-start gap-2.5 mb-2.5">
                <svg className="w-4.5 h-4.5 text-amber-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-sm font-medium text-slate-300">Restriction Reason</h3>
              </div>
              <div className="bg-gradient-to-r from-red-900/30 to-red-800/30 rounded-lg p-3 border border-red-700/40">
                <p className="text-base font-semibold text-white mb-1.5">{banInfo.reason}</p>
                <p className="text-xs text-red-200/70">Restricted for service integrity</p>
              </div>
            </div>

            {/* What happens next */}
            <div className="flex-1 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 flex flex-col min-h-0">
              <div className="flex items-start gap-2.5 mb-3">
                <svg className="w-4.5 h-4.5 text-blue-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-sm font-semibold text-white">What happens next?</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-2.5 p-3 bg-slate-900/30 rounded-lg">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm text-slate-200 font-medium">Admin reviews appeal</p>
                    <p className="text-xs text-slate-400">Decision within {banInfo.reviewTime}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-3 bg-slate-900/30 rounded-lg">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-1.5 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm text-slate-200 font-medium">Auto unban if accepted</p>
                    <p className="text-xs text-slate-400">Instant access restoration</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right column - Appeal */}
          <div className="flex flex-col min-h-0">
            
            {!isSubmitted ? (
              <div className="flex-1 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-4 border border-slate-700/50 flex flex-col min-h-0">
                <h3 className="text-sm font-semibold text-white mb-2.5">Need Help?</h3>
                <p className="text-xs text-slate-400 mb-4">Submit appeal if this is a mistake</p>
                
                {!showAppealForm ? (
                  <div className="flex-1 flex flex-col justify-center items-center">
                    <div className="mb-4 text-center">
                      <p className="text-sm text-slate-300 mb-1.5 font-medium">Think this is a mistake?</p>
                      <p className="text-xs text-slate-500">Admin will review your case</p>
                    </div>
                    <button
                      onClick={() => setShowAppealForm(true)}
                      className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-medium py-3 px-5 rounded-lg transition-all text-sm flex items-center justify-center gap-2"
                    >
                      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Submit Appeal
                    </button>
                    <div className="mt-3 text-xs text-slate-400">Review: {banInfo.reviewTime}</div>
                  </div>
                ) : (
                  <form onSubmit={handleAppealSubmit} className="flex-1 flex flex-col space-y-2.5 min-h-0">
                    <div className="flex-1 min-h-0">
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Why should we review this? (min 20 characters)
                      </label>
                      <textarea
                        value={appealText}
                        onChange={(e) => setAppealText(e.target.value)}
                        placeholder="Explain why you believe this should be reviewed..."
                        className="w-full h-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
                        required
                        minLength={20}
                      />
                    </div>
                    {submitError && (
                      <p className="text-xs text-red-400">{submitError}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-slate-700 disabled:to-slate-800 text-white font-medium py-2 px-4 rounded-lg transition-all text-sm flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Submitting...
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                        className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-all text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="flex-1 bg-gradient-to-br from-green-900/20 to-green-800/20 rounded-xl p-5 border border-green-700/30 flex items-center justify-center min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2.5">
                    <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Appeal Submitted!</h3>
                  <p className="text-xs text-green-300 mb-2">Review within {banInfo.reviewTime}</p>
                  <p className="text-[10px] text-green-400/70">This message will disappear in 5 seconds</p>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-slate-800/40 via-slate-800/50 to-slate-800/40 border-t border-slate-700/50 rounded-xl px-6 py-2.5 mt-2.5 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-slate-400">System Operational</span>
              </div>
              <div className="h-3 w-px bg-slate-700"></div>
              <div className="text-slate-500">Security Protocol v2.1</div>
            </div>
            
            <div className="text-sm text-slate-400 font-medium">
              © 2025 Gaurav Portfolio
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-slate-500">Review: {banInfo.reviewTime}</div>
              <div className="h-3 w-px bg-slate-700"></div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Restricted</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
