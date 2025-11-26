'use client';

import React, { useState, useEffect } from 'react';
import { MessageCircle, X, WifiOff } from 'lucide-react';
import { useBubbleSession } from '@/contexts/BubbleSessionContext';
import { useChatBubbleControl } from '@/contexts/ChatBubbleControlContext';
import BubblePanel from './BubblePanel';
import networkManager from '@/lib/networkManager';

export default function ChatBubble() {
  const [isClosing, setIsClosing] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const { session, loading, markTooltipRead } = useBubbleSession();
  const { isOpen, viewMode, openBubble, closeBubble } = useChatBubbleControl();
  const [bubbleSettings, setBubbleSettings] = useState({
    bubbleColor: '#2563eb',
    enableTooltip: true,
    bubbleIcon: 'message-circle',
    bubbleSize: 'medium',
    showBubbleText: false,
    panelWidth: 400,
    panelHeight: 600,
    theme: 'light',
    soundEnabled: false,
  });

  // Fetch bubble settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/bubble/settings');
        if (response.ok) {
          const data = await response.json();
          setBubbleSettings({
            bubbleColor: data.settings.bubbleColor || '#2563eb',
            enableTooltip: data.settings.enableTooltip !== undefined ? data.settings.enableTooltip : true,
            bubbleIcon: data.settings.bubbleIcon || 'message-circle',
            bubbleSize: data.settings.bubbleSize || 'medium',
            showBubbleText: data.settings.showBubbleText !== undefined ? data.settings.showBubbleText : false,
            panelWidth: data.settings.panelWidth || 400,
            panelHeight: data.settings.panelHeight || 600,
            theme: data.settings.theme || 'light',
            soundEnabled: data.settings.soundEnabled !== undefined ? data.settings.soundEnabled : false,
          });
        }
      } catch (error) {
        console.error('Failed to fetch bubble settings:', error);
      }
    }
    fetchSettings();
  }, []);

  // Subscribe to network status
  useEffect(() => {
    const unsubscribe = networkManager.subscribe((status) => {
      setIsOffline(!status.isOnline);
    });
    return unsubscribe;
  }, []);

  // Check for unread tooltip
  useEffect(() => {
    console.log('[ChatBubble] Tooltip check:', {
      hasUnreadTooltip: session?.hasUnreadTooltip,
      enableTooltip: bubbleSettings.enableTooltip,
      isOpen,
      willShow: session?.hasUnreadTooltip && bubbleSettings.enableTooltip && !isOpen
    });
    
    if (session?.hasUnreadTooltip && bubbleSettings.enableTooltip && !isOpen) {
      console.log('[ChatBubble] 🔔 Showing tooltip!');
      setShowTooltip(true);
    } else {
      setShowTooltip(false);
    }
  }, [session?.hasUnreadTooltip, bubbleSettings.enableTooltip, isOpen]);

  const handleToggle = () => {
    if (bubbleSettings.soundEnabled) {
      // Play notification sound
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    }
    
    if (!isOpen && showTooltip) {
      markTooltipRead();
      setShowTooltip(false);
    }
    if (isOpen) {
      closeBubble();
    } else {
      openBubble('main');
    }
  };

  const handleClose = () => {
    // Trigger closing animation
    setIsClosing(true);
    
    // Wait for animation to complete before actually closing
    setTimeout(() => {
      closeBubble();
      setIsClosing(false);
    }, 300); // Match animation duration
  };

  return (
    <>
      {/* Backdrop - Click outside to close with animation */}
      {isOpen && (
        <div
          className={`fixed inset-0 bg-black/10 backdrop-blur-[1px] z-[999998] transition-all duration-300 ${
            isClosing ? 'animate-out fade-out' : 'animate-in fade-in'
          }`}
          onClick={handleClose}
        />
      )}

      {/* Chat Panel - Smooth Opening/Closing Animations */}
      {isOpen && (
        <div
          className={`
            fixed z-[999999] origin-bottom-right
            
            ${/* Mobile: Full screen with padding */''} 
            bottom-0 right-0 left-0 top-0 
            max-h-screen w-full
            
            ${/* Tablet & Desktop: Floating panel */''} 
            sm:bottom-20 sm:right-4 sm:left-auto sm:top-auto
            sm:max-h-[calc(100vh-100px)]
            
            shadow-2xl
            
            ${/* Mobile: No border radius */''} 
            rounded-none
            sm:rounded-xl
            
            ${isClosing ? 'animate-bubble-close' : 'animate-bubble-open'}
          `}
          style={{
            width: window.innerWidth < 640 ? '100%' : `${bubbleSettings.panelWidth}px`,
            height: window.innerWidth < 640 ? '100%' : `${bubbleSettings.panelHeight}px`,
            backgroundColor: bubbleSettings.theme === 'dark' ? '#1f2937' : '#ffffff',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <BubblePanel onClose={handleClose} initialViewMode={viewMode} theme={bubbleSettings.theme} />
        </div>
      )}

      {/* Chat Bubble Button - Mobile Optimized */}
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`
          fixed z-50 flex items-center gap-2 justify-center shadow-lg 
          transition-all duration-500 hover:scale-105 active:scale-95
          
          ${bubbleSettings.bubbleSize === 'small' ? 'w-12 h-12 sm:w-10 sm:h-10' : ''}
          ${bubbleSettings.bubbleSize === 'medium' ? 'w-16 h-16 sm:w-14 sm:h-14' : ''}
          ${bubbleSettings.bubbleSize === 'large' ? 'w-20 h-20 sm:w-16 sm:h-16' : ''}
          
          rounded-full
          
          ${/* Mobile: Larger touch target */''} 
          bottom-3 right-3
          
          ${/* Desktop: Standard size */''} 
          sm:bottom-4 sm:right-4
        `}
        style={{
          backgroundColor: isOffline ? '#6b7280' : bubbleSettings.bubbleColor,
          opacity: loading || isOpen ? 0 : 1,
          transform: loading ? 'scale(0.8)' : 'scale(1)',
          pointerEvents: loading || isOpen ? 'none' : 'auto',
        }}
        aria-label={isOffline ? "Chat offline" : "Open chat"}
      >
        {isOffline ? (
          <WifiOff className={`text-white ${
            bubbleSettings.bubbleSize === 'small' ? 'w-4 h-4 sm:w-3 sm:h-3' :
            bubbleSettings.bubbleSize === 'large' ? 'w-8 h-8 sm:w-7 sm:h-7' :
            'w-6 h-6 sm:w-5 sm:h-5'
          }`} />
        ) : isOpen ? (
          <X className={`text-white ${
            bubbleSettings.bubbleSize === 'small' ? 'w-4 h-4 sm:w-3 sm:h-3' :
            bubbleSettings.bubbleSize === 'large' ? 'w-8 h-8 sm:w-7 sm:h-7' :
            'w-6 h-6 sm:w-5 sm:h-5'
          }`} />
        ) : (
          <>
            <MessageCircle className={`text-white ${
              bubbleSettings.bubbleSize === 'small' ? 'w-4 h-4 sm:w-3 sm:h-3' :
              bubbleSettings.bubbleSize === 'large' ? 'w-8 h-8 sm:w-7 sm:h-7' :
              'w-6 h-6 sm:w-5 sm:h-5'
            }`} />
          </>
        )}
        
        {/* Offline indicator badge */}
        {isOffline && !isOpen && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
        )}
      </button>

      {/* Tooltip Cloud - Mobile Optimized */}
      {showTooltip && !isOpen && (
        <button
          onClick={() => {
            markTooltipRead();
            setShowTooltip(false);
            openBubble('chat'); // Open directly to chat interface
          }}
          className={`
            fixed z-[100000] 
            bg-gradient-to-br from-blue-500 to-blue-600 
            hover:from-blue-600 hover:to-blue-700 
            text-white shadow-2xl 
            transition-all duration-300 ease-out 
            hover:scale-105 active:scale-95 
            focus:outline-none focus:ring-4 focus:ring-blue-300 
            group
            
            ${/* Mobile: Bottom positioned, full width */''} 
            bottom-20 left-3 right-3 
            px-4 py-3 rounded-lg
            max-w-[calc(100vw-1.5rem)]
            
            ${/* Tablet & Desktop: Side positioned */''} 
            sm:bottom-20 sm:left-auto sm:right-4 
            sm:px-5 sm:py-4 sm:rounded-xl
            sm:max-w-[320px]
            md:max-w-[360px]
          `}
          style={{
            animation: 'tooltipEntrance 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
          aria-label="New message notification - Click to open chat"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start gap-2 sm:gap-3">
            <span className="text-xl sm:text-2xl flex-shrink-0 animate-bounce">💬</span>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm sm:text-base font-semibold mb-0.5 leading-tight truncate">
                You have a new reply from Gaurav
              </p>
              <p className="text-xs sm:text-sm opacity-90 font-medium leading-tight">
                Click to view
              </p>
            </div>
          </div>
          
          {/* Arrow pointing down - only on desktop */}
          <div
            className={`
              absolute -bottom-2 w-4 h-4 
              bg-gradient-to-br from-blue-500 to-blue-600 
              transform rotate-45 
              group-hover:from-blue-600 group-hover:to-blue-700 
              transition-all duration-300
              hidden sm:block
              right-6 sm:right-8
            `}
            style={{ boxShadow: '2px 2px 4px rgba(0,0,0,0.15)' }}
            aria-hidden="true"
          />
          
          {/* Subtle pulse ring */}
          <div 
            className="absolute inset-0 rounded-lg sm:rounded-xl bg-blue-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" 
            aria-hidden="true"
          />
        </button>
      )}

      <style jsx>{`
        @keyframes tooltipEntrance {
          0% {
            opacity: 0;
            transform: translateY(-20px) scale(0.8);
          }
          60% {
            opacity: 1;
            transform: translateY(5px) scale(1.05);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        /* Mobile-specific optimizations */
        @media (max-width: 640px) {
          /* Ensure panel covers full screen on mobile */
          div[class*="fixed"][class*="z-[999999]"] {
            overscroll-behavior: contain;
          }
        }
        
        /* Touch device optimizations */
        @media (hover: none) and (pointer: coarse) {
          button[aria-label*="New message notification"],
          button[aria-label*="Open chat"],
          button[aria-label*="Chat offline"] {
            /* Larger tap targets for touch */
            min-height: 44px;
            min-width: 44px;
          }
        }
      `}</style>
    </>
  );
}
