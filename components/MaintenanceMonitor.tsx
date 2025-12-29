/**
 * Maintenance Monitor - Real-time Mid-Session Detection
 * ONLY monitors for maintenance that starts WHILE user is actively browsing
 * Does NOT check on initial load (MaintenanceGate handles that)
 * 
 * NEW: Provides shared context to avoid duplicate Firebase listeners
 * - On production: Shows curtain animation and redirects
 * - On localhost: Updates context but doesn't redirect (banner shows status)
 * 
 * Pattern: Mirrors BanMonitor.tsx exactly
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import CurtainTransition from "./CurtainTransition";
import { MaintenanceStatusProvider, MaintenanceStatusData } from "@/contexts/MaintenanceStatusContext";
import { isProduction } from "@/lib/environmentUtils";

const COLLECTION = 'siteSettings';
const DOC_ID = 'maintenance';

/**
 * MaintenanceMonitor with Context Provider
 * Provides maintenance status to entire app via context
 */
export default function MaintenanceMonitor({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const initialMaintenanceStatus = useRef<boolean | null>(null);
  const hasReceivedFirstUpdate = useRef(false);
  const isRedirecting = useRef(false);
  
  // State for curtain animation (production only)
  const [showCurtainAnimation, setShowCurtainAnimation] = useState(false);
  const [animationError, setAnimationError] = useState<Error | null>(null);
  
  // Shared maintenance status for context
  const [maintenanceStatus, setMaintenanceStatus] = useState<MaintenanceStatusData>({
    enabled: false,
    estimatedEndTime: null,
    isOverdue: false,
    overdueBy: 0,
    estimatedDuration: null,
    enabledAt: null,
    autoEndTriggered: false,
    autoEndDetectedAt: null,
  });
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const autoEndCheckTriggered = useRef(false);
  
  // Check if on production
  const isProductionEnv = isProduction();

  // Skip REDIRECT for these paths (but still listen to context for navbar)
  const shouldSkipRedirect = 
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
    console.log('[Maintenance Monitor] Starting real-time monitoring');

    // Subscribe to maintenance document changes
    const docRef = doc(db, COLLECTION, DOC_ID);
    
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          // Document doesn't exist - maintenance is OFF
          setMaintenanceStatus({
            enabled: false,
            estimatedEndTime: null,
            isOverdue: false,
            overdueBy: 0,
            estimatedDuration: null,
            enabledAt: null,
            autoEndTriggered: false,
            autoEndDetectedAt: null,
          });
          setIsLoadingStatus(false);
          
          if (!hasReceivedFirstUpdate.current) {
            initialMaintenanceStatus.current = false;
            hasReceivedFirstUpdate.current = true;
          }
          return;
        }

        const data = snapshot.data();
        const isEnabled = data?.enabled === true;
        
        // Calculate estimated end time and overdue status
        let estimatedEndTime: Date | null = null;
        let isOverdue = false;
        let overdueBy = 0;
        
        if (data?.estimatedDuration && data?.enabledAt) {
          const enabledAt = data.enabledAt.toDate();
          estimatedEndTime = new Date(enabledAt.getTime() + data.estimatedDuration * 60 * 1000);
          const now = new Date();
          isOverdue = now > estimatedEndTime;
          if (isOverdue) {
            overdueBy = Math.floor((now.getTime() - estimatedEndTime.getTime()) / (60 * 1000));
          }
        }
        
        // AUTO-END DETECTION: Check if auto-end time has passed but maintenance still enabled
        // This handles the case where auto-end happened but API was never called
        if (isEnabled && data?.autoEndEnabled === true && data?.autoEndAt && !autoEndCheckTriggered.current) {
          const autoEndTime = data.autoEndAt.toDate();
          const now = new Date();
          
          if (now >= autoEndTime) {
            console.log('[Maintenance Monitor] 🔍 DETECTED: Auto-end time has passed but maintenance still enabled');
            console.log('[Maintenance Monitor] Auto-end was:', autoEndTime.toISOString());
            console.log('[Maintenance Monitor] Current time:', now.toISOString());
            console.log('[Maintenance Monitor] Triggering cleanup via status API...');
            
            autoEndCheckTriggered.current = true;
            
            // Trigger the status API to perform auto-disable
            fetch('/api/maintenance/status', { cache: 'no-store' })
              .then(async (response) => {
                const result = await response.json();
                console.log('[Maintenance Monitor] ✅ Cleanup API called, maintenance should now be disabled');
                
                // Update context to reflect auto-ended state
                setMaintenanceStatus({
                  enabled: false,
                  estimatedEndTime: null,
                  isOverdue: false,
                  overdueBy: 0,
                  estimatedDuration: data.estimatedDuration || null,
                  enabledAt: data.enabledAt?.toDate() || null,
                  title: data.title,
                  message: data.message,
                  autoEndTriggered: true,
                  autoEndDetectedAt: autoEndTime,
                });
                setIsLoadingStatus(false);
              })
              .catch((error) => {
                console.error('[Maintenance Monitor] ⚠️ Failed to trigger cleanup:', error);
                // Continue with normal flow even if API call fails
                autoEndCheckTriggered.current = false;
              });
            
            // Return early to prevent showing stale "enabled" state
            return;
          }
        }
        
        // Update shared context (for localhost banner)
        setMaintenanceStatus({
          enabled: isEnabled,
          estimatedEndTime,
          isOverdue,
          overdueBy,
          estimatedDuration: data?.estimatedDuration || null,
          enabledAt: data?.enabledAt?.toDate() || null,
          title: data?.title,
          message: data?.message,
          autoEndTriggered: false,
          autoEndDetectedAt: null,
        });
        setIsLoadingStatus(false);
        
        // Reset auto-end check if maintenance is now properly disabled
        if (!isEnabled && autoEndCheckTriggered.current) {
          autoEndCheckTriggered.current = false;
        }

        // IGNORE the very first update (initial state from Firestore)
        if (!hasReceivedFirstUpdate.current) {
          console.log('[Maintenance Monitor] First update (initial state), storing and ignoring:', {
            enabled: isEnabled,
          });
          initialMaintenanceStatus.current = isEnabled;
          hasReceivedFirstUpdate.current = true;
          return;
        }

        // ONLY redirect on production when maintenance changes from OFF to ON
        if (isEnabled && initialMaintenanceStatus.current === false && !isRedirecting.current) {
          console.log('[Maintenance Monitor] 🔧 MID-SESSION MAINTENANCE DETECTED!');
          
          // Only redirect on production AND not on admin/maintenance/banned pages
          if (isProductionEnv && !shouldSkipRedirect) {
            console.log('[Maintenance Monitor] Production environment - triggering redirect');
            isRedirecting.current = true;
            setShowCurtainAnimation(true);
          } else {
            console.log('[Maintenance Monitor] Localhost or admin page - banner will show status, no redirect');
          }

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
      autoEndCheckTriggered.current = false;
      unsubscribe();
    };
  }, [pathname, router, shouldSkipRedirect, isProductionEnv]);

  return (
    <MaintenanceStatusProvider value={maintenanceStatus} isLoading={isLoadingStatus}>
      {/* Curtain Transition Animation (production only) */}
      {isProductionEnv && (
        <CurtainTransition
          isActive={showCurtainAnimation}
          onComplete={handleAnimationComplete}
          onError={handleAnimationError}
        />
      )}
      
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && animationError && (
        <div className="fixed bottom-4 right-4 p-2 bg-red-500/20 text-red-400 text-xs rounded z-50">
          Animation Error: {animationError.message}
        </div>
      )}
      
      {/* Render children - rest of the app */}
      {children}
    </MaintenanceStatusProvider>
  );
}
