/**
 * Ban Monitor - Real-time Mid-Session Ban Detection
 * ONLY monitors for bans that happen WHILE user is actively browsing
 * Does NOT check on initial load (BanGate handles that)
 * NO toasts on initial load - only for real-time mid-session bans
 */

"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { banStatusManager } from "@/lib/banStatusManager";
import { showToast } from "@/lib/toast";
import { useBubbleSession } from "@/contexts/BubbleSessionContext";

const REDIRECT_DELAY = 2000; // 2 seconds to show toast

export default function BanMonitor() {
  const pathname = usePathname();
  const router = useRouter();
  const { visitorId: mask } = useBubbleSession();
  const initialBanStatus = useRef<boolean | null>(null);
  const monitoringActive = useRef(false);
  const hasReceivedFirstUpdate = useRef(false);

  // Check if we should skip monitoring
  const shouldSkipMonitoring = pathname?.startsWith("/admin") || pathname?.startsWith("/banned") || pathname?.startsWith("/maintenance");

  useEffect(() => {
    // Skip monitoring for admin/banned pages
    if (shouldSkipMonitoring || !mask || monitoringActive.current) return;

    console.log('[Ban Monitor] Starting real-time monitoring for mask:', mask);
    monitoringActive.current = true;

    let unsubscribe: (() => void) | null = null;
    let mounted = true;

    const setupMonitoring = async () => {
      try {
        // Initialize ban status manager
        if (!banStatusManager.isReady()) {
          await banStatusManager.initialize(mask);
        }

        if (!mounted) return;

        console.log('[Ban Monitor] Starting real-time listener (will ignore first update)');

        // Subscribe to real-time updates
        unsubscribe = await banStatusManager.subscribe(
          'ban-monitor-realtime',
          (status) => {
            // IGNORE the very first update (initial state from Firestore)
            if (!hasReceivedFirstUpdate.current) {
              console.log('[Ban Monitor] First update received (initial state), storing and ignoring:', {
                banned: status.banned,
              });
              initialBanStatus.current = status.banned;
              hasReceivedFirstUpdate.current = true;
              return; // Skip first update
            }

            // ONLY act if ban status CHANGED from previous state
            if (status.banned === true && initialBanStatus.current === false) {
              console.log('[Ban Monitor] ⛔ MID-SESSION BAN DETECTED!', {
                reason: status.banReason,
                category: status.banCategory,
              });

              // Show toast for mid-session ban
              showToast.error(
                status.banReason || 'Security Violation',
                'You have been banned',
                { autoClose: REDIRECT_DELAY }
              );

              // Redirect after delay
              setTimeout(() => {
                const params = new URLSearchParams({
                  reason: status.banReason || 'Security Violation',
                  category: status.banCategory || 'normal',
                  timestamp: new Date().toISOString(),
                });
                router.replace(`/banned?${params.toString()}`);
              }, REDIRECT_DELAY);

              // Update initial status to prevent duplicate triggers
              initialBanStatus.current = true;
            }
          },
          (error) => {
            console.error('[Ban Monitor] Real-time listener error:', error);
          }
        );

      } catch (error) {
        console.error('[Ban Monitor] Setup error:', error);
      }
    };

    setupMonitoring();

    return () => {
      mounted = false;
      monitoringActive.current = false;
      hasReceivedFirstUpdate.current = false;
      initialBanStatus.current = null;
      if (unsubscribe) {
        console.log('[Ban Monitor] Cleaning up real-time listener');
        unsubscribe();
      }
    };
  }, [mask, pathname, router, shouldSkipMonitoring]);

  return null;
}
