"use client";

import React, { useState, useEffect } from 'react';
import { AssistantInterfaceProps, AIQuestion, ChatMessage } from './types';
import PredefinedQuestions from './PredefinedQuestions';
import AIChat from './AIChat';

const AssistantInterface: React.FC<Partial<AssistantInterfaceProps>> = ({
  activeTab: initialActiveTab = 'predefined',
  onTabChange,
  questions = [],
  chatMessages = [],
  onQuestionClick,
  onSendMessage,
  isLoading = false,
  error
}) => {
  const [activeTab, setActiveTab] = useState<'predefined' | 'chat'>(initialActiveTab);
  const [localQuestions, setLocalQuestions] = useState<AIQuestion[]>([]);
  const [localChatMessages, setLocalChatMessages] = useState<ChatMessage[]>([]);
  const [localIsLoading, setLocalIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | undefined>();

  // Fetch predefined questions on mount
  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLocalIsLoading(true);
      const response = await fetch('/api/ai-assistant/questions');
      const data = await response.json();
      
      if (data.success) {
        setLocalQuestions(data.data?.questions || []);
      } else {
        setLocalError(data.error || 'Failed to load questions');
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      setLocalError('Failed to load questions');
    } finally {
      setLocalIsLoading(false);
    }
  };

  const handleTabChange = (tab: 'predefined' | 'chat') => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const handleQuestionClick = async (question: AIQuestion) => {
    try {
      // If question has an anchor link, scroll to it
      if (question.anchorLink) {
        const element = document.querySelector(question.anchorLink);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }

      // If question has a file URL, handle download
      if (question.fileUrl) {
        window.open(question.fileUrl, '_blank');
      }

      onQuestionClick?.(question);
    } catch (error) {
      console.error('Error handling question click:', error);
    }
  };

  const handleSendMessage = async (message: string) => {
    try {
      setLocalIsLoading(true);
      setLocalError(undefined);

      // Add user message to chat
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        content: message,
        role: 'user',
        timestamp: new Date().toISOString()
      };

      setLocalChatMessages(prev => [...prev, userMessage]);

      // Send to AI
      const response = await fetch('/api/ai-assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: ChatMessage = {
          id: data.data?.messageId || (Date.now() + 1).toString(),
          content: data.data?.message || 'Sorry, I encountered an error.',
          role: 'assistant',
          timestamp: new Date().toISOString()
        };

        setLocalChatMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to get AI response');
      }

      onSendMessage?.(message);
    } catch (error) {
      console.error('Error sending message:', error);
      setLocalError('Failed to send message. Please try again.');
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        role: 'assistant',
        timestamp: new Date().toISOString()
      };

      setLocalChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setLocalIsLoading(false);
    }
  };

  const finalQuestions = questions.length > 0 ? questions : localQuestions;
  const finalChatMessages = chatMessages.length > 0 ? chatMessages : localChatMessages;
  const finalIsLoading = isLoading || localIsLoading;
  const finalError = error || localError;

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="flex border-b border-white/[0.1] bg-black-100/50">
        <button
          onClick={() => handleTabChange('predefined')}
          className={`flex-1 px-6 py-4 text-sm font-medium transition-all duration-200 relative ${
            activeTab === 'predefined'
              ? 'text-white bg-blue-500/10 border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
          }`}
        >
          <div className="flex items-center justify-center space-x-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>📋 Predefined Questions</span>
          </div>
          
          {finalQuestions.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-semibold">
              {finalQuestions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange('chat')}
          className={`flex-1 px-6 py-4 text-sm font-medium transition-all duration-200 relative ${
            activeTab === 'chat'
              ? 'text-white bg-purple-500/10 border-b-2 border-purple-500'
              : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
          }`}
        >
          <div className="flex items-center justify-center space-x-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>💬 Ask AI</span>
          </div>

          {finalChatMessages.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-semibold">
              {finalChatMessages.filter(m => m.role === 'user').length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'predefined' ? (
          <PredefinedQuestions
            questions={finalQuestions}
            onQuestionClick={handleQuestionClick}
            isLoading={finalIsLoading}
            error={finalError}
          />
        ) : (
          <AIChat
            messages={finalChatMessages}
            onSendMessage={handleSendMessage}
            isLoading={finalIsLoading}
            error={finalError}
          />
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/[0.1] bg-black-100/30 flex-shrink-0">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>Powered by OpenRouter AI</span>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>Online</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssistantInterface;