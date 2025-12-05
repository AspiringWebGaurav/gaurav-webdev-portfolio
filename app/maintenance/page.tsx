/**
 * Maintenance Page
 * 
 * Displays maintenance message with countdown timer.
 * Real-time listener: redirects to home when maintenance disabled.
 * Responsive screens for Desktop, Tablet, Mobile.
 * Dynamic message when estimated time is exceeded.
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import DesktopScreen from './screens/DesktopScreen';
import TabletScreen from './screens/TabletScreen';
import MobileScreen from './screens/MobileScreen';

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
  });
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownNumber, setCountdownNumber] = useState(3);

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

  // Initial check: if maintenance is OFF, redirect immediately
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/maintenance/status', { cache: 'no-store' });
        const data = await response.json();
        
        if (data.enabled === false) {
          console.log('[Maintenance Page] Maintenance is OFF - redirecting to home');
          setIsRedirecting(true);
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
        });
        
        setCheckingStatus(false);
      } catch (error) {
        console.error('[Maintenance Page] Error checking status:', error);
        setCheckingStatus(false);
      }
    };
    
    checkStatus();
  }, []);

  // Check for overdue status and update overdueBy periodically
  useEffect(() => {
    if (!maintenanceInfo.estimatedEndTime) return;

    const checkOverdue = () => {
      const now = new Date();
      if (maintenanceInfo.estimatedEndTime && now > maintenanceInfo.estimatedEndTime) {
        const overdueBy = Math.floor((now.getTime() - maintenanceInfo.estimatedEndTime.getTime()) / (60 * 1000));
        setMaintenanceInfo(prev => ({ ...prev, isOverdue: true, overdueBy }));
      }
    };

    // Run immediately and then every minute
    checkOverdue();
    const interval = setInterval(checkOverdue, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [maintenanceInfo.estimatedEndTime]);

  // Handle countdown and redirect
  const startCountdownRedirect = () => {
    if (isRedirecting) return;
    setIsRedirecting(true);
    setShowCountdown(true);
    setCountdownNumber(3);
    
    // Countdown: 3, 2, 1, then redirect
    setTimeout(() => setCountdownNumber(2), 1000);
    setTimeout(() => setCountdownNumber(1), 2000);
    setTimeout(() => {
      setCountdownNumber(0);
      window.location.replace('/');
    }, 3000);
  };

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
          });
        }
      },
      (error) => {
        console.error('[Maintenance Page] Listener error:', error);
      }
    );

    return () => unsubscribe();
  }, [isRedirecting]);

  // Loading state
  if (checkingStatus) {
    return (
      <div className="fixed inset-0 bg-black-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple border-t-transparent rounded-full animate-spin" />
          <p className="text-white text-sm opacity-70">Loading...</p>
        </div>
      </div>
    );
  }

  // Countdown Overlay - show when maintenance ends
  if (showCountdown) {
    return (
      <div className="fixed inset-0 bg-black-100 flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-6">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center border-2 border-green-500"
          >
            <motion.svg
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5 }}
              className="w-10 h-10 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </motion.svg>
          </motion.div>

          {/* Message */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold text-white mb-2">Maintenance Complete!</h2>
            <p className="text-white/70">Portfolio is back online</p>
          </motion.div>

          {/* Countdown Number */}
          <motion.div className="mt-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={countdownNumber}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                {countdownNumber > 0 ? (
                  <>
                    <div className="text-6xl font-bold text-purple mb-2">{countdownNumber}</div>
                    <p className="text-white/60 text-sm">Loading portfolio...</p>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-3 border-purple border-t-transparent rounded-full animate-spin" />
                    <span className="text-white">Redirecting...</span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
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
