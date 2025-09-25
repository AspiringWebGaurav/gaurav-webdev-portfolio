// app/page.tsx
// Secure entry point with enterprise-grade session generation

"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { secureSessionClient } from "@/lib/secureSessionClient";

// Enhanced loading component for session generation
const SecureSessionLoader = () => {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<'initializing' | 'fingerprinting' | 'requesting' | 'validating' | 'complete'>('initializing');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const stages = [
      { name: 'initializing', duration: 800, label: 'Initializing secure session...' },
      { name: 'fingerprinting', duration: 600, label: 'Generating device fingerprint...' },
      { name: 'requesting', duration: 1200, label: 'Requesting signed token...' },
      { name: 'validating', duration: 400, label: 'Validating cryptographic signature...' },
      { name: 'complete', duration: 200, label: 'Session established' },
    ];

    let currentStage = 0;
    let currentProgress = 0;

    interval = setInterval(() => {
      if (currentStage < stages.length) {
        const stage = stages[currentStage];
        setStage(stage.name as any);
        
        currentProgress += (100 / stages.length) / (stage.duration / 50);
        
        if (currentProgress >= (currentStage + 1) * (100 / stages.length)) {
          currentStage++;
          if (currentStage < stages.length) {
            currentProgress = currentStage * (100 / stages.length);
          }
        }
        
        setProgress(Math.min(currentProgress, 100));
        
        if (currentStage >= stages.length) {
          clearInterval(interval);
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const getStageLabel = () => {
    switch (stage) {
      case 'initializing': return 'Initializing secure session...';
      case 'fingerprinting': return 'Generating device fingerprint...';
      case 'requesting': return 'Requesting signed token...';
      case 'validating': return 'Validating cryptographic signature...';
      case 'complete': return 'Session established successfully';
      default: return 'Processing...';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black-100">
      <div className="flex flex-col items-center space-y-8 max-w-md mx-auto text-center">
        {/* Security badge */}
        <div className="flex items-center space-x-3 bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-green-400 text-sm font-medium">Enterprise Security Active</span>
        </div>

        {/* Main circular loader */}
        <div className="relative w-32 h-32">
          {/* Background circle */}
          <div className="absolute inset-0 rounded-full border-4 border-gray-700/30"></div>

          {/* Progress circle */}
          <svg
            className="absolute inset-0 w-full h-full transform -rotate-90"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="url(#securityGradient)"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              className="transition-all duration-200 ease-out"
            />
            <defs>
              <linearGradient id="securityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="50%" stopColor="#06B6D4" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {Math.round(progress)}%
              </div>
              <div className="text-xs text-gray-400 mt-1">Secured</div>
            </div>
          </div>
        </div>

        {/* Stage indicator */}
        <div className="space-y-3">
          <div className="text-lg text-gray-300 font-medium">
            {getStageLabel()}
          </div>
          
          {/* Security features */}
          <div className="grid grid-cols-2 gap-4 mt-6 text-xs">
            <div className="flex items-center space-x-2 text-gray-400">
              <div className={`w-2 h-2 rounded-full ${stage === 'fingerprinting' || progress > 25 ? 'bg-green-500' : 'bg-gray-600'}`}></div>
              <span>Device Fingerprint</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <div className={`w-2 h-2 rounded-full ${stage === 'requesting' || progress > 50 ? 'bg-green-500' : 'bg-gray-600'}`}></div>
              <span>HMAC Signature</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <div className={`w-2 h-2 rounded-full ${stage === 'validating' || progress > 75 ? 'bg-green-500' : 'bg-gray-600'}`}></div>
              <span>Token Binding</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <div className={`w-2 h-2 rounded-full ${stage === 'complete' || progress === 100 ? 'bg-green-500' : 'bg-gray-600'}`}></div>
              <span>Session Active</span>
            </div>
          </div>
        </div>

        {/* Security notice */}
        <div className="text-xs text-gray-500 max-w-sm">
          This session is cryptographically signed and bound to your device for maximum security.
        </div>
      </div>
    </div>
  );
};

// Error component for session failures
const SessionError = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="min-h-screen bg-black-100 flex items-center justify-center">
    <div className="max-w-md mx-auto text-center p-6">
      <div className="w-20 h-20 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center">
        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      
      <h1 className="text-2xl font-bold text-white mb-3">Session Generation Failed</h1>
      <p className="text-gray-300 mb-6">{error}</p>
      
      <div className="space-y-3">
        <button
          onClick={onRetry}
          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium"
        >
          Try Again
        </button>
        
        <div className="text-xs text-gray-500">
          If the problem persists, please check your internet connection and try again.
        </div>
      </div>
    </div>
  </div>
);

export default function SecureEntryPage() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeSession();
  }, []);

  const initializeSession = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Check if we already have a valid session
      const existingUUID = await secureSessionClient.getValidUUID();
      
      if (existingUUID) {
        console.log('[SecureEntry] Using existing valid session:', existingUUID);
        // Redirect immediately for faster experience
        router.replace(`/${existingUUID}`);
        return;
      }

      // Try to preserve any existing UUID for ban system
      const storedUUID = localStorage.getItem('visitor_uuid');
      
      // Generate new secure session
      console.log('[SecureEntry] Generating new secure session...', { storedUUID });
      const success = await secureSessionClient.requestNewSession(storedUUID || undefined);
      
      if (success) {
        const newUUID = await secureSessionClient.getValidUUID();
        if (newUUID) {
          console.log('[SecureEntry] Secure session ready:', newUUID);
          // Immediate redirect for better user experience
          router.replace(`/${newUUID}`);
        } else {
          throw new Error('Failed to retrieve session UUID after generation');
        }
      } else {
        throw new Error('Session generation failed - please try again');
      }
    } catch (err) {
      console.error('[SecureEntry] Session initialization failed:', err);
      
      // More user-friendly error messages
      let errorMessage = 'Session initialization failed. Please try again.';
      if (err instanceof Error) {
        if (err.message.includes('429')) {
          errorMessage = 'Server is busy. Please wait a moment and try again.';
        } else if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = 'Network connection issue. Please check your connection and try again.';
        }
      }
      
      setError(errorMessage);
      setIsGenerating(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    initializeSession();
  };

  if (error) {
    return <SessionError error={error} onRetry={handleRetry} />;
  }

  if (isGenerating) {
    return <SecureSessionLoader />;
  }

  // Fallback (should never be reached)
  return (
    <div className="min-h-screen bg-black-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-lg">Initializing secure session...</p>
      </div>
    </div>
  );
}
