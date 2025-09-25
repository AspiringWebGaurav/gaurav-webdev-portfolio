"use client";
import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { secureSessionClient } from "@/lib/secureSessionClient";
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
import { TURNSTILE_COOKIE_CONFIG, TURNSTILE_SESSION_STORAGE_CONFIG } from "@/lib/types/turnstile";
import { MinimalSuspense } from "@/components/loading/EnhancedSuspense";
import AskMeAnythingModal from "@/components/askDirectly/AskMeAnythingModal";

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

const UUIDPortfolioPage = () => {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(true);
  const [currentUUID, setCurrentUUID] = useState<string>("");
  const [sessionError, setSessionError] = useState<string | null>(null);
  
  // Turnstile verification state
  const [showEntryGate, setShowEntryGate] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  
  // AI Assistant state tracking
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [shouldOpenToAskDirectly, setShouldOpenToAskDirectly] = useState(false);
  
  // Ask Me Anything modal state
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);

  // Handle notification click to open AI assistant
  const handleOpenAssistantFromNotification = () => {
    setShouldOpenToAskDirectly(true);
  };

  // Handle Ask Me Anything modal
  const handleOpenAskModal = () => {
    setIsAskModalOpen(true);
  };

  const handleCloseAskModal = () => {
    setIsAskModalOpen(false);
    // Clear the auto-open flag when modal is closed
    try {
      sessionStorage.removeItem('openAskModalOnLoad');
    } catch (error) {
      // Silent failure for storage access
    }
  };

  // Check for auto-open modal flag (for direct URL access backwards compatibility)
  useEffect(() => {
    if (isVerified && !isLoading) {
      try {
        const shouldAutoOpen = sessionStorage.getItem('openAskModalOnLoad');
        if (shouldAutoOpen === 'true') {
          // Auto-open modal for direct URL access
          setIsAskModalOpen(true);
          sessionStorage.removeItem('openAskModalOnLoad'); // Clean up flag
        }
      } catch (error) {
        // Silent failure for storage access
      }
    }
  }, [isVerified, isLoading]);

  useEffect(() => {
    const initializeSecureSession = async () => {
      try {
        const urlUUID = params.uuid as string;
        smartLogger.devOnly.debug("Initializing secure session", { urlUUID });

        // Enhanced session handling - preserves UUID for ban system
        const validUUID = await secureSessionClient.getValidUUID(urlUUID);
        
        if (!validUUID) {
          // No valid session - could be first time or network issue
          smartLogger.devOnly.debug("No valid session available, requesting new session");
          
          // For ban system compatibility, try to preserve the URL UUID
          if (urlUUID) {
            // Try to generate session with the URL UUID (server will validate/reject if needed)
            const newSessionSuccess = await secureSessionClient.requestNewSession(urlUUID);
            if (newSessionSuccess) {
              const newValidUUID = await secureSessionClient.getValidUUID();
              if (newValidUUID) {
                setCurrentUUID(newValidUUID);
                setIsValidating(false);
                
                // If UUID changed, redirect to the new UUID
                if (newValidUUID !== urlUUID) {
                  router.replace(`/${newValidUUID}`);
                }
                return;
              }
            }
          }
          
          // Fallback - redirect to entry point for new session
          smartLogger.devOnly.debug("Unable to establish session, redirecting to entry point");
          router.replace('/');
          return;
        }

        // Check if URL UUID matches the server-issued UUID
        if (urlUUID && urlUUID !== validUUID) {
          // UUID mismatch - check if this is tampering or legitimate redirect needed
          smartLogger.devOnly.debug("URL UUID mismatch with session", {
            urlUUID,
            validUUID
          });
          
          // For ban system compatibility, redirect to the valid UUID
          router.replace(`/${validUUID}`);
          return;
        }

        // If no UUID in URL, redirect to the correct UUID
        if (!urlUUID) {
          smartLogger.devOnly.debug("No UUID in URL, redirecting to session UUID");
          router.replace(`/${validUUID}`);
          return;
        }

        // Success - valid session with matching UUID
        setCurrentUUID(validUUID);
        setIsValidating(false);
        smartLogger.devOnly.debug("Secure session validated", { uuid: validUUID });

      } catch (error) {
        smartLogger.api.error("Secure session initialization failed", { error });
        
        // More lenient error handling - don't immediately fail
        const urlUUID = params.uuid as string;
        if (urlUUID) {
          // Try one more time with a delay for network issues
          setTimeout(async () => {
            try {
              const retryUUID = await secureSessionClient.getValidUUID(urlUUID);
              if (retryUUID) {
                setCurrentUUID(retryUUID);
                setIsValidating(false);
                if (retryUUID !== urlUUID) {
                  router.replace(`/${retryUUID}`);
                }
                return;
              }
            } catch (retryError) {
              smartLogger.devOnly.debug("Retry also failed", retryError);
            }
            
            // Final fallback - redirect to entry point
            router.replace('/');
          }, 2000); // 2 second delay
        } else {
          router.replace('/');
        }
      }
    };

    initializeSecureSession();
  }, [params.uuid, router]);

  useEffect(() => {
    if (!isValidating) {
      // Check Turnstile verification after UUID validation
      checkTurnstileVerification();
    }
  }, [isValidating]);

  // Session-based verification checking
  const checkTurnstileVerification = () => {
    try {
      console.log('[UUIDPortfolio] Checking session-based verification status...');
      
      // 1. Check for existing session cookie (expires when browser closes)
      const cookies = document.cookie.split(';');
      const turnstileCookie = cookies.find(cookie =>
        cookie.trim().startsWith(`${TURNSTILE_COOKIE_CONFIG.name}=`)
      );

      if (turnstileCookie) {
        const cookieValue = turnstileCookie.split('=')[1];
        
        if (cookieValue && isValidSessionCookieFormat(cookieValue)) {
          console.log('[UUIDPortfolio] ✅ Valid session cookie found - skipping verification');
          setIsVerified(true);
          
          // Update sessionStorage as backup for this session
          updateSessionStorageVerification();
          
          // Start portfolio loading immediately
          setTimeout(() => {
            setIsLoading(false);
          }, 300); // Faster loading for verified users
          return;
        }
      }
      
      // 2. Check sessionStorage backup (same session only)
      const sessionVerification = getSessionStorageVerification();
      if (sessionVerification.isValid) {
        console.log('[UUIDPortfolio] ✅ Valid session verification found - skipping Turnstile');
        setIsVerified(true);
        setTimeout(() => {
          setIsLoading(false);
        }, 300);
        return;
      }

      // 3. No valid verification found - show entry gate
      console.log('[UUIDPortfolio] ❌ No valid verification found - showing entry gate');
      
      setTimeout(() => {
        setIsLoading(false);
        setShowEntryGate(true);
      }, 800);

    } catch (error) {
      console.error('[UUIDPortfolio] Error checking verification:', error);
      // On error, show entry gate for security
      setTimeout(() => {
        setIsLoading(false);
        setShowEntryGate(true);
      }, 1000);
    }
  };

  // Session cookie format validation (client-side only)
  const isValidSessionCookieFormat = (cookieValue: string): boolean => {
    try {
      const parts = cookieValue.split('-');
      if (parts.length !== 4) return false;
      
      const [timestamp] = parts;
      const cookieTime = parseInt(timestamp);
      
      // For session cookies, we only verify basic format
      // No age validation needed since they expire with browser session
      return !isNaN(cookieTime);
    } catch {
      return false;
    }
  };

  // Get sessionStorage verification status
  const getSessionStorageVerification = (): {
    isValid: boolean;
    verifiedAt?: Date;
  } => {
    try {
      const stored = sessionStorage.getItem(TURNSTILE_SESSION_STORAGE_CONFIG.sessionStorageKey);
      if (!stored) return { isValid: false };
      
      const data = JSON.parse(stored);
      const verifiedAt = new Date(data.verifiedAt);
      
      // Session storage is always valid if it exists (automatically cleared when session ends)
      return { isValid: true, verifiedAt };
    } catch (error) {
      console.warn('[UUIDPortfolio] Error reading sessionStorage verification:', error);
      return { isValid: false };
    }
  };

  // Update sessionStorage verification
  const updateSessionStorageVerification = () => {
    try {
      const verificationData = {
        verifiedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        version: '2.0',
        method: 'turnstile_session'
      };
      
      sessionStorage.setItem(
        TURNSTILE_SESSION_STORAGE_CONFIG.sessionStorageKey,
        JSON.stringify(verificationData)
      );
      
      console.log('[UUIDPortfolio] ✅ sessionStorage verification updated');
    } catch (error) {
      console.warn('[UUIDPortfolio] Failed to update sessionStorage verification:', error);
    }
  };

  // Handle successful Turnstile verification with session storage
  const handleTurnstileSuccess = () => {
    console.log('[UUIDPortfolio] ✅ Turnstile verification successful');
    setIsVerified(true);
    setShowEntryGate(false);
    
    // Update sessionStorage for this session
    updateSessionStorageVerification();
    
    // Track verification for analytics (optional)
    try {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'turnstile_verification', {
          event_category: 'security',
          event_label: 'successful',
          custom_parameters: {
            verification_method: 'turnstile_session',
            is_repeat_visitor: !!sessionStorage.getItem(TURNSTILE_SESSION_STORAGE_CONFIG.sessionStorageKey)
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

  // Show loading while validating session
  if (isValidating) {
    return (
      <div className="min-h-screen bg-black-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Validating secure session...</p>
          <p className="text-gray-400 text-sm mt-2">Verifying cryptographic signatures</p>
        </div>
      </div>
    );
  }

  // Show security error if session validation failed
  if (sessionError) {
    return (
      <div className="min-h-screen bg-black-100 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-3">Access Denied</h1>
          <p className="text-gray-300 mb-6">{sessionError}</p>
          
          <div className="bg-gray-800/50 rounded-lg p-4 mb-6 border border-gray-700">
            <h2 className="text-sm font-semibold text-gray-200 mb-2">Security Notice</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              This application uses enterprise-grade security with cryptographically signed session tokens.
              Invalid or tampered sessions are automatically rejected to protect against unauthorized access.
            </p>
          </div>
          
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
          >
            Request New Session
          </button>
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
              <Hero onAskDirectlyClick={handleOpenAskModal} />
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
                onOpenAskModal={handleOpenAskModal}
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

          {/* Ask Me Anything Modal */}
          <AskMeAnythingModal
            isOpen={isAskModalOpen}
            onClose={handleCloseAskModal}
            currentUUID={currentUUID}
          />

        </main>
      </NotificationProvider>
    </EnhancedBanGate>
  );
};

export default UUIDPortfolioPage;