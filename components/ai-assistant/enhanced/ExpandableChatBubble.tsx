"use client";

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button, Icons } from '../design-system/components';

interface ExpandableChatBubbleProps {
  message: {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: string;
  };
  maxHeight?: number;
  maxCharacters?: number;
}

const ExpandableChatBubble: React.FC<ExpandableChatBubbleProps> = ({
  message,
  maxHeight = 200,
  maxCharacters = 300
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShowExpand, setShouldShowExpand] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const isAI = message.role === 'assistant';

  // Check if content needs expansion on mount and content change
  useEffect(() => {
    if (contentRef.current) {
      const element = contentRef.current;
      const needsExpansion = 
        element.scrollHeight > maxHeight || 
        message.content.length > maxCharacters;
      
      setShouldShowExpand(needsExpansion);
    }
  }, [message.content, maxHeight, maxCharacters]);

  // Format message content with basic markdown support
  const formatContent = (content: string) => {
    return content
      .replace(/\n/g, '<br />')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>');
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
    
    // Scroll the expanded content into view
    if (!isExpanded && contentRef.current) {
      setTimeout(() => {
        contentRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest' 
        });
      }, 150);
    }
  };

  return (
    <div className={cn(
      "flex w-full mb-4",
      isAI ? "justify-start" : "justify-end"
    )}>
      <div className={cn(
        "max-w-[85%] sm:max-w-[75%] rounded-xl px-4 py-3 shadow-sm transition-all duration-300",
        isAI 
          ? "bg-ai-surface-secondary border border-ai-border-light text-ai-text-primary" 
          : "bg-ai-primary-blue text-white"
      )}>
        {/* AI Assistant Header */}
        {isAI && (
          <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-ai-border-light">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-ai-primary-blue to-ai-primary-blue-light flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-ai-jarvis-pulse" />
            </div>
            <span className="text-xs font-medium text-ai-text-secondary">
              Gaurav's Assistant
            </span>
            <div className="flex-1" />
            <span className="text-xs text-ai-text-muted">
              {new Date(message.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
        )}

        {/* Message Content */}
        <div
          ref={contentRef}
          className={cn(
            "text-sm leading-relaxed transition-all duration-300 overflow-hidden",
            !isExpanded && shouldShowExpand && "line-clamp-6"
          )}
          style={{
            maxHeight: !isExpanded && shouldShowExpand ? `${maxHeight}px` : 'none'
          }}
        >
          <div 
            dangerouslySetInnerHTML={{ 
              __html: formatContent(message.content) 
            }}
            className="prose prose-sm max-w-none"
          />
        </div>

        {/* Expand/Collapse Button */}
        {shouldShowExpand && (
          <div className="mt-3 pt-2 border-t border-ai-border-light">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleExpand}
              className={cn(
                "w-full justify-center text-xs font-medium transition-all duration-200",
                isAI 
                  ? "text-ai-primary-blue hover:text-ai-primary-blue-dark hover:bg-ai-primary-blue/10" 
                  : "text-white/80 hover:text-white hover:bg-white/10"
              )}
              rightIcon={
                <Icons.Expand 
                  className={cn(
                    "w-3 h-3 transition-transform duration-200",
                    isExpanded && "rotate-180"
                  )} 
                />
              }
            >
              {isExpanded ? "Show Less" : "Read Full Response"}
            </Button>
          </div>
        )}

        {/* User Message Timestamp */}
        {!isAI && (
          <div className="mt-2 text-right">
            <span className="text-xs text-white/70">
              {new Date(message.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpandableChatBubble;