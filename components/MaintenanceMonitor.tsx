/**
 * Maintenance Monitor - Real-time Mid-Session Detection
 * ONLY monitors for maintenance that starts WHILE user is actively browsing
 * Does NOT check on initial load (MaintenanceGate handles that)
 * 
 * NEW: Uses CurtainTransition animation instead of toast
 * 
 * Pattern: Mirrors BanMonitor.tsx exactly
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import CurtainTransition from "./CurtainTransition";

const COLLECTION = 'siteSettings';
const DOC_ID = 'maintenance';

export default function MaintenanceMonitor() {
  const pathname = usePathname();
  const router = useRouter();
  const initialMaintenanceStatus = useRef<boolean | null>(null);
  const hasReceivedFirstUpdate = useRef(false);
  const isRedirecting = useRef(false);
  
  // State for curtain animation
  const [showCurtainAnimation, setShowCurtainAnimation] = useState(false);
  const [animationError, setAnimationError] = useState<Error | null>(null);

  // Skip monitoring for these paths
  const shouldSkipMonitoring = 
    pathname?.startsWith("/admin") || 
    pathname?.startsWith("/banned") ||
    pathname?.startsWith("/maintenance");

  // Handle animation completion
  const handleAnimationComplete = useCallback(() => {
    console.log('[Maintenance Monitor] Curtain animation completed');
    setShowCurtainAnimation(false);
  }, []);

  // Handle animation error with failsafe
  const handleAnimationError = useCallback((error: Error) => {
    console.error('[Maintenance Monitor] Animation error:', error);
    setAnimationError(error);
    
    // Failsafe: redirect directly after error
    setTimeout(() => {
      router.replace('/maintenance');
    }, 1000);
  }, [router]);

  useEffect(() => {
    // Skip monitoring for admin/banned/maintenance pages
    if (shouldSkipMonitoring) return;

    console.log('[Maintenance Monitor] Starting real-time monitoring');

    // Subscribe to maintenance document changes
    const docRef = doc(db, COLLECTION, DOC_ID);
    
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          // Document doesn't exist - maintenance is OFF
          if (!hasReceivedFirstUpdate.current) {
            initialMaintenanceStatus.current = false;
            hasReceivedFirstUpdate.current = true;
          }
          return;
        }

        const data = snapshot.data();
        const isEnabled = data?.enabled === true;

        // IGNORE the very first update (initial state from Firestore)
        if (!hasReceivedFirstUpdate.current) {
          console.log('[Maintenance Monitor] First update (initial state), storing and ignoring:', {
            enabled: isEnabled,
          });
          initialMaintenanceStatus.current = isEnabled;
          hasReceivedFirstUpdate.current = true;
          return;
        }

        // ONLY act if maintenance status CHANGED from OFF to ON
        if (isEnabled && initialMaintenanceStatus.current === false && !isRedirecting.current) {
          console.log('[Maintenance Monitor] 🔧 MID-SESSION MAINTENANCE DETECTED!');
          isRedirecting.current = true;

          // Trigger curtain animation instead of toast
          setShowCurtainAnimation(true);

          // Update status to prevent duplicate triggers
          initialMaintenanceStatus.current = true;
        }
      },
      (error) => {
        console.error('[Maintenance Monitor] Listener error:', error);
        
        // Failsafe: If there's a listener error during animation, force redirect
        if (isRedirecting.current) {
          setTimeout(() => {
            router.replace('/maintenance');
          }, 500);
        }
      }
    );

    return () => {
      console.log('[Maintenance Monitor] Cleaning up listener');
      hasReceivedFirstUpdate.current = false;
      initialMaintenanceStatus.current = null;
      isRedirecting.current = false;
      unsubscribe();
    };
  }, [pathname, router, shouldSkipMonitoring]);

  return (
    <>
      {/* Curtain Transition Animation */}
      <CurtainTransition
        isActive={showCurtainAnimation}
        onComplete={handleAnimationComplete}
        onError={handleAnimationError}
      />
      
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && animationError && (
        <div className="fixed bottom-4 right-4 p-2 bg-red-500/20 text-red-400 text-xs rounded z-50">
          Animation Error: {animationError.message}
        </div>
      )}
    </>
  );
}
