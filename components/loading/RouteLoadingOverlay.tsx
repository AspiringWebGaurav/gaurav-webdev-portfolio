"use client";

import React, { useEffect, useState } from 'react';
import { EnhancedSpinners } from './EnhancedSpinners';

interface RouteLoadingOverlayProps {
  isVisible: boolean;
  loadingType: 'navigation' | 'component' | 'data' | 'idle';
  message: string;
  targetRoute?: string;
  onHide?: () => void;
}

const RouteLoadingOverlay: React.FC<RouteLoadingOverlayProps> = ({
  isVisible,
  loadingType,
  message,
  targetRoute,
  onHide
}) => {
  const [progress, setProgress] = useState(0);
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'loading' | 'exit'>('enter');

  // Simulate progress for navigation loading
  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      setAnimationPhase('enter');
      return;
    }

    setAnimationPhase('enter');
    
    // Simulate realistic loading progress
    const progressTimer = setTimeout(() => {
      setAnimationPhase('loading');
      
      let currentProgress = 0;
      const progressInterval = setInterval(() => {
        currentProgress += Math.random() * 15 + 5; // Random progress between 5-20%
        
        // Slow down as we approach 100%
        if (currentProgress > 70) {
          currentProgress += Math.random() * 5 + 1; // Slower progress 1-6%
        }
        
        setProgress(Math.min(currentProgress, 85)); // Cap at 85% until navigation completes
        
        if (currentProgress >= 85) {
          clearInterval(progressInterval);
        }
      }, 150);

      return () => clearInterval(progressInterval);
    }, 100);

    return () => clearTimeout(progressTimer);
  }, [isVisible]);

  // Complete progress when loading finishes
  useEffect(() => {
    if (!isVisible && progress > 0) {
      setProgress(100);
      setAnimationPhase('exit');
      
      const exitTimer = setTimeout(() => {
        setProgress(0);
        onHide?.();
      }, 300);

      return () => clearTimeout(exitTimer);
    }
  }, [isVisible, progress, onHide]);

  if (!isVisible && progress === 0) return null;

  const getSpinnerComponent = () => {
    switch (loadingType) {
      case 'navigation':
        return <EnhancedSpinners.Progress size="lg" progress={progress} color="gradient" />;
      case 'component':
        return <EnhancedSpinners.DualRing size="lg" color="gradient" />;
      case 'data':
        return <EnhancedSpinners.Wave size="lg" color="gradient" />;
      default:
        return <EnhancedSpinners.Circle size="lg" color="gradient" />;
    }
  };

  const getContextualInfo = () => {
    if (loadingType === 'navigation' && targetRoute) {
      if (targetRoute.includes('ask-me-anything')) {
        return {
          icon: '💬',
          subtitle: 'Preparing your direct questions interface'
        };
      }
      if (targetRoute.match(/^\/[a-f0-9-]{36}$/)) {
        return {
          icon: '🎨',
          subtitle: 'Loading your portfolio experience'
        };
      }
    }
    
    return {
      icon: '⚡',
      subtitle: 'Almost there...'
    };
  };

  const contextInfo = getContextualInfo();

  return (
    <div 
      className={`fixed inset-0 z-[9999] transition-all duration-300 ${
        animationPhase === 'enter' || animationPhase === 'loading'
          ? 'opacity-100 backdrop-blur-md'
          : 'opacity-0'
      }`}
      style={{
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)'
      }}
    >
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-black-100/95 via-black-100/90 to-black-100/95" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.1)_0%,transparent_50%)]" />

      {/* Floating particles for visual interest */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 rounded-full animate-pulse ${
              i % 3 === 0 ? 'bg-purple-500/30' : 
              i % 3 === 1 ? 'bg-cyan-500/30' : 'bg-emerald-500/30'
            }`}
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + i * 10}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: '2s'
            }}
          />
        ))}
      </div>

      {/* Main loading content */}
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className={`text-center max-w-sm mx-auto transition-all duration-500 ${
          animationPhase === 'enter' 
            ? 'opacity-0 translate-y-8' 
            : animationPhase === 'loading'
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-4'
        }`}>
          
          {/* Icon */}
          <div className="text-6xl mb-6 animate-bounce">
            {contextInfo.icon}
          </div>
          
          {/* Spinner */}
          <div className="mb-8 flex justify-center">
            {getSpinnerComponent()}
          </div>

          {/* Loading Text */}
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-white">
              {message}
            </h3>
            <p className="text-purple-300 text-sm">
              {contextInfo.subtitle}
            </p>
          </div>

          {/* Progress Bar for Navigation */}
          {loadingType === 'navigation' && (
            <div className="mt-6 w-full max-w-xs mx-auto">
              <div className="h-1 bg-gray-700/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 via-cyan-500 to-emerald-500 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-gray-400 text-center">
                {Math.round(progress)}%
              </div>
            </div>
          )}

          {/* Loading Dots */}
          <div className="mt-6 flex justify-center">
            <EnhancedSpinners.Dots size="sm" color="gradient" />
          </div>

          {/* Subtle hint */}
          <p className="mt-4 text-xs text-gray-500">
            Creating the perfect experience for you
          </p>
        </div>
      </div>

      {/* Bottom corner branding */}
      <div className="absolute bottom-6 right-6 text-xs text-gray-600">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full animate-pulse" />
          <span>Gaurav's Portfolio</span>
        </div>
      </div>
    </div>
  );
};

export default RouteLoadingOverlay;