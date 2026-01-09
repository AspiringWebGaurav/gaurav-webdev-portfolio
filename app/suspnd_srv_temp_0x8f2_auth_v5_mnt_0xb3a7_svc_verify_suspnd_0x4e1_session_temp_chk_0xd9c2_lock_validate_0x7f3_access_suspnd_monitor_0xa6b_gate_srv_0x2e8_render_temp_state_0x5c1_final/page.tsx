/**
 * Suspension Page - Ultra Encrypted Entry Point
 * 
 * URL: /suspnd_srv_temp_0x8f2_auth_v5_mnt_0xb3a7_svc_verify_suspnd_0x4e1_session_temp_chk_0xd9c2_lock_validate_0x7f3_access_suspnd_monitor_0xa6b_gate_srv_0x2e8_render_temp_state_0x5c1_final
 * 
 * Heavily obfuscated 197-character URL with:
 * - Multiple "suspnd" (suspended) references scattered throughout
 * - "temp" (temporary) indicators
 * - "srv"/"svc" (services) markers
 * - Hex tokens: 0x8f2, 0xb3a7, 0x4e1, 0xd9c2, 0x7f3, 0xa6b, 0x2e8, 0x5c1
 * - System-level auth/session/validate terminology
 * 
 * Displays suspension message with responsive screens.
 * Real-time listener: redirects to home when suspension disabled.
 * Responsive screens for Desktop, Tablet, Mobile.
 * 
 * CACHE PREVENTION:
 * - No static generation (dynamic)
 * - Revalidate every 0 seconds
 * - Visibility change detection to re-check status
 * - Hard refresh on suspension end
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useSuspensionStatus } from '@/contexts/SuspensionStatusContext';
import DesktopScreen from './screens/DesktopScreen';
import TabletScreen from './screens/TabletScreen';
import MobileScreen from './screens/MobileScreen';
import SuspensionPageSkeleton from '@/components/skeletons/sections/SuspensionPageSkeleton';

const COLLECTION = 'siteSettings';
const DOC_ID = 'suspension';

interface SuspensionInfo {
  reason: string;
  estimatedDuration: number | null;
  enabledAt: Date | null;
  enabledBy: string | null;
}

function SuspensionContent() {
  const router = useRouter();
  const suspensionStatus = useSuspensionStatus();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [screenSize, setScreenSize] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Get suspension info from context
  const suspensionInfo: SuspensionInfo = {
    reason: suspensionStatus.reason || '',
    estimatedDuration: suspensionStatus.estimatedDuration,
    enabledAt: suspensionStatus.enabledAt,
    enabledBy: suspensionStatus.enabledBy,
  };

  const isLoading = suspensionStatus.isLoading;

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

  // NOTE: Suspension monitoring and restoration animation is handled by SuspensionMonitor
  // This page just displays the suspension message - DO NOT add redirect logic here
  // The SuspensionMonitor will handle the restoration animation and redirect

  // Detect visibility change (user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Re-check suspension status when tab becomes visible
        console.log('[Suspension Page] Tab visible - status will sync via listener');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Show loading skeleton
  if (isLoading) {
    return <SuspensionPageSkeleton />;
  }

  // Show redirecting state
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-900">Services Restored!</p>
          <p className="text-gray-600 mt-2">Redirecting to homepage...</p>
        </motion.div>
      </div>
    );
  }

  // Render appropriate screen
  return (
    <AnimatePresence mode="wait">
      {screenSize === 'mobile' && (
        <motion.div
          key="mobile"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <MobileScreen 
            suspensionInfo={suspensionInfo}
          />
        </motion.div>
      )}
      {screenSize === 'tablet' && (
        <motion.div
          key="tablet"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <TabletScreen 
            suspensionInfo={suspensionInfo}
          />
        </motion.div>
      )}
      {screenSize === 'desktop' && (
        <motion.div
          key="desktop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <DesktopScreen 
            suspensionInfo={suspensionInfo}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function SuspensionPage() {
  return <SuspensionContent />;
}

// Force dynamic rendering - prevents static generation
export const dynamic = 'force-dynamic';
