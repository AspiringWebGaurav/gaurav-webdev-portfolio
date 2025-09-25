"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button, Icons } from '../design-system/components';
import { AssistantState, AIQuestion, ChatMessage } from '../types';
import EnterpriseNavigation from './EnterpriseNavigation';
import EnhancedPredefinedQuestions from './EnhancedPredefinedQuestions';
import EnhancedAIChat from './EnhancedAIChat';
import OptimizedJarvisAnimation from './OptimizedJarvisAnimation';
import OnboardingModal from './OnboardingModal';
import AnswerModal from './AnswerModal';
import QuestionForm from '@/components/askDirectly/QuestionForm';
import QuestionsList from '@/components/askDirectly/QuestionsList';
import { openRouterAPI, isAIEnabled, generateContextualPrompts, OpenRouterMessage } from '../utils/openRouterAPI';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationBell } from '@/components/direct-questions/NotificationOverlay';
import AskDirectlyErrorBoundary from '@/components/askDirectly/AskDirectlyErrorBoundary';
import { smartLogger } from '@/utils/smartLogger';

interface EnterpriseAIAssistantProps {
  isPortfolioLoaded?: boolean;
  onAssistantStateChange?: (state: AssistantState) => void;
  shouldOpenToAskDirectly?: boolean;
  onOpenAskModal?: () => void;
}

const EnterpriseAIAssistant: React.FC<EnterpriseAIAssistantProps> = ({
  isPortfolioLoaded = false,
  onAssistantStateChange,
  shouldOpenToAskDirectly = false,
  onOpenAskModal
}) => {
  // Main state management
  const [assistantState, setAssistantState] = useState<AssistantState>({
    isVisible: false,
    isMinimized: false,
    activeTab: 'predefined',
    isLoading: false
  });

  // Navigation state
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  
  // Data state
  const [questions, setQuestions] = useState<AIQuestion[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | undefined>();

  // AI state
  const [aiEnabled, setAiEnabled] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);

  // Feature flags
  const [jarvisEnabled, setJarvisEnabled] = useState(true);
  
  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(true);

  // Answer modal state
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<AIQuestion | null>(null);

  // Client-side hydration check
  const [isClient, setIsClient] = useState(false);

  // Notification system integration
  const {
    unreadCount,
    hasUnreadNotifications,
    actions: notificationActions,
    isInitialized: notificationsInitialized
  } = useNotifications();

  useEffect(() => {
    setIsClient(true);
    
    // Load feature flags and onboarding state from localStorage
    try {
      const savedFlags = localStorage.getItem('ai-assistant-flags');
      if (savedFlags) {
        const flags = JSON.parse(savedFlags);
        setJarvisEnabled(flags.jarvisEnabled ?? true);
      }
      
      const savedOnboarding = localStorage.getItem('ai-assistant-onboarding');
      if (savedOnboarding) {
        const onboarding = JSON.parse(savedOnboarding);
        setHasSeenOnboarding(onboarding.seen ?? false);
      } else {
        setHasSeenOnboarding(false);
      }
    } catch (error) {
      console.warn('Failed to load settings:', error);
      setHasSeenOnboarding(false);
    }

    // Check AI availability - Trust API key configuration without health checks
    const checkAI = () => {
      const aiAvailable = isAIEnabled();
      setAiEnabled(aiAvailable);
      
      // Perform simple health check (no network calls)
      if (aiAvailable) {
        const healthStatus = openRouterAPI.checkHealth();
        console.log('✅ OpenRouter API: Enabled and ready for use');
        console.log('🔧 API Key Status:', healthStatus ? 'Valid format' : 'Invalid format');
      } else {
        console.warn('⚠️ OpenRouter API: Not configured - using demo mode');
        console.log('💡 To enable AI: Add NEXT_PUBLIC_OPENROUTER_API_KEY to your .env.local file');
      }
    };

    checkAI();
  }, []);

  // Notify parent of state changes
  useEffect(() => {
    onAssistantStateChange?.(assistantState);
  }, [assistantState, onAssistantStateChange]);

  // Load questions on mount
  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = useCallback(async () => {
    try {
      setAssistantState(prev => ({ ...prev, isLoading: true }));
      setError(undefined);
      
      // Fetch questions from Firebase via API
      const response = await fetch('/api/ai-assistant/questions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.data?.questions)) {
        setQuestions(data.data.questions);
      } else if (data.fallback) {
        // Fallback to mock data if Firebase is unavailable
        console.warn('Firebase unavailable, using fallback data');
        const fallbackQuestions: AIQuestion[] = [
          {
            id: 'fallback-1',
            question: 'What projects has Gaurav worked on?',
            answer: 'Gaurav has worked on several impressive projects including a 3D Solar System visualization using Three.js, a video conferencing app called Yoom, an AI Image SaaS application similar to Canva, and an animated Apple iPhone 3D website. Each project demonstrates his expertise in modern web technologies like React, Next.js, TypeScript, and 3D graphics.',
            createdAt: new Date().toISOString()
          },
          {
            id: 'fallback-2',
            question: 'What are his technical skills?',
            answer: 'Gaurav is proficient in a wide range of technologies including React, Next.js, TypeScript, Three.js, Tailwind CSS, Node.js, and various modern web development tools. He has experience with 3D graphics, real-time applications, AI integration, and responsive design. His portfolio showcases expertise in both frontend and full-stack development.',
            createdAt: new Date().toISOString()
          },
          {
            id: 'fallback-3',
            question: 'How can I contact Gaurav?',
            answer: 'You can contact Gaurav through the contact form on his portfolio website. He is available for freelance projects, full-time opportunities, and collaboration. Feel free to reach out to discuss your project requirements or to learn more about his experience and availability.',
            createdAt: new Date().toISOString()
          }
        ];
        setQuestions(fallbackQuestions);
      } else {
        throw new Error(data.error || 'Failed to load questions');
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load questions';
      setError(errorMessage);
      
      // Set empty array on error
      setQuestions([]);
    } finally {
      setAssistantState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const handleTabChange = useCallback((tabId: string) => {
    if (tabId === 'portfolio') {
      // Open Ask Me Anything modal and close assistant
      onOpenAskModal?.();
      handleClose();
      return;
    }
    
    setAssistantState(prev => ({
      ...prev,
      activeTab: tabId as 'predefined' | 'chat' | 'ask-directly'
    }));
    setError(undefined);

    // Clear notifications when opening ask-directly tab
    if (tabId === 'ask-directly' && hasUnreadNotifications) {
      setTimeout(async () => {
        // Use clearAll to remove all notifications when user opens the tab
        notificationActions.clearAll();
      }, 1000); // Clear after user has time to see the questions
    }
  }, [hasUnreadNotifications, notificationActions]);

  const handleQuestionClick = useCallback((question: AIQuestion) => {
    try {
      console.log('Question clicked:', question);
      
      // Handle anchor links safely (for navigation-type questions)
      if (question.anchorLink) {
        try {
          const element = document.querySelector(question.anchorLink);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        } catch (selectorError) {
          console.warn('Invalid anchor link selector:', question.anchorLink, selectorError);
        }
      }

      // Show answer modal for predefined questions
      // Note: File downloads are now handled only within the modal
      setSelectedQuestion(question);
      setShowAnswerModal(true);
      console.log('Answer modal should show now');
    } catch (error) {
      console.error('Error handling question click:', error);
      setError('Failed to process question. Please try again.');
    }
  }, []);

  const handleCloseAnswerModal = useCallback(() => {
    setShowAnswerModal(false);
    setSelectedQuestion(null);
  }, []);

  const handleSendMessage = useCallback(async (message: string) => {
    try {
      setAssistantState(prev => ({ ...prev, isLoading: true }));
      setError(undefined);
      
      // Add user message immediately
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        content: message,
        role: 'user',
        timestamp: new Date().toISOString()
      };
      
      setChatMessages(prev => [...prev, userMessage]);

      // Generate contextual prompts based on user input
      const contextualPrompts = generateContextualPrompts(message);
      setSuggestedPrompts(contextualPrompts);
      
      if (aiEnabled) {
        // Use real AI with OpenRouter
        const conversationHistory: OpenRouterMessage[] = chatMessages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));
        
        // Add current user message
        conversationHistory.push({
          role: 'user',
          content: message
        });

        const aiResponseContent = await openRouterAPI.sendMessage(conversationHistory);
        
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: aiResponseContent,
          role: 'assistant',
          timestamp: new Date().toISOString()
        };

        setChatMessages(prev => [...prev, assistantMessage]);
      } else {
        // Fallback to mock response if AI is not available
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: `Thank you for your question: "${message}". I'm currently running in demo mode. To enable full AI functionality, please configure the OpenRouter API key. For now, you can explore the Quick Questions tab for immediate answers about Gaurav's portfolio and experience.`,
          role: 'assistant',
          timestamp: new Date().toISOString()
        };
        
        setChatMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      setError(errorMessage);
      
      // Enhanced error handling with specific error types
      if (aiEnabled) {
        console.error('OpenRouter API Error:', error);
        
        // Provide different fallback responses based on error type
        let fallbackContent = "I'm experiencing technical difficulties connecting to the AI service. Please try again in a moment, or explore the Quick Questions tab for immediate answers about Gaurav's portfolio.";
        
        if (errorMessage.includes('rate limit')) {
          fallbackContent = "I'm currently experiencing high usage. Please wait a moment and try again, or check out the Quick Questions tab for immediate answers.";
        } else if (errorMessage.includes('network')) {
          fallbackContent = "There seems to be a network issue. Please check your connection and try again, or use the Quick Questions tab for immediate help.";
        } else if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
          fallbackContent = "There's an authentication issue with the AI service. The administrator has been notified. Please use the Quick Questions tab for immediate assistance.";
        }
        
        const fallbackMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: fallbackContent,
          role: 'assistant',
          timestamp: new Date().toISOString()
        };
        setChatMessages(prev => [...prev, fallbackMessage]);
        setError(undefined); // Clear error to show fallback message
      } else {
        // Non-AI mode error handling
        const errorChatMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: 'Sorry, I encountered an error. Please try again or check the Quick Questions tab for helpful information.',
          role: 'assistant',
          timestamp: new Date().toISOString()
        };
        
        setChatMessages(prev => [...prev, errorChatMessage]);
      }
    } finally {
      setAssistantState(prev => ({ ...prev, isLoading: false }));
    }
  }, [chatMessages, aiEnabled]);

  const handleShow = useCallback(() => {
    setAssistantState(prev => ({
      ...prev,
      isVisible: true,
      isMinimized: false
    }));
    
    // Show onboarding for first-time users
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }

    // If there are unread notifications, automatically go to ask-directly tab
    if (hasUnreadNotifications) {
      setAssistantState(prev => ({
        ...prev,
        activeTab: 'ask-directly',
        isVisible: true,
        isMinimized: false
      }));
    }
  }, [hasSeenOnboarding, hasUnreadNotifications]);

  // Handle external trigger to open to ask-directly tab
  useEffect(() => {
    if (shouldOpenToAskDirectly) {
      setAssistantState(prev => ({
        ...prev,
        isVisible: true,
        isMinimized: false,
        activeTab: 'ask-directly'
      }));

      // Clear notifications when opening from notification click
      if (hasUnreadNotifications) {
        setTimeout(async () => {
          // Clear all notifications when user opens from notification
          notificationActions.clearAll();
        }, 1500); // Give user time to see the questions
      }
    }
  }, [shouldOpenToAskDirectly, hasUnreadNotifications, notificationActions]);

  const handleClose = useCallback(() => {
    setAssistantState(prev => ({
      ...prev,
      isVisible: false,
      isMinimized: false
    }));
  }, []);

  const handleMinimize = useCallback(() => {
    setAssistantState(prev => ({
      ...prev,
      isMinimized: !prev.isMinimized
    }));
  }, []);

  const toggleJarvis = useCallback(() => {
    const newState = !jarvisEnabled;
    setJarvisEnabled(newState);
    
    // Save to localStorage
    try {
      const flags = { jarvisEnabled: newState };
      localStorage.setItem('ai-assistant-flags', JSON.stringify(flags));
    } catch (error) {
      console.warn('Failed to save feature flags:', error);
    }
  }, [jarvisEnabled]);

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
    setHasSeenOnboarding(true);
  }, []);

  const handleOnboardingSkip = useCallback(() => {
    setShowOnboarding(false);
    setHasSeenOnboarding(true);
  }, []);

  const replayOnboarding = useCallback(() => {
    setShowOnboarding(true);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + A to toggle assistant
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'A') {
        event.preventDefault();
        if (assistantState.isVisible) {
          handleClose();
        } else {
          handleShow();
        }
      }

      // Escape to close assistant
      if (event.key === 'Escape' && assistantState.isVisible && !assistantState.isMinimized) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [assistantState.isVisible, assistantState.isMinimized, handleShow, handleClose]);

  if (!isClient) return null;

  return (
    <>
      {/* Main Interface */}
      {assistantState.isVisible && (
        <>
          {/* Backdrop */}
          <div
            className={cn(
              "fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300",
              assistantState.isMinimized ? "opacity-0 pointer-events-none" : "opacity-100"
            )}
            onClick={handleClose}
          />

          {/* Assistant Container */}
          <div
            className={cn(
              "fixed z-50 transition-all duration-500 ease-out rounded-2xl shadow-2xl overflow-hidden",
              "bg-ai-surface-primary/95 backdrop-blur-xl border border-ai-border-light/30",
              "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:pointer-events-none",
              assistantState.isMinimized
                ? "w-16 h-16 top-1/2 right-4 -translate-y-1/2"
                : cn(
                    // Desktop layout
                    "lg:w-[850px] lg:h-[600px] lg:right-4 lg:top-[8%]",
                    // Mobile layout - fullscreen on small screens
                    "inset-4 sm:inset-6 md:inset-8",
                    "max-w-[95vw] max-h-[90vh]",
                    // Tablet layout
                    "md:w-[700px] md:h-[550px] md:right-8 md:top-[10%]",
                    "md:left-auto md:bottom-auto"
                  )
            )}
          >
            {assistantState.isMinimized ? (
              // Minimized State
              <div
                className="w-full h-full cursor-pointer flex items-center justify-center"
                onClick={handleMinimize}
              >
                {jarvisEnabled && (
                  <OptimizedJarvisAnimation
                    isActive={true}
                    size="small"
                    color="blue"
                    intensity="medium"
                  />
                )}
              </div>
            ) : (
              // Full Interface - Mobile-First Design
              <div className="flex flex-col lg:flex-row h-full">
                {/* Mobile Header & Navigation */}
                <div className="lg:hidden flex items-center justify-between p-3 border-b border-ai-border-light/30 bg-ai-surface-secondary/80 backdrop-blur-sm">
                  <div className="flex items-center space-x-2">
                    {jarvisEnabled && (
                      <OptimizedJarvisAnimation
                        isActive={true}
                        size="small"
                        color="blue"
                        intensity="medium"
                      />
                    )}
                    <div>
                      <h1 className="text-base font-semibold text-ai-text-primary">
                        Gaurav's Assistant
                      </h1>
                      <p className="text-xs text-ai-text-secondary">
                        AI-powered guide
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMinimize}
                      className="text-ai-text-tertiary hover:text-ai-text-primary p-1.5"
                      title="Minimize"
                    >
                      <Icons.ChevronRight className="w-4 h-4 rotate-90" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClose}
                      className="text-ai-text-tertiary hover:text-ai-text-primary p-1.5"
                      title="Close"
                    >
                      <Icons.Close className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Desktop Navigation Sidebar */}
                <div className="hidden lg:block">
                  <EnterpriseNavigation
                    activeTab={assistantState.activeTab}
                    onTabChange={handleTabChange}
                    isCollapsed={isNavCollapsed}
                    onToggleCollapse={() => setIsNavCollapsed(!isNavCollapsed)}
                  />
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Desktop Header */}
                  <div className="hidden lg:flex items-center justify-between p-4 border-b border-ai-border-light/30 bg-ai-surface-secondary/80 backdrop-blur-sm">
                    <div className="flex items-center space-x-3">
                      {jarvisEnabled && (
                        <OptimizedJarvisAnimation
                          isActive={true}
                          size="small"
                          color="blue"
                          intensity="medium"
                        />
                      )}
                      <div>
                        <h1 className="text-lg font-semibold text-ai-text-primary">
                          Gaurav's Personal Assistance
                        </h1>
                        <p className="text-xs text-ai-text-secondary">
                          AI-powered portfolio guide
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMinimize}
                        className="text-ai-text-tertiary hover:text-ai-text-primary"
                        title="Minimize (Ctrl+Shift+A)"
                      >
                        <Icons.ChevronRight className="w-4 h-4 rotate-90" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClose}
                        className="text-ai-text-tertiary hover:text-ai-text-primary"
                        title="Close (Escape)"
                      >
                        <Icons.Close className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Mobile Tab Navigation */}
                  <div className="lg:hidden border-b border-ai-border-light/30 bg-ai-surface-secondary/80">
                    <div className="flex overflow-x-auto scrollbar-hide">
                      {[
                        { id: 'predefined', label: 'Quick Questions', icon: '❓' },
                        { id: 'chat', label: 'AI Chat', icon: '💬' },
                        { id: 'ask-directly', label: 'Ask Directly', icon: '📝' },
                        { id: 'settings', label: 'Settings', icon: '⚙️' }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => handleTabChange(tab.id)}
                          className={cn(
                            'flex-1 min-w-0 px-3 py-3 text-xs font-medium border-b-2 transition-all duration-200',
                            assistantState.activeTab === tab.id
                              ? 'text-ai-primary-blue border-ai-primary-blue bg-ai-primary-blue/10'
                              : 'text-ai-text-secondary border-transparent hover:text-ai-text-primary hover:border-ai-border-medium'
                          )}
                        >
                          <div className="flex flex-col items-center space-y-1">
                            <span className="text-sm">{tab.icon}</span>
                            <span className="truncate">{tab.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Content Area - Mobile Optimized */}
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-hidden">
                      {assistantState.activeTab === 'predefined' && (
                        <EnhancedPredefinedQuestions
                          questions={questions}
                          onQuestionClick={handleQuestionClick}
                          isLoading={assistantState.isLoading}
                          error={error}
                        />
                      )}
                      
                      {assistantState.activeTab === 'chat' && (
                        <EnhancedAIChat
                          messages={chatMessages}
                          onSendMessage={handleSendMessage}
                          isLoading={assistantState.isLoading}
                          error={error}
                          aiEnabled={aiEnabled}
                          suggestedPrompts={suggestedPrompts}
                        />
                      )}

                      {assistantState.activeTab === 'ask-directly' && (
                        <AskDirectlyErrorBoundary
                          onError={(error, errorInfo) => {
                            smartLogger.error('Ask Directly tab error', {
                              error: error.message,
                              componentStack: errorInfo.componentStack
                            });
                          }}
                        >
                          <div className="p-3 sm:p-4 lg:p-6 h-full overflow-y-auto custom-scrollbar">
                            <div className="max-w-4xl mx-auto space-y-4 lg:space-y-6">
                              {/* Header - Mobile Optimized */}
                              <div className="text-center space-y-2">
                                <h2 className="text-xl sm:text-2xl font-bold text-ai-text-primary">
                                  Ask Me Directly
                                </h2>
                                <p className="text-sm sm:text-base text-ai-text-secondary">
                                  Send questions directly to Gaurav
                                </p>
                              </div>

                              {/* Mobile-First Layout */}
                              <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
                                {/* Question Form */}
                                <div className="space-y-3 lg:space-y-4">
                                  <h3 className="text-base lg:text-lg font-semibold text-ai-text-primary">
                                    📝 Ask Your Question
                                  </h3>
                                  <div className="bg-ai-surface-secondary/50 backdrop-blur-sm rounded-xl p-3 lg:p-4 border border-ai-border-light/30">
                                    <AskDirectlyErrorBoundary
                                      fallback={
                                        <div className="flex items-center justify-center p-4 text-gray-400">
                                          <span>Question form temporarily unavailable</span>
                                        </div>
                                      }
                                    >
                                      <React.Suspense fallback={
                                        <div className="flex items-center justify-center p-4">
                                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                        </div>
                                      }>
                                        <QuestionForm
                                          onSuccess={(questionId) => {
                                            console.log('Question submitted:', questionId);
                                          }}
                                          placeholder="Ask me anything about my work, projects, or experience..."
                                          showCharCount={true}
                                          autoFocus={false}
                                          className="space-y-2 lg:space-y-3"
                                        />
                                      </React.Suspense>
                                    </AskDirectlyErrorBoundary>
                                  </div>
                                </div>

                                {/* Question History */}
                                <div className="space-y-3 lg:space-y-4">
                                  <h3 className="text-base lg:text-lg font-semibold text-ai-text-primary">
                                    💬 Your Questions
                                  </h3>
                                  <div className="bg-ai-surface-secondary/50 backdrop-blur-sm rounded-xl p-3 lg:p-4 border border-ai-border-light/30 max-h-64 lg:max-h-96 overflow-y-auto custom-scrollbar">
                                    <AskDirectlyErrorBoundary
                                      fallback={
                                        <div className="flex items-center justify-center p-4 text-gray-400">
                                          <span>Questions list temporarily unavailable</span>
                                        </div>
                                      }
                                    >
                                      <React.Suspense fallback={
                                        <div className="flex items-center justify-center p-4">
                                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                        </div>
                                      }>
                                        <QuestionsList
                                          enableRealTime={true}
                                          showEmptyState={true}
                                          variant="default"
                                          emptyMessage="No questions yet. Ask your first question above!"
                                          onQuestionClick={(question) => {
                                            console.log('Question selected:', question.id);
                                          }}
                                        />
                                      </React.Suspense>
                                    </AskDirectlyErrorBoundary>
                                  </div>
                                </div>
                              </div>

                              {/* Information Panel - Mobile Optimized */}
                              <div className="bg-ai-primary-blue/10 rounded-xl p-3 lg:p-4 border border-ai-primary-blue/30">
                                <div className="flex items-start space-x-3">
                                  <div className="w-6 h-6 lg:w-8 lg:h-8 bg-ai-primary-blue/20 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-ai-primary-blue text-xs lg:text-sm">💡</span>
                                  </div>
                                  <div className="space-y-2">
                                    <h4 className="text-sm lg:text-base font-medium text-ai-text-primary">How it works:</h4>
                                    <ul className="text-xs lg:text-sm text-ai-text-secondary space-y-1">
                                      <li>• Ask questions about Gaurav's work</li>
                                      <li>• Questions sent directly to Gaurav</li>
                                      <li>• Get notified when Gaurav replies</li>
                                      <li>• View your Q&A history in real-time</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </AskDirectlyErrorBoundary>
                      )}

                      {assistantState.activeTab === 'settings' && (
                        <div className="p-3 sm:p-4 lg:p-6 h-full overflow-y-auto custom-scrollbar">
                          <h2 className="text-lg font-semibold text-ai-text-primary mb-4 lg:mb-6">
                            Settings
                          </h2>
                          <div className="space-y-4 lg:space-y-6">
                            <div className="flex items-center justify-between p-3 lg:p-4 rounded-lg bg-ai-surface-secondary/50 border border-ai-border-light/30">
                              <div className="flex-1 min-w-0 mr-3">
                                <h3 className="text-sm lg:text-base font-medium text-ai-text-primary">
                                  Jarvis Animation
                                </h3>
                                <p className="text-xs lg:text-sm text-ai-text-secondary mt-1">
                                  Enable or disable animation effects
                                </p>
                              </div>
                              <Button
                                variant={jarvisEnabled ? 'primary' : 'secondary'}
                                size="sm"
                                onClick={toggleJarvis}
                                className="flex-shrink-0"
                              >
                                {jarvisEnabled ? 'On' : 'Off'}
                              </Button>
                            </div>
                            
                            <div className="flex items-center justify-between p-3 lg:p-4 rounded-lg bg-ai-surface-secondary/50 border border-ai-border-light/30">
                              <div className="flex-1 min-w-0 mr-3">
                                <h3 className="text-sm lg:text-base font-medium text-ai-text-primary">
                                  Replay Tour
                                </h3>
                                <p className="text-xs lg:text-sm text-ai-text-secondary mt-1">
                                  Show the onboarding tour again
                                </p>
                              </div>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={replayOnboarding}
                                className="flex-shrink-0"
                              >
                                Replay
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer - Mobile Optimized */}
                    <div className="border-t border-ai-border-light/30 bg-ai-surface-secondary/80 backdrop-blur-sm px-3 lg:px-6 py-2 lg:py-3">
                      <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-ai-text-muted space-y-1 sm:space-y-0">
                        <div className="flex items-center space-x-2 sm:space-x-4">
                          <span className="flex items-center space-x-1">
                            <span className={cn(
                              "w-2 h-2 rounded-full",
                              aiEnabled
                                ? "bg-green-500 animate-pulse"
                                : "bg-yellow-500"
                            )}></span>
                            <span>
                              {aiEnabled ? 'AI Online' : 'Demo Mode'}
                            </span>
                          </span>
                          <span className="hidden sm:inline">•</span>
                          <span className="text-center sm:text-left">
                            {aiEnabled ? 'Powered by OpenRouter AI' : 'Configure API for full AI'}
                          </span>
                        </div>
                        <div className="hidden sm:flex items-center space-x-2">
                          <span>Ctrl+Shift+A</span>
                          <span>•</span>
                          <span>ESC to close</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Floating Action Button */}
      {!assistantState.isVisible && (
        <button
          onClick={handleShow}
          className="fixed top-1/2 right-6 -translate-y-1/2 z-40 group"
          title={`Gaurav's Personal Assistant${hasUnreadNotifications ? ` (${unreadCount} unread)` : ''} (Ctrl+Shift+A)`}
          aria-label="Open AI Assistant"
        >
          {/* Outer glow effect */}
          <div className={cn(
            "absolute inset-0 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300",
            hasUnreadNotifications
              ? "bg-gradient-to-r from-green-400/40 via-blue-400/40 to-purple-400/40 animate-pulse"
              : "bg-gradient-to-r from-ai-primary-blue/30 via-ai-primary-blue-light/30 to-ai-primary-blue/30 animate-pulse"
          )}></div>

          {/* Main button with enhanced glass effect */}
          <div className="relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg">
            {/* Glass morphism background */}
            <div className={cn(
              "absolute inset-0 backdrop-blur-md rounded-full transition-all duration-300",
              hasUnreadNotifications
                ? "bg-green-500/20 border border-green-400/50 group-hover:bg-green-500/30 group-hover:border-green-400/70"
                : "bg-ai-surface-primary/20 border border-ai-primary-blue/50 group-hover:bg-ai-surface-primary/30 group-hover:border-ai-primary-blue/70"
            )}></div>
            
            {/* Inner glow */}
            <div className={cn(
              "absolute inset-1 rounded-full",
              hasUnreadNotifications
                ? "bg-gradient-to-br from-green-400/20 to-transparent"
                : "bg-gradient-to-br from-ai-primary-blue/20 to-transparent"
            )}></div>
            
            {/* Content */}
            <div className="relative z-10">
              {jarvisEnabled ? (
                <OptimizedJarvisAnimation
                  isActive={true}
                  size="small"
                  color={hasUnreadNotifications ? "cyan" : "blue"}
                  intensity={hasUnreadNotifications ? "high" : "medium"}
                />
              ) : (
                <Icons.Chat className={cn(
                  "w-6 h-6",
                  hasUnreadNotifications ? "text-green-400" : "text-ai-primary-blue"
                )} />
              )}
            </div>

            {/* Notification Badge */}
            {hasUnreadNotifications && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-bounce shadow-lg border-2 border-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </div>
            )}
          </div>
        </button>
      )}

      {/* Onboarding Modal */}
      <OnboardingModal
        isVisible={showOnboarding}
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />

      {/* Answer Modal */}
      <AnswerModal
        isVisible={showAnswerModal}
        question={selectedQuestion}
        onClose={handleCloseAnswerModal}
      />
    </>
  );
};

export default EnterpriseAIAssistant;