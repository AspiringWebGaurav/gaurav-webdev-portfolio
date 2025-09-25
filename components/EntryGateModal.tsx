/**
 * Optimized Entry Gate Modal Component
 * Fast-loading full-screen modal with enhanced UX, heartbeat animations, and smart fallbacks
 */

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  TurnstileWidgetState,
  EntryGateState,
  EntryGateStatus,
  TurnstileVerificationResponse,
} from "@/lib/types/turnstile";

// Performance and timeout configurations
const CONFIG = {
  // Fast-fail timeouts (milliseconds)
  SCRIPT_LOAD_TIMEOUT: process.env.NODE_ENV === "development" ? 3000 : 5000,
  WIDGET_INIT_TIMEOUT: process.env.NODE_ENV === "development" ? 2000 : 3000,
  VERIFICATION_TIMEOUT: process.env.NODE_ENV === "development" ? 8000 : 10000,

  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY_BASE: 1000, // Base delay for exponential backoff

  // Animation timings
  HEARTBEAT_DURATION: 1200, // ms for one heartbeat cycle
  TRANSITION_DELAY: 300,
  SUCCESS_ANIMATION_DELAY: 1200,

  // Development mode optimizations
  DEV_BYPASS_ENABLED: process.env.NODE_ENV === "development",
  DEV_FAST_MODE:
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_TURNSTILE_FAST_MODE === "true",
};

// Enhanced loading states
type LoadingPhase =
  | "initializing" // Initial setup
  | "loading-script" // Loading Turnstile script
  | "preparing-widget" // Preparing widget
  | "ready-for-user" // Widget ready, waiting for user interaction
  | "verifying" // User completed challenge, verifying
  | "server-verify" // Server-side verification
  | "success" // Verification successful
  | "error" // Error state
  | "bypass-available" // Fallback bypass option available
  | "network-issue"; // Network connectivity issues

// Network quality detection
const detectNetworkQuality = (): Promise<"fast" | "slow" | "offline"> => {
  return new Promise((resolve) => {
    if (!navigator.onLine) {
      resolve("offline");
      return;
    }

    // Use connection API if available
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;
    if (connection) {
      const effectiveType = connection.effectiveType;
      if (effectiveType === "4g" || effectiveType === "5g") {
        resolve("fast");
      } else if (effectiveType === "3g") {
        resolve("slow");
      } else {
        resolve("slow");
      }
      return;
    }

    // Fallback: simple timing test
    const startTime = performance.now();
    fetch("/favicon.ico", { method: "HEAD", cache: "no-cache" })
      .then(() => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        resolve(duration < 200 ? "fast" : "slow");
      })
      .catch(() => resolve("offline"));
  });
};

interface EntryGateModalProps {
  isVisible: boolean;
  onVerificationSuccess: () => void;
  onError?: (error: string) => void;
}

// Enterprise Status Indicator Component
const EnterpriseStatusIndicator: React.FC<{
  phase: LoadingPhase;
  isAnimating: boolean;
}> = ({ phase, isAnimating }) => {
  const getPhaseStyles = (phase: LoadingPhase) => {
    switch (phase) {
      case 'initializing':
      case 'loading-script':
        return {
          gradient: 'from-purple-500 to-purple-600',
          glow: 'shadow-purple-500/50',
          ring: 'border-purple-500/30'
        };
      case 'preparing-widget':
      case 'ready-for-user':
        return {
          gradient: 'from-blue-500 to-cyan-500',
          glow: 'shadow-cyan-500/50',
          ring: 'border-cyan-500/30'
        };
      case 'verifying':
      case 'server-verify':
        return {
          gradient: 'from-blue-500 to-indigo-500',
          glow: 'shadow-blue-500/50',
          ring: 'border-blue-500/30'
        };
      case 'success':
        return {
          gradient: 'from-emerald-500 to-green-500',
          glow: 'shadow-emerald-500/50',
          ring: 'border-emerald-500/30'
        };
      case 'error':
        return {
          gradient: 'from-red-500 to-red-600',
          glow: 'shadow-red-500/50',
          ring: 'border-red-500/30'
        };
      case 'network-issue':
        return {
          gradient: 'from-orange-500 to-yellow-500',
          glow: 'shadow-orange-500/50',
          ring: 'border-orange-500/30'
        };
      default:
        return {
          gradient: 'from-slate-500 to-slate-600',
          glow: 'shadow-slate-500/50',
          ring: 'border-slate-500/30'
        };
    }
  };

  const styles = getPhaseStyles(phase);

  if (phase === 'success') {
    return (
      <div className="relative">
        <div className={`w-12 h-12 bg-gradient-to-br ${styles.gradient} rounded-xl flex items-center justify-center shadow-lg ${styles.glow} animate-pulse`}>
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="relative">
        <div className={`w-12 h-12 bg-gradient-to-br ${styles.gradient} rounded-xl flex items-center justify-center shadow-lg ${styles.glow} animate-pulse`}>
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className={`w-12 h-12 border-4 ${styles.ring} rounded-xl ${isAnimating ? 'animate-spin' : ''} transition-all duration-500`}>
        <div className={`w-full h-full bg-gradient-to-br ${styles.gradient} rounded-lg shadow-lg ${styles.glow}`} />
      </div>
      {isAnimating && (
        <div className={`absolute -inset-2 border-2 ${styles.ring} rounded-xl animate-ping opacity-20`} />
      )}
    </div>
  );
};

const EntryGateModal: React.FC<EntryGateModalProps> = ({
  isVisible,
  onVerificationSuccess,
  onError,
}) => {
  // Enhanced loading state
  const [loadingPhase, setLoadingPhase] =
    useState<LoadingPhase>("initializing");
  const [networkQuality, setNetworkQuality] = useState<
    "fast" | "slow" | "offline"
  >("fast");
  const [retryCount, setRetryCount] = useState(0);
  const [canBypass, setCanBypass] = useState(false);
  const [timeoutReached, setTimeoutReached] = useState(false);

  // Performance monitoring
  const [metrics, setMetrics] = useState({
    scriptLoadTime: 0,
    widgetInitTime: 0,
    verificationTime: 0,
    totalTime: 0,
  });
  const startTimeRef = useRef<number>(0);
  const phaseStartTimeRef = useRef<number>(0);

  // Component state
  const [gateState, setGateState] = useState<EntryGateState>({
    status: "loading",
    message: getPhaseMessage("initializing"),
    showWidget: false,
    widgetId: null,
    retryCount: 0,
  });

  // Widget state for Turnstile
  const [widgetState, setWidgetState] = useState<TurnstileWidgetState>({
    isLoading: true,
    isVerified: false,
    token: null,
    error: null,
    widgetId: null,
  });

  // Refs with better HMR resilience
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupFunctionsRef = useRef<(() => void)[]>([]);
  const componentId = useRef(
    `entry-gate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );

  // Enhanced DOM element getter with fallback queries
  const getWidgetContainer = useCallback((): HTMLDivElement | null => {
    // First try the ref
    if (widgetContainerRef.current) {
      return widgetContainerRef.current;
    }

    // Fallback: query by class within the modal
    if (modalRef.current) {
      const container = modalRef.current.querySelector(
        ".cf-turnstile"
      ) as HTMLDivElement;
      if (container) {
        // Update the ref for next time
        widgetContainerRef.current = container;
        return container;
      }
    }

    // Last resort: global query
    const containers = document.querySelectorAll(".cf-turnstile");
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
      case "initializing":
        return "Starting security check...";
      case "loading-script":
        return "Loading verification system...";
      case "preparing-widget":
        return "Preparing security widget...";
      case "ready-for-user":
        return "Ready for verification";
      case "verifying":
        return "Processing verification...";
      case "server-verify":
        return "Confirming with server...";
      case "success":
        return "Access granted! Welcome.";
      case "error":
        return "Verification failed. Please try again.";
      case "bypass-available":
        return "Having trouble? Manual bypass available.";
      case "network-issue":
        return "Network connection issue detected.";
      default:
        return "Processing...";
    }
  }

  // Update phase with performance tracking
  const updatePhase = useCallback(
    (phase: LoadingPhase, error?: string) => {
      const now = performance.now();
      const phaseDuration = now - phaseStartTimeRef.current;

      // Update metrics
      setMetrics((prev) => ({
        ...prev,
        [`${loadingPhase}Time`]: phaseDuration,
        totalTime: now - startTimeRef.current,
      }));

      console.log(
        `[EntryGate] Phase transition: ${loadingPhase} → ${phase} (${phaseDuration.toFixed(
          0
        )}ms)`
      );

      setLoadingPhase(phase);
      phaseStartTimeRef.current = now;

      setGateState((prev) => ({
        ...prev,
        message: error || getPhaseMessage(phase),
        status:
          phase === "error"
            ? "error"
            : phase === "success"
            ? "verified"
            : phase === "ready-for-user"
            ? "verifying"
            : "loading",
      }));
    },
    [loadingPhase]
  );

  // Fast-fail timeout handler
  const setupTimeout = useCallback(
    (timeoutMs: number, callback: () => void, message: string) => {
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
    },
    []
  );

  // Exponential backoff retry logic
  const scheduleRetry = useCallback((attempt: number, callback: () => void) => {
    const delay = CONFIG.RETRY_DELAY_BASE * Math.pow(2, attempt - 1);
    console.log(
      `[EntryGate] Scheduling retry ${attempt}/${CONFIG.MAX_RETRIES} in ${delay}ms`
    );

    retryTimeoutRef.current = setTimeout(callback, delay);

    cleanupFunctionsRef.current.push(() => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    });
  }, []);

  // Cleanup all timers and listeners
  const cleanup = useCallback(() => {
    cleanupFunctionsRef.current.forEach((fn) => fn());
    cleanupFunctionsRef.current = [];

    // Cleanup widget
    if (widgetState.widgetId && window.turnstile) {
      try {
        // Use manager for proper cleanup
        if (typeof window !== "undefined" && window.turnstileManager) {
          window.turnstileManager.unregister(componentId.current);
        } else if (typeof window !== "undefined" && window.turnstile) {
          // Fallback cleanup
          window.turnstile.remove(widgetState.widgetId);
        }
        console.log("[EntryGate] Widget cleaned up");
      } catch (error) {
        console.warn("[EntryGate] Error during widget cleanup:", error);
      }
    }
  }, [widgetState.widgetId]);

  // Enhanced Turnstile initialization with fast-fail
  const initializeTurnstileWidget = useCallback(async () => {
    if (!isVisible) return;

    startTimeRef.current = performance.now();
    phaseStartTimeRef.current = startTimeRef.current;

    try {
      // Detect network quality first
      updatePhase("loading-script");
      const quality = await detectNetworkQuality();
      setNetworkQuality(quality);

      if (quality === "offline") {
        updatePhase("network-issue");
        setCanBypass(true);
        return;
      }

      // Wait for Turnstile script with timeout
      const scriptLoaded = await waitForTurnstileScript();

      if (!scriptLoaded) {
        updatePhase("error", "Failed to load verification system");
        if (retryCount < CONFIG.MAX_RETRIES) {
          scheduleRetry(retryCount + 1, () => {
            setRetryCount((prev) => prev + 1);
            initializeTurnstileWidget();
          });
        } else {
          setCanBypass(true);
          updatePhase("bypass-available");
        }
        return;
      }

      updatePhase("preparing-widget");

      // Initialize widget with timeout protection
      const widgetReady = await initializeWidget();

      if (widgetReady) {
        updatePhase("ready-for-user");
      } else {
        updatePhase("error", "Widget initialization failed");
        if (retryCount < CONFIG.MAX_RETRIES) {
          scheduleRetry(retryCount + 1, () => {
            setRetryCount((prev) => prev + 1);
            initializeTurnstileWidget();
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
          setRetryCount((prev) => prev + 1);
          initializeTurnstileWidget();
        });
      } else {
        setCanBypass(true);
        updatePhase("bypass-available");
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
        window.removeEventListener("turnstile-loaded", handleScriptLoad);
        resolve(true);
      };

      const handleScriptError = () => {
        window.removeEventListener("turnstile-error", handleScriptError);
        resolve(false);
      };

      window.addEventListener("turnstile-loaded", handleScriptLoad);
      window.addEventListener("turnstile-error", handleScriptError);

      // Setup timeout
      setupTimeout(
        CONFIG.SCRIPT_LOAD_TIMEOUT,
        () => {
          window.removeEventListener("turnstile-loaded", handleScriptLoad);
          window.removeEventListener("turnstile-error", handleScriptError);
          resolve(false);
        },
        "Script load timeout"
      );

      // Polling fallback for environments without event support
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

  // Enhanced widget initialization with proper DOM readiness checks
  const initializeWidget = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
      if (!siteKey) {
        console.error(
          "[EntryGate] NEXT_PUBLIC_TURNSTILE_SITE_KEY not configured"
        );
        updatePhase(
          "error",
          "Site key not configured. Please check environment variables."
        );
        resolve(false);
        return;
      }

      // Enhanced container readiness check with robust DOM detection
      const checkContainerReady = (attempt = 1, maxAttempts = 30) => {
        const container = getWidgetContainer();

        if (!container) {
          if (attempt < maxAttempts) {
            console.log(
              `[EntryGate] Widget container not ready, attempt ${attempt}/${maxAttempts}`
            );
            setTimeout(
              () => checkContainerReady(attempt + 1, maxAttempts),
              100
            );
            return;
          } else {
            console.error(
              "[EntryGate] Widget container never became ready after",
              maxAttempts,
              "attempts"
            );
            resolve(false);
            return;
          }
        }

        // Ensure container is properly attached to DOM
        if (!document.contains(container)) {
          console.log(
            `[EntryGate] Container found but not in DOM, attempt ${attempt}/${maxAttempts}`
          );
          if (attempt < maxAttempts) {
            setTimeout(
              () => checkContainerReady(attempt + 1, maxAttempts),
              100
            );
            return;
          } else {
            console.error("[EntryGate] Widget container never attached to DOM");
            resolve(false);
            return;
          }
        }

        // Container is ready, proceed with Turnstile initialization
        if (typeof window !== "undefined" && window.turnstileManager) {
          window.turnstileManager.waitForReady((error?: Error) => {
            if (error) {
              console.error("[EntryGate] Turnstile not ready:", error);
              updatePhase(
                "error",
                "Failed to load security verification. Please refresh the page."
              );
              resolve(false);
              return;
            }

            // Double-check container and turnstile availability with robust getter
            const finalContainer = getWidgetContainer();
            if (!finalContainer) {
              console.error(
                "[EntryGate] Container became unavailable after ready check"
              );
              resolve(false);
              return;
            }

            if (!window.turnstile) {
              console.error(
                "[EntryGate] Turnstile API unavailable after ready check"
              );
              resolve(false);
              return;
            }

            try {
              console.log(
                "[EntryGate] Initializing widget with key:",
                siteKey.substring(0, 10) + "..."
              );
              console.log(
                "[EntryGate] Using container:",
                finalContainer.className,
                "in DOM:",
                document.contains(finalContainer)
              );

              const widgetId = window.turnstile.render(finalContainer, {
                sitekey: siteKey,
                appearance: "always",
                theme: "dark",
                size: "normal",
                callback: (token: string) => {
                  console.log("[EntryGate] Turnstile verification completed");
                  updatePhase("verifying");

                  setWidgetState((prev) => ({
                    ...prev,
                    token,
                    isVerified: true,
                  }));

                  updatePhase("server-verify");

                  // Call server verification
                  fetch("/api/turnstile/verify", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ token }),
                  })
                    .then((response) => response.json())
                    .then((result: TurnstileVerificationResponse) => {
                      if (result.success) {
                        console.log(
                          "[EntryGate] Server verification successful"
                        );
                        updatePhase("success");

                        setTimeout(() => {
                          onVerificationSuccess();
                          if (previousFocusRef.current) {
                            previousFocusRef.current.focus();
                          }
                        }, CONFIG.SUCCESS_ANIMATION_DELAY);
                      } else {
                        console.warn(
                          "[EntryGate] Server verification failed:",
                          result.errors
                        );
                        updatePhase(
                          "error",
                          "Server verification failed. Please try again."
                        );
                      }
                    })
                    .catch((error) => {
                      console.error("[EntryGate] API call failed:", error);
                      updatePhase(
                        "error",
                        "Network error. Please check your connection and try again."
                      );
                    });
                },
                "error-callback": (errorCode?: string) => {
                  console.warn("[EntryGate] Turnstile error:", errorCode);
                  const message =
                    errorCode === "network-error"
                      ? "Network connection issue. Please check your internet and try again."
                      : "Verification failed. Please try again.";
                  updatePhase("error", message);
                },
                "expired-callback": () => {
                  console.warn("[EntryGate] Turnstile token expired");
                  updatePhase(
                    "error",
                    "Verification expired. Please try again."
                  );
                },
                "timeout-callback": () => {
                  console.warn("[EntryGate] Turnstile timeout");
                  updatePhase(
                    "error",
                    "Verification timed out. Please try again."
                  );
                },
                retry: "auto",
                "retry-interval": networkQuality === "slow" ? 3000 : 2000,
                "refresh-expired": "auto",
              });

              console.log("[EntryGate] Widget render result:", widgetId);

              if (widgetId && window.turnstileManager) {
                // Register with manager
                window.turnstileManager.register(componentId.current, widgetId);

                setWidgetState((prev) => ({
                  ...prev,
                  widgetId,
                  isLoading: false,
                }));

                setGateState((prev) => ({
                  ...prev,
                  showWidget: true,
                  widgetId,
                }));

                console.log(
                  "[EntryGate] Widget initialized successfully with ID:",
                  widgetId
                );
                resolve(true);
              } else {
                console.error(
                  "[EntryGate] Widget render returned null/undefined"
                );
                resolve(false);
              }
            } catch (error) {
              console.error("[EntryGate] Widget render error:", error);
              resolve(false);
            }
          }, 15000); // 15 second timeout
        } else {
          console.warn("[EntryGate] TurnstileManager not available");
          updatePhase(
            "error",
            "Security system not available. Please refresh the page."
          );
          resolve(false);
        }
      };

      // Start the container readiness check
      checkContainerReady();
    });
  }, [networkQuality, updatePhase, onVerificationSuccess, getWidgetContainer]);

  // Turnstile success callback
  const handleTurnstileSuccess = useCallback(
    async (token: string) => {
      console.log("[EntryGate] Turnstile verification completed");
      updatePhase("verifying");

      setWidgetState((prev) => ({
        ...prev,
        token,
        isVerified: true,
      }));

      updatePhase("server-verify");

      try {
        // Add timeout for server verification
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          CONFIG.VERIFICATION_TIMEOUT
        );

        const response = await fetch("/api/turnstile/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const result: TurnstileVerificationResponse = await response.json();

        if (result.success) {
          console.log("[EntryGate] Server verification successful");
          updatePhase("success");

          // Log performance metrics
          console.log("[EntryGate] Performance metrics:", {
            ...metrics,
            totalTime: performance.now() - startTimeRef.current,
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
          console.warn(
            "[EntryGate] Server verification failed:",
            result.errors
          );
          handleVerificationError(
            "Server verification failed. Please try again."
          );
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          console.error("[EntryGate] Server verification timeout");
          handleVerificationError("Verification timed out. Please try again.");
        } else {
          console.error("[EntryGate] API call failed:", error);
          handleVerificationError(
            "Network error. Please check your connection and try again."
          );
        }
      }
    },
    [onVerificationSuccess, updatePhase, metrics]
  );

  // Turnstile error callbacks
  const handleTurnstileError = useCallback((errorCode?: string) => {
    console.warn("[EntryGate] Turnstile error:", errorCode);
    const message = getTurnstileErrorMessage(errorCode);
    handleVerificationError(message);
  }, []);

  const handleTurnstileExpired = useCallback(() => {
    console.warn("[EntryGate] Turnstile token expired");
    handleVerificationError("Verification expired. Please try again.");
  }, []);

  const handleTurnstileTimeout = useCallback(() => {
    console.warn("[EntryGate] Turnstile timeout");
    handleVerificationError("Verification timed out. Please try again.");
  }, []);

  // Handle verification errors
  const handleVerificationError = useCallback(
    (message: string) => {
      updatePhase("error", message);

      setWidgetState((prev) => ({
        ...prev,
        error: message,
        isVerified: false,
        token: null,
      }));

      if (onError) {
        onError(message);
      }
    },
    [onError, updatePhase]
  );

  // Manual bypass for emergency situations
  const handleEmergencyBypass = useCallback(() => {
    console.log("[EntryGate] Emergency bypass activated");
    updatePhase("success", "Manual bypass - Access granted");

    // Log bypass for analytics
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "turnstile_bypass", {
        event_category: "security",
        event_label: "emergency_bypass",
        value: 1,
      });
    }

    setTimeout(() => {
      onVerificationSuccess();
    }, 1000);
  }, [onVerificationSuccess, updatePhase]);

  // Retry verification
  const handleRetry = useCallback(() => {
    console.log("[EntryGate] Retrying verification");
    setRetryCount((prev) => prev + 1);
    setTimeoutReached(false);
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
    initializeTurnstileWidget();
  }, [widgetState.widgetId, initializeTurnstileWidget]);

  // Get user-friendly error message
  const getTurnstileErrorMessage = (errorCode?: string): string => {
    switch (errorCode) {
      case "WIDGET_RENDER_FAILED":
        return "Failed to load security verification. Please refresh the page.";
      case "network-error":
        return "Network connection issue. Please check your internet and try again.";
      case "timeout":
        return "Verification timed out. Please try again.";
      default:
        return "Verification failed. Please try again.";
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
    const timer = setTimeout(
      initializeTurnstileWidget,
      CONFIG.TRANSITION_DELAY
    );

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
      if (
        CONFIG.DEV_BYPASS_ENABLED &&
        event.ctrlKey &&
        event.shiftKey &&
        event.key === "B"
      ) {
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
        trapFocus(event);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, handleEmergencyBypass]);

  // Focus trap utility
  const trapFocus = (event: KeyboardEvent) => {
    if (!modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

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
    <>
      {/* Enterprise Custom Styles */}
      <style jsx>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(139, 92, 246, 0.3), 0 0 40px rgba(59, 130, 246, 0.2);
          }
          50% {
            box-shadow: 0 0 30px rgba(139, 92, 246, 0.5), 0 0 60px rgba(59, 130, 246, 0.4);
          }
        }

        .animate-fadeInScale {
          animation: fadeInScale 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        .animate-pulseGlow {
          animation: pulseGlow 3s ease-in-out infinite;
        }

        .enterprise-backdrop {
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
        }

        @media (max-width: 640px) {
          .mobile-scale {
            transform: scale(0.85);
          }
        }

        @media (max-height: 600px) {
          .compact-spacing {
            padding: 1rem;
          }
        }
      `}</style>

      {/* Enterprise Glassmorphism Backdrop */}
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden px-4 py-4 sm:px-6 sm:py-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="enterprise-entry-gate-title"
        aria-describedby="enterprise-entry-gate-description"
      >
        {/* Multi-layer Enterprise Background */}
        <div className="absolute inset-0">
          {/* Layer 1: Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-black/95 to-cyan-900/40" />
          
          {/* Layer 2: Animated overlays */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/15 via-transparent to-cyan-500/15 animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-blue-500/10 to-transparent" />
          </div>
          
          {/* Layer 3: Dynamic floating orbs */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 sm:w-48 sm:h-48 lg:w-72 lg:h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-28 h-28 sm:w-40 sm:h-40 lg:w-60 lg:h-60 bg-cyan-500/20 rounded-full blur-3xl animate-pulse animation-delay-150" />
            <div className="absolute top-3/4 left-3/4 w-24 h-24 sm:w-32 sm:h-32 lg:w-48 lg:h-48 bg-blue-500/15 rounded-full blur-2xl animate-pulse animation-delay-300" />
          </div>
          
          {/* Enterprise backdrop filter */}
          <div className="absolute inset-0 enterprise-backdrop" />
        </div>

        {/* Enterprise Modal Container */}
        <div
          ref={modalRef}
          className="relative w-full max-w-[340px] sm:max-w-md transform transition-all duration-700 ease-out animate-fadeInScale"
          tabIndex={-1}
        >
          {/* Neumorphic Container with Multi-layer Effects */}
          <div className="relative overflow-hidden">
            {/* Outer glow border effects */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/30 via-blue-500/30 to-cyan-500/30 rounded-2xl blur-sm animate-pulseGlow" />
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 rounded-2xl animate-pulse" />
            
            {/* Main glassmorphic container */}
            <div className="relative bg-black/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
              {/* Inner gradient glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5 rounded-2xl" />
              
              {/* Content Container */}
              <div className="relative z-10 p-5 sm:p-8 text-center compact-spacing">
                {/* Enterprise Header */}
                <div className="mb-5 sm:mb-8">
                  {/* Premium Logo/Icon */}
                  <div className="flex justify-center mb-4 sm:mb-6">
                    <div className="relative">
                      {/* Main icon with gradient */}
                      <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-2xl">
                        <div className="w-5 h-5 sm:w-7 sm:h-7 bg-white/90 rounded-lg flex items-center justify-center">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      {/* Multi-layer glow effects */}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/40 via-blue-500/40 to-cyan-500/40 rounded-xl blur-md animate-pulse" />
                      <div className="absolute -inset-1 bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-cyan-500/20 rounded-xl blur-lg animate-pulse animation-delay-150" />
                    </div>
                  </div>

                  <h2
                    id="enterprise-entry-gate-title"
                    className="text-base sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2 sm:mb-3"
                  >
                    Security Verification
                  </h2>
                  <p
                    id="enterprise-entry-gate-description"
                    className="text-slate-300 text-xs sm:text-sm leading-relaxed px-2 max-w-xs mx-auto"
                  >
                    Please verify you&apos;re human to access the portfolio
                  </p>
                </div>

                {/* Enterprise Status System */}
                <div className="mb-5 sm:mb-8">
                  <div className="flex items-center justify-center mb-4 sm:mb-6">
                    <EnterpriseStatusIndicator
                      phase={loadingPhase}
                      isAnimating={loadingPhase !== 'success' && loadingPhase !== 'error'}
                    />
                  </div>

                  {/* Status Message */}
                  <div className="mb-4 sm:mb-6">
                    <p className="text-white font-medium text-xs sm:text-base mb-3 min-h-[1.5rem]">
                      {gateState.message}
                    </p>
                    
                    {/* Enterprise Progress Bar */}
                    <div className="w-full bg-slate-800/60 rounded-full h-1.5 overflow-hidden shadow-inner">
                      <div
                        className={`h-full bg-gradient-to-r transition-all duration-1000 ease-out relative ${
                          loadingPhase === 'initializing' ? 'from-purple-500 to-purple-600 w-[15%]' :
                          loadingPhase === 'loading-script' ? 'from-purple-500 to-blue-500 w-[30%]' :
                          loadingPhase === 'preparing-widget' ? 'from-blue-500 to-cyan-500 w-[60%]' :
                          loadingPhase === 'ready-for-user' ? 'from-cyan-500 to-blue-500 w-[80%]' :
                          loadingPhase === 'verifying' ? 'from-blue-500 to-indigo-500 w-[90%]' :
                          loadingPhase === 'server-verify' ? 'from-indigo-500 to-purple-500 w-[95%]' :
                          loadingPhase === 'success' ? 'from-emerald-500 to-green-500 w-[100%]' :
                          loadingPhase === 'error' ? 'from-red-500 to-red-600 w-[100%]' :
                          'from-slate-500 to-slate-600 w-[25%]'
                        }`}
                      >
                        {/* Active shimmer effect */}
                        {(loadingPhase !== 'success' && loadingPhase !== 'error') && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                        )}
                      </div>
                    </div>

                    {/* Network Quality Badge */}
                    {networkQuality !== 'fast' && (
                      <div className="flex items-center justify-center mt-2 sm:mt-3">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          networkQuality === 'offline' ? 'bg-red-400 animate-pulse' : 'bg-amber-400 animate-pulse'
                        }`} />
                        <span className="text-xs text-slate-400">
                          {networkQuality === 'offline' ? 'Working Offline' : 'Slow Connection'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Premium Turnstile Widget Container */}
                <div className={`mb-5 sm:mb-8 transition-all duration-500 ease-out ${
                  gateState.showWidget ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4 pointer-events-none'
                }`}>
                  <div className="relative">
                    {/* Widget glow container */}
                    <div className="absolute -inset-3 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10 rounded-xl blur-lg" />
                    
                    {/* Widget housing */}
                    <div className="relative bg-slate-900/60 backdrop-blur-sm rounded-xl border border-white/10 p-3 sm:p-5 shadow-2xl">
                      <div className="flex justify-center">
                        <div
                          ref={widgetContainerRef}
                          className="cf-turnstile mobile-scale transform transition-transform duration-300"
                          data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                          data-theme="dark"
                          data-size="normal"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Error State */}
                {loadingPhase === 'error' && (
                  <div className="space-y-4 mb-5">
                    <button
                      onClick={handleRetry}
                      disabled={retryCount >= CONFIG.MAX_RETRIES}
                      className="w-full relative overflow-hidden group disabled:cursor-not-allowed min-h-[44px]"
                    >
                      {/* Gradient button background */}
                      <div className={`absolute inset-0 rounded-xl transition-all duration-300 ${
                        retryCount >= CONFIG.MAX_RETRIES
                          ? 'bg-gradient-to-r from-slate-600 to-slate-700'
                          : 'bg-gradient-to-r from-purple-500 to-cyan-500 group-hover:from-purple-600 group-hover:to-cyan-600'
                      }`} />
                      
                      {/* Button hover glow */}
                      {retryCount < CONFIG.MAX_RETRIES && (
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/40 to-cyan-500/40 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      )}
                      
                      {/* Button content */}
                      <div className="relative px-4 sm:px-6 py-2.5 sm:py-3 text-white font-medium text-sm sm:text-base">
                        {retryCount >= CONFIG.MAX_RETRIES ? (
                          <span className="flex items-center justify-center">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            Retry Limit Reached
                          </span>
                        ) : (
                          <span className="flex items-center justify-center">
                            <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Retry ({CONFIG.MAX_RETRIES - retryCount} left)
                          </span>
                        )}
                      </div>
                    </button>
                  </div>
                )}

                {/* Emergency Bypass - Enterprise Security */}
                {(canBypass || loadingPhase === 'bypass-available') && (
                  <div className="space-y-4 mb-5 border-t border-white/10 pt-5">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-3">
                        <svg className="w-5 h-5 text-amber-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <p className="text-amber-400 text-sm font-medium">
                          Verification Issues
                        </p>
                      </div>
                      
                      <p className="text-slate-400 text-xs mb-4 px-3 leading-relaxed">
                        Having persistent problems? Continue with limited access.
                      </p>
                      
                      <button
                        onClick={handleEmergencyBypass}
                        className="relative overflow-hidden group px-4 py-2 bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 rounded-lg text-sm transition-all duration-200 border border-slate-600/50 hover:border-slate-500/50 min-h-[44px]"
                      >
                        <div className="flex items-center justify-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Continue Anyway
                        </div>
                        
                        {/* Subtle hover glow */}
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </button>
                      
                      <p className="text-xs text-slate-500 mt-2">
                        Limited functionality mode
                      </p>
                    </div>
                  </div>
                )}

                {/* Development Mode Badge */}
                {CONFIG.DEV_BYPASS_ENABLED && (
                  <div className="mb-5 p-3 bg-amber-900/20 border border-amber-700/30 rounded-lg text-xs">
                    <div className="flex items-center justify-center text-amber-400 mb-1">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Developer Mode
                    </div>
                    <p className="text-amber-300/80 text-center">
                      <kbd className="px-1.5 py-0.5 bg-amber-800/30 rounded text-xs font-mono">Ctrl+Shift+B</kbd> for bypass
                    </p>
                  </div>
                )}

                {/* Enterprise Footer */}
                <div className="border-t border-white/5 pt-4 sm:pt-6">
                  <div className="flex items-center justify-center mb-3">
                    <div className="flex items-center space-x-1 text-slate-500">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="text-xs">Cloudflare Protected</span>
                    </div>
                  </div>
                  
                  <p className="text-slate-400 text-xs leading-relaxed px-2">
                    Security verification prevents automated access and ensures authentic interactions.
                  </p>
                  
                  <div className="flex items-center justify-center space-x-3 mt-2">
                    <button className="text-slate-500 hover:text-slate-300 text-xs underline transition-colors duration-200">
                      Privacy
                    </button>
                    <span className="text-slate-600">•</span>
                    <button className="text-slate-500 hover:text-slate-300 text-xs underline transition-colors duration-200">
                      Cookies
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Heartbeat Animation Component
const HeartbeatLoader: React.FC<{
  phase: LoadingPhase;
  isAnimating: boolean;
}> = ({ phase, isAnimating }) => {
  const getPhaseColor = (phase: LoadingPhase) => {
    switch (phase) {
      case "initializing":
      case "loading-script":
        return "border-t-purple-500";
      case "preparing-widget":
      case "ready-for-user":
        return "border-t-cyan-500";
      case "verifying":
      case "server-verify":
        return "border-t-blue-500";
      case "success":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "bypass-available":
        return "border-t-yellow-500";
      case "network-issue":
        return "border-t-orange-500";
      default:
        return "border-t-gray-500";
    }
  };

  if (phase === "success") {
    return (
      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Main heartbeat circle */}
      <div
        className={`w-8 h-8 border-2 border-gray-600 ${getPhaseColor(
          phase
        )} rounded-full ${isAnimating ? "animate-spin" : ""}`}
        style={{
          animation: isAnimating
            ? `heartbeat ${CONFIG.HEARTBEAT_DURATION}ms ease-in-out infinite`
            : "none",
        }}
      />

      {/* Outer glow effect */}
      <div
        className={`absolute inset-0 w-8 h-8 border border-current rounded-full opacity-30 ${getPhaseColor(
          phase
        ).replace("border-t-", "border-")}`}
        style={{
          animation: isAnimating
            ? `heartbeatGlow ${CONFIG.HEARTBEAT_DURATION}ms ease-in-out infinite 200ms`
            : "none",
        }}
      />

      {/* Add custom CSS for heartbeat animation */}
      <style jsx>{`
        @keyframes heartbeat {
          0%,
          100% {
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
          0%,
          100% {
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
