"use client";

import React, { useState, useEffect, useRef } from 'react';

interface AIAutoPopupProps {
  isVisible: boolean;
  onDismiss: () => void;
  message: string;
  autoHideDelay?: number;
  originPosition?: { x: number; y: number };
}

const AIAutoPopup: React.FC<AIAutoPopupProps> = ({
  isVisible,
  onDismiss,
  message,
  autoHideDelay = 4000,
  originPosition = { x: 0, y: 0 }
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const autoHideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle popup visibility and animations
  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      
      // Small delay to ensure DOM is ready for animation
      const animationTimer = setTimeout(() => {
        setIsAnimating(true);
      }, 50);

      // Auto-hide after specified delay
      autoHideTimerRef.current = setTimeout(() => {
        handleDismiss();
      }, autoHideDelay);

      return () => {
        clearTimeout(animationTimer);
        if (autoHideTimerRef.current) {
          clearTimeout(autoHideTimerRef.current);
        }
      };
    } else {
      setIsAnimating(false);
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current);
        autoHideTimerRef.current = null;
      }
    }
  }, [isVisible, autoHideDelay]);

  // Handle dismiss with animation
  const handleDismiss = () => {
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
    
    setIsAnimating(false);
    setTimeout(() => {
      setShouldRender(false);
      onDismiss();
    }, 300); // Wait for exit animation
  };

  // Handle click outside to dismiss
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        handleDismiss();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVisible]);

  // Handle escape key to dismiss
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleDismiss();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [isVisible]);

  if (!shouldRender) return null;

  return (
    <>
      {/* Popup Container */}
      <div
        ref={popupRef}
        className={`fixed z-[9999] transition-all duration-300 ease-out ${
          isAnimating
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-75'
        }`}
        style={{
          top: '50%',
          right: '100px', // Position to the left of AI bubble
          transform: 'translateY(-50%)',
          transformOrigin: 'right center', // Scale from the right (toward AI bubble)
        }}
        role="dialog"
        aria-label="AI Assistant Introduction"
        aria-live="polite"
      >
        {/* Speech Bubble Container */}
        <div className="relative">
          {/* Main Speech Bubble */}
          <div className="bg-gradient-to-br from-blue-500/95 to-purple-500/95 backdrop-blur-md rounded-2xl px-5 py-4 shadow-2xl border border-blue-400/50 max-w-xs hover:scale-105 transition-transform duration-200">
            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500/90 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors duration-200 group"
              aria-label="Close popup"
            >
              <svg
                className="w-3 h-3 text-white group-hover:scale-110 transition-transform duration-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Content */}
            <div className="flex items-start space-x-3">
              {/* AI Avatar */}
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium leading-relaxed">
                  {message}
                </p>
                <p className="text-blue-100 text-xs mt-2 opacity-90">
                  Click the AI bubble to explore! →
                </p>
              </div>
            </div>

            {/* Typing Indicator Animation */}
            <div className="flex items-center space-x-1 mt-3 pt-2 border-t border-white/20">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce"></div>
              </div>
              <span className="text-white/60 text-xs ml-2">AI Assistant</span>
            </div>
          </div>

          {/* Speech Bubble Tail/Pointer */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
            <div className="w-0 h-0 border-t-8 border-b-8 border-l-8 border-transparent border-l-blue-500/95 ml-1"></div>
          </div>

          {/* Subtle Glow Effect */}
          <div className="absolute inset-0 -m-2 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-2xl blur-xl opacity-60 -z-10"></div>
        </div>
      </div>

      {/* Floating Animation Styles */}
      <style jsx>{`
        @keyframes gentle-float {
          0%, 100% {
            transform: translateY(-50%) translateX(0px);
          }
          50% {
            transform: translateY(-50%) translateX(-2px);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
          }
        }

        /* Gentle floating animation when visible */
        .fixed:hover {
          animation: gentle-float 3s ease-in-out infinite;
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .animate-bounce,
          .fixed:hover {
            animation: none;
          }
        }

        /* Mobile responsive adjustments */
        @media (max-width: 768px) {
          .fixed {
            right: 80px !important;
            max-width: 280px;
          }
        }

        @media (max-width: 480px) {
          .fixed {
            right: 70px !important;
            top: 40% !important;
            max-width: 250px;
          }
        }
      `}</style>
    </>
  );
};

export default AIAutoPopup;