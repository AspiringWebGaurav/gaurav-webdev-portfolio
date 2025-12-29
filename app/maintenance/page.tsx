/**
 * Maintenance Page
 * 
 * Displays maintenance message with countdown timer.
 * Real-time listener: redirects to home when maintenance disabled.
 * Responsive screens for Desktop, Tablet, Mobile.
 * Dynamic message when estimated time is exceeded.
 * 
 * CACHE PREVENTION:
 * - No static generation (dynamic)
 * - Revalidate every 0 seconds
 * - Visibility change detection to re-check status
 * - Hard refresh on maintenance end
 */

'use client';

// Force dynamic rendering - NO caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useState, useEffect, Suspense, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import DesktopScreen from './screens/DesktopScreen';
import TabletScreen from './screens/TabletScreen';
import MobileScreen from './screens/MobileScreen';
import MaintenancePageSkeleton from '@/components/skeletons/sections/MaintenancePageSkeleton';

const COLLECTION = 'siteSettings';
const DOC_ID = 'maintenance';

interface MaintenanceInfo {
  title: string;
  message: string;
  showContactForm: boolean;
  estimatedEndTime: Date | null;
  isOverdue: boolean;
  estimatedDuration: number | null; // in minutes
  enabledAt: Date | null;
  overdueBy: number; // minutes overdue
  autoEndEnabled: boolean; // whether auto-end is enabled
}

function MaintenanceContent() {
  const [maintenanceInfo, setMaintenanceInfo] = useState<MaintenanceInfo>({
    title: 'Under Maintenance',
    message: 'We\'re performing scheduled maintenance. Please check back soon!',
    showContactForm: true,
    estimatedEndTime: null,
    isOverdue: false,
    estimatedDuration: null,
    enabledAt: null,
    overdueBy: 0,
    autoEndEnabled: false,
  });
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownNumber, setCountdownNumber] = useState(3);
  const [lastVisibilityCheck, setLastVisibilityCheck] = useState(Date.now());

  // Handle countdown and redirect - defined early with useCallback for use in effects
  const startCountdownRedirect = useCallback(() => {
    if (isRedirecting) return;
    
    console.log('[Maintenance Page] Starting countdown redirect - clearing cache');
    setIsRedirecting(true);
    setShowCountdown(true);
    setCountdownNumber(5); // Start from 5
    
    // Clear browser cache immediately
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    
    // Countdown: 5, 4, 3, 2, 1, then redirect (1 sec per number = 5 sec total)
    setTimeout(() => setCountdownNumber(4), 1000);
    setTimeout(() => setCountdownNumber(3), 2000);
    setTimeout(() => setCountdownNumber(2), 3000);
    setTimeout(() => setCountdownNumber(1), 4000);
    setTimeout(() => {
      setCountdownNumber(0);
      // Hard reload with cache bypass
      window.location.href = '/?clearCache=' + Date.now();
    }, 5000); // Total 5 seconds
  }, [isRedirecting]);

  // Detect screen size
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('mobile');
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Re-check maintenance status when page becomes visible (user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && !isRedirecting) {
        console.log('[Maintenance Page] Tab became visible - checking current status...');
        
        try {
          // Add timestamp to prevent cache
          const response = await fetch(`/api/maintenance/status?t=${Date.now()}`, { 
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
          });
          const data = await response.json();
          
          if (data.enabled === false) {
            console.log('[Maintenance Page] Maintenance ended while tab was hidden - redirecting');
            // Clear any cached data
            if ('caches' in window) {
              caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
              });
            }
            window.location.replace('/');
            return;
          }
          
          setLastVisibilityCheck(Date.now());
        } catch (error) {
          console.error('[Maintenance Page] Visibility check error:', error);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRedirecting]);

  // Initial check: if maintenance is OFF, redirect immediately
  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Add timestamp to bust cache + no-cache headers
        const response = await fetch(`/api/maintenance/status?t=${Date.now()}`, { 
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        const data = await response.json();
        
        if (data.enabled === false) {
          console.log('[Maintenance Page] Maintenance is OFF - redirecting to home');
          setIsRedirecting(true);
          // Clear browser cache before redirect
          if ('caches' in window) {
            caches.keys().then(names => {
              names.forEach(name => caches.delete(name));
            });
          }
          window.location.replace('/');
          return;
        }
        
        // Calculate estimated end time and check if overdue
        let estimatedEndTime: Date | null = null;
        let isOverdue = false;
        let enabledAt: Date | null = null;
        let overdueBy = 0;
        
        if (data.estimatedDuration && data.enabledAt) {
          enabledAt = new Date(data.enabledAt);
          estimatedEndTime = new Date(enabledAt.getTime() + data.estimatedDuration * 60 * 1000);
          const now = new Date();
          isOverdue = now > estimatedEndTime;
          if (isOverdue) {
            overdueBy = Math.floor((now.getTime() - estimatedEndTime.getTime()) / (60 * 1000));
          }
        }
        
        setMaintenanceInfo({
          title: data.title || 'Under Maintenance',
          message: data.message || 'We\'ll be back soon!',
          showContactForm: data.showContactForm ?? true,
          estimatedEndTime,
          isOverdue,
          estimatedDuration: data.estimatedDuration || null,
          enabledAt,
          overdueBy,
          autoEndEnabled: data.autoEndEnabled ?? false,
        });
        
        setCheckingStatus(false);
      } catch (error) {
        console.error('[Maintenance Page] Error checking status:', error);
        setCheckingStatus(false);
      }
    };
    
    checkStatus();
  }, []);

  // Check for overdue status and poll API ONLY if auto-end is enabled
  useEffect(() => {
    if (!maintenanceInfo.estimatedEndTime) return;
    if (isRedirecting) return;

    const checkOverdueAndMaybePollAPI = async () => {
      const now = new Date();
      if (maintenanceInfo.estimatedEndTime && now > maintenanceInfo.estimatedEndTime) {
        const overdueBy = Math.floor((now.getTime() - maintenanceInfo.estimatedEndTime.getTime()) / (60 * 1000));
        setMaintenanceInfo(prev => ({ ...prev, isOverdue: true, overdueBy }));
        
        // ONLY poll API if auto-end is enabled
        // If auto-end is NOT enabled, admin will manually disable via Firestore (real-time listener handles that)
        if (maintenanceInfo.autoEndEnabled) {
          try {
            // Cache-bust with timestamp
            const response = await fetch(`/api/maintenance/status?t=${Date.now()}`, { 
              cache: 'no-store',
              headers: { 'Cache-Control': 'no-cache' }
            });
            const data = await response.json();
            
            // If maintenance is now disabled (auto-ended), start redirect
            if (data.enabled === false && !isRedirecting) {
              console.log('[Maintenance Page] Auto-end triggered via API - starting redirect');
              startCountdownRedirect();
              return;
            }
          } catch (err) {
            console.error('[Maintenance Page] Error polling API:', err);
          }
        }
        // If auto-end is NOT enabled, we just wait for Firestore real-time listener
        // to detect when admin manually disables maintenance
      }
    };

    // Run immediately
    checkOverdueAndMaybePollAPI();
    
    // Only set up interval polling if auto-end is enabled
    // Otherwise, we rely on Firestore real-time listener for manual disable
    if (maintenanceInfo.autoEndEnabled) {
      const interval = setInterval(checkOverdueAndMaybePollAPI, 5000); // Check every 5 seconds
      return () => clearInterval(interval);
    } else {
      // For manual maintenance, just update overdue status every minute (no API calls)
      const interval = setInterval(checkOverdueAndMaybePollAPI, 60000); // Update overdue every minute
      return () => clearInterval(interval);
    }
  }, [maintenanceInfo.estimatedEndTime, maintenanceInfo.autoEndEnabled, isRedirecting, startCountdownRedirect]);

  // Real-time listener: redirect when maintenance is disabled
  useEffect(() => {
    if (isRedirecting) return;

    const docRef = doc(db, COLLECTION, DOC_ID);
    
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          console.log('[Maintenance Page] Document deleted - starting countdown redirect');
          startCountdownRedirect();
          return;
        }

        const data = snapshot.data();
        
        if (data?.enabled === false && !isRedirecting) {
          console.log('[Maintenance Page] Maintenance disabled by admin - starting countdown redirect');
          startCountdownRedirect();
          return;
        }
        
        // Update info if still in maintenance
        if (data?.enabled) {
          let estimatedEndTime: Date | null = null;
          let isOverdue = false;
          let enabledAt: Date | null = null;
          let overdueBy = 0;
          
          if (data.estimatedDuration && data.enabledAt) {
            enabledAt = data.enabledAt.toDate ? data.enabledAt.toDate() : new Date(data.enabledAt);
            estimatedEndTime = new Date(enabledAt.getTime() + data.estimatedDuration * 60 * 1000);
            const now = new Date();
            isOverdue = now > estimatedEndTime;
            if (isOverdue) {
              overdueBy = Math.floor((now.getTime() - estimatedEndTime.getTime()) / (60 * 1000));
            }
          }
          
          setMaintenanceInfo({
            title: data.title || 'Under Maintenance',
            message: data.message || 'We\'ll be back soon!',
            showContactForm: data.showContactForm ?? true,
            estimatedEndTime,
            isOverdue,
            estimatedDuration: data.estimatedDuration || null,
            enabledAt,
            overdueBy,
            autoEndEnabled: data.autoEndEnabled ?? false,
          });
        }
      },
      (error) => {
        console.error('[Maintenance Page] Listener error:', error);
      }
    );

    return () => unsubscribe();
  }, [isRedirecting, startCountdownRedirect]);

  // Loading state - show skeleton
  if (checkingStatus) {
    return <MaintenancePageSkeleton />;
  }

  // Countdown Overlay - show when maintenance ends
  if (showCountdown) {
    return (
      <div className="fixed inset-0 bg-black-100 flex items-center justify-center z-50 overflow-hidden">
        {/* Animated grid background */}
        <div className="absolute inset-0 bg-grid-white/[0.02]">
          <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: Math.random() * 4 + 2,
                height: Math.random() * 4 + 2,
                background: i % 3 === 0 ? '#22c55e' : i % 3 === 1 ? '#8b5cf6' : '#3b82f6',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -200, 0],
                x: [0, Math.random() * 100 - 50, 0],
                opacity: [0, 0.6, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                delay: i * 0.1,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        {/* Radial gradient glows */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] md:w-[600px] md:h-[600px] bg-green-500/10 rounded-full blur-[60px] sm:blur-[80px] md:blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] md:w-[400px] md:h-[400px] bg-purple/10 rounded-full blur-[50px] sm:blur-[65px] md:blur-[80px]" />
        </div>

        {/* Main content */}
        <div className="relative flex flex-col items-center gap-4 sm:gap-5 md:gap-6 px-4">
          
          {/* Success Icon with enhanced animations */}
          <div className="relative">
            {/* Rotating ring */}
            <motion.div
              className="absolute -inset-4 rounded-full border border-green-500/20"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-green-500" />
            </motion.div>
            
            {/* Outer pulse rings */}
            <motion.div
              className="absolute -inset-2 rounded-full border-2 border-green-500/40"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.8, opacity: 0 }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.div
              className="absolute -inset-2 rounded-full border border-emerald-400/30"
              initial={{ scale: 1, opacity: 0.3 }}
              animate={{ scale: 2.2, opacity: 0 }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
            />
            <motion.div
              className="absolute -inset-2 rounded-full border border-green-300/20"
              initial={{ scale: 1, opacity: 0.2 }}
              animate={{ scale: 2.6, opacity: 0 }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.8 }}
            />
            
            {/* Main icon container */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-green-500/20 via-emerald-500/10 to-green-600/20 flex items-center justify-center border-2 border-green-500/60 shadow-2xl shadow-green-500/30"
            >
              {/* Inner gradient glow */}
              <div className="absolute inset-3 rounded-full bg-gradient-to-br from-green-400/20 to-transparent blur-md" />
              
              {/* Shine effect */}
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
              
              {/* Checkmark */}
              <motion.svg
                className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-green-400 relative z-10 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </motion.svg>
            </motion.div>
          </div>

          {/* Status badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="px-4 py-1.5 rounded-full bg-green-500/20 border border-green-500/40"
          >
            <div className="flex items-center gap-2">
              <motion.span
                className="w-2 h-2 rounded-full bg-green-500"
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-green-400 text-xs font-semibold uppercase tracking-wider">System Online</span>
            </div>
          </motion.div>

          {/* Message with gradient text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent mb-2 px-4">
              Maintenance Complete!
            </h2>
            <motion.p
              className="text-white/50 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              All systems operational • Portfolio is ready
            </motion.p>
          </motion.div>

          {/* Countdown section */}
          <motion.div
            className="mt-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={countdownNumber}
                initial={{ scale: 0.5, opacity: 0, y: 30, rotateX: -90 }}
                animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: -30, rotateX: 90 }}
                transition={{ duration: 0.4, ease: "backOut" }}
                className="text-center"
              >
                {countdownNumber > 0 ? (
                  <div className="flex flex-col items-center">
                    {/* Countdown container */}
                    <div className="relative">
                      {/* Background glow */}
                      <div className="absolute inset-0 bg-purple/20 blur-2xl rounded-full scale-150" />
                      
                      {/* Number container */}
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-purple/30 flex items-center justify-center shadow-xl shadow-purple/20 backdrop-blur-sm">
                        <motion.span
                          className="text-4xl sm:text-5xl md:text-6xl font-bold text-purple drop-shadow-[0_0_30px_rgba(139,92,246,0.6)]"
                          animate={{ 
                            scale: [1, 1.1, 1],
                            textShadow: [
                              "0 0 20px rgba(139,92,246,0.4)",
                              "0 0 40px rgba(139,92,246,0.6)",
                              "0 0 20px rgba(139,92,246,0.4)"
                            ]
                          }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                        >
                          {countdownNumber}
                        </motion.span>
                      </div>
                    </div>
                    
                    {/* Loading text with dots animation */}
                    <motion.div
                      className="mt-3 sm:mt-4 flex items-center gap-1 text-white/40 text-xs sm:text-sm"
                      animate={{ opacity: [0.4, 0.8, 0.4] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <span>Preparing your experience</span>
                      <motion.span
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.5, 1] }}
                      >.</motion.span>
                      <motion.span
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.5, 1], delay: 0.2 }}
                      >.</motion.span>
                      <motion.span
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.5, 1], delay: 0.4 }}
                      >.</motion.span>
                    </motion.div>
                  </div>
                ) : (
                  <motion.div 
                    className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple/20 via-purple/30 to-purple/20 rounded-lg sm:rounded-xl border border-purple/40 shadow-lg shadow-purple/20"
                    animate={{ 
                      boxShadow: [
                        "0 0 20px rgba(139,92,246,0.2)",
                        "0 0 40px rgba(139,92,246,0.3)",
                        "0 0 20px rgba(139,92,246,0.2)"
                      ]
                    }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-purple border-t-transparent rounded-full animate-spin" />
                    <span className="text-white font-medium text-sm sm:text-base">Redirecting to portfolio...</span>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Bottom decorative elements */}
          <motion.div
            className="flex items-center gap-2 sm:gap-3 mt-3 sm:mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <motion.div
              className="w-10 sm:w-12 md:w-16 h-0.5 bg-gradient-to-r from-transparent to-green-500/50"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.9, duration: 0.5 }}
            />
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-green-500/60"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
            <motion.div
              className="w-10 sm:w-12 md:w-16 h-0.5 bg-gradient-to-l from-transparent to-green-500/50"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.9, duration: 0.5 }}
            />
          </motion.div>
        </div>
      </div>
    );
  }

  // Render screen based on size
  switch (screenSize) {
    case 'mobile':
      return <MobileScreen maintenanceInfo={maintenanceInfo} />;
    case 'tablet':
      return <TabletScreen maintenanceInfo={maintenanceInfo} />;
    default:
      return <DesktopScreen maintenanceInfo={maintenanceInfo} />;
  }
}

export default function MaintenancePage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-black-100 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <MaintenanceContent />
    </Suspense>
  );
}
