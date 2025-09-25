/**
 * Cloudflare Security Verification Modal
 * Official Cloudflare-styled security verification interface
 */

"use client";

import React, { useEffect } from "react";
import "./cloudflare-styles.css";
import {
  CONFIG,
  EntryGateModalProps,
} from "./types";
import {
  CloudflareLogo,
  SecurityShield,
  CloudflareCard,
  CloudflareButton,
  CloudflareProgressBar,
  CloudflareFooter,
  CloudflareNetworkIndicator,
  generateRayId
} from "./cloudflare-components";
import {
  useVerificationState,
  useVerificationRefs,
  useVerificationLogic,
} from "./hooks";

const EntryGateModal: React.FC<EntryGateModalProps> = ({
  isVisible,
  onVerificationSuccess,
  onError,
}) => {
  // Initialize hooks (same as before)
  const state = useVerificationState();
  const refs = useVerificationRefs();
  const logic = useVerificationLogic(state, refs, onVerificationSuccess, onError);

  // Extract state and logic (same as before)
  const { loadingPhase, networkQuality, retryCount, canBypass, gateState, widgetState } = state;
  const { modalRef, widgetContainerRef, previousFocusRef } = refs;
  const { initializeTurnstileWidget, handleEmergencyBypass, handleRetry, cleanup } = logic;

  // All existing useEffect hooks remain the same for functionality preservation
  useEffect(() => {
    if (!isVisible) {
      cleanup();
      return;
    }
    previousFocusRef.current = document.activeElement as HTMLElement;
    const timer = setTimeout(() => initializeTurnstileWidget(isVisible), CONFIG.TRANSITION_DELAY);
    return () => {
      clearTimeout(timer);
      cleanup();
    };
  }, [isVisible, initializeTurnstileWidget, cleanup, previousFocusRef]);

  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => {
      if (modalRef.current) modalRef.current.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [isVisible, modalRef]);

  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Allow bypass with Ctrl+Shift+B in development
      if (CONFIG.DEV_BYPASS_ENABLED && event.ctrlKey && event.shiftKey && event.key === "B") {
        event.preventDefault();
        handleEmergencyBypass();
        return;
      }

      // Prevent escape key from closing modal (security requirement)
      if (event.key === "Escape") {
        event.preventDefault();
        console.log("[EntryGate] Escape key blocked - verification required");
      }

      // Handle tab navigation within modal
      if (event.key === "Tab") {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements && focusableElements.length > 0) {
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (event.shiftKey) {
            if (document.activeElement === firstElement) {
              event.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              event.preventDefault();
              firstElement.focus();
            }
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, handleEmergencyBypass, modalRef]);

  if (!isVisible) return null;

  // Get main title based on phase
  const getMainTitle = (): string => {
    switch (loadingPhase) {
      case 'initializing':
      case 'loading-script':
        return 'Checking your browser before accessing';
      case 'ready-for-user':
        return 'Verifying you are human';
      case 'success':
        return 'Verification successful';
      case 'error':
        return 'Verification failed';
      default:
        return 'Security verification required';
    }
  };

  // Get shield status
  const getShieldStatus = (): 'checking' | 'verified' | 'error' => {
    if (loadingPhase === 'success') return 'verified';
    if (loadingPhase === 'error') return 'error';
    return 'checking';
  };

  // Get progress percentage
  const getProgress = (): number => {
    switch (loadingPhase) {
      case 'initializing': return 10;
      case 'loading-script': return 25;
      case 'preparing-widget': return 50;
      case 'ready-for-user': return 75;
      case 'verifying': return 85;
      case 'server-verify': return 95;
      case 'success': return 100;
      case 'error': return 100;
      default: return 20;
    }
  };

  return (
    <>
      {/* Cloudflare Full-Screen Overlay */}
      <div
        ref={modalRef}
        className="fixed inset-0 w-full h-full min-h-screen z-[9999] flex items-center justify-center p-4 cf-backdrop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cloudflare-security-title"
        aria-describedby="cloudflare-security-description"
        tabIndex={-1}
      >
        {/* Cloudflare Card Container */}
        <CloudflareCard className="w-full max-w-md cf-card-shadow cf-card-mobile sm:cf-card-tablet lg:cf-card-desktop animate-in fade-in-0 zoom-in-95 duration-300">
          {/* Cloudflare Logo */}
          <div className="text-center mb-8">
            <CloudflareLogo 
              size="medium" 
              variant="full" 
              className="cf-logo-mobile sm:scale-100"
            />
          </div>

          {/* Security Shield */}
          <div className="text-center mb-6">
            <SecurityShield 
              status={getShieldStatus()}
              size="large"
              animated={loadingPhase !== 'success' && loadingPhase !== 'error'}
              className="cf-shield-mobile sm:w-20 sm:h-20"
            />
          </div>

          {/* Main Title */}
          <h1
            id="cloudflare-security-title"
            className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-4 leading-tight cf-title-mobile"
          >
            {getMainTitle()}
          </h1>

          {/* Site Name (if needed) */}
          {(loadingPhase === 'initializing' || loadingPhase === 'loading-script') && (
            <p className="text-lg font-medium text-gray-700 text-center mb-4">
              Gaurav's Portfolio
            </p>
          )}

          {/* Status Message */}
          <p
            id="cloudflare-security-description"
            className="text-gray-600 text-center mb-8 leading-relaxed cf-text-mobile"
          >
            {gateState.message}
          </p>

          {/* Progress Bar (shown during loading states) */}
          {(loadingPhase !== 'success' && loadingPhase !== 'error' && loadingPhase !== 'ready-for-user') && (
            <div className="mb-8">
              <CloudflareProgressBar 
                progress={getProgress()} 
                phase={loadingPhase}
                showPercentage={false}
              />
            </div>
          )}

          {/* Network Quality Indicator */}
          <CloudflareNetworkIndicator quality={networkQuality} />

          {/* Turnstile Widget Container */}
          <div className="flex justify-center mb-8 transition-all duration-500 ease-in-out">
            {/* Widget placement container - always present for DOM synchronization */}
            <div
              className={`transform transition-all duration-500 ${
                gateState.showWidget ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
              data-widget-placement="true"
            >
              {/* The actual widget container will be created here by the hooks logic */}
              {!gateState.showWidget && (loadingPhase === 'preparing-widget' || loadingPhase === 'ready-for-user') && (
                <div className="flex flex-col items-center space-y-4 py-8">
                  <div className="relative">
                    {/* Pulsing security shield placeholder */}
                    <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center animate-pulse">
                      <svg className="w-10 h-10 text-orange-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-1a2 2 0 00-2-2H6a2 2 0 00-2 2v1a2 2 0 002 2zM12 15V9a4 4 0 118 0v6M12 15H8.5a2.5 2.5 0 000 5h7a2.5 2.5 0 000-5H12z" />
                      </svg>
                    </div>
                    {/* Ripple effect */}
                    <div className="absolute inset-0 rounded-full border-2 border-orange-300 animate-ping opacity-30"></div>
                    <div className="absolute -inset-2 rounded-full border border-orange-200 animate-ping opacity-20 animation-delay-300"></div>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-600 font-medium">
                      {loadingPhase === 'preparing-widget' ? 'Preparing security verification...' : 'Loading verification widget...'}
                    </p>
                    <div className="flex justify-center mt-2">
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-orange-500 rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 bg-orange-500 rounded-full animate-bounce animation-delay-100"></div>
                        <div className="w-1 h-1 bg-orange-500 rounded-full animate-bounce animation-delay-200"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Success State */}
          {loadingPhase === 'success' && (
            <div className="text-center mb-6">
              <div className="inline-flex items-center px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-700 font-medium">Verification complete</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {loadingPhase === 'error' && (
            <div className="mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-800 font-medium">Verification failed</span>
                </div>
                <p className="text-red-600 text-sm">{gateState.message}</p>
              </div>
              
              <div className="space-y-4">
                {retryCount < CONFIG.MAX_RETRIES ? (
                  <>
                    <CloudflareButton
                      variant="primary"
                      size="large"
                      onClick={handleRetry}
                      className="w-full cf-transition"
                    >
                      <span className="flex items-center justify-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className="hidden sm:inline">Retry verification ({CONFIG.MAX_RETRIES - retryCount} attempts left)</span>
                        <span className="sm:hidden">Retry ({CONFIG.MAX_RETRIES - retryCount} left)</span>
                      </span>
                    </CloudflareButton>
                    
                    {/* Alternative refresh option */}
                    <button
                      onClick={() => window.location.reload()}
                      className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 rounded-md transition-colors duration-200"
                    >
                      Or refresh the page
                    </button>
                  </>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
                      <p className="font-medium mb-2">Maximum retry attempts reached</p>
                      <p className="mb-3">The verification system may be temporarily unavailable.</p>
                    </div>
                    
                    <CloudflareButton
                      variant="primary"
                      size="large"
                      onClick={() => window.location.reload()}
                      className="w-full"
                    >
                      <span className="flex items-center justify-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh page
                      </span>
                    </CloudflareButton>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Emergency Bypass (Development Only) */}
          {(canBypass || loadingPhase === 'bypass-available') && CONFIG.DEV_BYPASS_ENABLED && (
            <div className="mb-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-yellow-800 font-medium">Development Mode</span>
                </div>
                <p className="text-yellow-600 text-sm mb-3">
                  Bypass available for development testing
                </p>
                <CloudflareButton
                  variant="secondary"
                  size="medium"
                  onClick={handleEmergencyBypass}
                  className="w-full"
                >
                  Continue with bypass
                </CloudflareButton>
                <p className="text-yellow-500 text-xs text-center mt-2">
                  Or press <kbd className="px-1 py-0.5 bg-yellow-200 rounded text-xs font-mono">Ctrl+Shift+B</kbd>
                </p>
              </div>
            </div>
          )}

          {/* Cloudflare Footer */}
          <CloudflareFooter />
        </CloudflareCard>
      </div>
    </>
  );
};

export default EntryGateModal;