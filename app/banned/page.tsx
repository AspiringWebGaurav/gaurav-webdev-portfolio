'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

// Note: dynamic and revalidate configs are set in layout.tsx (server component)
// Client components cannot export revalidate - it causes runtime errors
import { showToast } from '@/lib/toast';
import MobileScreen from './screens/MobileScreen';
import TabletScreen from './screens/TabletScreen';
import DesktopScreen from './screens/DesktopScreen';
import { banStatusManager } from '@/lib/banStatusManager';
import { generateDeviceFingerprint } from '@/lib/deviceFingerprint';
import { clearIdentityCache } from '@/lib/cacheInvalidation';
// REMOVED: clientIdentifyVisitor - DO NOT call identify APIs on banned page!
// This was causing new UUIDs to be created when banned users visited this page

interface BanInfo {
  reason: string;
  category: string;
  timestamp: string;
  reviewTime: string;
  banType?: 'temporary' | 'permanent';
  banExpiresAt?: string;
  banDuration?: number;
}

const FALLBACK_CHECK_INTERVAL = 10000; // Fallback check every 10 seconds
const TOAST_DURATION = 3000; // 3 seconds toast display
const REDIRECT_DELAY = 3000; // 3 seconds before redirect
const PORTFOLIO_HOME = '/'; // Dynamic portfolio home route
const MAX_VERIFICATION_TIME = 5000; // Max 5 seconds for verification before showing UI

// Get review time based on category
const getCategoryReviewTime = (category?: string): string => {
  switch (category) {
    case 'normal':
      return '24-48 hours';
    case 'medium':
      return '48-72 hours';
    case 'danger':
      return '72-96 hours';
    case 'severe':
      return '96-120 hours';
    default:
      return '72-96 hours';
  }
};

function BannedPageContent() {
  const searchParams = useSearchParams();
  const [mask, setMask] = useState<string | null>(null);
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [banInfo, setBanInfo] = useState<BanInfo>({
    reason: 'Security Violation',
    timestamp: new Date().toISOString(),
    reviewTime: '72-96 hours',
    category: 'normal',
    banType: 'permanent',
  });
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const verificationTimeout = useRef<NodeJS.Timeout | null>(null);
  const hasStartedCheck = useRef(false);

  // Safety timeout: Always show banned UI after MAX_VERIFICATION_TIME
  // This prevents infinite "checking" state
  useEffect(() => {
    verificationTimeout.current = setTimeout(() => {
      if (checkingStatus) {
        console.log('[Banned Page] ⏱️ Verification timeout reached - showing banned UI');
        setCheckingStatus(false);
      }
    }, MAX_VERIFICATION_TIME);
    
    return () => {
      if (verificationTimeout.current) {
        clearTimeout(verificationTimeout.current);
      }
    };
  }, []);

  // Get visitor mask by checking ban status with fingerprint
  // CRITICAL: DO NOT call identify APIs here - they would create a new UUID!
  // Instead, use check-ban-by-fingerprint which only looks up existing identity
  useEffect(() => {
    const getMaskFromBanCheck = async () => {
      try {
        const fingerprint = generateDeviceFingerprint();
        
        // Use fingerprint-based ban check that returns mask WITHOUT creating new identity
        const response = await fetch('/api/visitor-analytics/check-ban-by-fingerprint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fingerprint }),
          cache: 'no-store',
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.mask) {
            setMask(data.mask);
            console.log('[Banned Page] Got mask from fingerprint lookup:', data.mask);
          } else {
            // No existing identity found - this shouldn't happen for banned users
            console.warn('[Banned Page] No existing identity found for fingerprint');
            // Show banned UI anyway (conservative)
            setCheckingStatus(false);
          }
        } else {
          console.error('[Banned Page] Failed to lookup identity by fingerprint');
          setCheckingStatus(false);
        }
      } catch (error) {
        console.error('[Banned Page] Error getting mask:', error);
        // On error, show banned UI (conservative)
        setCheckingStatus(false);
      }
    };
    getMaskFromBanCheck();
  }, []);

  // IMMEDIATE CHECK: If user is not banned, redirect silently (no toast)
  useEffect(() => {
    if (!mask || isRedirecting || hasStartedCheck.current) return;
    hasStartedCheck.current = true;

    const checkCurrentBanStatus = async () => {
      try {
        const response = await fetch('/api/visitor-analytics/check-ban-realtime', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mask }),
          cache: 'no-store',
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.banned === false) {
            // User is NOT banned - redirect immediately without toast
            console.log('[Banned Page] ✅ User is not banned - Clearing cache before redirect');
            setIsRedirecting(true);
            
            // Clear cache before redirect to ensure fresh data
            try {
              await clearIdentityCache();
              console.log('[Banned Page] Cache cleared successfully');
            } catch (error) {
              console.error('[Banned Page] Failed to clear cache:', error);
            }
            
            // Add cache-busting parameter to ensure BanGate clears cache
            window.location.replace(`${PORTFOLIO_HOME}?unbanRedirect=true&_t=${Date.now()}`);
            return;
          } else {
            // User is still banned - update ban info with type and expiration
            console.log('[Banned Page] ⛔ User is still banned - Showing ban screen');
            setBanInfo(prev => ({
              ...prev,
              reason: data.banReason || prev.reason,
              category: data.banCategory || prev.category,
              banType: data.banType || 'permanent',
              banExpiresAt: data.banExpiresAt,
              banDuration: data.banDuration,
            }));
            setCheckingStatus(false);
          }
        } else {
          // API error - show banned UI as fallback (conservative approach)
          console.log('[Banned Page] API error - showing banned UI as fallback');
          setCheckingStatus(false);
        }
      } catch (error) {
        console.error('[Banned Page] Error checking ban status:', error);
        // On error, show banned UI (conservative - assume they're banned)
        setCheckingStatus(false);
      }
    };

    checkCurrentBanStatus();
  }, [mask, isRedirecting]);

  // Load ban info from URL params (server-side passed via proxy.ts)
  useEffect(() => {
    const reason = searchParams.get('reason');
    const category = searchParams.get('category');
    const timestamp = searchParams.get('timestamp');
    const banType = searchParams.get('banType') as 'temporary' | 'permanent' | null;
    
    if (reason || category || timestamp || banType) {
      setBanInfo({
        reason: reason || 'Security Violation',
        category: category || 'normal',
        timestamp: timestamp || new Date().toISOString(),
        reviewTime: getCategoryReviewTime(category || 'normal'),
        banType: banType || 'permanent',
      });
    }
  }, [searchParams]);

  /**
   * Handle unban via real-time listener
   */
  useEffect(() => {
    if (isRedirecting) return;

    // Wait for mask
    if (!mask) {
      console.log('[Banned Page] Waiting for mask...');
      return;
    }

    console.log('[Banned Page] Setting up real-time unban monitoring with mask:', mask);

    let unsubscribe: (() => void) | null = null;
    let mounted = true;

    // Async setup function
    const setupMonitoring = async () => {
      try {
        // Initialize with mask
        if (!banStatusManager.isReady()) {
          await banStatusManager.initialize(mask);
        }

        if (!mounted) return; // Component unmounted during init

        // Subscribe to real-time updates
        unsubscribe = await banStatusManager.subscribe(
          'banned-page-unban-monitor',
          async (status) => {
            // If not banned anymore, redirect silently (admin unbanned while user on this page)
            if (status.banned === false && !isRedirecting) {
              console.log('[Banned Page] ✅ User has been unbanned (real-time) - Clearing cache');
              setIsRedirecting(true);
              
              // Clear cache before redirect
              try {
                await clearIdentityCache();
                console.log('[Banned Page] Cache cleared successfully');
              } catch (error) {
                console.error('[Banned Page] Failed to clear cache:', error);
              }
              
              // Silent redirect with cache-busting parameter
              banStatusManager.reset();
              window.location.replace(`${PORTFOLIO_HOME}?unbanRedirect=true&_t=${Date.now()}`);
            }
          },
          (error) => {
            console.error('[Banned Page] Real-time listener error:', error);
          }
        );
      } catch (error) {
        console.error('[Banned Page] Failed to setup real-time monitoring:', error);
      }
    };

    // Start setup
    setupMonitoring();

    // Cleanup function
    return () => {
      mounted = false;
      console.log('[Banned Page] Cleaning up real-time listener');
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isRedirecting, mask]);

  /**
   * Fallback polling check (in case real-time fails)
   */
  useEffect(() => {
    if (isRedirecting) return;
    
    // Wait for mask from BubbleSessionContext
    if (!mask) {
      console.log('[Banned Page] Waiting for mask for fallback polling...');
      return;
    }

    const checkUnbanStatus = async () => {
      try {
        
        const response = await fetch('/api/visitor-analytics/check-ban', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ mask }), // Send mask to avoid dual identity
          cache: 'no-store',
        });

        if (response.ok) {
          const data = await response.json();
          
          // If not banned anymore, redirect silently
          if (data.banned === false && !isRedirecting) {
            console.log('[Banned Page] ✅ User has been unbanned (fallback check) - Silent redirect');
            setIsRedirecting(true);
            
            // Silent redirect without toast
            banStatusManager.reset();
            window.location.replace(PORTFOLIO_HOME);
          }
        }
      } catch (error) {
        console.error('[Banned Page] Error checking unban status:', error);
      }
    };

    // Check immediately on mount
    checkUnbanStatus();

    // Then check periodically as fallback
    const interval = setInterval(checkUnbanStatus, FALLBACK_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [isRedirecting, mask]);

  /**
   * Visibility change detection - recheck ban status when user returns to tab
   * Prevents cached page from showing stale ban state
   */
  useEffect(() => {
    if (isRedirecting || !mask) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('[Banned Page] Tab became visible - rechecking ban status with cache-busting');
        
        // Re-check ban status with timestamp cache-busting
        fetch(`/api/visitor-analytics/check-ban?t=${Date.now()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mask }),
          cache: 'no-store',
        })
          .then(res => res.json())
          .then(data => {
            if (data.banned === false && !isRedirecting) {
              console.log('[Banned Page] ✅ Visibility check - user unbanned, redirecting');
              setIsRedirecting(true);
              
              // Clear browser caches before redirect
              if ('caches' in window) {
                caches.keys().then(names => {
                  names.forEach(name => caches.delete(name));
                });
              }
              
              banStatusManager.reset();
              window.location.replace(PORTFOLIO_HOME);
            }
          })
          .catch(err => console.error('[Banned Page] Visibility check failed:', err));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isRedirecting, mask]);

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

    // Set initial size
    handleResize();

    // Listen for resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Show loading state while checking ban status
  if (checkingStatus) {
    return (
      <div className="fixed inset-0 bg-black-100 flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white text-sm opacity-70">Checking access status...</p>
        </div>
      </div>
    );
  }

  // Render appropriate screen based on size
  if (screenSize === 'mobile') {
    return <MobileScreen banInfo={banInfo} />;
  }

  if (screenSize === 'tablet') {
    return <TabletScreen banInfo={banInfo} />;
  }

  return <DesktopScreen banInfo={banInfo} />;
}

// Wrap with Suspense for useSearchParams
export default function BannedPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="text-white">Loading...</div>
    </div>}>
      <BannedPageContent />
    </Suspense>
  );
}
