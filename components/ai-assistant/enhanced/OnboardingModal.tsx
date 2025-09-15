"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button, Card, Icons } from '../design-system/components';
import OptimizedJarvisAnimation from './OptimizedJarvisAnimation';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface OnboardingModalProps {
  isVisible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isVisible,
  onComplete,
  onSkip
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const steps: OnboardingStep[] = [
    {
      id: 'overview',
      title: 'Welcome to Gaurav\'s AI Assistant',
      description: 'Your personal guide to exploring Gaurav\'s portfolio',
      content: (
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <OptimizedJarvisAnimation
              isActive={true}
              size="large"
              color="blue"
              intensity="medium"
            />
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-ai-text-primary">
              Hello — I'm Gaurav's Assistant
            </h3>
            <p className="text-ai-text-secondary leading-relaxed max-w-md mx-auto">
              I'm here to help you explore Gaurav's portfolio, answer questions about his work, 
              and provide information about his projects and experience.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-ai-primary-blue/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Icons.Question className="w-6 h-6 text-ai-primary-blue" />
              </div>
              <p className="text-xs text-ai-text-secondary">Quick Questions</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-ai-primary-blue/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Icons.Chat className="w-6 h-6 text-ai-primary-blue" />
              </div>
              <p className="text-xs text-ai-text-secondary">AI Chat</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-ai-primary-blue/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Icons.Home className="w-6 h-6 text-ai-primary-blue" />
              </div>
              <p className="text-xs text-ai-text-secondary">Portfolio</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'try-qa',
      title: 'Try Quick Questions',
      description: 'Pre-written questions for instant answers',
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-ai-primary-blue/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Icons.Question className="w-8 h-8 text-ai-primary-blue" />
            </div>
            <h3 className="text-lg font-semibold text-ai-text-primary mb-2">
              Quick Questions
            </h3>
            <p className="text-ai-text-secondary leading-relaxed">
              Get instant answers to common questions about Gaurav's work, skills, and experience.
            </p>
          </div>
          
          <div className="space-y-3">
            <Card variant="outlined" padding="sm" className="cursor-pointer hover:border-ai-primary-blue/50 transition-colors">
              <div className="flex items-center space-x-3">
                <Icons.Question className="w-4 h-4 text-ai-primary-blue flex-shrink-0" />
                <span className="text-sm text-ai-text-primary">What projects has Gaurav worked on?</span>
              </div>
            </Card>
            <Card variant="outlined" padding="sm" className="cursor-pointer hover:border-ai-primary-blue/50 transition-colors">
              <div className="flex items-center space-x-3">
                <Icons.Question className="w-4 h-4 text-ai-primary-blue flex-shrink-0" />
                <span className="text-sm text-ai-text-primary">What are his technical skills?</span>
              </div>
            </Card>
            <Card variant="outlined" padding="sm" className="cursor-pointer hover:border-ai-primary-blue/50 transition-colors">
              <div className="flex items-center space-x-3">
                <Icons.Question className="w-4 h-4 text-ai-primary-blue flex-shrink-0" />
                <span className="text-sm text-ai-text-primary">How can I contact Gaurav?</span>
              </div>
            </Card>
          </div>

          <div className="bg-ai-surface-secondary rounded-lg p-4">
            <p className="text-xs text-ai-text-secondary text-center">
              💡 Click any question to see the full answer with downloadable files and quick links
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'try-chat',
      title: 'Try AI Chat',
      description: 'Have a conversation with the AI assistant',
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-ai-primary-blue/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Icons.Chat className="w-8 h-8 text-ai-primary-blue" />
            </div>
            <h3 className="text-lg font-semibold text-ai-text-primary mb-2">
              AI Chat
            </h3>
            <p className="text-ai-text-secondary leading-relaxed">
              Ask me anything about Gaurav's portfolio. I can provide detailed information and help you navigate.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-ai-surface-secondary rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-ai-primary-blue to-ai-primary-blue-light flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-ai-text-primary">
                    Try asking: "Tell me about Gaurav's most impressive project"
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 px-4 py-3 bg-ai-surface-primary border border-ai-border-light rounded-lg">
              <Icons.Chat className="w-4 h-4 text-ai-text-muted" />
              <span className="text-sm text-ai-text-muted flex-1">Type your question here...</span>
              <Button size="sm" disabled>
                Send
              </Button>
            </div>
          </div>

          <div className="bg-ai-primary-blue/10 rounded-lg p-4">
            <p className="text-xs text-ai-text-secondary text-center">
              💬 The AI chat provides detailed responses that never get clipped or cut off
            </p>
          </div>
        </div>
      )
    }
  ];

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
    }
  }, [isVisible]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Mark onboarding as seen
    try {
      localStorage.setItem('ai-assistant-onboarding', JSON.stringify({
        seen: true,
        completedAt: new Date().toISOString()
      }));
    } catch (error) {
      console.warn('Failed to save onboarding state:', error);
    }
    
    onComplete();
  };

  const handleSkipTour = () => {
    try {
      localStorage.setItem('ai-assistant-onboarding', JSON.stringify({
        seen: true,
        skipped: true,
        skippedAt: new Date().toISOString()
      }));
    } catch (error) {
      console.warn('Failed to save onboarding state:', error);
    }
    
    onSkip();
  };

  if (!isVisible) return null;

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className={cn(
          "bg-ai-surface-primary rounded-2xl shadow-2xl border border-ai-border-light max-w-lg w-full max-h-[90vh] overflow-hidden transition-all duration-500",
          isAnimating ? "opacity-100 scale-100" : "opacity-0 scale-95"
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-ai-border-light">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold text-ai-text-primary">
              {currentStepData.title}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkipTour}
              className="text-ai-text-tertiary hover:text-ai-text-primary"
            >
              <Icons.Close className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-ai-text-secondary text-sm">
            {currentStepData.description}
          </p>
          
          {/* Progress Indicator */}
          <div className="flex items-center space-x-2 mt-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  index === currentStep
                    ? "bg-ai-primary-blue flex-1"
                    : index < currentStep
                    ? "bg-ai-primary-blue/50 w-2"
                    : "bg-ai-border-light w-2"
                )}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStepData.content}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-ai-border-light bg-ai-surface-secondary">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-ai-text-secondary">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              {currentStep > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevious}
                >
                  Previous
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkipTour}
                className="text-ai-text-tertiary"
              >
                Skip Tour
              </Button>
              
              <Button
                variant="primary"
                size="sm"
                onClick={handleNext}
                rightIcon={
                  currentStep === steps.length - 1 
                    ? <Icons.Close className="w-4 h-4" />
                    : <Icons.ChevronRight className="w-4 h-4" />
                }
              >
                {currentStep === steps.length - 1 ? 'Finish Tour' : 'Next'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;