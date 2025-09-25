/**
 * EntryGateModal Types & UI Components
 * Segment 1: Types, configurations, and reusable UI components
 */

"use client";

import React from "react";
import { TurnstileWidgetState, EntryGateState, TurnstileVerificationResponse } from "@/lib/types/turnstile";

// Performance and timeout configurations
export const CONFIG = {
  SCRIPT_LOAD_TIMEOUT: process.env.NODE_ENV === "development" ? 3000 : 5000,
  WIDGET_INIT_TIMEOUT: process.env.NODE_ENV === "development" ? 2000 : 3000,
  VERIFICATION_TIMEOUT: process.env.NODE_ENV === "development" ? 8000 : 10000,
  MAX_RETRIES: 3,
  RETRY_DELAY_BASE: 1000,
  HEARTBEAT_DURATION: 2000,
  TRANSITION_DELAY: 300,
  SUCCESS_ANIMATION_DELAY: 1500,
  DEV_BYPASS_ENABLED: process.env.NODE_ENV === "development",
  
  // Cloudflare Design System Colors
  COLORS: {
    CF_ORANGE: '#f38020',
    CF_ORANGE_LIGHT: '#ff9500',
    CF_ORANGE_DARK: '#e6720d',
    CF_BLUE: '#0051c3',
    CF_BLUE_LIGHT: '#0066ff',
    CF_BLUE_DARK: '#003d99',
    CF_WHITE: '#ffffff',
    CF_BACKGROUND: '#1d1d1d',
    CF_CARD_BG: '#ffffff',
    CF_GRAY_50: '#f9fafb',
    CF_GRAY_100: '#f3f4f6',
    CF_GRAY_400: '#9ca3af',
    CF_GRAY_500: '#6b7280',
    CF_GRAY_900: '#111827',
  }
};

// Enhanced loading phases for premium experience
export type LoadingPhase =
  | "initializing"
  | "loading-script"
  | "preparing-widget"
  | "ready-for-user"
  | "verifying"
  | "server-verify"
  | "success"
  | "error"
  | "bypass-available"
  | "network-issue";

export interface EntryGateModalProps {
  isVisible: boolean;
  onVerificationSuccess: () => void;
  onError?: (error: string) => void;
}

// Cloudflare Component Interfaces
export interface CloudflareLogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'full' | 'icon-only';
  className?: string;
}

export interface SecurityShieldProps {
  status: 'checking' | 'verified' | 'error';
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
  className?: string;
}

export interface CloudflareCardProps {
  children: React.ReactNode;
  className?: string;
}

export interface CloudflareButtonProps {
  variant: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

export interface CloudflareProgressBarProps {
  progress: number;
  phase: LoadingPhase;
  showPercentage?: boolean;
  className?: string;
}

export interface CloudflareStatusIndicatorProps {
  phase: LoadingPhase;
  isAnimating: boolean;
  className?: string;
}

// Ray ID generator interface
export interface RayIdConfig {
  prefix: string;
  length: number;
  includeTimestamp: boolean;
}

// Network quality detection utility
export const detectNetworkQuality = (): Promise<"fast" | "slow" | "offline"> => {
  return new Promise((resolve) => {
    if (!navigator.onLine) {
      resolve("offline");
      return;
    }

    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      const effectiveType = connection.effectiveType;
      if (effectiveType === "4g" || effectiveType === "5g") {
        resolve("fast");
      } else if (effectiveType === "3g") {
        resolve("slow");
      } else {
        resolve("slow");
      }
      return;
    }

    // Fallback timing test
    const startTime = performance.now();
    fetch("/favicon.ico", { method: "HEAD", cache: "no-cache" })
      .then(() => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        resolve(duration < 200 ? "fast" : "slow");
      })
      .catch(() => resolve("offline"));
  });
};

// Premium Enterprise Status Indicator
export const EnterpriseStatusIndicator: React.FC<{
  phase: LoadingPhase;
  isAnimating: boolean;
}> = ({ phase, isAnimating }) => {
  const getPhaseConfig = (phase: LoadingPhase) => {
    switch (phase) {
      case 'initializing':
      case 'loading-script':
        return {
          gradient: 'from-purple-500 via-purple-400 to-blue-500',
          shadowColor: 'shadow-purple-500/50',
          ringColor: 'border-purple-500/40',
          glowColor: 'shadow-purple-400/60'
        };
      case 'preparing-widget':
      case 'ready-for-user':
        return {
          gradient: 'from-blue-500 via-blue-400 to-cyan-500',
          shadowColor: 'shadow-blue-500/50',
          ringColor: 'border-blue-500/40',
          glowColor: 'shadow-cyan-400/60'
        };
      case 'verifying':
      case 'server-verify':
        return {
          gradient: 'from-cyan-500 via-blue-500 to-purple-500',
          shadowColor: 'shadow-cyan-500/50',
          ringColor: 'border-cyan-500/40',
          glowColor: 'shadow-blue-400/60'
        };
      case 'success':
        return {
          gradient: 'from-emerald-400 via-green-500 to-teal-500',
          shadowColor: 'shadow-emerald-500/50',
          ringColor: 'border-emerald-500/40',
          glowColor: 'shadow-green-400/60'
        };
      case 'error':
        return {
          gradient: 'from-red-500 via-red-400 to-pink-500',
          shadowColor: 'shadow-red-500/50',
          ringColor: 'border-red-500/40',
          glowColor: 'shadow-red-400/60'
        };
      case 'network-issue':
        return {
          gradient: 'from-amber-500 via-yellow-500 to-orange-500',
          shadowColor: 'shadow-amber-500/50',
          ringColor: 'border-amber-500/40',
          glowColor: 'shadow-yellow-400/60'
        };
      default:
        return {
          gradient: 'from-slate-500 via-slate-400 to-slate-600',
          shadowColor: 'shadow-slate-500/50',
          ringColor: 'border-slate-500/40',
          glowColor: 'shadow-slate-400/60'
        };
    }
  };

  const config = getPhaseConfig(phase);

  if (phase === 'success') {
    return (
      <div className="relative flex items-center justify-center">
        <div className="relative">
          {/* Multi-layer success glow */}
          <div className={`absolute -inset-8 bg-gradient-to-r ${config.gradient} rounded-full blur-3xl opacity-30 animate-pulse`} />
          <div className={`absolute -inset-6 bg-gradient-to-r ${config.gradient} rounded-full blur-2xl opacity-40 animate-pulse animation-delay-150`} />
          
          {/* Main success container */}
          <div className={`relative w-24 h-24 bg-gradient-to-r ${config.gradient} rounded-3xl flex items-center justify-center ${config.shadowColor} shadow-2xl transform transition-all duration-1000 animate-bounce`}>
            <div className="absolute inset-2 bg-gradient-to-br from-white/20 to-transparent rounded-2xl" />
            <svg className="w-12 h-12 text-white drop-shadow-lg animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          {/* Success celebration particles */}
          <div className="absolute inset-0 animate-ping">
            <div className={`w-24 h-24 border-4 ${config.ringColor} rounded-3xl opacity-20`} />
          </div>
          <div className="absolute -inset-2 animate-ping animation-delay-300">
            <div className={`w-28 h-28 border-2 ${config.ringColor} rounded-3xl opacity-10`} />
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="relative flex items-center justify-center">
        <div className="relative">
          <div className={`absolute -inset-6 bg-gradient-to-r ${config.gradient} rounded-full blur-2xl opacity-30 animate-pulse`} />
          <div className={`relative w-20 h-20 bg-gradient-to-r ${config.gradient} rounded-2xl flex items-center justify-center ${config.shadowColor} shadow-xl animate-pulse`}>
            <div className="absolute inset-2 bg-gradient-to-br from-white/10 to-transparent rounded-xl" />
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  // Loading/processing states
  return (
    <div className="relative flex items-center justify-center">
      <div className="relative">
        {/* Animated glow rings */}
        <div className={`absolute -inset-8 bg-gradient-to-r ${config.gradient} rounded-full blur-3xl opacity-20 ${isAnimating ? 'animate-spin' : ''}`} style={{ animationDuration: '4000ms' }} />
        <div className={`absolute -inset-6 bg-gradient-to-r ${config.gradient} rounded-full blur-2xl opacity-30 ${isAnimating ? 'animate-spin' : ''}`} style={{ animationDuration: '3000ms', animationDelay: '300ms' }} />
        
        {/* Main loader ring */}
        <div className={`relative w-20 h-20 border-4 border-transparent ${config.ringColor} rounded-full ${isAnimating ? 'animate-spin' : ''} transition-all duration-500`}>
          <div className={`absolute inset-1 bg-gradient-to-r ${config.gradient} rounded-full ${config.shadowColor} shadow-lg`} />
          
          {/* Inner rotating element */}
          {isAnimating && (
            <div className="absolute inset-3 border-2 border-transparent border-t-white/60 rounded-full animate-spin duration-1000" />
          )}
        </div>
        
        {/* Pulse rings for active states */}
        {isAnimating && (
          <>
            <div className={`absolute -inset-2 border-2 ${config.ringColor} rounded-full animate-ping opacity-20`} />
            <div className={`absolute -inset-4 border ${config.ringColor} rounded-full animate-ping opacity-10 animation-delay-300`} />
          </>
        )}
      </div>
    </div>
  );
};

// Enterprise Progress Bar Component
export const EnterpriseProgressBar: React.FC<{ phase: LoadingPhase; progress: number }> = ({ phase, progress }) => {
  const getProgressConfig = (phase: LoadingPhase) => {
    switch (phase) {
      case 'initializing':
        return { gradient: 'from-purple-500 to-purple-600', progress: 10 };
      case 'loading-script':
        return { gradient: 'from-purple-500 via-blue-500 to-blue-600', progress: 25 };
      case 'preparing-widget':
        return { gradient: 'from-blue-500 via-cyan-500 to-cyan-600', progress: 50 };
      case 'ready-for-user':
        return { gradient: 'from-cyan-500 via-blue-500 to-purple-500', progress: 75 };
      case 'verifying':
        return { gradient: 'from-blue-500 via-indigo-500 to-purple-500', progress: 85 };
      case 'server-verify':
        return { gradient: 'from-purple-500 via-indigo-500 to-blue-500', progress: 95 };
      case 'success':
        return { gradient: 'from-emerald-500 via-green-500 to-teal-500', progress: 100 };
      case 'error':
        return { gradient: 'from-red-500 via-red-400 to-pink-500', progress: 100 };
      default:
        return { gradient: 'from-slate-500 to-slate-600', progress: progress || 20 };
    }
  };

  const config = getProgressConfig(phase);
  const currentProgress = progress || config.progress;

  return (
    <div className="w-full space-y-4">
      {/* Premium progress bar container */}
      <div className="relative w-full h-3 bg-slate-900/60 rounded-full overflow-hidden border border-white/10 backdrop-blur-sm shadow-inner">
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-cyan-500/5 rounded-full" />
        
        {/* Progress fill with gradient */}
        <div
          className={`relative h-full bg-gradient-to-r ${config.gradient} transition-all duration-1000 ease-out rounded-full shadow-lg`}
          style={{ width: `${currentProgress}%` }}
        >
          {/* Shimmer effect for active states */}
          {(phase !== 'success' && phase !== 'error') && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer rounded-full" />
          )}
          
          {/* Progress glow effect */}
          <div className={`absolute inset-0 bg-gradient-to-r ${config.gradient} rounded-full blur-sm opacity-60`} />
        </div>
      </div>

      {/* Progress information - No percentage display */}
      <div className="flex items-center justify-center text-sm">
        <div className="flex items-center space-x-3">
          <span className="text-slate-400 font-medium">Verification in Progress</span>
          <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
};

// Network Quality Badge Component
export const NetworkQualityBadge: React.FC<{ quality: "fast" | "slow" | "offline" }> = ({ quality }) => {
  if (quality === 'fast') return null;

  return (
    <div className="flex items-center justify-center mt-3">
      <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full backdrop-blur-sm ${
        quality === 'offline' ? 'bg-red-500/10 border border-red-500/20' : 'bg-amber-500/10 border border-amber-500/20'
      }`}>
        <div className={`w-2 h-2 rounded-full animate-pulse ${
          quality === 'offline' ? 'bg-red-400' : 'bg-amber-400'
        }`} />
        <span className={`text-xs font-medium ${
          quality === 'offline' ? 'text-red-400' : 'text-amber-400'
        }`}>
          {quality === 'offline' ? 'Working Offline' : 'Slow Connection'}
        </span>
      </div>
    </div>
  );
};

// Premium Button Component
export const PremiumButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  variant: 'primary' | 'secondary' | 'danger';
  children: React.ReactNode;
  className?: string;
}> = ({ onClick, disabled = false, variant, children, className = '' }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return disabled 
          ? 'bg-gradient-to-r from-slate-600 to-slate-700'
          : 'bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 shadow-purple-500/25 hover:shadow-purple-500/40';
      case 'secondary':
        return 'bg-slate-800/60 hover:bg-slate-700/60 border border-slate-600/50 hover:border-slate-500/50 text-slate-300';
      case 'danger':
        return 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/25';
      default:
        return 'bg-slate-700 hover:bg-slate-600';
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative overflow-hidden group ${getVariantStyles()}
        px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300
        shadow-lg min-h-[44px] disabled:cursor-not-allowed
        ${className}
      `}
    >
      {/* Button hover glow effect */}
      {!disabled && variant === 'primary' && (
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/40 to-cyan-500/40 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
      
      {/* Button content */}
      <div className="relative z-10 text-white">
        {children}
      </div>
    </button>
  );
};