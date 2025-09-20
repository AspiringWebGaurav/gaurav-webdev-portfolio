"use client";

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { FaArrowLeft, FaHome, FaQuestionCircle } from 'react-icons/fa';

// Lazy load heavy components to improve initial load performance
const AskDirectlyEmbedded = lazy(() => import('@/components/askDirectly/AskDirectlyEmbedded'));
const VisitorTracker = lazy(() => import('@/components/VisitorTracker'));
const EnhancedVisitorStatusWatcher = lazy(() => import('@/components/EnhancedVisitorStatusWatcher'));

// UUID validation function
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Minimal loading component
const ComponentLoader = ({ height = "h-6" }: { height?: string }) => (
  <div className={`flex items-center justify-center ${height}`}>
    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

// Compact Guidelines component
const Guidelines = () => (
  <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-3 mb-4">
    <div className="grid grid-cols-3 gap-2 text-xs">
      <div className="text-center p-2 rounded bg-slate-800/30">
        <div className="text-green-400 text-lg mb-1">💡</div>
        <div className="text-slate-300 font-medium">What to Ask</div>
        <div className="text-slate-400 text-xs">Projects & skills</div>
      </div>
      
      <div className="text-center p-2 rounded bg-slate-800/30">
        <div className="text-yellow-400 text-lg mb-1">📝</div>
        <div className="text-slate-300 font-medium">Length</div>
        <div className="text-slate-400 text-xs">Min 10 chars</div>
      </div>
      
      <div className="text-center p-2 rounded bg-slate-800/30">
        <div className="text-blue-400 text-lg mb-1">🕒</div>
        <div className="text-slate-300 font-medium">Rate</div>
        <div className="text-slate-400 text-xs">10s cooldown</div>
      </div>
    </div>
  </div>
);

const AskMeAnythingPage = () => {
  const params = useParams();
  const router = useRouter();
  const [currentUUID, setCurrentUUID] = useState<string>("");
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const validateAndSetUUID = () => {
      const urlUUID = params.uuid as string;
      
      // Validate UUID format
      if (!urlUUID || !isValidUUID(urlUUID)) {
        router.replace('/');
        return;
      }

      // Set the UUID for the session
      setCurrentUUID(urlUUID);
      
      // Store in localStorage for persistence (non-blocking)
      requestIdleCallback(() => {
        try {
          localStorage.setItem('visitor_uuid', urlUUID);
          sessionStorage.setItem('visitor_uuid', urlUUID);
        } catch (error) {
          console.warn('Storage not available');
        }
      });

      setIsValidating(false);
    };

    // Use immediate execution for faster loading
    validateAndSetUUID();
  }, [params.uuid, router]);

  const handleBackToHome = () => {
    router.push(`/${currentUUID}`);
  };

  // Show loading while validating UUID (minimal loading state)
  if (isValidating) {
    return (
      <div className="min-h-screen bg-black-100 flex items-center justify-center">
        <div className="text-center">
          <ComponentLoader height="h-8 mb-2" />
          <p className="text-white text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black-100 flex flex-col">
      {/* Lazy load tracking components */}
      <Suspense fallback={null}>
        <VisitorTracker uuid={currentUUID} />
        <EnhancedVisitorStatusWatcher uuid={currentUUID} />
      </Suspense>
      
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="absolute inset-0 bg-gradient-to-br from-black-100 via-black-100/95 to-black-100" />

      {/* Header Navigation - Fixed Height */}
      <header className="relative z-10 border-b border-white/[0.1] bg-black-100/80 backdrop-blur-md flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Back Button */}
            <button
              onClick={handleBackToHome}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors duration-200 group text-sm"
            >
              <FaArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform duration-200" />
              <span className="hidden sm:inline">Back</span>
            </button>

            {/* Title */}
            <div className="flex items-center gap-2">
              <FaQuestionCircle className="w-4 h-4 text-blue-400" />
              <h1 className="text-base font-semibold text-white">Ask Me Anything</h1>
            </div>

            {/* Home Button */}
            <button
              onClick={handleBackToHome}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:text-white hover:bg-blue-500/20 transition-all duration-200 text-sm"
            >
              <FaHome className="w-3 h-3" />
              <span className="hidden sm:inline">Home</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Flexible Layout that fills remaining space */}
      <main className="relative z-10 flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 sm:px-6 py-4">
        
        {/* Hero Section - Compact */}
        <div className="text-center mb-4 flex-shrink-0">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-3">
            <span className="text-lg">💬</span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Ask Me Directly
          </h1>
          
          <p className="text-sm sm:text-base text-slate-300 mb-3">
            Send your questions directly to Gaurav and get personal responses
          </p>

          {/* Decorative Line */}
          <div className="flex items-center justify-center">
            <div className="h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent w-32"></div>
          </div>
        </div>

        {/* Guidelines - Compact */}
        <Guidelines />

        {/* Form Container - Takes remaining space, non-scrollable */}
        <div className="flex-1 bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden min-h-0">
          <div className="h-full">
            <Suspense fallback={
              <div className="p-6 h-full flex items-center justify-center">
                <ComponentLoader height="h-8" />
              </div>
            }>
              <AskDirectlyEmbedded
                initialView="form"
                showViewToggle={true}
                className="h-full"
              />
            </Suspense>
          </div>
        </div>

        {/* Footer Info - Compact */}
        <div className="mt-3 text-center flex-shrink-0">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-xs font-medium">Usually responds within 24 hours</span>
          </div>
        </div>
      </main>

      {/* Subtle floating elements for visual enhancement */}
      <div className="fixed top-20 left-4 w-32 h-32 bg-blue-500/3 rounded-full blur-2xl pointer-events-none"></div>
      <div className="fixed bottom-20 right-4 w-40 h-40 bg-purple-500/3 rounded-full blur-2xl pointer-events-none"></div>
    </div>
  );
};

export default AskMeAnythingPage;