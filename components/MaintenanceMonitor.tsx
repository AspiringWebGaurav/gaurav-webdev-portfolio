/**
 * Maintenance Monitor - Real-time Mid-Session Detection
 * ONLY monitors for maintenance that starts WHILE user is actively browsing
 * Does NOT check on initial load (MaintenanceGate handles that)
 * NO toasts on initial load - only for real-time mid-session activation
 * 
 * Pattern: Mirrors BanMonitor.tsx exactly
 */

"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { showToast } from "@/lib/toast";

const REDIRECT_DELAY = 3000; // 3 seconds to show toast
const COLLECTION = 'siteSettings';
const DOC_ID = 'maintenance';

export default function MaintenanceMonitor() {
  const pathname = usePathname();
  const router = useRouter();
  const initialMaintenanceStatus = useRef<boolean | null>(null);
  const hasReceivedFirstUpdate = useRef(false);
  const isRedirecting = useRef(false);

  // Skip monitoring for these paths
  const shouldSkipMonitoring = 
    pathname?.startsWith("/admin") || 
    pathname?.startsWith("/banned") ||
    pathname?.startsWith("/maintenance");

  useEffect(() => {
    // Skip monitoring for admin/banned/maintenance pages
    if (shouldSkipMonitoring) return;

    console.log('[Maintenance Monitor] Starting real-time monitoring');

    // Subscribe to maintenance document changes
    const docRef = doc(db, COLLECTION, DOC_ID);
    
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          // Document doesn't exist - maintenance is OFF
          if (!hasReceivedFirstUpdate.current) {
            initialMaintenanceStatus.current = false;
            hasReceivedFirstUpdate.current = true;
          }
          return;
        }

        const data = snapshot.data();
        const isEnabled = data?.enabled === true;

        // IGNORE the very first update (initial state from Firestore)
        if (!hasReceivedFirstUpdate.current) {
          console.log('[Maintenance Monitor] First update (initial state), storing and ignoring:', {
            enabled: isEnabled,
          });
          initialMaintenanceStatus.current = isEnabled;
          hasReceivedFirstUpdate.current = true;
          return;
        }

        // ONLY act if maintenance status CHANGED from OFF to ON
        if (isEnabled && initialMaintenanceStatus.current === false && !isRedirecting.current) {
          console.log('[Maintenance Monitor] 🔧 MID-SESSION MAINTENANCE DETECTED!');
          isRedirecting.current = true;

          // Show toast for mid-session maintenance
          showToast.info(
            'Site is entering maintenance mode...',
            'Maintenance',
            { autoClose: REDIRECT_DELAY }
          );

          // Redirect after delay
          setTimeout(() => {
            router.replace('/maintenance');
          }, REDIRECT_DELAY);

          // Update status to prevent duplicate triggers
          initialMaintenanceStatus.current = true;
        }
      },
      (error) => {
        console.error('[Maintenance Monitor] Listener error:', error);
      }
    );

    return () => {
      console.log('[Maintenance Monitor] Cleaning up listener');
      hasReceivedFirstUpdate.current = false;
      initialMaintenanceStatus.current = null;
      isRedirecting.current = false;
      unsubscribe();
    };
  }, [pathname, router, shouldSkipMonitoring]);

  return null;
}
