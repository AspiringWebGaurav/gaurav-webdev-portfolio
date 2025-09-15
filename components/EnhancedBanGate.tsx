"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getOrCreateVisitorUUID } from "@/utils/visitorTracking";
import { showErrorToast, showBanToast, showProcessingToast } from "@/components/ToastSystem";
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { silentLogger, prodLogger } from '@/utils/secureLogger';

interface BanGateProps {
  children: React.ReactNode;
  uuid?: string;
}

export default function EnhancedBanGate({ children, uuid }: BanGateProps) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const router = useRouter();
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const currentUUID = useRef<string | null>(null);

  useEffect(() => {
    checkVisitorStatus();
    
    // Cleanup Firebase listener on unmount
    return () => {
      if (unsubscribeRef.current) {
        console.log("🧹 Cleaning up Firebase listener in BanGate");
        unsubscribeRef.current();
      }
    };
  }, []);

  const checkVisitorStatus = async () => {
    try {
      // Use UUID from props or fallback to generated UUID
      const visitorUUID = uuid || getOrCreateVisitorUUID();
      if (!visitorUUID) {
        prodLogger.warn("No UUID available, denying access for security");
        setAllowed(false);
        setLoading(false);
        return;
      }

      currentUUID.current = visitorUUID;
      silentLogger.silent("Checking ban status for visitor");

      // ALWAYS check Firebase status - NO session storage bypass for security
      const response = await fetch(`/api/visitors/status?uuid=${visitorUUID}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Visitor not found, allow access (new visitor)
          console.log("👤 New visitor, allowing access");
          setAllowed(true);
          setLoading(false);
          // Start Firebase listener for new visitor too
          startFirebaseListener(visitorUUID);
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      silentLogger.silent("Visitor status retrieved from Firebase");

      if (data.status === "banned") {
        silentLogger.silent("Visitor is banned, redirecting to ban page");
        
        // Clear any session flags that might bypass security
        sessionStorage.removeItem("banCheckDone");
        sessionStorage.removeItem("justUnbanned");
        
        // Use Next.js router for dynamic redirection (works in both dev and production)
        const banReason = encodeURIComponent(data.banReason || "Policy violation");
        const policyRef = data.policyReference || "";
        router.push(`/${visitorUUID}/ban?reason=${banReason}&policyRef=${policyRef}`);
        return;
      }

      // Visitor is active, allow access and start real-time monitoring
      silentLogger.silent("Visitor is active, allowing access");
      setAllowed(true);
      
      // Start Firebase real-time listener for immediate ban detection
      startFirebaseListener(visitorUUID);

    } catch (error) {
      prodLogger.error("Error checking visitor status", { error: error instanceof Error ? error.message : "Unknown error" });
      setError(error instanceof Error ? error.message : "Unknown error");
      
      // On error, DENY access for security (don't allow by default)
      showErrorToast("Unable to verify access status. Access denied for security.");
      setAllowed(false);
    } finally {
      setLoading(false);
    }
  };

  const startFirebaseListener = (visitorUUID: string) => {
    if (isListening || !visitorUUID) return;

    try {
      // Clean up any existing listener first
      if (unsubscribeRef.current) {
        silentLogger.silent("Cleaning up existing listener before starting new one");
        unsubscribeRef.current();
        unsubscribeRef.current = null;
        setIsListening(false);
      }

      const docRef = doc(db as any, "visitors", visitorUUID);
      
      silentLogger.silent("Starting Firebase listener in BanGate");
      
      // Add a flag to prevent multiple toast calls
      let toastShown = false;
      
      const unsubscribe = onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            const currentStatus = data.status;
            
            silentLogger.silent("Real-time status update in BanGate");
            
            // If user gets banned while on the page, redirect immediately
            if (currentStatus === 'banned' && !toastShown) {
              silentLogger.silent("User banned in real-time! Redirecting immediately");
              toastShown = true; // Prevent duplicate toasts
              
              // Clear any session flags
              sessionStorage.removeItem("banCheckDone");
              sessionStorage.removeItem("justUnbanned");
              
              // Clean up listener immediately to prevent further calls
              if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
                setIsListening(false);
              }
              
              showBanToast(() => {
                showProcessingToast("🔁 Redirecting to ban page...", 1500);
                
                setTimeout(() => {
                  const banReason = encodeURIComponent(data.banReason || 'Policy violation');
                  const policyRef = data.policyReference || "";
                  router.push(`/${visitorUUID}/ban?reason=${banReason}&policyRef=${policyRef}`);
                }, 1500);
              });
            }
          }
        },
        (error) => {
          prodLogger.error("Firebase listener error in BanGate", { error: error.message });
          showErrorToast("Connection to security monitoring lost. Please refresh.");
        }
      );

      unsubscribeRef.current = unsubscribe;
      setIsListening(true);
    } catch (error) {
      prodLogger.error("Failed to start Firebase listener in BanGate", { error: error instanceof Error ? error.message : "Unknown error" });
    }
  };

  const retryCheck = () => {
    setLoading(true);
    setError(null);
    sessionStorage.removeItem("banCheckDone");
    checkVisitorStatus();
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (error && !allowed) {
    return <ErrorScreen error={error} onRetry={retryCheck} />;
  }

  return allowed ? <>{children}</> : null;
}

// Loading screen component
function LoadingScreen() {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "" : prev + ".");
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-black-100/95 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        {/* Animated loading spinner */}
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-gray-700/30"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-purple-500 animate-spin animation-delay-150"></div>
        </div>

        {/* Loading text */}
        <div className="text-white text-lg font-medium mb-2">
          Verifying Access{dots}
        </div>
        <div className="text-gray-400 text-sm">
          Please wait while we check your permissions
        </div>

        {/* Progress bar */}
        <div className="w-64 h-1 bg-gray-700 rounded-full mx-auto mt-4 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

// Error screen component
function ErrorScreen({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="fixed inset-0 bg-black-100/95 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black-100/80 border border-red-500/20 rounded-2xl p-8 max-w-md w-full text-center">
        {/* Error icon */}
        <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-white mb-2">
          Connection Error
        </h2>
        
        <p className="text-gray-300 mb-4 text-sm">
          Unable to verify your access status. This might be due to a network issue.
        </p>

        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
          <p className="text-red-300 text-xs font-mono">
            {error}
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onRetry}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors font-medium"
          >
            Retry
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors font-medium"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
}

// Custom CSS for animation delays (to be added to globals.css)
export const banGateStyles = `
.animation-delay-150 {
  animation-delay: 150ms;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in-up {
  animation: fadeInUp 0.5s ease-out;
}
`;