// components/direct-questions/NotificationSystem.tsx
// Complete notification system with overlay, sound, and persistence

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useNotifications, useNotificationSound } from '@/hooks/useNotifications';
import type { DirectQuestionNotification } from '@/types/notifications';

interface NotificationSystemProps {
  /** Callback when AI assistant should be opened */
  onOpenAssistant?: () => void;
  /** Custom className for styling */
  className?: string;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({
  onOpenAssistant,
  className
}) => {
  const { 
    state, 
    unreadCount, 
    hasUnreadNotifications, 
    displayableNotifications,
    actions,
    isInitialized 
  } = useNotifications();
  
  const { playSound } = useNotificationSound();
  
  const [showOverlay, setShowOverlay] = useState(false);
  const [animatingOut, setAnimatingOut] = useState<Set<string>>(new Set());
  const [hasPlayedSound, setHasPlayedSound] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Listen for instant notification updates
  useEffect(() => {
    const handleNotificationUpdate = (event: CustomEvent) => {
      console.log('🚀 Instant notification update received:', event.detail);
      setForceUpdate(prev => prev + 1); // Force re-render
    };

    const handleStorageUpdate = (event: StorageEvent) => {
      if (event.key === 'direct_questions_notifications_update') {
        console.log('💾 Storage notification update received');
        setForceUpdate(prev => prev + 1); // Force re-render
      }
    };

    window.addEventListener('directQuestionNotifications', handleNotificationUpdate as EventListener);
    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      window.removeEventListener('directQuestionNotifications', handleNotificationUpdate as EventListener);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  // Auto-show overlay when there are displayable notifications
  useEffect(() => {
    if (isInitialized && displayableNotifications.length > 0 && state?.preferences.persistentOverlay) {
      setShowOverlay(true);
    }
  }, [isInitialized, displayableNotifications, state?.preferences.persistentOverlay, forceUpdate]);

  // Play sound when new notifications arrive
  useEffect(() => {
    if (displayableNotifications.length > 0 && !hasPlayedSound && state?.preferences.soundEnabled) {
      const soundType = displayableNotifications.length > 1 ? 'multiple_answers' : 'new_answer';
      playSound(soundType);
      setHasPlayedSound(true);
      
      // Reset sound flag after a delay to allow for new notifications
      setTimeout(() => setHasPlayedSound(false), 30000);
    }
  }, [displayableNotifications, playSound, hasPlayedSound, state?.preferences.soundEnabled, forceUpdate]);

  const handleNotificationClick = useCallback((notification: DirectQuestionNotification) => {
    // Mark this notification as read
    actions.markAsRead([notification.id]);
    
    // Open AI assistant to the ask-directly tab
    onOpenAssistant?.();
  }, [actions, onOpenAssistant]);

  const handleDismissNotification = useCallback((notification: DirectQuestionNotification, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Animate out
    setAnimatingOut(prev => new Set([...prev, notification.id]));
    
    // Remove after animation
    setTimeout(() => {
      actions.clearNotification(notification.id);
      setAnimatingOut(prev => {
        const next = new Set(prev);
        next.delete(notification.id);
        return next;
      });
    }, 300);
  }, [actions]);

  const handleViewAllInAssistant = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Mark all displayable notifications as read
    const notificationIds = displayableNotifications.map(n => n.id);
    actions.markAsRead(notificationIds);
    
    // Open AI assistant
    onOpenAssistant?.();
    
    // Hide overlay
    setShowOverlay(false);
  }, [displayableNotifications, actions, onOpenAssistant]);

  const handleCloseOverlay = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    setShowOverlay(false);
    
    // Mark notifications as shown (but not read)
    const notificationIds = displayableNotifications.map(n => n.id);
    actions.markAsShown(notificationIds);
  }, [displayableNotifications, actions]);

  if (!isInitialized || !showOverlay || displayableNotifications.length === 0) {
    return null;
  }

  const mainNotification = displayableNotifications[0];
  const additionalCount = displayableNotifications.length - 1;

  return (
    <div className={cn(
      "fixed top-4 right-4 z-[9999] max-w-sm w-full",
      "pointer-events-auto",
      className
    )}>
      {/* Simplified notification card */}
      <div
        className={cn(
          "bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700",
          "backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl",
          "p-4 cursor-pointer transform transition-all duration-300",
          "hover:scale-105 hover:shadow-3xl",
          "animate-in slide-in-from-right-full duration-500",
          animatingOut.has(mainNotification.id) && "animate-out slide-out-to-right-full duration-300"
        )}
        onClick={() => handleNotificationClick(mainNotification)}
      >
        {/* Simple header with dismiss */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-white text-lg">🎉</span>
            </div>
            <div>
              <h3 className="text-white font-semibold text-base">
                Gaurav answered your question!
              </h3>
              <p className="text-white/70 text-sm">
                Click to view {additionalCount > 0 ? `${additionalCount + 1} answers` : 'answer'}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleDismissNotification.bind(null, mainNotification)}
            className="text-white/60 hover:text-white/90 transition-colors p-1 rounded-full hover:bg-white/10"
            aria-label="Dismiss notification"
            title="Dismiss this notification"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Click hint */}
        <div className="flex items-center justify-center py-2 bg-white/10 rounded-lg border border-white/20">
          <p className="text-white/90 text-sm font-medium flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Click here to view
          </p>
        </div>

        {/* Pulsing indicator */}
        <div className="absolute -top-2 -right-2">
          <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
          <div className="absolute inset-0 w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
        </div>
      </div>

      {/* Multiple notifications stack effect */}
      {additionalCount > 0 && (
        <>
          <div className="absolute inset-0 -z-10 translate-x-1 translate-y-1 bg-blue-500/50 rounded-2xl backdrop-blur-sm" />
          {additionalCount > 1 && (
            <div className="absolute inset-0 -z-20 translate-x-2 translate-y-2 bg-blue-400/30 rounded-2xl backdrop-blur-sm" />
          )}
        </>
      )}
    </div>
  );
};

// Simple notification toast for when persistent overlay is disabled
export const NotificationToast: React.FC<{
  notification: DirectQuestionNotification;
  onClose: () => void;
  onClick?: () => void;
}> = ({ notification, onClose, onClick }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 8000); // Auto close after 8 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={cn(
        "bg-white border border-gray-200 rounded-xl shadow-xl p-4 mb-2",
        "cursor-pointer hover:shadow-2xl transition-all duration-200",
        "animate-in slide-in-from-right duration-300",
        "border-l-4 border-l-blue-500"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
          <span className="text-blue-600 text-sm">💬</span>
        </div>
        
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 text-sm">
            {notification.type === 'new_answer' ? '🎉 Gaurav answered your question!' : '📝 Gaurav updated their answer!'}
          </h4>
          <p className="text-gray-600 text-sm mt-1 leading-relaxed">{notification.questionPreview}</p>
          <p className="text-blue-600 text-xs mt-2 font-medium">Click to view answer →</p>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          title="Dismiss notification"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Notification bell component for header/navigation
export const NotificationBell: React.FC<{
  unreadCount: number;
  onClick?: () => void;
  className?: string;
  showBadge?: boolean;
}> = ({ unreadCount, onClick, className, showBadge = true }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative p-2 text-gray-600 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100",
        unreadCount > 0 && "text-blue-600 hover:text-blue-700",
        className
      )}
      aria-label={`${unreadCount} unread notifications`}
      title={unreadCount > 0 ? `You have ${unreadCount} unread answer${unreadCount > 1 ? 's' : ''}` : 'No notifications'}
    >
      <svg
        className={cn(
          "w-6 h-6 transition-transform",
          unreadCount > 0 && "animate-bounce"
        )}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      
      {showBadge && unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse font-bold shadow-lg">
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      )}
    </button>
  );
};

export default NotificationSystem;