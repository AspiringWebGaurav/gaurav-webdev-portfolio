'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface BanInfo {
  reason: string;
  category?: string;
  timestamp: string;
  reviewTime: string;
}

interface DesktopScreenProps {
  banInfo: BanInfo;
}

interface AppealStatus {
  id: string;
  status: 'pending' | 'accepted' | 'rejected';
  appealReason: string;
  reviewNotes?: string;
  createdAt: string;
  reviewedAt?: string;
}

export default function DesktopScreen({ banInfo }: DesktopScreenProps) {
  const router = useRouter();
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [appealText, setAppealText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [appealStatus, setAppealStatus] = useState<AppealStatus | null>(null);
  const [hasAppeal, setHasAppeal] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Update time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check for existing appeal on mount and poll for updates
  useEffect(() => {
    const checkAppealStatus = async () => {
      try {
        const response = await fetch('/api/ban-appeals/status');
        const result = await response.json();

        if (result.success && result.hasAppeal) {
          setHasAppeal(true);
          setAppealStatus(result.appeal);
        } else {
          setHasAppeal(false);
          setAppealStatus(null);
        }
      } catch (error) {
        console.error('Error checking appeal status:', error);
      } finally {
        setIsLoadingStatus(false);
      }
    };

    // Check immediately
    checkAppealStatus();

    // Poll every 10 seconds for status updates
    const pollInterval = setInterval(checkAppealStatus, 10000);

    return () => clearInterval(pollInterval);
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
      const response = await fetch('/api/ban-appeals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appealReason: appealText.trim(),
          banReason: banInfo.reason,
          banCategory: banInfo.category || 'normal',
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update local state immediately
        setHasAppeal(true);
        setAppealStatus({
          id: result.data.id,
          status: 'pending',
          appealReason: result.data.appealReason,
          createdAt: result.data.createdAt,
        });
        setAppealText('');
        setShowAppealForm(false);
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
      {/* Ambient background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Main content container - Full screen */}
      <div className="relative flex-1 flex flex-col px-8 py-4 min-h-0">
        
        {/* Top branding bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-base">G</span>
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm">Gaurav Portfolio</h2>
              <p className="text-slate-400 text-xs">Security Services Active</p>
            </div>
          </div>
          
          {/* Center clock and date */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4">
            <div className="flex items-center gap-2 text-base text-slate-200">
              <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-mono font-medium" suppressHydrationWarning>{currentTime.toLocaleTimeString()}</span>
            </div>
            <div className="h-4 w-px bg-slate-600"></div>
            <div className="flex items-center gap-2 text-base text-slate-300">
              <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium" suppressHydrationWarning>
                {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-3 bg-red-500/20 px-4 py-2 rounded-lg border border-red-500/30">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium text-red-300">Executive Review</span>
            </div>
            <div className="h-4 w-px bg-red-500/30"></div>
            <span className="text-xs text-red-400">{banInfo.reviewTime}</span>
          </div>
        </div>
        
        {/* Header section */}
        <div className="bg-gradient-to-r from-red-900/40 to-red-800/40 border border-red-700/30 rounded-xl p-5 mt-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-red-500/20 rounded-xl flex items-center justify-center border border-red-500/30">
                <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Access Permanently Restricted</h1>
                <p className="text-red-300 text-sm">Critical security violation</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content grid - Fills remaining space */}
        <div className="flex-1 grid md:grid-cols-2 gap-3 mt-3 min-h-0">
          
          {/* Left column - Ban details */}
          <div className="flex flex-col gap-3 min-h-0">
            
            {/* Restriction reason */}
            <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 backdrop-blur-sm flex-shrink-0">
              <div className="flex items-start gap-3 mb-3">
                <svg className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-base font-medium text-slate-300">Restriction Reason</h3>
              </div>
              <div className="bg-gradient-to-r from-red-900/30 to-red-800/30 rounded-lg p-4 border border-red-700/40">
                <p className="text-lg font-semibold text-white mb-2">{banInfo.reason}</p>
                <p className="text-sm text-red-200/70 leading-relaxed">Access restricted due to critical security violations to protect service integrity.</p>
              </div>
            </div>

            {/* What happens next */}
            <div className="flex-1 bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 backdrop-blur-sm flex flex-col min-h-0">
              <div className="flex items-start gap-3 mb-3">
                <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-base font-semibold text-white">What happens next?</h3>
              </div>
              <div className="space-y-4 flex-1">
                <div className="flex items-start gap-3 p-4 bg-slate-900/30 rounded-lg">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-base text-slate-200 font-medium mb-1">Admin will review your appeal</p>
                    <p className="text-sm text-slate-400">Decision within {banInfo.reviewTime}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-slate-900/30 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-base text-slate-200 font-medium mb-1">Automatic unban if accepted</p>
                    <p className="text-sm text-slate-400">Instant access restoration</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right column - Appeal section */}
          <div className="flex flex-col min-h-0">
            
            {isLoadingStatus ? (
              <div className="flex-1 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-5 border border-slate-700/50 backdrop-blur-sm flex items-center justify-center min-h-0">
                <div className="text-center">
                  <svg className="animate-spin h-8 w-8 text-slate-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-sm text-slate-400">Checking appeal status...</p>
                </div>
              </div>
            ) : hasAppeal && appealStatus ? (
              // Show dynamic appeal status
              <div className={`flex-1 rounded-xl p-6 border backdrop-blur-sm flex items-center justify-center min-h-0 ${
                appealStatus.status === 'pending' 
                  ? 'bg-gradient-to-br from-green-900/20 to-green-800/20 border-green-700/30'
                  : appealStatus.status === 'rejected'
                  ? 'bg-gradient-to-br from-red-900/20 to-red-800/20 border-red-700/30'
                  : 'bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-700/30'
              }`}>
                <div className="text-center max-w-md">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${
                    appealStatus.status === 'pending'
                      ? 'bg-green-500/20'
                      : appealStatus.status === 'rejected'
                      ? 'bg-red-500/20'
                      : 'bg-blue-500/20'
                  }`}>
                    {appealStatus.status === 'pending' ? (
                      <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : appealStatus.status === 'rejected' ? (
                      <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <h3 className={`text-xl font-semibold mb-3 ${
                    appealStatus.status === 'pending'
                      ? 'text-white'
                      : appealStatus.status === 'rejected'
                      ? 'text-white'
                      : 'text-white'
                  }`}>
                    {appealStatus.status === 'pending' && 'Appeal Submitted!'}
                    {appealStatus.status === 'rejected' && 'Appeal Rejected'}
                    {appealStatus.status === 'accepted' && 'Appeal Accepted!'}
                  </h3>
                  <p className={`text-sm mb-4 leading-relaxed ${
                    appealStatus.status === 'pending'
                      ? 'text-green-300'
                      : appealStatus.status === 'rejected'
                      ? 'text-red-300'
                      : 'text-blue-300'
                  }`}>
                    {appealStatus.status === 'pending' && `Admin will review your appeal within ${banInfo.reviewTime}.`}
                    {appealStatus.status === 'rejected' && 'Your appeal has been reviewed and rejected by admin.'}
                    {appealStatus.status === 'accepted' && 'Your appeal has been accepted. You will be unbanned shortly.'}
                  </p>
                  
                  {appealStatus.reviewNotes && appealStatus.status === 'rejected' && (
                    <div className="bg-red-900/20 border border-red-700/40 rounded-lg p-4 mb-4">
                      <p className="text-xs text-red-200 font-medium mb-1">Admin Notes:</p>
                      <p className="text-sm text-red-300">{appealStatus.reviewNotes}</p>
                    </div>
                  )}
                  
                  <div className={`border rounded-lg p-4 ${
                    appealStatus.status === 'pending'
                      ? 'bg-green-900/20 border-green-700/40'
                      : appealStatus.status === 'rejected'
                      ? 'bg-red-900/20 border-red-700/40'
                      : 'bg-blue-900/20 border-blue-700/40'
                  }`}>
                    <p className={`text-sm font-medium ${
                      appealStatus.status === 'pending'
                        ? 'text-green-200'
                        : appealStatus.status === 'rejected'
                        ? 'text-red-200'
                        : 'text-blue-200'
                    }`}>
                      {appealStatus.status === 'pending' && 'If approved, you\'ll be unbanned automatically'}
                      {appealStatus.status === 'rejected' && 'You cannot submit another appeal for this ban'}
                      {appealStatus.status === 'accepted' && 'Access will be restored immediately'}
                    </p>
                  </div>
                  
                  <div className="mt-4 text-xs text-slate-400">
                    Submitted: {new Date(appealStatus.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ) : (
              // No appeal yet - show form
              <div className="flex-1 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-5 border border-slate-700/50 backdrop-blur-sm flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <h3 className="text-base font-semibold text-white">Need Help?</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Processing Time</span>
                  </div>
                </div>
                <p className="text-sm text-slate-400 mb-5 leading-relaxed flex-shrink-0">Submit an appeal if you believe this was a mistake. Admin will review and decide.</p>
                
                {!showAppealForm ? (
                  <div className="flex-1 flex flex-col justify-center items-center">
                    <div className="mb-6 text-center max-w-md">
                      <p className="text-base text-slate-300 mb-2 font-medium">Think this is a mistake?</p>
                      <p className="text-sm text-slate-500">Submit an appeal and admin will review your case.</p>
                    </div>
                    <button
                      onClick={() => setShowAppealForm(true)}
                      className="w-full max-w-md bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-medium py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 text-base"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Submit Appeal
                    </button>
                    <div className="mt-5 p-3 bg-slate-900/30 rounded-lg border border-slate-700/30 w-full max-w-md">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Review time:</span>
                        <span className="text-blue-400 font-medium">{banInfo.reviewTime}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleAppealSubmit} className="flex-1 flex flex-col space-y-3 min-h-0">
                    {submitError && (
                      <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 flex items-start gap-2">
                        <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-red-300">{submitError}</p>
                      </div>
                    )}
                    <div className="flex-1 min-h-0">
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Why should we review this? (minimum 20 characters)
                      </label>
                      <textarea
                        value={appealText}
                        onChange={(e) => {
                          setAppealText(e.target.value);
                          setSubmitError(null);
                        }}
                        placeholder="Explain why you believe this restriction should be reviewed..."
                        className="w-full h-full bg-slate-900/50 border border-slate-700 rounded-lg p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 resize-none"
                        required
                        minLength={20}
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        {appealText.length}/1000 characters
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-slate-700 disabled:to-slate-800 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Submitting...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            Submit Appeal
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAppealForm(false)}
                        className="px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-all duration-200 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

          </div>

        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-slate-800/40 via-slate-800/50 to-slate-800/40 border-t border-slate-700/50 rounded-xl px-8 py-3.5 mt-3 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-slate-400">System Operational</span>
              </div>
              <div className="h-3 w-px bg-slate-700"></div>
              <div className="text-xs text-slate-500">Security Protocol v2.1</div>
            </div>
            
            <div className="text-sm text-slate-400 font-medium">
              © 2025 Gaurav Portfolio
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-xs text-slate-500">Review Time: {banInfo.reviewTime}</div>
              <div className="h-3 w-px bg-slate-700"></div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Access Restricted</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
