"use client";

import type { User } from "firebase/auth";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithCustomToken,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut as fbSignOut,
  type UserCredential,
} from "firebase/auth";
import { auth } from "./firebase";
import { showToast } from "./toast";
import { createAuthNotification } from "./notificationHelpers";
import { encryptDevAuth, generateDevAuthChallenge } from "./devAuthCrypto";

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

  await fbSignOut(auth);
  
  // Redirect to login page after logout
  if (typeof window !== 'undefined') {
    window.location.href = '/admin/login';
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

/**
 * Development one-click login
 * HIGH PRIORITY: Secure encrypted authentication for fast dev access
 */
export async function devQuickLogin(options?: { silent?: boolean; password?: string }): Promise<boolean> {
  try {
    // Generate challenge (timestamp + random)
    const challenge = generateDevAuthChallenge();
    const password = options?.password || "";
    
    if (!password) {
      throw new Error("Password is required");
    }
    
    // Create payload: "password:timestamp:random"
    const payload = `${password}:${challenge}`;
    console.log("Client: Creating payload...");
    console.log("Client: Password length:", password.length);
    console.log("Client: Challenge:", challenge.substring(0, 20) + "...");
    
    // Encrypt the payload
    const encryptedPayload = await encryptDevAuth(payload);
    console.log("Client: Encrypted payload:", encryptedPayload.substring(0, 40) + "...");
    
    // Make secure API call
    const response = await fetch("/api/auth/dev-login", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-Dev-Auth": "encrypted"
      },
      body: JSON.stringify({ encryptedPayload }),
    });

    if (!response.ok) {
      let error: any = {};
      try {
        error = await response.json();
      } catch (e) {
        // If JSON parsing fails, create error from status
        error = { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      // User-friendly error messages
      let errorMessage = "Authentication failed";
      if (error.error === "Invalid credentials") {
        errorMessage = "Incorrect password. Please check and try again.";
      } else if (error.error === "Challenge expired or invalid") {
        errorMessage = "Request expired. Please try again.";
      } else if (error.error) {
        errorMessage = error.error;
      } else if (response.status === 401) {
        errorMessage = "Incorrect password. Please check and try again.";
      } else if (response.status === 503) {
        errorMessage = "Development login not available. Please contact administrator.";
      }
      
      if (!options?.silent) {
        showToast.error(errorMessage, "Login Failed", { autoClose: 4000 });
      }
      
      // Return false instead of throwing to avoid console errors
      return false;
    }

    const data = await response.json();
    
    if (!data.success || !data.customToken) {
      const errorMessage = "Authentication unsuccessful. Please try again.";
      if (!options?.silent) {
        showToast.error(errorMessage, "Login Failed", { autoClose: 4000 });
      }
      // Return false instead of throwing to avoid console errors
      return false;
    }

    console.log("Client: Got custom token, signing in to Firebase...");

    // Sign in to Firebase with custom token
    const credential = await signInWithCustomToken(auth, data.customToken);
    const user = credential.user;

    console.log("Client: Firebase sign-in successful");
    console.log("Client: User UID:", user.uid);
    console.log("Client: User Email:", user.email);

    // Wait a moment for auth state to stabilize
    await new Promise(resolve => setTimeout(resolve, 100));

    // Create login notification
    if (!options?.silent) {
      await createAuthNotification("login", user);
    } else {
      createAuthNotification("login", user, { silent: true }).catch(err => 
        console.error("Failed to create login notification:", err)
      );
    }

    return true;
  } catch (err: unknown) {
    const message = (err as Error).message || "Authentication failed. Please try again.";
    
    // Only show toast if not already shown above
    const isNetworkError = message.includes("fetch") || message.includes("network");
    if (!options?.silent && isNetworkError) {
      showToast.error("Network error. Please check your connection.", "Connection Error");
    }
    
    console.error("Dev login error:", err);
    throw err;
  }
}
