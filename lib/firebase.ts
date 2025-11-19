import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCMKuKgoWq7s_b_798pJq9QgGbHgUEy9kM",
  authDomain: "gaurav-portfolio-improved.firebaseapp.com",
  databaseURL: "https://gaurav-portfolio-improved-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "gaurav-portfolio-improved",
  storageBucket: "gaurav-portfolio-improved.firebasestorage.app",
  messagingSenderId: "761696179429",
  appId: "1:761696179429:web:8919d6a499c2e8f0d4b00c",
  measurementId: "G-WQKV3WPPD8",
};

function initApp() {
  try {
    if (!getApps().length) {
      const app = initializeApp(firebaseConfig);

      // Initialize Firestore with new cache API (no deprecation warning)
      if (typeof window !== "undefined") {
        initializeFirestore(app, {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
          }),
        });
      }

      return app;
    }
    return getApp();
  } catch (err) {
    throw err;
  }
}

const app = initApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const storage = getStorage(app);
