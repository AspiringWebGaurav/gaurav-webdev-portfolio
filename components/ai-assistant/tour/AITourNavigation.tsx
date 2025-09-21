"use client";

import React from 'react';
import { TourNavigationProps } from './types';

const AITourNavigation: React.FC<TourNavigationProps> = ({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  onComplete,
  isFirstStep,
  isLastStep,
  canSkip
}) => {
  const handleNextClick = () => {
    if (isLastStep) {
      onComplete();
    } else {
      onNext();
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Primary Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {/* Previous Button */}
        <button
          onClick={onPrevious}
          disabled={isFirstStep}
          className={`flex-1 px-4 py-3 sm:px-6 sm:py-3 rounded-xl font-medium transition-all duration-300 ${
            isFirstStep
              ? 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10'
              : 'bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40 hover:scale-105'
          } backdrop-blur-sm`}
          aria-label="Previous step"
        >
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden">Prev</span>
          </div>
        </button>

        {/* Next/Complete Button */}
        <button
          onClick={handleNextClick}
          className="flex-1 px-4 py-3 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl backdrop-blur-sm border border-blue-400/50 hover:border-blue-300/70"
          aria-label={isLastStep ? "Complete tour" : "Next step"}
        >
          <div className="flex items-center justify-center space-x-2">
            {isLastStep ? (
              <>
                <span className="text-sm sm:text-base">Start Chatting</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">Next</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
          </div>
        </button>
      </div>

      {/* Secondary Actions */}
      <div className="flex justify-between items-center">
        {/* Skip Button */}
        {canSkip && !isLastStep && (
          <button
            onClick={onSkip}
            className="px-3 py-2 text-sm text-white/60 hover:text-white/90 transition-colors duration-300 hover:underline"
            aria-label="Skip tour"
          >
            Skip Tour
          </button>
        )}

        {/* Keyboard Shortcuts Hint */}
        <div className="hidden sm:flex items-center space-x-4 text-xs text-white/40">
          <div className="flex items-center space-x-1">
            <kbd className="px-2 py-1 bg-white/10 rounded text-xs">←</kbd>
            <span>Previous</span>
          </div>
          <div className="flex items-center space-x-1">
            <kbd className="px-2 py-1 bg-white/10 rounded text-xs">→</kbd>
            <span>Next</span>
          </div>
          {canSkip && (
            <div className="flex items-center space-x-1">
              <kbd className="px-2 py-1 bg-white/10 rounded text-xs">ESC</kbd>
              <span>Skip</span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Swipe Hint */}
      <div className="sm:hidden text-center">
        <div className="text-xs text-white/40 space-y-1">
          <div className="flex items-center justify-center space-x-2">
            <span>👈 Swipe to navigate</span>
            <span>👉</span>
          </div>
          <div>Tap to continue</div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        kbd {
          font-family: ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
        }
        
        @media (max-width: 640px) {
          button {
            min-height: 44px; /* iOS touch target size */
          }
        }
        
        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .bg-white\/10 {
            background-color: rgba(255, 255, 255, 0.3);
          }
          
          .border-white\/20 {
            border-color: rgba(255, 255, 255, 0.5);
          }
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .transition-all,
          .transition-colors {
            transition: none;
          }
          
          .hover\\:scale-105:hover {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
};

export default AITourNavigation;