"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { getOrCreateVisitorUUID } from '@/utils/visitorTracking';
import {
  showBanToast,
  showUnbanToast,
  showProcessingToast,
  showErrorToast
} from '@/components/ToastSystem';
import { enterpriseRedirect, RedirectStrategy } from '@/utils/enterpriseRedirect';
import { getSessionManager, setBanState } from '@/utils/enterpriseSessionManager';

interface VisitorStatus {
  status: 'active' | 'banned';
  banReason?: string;
  banTimestamp?: string;
  unbanTimestamp?: string;
  lastStatusChange?: string;
}

interface EnhancedVisitorStatusWatcherProps {
  uuid?: string;
}

export default function EnhancedVisitorStatusWatcher({ uuid: propUUID }: EnhancedVisitorStatusWatcherProps) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<VisitorStatus | null>(null);
  const [isListening, setIsListening] = useState(false);
  const lastStatus = useRef<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const uuid = useRef<string | null>(null);

  useEffect(() => {
    initializeWatcher();
    
    return () => {
      cleanup();
    };
  }, []);

  const initializeWatcher = async () => {
    try {
      // Use provided UUID or generate visitor UUID
      uuid.current = propUUID || getOrCreateVisitorUUID();
      
      if (!uuid.current) {
        console.warn("❌ No UUID available for status watching");
        return;
      }

      console.log("👀 Enhanced VisitorStatusWatcher initialized for UUID:", uuid.current);
      
      // Start listening to Firestore changes
      startListening();
      
    } catch (error) {
      console.error("❌ Failed to initialize visitor status watcher:", error);
      showErrorToast("Failed to initialize visitor monitoring");
    }
  };

  const startListening = () => {
    if (!uuid.current || isListening) return;

    const docRef = doc(db as any, "visitors", uuid.current);
    
    console.log("👂 Starting real-time listener for:", docRef.path);
    
    const unsubscribe = onSnapshot(
      docRef,
      async (snapshot) => {
        await handleStatusUpdate(snapshot);
      },
      (error) => {
        console.error("❌ Firestore listener error:", error);
        showErrorToast("Connection to server lost. Please refresh the page.");
        
        // Attempt to reconnect after a delay
        setTimeout(() => {
          if (!isListening) {
            startListening();
          }
        }, 5000);
      }
    );

    unsubscribeRef.current = unsubscribe;
    setIsListening(true);
  };

  const handleStatusUpdate = async (snapshot: any) => {
    if (!snapshot.exists()) {
      console.log("⏳ Visitor document not found yet - waiting for VisitorTracker to create it...");
      // Don't treat this as an error - the document will be created by VisitorTracker
      return;
    }

    const data = snapshot.data();
    const newStatus: VisitorStatus = {
      status: data.status || 'active',
      banReason: data.banReason,
      banTimestamp: data.banTimestamp,
      unbanTimestamp: data.unbanTimestamp,
      lastStatusChange: data.lastStatusChange
    };

    console.log("📡 Status update received:", newStatus);

    // Skip processing on first load
    if (lastStatus.current === null) {
      lastStatus.current = newStatus.status;
      setCurrentStatus(newStatus);
      return;
    }

    // Only react to actual status changes
    if (newStatus.status !== lastStatus.current) {
      console.log(`🔄 Status changed: ${lastStatus.current} → ${newStatus.status}`);
      
      setCurrentStatus(newStatus);
      await handleStatusChange(newStatus);
      lastStatus.current = newStatus.status;
    }
  };

  const handleStatusChange = async (status: VisitorStatus) => {
    if (status.status === 'banned') {
      await handleBanAction(status);
    } else if (status.status === 'active') {
      await handleUnbanAction(status);
    }
  };

  const handleBanAction = async (status: VisitorStatus) => {
    console.log("🚫 User has been banned:", status.banReason);
    const sessionManager = getSessionManager();
    
    // Store ban state first
    if (uuid.current) {
      await setBanState(uuid.current, 'banned');
    }
    
    showBanToast(() => {
      showProcessingToast("🔁 Redirecting to ban page...", 2000);
      
      setTimeout(async () => {
        if (!uuid.current) return;
        
        try {
          const banUrl = `/${uuid.current}/ban?reason=${encodeURIComponent(status.banReason || 'Policy violation')}`;
          
          // Store redirect state
          await sessionManager.setRedirectState(uuid.current, banUrl, 'ban');
          
          // Use enterprise redirect with mobile-optimized fallbacks
          const redirectResult = await enterpriseRedirect(banUrl, {
            maxRetries: 3,
            retryDelay: 800,
            timeout: 10000,
            preserveHistory: false,
            validateRedirect: true,
            fallbackStrategies: [
              RedirectStrategy.NEXT_ROUTER,
              RedirectStrategy.WINDOW_LOCATION,
              RedirectStrategy.META_REFRESH,
              RedirectStrategy.FORM_SUBMIT,
              RedirectStrategy.WINDOW_REPLACE,
              RedirectStrategy.FORCE_RELOAD
            ]
          }, router, uuid.current);
          
          if (!redirectResult.success) {
            console.error("Enterprise redirect failed for ban", redirectResult);
            // Last resort fallback
            try {
              window.location.href = banUrl;
            } catch (fallbackError) {
              showErrorToast("Redirect failed. Please refresh the page.");
            }
          }
        } catch (error) {
          console.error("Error during ban redirect process:", error);
          // Ultimate fallback
          try {
            const banUrl = `/${uuid.current}/ban?reason=${encodeURIComponent(status.banReason || 'Policy violation')}`;
            window.location.href = banUrl;
          } catch (fallbackError) {
            showErrorToast("Redirect failed. Please refresh the page.");
          }
        }
      }, 2000);
    });
  };

  const handleUnbanAction = async (status: VisitorStatus) => {
    console.log("🎉 User has been unbanned");
    const sessionManager = getSessionManager();
    
    // Store unban completion state first
    if (uuid.current) {
      await sessionManager.setUnbanCompletionState(uuid.current);
      await setBanState(uuid.current, 'unbanned');
    }
    
    showUnbanToast(() => {
      showProcessingToast("🔄 Redirecting to portfolio...", 3000);
      
      setTimeout(async () => {
        if (!uuid.current) return;
        
        try {
          // Set session storage for backward compatibility
          sessionStorage.setItem('banCheckDone', 'true');
          sessionStorage.setItem('justUnbanned', 'true');
          
          const portfolioUrl = `/${uuid.current}`;
          
          // Store redirect state for mobile reliability
          await sessionManager.setRedirectState(uuid.current, portfolioUrl, 'unban');
          
          // Use enterprise redirect with Samsung S9 Plus optimized strategy
          const redirectResult = await enterpriseRedirect(portfolioUrl, {
            maxRetries: 5,
            retryDelay: 1000,
            timeout: 15000,
            preserveHistory: false,
            validateRedirect: true,
            fallbackStrategies: [
              RedirectStrategy.WINDOW_LOCATION, // Best for Samsung browsers
              RedirectStrategy.META_REFRESH,    // Reliable fallback
              RedirectStrategy.FORM_SUBMIT,     // Mobile-friendly
              RedirectStrategy.NEXT_ROUTER,     // Standard approach
              RedirectStrategy.WINDOW_REPLACE,  // Alternative
              RedirectStrategy.FORCE_RELOAD     // Last resort
            ]
          }, router, uuid.current);
          
          if (!redirectResult.success) {
            console.error("Enterprise redirect failed for unban", redirectResult);
            
            // Last resort: show manual redirect instruction
            showErrorToast("Please manually refresh the page or click your browser's back button to return to the portfolio.");
            
            // Try simple fallback after a delay
            setTimeout(() => {
              try {
                window.location.href = portfolioUrl;
              } catch (fallbackError) {
                console.error("Final fallback redirect also failed:", fallbackError);
              }
            }, 2000);
          } else {
            console.log("🎉 Unban redirect successful via VisitorStatusWatcher:", {
              method: redirectResult.method,
              attempts: redirectResult.attempts,
              duration: redirectResult.duration
            });
          }
        } catch (error) {
          console.error("Error during unban redirect process in VisitorStatusWatcher:", error);
          
          // Fallback: try simple window location
          try {
            window.location.href = `/${uuid.current}`;
          } catch (fallbackError) {
            showErrorToast("Redirect failed. Please manually navigate to your portfolio.");
          }
        }
      }, 3000); // Increased delay for mobile stability
    });
  };

  const cleanup = () => {
    if (unsubscribeRef.current) {
      console.log("🧹 Cleaning up Firestore listener");
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    setIsListening(false);
  };

  // Periodic connection health check
  useEffect(() => {
    const healthCheck = setInterval(() => {
      if (uuid.current && !isListening) {
        console.log("🔄 Reconnecting visitor status watcher...");
        startListening();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(healthCheck);
  }, [isListening]);

  // This component doesn't render anything visible
  return null;
}

// Hook for using visitor status in other components
export function useVisitorStatus() {
  const [status, setStatus] = useState<VisitorStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const uuid = getOrCreateVisitorUUID();
        const response = await fetch(`/api/visitors/status?uuid=${uuid}`);
        
        if (response.ok) {
          const data = await response.json();
          setStatus({
            status: data.status,
            banReason: data.banReason,
            banTimestamp: data.banTimestamp
          });
        } else if (response.status === 404) {
          // Document doesn't exist yet - this is normal for new visitors
          console.log('⏳ Visitor document not created yet, will be created by VisitorTracker');
          setStatus({
            status: 'active', // Default status for new visitors
            banReason: undefined,
            banTimestamp: undefined
          });
        } else {
          throw new Error('Failed to fetch status');
        }
      } catch (err) {
        console.warn('Status check error:', err);
        // Set default status instead of error for better UX
        setStatus({
          status: 'active',
          banReason: undefined,
          banTimestamp: undefined
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, []);

  return { status, isLoading, error };
}

// Component to display visitor status (for debugging)
export function VisitorStatusIndicator() {
  const { status, isLoading, error } = useVisitorStatus();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="fixed bottom-4 left-4 bg-gray-800 text-white px-3 py-2 rounded-lg text-xs">
        Loading status...
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed bottom-4 left-4 bg-red-800 text-white px-3 py-2 rounded-lg text-xs">
        Status error: {error}
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 left-4 px-3 py-2 rounded-lg text-xs text-white ${
      status?.status === 'banned' ? 'bg-red-800' : 'bg-green-800'
    }`}>
      Status: {status?.status || 'unknown'}
      {status?.banReason && (
        <div className="text-xs opacity-75">Reason: {status.banReason}</div>
      )}
    </div>
  );
}