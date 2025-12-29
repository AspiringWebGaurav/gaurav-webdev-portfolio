'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ContactFormModal from '@/components/ContactFormModal';

export default function NotFound404Mobile() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showContactModal, setShowContactModal] = useState(false);

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
      <div className="min-h-screen w-screen bg-gradient-to-br from-black via-slate-900 to-black text-white overflow-auto">
        {/* Ambient background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>

        {/* Main content */}
        <div className="relative px-4 py-4 space-y-4">
          
          {/* Top bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/30">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">G</span>
              </div>
              <div>
                <h2 className="text-white font-semibold text-xs">Gaurav Portfolio</h2>
                <p className="text-slate-400 text-[10px]">Lost in Space</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 bg-purple-500/20 px-2 py-1 rounded border border-purple-500/30">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-medium text-purple-300">404</span>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-center justify-center gap-3 py-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-200">
              <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-mono text-[11px]" suppressHydrationWarning>
                {currentTime.toLocaleTimeString()}
              </span>
            </div>
            <div className="h-3 w-px bg-slate-600"></div>
            <div className="text-xs text-slate-300">
              <span className="text-[11px]" suppressHydrationWarning>
                {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
          
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-900/40 to-blue-800/40 border border-purple-700/30 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center border border-purple-500/30">
                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-base font-bold text-white">Page Not Found</h1>
                <p className="text-purple-300 text-xs">Doesn't exist</p>
              </div>
            </div>
          </div>

          {/* 404 Display */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-lg p-6 border border-slate-700/50">
            <div className="text-center">
              <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-purple-600 animate-pulse">
                404
              </h2>
              <p className="text-sm text-slate-300 font-semibold mt-2">ERROR NOT FOUND</p>
            </div>
          </div>

          {/* What happened */}
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
            <h3 className="text-xs font-semibold text-white mb-2">What happened?</h3>
            <div className="space-y-1.5">
              <div className="flex items-start gap-2 text-xs text-slate-300">
                <div className="w-1 h-1 bg-red-400 rounded-full mt-1.5"></div>
                <p className="text-[11px]">Invalid URL</p>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-300">
                <div className="w-1 h-1 bg-orange-400 rounded-full mt-1.5"></div>
                <p className="text-[11px]">Page removed</p>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-300">
                <div className="w-1 h-1 bg-yellow-400 rounded-full mt-1.5"></div>
                <p className="text-[11px]">Broken link</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
            <h3 className="text-xs font-semibold text-white mb-2">What can you do?</h3>
            <div className="space-y-1.5 mb-3">
              <div className="flex items-start gap-2 text-xs text-slate-300">
                <div className="w-1 h-1 bg-green-400 rounded-full mt-1.5"></div>
                <p className="text-[11px]">Return to homepage</p>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-300">
                <div className="w-1 h-1 bg-blue-400 rounded-full mt-1.5"></div>
                <p className="text-[11px]">Check the URL</p>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-300">
                <div className="w-1 h-1 bg-purple-400 rounded-full mt-1.5"></div>
                <p className="text-[11px]">Contact me</p>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleBackHome}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all text-xs"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Back Home
              </button>
              
              <button
                onClick={handleReachOut}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white font-semibold rounded-lg transition-all border border-slate-600 text-xs"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Lost? Reach out
              </button>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-lg p-3 border border-blue-700/30">
            <h3 className="text-xs font-semibold text-white mb-2">Quick Tip</h3>
            <p className="text-[11px] text-slate-300">
              All my projects and work are available on the homepage. Feel free to explore!
            </p>
          </div>
        </div>
      </div>

      <ContactFormModal 
        isOpen={showContactModal} 
        onClose={() => setShowContactModal(false)} 
      />
    </>
  );
}
