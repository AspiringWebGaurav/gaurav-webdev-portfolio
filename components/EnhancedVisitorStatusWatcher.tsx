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
      (snapshot) => {
        handleStatusUpdate(snapshot);
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

  const handleStatusUpdate = (snapshot: any) => {
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
      handleStatusChange(newStatus);
      lastStatus.current = newStatus.status;
    }
  };

  const handleStatusChange = (status: VisitorStatus) => {
    if (status.status === 'banned') {
      handleBanAction(status);
    } else if (status.status === 'active') {
      handleUnbanAction(status);
    }
  };

  const handleBanAction = (status: VisitorStatus) => {
    console.log("🚫 User has been banned:", status.banReason);
    
    showBanToast(() => {
      showProcessingToast("🔁 Redirecting to ban page...", 1500);
      
      setTimeout(() => {
        // Use Next.js router for dynamic redirection (works in both dev and production)
        router.push(`/${uuid.current}/ban?reason=${encodeURIComponent(status.banReason || 'Policy violation')}`);
      }, 1500);
    });
  };

  const handleUnbanAction = (status: VisitorStatus) => {
    console.log("🎉 User has been unbanned");
    
    showUnbanToast(() => {
      showProcessingToast("🔄 Redirecting to homepage...", 1500);
      
      setTimeout(() => {
        // Set session storage to indicate user was just unbanned (don't clear it)
        sessionStorage.setItem('banCheckDone', 'true');
        sessionStorage.setItem('justUnbanned', 'true');
        
        // Use Next.js router for dynamic redirection (works in both dev and production)
        router.push(`/${uuid.current}`);
      }, 1500);
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