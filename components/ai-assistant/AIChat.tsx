"use client";

import React, { useState, useRef, useEffect } from 'react';
import { AIChatProps } from './types';
import { JarvisLoader } from './JarvisAnimations';

const AIChat: React.FC<AIChatProps> = ({
  messages,
  onSendMessage,
  isLoading,
  error
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isLoading) return;

    const message = inputMessage.trim();
    setInputMessage('');
    setIsTyping(true);

    try {
      await onSendMessage(message);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatMessage = (content: string) => {
    // Simple formatting for links and line breaks
    return content
      .replace(/\n/g, '<br />')
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline">$1</a>');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
        {messages.length === 0 ? (
          // Welcome Message
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-white text-lg font-medium mb-2">Ask me anything!</h3>
            <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
              I can help you learn about Gaurav's projects, skills, experience, and more. Just type your question below.
            </p>
            <div className="mt-4 space-y-2 text-xs text-gray-500">
              <p>💡 Try asking: "What projects has Gaurav worked on?"</p>
              <p>🔧 Or: "What are Gaurav's technical skills?"</p>
            </div>
          </div>
        ) : (
          // Messages
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white ml-4'
                    : 'bg-black-100/50 border border-white/[0.1] text-white mr-4'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-xs text-gray-400">Assistant</span>
                  </div>
                )}
                
                <div
                  className="text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                />
                
                <div className="mt-2 text-xs opacity-60">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Typing Indicator */}
        {(isLoading || isTyping) && (
          <div className="flex justify-start">
            <div className="bg-black-100/50 border border-white/[0.1] rounded-lg p-3 mr-4">
              <div className="flex items-center space-x-2">
                <JarvisLoader size="small" />
                <span className="text-gray-400 text-sm">Assistant is thinking...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 max-w-xs">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-white/[0.1] p-3 sm:p-5 bg-black-100/30">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about Gaurav's portfolio..."
              disabled={isLoading}
              className="w-full bg-black-100/50 border border-white/[0.2] rounded-xl px-4 py-3 sm:px-5 sm:py-4 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            />
            
            {/* Character count */}
            <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500">
              {inputMessage.length}/500
            </div>
          </div>

          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading || inputMessage.length > 500}
            className="px-6 py-3 sm:px-7 sm:py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 disabled:hover:scale-100 flex items-center justify-center space-x-2 shadow-lg"
          >
            {isLoading ? (
              <JarvisLoader size="small" />
            ) : (
              <>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span className="hidden sm:inline">Send</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Actions */}
        <div className="mt-3 sm:mt-4 flex flex-wrap gap-2">
          {[
            "What projects has Gaurav worked on?",
            "What are his technical skills?",
            "How can I contact Gaurav?",
            "Show me his resume"
          ].map((suggestion, index) => (
            <button
              key={index}
              onClick={() => setInputMessage(suggestion)}
              disabled={isLoading}
              className="px-3 py-2 sm:px-4 sm:py-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] hover:border-white/[0.2] rounded-lg text-xs sm:text-sm text-gray-400 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
            >
              <span className="hidden sm:inline">{suggestion}</span>
              <span className="sm:hidden">
                {suggestion.includes('projects') ? 'Projects' :
                 suggestion.includes('skills') ? 'Skills' :
                 suggestion.includes('contact') ? 'Contact' : 'Resume'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIChat;