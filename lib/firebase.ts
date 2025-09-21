// lib/firebase.ts

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { smartLogger } from "@/utils/smartLogger";

// Environment variable validation utility
function validateEnvironmentVariables() {
  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ [Environment] Missing critical variables:', missing);
    return { isValid: false, missing };
  }
  
  return { isValid: true, missing: [] };
}

// Validate environment variables
const envValidation = validateEnvironmentVariables();

// Load Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebase availability flag
const isFirebaseAvailable = envValidation.isValid;

// Initialize Firebase instances
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let initializationError: Error | null = null;

if (isFirebaseAvailable) {
  try {
    // Firebase config loaded - browser-only detailed logging
    smartLogger.firebase.init("🔥 Firebase client config loaded", firebaseConfig);

    // ✅ Initialize app safely
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    smartLogger.firebase.init("✅ Firebase app initialized");

    // ✅ Get Firestore instance
    db = getFirestore(app);
    smartLogger.firebase.init("✅ Firestore initialized");

    // ✅ Get Storage instance
    storage = getStorage(app);
    smartLogger.firebase.init("✅ Firebase Storage initialized");
    
  } catch (err) {
    initializationError = err instanceof Error ? err : new Error(String(err));
    smartLogger.firebase.error("❌ Firebase initialization error", err);
    
    // In production, don't throw - just log and use fallbacks
    if (process.env.NODE_ENV !== 'production') {
      throw err;
    } else {
      console.warn("⚠️  Firebase initialization failed in production, using API fallbacks");
    }
  }
} else {
  const errorMessage = `🔥 Firebase initialization failed: Missing env vars -> ${envValidation.missing.join(", ")}`;
  smartLogger.firebase.error("❌ Firebase config is missing required keys", { 
    missing: envValidation.missing,
    mode: process.env.NODE_ENV 
  });
  
  if (process.env.NODE_ENV === 'production') {
    console.warn(`⚠️  Firebase client disabled due to missing env vars. API fallbacks will be used.`);
  } else {
    throw new Error(errorMessage);
  }
}

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
 * Firestore collection references
 */
export const directQuestionsCollection = db ? collection(db, "directQuestions") : null;

/**
 * Get typed collection reference for direct questions
 */
export function getDirectQuestionsCollection(): CollectionReference | null {
  return directQuestionsCollection;
}

/**
 * Add a new direct question to Firestore
 */
export async function addDirectQuestion(
  visitorUuid: string,
  questionData: CreateDirectQuestionData
): Promise<DocumentReference> {
  if (!db || !directQuestionsCollection) {
    throw new Error('Firebase client unavailable - using API fallbacks');
  }
  
  try {
    const docRef = await addDoc(directQuestionsCollection, {
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
  if (!db || !directQuestionsCollection) {
    throw new Error('Firebase client unavailable - using API fallbacks');
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
          directQuestionsCollection!,
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
  if (!db || !directQuestionsCollection) {
    throw new Error('Firebase client unavailable - using API fallbacks');
  }
  
  try {
    const questionRef = doc(directQuestionsCollection, questionId);
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
  if (!db || !directQuestionsCollection) {
    throw new Error('Firebase client unavailable - using API fallbacks');
  }
  
  if (questionIds.length === 0) return;

  try {
    const batch = writeBatch(db);

    questionIds.forEach(questionId => {
      const questionRef = doc(directQuestionsCollection!, questionId);
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
  if (!db || !directQuestionsCollection) {
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
  if (!db || !directQuestionsCollection) {
    console.warn('Firebase client unavailable, using polling fallback');
    
    // Return polling fallback
    const pollInterval = setInterval(async () => {
      try {
        const questions = await getVisitorQuestions(visitorUuid);
        callback(questions);
      } catch (error) {
        console.warn('Polling fallback error:', error);
        onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    }, 10000);
    
    return () => {
      clearInterval(pollInterval);
      console.log('Polling fallback unsubscribed');
    };
  }
  
  try {
    const q = query(
      directQuestionsCollection,
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