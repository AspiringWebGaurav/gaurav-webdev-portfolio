"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { AssistantInterfaceProps, AIQuestion, ChatMessage } from './types';
import AssistantInterface from './AssistantInterface';
import { 
  firebaseQuestionsService, 
  openRouterChatService, 
  aiServiceHealthMonitor 
} from '@/utils/aiServiceLayer';
import { devLogger } from '@/utils/secureLogger';

// Enhanced wrapper that provides isolated error handling and system independence
const EnhancedAssistantInterface: React.FC<Partial<AssistantInterfaceProps>> = ({
  activeTab: initialActiveTab = 'predefined',
  onTabChange,
  onQuestionClick,
  onSendMessage,
}) => {
  // State management
  const [activeTab, setActiveTab] = useState<'predefined' | 'chat'>(initialActiveTab);
  const [questions, setQuestions] = useState<AIQuestion[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  
  // System status tracking
  const [firebaseStatus, setFirebaseStatus] = useState<'healthy' | 'degraded' | 'down'>('healthy');
  const [openrouterStatus, setOpenrouterStatus] = useState<'healthy' | 'degraded' | 'down'>('healthy');
  const [questionsSource, setQuestionsSource] = useState<'api' | 'cache' | 'fallback'>('api');

  // Load questions on mount
  useEffect(() => {
    loadQuestions();
  }, []);

  // Monitor service health periodically
  useEffect(() => {
    const healthCheckInterval = setInterval(async () => {
      try {
        const firebaseHealth = await aiServiceHealthMonitor.checkFirebaseHealth();
        const openrouterHealth = await aiServiceHealthMonitor.checkOpenRouterHealth();
        
        setFirebaseStatus(firebaseHealth);
        setOpenrouterStatus(openrouterHealth);
        
        devLogger.debug('Service health check', { 
          firebase: firebaseHealth, 
          openrouter: openrouterHealth 
        });
      } catch (error) {
        devLogger.warn('Health check failed', error);
      }
    }, 60000); // Check every minute

    return () => clearInterval(healthCheckInterval);
  }, []);

  const loadQuestions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(undefined);
      
      devLogger.debug('Loading questions via enhanced service layer');
      
      const result = await firebaseQuestionsService.getQuestions();
      
      setQuestions(result.data);
      setQuestionsSource(result.source);
      
      // Update Firebase status based on result
      setFirebaseStatus(result.source === 'api' ? 'healthy' : 
                       result.source === 'cache' ? 'healthy' : 'degraded');
      
      // Only show error if we're using fallback data
      if (result.source === 'fallback' && result.error) {
        setError(result.error);
      }
      
      devLogger.debug(`Questions loaded from ${result.source}`, { 
        count: result.data.length,
        status: firebaseStatus 
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load questions';
      setError(errorMessage);
      setFirebaseStatus('down');
      devLogger.error('Failed to load questions', error);
    } finally {
      setIsLoading(false);
    }
  }, [firebaseStatus]);

  const handleTabChange = useCallback((tab: 'predefined' | 'chat') => {
    setActiveTab(tab);
    setError(undefined); // Clear errors when switching tabs
    onTabChange?.(tab);
    
    devLogger.debug(`Tab changed to ${tab}`);
  }, [onTabChange]);

  const handleQuestionClick = useCallback(async (question: AIQuestion) => {
    try {
      devLogger.debug('Question clicked', { questionId: question.id });
      
      // Handle anchor links
      if (question.anchorLink) {
        const element = document.querySelector(question.anchorLink);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          devLogger.debug('Scrolled to anchor', { anchor: question.anchorLink });
        }
      }

      // Handle file downloads
      if (question.fileUrl) {
        window.open(question.fileUrl, '_blank');
        devLogger.debug('File download initiated', { fileUrl: question.fileUrl });
      }

      onQuestionClick?.(question);
    } catch (error) {
      devLogger.error('Error handling question click', error);
      setError('Failed to process question. Please try again.');
    }
  }, [onQuestionClick]);

  const handleSendMessage = useCallback(async (message: string) => {
    try {
      setIsLoading(true);
      setError(undefined);
      
      devLogger.debug('Sending message via enhanced service layer');
      
      // Add user message immediately
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        content: message,
        role: 'user',
        timestamp: new Date().toISOString()
      };
      
      setChatMessages(prev => [...prev, userMessage]);
      
      // Send to AI service
      const result = await openRouterChatService.sendMessage(message);
      
      if (result.data) {
        setChatMessages(prev => [...prev, result.data!]);
      }
      
      // Update OpenRouter status
      setOpenrouterStatus(result.source === 'api' ? 'healthy' : 'degraded');
      
      // Show error if using fallback
      if (result.source === 'fallback' && result.error) {
        setError(result.error);
      }
      
      devLogger.debug(`Message sent via ${result.source}`, { 
        success: result.success,
        status: openrouterStatus 
      });
      
      onSendMessage?.(message);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      setError(errorMessage);
      setOpenrouterStatus('down');
      devLogger.error('Failed to send message', error);
      
      // Add error message to chat
      const errorChatMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        role: 'assistant',
        timestamp: new Date().toISOString()
      };
      
      setChatMessages(prev => [...prev, errorChatMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [onSendMessage, openrouterStatus]);

  // Enhanced error message based on system status
  const getEnhancedError = (): string | undefined => {
    if (!error) return undefined;
    
    const status = aiServiceHealthMonitor.getOverallStatus();
    
    if (activeTab === 'predefined' && firebaseStatus === 'degraded') {
      return `${error} You're seeing offline questions.`;
    }
    
    if (activeTab === 'chat' && openrouterStatus === 'degraded') {
      return `${error} Try the predefined questions instead.`;
    }
    
    if (status.overall === 'down') {
      return 'Both AI services are currently unavailable. Please try again later.';
    }
    
    return error;
  };

  // System status indicator for development
  const SystemStatusIndicator = () => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    return (
      <div className="fixed bottom-4 left-4 z-50 bg-black-100/90 border border-white/20 rounded-lg p-2 text-xs">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            firebaseStatus === 'healthy' ? 'bg-green-400' : 
            firebaseStatus === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'
          }`} />
          <span className="text-white">Firebase: {firebaseStatus}</span>
        </div>
        <div className="flex items-center space-x-2 mt-1">
          <div className={`w-2 h-2 rounded-full ${
            openrouterStatus === 'healthy' ? 'bg-green-400' : 
            openrouterStatus === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'
          }`} />
          <span className="text-white">OpenRouter: {openrouterStatus}</span>
        </div>
        {questionsSource !== 'api' && (
          <div className="text-yellow-400 mt-1">
            Questions: {questionsSource}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <AssistantInterface
        activeTab={activeTab}
        onTabChange={handleTabChange}
        questions={questions}
        chatMessages={chatMessages}
        onQuestionClick={handleQuestionClick}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        error={getEnhancedError()}
      />
      
      <SystemStatusIndicator />
    </>
  );
};

export default EnhancedAssistantInterface;