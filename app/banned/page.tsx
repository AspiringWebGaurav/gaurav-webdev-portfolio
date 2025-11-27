'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { showToast } from '@/lib/toast';
import MobileScreen from './screens/MobileScreen';
import TabletScreen from './screens/TabletScreen';
import DesktopScreen from './screens/DesktopScreen';
import { banStatusManager } from '@/lib/banStatusManager';
import { generateDeviceFingerprint } from '@/lib/deviceFingerprint';
import { clientIdentifyVisitor } from '@/lib/uuid-sync';

interface BanInfo {
  reason: string;
  category: string;
  timestamp: string;
  reviewTime: string;
}

const FALLBACK_CHECK_INTERVAL = 10000; // Fallback check every 10 seconds
const TOAST_DURATION = 3000; // 3 seconds toast display
const REDIRECT_DELAY = 3000; // 3 seconds before redirect
const PORTFOLIO_HOME = '/'; // Dynamic portfolio home route

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
  });
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Get visitor mask independently (avoid session context loop)
  useEffect(() => {
    const getMask = async () => {
      const fingerprint = generateDeviceFingerprint();
      const visitorMask = await clientIdentifyVisitor(fingerprint);
      setMask(visitorMask);
    };
    getMask();
  }, []);

  // Load ban info from URL params (server-side passed via proxy.ts)
  useEffect(() => {
    const reason = searchParams.get('reason');
    const category = searchParams.get('category');
    const timestamp = searchParams.get('timestamp');
    
    if (reason || category || timestamp) {
      setBanInfo({
        reason: reason || 'Security Violation',
        category: category || 'normal',
        timestamp: timestamp || new Date().toISOString(),
        reviewTime: getCategoryReviewTime(category || 'normal'),
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
          (status) => {
            // If not banned anymore, show success toast and redirect
            if (status.banned === false && !isRedirecting) {
              console.log('[Banned Page] ✅ User has been unbanned (real-time)!');
              setIsRedirecting(true);
              
              // Show success toast
              showToast.success(
                'You have been unbanned by admin. Welcome back!',
                'Welcome Back',
                { autoClose: TOAST_DURATION }
              );
              
              // Redirect after delay
              setTimeout(() => {
                // Reset ban status manager before redirecting
                banStatusManager.reset();
                window.location.href = PORTFOLIO_HOME;
              }, REDIRECT_DELAY);
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
          
          // If not banned anymore, show success toast and redirect
          if (data.banned === false && !isRedirecting) {
            console.log('[Banned Page] ✅ User has been unbanned (fallback check)!');
            setIsRedirecting(true);
            
            // Show success toast
            showToast.success(
              'You have been unbanned by admin. Welcome back!',
              'Welcome Back',
              { autoClose: TOAST_DURATION }
            );
            
            // Redirect to portfolio home after toast
            setTimeout(() => {
              // Reset ban status manager before redirecting
              banStatusManager.reset();
              window.location.href = PORTFOLIO_HOME;
            }, REDIRECT_DELAY);
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
