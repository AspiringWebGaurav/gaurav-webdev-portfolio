/**
 * Local Maintenance Banner
 * 
 * Shows maintenance status on localhost when production is in maintenance mode.
 * Admin can see production status while developing locally.
 * 
 * Features:
 * - Only shows on localhost when production maintenance is ON
 * - Live countdown timer synced from Firebase (zero extra reads)
 * - Dismissible with auto-reappear after 5 minutes
 * - Real-time updates via existing MaintenanceMonitor listener
 * - Zero Firebase cost - uses shared Context
 */

"use client";

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, Clock, Check } from 'lucide-react';
import { useMaintenanceStatus } from '@/contexts/MaintenanceStatusContext';
import { isLocalhost } from '@/lib/environmentUtils';

const STORAGE_KEY = 'maintenanceBannerDismissed';
const REAPPEAR_DELAY = 5 * 60 * 1000; // 5 minutes

export default function LocalMaintenanceBanner() {
  const { status, isLoading } = useMaintenanceStatus();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isClient, setIsClient] = useState(false);

  // Check if we're on admin page
  const isAdminPage = pathname?.startsWith('/admin');
  
  // Track if we should auto-dismiss after showing auto-ended message
  const [autoEndedShown, setAutoEndedShown] = useState(false);

  // Check if we're on localhost (client-side only)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Calculate time remaining or overdue
  const calculateTimeLeft = useCallback(() => {
    if (!status.estimatedEndTime) return '';

    const now = new Date();
    const end = new Date(status.estimatedEndTime);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) {
      // Overdue
      const minutesOver = Math.floor((now.getTime() - end.getTime()) / (60 * 1000));
      return `Overdue by ${minutesOver}m`;
    }

    // Time remaining
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((diff % (60 * 1000)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  }, [status.estimatedEndTime]);

  // Update countdown timer every second
  useEffect(() => {
    if (!status.enabled || !status.estimatedEndTime) return;

    const updateTimer = () => {
      setTimeLeft(calculateTimeLeft());
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [status.enabled, status.estimatedEndTime, calculateTimeLeft]);

  // Check dismissed status and auto-reappear logic
  useEffect(() => {
    if (!isClient || !isLocalhost()) return;

    const dismissedData = localStorage.getItem(STORAGE_KEY);
    
    if (dismissedData) {
      const dismissedTime = parseInt(dismissedData, 10);
      const now = Date.now();
      const timeSinceDismiss = now - dismissedTime;

      if (timeSinceDismiss < REAPPEAR_DELAY) {
        // Still within dismiss period
        setIsDismissed(true);
        
        // Set timeout to reappear after remaining time
        const remainingTime = REAPPEAR_DELAY - timeSinceDismiss;
        const timeout = setTimeout(() => {
          setIsDismissed(false);
          localStorage.removeItem(STORAGE_KEY);
        }, remainingTime);

        return () => clearTimeout(timeout);
      } else {
        // Dismiss period expired, clear storage
        localStorage.removeItem(STORAGE_KEY);
        setIsDismissed(false);
      }
    }
  }, [isClient]);

  // Update visibility based on conditions
  useEffect(() => {
    if (!isClient) return;

    const shouldShow = (
      isLocalhost() &&
      !isAdminPage &&  // Don't show on admin pages
      (status.enabled || status.autoEndTriggered) && // Show for active OR auto-ended
      !isLoading &&
      !isDismissed
    );

    setIsVisible(shouldShow);
    
    // Auto-dismiss after 10 seconds if showing auto-ended state
    if (status.autoEndTriggered && shouldShow) {
      const timeout = setTimeout(() => {
        setIsDismissed(true);
        localStorage.setItem(STORAGE_KEY, Date.now().toString());
      }, 10000); // 10 seconds to read the message
      
      return () => clearTimeout(timeout);
    }
  }, [isClient, isAdminPage, status.enabled, status.autoEndTriggered, isLoading, isDismissed]);

  // Clear storage when maintenance is disabled (not auto-ended)
  useEffect(() => {
    if (!status.enabled && !status.autoEndTriggered && isClient) {
      localStorage.removeItem(STORAGE_KEY);
      setIsDismissed(false);
    }
  }, [status.enabled, status.autoEndTriggered, isClient]);

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    const now = Date.now();
    localStorage.setItem(STORAGE_KEY, now.toString());
    setIsDismissed(true);
    setIsVisible(false);
  }, []);

  // Don't render on server, admin pages, or if not localhost
  if (!isClient || isAdminPage) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
        >
          <div className="max-w-7xl mx-auto px-4 py-3 pointer-events-auto">
            <div className="bg-gradient-to-r from-orange-900/10 via-red-900/10 to-orange-900/10 rounded-lg shadow-lg shadow-orange-500/10 border border-orange-500/20 backdrop-blur-xl bg-black/40">
              <div className="px-4 py-3 flex items-center justify-between gap-4">
                {/* Icon and Status */}
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-orange-400" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 flex-1">
                    {status.autoEndTriggered ? (
                      // AUTO-ENDED STATE - Clear message
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-green-100 uppercase tracking-wider">
                            ✅ Production: Maintenance Ended Automatically
                          </span>
                          <span className="hidden sm:inline text-green-200/50">•</span>
                        </div>
                        {status.autoEndDetectedAt && (
                          <div className="flex items-center gap-2 text-sm text-green-100/90">
                            <Clock className="w-4 h-4 text-green-300" />
                            <span className="font-mono font-semibold">
                              Ended: {new Date(status.autoEndDetectedAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      // ACTIVE STATE
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-orange-100/90 uppercase tracking-wider">
                            🌐 Production: Maintenance Mode Active
                          </span>
                          <span className="hidden sm:inline text-orange-200/50">•</span>
                        </div>
                        
                        {/* Timer */}
                        {status.estimatedEndTime && (
                          <div className="flex items-center gap-2 text-sm text-orange-100/90">
                            <Clock className="w-4 h-4 text-orange-300" />
                            <span className="font-mono font-semibold">
                              {status.isOverdue ? (
                                <span className="text-yellow-300">
                                  Overdue by {status.overdueBy}m
                                </span>
                              ) : (
                                <span className="text-orange-200">Ends in: {timeLeft}</span>
                              )}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={handleDismiss}
                  className={`flex-shrink-0 p-1.5 rounded-md transition-all duration-300 group ${
                    status.autoEndTriggered
                      ? 'hover:bg-green-500/20'
                      : 'hover:bg-orange-500/20'
                  }`}
                  aria-label="Dismiss banner"
                >
                  <X className={`w-5 h-5 transition-colors ${
                    status.autoEndTriggered
                      ? 'text-green-300 group-hover:text-green-100'
                      : 'text-orange-300 group-hover:text-orange-100'
                  }`} />
                </button>
              </div>

              {/* Helper Text */}
              <div className="px-4 pb-3 pt-1">
                <p className={`text-xs ${
                  status.autoEndTriggered
                    ? 'text-green-200/70'
                    : 'text-orange-200/70'
                }`}>
                  {status.autoEndTriggered
                    ? "Maintenance has ended. Production site is now accessible. This message will auto-dismiss."
                    : "You're on localhost - this won't affect your development. Production visitors see the maintenance page."
                  }
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
