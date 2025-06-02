// lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Load Firebase config from environment
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_APP_ID,
};

// 🔍 Debug log full config
console.log("🔥 Firebase client config loaded:", firebaseConfig);

// 🚨 Check for missing critical fields
const missingKeys = Object.entries(firebaseConfig)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingKeys.length > 0) {
  console.error("❌ Firebase config is missing required keys:", missingKeys);
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
  console.log("✅ Firebase app initialized");
} catch (err) {
  console.error("❌ Firebase initialization error:", err);
  throw err;
}

// ✅ Get Firestore instance
let db;
try {
  db = getFirestore(app);
  console.log("✅ Firestore initialized");
} catch (err) {
  console.error("❌ Firestore initialization failed:", err);
  throw err;
}

export { db };
