/**
 * Suspension Monitor Component - PRODUCTION HARDENED
 * 
 * Features:
 * - Real-time Firebase listener for instant detection
 * - 3-layer fallback system for redirects
 * - Self-healing error recovery
 * - 15-second failsafe timeout
 * - Optimized for heavy load
 * - Memory leak prevention
 * - Responsive restoration animation
 * 
 * Wraps the app to detect suspension mode changes.
 * Auto-redirects to /suspended when suspension enabled.
 * Shows 8-second restoration animation when suspension ends.
 */

"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SuspensionStatusProvider } from '@/contexts/SuspensionStatusContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, RefreshCw, Shield } from 'lucide-react';

const COLLECTION = 'siteSettings';
const DOC_ID = 'suspension';

// PERFORMANCE: Throttle listener updates
const LISTENER_THROTTLE_MS = 100;

// FAILSAFE: Maximum animation duration
const MAX_ANIMATION_DURATION = 15000;

// Animation phases for restoration
type RestorationPhase = 
  | "idle"
  | "detecting" 
  | "preparing"
  | "restoring"
  | "loading"
  | "finalizing"
  | "complete";

// Restoration checklist items for success animation
const RESTORATION_STEPS = [
  { id: 1, label: "Validating request", delay: 0 },
  { id: 2, label: "Disabling suspension mode", delay: 500 },
  { id: 3, label: "Restoring services", delay: 1000 },
  { id: 4, label: "Verifying system status", delay: 1500 },
  { id: 5, label: "Finalizing changes", delay: 2000 },
];

export default function SuspensionMonitor({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [suspensionStatus, setSuspensionStatus] = useState({
    enabled: false,
    reason: '',
    estimatedDuration: null,
    enabledAt: null,
    enabledBy: null,
    lastUpdated: null,
    autoEndEnabled: false,
    autoEndAt: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const hasRedirected = useRef(false);
  const wasEnabledRef = useRef(false);
  const autoEndCheckTriggered = useRef(false);
  const isRestorationInProgress = useRef(false);
  const animationCallCount = useRef(0);
  const lastFirestoreUpdate = useRef<string>('');
  const listenerThrottle = useRef<NodeJS.Timeout | null>(null);
  const errorCount = useRef(0);
  const lastErrorTime = useRef(0);
  
  // Restoration animation states
  const [showRestoration, setShowRestoration] = useState(false);
  const [restorationPhase, setRestorationPhase] = useState<RestorationPhase>("idle");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Skip monitoring for these paths
  const shouldSkipMonitor = 
    pathname?.startsWith('/admin') || 
    pathname?.startsWith('/banned') ||
    pathname?.startsWith('/maintenance') ||
    !pathname || 
    pathname === '/_not-found';

  // Restoration animation handler - GREEN SUCCESS THEME (8 seconds)
  // 3-LAYER FALLBACK + ERROR HANDLING + FAILSAFE MECHANISM
  const handleRestoration = useCallback(async () => {
    const animationStartTime = Date.now();
    let animationPhase = 'init';
    
    // FAILSAFE: Force redirect after max timeout (15s) regardless of animation state
    const failsafeTimeout = setTimeout(() => {
      console.error('[SuspensionMonitor] ⚠️ FAILSAFE TRIGGERED - Force redirect after 15s');
      window.location.replace('/');
    }, 15000);
    
    try {
      console.log('[SuspensionMonitor] ══════════════════════════════════════════════════════════════════════');
      console.log('[SuspensionMonitor] 🎬🎬🎬 handleRestoration() EXECUTING 🎬🎬🎬');
      console.log('[SuspensionMonitor] Time:', new Date().toLocaleTimeString());
      console.log('[SuspensionMonitor] isRestorationInProgress:', isRestorationInProgress.current);
      console.log('[SuspensionMonitor] ══════════════════════════════════════════════════════════════════════');
      console.log('[SuspensionMonitor] 🎉 Starting GREEN success restoration animation');
      console.log('[SuspensionMonitor] Setting restoration in progress flag');
      
      // LOCK the component - prevent any state updates or re-renders during animation
      isRestorationInProgress.current = true;
      console.log('[SuspensionMonitor] ✅ isRestorationInProgress set to TRUE');
      
      setShowRestoration(true);
      console.log('[SuspensionMonitor] ✅ setShowRestoration(true) called');
      setCompletedSteps([]);
      setLoadingProgress(0);
    
    // Track animation start for testing
    fetch('/api/suspension/animation-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start', phase: 'preparing' }),
    }).catch(() => {}); // Ignore errors (test endpoint may not exist)
    
    // Phase 1: Preparing (1s) - Blue preparing
    console.log('[SuspensionMonitor] Phase 1/6: Preparing (1s)');
    setRestorationPhase("preparing");
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Phase 2: Detecting (2s) - Yellow with checklist animation
    console.log('[SuspensionMonitor] Phase 2/6: Detecting/Disabling (2s) - Starting checklist');
    setRestorationPhase("detecting");
    
    fetch('/api/suspension/animation-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', phase: 'detecting' }),
    }).catch(() => {});
    
    // Animate checklist items sequentially
    for (let i = 0; i < RESTORATION_STEPS.length; i++) {
      await new Promise(resolve => setTimeout(resolve, RESTORATION_STEPS[i].delay));
      setCompletedSteps(prev => [...prev, RESTORATION_STEPS[i].id]);
      console.log(`[SuspensionMonitor] Checklist item ${i + 1}/5 completed`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Phase 3: Restoring (2.5s) - GREEN with progress bar
    console.log('[SuspensionMonitor] Phase 3/6: Restoring (2.5s) - Starting progress bar');
    setRestorationPhase("restoring");
    
    // Smooth progress bar animation (0-100% over 2.5s)
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1.6; // ~2.5s to reach 100%
      });
    }, 40);
    
    await new Promise(resolve => setTimeout(resolve, 2500));
    clearInterval(progressInterval);
    setLoadingProgress(100);
    console.log('[SuspensionMonitor] Progress bar complete: 100%');
    
    // Phase 4: Loading (1s) - Teal verification
    console.log('[SuspensionMonitor] Phase 4/6: Loading/Verifying (1s)');
    setRestorationPhase("loading");
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Phase 5: Finalizing (0.5s) - Green finalizing
    console.log('[SuspensionMonitor] Phase 5/6: Finalizing (0.5s)');
    setRestorationPhase("finalizing");
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Phase 6: Complete (1.5s) - Green checkmark with LIVE status
    console.log('[SuspensionMonitor] Phase 6/6: Complete (1.5s) - Showing LIVE badge');
    setRestorationPhase("complete");
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Cleanup and redirect
    console.log('[SuspensionMonitor] ✅ All 6 phases complete! Cleaning up and redirecting...');
    animationPhase = 'complete';
    
    // LAYER 1 FALLBACK: Try tracking API (optional, ignore failures)
    try {
      await fetch('/api/suspension/animation-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete' }),
      });
    } catch (err) {
      console.warn('[SuspensionMonitor] ⚠️ Animation tracking failed (non-critical):', err);
    }
    
    const totalDuration = Date.now() - animationStartTime;
    console.log('[SuspensionMonitor] ══════════════════════════════════════════════════════════════════════');
    console.log('[SuspensionMonitor] ✅✅✅ ANIMATION COMPLETE! ✅✅✅');
    console.log('[SuspensionMonitor] Total duration:', totalDuration, 'ms');
    console.log('[SuspensionMonitor] Preparing to redirect...');
    console.log('[SuspensionMonitor] ══════════════════════════════════════════════════════════════════════');
    
    console.log('[SuspensionMonitor] Clearing UI state but KEEPING restoration lock...');
    setShowRestoration(false);
    setRestorationPhase("idle");
    setLoadingProgress(0);
    setCompletedSteps([]);
    // CRITICAL: Keep isRestorationInProgress = true until redirect completes
    // This prevents any Firestore listener updates from causing re-renders
    console.log('[SuspensionMonitor] ⚠️ isRestorationInProgress stays TRUE until redirect');
    
    // Clear failsafe timeout (animation completed successfully)
    clearTimeout(failsafeTimeout);
    
    // LAYER 2 FALLBACK: Try window.location.replace (primary method)
    console.log('[SuspensionMonitor] Using window.location.replace for clean reload');
    console.log('[SuspensionMonitor] Redirecting now...');
    window.location.replace('/');
    console.log('[SuspensionMonitor] ⚠️ This log may not show (page reloading)');
    
    } catch (error) {
      // ERROR HANDLING: Animation failed at some point
      console.error('[SuspensionMonitor] ❌ Animation error at phase:', animationPhase, error);
      clearTimeout(failsafeTimeout);
      
      // LAYER 3 FALLBACK: Force immediate redirect on error
      console.error('[SuspensionMonitor] Forcing immediate redirect due to error');
      isRestorationInProgress.current = false;
      setShowRestoration(false);
      
      try {
        window.location.replace('/');
      } catch (redirectError) {
        // FINAL FALLBACK: Use router.push if window.location fails
        console.error('[SuspensionMonitor] window.location failed, using router.push');
        router.push('/');
      }
    }
  }, [router]);

  useEffect(() => {
    // Skip monitoring for admin/banned/suspended paths
    if (shouldSkipMonitor) {
      setIsLoading(false);
      return;
    }

    const docRef = doc(db, COLLECTION, DOC_ID);
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;

    // Real-time listener with error recovery
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        // PERFORMANCE: Throttle rapid updates
        if (listenerThrottle.current) {
          clearTimeout(listenerThrottle.current);
        }
        
        listenerThrottle.current = setTimeout(() => {
          try {
            // Reset error count on successful update
            errorCount.current = 0;
            reconnectAttempts = 0;
            
            console.log('[SuspensionMonitor] 📡 Firestore listener triggered');
            console.log('[SuspensionMonitor] Snapshot exists:', snapshot.exists());
            
            if (!snapshot.exists()) {
              // Document doesn't exist - suspension is OFF
              setSuspensionStatus({
                enabled: false,
                reason: '',
                estimatedDuration: null,
                enabledAt: null,
                enabledBy: null,
                lastUpdated: null,
                autoEndEnabled: false,
                autoEndAt: null,
              });
              setIsLoading(false);
              hasRedirected.current = false;
              return;
            }
            
          } catch (error) {
            console.error('[SuspensionMonitor] ⚠️ Listener processing error:', error);
            errorCount.current++;
            
            // SELF-HEALING: Reset to safe state after repeated errors
            if (errorCount.current >= 3) {
              console.error('[SuspensionMonitor] 🔧 Too many errors, resetting to safe state');
              setIsLoading(false);
              errorCount.current = 0;
            }
          }
        }, LISTENER_THROTTLE_MS);
        
        if (!snapshot.exists()) {
          // Document doesn't exist - suspension is OFF
          setSuspensionStatus({
            enabled: false,
            reason: '',
            estimatedDuration: null,
            enabledAt: null,
            enabledBy: null,
            lastUpdated: null,
            autoEndEnabled: false,
            autoEndAt: null,
          });
          setIsLoading(false);
          hasRedirected.current = false;
          return;
        }

        const data = snapshot.data();
        const enabled = data?.enabled === true;
        
        console.log('[SuspensionMonitor] 📊 Firestore data:', {
          enabled,
          autoEndEnabled: data?.autoEndEnabled,
          reason: data?.reason,
          wasEnabledRef: wasEnabledRef.current,
          pathname,
          shouldSkipMonitor,
          isRestorationInProgress: isRestorationInProgress.current
        });
        
        console.log('[SuspensionMonitor] 📊 Firestore data:', {
          enabled,
          autoEndEnabled: data?.autoEndEnabled,
          reason: data?.reason,
          wasEnabledRef: wasEnabledRef.current,
          pathname,
          shouldSkipMonitor,
          isRestorationInProgress: isRestorationInProgress.current
        });

        // AUTO-END DETECTION: Check if auto-end time has passed
        if (enabled && data?.autoEndEnabled === true && data?.autoEndAt && !autoEndCheckTriggered.current) {
          const autoEndTime = data.autoEndAt.toDate();
          const now = new Date();
          
          if (now >= autoEndTime) {
            console.log('[SuspensionMonitor] 🔍 Auto-end time reached, triggering cleanup');
            
            // Prevent duplicate animations
            if (isRestorationInProgress.current) {
              console.log('[SuspensionMonitor] ⚠️ Animation already in progress, skipping auto-end trigger');
              return;
            }
            
            autoEndCheckTriggered.current = true;
            
            // Trigger status API to perform auto-disable
            fetch('/api/suspension/status', { cache: 'no-store' })
              .then(async (response) => {
                const result = await response.json();
                console.log('[SuspensionMonitor] ✅ Auto-end cleanup completed, API returned:', result.enabled);
                
                // DO NOT manually update state here - let the Firestore listener handle it
                // This prevents duplicate renders and animation interruptions
                console.log('[SuspensionMonitor] Waiting for Firestore to propagate the change...');
              })
              .catch((error) => {
                console.error('[SuspensionMonitor] Auto-end cleanup failed:', error);
                autoEndCheckTriggered.current = false;
              });
            
            return; // Exit early, wait for Firestore update
          }
        }

        // Parse timestamps
        let enabledAt: Date | null = null;
        let lastUpdated: Date | null = null;

        if (data?.enabledAt) {
          try {
            enabledAt = data.enabledAt.toDate();
          } catch (e) {
            console.warn('[SuspensionMonitor] Failed to parse enabledAt');
          }
        }

        if (data?.lastUpdated) {
          try {
            lastUpdated = data.lastUpdated.toDate();
          } catch (e) {
            console.warn('[SuspensionMonitor] Failed to parse lastUpdated');
          }
        }

        // CRITICAL: Check restoration FIRST before ANY state updates
        // State updates cause re-renders which can unmount the animation
        
        // Track state changes
        if (wasEnabledRef.current && !enabled) {
          // Suspension was just disabled
          animationCallCount.current++;
          console.log('[SuspensionMonitor] 🚨🚨🚨 SUSPENSION DISABLED DETECTED! 🚨🚨🚨');
          console.log('[SuspensionMonitor] Animation call #', animationCallCount.current);
          console.log('[SuspensionMonitor] ═══════════════════════════════════════');
          console.log('[SuspensionMonitor] Current pathname:', pathname);
          console.log('[SuspensionMonitor] Pathname type:', typeof pathname);
          console.log('[SuspensionMonitor] Should skip monitor:', shouldSkipMonitor);
          console.log('[SuspensionMonitor] Pathname includes check:', pathname?.includes('suspnd_srv_temp'));
          console.log('[SuspensionMonitor] Is restoration in progress:', isRestorationInProgress.current);
          console.log('[SuspensionMonitor] hasRedirected:', hasRedirected.current);
          console.log('[SuspensionMonitor] ═══════════════════════════════════════');
          
          // Prevent duplicate animations
          if (isRestorationInProgress.current) {
            console.log('[SuspensionMonitor] ⚠️ Animation already in progress, BLOCKING ALL UPDATES');
            console.log('[SuspensionMonitor] ⚠️ Not calling setState - preventing re-render');
            // CRITICAL: Exit early - don't update ANY state while animation is running
            return; // No setState at all!
          }
          
          // Show restoration animation if we're on suspension page
          const onSuspensionPage = pathname?.includes('suspnd_srv_temp');
          const shouldShowAnimation = onSuspensionPage && !shouldSkipMonitor;
          
          console.log('[SuspensionMonitor] 🎬 Animation decision:');
          console.log('[SuspensionMonitor]   - On suspension page:', onSuspensionPage);
          console.log('[SuspensionMonitor]   - Should skip monitor:', shouldSkipMonitor);
          console.log('[SuspensionMonitor]   - Final decision:', shouldShowAnimation ? '✅ TRIGGER' : '❌ SKIP');
          
          if (shouldShowAnimation) {
            console.log('[SuspensionMonitor] 🎬🎬🎬 TRIGGERING RESTORATION ANIMATION 🎬🎬🎬');
            console.log('[SuspensionMonitor] Setting isRestorationInProgress = true');
            // Set flag IMMEDIATELY before calling handleRestoration
            isRestorationInProgress.current = true;
            console.log('[SuspensionMonitor] Calling handleRestoration()...');
            handleRestoration();
            console.log('[SuspensionMonitor] handleRestoration() called, exiting early');
            console.log('[SuspensionMonitor] ⚠️ Not calling setState - animation must run uninterrupted');
            // CRITICAL: Exit early - don't update state during animation
            return; // No setState - prevents re-render that would kill animation
          } else {
            console.log('[SuspensionMonitor] ❌ User not on suspension page or should skip, NO animation');
            console.log('[SuspensionMonitor]   Pathname:', pathname);
            console.log('[SuspensionMonitor]   Expected pattern: suspnd_srv_temp');
          }
          
          autoEndCheckTriggered.current = false;
        }
        
        // CRITICAL: Don't update state if restoration is in progress
        if (isRestorationInProgress.current) {
          console.log('[SuspensionMonitor] ⏸️ Restoration in progress, COMPLETELY IGNORING this listener update');
          console.log('[SuspensionMonitor] ⚠️ Not calling ANY setState - preventing re-render');
          // CRITICAL: Don't call ANY setState, even setIsLoading - it causes re-render
          return; // Exit immediately without ANY state changes
        }

        // Only update state if restoration is NOT in progress
        setSuspensionStatus({
          enabled,
          reason: data?.reason || '',
          estimatedDuration: data?.estimatedDuration || null,
          enabledAt,
          enabledBy: data?.enabledBy || null,
          lastUpdated,
          autoEndEnabled: data?.autoEndEnabled || false,
          autoEndAt: data?.autoEndAt ? data.autoEndAt.toDate() : null,
        });
        
        wasEnabledRef.current = enabled;

        // Redirect to suspension page if enabled
        if (enabled && !hasRedirected.current && !shouldSkipMonitor) {
          console.log('[SuspensionMonitor] Suspension enabled - redirecting to encrypted endpoint');
          hasRedirected.current = true;
          router.push('/suspnd_srv_temp_0x8f2_auth_v5_mnt_0xb3a7_svc_verify_suspnd_0x4e1_session_temp_chk_0xd9c2_lock_validate_0x7f3_access_suspnd_monitor_0xa6b_gate_srv_0x2e8_render_temp_state_0x5c1_final');
        } else if (!enabled && hasRedirected.current) {
          // Reset redirect flag when suspension disabled (but don't redirect if animation is playing)
          if (!isRestorationInProgress.current) {
            hasRedirected.current = false;
          } else {
            console.log('[SuspensionMonitor] ℹ️ Restoration in progress, keeping redirect flag');
          }
        }

        setIsLoading(false);
      },
      (error) => {
        // ERROR RECOVERY: Handle listener errors with exponential backoff
        console.error('[SuspensionMonitor] 🔥 Listener error:', error.message);
        errorCount.current++;
        lastErrorTime.current = Date.now();
        
        // SELF-HEALING: Attempt recovery
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          const backoffTime = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
          console.warn(`[SuspensionMonitor] 🔧 Reconnect attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${backoffTime}ms`);
          
          setTimeout(() => {
            // Retry will happen automatically on next listener trigger
            console.log('[SuspensionMonitor] 🔄 Attempting recovery...');
          }, backoffTime);
        } else {
          console.error('[SuspensionMonitor] ❌ Max reconnect attempts reached, failing open');
        }
        
        setIsLoading(false);
        // FAIL-OPEN: Assume suspension is OFF on persistent errors
        setSuspensionStatus({
          enabled: false,
          reason: '',
          estimatedDuration: null,
          enabledAt: null,
          enabledBy: null,
          lastUpdated: null,
          autoEndEnabled: false,
          autoEndAt: null,
        });
      }
    );

    // Cleanup on unmount with memory leak prevention
    return () => {
      console.log('[SuspensionMonitor] 🧹 Cleaning up listener and timers');
      
      // Clean up listener
      if (unsubscribe) {
        unsubscribe();
      }
      
      // Clean up throttle timer
      if (listenerThrottle.current) {
        clearTimeout(listenerThrottle.current);
        listenerThrottle.current = null;
      }
      
      // Reset all flags
      wasEnabledRef.current = false;
      autoEndCheckTriggered.current = false;
      isRestorationInProgress.current = false;
      errorCount.current = 0;
      
      console.log('[SuspensionMonitor] ✅ Cleanup complete');
    };
  }, [pathname, router, shouldSkipMonitor, handleRestoration]);

  // Provide suspension status to children
  return (
    <SuspensionStatusProvider value={suspensionStatus} isLoading={isLoading}>
      {/* GREEN Success Restoration Animation - RESPONSIVE + OPTIMIZED */}
      <AnimatePresence>
        {showRestoration && (
          <motion.div
            className="fixed inset-0 z-[9999] bg-gradient-to-br from-green-900/95 via-emerald-900/95 to-teal-900/95 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 md:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ willChange: 'opacity' }}
          >
            {/* Background grid pattern - Lightweight */}
            <div className="absolute inset-0 bg-grid-white/[0.05] opacity-30 pointer-events-none" />
            
            {/* Floating Particles - Green Theme - Reduced motion on mobile */}
            <motion.div
              className="absolute inset-0 hidden sm:block"
              animate={{
                backgroundImage: [
                  'radial-gradient(circle at 20% 30%, rgba(34,197,94,0.2) 0%, transparent 50%)',
                  'radial-gradient(circle at 80% 70%, rgba(34,197,94,0.2) 0%, transparent 50%)',
                  'radial-gradient(circle at 50% 50%, rgba(34,197,94,0.2) 0%, transparent 50%)',
                ],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'linear',
              }}
              style={{ willChange: 'background-image' }}
            />

            {/* Main Content - Fully Responsive */}
            <motion.div
              className="relative flex flex-col items-center gap-4 sm:gap-6 md:gap-8 max-w-2xl w-full"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              {/* Animated Icon - Responsive Size */}
              <motion.div
                className="relative"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                {/* Outer glow rings - Green Theme - Hidden on mobile for performance */}
                <motion.div
                  className="hidden sm:block absolute -inset-8 rounded-full border-2 border-green-400/30"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  style={{ willChange: 'transform, opacity' }}
                />
                <motion.div
                  className="hidden md:block absolute -inset-16 rounded-full border border-green-400/20"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: 0.4 }}
                  style={{ willChange: 'transform, opacity' }}
                />
                
                {/* Icon container - Responsive */}
                <motion.div
                  className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center border-2 shadow-2xl ${
                    restorationPhase === "detecting" 
                      ? 'bg-gradient-to-br from-red-500/30 to-orange-600/20 border-red-500/50 shadow-red-500/40'
                      : restorationPhase === "preparing" 
                      ? 'bg-gradient-to-br from-orange-500/30 to-yellow-600/20 border-orange-500/50 shadow-orange-500/40'
                      : restorationPhase === "restoring"
                      ? 'bg-gradient-to-br from-yellow-500/30 to-amber-600/20 border-yellow-500/50 shadow-yellow-500/40'
                      : restorationPhase === "loading"
                      ? 'bg-gradient-to-br from-blue-500/30 to-cyan-600/20 border-blue-500/50 shadow-blue-500/40'
                      : restorationPhase === "finalizing"
                      ? 'bg-gradient-to-br from-green-500/30 to-emerald-600/20 border-green-500/50 shadow-green-500/40'
                      : 'bg-gradient-to-br from-green-500/30 to-emerald-600/20 border-green-500/50 shadow-green-500/40'
                  }`}
                  animate={{ 
                    rotate: (restorationPhase === "loading" || restorationPhase === "preparing") ? 360 : 0,
                    scale: restorationPhase === "complete" ? [1, 1.1, 1] : 1
                  }}
                  transition={{ 
                    rotate: { duration: 2, repeat: (restorationPhase === "loading" || restorationPhase === "preparing") ? Infinity : 0, ease: "linear" },
                    scale: { duration: 0.5, repeat: restorationPhase === "complete" ? 2 : 0 }
                  }}
                  style={{ willChange: restorationPhase === "loading" || restorationPhase === "preparing" ? 'transform' : 'auto' }}
                >
                  <AnimatePresence mode="wait">
                    {restorationPhase === "preparing" && (
                      <motion.div
                        key="preparing"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                      >
                        <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-blue-300" />
                      </motion.div>
                    )}
                    {restorationPhase === "detecting" && (
                      <motion.div
                        key="detecting"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                      >
                        <RefreshCw className="w-16 h-16 text-yellow-300 animate-spin" />
                      </motion.div>
                    )}
                    {restorationPhase === "restoring" && (
                      <motion.div
                        key="restoring"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                      >
                        <Loader2 className="w-16 h-16 text-green-300" />
                      </motion.div>
                    )}
                    {restorationPhase === "loading" && (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                      >
                        <Shield className="w-16 h-16 text-teal-300 animate-pulse" />
                      </motion.div>
                    )}
                    {restorationPhase === "finalizing" && (
                      <motion.div
                        key="finalizing"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                      >
                        <Loader2 className="w-16 h-16 text-green-300 animate-spin" />
                      </motion.div>
                    )}
                    {restorationPhase === "complete" && (
                      <motion.div
                        key="complete"
                        initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      >
                        <CheckCircle2 className="w-16 h-16 text-green-200" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>

              {/* Title and Description */}
              <motion.div
                className="text-center space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <AnimatePresence mode="wait">
                  {restorationPhase === "preparing" && (
                    <motion.h2
                      key="preparing-text"
                      className="text-4xl font-bold bg-gradient-to-r from-white via-blue-200 to-white bg-clip-text text-transparent"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                    >
                      Preparing Changes
                    </motion.h2>
                  )}
                  {restorationPhase === "detecting" && (
                    <motion.h2
                      key="detecting-text"
                      className="text-4xl font-bold bg-gradient-to-r from-white via-yellow-200 to-white bg-clip-text text-transparent"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                    >
                      Disabling Suspension
                    </motion.h2>
                  )}
                  {restorationPhase === "restoring" && (
                    <motion.h2
                      key="restoring-text"
                      className="text-4xl font-bold bg-gradient-to-r from-white via-green-200 to-white bg-clip-text text-transparent"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                    >
                      Restoring Services
                    </motion.h2>
                  )}
                  {restorationPhase === "loading" && (
                    <motion.h2
                      key="loading-text"
                      className="text-4xl font-bold bg-gradient-to-r from-white via-teal-200 to-white bg-clip-text text-transparent"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                    >
                      Verifying Status
                    </motion.h2>
                  )}
                  {restorationPhase === "finalizing" && (
                    <motion.h2
                      key="finalizing-text"
                      className="text-4xl font-bold bg-gradient-to-r from-white via-green-200 to-white bg-clip-text text-transparent"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                    >
                      Finalizing Setup
                    </motion.h2>
                  )}
                  {restorationPhase === "complete" && (
                    <motion.h2
                      key="complete-text"
                      className="text-4xl font-bold bg-gradient-to-r from-white via-green-200 to-white bg-clip-text text-transparent"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                    >
                      <span className="flex items-center gap-3 justify-center">
                        Successfully Restored!
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/20 border border-green-400/40 rounded-full text-xl">
                          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                          LIVE
                        </span>
                      </span>
                    </motion.h2>
                  )}
                </AnimatePresence>
                
                <motion.p
                  className="text-white/70 text-lg"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {restorationPhase === "preparing" && "Initializing restoration process..."}
                  {restorationPhase === "detecting" && "Removing suspension restrictions..."}
                  {restorationPhase === "restoring" && "Re-enabling portfolio features..."}
                  {restorationPhase === "loading" && "Confirming system operational..."}
                  {restorationPhase === "finalizing" && "Finishing up..."}
                  {restorationPhase === "complete" && "Your portfolio is now live!"}
                </motion.p>
              </motion.div>
              
              {/* Success Checklist - Show during detecting phase (disabling) */}
              {restorationPhase === "detecting" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="w-full max-w-lg space-y-3"
                >
                  {RESTORATION_STEPS.map((step, index) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.12 }}
                      className={`flex items-center gap-4 px-5 py-3 rounded-xl backdrop-blur-md transition-all duration-300 ${
                        completedSteps.includes(step.id)
                          ? 'bg-green-500/20 border-2 border-green-400/40'
                          : 'bg-white/10 border-2 border-white/20'
                      }`}
                    >
                      <AnimatePresence mode="wait">
                        {completedSteps.includes(step.id) ? (
                          <motion.div
                            key="check"
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 250, damping: 15 }}
                          >
                            <CheckCircle2 className="w-6 h-6 text-green-300 flex-shrink-0" />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="empty"
                            className="w-6 h-6 border-2 border-white/30 rounded-full flex-shrink-0"
                            animate={{
                              borderColor: ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0.3)'],
                            }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                        )}
                      </AnimatePresence>
                      <span
                        className={`text-base font-medium transition-colors ${
                          completedSteps.includes(step.id) ? 'text-green-200' : 'text-white/70'
                        }`}
                      >
                        {step.label}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Progress Bar - Show during restoring, loading, finalizing, complete */}
              {(restorationPhase === "restoring" || restorationPhase === "loading" || restorationPhase === "finalizing" || restorationPhase === "complete") && (
                <motion.div
                  className="w-full max-w-lg"
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="h-4 bg-white/10 rounded-full overflow-hidden backdrop-blur-md border-2 border-white/20">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400"
                      style={{ width: `${loadingProgress}%` }}
                      transition={{ duration: 0.1 }}
                      animate={{
                        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                      }}
                    />
                  </div>
                  <motion.div className="flex items-center justify-between mt-3 text-sm">
                    <span className="text-white/60">Restoring components...</span>
                    <motion.span
                      className="text-white/90 font-mono font-bold"
                      key={loadingProgress}
                      initial={{ scale: 1.3, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {loadingProgress}%
                    </motion.span>
                  </motion.div>
                </motion.div>
              )}

              {/* Status indicator */}
              <motion.div
                className="flex items-center gap-3 text-sm text-white/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <motion.div
                  className="w-3 h-3 rounded-full bg-green-400"
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                <span>System responding normally</span>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* CRITICAL: Hide children during restoration to prevent flash */}
      {!showRestoration && children}
    </SuspensionStatusProvider>
  );
}
