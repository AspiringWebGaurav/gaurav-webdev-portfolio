"use client";

import React, { useMemo, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedJarvisAnimationProps {
  isActive: boolean;
  size?: 'small' | 'medium' | 'large';
  color?: 'blue' | 'purple' | 'cyan';
  intensity?: 'low' | 'medium' | 'high';
  performanceMode?: 'auto' | 'high' | 'medium' | 'low';
  className?: string;
}

// Device performance detection
const detectDevicePerformance = (): 'high' | 'medium' | 'low' => {
  if (typeof window === 'undefined') return 'medium';
  
  // Check for hardware acceleration support
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  // Check memory and CPU hints
  const memory = (navigator as any).deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  
  // Performance scoring
  let score = 0;
  if (gl) score += 2;
  if (memory >= 8) score += 2;
  else if (memory >= 4) score += 1;
  if (cores >= 8) score += 2;
  else if (cores >= 4) score += 1;
  
  if (score >= 5) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
};

const OptimizedJarvisAnimation: React.FC<OptimizedJarvisAnimationProps> = ({
  isActive,
  size = 'medium',
  color = 'blue',
  intensity = 'medium',
  performanceMode = 'auto',
  className
}) => {
  const [deviceTier, setDeviceTier] = useState<'high' | 'medium' | 'low'>('medium');
  const [frameRate, setFrameRate] = useState(60);

  // Detect device performance on mount
  useEffect(() => {
    if (performanceMode === 'auto') {
      const tier = detectDevicePerformance();
      setDeviceTier(tier);
    } else {
      setDeviceTier(performanceMode as 'high' | 'medium' | 'low');
    }
  }, [performanceMode]);

  // Performance monitoring
  useEffect(() => {
    if (!isActive) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFrameRate = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        setFrameRate(fps);
        
        // Auto-adjust performance if frame rate drops
        if (fps < 45 && deviceTier === 'high') {
          setDeviceTier('medium');
        } else if (fps < 30 && deviceTier === 'medium') {
          setDeviceTier('low');
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFrameRate);
    };

    animationId = requestAnimationFrame(measureFrameRate);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isActive, deviceTier]);

  // Animation configuration based on device performance
  const animationConfig = useMemo(() => {
    const configs = {
      high: {
        rings: intensity === 'high' ? 4 : intensity === 'medium' ? 3 : 2,
        particles: intensity === 'high' ? 8 : intensity === 'medium' ? 6 : 4,
        blur: true,
        glow: true,
        scanLines: true,
        pulseSpeed: '2s',
        scanSpeed: '3s'
      },
      medium: {
        rings: intensity === 'high' ? 3 : intensity === 'medium' ? 2 : 1,
        particles: intensity === 'high' ? 6 : intensity === 'medium' ? 4 : 2,
        blur: true,
        glow: false,
        scanLines: false,
        pulseSpeed: '2.5s',
        scanSpeed: '4s'
      },
      low: {
        rings: 1,
        particles: 0,
        blur: false,
        glow: false,
        scanLines: false,
        pulseSpeed: '3s',
        scanSpeed: '5s'
      }
    };
    
    return configs[deviceTier];
  }, [deviceTier, intensity]);

  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-16 h-16',
    large: 'w-24 h-24'
  };

  const colorConfig = {
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

  const colors = colorConfig[color];

  // Reduced motion support
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    return (
      <div className={cn('relative flex items-center justify-center', sizeClasses[size], className)}>
        <div 
          className="w-6 h-6 rounded-full transition-all duration-500"
          style={{
            background: `radial-gradient(circle, ${colors.primary} 0%, ${colors.secondary} 100%)`,
            opacity: isActive ? 1 : 0.6
          }}
        />
      </div>
    );
  }

  return (
    <div className={cn('relative flex items-center justify-center', sizeClasses[size], className)}>
      {/* Outer glow effect - only on high performance */}
      {animationConfig.glow && (
        <div 
          className={cn(
            'absolute inset-0 rounded-full transition-all duration-500',
            isActive ? 'opacity-100' : 'opacity-0'
          )}
          style={{
            background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
            filter: animationConfig.blur ? 'blur(8px)' : 'none',
            animation: isActive ? `ai-jarvis-pulse ${animationConfig.pulseSpeed} ease-in-out infinite` : 'none'
          }}
        />
      )}

      {/* Scanning rings */}
      {Array.from({ length: animationConfig.rings }).map((_, index) => (
        <div
          key={`ring-${index}`}
          className={cn(
            'absolute rounded-full border transition-all duration-500',
            isActive ? 'opacity-100' : 'opacity-0'
          )}
          style={{
            width: `${100 + (index * 25)}%`,
            height: `${100 + (index * 25)}%`,
            borderColor: index % 2 === 0 ? colors.primary : colors.secondary,
            borderWidth: '1px',
            animation: isActive 
              ? `ai-jarvis-scan ${animationConfig.scanSpeed} ease-in-out infinite ${index * 0.2}s` 
              : 'none',
            willChange: 'transform, opacity'
          }}
        />
      ))}

      {/* Central core */}
      <div 
        className={cn(
          'relative w-6 h-6 rounded-full transition-all duration-500',
          isActive ? 'opacity-100' : 'opacity-60'
        )}
        style={{
          background: `radial-gradient(circle, ${colors.primary} 0%, ${colors.secondary} 100%)`,
          boxShadow: isActive && animationConfig.glow
            ? `0 0 20px ${colors.glow}, inset 0 0 10px rgba(255, 255, 255, 0.2)` 
            : 'none',
          animation: isActive ? `ai-jarvis-pulse ${animationConfig.pulseSpeed} ease-in-out infinite` : 'none',
          willChange: 'transform'
        }}
      >
        {/* Inner highlight */}
        <div 
          className="absolute top-1 left-1 w-2 h-2 rounded-full bg-white opacity-60"
          style={{
            animation: isActive ? 'ai-highlight-flicker 2s ease-in-out infinite' : 'none'
          }}
        />
      </div>

      {/* Terminal scan lines - only on high performance */}
      {isActive && animationConfig.scanLines && (
        <>
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(from 0deg, transparent 0deg, ${colors.primary}40 45deg, transparent 90deg)`,
              animation: 'ai-terminal-scan 3s linear infinite',
              willChange: 'transform'
            }}
          />
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(from 180deg, transparent 0deg, ${colors.secondary}30 45deg, transparent 90deg)`,
              animation: 'ai-terminal-scan 3s linear infinite reverse',
              willChange: 'transform'
            }}
          />
        </>
      )}

      {/* Data stream particles - performance dependent */}
      {isActive && animationConfig.particles > 0 && 
        Array.from({ length: animationConfig.particles }).map((_, index) => (
          <div
            key={`particle-${index}`}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: colors.primary,
              top: '50%',
              left: '50%',
              animation: `ai-data-stream-${index % 6} 2s linear infinite ${index * 0.3}s`,
              transformOrigin: '0 0',
              willChange: 'transform, opacity'
            }}
          />
        ))
      }

      {/* Performance indicator (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap">
          {deviceTier} | {frameRate}fps
        </div>
      )}

      {/* Optimized CSS animations */}
      <style jsx>{`
        @keyframes ai-jarvis-scan {
          0%, 100% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.4;
          }
        }

        @keyframes ai-jarvis-pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        @keyframes ai-highlight-flicker {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes ai-terminal-scan {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes ai-data-stream-0 {
          0% { transform: translate(-50%, -50%) rotate(0deg) translateX(0px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translate(-50%, -50%) rotate(0deg) translateX(30px); opacity: 0; }
        }

        @keyframes ai-data-stream-1 {
          0% { transform: translate(-50%, -50%) rotate(60deg) translateX(0px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translate(-50%, -50%) rotate(60deg) translateX(30px); opacity: 0; }
        }

        @keyframes ai-data-stream-2 {
          0% { transform: translate(-50%, -50%) rotate(120deg) translateX(0px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translate(-50%, -50%) rotate(120deg) translateX(30px); opacity: 0; }
        }

        @keyframes ai-data-stream-3 {
          0% { transform: translate(-50%, -50%) rotate(180deg) translateX(0px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translate(-50%, -50%) rotate(180deg) translateX(30px); opacity: 0; }
        }

        @keyframes ai-data-stream-4 {
          0% { transform: translate(-50%, -50%) rotate(240deg) translateX(0px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translate(-50%, -50%) rotate(240deg) translateX(30px); opacity: 0; }
        }

        @keyframes ai-data-stream-5 {
          0% { transform: translate(-50%, -50%) rotate(300deg) translateX(0px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translate(-50%, -50%) rotate(300deg) translateX(30px); opacity: 0; }
        }

        /* Hardware acceleration hints */
        .absolute {
          transform: translateZ(0);
        }
      `}</style>
    </div>
  );
};

export default OptimizedJarvisAnimation;