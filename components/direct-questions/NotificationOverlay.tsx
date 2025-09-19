// components/direct-questions/NotificationOverlay.tsx
// Persistent notification overlay for direct question answers

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useNotificationDisplay, useNotificationSound } from '@/hooks/useNotifications';
import type { DirectQuestionNotification } from '@/types/notifications';

interface NotificationOverlayProps {
  /** Custom className for styling */
  className?: string;
  /** Callback when notification is clicked */
  onNotificationClick?: (notification: DirectQuestionNotification) => void;
  /** Callback when AI assistant should be opened */
  onOpenAssistant?: () => void;
}

const NotificationOverlay: React.FC<NotificationOverlayProps> = ({
  className,
  onNotificationClick,
  onOpenAssistant
}) => {
  const { 
    showOverlay, 
    displayedNotifications, 
    closeOverlay, 
    actions 
  } = useNotificationDisplay();
  
  const { playSound } = useNotificationSound();
  const [animatingOut, setAnimatingOut] = useState<Set<string>>(new Set());
  const [hasPlayedSound, setHasPlayedSound] = useState(false);

  // Play sound when notifications appear
  useEffect(() => {
    if (displayedNotifications.length > 0 && !hasPlayedSound) {
      const soundType = displayedNotifications.length > 1 ? 'multiple_answers' : 'new_answer';
      playSound(soundType);
      setHasPlayedSound(true);
    }
  }, [displayedNotifications, playSound, hasPlayedSound]);

  // Reset sound flag when overlay closes
  useEffect(() => {
    if (!showOverlay) {
      setHasPlayedSound(false);
    }
  }, [showOverlay]);

  const handleNotificationClick = useCallback((notification: DirectQuestionNotification) => {
    if (onNotificationClick) {
      onNotificationClick(notification);
    } else {
      // Default behavior: open AI assistant
      onOpenAssistant?.();
    }
  }, [onNotificationClick, onOpenAssistant]);

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

  const handleViewInAssistant = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Mark all as read and close overlay
    const notificationIds = displayedNotifications.map(n => n.id);
    actions.markAsRead(notificationIds);
    
    // Open AI assistant
    onOpenAssistant?.();
    
    // Close overlay
    closeOverlay();
  }, [displayedNotifications, actions, onOpenAssistant, closeOverlay]);

  const handleCloseAll = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    closeOverlay();
  }, [closeOverlay]);

  if (!showOverlay || displayedNotifications.length === 0) {
    return null;
  }

  const mainNotification = displayedNotifications[0];
  const additionalCount = displayedNotifications.length - 1;

  return (
    <div className={cn(
      "fixed top-4 right-4 z-[9999] max-w-sm w-full",
      "pointer-events-auto",
      className
    )}>
      {/* Main notification card */}
      <div
        className={cn(
          "bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700",
          "backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl",
          "p-5 cursor-pointer transform transition-all duration-300",
          "hover:scale-105 hover:shadow-3xl",
          "animate-in slide-in-from-right-full duration-500",
          animatingOut.has(mainNotification.id) && "animate-out slide-out-to-right-full duration-300"
        )}
        onClick={() => handleNotificationClick(mainNotification)}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">💬</span>
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">
                {mainNotification.type === 'new_answer' ? 'New Answer from Gaurav!' : 'Gaurav Updated Answer!'}
              </h3>
              <p className="text-white/70 text-xs">
                {new Date(mainNotification.timestamp.toDate()).toLocaleTimeString()}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleDismissNotification.bind(null, mainNotification)}
            className="text-white/60 hover:text-white/90 transition-colors p-1"
            aria-label="Dismiss notification"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Question preview */}
        <div className="mb-3">
          <p className="text-white/90 text-sm font-medium mb-1">Your Question:</p>
          <p className="text-white/80 text-sm bg-white/10 rounded-lg p-2">
            {mainNotification.questionPreview}
          </p>
        </div>

        {/* Answer preview */}
        <div className="mb-4">
          <p className="text-white/90 text-sm font-medium mb-1">Gaurav's Answer:</p>
          <p className="text-white/80 text-sm bg-white/10 rounded-lg p-2 line-clamp-3">
            {mainNotification.answerPreview}
          </p>
        </div>

        {/* Additional notifications indicator */}
        {additionalCount > 0 && (
          <div className="mb-4 p-2 bg-white/10 rounded-lg">
            <p className="text-white/90 text-xs text-center">
              + {additionalCount} more answer{additionalCount > 1 ? 's' : ''} waiting
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleViewInAssistant}
            className={cn(
              "flex-1 bg-white/20 hover:bg-white/30 text-white",
              "rounded-lg px-3 py-2 text-sm font-medium",
              "transition-all duration-200 backdrop-blur-sm",
              "border border-white/30 hover:border-white/50"
            )}
          >
            View in Assistant
          </button>
          
          <button
            onClick={handleCloseAll}
            className={cn(
              "px-3 py-2 text-white/70 hover:text-white/90",
              "text-sm transition-colors"
            )}
          >
            Later
          </button>
        </div>

        {/* Pulsing indicator */}
        <div className="absolute -top-1 -right-1">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
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

export default NotificationOverlay;

// Utility component for showing a simple notification toast
export const NotificationToast: React.FC<{
  notification: DirectQuestionNotification;
  onClose: () => void;
  onClick?: () => void;
}> = ({ notification, onClose, onClick }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000); // Auto close after 5 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={cn(
        "bg-white border border-gray-200 rounded-lg shadow-lg p-4 mb-2",
        "cursor-pointer hover:shadow-xl transition-shadow",
        "animate-in slide-in-from-right duration-300"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-blue-600 text-sm">💬</span>
        </div>
        
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 text-sm">
            {notification.type === 'new_answer' ? 'New answer from Gaurav' : 'Answer updated'}
          </h4>
          <p className="text-gray-600 text-sm mt-1">{notification.questionPreview}</p>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Component for notification bell/indicator
export const NotificationBell: React.FC<{
  unreadCount: number;
  onClick?: () => void;
  className?: string;
}> = ({ unreadCount, onClick, className }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative p-2 text-gray-600 hover:text-gray-900 transition-colors",
        className
      )}
      aria-label={`${unreadCount} unread notifications`}
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
        />
      </svg>
      
      {unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      )}
    </button>
  );
};