"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { ModalQuestionForm } from './QuestionForm';
import QuestionsList from './QuestionsList';
import { getCurrentVisitorStats } from '@/lib/askDirectly';
import type { DirectQuestion, VisitorQuestionStats } from '@/lib/types';

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

export default function AskDirectlyEmbedded({
  initialView = 'form',
  showViewToggle = true,
  className = ""
}: AskDirectlyEmbeddedProps) {
  const [currentView, setCurrentView] = useState<ViewType>(initialView);
  const [stats, setStats] = useState<VisitorQuestionStats | null>(null);

  // Load visitor stats when component mounts or view changes
  React.useEffect(() => {
    getCurrentVisitorStats().then(setStats);
  }, [currentView]);

  const handleQuestionSuccess = useCallback((questionId: string) => {
    console.log('Question submitted:', questionId);
    // Switch to questions view to show the submitted question
    setCurrentView('questions');
    // Refresh stats
    getCurrentVisitorStats().then(setStats);
  }, []);

  const handleQuestionClick = useCallback((question: DirectQuestion) => {
    console.log('Question clicked:', question.id);
  }, []);

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* View Toggle - Compact */}
      {showViewToggle && (
        <div className="flex-shrink-0 mb-3">
          <ViewToggle
            currentView={currentView}
            onViewChange={setCurrentView}
            stats={stats}
          />
        </div>
      )}

      {/* Content Area - Takes remaining space */}
      <div className="flex-1 min-h-0">
        {/* Form View */}
        {currentView === 'form' && (
          <div className="h-full p-3">
            <ModalQuestionForm
              onSuccess={handleQuestionSuccess}
              onCancel={undefined} // No cancel in embedded mode
              placeholder="Ask Gaurav anything about his work, projects, or experience..."
            />
          </div>
        )}

        {/* Questions View */}
        {currentView === 'questions' && (
          <div className="h-full overflow-auto custom-scrollbar p-3">
            <QuestionsList
              enableRealTime={true}
              showEmptyState={true}
              variant="detailed"
              onQuestionClick={handleQuestionClick}
              emptyMessage="No questions yet. Use the form to ask your first question!"
              className="space-y-4"
            />
          </div>
        )}
      </div>

      {/* Status Bar - Compact */}
      <div className="flex-shrink-0 mt-3 px-3 py-2 border-t border-white/[0.1] bg-black-100/20">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2 text-xs">
            {stats && (
              <>
                <span className="hidden sm:inline">Total: {stats.totalQuestions}</span>
                <span className="hidden sm:inline">•</span>
                <span>Answered: {stats.answered}</span>
                {stats.unread > 0 && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span className="text-green-400">
                      🆕 {stats.unread} new
                    </span>
                  </>
                )}
              </>
            )}
          </div>
          
          <div className="text-xs text-slate-500">
            <span className="hidden sm:inline">Direct communication</span>
            <span className="sm:hidden">Direct</span>
          </div>
        </div>
      </div>
    </div>
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