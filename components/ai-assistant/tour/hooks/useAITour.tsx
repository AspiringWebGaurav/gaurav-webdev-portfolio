import { useState, useEffect, useCallback } from 'react';
import { TourState, TourStep, UseTourReturn } from '../types';
import { tourSteps, getTourStep, getTotalSteps } from '../AITourContent';
import useTourStorage from './useTourStorage';

const initialTourState: TourState = {
  isActive: false,
  currentStep: 1,
  totalSteps: getTotalSteps(),
  isCompleted: false,
  hasStarted: false,
  canSkip: true
};

export const useAITour = (): UseTourReturn => {
  const [tourState, setTourState] = useState<TourState>(initialTourState);
  const { 
    shouldShowTour, 
    markTourStarted, 
    markTourCompleted, 
    markTourSkipped,
    logEvent,
    isLoaded
  } = useTourStorage();

  // Get current step data
  const currentStepData = getTourStep(tourState.currentStep) || tourSteps[0];

  // Initialize tour based on storage preferences
  useEffect(() => {
    if (isLoaded && shouldShowTour() && !tourState.hasStarted) {
      // Auto-start tour for new users after a short delay
      const timer = setTimeout(() => {
        setTourState(prev => ({
          ...prev,
          isActive: true,
          hasStarted: true
        }));
        markTourStarted();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isLoaded, shouldShowTour, tourState.hasStarted, markTourStarted]);

  // Start tour manually
  const startTour = useCallback(() => {
    setTourState(prev => ({
      ...prev,
      isActive: true,
      hasStarted: true,
      currentStep: 1,
      isCompleted: false
    }));
    markTourStarted();
    logEvent('tour_started');
  }, [markTourStarted, logEvent]);

  // Move to next step
  const nextStep = useCallback(() => {
    setTourState(prev => {
      const nextStepNumber = prev.currentStep + 1;
      
      if (nextStepNumber > prev.totalSteps) {
        // Tour completed
        markTourCompleted();
        logEvent('tour_completed');
        return {
          ...prev,
          isActive: false,
          isCompleted: true,
          currentStep: prev.totalSteps
        };
      }
      
      logEvent('step_changed', nextStepNumber);
      return {
        ...prev,
        currentStep: nextStepNumber
      };
    });
  }, [markTourCompleted, logEvent]);

  // Move to previous step
  const previousStep = useCallback(() => {
    setTourState(prev => {
      if (prev.currentStep > 1) {
        const prevStepNumber = prev.currentStep - 1;
        logEvent('step_changed', prevStepNumber);
        return {
          ...prev,
          currentStep: prevStepNumber
        };
      }
      return prev;
    });
  }, [logEvent]);

  // Skip tour
  const skipTour = useCallback(() => {
    setTourState(prev => ({
      ...prev,
      isActive: false,
      isCompleted: false
    }));
    markTourSkipped();
    logEvent('tour_skipped', tourState.currentStep);
  }, [markTourSkipped, logEvent, tourState.currentStep]);

  // Complete tour
  const completeTour = useCallback(() => {
    setTourState(prev => ({
      ...prev,
      isActive: false,
      isCompleted: true
    }));
    markTourCompleted();
    logEvent('tour_completed');
  }, [markTourCompleted, logEvent]);

  // Reset tour (for development/testing)
  const resetTour = useCallback(() => {
    setTourState(initialTourState);
  }, []);

  // Close tour without marking as completed or skipped
  const closeTour = useCallback(() => {
    setTourState(prev => ({
      ...prev,
      isActive: false
    }));
    logEvent('tour_closed', tourState.currentStep);
  }, [logEvent, tourState.currentStep]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!tourState.isActive) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
        case 'Enter':
          event.preventDefault();
          if (tourState.currentStep === tourState.totalSteps) {
            completeTour();
          } else {
            nextStep();
          }
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          previousStep();
          break;
        case 'Escape':
          event.preventDefault();
          if (currentStepData.skipable) {
            skipTour();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [tourState.isActive, tourState.currentStep, tourState.totalSteps, currentStepData.skipable, nextStep, previousStep, skipTour, completeTour]);

  return {
    tourState,
    currentStepData,
    startTour,
    nextStep,
    previousStep,
    skipTour,
    completeTour,
    resetTour,
    closeTour
  };
};

export default useAITour;