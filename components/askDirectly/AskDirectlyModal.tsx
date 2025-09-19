"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ModalQuestionForm } from './QuestionForm';
import QuestionsList from './QuestionsList';
import { getCurrentVisitorStats } from '@/lib/askDirectly';
import type { DirectQuestion, VisitorQuestionStats } from '@/lib/types';

interface AskDirectlyModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Initial view ('form' | 'questions') */
  initialView?: 'form' | 'questions';
  /** Whether to show view toggle */
  showViewToggle?: boolean;
  /** Custom title */
  title?: string;
  /** Custom className for modal */
  className?: string;
}

type ViewType = 'form' | 'questions';

const ModalOverlay = ({ 
  children, 
  onClose, 
  className = "" 
}: { 
  children: React.ReactNode; 
  onClose: () => void; 
  className?: string;
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className={`
        fixed inset-0 z-50 flex items-center justify-center
        bg-black/60 backdrop-blur-sm
        animate-in fade-in duration-200
        ${className}
      `}
      onClick={handleOverlayClick}
    >
      {children}
    </div>
  );
};

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
          px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200
          ${currentView === 'form'
            ? 'bg-blue-500 text-white shadow-sm'
            : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
          }
        `}
      >
        ✏️ Ask Question
      </button>
      <button
        onClick={() => onViewChange('questions')}
        className={`
          px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200
          flex items-center gap-2
          ${currentView === 'questions'
            ? 'bg-blue-500 text-white shadow-sm'
            : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
          }
        `}
      >
        💬 My Questions
        {stats && stats.totalQuestions > 0 && (
          <span className={`
            px-1.5 py-0.5 text-xs rounded-full font-bold
            ${currentView === 'questions'
              ? 'bg-white/20 text-white'
              : 'bg-slate-600 text-slate-300'
            }
          `}>
            {stats.totalQuestions}
          </span>
        )}
        {stats && stats.unread > 0 && (
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        )}
      </button>
    </div>
  );
};

const ModalHeader = ({ 
  title, 
  currentView, 
  onViewChange, 
  showViewToggle, 
  onClose,
  stats 
}: {
  title: string;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  showViewToggle: boolean;
  onClose: () => void;
  stats: VisitorQuestionStats | null;
}) => {
  return (
    <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold text-white">
          {title}
        </h2>
        
        {showViewToggle && (
          <ViewToggle
            currentView={currentView}
            onViewChange={onViewChange}
            stats={stats}
          />
        )}
      </div>

      <button
        onClick={onClose}
        className="
          p-2 rounded-lg text-slate-400 hover:text-slate-300 
          hover:bg-slate-700/50 transition-colors duration-200
        "
        aria-label="Close modal"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

const ModalContent = ({ 
  currentView, 
  onViewChange, 
  onClose 
}: {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onClose: () => void;
}) => {
  const handleQuestionSuccess = useCallback((questionId: string) => {
    console.log('Question submitted:', questionId);
    // Switch to questions view to show the submitted question
    onViewChange('questions');
  }, [onViewChange]);

  const handleQuestionClick = useCallback((question: DirectQuestion) => {
    // Could expand to show question details in a different view
    console.log('Question clicked:', question.id);
  }, []);

  return (
    <div className="p-6 max-h-96 overflow-y-auto custom-scrollbar">
      <div className={`
        transition-all duration-300 ease-in-out
        ${currentView === 'form' ? 'opacity-100' : 'opacity-0 pointer-events-none absolute'}
      `}>
        {currentView === 'form' && (
          <ModalQuestionForm
            onSuccess={handleQuestionSuccess}
            onCancel={() => onClose()}
            placeholder="Ask me anything about my work, projects, or experience..."
          />
        )}
      </div>

      <div className={`
        transition-all duration-300 ease-in-out
        ${currentView === 'questions' ? 'opacity-100' : 'opacity-0 pointer-events-none absolute'}
      `}>
        {currentView === 'questions' && (
          <QuestionsList
            enableRealTime={true}
            showEmptyState={true}
            variant="default"
            onQuestionClick={handleQuestionClick}
            emptyMessage="No questions yet. Use the form to ask your first question!"
          />
        )}
      </div>
    </div>
  );
};

export default function AskDirectlyModal({
  isOpen,
  onClose,
  initialView = 'form',
  showViewToggle = true,
  title = "Ask Me Directly",
  className = ""
}: AskDirectlyModalProps) {
  const [currentView, setCurrentView] = useState<ViewType>(initialView);
  const [stats, setStats] = useState<VisitorQuestionStats | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Load visitor stats
  useEffect(() => {
    if (isOpen) {
      getCurrentVisitorStats().then(setStats);
    }
  }, [isOpen]);

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      
      // Switch views with Tab when toggle is visible
      if (showViewToggle && e.key === 'Tab' && e.ctrlKey) {
        e.preventDefault();
        setCurrentView(prev => prev === 'form' ? 'questions' : 'form');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, showViewToggle]);

  // Focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <ModalOverlay onClose={onClose} className={className}>
      <div
        ref={modalRef}
        className="
          relative w-full max-w-2xl mx-4 bg-slate-900 rounded-2xl shadow-2xl
          border border-slate-700/50 backdrop-blur-xl
          animate-in slide-in-from-bottom-4 duration-300
          focus:outline-none
        "
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <ModalHeader
          title={title}
          currentView={currentView}
          onViewChange={setCurrentView}
          showViewToggle={showViewToggle}
          onClose={onClose}
          stats={stats}
        />

        <ModalContent
          currentView={currentView}
          onViewChange={setCurrentView}
          onClose={onClose}
        />

        {/* Status Bar */}
        <div className="px-6 py-3 border-t border-slate-700/50 bg-slate-800/50 rounded-b-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-4">
              {stats && (
                <>
                  <span>Total: {stats.totalQuestions}</span>
                  <span>Answered: {stats.answered}</span>
                  {stats.unread > 0 && (
                    <span className="text-green-400">
                      🆕 {stats.unread} new answer{stats.unread > 1 ? 's' : ''}
                    </span>
                  )}
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <span>Press ESC to close</span>
              {showViewToggle && (
                <span>• Ctrl+Tab to switch views</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}

// Export variants for different use cases
export function SimpleAskModal({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
}) {
  return (
    <AskDirectlyModal
      isOpen={isOpen}
      onClose={onClose}
      initialView="form"
      showViewToggle={false}
      title="Quick Question"
    />
  );
}

export function QuestionsOnlyModal({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
}) {
  return (
    <AskDirectlyModal
      isOpen={isOpen}
      onClose={onClose}
      initialView="questions"
      showViewToggle={false}
      title="My Questions"
    />
  );
}