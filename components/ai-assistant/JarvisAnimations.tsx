"use client";

import React from 'react';
import { JarvisAnimationProps } from './types';

const JarvisAnimations: React.FC<JarvisAnimationProps> = ({
  isActive,
  size = 'medium',
  color = 'blue',
  intensity = 'medium'
}) => {
  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-16 h-16',
    large: 'w-24 h-24'
  };

  const colorClasses = {
    blue: {
      primary: '#3B82F6',
      secondary: '#60A5FA',
      glow: 'rgba(59, 130, 246, 0.4)'
    },
    purple: {
      primary: '#8B5CF6',
      secondary: '#A78BFA',
      glow: 'rgba(139, 92, 246, 0.4)'
    },
    cyan: {
      primary: '#06B6D4',
      secondary: '#67E8F9',
      glow: 'rgba(6, 182, 212, 0.4)'
    }
  };

  const intensitySettings = {
    low: { rings: 2, pulseSpeed: '3s', glowIntensity: 0.3 },
    medium: { rings: 3, pulseSpeed: '2s', glowIntensity: 0.5 },
    high: { rings: 4, pulseSpeed: '1.5s', glowIntensity: 0.7 }
  };

  const settings = intensitySettings[intensity];
  const colors = colorClasses[color];

  return (
    <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
      {/* Outer glow effect */}
      <div 
        className={`absolute inset-0 rounded-full blur-xl transition-all duration-500 ${
          isActive ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
          animation: isActive ? `pulse ${settings.pulseSpeed} ease-in-out infinite` : 'none'
        }}
      />

      {/* Scanning rings */}
      {Array.from({ length: settings.rings }).map((_, index) => (
        <div
          key={index}
          className={`absolute rounded-full border transition-all duration-500 ${
            isActive ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            width: `${100 + (index * 25)}%`,
            height: `${100 + (index * 25)}%`,
            borderColor: index % 2 === 0 ? colors.primary : colors.secondary,
            borderWidth: '1px',
            animation: isActive 
              ? `jarvis-scan ${settings.pulseSpeed} ease-in-out infinite ${index * 0.2}s` 
              : 'none'
          }}
        />
      ))}

      {/* Central core */}
      <div 
        className={`relative w-6 h-6 rounded-full transition-all duration-500 ${
          isActive ? 'opacity-100' : 'opacity-60'
        }`}
        style={{
          background: `radial-gradient(circle, ${colors.primary} 0%, ${colors.secondary} 100%)`,
          boxShadow: isActive 
            ? `0 0 20px ${colors.glow}, inset 0 0 10px rgba(255, 255, 255, 0.2)` 
            : 'none',
          animation: isActive ? `core-pulse ${settings.pulseSpeed} ease-in-out infinite` : 'none'
        }}
      >
        {/* Inner highlight */}
        <div 
          className="absolute top-1 left-1 w-2 h-2 rounded-full bg-white opacity-60"
          style={{
            animation: isActive ? `highlight-flicker 2s ease-in-out infinite` : 'none'
          }}
        />
      </div>

      {/* Terminal scan lines */}
      {isActive && (
        <>
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(from 0deg, transparent 0deg, ${colors.primary}40 45deg, transparent 90deg)`,
              animation: 'terminal-scan 3s linear infinite'
            }}
          />
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(from 180deg, transparent 0deg, ${colors.secondary}30 45deg, transparent 90deg)`,
              animation: 'terminal-scan 3s linear infinite reverse'
            }}
          />
        </>
      )}

      {/* Data stream particles */}
      {isActive && Array.from({ length: 6 }).map((_, index) => (
        <div
          key={`particle-${index}`}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: colors.primary,
            top: '50%',
            left: '50%',
            animation: `data-stream-${index} 2s linear infinite ${index * 0.3}s`,
            transformOrigin: '0 0'
          }}
        />
      ))}

      <style jsx>{`
        @keyframes jarvis-scan {
          0%, 100% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.4;
          }
        }

        @keyframes core-pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.2);
          }
        }

        @keyframes highlight-flicker {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes terminal-scan {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes data-stream-0 {
          0% { transform: translate(-50%, -50%) rotate(0deg) translateX(0px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translate(-50%, -50%) rotate(0deg) translateX(40px); opacity: 0; }
        }

        @keyframes data-stream-1 {
          0% { transform: translate(-50%, -50%) rotate(60deg) translateX(0px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translate(-50%, -50%) rotate(60deg) translateX(40px); opacity: 0; }
        }

        @keyframes data-stream-2 {
          0% { transform: translate(-50%, -50%) rotate(120deg) translateX(0px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translate(-50%, -50%) rotate(120deg) translateX(40px); opacity: 0; }
        }

        @keyframes data-stream-3 {
          0% { transform: translate(-50%, -50%) rotate(180deg) translateX(0px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translate(-50%, -50%) rotate(180deg) translateX(40px); opacity: 0; }
        }

        @keyframes data-stream-4 {
          0% { transform: translate(-50%, -50%) rotate(240deg) translateX(0px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translate(-50%, -50%) rotate(240deg) translateX(40px); opacity: 0; }
        }

        @keyframes data-stream-5 {
          0% { transform: translate(-50%, -50%) rotate(300deg) translateX(0px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translate(-50%, -50%) rotate(300deg) translateX(40px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

// Jarvis-style loading spinner
export const JarvisLoader: React.FC<{ size?: 'small' | 'medium' | 'large' }> = ({ 
  size = 'medium' 
}) => {
  return (
    <div className="flex items-center justify-center">
      <JarvisAnimations 
        isActive={true} 
        size={size} 
        color="cyan" 
        intensity="high" 
      />
    </div>
  );
};

// Jarvis-style button with animation
export const JarvisButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  isActive?: boolean;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  className?: string;
}> = ({ 
  children, 
  onClick, 
  isActive = false, 
  variant = 'primary',
  disabled = false,
  className = '' 
}) => {
  const baseClasses = "relative px-6 py-3 rounded-lg font-medium transition-all duration-300 overflow-hidden";
  const variantClasses = {
    primary: "bg-black-100/80 border border-blue-500/50 text-white hover:border-blue-400",
    secondary: "bg-black-100/60 border border-purple-500/50 text-white hover:border-purple-400"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
      }`}
    >
      {/* Background glow effect */}
      <div 
        className={`absolute inset-0 transition-opacity duration-300 ${
          isActive ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: variant === 'primary' 
            ? 'linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(6, 182, 212, 0.1))'
            : 'linear-gradient(45deg, rgba(139, 92, 246, 0.1), rgba(168, 85, 247, 0.1))'
        }}
      />
      
      {/* Scanning line effect */}
      {isActive && (
        <div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          style={{
            animation: 'scan-line 2s linear infinite'
          }}
        />
      )}
      
      <span className="relative z-10">{children}</span>
      
      <style jsx>{`
        @keyframes scan-line {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </button>
  );
};

export default JarvisAnimations;