/**
 * EntryGateModal Core Logic & Hooks
 * Segment 2: Custom hooks, state management, and core verification logic
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { TurnstileWidgetState, EntryGateState, TurnstileVerificationResponse } from "@/lib/types/turnstile";
import { CONFIG, LoadingPhase, detectNetworkQuality } from "./types";

// Phase message mapping
export const getPhaseMessage = (phase: LoadingPhase): string => {
  switch (phase) {
    case "initializing":
    case "loading-script":
      return "This process is automatic. Your browser will redirect to your requested content shortly.";
    case "preparing-widget":
      return "Loading security verification...";
    case "ready-for-user":
      return "Please complete the security check to verify you're not a robot.";
    case "verifying":
    case "server-verify":
      return "Verifying your response...";
    case "success":
      return "You will be redirected shortly.";
    case "error":
      return "Please try again or contact support if this continues.";
    case "bypass-available":
      return "Alternative access method available.";
    case "network-issue":
      return "Network connectivity issue detected.";
    default:
      return "Checking your security status...";
  }
};

// Custom hook for managing verification state
export const useVerificationState = () => {
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>("initializing");
  const [networkQuality, setNetworkQuality] = useState<"fast" | "slow" | "offline">("fast");
  const [retryCount, setRetryCount] = useState(0);
  const [canBypass, setCanBypass] = useState(false);
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [progress, setProgress] = useState(0);

  const [metrics, setMetrics] = useState({
    scriptLoadTime: 0,
    widgetInitTime: 0,
    verificationTime: 0,
    totalTime: 0,
  });

  const [gateState, setGateState] = useState<EntryGateState>({
    status: "loading",
    message: getPhaseMessage("initializing"),
    showWidget: false,
    widgetId: null,
    retryCount: 0,
  });

  const [widgetState, setWidgetState] = useState<TurnstileWidgetState>({
    isLoading: true,
    isVerified: false,
    token: null,
    error: null,
    widgetId: null,
  });

  return {
    // State
    loadingPhase,
    networkQuality,
    retryCount,
    canBypass,
    timeoutReached,
    progress,
    metrics,
    gateState,
    widgetState,
    // Setters
    setLoadingPhase,
    setNetworkQuality,
    setRetryCount,
    setCanBypass,
    setTimeoutReached,
    setProgress,
    setMetrics,
    setGateState,
    setWidgetState,
  };
};

// Custom hook for refs and cleanup
export const useVerificationRefs = () => {
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupFunctionsRef = useRef<(() => void)[]>([]);
  const startTimeRef = useRef<number>(0);
  const phaseStartTimeRef = useRef<number>(0);
  const componentId = useRef(`entry-gate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  return {
    widgetContainerRef,
    modalRef,
    previousFocusRef,
    timeoutRef,
    retryTimeoutRef,
    cleanupFunctionsRef,
    startTimeRef,
    phaseStartTimeRef,
    componentId,
  };
};

// Custom hook for core verification logic
export const useVerificationLogic = (
  state: ReturnType<typeof useVerificationState>,
  refs: ReturnType<typeof useVerificationRefs>,
  onVerificationSuccess: () => void,
  onError?: (error: string) => void
) => {
  const {
    loadingPhase,
    networkQuality,
    retryCount,
    widgetState,
    setLoadingPhase,
    setNetworkQuality,
    setCanBypass,
    setGateState,
    setWidgetState,
    setMetrics,
  } = state;

  const {
    widgetContainerRef,
    previousFocusRef,
    timeoutRef,
    retryTimeoutRef,
    cleanupFunctionsRef,
    startTimeRef,
    phaseStartTimeRef,
    componentId,
  } = refs;

  // Enhanced DOM element getter with container creation
  const getWidgetContainer = useCallback((): HTMLDivElement | null => {
    // Return existing container if available
    if (widgetContainerRef.current) {
      return widgetContainerRef.current;
    }

    // Look for existing container in modal
    if (refs.modalRef.current) {
      const existingContainer = refs.modalRef.current.querySelector(".cf-turnstile") as HTMLDivElement;
      if (existingContainer) {
        widgetContainerRef.current = existingContainer;
        return existingContainer;
      }

      // Create container if modal exists but no widget container found
      const newContainer = document.createElement('div');
      newContainer.className = 'cf-turnstile';
      newContainer.setAttribute('data-sitekey', process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '');
      newContainer.setAttribute('data-theme', 'light');
      newContainer.setAttribute('data-size', 'normal');

      // Find the widget placement element and insert the container
      const widgetPlacement = refs.modalRef.current.querySelector('[data-widget-placement]');
      if (widgetPlacement) {
        widgetPlacement.appendChild(newContainer);
        widgetContainerRef.current = newContainer;
        console.log('[EntryGate] ✅ Widget container created and placed in modal');
        return newContainer;
      }
    }

    // Fallback: look for existing containers in document
    const containers = document.querySelectorAll(".cf-turnstile");
    if (containers.length > 0) {
      const container = containers[containers.length - 1] as HTMLDivElement;
      widgetContainerRef.current = container;
      return container;
    }

    return null;
  }, [refs.modalRef, widgetContainerRef]);

  // Update phase with performance tracking
  const updatePhase = useCallback(
    (phase: LoadingPhase, error?: string) => {
      const now = performance.now();
      const phaseDuration = now - phaseStartTimeRef.current;

      setMetrics((prev) => ({
        ...prev,
        [`${loadingPhase}Time`]: phaseDuration,
        totalTime: now - startTimeRef.current,
      }));

      console.log(`[EntryGate] Phase transition: ${loadingPhase} → ${phase} (${phaseDuration.toFixed(0)}ms)`);

      setLoadingPhase(phase);
      phaseStartTimeRef.current = now;

      setGateState((prev) => ({
        ...prev,
        message: error || getPhaseMessage(phase),
        status:
          phase === "error" ? "error" :
          phase === "success" ? "verified" :
          phase === "ready-for-user" ? "verifying" : "loading",
      }));
    },
    [loadingPhase, setLoadingPhase, setGateState, setMetrics, startTimeRef, phaseStartTimeRef]
  );

  // Fast-fail timeout handler
  const setupTimeout = useCallback(
    (timeoutMs: number, callback: () => void, message: string) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        console.warn(`[EntryGate] ${message} - timeout after ${timeoutMs}ms`);
        callback();
      }, timeoutMs);

      cleanupFunctionsRef.current.push(() => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      });
    },
    [timeoutRef, cleanupFunctionsRef]
  );

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
  }, [retryTimeoutRef, cleanupFunctionsRef]);

  // Cleanup function
  const cleanup = useCallback(() => {
    cleanupFunctionsRef.current.forEach((fn) => fn());
    cleanupFunctionsRef.current = [];

    if (widgetState.widgetId && window.turnstile) {
      try {
        if (typeof window !== "undefined" && window.turnstileManager) {
          window.turnstileManager.unregister(componentId.current);
        } else if (typeof window !== "undefined" && window.turnstile) {
          window.turnstile.remove(widgetState.widgetId);
        }
        console.log("[EntryGate] Widget cleaned up");
      } catch (error) {
        console.warn("[EntryGate] Error during widget cleanup:", error);
      }
    }
  }, [widgetState.widgetId, componentId, cleanupFunctionsRef]);

  // Wait for Turnstile script to load
  const waitForTurnstileScript = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.turnstile) {
        resolve(true);
        return;
      }

      const handleScriptLoad = () => {
        window.removeEventListener("turnstile-loaded", handleScriptLoad);
        resolve(true);
      };

      const handleScriptError = () => {
        window.removeEventListener("turnstile-error", handleScriptError);
        resolve(false);
      };

      window.addEventListener("turnstile-loaded", handleScriptLoad);
      window.addEventListener("turnstile-error", handleScriptError);

      setupTimeout(CONFIG.SCRIPT_LOAD_TIMEOUT, () => {
        window.removeEventListener("turnstile-loaded", handleScriptLoad);
        window.removeEventListener("turnstile-error", handleScriptError);
        resolve(false);
      }, "Script load timeout");

      const pollForScript = () => {
        if (window.turnstile) {
          window.removeEventListener("turnstile-loaded", handleScriptLoad);
          window.removeEventListener("turnstile-error", handleScriptError);
          resolve(true);
        } else {
          setTimeout(pollForScript, 100);
        }
      };
      setTimeout(pollForScript, 100);
    });
  }, [setupTimeout]);

  // Enhanced widget initialization with improved synchronization
  const initializeWidget = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
      if (!siteKey) {
        console.error("[EntryGate] NEXT_PUBLIC_TURNSTILE_SITE_KEY not configured");
        updatePhase("error", "Site key not configured. Please check environment variables.");
        resolve(false);
        return;
      }

      // Development mode settings for faster testing
      const isDev = process.env.NODE_ENV === "development";
      const maxAttempts = isDev ? 20 : 30; // Reduced attempts in dev
      const pollInterval = isDev ? 50 : 100; // Faster polling in dev
      const managerTimeout = isDev ? 8000 : 15000; // Shorter timeout in dev

      console.log(`[EntryGate] Starting widget initialization (${isDev ? 'dev' : 'prod'} mode)`);

      const ensureContainerAndInitialize = async (attempt = 1): Promise<void> => {
        try {
          // Step 1: Ensure we have a valid container
          const container = getWidgetContainer();
          if (!container) {
            if (attempt <= maxAttempts) {
              console.log(`[EntryGate] Container not ready, attempt ${attempt}/${maxAttempts}`);
              setTimeout(() => ensureContainerAndInitialize(attempt + 1), pollInterval);
              return;
            } else {
              console.error("[EntryGate] ❌ Container creation failed after max attempts");
              updatePhase("error", "Failed to prepare security verification. Please refresh the page.");
              resolve(false);
              return;
            }
          }

          // Step 2: Verify container is in DOM
          if (!document.contains(container)) {
            if (attempt <= maxAttempts) {
              console.log(`[EntryGate] Container not in DOM, attempt ${attempt}/${maxAttempts}`);
              setTimeout(() => ensureContainerAndInitialize(attempt + 1), pollInterval);
              return;
            } else {
              console.error("[EntryGate] ❌ Container never attached to DOM");
              updatePhase("error", "DOM synchronization failed. Please refresh the page.");
              resolve(false);
              return;
            }
          }

          // Step 3: Wait for Turnstile manager to be ready
          if (!window.turnstileManager) {
            console.warn("[EntryGate] ⚠️ TurnstileManager not available, using fallback");
            updatePhase("error", "Security system not available. Please refresh the page.");
            resolve(false);
            return;
          }

          console.log("[EntryGate] ✅ Container ready, waiting for Turnstile manager...");

          window.turnstileManager.waitForReady((error?: Error) => {
            if (error) {
              console.error("[EntryGate] ❌ Turnstile manager error:", error);
              updatePhase("error", "Security system failed to load. Please refresh the page.");
              resolve(false);
              return;
            }

            // Step 4: Final validation before render
            const finalContainer = getWidgetContainer();
            if (!finalContainer || !window.turnstile) {
              console.error("[EntryGate] ❌ Final validation failed - container or API missing");
              updatePhase("error", "Security verification unavailable. Please refresh the page.");
              resolve(false);
              return;
            }

            try {
              console.log("[EntryGate] 🚀 Rendering Turnstile widget...");
              
              const widgetId = window.turnstile.render(finalContainer, {
                sitekey: siteKey,
                appearance: "always",
                theme: "light", // Use light theme to match Cloudflare design
                size: "normal",
                callback: (token: string) => {
                  console.log("[EntryGate] ✅ Turnstile verification completed");
                  updatePhase("verifying");
                  setWidgetState((prev) => ({ ...prev, token, isVerified: true }));
                  updatePhase("server-verify");

                  // Server verification with improved error handling
                  fetch("/api/turnstile/verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token }),
                  })
                    .then((response) => {
                      if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                      }
                      return response.json();
                    })
                    .then((result: TurnstileVerificationResponse) => {
                      if (result.success) {
                        console.log("[EntryGate] ✅ Server verification successful");
                        updatePhase("success");
                        setTimeout(() => {
                          onVerificationSuccess();
                          if (previousFocusRef.current) {
                            previousFocusRef.current.focus();
                          }
                        }, CONFIG.SUCCESS_ANIMATION_DELAY);
                      } else {
                        console.warn("[EntryGate] ❌ Server verification failed:", result.errors);
                        updatePhase("error", result.message || "Server verification failed. Please try again.");
                      }
                    })
                    .catch((error) => {
                      console.error("[EntryGate] ❌ Server verification error:", error);
                      const message = error.message?.includes('HTTP')
                        ? "Server error during verification. Please try again."
                        : "Network error. Please check your connection and try again.";
                      updatePhase("error", message);
                    });
                },
                "error-callback": (errorCode?: string) => {
                  console.warn("[EntryGate] ⚠️ Turnstile error:", errorCode);
                  const message = getErrorMessage(errorCode);
                  updatePhase("error", message);
                },
                "expired-callback": () => {
                  console.warn("[EntryGate] ⚠️ Turnstile token expired");
                  updatePhase("error", "Verification expired. Please try again.");
                },
                "timeout-callback": () => {
                  console.warn("[EntryGate] ⚠️ Turnstile timeout");
                  updatePhase("error", "Verification timed out. Please try again.");
                },
                retry: "auto",
                "retry-interval": networkQuality === "slow" ? 4000 : 2500,
                "refresh-expired": "auto",
              });

              if (widgetId) {
                // Register with manager if available
                if (window.turnstileManager) {
                  window.turnstileManager.register(componentId.current, widgetId);
                }
                
                setWidgetState((prev) => ({ ...prev, widgetId, isLoading: false }));
                setGateState((prev) => ({ ...prev, showWidget: true, widgetId }));
                console.log("[EntryGate] ✅ Widget initialized successfully with ID:", widgetId);
                resolve(true);
              } else {
                console.error("[EntryGate] ❌ Widget render returned null/undefined");
                updatePhase("error", "Widget rendering failed. Please refresh the page.");
                resolve(false);
              }
            } catch (renderError) {
              console.error("[EntryGate] ❌ Widget render error:", renderError);
              updatePhase("error", "Failed to render security verification. Please refresh the page.");
              resolve(false);
            }
          }, managerTimeout);

        } catch (error) {
          console.error("[EntryGate] ❌ Initialization error:", error);
          updatePhase("error", "Initialization failed. Please refresh the page.");
          resolve(false);
        }
      };

      // Helper function to get user-friendly error messages
      const getErrorMessage = (errorCode?: string): string => {
        switch (errorCode) {
          case "network-error":
            return "Network connection issue. Please check your internet and try again.";
          case "timeout":
            return "Verification timed out. Please try again.";
          case "internal-error":
            return "Verification service temporarily unavailable. Please try again.";
          case "invalid-input-response":
            return "Verification failed. Please try again.";
          default:
            return "Verification failed. Please try again or refresh the page.";
        }
      };

      // Start the initialization process
      ensureContainerAndInitialize();
    });
  }, [networkQuality, updatePhase, onVerificationSuccess, getWidgetContainer, setWidgetState, setGateState, previousFocusRef, componentId]);

  // Auto-bypass for specific conditions (defined first)
  const checkAutoBypass = useCallback(() => {
    const isDev = process.env.NODE_ENV === "development";
    
    if (!isDev) return false;

    // Check for auto-bypass conditions
    const urlParams = new URLSearchParams(window.location.search);
    const hasAutoBypass = urlParams.has('skip-security') || urlParams.has('dev-bypass');
    
    // Check for localhost/development environment auto-bypass
    const isLocalhost = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.includes('.local');
    
    // Check for development bypass cookie
    const hasDevCookie = document.cookie.includes('dev_bypass=true');
    
    if (hasAutoBypass || (isLocalhost && hasDevCookie)) {
      console.log("[EntryGate] 🚀 Auto-bypass activated for development");
      
      // Update verification state
      updatePhase("success", "Development auto-bypass - Access granted");
      
      // Store bypass verification
      try {
        const verificationData = {
          verifiedAt: new Date().toISOString(),
          userAgent: navigator.userAgent,
          version: '2.0',
          method: 'auto_bypass',
          bypassReason: hasAutoBypass ? 'url_param' : 'dev_environment'
        };
        
        sessionStorage.setItem('cf_session_verified', JSON.stringify(verificationData));
        console.log("[EntryGate] ✅ Auto-bypass verification stored");
      } catch (error) {
        console.warn("[EntryGate] Failed to store auto-bypass verification:", error);
      }
      
      // Log for analytics
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "turnstile_bypass", {
          event_category: "security",
          event_label: "auto_bypass",
          bypass_reason: hasAutoBypass ? 'url_param' : 'dev_environment',
          value: 1,
        });
      }
      
      setTimeout(() => onVerificationSuccess(), 500);
      return true;
    }
    
    return false;
  }, [onVerificationSuccess, updatePhase]);

  // Main initialization function with auto-bypass support
  const initializeTurnstileWidget = useCallback(async (isVisible: boolean) => {
    if (!isVisible) return;

    // Check for auto-bypass conditions first (development mode)
    if (checkAutoBypass()) {
      return; // Auto-bypass handled, exit early
    }

    startTimeRef.current = performance.now();
    phaseStartTimeRef.current = startTimeRef.current;

    try {
      updatePhase("loading-script");
      const quality = await detectNetworkQuality();
      setNetworkQuality(quality);

      if (quality === "offline") {
        updatePhase("network-issue");
        setCanBypass(true);
        return;
      }

      const scriptLoaded = await waitForTurnstileScript();
      if (!scriptLoaded) {
        updatePhase("error", "Failed to load verification system");
        if (retryCount < CONFIG.MAX_RETRIES) {
          scheduleRetry(retryCount + 1, () => {
            state.setRetryCount((prev) => prev + 1);
            initializeTurnstileWidget(isVisible);
          });
        } else {
          setCanBypass(true);
          updatePhase("bypass-available");
        }
        return;
      }

      updatePhase("preparing-widget");
      const widgetReady = await initializeWidget();
      
      if (widgetReady) {
        updatePhase("ready-for-user");
      } else {
        updatePhase("error", "Widget initialization failed");
        if (retryCount < CONFIG.MAX_RETRIES) {
          scheduleRetry(retryCount + 1, () => {
            state.setRetryCount((prev) => prev + 1);
            initializeTurnstileWidget(isVisible);
          });
        } else {
          setCanBypass(true);
          updatePhase("bypass-available");
        }
      }
    } catch (error) {
      console.error("[EntryGate] Initialization error:", error);
      updatePhase("error", "Initialization failed");
      
      if (retryCount < CONFIG.MAX_RETRIES) {
        scheduleRetry(retryCount + 1, () => {
          state.setRetryCount((prev) => prev + 1);
          initializeTurnstileWidget(isVisible);
        });
      } else {
        setCanBypass(true);
        updatePhase("bypass-available");
      }
    }
  }, [checkAutoBypass, updatePhase, setNetworkQuality, setCanBypass, waitForTurnstileScript, initializeWidget, scheduleRetry, retryCount, startTimeRef, phaseStartTimeRef, state]);

  // Enhanced bypass handler with multiple methods
  const handleEmergencyBypass = useCallback(() => {
    console.log("[EntryGate] Emergency bypass activated");
    updatePhase("success", "Manual bypass - Access granted");

    // Log bypass for analytics
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "turnstile_bypass", {
        event_category: "security",
        event_label: "emergency_bypass",
        bypass_reason: "development_testing",
        value: 1,
      });
    }

    // Update session storage to simulate successful verification
    try {
      const verificationData = {
        verifiedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        version: '2.0',
        method: 'development_bypass',
        bypassReason: 'manual_bypass'
      };
      
      sessionStorage.setItem('cf_session_verified', JSON.stringify(verificationData));
      console.log("[EntryGate] ✅ Bypass verification stored in session");
    } catch (error) {
      console.warn("[EntryGate] Failed to store bypass verification:", error);
    }

    setTimeout(() => onVerificationSuccess(), 1000);
  }, [onVerificationSuccess, updatePhase]);

  // Retry verification handler
  const handleRetry = useCallback(() => {
    console.log("[EntryGate] Retrying verification");
    state.setRetryCount((prev) => prev + 1);
    state.setTimeoutReached(false);
    setCanBypass(false);

    // Reset widget if it exists
    if (widgetState.widgetId && window.turnstile) {
      window.turnstile.reset(widgetState.widgetId);
    }

    // Reset states
    setWidgetState((prev) => ({
      ...prev,
      error: null,
      isVerified: false,
      token: null,
      isLoading: true,
    }));

    // Restart initialization
    initializeTurnstileWidget(true);
  }, [widgetState.widgetId, initializeTurnstileWidget, setWidgetState, setCanBypass, state]);

  return {
    // Functions
    updatePhase,
    setupTimeout,
    scheduleRetry,
    cleanup,
    waitForTurnstileScript,
    initializeWidget,
    initializeTurnstileWidget,
    handleEmergencyBypass,
    handleRetry,
    getWidgetContainer,
    checkAutoBypass,
  };
};