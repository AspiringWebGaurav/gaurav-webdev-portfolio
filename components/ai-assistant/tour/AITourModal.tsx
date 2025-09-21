"use client";

import React, { useEffect } from 'react';
import { TourModalProps } from './types';
import { useAITour } from './hooks/useAITour';
import { useTourGestures } from './hooks/useTourGestures';
import AITourProgress from './AITourProgress';
import AITourNavigation from './AITourNavigation';

const AITourModal: React.FC<TourModalProps> = ({
  isVisible,
  onComplete,
  onSkip,
  onClose,
  autoStart = false
}) => {
  const {
    tourState,
    currentStepData,
    startTour,
    nextStep,
    previousStep,
    skipTour,
    completeTour,
    closeTour
  } = useAITour();

  // Handle tour completion
  const handleComplete = () => {
    completeTour();
    onComplete();
  };

  // Handle tour skip
  const handleSkip = () => {
    skipTour();
    onSkip();
  };

  // Handle tour close
  const handleClose = () => {
    closeTour();
    onClose();
  };

  // Initialize gesture handling for mobile
  const { gestureProps } = useTourGestures({
    onSwipeLeft: nextStep,
    onSwipeRight: previousStep,
    onTap: () => {
      if (tourState.currentStep === tourState.totalSteps) {
        handleComplete();
      } else {
        nextStep();
      }
    },
    isEnabled: tourState.isActive && isVisible
  });

  // Auto-start tour if requested
  useEffect(() => {
    if (autoStart && isVisible && !tourState.hasStarted) {
      startTour();
    }
  }, [autoStart, isVisible, tourState.hasStarted, startTour]);

  // Handle ESC key and prevent body scroll
  useEffect(() => {
    if (!isVisible || !tourState.isActive) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && currentStepData.skipable) {
        handleSkip();
      }
    };

    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isVisible, tourState.isActive, currentStepData.skipable, handleSkip]);

  // Focus management for accessibility
  useEffect(() => {
    if (isVisible && tourState.isActive) {
      // Focus the modal container using gestureProps.ref
      const modalElement = document.querySelector('[role="dialog"]') as HTMLElement;
      if (modalElement) {
        modalElement.focus();
      }
    }
  }, [isVisible, tourState.isActive, tourState.currentStep]);

  // Don't render if not visible or not active
  if (!isVisible || !tourState.isActive) {
    return null;
  }

  return (
    <>
      {/* Modal Backdrop */}
      <div
        className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={currentStepData.skipable ? handleClose : undefined}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        <div
          {...gestureProps}
          className="relative w-full max-w-md sm:max-w-lg lg:max-w-xl mx-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tour-title"
          aria-describedby="tour-description"
          tabIndex={-1}
        >
          {/* Main Modal Card */}
          <div className="relative bg-gradient-to-br from-black-100/95 via-gray-900/95 to-black-100/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden transform transition-all duration-500 hover:scale-[1.02]">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-cyan-500/10 opacity-50"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500"></div>

            {/* Close Button */}
            {currentStepData.skipable && (
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all duration-200 flex items-center justify-center group"
                aria-label="Close tour"
              >
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* Modal Content */}
            <div className="relative px-6 py-8 sm:px-8 sm:py-10">
              {/* Progress Indicator */}
              <div className="mb-8">
                <AITourProgress
                  currentStep={tourState.currentStep}
                  totalSteps={tourState.totalSteps}
                  showLabels={false}
                />
              </div>

              {/* Step Content */}
              <div className="space-y-6">
                {/* Step Header */}
                <div className="text-center space-y-3">
                  <div className="text-4xl sm:text-5xl">
                    {currentStepData.icon}
                  </div>
                  <h2 
                    id="tour-title"
                    className="text-xl sm:text-2xl font-bold text-white leading-tight"
                  >
                    {currentStepData.title}
                  </h2>
                  <p 
                    id="tour-description"
                    className="text-sm sm:text-base text-white/70 leading-relaxed"
                  >
                    {currentStepData.description}
                  </p>
                </div>

                {/* Step Content */}
                <div className="min-h-[200px] sm:min-h-[250px] flex items-center justify-center">
                  <div className="w-full">
                    {currentStepData.content}
                  </div>
                </div>

                {/* Navigation */}
                <AITourNavigation
                  currentStep={tourState.currentStep}
                  totalSteps={tourState.totalSteps}
                  onNext={nextStep}
                  onPrevious={previousStep}
                  onSkip={handleSkip}
                  onComplete={handleComplete}
                  isFirstStep={tourState.currentStep === 1}
                  isLastStep={tourState.currentStep === tourState.totalSteps}
                  canSkip={currentStepData.skipable !== false}
                />
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-2 -left-2 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-xl"></div>
            <div className="absolute -bottom-2 -right-2 w-24 h-24 bg-gradient-to-tl from-purple-500/20 to-transparent rounded-full blur-xl"></div>
          </div>

          {/* Mobile Optimization Hint */}
          <div className="sm:hidden mt-4 text-center">
            <p className="text-xs text-white/40">
              Swipe left or right to navigate • Tap to continue
            </p>
          </div>
        </div>
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        /* Smooth scrolling for any internal content */
        .tour-content {
          scroll-behavior: smooth;
        }
        
        /* Ensure high contrast for accessibility */
        @media (prefers-contrast: high) {
          .bg-black-100\/95 {
            background-color: rgba(0, 0, 0, 0.98);
          }
          
          .border-white\/10 {
            border-color: rgba(255, 255, 255, 0.3);
          }
        }
        
        /* Reduce motion for accessibility */
        @media (prefers-reduced-motion: reduce) {
          .transition-all,
          .transition-opacity,
          .transition-transform {
            transition: none !important;
          }
          
          .animate-pulse,
          .animate-bounce {
            animation: none !important;
          }
          
          .hover\\:scale-\\[1\\.02\\]:hover,
          .group-hover\\:scale-110:hover {
            transform: none !important;
          }
        }
        
        /* Focus styles for keyboard navigation */
        .tour-modal-focus:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
        
        /* Custom scrollbar for any scrollable content */
        .tour-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        
        .tour-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .tour-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
        }
        
        .tour-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </>
  );
};

export default AITourModal;