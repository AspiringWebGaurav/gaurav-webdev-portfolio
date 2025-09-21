"use client";

import React, { useState, useEffect } from 'react';
import { AssistantState } from './types';
import AssistantPopup from './AssistantPopup';
import AITourModal from './tour/AITourModal';
import { silentLogger } from '@/utils/secureLogger';

interface AIAssistantProps {
  isPortfolioLoaded?: boolean;
  onAssistantStateChange?: (state: AssistantState) => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({
  isPortfolioLoaded = false,
  onAssistantStateChange
}) => {
  const [assistantState, setAssistantState] = useState<AssistantState>({
    isVisible: false,
    isMinimized: false,
    activeTab: 'predefined',
    isLoading: false
  });

  // Tour state management
  const [showTour, setShowTour] = useState(false);
  const [hasOpenedAI, setHasOpenedAI] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Notify parent of state changes
  useEffect(() => {
    onAssistantStateChange?.(assistantState);
  }, [assistantState, onAssistantStateChange]);

  // Client-side hydration check
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle user preferences from localStorage - CLIENT SIDE ONLY
  useEffect(() => {
    if (!isClient) return; // Prevent hydration mismatch
    
    try {
      const savedPreferences = localStorage.getItem('ai-assistant-preferences');
      
      if (savedPreferences) {
        const preferences = JSON.parse(savedPreferences);
        if (preferences.hasOpenedAI) {
          setHasOpenedAI(true);
        }
      }
      
      silentLogger.silent('🔄 AI Assistant: Preferences loaded from localStorage');
      
    } catch (error) {
      console.warn('Failed to load assistant preferences:', error);
    }
  }, [isClient]);

  // Tour management - show after portfolio loads if AI hasn't been opened
  useEffect(() => {
    if (isPortfolioLoaded && !hasOpenedAI && !assistantState.isVisible && isClient) {
      // Show tour after a delay for new users
      const tourTimer = setTimeout(() => {
        setShowTour(true);
        silentLogger.silent('🎯 AI Tour: Starting tour for new user');
      }, 2000); // 2 seconds after portfolio loads

      return () => clearTimeout(tourTimer);
    }
  }, [isPortfolioLoaded, hasOpenedAI, assistantState.isVisible, isClient]);

  const handleClose = () => {
    setAssistantState(prev => ({
      ...prev,
      isVisible: false,
      isMinimized: false
    }));

    // Save user preference
    try {
      localStorage.setItem('ai-assistant-preferences', JSON.stringify({
        hasClosedBefore: true,
        lastClosed: new Date().toISOString()
      }));
    } catch (error) {
      console.warn('Failed to save assistant preferences:', error);
    }
  };

  const handleMinimize = () => {
    setAssistantState(prev => ({
      ...prev,
      isMinimized: !prev.isMinimized
    }));
  };

  const handleShow = () => {
    setAssistantState(prev => ({
      ...prev,
      isVisible: true,
      isMinimized: false
    }));

    // Mark that user has opened AI and save to localStorage
    setHasOpenedAI(true);
    setShowTour(false); // Hide tour when AI is opened
    
    try {
      const savedPreferences = localStorage.getItem('ai-assistant-preferences');
      const preferences = savedPreferences ? JSON.parse(savedPreferences) : {};
      localStorage.setItem('ai-assistant-preferences', JSON.stringify({
        ...preferences,
        hasOpenedAI: true
      }));
    } catch (error) {
      console.warn('Failed to save AI opened preference:', error);
    }
  };

  // Handle tour completion - directly opens AI chat
  const handleTourComplete = () => {
    setShowTour(false);
    handleShow(); // Open AI chat interface
    silentLogger.silent('🎉 AI Tour: Completed successfully, opening chat');
  };

  // Handle tour skip
  const handleTourSkip = () => {
    setShowTour(false);
    silentLogger.silent('⏭️ AI Tour: Skipped by user');
  };

  // Handle tour close
  const handleTourClose = () => {
    setShowTour(false);
    silentLogger.silent('❌ AI Tour: Closed by user');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + A to toggle assistant
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'A') {
        event.preventDefault();
        if (assistantState.isVisible) {
          handleClose();
        } else {
          handleShow();
        }
      }

      // Escape to close assistant
      if (event.key === 'Escape' && assistantState.isVisible && !assistantState.isMinimized) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [assistantState.isVisible, assistantState.isMinimized]);

  return (
    <>
      <AssistantPopup
        isVisible={assistantState.isVisible}
        onClose={handleClose}
        onMinimize={handleMinimize}
        isMinimized={assistantState.isMinimized}
      />

      {/* New AI Tour Modal - Replaces old AIAutoPopup and AITooltip */}
      <AITourModal
        isVisible={showTour}
        onComplete={handleTourComplete}
        onSkip={handleTourSkip}
        onClose={handleTourClose}
        autoStart={true}
      />

      {/* Floating Action Button (when assistant is closed) */}
      {!assistantState.isVisible && (
        <button
          onClick={handleShow}
          className="fixed top-1/2 right-4 sm:right-6 -translate-y-1/2 z-40 group"
          title="Gaurav's Personal Assistant (Ctrl+Shift+A)"
          aria-label="Gaurav's Assistant"
        >
          {/* Outer glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300 animate-pulse"></div>

          {/* Main button */}
          <div className="relative w-14 h-14 bg-black-100/90 backdrop-blur-md border border-blue-500/50 rounded-full flex items-center justify-center group-hover:bg-black-100/95 group-hover:border-blue-400/70 transition-all duration-300 hover:scale-110">
            {/* Gradient border effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-[1px]">
              <div className="w-full h-full bg-black-100 rounded-full"></div>
            </div>

            {/* AI Icon */}
            <svg
              className="relative z-10 w-6 h-6 text-white group-hover:text-blue-400 transition-colors duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>

            {/* Notification dot - only show if tour is available */}
            {!hasOpenedAI && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-bounce opacity-80" />
            )}
          </div>

          {/* Tooltip */}
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1 bg-black-100/90 backdrop-blur-md border border-white/[0.2] rounded-lg text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            {!hasOpenedAI ? 'Take AI Tour' : 'AI Assistant'}
            <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-white/[0.2]"></div>
          </div>
        </button>
      )}

      {/* Restart Tour Button for Returning Users */}
      {hasOpenedAI && !assistantState.isVisible && !showTour && (
        <button
          onClick={() => setShowTour(true)}
          className="fixed bottom-4 right-4 sm:right-6 z-30 px-3 py-2 bg-black-100/80 backdrop-blur-md border border-white/20 rounded-lg text-white text-xs hover:bg-black-100/90 hover:border-white/40 transition-all duration-200 opacity-70 hover:opacity-100"
          title="Restart AI Tour"
          aria-label="Restart AI Tour"
        >
          🎯 Tour
        </button>
      )}

      {/* Global styles for assistant */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .animate-pulse,
          .animate-bounce {
            animation: none;
          }
        }
        
        /* High contrast support */
        @media (prefers-contrast: high) {
          .bg-black-100\/90 {
            background-color: rgba(0, 0, 0, 0.95);
          }
          
          .border-white\/20 {
            border-color: rgba(255, 255, 255, 0.4);
          }
        }
      `}</style>
    </>
  );
};

export default AIAssistant;