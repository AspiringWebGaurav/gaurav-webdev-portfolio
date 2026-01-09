/**
 * FIREBASE LISTENER ADAPTER
 * 
 * Integrates burn prevention into Firebase real-time listeners.
 * This is critical because Firebase listeners run 24/7 and consume resources
 * even when no one is using the system.
 */

import { burnPreventionCore } from '../index';
import { onSnapshot, type Unsubscribe, type Query, type DocumentReference } from 'firebase/firestore';

interface ListenerOptions {
  id: string;
  criticality?: 'critical' | 'high' | 'normal' | 'low';
  owner?: 'admin' | 'visitor' | 'system';
  description?: string;
}

/**
 * Wrap Firebase onSnapshot with burn prevention awareness
 */
export function observeWithBurnPrevention<T>(
  ref: Query<T> | DocumentReference<T>,
  options: ListenerOptions,
  onNext: (snapshot: any) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const executionId = `firebase-${options.id}`;
  let unsubscribe: Unsubscribe | null = null;
  let isActive = false;
  let lastSnapshot: any = null;

  // Register with burn prevention
  burnPreventionCore.registerExecution({
    id: executionId,
    type: 'listener',
    name: `Firebase Listener: ${options.description || options.id}`,
    frequency: 0, // Listeners don't have a fixed frequency
    lastExecution: Date.now(),
    executionCount: 0,
    averageExecutionTime: 0,
    isRunning: true,
    criticality: options.criticality || 'normal',
    owner: options.owner || 'system',
    canPause: options.criticality !== 'critical',
    canThrottle: false, // Listeners can't be throttled, only paused
  });

  // Function to start listening
  const startListening = () => {
    if (isActive) return;

    console.log(`[FirebaseListener] 🔥 Starting listener: ${options.description || options.id}`);
    isActive = true;

    unsubscribe = onSnapshot(
      ref as any, // Type assertion to handle both Query and DocumentReference
      (snapshot) => {
        const startTime = Date.now();
        lastSnapshot = snapshot;

        // Check if should process (even if paused, store snapshot for later)
        const shouldProcess = burnPreventionCore.shouldExecute(executionId);
        
        if (shouldProcess) {
          try {
            onNext(snapshot);
          } catch (error) {
            console.error(`[FirebaseListener] Error in ${options.id}:`, error);
            if (onError) onError(error as Error);
          }
        } else {
          console.log(`[FirebaseListener] ⏸️ Buffering snapshot for ${options.id} (paused)`);
        }

        const duration = Date.now() - startTime;
        burnPreventionCore.recordExecution(executionId, duration);
      },
      (error) => {
        console.error(`[FirebaseListener] Error in ${options.id}:`, error);
        if (onError) onError(error);
      }
    );
  };

  // Function to stop listening
  const stopListening = () => {
    if (!isActive) return;

    console.log(`[FirebaseListener] 🛑 Stopping listener: ${options.description || options.id}`);
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    isActive = false;
  };

  // Start initially
  startListening();

  // Monitor control state
  const controlCheckInterval = setInterval(() => {
    const state = burnPreventionCore.getControlState(executionId);
    
    if (state?.isPaused && isActive) {
      // Pause listener to save resources
      stopListening();
    } else if (!state?.isPaused && !isActive) {
      // Resume listener
      startListening();
      
      // If we have a buffered snapshot, process it
      if (lastSnapshot) {
        console.log(`[FirebaseListener] 📦 Processing buffered snapshot for ${options.id}`);
        try {
          onNext(lastSnapshot);
        } catch (error) {
          console.error(`[FirebaseListener] Error processing buffered snapshot:`, error);
        }
        lastSnapshot = null;
      }
    }
  }, 20000); // Check every 20 seconds

  // Return cleanup function
  return () => {
    clearInterval(controlCheckInterval);
    stopListening();
    burnPreventionCore.unregisterExecution(executionId);
  };
}

/**
 * Helper to create burn-prevention aware admin listeners
 */
export function observeAdminData<T>(
  ref: Query<T> | DocumentReference<T>,
  id: string,
  description: string,
  onNext: (snapshot: any) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return observeWithBurnPrevention(
    ref,
    {
      id,
      criticality: 'high',
      owner: 'admin',
      description,
    },
    onNext,
    onError
  );
}

/**
 * Helper to create burn-prevention aware visitor listeners
 */
export function observeVisitorData<T>(
  ref: Query<T> | DocumentReference<T>,
  id: string,
  description: string,
  onNext: (snapshot: any) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return observeWithBurnPrevention(
    ref,
    {
      id,
      criticality: 'normal',
      owner: 'visitor',
      description,
    },
    onNext,
    onError
  );
}

/**
 * Helper for critical system listeners (never pause)
 */
export function observeCriticalData<T>(
  ref: Query<T> | DocumentReference<T>,
  id: string,
  description: string,
  onNext: (snapshot: any) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return observeWithBurnPrevention(
    ref,
    {
      id,
      criticality: 'critical',
      owner: 'system',
      description,
    },
    onNext,
    onError
  );
}

console.log('[FirebaseListener] ✅ Burn Prevention Firebase Adapter loaded');
