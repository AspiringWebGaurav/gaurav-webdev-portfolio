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

export { db, app, storage };
export type { Firestore, FirebaseApp, FirebaseStorage };