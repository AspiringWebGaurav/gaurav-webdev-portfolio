"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getFirebaseRtdb, getFirebaseFirestore } from "@/lib/admin/firebase";
import { ref, onValue, off, Unsubscribe as RtdbUnsubscribe } from "firebase/database";
import { doc, onSnapshot, Unsubscribe as FirestoreUnsubscribe } from "firebase/firestore";

interface SyncSignalPayload {
  domain?: string;
  version?: number;
  timestamp?: number;
}

/**
 * Invisible client-side synchronization engine for the public portfolio.
 * Listens to safe public change signals from Firebase RTDB / Firestore / BroadcastChannel,
 * coalesces rapid changes, and triggers seamless Server Component revalidation via router.refresh().
 */
export function LivePortfolioSync() {
  const router = useRouter();
  const lastSyncTimestampRef = useRef<number>(Date.now());
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;
    let rtdbUnsub: (() => void) | null = null;
    let firestoreUnsub: FirestoreUnsubscribe | null = null;
    let broadcastChannel: BroadcastChannel | null = null;

    const triggerRefresh = (signal: SyncSignalPayload) => {
      if (!isMounted) return;

      const signalTime = signal.timestamp || Date.now();
      // Ignore stale signals or initial mount payload
      if (signalTime <= lastSyncTimestampRef.current) return;
      lastSyncTimestampRef.current = signalTime;

      // Coalesce rapid mutations within 250ms window
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        if (!isMounted) return;
        try {
          router.refresh();
        } catch {
          // Fallback if router is navigating
        }
      }, 250);
    };

    // 1. Cross-Tab Synchronization via BroadcastChannel
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        broadcastChannel = new BroadcastChannel("portfolio_cms_sync");
        broadcastChannel.onmessage = (event: MessageEvent<SyncSignalPayload>) => {
          if (event.data && typeof event.data === "object") {
            triggerRefresh(event.data);
          }
        };
      }
    } catch {}

    const attachFirestoreFallback = () => {
      if (firestoreUnsub || !isMounted) return;
      try {
        const firestore = getFirebaseFirestore();
        if (firestore) {
          const signalDocRef = doc(firestore, "portfolio_signal", "sync");
          firestoreUnsub = onSnapshot(
            signalDocRef,
            (snapshot) => {
              if (snapshot.exists()) {
                const data = snapshot.data() as SyncSignalPayload;
                triggerRefresh(data);
              }
            },
            () => {
              // Firestore onSnapshot fallback error suppressed
            }
          );
        }
      } catch {}
    };

    // 2. Firebase RTDB Realtime Listener (Primary Low-Latency Push); Firestore attaches only if RTDB unavailable
    let rtdbAttached = false;
    try {
      const rtdb = getFirebaseRtdb();
      if (rtdb) {
        const syncRef = ref(rtdb, "public_signals/cms_sync");
        const unsubscribe = onValue(
          syncRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.val() as SyncSignalPayload;
              triggerRefresh(data);
            }
          },
          () => {
            attachFirestoreFallback();
          }
        );

        rtdbAttached = true;
        rtdbUnsub = () => {
          try {
            off(syncRef);
            if (typeof unsubscribe === "function") (unsubscribe as RtdbUnsubscribe)();
          } catch {}
        };
      }
    } catch {}

    if (!rtdbAttached) {
      attachFirestoreFallback();
    }

    return () => {
      isMounted = false;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (broadcastChannel) {
        try {
          broadcastChannel.close();
        } catch {}
      }
      if (rtdbUnsub) {
        try {
          rtdbUnsub();
        } catch {}
      }
      if (firestoreUnsub) {
        try {
          firestoreUnsub();
        } catch {}
      }
    };
  }, [router]);

  return null;
}
