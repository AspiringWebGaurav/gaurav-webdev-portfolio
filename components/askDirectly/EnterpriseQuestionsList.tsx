"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Timestamp } from 'firebase/firestore';
import { 
  getCurrentVisitorQuestions,
  markCurrentVisitorQuestionsAsRead,
  getQuestionListenerManager,
  cleanupAskDirectlyUtils
} from '@/lib/askDirectly';
import type { DirectQuestion, QuestionStatus as StatusType } from '@/lib/types';

interface EnterpriseQuestionsListProps {
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
  /** Enable enhanced production-ready features */
  enterpriseMode?: boolean;
}

// Enhanced Empty State with better UX
const EnterpriseEmptyState = ({ 
  message = "No questions yet", 
  icon = "💭",
  variant = "default",
  onActionClick
}: { 
  message?: string; 
  icon?: string; 
  variant?: string;
  onActionClick?: () => void;
}) => (
  <div className={`
    flex flex-col items-center justify-center py-8 text-center space-y-4
    ${variant === 'compact' ? 'py-6' : 'py-12'}
  `}>
    <div className="text-5xl mb-3 opacity-60 animate-pulse">{icon}</div>
    <div className="space-y-2">
      <p className="text-slate-300 text-base font-medium">{message}</p>
      <p className="text-slate-500 text-sm">Ask me anything about my work, projects, or experience</p>
    </div>
    {onActionClick && (
      <button
        onClick={onActionClick}
        className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors duration-200"
      >
        Ask a Question
      </button>
    )}
  </div>
);

// Enhanced Question Card with robust answer display
const EnterpriseQuestionCard = ({ 
  question, 
  variant = 'default',
  onClick,
  enterpriseMode = true
}: { 
  question: DirectQuestion; 
  variant: string;
  onClick?: (question: DirectQuestion) => void;
  enterpriseMode?: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullAnswer, setShowFullAnswer] = useState(false);

  const handleClick = useCallback(() => {
    onClick?.(question);
  }, [onClick, question]);

  const cardClasses = useMemo(() => {
    const base = `
      block rounded-xl border transition-all duration-300 backdrop-blur-sm
      ${onClick ? 'cursor-pointer hover:bg-slate-800/50 hover:border-blue-500/30 hover:shadow-lg' : ''}
      ${question.unreadForVisitor
        ? 'border-blue-500/50 bg-blue-500/10 shadow-lg shadow-blue-500/20 animate-pulse'
        : 'border-slate-700/50 bg-slate-900/50'
      }
    `;
    
    switch (variant) {
      case 'compact':
        return base + ' p-3';
      case 'detailed':
        return base + ' p-4 sm:p-6';
      default:
        return base + ' p-4';
    }
  }, [variant, question.unreadForVisitor, onClick]);

  const formatTimestamp = useCallback((timestamp: Timestamp | null): string => {
    if (!timestamp || !timestamp.toDate) return 'Just now';
    
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
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.warn('Error formatting timestamp:', error);
      return 'Recently';
    }
  }, []);

  const formatQuestionPreview = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  };

  const getStatusConfig = (status: StatusType) => {
    switch (status) {
      case 'answered':
        return {
          icon: '✅',
          label: 'Answered',
          color: 'text-green-400',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/30'
        };
      case 'unanswered':
        return {
          icon: '⏳',
          label: 'Pending',
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/30'
        };
      case 'archived':
        return {
          icon: '📁',
          label: 'Archived',
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/30'
        };
      default:
        return {
          icon: '❓',
          label: 'Unknown',
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/30'
        };
    }
  };

  const statusConfig = getStatusConfig(question.status);

  return (
    <div className={cardClasses} onClick={handleClick}>
      {/* Enhanced Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Status Badge */}
          <div className={`
            inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
            ${statusConfig.bgColor} ${statusConfig.borderColor}
          `}>
            <span className="text-sm">{statusConfig.icon}</span>
            <span className={statusConfig.color}>{statusConfig.label}</span>
          </div>

          {/* New Answer Indicator */}
          {question.unreadForVisitor && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500 text-white rounded-full text-xs font-bold">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              New Answer
            </div>
          )}
        </div>
        
        <div className="text-xs text-slate-400 whitespace-nowrap font-medium">
          {formatTimestamp(question.createdAt)}
        </div>
      </div>

      {/* Question Content */}
      <div className="space-y-4">
        {/* Question Text */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>❓</span>
            <span className="font-medium">Your Question:</span>
          </div>
          <div className={`
            text-slate-200 leading-relaxed
            ${variant === 'compact' ? 'text-sm line-clamp-2' : 'text-base'}
          `}>
            {variant === 'compact' && !isExpanded
              ? formatQuestionPreview(question.question, 120)
              : question.question
            }
            {variant === 'compact' && question.question.length > 120 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium ml-2"
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        </div>

        {/* Enhanced Admin Reply Section */}
        {question.adminReply && (
          <div className="mt-6 pt-4 border-t border-slate-600/50">
            <div className="space-y-3">
              {/* Reply Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-r from-green-500/20 to-blue-500/20 flex items-center justify-center border border-green-500/30">
                    <span className="text-green-400 text-sm font-bold">G</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-green-400 font-semibold">Gaurav's Answer</span>
                    {question.answeredAt && (
                      <span className="text-xs text-slate-500">
                        Answered {formatTimestamp(question.answeredAt)}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Answer expand/collapse for long answers */}
                {question.adminReply.length > 200 && variant !== 'detailed' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFullAnswer(!showFullAnswer);
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                  >
                    {showFullAnswer ? 'Show less' : 'Show full answer'}
                  </button>
                )}
              </div>

              {/* Reply Content */}
              <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/30 rounded-xl p-4 border-l-4 border-green-500/50">
                <div className="text-slate-100 leading-relaxed">
                  {variant === 'compact' && !showFullAnswer
                    ? formatQuestionPreview(question.adminReply, 150)
                    : question.adminReply
                  }
                </div>
              </div>

              {/* Answer Actions */}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>💡 Found this helpful?</span>
                <button className="text-green-400 hover:text-green-300">👍 Yes</button>
                <button className="text-blue-400 hover:text-blue-300">💬 Follow up</button>
              </div>
            </div>
          </div>
        )}

        {/* Unanswered State */}
        {!question.adminReply && question.status === 'unanswered' && (
          <div className="mt-4 pt-4 border-t border-slate-700/30">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span>Your question is in the queue. I'll answer it soon!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function EnterpriseQuestionsList({
  statusFilter = 'all',
  enableRealTime = true,
  maxQuestions,
  showEmptyState = true,
  emptyMessage,
  variant = 'default',
  className = "",
  onQuestionsLoad,
  onQuestionClick,
  enterpriseMode = true
}: EnterpriseQuestionsListProps) {
  const [questions, setQuestions] = useState<DirectQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  const maxRetries = 3;
  const retryTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const listenerRef = useRef<any>(null);

  // Enhanced question filtering with better sorting
  const filteredQuestions = useMemo(() => {
    let filtered = statusFilter === 'all' 
      ? questions 
      : questions.filter(q => q.status === statusFilter);
      
    if (maxQuestions) {
      filtered = filtered.slice(0, maxQuestions);
    }
    
    // Enhanced sorting: prioritize unread answers, then by date
    return filtered.sort((a, b) => {
      // Unread answers first
      if (a.unreadForVisitor && !b.unreadForVisitor) return -1;
      if (!a.unreadForVisitor && b.unreadForVisitor) return 1;
      
      // Then by answered status (answered questions with replies first)
      if (a.adminReply && !b.adminReply) return -1;
      if (!a.adminReply && b.adminReply) return 1;
      
      // Finally by creation date (newest first)
      const aTime = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate().getTime() : 0;
      const bTime = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate().getTime() : 0;
      return bTime - aTime;
    });
  }, [questions, statusFilter, maxQuestions]);

  // Enhanced question loading with better error handling
  const loadQuestions = useCallback(async (isRetry = false) => {
    try {
      setLoading(true);
      if (!isRetry) {
        setError(null);
        setRetryCount(0);
      }
      
      console.log('🔄 [Enterprise] Loading questions...', { 
        isRetry, 
        retryCount,
        timestamp: new Date().toISOString()
      });
      
      const questionsData = await getCurrentVisitorQuestions();
      
      // Enhanced validation for production reliability
      const validQuestions = questionsData.filter((question: any) => {
        const isValid = question &&
                       question.id &&
                       typeof question.question === 'string' &&
                       question.question.trim().length > 0 &&
                       question.status &&
                       question.visitorUuid &&
                       question.createdAt &&
                       !question.isDeleted &&
                       (!question.deletedAt); // Extra check for deletion
        
        if (!isValid) {
          console.warn('❌ [Enterprise] Filtered out invalid question:', {
            id: question?.id,
            hasQuestion: !!question?.question,
            hasStatus: !!question?.status,
            hasUuid: !!question?.visitorUuid,
            isDeleted: !!question?.isDeleted
          });
        }
        
        return isValid;
      });

      console.log(`✅ [Enterprise] Loaded ${validQuestions.length} valid questions`);
      
      setQuestions(validQuestions);
      setLastUpdate(new Date());
      onQuestionsLoad?.(validQuestions);
      setError(null);
      setRetryCount(0);
      
    } catch (err) {
      console.error('❌ [Enterprise] Failed to load questions:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      const currentRetry = isRetry ? retryCount : 0;
      
      // Enhanced error categorization
      const isNetworkError = errorMessage.includes('network') ||
                            errorMessage.includes('timeout') ||
                            errorMessage.includes('fetch') ||
                            errorMessage.includes('Failed to fetch');
                            
      const isFirebaseError = errorMessage.includes('firebase') ||
                             errorMessage.includes('firestore') ||
                             errorMessage.includes('permission-denied');
      
      if ((isNetworkError || isFirebaseError) && currentRetry < maxRetries) {
        const newRetryCount = currentRetry + 1;
        setRetryCount(newRetryCount);
        console.log(`🔄 [Enterprise] Retrying load (${newRetryCount}/${maxRetries})...`);
        
        const delay = Math.min(1000 * Math.pow(2, newRetryCount - 1), 10000); // Max 10s delay
        retryTimeoutRef.current = setTimeout(() => {
          loadQuestions(true);
        }, delay);
      } else {
        setError(currentRetry >= maxRetries ?
          'Unable to load questions after multiple attempts. Please check your connection.' :
          'Failed to load questions. They may have been removed or access denied.'
        );
        setQuestions([]);
        onQuestionsLoad?.([]);
      }
    } finally {
      setLoading(false);
    }
  }, [onQuestionsLoad, retryCount, maxRetries]);

  // Enhanced real-time listener with production reliability
  useEffect(() => {
    if (!enableRealTime) {
      loadQuestions();
      return;
    }

    try {
      const listenerManager = getQuestionListenerManager();
      
      listenerRef.current = listenerManager.setupCurrentVisitorListener(
        (updatedQuestions) => {
          console.log('🔄 [Enterprise] Real-time update received:', {
            count: updatedQuestions.length,
            timestamp: new Date().toISOString()
          });
          
          // Enhanced validation for real-time updates
          const validQuestions = updatedQuestions.filter((question: any) => {
            const isValid = question &&
                           question.id &&
                           typeof question.question === 'string' &&
                           question.question.trim().length > 0 &&
                           question.status &&
                           question.visitorUuid &&
                           question.createdAt &&
                           !question.isDeleted &&
                           !question.deletedAt;
                           
            return isValid;
          });

          setQuestions(validQuestions);
          setLastUpdate(new Date());
          onQuestionsLoad?.(validQuestions);
          setLoading(false);
          setError(null);
          setRetryCount(0);
        },
        {
          showToastOnUpdate: enterpriseMode,
          onlyWhenVisible: true
        }
      );

    } catch (error) {
      console.error('❌ [Enterprise] Failed to setup real-time listener:', error);
      // Fallback to manual loading if real-time fails
      loadQuestions();
    }

    return () => {
      if (listenerRef.current) {
        listenerRef.current.unsubscribe();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [enableRealTime, loadQuestions, onQuestionsLoad, enterpriseMode]);

  // Enhanced unread marking with debouncing
  useEffect(() => {
    const unreadQuestions = filteredQuestions.filter(q => q.unreadForVisitor);
    
    if (unreadQuestions.length > 0) {
      const markAsReadTimer = setTimeout(async () => {
        try {
          const questionIds = unreadQuestions.map(q => q.id);
          await markCurrentVisitorQuestionsAsRead(questionIds);
          console.log(`✅ [Enterprise] Marked ${questionIds.length} questions as read`);
        } catch (error) {
          console.error('❌ [Enterprise] Failed to mark questions as read:', error);
        }
      }, 3000); // 3 second delay to ensure user has seen them

      return () => clearTimeout(markAsReadTimer);
    }
  }, [filteredQuestions]);

  // Cleanup
  useEffect(() => {
    return () => {
      cleanupAskDirectlyUtils();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Enhanced loading state
  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center gap-3 text-slate-400">
            <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            <span className="text-sm font-medium">Loading your questions...</span>
          </div>
        </div>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-slate-800/30 rounded-xl border border-slate-700/30" />
          </div>
        ))}
      </div>
    );
  }

  // Enhanced error state
  if (error) {
    return (
      <div className={`${className}`}>
        <div className="flex flex-col gap-4 px-6 py-8 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-start gap-3">
            <span className="text-red-400 text-xl">⚠️</span>
            <div className="space-y-2 flex-1">
              <h3 className="text-red-300 font-semibold">Unable to Load Questions</h3>
              <p className="text-red-400 text-sm leading-relaxed">{error}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 pt-2">
            {retryCount < maxRetries ? (
              <button
                onClick={() => loadQuestions(true)}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-sm rounded-lg transition-colors duration-200 font-medium"
              >
                Try Again ({maxRetries - retryCount} attempts left)
              </button>
            ) : (
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-slate-600/20 hover:bg-slate-600/30 border border-slate-600/40 text-slate-300 text-sm rounded-lg transition-colors duration-200 font-medium"
              >
                Refresh Page
              </button>
            )}
            <span className="text-xs text-slate-500">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced empty state
  if (filteredQuestions.length === 0) {
    if (!showEmptyState) return null;

    const getEmptyStateConfig = () => {
      switch (statusFilter) {
        case 'unanswered':
          return {
            message: "No pending questions",
            icon: "⏳",
            subtitle: "All your questions have been answered!"
          };
        case 'answered':
          return {
            message: "No answered questions yet",
            icon: "💬",
            subtitle: "Ask me something to get started!"
          };
        case 'archived':
          return {
            message: "No archived questions",
            icon: "📁",
            subtitle: "Archived questions will appear here"
          };
        default:
          return {
            message: emptyMessage || "No questions yet",
            icon: "💭",
            subtitle: "Ask me anything about my work, projects, or experience!"
          };
      }
    };

    const emptyConfig = getEmptyStateConfig();

    return (
      <div className={className}>
        <EnterpriseEmptyState 
          message={emptyConfig.message}
          icon={emptyConfig.icon}
          variant={variant}
        />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Questions List */}
      {filteredQuestions.map((question) => (
        <EnterpriseQuestionCard
          key={question.id}
          question={question}
          variant={variant}
          onClick={onQuestionClick}
          enterpriseMode={enterpriseMode}
        />
      ))}
      
      {/* Load More Section */}
      {maxQuestions && questions.length > maxQuestions && (
        <div className="text-center pt-6">
          <div className="inline-flex items-center gap-2 text-sm text-slate-400">
            <span>Showing {maxQuestions} of {questions.length} questions</span>
            <button className="text-blue-400 hover:text-blue-300 underline font-medium">
              Show all questions
            </button>
          </div>
        </div>
      )}

      {/* Status Footer */}
      {enterpriseMode && filteredQuestions.length > 0 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-700/30 text-xs text-slate-500">
          <span>
            {filteredQuestions.length} question{filteredQuestions.length !== 1 ? 's' : ''} loaded
          </span>
          <span>
            Updated {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  );
}

// Export enhanced variants
export function EnterpriseCompactQuestionsList(props: Omit<EnterpriseQuestionsListProps, 'variant'>) {
  return <EnterpriseQuestionsList {...props} variant="compact" enterpriseMode={true} />;
}

export function EnterpriseDetailedQuestionsList(props: Omit<EnterpriseQuestionsListProps, 'variant'>) {
  return <EnterpriseQuestionsList {...props} variant="detailed" enterpriseMode={true} />;
}