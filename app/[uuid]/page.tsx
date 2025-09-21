"use client";
import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { v4 as uuidv4 } from 'uuid';
import EnhancedBanGate from "@/components/EnhancedBanGate";
import VisitorTracker from "@/components/VisitorTracker";
import EnhancedVisitorStatusWatcher from "@/components/EnhancedVisitorStatusWatcher";
import { VisitorTrackingNotice } from "@/components/VisitorTracker";
import EntryGateModal from "@/components/EntryGateModal";
import Hero from "@/components/Hero";
import { FloatingNav } from "../../components/ui/FloatingNav";
import { navItems } from "@/data";
import Grid from "@/components/Grid";
import RecentProjects from "@/components/RecentProjects";
import Clients from "@/components/Clients";
import Experience from "@/components/Experience";
import Approach from "@/components/Approach";
import Footer from "@/components/Footer";
import EnterpriseAIAssistant from "@/components/ai-assistant/enhanced/EnterpriseAIAssistant";
import AIErrorBoundary from "@/components/ai-assistant/AIErrorBoundary";
import NotificationSystem from "@/components/direct-questions/NotificationSystem";
import NotificationProvider from "@/components/direct-questions/NotificationProvider";
import { initializeVisitorEventListener, cleanupVisitorEventListener } from "@/lib/visitorEventListener";
import { smartLogger } from '@/utils/smartLogger';
import { TURNSTILE_COOKIE_CONFIG, TURNSTILE_STORAGE_CONFIG } from "@/lib/types/turnstile";
import { MinimalSuspense } from "@/components/loading/EnhancedSuspense";

// Unique Circular Loader Component
const UniquePortfolioLoader = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        // More controlled increment to ensure steady progress
        const increment = Math.random() * 8 + 2; // Random between 2-10
        const newProgress = Math.min(prev + increment, 100);

        // Clear interval when reaching 100%
        if (newProgress >= 100) {
          clearInterval(interval);
        }

        return newProgress;
      });
    }, 150); // Slightly slower for better control

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black-100">
      <div className="flex flex-col items-center space-y-6">
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
              stroke="url(#gradient)"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              className="transition-all duration-300 ease-out"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="50%" stopColor="#06B6D4" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {Math.round(progress)}%
              </div>
              <div className="text-xs text-gray-400 mt-1">Loading</div>
            </div>
          </div>
        </div>

        {/* Loading text with dots animation */}
        <div className="flex items-center space-x-1">
          <span className="text-lg text-gray-300">Preparing portfolio</span>
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-80 h-1 bg-gray-700/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-cyan-500 to-emerald-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

// Go to Top Button Component
const GoToTopButton = ({ hideWhenAIOpen }: { hideWhenAIOpen: boolean }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when page is scrolled down 300px and AI Assistant is not open
      if (window.pageYOffset > 300 && !hideWhenAIOpen) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    // Also check visibility when hideWhenAIOpen changes
    toggleVisibility();
    
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, [hideWhenAIOpen]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-20 right-2 sm:bottom-6 sm:right-2 md:bottom-20 md:right-12 z-30 group"
      aria-label="Go to top"
    >
      {/* Outer glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-emerald-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300"></div>

      {/* Main button */}
      <div className="relative w-14 h-14 bg-black-100/80 backdrop-blur-md border border-white/[0.2] rounded-full flex items-center justify-center group-hover:bg-black-100/90 transition-all duration-300 hover:scale-110">
        {/* Gradient border effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 via-cyan-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-[1px]">
          <div className="w-full h-full bg-black-100 rounded-full"></div>
        </div>

        {/* Arrow icon */}
        <svg
          className="relative z-10 w-6 h-6 text-white group-hover:text-cyan-400 transition-colors duration-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      </div>
    </button>
  );
};

// UUID validation function
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

const UUIDPortfolioPage = () => {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(true);
  const [currentUUID, setCurrentUUID] = useState<string>("");
  
  // Turnstile verification state
  const [showEntryGate, setShowEntryGate] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  
  // AI Assistant state tracking
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [shouldOpenToAskDirectly, setShouldOpenToAskDirectly] = useState(false);


  // Handle notification click to open AI assistant
  const handleOpenAssistantFromNotification = () => {
    setShouldOpenToAskDirectly(true);
  };

  useEffect(() => {
    const validateAndSetUUID = () => {
      const urlUUID = params.uuid as string;
      
      smartLogger.devOnly.debug("URL UUID received");

      // Validate UUID format
      if (!urlUUID || !isValidUUID(urlUUID)) {
        smartLogger.devOnly.debug("Invalid UUID in URL, generating new one");
        const newUUID = uuidv4();
        router.replace(`/${newUUID}`);
        return;
      }

      // Set the UUID for the session
      setCurrentUUID(urlUUID);
      
      // Store in localStorage for persistence (fallback)
      try {
        localStorage.setItem('visitor_uuid', urlUUID);
        sessionStorage.setItem('visitor_uuid', urlUUID);
      } catch (error) {
        smartLogger.devOnly.debug("Storage not available");
      }

      setIsValidating(false);
      smartLogger.devOnly.debug("UUID validated and set");
    };

    validateAndSetUUID();
  }, [params.uuid, router]);

  useEffect(() => {
    if (!isValidating) {
      // Check Turnstile verification after UUID validation
      checkTurnstileVerification();
    }
  }, [isValidating]);

  // Enhanced verification checking with persistent storage
  const checkTurnstileVerification = () => {
    try {
      console.log('[UUIDPortfolio] Checking verification status...');
      
      // 1. Check for existing HTTP-only cookie (most secure, shorter duration)
      const cookies = document.cookie.split(';');
      const turnstileCookie = cookies.find(cookie =>
        cookie.trim().startsWith(`${TURNSTILE_COOKIE_CONFIG.name}=`)
      );

      if (turnstileCookie) {
        const cookieValue = turnstileCookie.split('=')[1];
        
        if (cookieValue && isValidCookieFormat(cookieValue)) {
          console.log('[UUIDPortfolio] ✅ Valid Turnstile cookie found - skipping verification');
          setIsVerified(true);
          
          // Update localStorage as backup
          updateLocalStorageVerification();
          
          // Start portfolio loading immediately
          setTimeout(() => {
            setIsLoading(false);
          }, 300); // Faster loading for verified users
          return;
        }
      }
      
      // 2. Check localStorage backup (longer duration, less secure but better UX)
      const localVerification = getLocalStorageVerification();
      if (localVerification.isValid) {
        console.log('[UUIDPortfolio] ✅ Valid localStorage verification found - skipping Turnstile');
        
        // Check if verification is still fresh enough (within refresh threshold)
        if (localVerification.shouldRefresh) {
          console.log('[UUIDPortfolio] 🔄 Verification old but valid - refreshing in background');
          // Allow access but refresh verification silently in background
          setIsVerified(true);
          setTimeout(() => {
            setIsLoading(false);
          }, 300);
          
          // Refresh verification in background without showing modal
          refreshVerificationInBackground();
          return;
        } else {
          console.log('[UUIDPortfolio] ✅ Fresh localStorage verification - immediate access');
          setIsVerified(true);
          setTimeout(() => {
            setIsLoading(false);
          }, 300);
          return;
        }
      }

      // 3. No valid verification found - show entry gate
      console.log('[UUIDPortfolio] ❌ No valid verification found - showing entry gate');
      
      const timer = setTimeout(() => {
        setIsLoading(false);
        setShowEntryGate(true);
      }, 800); // Slightly faster for first-time users

    } catch (error) {
      console.error('[UUIDPortfolio] Error checking verification:', error);
      // On error, show entry gate for security
      setTimeout(() => {
        setIsLoading(false);
        setShowEntryGate(true);
      }, 1000);
    }
  };

  // Enhanced cookie format validation (client-side only)
  const isValidCookieFormat = (cookieValue: string): boolean => {
    try {
      const parts = cookieValue.split('-');
      if (parts.length !== 4) return false;
      
      const [timestamp] = parts;
      const cookieTime = parseInt(timestamp);
      const now = Date.now();
      const maxAge = TURNSTILE_COOKIE_CONFIG.maxAge * 1000;
      
      return !isNaN(cookieTime) && (now - cookieTime) <= maxAge;
    } catch {
      return false;
    }
  };

  // Get localStorage verification status
  const getLocalStorageVerification = (): {
    isValid: boolean;
    shouldRefresh: boolean;
    verifiedAt?: Date;
  } => {
    try {
      const stored = localStorage.getItem(TURNSTILE_STORAGE_CONFIG.localStorageKey);
      if (!stored) return { isValid: false, shouldRefresh: false };
      
      const data = JSON.parse(stored);
      const verifiedAt = new Date(data.verifiedAt);
      const now = new Date();
      const ageInSeconds = (now.getTime() - verifiedAt.getTime()) / 1000;
      
      // Check if verification is still valid (within max age)
      const isValid = ageInSeconds <= TURNSTILE_STORAGE_CONFIG.maxAge;
      
      // Check if verification should be refreshed (older than refresh threshold)
      const shouldRefresh = ageInSeconds > TURNSTILE_STORAGE_CONFIG.refreshThreshold;
      
      return { isValid, shouldRefresh, verifiedAt };
    } catch (error) {
      console.warn('[UUIDPortfolio] Error reading localStorage verification:', error);
      return { isValid: false, shouldRefresh: false };
    }
  };

  // Update localStorage verification
  const updateLocalStorageVerification = () => {
    try {
      const verificationData = {
        verifiedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        version: '1.0',
        method: 'turnstile'
      };
      
      localStorage.setItem(
        TURNSTILE_STORAGE_CONFIG.localStorageKey,
        JSON.stringify(verificationData)
      );
      
      console.log('[UUIDPortfolio] ✅ localStorage verification updated');
    } catch (error) {
      console.warn('[UUIDPortfolio] Failed to update localStorage verification:', error);
    }
  };

  // Background verification refresh (silent, no modal)
  const refreshVerificationInBackground = async () => {
    try {
      console.log('[UUIDPortfolio] 🔄 Refreshing verification in background...');
      
      // Make a simple request to verify endpoint to refresh the cookie
      const response = await fetch('/api/turnstile/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshType: 'background',
          userAgent: navigator.userAgent
        })
      });
      
      if (response.ok) {
        console.log('[UUIDPortfolio] ✅ Background verification refresh successful');
        updateLocalStorageVerification();
      } else {
        console.warn('[UUIDPortfolio] Background verification refresh failed - will require re-verification on next visit');
      }
    } catch (error) {
      console.warn('[UUIDPortfolio] Background verification refresh failed:', error);
      // Silent failure - user experience not affected
    }
  };

  // Handle successful Turnstile verification with persistent storage
  const handleTurnstileSuccess = () => {
    console.log('[UUIDPortfolio] ✅ Turnstile verification successful');
    setIsVerified(true);
    setShowEntryGate(false);
    
    // Update localStorage for persistent verification
    updateLocalStorageVerification();
    
    // Track verification for analytics (optional)
    try {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'turnstile_verification', {
          event_category: 'security',
          event_label: 'successful',
          custom_parameters: {
            verification_method: 'turnstile',
            is_repeat_visitor: !!localStorage.getItem(TURNSTILE_STORAGE_CONFIG.localStorageKey)
          }
        });
      }
    } catch (error) {
      // Silent failure for analytics
    }
    
    // Small delay for smooth transition
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
  };

  // Handle Turnstile verification errors
  const handleTurnstileError = (error: string) => {
    console.warn('[UUIDPortfolio] Turnstile error:', error);
    // Keep the entry gate open for retry
  };

  // Initialize visitor event listener for admin action cleanup
  useEffect(() => {
    if (!isValidating && currentUUID) {
      let mounted = true;

      const initializeEventListener = async () => {
        try {
          await initializeVisitorEventListener(currentUUID);
          if (mounted) {
            console.log('✅ Visitor event listener initialized for admin action cleanup');
          }
        } catch (error) {
          console.error('❌ Failed to initialize visitor event listener:', error);
        }
      };

      initializeEventListener();

      return () => {
        mounted = false;
        cleanupVisitorEventListener();
      };
    }
  }, [isValidating, currentUUID]);

  // Show loading while validating UUID
  if (isValidating) {
    return (
      <div className="min-h-screen bg-black-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Validating access...</p>
        </div>
      </div>
    );
  }

  return (
    <EnhancedBanGate uuid={currentUUID}>
      <NotificationProvider visitorUuid={currentUUID}>
        {/* Turnstile Entry Gate Modal */}
        <EntryGateModal
          isVisible={showEntryGate}
          onVerificationSuccess={handleTurnstileSuccess}
          onError={handleTurnstileError}
        />

        <main className="relative bg-black-100 flex justify-center items-center flex-col overflow-hidden mx-auto sm:px-10 px-5">
          {/* Enhanced Visitor Tracking System with UUID */}
          <VisitorTracker uuid={currentUUID} />
          <EnhancedVisitorStatusWatcher uuid={currentUUID} />
          <VisitorTrackingNotice />
          
          {isLoading && <UniquePortfolioLoader />}

          {/* Only show portfolio content if verified and not loading */}
          {isVerified && (
            <div
              className={`max-w-7xl w-full transition-all duration-1000 ${
                isLoading ? "opacity-0" : "opacity-100"
              }`}
            >
              <FloatingNav
                navItems={navItems}
                hideWhenAIOpen={isAIAssistantOpen}
              />
              <Hero />
              <Grid />
              <RecentProjects />
              <Clients />
              <Experience />
              <Approach />
              <Footer />
            </div>
          )}

          {/* Go to Top Button */}
          {!isLoading && isVerified && (
            <GoToTopButton hideWhenAIOpen={isAIAssistantOpen} />
          )}

          {/* Direct Questions Notification System */}
          {!isLoading && isVerified && (
            <NotificationSystem
              onOpenAssistant={handleOpenAssistantFromNotification}
            />
          )}

          {/* Enhanced AI Assistant with System Isolation and Error Boundary */}
          {isVerified && (
            <AIErrorBoundary
              onError={(error, errorInfo) => {
                smartLogger.error('AI Assistant Error', error);
                smartLogger.browserOnly.debug('Error Info', errorInfo);
              }}
            >
              <EnterpriseAIAssistant
                isPortfolioLoaded={!isLoading && isVerified}
                shouldOpenToAskDirectly={shouldOpenToAskDirectly}
                onAssistantStateChange={(state) => {
                  // Handle assistant state changes for navbar visibility
                  smartLogger.browserOnly.debug('Enhanced Assistant state changed', state);
                  setIsAIAssistantOpen(state.isVisible && !state.isMinimized);
                  
                  // Reset the open trigger once assistant is opened
                  if (state.isVisible && shouldOpenToAskDirectly) {
                    setShouldOpenToAskDirectly(false);
                  }
                }}
              />
            </AIErrorBoundary>
          )}

        </main>
      </NotificationProvider>
    </EnhancedBanGate>
  );
};

export default UUIDPortfolioPage;