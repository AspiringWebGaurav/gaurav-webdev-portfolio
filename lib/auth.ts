"use client";

import type { User } from "firebase/auth";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut as fbSignOut,
  type UserCredential,
} from "firebase/auth";
import { auth } from "./firebase";
import { showToast } from "./toast";
import { createAuthNotification } from "./notificationHelpers";

export { auth };

const ALLOWED_EMAIL = "gauravpatil9262@gmail.com";
const ALLOWED_UID = "cgwqNNfMfPNmsAHJfgWGcRSsIRG2";

// Google Sign-In
export async function signInWithGoogle(options?: { 
  silent?: boolean 
}): Promise<UserCredential> {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: "select_account",
      login_hint: ALLOWED_EMAIL,
    });

    const cred = await signInWithPopup(auth, provider);
    const user = cred.user;

    // Check if user is authorized
    if (
      user.email?.toLowerCase() !== ALLOWED_EMAIL ||
      user.uid !== ALLOWED_UID
    ) {
      await fbSignOut(auth);
      showToast.error(
        "Access restricted to authorized users only. Please contact the owner.",
        "Unauthorized Access"
      );
      throw new Error("Unauthorized user.");
    }

    // Get ID token and create server-side session
    const idToken = await user.getIdToken();
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      throw new Error("Failed to create session");
    }

    // Create login notification silently (no toast during login flow)
    if (!options?.silent) {
      await createAuthNotification("login", user);
    } else {
      // Create notification in background without showing toast
      createAuthNotification("login", user, { silent: true }).catch(err => 
        console.error("Failed to create login notification:", err)
      );
    }

    return cred;
  } catch (err: unknown) {
    const errorCode = (err as any)?.code || '';
    const message = (err as Error).message || "Google Sign-In failed.";
    
    // Silently handle popup closed by user
    if (errorCode === 'auth/popup-closed-by-user' || message.includes("popup-closed-by-user")) {
      throw err;
    }
    
    if (!message.includes("popup-closed-by-user")) {
      showToast.error(message, "Sign-In Error");
    }
    throw err;
  }
}

export async function signIn(
  email: string,
  password: string,
  options?: { silent?: boolean }
): Promise<UserCredential> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const user = cred.user;
    if (
      user.email?.toLowerCase() !== ALLOWED_EMAIL ||
      user.uid !== ALLOWED_UID
    ) {
      await fbSignOut(auth);
      showToast.error("Access restricted. Please contact the owner.", "Unauthorized");
      throw new Error("Access restricted.");
    }

    // Get ID token and create server-side session
    const idToken = await user.getIdToken();
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      throw new Error("Failed to create session");
    }

    // Create login notification silently (no toast during login flow)
    if (!options?.silent) {
      await createAuthNotification("login", user);
    } else {
      // Create notification in background without showing toast
      createAuthNotification("login", user, { silent: true }).catch(err => 
        console.error("Failed to create login notification:", err)
      );
    }
    
    return cred;
  } catch (err: unknown) {
    const message = (err as Error).message || "Authentication failed.";
    showToast.error(message, "Authentication Error");
    throw err;
  }
}

export async function signOut(): Promise<void> {
  const user = auth.currentUser;
  if (user) {
    await createAuthNotification("logout", user);
  }

  // Destroy server-side session
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch (error) {
    console.error("Failed to destroy server session:", error);
  }

  // Clear code gate clearance
  try {
    const { generateVisitorId } = await import('./deviceFingerprint');
    const visitorId = generateVisitorId();
    await fetch("/api/code-gate/clear-session", { 
      method: "POST",
      headers: {
        'x-visitor-id': visitorId
      }
    });
    
    // Clear sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('code_gate_cleared');
      sessionStorage.removeItem('code_gate_timestamp');
    }
  } catch (error) {
    console.error("Failed to clear code gate session:", error);
  }

  await fbSignOut(auth);
  
  // Redirect to code gate page after logout
  if (typeof window !== 'undefined') {
    window.location.href = '/admin/code-gate';
  }
}

export function initAuthListener(cb: (user: User | null) => void) {
  const unsub = onAuthStateChanged(auth, (user) => {
    if (!user) {
      cb(null);
      return;
    }
    // enforce email gate
    if (
      user.email?.toLowerCase() !== ALLOWED_EMAIL ||
      user.uid !== ALLOWED_UID
    ) {
      void fbSignOut(auth).then(() => {
        showToast.error("Access restricted. Please contact the owner.", "Unauthorized");
        cb(null);
      });
      return;
    }
    cb(user);
  });

  return unsub;
}
