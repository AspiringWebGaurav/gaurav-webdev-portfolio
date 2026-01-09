'use client';

/**
 * Beautiful Force Update Notification
 * Displays when admin triggers "Update Old Connections"
 * Shows batch info, countdown, and smooth animations
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Rocket, Zap } from 'lucide-react';
import { SafeCacheManager } from '@/lib/safeCacheManager';

interface ForceUpdateNotificationProps {
  isVisible: boolean;
  batchNumber: number;
  totalBatches: number;
  delaySeconds: number;
  message?: string;
  updateId?: string; // Unique ID for this update session
}

export default function ForceUpdateNotification({
  isVisible,
  batchNumber,
  totalBatches,
  delaySeconds,
  message = "We're loading the latest improvements for you!",
  updateId
}: ForceUpdateNotificationProps) {
  const [countdown, setCountdown] = useState(10); // Always show for 10 seconds
  const [progress, setProgress] = useState(0);
  const [isReloading, setIsReloading] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Detecting load state
  const [isScrollRestored, setIsScrollRestored] = useState(false);

  // Check if we just reloaded from a force update using URL param (NO sessionStorage!)
  // CRITICAL: This should ONLY run ONCE on initial mount, not on every render!
  const [hasCheckedReload, setHasCheckedReload] = useState(false);
  
  useEffect(() => {
    // Only check once per component lifetime
    if (hasCheckedReload) return;
    setHasCheckedReload(true);
    
    // Clean up cache-busting parameter if present
    if (SafeCacheManager.isFromCacheBustedReload()) {
      console.log('🧹 [ForceUpdateNotification] Detected cache-busted reload - cleaning up URL');
      SafeCacheManager.cleanupCacheBustingParam();
    }

    // Check URL param instead of sessionStorage (prevents loop on 2nd/3rd push!)
    const urlParams = new URLSearchParams(window.location.search);
    const reloadUpdateId = urlParams.get('_updateId');
    
    if (reloadUpdateId) {
      console.log('🔄 [ForceUpdateNotification] Detected update reload (updateId:', reloadUpdateId, ')');
      console.log('📍 [ForceUpdateNotification] Showing loading UI for 6 seconds');
      setIsLoading(true);
      setCountdown(0);
      setProgress(100);
      
      // Clean up URL param immediately
      urlParams.delete('_updateId');
      const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
      window.history.replaceState({}, '', newUrl);
      console.log('✅ [ForceUpdateNotification] Cleaned up URL param');
      
      const reloadStartTime = Date.now();
      const minLoadingDuration = 6000; // Show loading for 6 seconds minimum
      
      // Detect when page is fully loaded
      const detectPageLoad = () => {
        // Check if DOM is ready and content is visible
        if (document.readyState === 'complete') {
          const elapsedTime = Date.now() - reloadStartTime;
          const remainingTime = Math.max(0, minLoadingDuration - elapsedTime);
          
          console.log(`✅ [ForceUpdateNotification] Page loaded after ${elapsedTime}ms, waiting ${remainingTime}ms more`);
          
          // Wait for minimum loading duration to complete
          setTimeout(() => {
            const scrollPos = window.scrollY;
            console.log('📍 [ForceUpdateNotification] Current scroll position:', scrollPos);
            setIsScrollRestored(true);
            
            // Fade out after scroll restoration check
            setTimeout(() => {
              console.log('🎉 [ForceUpdateNotification] 6-second loading complete - fading out');
              setIsLoading(false);
              // The parent will hide the component (no sessionStorage cleanup needed!)
            }, 800);
          }, remainingTime);
        } else {
          // Keep checking until page is ready
          setTimeout(detectPageLoad, 100);
        }
      };
      
      detectPageLoad();
    } else {
      console.log('✅ [ForceUpdateNotification] No reload detected - ready for live updates');
    }
  }, []); // Empty deps - run ONLY on initial mount!

  // Simple keyboard lock - prevent reload during update
  useEffect(() => {
    if (!isVisible && !isLoading) return;

    const blockReload = (e: KeyboardEvent) => {
      // Block F5
      if (e.key === 'F5') {
        e.preventDefault();
        console.log('🚫 [Security] Reload blocked - update in progress');
        return;
      }
      
      // Block Ctrl+R / Cmd+R
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        console.log('🚫 [Security] Reload blocked - update in progress');
        return;
      }
    };

    document.addEventListener('keydown', blockReload, true);
    return () => document.removeEventListener('keydown', blockReload, true);
  }, [isVisible, isLoading]);

  useEffect(() => {
    // When a new update notification arrives (isVisible=true), reset loading state
    if (isVisible && isLoading) {
      console.log('🔄 [ForceUpdateNotification] New update notification - clearing previous loading state');
      setIsLoading(false);
      setIsScrollRestored(false);
    }
    
    if (!isVisible || isLoading) return;

    console.log('🎨 [ForceUpdateNotification] SHOWING notification for 10 seconds');
    console.log('📦 Batch info:', { batchNumber, totalBatches, delaySeconds, message });

    // Save scroll position before reload
    const scrollPos = window.scrollY;
    sessionStorage.setItem('preUpdateScrollPosition', scrollPos.toString());
    console.log('📍 [ForceUpdateNotification] Saved scroll position:', scrollPos);

    // Reset states - CRITICAL: Clear any previous loading state!
    setCountdown(10);
    setProgress(0);
    setIsReloading(false);
    setIsScrollRestored(false); // Reset scroll restoration flag

    // Countdown timer - counts down from 10 to 0
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        const newValue = prev - 1;
        console.log(`⏰ [ForceUpdateNotification] Countdown: ${newValue}`);
        
        if (newValue <= 0) {
          clearInterval(countdownInterval);
          console.log('✅ [ForceUpdateNotification] Countdown complete - reloading immediately');
          
          // Add updateId to URL param (replaces sessionStorage!)
          const currentUrl = new URL(window.location.href);
          if (updateId) {
            currentUrl.searchParams.set('_updateId', updateId);
            console.log('📝 [ForceUpdateNotification] Added updateId to URL:', updateId);
          }
          
          // Instant reload with URL param - no sessionStorage needed!
          console.log('🔄 [ForceUpdateNotification] RELOADING NOW with cache clearing!');
          window.location.href = currentUrl.toString();
          
          return 0;
        }
        
        // Show "reloading" status after 5 seconds
        if (newValue === 5) {
          console.log('💡 [ForceUpdateNotification] Showing reload status');
          setIsReloading(true);
        }
        
        return newValue;
      });
    }, 1000);

    // Progress bar animation - fills over 10 seconds (1% per 100ms)
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newValue = prev + 1;
        if (newValue >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return newValue;
      });
    }, 100);

    return () => {
      clearInterval(countdownInterval);
      clearInterval(progressInterval);
    };
  }, [isVisible, isLoading, delaySeconds, batchNumber, totalBatches, message]);

  // Select icon and color based on batch number
  const getIcon = () => {
    if (batchNumber === 1) return <Rocket className="w-full h-full" />;
    if (batchNumber === totalBatches) return <Sparkles className="w-full h-full" />;
    return <Zap className="w-full h-full" />;
  };

  const getTitle = () => {
    if (isLoading) return '⚡ Loading Portfolio...';
    if (countdown === 0) return '🎉 Almost Ready!';
    if (batchNumber === 1) return '🚀 Priority Update!';
    if (batchNumber === totalBatches) return '🎉 Final Wave!';
    return '✨ Update Ready!';
  };

  const getBatchInfo = () => {
    if (isLoading) return 'Applying updates & restoring your position';
    if (totalBatches === 1) return 'Getting you the latest version';
    return `Wave ${batchNumber} of ${totalBatches}`;
  };

  const getCountdownText = () => {
    if (isLoading) return isScrollRestored ? 'Almost there...' : 'Restoring your position...';
    if (countdown === 0) return 'Finalizing updates...';
    if (isReloading) return 'Fresh content loading...';
    return 'Experience the latest';
  };

  return (
    <AnimatePresence mode="wait">
      {(isVisible || isLoading) && (
        <motion.div
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ 
            opacity: isScrollRestored ? 0 : 1,  // Only fade when completely done
            backdropFilter: isScrollRestored ? 'blur(0px)' : 'blur(12px)',
          }}
          exit={{ 
            opacity: 0, 
            backdropFilter: 'blur(0px)',
          }}
          transition={{ 
            duration: isScrollRestored ? 0.8 : 0.6,  // Smooth fade only at end
            ease: [0.43, 0.13, 0.23, 0.96]
          }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center px-4 py-6 sm:p-4 md:p-6"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            cursor: 'not-allowed',
            userSelect: 'none'
          }}
        >
          {/* Direct content on overlay - no card background */}
          <div className="relative w-full max-w-[95vw] xs:max-w-[90vw] sm:max-w-md md:max-w-lg lg:max-w-xl">
            
            {/* Content - floating on overlay */}
            <div className="relative z-10 text-center space-y-3 xs:space-y-4 sm:space-y-6">
              
              {/* Icon with glow effect */}
              <motion.div
                className="flex items-center justify-center"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', bounce: 0.5 }}
              >
                <motion.div
                  className="relative"
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  {/* Glow effect */}
                  <div className="absolute inset-0 blur-2xl bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 opacity-50 rounded-full scale-150" />
                  <div className="relative w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 text-white flex items-center justify-center text-5xl xs:text-6xl sm:text-7xl md:text-8xl drop-shadow-2xl">
                    {getIcon()}
                  </div>
                </motion.div>
              </motion.div>

                {/* Title - larger, bolder with shadow */}
                <motion.h2
                  className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 xs:mb-4 sm:mb-5 px-2 xs:px-3 sm:px-4 leading-tight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  style={{
                    textShadow: '0 4px 20px rgba(0, 0, 0, 0.8), 0 2px 10px rgba(0, 0, 0, 0.6)',
                  }}
                >
                  {getTitle()}
                </motion.h2>

                {/* Message - larger with shadow */}
                <motion.p
                  className="text-white/95 text-base xs:text-lg sm:text-xl md:text-2xl mb-4 xs:mb-5 sm:mb-7 px-3 xs:px-4 sm:px-6 leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  style={{
                    textShadow: '0 2px 15px rgba(0, 0, 0, 0.7), 0 1px 8px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  {message}
                </motion.p>

                {/* Batch info - responsive badge */}
                <motion.div
                  className="inline-block px-2.5 xs:px-3 sm:px-4 py-1 xs:py-1.5 sm:py-2 bg-white/20 rounded-full backdrop-blur-sm mb-3 xs:mb-4 sm:mb-6 max-w-[90%]"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                >
                  <p className="text-[10px] xs:text-xs sm:text-sm font-medium text-white truncate">
                    {getBatchInfo()}
                  </p>
                </motion.div>

                {/* Countdown - responsive size with reloading state */}
                <motion.div
                  className="mb-3 sm:mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                >
                  <motion.div 
                    className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-1.5 xs:mb-2"
                    animate={isLoading ? {
                      scale: [1, 1.15, 1],
                      rotate: [0, 180, 360]
                    } : isReloading ? { 
                      scale: [1, 1.1, 1],
                      opacity: [1, 0.8, 1]
                    } : {}}
                    transition={{ 
                      duration: isLoading ? 1.5 : 1, 
                      repeat: isLoading ? Infinity : (isReloading ? Infinity : 0)
                    }}
                  >
                    {isLoading ? '🔄' : countdown}
                  </motion.div>
                  <p className="text-white/80 text-[11px] xs:text-xs sm:text-sm md:text-base px-2">
                    {getCountdownText()}
                  </p>
                </motion.div>

                {/* Progress bar - responsive height */}
                <motion.div
                  className="w-full h-2 xs:h-2.5 sm:h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm"
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <motion.div
                    className="h-full bg-gradient-to-r from-white via-cyan-200 to-white rounded-full"
                    style={{ width: `${progress}%` }}
                    transition={{ duration: 0.1 }}
                  >
                    <motion.div
                      className="h-full w-full opacity-50"
                      animate={{
                        backgroundPosition: ['0% 0%', '100% 0%'],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                      style={{
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
                        backgroundSize: '200% 100%',
                      }}
                    />
                  </motion.div>
                </motion.div>

                {/* Progress percentage - responsive text */}
                <motion.p
                  className="text-white/70 text-[9px] xs:text-[10px] sm:text-xs mt-1.5 sm:mt-2 px-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.4 }}
                >
                  {isLoading
                    ? (isScrollRestored ? '✅ Position restored!' : '📍 Restoring scroll position...')
                    : `${Math.round(progress)}% complete ${isReloading ? '• Loading fresh content...' : ''}`
                  }
                </motion.p>
              </div>

            {/* Sparkle particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  top: `${20 + Math.random() * 60}%`,
                  left: `${10 + Math.random() * 80}%`,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              />
            ))}

            {/* Bottom glow effect */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 blur-2xl opacity-50 rounded-full" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
