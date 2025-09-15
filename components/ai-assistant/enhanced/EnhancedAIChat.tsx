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
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-ai-border-light bg-ai-surface-secondary">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-ai-primary-blue to-ai-primary-blue-light flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full animate-ai-jarvis-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-ai-text-primary">AI Chat</h3>
            <p className="text-xs text-ai-text-secondary">
              Ask me anything about Gaurav's portfolio
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge
            variant={aiEnabled ? "success" : "warning"}
            size="sm"
          >
            {aiEnabled ? 'AI Online' : 'Demo Mode'}
          </Badge>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="text-ai-text-tertiary hover:text-ai-text-primary"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
      >
        {messages.length === 0 ? (
          // Welcome Message
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-ai-primary-blue/20 to-ai-primary-blue-light/20 flex items-center justify-center mb-4">
              <Icons.Chat className="w-8 h-8 text-ai-primary-blue" />
            </div>
            <h3 className="text-lg font-semibold text-ai-text-primary mb-2">
              Hello — I'm Gaurav's Assistant
            </h3>
            <p className="text-ai-text-secondary max-w-sm leading-relaxed mb-6">
              {aiEnabled
                ? "Ask me anything about Gaurav's projects, skills, experience, and more. I'm powered by AI to provide intelligent responses."
                : "I'm running in demo mode. Ask questions to see sample responses, or configure OpenRouter API for full AI functionality."
              }
            </p>
            
            {/* Quick Start Tips */}
            <div className="bg-ai-surface-secondary rounded-lg p-4 max-w-md">
              <h4 className="font-medium text-ai-text-primary mb-2">💡 Try asking:</h4>
              <ul className="text-sm text-ai-text-secondary space-y-1">
                <li>• "Tell me about Gaurav's development approach"</li>
                <li>• "What makes his work unique?"</li>
                <li>• "How does he stay updated with trends?"</li>
              </ul>
              <p className="text-xs text-ai-text-muted mt-3 italic">
                For quick answers about projects, skills, and contact info, check the "Quick Questions" tab!
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

      {/* Suggested Prompts */}
      {showSuggestions && (
        <div className="px-4 py-2 border-t border-ai-border-light bg-ai-surface-secondary">
          <p className="text-xs font-medium text-ai-text-secondary mb-2">
            Suggested prompts:
          </p>
          <div className="flex flex-wrap gap-2">
            {dynamicPrompts.slice(0, 4).map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleSuggestedPrompt(prompt)}
                disabled={isLoading}
                className="px-3 py-1.5 bg-ai-surface-primary hover:bg-ai-primary-blue/10 border border-ai-border-light hover:border-ai-primary-blue/30 rounded-lg text-xs text-ai-text-secondary hover:text-ai-primary-blue transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-ai-border-light bg-ai-surface-primary">
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <div className="flex-1">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={aiEnabled
                ? "Type your question for AI-powered responses..."
                : "Type your question (demo mode - configure API for AI responses)..."
              }
              disabled={isLoading}
              className="resize-none"
              leftIcon={<Icons.Chat className="w-4 h-4" />}
            />
            
            {/* Character count */}
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-ai-text-muted">
                {inputMessage.length}/500
              </span>
              {inputMessage.length > 450 && (
                <span className="text-xs text-ai-secondary-amber">
                  Character limit approaching
                </span>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={!inputMessage.trim() || isLoading || inputMessage.length > 500}
            isLoading={isLoading}
            className="self-start"
            rightIcon={!isLoading && <Icons.ChevronRight className="w-4 h-4" />}
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  );
};

export default EnhancedAIChat;