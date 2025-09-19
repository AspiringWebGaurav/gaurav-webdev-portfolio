"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import AskDirectlyModal from './AskDirectlyModal';
import { 
  getCurrentVisitorStats, 
  getQuestionListenerManager,
  cleanupAskDirectlyUtils 
} from '@/lib/askDirectly';
import type { VisitorQuestionStats } from '@/lib/types';

interface AskDirectlyButtonProps {
  /** Position of the button */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Custom offset from edges */
  offset?: {
    x?: number;
    y?: number;
  };
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show notification badge */
  showNotificationBadge?: boolean;
  /** Whether to enable real-time updates */
  enableRealTime?: boolean;
  /** Custom button label */
  label?: string;
  /** Whether to show label on hover */
  showLabelOnHover?: boolean;
  /** Custom className */
  className?: string;
  /** Whether the button starts hidden (for animations) */
  initiallyHidden?: boolean;
  /** Delay before showing button (in ms) */
  showDelay?: number;
}

const getPositionClasses = (position: string, offset: { x: number; y: number }) => {
  switch (position) {
    case 'bottom-right':
      return `bottom-${offset.y} right-${offset.x}`;
    case 'bottom-left':
      return `bottom-${offset.y} left-${offset.x}`;
    case 'top-right':
      return `top-${offset.y} right-${offset.x}`;
    case 'top-left':
      return `top-${offset.y} left-${offset.x}`;
    default:
      return `bottom-${offset.y} right-${offset.x}`;
  }
};

const getSizeClasses = (size: string) => {
  switch (size) {
    case 'sm':
      return {
        button: 'w-12 h-12',
        icon: 'text-lg',
        badge: 'text-xs w-5 h-5',
        label: 'text-sm'
      };
    case 'lg':
      return {
        button: 'w-16 h-16',
        icon: 'text-2xl',
        badge: 'text-sm w-6 h-6',
        label: 'text-base'
      };
    default: // md
      return {
        button: 'w-14 h-14',
        icon: 'text-xl',
        badge: 'text-xs w-5 h-5',
        label: 'text-sm'
      };
  }
};

const NotificationBadge = ({ 
  count, 
  size 
}: { 
  count: number; 
  size: string;
}) => {
  if (count === 0) return null;

  const sizeClasses = getSizeClasses(size);

  return (
    <div className={`
      absolute -top-1 -right-1 ${sizeClasses.badge}
      bg-green-500 text-white rounded-full
      flex items-center justify-center font-bold
      animate-pulse border-2 border-slate-900
      shadow-lg
    `}>
      {count > 99 ? '99+' : count}
    </div>
  );
};

const FloatingLabel = ({ 
  label, 
  isVisible, 
  position, 
  size 
}: { 
  label: string; 
  isVisible: boolean; 
  position: string;
  size: string;
}) => {
  const sizeClasses = getSizeClasses(size);
  
  const getLabelPosition = () => {
    if (position.includes('right')) {
      return 'right-full mr-3';
    } else {
      return 'left-full ml-3';
    }
  };

  return (
    <div className={`
      absolute top-1/2 -translate-y-1/2 ${getLabelPosition()}
      px-3 py-2 bg-slate-900 text-white rounded-lg shadow-lg
      border border-slate-700 backdrop-blur-sm
      ${sizeClasses.label} font-medium whitespace-nowrap
      transition-all duration-200 pointer-events-none
      ${isVisible 
        ? 'opacity-100 translate-x-0' 
        : 'opacity-0 translate-x-2'
      }
    `}>
      {label}
      {/* Arrow */}
      <div className={`
        absolute top-1/2 -translate-y-1/2 w-2 h-2
        bg-slate-900 border-slate-700 rotate-45
        ${position.includes('right') ? '-right-1 border-r border-b' : '-left-1 border-l border-t'}
      `} />
    </div>
  );
};

export default function AskDirectlyButton({
  position = 'bottom-right',
  offset = { x: 6, y: 6 },
  size = 'md',
  showNotificationBadge = true,
  enableRealTime = true,
  label = "Ask me anything",
  showLabelOnHover = true,
  className = "",
  initiallyHidden = true,
  showDelay = 2000
}: AskDirectlyButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState<VisitorQuestionStats | null>(null);
  const [isVisible, setIsVisible] = useState(!initiallyHidden);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  const buttonRef = useRef<HTMLButtonElement>(null);
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Show button after delay
  useEffect(() => {
    if (initiallyHidden && showDelay > 0) {
      showTimeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, showDelay);

      return () => {
        if (showTimeoutRef.current) {
          clearTimeout(showTimeoutRef.current);
          showTimeoutRef.current = null;
        }
      };
    }
  }, [initiallyHidden, showDelay]);

  // Load initial stats
  useEffect(() => {
    if (showNotificationBadge) {
      getCurrentVisitorStats().then(setStats);
    }
  }, [showNotificationBadge]);

  // Setup real-time listener for stats updates
  useEffect(() => {
    if (!enableRealTime || !showNotificationBadge) return;

    const listenerManager = getQuestionListenerManager();
    
    const listener = listenerManager.setupCurrentVisitorListener(
      (questions) => {
        // Calculate stats from questions
        const newStats: VisitorQuestionStats = {
          totalQuestions: questions.length,
          unanswered: questions.filter(q => q.status === 'unanswered').length,
          answered: questions.filter(q => q.status === 'answered').length,
          archived: questions.filter(q => q.status === 'archived').length,
          unread: questions.filter(q => q.unreadForVisitor).length,
          lastQuestionAt: questions.length > 0 
            ? questions.reduce((latest, q) => 
                q.createdAt.toDate() > latest.toDate() ? q.createdAt : latest, 
                questions[0].createdAt
              )
            : null
        };
        setStats(newStats);
      },
      {
        showToastOnUpdate: false, // Don't show toast from button listener
        onlyWhenVisible: true
      }
    );

    return () => {
      listener.unsubscribe();
    };
  }, [enableRealTime, showNotificationBadge]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
        showTimeoutRef.current = null;
      }
      cleanupAskDirectlyUtils();
    };
  }, []);

  const handleClick = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const handleMouseDown = useCallback(() => {
    setIsPressed(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsPressed(false);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  const sizeClasses = getSizeClasses(size);
  const positionClasses = getPositionClasses(position, {
    x: offset.x || 6,
    y: offset.y || 6
  });

  const unreadCount = stats?.unread || 0;

  if (!isVisible) return null;

  return (
    <>
      <div className={`fixed ${positionClasses} z-40 ${className}`}>
        {/* Floating Label */}
        {showLabelOnHover && (
          <FloatingLabel
            label={label}
            isVisible={isHovered}
            position={position}
            size={size}
          />
        )}

        {/* Main Button */}
        <button
          ref={buttonRef}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onKeyDown={handleKeyDown}
          className={`
            ${sizeClasses.button}
            bg-gradient-to-r from-blue-500 to-purple-600
            hover:from-blue-600 hover:to-purple-700
            active:from-blue-700 active:to-purple-800
            text-white rounded-full shadow-2xl
            transition-all duration-300 ease-out
            focus:outline-none focus:ring-4 focus:ring-blue-500/30
            relative group overflow-hidden
            ${isHovered ? 'scale-110 shadow-3xl' : 'scale-100'}
            ${isPressed ? 'scale-95' : ''}
            ${isVisible ? 'animate-in slide-in-from-bottom-8 fade-in duration-500' : ''}
          `}
          aria-label={`${label}${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          title={`${label}${unreadCount > 0 ? ` - ${unreadCount} unread answer${unreadCount > 1 ? 's' : ''}` : ''}`}
        >
          {/* Background Animation */}
          <div className="
            absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 
            opacity-0 group-hover:opacity-100 transition-opacity duration-300
          " />
          
          {/* Ripple Effect */}
          <div className="
            absolute inset-0 bg-white/20 rounded-full scale-0 
            group-active:scale-100 group-active:opacity-50 
            transition-all duration-200 ease-out
          " />
          
          {/* Icon */}
          <div className={`relative z-10 ${sizeClasses.icon} flex items-center justify-center`}>
            💬
          </div>

          {/* Notification Badge */}
          {showNotificationBadge && (
            <NotificationBadge count={unreadCount} size={size} />
          )}

          {/* Pulse Animation for New Messages */}
          {unreadCount > 0 && (
            <div className="
              absolute inset-0 rounded-full border-2 border-green-400
              animate-ping opacity-75
            " />
          )}
        </button>

        {/* Floating Ring Animation */}
        <div className={`
          absolute inset-0 ${sizeClasses.button} rounded-full
          border-2 border-blue-400/30 scale-100
          ${isHovered ? 'animate-ping' : ''}
        `} />
      </div>

      {/* Modal */}
      <AskDirectlyModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        initialView="form"
        showViewToggle={true}
      />
    </>
  );
}

// Export variants for different use cases
export function CompactAskButton({
  position = 'bottom-right',
  ...props
}: Omit<AskDirectlyButtonProps, 'size' | 'showLabelOnHover'>) {
  return (
    <AskDirectlyButton
      {...props}
      position={position}
      size="sm"
      showLabelOnHover={false}
    />
  );
}

export function LargeAskButton({
  position = 'bottom-right',
  ...props
}: Omit<AskDirectlyButtonProps, 'size'>) {
  return (
    <AskDirectlyButton
      {...props}
      position={position}
      size="lg"
    />
  );
}

export function SimpleAskButton({
  position = 'bottom-right',
  ...props
}: Omit<AskDirectlyButtonProps, 'showNotificationBadge' | 'enableRealTime'>) {
  return (
    <AskDirectlyButton
      {...props}
      position={position}
      showNotificationBadge={false}
      enableRealTime={false}
    />
  );
}