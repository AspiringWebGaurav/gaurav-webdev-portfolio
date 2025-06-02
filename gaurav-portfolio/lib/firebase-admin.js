import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

const app = !getApps().length
  ? initializeApp({
      credential: cert(serviceAccount),
    })
  : getApps()[0];

const db = getFirestore(app);

export { db };
