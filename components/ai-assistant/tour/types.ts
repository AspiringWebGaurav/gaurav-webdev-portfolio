export interface TourStep {
  id: number;
  title: string;
  description: string;
  content: React.ReactNode;
  icon: string;
  action?: {
    text: string;
    handler: () => void;
  };
  skipable?: boolean;
}

export interface TourState {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  isCompleted: boolean;
  hasStarted: boolean;
  canSkip: boolean;
}

export interface TourPreferences {
  hasCompletedTour: boolean;
  hasSkippedTour: boolean;
  lastTourDate: string;
  tourCompletedAt: string;
  preferredSkipMode: boolean;
}

export interface TourModalProps {
  isVisible: boolean;
  onComplete: () => void;
  onSkip: () => void;
  onClose: () => void;
  autoStart?: boolean;
}

export interface TourStepProps {
  step: TourStep;
  isActive: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onComplete: () => void;
  currentStep: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export interface TourNavigationProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onComplete: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  canSkip: boolean;
}

export interface TourProgressProps {
  currentStep: number;
  totalSteps: number;
  showLabels?: boolean;
}

export interface UseTourReturn {
  tourState: TourState;
  currentStepData: TourStep;
  startTour: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  resetTour: () => void;
  closeTour: () => void;
}

export interface TourGesture {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  deltaX: number;
  deltaY: number;
  isSwipe: boolean;
  direction: 'left' | 'right' | 'up' | 'down' | null;
}

export type TourEventType = 
  | 'tour_started'
  | 'tour_completed' 
  | 'tour_skipped'
  | 'step_changed'
  | 'tour_closed';

export interface TourEvent {
  type: TourEventType;
  step?: number;
  timestamp: string;
  userAgent?: string;
}