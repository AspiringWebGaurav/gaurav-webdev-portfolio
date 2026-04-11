"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Shield, CheckCircle, AlertCircle } from "lucide-react";
import { AnimatedCharactersLoginLayout } from "@/components/ui/AnimatedCharactersLoginLayout";
import { signInWithGoogle } from "@/lib/auth";
import { secureDevLogin } from "@/lib/secureAuth";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";
import TurnstileWidget from "@/components/TurnstileWidget";
import LoginTransition from "@/components/admin/LoginTransition";
import LoginSuccessLoader from "@/components/admin/LoginSuccessLoader";
import { AnimatePresence } from "motion/react";
import { abusePolicyManager } from "@/lib/abusePolicyManager";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [devPassword, setDevPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [devLoading, setDevLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [showSuccessLoader, setShowSuccessLoader] = useState(false);
  
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaStatus, setCaptchaStatus] = useState<'loading' | 'success' | 'required' | 'error'>('loading');
  const [showCaptchaWidget, setShowCaptchaWidget] = useState(false);

  // Check for abuse policy on mount
  useEffect(() => {
    const isBanned = abusePolicyManager.isBanned();
    const state = abusePolicyManager.getState();
    
    console.log('[Login Mount] Checking abuse policy:', {
      isBanned,
      failedAttempts: state.failedAttempts,
      banExpiresAt: state.banExpiresAt ? new Date(state.banExpiresAt).toISOString() : null,
      remainingTime: abusePolicyManager.getRemainingTime(),
    });
    
    if (isBanned) {
      console.log('[Login] Abuse Policy active, redirecting...');
      router.replace('/abuse-policy-active');
    }
  }, [router]);

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
    setCaptchaStatus('success');
    setShowCaptchaWidget(false);
  };

  const handleCaptchaError = () => {
    setCaptchaStatus('error');
    setShowCaptchaWidget(true);
    showToast.error("Bot verification failed. Please try again.", "Verification Error", { autoClose: 3000 });
  };

  const handleCaptchaExpire = () => {
    setCaptchaToken(null);
    setCaptchaStatus('required');
    setShowCaptchaWidget(true);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setShowTransition(true);
    
    try {
      await signInWithGoogle({ silent: true });
      
      // Success: Reset abuse policy counter
      abusePolicyManager.recordSuccessfulLogin();
      
      console.log("✅ Google login successful");
      setShowTransition(false);
      setShowSuccessLoader(true);
      sessionStorage.setItem('justLoggedIn', 'true');
      router.prefetch("/admin/dashboard");
      
      setTimeout(() => {
        router.push("/admin/dashboard");
      }, 1500);
    } catch (err: any) {
      const errorCode = err?.code || '';
      
      // Only track as failed attempt if it's an actual auth failure (not user cancellation)
      if (errorCode !== 'auth/popup-closed-by-user' && !err?.message?.includes('popup-closed-by-user')) {
        // Record failed attempt
        const abusePolicyTriggered = abusePolicyManager.recordFailedAttempt();
        
        if (abusePolicyTriggered) {
          console.log('[Login] Abuse Policy activated after Google OAuth failure');
          setLoading(true);
          setShowTransition(true);
          showToast.error("Too many failed attempts. Temporary ban activated. Redirecting...", "Access Restricted", { autoClose: 5000 });
          setTimeout(() => {
            router.replace('/abuse-policy-active');
          }, 5000);
          return;
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.error(err);
        }
        showToast.error("Authentication failed. Please try again or contact support.", "Login Failed", { autoClose: 4000 });
      }
      setLoading(false);
      setShowTransition(false);
    }
  };

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devPassword.trim()) return;

    if (!captchaToken && captchaStatus !== 'error') {
      setCaptchaStatus('required');
      setShowCaptchaWidget(true);
      showToast.warning("Please complete the bot verification to continue.", "Verification Required", { autoClose: 3000 });
      return;
    }

    setDevLoading(true);
    setPasswordError(false);
    
    try {
      console.log("🔒 Starting enterprise-grade secure login...");
      const result = await secureDevLogin(devPassword, captchaToken);
      
      if (!result.success) {
        // Record failed attempt
        console.log('[Login] Password login failed, recording attempt...');
        const abusePolicyTriggered = abusePolicyManager.recordFailedAttempt();
        
        console.log('[Login] After recording:', {
          triggered: abusePolicyTriggered,
          state: abusePolicyManager.getState(),
        });
        
        setPasswordError(true);
        setDevLoading(false);
        
        if (abusePolicyTriggered) {
          console.log('[Login] Abuse Policy activated after password failure');
          setShowTransition(true);
          showToast.error("Too many failed attempts. Temporary ban activated. Redirecting...", "Access Restricted", { autoClose: 5000 });
          setTimeout(() => {
            router.replace('/abuse-policy-active');
          }, 5000);
          return;
        }
        
        showToast.error(result.error || "Authentication failed. Please verify your credentials.", "Login Failed", { autoClose: 4000 });
        
        setTimeout(() => {
          setPasswordError(false);
          setDevPassword("");
          setCaptchaToken(null);
          setCaptchaStatus('required');
          setShowCaptchaWidget(true);
        }, 800);
        return;
      }
      
      // Success: Reset abuse policy counter
      abusePolicyManager.recordSuccessfulLogin();
      
      console.log("✅ Admin login successful");
      setShowTransition(true);
      setShowSuccessLoader(true);
      sessionStorage.setItem('justLoggedIn', 'true');
      router.prefetch("/admin/dashboard");
      
      setTimeout(() => {
        router.push("/admin/dashboard");
      }, 1500);
    } catch (err) {
      console.error("Admin login error:", err);
      
      // Record failed attempt on exception
      const abusePolicyTriggered = abusePolicyManager.recordFailedAttempt();
      
      setPasswordError(true);
      setDevLoading(false);
      
      if (abusePolicyTriggered) {
        console.log('[Login] Abuse Policy activated after login exception');
        setShowTransition(true);
        showToast.error("Too many failed attempts. Temporary ban activated. Redirecting...", "Access Restricted", { autoClose: 5000 });
        setTimeout(() => {
          router.replace('/abuse-policy-active');
        }, 5000);
        return;
      }
      
      showToast.error("Authentication failed. Please check your connection and try again.", "Login Failed", { autoClose: 4000 });
      
      setTimeout(() => {
        setPasswordError(false);
        setDevPassword("");
        setCaptchaToken(null);
        setCaptchaStatus('required');
        setShowCaptchaWidget(true);
      }, 800);
    }
  };

  return (
    <>
      <AnimatePresence>
        {showTransition && <LoginTransition />}
      </AnimatePresence>
      
      <LoginSuccessLoader show={showSuccessLoader} />

      <AnimatedCharactersLoginLayout
        passwordLength={devPassword.length}
        showPassword={showPassword}
        brandName="Gaurav's Portfolio Admin Panel"
        showFooterLinks={true}
        privacyPolicyLink="/privacy"
        termsOfServiceLink="/terms"
        contactLink="/#contact"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-gray-900 dark:text-white">Sign in to Admin</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Only authorized users may access</p>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading || devLoading}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
        >
          <Mail className="size-5" />
          {loading ? "Signing in..." : "Continue with Google"}
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">Or use password</span>
          </div>
        </div>

        <form onSubmit={handleDevLogin} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-900 dark:text-gray-100">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter admin password"
                value={devPassword}
                onChange={(e) => {
                  setDevPassword(e.target.value);
                  setPasswordError(false);
                }}
                disabled={loading || devLoading}
                className={`h-12 pr-10 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${
                  passwordError ? 'border-red-500 focus:ring-2 focus:ring-red-500 animate-shake' : 'border-gray-300 dark:border-gray-700 focus:border-primary'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
          </div>

          {showCaptchaWidget && (
            <div className="flex flex-col items-center gap-3 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 text-sm font-medium">
                <AlertCircle className="size-4" />
                <span>Bot Protection Required</span>
              </div>
              <TurnstileWidget
                siteKey={TURNSTILE_SITE_KEY}
                onVerify={handleCaptchaVerify}
                onError={handleCaptchaError}
                onExpire={handleCaptchaExpire}
                theme="dark"
                size="normal"
              />
            </div>
          )}

          {captchaStatus === 'success' && !showCaptchaWidget && (
            <div className="flex items-center justify-center gap-2 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
              <CheckCircle className="size-4 text-green-600 dark:text-green-400" />
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">Bot Protection Verified</span>
            </div>
          )}

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

          <Button 
            type="submit" 
            disabled={loading || devLoading || !devPassword.trim()}
            className="w-full h-12 text-base font-medium flex items-center justify-center gap-2" 
            size="lg"
          >
            <Shield className="size-5" />
            {devLoading ? "Signing in..." : "Sign in with Password"}
          </Button>
        </form>
      </AnimatedCharactersLoginLayout>
    </>
  );
}
