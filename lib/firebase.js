// lib/firebase.js

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { logger } from "../utils/secureLogger";

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

export { db, app, storage };
