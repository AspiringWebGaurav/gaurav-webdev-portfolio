"use client";

import React, { useState } from "react";
import BrandLogo from "@/components/admin/BrandLogo";
import { signInWithGoogle } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import LoginTransition from "@/components/admin/LoginTransition";

export default function MobileLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showTransition, setShowTransition] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      // Show transition immediately
      setShowTransition(true);
      
      // Perform authentication with silent mode (no toast)
      await signInWithGoogle({ silent: true });
      
      // Set flag for dashboard to show welcome message
      sessionStorage.setItem('justLoggedIn', 'true');
      
      // Navigate immediately - no waiting
      router.push("/admin/dashboard");
    } catch (err: any) {
      // Silently handle popup closed by user
      const errorCode = err?.code || '';
      if (errorCode !== 'auth/popup-closed-by-user' && !err?.message?.includes('popup-closed-by-user')) {
        console.error(err);
      }
      setLoading(false);
      setShowTransition(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {showTransition && <LoginTransition />}
      </AnimatePresence>
      
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <BrandLogo className="w-16 h-16" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Portfolio Admin
            </h1>
            <p className="text-sm text-gray-400">
              Sign in to access your admin panel
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-gray-700/50">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-1 bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-indigo-400">
                Welcome Back
              </h2>
              <p className="text-xs text-gray-300">
                Only authorized users may access
              </p>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white hover:bg-gray-50 text-gray-800 rounded-xl font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {loading ? "Signing in..." : "Continue with Google"}
            </button>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-400">
                By signing in, you agree to the terms of this personal-use
                application.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-gray-700/50 bg-gray-900/50 backdrop-blur-lg">
        <div className="w-full px-6 py-3">
          <div className="flex flex-col items-center gap-2 text-gray-400 text-xs">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-gray-500" />
              <span>© {new Date().getFullYear()} Portfolio Admin</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span>Secure & Private</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}
