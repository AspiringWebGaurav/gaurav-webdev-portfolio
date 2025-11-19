'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { showToast } from '@/lib/toast';
import MobileScreen from './screens/MobileScreen';
import TabletScreen from './screens/TabletScreen';
import DesktopScreen from './screens/DesktopScreen';

interface BanInfo {
  reason: string;
  category: string;
  timestamp: string;
  reviewTime: string;
}

const UNBAN_CHECK_INTERVAL = 5000; // Check every 5 seconds for unban
const TOAST_DURATION = 3000; // 3 seconds toast display
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
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [banInfo, setBanInfo] = useState<BanInfo>({
    reason: 'Security Violation',
    timestamp: new Date().toISOString(),
    reviewTime: '72-96 hours',
    category: 'normal',
  });

  // Load ban info from URL params (server-side passed via proxy.ts)
  useEffect(() => {
    const reason = searchParams.get('reason');
    const category = searchParams.get('category');
    
    if (reason || category) {
      setBanInfo({
        reason: reason || 'Security Violation',
        category: category || 'normal',
        timestamp: new Date().toISOString(),
        reviewTime: getCategoryReviewTime(category || 'normal'),
      });
    }
  }, [searchParams]);

  // Periodically check if user has been unbanned
  useEffect(() => {
    const checkUnbanStatus = async () => {
      try {
        const response = await fetch('/api/visitor-analytics/check-ban', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
          cache: 'no-store',
        });

        if (response.ok) {
          const data = await response.json();
          
          // If not banned anymore, show success toast and redirect
          if (data.banned === false) {
            console.log('[Banned Page] ✅ User has been unbanned!');
            
            // Show success toast
            showToast.success(
              'You have been unbanned by admin. Welcome back!',
              'Welcome Back',
              { autoClose: TOAST_DURATION }
            );
            
            // Redirect to portfolio home after toast
            setTimeout(() => {
              window.location.href = PORTFOLIO_HOME;
            }, TOAST_DURATION);
          }
        }
      } catch (error) {
        console.error('[Banned Page] Error checking unban status:', error);
      }
    };

    // Check immediately on mount
    checkUnbanStatus();

    // Then check periodically
    const interval = setInterval(checkUnbanStatus, UNBAN_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, []);

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
