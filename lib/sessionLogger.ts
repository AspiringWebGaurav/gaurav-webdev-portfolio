import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Session Lifecycle Logger
 * Logs session events to Firestore for debugging and auditing
 */

const COLLECTION = 'sessionLogs';

export type SessionEventType = 
  | 'session_created'
  | 'session_retrieved'
  | 'session_updated'
  | 'session_deleted'
  | 'session_restored'
  | 'cookie_cleared'
  | 'cookie_set'
  | 'fingerprint_generated';

interface SessionLogData {
  eventType: SessionEventType;
  sessionId?: string;
  deviceFingerprint?: string;
  metadata?: Record<string, any>;
  userAgent?: string;
  timestamp: any;
}

export async function logSessionEvent(
  eventType: SessionEventType,
  sessionId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    // Only log in production or when explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_ENABLE_SESSION_LOGS) {
      console.log(`[SessionLog] ${eventType}:`, sessionId, metadata);
      return;
    }

    const logData: SessionLogData = {
      eventType,
      sessionId,
      metadata,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      timestamp: serverTimestamp(),
    };

    await addDoc(collection(db, COLLECTION), logData);
  } catch (error) {
    // Don't throw - logging should never break the app
    console.error('[SessionLog] Failed to log event:', error);
  }
}

export function logSessionEventSync(
  eventType: SessionEventType,
  sessionId?: string,
  metadata?: Record<string, any>
): void {
  // Non-blocking async call
  logSessionEvent(eventType, sessionId, metadata).catch(err => {
    console.error('[SessionLog] Background log failed:', err);
  });
}
