/**
 * Realtime Adapter - Firebase realtime listeners for ban enforcement
 */

import { useState, useEffect } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { COLLECTIONS } from '../constants';
import { log, logError } from '../utils';

/**
 * Listen to ban status changes in realtime
 */
export function listenToBanStatus(
  uuid: string,
  onBanStatusChange: (banned: boolean) => void
): () => void {
  try {
    const docRef = doc(db, COLLECTIONS.VISITOR_PROFILES, uuid);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const banned = data.banned === true;
          onBanStatusChange(banned);
        }
      },
      (error) => {
        logError('Ban status listener error', error);
      }
    );

    log('Ban status listener attached', { uuid: uuid.substring(0, 13) });

    return unsubscribe;
  } catch (error) {
    logError('Failed to attach ban status listener', error);
    // Return no-op unsubscribe
    return () => {};
  }
}

/**
 * React hook for realtime ban monitoring
 */
export function useBanStatusMonitor(uuid: string | null) {
  const [banned, setBanned] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uuid) {
      setLoading(false);
      return;
    }

    const unsubscribe = listenToBanStatus(uuid, (isBanned) => {
      setBanned(isBanned);
      setLoading(false);
    });

    return unsubscribe;
  }, [uuid]);

  return { banned, loading };
}
