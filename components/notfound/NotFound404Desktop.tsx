'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ContactFormModal from '@/components/ContactFormModal';

export default function NotFound404Desktop() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showContactModal, setShowContactModal] = useState(false);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleBackHome = () => {
    router.push('/');
  };

  const handleReachOut = () => {
    setShowContactModal(true);
  };

  return (
    <>
      <div className="h-screen w-screen bg-gradient-to-br from-black via-slate-900 to-black text-white overflow-hidden flex flex-col">
        {/* Ambient background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>

        {/* Main content container - Full screen */}
        <div className="relative flex-1 flex flex-col px-8 py-4 min-h-0">
          
          {/* Top branding bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/30 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-base">G</span>
              </div>
              <div>
                <h2 className="text-white font-semibold text-sm">Gaurav Portfolio</h2>
                <p className="text-slate-400 text-xs">Lost in Space</p>
              </div>
            </div>
            
            {/* Center clock and date */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4">
              <div className="flex items-center gap-2 text-base text-slate-200">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-mono font-medium" suppressHydrationWarning>
                  {currentTime.toLocaleTimeString()}
                </span>
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

            <div className="inline-flex items-center gap-3 bg-purple-500/20 px-4 py-2 rounded-lg border border-purple-500/30">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-purple-300">404 Not Found</span>
              </div>
            </div>
          </div>
          
          {/* Header section */}
          <div className="bg-gradient-to-r from-purple-900/40 to-blue-800/40 border border-purple-700/30 rounded-xl p-5 mt-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-purple-500/20 rounded-xl flex items-center justify-center border border-purple-500/30">
                  <svg className="w-7 h-7 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Page Not Found</h1>
                  <p className="text-purple-300 text-sm">The page you're looking for doesn't exist</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content grid - Fills remaining space */}
          <div className="flex-1 grid md:grid-cols-2 gap-3 mt-3 min-h-0">
            
            {/* Left column - What happened */}
            <div className="flex flex-col gap-3 min-h-0">
              
              {/* What happened */}
              <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 backdrop-blur-sm flex-shrink-0">
                <div className="flex items-start gap-3 mb-3">
                  <svg className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-base font-medium text-slate-300">What happened?</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-slate-900/30 rounded-lg">
                    <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm text-slate-200 font-medium">Invalid URL</p>
                      <p className="text-xs text-slate-400">The URL you entered doesn't match any page</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-slate-900/30 rounded-lg">
                    <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm text-slate-200 font-medium">Page Removed</p>
                      <p className="text-xs text-slate-400">This page may have been deleted or moved</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-slate-900/30 rounded-lg">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm text-slate-200 font-medium">Broken Link</p>
                      <p className="text-xs text-slate-400">The link you followed might be outdated</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Large 404 Display */}
              <div className="flex-1 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-8 border border-slate-700/50 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center">
                  <div className="relative">
                    <h2 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-purple-600 animate-pulse">
                      404
                    </h2>
                    <div className="absolute inset-0 text-9xl font-black text-purple-500/20 blur-2xl">
                      404
                    </div>
                  </div>
                  <p className="text-xl text-slate-300 font-semibold mt-4 tracking-wider">ERROR NOT FOUND</p>
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                    <p className="text-sm text-slate-400">Page does not exist</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column - What can you do */}
            <div className="flex flex-col gap-3 min-h-0">
              
              {/* Actions */}
              <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 backdrop-blur-sm flex-shrink-0">
                <div className="flex items-start gap-3 mb-4">
                  <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-base font-semibold text-white">What can you do?</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-slate-900/30 rounded-lg">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm text-slate-200 font-medium">Return to Homepage</p>
                      <p className="text-xs text-slate-400">Start fresh from the main page</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-slate-900/30 rounded-lg">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm text-slate-200 font-medium">Check the URL</p>
                      <p className="text-xs text-slate-400">Make sure the address is correct</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-slate-900/30 rounded-lg">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm text-slate-200 font-medium">Contact Me</p>
                      <p className="text-xs text-slate-400">Let me know if you need help finding something</p>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-6 space-y-3">
                  <button
                    onClick={handleBackHome}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg shadow-purple-500/50 hover:shadow-purple-600/60 hover:scale-[1.02]"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Back to Homepage
                  </button>
                  
                  <button
                    onClick={handleReachOut}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-white font-semibold rounded-lg transition-all duration-300 border border-slate-600 hover:border-slate-500"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Lost? Reach out to me
                  </button>
                </div>
              </div>

              {/* Quick tips */}
              <div className="flex-1 bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl p-5 border border-blue-700/30 backdrop-blur-sm">
                <div className="flex items-start gap-3 mb-3">
                  <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h3 className="text-base font-semibold text-white">Quick Tips</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-slate-300">
                    <span className="text-blue-400 font-semibold">Tip:</span> Use the navigation menu to explore my portfolio
                  </p>
                  <p className="text-sm text-slate-300">
                    <span className="text-purple-400 font-semibold">Info:</span> All my projects and work are on the homepage
                  </p>
                  <p className="text-sm text-slate-300">
                    <span className="text-green-400 font-semibold">Help:</span> Feel free to contact me for any inquiries
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Form Modal */}
      <ContactFormModal 
        isOpen={showContactModal} 
        onClose={() => setShowContactModal(false)} 
      />
    </>
  );
}
