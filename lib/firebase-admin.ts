import { initializeApp, cert, getApps, getApp, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let db: Firestore | null = null;
let isInitialized = false;
let initializationError: Error | null = null;

interface ServiceAccountData {
  project_id: string;
  private_key: string;
  client_email: string;
  [key: string]: any;
}

interface InitializationResult {
  db: Firestore | null;
  error: Error | null;
}

function initializeFirebaseAdmin(): InitializationResult {
  if (isInitialized) {
    return { db, error: initializationError };
  }

  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!raw) {
      const error = new Error("❌ FIREBASE_SERVICE_ACCOUNT_KEY is not defined in environment variables");
      console.warn("⚠️ Firebase Admin not initialized:", error.message);
      console.warn("💡 This will cause API endpoints that require Firebase Admin to return 404 errors");
      console.warn("🔧 To fix: Set FIREBASE_SERVICE_ACCOUNT_KEY environment variable with your Firebase service account JSON");
      
      initializationError = error;
      isInitialized = true;
      return { db: null, error };
    }

    let serviceAccount: ServiceAccountData;
    try {
      serviceAccount = JSON.parse(raw) as ServiceAccountData;
    } catch (parseError) {
      const error = new Error("❌ Invalid JSON in FIREBASE_SERVICE_ACCOUNT_KEY");
      console.error("❌ Failed to parse Firebase service account JSON:", parseError);
      initializationError = error;
      isInitialized = true;
      return { db: null, error };
    }

    // ✅ Unescape private_key (convert \\n → \n)
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
    }

    // Validate required fields
    const requiredFields: (keyof ServiceAccountData)[] = ['project_id', 'private_key', 'client_email'];
    const missingFields = requiredFields.filter(field => !serviceAccount[field]);
    
    if (missingFields.length > 0) {
      const error = new Error(`❌ Missing required fields in service account: ${missingFields.join(', ')}`);
      console.error(error.message);
      initializationError = error;
      isInitialized = true;
      return { db: null, error };
    }

    const app: App = getApps().length === 0
      ? initializeApp({ credential: cert(serviceAccount as any) })
      : getApp();

    db = getFirestore(app);
    console.log("✅ Firebase Admin initialized successfully");
    
    isInitialized = true;
    return { db, error: null };

  } catch (error) {
    console.error("❌ Firebase Admin initialization failed:", error);
    initializationError = error instanceof Error ? error : new Error(String(error));
    isInitialized = true;
    return { db: null, error: initializationError };
  }
}

// Initialize on module load
const { db: initializedDb, error } = initializeFirebaseAdmin();
db = initializedDb;

// Export both the db instance and a function to check initialization status
export { db };

export function isFirebaseAdminReady(): boolean {
  return db !== null && initializationError === null;
}

export function getFirebaseAdminError(): Error | null {
  return initializationError;
}

// Helper function for API routes to handle missing Firebase Admin
export function requireFirebaseAdmin(): Firestore {
  if (!isFirebaseAdminReady()) {
    const error = getFirebaseAdminError();
    throw new Error(
      error?.message || "Firebase Admin is not properly configured"
    );
  }
  return db!; // We know db is not null due to isFirebaseAdminReady() check
}