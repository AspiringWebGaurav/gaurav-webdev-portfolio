"use client";

import React, { useState, useEffect } from 'react';

interface AITooltipProps {
  isVisible: boolean;
  onClose: () => void;
  onOpenAI: () => void;
}

const AITooltip: React.FC<AITooltipProps> = ({
  isVisible,
  onClose,
  onOpenAI
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      // Small delay to ensure DOM is ready for animation
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 50);

      // Auto-hide after 4 seconds
      const hideTimer = setTimeout(() => {
        handleClose();
      }, 4000);

      return () => {
        clearTimeout(timer);
        clearTimeout(hideTimer);
      };
    }
  }, [isVisible]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setShouldRender(false);
      onClose();
    }, 300);
  };

  const handleClick = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setShouldRender(false);
      onOpenAI();
    }, 200);
  };

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed top-1/2 right-24 -translate-y-1/2 z-45 transition-all duration-300 ease-out cursor-pointer ${
        isAnimating
          ? 'opacity-100 scale-100 translate-x-0'
          : 'opacity-0 scale-95 translate-x-4'
      }`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label="Open AI Assistant"
    >
      {/* Tooltip Container */}
      <div className="relative">
        {/* Main Tooltip */}
        <div className="bg-gradient-to-r from-blue-500/95 to-purple-500/95 backdrop-blur-md rounded-xl px-4 py-3 shadow-xl border border-blue-400/50 hover:border-blue-300/70 transition-all duration-200 hover:scale-105 max-w-xs">
          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors duration-200"
            aria-label="Close tooltip"
          >
            <svg
              className="w-3 h-3 text-white"
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
          <div className="flex items-center space-x-3">
            {/* AI Icon */}
            <div className="flex-shrink-0">
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

            {/* Message */}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium leading-tight">
                Hi, Gaurav's Personal AI is here.
              </p>
              <p className="text-blue-100 text-xs mt-1 opacity-90">
                Click to explore!
              </p>
            </div>
          </div>
        </div>

        {/* Arrow pointing to AI bubble */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
          <div className="w-0 h-0 border-t-8 border-b-8 border-l-8 border-transparent border-l-blue-500/95 ml-1"></div>
        </div>

        {/* Subtle glow effect */}
        <div className="absolute inset-0 -m-1 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-xl blur-lg opacity-60 -z-10"></div>
      </div>

      {/* Floating animation */}
      <style jsx>{`
        @keyframes gentle-float {
          0%, 100% {
            transform: translateY(-50%) translateX(0px);
          }
          50% {
            transform: translateY(-50%) translateX(-2px);
          }
        }

        .cursor-pointer:hover {
          animation: gentle-float 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default AITooltip;