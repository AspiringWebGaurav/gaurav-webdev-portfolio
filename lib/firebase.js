// lib/firebase.js

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { logger } from "../utils/secureLogger.ts";

// Load Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 🔍 Secure logging of Firebase config (hides sensitive data)
logger.firebaseInfo("🔥 Firebase client config loaded", firebaseConfig);

// 🚨 Check for missing critical fields
const missingKeys = Object.entries(firebaseConfig)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingKeys.length > 0) {
  logger.error("❌ Firebase config is missing required keys", { missingKeys });
  throw new Error(
    `🔥 Firebase initialization failed: Missing env vars -> ${missingKeys.join(
      ", "
    )}`
  );
}

// ✅ Initialize app safely
let app;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  logger.info("✅ Firebase app initialized");
} catch (err) {
  logger.error("❌ Firebase initialization error", err);
  throw err;
}

// ✅ Get Firestore instance
let db;
try {
  db = getFirestore(app);
  logger.info("✅ Firestore initialized");
} catch (err) {
  logger.error("❌ Firestore initialization failed", err);
  throw err;
}

// ✅ Get Storage instance
let storage;
try {
  storage = getStorage(app);
  logger.info("✅ Firebase Storage initialized");
} catch (err) {
  logger.error("❌ Firebase Storage initialization failed", err);
  throw err;
}

// Q&A System Collections and Helpers - Basic implementation for JS compatibility
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
} from "firebase/firestore";

/**
 * Firestore collection references
 */
export const directQuestionsCollection = collection(db, "directQuestions");

/**
 * Add a new direct question to Firestore
 */
export async function addDirectQuestion(visitorUuid, questionData) {
  try {
    const docRef = await addDoc(directQuestionsCollection, {
      visitorUuid,
      question: questionData.question.trim(),
      status: 'unanswered',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      answeredAt: null,
      adminReply: null,
      unreadForVisitor: false,
      metadata: questionData.metadata
    });

    logger.info("✅ Direct question added", {
      questionId: docRef.id,
      visitorUuid
    });
    
    return docRef;
  } catch (error) {
    logger.error("❌ Failed to add direct question", error);
    throw error;
  }
}

/**
 * Get all questions for a specific visitor
 */
export async function getVisitorQuestions(visitorUuid) {
  try {
    const q = query(
      directQuestionsCollection,
      where("visitorUuid", "==", visitorUuid),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const questions = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      questions.push({
        id: doc.id,
        ...data
      });
    });

    // Filter out deleted or malformed questions
    const validQuestions = questions.filter(question => {
      return question &&
             question.id &&
             question.question &&
             question.status &&
             question.visitorUuid &&
             question.createdAt &&
             !question.isDeleted;
    });

    logger.info("✅ Visitor questions retrieved", {
      visitorUuid,
      count: validQuestions.length
    });

    return validQuestions;
  } catch (error) {
    logger.error("❌ Failed to get visitor questions", error);
    return []; // Return empty array instead of throwing
  }
}

/**
 * Mark questions as read by visitor
 */
export async function markQuestionsAsRead(questionIds) {
  if (questionIds.length === 0) return;

  try {
    const batch = writeBatch(db);

    questionIds.forEach(questionId => {
      const questionRef = doc(directQuestionsCollection, questionId);
      batch.update(questionRef, {
        unreadForVisitor: false,
        updatedAt: serverTimestamp()
      });
    });

    await batch.commit();

    logger.info("✅ Questions marked as read", {
      count: questionIds.length,
      questionIds
    });
  } catch (error) {
    logger.error("❌ Failed to mark questions as read", error);
    throw error;
  }
}

/**
 * Get visitor question statistics
 */
export async function getVisitorQuestionStats(visitorUuid) {
  try {
    const questions = await getVisitorQuestions(visitorUuid);
    
    const stats = {
      totalQuestions: questions.length,
      unanswered: questions.filter(q => q.status === 'unanswered').length,
      answered: questions.filter(q => q.status === 'answered').length,
      archived: questions.filter(q => q.status === 'archived').length,
      unread: questions.filter(q => q.unreadForVisitor).length,
      lastQuestionAt: questions.length > 0 ? questions[0].createdAt : null
    };

    logger.info("✅ Visitor stats calculated", { visitorUuid, stats });
    return stats;
  } catch (error) {
    logger.error("❌ Failed to get visitor question stats", error);
    
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
 * Set up real-time listener for visitor questions
 */
export function listenToVisitorQuestions(visitorUuid, callback, onError) {
  try {
    const q = query(
      directQuestionsCollection,
      where("visitorUuid", "==", visitorUuid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const questions = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          questions.push({
            id: doc.id,
            ...data
          });
        });

        // Filter out deleted or malformed questions
        const validQuestions = questions.filter(question => {
          return question &&
                 question.id &&
                 question.question &&
                 question.status &&
                 question.visitorUuid &&
                 question.createdAt &&
                 !question.isDeleted;
        });

        callback(validQuestions);
      },
      (error) => {
        logger.error("❌ Real-time listener error", error);
        
        const errorMessage = error.message || String(error);
        const isPermissionError = errorMessage.includes('permission-denied');
        
        if (!isPermissionError) {
          onError?.(error);
        } else {
          // For permission errors, call callback with empty array
          logger.info("🔒 Permission error in listener, calling callback with empty array");
          callback([]);
        }
      }
    );

    logger.info("✅ Real-time listener established", { visitorUuid });
    return unsubscribe;
  } catch (error) {
    logger.error("❌ Failed to setup real-time listener", error);
    
    // Return a no-op unsubscribe function instead of throwing
    return () => {
      logger.info("No-op unsubscribe called due to listener setup failure");
    };
  }
}

/**
 * Update question status and/or admin reply
 */
export async function updateQuestionStatus(questionId, updateData) {
  try {
    const questionRef = doc(directQuestionsCollection, questionId);
    const updatePayload = {
      ...updateData,
      updatedAt: serverTimestamp()
    };

    // If answering the question, set answeredAt timestamp
    if (updateData.adminReply && updateData.status === 'answered') {
      updatePayload.answeredAt = serverTimestamp();
      updatePayload.unreadForVisitor = true; // Mark as unread for visitor
    }

    await updateDoc(questionRef, updatePayload);

    logger.info("✅ Question status updated", {
      questionId,
      updateData
    });
  } catch (error) {
    logger.error("❌ Failed to update question status", error);
    throw error;
  }
}

export { db, app, storage };
