// lib/firebase.ts

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { smartLogger } from "@/utils/smartLogger";

// Load Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebase config loaded - browser-only detailed logging
smartLogger.firebase.init("🔥 Firebase client config loaded", firebaseConfig);

// 🚨 Check for missing critical fields
const missingKeys = Object.entries(firebaseConfig)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingKeys.length > 0) {
  smartLogger.firebase.error("❌ Firebase config is missing required keys", { missingKeys });
  throw new Error(
    `🔥 Firebase initialization failed: Missing env vars -> ${missingKeys.join(
      ", "
    )}`
  );
}

// ✅ Initialize app safely
let app: FirebaseApp;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  smartLogger.firebase.init("✅ Firebase app initialized");
} catch (err) {
  smartLogger.firebase.error("❌ Firebase initialization error", err);
  throw err;
}

// ✅ Get Firestore instance
let db: Firestore;
try {
  db = getFirestore(app);
  smartLogger.firebase.init("✅ Firestore initialized");
} catch (err) {
  smartLogger.firebase.error("❌ Firestore initialization failed", err);
  throw err;
}

// ✅ Get Storage instance
let storage: FirebaseStorage;
try {
  storage = getStorage(app);
  smartLogger.firebase.init("✅ Firebase Storage initialized");
} catch (err) {
  smartLogger.firebase.error("❌ Firebase Storage initialization failed", err);
  throw err;
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
export const directQuestionsCollection = collection(db, "directQuestions");

/**
 * Get typed collection reference for direct questions
 */
export function getDirectQuestionsCollection(): CollectionReference {
  return directQuestionsCollection;
}

/**
 * Add a new direct question to Firestore
 */
export async function addDirectQuestion(
  visitorUuid: string,
  questionData: CreateDirectQuestionData
): Promise<DocumentReference> {
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
 * Get all questions for a specific visitor
 */
export async function getVisitorQuestions(visitorUuid: string): Promise<DirectQuestion[]> {
  try {
    const q = query(
      directQuestionsCollection,
      where("visitorUuid", "==", visitorUuid),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const questions: DirectQuestion[] = [];

    querySnapshot.forEach((doc) => {
      questions.push({
        id: doc.id,
        ...doc.data()
      } as DirectQuestion);
    });

    smartLogger.firebase.debug("✅ Visitor questions retrieved", {
      visitorUuid,
      count: questions.length
    });

    return questions;
  } catch (error) {
    smartLogger.firebase.error("❌ Failed to get visitor questions", error);
    throw error;
  }
}

/**
 * Update question status and/or admin reply
 */
export async function updateQuestionStatus(
  questionId: string,
  updateData: UpdateQuestionData
): Promise<void> {
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
 * Get visitor question statistics
 */
export async function getVisitorQuestionStats(visitorUuid: string): Promise<VisitorQuestionStats> {
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

    return stats;
  } catch (error) {
    smartLogger.firebase.error("❌ Failed to get visitor question stats", error);
    throw error;
  }
}

/**
 * Set up real-time listener for visitor questions
 */
export function listenToVisitorQuestions(
  visitorUuid: string,
  callback: (questions: DirectQuestion[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  try {
    const q = query(
      directQuestionsCollection,
      where("visitorUuid", "==", visitorUuid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const questions: DirectQuestion[] = [];
        querySnapshot.forEach((doc) => {
          questions.push({
            id: doc.id,
            ...doc.data()
          } as DirectQuestion);
        });
        callback(questions);
      },
      (error) => {
        smartLogger.firebase.error("❌ Real-time listener error", error);
        onError?.(error);
      }
    );

    smartLogger.firebase.debug("✅ Real-time listener established", { visitorUuid });
    return unsubscribe;
  } catch (error) {
    smartLogger.firebase.error("❌ Failed to setup real-time listener", error);
    throw error;
  }
}

export { db, app, storage };
export type { Firestore, FirebaseApp, FirebaseStorage };