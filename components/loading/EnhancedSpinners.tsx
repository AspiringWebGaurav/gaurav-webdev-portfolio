"use client";

import React, { useEffect, useState } from 'react';

// Base spinner interface
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: 'purple' | 'cyan' | 'emerald' | 'gradient';
}

// Size mapping
const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6', 
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

// Color mapping
const colorMap = {
  purple: 'border-purple-500',
  cyan: 'border-cyan-500',
  emerald: 'border-emerald-500',
  gradient: 'border-transparent bg-gradient-to-r from-purple-500 via-cyan-500 to-emerald-500'
};

// Accessibility and reduced motion support
const useAccessibilityPreferences = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return { prefersReducedMotion };
};

// Simple spinning circle - perfect for buttons
export const SpinnerCircle: React.FC<SpinnerProps> = ({
  size = 'md',
  className = '',
  color = 'purple'
}) => {
  const { prefersReducedMotion } = useAccessibilityPreferences();
  
  return (
    <div
      className={`${sizeMap[size]} border-2 border-gray-300 ${colorMap[color]} border-t-transparent rounded-full ${
        prefersReducedMotion ? 'animate-pulse' : 'animate-spin'
      } ${className}`}
      role="status"
      aria-label="Loading"
      aria-live="polite"
    >
      <span className="sr-only">Loading content, please wait...</span>
    </div>
  );
};

// Pulsing dots - great for inline loading
export const SpinnerDots: React.FC<SpinnerProps> = ({
  size = 'md',
  className = '',
  color = 'purple'
}) => {
  const { prefersReducedMotion } = useAccessibilityPreferences();
  const dotSize = size === 'sm' ? 'w-1 h-1' : size === 'lg' ? 'w-3 h-3' : size === 'xl' ? 'w-4 h-4' : 'w-2 h-2';
  const colorClass = color === 'gradient'
    ? 'bg-gradient-to-r from-purple-500 via-cyan-500 to-emerald-500'
    : colorMap[color].replace('border-', 'bg-');

  return (
    <div className={`flex items-center space-x-1 ${className}`} role="status" aria-label="Loading" aria-live="polite">
      <div className={`${dotSize} ${colorClass} rounded-full ${
        prefersReducedMotion ? 'animate-pulse' : 'animate-bounce [animation-delay:-0.3s]'
      }`} />
      <div className={`${dotSize} ${colorClass} rounded-full ${
        prefersReducedMotion ? 'animate-pulse' : 'animate-bounce [animation-delay:-0.15s]'
      }`} />
      <div className={`${dotSize} ${colorClass} rounded-full ${
        prefersReducedMotion ? 'animate-pulse' : 'animate-bounce'
      }`} />
      <span className="sr-only">Loading content, please wait...</span>
    </div>
  );
};

// Dual ring spinner - perfect for overlays
export const SpinnerDualRing: React.FC<SpinnerProps> = ({
  size = 'md',
  className = '',
  color = 'gradient'
}) => {
  const { prefersReducedMotion } = useAccessibilityPreferences();
  
  return (
    <div className={`${className}`} role="status" aria-label="Loading" aria-live="polite">
      <div className={`relative ${sizeMap[size]}`}>
        {/* Background ring */}
        <div className="absolute inset-0 rounded-full border-4 border-gray-700/30" />
        
        {/* Spinning ring */}
        <div className={`absolute inset-0 rounded-full border-4 border-transparent ${
          color === 'gradient'
            ? 'border-t-purple-500 border-r-cyan-500 border-b-emerald-500'
            : `${colorMap[color]} border-t-transparent`
        } ${prefersReducedMotion ? 'animate-pulse' : 'animate-spin'}`} />
        
        {/* Inner pulsing dot */}
        <div className={`absolute inset-0 flex items-center justify-center`}>
          <div className={`w-1 h-1 ${
            color === 'gradient'
              ? 'bg-gradient-to-r from-purple-500 via-cyan-500 to-emerald-500'
              : colorMap[color].replace('border-', 'bg-')
          } rounded-full animate-pulse`} />
        </div>
      </div>
      <span className="sr-only">Loading content, please wait...</span>
    </div>
  );
};

// Progress circle - shows actual progress
interface ProgressSpinnerProps extends SpinnerProps {
  progress?: number; // 0-100
}

export const SpinnerProgress: React.FC<ProgressSpinnerProps> = ({
  size = 'md',
  className = '',
  color = 'gradient',
  progress = 0
}) => {
  const radius = size === 'sm' ? 16 : size === 'lg' ? 32 : size === 'xl' ? 48 : 24;
  const strokeWidth = size === 'sm' ? 2 : size === 'lg' ? 4 : size === 'xl' ? 6 : 3;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className={`${sizeMap[size]} ${className}`}
      role="progressbar"
      aria-label={`Loading ${Math.round(progress)}%`}
      aria-live="polite"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-700/30"
        />
        
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke={color === 'gradient' ? "url(#gradient)" : "currentColor"}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={color !== 'gradient' ? colorMap[color].replace('border-', 'text-') : ''}
          style={{ transition: 'stroke-dashoffset 0.3s ease' }}
        />
        
        {color === 'gradient' && (
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="50%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
        )}
      </svg>
      
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-xs font-medium ${
          color === 'gradient' ? 'text-white' : colorMap[color].replace('border-', 'text-')
        }`}>
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
};

// Bouncing balls - fun for page transitions
export const SpinnerBalls: React.FC<SpinnerProps> = ({ 
  size = 'md', 
  className = '', 
  color = 'gradient' 
}) => {
  const ballSize = size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-4 h-4' : size === 'xl' ? 'w-6 h-6' : 'w-3 h-3';
  
  return (
    <div className={`flex items-center space-x-1 ${className}`} role="status" aria-label="Loading">
      <div className={`${ballSize} bg-purple-500 rounded-full animate-bounce [animation-delay:-0.4s]`} />
      <div className={`${ballSize} bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.2s]`} />
      <div className={`${ballSize} bg-emerald-500 rounded-full animate-bounce`} />
    </div>
  );
};

// Pulse wave - subtle and elegant
export const SpinnerWave: React.FC<SpinnerProps> = ({ 
  size = 'md', 
  className = '', 
  color = 'gradient' 
}) => {
  const barHeight = size === 'sm' ? 'h-4' : size === 'lg' ? 'h-8' : size === 'xl' ? 'h-12' : 'h-6';
  const barWidth = size === 'sm' ? 'w-1' : size === 'lg' ? 'w-2' : size === 'xl' ? 'w-3' : 'w-1.5';
  
  return (
    <div className={`flex items-end space-x-1 ${className}`} role="status" aria-label="Loading">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`${barWidth} ${barHeight} ${
            color === 'gradient' 
              ? i % 3 === 0 ? 'bg-purple-500' : i % 3 === 1 ? 'bg-cyan-500' : 'bg-emerald-500'
              : colorMap[color].replace('border-', 'bg-')
          } rounded-full animate-pulse`}
          style={{ animationDelay: `${i * 0.1}s`, animationDuration: '1s' }}
        />
      ))}
    </div>
  );
};

// Main export with all spinner variants
export const EnhancedSpinners = {
  Circle: SpinnerCircle,
  Dots: SpinnerDots,
  DualRing: SpinnerDualRing,
  Progress: SpinnerProgress,
  Balls: SpinnerBalls,
  Wave: SpinnerWave
};