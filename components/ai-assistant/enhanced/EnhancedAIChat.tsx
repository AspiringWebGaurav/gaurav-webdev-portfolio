"use client";

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button, Input, Badge, Spinner, Icons } from '../design-system/components';
import ExpandableChatBubble from './ExpandableChatBubble';
import { ChatMessage } from '../types';

interface EnhancedAIChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  error?: string;
  aiEnabled?: boolean;
  suggestedPrompts?: string[];
}

const SUGGESTED_PROMPTS = [
  "Tell me more about Gaurav's development approach",
  "What makes Gaurav's work unique?",
  "How does Gaurav stay updated with technology trends?",
  "What's Gaurav's preferred tech stack for new projects?",
  "Can you explain Gaurav's problem-solving methodology?",
  "What are Gaurav's future career goals?"
];

const EnhancedAIChat: React.FC<EnhancedAIChatProps> = ({
  messages,
  onSendMessage,
  isLoading,
  error,
  aiEnabled = false,
  suggestedPrompts = []
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [dynamicPrompts, setDynamicPrompts] = useState<string[]>(SUGGESTED_PROMPTS);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [messages, isLoading]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Hide suggestions after first message
  useEffect(() => {
    if (messages.length > 0) {
      setShowSuggestions(false);
    }
  }, [messages.length]);

  // Update dynamic prompts based on user input
  useEffect(() => {
    if (suggestedPrompts.length > 0) {
      setDynamicPrompts(suggestedPrompts);
    } else {
      setDynamicPrompts(SUGGESTED_PROMPTS);
    }
  }, [suggestedPrompts]);

  // Update suggestions when user types
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputMessage(value);
    
    // Generate contextual prompts if AI is enabled and user is typing
    if (aiEnabled && value.length > 2) {
      // This would be handled by the parent component through suggestedPrompts prop
      // For now, we'll show suggestions based on input
      setShowSuggestions(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isLoading) return;

    const message = inputMessage.trim();
    setInputMessage('');
    setShowSuggestions(false);

    try {
      await onSendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInputMessage(prompt);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const clearChat = () => {
    // This would need to be implemented in the parent component
    setShowSuggestions(true);
  };

  return (
    <div className="flex flex-col h-full bg-ai-surface-primary">
      {/* Chat Header - Mobile Optimized */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-ai-border-light bg-ai-surface-secondary">
        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-ai-primary-blue to-ai-primary-blue-light flex items-center justify-center flex-shrink-0">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full animate-ai-jarvis-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-ai-text-primary text-sm sm:text-base">AI Chat</h3>
            <p className="text-xs text-ai-text-secondary truncate">
              <span className="hidden sm:inline">Ask me anything about Gaurav's portfolio</span>
              <span className="sm:hidden">Ask about Gaurav's work</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          <Badge
            variant={aiEnabled ? "success" : "warning"}
            size="sm"
            className="text-xs"
          >
            <span className="hidden sm:inline">{aiEnabled ? 'AI Online' : 'Demo Mode'}</span>
            <span className="sm:hidden">{aiEnabled ? 'AI' : 'Demo'}</span>
          </Badge>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="text-ai-text-tertiary hover:text-ai-text-primary p-1.5 sm:p-2"
            >
              <span className="hidden sm:inline text-xs">Clear</span>
              <span className="sm:hidden">✕</span>
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area - Mobile Optimized */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 custom-scrollbar"
      >
        {messages.length === 0 ? (
          // Welcome Message - Mobile Optimized
          <div className="flex flex-col items-center justify-center h-full text-center py-4 sm:py-8 px-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-ai-primary-blue/20 to-ai-primary-blue-light/20 flex items-center justify-center mb-3 sm:mb-4">
              <Icons.Chat className="w-6 h-6 sm:w-8 sm:h-8 text-ai-primary-blue" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-ai-text-primary mb-2">
              Hello — I'm Gaurav's Assistant
            </h3>
            <p className="text-ai-text-secondary max-w-sm leading-relaxed mb-4 sm:mb-6 text-sm sm:text-base">
              {aiEnabled
                ? "Ask me anything about Gaurav's projects, skills, and experience. I'm powered by AI to provide intelligent responses."
                : "I'm in demo mode. Ask questions to see sample responses, or configure OpenRouter API for full AI functionality."
              }
            </p>
            
            {/* Quick Start Tips - Mobile Optimized */}
            <div className="bg-ai-surface-secondary rounded-lg p-3 sm:p-4 max-w-md w-full">
              <h4 className="font-medium text-ai-text-primary mb-2 text-sm sm:text-base">💡 Try asking:</h4>
              <ul className="text-xs sm:text-sm text-ai-text-secondary space-y-1 text-left">
                <li>• "Tell me about Gaurav's development approach"</li>
                <li>• "What makes his work unique?"</li>
                <li>• "How does he stay updated with trends?"</li>
              </ul>
              <p className="text-xs text-ai-text-muted mt-2 sm:mt-3 italic text-center">
                <span className="hidden sm:inline">For quick answers about projects, skills, and contact info, check the "Quick Questions" tab!</span>
                <span className="sm:hidden">Check "Quick Questions" for instant answers!</span>
              </p>
            </div>
          </div>
        ) : (
          // Chat Messages
          <>
            {messages.map((message) => (
              <ExpandableChatBubble
                key={message.id}
                message={message}
                maxHeight={200}
                maxCharacters={300}
              />
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-ai-surface-secondary border border-ai-border-light rounded-xl px-4 py-3 max-w-[200px]">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-ai-primary-blue to-ai-primary-blue-light flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full animate-ai-jarvis-pulse" />
                    </div>
                    <span className="text-sm text-ai-text-secondary">Thinking...</span>
                    <Spinner size="sm" className="text-ai-primary-blue" />
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex justify-center">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-w-md">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 text-red-500">⚠️</div>
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts - Mobile Optimized */}
      {showSuggestions && (
        <div className="px-3 sm:px-4 py-2 border-t border-ai-border-light bg-ai-surface-secondary">
          <p className="text-xs font-medium text-ai-text-secondary mb-2">
            Suggested prompts:
          </p>
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 pb-2 min-w-max sm:flex-wrap sm:min-w-0">
              {dynamicPrompts.slice(0, 4).map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedPrompt(prompt)}
                  disabled={isLoading}
                  className="px-3 py-1.5 bg-ai-surface-primary hover:bg-ai-primary-blue/10 border border-ai-border-light hover:border-ai-primary-blue/30 rounded-lg text-xs text-ai-text-secondary hover:text-ai-primary-blue transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap touch-manipulation"
                >
                  <span className="sm:hidden">
                    {prompt.length > 30 ? `${prompt.substring(0, 30)}...` : prompt}
                  </span>
                  <span className="hidden sm:inline">{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Area - Mobile Optimized */}
      <div className="p-3 sm:p-4 border-t border-ai-border-light bg-ai-surface-primary">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0">
          <div className="flex-1">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={aiEnabled
                ? "Ask me anything..."
                : "Demo mode - ask anything..."
              }
              disabled={isLoading}
              className="resize-none text-sm"
              leftIcon={<Icons.Chat className="w-4 h-4" />}
            />
            
            {/* Character count - Mobile optimized */}
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-ai-text-muted">
                {inputMessage.length}/500
              </span>
              {inputMessage.length > 450 && (
                <span className="text-xs text-ai-secondary-amber">
                  <span className="hidden sm:inline">Character limit approaching</span>
                  <span className="sm:hidden">Limit approaching</span>
                </span>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={!inputMessage.trim() || isLoading || inputMessage.length > 500}
            isLoading={isLoading}
            className="self-start sm:self-start w-full sm:w-auto touch-manipulation"
            rightIcon={!isLoading && <Icons.ChevronRight className="w-4 h-4" />}
          >
            <span className="sm:hidden">Send Message</span>
            <span className="hidden sm:inline">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
};

export default EnhancedAIChat;