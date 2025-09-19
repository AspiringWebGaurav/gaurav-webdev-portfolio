"use client";

import React from 'react';
import { Timestamp } from 'firebase/firestore';
import type { QuestionStatus as StatusType } from '@/lib/types';

interface QuestionStatusProps {
  /** The status of the question */
  status: StatusType;
  /** When the question was created */
  createdAt: Timestamp;
  /** When the question was answered (null if not answered) */
  answeredAt: Timestamp | null;
  /** Whether the visitor has unread updates */
  unreadForVisitor?: boolean;
  /** Whether to show timestamp */
  showTimestamp?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Layout orientation */
  orientation?: 'horizontal' | 'vertical';
}

const getStatusConfig = (status: StatusType) => {
  switch (status) {
    case 'unanswered':
      return {
        label: 'Unanswered',
        icon: '⏳',
        bgColor: 'bg-yellow-500/20',
        borderColor: 'border-yellow-500/30',
        textColor: 'text-yellow-400',
        pulseColor: 'bg-yellow-500'
      };
    case 'answered':
      return {
        label: 'Answered',
        icon: '✅',
        bgColor: 'bg-green-500/20',
        borderColor: 'border-green-500/30',
        textColor: 'text-green-400',
        pulseColor: 'bg-green-500'
      };
    case 'archived':
      return {
        label: 'Archived',
        icon: '📁',
        bgColor: 'bg-gray-500/20',
        borderColor: 'border-gray-500/30',
        textColor: 'text-gray-400',
        pulseColor: 'bg-gray-500'
      };
    default:
      return {
        label: 'Unknown',
        icon: '❓',
        bgColor: 'bg-gray-500/20',
        borderColor: 'border-gray-500/30',
        textColor: 'text-gray-400',
        pulseColor: 'bg-gray-500'
      };
  }
};

const getSizeClasses = (size: 'sm' | 'md' | 'lg') => {
  switch (size) {
    case 'sm':
      return {
        container: 'text-xs',
        badge: 'px-2 py-1 text-xs',
        icon: 'text-sm',
        timestamp: 'text-xs'
      };
    case 'lg':
      return {
        container: 'text-base',
        badge: 'px-4 py-2 text-base',
        icon: 'text-lg',
        timestamp: 'text-base'
      };
    default: // md
      return {
        container: 'text-sm',
        badge: 'px-3 py-1.5 text-sm',
        icon: 'text-base',
        timestamp: 'text-sm'
      };
  }
};

const formatTimestamp = (timestamp: Timestamp | null): string => {
  if (!timestamp || !timestamp.toDate) {
    return 'Just now';
  }

  try {
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  } catch (error) {
    console.warn('Error formatting timestamp:', error);
    return 'Just now';
  }
};

export default function QuestionStatus({
  status,
  createdAt,
  answeredAt,
  unreadForVisitor = false,
  showTimestamp = true,
  size = 'md',
  orientation = 'horizontal'
}: QuestionStatusProps) {
  const statusConfig = getStatusConfig(status);
  const sizeClasses = getSizeClasses(size);
  
  const displayTimestamp = (answeredAt && status === 'answered') ? answeredAt : createdAt;
  const timestampLabel = answeredAt && status === 'answered' ? 'Answered' : 'Asked';

  const isVertical = orientation === 'vertical';

  return (
    <div className={`
      flex items-center gap-2 
      ${isVertical ? 'flex-col items-start' : 'flex-row items-center'}
      ${sizeClasses.container}
    `}>
      {/* Status Badge */}
      <div className="relative">
        <div className={`
          inline-flex items-center gap-1.5 rounded-full border
          ${statusConfig.bgColor} ${statusConfig.borderColor}
          ${sizeClasses.badge}
          font-medium transition-all duration-200
          backdrop-blur-sm
        `}>
          <span className={`${sizeClasses.icon}`}>
            {statusConfig.icon}
          </span>
          <span className={statusConfig.textColor}>
            {statusConfig.label}
          </span>
        </div>

        {/* Unread Indicator */}
        {unreadForVisitor && (
          <div className={`
            absolute -top-1 -right-1 w-3 h-3 rounded-full
            ${statusConfig.pulseColor}
            animate-pulse border-2 border-slate-900
          `} />
        )}
      </div>

      {/* Timestamp */}
      {showTimestamp && (
        <div className={`
          text-slate-400 
          ${sizeClasses.timestamp}
          ${isVertical ? 'mt-1' : ''}
        `}>
          <span className="text-slate-500 font-medium">
            {timestampLabel}:
          </span>{' '}
          {formatTimestamp(displayTimestamp)}
        </div>
      )}

      {/* Status Pulse Animation for Unanswered */}
      {status === 'unanswered' && (
        <div className={`
          w-2 h-2 rounded-full ${statusConfig.pulseColor}
          animate-pulse opacity-60
          ${isVertical ? 'self-center' : ''}
        `} />
      )}
    </div>
  );
}

// Additional status indicator variants
export function QuestionStatusBadge({ 
  status, 
  size = 'sm',
  showIcon = true 
}: { 
  status: StatusType; 
  size?: 'sm' | 'md'; 
  showIcon?: boolean;
}) {
  const config = getStatusConfig(status);
  const sizeClasses = getSizeClasses(size);

  return (
    <span className={`
      inline-flex items-center gap-1 rounded-full border
      ${config.bgColor} ${config.borderColor}
      ${sizeClasses.badge}
      font-medium backdrop-blur-sm
    `}>
      {showIcon && <span className={sizeClasses.icon}>{config.icon}</span>}
      <span className={config.textColor}>{config.label}</span>
    </span>
  );
}

export function QuestionStatusDot({ 
  status, 
  size = 'md' 
}: { 
  status: StatusType; 
  size?: 'sm' | 'md' | 'lg';
}) {
  const config = getStatusConfig(status);
  
  const dotSize = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }[size];

  return (
    <div 
      className={`
        ${dotSize} rounded-full ${config.pulseColor}
        ${status === 'unanswered' ? 'animate-pulse' : ''}
      `}
      title={config.label}
    />
  );
}