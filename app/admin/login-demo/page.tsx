"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Moon, Sun, Shield, CheckCircle, AlertCircle } from "lucide-react";
import { AnimatedCharactersLoginLayout } from "@/components/ui/AnimatedCharactersLoginLayout";
import { useTheme } from "next-themes";
import { signInWithGoogle } from "@/lib/auth";
import { secureDevLogin } from "@/lib/secureAuth";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";
import TurnstileWidget from "@/components/TurnstileWidget";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";

export default function LoginDemoPage() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [devPassword, setDevPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [devLoading, setDevLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaStatus, setCaptchaStatus] = useState<'loading' | 'success' | 'required' | 'error'>('loading');
  const [showCaptchaWidget, setShowCaptchaWidget] = useState(false);

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
    try {
      await signInWithGoogle({ silent: true });
      sessionStorage.setItem('justLoggedIn', 'true');
      router.push("/admin/dashboard");
    } catch (err: any) {
      const errorCode = err?.code || '';
      if (errorCode !== 'auth/popup-closed-by-user' && !err?.message?.includes('popup-closed-by-user')) {
        showToast.error("Authentication failed. Please try again or contact support.", "Login Failed", { autoClose: 4000 });
      }
      setLoading(false);
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
      const result = await secureDevLogin(devPassword, captchaToken);
      
      if (!result.success) {
        setPasswordError(true);
        setDevLoading(false);
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
      
      sessionStorage.setItem('justLoggedIn', 'true');
      router.prefetch("/admin/dashboard");
      setTimeout(() => router.push("/admin/dashboard"), 1500);
    } catch (err) {
      console.error("Admin login error:", err);
      setPasswordError(true);
      setDevLoading(false);
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
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="size-5 text-yellow-500" /> : <Moon className="size-5 text-gray-700" />}
        </button>
      </div>

      <AnimatedCharactersLoginLayout
        passwordLength={devPassword.length}
        showPassword={showPassword}
        brandName="Gaurav's Portfolio Admin Panel"
        showFooterLinks={true}
        privacyPolicyLink="/privacy"
        termsOfServiceLink="/terms"
        contactLink="/admin/login-demo/contact"
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
                theme={theme as "light" | "dark"}
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
                theme={theme as "light" | "dark"}
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
