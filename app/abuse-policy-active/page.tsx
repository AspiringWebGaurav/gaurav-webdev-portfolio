"use client";

/**
 * ABUSE POLICY PAGE
 * 
 * Temporary ban page shown when Abuse Policy is activated.
 * Activates after 3 consecutive failed login attempts.
 * Ban duration: Exactly 2 minutes.
 * 
 * Features:
 * - Live countdown timer (persists across reloads)
 * - Auto-redirect when ban expires
 * - Link to Abuse Policy documentation
 * - Non-scrollable, single viewport design matching ban page
 */

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAbusePolicyStatus } from '@/contexts/AbusePolicyContext';
import Logo from '@/components/Logo';
import { ShieldAlert, Clock, FileText, AlertCircle, Mail } from 'lucide-react';
import ContactFormModal from '@/components/ContactFormModal';

export default function AbusePolicyPage() {
  const router = useRouter();
  const { state, remainingTime, isActive } = useAbusePolicyStatus();
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showContactModal, setShowContactModal] = useState(false);
  const hasRedirected = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-redirect when ban expires
  useEffect(() => {
    if (!isActive && mounted && !hasRedirected.current && state.failedAttempts > 0) {
      console.log('[Abuse Policy Page] Ban expired, redirecting to login...');
      hasRedirected.current = true;
      
      setTimeout(() => {
        router.replace('/admin/login');
      }, 500);
    }
  }, [isActive, mounted, state.failedAttempts, router]);

  // Redirect if accessed without active ban
  useEffect(() => {
    if (mounted && !isActive && state.failedAttempts === 0 && !hasRedirected.current) {
      console.log('[Abuse Policy Page] No active ban, redirecting to login...');
      hasRedirected.current = true;
      router.replace('/admin/login');
    }
  }, [mounted, isActive, state.failedAttempts, router]);

  // Format remaining time as MM:SS
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage (inverted for countdown)
  const progressPercentage = state.banExpiresAt && state.banStartTime
    ? Math.max(0, Math.min(100, ((Date.now() - state.banStartTime) / (state.banExpiresAt - state.banStartTime)) * 100))
    : 0;

  if (!mounted) {
    return null;
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-black via-slate-900 to-black text-white overflow-hidden flex flex-col">
      {/* Ambient background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Main content container - Full screen */}
      <div className="relative flex-1 flex flex-col px-8 py-4 min-h-0">
        
        {/* Top branding bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Logo variant="small" />
            <div>
              <h2 className="text-white font-semibold text-sm font-mono">
                <span className="text-orange-500">&gt;</span> abuse_policy_active
              </h2>
              <p className="text-slate-400 text-xs font-mono">automated_security_response</p>
            </div>
          </div>
          
          {/* Center clock and date */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4">
            <div className="flex items-center gap-2 text-base text-slate-200">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className="font-mono font-medium" suppressHydrationWarning>
                {currentTime.toLocaleTimeString()}
              </span>
            </div>
            <div className="h-4 w-px bg-slate-600"></div>
            <div className="flex items-center gap-2 text-base text-slate-300">
              <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium" suppressHydrationWarning>
                {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-3 bg-orange-500/20 px-4 py-2 rounded-lg border border-orange-500/30">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-orange-300">Temporary Ban</span>
            </div>
            <div className="h-4 w-px bg-orange-500/30"></div>
            <span className="text-xs text-orange-400">Auto-expires</span>
          </div>
        </div>
        
        {/* Header section */}
        <div className="bg-gradient-to-r from-orange-900/40 to-red-800/40 border border-orange-700/30 rounded-xl p-5 mt-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-orange-500/20 rounded-xl flex items-center justify-center border border-orange-500/30">
                <ShieldAlert className="w-7 h-7 text-orange-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                  Abuse Policy Activated
                </h1>
                <p className="text-slate-300 text-sm mt-0.5">Temporary access restriction in effect</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-orange-400" />
              <span className="text-orange-400 font-medium text-sm">
                Security Lock Active
              </span>
            </div>
          </div>
        </div>

        {/* Main countdown section - Centered */}
        <div className="flex-1 flex items-center justify-center min-h-0">
          {isActive ? (
            <div className="text-center space-y-8">
              {/* Timer Label */}
              <div className="flex items-center justify-center gap-3">
                <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-slate-300 text-sm font-medium uppercase tracking-wider">
                  Access Restored In
                </span>
                <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
              </div>
              
              {/* Countdown Timer */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 blur-3xl"></div>
                <div className="relative text-9xl font-bold tabular-nums tracking-tight font-mono">
                  <span className="bg-gradient-to-r from-orange-400 via-red-400 to-orange-400 bg-clip-text text-transparent">
                    {formatTime(remainingTime)}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-2xl mx-auto">
                <div className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <div 
                    className="absolute inset-0 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 transition-all duration-1000 ease-linear"
                    style={{ 
                      width: `${progressPercentage}%`,
                      boxShadow: '0 0 20px rgba(251, 146, 60, 0.5)'
                    }}
                  />
                </div>
              </div>

              {/* Info Cards */}
              <div className="flex items-center justify-center gap-4 mt-8">
                <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-xl px-6 py-3">
                  <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Duration</div>
                  <div className="text-white font-semibold text-lg">2 Minutes</div>
                </div>
                <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-xl px-6 py-3">
                  <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Type</div>
                  <div className="text-white font-semibold text-lg">Temporary</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center gap-3 py-4 px-8 bg-green-500/10 border border-green-500/30 rounded-xl">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 font-medium text-lg">Access Restored - Redirecting...</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions - Bottom */}
        <div className="border-t border-slate-700/30 pt-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-slate-500 text-xs">
              Access will be automatically restored when the timer reaches zero
            </div>
            <div className="flex gap-3">
              <a
                href="/admin/abuse-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-600/50 text-slate-300 hover:text-white rounded-lg font-medium transition-all backdrop-blur-sm text-sm"
              >
                <FileText className="w-4 h-4" />
                Read Policy
              </a>
              <button
                onClick={() => setShowContactModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:text-blue-300 rounded-lg font-medium transition-all backdrop-blur-sm text-sm"
              >
                <Mail className="w-4 h-4" />
                Contact Support
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Contact Form Modal */}
      <ContactFormModal 
        isOpen={showContactModal} 
        onClose={() => setShowContactModal(false)} 
      />
    </div>
  );
}
