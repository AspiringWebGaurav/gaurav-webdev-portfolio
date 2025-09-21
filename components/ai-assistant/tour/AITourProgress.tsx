"use client";

import React from 'react';
import { TourProgressProps } from './types';

const AITourProgress: React.FC<TourProgressProps> = ({
  currentStep,
  totalSteps,
  showLabels = false
}) => {
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="w-full space-y-3">
      {/* Progress Bar */}
      <div className="relative">
        {/* Background Track */}
        <div className="h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
          {/* Active Progress */}
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out relative"
            style={{ width: `${Math.max(8, progressPercentage)}%` }}
          >
            {/* Animated Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
          </div>
        </div>

        {/* Step Dots */}
        <div className="absolute inset-0 flex justify-between items-center">
          {Array.from({ length: totalSteps }, (_, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === currentStep;
            const isCompleted = stepNumber < currentStep;
            
            return (
              <div
                key={stepNumber}
                className={`relative flex items-center justify-center transition-all duration-300 ${
                  isActive 
                    ? 'scale-125' 
                    : isCompleted 
                    ? 'scale-110' 
                    : 'scale-100'
                }`}
              >
                {/* Outer Ring */}
                <div className={`w-6 h-6 rounded-full border-2 transition-all duration-300 ${
                  isActive 
                    ? 'border-white bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg shadow-blue-500/50' 
                    : isCompleted 
                    ? 'border-green-400 bg-green-400' 
                    : 'border-white/40 bg-white/10'
                }`}>
                  {/* Inner Content */}
                  <div className="w-full h-full flex items-center justify-center">
                    {isCompleted ? (
                      // Checkmark for completed steps
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      // Step number for current and future steps
                      <span className={`text-xs font-bold transition-colors duration-300 ${
                        isActive ? 'text-white' : 'text-white/60'
                      }`}>
                        {stepNumber}
                      </span>
                    )}
                  </div>
                </div>

                {/* Active Step Pulse Animation */}
                {isActive && (
                  <div className="absolute inset-0 w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-ping opacity-75"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Labels (Optional) */}
      {showLabels && (
        <div className="flex justify-between text-xs text-white/60 px-1">
          {Array.from({ length: totalSteps }, (_, index) => {
            const stepNumber = index + 1;
            const labels = ['Welcome', 'Questions', 'Features', 'Start'];
            
            return (
              <span 
                key={stepNumber}
                className={`transition-colors duration-300 ${
                  stepNumber === currentStep 
                    ? 'text-white font-medium' 
                    : stepNumber < currentStep 
                    ? 'text-green-400' 
                    : 'text-white/40'
                }`}
              >
                {labels[index] || `Step ${stepNumber}`}
              </span>
            );
          })}
        </div>
      )}

      {/* Progress Text */}
      <div className="text-center">
        <span className="text-sm text-white/70">
          Step <span className="font-semibold text-white">{currentStep}</span> of{' '}
          <span className="font-semibold text-white">{totalSteps}</span>
        </span>
        <div className="text-xs text-white/50 mt-1">
          {Math.round(progressPercentage)}% Complete
        </div>
      </div>

      {/* Mobile-specific progress indicator */}
      <style jsx>{`
        @media (max-width: 480px) {
          .step-dots {
            transform: scale(0.9);
          }
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .animate-ping,
          .animate-pulse {
            animation: none;
          }
          
          .transition-all {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
};

export default AITourProgress;