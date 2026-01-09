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
 * PRODUCTION-READY Admin Password Login
 * ======================================
 * ✅ Encrypted authentication with AES-256
 * ✅ 3-layer retry logic with exponential backoff
 * ✅ Graceful error handling
 * ✅ Network resilience
 * ✅ Works in development, preview, and production
 */
export async function devQuickLogin(options?: { silent?: boolean; password?: string }): Promise<boolean> {
  const MAX_RETRIES = 3;
  let lastError: any = null;

  // Retry loop with exponential backoff
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Generate challenge (timestamp + random)
      const challenge = generateDevAuthChallenge();
      const password = options?.password || "";
      
      if (!password) {
        throw new Error("Password is required");
      }
      
      // Create payload: "password:timestamp:random"
      const payload = `${password}:${challenge}`;
      console.log(`Client: Login attempt ${attempt}/${MAX_RETRIES}`);
      console.log("Client: Password length:", password.length);
      
      // Encrypt the payload
      const encryptedPayload = await encryptDevAuth(payload);
      
      // Make secure API call with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
      
      try {
        const response = await fetch("/api/auth/dev-login", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "X-Admin-Auth": "encrypted",
            "X-Attempt": String(attempt)
          },
          body: JSON.stringify({ encryptedPayload }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          let error: any = {};
          try {
            error = await response.json();
          } catch (e) {
            error = { 
              error: `HTTP ${response.status}: ${response.statusText}`,
              code: "HTTP_ERROR"
            };
          }
          
          // Handle retryable errors (NOT auth failures - those are immediate)
          if (error.retryable && error.code !== "AUTH_FAILED" && attempt < MAX_RETRIES) {
            console.log(`⚠️ Retryable error, attempt ${attempt}/${MAX_RETRIES}`);
            lastError = error;
            // Exponential backoff: 1s, 2s, 4s
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
            continue; // Retry
          }
          
          // User-friendly error messages
          let errorMessage = "Authentication failed";
          if (error.code === "AUTH_FAILED" || error.error === "Invalid credentials") {
            errorMessage = "Incorrect password. Please check and try again.";
          } else if (error.code === "CHALLENGE_EXPIRED") {
            errorMessage = "Request expired. Please try again.";
          } else if (error.code === "NO_PASSWORD_CONFIG") {
            errorMessage = "Admin authentication not configured. Please contact administrator.";
          } else if (error.suggestion) {
            errorMessage = error.suggestion;
          } else if (response.status === 503) {
            errorMessage = "Service temporarily unavailable. Please try again.";
          }
          
          if (!options?.silent) {
            showToast.error(errorMessage, "Login Failed", { autoClose: 4000 });
          }
          
          return false;
        }

        const data = await response.json();
        
        if (!data.success || !data.customToken) {
          const errorMessage = "Authentication unsuccessful. Please try again.";
          if (!options?.silent) {
            showToast.error(errorMessage, "Login Failed", { autoClose: 4000 });
          }
          return false;
        }

        console.log("✅ Authentication successful");
        console.log(`Environment: ${data.metadata?.environment || "unknown"}`);

        // Sign in to Firebase with custom token
        const credential = await signInWithCustomToken(auth, data.customToken);
        const user = credential.user;

        console.log("✅ Firebase sign-in successful");

        // Wait for auth state to stabilize
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
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        // Handle network errors with retry
        if (fetchError.name === "AbortError") {
          console.error(`⚠️ Request timeout (attempt ${attempt}/${MAX_RETRIES})`);
          lastError = { message: "Request timed out", code: "TIMEOUT" };
        } else {
          console.error(`⚠️ Network error (attempt ${attempt}/${MAX_RETRIES}):`, fetchError);
          lastError = fetchError;
        }
        
        if (attempt < MAX_RETRIES) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
          continue; // Retry
        }
      }
    } catch (err: unknown) {
      console.error(`❌ Login error (attempt ${attempt}/${MAX_RETRIES}):`, err);
      lastError = err;
      
      if (attempt < MAX_RETRIES) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
        continue; // Retry
      }
    }
  }
  
  // All retries failed
  const isNetworkError = lastError?.message?.includes("fetch") || 
                         lastError?.message?.includes("network") ||
                         lastError?.code === "TIMEOUT";
  
  if (!options?.silent) {
    if (isNetworkError) {
      showToast.error(
        "Network error. Please check your connection and try again.",
        "Connection Error",
        { autoClose: 5000 }
      );
    } else {
      showToast.error(
        "Authentication failed after multiple attempts. Please try again later.",
        "Login Failed",
        { autoClose: 5000 }
      );
    }
  }
  
  return false;
}
