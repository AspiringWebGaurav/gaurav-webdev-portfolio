"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ModalQuestionForm } from './QuestionForm';
import QuestionsList from './QuestionsList';
import { getCurrentVisitorStats } from '@/lib/askDirectly';
import type { DirectQuestion, VisitorQuestionStats } from '@/lib/types';
import DirectQuestionErrorBoundary, { useErrorReporting } from '@/components/ai-assistant/DirectQuestionErrorBoundary';
import { smartLogger } from '@/utils/smartLogger';

interface AskDirectlyEmbeddedProps {
  /** Initial view ('form' | 'questions') */
  initialView?: 'form' | 'questions';
  /** Whether to show view toggle */
  showViewToggle?: boolean;
  /** Custom className for container */
  className?: string;
}

type ViewType = 'form' | 'questions';

const ViewToggle = ({ 
  currentView, 
  onViewChange, 
  stats 
}: { 
  currentView: ViewType; 
  onViewChange: (view: ViewType) => void;
  stats: VisitorQuestionStats | null;
}) => {
  return (
    <div className="flex items-center gap-1 p-1 bg-slate-800/50 rounded-lg">
      <button
        onClick={() => onViewChange('form')}
        className={`
          flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200
          ${currentView === 'form'
            ? 'bg-green-500 text-white shadow-sm'
            : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
          }
        `}
      >
        <span className="sm:hidden">✏️ Ask</span>
        <span className="hidden sm:inline">✏️ Ask Question</span>
      </button>
      <button
        onClick={() => onViewChange('questions')}
        className={`
          flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200
          flex items-center justify-center gap-1 sm:gap-2
          ${currentView === 'questions'
            ? 'bg-green-500 text-white shadow-sm'
            : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
          }
        `}
      >
        <span className="sm:hidden">💬 My</span>
        <span className="hidden sm:inline">💬 My Questions</span>
        {stats && stats.totalQuestions > 0 && (
          <span className={`
            px-1 sm:px-1.5 py-0.5 text-xs rounded-full font-bold
            ${currentView === 'questions'
              ? 'bg-white/20 text-white'
              : 'bg-slate-600 text-slate-300'
            }
          `}>
            {stats.totalQuestions}
          </span>
        )}
        {stats && stats.unread > 0 && (
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse" />
        )}
      </button>
    </div>
  );
};

function AskDirectlyEmbeddedCore({
  initialView = 'form',
  showViewToggle = true,
  className = ""
}: AskDirectlyEmbeddedProps) {
  const [currentView, setCurrentView] = useState<ViewType>(initialView);
  const [stats, setStats] = useState<VisitorQuestionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { reportError } = useErrorReporting();
  
  // Ref to track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Instant initialization - load interface immediately, fetch stats later
  useEffect(() => {
    // Show interface immediately with fallback stats
    setLoading(false);
    setStats({
      totalQuestions: 0,
      unanswered: 0,
      answered: 0,
      archived: 0,
      unread: 0,
      lastQuestionAt: null
    });

    // Load real stats in background (completely non-blocking)
    const loadBackgroundStats = async () => {
      try {
        const statsPromise = getCurrentVisitorStats();
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Background stats timeout')), 3000);
        });
        
        const statsData = await Promise.race([statsPromise, timeoutPromise]);
        
        // Only update if component is still mounted and data is valid
        if (isMountedRef.current && statsData) {
          setStats(statsData);
          smartLogger.browserOnly.info('✅ Background stats loaded', { stats: statsData });
        }
      } catch (error) {
        // Silent fail - UI already works with fallback stats
        console.warn('Background stats loading failed (non-critical):', error);
      }
    };

    // Delay background loading slightly to prioritize UI render
    const backgroundTimer = setTimeout(loadBackgroundStats, 100);
    
    return () => {
      clearTimeout(backgroundTimer);
    };
  }, []);
  
  // Optimized stats refresh when switching to questions view
  useEffect(() => {
    if (currentView === 'questions') {
      // Non-blocking refresh with timeout
      const refreshStats = async () => {
        try {
          const statsPromise = getCurrentVisitorStats();
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Refresh timeout')), 2000);
          });
          
          const statsData = await Promise.race([statsPromise, timeoutPromise]);
          
          if (isMountedRef.current && statsData) {
            setStats(statsData);
          }
        } catch (error) {
          console.warn('Stats refresh failed (non-critical):', error);
        }
      };
      
      // Small delay to avoid blocking UI switch
      const refreshTimer = setTimeout(refreshStats, 50);
      
      return () => {
        clearTimeout(refreshTimer);
      };
    }
  }, [currentView]);

  const handleQuestionSuccess = useCallback((questionId: string) => {
    try {
      smartLogger.browserOnly.info('✅ Question submitted successfully', { questionId });
      
      if (isMountedRef.current) {
        // Switch to questions view immediately
        setCurrentView('questions');
        
        // Optimistically update stats (will be corrected by background refresh)
        setStats(prev => prev ? {
          ...prev,
          totalQuestions: prev.totalQuestions + 1,
          unanswered: prev.unanswered + 1
        } : {
          totalQuestions: 1,
          unanswered: 1,
          answered: 0,
          archived: 0,
          unread: 0,
          lastQuestionAt: null // Use null for now, real data will come from background refresh
        });
        
        // Background stats refresh (non-blocking)
        setTimeout(async () => {
          try {
            const statsData = await getCurrentVisitorStats();
            if (isMountedRef.current && statsData) {
              setStats(statsData);
            }
          } catch (error) {
            console.warn('Background refresh after success failed (non-critical):', error);
          }
        }, 200);
      }
    } catch (err) {
      smartLogger.error('❌ Error in handleQuestionSuccess', err);
      reportError(err instanceof Error ? err : new Error('Question success handler failed'), 'handleQuestionSuccess');
    }
  }, [reportError]);

  const handleQuestionClick = useCallback((question: DirectQuestion) => {
    try {
      smartLogger.browserOnly.debug('Question clicked', { questionId: question.id });
      // Could add additional question click handling here
    } catch (err) {
      smartLogger.error('❌ Error in handleQuestionClick', err);
      reportError(err instanceof Error ? err : new Error('Question click handler failed'), 'handleQuestionClick');
    }
  }, [reportError]);

  // Show interface immediately - no blocking loading states
  // Loading is now handled in background with fallback data

  // Error state (non-critical, still show interface)
  const hasNonCriticalError = error && !error.includes('critical');

  return (
    <div className={`h-full flex flex-col overflow-hidden ${className}`}>
      {/* Non-critical error banner */}
      {hasNonCriticalError && (
        <div className="flex-shrink-0 mb-2 px-3 pt-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
            <span className="text-yellow-400 text-xs">⚠️</span>
            <span className="text-yellow-400 text-xs">
              Some features may be limited. Please refresh if issues persist.
            </span>
          </div>
        </div>
      )}

      {/* View Toggle - Better positioned */}
      {showViewToggle && (
        <div className="flex-shrink-0 px-3 pb-3 pt-3">
          <ViewToggle
            currentView={currentView}
            onViewChange={setCurrentView}
            stats={stats}
          />
        </div>
      )}

      {/* Content Area - Properly constrained with no overlaps */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {/* Form View - Fixed height management */}
        {currentView === 'form' && (
          <div className="h-full flex flex-col px-3 pb-3">
            <ModalQuestionForm
              onSuccess={handleQuestionSuccess}
              onCancel={undefined} // No cancel in embedded mode
              placeholder="Ask Gaurav anything about his work, projects, or experience..."
              className="flex-1 min-h-0"
            />
          </div>
        )}

        {/* Questions View - Fixed scroll container */}
        {currentView === 'questions' && (
          <div className="h-full flex flex-col">
            <div className="flex-1 min-h-0 overflow-auto custom-scrollbar px-3 pb-3">
              <QuestionsList
                enableRealTime={true}
                showEmptyState={true}
                variant="detailed"
                onQuestionClick={handleQuestionClick}
                emptyMessage="No questions yet. Use the form to ask your first question!"
                className="space-y-4"
              />
            </div>
          </div>
        )}
      </div>

      {/* Status Bar - Better mobile handling and no layout shift */}
      <div className="flex-shrink-0 border-t border-white/[0.1] bg-black-100/20 px-3 py-2">
        <div className="flex items-center justify-between text-xs text-slate-400 min-h-[20px]">
          <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1 overflow-hidden">
            {stats && (
              <div className="flex items-center gap-1 sm:gap-2 truncate">
                <span className="hidden sm:inline whitespace-nowrap">Total: {stats.totalQuestions}</span>
                <span className="hidden sm:inline">•</span>
                <span className="whitespace-nowrap">Answered: {stats.answered}</span>
                {stats.unread > 0 && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span className="text-green-400 whitespace-nowrap">
                      🆕 {stats.unread} new
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
          
          <div className="text-xs text-slate-500 ml-2 flex-shrink-0">
            <span className="hidden sm:inline">Direct communication</span>
            <span className="sm:hidden">Direct</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main exported component wrapped with error boundary
export default function AskDirectlyEmbedded(props: AskDirectlyEmbeddedProps) {
  return (
    <DirectQuestionErrorBoundary>
      <AskDirectlyEmbeddedCore {...props} />
    </DirectQuestionErrorBoundary>
  );
}

// Export additional variants
export function SimpleAskDirectlyEmbedded({ 
  className = "" 
}: { 
  className?: string;
}) {
  return (
    <AskDirectlyEmbedded
      initialView="form"
      showViewToggle={false}
      className={className}
    />
  );
}

export function QuestionsOnlyEmbedded({ 
  className = "" 
}: { 
  className?: string; 
}) {
  return (
    <AskDirectlyEmbedded
      initialView="questions"
      showViewToggle={false}
      className={className}
    />
  );
}