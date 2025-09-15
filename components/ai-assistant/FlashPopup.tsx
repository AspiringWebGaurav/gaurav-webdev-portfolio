"use client";

import React, { useState, useEffect } from 'react';

interface FlashPopupProps {
  isVisible: boolean;
  onComplete: () => void;
  duration?: number;
}

const FlashPopup: React.FC<FlashPopupProps> = ({
  isVisible,
  onComplete,
  duration = 5000
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [timers, setTimers] = useState<{ animation?: NodeJS.Timeout; hide?: NodeJS.Timeout; exit?: NodeJS.Timeout }>({});

  const handleUserClick = () => {
    // Clear all existing timers
    if (timers.animation) clearTimeout(timers.animation);
    if (timers.hide) clearTimeout(timers.hide);
    if (timers.exit) clearTimeout(timers.exit);
    
    // Immediately trigger completion
    setIsAnimating(false);
    setTimeout(() => {
      setShouldRender(false);
      onComplete();
    }, 200); // Shorter exit animation for immediate response
  };

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      
      // Small delay to ensure DOM is ready for animation
      const animationTimer = setTimeout(() => {
        setIsAnimating(true);
      }, 50);

      // Auto-hide after duration
      const hideTimer = setTimeout(() => {
        setIsAnimating(false);
        // Wait for exit animation to complete
        const exitTimer = setTimeout(() => {
          setShouldRender(false);
          onComplete();
        }, 500);
        setTimers(prev => ({ ...prev, exit: exitTimer }));
      }, duration);

      // Store timers for cleanup
      setTimers({ animation: animationTimer, hide: hideTimer });

      return () => {
        clearTimeout(animationTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [isVisible, duration, onComplete]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed top-1/2 right-6 -translate-y-1/2 z-50 transition-all duration-500 ease-out cursor-pointer ${
        isAnimating
          ? 'opacity-100 scale-100 translate-x-0'
          : 'opacity-0 scale-95 translate-x-8'
      }`}
      onClick={handleUserClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleUserClick();
        }
      }}
      aria-label="Click to open AI Assistant immediately"
    >
      {/* Simplified Modern Card */}
      <div className="relative max-w-sm">
        {/* Main Card */}
        <div className="bg-gradient-to-br from-black-100/95 via-black-100/90 to-black-100/85 backdrop-blur-md rounded-2xl p-5 shadow-2xl border border-blue-500/30 hover:border-blue-400/50 transition-all duration-200 hover:scale-105">
          {/* Content */}
          <div className="flex items-start space-x-4">
            {/* AI Avatar */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
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
            <div className="flex-1">
              <div className="mb-2">
                <h3 className="text-white text-sm font-semibold">Gaurav's AI Assistant</h3>
                <div className="flex items-center space-x-1 mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-xs">Online</span>
                </div>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                Hi! I can help you explore Gaurav's portfolio and answer questions about his work.
              </p>
            </div>
          </div>

          {/* Action Hint */}
          <div className="mt-4 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-blue-400 text-xs font-medium hover:text-blue-300 transition-colors">Click to start exploring AI</span>
              <div className="flex items-center space-x-1">
                <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse animation-delay-300"></div>
                <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse animation-delay-600"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Subtle Glow Effect */}
        <div className="absolute inset-0 -m-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-50"></div>
      </div>

      {/* Floating Animation Styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          33% {
            transform: translateY(-2px) translateX(1px);
          }
          66% {
            transform: translateY(1px) translateX(-1px);
          }
        }

        .animate-float {
          animation: float 4s ease-in-out infinite;
        }

        .animation-delay-300 {
          animation-delay: 300ms;
        }

        .animation-delay-600 {
          animation-delay: 600ms;
        }

        .animation-delay-900 {
          animation-delay: 900ms;
        }
      `}</style>
    </div>
  );
};

export default FlashPopup;