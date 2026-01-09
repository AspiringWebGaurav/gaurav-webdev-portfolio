/**
 * useSuspensionStatus Hook
 * 
 * Custom React hook for accessing suspension status.
 * Uses real-time Firestore listener for instant updates.
 * Auto-cleanup on unmount.
 */

"use client";

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const COLLECTION = 'siteSettings';
const DOC_ID = 'suspension';

export interface SuspensionStatus {
  enabled: boolean;
  reason: string;
  estimatedDuration: number | null;
  enabledAt: Date | null;
  enabledBy: string | null;
  lastUpdated: Date | null;
}

export function useSuspensionStatus() {
  const [status, setStatus] = useState<SuspensionStatus>({
    enabled: false,
    reason: '',
    estimatedDuration: null,
    enabledAt: null,
    enabledBy: null,
    lastUpdated: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const docRef = doc(db, COLLECTION, DOC_ID);

    // Real-time listener
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          // Document doesn't exist - suspension is OFF
          setStatus({
            enabled: false,
            reason: '',
            estimatedDuration: null,
            enabledAt: null,
            enabledBy: null,
            lastUpdated: null,
          });
          setIsLoading(false);
          setError(null);
          return;
        }

        const data = snapshot.data();
        
        // Parse timestamps
        let enabledAt: Date | null = null;
        let lastUpdated: Date | null = null;

        if (data?.enabledAt) {
          try {
            enabledAt = data.enabledAt.toDate();
          } catch (e) {
            console.warn('[useSuspensionStatus] Failed to parse enabledAt');
          }
        }

        if (data?.lastUpdated) {
          try {
            lastUpdated = data.lastUpdated.toDate();
          } catch (e) {
            console.warn('[useSuspensionStatus] Failed to parse lastUpdated');
          }
        }

        setStatus({
          enabled: data?.enabled === true,
          reason: data?.reason || '',
          estimatedDuration: data?.estimatedDuration || null,
          enabledAt,
          enabledBy: data?.enabledBy || null,
          lastUpdated,
        });
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error('[useSuspensionStatus] Listener error:', err.message);
        setError(err.message);
        setIsLoading(false);
        // Fail-open: keep last known state or default to disabled
      }
    );

    // Cleanup on unmount
    return () => unsubscribe();
  }, []);

  return { status, isLoading, error };
}
