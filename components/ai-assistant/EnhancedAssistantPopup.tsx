"use client";

import React, { useState, useEffect } from "react";
import { AssistantPopupProps } from "./types";
import JarvisAnimations from "./JarvisAnimations";
import EnhancedAssistantInterface from "./EnhancedAssistantInterface";
import FlashPopup from "./FlashPopup";

const EnhancedAssistantPopup: React.FC<AssistantPopupProps> = ({
  isVisible,
  onClose,
  onMinimize,
  isMinimized,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showFlashPopup, setShowFlashPopup] = useState(false);
  const [showMainInterface, setShowMainInterface] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Show flash popup first
      setShowFlashPopup(true);
      setShowMainInterface(false);
    } else {
      // Reset states when not visible
      setShowFlashPopup(false);
      setShowMainInterface(false);
      setIsAnimating(false);
    }
  }, [isVisible]);

  const handleFlashPopupComplete = () => {
    setShowFlashPopup(false);
    // Small delay before showing main interface for smooth transition
    setTimeout(() => {
      setShowMainInterface(true);
      setIsAnimating(true);
    }, 200);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Flash Popup - Shows first */}
      <FlashPopup
        isVisible={showFlashPopup}
        onComplete={handleFlashPopupComplete}
        duration={5000}
      />

      {/* Main Assistant Interface - Shows after flash popup */}
      {showMainInterface && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-500 ${
              isMinimized ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
            onClick={onClose}
          />

          {/* Assistant Container */}
          <div
            className={`fixed right-3 sm:right-6 z-50 transition-all duration-800 ease-out ${
              isMinimized
                ? "w-16 h-16 top-1/2 -translate-y-1/2"
                : "w-[520px] max-w-[95vw] sm:max-w-[90vw] md:max-w-[520px] h-[450px] max-h-[70vh] sm:h-[550px] sm:max-h-[80vh] md:h-[650px] md:max-h-[85vh] top-[15%] sm:top-1/2 sm:-translate-y-1/2"
            } ${
              isAnimating
                ? "translate-x-0 opacity-100"
                : "translate-x-full opacity-0"
            }`}
          >
            {isMinimized ? (
              // Minimized State - Just the Jarvis Animation
              <div
                className="w-full h-full cursor-pointer group"
                onClick={onMinimize}
              >
                <div className="relative w-full h-full bg-black-100/90 backdrop-blur-md border border-blue-500/50 rounded-full flex items-center justify-center group-hover:border-blue-400/70 transition-all duration-300">
                  <JarvisAnimations
                    isActive={true}
                    size="small"
                    color="blue"
                    intensity="medium"
                  />

                  {/* Notification dot for new messages */}
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                </div>
              </div>
            ) : (
              // Full Interface
              <div className="w-full h-full bg-black-100/95 backdrop-blur-md border border-white/[0.2] rounded-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header - Fixed at top with ALWAYS VISIBLE Jarvis Animation */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/[0.1] bg-gradient-to-r from-blue-500/10 to-purple-500/10 flex-shrink-0 relative z-10">
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                    {/* ENHANCED: Jarvis Animation is ALWAYS visible when interface is loaded */}
                    <div className="flex-shrink-0">
                      <JarvisAnimations
                        isActive={true} // Always active when interface is visible
                        size="small"
                        color="blue"
                        intensity="medium"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-white font-semibold text-lg sm:text-xl truncate">
                        Gaurav's Personal Assistant
                      </h3>
                      <p className="text-gray-400 text-xs sm:text-sm mt-1 hidden sm:block">
                        AI-powered portfolio guide
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                    <button
                      onClick={onMinimize}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 flex items-center justify-center transition-all duration-200 hover:scale-105 relative z-[60]"
                      title="Minimize"
                    >
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 12H4"
                        />
                      </svg>
                    </button>

                    <button
                      onClick={onClose}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 flex items-center justify-center transition-all duration-200 hover:scale-105 relative z-[60]"
                      title="Close"
                    >
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5 text-red-400"
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
                  </div>
                </div>

                {/* Main Interface - Takes remaining space with Enhanced Error Handling */}
                <div className="flex-1 overflow-hidden min-h-0">
                  <EnhancedAssistantInterface />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ENHANCED: Additional floating Jarvis animation when interface is visible but not minimized */}
      {showMainInterface && !isMinimized && (
        <div className="fixed bottom-4 right-4 z-30 pointer-events-none">
          <div className="relative">
            {/* Subtle floating animation indicator */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 rounded-full blur-xl animate-pulse"></div>
            <JarvisAnimations
              isActive={true}
              size="small"
              color="cyan"
              intensity="low"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default EnhancedAssistantPopup;