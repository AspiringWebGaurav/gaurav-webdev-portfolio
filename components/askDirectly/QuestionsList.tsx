"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Timestamp } from 'firebase/firestore';
import QuestionStatus, { QuestionStatusBadge, QuestionStatusDot } from './QuestionStatus';
import { 
  getCurrentVisitorQuestions,
  markCurrentVisitorQuestionsAsRead,
  getQuestionListenerManager,
  cleanupAskDirectlyUtils
} from '@/lib/askDirectly';
import type { DirectQuestion, QuestionStatus as StatusType } from '@/lib/types';

interface QuestionsListProps {
  /** Filter to show specific status */
  statusFilter?: StatusType | 'all';
  /** Whether to show real-time updates */
  enableRealTime?: boolean;
  /** Maximum number of questions to show */
  maxQuestions?: number;
  /** Whether to show empty state */
  showEmptyState?: boolean;
  /** Custom empty state message */
  emptyMessage?: string;
  /** Layout variant */
  variant?: 'default' | 'compact' | 'detailed';
  /** Custom className */
  className?: string;
  /** Callback when questions are loaded */
  onQuestionsLoad?: (questions: DirectQuestion[]) => void;
  /** Callback when question is clicked */
  onQuestionClick?: (question: DirectQuestion) => void;
}

const EmptyState = ({ 
  message = "No questions yet", 
  icon = "💭",
  variant = "default" 
}: { 
  message?: string; 
  icon?: string; 
  variant?: string;
}) => (
  <div className={`
    flex flex-col items-center justify-center py-8 text-center
    ${variant === 'compact' ? 'py-6' : 'py-12'}
  `}>
    <div className="text-4xl mb-3 opacity-50">{icon}</div>
    <p className="text-slate-400 text-sm">{message}</p>
  </div>
);

const QuestionCard = ({ 
  question, 
  variant = 'default',
  onClick 
}: { 
  question: DirectQuestion; 
  variant: string;
  onClick?: (question: DirectQuestion) => void;
}) => {
  const handleClick = useCallback(() => {
    onClick?.(question);
  }, [onClick, question]);

  const cardClasses = useMemo(() => {
    const base = `
      block rounded-xl border transition-all duration-200 backdrop-blur-sm
      ${onClick ? 'cursor-pointer hover:bg-slate-800/50 hover:border-blue-500/30' : ''}
      ${question.unreadForVisitor
        ? 'border-blue-500/50 bg-blue-500/10 shadow-lg shadow-blue-500/20'
        : 'border-slate-700/50 bg-slate-900/50'
      }
    `;
    
    switch (variant) {
      case 'compact':
        return base + ' p-3';
      case 'detailed':
        return base + ' p-4 sm:p-5';
      default:
        return base + ' p-4';
    }
  }, [variant, question.unreadForVisitor, onClick]);

  const formatQuestionPreview = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  };

  return (
    <div className={cardClasses} onClick={handleClick}>
      {/* Question Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <QuestionStatusDot status={question.status} size="sm" />
          <QuestionStatusBadge 
            status={question.status} 
            size="sm"
            showIcon={false}
          />
          {question.unreadForVisitor && (
            <span className="px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded-full font-medium">
              New
            </span>
          )}
        </div>
        
        <div className="text-xs text-slate-500 whitespace-nowrap">
          {question.createdAt && question.createdAt.toDate
            ? question.createdAt.toDate().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            : 'Just now'
          }
        </div>
      </div>

      {/* Question Text */}
      <div className={`
        text-sm text-slate-300 mb-3 leading-relaxed
        ${variant === 'compact' ? 'line-clamp-2' : ''}
      `}>
        {variant === 'compact' 
          ? formatQuestionPreview(question.question, 100)
          : question.question
        }
      </div>

      {/* Admin Reply - Enhanced Design */}
      {question.adminReply && (
        <div className="mt-4 pt-4 border-t border-slate-600/50">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <span className="text-green-400 text-xs">✓</span>
            </div>
            <span className="text-sm text-green-400 font-medium">Admin Reply:</span>
            {question.answeredAt && question.answeredAt.toDate && (
              <span className="text-xs text-slate-500 ml-auto">
                {question.answeredAt.toDate().toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            )}
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 border-l-3 border-green-500/50">
            <div className="text-sm text-slate-200 leading-relaxed">
              {variant === 'compact'
                ? formatQuestionPreview(question.adminReply, 100)
                : question.adminReply
              }
            </div>
          </div>
        </div>
      )}

      {/* Status Footer for Detailed View */}
      {variant === 'detailed' && (
        <div className="mt-4 pt-3 border-t border-slate-700/30">
          <QuestionStatus
            status={question.status}
            createdAt={question.createdAt}
            answeredAt={question.answeredAt}
            unreadForVisitor={question.unreadForVisitor}
            size="sm"
            orientation="horizontal"
          />
        </div>
      )}
    </div>
  );
};

export default function QuestionsList({
  statusFilter = 'all',
  enableRealTime = true,
  maxQuestions,
  showEmptyState = true,
  emptyMessage,
  variant = 'default',
  className = "",
  onQuestionsLoad,
  onQuestionClick
}: QuestionsListProps) {
  const [questions, setQuestions] = useState<DirectQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Filter questions based on status
  const filteredQuestions = useMemo(() => {
    let filtered = statusFilter === 'all' 
      ? questions 
      : questions.filter(q => q.status === statusFilter);
      
    if (maxQuestions) {
      filtered = filtered.slice(0, maxQuestions);
    }
    
    return filtered.sort((a, b) => {
      const aTime = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate().getTime() : 0;
      const bTime = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate().getTime() : 0;
      return bTime - aTime;
    });
  }, [questions, statusFilter, maxQuestions]);

  // Load initial questions with enhanced error handling
  const loadQuestions = useCallback(async (isRetry = false) => {
    try {
      setLoading(true);
      if (!isRetry) {
        setError(null);
        setRetryCount(0);
      }
      
      console.log('🔄 Loading questions...', { isRetry, retryCount });
      
      const questionsData = await getCurrentVisitorQuestions();
      
      // Validate and clean question data
      const validQuestions = questionsData.filter((question: any) => {
        const isValid = question &&
                       question.id &&
                       question.question &&
                       question.status &&
                       question.visitorUuid &&
                       question.createdAt;
        
        if (!isValid) {
          console.warn('❌ Filtered out invalid question:', question);
        }
        
        return isValid;
      });

      console.log(`✅ Loaded ${validQuestions.length} valid questions (filtered ${questionsData.length - validQuestions.length})`);
      
      setQuestions(validQuestions);
      onQuestionsLoad?.(validQuestions);
      setError(null);
      setRetryCount(0);
    } catch (err) {
      console.error('❌ Failed to load questions:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      const currentRetry = isRetry ? retryCount : 0;
      
      // Check if this is a recoverable error
      const isRecoverableError = errorMessage.includes('network') ||
                                errorMessage.includes('timeout') ||
                                errorMessage.includes('fetch') ||
                                errorMessage.includes('firebase') ||
                                errorMessage.includes('unavailable');
      
      if (isRecoverableError && currentRetry < maxRetries) {
        const newRetryCount = currentRetry + 1;
        setRetryCount(newRetryCount);
        console.log(`🔄 Retrying questions load (${newRetryCount}/${maxRetries})...`);
        
        // Exponential backoff retry
        setTimeout(() => {
          loadQuestions(true);
        }, 1000 * Math.pow(2, newRetryCount - 1));
      } else {
        // Set error but don't break the UI
        setError(currentRetry >= maxRetries ?
          'Unable to load questions after retries. Please refresh the page.' :
          'Failed to load questions. They may have been removed.'
        );
        
        // Set empty questions array as fallback
        setQuestions([]);
        onQuestionsLoad?.([]);
      }
    } finally {
      setLoading(false);
    }
  }, [onQuestionsLoad, retryCount, maxRetries]);

  // Setup real-time listener with instant update support
  useEffect(() => {
    if (!enableRealTime) {
      loadQuestions();
      return;
    }

    const listenerManager = getQuestionListenerManager();
    
    const listener = listenerManager.setupCurrentVisitorListener(
      (updatedQuestions) => {
        console.log('🔄 Questions updated in real-time:', updatedQuestions.length);
        
        // Validate and clean real-time question data
        const validQuestions = updatedQuestions.filter((question: any) => {
          const isValid = question &&
                         question.id &&
                         question.question &&
                         question.status &&
                         question.visitorUuid &&
                         question.createdAt &&
                         !question.isDeleted; // Filter out soft-deleted questions
          
          if (!isValid) {
            console.warn('❌ Filtered out invalid real-time question:', question);
          }
          
          return isValid;
        });

        if (validQuestions.length !== updatedQuestions.length) {
          console.warn(`🧹 Cleaned ${updatedQuestions.length - validQuestions.length} invalid questions from real-time update`);
        }

        setQuestions(validQuestions);
        onQuestionsLoad?.(validQuestions);
        setLoading(false);
        setError(null);
        setRetryCount(0); // Reset retry count on successful update
        setForceUpdate(prev => prev + 1); // Force re-render
      },
      {
        showToastOnUpdate: false, // Don't show toast here, let notification system handle it
        onlyWhenVisible: true
      }
    );

    return () => {
      listener.unsubscribe();
    };
  }, [enableRealTime, loadQuestions, onQuestionsLoad]);

  // Listen for instant notification updates and deletion events
  useEffect(() => {
    const handleInstantUpdate = (event: CustomEvent) => {
      console.log('⚡ Instant update received in QuestionsList');
      // Force refresh questions
      loadQuestions();
    };

    const handleQuestionsDeleted = (event: CustomEvent) => {
      console.log('🗑️ Questions deleted event received in QuestionsList');
      // Force refresh to remove deleted questions
      loadQuestions();
      setForceUpdate(prev => prev + 1);
    };

    const handleStorageUpdate = (event: StorageEvent) => {
      if (event.key === 'direct_questions_notifications_update' ||
          event.key === 'questions_deleted_refresh') {
        console.log('💾 Storage update received in QuestionsList');
        loadQuestions();
        setForceUpdate(prev => prev + 1);
      }
    };

    window.addEventListener('directQuestionNotifications', handleInstantUpdate as EventListener);
    window.addEventListener('questionsDeleted', handleQuestionsDeleted as EventListener);
    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      window.removeEventListener('directQuestionNotifications', handleInstantUpdate as EventListener);
      window.removeEventListener('questionsDeleted', handleQuestionsDeleted as EventListener);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [loadQuestions]);

  // Mark unread questions as read when they come into view
  useEffect(() => {
    const unreadQuestions = filteredQuestions.filter(q => q.unreadForVisitor);
    
    if (unreadQuestions.length > 0) {
      // Mark as read after a short delay (user has seen them)
      const timer = setTimeout(async () => {
        try {
          const questionIds = unreadQuestions.map(q => q.id);
          await markCurrentVisitorQuestionsAsRead(questionIds);
          console.log(`✅ Marked ${questionIds.length} questions as read`);
        } catch (error) {
          console.error('❌ Failed to mark questions as read:', error);
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [filteredQuestions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAskDirectlyUtils();
    };
  }, []);

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-24 bg-slate-800/50 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="flex flex-col gap-3 px-4 py-4 rounded-lg bg-red-500/20 border border-red-500/30">
          <div className="flex items-center gap-2">
            <span className="text-red-400 text-sm">❌</span>
            <span className="text-red-400 text-sm">{error}</span>
          </div>
          
          {retryCount < maxRetries && (
            <button
              onClick={() => loadQuestions(true)}
              className="self-start px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 text-xs rounded-lg transition-colors duration-200"
            >
              Try Again ({maxRetries - retryCount} left)
            </button>
          )}
          
          {retryCount >= maxRetries && (
            <button
              onClick={() => window.location.reload()}
              className="self-start px-3 py-1 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/50 text-gray-400 text-xs rounded-lg transition-colors duration-200"
            >
              Refresh Page
            </button>
          )}
        </div>
      </div>
    );
  }

  if (filteredQuestions.length === 0) {
    if (!showEmptyState) return null;

    const getEmptyStateMessage = () => {
      if (emptyMessage) return emptyMessage;
      
      switch (statusFilter) {
        case 'unanswered':
          return "No unanswered questions";
        case 'answered':
          return "No answered questions yet";
        case 'archived':
          return "No archived questions";
        default:
          return "No questions yet. Ask me anything!";
      }
    };

    return (
      <div className={className}>
        <EmptyState 
          message={getEmptyStateMessage()}
          icon={statusFilter === 'answered' ? '💬' : '💭'}
          variant={variant}
        />
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {filteredQuestions.map((question) => (
        <QuestionCard
          key={question.id}
          question={question}
          variant={variant}
          onClick={onQuestionClick}
        />
      ))}
      
      {/* Load More Button (if there are more questions) */}
      {maxQuestions && questions.length > maxQuestions && (
        <div className="text-center pt-4">
          <button
            onClick={() => {}} // TODO: Implement pagination if needed
            className="text-sm text-blue-400 hover:text-blue-300 underline"
          >
            Show more questions
          </button>
        </div>
      )}
    </div>
  );
}

// Export variants for specific use cases
export function CompactQuestionsList(props: Omit<QuestionsListProps, 'variant'>) {
  return <QuestionsList {...props} variant="compact" />;
}

export function DetailedQuestionsList(props: Omit<QuestionsListProps, 'variant'>) {
  return <QuestionsList {...props} variant="detailed" />;
}

export function RecentQuestionsList({ 
  count = 3, 
  ...props 
}: Omit<QuestionsListProps, 'maxQuestions' | 'variant'> & { count?: number }) {
  return (
    <QuestionsList 
      {...props} 
      variant="compact"
      maxQuestions={count}
      emptyMessage="No recent questions"
    />
  );
}