"use client";

import React, { useState } from "react";
import BrandLogo from "@/components/admin/BrandLogo";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { signInWithGoogle, devQuickLogin } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Sparkles, Shield, Zap, CheckCircle, AlertCircle } from "lucide-react";
import { showToast } from "@/lib/toast";
import LoginTransition from "@/components/admin/LoginTransition";
import LoginSuccessLoader from "@/components/admin/LoginSuccessLoader";
import TurnstileWidget from "@/components/TurnstileWidget";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";

export default function DesktopLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [devLoading, setDevLoading] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [devPassword, setDevPassword] = useState("");
  const [showSuccessLoader, setShowSuccessLoader] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const reduce = useReducedMotion();
  
  // Turnstile Captcha State
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaStatus, setCaptchaStatus] = useState<'loading' | 'success' | 'required' | 'error'>('loading');
  const [showCaptchaWidget, setShowCaptchaWidget] = useState(false);

  // Turnstile Captcha Handlers
  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
    setCaptchaStatus('success');
    setShowCaptchaWidget(false);
  };

  const handleCaptchaError = () => {
    setCaptchaStatus('error');
    setShowCaptchaWidget(true);
    showToast.error(
      "Bot verification failed. Please try again.",
      "Verification Error",
      { autoClose: 3000 }
    );
  };

  const handleCaptchaExpire = () => {
    setCaptchaToken(null);
    setCaptchaStatus('required');
    setShowCaptchaWidget(true);
  };

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
        // Only log in development mode to avoid console errors in production
        if (process.env.NODE_ENV === 'development') {
          console.error(err);
        }
        showToast.error(
          "Authentication failed. Please try again or contact support.",
          "Login Failed",
          { autoClose: 4000 }
        );
      }
      setLoading(false);
      setShowTransition(false);
    }
  };

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!devPassword.trim()) {
      return;
    }

    // Check captcha token for password login
    if (!captchaToken && captchaStatus !== 'error') {
      setCaptchaStatus('required');
      setShowCaptchaWidget(true);
      showToast.warning(
        "Please complete the bot verification to continue.",
        "Verification Required",
        { autoClose: 3000 }
      );
      return;
    }

    setDevLoading(true);
    try {
      // Perform dev login with encrypted payload using entered password
      const success = await devQuickLogin({ silent: true, password: devPassword });
      
      // Only proceed if login was successful
      if (!success) {
        setPasswordError(true);
        setDevLoading(false);
        setShowTransition(false);
        setShowSuccessLoader(false);
        
        // Show professional toast notification
        showToast.error(
          "Incorrect password. Please verify your credentials and try again.",
          "Login Failed",
          { autoClose: 4000 }
        );
        
        // Clear password field after showing error
        setTimeout(() => {
          setPasswordError(false);
          setDevPassword("");
        }, 3000);
        return;
      }
      
      // Show success loader
      setShowSuccessLoader(true);
      
      // Set flag for dashboard to show welcome message
      sessionStorage.setItem('justLoggedIn', 'true');
      
      // Start preloading dashboard in parallel (behind loader)
      router.prefetch("/admin/dashboard");
      
      // Wait 1.5 seconds for loader animation, then navigate
      setTimeout(() => {
        router.push("/admin/dashboard");
      }, 1500);
    } catch (err: any) {
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.error("Dev login failed:", err);
      }
      setPasswordError(true);
      setDevLoading(false);
      setShowTransition(false);
      setShowSuccessLoader(false);
      
      // Show professional toast notification
      showToast.error(
        "Incorrect password. Please verify your credentials and try again.",
        "Login Failed",
        { autoClose: 4000 }
      );
      
      // Clear password field after showing error
      setTimeout(() => {
        setPasswordError(false);
        setDevPassword("");
      }, 3000);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <>
      <AnimatePresence>
        {showTransition && <LoginTransition />}
      </AnimatePresence>
      
      <LoginSuccessLoader show={showSuccessLoader} />
      
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Branding Panel */}
        <div className="hidden lg:flex w-1/2 items-center justify-center bg-gradient-to-br from-sky-600 via-indigo-600 to-violet-700 p-12 relative overflow-hidden">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-sky-300 rounded-full blur-3xl"></div>
          </div>

          <motion.div
            className="max-w-lg text-white z-10"
            initial={reduce ? "show" : "hidden"}
            animate="show"
            variants={containerVariants}
          >
            <motion.div
              variants={itemVariants}
              className="flex items-center gap-4 mb-8"
            >
              <BrandLogo className="w-16 h-16" />
              <div>
                <h1 className="text-4xl font-bold tracking-tight">
                  Portfolio Admin
                </h1>
              </div>
            </motion.div>

            <motion.p
              variants={itemVariants}
              className="text-xl text-sky-50 mb-8 leading-relaxed"
            >
              A secure, minimal control panel designed exclusively for Gaurav's
              portfolio management.
            </motion.p>

            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-sky-200 mt-1 shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg">Secure Access</h3>
                  <p className="text-sky-100 text-sm">
                    Protected by Google OAuth with authorized user validation
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Zap className="w-6 h-6 text-sky-200 mt-1 shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg">Fast & Responsive</h3>
                  <p className="text-sky-100 text-sm">
                    Built with Next.js and optimized for performance
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Sparkles className="w-6 h-6 text-sky-200 mt-1 shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg">Modern Interface</h3>
                  <p className="text-sky-100 text-sm">
                    Clean design with dark mode and smooth animations
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Right Auth Panel */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-6 xl:p-8">
          <div className="w-full max-w-md">
            <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 lg:p-8 shadow-2xl border border-gray-700/50">
              <div className="text-center mb-6 lg:mb-8">
                <h2 className="text-2xl lg:text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-indigo-400">
                  Sign in to Admin
                </h2>
                <p className="text-sm text-gray-300">
                  Only authorized users may access
                </p>
              </div>

              <button
                onClick={handleGoogleSignIn}
                disabled={loading || devLoading}
                className="w-full flex items-center justify-center gap-3 px-4 lg:px-6 py-3.5 lg:py-4 bg-white hover:bg-gray-50 text-gray-800 rounded-xl font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] text-sm lg:text-base"
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

              {/* Admin Password Login */}
              <div className="relative my-6 lg:my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-gray-800/50 text-gray-400">
                    Or use password
                  </span>
                </div>
              </div>

              <form onSubmit={handleDevLogin} className="space-y-5">
                <div>
                  <input
                    type="password"
                    value={devPassword}
                    onChange={(e) => {
                      setDevPassword(e.target.value);
                      setPasswordError(false);
                    }}
                    placeholder="Enter admin password"
                    disabled={loading || devLoading}
                    className={`w-full px-4 py-3 lg:py-3 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm lg:text-base ${
                      passwordError
                        ? 'border-red-500 focus:ring-2 focus:ring-red-500 animate-shake'
                        : 'border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                    }`}
                  />
                </div>

                {/* Turnstile Widget - Shows when needed */}
                {showCaptchaWidget && (
                  <div className="flex flex-col items-center gap-3 p-3 lg:p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                    <div className="flex items-center gap-2 text-orange-400 text-xs lg:text-sm font-medium">
                      <AlertCircle className="w-4 h-4" />
                      <span>Bot Protection Required</span>
                    </div>
                    <div className="w-full flex justify-center">
                      <TurnstileWidget
                        siteKey={TURNSTILE_SITE_KEY}
                        onVerify={handleCaptchaVerify}
                        onError={handleCaptchaError}
                        onExpire={handleCaptchaExpire}
                        theme="dark"
                        size="normal"
                      />
                    </div>
                  </div>
                )}

                {/* Success Indicator */}
                {captchaStatus === 'success' && !showCaptchaWidget && (
                  <div className="flex items-center justify-center gap-2 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-xs lg:text-sm text-green-400 font-medium">Bot Protection Verified</span>
                  </div>
                )}

                {/* Hidden Turnstile for invisible auto-verification */}
                {!showCaptchaWidget && captchaStatus === 'loading' && (
                  <div className="hidden">
                    <TurnstileWidget
                      siteKey={TURNSTILE_SITE_KEY}
                      onVerify={handleCaptchaVerify}
                      onError={handleCaptchaError}
                      onExpire={handleCaptchaExpire}
                      theme="dark"
                      size="invisible"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || devLoading || !devPassword.trim()}
                  className="w-full flex items-center justify-center gap-3 px-4 lg:px-6 py-3 lg:py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] text-sm lg:text-base"
                >
                  <Shield className="w-5 h-5" />
                  {devLoading ? "Signing in..." : "Sign in with Password"}
                </button>
              </form>

              <div className="mt-6 lg:mt-8 text-center">
                <p className="text-xs text-gray-400">
                  By signing in, you agree to the terms of this personal-use
                  application.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Dark Footer */}
      <footer className="w-full border-t border-gray-700/50 bg-gray-900/50 backdrop-blur-lg">
        <div className="w-full px-6 py-3">
          <div className="flex items-center justify-between w-full text-gray-400 text-xs">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-gray-500" />
              <span>
                © {new Date().getFullYear()} Portfolio Admin — Personal use only
              </span>
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
