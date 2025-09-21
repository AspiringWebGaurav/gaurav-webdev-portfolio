
/**
 * Optimized Entry Gate Modal Component
 * Fast-loading full-screen modal with enhanced UX, heartbeat animations, and smart fallbacks
 */

"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  TurnstileWidgetState, 
  EntryGateState, 
  EntryGateStatus,
  TurnstileVerificationResponse 
} from '@/lib/types/turnstile';

// Performance and timeout configurations
const CONFIG = {
  // Fast-fail timeouts (milliseconds)
  SCRIPT_LOAD_TIMEOUT: process.env.NODE_ENV === 'development' ? 3000 : 5000,
  WIDGET_INIT_TIMEOUT: process.env.NODE_ENV === 'development' ? 2000 : 3000,
  VERIFICATION_TIMEOUT: process.env.NODE_ENV === 'development' ? 8000 : 10000,
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY_BASE: 1000, // Base delay for exponential backoff
  
  // Animation timings
  HEARTBEAT_DURATION: 1200, // ms for one heartbeat cycle
  TRANSITION_DELAY: 300,
  SUCCESS_ANIMATION_DELAY: 1200,
  
  // Development mode optimizations
  DEV_BYPASS_ENABLED: process.env.NODE_ENV === 'development',
  DEV_FAST_MODE: process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_TURNSTILE_FAST_MODE === 'true'
};

// Enhanced loading states
type LoadingPhase = 
  | 'initializing'        // Initial setup
  | 'loading-script'      // Loading Turnstile script
  | 'preparing-widget'    // Preparing widget
  | 'ready-for-user'      // Widget ready, waiting for user interaction
  | 'verifying'          // User completed challenge, verifying
  | 'server-verify'      // Server-side verification
  | 'success'            // Verification successful
  | 'error'              // Error state
  | 'bypass-available'   // Fallback bypass option available
  | 'network-issue';     // Network connectivity issues

// Network quality detection
const detectNetworkQuality = (): Promise<'fast' | 'slow' | 'offline'> => {
  return new Promise((resolve) => {
    if (!navigator.onLine) {
      resolve('offline');
      return;
    }

    // Use connection API if available
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      const effectiveType = connection.effectiveType;
      if (effectiveType === '4g' || effectiveType === '5g') {
        resolve('fast');
      } else if (effectiveType === '3g') {
        resolve('slow');
      } else {
        resolve('slow');
      }
      return;
    }

    // Fallback: simple timing test
    const startTime = performance.now();
    fetch('/favicon.ico', { method: 'HEAD', cache: 'no-cache' })
      .then(() => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        resolve(duration < 200 ? 'fast' : 'slow');
      })
      .catch(() => resolve('offline'));
  });
};

interface EntryGateModalProps {
  isVisible: boolean;
  onVerificationSuccess: () => void;
  onError?: (error: string) => void;
}

const EntryGateModal: React.FC<EntryGateModalProps> = ({
  isVisible,
  onVerificationSuccess,
  onError
}) => {
  // Enhanced loading state
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>('initializing');
  const [networkQuality, setNetworkQuality] = useState<'fast' | 'slow' | 'offline'>('fast');
  const [retryCount, setRetryCount] = useState(0);
  const [canBypass, setCanBypass] = useState(false);
  const [timeoutReached, setTimeoutReached] = useState(false);
  
  // Performance monitoring
  const [metrics, setMetrics] = useState({
    scriptLoadTime: 0,
    widgetInitTime: 0,
    verificationTime: 0,
    totalTime: 0
  });
  const startTimeRef = useRef<number>(0);
  const phaseStartTimeRef = useRef<number>(0);

  // Component state
  const [gateState, setGateState] = useState<EntryGateState>({
    status: 'loading',
    message: getPhaseMessage('initializing'),
    showWidget: false,
    widgetId: null,
    retryCount: 0
  });

  // Widget state for Turnstile
  const [widgetState, setWidgetState] = useState<TurnstileWidgetState>({
    isLoading: true,
    isVerified: false,
    token: null,
    error: null,
    widgetId: null
  });

  // Refs with better HMR resilience
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupFunctionsRef = useRef<(() => void)[]>([]);
  const componentId = useRef(`entry-gate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  // Enhanced DOM element getter with fallback queries
  const getWidgetContainer = useCallback((): HTMLDivElement | null => {
    // First try the ref
    if (widgetContainerRef.current) {
      return widgetContainerRef.current;
    }
    
    // Fallback: query by class within the modal
    if (modalRef.current) {
      const container = modalRef.current.querySelector('.cf-turnstile') as HTMLDivElement;
      if (container) {
        // Update the ref for next time
        widgetContainerRef.current = container;
        return container;
      }
    }
    
    // Last resort: global query
    const containers = document.querySelectorAll('.cf-turnstile');
    if (containers.length > 0) {
      const container = containers[containers.length - 1] as HTMLDivElement; // Get the last one
      widgetContainerRef.current = container;
      return container;
    }
    
    return null;
  }, []);

  // Get user-friendly message for each loading phase
  function getPhaseMessage(phase: LoadingPhase): string {
    switch (phase) {
      case 'initializing':
        return 'Starting security check...';
      case 'loading-script':
        return 'Loading verification system...';
      case 'preparing-widget':
        return 'Preparing security widget...';
      case 'ready-for-user':
        return 'Ready for verification';
      case 'verifying':
        return 'Processing verification...';
      case 'server-verify':
        return 'Confirming with server...';
      case 'success':
        return 'Access granted! Welcome.';
      case 'error':
        return 'Verification failed. Please try again.';
      case 'bypass-available':
        return 'Having trouble? Manual bypass available.';
      case 'network-issue':
        return 'Network connection issue detected.';
      default:
        return 'Processing...';
    }
  }

  // Update phase with performance tracking
  const updatePhase = useCallback((phase: LoadingPhase, error?: string) => {
    const now = performance.now();
    const phaseDuration = now - phaseStartTimeRef.current;
    
    // Update metrics
    setMetrics(prev => ({
      ...prev,
      [`${loadingPhase}Time`]: phaseDuration,
      totalTime: now - startTimeRef.current
    }));
    
    console.log(`[EntryGate] Phase transition: ${loadingPhase} → ${phase} (${phaseDuration.toFixed(0)}ms)`);
    
    setLoadingPhase(phase);
    phaseStartTimeRef.current = now;
    
    setGateState(prev => ({
      ...prev,
      message: error || getPhaseMessage(phase),
      status: phase === 'error' ? 'error' : 
              phase === 'success' ? 'verified' :
              phase === 'ready-for-user' ? 'verifying' : 'loading'
    }));
  }, [loadingPhase]);

  // Fast-fail timeout handler
  const setupTimeout = useCallback((timeoutMs: number, callback: () => void, message: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      console.warn(`[EntryGate] ${message} - timeout after ${timeoutMs}ms`);
      setTimeoutReached(true);
      callback();
    }, timeoutMs);
    
    // Add to cleanup functions
    cleanupFunctionsRef.current.push(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    });
  }, []);

  // Exponential backoff retry logic
  const scheduleRetry = useCallback((attempt: number, callback: () => void) => {
    const delay = CONFIG.RETRY_DELAY_BASE * Math.pow(2, attempt - 1);
    console.log(`[EntryGate] Scheduling retry ${attempt}/${CONFIG.MAX_RETRIES} in ${delay}ms`);
    
    retryTimeoutRef.current = setTimeout(callback, delay);
    
    cleanupFunctionsRef.current.push(() => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    });
  }, []);

  // Enhanced cleanup all timers and listeners
  const cleanup = useCallback(() => {
    cleanupFunctionsRef.current.forEach(fn => fn());
    cleanupFunctionsRef.current = [];
    
    // CRITICAL FIX: Enhanced widget cleanup with container clearing
    if (widgetState.widgetId || componentId.current) {
      try {
        // Remove from manager first
        if (typeof window !== 'undefined' && window.turnstileManager) {
          window.turnstileManager.unregister(componentId.current);
        }
        
        // Remove the actual widget
        if (widgetState.widgetId && window.turnstile) {
          window.turnstile.remove(widgetState.widgetId);
        }
        
        // CRITICAL FIX: Clear the container completely
        const container = getWidgetContainer();
        if (container) {
          container.innerHTML = '';
          container.removeAttribute('data-widget-id');
          container.removeAttribute('data-component-id');
        }
        
        console.log('[EntryGate] Widget and container cleaned up completely');
      } catch (error) {
        console.warn('[EntryGate] Error during widget cleanup:', error);
        
        // CRITICAL FIX: Force clean the container even if widget cleanup fails
        try {
          const container = getWidgetContainer();
          if (container) {
            container.innerHTML = '';
            container.removeAttribute('data-widget-id');
            container.removeAttribute('data-component-id');
          }
        } catch (cleanupError) {
          console.warn('[EntryGate] Error during forced container cleanup:', cleanupError);
        }
      }
    }
  }, [widgetState.widgetId, getWidgetContainer]);

  // Enhanced Turnstile initialization with fast-fail
  const initializeTurnstileWidget = useCallback(async () => {
    if (!isVisible) return;
    
    startTimeRef.current = performance.now();
    phaseStartTimeRef.current = startTimeRef.current;
    
    try {
      // Detect network quality first
      updatePhase('loading-script');
      const quality = await detectNetworkQuality();
      setNetworkQuality(quality);
      
      if (quality === 'offline') {
        updatePhase('network-issue');
        setCanBypass(true);
        return;
      }

      // Wait for Turnstile script with timeout
      const scriptLoaded = await waitForTurnstileScript();
      
      if (!scriptLoaded) {
        updatePhase('error', 'Failed to load verification system');
        if (retryCount < CONFIG.MAX_RETRIES) {
          scheduleRetry(retryCount + 1, () => {
            setRetryCount(prev => prev + 1);
            initializeTurnstileWidget();
          });
        } else {
          setCanBypass(true);
          updatePhase('bypass-available');
        }
        return;
      }

      updatePhase('preparing-widget');
      
      // Initialize widget with timeout protection
      const widgetReady = await initializeWidget();
      
      if (widgetReady) {
        updatePhase('ready-for-user');
      } else {
        updatePhase('error', 'Widget initialization failed');
        if (retryCount < CONFIG.MAX_RETRIES) {
          scheduleRetry(retryCount + 1, () => {
            setRetryCount(prev => prev + 1);
            initializeTurnstileWidget();
          });
        } else {
          setCanBypass(true);
          updatePhase('bypass-available');
        }
      }
      
    } catch (error) {
      console.error('[EntryGate] Initialization error:', error);
      updatePhase('error', 'Initialization failed');
      
      if (retryCount < CONFIG.MAX_RETRIES) {
        scheduleRetry(retryCount + 1, () => {
          setRetryCount(prev => prev + 1);
          initializeTurnstileWidget();
        });
      } else {
        setCanBypass(true);
        updatePhase('bypass-available');
      }
    }
  }, [isVisible, retryCount, updatePhase, scheduleRetry]);

  // Wait for Turnstile script to load
  const waitForTurnstileScript = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.turnstile) {
        resolve(true);
        return;
      }

      // Listen for script load events
      const handleScriptLoad = () => {
        window.removeEventListener('turnstile-loaded', handleScriptLoad);
        resolve(true);
      };

      const handleScriptError = () => {
        window.removeEventListener('turnstile-error', handleScriptError);
        resolve(false);
      };

      window.addEventListener('turnstile-loaded', handleScriptLoad);
      window.addEventListener('turnstile-error', handleScriptError);

      // Setup timeout
      setupTimeout(CONFIG.SCRIPT_LOAD_TIMEOUT, () => {
        window.removeEventListener('turnstile-loaded', handleScriptLoad);
        window.removeEventListener('turnstile-error', handleScriptError);
        resolve(false);
      }, 'Script load timeout');

      // Polling fallback for environments without event support
      const pollForScript = () => {
        if (window.turnstile) {
          window.removeEventListener('turnstile-loaded', handleScriptLoad);
          window.removeEventListener('turnstile-error', handleScriptError);
          resolve(true);
        } else {
          setTimeout(pollForScript, 100);
        }
      };
      setTimeout(pollForScript, 100);
    });
  }, [setupTimeout]);

  // Enhanced widget initialization with proper DOM readiness checks
  const initializeWidget = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
      if (!siteKey) {
        console.error('[EntryGate] NEXT_PUBLIC_TURNSTILE_SITE_KEY not configured');
        updatePhase('error', 'Site key not configured. Please check environment variables.');
        resolve(false);
        return;
      }

      // Enhanced container readiness check with robust DOM detection
      const checkContainerReady = (attempt = 1, maxAttempts = 30) => {
        const container = getWidgetContainer();
        
        if (!container) {
          if (attempt < maxAttempts) {
            console.log(`[EntryGate] Widget container not ready, attempt ${attempt}/${maxAttempts}`);
            setTimeout(() => checkContainerReady(attempt + 1, maxAttempts), 100);
            return;
          } else {
            console.error('[EntryGate] Widget container never became ready after', maxAttempts, 'attempts');
            resolve(false);
            return;
          }
        }
        
        // Ensure container is properly attached to DOM
        if (!document.contains(container)) {
          console.log(`[EntryGate] Container found but not in DOM, attempt ${attempt}/${maxAttempts}`);
          if (attempt < maxAttempts) {
            setTimeout(() => checkContainerReady(attempt + 1, maxAttempts), 100);
            return;
          } else {
            console.error('[EntryGate] Widget container never attached to DOM');
            resolve(false);
            return;
          }
        }

        // Container is ready, proceed with Turnstile initialization
        if (typeof window !== 'undefined' && window.turnstileManager) {
          window.turnstileManager.waitForReady((error?: Error) => {
            if (error) {
              console.error('[EntryGate] Turnstile not ready:', error);
              updatePhase('error', 'Failed to load security verification. Please refresh the page.');
              resolve(false);
              return;
            }

            // Double-check container and turnstile availability with robust getter
            const finalContainer = getWidgetContainer();
            if (!finalContainer) {
              console.error('[EntryGate] Container became unavailable after ready check');
              resolve(false);
              return;
            }

            if (!window.turnstile) {
              console.error('[EntryGate] Turnstile API unavailable after ready check');
              resolve(false);
              return;
            }

            // CRITICAL FIX: Check for existing widgets in container before rendering
            if (finalContainer.hasChildNodes()) {
              console.log('[EntryGate] Container already has widgets, cleaning up...');
              finalContainer.innerHTML = ''; // Clear any existing widgets
            }

            // CRITICAL FIX: Check if this container already has a widget registered
            const existingWidget = Array.from(window.turnstileState?.widgets.entries() || [])
              .find(([id, widgetId]) => {
                const element = document.querySelector(`[data-widget-id="${widgetId}"]`);
                return element && finalContainer.contains(element);
              });

            if (existingWidget) {
              console.log('[EntryGate] Existing widget found, removing before creating new one');
              try {
                window.turnstile.remove(existingWidget[1]);
                window.turnstileManager?.unregister(existingWidget[0]);
              } catch (e) {
                console.warn('[EntryGate] Error removing existing widget:', e);
              }
            }

            try {
              console.log('[EntryGate] Initializing widget with key:', siteKey.substring(0, 10) + '...');
              console.log('[EntryGate] Using container:', finalContainer.className, 'in DOM:', document.contains(finalContainer));

              const widgetId = window.turnstile.render(finalContainer, {
                sitekey: siteKey,
                appearance: 'always',
                theme: 'dark',
                size: 'normal',
                callback: (token: string) => {
                  console.log('[EntryGate] Turnstile verification completed');
                  updatePhase('verifying');
                  
                  setWidgetState(prev => ({
                    ...prev,
                    token,
                    isVerified: true
                  }));

                  updatePhase('server-verify');

                  // Call server verification
                  fetch('/api/turnstile/verify', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ token }),
                  })
                  .then(response => response.json())
                  .then((result: TurnstileVerificationResponse) => {
                    if (result.success) {
                      console.log('[EntryGate] Server verification successful');
                      updatePhase('success');
                      
                      setTimeout(() => {
                        onVerificationSuccess();
                        if (previousFocusRef.current) {
                          previousFocusRef.current.focus();
                        }
                      }, CONFIG.SUCCESS_ANIMATION_DELAY);
                    } else {
                      console.warn('[EntryGate] Server verification failed:', result.errors);
                      updatePhase('error', 'Server verification failed. Please try again.');
                    }
                  })
                  .catch(error => {
                    console.error('[EntryGate] API call failed:', error);
                    updatePhase('error', 'Network error. Please check your connection and try again.');
                  });
                },
                'error-callback': (errorCode?: string) => {
                  console.warn('[EntryGate] Turnstile error:', errorCode);
                  const message = errorCode === 'network-error' ?
                    'Network connection issue. Please check your internet and try again.' :
                    'Verification failed. Please try again.';
                  updatePhase('error', message);
                },
                'expired-callback': () => {
                  console.warn('[EntryGate] Turnstile token expired');
                  updatePhase('error', 'Verification expired. Please try again.');
                },
                'timeout-callback': () => {
                  console.warn('[EntryGate] Turnstile timeout');
                  updatePhase('error', 'Verification timed out. Please try again.');
                },
                retry: 'auto',
                'retry-interval': networkQuality === 'slow' ? 3000 : 2000,
                'refresh-expired': 'auto'
              });

              console.log('[EntryGate] Widget render result:', widgetId);

              if (widgetId && window.turnstileManager) {
                // Register with manager
                window.turnstileManager.register(componentId.current, widgetId);
                
                setWidgetState(prev => ({
                  ...prev,
                  widgetId,
                  isLoading: false
                }));

                setGateState(prev => ({
                  ...prev,
                  showWidget: true,
                  widgetId
                }));

                console.log('[EntryGate] Widget initialized successfully with ID:', widgetId);
                resolve(true);
              } else {
                console.error('[EntryGate] Widget render returned null/undefined');
                resolve(false);
              }
            } catch (error) {
              console.error('[EntryGate] Widget render error:', error);
              resolve(false);
            }
          }, 15000); // 15 second timeout
        } else {
          console.warn('[EntryGate] TurnstileManager not available');
          updatePhase('error', 'Security system not available. Please refresh the page.');
          resolve(false);
        }
      };

      // Start the container readiness check
      checkContainerReady();
    });
  }, [networkQuality, updatePhase, onVerificationSuccess, getWidgetContainer]);


  // Turnstile success callback
  const handleTurnstileSuccess = useCallback(async (token: string) => {
    console.log('[EntryGate] Turnstile verification completed');
    updatePhase('verifying');
    
    setWidgetState(prev => ({
      ...prev,
      token,
      isVerified: true
    }));

    updatePhase('server-verify');

    try {
      // Add timeout for server verification
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.VERIFICATION_TIMEOUT);

      const response = await fetch('/api/turnstile/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const result: TurnstileVerificationResponse = await response.json();

      if (result.success) {
        console.log('[EntryGate] Server verification successful');
        updatePhase('success');
        
        // Log performance metrics
        console.log('[EntryGate] Performance metrics:', {
          ...metrics,
          totalTime: performance.now() - startTimeRef.current
        });

        // Success animation delay before closing
        setTimeout(() => {
          onVerificationSuccess();
          
          // Restore focus to previously focused element
          if (previousFocusRef.current) {
            previousFocusRef.current.focus();
          }
        }, CONFIG.SUCCESS_ANIMATION_DELAY);
      } else {
        console.warn('[EntryGate] Server verification failed:', result.errors);
        handleVerificationError('Server verification failed. Please try again.');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('[EntryGate] Server verification timeout');
        handleVerificationError('Verification timed out. Please try again.');
      } else {
        console.error('[EntryGate] API call failed:', error);
        handleVerificationError('Network error. Please check your connection and try again.');
      }
    }
  }, [onVerificationSuccess, updatePhase, metrics]);

  // Turnstile error callbacks
  const handleTurnstileError = useCallback((errorCode?: string) => {
    console.warn('[EntryGate] Turnstile error:', errorCode);
    const message = getTurnstileErrorMessage(errorCode);
    handleVerificationError(message);
  }, []);

  const handleTurnstileExpired = useCallback(() => {
    console.warn('[EntryGate] Turnstile token expired');
    handleVerificationError('Verification expired. Please try again.');
  }, []);

  const handleTurnstileTimeout = useCallback(() => {
    console.warn('[EntryGate] Turnstile timeout');
    handleVerificationError('Verification timed out. Please try again.');
  }, []);

  // Handle verification errors
  const handleVerificationError = useCallback((message: string) => {
    updatePhase('error', message);
    
    setWidgetState(prev => ({
      ...prev,
      error: message,
      isVerified: false,
      token: null
    }));

    if (onError) {
      onError(message);
    }
  }, [onError, updatePhase]);

  // Manual bypass for emergency situations
  const handleEmergencyBypass = useCallback(() => {
    console.log('[EntryGate] Emergency bypass activated');
    updatePhase('success', 'Manual bypass - Access granted');
    
    // Log bypass for analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'turnstile_bypass', {
        event_category: 'security',
        event_label: 'emergency_bypass',
        value: 1
      });
    }

    setTimeout(() => {
      onVerificationSuccess();
    }, 1000);
  }, [onVerificationSuccess, updatePhase]);

  // Retry verification
  const handleRetry = useCallback(() => {
    console.log('[EntryGate] Retrying verification');
    setRetryCount(prev => prev + 1);
    setTimeoutReached(false);
    setCanBypass(false);
    
    // Reset widget if it exists
    if (widgetState.widgetId && window.turnstile) {
      window.turnstile.reset(widgetState.widgetId);
    }

    // Reset states
    setWidgetState(prev => ({
      ...prev,
      error: null,
      isVerified: false,
      token: null,
      isLoading: true
    }));

    // Restart initialization
    initializeTurnstileWidget();
  }, [widgetState.widgetId, initializeTurnstileWidget]);

  // Get user-friendly error message
  const getTurnstileErrorMessage = (errorCode?: string): string => {
    switch (errorCode) {
      case 'WIDGET_RENDER_FAILED':
        return 'Failed to load security verification. Please refresh the page.';
      case 'network-error':
        return 'Network connection issue. Please check your internet and try again.';
      case 'timeout':
        return 'Verification timed out. Please try again.';
      default:
        return 'Verification failed. Please try again.';
    }
  };

  // Initialize when modal becomes visible
  useEffect(() => {
    if (!isVisible) {
      cleanup();
      return;
    }

    // Store previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement;
    
    // Start initialization with small delay for smooth animation
    const timer = setTimeout(initializeTurnstileWidget, CONFIG.TRANSITION_DELAY);
    
    return () => {
      clearTimeout(timer);
      cleanup();
    };
  }, [isVisible, initializeTurnstileWidget, cleanup]);

  // Focus management for accessibility
  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      if (modalRef.current) {
        modalRef.current.focus();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isVisible]);

  // Keyboard event handling
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Allow bypass with Ctrl+Shift+B in development
      if (CONFIG.DEV_BYPASS_ENABLED && event.ctrlKey && event.shiftKey && event.key === 'B') {
        event.preventDefault();
        handleEmergencyBypass();
        return;
      }

      // Prevent escape key from closing modal (security requirement)
      if (event.key === 'Escape') {
        event.preventDefault();
        console.log('[EntryGate] Escape key blocked - verification required');
      }

      // Handle tab navigation within modal
      if (event.key === 'Tab') {
        trapFocus(event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, handleEmergencyBypass]);

  // Focus trap utility
  const trapFocus = (event: KeyboardEvent) => {
    if (!modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
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
  };

  // Don't render if not visible
  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="entry-gate-title"
      aria-describedby="entry-gate-description"
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-cyan-900/20" />
      
      {/* Modal content */}
      <div
        ref={modalRef}
        className="relative w-full max-w-md mx-4 bg-black-100 border border-white/[0.2] rounded-2xl p-6 shadow-2xl"
        tabIndex={-1}
      >
        {/* Glow effects */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/10 via-transparent to-cyan-500/10 blur-xl" />
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-500/20 via-transparent to-cyan-500/20 opacity-50" />
        
        {/* Content */}
        <div className="relative z-10 text-center">
          {/* Header */}
          <div className="mb-6">
            <h2
              id="entry-gate-title"
              className="text-2xl font-bold text-white mb-2"
            >
              Quick Check...
            </h2>
            <p
              id="entry-gate-description"
              className="text-gray-300 text-sm"
            >
              We're verifying you're a real visitor.
            </p>
          </div>

          {/* Enhanced Status indicator with heartbeat animation */}
          <div className="mb-6">
            <div className="flex items-center justify-center mb-4">
              {/* Heartbeat Animation Component */}
              <HeartbeatLoader
                phase={loadingPhase}
                isAnimating={loadingPhase !== 'success' && loadingPhase !== 'error'}
              />
            </div>

            {/* Progressive status message */}
            <p className="text-white font-medium mb-4">
              {gateState.message}
            </p>

            {/* Network quality indicator */}
            {networkQuality !== 'fast' && (
              <div className="flex items-center justify-center mb-2">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  networkQuality === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
                <span className="text-xs text-gray-400">
                  {networkQuality === 'offline' ? 'Offline' : 'Slow connection detected'}
                </span>
              </div>
            )}
          </div>

          {/* Turnstile widget container - always render but control visibility */}
          <div className={`mb-6 flex justify-center transition-opacity duration-300 ${
            gateState.showWidget ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}>
            <div
              ref={widgetContainerRef}
              className="cf-turnstile"
              data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
              data-theme="dark"
              data-size="normal"
            />
          </div>

          {/* Error state with retry button */}
          {loadingPhase === 'error' && (
            <div className="space-y-4">
              <button
                onClick={handleRetry}
                disabled={retryCount >= CONFIG.MAX_RETRIES}
                className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-cyan-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {retryCount >= CONFIG.MAX_RETRIES ? 'Max Retries Reached' : `Try Again (${CONFIG.MAX_RETRIES - retryCount} left)`}
              </button>
            </div>
          )}

          {/* Emergency bypass option */}
          {(canBypass || loadingPhase === 'bypass-available') && (
            <div className="space-y-4 mt-4">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-3">
                  Having trouble with verification?
                </p>
                <button
                  onClick={handleEmergencyBypass}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-black-100"
                >
                  Continue without verification
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Some features may be limited
                </p>
              </div>
            </div>
          )}

          {/* Development mode indicator */}
          {CONFIG.DEV_BYPASS_ENABLED && (
            <div className="mt-4 p-2 bg-yellow-900/20 border border-yellow-700/50 rounded text-xs text-yellow-400">
              Dev Mode: Press Ctrl+Shift+B to bypass
            </div>
          )}

          {/* Privacy notice */}
          <div className="mt-6 pt-4 border-t border-white/[0.1]">
            <p className="text-gray-400 text-xs leading-relaxed">
              This security check protects against automated traffic.
              <br />
              <span className="text-gray-500">Privacy & Cookies</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Heartbeat Animation Component
const HeartbeatLoader: React.FC<{
  phase: LoadingPhase;
  isAnimating: boolean;
}> = ({ phase, isAnimating }) => {
  const getPhaseColor = (phase: LoadingPhase) => {
    switch (phase) {
      case 'initializing':
      case 'loading-script':
        return 'border-t-purple-500';
      case 'preparing-widget':
      case 'ready-for-user':
        return 'border-t-cyan-500';
      case 'verifying':
      case 'server-verify':
        return 'border-t-blue-500';
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'bypass-available':
        return 'border-t-yellow-500';
      case 'network-issue':
        return 'border-t-orange-500';
      default:
        return 'border-t-gray-500';
    }
  };

  if (phase === 'success') {
    return (
      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Main heartbeat circle */}
      <div
        className={`w-8 h-8 border-2 border-gray-600 ${getPhaseColor(phase)} rounded-full ${
          isAnimating ? 'animate-spin' : ''
        }`}
        style={{
          animation: isAnimating ? `heartbeat ${CONFIG.HEARTBEAT_DURATION}ms ease-in-out infinite` : 'none'
        }}
      />
      
      {/* Outer glow effect */}
      <div
        className={`absolute inset-0 w-8 h-8 border border-current rounded-full opacity-30 ${
          getPhaseColor(phase).replace('border-t-', 'border-')
        }`}
        style={{
          animation: isAnimating ? `heartbeatGlow ${CONFIG.HEARTBEAT_DURATION}ms ease-in-out infinite 200ms` : 'none'
        }}
      />
      
      {/* Add custom CSS for heartbeat animation */}
      <style jsx>{`
        @keyframes heartbeat {
          0%, 100% {
            transform: scale(1);
          }
          25% {
            transform: scale(1.1);
          }
          50% {
            transform: scale(1);
          }
          75% {
            transform: scale(1.05);
          }
        }
        
        @keyframes heartbeatGlow {
          0%, 100% {
            transform: scale(1.2);
            opacity: 0.3;
          }
          25% {
            transform: scale(1.4);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.3;
          }
          75% {
            transform: scale(1.3);
            opacity: 0.4;
          }
        }
      `}</style>
    </div>
  );
};

export default EntryGateModal;