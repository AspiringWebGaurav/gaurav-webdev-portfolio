// lib/firebase.ts
// Enhanced Firebase initialization with comprehensive error handling for Vercel production

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { smartLogger } from "@/utils/smartLogger";

// Enhanced environment variable validation with runtime checks
function validateEnvironmentVariables(): {
  isValid: boolean;
  missing: string[];
  warnings: string[];
  hasMinimalConfig: boolean;
} {
  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
  ];

  const criticalVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  const missingCritical = criticalVars.filter(varName => !process.env[varName]);
  const warnings: string[] = [];
  
  // Check for empty values (not just undefined)
  const emptyVars = requiredVars.filter(varName => {
    const value = process.env[varName];
    return !value || value.trim() === '' || value === 'undefined' || value === 'null';
  });

  if (emptyVars.length > 0) {
    warnings.push(`Empty Firebase environment variables detected: ${emptyVars.join(', ')}`);
  }

  const isValid = missing.length === 0 && emptyVars.length === 0;
  const hasMinimalConfig = missingCritical.length === 0;
  
  // Only log in development environment
  if (process.env.NODE_ENV === 'development') {
    if (missing.length > 0) {
      console.error('❌ [Firebase Environment] Missing critical variables:', missing);
    }
    
    if (warnings.length > 0) {
      console.warn('⚠️ [Firebase Environment] Warnings:', warnings);
    }
  }
  
  return {
    isValid,
    missing,
    warnings,
    hasMinimalConfig
  };
}

// Runtime Firebase status checker
class FirebaseHealthMonitor {
  private static instance: FirebaseHealthMonitor;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private lastHealthCheck: Date | null = null;
  private consecutiveFailures = 0;
  private maxFailures = 3;

  static getInstance(): FirebaseHealthMonitor {
    if (!FirebaseHealthMonitor.instance) {
      FirebaseHealthMonitor.instance = new FirebaseHealthMonitor();
    }
    return FirebaseHealthMonitor.instance;
  }

  startHealthChecks(db: Firestore | null): void {
    if (typeof window === 'undefined' || !db) return;

    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck(db);
    }, 30000); // Check every 30 seconds
  }

  private async performHealthCheck(db: Firestore): Promise<void> {
    try {
      // Simple connectivity test - just try to get the app instance
      const app = db.app;
      if (!app) throw new Error('Firebase app instance not available');
      
      this.consecutiveFailures = 0;
      this.lastHealthCheck = new Date();
      
      // Only log success in development
      if (process.env.NODE_ENV === 'development') {
        smartLogger.firebase.debug('Firebase health check passed');
      }
    } catch (error) {
      this.consecutiveFailures++;
      smartLogger.firebase.error(`Firebase health check failed (${this.consecutiveFailures}/${this.maxFailures})`, error);
      
      if (this.consecutiveFailures >= this.maxFailures) {
        this.triggerFallbackMode();
      }
    }
  }

  private triggerFallbackMode(): void {
    smartLogger.firebase.error('Firebase health checks failing, triggering fallback mode');
    
    // Emit custom event for components to switch to API mode
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('firebase-fallback-mode', {
        detail: {
          reason: 'health_check_failure',
          failures: this.consecutiveFailures,
          timestamp: new Date().toISOString()
        }
      }));
    }
  }

  cleanup(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  getHealthStatus(): {
    isHealthy: boolean;
    lastCheck: Date | null;
    consecutiveFailures: number;
  } {
    return {
      isHealthy: this.consecutiveFailures < this.maxFailures,
      lastCheck: this.lastHealthCheck,
      consecutiveFailures: this.consecutiveFailures
    };
  }
}

// Validate environment variables with enhanced checks
const envValidation = validateEnvironmentVariables();

// Load Firebase config from environment variables with fallbacks
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// Firebase availability flags
const isFirebaseAvailable = envValidation.isValid;
const hasMinimalFirebaseConfig = envValidation.hasMinimalConfig;

// Enhanced Firebase initialization with multiple fallback strategies
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let initializationError: Error | null = null;
let initializationAttempts = 0;
const maxInitializationAttempts = 3;

// Firebase initialization with retry logic
async function initializeFirebaseWithRetry(): Promise<{
  success: boolean;
  app: FirebaseApp | null;
  db: Firestore | null;
  storage: FirebaseStorage | null;
  error: Error | null;
}> {
  for (let attempt = 1; attempt <= maxInitializationAttempts; attempt++) {
    try {
      initializationAttempts = attempt;
      
      smartLogger.firebase.init(`🔥 Firebase initialization attempt ${attempt}/${maxInitializationAttempts}`, {
        hasConfig: isFirebaseAvailable,
        hasMinimal: hasMinimalFirebaseConfig,
        environment: process.env.NODE_ENV
      });

      // Initialize app safely with retry logic
      const currentApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      smartLogger.firebase.init("✅ Firebase app initialized");

      // Get Firestore instance with connection retry
      const firestoreInstance = getFirestore(currentApp);
      
      // Connect to emulator in development if specified
      if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === 'true') {
        try {
          connectFirestoreEmulator(firestoreInstance, 'localhost', 8080);
          smartLogger.firebase.init("🧪 Connected to Firestore emulator");
        } catch (emulatorError) {
          smartLogger.firebase.debug("Firestore emulator connection failed or already connected");
        }
      }
      
      smartLogger.firebase.init("✅ Firestore initialized");

      // Get Storage instance
      const storageInstance = getStorage(currentApp);
      smartLogger.firebase.init("✅ Firebase Storage initialized");

      // Start health monitoring
      const healthMonitor = FirebaseHealthMonitor.getInstance();
      healthMonitor.startHealthChecks(firestoreInstance);
      
      return {
        success: true,
        app: currentApp,
        db: firestoreInstance,
        storage: storageInstance,
        error: null
      };
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      initializationError = error;
      
      smartLogger.firebase.error(`❌ Firebase initialization attempt ${attempt} failed`, {
        error: error.message,
        code: (error as any)?.code,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
      
      // If this is the last attempt, handle the failure
      if (attempt === maxInitializationAttempts) {
        // Return partial success for API fallbacks without console noise in production
        return {
          success: false,
          app: null,
          db: null,
          storage: null,
          error
        };
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
    }
  }
  
  return {
    success: false,
    app: null,
    db: null,
    storage: null,
    error: initializationError
  };
}

// Synchronous Firebase initialization with comprehensive error handling
function initializeFirebaseSync(): {
  app: FirebaseApp | null;
  db: Firestore | null;
  storage: FirebaseStorage | null;
  error: Error | null;
} {
  if (!isFirebaseAvailable && !hasMinimalFirebaseConfig) {
    const errorMessage = `🔥 Firebase initialization skipped: Missing env vars -> ${envValidation.missing.join(", ")}`;
    const error = new Error(errorMessage);
    
    smartLogger.firebase.error("❌ Firebase config is missing required keys", {
      missing: envValidation.missing,
      warnings: envValidation.warnings,
      mode: process.env.NODE_ENV
    });
    
    // In production, silently use API fallbacks
    if (process.env.NODE_ENV === 'production') {
      return { app: null, db: null, storage: null, error };
    } else {
      throw error;
    }
  }

  try {
    smartLogger.firebase.init(`🔥 Firebase initialization starting`, {
      hasConfig: isFirebaseAvailable,
      hasMinimal: hasMinimalFirebaseConfig,
      environment: process.env.NODE_ENV
    });

    // Initialize app safely
    const currentApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    smartLogger.firebase.init("✅ Firebase app initialized");

    // Get Firestore instance
    const firestoreInstance = getFirestore(currentApp);
    
    // Connect to emulator in development if specified
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === 'true') {
      try {
        connectFirestoreEmulator(firestoreInstance, 'localhost', 8080);
        smartLogger.firebase.init("🧪 Connected to Firestore emulator");
      } catch (emulatorError) {
        smartLogger.firebase.debug("Firestore emulator connection failed or already connected");
      }
    }
    
    smartLogger.firebase.init("✅ Firestore initialized");

    // Get Storage instance
    const storageInstance = getStorage(currentApp);
    smartLogger.firebase.init("✅ Firebase Storage initialized");

    // Start health monitoring (async, non-blocking)
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        const healthMonitor = FirebaseHealthMonitor.getInstance();
        healthMonitor.startHealthChecks(firestoreInstance);
      }, 1000); // Start health checks after 1 second
    }

    smartLogger.firebase.init("🎉 Firebase fully initialized and ready");
    
    return {
      app: currentApp,
      db: firestoreInstance,
      storage: storageInstance,
      error: null
    };
    
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    
    smartLogger.firebase.error(`❌ Firebase initialization failed`, {
      error: error.message,
      code: (error as any)?.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    // In production, silently use API fallbacks
    if (process.env.NODE_ENV === 'production') {
      return { app: null, db: null, storage: null, error };
    } else {
      throw error;
    }
  }
}

// Initialize Firebase synchronously
const initResult = initializeFirebaseSync();
app = initResult.app;
db = initResult.db;
storage = initResult.storage;
initializationError = initResult.error;

// Q&A System Collections and Helpers
import {
  collection,
  doc,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  writeBatch,
  serverTimestamp,
  onSnapshot,
  type DocumentReference,
  type CollectionReference,
  type Query,
  type Unsubscribe
} from "firebase/firestore";

import type {
  DirectQuestion,
  CreateDirectQuestionData,
  UpdateQuestionData,
  QuestionStatus,
  VisitorQuestionStats
} from "./types";

/**
 * Safe Firestore collection references with null checks and error handling
 */
export const getDirectQuestionsCollectionSafely = (): CollectionReference | null => {
  if (!db) {
    smartLogger.firebase.debug("❌ Database instance not available for directQuestions collection");
    return null;
  }
  
  try {
    return collection(db, "directQuestions");
  } catch (error) {
    smartLogger.firebase.error("❌ Failed to get directQuestions collection", error);
    return null;
  }
};

/**
 * Get typed collection reference for direct questions with null safety
 */
export function getDirectQuestionsCollection(): CollectionReference | null {
  return getDirectQuestionsCollectionSafely();
}

// Legacy export for backward compatibility (but always null-safe)
export const directQuestionsCollection = getDirectQuestionsCollectionSafely();

/**
 * Add a new direct question to Firestore
 */
export async function addDirectQuestion(
  visitorUuid: string,
  questionData: CreateDirectQuestionData
): Promise<DocumentReference> {
  if (!db) {
    throw new Error('Firebase client unavailable - using API fallbacks');
  }
  
  const questionsCollection = getDirectQuestionsCollectionSafely();
  if (!questionsCollection) {
    throw new Error('Firebase collection unavailable - using API fallbacks');
  }
  
  try {
    const docRef = await addDoc(questionsCollection, {
      visitorUuid,
      question: questionData.question.trim(),
      status: 'unanswered' as QuestionStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      answeredAt: null,
      adminReply: null,
      unreadForVisitor: false,
      metadata: questionData.metadata
    });

    smartLogger.firebase.debug("✅ Direct question added", {
      questionId: docRef.id,
      visitorUuid
    });
    
    return docRef;
  } catch (error) {
    smartLogger.firebase.error("❌ Failed to add direct question", error);
    throw error;
  }
}

/**
 * Get all questions for a specific visitor with timeout and enhanced error handling
 */
export async function getVisitorQuestions(visitorUuid: string): Promise<DirectQuestion[]> {
  if (!db) {
    throw new Error('Firebase client unavailable - using API fallbacks');
  }
  
  const questionsCollection = getDirectQuestionsCollectionSafely();
  if (!questionsCollection) {
    throw new Error('Firebase collection unavailable - using API fallbacks');
  }
  
  const timeoutPromise = new Promise<DirectQuestion[]>((_, reject) => {
    setTimeout(() => reject(new Error('Firebase query timeout')), 10000); // 10 second timeout
  });

  const fetchPromise = async (): Promise<DirectQuestion[]> => {
    let retryCount = 0;
    const maxRetries = 2; // Reduced retries for faster response
    const retryDelay = 1000;

    while (retryCount < maxRetries) {
      try {
        const q = query(
          questionsCollection,
          where("visitorUuid", "==", visitorUuid),
          orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        const rawQuestions: DirectQuestion[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          rawQuestions.push({
            id: doc.id,
            ...data
          } as DirectQuestion);
        });

        // Filter out deleted or malformed questions
        const validQuestions = rawQuestions.filter(question => {
          const isValid = question &&
                         question.id &&
                         question.question &&
                         question.status &&
                         question.visitorUuid &&
                         question.createdAt &&
                         !question.isDeleted;
          
          return isValid;
        });

        smartLogger.firebase.debug("✅ Visitor questions retrieved", {
          visitorUuid,
          count: validQuestions.length
        });

        return validQuestions;
      } catch (error) {
        retryCount++;
        smartLogger.firebase.error(`❌ Failed to get visitor questions (attempt ${retryCount}/${maxRetries})`, error);
        
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Don't retry certain types of errors
        const isPermissionError = errorMessage.includes('permission-denied') || errorMessage.includes('unauthorized');
        const isNotFoundError = errorMessage.includes('not-found') || errorMessage.includes('collection does not exist');
        
        if (isPermissionError || isNotFoundError) {
          return []; // Return empty array instead of throwing
        }
        
        if (retryCount >= maxRetries) {
          return []; // Return empty array instead of throwing
        }
        
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, retryCount - 1)));
      }
    }

    return []; // Fallback
  };

  try {
    return await Promise.race([fetchPromise(), timeoutPromise]);
  } catch (error) {
    smartLogger.firebase.error("Firebase query timed out or failed", error);
    return []; // Always return empty array instead of throwing
  }
}

/**
 * Update question status and/or admin reply
 */
export async function updateQuestionStatus(
  questionId: string,
  updateData: UpdateQuestionData
): Promise<void> {
  if (!db) {
    throw new Error('Firebase client unavailable - using API fallbacks');
  }
  
  const questionsCollection = getDirectQuestionsCollectionSafely();
  if (!questionsCollection) {
    throw new Error('Firebase collection unavailable - using API fallbacks');
  }
  
  try {
    const questionRef = doc(questionsCollection, questionId);
    const updatePayload: any = {
      ...updateData,
      updatedAt: serverTimestamp()
    };

    // If answering the question, set answeredAt timestamp
    if (updateData.adminReply && updateData.status === 'answered') {
      updatePayload.answeredAt = serverTimestamp();
      updatePayload.unreadForVisitor = true; // Mark as unread for visitor
    }

    await updateDoc(questionRef, updatePayload);

    smartLogger.firebase.debug("✅ Question status updated", {
      questionId,
      updateData
    });
  } catch (error) {
    smartLogger.firebase.error("❌ Failed to update question status", error);
    throw error;
  }
}

/**
 * Mark questions as read by visitor
 */
export async function markQuestionsAsRead(questionIds: string[]): Promise<void> {
  if (!db) {
    throw new Error('Firebase client unavailable - using API fallbacks');
  }
  
  const questionsCollection = getDirectQuestionsCollectionSafely();
  if (!questionsCollection) {
    throw new Error('Firebase collection unavailable - using API fallbacks');
  }
  
  if (questionIds.length === 0) return;

  try {
    const batch = writeBatch(db);

    questionIds.forEach(questionId => {
      const questionRef = doc(questionsCollection, questionId);
      batch.update(questionRef, {
        unreadForVisitor: false,
        updatedAt: serverTimestamp()
      });
    });

    await batch.commit();

    smartLogger.firebase.debug("✅ Questions marked as read", {
      count: questionIds.length,
      questionIds
    });
  } catch (error) {
    smartLogger.firebase.error("❌ Failed to mark questions as read", error);
    throw error;
  }
}

/**
 * Get visitor question statistics with timeout and error handling
 */
export async function getVisitorQuestionStats(visitorUuid: string): Promise<VisitorQuestionStats> {
  if (!db) {
    throw new Error('Firebase client unavailable - using API fallbacks');
  }
  
  const timeoutPromise = new Promise<VisitorQuestionStats>((_, reject) => {
    setTimeout(() => reject(new Error('Stats calculation timeout')), 8000); // 8 second timeout
  });

  const statsPromise = async (): Promise<VisitorQuestionStats> => {
    try {
      const questions = await getVisitorQuestions(visitorUuid);
      
      const stats: VisitorQuestionStats = {
        totalQuestions: questions.length,
        unanswered: questions.filter(q => q.status === 'unanswered').length,
        answered: questions.filter(q => q.status === 'answered').length,
        archived: questions.filter(q => q.status === 'archived').length,
        unread: questions.filter(q => q.unreadForVisitor).length,
        lastQuestionAt: questions.length > 0 ? questions[0].createdAt : null
      };

      smartLogger.firebase.debug("✅ Visitor stats calculated", { visitorUuid, stats });
      return stats;
    } catch (error) {
      smartLogger.firebase.error("❌ Failed to get visitor question stats", error);
      throw error;
    }
  };

  try {
    return await Promise.race([statsPromise(), timeoutPromise]);
  } catch (error) {
    smartLogger.firebase.error("Stats calculation timed out or failed", error);
    
    // Always return safe fallback stats instead of throwing
    return {
      totalQuestions: 0,
      unanswered: 0,
      answered: 0,
      archived: 0,
      unread: 0,
      lastQuestionAt: null
    };
  }
}

/**
 * Set up real-time listener for visitor questions with enhanced error handling
 */
export function listenToVisitorQuestions(
  visitorUuid: string,
  callback: (questions: DirectQuestion[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!db) {
    // Silently use polling fallback in production
    const pollInterval = setInterval(async () => {
      try {
        const questions = await getVisitorQuestions(visitorUuid);
        callback(questions);
      } catch (error) {
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.warn('Polling fallback error:', error);
        }
        onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    }, 10000);
    
    return () => {
      clearInterval(pollInterval);
      if (process.env.NODE_ENV === 'development') {
        console.log('Polling fallback unsubscribed');
      }
    };
  }
  
  const questionsCollection = getDirectQuestionsCollectionSafely();
  if (!questionsCollection) {
    // Silently use polling fallback in production
    const pollInterval = setInterval(async () => {
      try {
        const questions = await getVisitorQuestions(visitorUuid);
        callback(questions);
      } catch (error) {
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.warn('Polling fallback error:', error);
        }
        onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    }, 10000);
    
    return () => {
      clearInterval(pollInterval);
      if (process.env.NODE_ENV === 'development') {
        console.log('Polling fallback unsubscribed');
      }
    };
  }
  
  try {
    const q = query(
      questionsCollection,
      where("visitorUuid", "==", visitorUuid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const rawQuestions: DirectQuestion[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          rawQuestions.push({
            id: doc.id,
            ...data
          } as DirectQuestion);
        });

        // Filter out deleted or malformed questions in real-time updates
        const validQuestions = rawQuestions.filter(question => {
          const isValid = question &&
                         question.id &&
                         question.question &&
                         question.status &&
                         question.visitorUuid &&
                         question.createdAt &&
                         !question.isDeleted; // Filter out soft-deleted questions
          
          if (!isValid) {
            smartLogger.firebase.debug("❌ Filtered out invalid real-time question", {
              questionId: question?.id,
              isDeleted: !!question?.isDeleted
            });
          }
          
          return isValid;
        });

        if (validQuestions.length !== rawQuestions.length) {
          smartLogger.firebase.debug("🧹 Filtered real-time questions", {
            total: rawQuestions.length,
            valid: validQuestions.length
          });
        }

        callback(validQuestions);
      },
      (error) => {
        smartLogger.firebase.error("❌ Real-time listener error", error);
        
        // Don't call onError for permission errors as they might be temporary
        const errorMessage = error.message || String(error);
        const isPermissionError = errorMessage.includes('permission-denied');
        
        if (!isPermissionError) {
          onError?.(error);
        } else {
          // For permission errors, call callback with empty array
          smartLogger.firebase.debug("🔒 Permission error in listener, calling callback with empty array");
          callback([]);
        }
      }
    );

    smartLogger.firebase.debug("✅ Real-time listener established", { visitorUuid });
    return unsubscribe;
  } catch (error) {
    smartLogger.firebase.error("❌ Failed to setup real-time listener", error);
    
    // Return a no-op unsubscribe function instead of throwing
    return () => {
      smartLogger.firebase.debug("No-op unsubscribe called due to listener setup failure");
    };
  }
}

// Export database and app instances
export { db, app, storage };
export type { Firestore, FirebaseApp, FirebaseStorage };

// Note: Individual functions are already exported above

// Create a consolidated Firebase module object for dynamic imports
export const firebaseModule = {
  // Database instances
  db,
  app,
  storage,
  
  // Question management functions
  addDirectQuestion,
  getVisitorQuestions,
  markQuestionsAsRead,
  listenToVisitorQuestions,
  getVisitorQuestionStats,
  updateQuestionStatus,
  getDirectQuestionsCollection,
  
  // Collection references
  directQuestionsCollection,
  
  // Status information
  isFirebaseAvailable,
  initializationError
};

// Default export for easier dynamic imports
export default firebaseModule;