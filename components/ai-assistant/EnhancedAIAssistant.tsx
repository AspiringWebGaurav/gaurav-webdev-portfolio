"use client";

import React, { useState, useEffect } from 'react';
import { AssistantState, ASSISTANT_CONFIG, PopupSessionState } from './types';
import EnhancedAssistantPopup from './EnhancedAssistantPopup';
import AITooltip from './AITooltip';
import AIAutoPopup from './AIAutoPopup';
import JarvisAnimations from './JarvisAnimations';
import { silentLogger } from '@/utils/secureLogger';
import { aiServiceHealthMonitor } from '@/utils/aiServiceLayer';

interface EnhancedAIAssistantProps {
  isPortfolioLoaded?: boolean;
  onAssistantStateChange?: (state: AssistantState) => void;
}

const EnhancedAIAssistant: React.FC<EnhancedAIAssistantProps> = ({
  isPortfolioLoaded = false,
  onAssistantStateChange
}) => {
  const [assistantState, setAssistantState] = useState<AssistantState>({
    isVisible: false,
    isMinimized: false,
    activeTab: 'predefined',
    isLoading: false
  });

  const [hasShownInitialPopup, setHasShownInitialPopup] = useState(false);
  
  // Tooltip state management
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasOpenedAI, setHasOpenedAI] = useState(false);
  const [tooltipTimer, setTooltipTimer] = useState<NodeJS.Timeout | null>(null);

  // Auto-popup state management
  const [showAutoPopup, setShowAutoPopup] = useState(false);
  const [popupSessionState, setPopupSessionState] = useState<PopupSessionState>({
    hasShownInitialPopup: false,
    hasOpenedAI: false,
    lastPopupTime: '',
    popupCount: 0,
    sessionStartTime: new Date().toISOString()
  });
  const [autoPopupTimer, setAutoPopupTimer] = useState<NodeJS.Timeout | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Service health monitoring
  const [serviceHealth, setServiceHealth] = useState({
    firebase: 'healthy' as 'healthy' | 'degraded' | 'down',
    openrouter: 'healthy' as 'healthy' | 'degraded' | 'down',
    overall: 'healthy' as 'healthy' | 'degraded' | 'down'
  });

  // Notify parent of state changes
  useEffect(() => {
    onAssistantStateChange?.(assistantState);
  }, [assistantState, onAssistantStateChange]);

  // Client-side hydration check
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Set service health to healthy when API key is configured
  useEffect(() => {
    const updateHealthStatus = () => {
      const apiKeyConfigured = !!(process.env.NEXT_PUBLIC_OPENROUTER_API_KEY);
      
      if (apiKeyConfigured) {
        setServiceHealth({
          firebase: 'healthy',
          openrouter: 'healthy',
          overall: 'healthy'
        });
        console.log('🔵 AI Service Status: Healthy (API key configured)');
      } else {
        setServiceHealth({
          firebase: 'degraded',
          openrouter: 'down',
          overall: 'degraded'
        });
        console.log('🟡 AI Service Status: Degraded (No API key)');
      }
    };

    updateHealthStatus();
  }, []);

  // Handle user preferences and auto-popup session state (localStorage) - CLIENT SIDE ONLY
  useEffect(() => {
    if (!isClient) return; // Prevent hydration mismatch
    
    try {
      const savedPreferences = localStorage.getItem('ai-assistant-preferences');
      
      if (savedPreferences) {
        const preferences = JSON.parse(savedPreferences);
        if (preferences.hasClosedBefore) {
          // If user has closed before, don't auto-show
          setHasShownInitialPopup(true);
        }
        if (preferences.hasOpenedAI) {
          // If user has opened AI in this session, don't show tooltip
          setHasOpenedAI(true);
        }
      }

      // IMPORTANT: Reset popup session state for each new session
      // This ensures recurring popups work in both dev and production
      const newSessionState: PopupSessionState = {
        hasShownInitialPopup: false,
        hasOpenedAI: false,
        lastPopupTime: '',
        popupCount: 0,
        sessionStartTime: new Date().toISOString()
      };
      
      setPopupSessionState(newSessionState);
      
      // Only persist user preferences, not session-specific popup state
      console.log('🔄 Enhanced AI Assistant: Session reset for consistent popup behavior');
      
    } catch (error) {
      console.warn('Failed to load assistant preferences:', error);
    }
  }, [isClient]);

  // Tooltip management - show after portfolio loads if AI hasn't been opened
  useEffect(() => {
    if (isPortfolioLoaded && !hasOpenedAI && !assistantState.isVisible) {
      // Show tooltip after a delay
      const initialDelay = setTimeout(() => {
        setShowTooltip(true);
      }, 3000); // 3 seconds after portfolio loads

      return () => clearTimeout(initialDelay);
    }
  }, [isPortfolioLoaded, hasOpenedAI, assistantState.isVisible]);

  // Recurring tooltip timer - every 1 minute if AI hasn't been opened
  useEffect(() => {
    if (isPortfolioLoaded && !hasOpenedAI && !assistantState.isVisible && !showTooltip) {
      const recurringTimer = setInterval(() => {
        setShowTooltip(true);
      }, 60000); // 1 minute

      setTooltipTimer(recurringTimer);

      return () => {
        clearInterval(recurringTimer);
        setTooltipTimer(null);
      };
    } else if (tooltipTimer) {
      clearInterval(tooltipTimer);
      setTooltipTimer(null);
    }
  }, [isPortfolioLoaded, hasOpenedAI, assistantState.isVisible, showTooltip]);

  // Auto-popup management - show after portfolio loads if AI hasn't been opened
  useEffect(() => {
    if (!isClient || !isPortfolioLoaded || popupSessionState.hasOpenedAI || assistantState.isVisible) {
      return;
    }

    if (!popupSessionState.hasShownInitialPopup) {
      // Show initial popup after a delay
      const initialDelay = setTimeout(() => {
        silentLogger.silent('Enhanced AI Assistant: Showing initial popup');
        setShowAutoPopup(true);
        setPopupSessionState(prev => ({
          ...prev,
          hasShownInitialPopup: true,
          lastPopupTime: new Date().toISOString(),
          popupCount: prev.popupCount + 1
        }));
      }, 4000); // 4 seconds after portfolio loads

      return () => clearTimeout(initialDelay);
    }
  }, [isClient, isPortfolioLoaded, popupSessionState.hasOpenedAI, popupSessionState.hasShownInitialPopup, assistantState.isVisible]);

  // Recurring auto-popup timer - every 9 seconds if AI hasn't been opened
  useEffect(() => {
    if (!isClient ||
        !isPortfolioLoaded ||
        popupSessionState.hasOpenedAI ||
        assistantState.isVisible ||
        !popupSessionState.hasShownInitialPopup) {
      
      // Clear any existing timer
      if (autoPopupTimer) {
        clearInterval(autoPopupTimer);
        setAutoPopupTimer(null);
      }
      return;
    }
      
    console.log('🔄 Enhanced AI Assistant: Setting up recurring popup timer (9s interval)');
    const recurringTimer = setInterval(() => {
      console.log('🎯 Enhanced AI Assistant: Showing recurring popup');
      setShowAutoPopup(true);
      setPopupSessionState(prev => ({
        ...prev,
        lastPopupTime: new Date().toISOString(),
        popupCount: prev.popupCount + 1
      }));
    }, 9000); // 9 seconds

    setAutoPopupTimer(recurringTimer);

    return () => {
      clearInterval(recurringTimer);
      setAutoPopupTimer(null);
    };
  }, [isClient, isPortfolioLoaded, popupSessionState.hasOpenedAI, assistantState.isVisible, popupSessionState.hasShownInitialPopup]);

  // Clean up timers when component unmounts
  useEffect(() => {
    return () => {
      if (tooltipTimer) {
        clearInterval(tooltipTimer);
      }
      if (autoPopupTimer) {
        clearInterval(autoPopupTimer);
      }
    };
  }, [tooltipTimer, autoPopupTimer]);

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
    setShowTooltip(false);
    setShowAutoPopup(false); // Hide auto-popup when AI is opened
    
    // Update popup session state to stop all future popups
    setPopupSessionState(prev => ({
      ...prev,
      hasOpenedAI: true
    }));
    
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

  const handleTooltipClose = () => {
    setShowTooltip(false);
  };

  const handleTooltipOpenAI = () => {
    setShowTooltip(false);
    handleShow();
  };

  const handleAutoPopupDismiss = () => {
    silentLogger.silent('Enhanced AI Assistant: Popup dismissed');
    setShowAutoPopup(false);
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

  // Get status indicator color based on service health
  const getStatusColor = () => {
    if (serviceHealth.overall === 'healthy') return 'bg-green-500';
    if (serviceHealth.overall === 'degraded') return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <>
      <EnhancedAssistantPopup
        isVisible={assistantState.isVisible}
        onClose={handleClose}
        onMinimize={handleMinimize}
        isMinimized={assistantState.isMinimized}
      />

      {/* AI Auto-Popup - Advertisement style popup from AI bubble (Primary popup system) */}
      {!assistantState.isVisible && !popupSessionState.hasOpenedAI && (
        <AIAutoPopup
          isVisible={showAutoPopup}
          onDismiss={handleAutoPopupDismiss}
          message="Hi, Gaurav's Personal AI is here."
          autoHideDelay={4000}
        />
      )}

      {/* AI Tooltip - Fallback popup (only show if auto-popup is not active) */}
      {!assistantState.isVisible && !showAutoPopup && popupSessionState.hasOpenedAI && (
        <AITooltip
          isVisible={showTooltip}
          onClose={handleTooltipClose}
          onOpenAI={handleTooltipOpenAI}
        />
      )}

      {/* ENHANCED: Floating Action Button with Always Visible Animation */}
      {!assistantState.isVisible && (
        <button
          onClick={handleShow}
          className="fixed top-1/2 right-4 sm:right-6 -translate-y-1/2 z-40 group"
          title="Gaurav's Personal Assistant (Ctrl+Shift+A)"
          aria-label="Gaurav's Assistant"
        >
          {/* Outer glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300 animate-pulse"></div>

          {/* Main button with ALWAYS VISIBLE Jarvis Animation */}
          <div className="relative w-14 h-14 bg-black-100/90 backdrop-blur-md border border-blue-500/50 rounded-full flex items-center justify-center group-hover:bg-black-100/95 group-hover:border-blue-400/70 transition-all duration-300 hover:scale-110">
            {/* Gradient border effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-[1px]">
              <div className="w-full h-full bg-black-100 rounded-full"></div>
            </div>

            {/* ENHANCED: Always visible Jarvis Animation instead of static icon */}
            <div className="relative z-10">
              <JarvisAnimations
                isActive={true} // Always active
                size="small"
                color="blue"
                intensity="medium"
              />
            </div>

            {/* Service status indicator */}
            <div className={`absolute -top-1 -right-1 w-3 h-3 ${getStatusColor()} rounded-full animate-pulse opacity-80`} />
          </div>

          {/* Enhanced Tooltip with service status */}
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-2 bg-black-100/90 backdrop-blur-md border border-white/[0.2] rounded-lg text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="font-medium">AI Assistant</div>
            <div className="text-gray-400 text-xs mt-1">
              Status: {serviceHealth.overall}
            </div>
            <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-white/[0.2]"></div>
          </div>
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
      `}</style>
    </>
  );
};

export default EnhancedAIAssistant;