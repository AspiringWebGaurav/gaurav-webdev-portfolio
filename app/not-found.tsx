/**
 * COMPLETELY STANDALONE 404 - NO API calls on load
 * SUSPENSION-AWARE: Shows different message during suspension mode
 */

'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { FaLocationArrow } from 'react-icons/fa6';
import { useSuspensionStatus } from '@/contexts/SuspensionStatusContext';
import Logo from '@/components/Logo';

// Lazy load ContactFormModal to avoid loading contexts on page load
const ContactFormModal = lazy(() => import('@/components/ContactFormModal'));

export default function NotFound() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const { status: suspensionStatus } = useSuspensionStatus();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
      setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => { clearInterval(timer); window.removeEventListener('resize', handleResize); };
  }, []);

  const handleBackHome = () => {
    // If suspension is active, go to suspended page instead
    if (suspensionStatus.enabled) {
      window.location.href = '/suspnd_srv_temp_0x8f2_auth_v5_mnt_0xb3a7_svc_verify_suspnd_0x4e1_session_temp_chk_0xd9c2_lock_validate_0x7f3_access_suspnd_monitor_0xa6b_gate_srv_0x2e8_render_temp_state_0x5c1_final';
    } else {
      window.location.href = '/';
    }
  };

  // Show different message during suspension
  const isSuspended = suspensionStatus.enabled;
  const pageTitle = isSuspended ? 'Services Suspended' : 'Page Not Found';
  const pageMessage = isSuspended 
    ? 'All services are currently suspended' 
    : "The page you're looking for doesn't exist";
  const statusLabel = isSuspended ? 'Services Suspended' : '404 Not Found';
  const statusColor = isSuspended ? 'red' : 'purple';

  return (
    <>
    <div className="h-screen w-screen bg-gradient-to-br from-black via-slate-900 to-black text-white overflow-hidden flex flex-col fixed inset-0 z-[99999]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative flex-1 flex flex-col px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 py-2 sm:py-3 md:py-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 sm:pb-3 border-b border-slate-700/30 flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3">
              <Logo variant="small" />
              <div className="min-w-0">
                <h2 className={`text-white font-semibold font-mono ${isMobile ? 'text-xs' : 'text-sm'} truncate`}>
                  <span className="text-purple">&gt;</span> gaurav_portfolio
                </h2>
                <p className={`text-slate-400 ${isMobile ? 'text-[9px]' : 'text-[10px] md:text-xs'} font-mono truncate`}>
                  route_not_found
                </p>
              </div>
            </div>
            
            {/* Clock & Date - Hidden on mobile, compact on tablet */}
            {!isMobile && (
              <div className={`${isTablet ? 'relative' : 'absolute left-1/2 -translate-x-1/2'} flex items-center gap-2 md:gap-4`}>
                <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-slate-200">
                  <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="font-mono font-medium whitespace-nowrap" suppressHydrationWarning>{currentTime.toLocaleTimeString()}</span>
                </div>
                <div className="h-3 md:h-4 w-px bg-slate-600"></div>
                <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-slate-300">
                  <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <span className="font-medium whitespace-nowrap" suppressHydrationWarning>{currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            )}
            
            <div className="inline-flex items-center gap-1.5 sm:gap-2 md:gap-3 bg-purple-500/20 px-1.5 sm:px-2 md:px-4 py-1 md:py-2 rounded-lg border border-purple-500/30 flex-shrink-0" style={{
              backgroundColor: isSuspended ? 'rgba(239, 68, 68, 0.2)' : undefined,
              borderColor: isSuspended ? 'rgba(239, 68, 68, 0.3)' : undefined
            }}>
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-purple-500 rounded-full animate-pulse" style={{
                backgroundColor: isSuspended ? '#ef4444' : undefined
              }}></div>
              <span className={`${isMobile ? 'text-[9px]' : 'text-[10px] sm:text-xs md:text-sm'} font-medium text-purple-300 whitespace-nowrap`} style={{
                color: isSuspended ? '#fca5a5' : undefined
              }}>{statusLabel}</span>
            </div>
          </div>

          {/* Main Content - Fully Responsive */}
          <div className="flex-1 flex items-center justify-center py-3 sm:py-4 md:py-6 lg:py-8 overflow-hidden">
            <div className="w-full max-w-7xl mx-auto">
              {/* Alert Banner - Responsive */}
              <div className="bg-gradient-to-r from-purple-900/40 to-blue-800/40 border border-purple-700/30 rounded-lg md:rounded-xl p-2.5 sm:p-3 md:p-4 mb-3 sm:mb-4 md:mb-6" style={{
                background: isSuspended ? 'linear-gradient(to right, rgba(127, 29, 29, 0.4), rgba(153, 27, 27, 0.4))' : undefined,
                borderColor: isSuspended ? 'rgba(239, 68, 68, 0.3)' : undefined
              }}>
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                  <div className={`${isMobile ? 'w-7 h-7' : isTablet ? 'w-9 h-9' : 'w-10 h-10'} bg-purple-500/20 rounded-lg md:rounded-xl flex items-center justify-center border border-purple-500/30 flex-shrink-0`} style={{
                    backgroundColor: isSuspended ? 'rgba(239, 68, 68, 0.2)' : undefined,
                    borderColor: isSuspended ? 'rgba(239, 68, 68, 0.3)' : undefined
                  }}>
                    {isSuspended ? (
                      <svg className={`${isMobile ? 'w-4 h-4' : isTablet ? 'w-5 h-5' : 'w-6 h-6'} text-red-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    ) : (
                      <svg className={`${isMobile ? 'w-4 h-4' : isTablet ? 'w-5 h-5' : 'w-6 h-6'} text-purple-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className={`${isMobile ? 'text-sm' : isTablet ? 'text-lg' : 'text-xl lg:text-2xl'} font-bold font-mono text-white truncate`}>
                      <span className="text-purple">&gt;</span> {isSuspended ? 'services_suspended' : '404_route_not_found'}
                    </h1>
                    <p className={`${isSuspended ? 'text-red-300' : 'text-purple-300'} ${isMobile ? 'text-[10px]' : isTablet ? 'text-xs' : 'text-sm'} font-mono truncate`}>
                      {isSuspended ? 'all_services_offline' : 'requested_path_does_not_exist'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content Grid - Mobile Stack, Desktop Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                {/* 404 Display - Responsive Heights */}
                <div className={`bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-lg md:rounded-xl ${isMobile ? 'p-6' : isTablet ? 'p-8' : 'p-10 lg:p-12'} border border-slate-700/50 backdrop-blur-sm flex items-center justify-center ${isMobile ? 'min-h-[200px]' : isTablet ? 'min-h-[240px]' : 'min-h-[280px] lg:min-h-[320px]'}`}>
                  <div className="text-center">
                    <h2 className={`${isMobile ? 'text-6xl' : isTablet ? 'text-7xl' : 'text-8xl lg:text-9xl'} font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-purple-600 animate-pulse leading-none`}>404</h2>
                    <p className={`${isMobile ? 'text-xs' : isTablet ? 'text-sm' : 'text-lg lg:text-xl'} text-slate-300 font-semibold mt-3 sm:mt-4 md:mt-5 tracking-wider`}>ERROR NOT FOUND</p>
                  </div>
                </div>

                {/* Actions Panel - Responsive Spacing */}
                <div className={`bg-slate-800/50 rounded-lg md:rounded-xl ${isMobile ? 'p-4' : isTablet ? 'p-5' : 'p-6 md:p-7 lg:p-8'} border border-slate-700/50 backdrop-blur-sm flex flex-col justify-between ${isMobile ? 'min-h-[200px]' : isTablet ? 'min-h-[240px]' : 'min-h-[280px] lg:min-h-[320px]'}`}>
                  <div>
                    <h3 className={`${isMobile ? 'text-base' : isTablet ? 'text-lg' : 'text-xl'} font-bold text-white mb-3 sm:mb-4 md:mb-5`}>What can you do?</h3>
                    
                    {/* Suggestions - Touch-Friendly on Mobile */}
                    <div className="space-y-2 sm:space-y-2.5 md:space-y-3 mb-4 sm:mb-5 md:mb-6">
                      <div className={`flex items-center gap-2 sm:gap-2.5 md:gap-3 ${isMobile ? 'p-2.5' : 'p-3'} bg-slate-900/40 rounded-lg border border-slate-700/30`}>
                        <div className={`${isMobile ? 'w-1.5 h-1.5' : 'w-2 h-2'} ${isSuspended ? 'bg-red-400' : 'bg-green-400'} rounded-full flex-shrink-0`}></div>
                        <div className="flex-1 min-w-0">
                          <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-slate-200 font-semibold truncate`}>
                            {isSuspended ? 'Go to Suspension Page' : 'Return to Homepage'}
                          </p>
                          <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-slate-400 mt-0.5 truncate`}>
                            {isSuspended ? 'View suspension details' : 'Start fresh from the main page'}
                          </p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-2 sm:gap-2.5 md:gap-3 ${isMobile ? 'p-2.5' : 'p-3'} bg-slate-900/40 rounded-lg border border-slate-700/30`}>
                        <div className={`${isMobile ? 'w-1.5 h-1.5' : 'w-2 h-2'} bg-purple-400 rounded-full flex-shrink-0`}></div>
                        <div className="flex-1 min-w-0">
                          <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-slate-200 font-semibold truncate`}>Contact Me</p>
                          <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-slate-400 mt-0.5 truncate`}>Let me know if you need help</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons - Touch-Friendly Sizes */}
                  <div className="space-y-2.5 sm:space-y-3">
                    <button 
                      onClick={handleBackHome} 
                      className={`w-full flex items-center justify-center gap-2 ${isMobile ? 'px-4 py-3' : 'px-6 py-3.5'} bg-gradient-to-r ${isSuspended ? 'from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-red-500/50 hover:shadow-red-600/60' : 'from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-purple-500/50 hover:shadow-purple-600/60'} active:scale-[0.98] text-white font-semibold rounded-lg transition-all shadow-lg ${isMobile ? 'text-sm' : 'text-base'}`}
                    >
                      <svg className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {isSuspended ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        )}
                      </svg>
                      {isSuspended ? 'View Suspension Details' : 'Back to Homepage'}
                    </button>

                    <button 
                      onClick={() => setIsContactModalOpen(true)} 
                      className={`relative inline-flex ${isMobile ? 'h-[46px]' : 'h-[50px]'} w-full overflow-hidden rounded-lg p-[1px] focus:outline-none active:scale-[0.98] transition-transform`}
                    >
                      <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                      <span className={`inline-flex h-full w-full cursor-pointer items-center justify-center rounded-lg bg-slate-950 ${isMobile ? 'px-4' : 'px-7'} ${isMobile ? 'text-sm' : 'text-base'} font-semibold text-white backdrop-blur-3xl gap-2`}>
                        <FaLocationArrow className={isMobile ? 'text-xs' : 'text-sm'} />
                        Lost? Reach out to me!
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isContactModalOpen && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
          <ContactFormModal 
            isOpen={isContactModalOpen} 
            onClose={() => setIsContactModalOpen(false)} 
          />
        </Suspense>
      )}
    </>
  );
}
