/**
 * Cloudflare Official Security Verification UI Components
 * Replicates Cloudflare's standard security verification page design
 */

"use client";

import React from "react";
import { CONFIG } from "./types";
import type { 
  CloudflareLogoProps, 
  SecurityShieldProps, 
  CloudflareCardProps,
  CloudflareButtonProps,
  CloudflareProgressBarProps,
  LoadingPhase 
} from "./types";

// Cloudflare Logo Component
export const CloudflareLogo: React.FC<CloudflareLogoProps> = ({ 
  size = 'medium', 
  variant = 'full',
  className = '' 
}) => {
  const sizeClasses = {
    small: 'h-8',
    medium: 'h-12',
    large: 'h-16'
  };

  if (variant === 'icon-only') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className={`${sizeClasses[size]} w-auto`}>
          <svg viewBox="0 0 109 40" className="h-full w-auto">
            <path fill="#f38020" d="M90.21 32.24c.26 0 .47.21.47.47v1.03c0 .26-.21.47-.47.47h-1.03c-.26 0-.47-.21-.47-.47v-1.03c0-.26.21-.47.47-.47h1.03zm-3.38 0c.26 0 .47.21.47.47v1.03c0 .26-.21.47-.47.47h-1.03c-.26 0-.47-.21-.47-.47v-1.03c0-.26.21-.47.47-.47h1.03z"/>
            <path fill="#f38020" d="M75.54 16.85c0-4.86-3.44-7.82-9.22-7.82-4.25 0-7.94 1.95-9.71 5.14-.22.39-.14.88.17 1.19.31.31.8.39 1.19.17 2.96-1.68 5.95-1.68 8.35-.02 3.06 2.13 3.06 5.59 0 7.72-2.4 1.66-5.39 1.66-8.35-.02-.39-.22-.88-.14-1.19.17-.31.31-.39.8-.17 1.19 1.77 3.19 5.46 5.14 9.71 5.14 5.78 0 9.22-2.96 9.22-7.82z"/>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} w-auto`}>
        <svg viewBox="0 0 200 60" className="h-full w-auto">
          {/* Cloudflare Logo */}
          <path fill="#f38020" d="M30 20c0-4.86-3.44-7.82-9.22-7.82-4.25 0-7.94 1.95-9.71 5.14-.22.39-.14.88.17 1.19.31.31.8.39 1.19.17 2.96-1.68 5.95-1.68 8.35-.02 3.06 2.13 3.06 5.59 0 7.72-2.4 1.66-5.39 1.66-8.35-.02-.39-.22-.88-.14-1.19.17-.31.31-.39.8-.17 1.19 1.77 3.19 5.46 5.14 9.71 5.14 5.78 0 9.22-2.96 9.22-7.82z"/>
          {/* Text "Cloudflare" */}
          <text x="40" y="35" fill="#111827" fontSize="18" fontFamily="Inter, system-ui, sans-serif" fontWeight="600">
            Cloudflare
          </text>
        </svg>
      </div>
    </div>
  );
};

// Security Shield Component
export const SecurityShield: React.FC<SecurityShieldProps> = ({ 
  status, 
  size = 'medium', 
  animated = false,
  className = '' 
}) => {
  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-16 h-16',
    large: 'w-20 h-20'
  };

  const getShieldContent = () => {
    switch (status) {
      case 'verified':
        return (
          <div className="w-full h-full bg-green-100 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-full h-full bg-red-100 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      default:
        return (
          <div className={`w-full h-full bg-orange-100 rounded-full flex items-center justify-center shadow-lg ${animated ? 'animate-spin' : ''}`}>
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} flex items-center justify-center`}>
        {getShieldContent()}
      </div>
    </div>
  );
};

// Cloudflare Card Component
export const CloudflareCard: React.FC<CloudflareCardProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`
      bg-white 
      rounded-lg 
      shadow-xl 
      p-8 
      max-w-md 
      w-full 
      mx-auto 
      border 
      border-gray-200
      ${className}
    `}>
      {children}
    </div>
  );
};

// Cloudflare Button Component
export const CloudflareButton: React.FC<CloudflareButtonProps> = ({ 
  variant, 
  size = 'medium', 
  disabled = false, 
  onClick, 
  children,
  className = '' 
}) => {
  const baseClasses = "font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variantClasses = {
    primary: disabled 
      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
      : "bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500",
    secondary: "border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
  };

  const sizeClasses = {
    small: "px-3 py-2 text-sm",
    medium: "px-4 py-2 text-base",
    large: "px-6 py-3 text-lg"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {children}
    </button>
  );
};

// Cloudflare Progress Bar Component
export const CloudflareProgressBar: React.FC<CloudflareProgressBarProps> = ({ 
  progress, 
  phase,
  showPercentage = false,
  className = '' 
}) => {
  const isActive = phase !== 'success' && phase !== 'error';

  return (
    <div className={`w-full ${className}`}>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div 
          className={`
            h-full 
            bg-gradient-to-r 
            from-orange-500 
            to-orange-600 
            transition-all 
            duration-500 
            ease-out
            ${isActive ? 'animate-pulse' : ''}
          `}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      {showPercentage && (
        <div className="text-center text-sm text-gray-600 mt-2">
          {Math.round(progress)}%
        </div>
      )}
    </div>
  );
};

// Ray ID Generator Utility - Session-based for consistency
export const generateRayId = async (): Promise<string> => {
  try {
    // Try to get session UUID
    const { secureSessionClient } = await import('@/lib/secureSessionClient');
    const sessionInfo = secureSessionClient.getSessionInfo();
    
    if (sessionInfo.uuid) {
      // Generate consistent Ray ID from session UUID
      return generateSessionBasedRayId(sessionInfo.uuid);
    }
  } catch (error) {
    console.warn('[CloudflareRayID] Failed to get session UUID, using fallback:', error);
  }
  
  // Fallback to random Ray ID if session not available
  return generateRandomRayId();
};

// Helper function to generate Ray ID from session UUID
const generateSessionBasedRayId = (sessionUUID: string): string => {
  // Create a deterministic Ray ID from session UUID
  // Use the first 16 characters of a hash-like transformation
  const chars = '0123456789abcdef';
  let result = '';
  
  // Simple but deterministic transformation of UUID to Ray ID format
  const hash = sessionUUID.replace(/-/g, '').toLowerCase();
  
  for (let i = 0; i < 16; i++) {
    const charIndex = hash.charCodeAt(i % hash.length) % chars.length;
    result += chars[charIndex];
  }
  
  return result;
};

// Fallback random generator (existing implementation)
const generateRandomRayId = (): string => {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

// Cloudflare Footer Component
export const CloudflareFooter: React.FC<{ rayId?: string; className?: string }> = ({
  rayId,
  className = ''
}) => {
  const [currentRayId, setCurrentRayId] = React.useState<string>(rayId || '');

  React.useEffect(() => {
    if (!rayId) {
      generateRayId().then(setCurrentRayId);
    }
  }, [rayId]);

  // Use rayId prop if provided, otherwise use generated session-based ID
  const displayRayId = rayId || currentRayId;

  return (
    <div className={`border-t border-gray-200 pt-6 mt-8 ${className}`}>
      <div className="text-center text-sm text-gray-500 space-y-3">
        <p>Ray ID: <span className="font-mono">{displayRayId}</span></p>
        <p>
          Performance & security by{' '}
          <span className="font-semibold text-orange-600">
            Cloudflare
          </span>
        </p>
        <div className="flex justify-center space-x-4">
          <button
            className="text-blue-600 hover:underline"
            onClick={() => {/* Handle privacy policy */}}
          >
            Privacy Policy
          </button>
          <button
            className="text-blue-600 hover:underline"
            onClick={() => {/* Handle terms */}}
          >
            Terms of Service
          </button>
        </div>
      </div>
    </div>
  );
};

// Network Quality Indicator for Cloudflare Design
export const CloudflareNetworkIndicator: React.FC<{ quality: "fast" | "slow" | "offline" }> = ({ quality }) => {
  if (quality === 'fast') return null;

  return (
    <div className="flex items-center justify-center mt-3">
      <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full ${
        quality === 'offline' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
      }`}>
        <div className={`w-2 h-2 rounded-full animate-pulse ${
          quality === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
        }`} />
        <span className={`text-xs font-medium ${
          quality === 'offline' ? 'text-red-700' : 'text-yellow-700'
        }`}>
          {quality === 'offline' ? 'Working Offline' : 'Slow Connection'}
        </span>
      </div>
    </div>
  );
};