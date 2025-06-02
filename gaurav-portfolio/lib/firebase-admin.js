import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!raw) {
  throw new Error("❌ FIREBASE_SERVICE_ACCOUNT_KEY is not defined in env");
}

const serviceAccount = JSON.parse(raw);

// ✅ Unescape private_key (convert \\n → \n)
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");

const app =
  getApps().length === 0
    ? initializeApp({ credential: cert(serviceAccount) })
    : getApp();

const db = getFirestore(app);

export { db };
